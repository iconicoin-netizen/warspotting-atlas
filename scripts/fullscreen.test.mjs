import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {test} from 'node:test';

test('fullscreen UI hides at 3 seconds, wakes on input, and clears on exit',async()=>{
 const classes=new Set(),listeners={},timers=new Map();let id=0,clock=0;
 const node=()=>({before(){},after(){},setAttribute(){},classList:{add(){},remove(){}}});
 const stage={...node(),append(){},classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)}};
 const button=node(),date=node(),overlay=node();
 const document={fullscreenElement:null,querySelector:s=>s==='.map-stage'?stage:date,getElementById:()=>overlay,createComment:node,addEventListener:(name,fn)=>(listeners[name]??=[]).push(fn)};
 const context={document,$:()=>button,map:{invalidateSize(){}},requestAnimationFrame:fn=>fn(),setTimeout:(fn,ms)=>{timers.set(++id,{fn,at:clock+ms});return id},clearTimeout:id=>timers.delete(id)};
 const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 vm.runInNewContext(source.slice(source.indexOf('function setupFullscreen()'),source.indexOf('async function init()'))+';setupFullscreen();',context);
 const tick=ms=>{clock+=ms;for(const [key,t] of timers)if(t.at<=clock){timers.delete(key);t.fn()}};
 const emit=name=>listeners[name]?.forEach(fn=>fn({key:'ArrowRight'}));
 tick(4000);assert(!classes.has('ui-idle'));
 await button.onclick();assert(classes.has('is-fullscreen'));
 tick(2999);assert(!classes.has('ui-idle'));tick(1);assert(classes.has('ui-idle'));
 for(const input of ['pointermove','pointerdown','wheel','keydown','focusin']){emit(input);assert(!classes.has('ui-idle'));tick(3000);assert(classes.has('ui-idle'))}
 await button.onclick();assert(!classes.has('is-fullscreen'));assert(!classes.has('ui-idle'));tick(4000);assert(!classes.has('ui-idle'));
 document.fullscreenElement=stage;emit('fullscreenchange');tick(3000);assert(classes.has('ui-idle'));
 document.fullscreenElement=null;emit('fullscreenchange');assert(!classes.has('ui-idle'));
});
