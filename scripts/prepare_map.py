import json,hashlib,pathlib,sys
source=pathlib.Path(sys.argv[1]);out=pathlib.Path('dist/map');out.mkdir(exist_ok=True)
for stale in out.glob("part-*.bin"):stale.unlink()
chunk_size=4*1024*1024;parts=[]
with source.open('rb') as f:
 i=0
 while True:
  b=f.read(chunk_size)
  if not b:break
  (out/f'part-{i:03d}.bin').write_bytes(b);parts.append({'size':len(b),'sha256':hashlib.sha256(b).hexdigest()});i+=1
manifest={'version':'20260921-ukraine-roads-z11','source':'https://build.protomaps.com/20260921.pmtiles','region_source':'https://download.geofabrik.de/europe/ukraine.poly','maxZoom':11,'size':source.stat().st_size,'chunkSize':chunk_size,'sha256':hashlib.file_digest(source.open('rb'),'sha256').hexdigest() if hasattr(hashlib,'file_digest') else hashlib.sha256(source.read_bytes()).hexdigest(),'parts':parts}
(out/'manifest.json').write_text(json.dumps(manifest,separators=(',',':')))
(out/'NOTICE.txt').write_text('Basemap: Protomaps 4.15.2, OpenStreetMap snapshot 2026-09-21. Ukraine region from Geofabrik, zoom 0-11. Roads, settlements, labels and generalized geography, omitting landuse and building layers; additional details loaded online. Data is an ODbL Produced Work. Attribution: OpenStreetMap contributors, Protomaps. https://www.openstreetmap.org/copyright https://docs.protomaps.com/basemaps/downloads\n')
print(json.dumps({'bytes':manifest['size'],'parts':len(parts),'sha256':manifest['sha256']}))
