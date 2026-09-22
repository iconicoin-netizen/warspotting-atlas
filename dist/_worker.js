// A fixed, public upstream keeps browser visits independent of GitHub connectivity.
// Only /live-data.json invokes this function; all other assets remain static.
const SOURCE = 'https://raw.githubusercontent.com/iconicoin-netizen/warspotting-atlas/main/dist/data.json';
export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname !== '/live-data.json') return env.ASSETS.fetch(request);
    if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    try {
      const upstream = await fetch(SOURCE, {
        headers: { Accept: 'application/json', 'User-Agent': 'WarSpottingAtlas/1.0' },
        signal: AbortSignal.timeout(30000),
        cf: { cacheEverything: true, cacheTtlByStatus: { '200-299': 300, '400-599': 0 } },
      });
      if (!upstream.ok) return new Response('Latest snapshot unavailable', { status: 502, headers: { 'Cache-Control': 'no-store' } });
      return new Response(request.method === 'HEAD' ? null : upstream.body, {
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=60', 'X-Content-Type-Options': 'nosniff' },
      });
    } catch {
      return new Response('Latest snapshot unavailable', { status: 502, headers: { 'Cache-Control': 'no-store' } });
    }
  },
};
