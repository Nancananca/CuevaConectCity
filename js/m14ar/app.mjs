// CuevaConectCity · entry, web AR (8th Wall engine SLAM + our own QR fiducial anchoring) and the 3D preview.
// Flow: scan the printed QR -> this page -> one tap -> point at the QR -> the scene fixes itself on the piece.
// Every piece has its own QR (?p=M-07; the root URL is M-14). Pointing the camera at another piece's QR
// switches the story to that piece without leaving the camera.
import * as THREE from '../../vendor/three.module.js';
import {OrbitControls} from '../../vendor/OrbitControls.js';
import {createPieceScene,TIMELINE} from './scene.mjs?v=6.0';
import {createBagScene} from './bag.mjs?v=6.0';
import {bigBag} from './kit.mjs?v=6.0';
import {QrAnchor} from './anchor.mjs?v=6.0';
import {sampleFromCorners,pixelToCanvas,fillViewport,LABEL} from './pose.mjs?v=6.0';
import {createSound} from './sound.mjs?v=6.0';
import {T,tr,fmt,pickLang,LANGS,pieceVars} from './text.mjs?v=6.0';
import {idFromQr} from './ids.mjs?v=6.0';

const VERSION='6.0';
window.THREE=THREE; // XR8.Threejs.pipelineModule() reads the global
const $=s=>document.querySelector(s);
const params=new URLSearchParams(location.search);
const DEBUG=params.has('debug'),FAKECAM=params.has('fakecam'),LABEL_MM=Math.min(60,Math.max(15,Number(params.get('qr'))||LABEL.mm));
const ua=navigator.userAgent,isIOS=/iPhone|iPad|iPod/.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1),isMobile=isIOS||/Android|Mobile/i.test(ua);
let lang=pickLang();const t=k=>tr(T[k],lang);
const sound=createSound();
const fontsReady=Promise.race([Promise.all(['650 44px Inter','500 26px Mono','700 40px Archivo'].map(f=>document.fonts?.load(f).catch(()=>{}))),new Promise(r=>setTimeout(r,1500))]);

// ---------- pieces ----------
let catalog={pieces:[],bag:null},current=null,passport=null;
const findPiece=id=>id==='SACA'&&catalog.bag?{...catalog.bag,kind:'bag'}:catalog.pieces.find(p=>p.id===id)||null;
const loadPassport=id=>fetch(`data/piezas/${id}.json`).then(r=>r.ok?r.json():null).catch(()=>null);
const isBag=()=>current?.kind==='bag';
const vars=()=>isBag()?{id:'SACA',family:'—',batch:passport?.identity?.batchReference||'LOTE-BCN-PE-001'}:pieceVars(current,passport,lang);
const buildStory=()=>isBag()?createBagScene({lang,passport,catalog:catalog.pieces}):createPieceScene({piece:current,lang,passport});
async function selectPiece(id){current=findPiece(id)||findPiece('M-14');passport=await loadPassport(current.id);
 document.title=`${current.id} · ${current.kind==='bag'?tr(T.bagTitle,lang):tr(T.zoneLabel[current.zone],lang)} · CuevaConectCity`;
 const q=new URLSearchParams(location.search);if(current.id==='M-14')q.delete('p');else q.set('p',current.id);history.replaceState(null,'',location.pathname+(q.toString()?'?'+q:''))}

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
 const v=vars(),bag=isBag(),mm=bag?[1,1]:current.modelMm,pq=`p=${current.id}&lang=${lang}`;
 $('#app').innerHTML=`
 <header class="bar"><a class="mark" href="pasaporte.html?${pq}" aria-label="CUEVA"><img src="assets/brand/cueva.svg" alt="" width="22" height="22"><span>CUEVA</span></a>
  <div class="partners"><img src="assets/brand/port-barcelona-blanco.svg" alt="Port de Barcelona"><span>×</span><img class="pp" src="assets/brand/plasticpeople.svg" alt="PLASTICPeople"></div>
  <div class="langs" role="group" aria-label="Idioma">${LANGS.map(l=>`<button data-lang="${l}" aria-pressed="${l===lang}">${l.toUpperCase()}</button>`).join('')}</div></header>
 <main class="entry-main">
  <div class="entry-visual" aria-hidden="true" style="aspect-ratio:${Math.max(1,Math.min(2.4,mm[0]/mm[1]))}"><div class="qr-frame" style="width:${bag?34:Math.round(Math.max(16,Math.min(40,2500/mm[0]*1.6)))}%"><i></i><i></i><i></i><i></i><img src="assets/qr/${current.id}.png" alt=""><span class="beam"></span></div><div class="piece-outline"><span>${bag?v.batch:`${mm[0]} × ${mm[1]} mm · ${current.family}`}</span></div></div>
  <p class="kicker">${bag?`${t('entryKickerBag')}`:fmt(t('entryKicker'),v)}</p>
  <h1>${bag?t('entryTitleBag'):t('entryTitle')}</h1>
  <p class="lead">${isMobile?(bag?t('entryLeadBag'):t('entryLead')):t('desktopNote')}</p>
  <button id="go" class="go"><span class="go-label">${isMobile?t('start'):t('startDesktop')}</span><span class="go-progress" aria-hidden="true"></span></button>
  <p id="entry-msg" class="msg" role="status">${message}</p>
  <nav class="entry-links">${bag?'':`<a href="pasaporte.html?${pq}">${t('passport')} ↗</a>`}${isMobile?`<a href="?preview=1&${pq}">${t('view3d')}</a>`:''}<a href="qr-piezas.html?lang=${lang}">${t('allPieces')}</a></nav>
  <p class="fine">${isMobile?t('privacy'):''}</p>
 </main>
 <footer class="credit">Powered by <a href="https://8thwall.org/">8th Wall</a> · © 2026 Niantic Spatial, Inc. · <a href="vendor/xr8/LICENSE">XR Engine License</a> · jsQR (Apache-2.0) · three.js (MIT)</footer>`;
 for(const b of document.querySelectorAll('[data-lang]'))b.onclick=()=>{lang=b.dataset.lang;try{localStorage.setItem('m14-lang',lang)}catch{};renderEntry()};
 $('#go').onclick=()=>isMobile||FAKECAM?startAR():startPreview();
}

