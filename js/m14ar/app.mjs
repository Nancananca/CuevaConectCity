// M-14 · entry, web AR (8th Wall engine SLAM + our own QR fiducial anchoring) and the 3D preview.
// Flow: scan the printed QR -> this page -> one tap -> point at the QR -> the scene fixes itself on the piece.
import * as THREE from '../../vendor/three.module.js';
import {OrbitControls} from '../../vendor/OrbitControls.js';
import {createM14Scene,PIECE,TIMELINE} from './scene.mjs';
import {QrAnchor} from './anchor.mjs';
import {sampleFromCorners,pixelToCanvas,fillViewport,LABEL} from './pose.mjs';
import {createSound} from './sound.mjs';
import {T,tr,pickLang,LANGS} from './text.mjs';

const VERSION='5.0';
window.THREE=THREE; // XR8.Threejs.pipelineModule() reads the global
const $=s=>document.querySelector(s);
const params=new URLSearchParams(location.search);
const DEBUG=params.has('debug'),FAKECAM=params.has('fakecam'),LABEL_MM=Math.min(60,Math.max(15,Number(params.get('qr'))||LABEL.mm));
const ua=navigator.userAgent,isIOS=/iPhone|iPad|iPod/.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1),isMobile=isIOS||/Android|Mobile/i.test(ua);
const EXPECTED=/CuevaConectCity/i;
let lang=pickLang();const t=k=>tr(T[k],lang);
const sound=createSound();
let passport=null;fetch('data/m14.json').then(r=>r.ok?r.json():null).then(d=>passport=d).catch(()=>{});
const fontsReady=Promise.race([Promise.all(['650 44px Inter','500 26px Mono','700 40px Archivo'].map(f=>document.fonts?.load(f).catch(()=>{}))),new Promise(r=>setTimeout(r,1500))]);

// ---------- engine preload (starts as soon as the page opens on a phone) ----------
let enginePromise=null;
function loadEngine(){
 if(window.XR8)return Promise.resolve(window.XR8);
 return enginePromise??=new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>reject(new Error('engine timeout')),90000);
  window.addEventListener('xrloaded',()=>{clearTimeout(timeout);window.XR8.loadChunk('slam').then(()=>resolve(window.XR8),reject)},{once:true});
  const s=document.createElement('script');s.src='vendor/xr8/xr.js';s.async=true;s.dataset.preloadChunks='slam';s.onerror=()=>{clearTimeout(timeout);reject(new Error('engine download'))};document.head.append(s);
 });
}

// ---------- entry ----------
function renderEntry(message=''){
 document.documentElement.lang=lang;document.body.className='m14 entry';
 $('#app').innerHTML=`
 <header class="bar"><a class="mark" href="pasaporte.html?lang=${lang}" aria-label="CUEVA"><img src="assets/brand/cueva.svg" alt="" width="22" height="22"><span>CUEVA</span></a>
  <div class="partners"><img src="assets/brand/port-barcelona-blanco.svg" alt="Port de Barcelona"><span>×</span><img class="pp" src="assets/brand/plasticpeople.svg" alt="PLASTICPeople"></div>
  <div class="langs" role="group" aria-label="Idioma">${LANGS.map(l=>`<button data-lang="${l}" aria-pressed="${l===lang}">${l.toUpperCase()}</button>`).join('')}</div></header>
 <main class="entry-main">
  <div class="entry-visual" aria-hidden="true"><div class="qr-frame"><i></i><i></i><i></i><i></i><img src="assets/target/qr-m14.png" alt=""><span class="beam"></span></div><div class="piece-outline"><span>150 × 75 mm</span></div></div>
  <p class="kicker">${t('entryKicker')}</p>
  <h1>${t('entryTitle')}</h1>
  <p class="lead">${isMobile?t('entryLead'):t('desktopNote')}</p>
  <button id="go" class="go"><span class="go-label">${isMobile?t('start'):t('startDesktop')}</span><span class="go-progress" aria-hidden="true"></span></button>
  <p id="entry-msg" class="msg" role="status">${message}</p>
  <nav class="entry-links"><a href="pasaporte.html?lang=${lang}">${t('passport')} ↗</a>${isMobile?`<a href="?preview=1&lang=${lang}">${t('view3d')}</a>`:''}</nav>
  <p class="fine">${isMobile?t('privacy'):''}</p>
 </main>
 <footer class="credit">Powered by <a href="https://8thwall.org/">8th Wall</a> · © 2026 Niantic Spatial, Inc. · <a href="vendor/xr8/LICENSE">XR Engine License</a> · jsQR (Apache-2.0) · three.js (MIT)</footer>`;
 for(const b of document.querySelectorAll('[data-lang]'))b.onclick=()=>{lang=b.dataset.lang;try{localStorage.setItem('m14-lang',lang)}catch{};renderEntry()};
 $('#go').onclick=()=>isMobile?startAR():startPreview();
}

