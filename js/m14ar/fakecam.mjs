// Test harness only (?fakecam=1): replaces the phone camera with a rendered video of the printed QR on the J2,
// so the whole XR8 + QR pipeline can be checked on a desktop. The virtual camera uses the engine's own intrinsics.
import * as THREE from '../../vendor/three.module.js';
import {fillViewport} from './pose.mjs';
import {PIECE} from './scene.mjs';

export async function installFakeCamera({width=1280,height=720}={}){
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});renderer.outputColorSpace=THREE.SRGBColorSpace;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#6a756f');
 scene.add(new THREE.HemisphereLight(0xffffff,0x445544,2.2));const sun=new THREE.DirectionalLight(0xffffff,1.1);sun.position.set(.3,1,.2);scene.add(sun);
 const table=new THREE.Mesh(new THREE.PlaneGeometry(3,3),new THREE.MeshStandardMaterial({color:'#7d6a55',roughness:.9}));table.rotation.x=-Math.PI/2;table.position.y=-PIECE.h;scene.add(table);
 const qr=await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src='assets/target/qr-m14.png'});
 const c=document.createElement('canvas');c.width=3000;c.height=1500;const g=c.getContext('2d');g.fillStyle='#d9d6cc';g.fillRect(0,0,3000,1500);g.imageSmoothingEnabled=false;g.drawImage(qr,1250,500,500,500);
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;const side=new THREE.MeshStandardMaterial({color:'#c9c5ba'});
 const piece=new THREE.Mesh(new THREE.BoxGeometry(PIECE.w,PIECE.h,PIECE.d),[side,side,new THREE.MeshStandardMaterial({map:tex}),side,side,side]);piece.position.y=-PIECE.h/2;scene.add(piece);
 const cam=new THREE.PerspectiveCamera(50,width/height,.01,10);
 const q=new URLSearchParams(location.search),state={dist:+q.get('camdist')||.2,elev:+q.get('camelev')||1.05,azim:+(q.get('camazim')??.25),spin:.15,auto:false,cam,width,height};window.__fakecam=state;
 const t0=performance.now();
 function draw(){
  const t=(performance.now()-t0)/1000;if(state.auto)state.azim=.5*Math.sin(t*state.spin*2);
  cam.position.set(state.dist*Math.cos(state.elev)*Math.sin(state.azim),state.dist*Math.sin(state.elev),state.dist*Math.cos(state.elev)*Math.cos(state.azim));cam.lookAt(0,0,0);
  // Match the engine's field of view: XR8 intrinsics are for the canvas, which shows this video cropped to fill.
  const P=window.__xrIntrinsics,cv=window.__xrCanvas;
  if(P&&cv){const v=fillViewport(width,height,cv[0],cv[1]),m=cam.projectionMatrix.elements;m.fill(0);m[0]=P[0]*cv[0]/v.width;m[5]=P[5]*cv[1]/v.height;m[10]=-1.002;m[11]=-1;m[14]=-.02;cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert()}
  renderer.render(scene,cam);requestAnimationFrame(draw);
 }
 draw();
 const stream=canvas.captureStream(30);
 const md=navigator.mediaDevices||(navigator.mediaDevices={});
 md.getUserMedia=async()=>stream;
 md.enumerateDevices=async()=>[{kind:'videoinput',deviceId:'fake',label:'Fake QR camera',groupId:'fake'}];
 md.getSupportedConstraints=()=>({deviceId:true,facingMode:true});
 return{canvas,state};
}
