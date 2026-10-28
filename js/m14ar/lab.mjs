// QR anchoring lab: renders synthetic camera frames of the printed 25 mm label on the J2 model,
// runs the same worker + pose chain as the AR page and reports the error against ground truth.
import * as THREE from '../../vendor/three.module.js';
import {sampleFromCorners,fillViewport,LABEL} from './pose.mjs?v=7.0';
import {QrAnchor} from './anchor.mjs?v=7.0';
import {PIECE} from './scene.mjs?v=7.0';

const out=document.querySelector('#log'),log=s=>{out.textContent+=s+'\n'};
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();scene.background=new THREE.Color('#5d6b66');
scene.add(new THREE.HemisphereLight(0xffffff,0x445544,2.2));const sun=new THREE.DirectionalLight(0xffffff,1.2);sun.position.set(.3,1,.2);scene.add(sun);
const table=new THREE.Mesh(new THREE.PlaneGeometry(3,3),new THREE.MeshStandardMaterial({color:'#7d6a55',roughness:.9}));table.rotation.x=-Math.PI/2;table.position.y=-PIECE.h;scene.add(table);
const qr=await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src='assets/target/qr-m14.png'});
const c=document.createElement('canvas');c.width=3000;c.height=1500;const g=c.getContext('2d');g.fillStyle='#d9d6cc';g.fillRect(0,0,3000,1500);g.imageSmoothingEnabled=false;g.drawImage(qr,1250,500,500,500);
const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=renderer.capabilities.getMaxAnisotropy();
const side=new THREE.MeshStandardMaterial({color:'#c9c5ba'});
const piece=new THREE.Mesh(new THREE.BoxGeometry(PIECE.w,PIECE.h,PIECE.d),[side,side,new THREE.MeshStandardMaterial({map:tex,roughness:.8}),side,side,side]);piece.position.y=-PIECE.h/2;
const world=new THREE.Group();world.add(piece);scene.add(world);
const worker=new Worker('js/m14ar/qr-worker.js');let pending=null;worker.onmessage=e=>{pending(e.data)};
const detect=(msg,transfer)=>new Promise(r=>{pending=r;worker.postMessage(msg,transfer)});