// ---------- shared overlay (captions, chapters, info cards) ----------
function overlayHTML(ar){return`
 <div class="hud-top"><button id="close" class="icon" aria-label="${t('close')}">✕</button><div id="status" class="status" role="status"></div>
  <button id="sound" class="icon" aria-pressed="${sound.on}" aria-label="${t('sound')}">${sound.on?'♪':'♪̸'}</button>${ar?`<button id="reanchor" class="icon" aria-label="${t('reanchor')}" title="${t('reanchor')}">⟲</button>`:''}</div>
 ${ar?'<div id="reticle" class="reticle" aria-hidden="true"><i></i><i></i><i></i><i></i></div><canvas id="quad" class="quad"></canvas>':''}
 <p id="hint" class="hint" hidden></p>
 <section id="caption" class="caption" hidden><p class="cap-kick"></p><h2 class="cap-title"></h2><p class="cap-text"></p></section>
 <nav id="rail" class="rail" hidden>${T.chShort.map((c,i)=>`<button data-ch="${i}"><span>${tr(c,lang)}</span><i></i></button>`).join('')}<button id="pause" class="pause" aria-label="${t('pause')}">❚❚</button></nav>
 <aside id="info" class="info" hidden><button class="info-x" aria-label="${t('close')}">✕</button><h3></h3><p></p></aside>
 <p class="foot">${t('footnote')}</p>
 ${DEBUG?'<pre id="debug" class="debug"></pre>':''}`}
function bindOverlay(story,{onClose,onReanchor}){
 $('#close').onclick=onClose;
 $('#sound').onclick=()=>{sound.set(!sound.on);$('#sound').setAttribute('aria-pressed',sound.on);$('#sound').textContent=sound.on?'♪':'♪̸'};
 if(onReanchor)$('#reanchor').onclick=onReanchor;
 for(const b of document.querySelectorAll('[data-ch]'))b.onclick=e=>{e.stopPropagation();story.seek(TIMELINE.chapters[+b.dataset.ch]);story.setPaused(false);$('#pause').textContent='❚❚'};
 $('#pause').onclick=e=>{e.stopPropagation();story.setPaused(!story.paused);$('#pause').textContent=story.paused?'▶':'❚❚'};
 $('#info .info-x').onclick=()=>$('#info').hidden=true;
}
let lastChapter=-2,infoTimer;
function updateCaption(story,visible){
 const ch=visible?story.chapterAt():-1;$('#caption').hidden=ch<0;$('#rail').hidden=!visible||story.time<TIMELINE.chapters[0]-.5;
 if(ch!==lastChapter){lastChapter=ch;if(ch>=0){const c=T.ch[ch];$('.cap-kick').textContent=tr(c.kick,lang);$('.cap-title').textContent=tr(c.title,lang);$('.cap-text').textContent=tr(c.text,lang);
  $('#caption').classList.remove('in');void $('#caption').offsetWidth;$('#caption').classList.add('in')}
  document.querySelectorAll('[data-ch]').forEach((b,i)=>b.classList.toggle('on',i===ch))}
 if(ch>=0){const a=TIMELINE.chapters[ch],b=TIMELINE.chapters[ch+1]??TIMELINE.loopEnd;document.querySelector(`[data-ch="${ch}"] i`).style.transform=`scaleX(${Math.min(1,(story.time-a)/(b-a))})`}
}
function showInfo(hit){
 if(!hit)return;const k=hit.kind==='phase'?'phase':hit.kind,c=T.info[k];
 $('#info h3').textContent=tr(c.title,lang)+(hit.phase?' · '+hit.phase+' · '+tr(T.phases[hit.phase],lang):'');$('#info p').textContent=tr(c.text,lang);$('#info').hidden=false;
 clearTimeout(infoTimer);infoTimer=setTimeout(()=>$('#info').hidden=true,9000);
}
function playCues(story){for(const c of story.takeCues())sound.play(c)}

