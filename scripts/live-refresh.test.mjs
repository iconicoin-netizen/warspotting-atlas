import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const app=await readFile(new URL('../dist/app.js',import.meta.url),'utf8');
const helper=app.slice(app.indexOf("let snapshotSignature="),app.indexOf('function startDataRefresh'));
function harness(){
 const nodes=new Map();
 const sandbox={data:[],minDate:'',maxDate:'',dotMarkers:new Map(),dotLayer:{clearLayers(){}},dotRenderer:{},colors:{},names:{Tanks:'Tanks'},statuses:{Destroyed:'Destroyed'},fmt:String,popup:()=>{},L:{circleMarker:()=>({bindPopup(){return this}})},buildPickers(){},setupDateSlider(){},apply(){},$:id=>{if(!nodes.has(id))nodes.set(id,{value:'',textContent:''});return nodes.get(id)}};
 vm.createContext(sandbox);vm.runInContext(helper,sandbox);return {sandbox,nodes};
}
const row=(id,date,geo='48,35')=>({id,date,geo,type:'Tanks',model:'T-72',status:'Destroyed',lost_by:'Russia'});
const snapshot=records=>({records,label:'最新在线数据',signature:JSON.stringify(records)});
test('old bundled cutoff advances in the current view and corrected markers replace old ones',()=>{
 const {sandbox:s,nodes:n}=harness();
 s.installSnapshot(snapshot([row(1,'2026-09-21')]));
 s.installSnapshot(snapshot([row(1,'2026-09-21',null),row(2,'2026-10-04')]),true);
 assert.equal(n.get('to').value,'2026-10-04');assert.equal(n.get('source-record-count').textContent,'2');
 assert.equal(s.dotMarkers.size,1);assert.ok(s.dotMarkers.has(2));
});
test('custom dates survive a refresh and unchanged snapshots do not rerender',()=>{
 const {sandbox:s,nodes:n}=harness();
 s.installSnapshot(snapshot([row(1,'2022-02-21'),row(2,'2026-09-21')]));
 n.get('from').value='2024-01-01';n.get('to').value='2024-12-31';
 const fresh=snapshot([row(1,'2022-02-21'),row(2,'2026-10-04')]);
 s.installSnapshot(fresh,true);assert.equal(n.get('from').value,'2024-01-01');assert.equal(n.get('to').value,'2024-12-31');
 const markers=s.dotMarkers.get(2);s.installSnapshot(fresh,true);assert.equal(s.dotMarkers.get(2),markers);
});