/** One synthetic frame. Ground truth: QR centre at `qrPos` with yaw `yaw` (content X axis). */
async function frame({video,canvas,dist,elev,azim,yaw,qrPos,fovV=1.05,flip=false}){
 world.position.fromArray(qrPos);world.rotation.set(0,yaw,0);world.updateMatrixWorld(true);
 const cam=new THREE.PerspectiveCamera(fovV*180/Math.PI,video[0]/video[1],.01,10);
 const target=new THREE.Vector3(...qrPos);cam.position.set(target.x+dist*Math.cos(elev)*Math.sin(azim),target.y+dist*Math.sin(elev),target.z+dist*Math.cos(elev)*Math.cos(azim));cam.lookAt(target);cam.updateMatrixWorld(true);
 const rt=new THREE.WebGLRenderTarget(video[0],video[1],{samples:4});renderer.setRenderTarget(rt);renderer.render(scene,cam);
 const rgba=new Uint8Array(video[0]*video[1]*4);renderer.readRenderTargetPixels(rt,0,0,video[0],video[1],rgba);renderer.setRenderTarget(null);rt.dispose();
 // readPixels is bottom-up; produce the top-down luminance array XR8 hands over (or keep it upside down to test the flip probe).
 const W=video[0],H=video[1],lum=new Uint8Array(W*H);for(let y=0;y<H;y++){const sy=flip?y:H-1-y;for(let x=0;x<W;x++){const i=(sy*W+x)*4;lum[y*W+x]=.299*rgba[i]+.587*rgba[i+1]+.114*rgba[i+2]}}
 // Intrinsics as XR8 reports them: for the canvas, which shows the video cropped to fill.
 const v=fillViewport(W,H,canvas[0],canvas[1]),P=cam.projectionMatrix.elements.slice();P[0]*=v.width/canvas[0];P[5]*=v.height/canvas[1];
 const t0=performance.now();let r=await detect({id:1,w:W,h:H,flip,locate:LABEL.modules,buffer:lum.slice().buffer});
 // Same fallback as the AR page: an upscaled crop under the reticle (QR centred in these frames).
 if(!r.found){const half=Math.round(Math.min(W,H)*.3),x0=Math.round(W/2-half),y0=Math.round(H/2-half),crop=new Uint8Array(4*half*half);for(let y=0;y<2*half;y++)crop.set(lum.subarray((y0+y)*W+x0,(y0+y)*W+x0+2*half),y*2*half);
  r=await detect({id:2,w:2*half,h:2*half,flip,upscale:true,locate:LABEL.modules,buffer:crop.buffer},[crop.buffer]);if(r.found)r.corners=r.corners.map(p=>({x:p.x+x0,y:p.y+y0}))}const ms=performance.now()-t0;
 if(!r.found)return{found:false,ms};
 const q=cam.quaternion,fr={cols:W,rows:H,canvasW:canvas[0],canvasH:canvas[1],P,camPos:{x:cam.position.x,y:cam.position.y,z:cam.position.z},camRot:{x:q.x,y:q.y,z:q.z,w:q.w}};
 const s=sampleFromCorners(r.corners,fr),free=sampleFromCorners(r.corners,fr,undefined,{level:false});
 const at=x=>new THREE.Vector3(...x.c).add(new THREE.Vector3(...x.d)),err=at(s).distanceTo(target)*1000,errFree=at(free).distanceTo(target)*1000;
 const xTrue=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw)),yawErr=Math.acos(Math.min(1,new THREE.Vector3(...s.xAxis).setY(0).normalize().dot(xTrue)))*180/Math.PI;
 const tilt=Math.acos(Math.min(1,new THREE.Vector3(...s.yAxis).normalize().y))*180/Math.PI;
 return{found:true,decoded:!!r.data,up:!!r.upscaled,ms,err,errFree,level:s.level,yawErr,tilt,sample:s};
}
const pad=(v,n=7)=>String(v).padStart(n);
log('Vídeo        dist  elev  azim | detect  decod   ms | err mm (sin gravedad)  giro°');
const cases=[];for(const video of[[720,1280],[480,640]])for(const dist of[.1,.14,.18,.22,.27])for(const[elev,azim]of[[1.2,0],[.9,.5],[.75,-.7]])cases.push({video,dist,elev,azim});
const stats={};
for(const k of cases){
 const r=await frame({...k,canvas:[390,844],yaw:.35,qrPos:[.03,.72,-.2]});
 const key=k.video.join('x');(stats[key]??=[]).push(r);
 log(`${k.video.join('x').padEnd(10)} ${pad((k.dist*100).toFixed(0)+'cm',5)} ${pad((k.elev*57.3).toFixed(0)+'°',5)} ${pad((k.azim*57.3).toFixed(0)+'°',5)} | ${pad(r.found?'sí':'no',6)} ${pad(r.found?(r.decoded?'sí':'esq.'):'-',5)} ${pad(r.ms.toFixed(0),4)} | ${r.found?pad(r.err.toFixed(1),6)+(r.level?'':'*')+'  ('+r.errFree.toFixed(1)+')'+pad(r.yawErr.toFixed(1),8)+(r.up?'  ×2':''):''}`);
}
for(const[k,list]of Object.entries(stats)){const f=list.filter(r=>r.found);log(`\n${k}: detectado ${f.length}/${list.length} · error medio ${(f.reduce((a,r)=>a+r.err,0)/f.length).toFixed(1)} mm (sin gravedad ${(f.reduce((a,r)=>a+r.errFree,0)/f.length).toFixed(1)}) · máx ${Math.max(...f.map(r=>r.err)).toFixed(1)} mm · giro medio ${(f.reduce((a,r)=>a+r.yawErr,0)/f.length).toFixed(1)}°`)}
// Flip probe: an upside-down array must not decode as-is, and must decode with flip=true.
const up=await frame({video:[720,1280],canvas:[390,844],dist:.15,elev:1.1,azim:.2,yaw:.35,qrPos:[.03,.72,-.2],flip:true});
log(`\nArray invertido + flip: ${up.found?'detectado, error '+up.err.toFixed(1)+' mm':'NO detectado'}`);
// Anchor over a short hand-held sweep.
const a=new QrAnchor();let now=0,lockAt=null;
for(let i=0;i<14;i++){now+=110;const r=await frame({video:[720,1280],canvas:[390,844],dist:.16+i*.004,elev:1.05-i*.01,azim:-.3+i*.05,yaw:.35,qrPos:[.03,.72,-.2]});if(r.found)a.add(r.sample,now,'NORMAL');if(a.state==='locked'&&lockAt===null)lockAt=now}
const p=a.pose(now);log(`Ancla: ${a.state} en ${lockAt} ms · error ${(new THREE.Vector3(...p.p).distanceTo(new THREE.Vector3(.03,.72,-.2))*1000).toFixed(1)} mm`);
document.body.dataset.done='1';window.__lab={stats};
