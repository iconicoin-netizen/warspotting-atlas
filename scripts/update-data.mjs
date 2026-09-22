import { readFile, writeFile, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// API reference: https://ukr.warspotting.net/api/docs/
// Related project: https://github.com/lazar-bit/automated-warspotting-scraper
// This implementation uses ID pagination to include backdated additions and corrections.
const API = 'https://ukr.warspotting.net/api/losses/russia/';
const fields = ['id', 'type', 'model', 'status', 'lost_by', 'date', 'nearest_location', 'geo', 'unit', 'tags'];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export function normalize(record) {
  if (!record || !Number.isSafeInteger(record.id) || record.id < 1) throw new Error('Invalid record ID');
  for (const key of ['type', 'model', 'date']) {
    if (typeof record[key] !== 'string' || !record[key].trim()) throw new Error(`Invalid ${key} for ${record.id}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(record.date) || !Number.isFinite(Date.parse(record.date)) || new Date(record.date).toISOString().slice(0, 10) !== record.date) throw new Error(`Invalid date for ${record.id}`);
  if (record.lost_by !== 'Russia' || !['Destroyed', 'Captured', 'Abandoned', 'Damaged'].includes(record.status)) throw new Error(`Unexpected belligerent or status for ${record.id}`);
  for (const key of ['nearest_location', 'geo', 'unit', 'tags']) {
    if (record[key] != null && typeof record[key] !== 'string') throw new Error(`Invalid ${key} for ${record.id}`);
  }
  return Object.fromEntries(fields.map(key => [key, record[key] ?? null]));
}

export function validateSnapshot(records, previous = []) {
  if (!Array.isArray(records) || records.length === 0) throw new Error('Refusing an empty snapshot');
  const normalized = records.map(normalize).sort((a, b) => a.id - b.id);
  if (new Set(normalized.map(r => r.id)).size !== normalized.length) throw new Error('Duplicate record IDs');
  if (previous.length && normalized.length < previous.length * 0.95) throw new Error('Record count fell by more than 5%; manual review required');
  return normalized;
}

export function createClient({ fetchImpl = fetch, pause = sleep, intervalMs = 1500 } = {}) {
  return async function request(url) {
    for (let attempt = 0; attempt < 5; attempt++) {
      await pause(intervalMs + (attempt ? 2000 * 2 ** (attempt - 1) : 0));
      try {
        const response = await fetchImpl(url, {
          headers: { 'User-Agent': 'WarSpottingAtlas/1.0 (+https://github.com/iconicoin-netizen/warspotting-atlas)', Accept: 'application/json' },
          signal: AbortSignal.timeout(30000),
        });
        if (!response.ok) {
          if (response.status !== 429 && response.status < 500) throw Object.assign(new Error(`API returned HTTP ${response.status}`), { fatal: true });
          const header = response.headers.get('retry-after');
          const retryAfter = /^\d+$/.test(header || '') ? Number(header) * 1000 : Date.parse(header) - Date.now();
          if (Number.isFinite(retryAfter) && retryAfter > 0) {
            if (retryAfter > 300000) throw Object.assign(new Error('Server requested a long pause; aborting this run'), { fatal: true });
            await pause(retryAfter);
          }
          throw new Error(`API returned HTTP ${response.status}`);
        }
        const body = await response.json();
        if (!body || !Array.isArray(body.losses)) throw Object.assign(new Error('Unexpected API response schema'), { fatal: true });
        return body.losses.map(normalize);
      } catch (error) {
        if (error.fatal || attempt === 4) throw error;
      }
    }
  };
}

export async function scanAll(request, { log = console.log, maxPages = 2000 } = {}) {
  const latest = await request(API);
  if (!latest.length) throw new Error('The latest-record endpoint returned no data');
  const upperId = Math.max(...latest.map(r => r.id));
  const records = [];
  let cursor = 1;
  for (let page = 1; page <= maxPages; page++) {
    const batch = await request(`${API}${cursor}/`);
    if (!batch.length) throw new Error(`Unexpected empty page before record ${upperId}`);
    for (let i = 0; i < batch.length; i++) {
      if (batch[i].id < cursor || (i && batch[i].id <= batch[i - 1].id)) throw new Error('ID pagination did not advance monotonically');
    }
    records.push(...batch.filter(r => r.id <= upperId));
    const last = batch.at(-1).id;
    log(`Page ${page}: ${records.length} records, ID ${last}/${upperId}`);
    if (last >= upperId) {
      const ids = new Set(records.map(r => r.id));
      if (latest.some(r => !ids.has(r.id))) throw new Error('Latest records were missing from the full scan');
      return records;
    }
    cursor = last + 1;
  }
  throw new Error('Pagination limit exceeded');
}

export async function update({ directory = 'dist', request = createClient(), now = new Date() } = {}) {
  const dataPath = resolve(directory, 'data.json');
  const oldText = await readFile(dataPath, 'utf8');
  const previous = validateSnapshot(JSON.parse(oldText));
  const records = validateSnapshot(await scanAll(request), previous);
  const serialized = JSON.stringify(records);
  const previousIds = new Set(previous.map(r => r.id));
  const currentIds = new Set(records.map(r => r.id));
  const metadata = {
    schema_version: 1, source: API, fetched_at: now.toISOString(),
    record_count: records.length,
    located_count: records.filter(r => {
      const values = typeof r.geo === 'string' ? r.geo.split(',').map(Number) : [];
      return values.length === 2 && values.every(Number.isFinite) && Math.abs(values[0]) <= 90 && Math.abs(values[1]) <= 180;
    }).length,
    latest_event_date: records.reduce((value, r) => r.date > value ? r.date : value, ''),
    sha256: createHash('sha256').update(serialized).digest('hex'),
    added_records: records.filter(r => !previousIds.has(r.id)).length,
    removed_records: previous.filter(r => !currentIds.has(r.id)).length,
  };
  // Do not touch either published file until every page and validation has succeeded.
  await writeFile(`${dataPath}.tmp`, serialized);
  const metadataPath = resolve(directory, 'data-meta.json');
  await writeFile(`${metadataPath}.tmp`, JSON.stringify(metadata, null, 2) + '\n');
  await rename(`${dataPath}.tmp`, dataPath);
  await rename(`${metadataPath}.tmp`, metadataPath);
  console.log(JSON.stringify(metadata, null, 2));
  return metadata;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  update().catch(error => { console.error(error.message); process.exitCode = 1; });
}
