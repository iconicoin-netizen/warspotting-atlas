'use strict';
(() => {
  const text=value=>String(value??'');
  const t=value=>window.atlasI18n?.t(value)||value;
  async function loadGeoJSON(url,fallback){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);try{let response;try{response=await fetch(url,{signal:controller.signal,cache:'no-cache'});if(!response.ok)throw new Error(`${response.status} ${response.statusText}`)}catch(error){if(!fallback)throw error;response=await fetch(fallback,{cache:'no-cache'});if(!response.ok)throw error}const payload=await response.json();if(payload?.type!=='FeatureCollection'||!Array.isArray(payload.features))throw new Error('Invalid GeoJSON');return payload}finally{clearTimeout(timer)}}
  function popup(properties,rows){const box=document.createElement('div');box.className='overlay-popup';const title=document.createElement('strong');title.textContent=text(properties.name||properties.unit_name||t('未命名要素'));title.dataset.noTranslate='';box.append(title);for(const [label,value]of rows){if(value===undefined||value===null||value==='')continue;const row=document.createElement('div'),key=document.createElement('b');key.textContent=t(label);const content=document.createElement('span');content.dataset.noTranslate='';content.textContent=text(value);row.append(key,content);box.append(row)}const source=document.createElement('a');source.href=properties.evidence_url||properties.source_url||'#';source.target='_blank';source.rel='noopener';source.textContent=t('查看来源 ↗');box.append(source);return box}
  function contextLayer(collection,pane){return L.geoJSON(collection,{pane,style:feature=>({...feature.properties?.style,pane,className:'atlas-contact-line',weight:Number(feature.properties?.style?.weight)||2.163}),onEachFeature:(feature,layer)=>layer.bindPopup(()=>popup(feature.properties||{},[['原始图层',feature.properties?.source_folder],['说明',feature.properties?.description],['来源','UAControlMap / Project Owl']]))})}
  async function setupAtlasOverlays(map){
    for(const [name,zIndex]of [['uac-frontline',390]]){map.createPane(name).style.zIndex=zIndex;}
    const definitions=[
      {id:'layer-uac-frontline',status:'overlay-frontline-status',file:'uacontrol-frontline.geojson',factory:data=>contextLayer(data,'uac-frontline')},
    ],control=document.getElementById('overlay-control'),state={};
    L.DomEvent.disableClickPropagation(control);L.DomEvent.disableScrollPropagation(control);
    // Calibrate against the existing 5 km view (zoom 11 at 48.5 N).
    const referenceMetersPerPixel=40075016.68557849*Math.cos(48.5*Math.PI/180)/(256*2**11);
    function updateContactWidths(){
      const center=map.latLngToContainerPoint(map.getCenter());
      const metersPerPixel=map.distance(map.containerPointToLatLng(center),map.containerPointToLatLng(center.add([1,0])));
      // Ease the geographic shrinkage to keep 20–30 km views legible.
      const factor=Math.min(1,(referenceMetersPerPixel/metersPerPixel)**0.35);
      state['layer-uac-frontline']?.layer?.eachLayer(line=>line.setStyle({weight:(Number(line.feature.properties?.style?.weight)||2.163)*factor}));
    }
    map.on('zoomend moveend',updateContactWidths);
    await Promise.all(definitions.map(async definition=>{
      const input=document.getElementById(definition.id),status=document.getElementById(definition.status);
      try{
        const local=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
        const data=await loadGeoJSON(local?`overlays/${definition.file}`:`/live-overlays/${definition.file}`,local?null:`overlays/${definition.file}`);
        const layer=definition.factory?.(data);state[definition.id]={layer,data};updateContactWidths();
        status.textContent=data.features.length.toLocaleString(window.atlasI18n?.locale||'en-US');
        status.title=[data.properties.source_updated_at&&`Source: ${data.properties.source_updated_at}`,`Synced: ${data.properties.generated_at}`].filter(Boolean).join(' / ');
        if(layer){if(input.checked)layer.addTo(map);input.onchange=()=>input.checked?layer.addTo(map):map.removeLayer(layer)}
        if(definition.id==='layer-uac-frontline'){
          const date=document.getElementById('overlay-source-date');
          date.textContent=(data.properties.source_updated_at||data.properties.generated_at||'').slice(0,10);
          date.title=data.properties.source_updated_at||data.properties.generated_at||'';
        }
      }catch(error){console.warn(`Overlay unavailable: ${definition.file}`,error);input.disabled=true;input.checked=false;status.textContent=t('不可用')}
    }));
    window.atlasOverlays={state,getState:()=>Object.fromEntries(definitions.map(item=>[item.id,{enabled:!!document.getElementById(item.id).checked,count:state[item.id]?.data.features.length||0}]))};return window.atlasOverlays;
  }
  window.setupAtlasOverlays=setupAtlasOverlays;
  let attempts=0;
  function start(){if(window.atlas?.map){setupAtlasOverlays(window.atlas.map);return}if(attempts++<300)setTimeout(start,100)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
