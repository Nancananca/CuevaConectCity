// Finds the QR in a luminance frame and returns its 4 outer corners (topLeft, topRight, bottomRight, bottomLeft).
// `locate` = expected module count: when the code is too small to decode, jsQR (patched) still returns its corners.
importScripts('../../vendor/jsqr/jsQR.js');
self.onmessage=({data:m})=>{
 const{id,w,h,flip,locate}=m;let px=new Uint8ClampedArray(m.buffer);
 if(flip){const out=new Uint8ClampedArray(px.length);for(let y=0;y<h;y++)out.set(px.subarray((h-1-y)*w,(h-y)*w),y*w);px=out}
 let r=null,scale=1;const t0=performance.now();
 try{r=jsQR(px,w,h,{inversionAttempts:'dontInvert',locateDimension:locate})}catch(e){}
 // Small or distant codes (and 640×480 cameras, common on Android): a 2× bilinear upscale of the region
 // lets the finder patterns be found with sub-pixel corners. The page only asks for it on small regions.
 if(!r&&m.upscale){try{r=jsQR(upscale(px,w,h),w*2,h*2,{inversionAttempts:'dontInvert',locateDimension:locate});if(r)scale=.5}catch(e){}}
 const ms=performance.now()-t0;
 if(!r){self.postMessage({id,found:false,ms});return}
 const L=r.location;
 self.postMessage({id,found:true,ms,data:r.data,locatedOnly:r.locatedOnly,upscaled:scale<1,corners:[L.topLeftCorner,L.topRightCorner,L.bottomRightCorner,L.bottomLeftCorner].map(p=>({x:(p.x+.5)*scale-.5,y:(p.y+.5)*scale-.5}))});
};
function upscale(src,w,h){
 const W=w*2,H=h*2,out=new Uint8ClampedArray(W*H);
 for(let y=0;y<H;y++){const sy=Math.min(h-1,Math.max(0,(y+.5)/2-.5)),y0=Math.floor(sy),y1=Math.min(h-1,y0+1),fy=sy-y0;
  for(let x=0;x<W;x++){const sx=Math.min(w-1,Math.max(0,(x+.5)/2-.5)),x0=Math.floor(sx),x1=Math.min(w-1,x0+1),fx=sx-x0;
   const a=src[y0*w+x0],b=src[y0*w+x1],c=src[y1*w+x0],d=src[y1*w+x1];out[y*W+x]=(a+(b-a)*fx)*(1-fy)+(c+(d-c)*fx)*fy}}
 return out;
}
