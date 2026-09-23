import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
const loader=await readFile(new URL('../dist/data-loader.js',import.meta.url),'utf8');
const row={id:1,date:'2026-09-21',type:'Tank',model:'Test',lost_by:'Russia',status:'Destroyed'};
const response=rows=>new Response(JSON.stringify(rows));
function context(fetch,entries=new Map()){
 const cache={match:async key=>entries.get(key)?.clone(),put:async(key,value)=>entries.set(key,value.clone())};
 const sandbox={window:{},location:{href:'http://localhost/',hostname:'localhost'},navigator:{onLine:true},caches:{open:async()=>cache},fetch,Response,URL,AbortSignal,setTimeout,console};
 vm.runInNewContext(loader,sandbox);return sandbox;
}
test('bundled records render while the live request is unresolved',async()=>{
 const sandbox=context(async url=>url==='http://localhost/data.json'?response([row]):new Promise(()=>{}));
 const result=await Promise.race([sandbox.window.loadAtlasData(),new Promise((_,reject)=>setTimeout(()=>reject(Error('Blocked by live request')),200))]);
 assert.equal(result.records[0].id,1);
});
test('invalid background data cannot overwrite a validated snapshot',async()=>{
 const key='https://raw.githubusercontent.com/iconicoin-netizen/warspotting-atlas/main/dist/data.json';
 const entries=new Map([[key,response([row])]]),sandbox=context(async()=>response([row,row]),entries);
 assert.equal((await sandbox.window.loadAtlasData()).records.length,1);
 await sandbox.window.atlasDataRefresh;
 assert.equal((await entries.get(key).clone().json()).length,1);
});
test('offline bundled cache requires no fetch',async()=>{
 let requests=0;const sandbox=context(async()=>{requests++;throw Error('Offline')},new Map([['http://localhost/data.json',response([row])]]));sandbox.navigator.onLine=false;
 assert.equal((await sandbox.window.loadAtlasData()).records.length,1);assert.equal(requests,0);
});
const mapCode=(await readFile(new URL('../dist/offline-map.js',import.meta.url),'utf8')).split('window.setupOfflineMap=')[0]+'\nthis.Source=ChunkedMapSource;';
test('cross-chunk reads share pending requests and preserve bytes',async()=>{
 const parts=[new Uint8Array([1,2,3,4]),new Uint8Array([5,6,7,8])];
 const manifest={version:'test',chunkSize:4,parts:await Promise.all(parts.map(async bytes=>({size:4,sha256:Buffer.from(await webcrypto.subtle.digest('SHA-256',bytes)).toString('hex')})))};
 let requests=0;const sandbox={URL,location:{href:'http://localhost/'},crypto:webcrypto,Response,caches:{open:async()=>({match:async()=>null,put:async()=>{}})},fetch:async url=>{requests++;await new Promise(r=>setTimeout(r,5));return new Response(parts[url.includes('001')?1:0])}};
 vm.runInNewContext(mapCode,sandbox);const source=new sandbox.Source(manifest);
 const [a,b]=await Promise.all([source.getBytes(2,4),source.getBytes(0,4)]);
 assert.deepEqual([...new Uint8Array(a.data)],[3,4,5,6]);assert.deepEqual([...new Uint8Array(b.data)],[1,2,3,4]);assert.equal(requests,2);
});
test('corrupt map chunk is rejected and evicted',async()=>{
 let removed=false;const sandbox={URL,location:{href:'http://localhost/'},crypto:webcrypto,Response,caches:{open:async()=>({match:async()=>new Response(new Uint8Array([1,2])),delete:async()=>{removed=true}})}};
 vm.runInNewContext(mapCode,sandbox);const source=new sandbox.Source({chunkSize:2,parts:[{size:2,sha256:'wrong'}]});
 await assert.rejects(source.getBytes(0,2));assert.equal(removed,true);
});
