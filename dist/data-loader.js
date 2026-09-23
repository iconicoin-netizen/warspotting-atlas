'use strict';
// Render validated local data immediately; refresh the next-visit cache in background.
window.loadAtlasData = async function () {
  const url = 'https://raw.githubusercontent.com/iconicoin-netizen/warspotting-atlas/main/dist/data.json';
  const bundledURL = new URL('data.json', location.href).href;
  const valid = rows => Array.isArray(rows) && rows.length > 0 &&
    new Set(rows.map(r => r?.id)).size === rows.length &&
    rows.every(r => r && Number.isSafeInteger(r.id) && r.id > 0 &&
      typeof r.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.date) && Number.isFinite(Date.parse(r.date)) &&
      typeof r.type === 'string' && typeof r.model === 'string' && r.lost_by === 'Russia' &&
      ['Destroyed', 'Captured', 'Abandoned', 'Damaged'].includes(r.status));
  let cache;
  try { cache = await caches.open('atlas-live-data-v1'); } catch {}
  async function read(response) {
    if (!response?.ok) throw new Error('Snapshot unavailable');
    const rows = await response.json();
    if (!valid(rows)) throw new Error('Invalid snapshot');
    return rows;
  }
  async function online() {
    const endpoint = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) ? url : '/live-data.json';
    const response = await fetch(endpoint, {cache: 'no-cache', signal: AbortSignal.timeout(8000)});
    const rows = await read(response.clone());
    try { await cache?.put(url, response); } catch {}
    return {records: rows, label: '最新在线数据'};
  }
  function background() {
    window.atlasDataRefresh = navigator.onLine === false ? Promise.resolve(null) :
      new Promise(resolve => setTimeout(resolve, 0)).then(online).catch(error => {
        console.info('Keeping local snapshot:', error.message);
        return null;
      });
  }
  for (const [key, label] of [[url, '上次保存的数据'], [bundledURL, '内置数据快照']]) {
    try { const rows = await read(await cache?.match(key)); background(); return {records: rows, label}; } catch {}
  }
  try {
    const response = await fetch(bundledURL, {signal: AbortSignal.timeout(8000)});
    const rows = await read(response.clone());
    // Keep bundled data available offline without a second service-worker download.
    try { await cache?.put(bundledURL, response); } catch {}
    background();
    return {records: rows, label: '内置数据快照'};
  } catch { return online(); }
};
