// Fixed public upstreams keep browser visits independent of direct GitHub access.
const ROOT = 'https://raw.githubusercontent.com/iconicoin-netizen/warspotting-atlas/main/dist/';
const LIVE_PATHS = new Map([
  ['/live-data.json', 'data.json'],
  ['/live-overlays/uacontrol-frontline.geojson', 'overlays/uacontrol-frontline.geojson'],
]);
export default {
  async fetch(request, env) {
    const sourcePath = LIVE_PATHS.get(new URL(request.url).pathname);
    if (!sourcePath) return env.ASSETS.fetch(request);
    if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    try {
      const upstream = await fetch(ROOT + sourcePath, {
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