// ---------- web AR ----------
let ar=null;
async function startAR(){
 sound.unlock();
 // iOS: motion permission must be requested synchronously inside the tap.
 const perms=[];if(!FAKECAM)for(const api of[window.DeviceMotionEvent,window.DeviceOrientationEvent])if(typeof api?.requestPermission==='function'){try{perms.push(api.requestPermission())}catch(e){perms.push(Promise.reject(e))}}
 const go=$('#go');go.disabled=true;go.classList.add('busy');go.querySelector('.go-label').textContent=t('loading');
 try{
  const results=await Promise.all(perms);if(results.some(r=>r!=='granted'))throw Object.assign(new Error('motion'),{user:t('motionError')});
  const XR8=await loadEngine().catch(e=>{throw Object.assign(e,{user:t('engineError')})});
  if(!FAKECAM&&!XR8.XrDevice.isDeviceBrowserCompatible({allowedDevices:XR8.XrConfig.device().MOBILE}))throw Object.assign(new Error('incompatible'),{user:t('incompatible')});
  await fontsReady;runAR(XR8);
 }catch(e){console.error('M14 AR',e);renderEntry(e.user||t('cameraError'))}
}
function runAR(XR8){
 document.body.className='m14 ar';
 $('#app').innerHTML=`<canvas id="camerafeed"></canvas>${overlayHTML(true)}`;
 const canvas=$('#camerafeed'),quad=$('#quad'),qctx=quad.getContext('2d');
 const anchor=new QrAnchor(),worker=new Worker('js/m14ar/qr-worker.js');
 const S={story:null,scene:null,camera:null,cw:0,ch:0,tracking:'LIMITED',reason:'',busy:false,lastReq:0,reqId:0,meta:new Map(),
  lastCorners:null,lastFoundAt:-1e9,decodedAt:-1e9,flipLocked:false,flip:false,attempt:0,startedAt:performance.now(),firstPoseAt:0,lockedOnce:false,state:'search',
  pos:new THREE.Vector3(),quat:new THREE.Quaternion(),scl:1,hasPose:false,det:{ms:0,n:0,hits:0,err:0,dist:0},fps:0,lastFrame:performance.now(),stopped:false};
 ar={XR8,S,worker};
 const stop=(msg='')=>{if(S.stopped)return;S.stopped=true;try{XR8.stop()}catch{};try{XR8.clearCameraPipelineModules()}catch{};worker.terminate();S.story?.dispose();ar=null;renderEntry(msg)};
 // The story only exists after the engine's onStart, so the overlay talks to it through a proxy.
 const proxy={seek:v=>S.story?.seek(v),setPaused:v=>S.story?.setPaused(v),get paused(){return S.story?.paused},get time(){return S.story?.time??0}};
 bindOverlay(proxy,{onClose:()=>stop(),onReanchor:()=>{anchor.reset();S.hasPose=false;S.lockedOnce=false;if(S.story)S.story.root.visible=false;setStatus()}});

 worker.onmessage=({data:r})=>{
  S.busy=false;const meta=S.meta.get(r.id);S.meta.delete(r.id);if(!meta||S.stopped)return;
  const now=performance.now();S.det.ms=S.det.ms*.8+r.ms*.2;S.det.n++;
  if(!r.found){if(!S.flipLocked)S.attempt++;return}
  if(r.data&&!EXPECTED.test(r.data))return; // another QR in view
  if(r.data){S.decodedAt=now;if(!S.flipLocked){S.flipLocked=true;S.flip=meta.flip}}
  else if(now-S.decodedAt>4000)return; // located-only results need a recent decode of our code
  const corners=r.corners.map(p=>({x:p.x+meta.roi.x,y:p.y+meta.roi.y}));
  S.lastCorners=corners;S.lastFoundAt=now;S.det.hits++;
  const sample=sampleFromCorners(corners,meta,LABEL_MM);if(!sample)return;
  if(r.locatedOnly&&!sample.level)return; // undecoded and not consistent with a flat label: corners are not trustworthy
  S.det.err=sample.err;S.det.dist=sample.distance;
  const before=anchor.state,lockCount=anchor.lockCount;anchor.add(sample,now,FAKECAM?'NORMAL':S.tracking); // harness: static camera = valid world
  if(anchor.state==='locked'&&anchor.lockCount!==lockCount){
   if(!S.lockedOnce){S.lockedOnce=true;sound.play('lock');navigator.vibrate?.(25)}else if(anchor.locked.reason==='moved')flashHint(t('moved'));
  }
  drawQuad(corners,meta);
  if(before==='search'&&anchor.state!=='search'&&!S.firstPoseAt){S.firstPoseAt=now;S.story?.restart()}
 };
 function drawQuad(corners,meta){
  const r=quad.getBoundingClientRect();if(quad.width!==r.width*devicePixelRatio){quad.width=r.width*devicePixelRatio;quad.height=r.height*devicePixelRatio}
  const sx=quad.width/meta.canvasW,sy=quad.height/meta.canvasH,pts=corners.map(p=>pixelToCanvas(p,meta)).map(p=>[p.x*sx,p.y*sy]);
  qctx.clearRect(0,0,quad.width,quad.height);qctx.strokeStyle='#7edbc2';qctx.lineWidth=3*devicePixelRatio;qctx.shadowColor='#7edbc2';qctx.shadowBlur=12;qctx.beginPath();pts.forEach(([x,y],i)=>i?qctx.lineTo(x,y):qctx.moveTo(x,y));qctx.closePath();qctx.stroke();
  quad.classList.remove('fade');void quad.offsetWidth;quad.classList.add('fade');
 }
 function request(pa,reality,now){
  const{cols,rows,rowBytes,pixels}=pa;if(!pixels||!cols||!rows)return;
  const bpp=Math.max(1,Math.round(rowBytes/cols));
  // Where to look (display-oriented coordinates):
  //  - around the last sighting, upscaled when the code is small;
  //  - otherwise alternate the full frame and an upscaled crop under the reticle (cheap way to reach farther).
  let x0=0,y0=0,w=cols,h=rows,up=false;const tracked=S.lastCorners&&now-S.lastFoundAt<800;
  if(tracked){const xs=S.lastCorners.map(p=>p.x),ys=S.lastCorners.map(p=>p.y),size=Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys)),m=Math.max(90,size*.9);
   x0=Math.max(0,Math.floor(Math.min(...xs)-m));y0=Math.max(0,Math.floor(Math.min(...ys)-m));w=Math.min(cols,Math.ceil(Math.max(...xs)+m))-x0;h=Math.min(rows,Math.ceil(Math.max(...ys)+m))-y0;up=size<130;
   if(w<40||h<40){x0=0;y0=0;w=cols;h=rows;up=false}}
  else if(S.attempt%2===1){const v=fillViewport(cols,rows,S.cw||canvas.width,S.ch||canvas.height),cx=(-v.offsetX+(S.cw||canvas.width)/2)/v.width*cols,cy=(-v.offsetY+(S.ch||canvas.height)*.44)/v.height*rows,half=Math.round(Math.min(cols,rows)*.3);
   x0=Math.max(0,Math.round(cx-half));y0=Math.max(0,Math.round(cy-half));w=Math.min(cols-x0,2*half);h=Math.min(rows-y0,2*half);up=true}
  S.flip=S.flipLocked?S.flip:!tracked&&S.attempt%4===2;
  const ay0=S.flip?rows-(y0+h):y0,out=new Uint8Array(w*h);
  for(let y=0;y<h;y++){const src=(ay0+y)*rowBytes+x0*bpp;if(bpp===1)out.set(pixels.subarray(src,src+w),y*w);else for(let x=0;x<w;x++)out[y*w+x]=pixels[src+x*bpp]}
  const id=++S.reqId,P=Array.from(reality.intrinsics),camPos={...reality.position},camRot={x:reality.rotation.x,y:reality.rotation.y,z:reality.rotation.z,w:reality.rotation.w};
  S.meta.set(id,{cols,rows,canvasW:S.cw||canvas.width,canvasH:S.ch||canvas.height,P,camPos,camRot,roi:{x:x0,y:y0},flip:S.flip});
  S.busy=true;S.lastReq=now;worker.postMessage({id,w,h,flip:S.flip,upscale:up,locate:LABEL.modules,buffer:out.buffer},[out.buffer]);
 }
 const target={pos:new THREE.Vector3(),quat:new THREE.Quaternion(),m:new THREE.Matrix4(),x:new THREE.Vector3(),y:new THREE.Vector3(),z:new THREE.Vector3(),s:new THREE.Vector3()};
 function applyPose(pose,dt){
  const{x,y,z}=target;x.fromArray(pose.x).normalize();z.fromArray(pose.z).normalize();y.crossVectors(z,x).normalize();z.crossVectors(x,y);
  target.m.makeBasis(x,y,z);target.quat.setFromRotationMatrix(target.m);target.pos.fromArray(pose.p);
  if(!S.hasPose){S.pos.copy(target.pos);S.quat.copy(target.quat);S.scl=pose.scale;S.hasPose=true}
  const k=1-Math.exp(-dt*(pose.locked?10:18));S.pos.lerp(target.pos,k);S.quat.slerp(target.quat,k);S.scl+=(pose.scale-S.scl)*k;
  const root=S.story.root;root.position.copy(S.pos);root.quaternion.copy(S.quat);root.scale.setScalar(S.scl);
 }
 let statusKey='';
 function setStatus(){
  const now=performance.now(),st=anchor.state;let key,text,hint='';
  if(st==='locked'){key=S.tracking==='NORMAL'?'locked':'recovering';text=t(key);if(key==='recovering')hint=t('recoverHint');else if(S.near)hint=t('stepBack')}
  else if(st==='follow'){key='fixing';text=t('fixing');if(S.tracking!=='NORMAL'&&now-(anchor.followSince??now)>1800)hint=t('moveHint')}
  else{key='find';text=t('find');if(now-S.startedAt>4500)hint=t('findHint')}
  if(key+hint!==statusKey){statusKey=key+hint;$('#status').textContent=text;$('#status').dataset.state=key;if(!S.flash){$('#hint').hidden=!hint;$('#hint').textContent=hint}}
  $('#reticle').hidden=st!=='search';
 }
 function flashHint(text){S.flash=true;$('#hint').hidden=false;$('#hint').textContent=text;setTimeout(()=>{S.flash=false;statusKey=''},2600)}

 const raycaster=new THREE.Raycaster();
 canvas.addEventListener('click',e=>{if(!S.story||!S.story.root.visible)return;const r=canvas.getBoundingClientRect();
  raycaster.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1),S.camera);showInfo(S.story.pick(raycaster))});

 // The engine renders at the canvas' drawing-buffer size: keep it at window size (pixel ratio capped for speed).
 const fit=()=>{const r=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(innerWidth*r);canvas.height=Math.round(innerHeight*r)};
 fit();addEventListener('resize',fit);
 XR8.clearCameraPipelineModules();
 XR8.XrController.configure({disableWorldTracking:FAKECAM,scale:FAKECAM?'responsive':'absolute'}); // desktop harness: no IMU, no SLAM
 XR8.addCameraPipelineModules([
  XR8.GlTextureRenderer.pipelineModule(),XR8.Threejs.pipelineModule(),XR8.XrController.pipelineModule(),
  XR8.CameraPixelArray.pipelineModule({luminance:true,maxDimension:1280}),
  {name:'m14-qr-anchor',
   onStart:({canvasWidth,canvasHeight})=>{
    S.cw=canvasWidth||canvas.width;S.ch=canvasHeight||canvas.height;
    const{scene,camera,renderer}=XR8.Threejs.xrScene();S.scene=scene;S.camera=camera;camera.near=.005;camera.far=50;camera.updateProjectionMatrix();
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;
    S.story=createM14Scene({lang,passport});S.story.root.visible=false;S.story.root.matrixAutoUpdate=true;scene.add(S.story.root);S.story.setViewHeight(S.ch);
    setStatus();
   },
   onCanvasSizeChange:({canvasWidth,canvasHeight})=>{S.cw=canvasWidth;S.ch=canvasHeight;S.story?.setViewHeight(canvasHeight)},
   onUpdate:({processCpuResult,processGpuResult})=>{
    if(S.stopped||!S.story)return;const now=performance.now(),dt=Math.min(.05,(now-S.lastFrame)/1000);S.lastFrame=now;S.fps=S.fps*.9+(dt>0?1/dt:0)*.1;
    const reality=processCpuResult?.reality;if(reality?.trackingStatus){S.tracking=reality.trackingStatus;S.reason=reality.trackingReason}
    const pa=processGpuResult?.camerapixelarray,interval=anchor.state==='locked'?220:0;
    if(FAKECAM&&reality?.intrinsics){window.__m14ar={S,anchor};window.__xrIntrinsics=Array.from(reality.intrinsics);window.__xrCanvas=[S.cw||canvas.width,S.ch||canvas.height]}
    if(reality?.intrinsics&&pa&&!S.busy&&now-S.lastReq>=interval)request(pa,reality,now);
    const pose=anchor.pose(now);S.story.root.visible=!!pose;
    if(pose){applyPose(pose,dt);S.story.update(dt,S.camera);playCues(S.story);
     // Right after scanning the phone is a hand-span away: suggest stepping back while it stays that close.
     const d=S.camera.position.distanceTo(S.story.root.position)/S.scl;S.nearFor=d<.2?(S.nearFor||0)+dt:0;S.near=S.nearFor>1.5&&S.story.time>3}
    updateCaption(S.story,!!pose);setStatus();
    if(DEBUG)$('#debug').textContent=`v${VERSION} ${anchor.state} track:${S.tracking}/${S.reason} k:${anchor.scale.toFixed(3)}\ndet:${S.det.hits}/${S.det.n} ${S.det.ms.toFixed(0)}ms flip:${S.flip}${S.flipLocked?'*':''} err:${(S.det.err*1000).toFixed(2)} d:${(S.det.dist*100).toFixed(1)}cm\nfps:${S.fps.toFixed(0)} canvas:${S.cw}x${S.ch} px:${pa?pa.cols+'x'+pa.rows:'-'} label:${LABEL_MM}mm locks:${anchor.lockCount}`;
   },
   onCameraStatusChange:({status})=>{if(status==='failed')stop(t('cameraError'))},
   onException:e=>{console.error('M14 XR8',e);stop(t('cameraError'))},
  }]);
 XR8.run({canvas,allowedDevices:FAKECAM?XR8.XrConfig.device().ANY:XR8.XrConfig.device().MOBILE,cameraConfig:{direction:XR8.XrConfig.camera().BACK}});
 document.addEventListener('visibilitychange',onVisibility);
 function onVisibility(){if(!ar||ar.S!==S){document.removeEventListener('visibilitychange',onVisibility);return}
  if(document.hidden){try{XR8.pause()}catch{};sound.suspend()}else{try{XR8.resume()}catch{};sound.resume()}}
}

