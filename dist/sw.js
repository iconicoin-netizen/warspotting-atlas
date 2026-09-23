'use strict';
const APP_CACHE='atlas-app-v24-fullscreen-idle',MAP_CACHE='atlas-ukraine-roads-20260921-z11-v1';
const APP_FILES=['./','index.html','style.css','app.js','map-ink.js','overlays.js','i18n.js','data-loader.js','offline-map.js','online-style.json','map/manifest.json','overlays/uacontrol-frontline.geojson','overlays/overlay-meta.json','vendor/equipment-icons.js','vendor/leaflet.js','vendor/leaflet.css','vendor/protomaps-leaflet.js','vendor/pmtiles.js'];
self.addEventListener('install',event=>event.waitUntil(caches.open(APP_CACHE).then(cache=>cache.addAll(APP_FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('atlas-app-')&&key!==APP_CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(url.origin!==location.origin||event.request.method!=='GET'||url.pathname==='/live-data.json'||url.pathname.startsWith('/live-overlays/'))return;
  if(url.pathname.includes('/map/part-')){
    event.respondWith(caches.open(MAP_CACHE).then(async cache=>(await cache.match(event.request))||fetch(event.request)));
    return;
  }
  event.respondWith((async()=>{
    const cache=await caches.open(APP_CACHE);
    const hit=await cache.match(event.request)||(event.request.mode==='navigate'?await cache.match('./'):null);
    // Versioned shell and immutable bundled files require no network round-trip.
    if(hit)return hit;
    try{const response=await fetch(event.request);if(response.ok)await cache.put(event.request,response.clone());return response}
    catch{return new Response('Offline resource unavailable',{status:503})}
  })());
});
