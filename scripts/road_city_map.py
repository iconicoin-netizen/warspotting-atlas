"""Keep exact road, city, label and geography layer payloads; omit landuse/buildings.
Requires the official pmtiles Python package. Input is a verified regional PMTiles.
"""
import sys,gzip,json,hashlib
from pmtiles.reader import Reader,MmapSource,all_tiles
from pmtiles.writer import write
from pmtiles.tile import zxy_to_tileid

def varint(buf,pos):
 value=shift=0
 while True:
  b=buf[pos];pos+=1;value|=(b&127)<<shift
  if b<128:return value,pos
  shift+=7
  if shift>63:raise ValueError('Invalid varint')
def fields(buf):
 pos=0
 while pos<len(buf):
  start=pos;tag,pos=varint(buf,pos);wire=tag&7
  if wire==2:
   length,pos=varint(buf,pos);payload=buf[pos:pos+length];pos+=length
  elif wire==0:_,pos=varint(buf,pos);payload=b''
  elif wire==1:pos+=8;payload=b''
  elif wire==5:pos+=4;payload=b''
  else:raise ValueError('Unknown wire type')
  assert pos<=len(buf)
  yield tag>>3,wire,payload,buf[start:pos]
def layer_name(buf):
 return next(payload.decode() for field,wire,payload,_ in fields(buf) if field==1 and wire==2)
removed={'landuse','buildings'};counts={};count=0;retained_hash=hashlib.sha256()
with open(sys.argv[1],'rb') as f,write(sys.argv[2]) as writer:
 source=MmapSource(f);reader=Reader(source);header=reader.header();metadata=reader.metadata();metadata['vector_layers']=[v for v in metadata['vector_layers'] if v['id'] not in removed];metadata['description']='Road and city offline basemap. Exact source vector layers retained except landuse and buildings, which are omitted. Detailed online overlay available.'
 for (z,x,y),compressed in all_tiles(source):
  raw=gzip.decompress(compressed);kept=[]
  for field,wire,payload,chunk in fields(raw):
   name=layer_name(payload) if field==3 and wire==2 else None
   if name not in removed:
    kept.append(chunk);retained_hash.update(chunk)
    if name:counts[name]=counts.get(name,0)+1
  output=b''.join(kept)
  writer.write_tile(zxy_to_tileid(z,x,y),gzip.compress(output,compresslevel=6,mtime=0));count+=1
 writer.finalize(header,metadata)
print(json.dumps({'tiles':count,'retained_layers':counts,'retained_payload_sha256':retained_hash.hexdigest()}))
