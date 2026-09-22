'use strict';
// Gaussian density in geographic space; pigment colors mix before compositing.
(function(root){
  const EARTH_CIRCUMFERENCE=2*Math.PI*6371000;
  function settings(scaleMeters){return scaleMeters>=30000?{radiusMeters:6000,strength:1}:scaleMeters>=20000?{radiusMeters:3000,strength:.45}:{radiusMeters:0,strength:0}}
  function radiusPixels(radiusMeters,latitude,worldPixels){return radiusMeters*worldPixels/(EARTH_CIRCUMFERENCE*Math.cos(latitude*Math.PI/180))}
  function erf(x){const sign=x<0?-1:1,a=Math.abs(x),t=1/(1+.3275911*a);return sign*(1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-a*a))}
  // Integrate over each pixel instead of clamping small radii: distant zooms
  // retain their true ground footprint and don't turn into fixed-size circles.
  function kernel(center,sigma,lo,hi){const values=[],k=Math.SQRT2*sigma,factor=sigma*Math.sqrt(Math.PI/2);for(let i=lo;i<=hi;i++)values.push(factor*(erf((i+1-center)/k)-erf((i-center)/k)));return values}
  function rasterize(points,width,height,step=2){
    const w=Math.ceil(width/step),h=Math.ceil(height/step),field=new Float32Array(w*h*4);
    for(const p of points){
      if(!(p.radius>0&&p.weight>0))continue;
      const x=p.x/step,y=p.y/step,sigma=p.radius/(3*step),reach=3*sigma;
      const x0=Math.max(0,Math.floor(x-reach)),x1=Math.min(w-1,Math.floor(x+reach)),y0=Math.max(0,Math.floor(y-reach)),y1=Math.min(h-1,Math.floor(y+reach));
      if(x1<x0||y1<y0)continue;
      const kx=kernel(x,sigma,x0,x1),ky=kernel(y,sigma,y0,y1),pigment=p.rgb.map(c=>-Math.log(Math.max(1,c)/255));
      for(let py=y0;py<=y1;py++)for(let px=x0;px<=x1;px++){
        const amount=p.weight*kx[px-x0]*ky[py-y0],i=(py*w+px)*4;
        field[i]+=amount;for(let c=0;c<3;c++)field[i+1+c]+=amount*pigment[c];
      }
    }
    const pixels=new Uint8ClampedArray(w*h*4);
    for(let i=0;i<field.length;i+=4){const mass=field[i];if(mass<=0)continue;for(let c=0;c<3;c++)pixels[i+c]=255*Math.exp(-field[i+1+c]/mass);pixels[i+3]=255*.38*(-Math.expm1(-mass));}
    return {pixels,width:w,height:h};
  }
  const api={settings,radiusPixels,rasterize};
  if(typeof module==='object')module.exports=api;
  else root.AtlasInk=api;
})(typeof window==='object'?window:this);
