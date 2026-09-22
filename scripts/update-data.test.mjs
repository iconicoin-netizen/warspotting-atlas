import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { normalize, validateSnapshot, scanAll, createClient, update } from './update-data.mjs';

const record = (id, changes = {}) => ({ id, type: 'Tanks', model: 'T-64BV', status: 'Destroyed', lost_by: 'Russia', date: '2022-03-14', nearest_location: null, geo: null, unit: null, tags: null, ...changes });

test('ID pagination includes backdated entries and replaces historical corrections', async () => {
  const pages = [[record(4)], [record(1, { status: 'Captured' }), record(2)], [record(4, { date: '2022-02-21' })]];
  const urls = [];
  const rows = await scanAll(async url => { urls.push(url); return pages.shift(); }, { log() {} });
  assert.deepEqual(rows.map(r => r.id), [1, 2, 4]);
  assert.equal(rows[0].status, 'Captured');
  assert.equal(rows[2].date, '2022-02-21');
  assert.ok(urls[2].endsWith('/3/'));
});

test('an incomplete page or non-advancing cursor aborts the scan', async () => {
  for (const pages of [[[record(8)], [record(1)], []], [[record(8)], [record(1)], [record(1)]]]) {
    await assert.rejects(scanAll(async () => pages.shift(), { log() {} }));
  }
});

test('invalid dates, duplicates, foreign records, and suspicious drops are rejected', () => {
  assert.throws(() => normalize(record(1, { date: '2026-02-30' })));
  assert.throws(() => normalize(record(1, { lost_by: 'Ukraine' })));
  assert.throws(() => validateSnapshot([record(1), record(1)]));
  assert.throws(() => validateSnapshot([]));
  assert.throws(() => validateSnapshot([record(1)], [record(1), record(2)]));
});

test('rate limiting respects Retry-After before retrying', async () => {
  const pauses = [];
  let attempts = 0;
  const request = createClient({ pause: async ms => pauses.push(ms), fetchImpl: async () => ++attempts === 1
    ? new Response('', { status: 429, headers: { 'Retry-After': '5' } })
    : Response.json({ losses: [record(1)] }) });
  assert.equal((await request('https://example.test/'))[0].id, 1);
  assert.equal(attempts, 2);
  assert.ok(pauses.includes(5000));
});

test('invalid response schema and client errors are not treated as empty pages', async () => {
  for (const response of [Response.json({ message: 'unavailable' }), new Response('', { status: 404 })]) {
    let calls = 0;
    const request = createClient({ pause: async () => {}, fetchImpl: async () => { calls++; return response; } });
    await assert.rejects(request('https://example.test/'));
    assert.equal(calls, 1);
  }
});

test('a failed partial scan leaves the existing snapshot untouched', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'atlas-test-'));
  try {
    const original = JSON.stringify([record(1), record(2)]);
    await writeFile(join(directory, 'data.json'), original);
    await writeFile(join(directory, 'data-meta.json'), '{"original":true}');
    let calls = 0;
    await assert.rejects(update({ directory, request: async () => {
      if (++calls === 1) return [record(2)];
      if (calls === 2) return [record(1)];
      throw new Error('Connection lost');
    } }));
    assert.equal(await readFile(join(directory, 'data.json'), 'utf8'), original);
    assert.equal(await readFile(join(directory, 'data-meta.json'), 'utf8'), '{"original":true}');
  } finally { await rm(directory, { recursive: true }); }
});

test('a complete scan persists revised records and refresh metadata', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'atlas-test-'));
  try {
    await writeFile(join(directory, 'data.json'), JSON.stringify([record(1)]));
    const rows = [record(1, { status: 'Damaged', geo: '49,38' }), record(2)];
    const meta = await update({ directory, request: async () => rows, now: new Date('2026-09-22T01:23:00Z') });
    assert.equal(meta.record_count, 2);
    assert.equal(meta.added_records, 1);
    assert.equal(meta.located_count, 1);
    assert.equal(JSON.parse(await readFile(join(directory, 'data.json'), 'utf8'))[0].status, 'Damaged');
    assert.equal(meta.fetched_at, '2026-09-22T01:23:00.000Z');
  } finally { await rm(directory, { recursive: true }); }
});