// ---------- shared overlay (captions, chapters, info cards) ----------
function overlayHTML(ar){return`
 <div class="hud-top"><button id="close" class="icon" aria-label="${t('close')}">✕</button><div id="status" class="status" role="status"></div>
  <button id="sound" class="icon" aria-pressed="${sound.on}" aria-label="${t('sound')}">${sound.on?'♪':'♪̸'}</button>${ar?`<button id="reanchor" class="icon" aria-label="${t('reanchor')}" title="${t('reanchor')}">⟲</button>`:''}</div>
 ${ar?'<div id="reticle" class="reticle" aria-hidden="true"><i></i><i></i><i></i><i></i></div><canvas id="quad" class="quad"></canvas>':''}
 <p id="hint" class="hint" hidden></p>
 <section id="caption" class="caption" hidden><p class="cap-kick"></p><h2 class="cap-title"></h2><p class="cap-text"></p></section>
 <nav id="rail" class="rail" hidden></nav>
 <aside id="info" class="info" hidden><button class="info-x" aria-label="${t('close')}">✕</button><h3></h3><p></p></aside>
 <p class="foot">${t('footnote')}</p>
 ${DEBUG?'<pre id="debug" class="debug"></pre>':''}`}
function renderRail(story){
 const names=(isBag()?T.bagShort:T.chShort).map(c=>tr(c,lang));
 $('#rail').innerHTML=`${names.map((n,i)=>`<button data-ch="${i}"><span>${n}</span><i></i></button>`).join('')}<button id="pause" class="pause" aria-label="${t('pause')}">❚❚</button>`;
 for(const b of document.querySelectorAll('[data-ch]'))b.onclick=e=>{e.stopPropagation();story.seek(TIMELINE.chapters[+b.dataset.ch]);story.setPaused(false);$('#pause').textContent='❚❚'};
 $('#pause').onclick=e=>{e.stopPropagation();story.setPaused(!story.paused);$('#pause').textContent=story.paused?'▶':'❚❚'};
 lastChapter=-2;
}
function bindOverlay(story,{onClose,onReanchor}){
 $('#close').onclick=onClose;
 $('#sound').onclick=()=>{sound.set(!sound.on);$('#sound').setAttribute('aria-pressed',sound.on);$('#sound').textContent=sound.on?'♪':'♪̸'};
 if(onReanchor)$('#reanchor').onclick=onReanchor;
 $('#info .info-x').onclick=()=>$('#info').hidden=true;
 renderRail(story);
}
let lastChapter=-2,infoTimer;
function updateCaption(story,visible){
 const ch=visible?story.chapterAt():-1;$('#caption').hidden=ch<0;$('#rail').hidden=!visible||story.time<TIMELINE.chapters[0]-.5;
 if(ch!==lastChapter){lastChapter=ch;if(ch>=0){const c=story.captions[ch];$('.cap-kick').textContent=c.kick;$('.cap-title').textContent=c.title;$('.cap-text').textContent=c.text;
  $('#caption').classList.remove('in');void $('#caption').offsetWidth;$('#caption').classList.add('in')}
  document.querySelectorAll('[data-ch]').forEach((b,i)=>b.classList.toggle('on',i===ch))}
 if(ch>=0){const a=TIMELINE.chapters[ch],b=TIMELINE.chapters[ch+1]??TIMELINE.loopEnd;document.querySelector(`[data-ch="${ch}"] i`)?.style.setProperty('transform',`scaleX(${Math.min(1,(story.time-a)/(b-a))})`)}
}
function showInfo(hit,story){
 if(!hit)return;const k=hit.kind==='phase'?'phase':hit.kind,c=T.info[k]||T.info.piece,v=story.infoVars||vars();
 $('#info h3').textContent=fmt(tr(c.title,lang),v)+(hit.phase?' · '+hit.phase+' · '+fmt(tr(T.phases[hit.phase],lang),v):'');$('#info p').textContent=fmt(tr(c.text,lang),v);$('#info').hidden=false;
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
 }catch(e){console.error('AR',e);renderEntry(e.user||t('cameraError'))}
}
function runAR(XR8){
 document.body.className='m14 ar';
 $('#app').innerHTML=`<canvas id="camerafeed"></canvas>${overlayHTML(true)}`;
 const canvas=$('#camerafeed'),quad=$('#quad'),qctx=quad.getContext('2d'),worker=new Worker('js/m14ar/qr-worker.js?v=6.0');
 const newAnchor=()=>new QrAnchor({},{forceLevel:isBag()});
 let anchor=newAnchor();
 const S={story:null,scene:null,camera:null,cw:0,ch:0,tracking:'LIMITED',reason:'',busy:false,lastReq:0,reqId:0,meta:new Map(),
  lastCorners:null,lastFoundAt:-1e9,decodedAt:-1e9,flipLocked:false,flip:false,attempt:0,startedAt:performance.now(),firstPoseAt:0,lockedOnce:false,switching:false,
  pos:new THREE.Vector3(),quat:new THREE.Quaternion(),scl:1,hasPose:false,det:{ms:0,n:0,hits:0,err:0,dist:0},fps:0,lastFrame:performance.now(),stopped:false};
 ar={XR8,S,worker};
 const stop=(msg='')=>{if(S.stopped)return;S.stopped=true;try{XR8.stop()}catch{};try{XR8.clearCameraPipelineModules()}catch{};worker.terminate();S.story?.dispose();ar=null;renderEntry(msg)};
 // The story only exists after the engine's onStart (and changes with the piece), so the overlay talks to it through a proxy.
 const proxy={seek:v=>S.story?.seek(v),setPaused:v=>S.story?.setPaused(v),get paused(){return S.story?.paused},get time(){return S.story?.time??0}};
 const resetAnchor=()=>{anchor=newAnchor();S.hasPose=false;S.lockedOnce=false;S.firstPoseAt=0;if(S.story)S.story.root.visible=false;setStatus()};
 bindOverlay(proxy,{onClose:()=>stop(),onReanchor:resetAnchor});

 // Another piece's QR in view: switch the story to it, keeping the camera running.
 async function switchPiece(id){
  if(S.switching||!findPiece(id))return;S.switching=true;
  await selectPiece(id);const old=S.story;S.story=buildStory();S.story.root.visible=false;S.scene.add(S.story.root);S.story.setViewHeight(S.ch);
  if(old){S.scene.remove(old.root);old.dispose()}
  resetAnchor();S.decodedAt=performance.now();renderRail(proxy);flashHint(`${current.id} · ${isBag()?t('bagTitle'):tr(T.zoneLabel[current.zone],lang)}`);navigator.vibrate?.([15,40,15]);S.switching=false;
 }

 worker.onmessage=({data:r})=>{
  S.busy=false;const meta=S.meta.get(r.id);S.meta.delete(r.id);if(!meta||S.stopped||S.switching)return;
  const now=performance.now();S.det.ms=S.det.ms*.8+r.ms*.2;S.det.n++;
  if(!r.found){if(!S.flipLocked)S.attempt++;return}
  if(r.data){const id=idFromQr(r.data);if(!id)return; // another QR in view
   if(id!==current.id){switchPiece(id);return}
   S.decodedAt=now;if(!S.flipLocked){S.flipLocked=true;S.flip=meta.flip}}
  else if(now-S.decodedAt>4000)return; // located-only results need a recent decode of this piece's code
  const corners=r.corners.map(p=>({x:p.x+meta.roi.x,y:p.y+meta.roi.y}));
  S.lastCorners=corners;S.lastFoundAt=now;S.det.hits++;
  const sample=sampleFromCorners(corners,meta,LABEL_MM);if(!sample)return;sample.decoded=!!r.data;
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
 const target={pos:new THREE.Vector3(),quat:new THREE.Quaternion(),m:new THREE.Matrix4(),x:new THREE.Vector3(),y:new THREE.Vector3(),z:new THREE.Vector3()};
 function applyPose(pose,dt){
  const{x,y,z}=target;x.fromArray(pose.x).normalize();z.fromArray(pose.z).normalize();y.crossVectors(z,x).normalize();z.crossVectors(x,y);
  target.m.makeBasis(x,y,z);target.quat.setFromRotationMatrix(target.m);target.pos.fromArray(pose.p);
  if(!S.hasPose){S.pos.copy(target.pos);S.quat.copy(target.quat);S.hasPose=true}
  const k=1-Math.exp(-dt*(pose.locked?10:18));S.pos.lerp(target.pos,k);S.quat.slerp(target.quat,k);
  const root=S.story.root;root.position.copy(S.pos);root.quaternion.copy(S.quat);root.scale.setScalar(1);
 }
 let statusKey='';
 function setStatus(){
  const now=performance.now(),st=anchor.state;let key,text,hint='';
  if(st==='locked'){key=S.tracking==='NORMAL'?'locked':'recovering';text=t(key);if(key==='recovering')hint=t('recoverHint');else if(S.near)hint=t('stepBack')}
  else if(st==='follow'){key='fixing';text=t('fixing');if(S.tracking!=='NORMAL'&&now-(anchor.followSince??now)>1800)hint=t('moveHint')}
  else{key='find';text=t('find');if(now-S.startedAt>4500)hint=t('findHint')}
  text=`${current.id} · ${text}`;
  if(key+hint+text!==statusKey){statusKey=key+hint+text;$('#status').textContent=text;$('#status').dataset.state=key;if(!S.flash){$('#hint').hidden=!hint;$('#hint').textContent=hint}}
  $('#reticle').hidden=st!=='search';
 }
 function flashHint(text){S.flash=true;$('#hint').hidden=false;$('#hint').textContent=text;setTimeout(()=>{S.flash=false;statusKey=''},2600)}

 const raycaster=new THREE.Raycaster();
 canvas.addEventListener('click',e=>{if(!S.story||!S.story.root.visible)return;const r=canvas.getBoundingClientRect();
  raycaster.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1),S.camera);showInfo(S.story.pick(raycaster),S.story)});

 // The engine renders at the canvas' drawing-buffer size: keep it at window size (pixel ratio capped for speed).
 const fit=()=>{const r=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(innerWidth*r);canvas.height=Math.round(innerHeight*r)};
 fit();addEventListener('resize',fit);
 XR8.clearCameraPipelineModules();
 XR8.XrController.configure({disableWorldTracking:FAKECAM,scale:FAKECAM?'responsive':'absolute'}); // desktop harness: no IMU, no SLAM
 XR8.addCameraPipelineModules([
  XR8.GlTextureRenderer.pipelineModule(),XR8.Threejs.pipelineModule(),XR8.XrController.pipelineModule(),
  XR8.CameraPixelArray.pipelineModule({luminance:true,maxDimension:1280}),
  {name:'cueva-qr-anchor',
   onStart:({canvasWidth,canvasHeight})=>{
    S.cw=canvasWidth||canvas.width;S.ch=canvasHeight||canvas.height;
    const{scene,camera,renderer}=XR8.Threejs.xrScene();S.scene=scene;S.camera=camera;camera.near=.005;camera.far=50;camera.updateProjectionMatrix();
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;
    S.story=buildStory();S.story.root.visible=false;scene.add(S.story.root);S.story.setViewHeight(S.ch);
    setStatus();
   },
   onCanvasSizeChange:({canvasWidth,canvasHeight})=>{S.cw=canvasWidth;S.ch=canvasHeight;S.story?.setViewHeight(canvasHeight)},
   onUpdate:({processCpuResult,processGpuResult})=>{
    if(S.stopped||!S.story)return;const now=performance.now(),dt=Math.min(.05,(now-S.lastFrame)/1000);S.lastFrame=now;S.fps=S.fps*.9+(dt>0?1/dt:0)*.1;
    const reality=processCpuResult?.reality;if(reality?.trackingStatus){S.tracking=reality.trackingStatus;S.reason=reality.trackingReason}
    const pa=processGpuResult?.camerapixelarray,interval=anchor.state==='locked'?220:0;
    if(FAKECAM&&reality?.intrinsics){window.__m14ar={S,get anchor(){return anchor}};window.__xrIntrinsics=Array.from(reality.intrinsics);window.__xrCanvas=[S.cw||canvas.width,S.ch||canvas.height]}
    if(reality?.intrinsics&&pa&&!S.busy&&!S.switching&&now-S.lastReq>=interval)request(pa,reality,now);
    const pose=S.switching?null:anchor.pose(now);S.story.root.visible=!!pose;
    if(pose){applyPose(pose,dt);S.story.update(dt,S.camera);playCues(S.story);
     // Right after scanning the phone is a hand-span away: suggest stepping back while it stays that close.
     const d=S.camera.position.distanceTo(S.story.root.position);S.nearFor=d<.2?(S.nearFor||0)+dt:0;S.near=S.nearFor>1.5&&S.story.time>3}
    updateCaption(S.story,!!pose);setStatus();
    if(DEBUG)$('#debug').textContent=`v${VERSION} ${current.id} ${anchor.state} track:${S.tracking}/${S.reason} k~${anchor.scaleEstimate?.toFixed(3)??'-'}\ndet:${S.det.hits}/${S.det.n} ${S.det.ms.toFixed(0)}ms flip:${S.flip}${S.flipLocked?'*':''} err:${(S.det.err*1000).toFixed(2)} d:${(S.det.dist*100).toFixed(1)}cm\nfps:${S.fps.toFixed(0)} canvas:${S.cw}x${S.ch} px:${pa?pa.cols+'x'+pa.rows:'-'} label:${LABEL_MM}mm locks:${anchor.lockCount}`;
   },
   onCameraStatusChange:({status})=>{if(status==='failed')stop(t('cameraError'))},
   onException:e=>{console.error('XR8',e);stop(t('cameraError'))},
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
 const scene=new THREE.Scene();scene.background=new THREE.Color('#0b2731');scene.fog=new THREE.Fog('#0b2731',.9,2.4);
 const camera=new THREE.PerspectiveCamera(38,1,.005,10);camera.position.set(.2,.19,.27);
 const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.03,0);controls.enableDamping=true;controls.minDistance=.14;controls.maxDistance=1.4;controls.maxPolarAngle=Math.PI*.47;controls.autoRotate=true;controls.autoRotateSpeed=.35;controls.update();
 renderer.domElement.addEventListener('pointerdown',()=>controls.autoRotate=false);
 // Stand-in for the real world: a table and the physical model with its printed QR.
 const mm=isBag()?[0,0,0]:current.modelMm,W=mm[0]/1000,D=mm[1]/1000,H=(mm[2]||4)/1000;
 const table=new THREE.Mesh(new THREE.CircleGeometry(1.4,64),new THREE.MeshStandardMaterial({color:'#2b3f43',roughness:.95}));table.rotation.x=-Math.PI/2;table.position.y=isBag()?-.0004:-H-.0002;table.receiveShadow=true;scene.add(table);
 const qr=await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=`assets/qr/${current.id}.png`});
 if(isBag()){const b=bigBag(2.1);b.position.y=-.12;scene.add(b);const lab=new THREE.Mesh(new THREE.PlaneGeometry(.025,.025),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(qr)}));lab.material.map.colorSpace=THREE.SRGBColorSpace;lab.rotation.x=-Math.PI/2;lab.position.y=.0005;scene.add(lab);table.position.y=-.12}
 else{const px=4000,top=document.createElement('canvas');top.width=Math.round(px*W/.3);top.height=Math.round(px*D/.3);{const g=top.getContext('2d'),k=top.width/W;g.fillStyle='#d9d6cc';g.fillRect(0,0,top.width,top.height);g.globalAlpha=.07;for(let i=0;i<6000;i++){g.fillStyle=Math.random()>.5?'#000':'#fff';g.fillRect(Math.random()*top.width,Math.random()*top.height,2,2)}g.globalAlpha=1;
   if(qr){g.imageSmoothingEnabled=false;const s=.025*k,cx=top.width/2+(current.qrCenterMm?.[0]||0)/1000*k,cy=top.height/2+(current.qrCenterMm?.[1]||0)/1000*k;g.drawImage(qr,cx-s/2,cy-s/2,s,s)}}
  const topTex=new THREE.CanvasTexture(top);topTex.colorSpace=THREE.SRGBColorSpace;topTex.anisotropy=8;const side=new THREE.MeshStandardMaterial({color:'#c9c5ba',roughness:.8});
  const model=new THREE.Mesh(new THREE.BoxGeometry(W,H,D),[side,side,new THREE.MeshStandardMaterial({map:topTex,roughness:.75}),side,side,side]);model.position.set(-(current.qrCenterMm?.[0]||0)/1000,-H/2,-(current.qrCenterMm?.[1]||0)/1000);model.castShadow=model.receiveShadow=true;scene.add(model)}
 const story=buildStory();scene.add(story.root);
 bindOverlay(story,{onClose:()=>{renderer.setAnimationLoop(null);ro.disconnect();story.dispose();renderer.dispose();renderEntry()}});
 $('#status').textContent=`${current.id} · 3D`;$('#status').dataset.state='locked';
 const raycaster=new THREE.Raycaster();let down=null;
 renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);
 renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>6)return;const r=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1),camera);showInfo(story.pick(raycaster),story)});
 const reach=isBag()?.62:.42*Math.max(1,Math.max(W,.15)/.15)**.6;
 const ro=new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();if(!host.dataset.fit){host.dataset.fit=1;camera.position.sub(controls.target).setLength(reach/Math.pow(Math.min(1,camera.aspect),.75)).add(controls.target);controls.update()}story.setViewHeight(h*renderer.getPixelRatio())});ro.observe(host);
 let last=performance.now();story.restart();
 renderer.setAnimationLoop(now=>{const dt=Math.min(.05,(now-last)/1000);last=now;controls.update();story.update(dt,camera);playCues(story);updateCaption(story,true);renderer.render(scene,camera)});
 if(DEBUG)window.__m14={story,camera,controls,renderer};
}

// ---------- boot ----------
(async()=>{
 try{catalog=await fetch('data/piezas-ar.json').then(r=>r.json())}catch{}
 await selectPiece((params.get('p')||'M-14').toUpperCase());
 if(FAKECAM){const m=await import('./fakecam.mjs?v=6.0');await m.installFakeCamera({piece:findPiece((params.get('fakeqr')||'').toUpperCase())||current});renderEntry();startAR()}
 else if(params.has('preview'))startPreview();else{renderEntry();if(isMobile)loadEngine().then(()=>$('#go')?.classList.add('ready')).catch(()=>{})}
})();
window.addEventListener('pagehide',()=>{if(ar)try{ar.XR8.stop()}catch{}});
