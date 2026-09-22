'use strict';
// The public repository is updated daily by GitHub Actions.
// Keep an independently validated copy for offline visits.
window.loadAtlasData = async function () {
  const url = 'https://raw.githubusercontent.com/iconicoin-netizen/warspotting-atlas/main/dist/data.json';
  const cacheName = 'atlas-live-data-v1';
  const valid = rows => Array.isArray(rows) && rows.length > 0 &&
    new Set(rows.map(r => r?.id)).size === rows.length &&
    rows.every(r => r && Number.isSafeInteger(r.id) && r.id > 0 &&
      typeof r.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.date) && Number.isFinite(Date.parse(r.date)) &&
      typeof r.type === 'string' && typeof r.model === 'string' && r.lost_by === 'Russia' &&
      ['Destroyed', 'Captured', 'Abandoned', 'Damaged'].includes(r.status));
  let cache;
  try { cache = await caches.open(cacheName); } catch {}
  try {
    const endpoint = ['localhost', '127.0.0.1'].includes(location.hostname) ? url : '/live-data.json';
    const response = await fetch(endpoint, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('Latest snapshot unavailable');
    const rows = await response.json();
    if (!valid(rows)) throw new Error('Latest snapshot is invalid');
    try { await cache?.put(url, new Response(JSON.stringify(rows), { headers: { 'Content-Type': 'application/json' } })); } catch {}
    return { records: rows, label: '最新在线数据' };
  } catch (error) { console.info('Using an available fallback snapshot:', error.message); }
  try {
    const response = await cache?.match(url);
    const rows = response && await response.json();
    if (valid(rows)) return { records: rows, label: '上次保存的数据' };
  } catch {}
  const response = await fetch('data.json');
  if (!response.ok) throw new Error('Bundled snapshot unavailable');
  const rows = await response.json();
  if (!valid(rows)) throw new Error('Bundled snapshot is invalid');
  return { records: rows, label: '内置数据快照' };
};