// ---------- 3D preview (desktop, or phones without camera) ----------
async function startPreview(){
 sound.unlock();await fontsReady;
 document.body.className='m14 preview';
 $('#app').innerHTML=`<div id="stage"></div>${overlayHTML(false)}`;
 const host=$('#stage'),renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;host.append(renderer.domElement);
 const scene=new THREE.Scene();scene.background=new THREE.Color('#0b2731');scene.fog=new THREE.Fog('#0b2731',.7,1.8);
 const camera=new THREE.PerspectiveCamera(38,1,.005,10);camera.position.set(.2,.19,.27);
 const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.03,0);controls.enableDamping=true;controls.minDistance=.14;controls.maxDistance=1.1;controls.maxPolarAngle=Math.PI*.47;controls.autoRotate=true;controls.autoRotateSpeed=.35;controls.update();
 renderer.domElement.addEventListener('pointerdown',()=>controls.autoRotate=false);
 // Stand-in for the real world: a table and the physical J2 with its printed QR.
 const table=new THREE.Mesh(new THREE.CircleGeometry(1.2,64),new THREE.MeshStandardMaterial({color:'#2b3f43',roughness:.95}));table.rotation.x=-Math.PI/2;table.position.y=-PIECE.h-.0002;table.receiveShadow=true;scene.add(table);
 const qr=await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src='assets/target/qr-m14.png'});
 const top=document.createElement('canvas');top.width=1500;top.height=750;{const g=top.getContext('2d');g.fillStyle='#d9d6cc';g.fillRect(0,0,1500,750);g.globalAlpha=.07;for(let i=0;i<5000;i++){g.fillStyle=Math.random()>.5?'#000':'#fff';g.fillRect(Math.random()*1500,Math.random()*750,2,2)}g.globalAlpha=1;if(qr){g.imageSmoothingEnabled=false;g.drawImage(qr,625,250,250,250)}}
 const topTex=new THREE.CanvasTexture(top);topTex.colorSpace=THREE.SRGBColorSpace;topTex.anisotropy=8;
 const side=new THREE.MeshStandardMaterial({color:'#c9c5ba',roughness:.8});
 const piece=new THREE.Mesh(new THREE.BoxGeometry(PIECE.w,PIECE.h,PIECE.d),[side,side,new THREE.MeshStandardMaterial({map:topTex,roughness:.75}),side,side,side]);piece.position.y=-PIECE.h/2;piece.castShadow=piece.receiveShadow=true;scene.add(piece);
 
 const story=createM14Scene({lang,passport});scene.add(story.root);
 bindOverlay(story,{onClose:()=>{renderer.setAnimationLoop(null);ro.disconnect();story.dispose();renderer.dispose();renderEntry()}});
 $('#status').textContent='3D';$('#status').dataset.state='locked';
 const raycaster=new THREE.Raycaster();let down=null;
 renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);
 renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>6)return;const r=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1),camera);showInfo(story.pick(raycaster))});
 const ro=new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();if(!host.dataset.fit){host.dataset.fit=1;camera.position.sub(controls.target).setLength(.42/Math.pow(Math.min(1,camera.aspect),.75)).add(controls.target);controls.update()}story.setViewHeight(h*renderer.getPixelRatio())});ro.observe(host);
 let last=performance.now();story.restart();
 renderer.setAnimationLoop(now=>{const dt=Math.min(.05,(now-last)/1000);last=now;controls.update();story.update(dt,camera);playCues(story);updateCaption(story,true);renderer.render(scene,camera)});
 if(DEBUG)window.__m14={story,camera,controls,renderer};
}

// ---------- boot ----------
if(FAKECAM)import('./fakecam.mjs').then(m=>m.installFakeCamera()).then(()=>{renderEntry();startAR()});
else if(params.has('preview'))startPreview();else{renderEntry();if(isMobile)loadEngine().then(()=>$('#go')?.classList.add('ready')).catch(()=>{})}
window.addEventListener('pagehide',()=>{if(ar)try{ar.XR8.stop()}catch{}});
