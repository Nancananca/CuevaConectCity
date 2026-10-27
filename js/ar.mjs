import {initLanguage,setLanguage,t,lang} from './i18n.mjs';
import {selectJourney,phaseText} from './domain.mjs';
const $=s=>document.querySelector(s);
initLanguage();setLanguage(lang);
const words={loading:['Preparando cámara y seguimiento…','Preparing camera and tracking…','Preparant càmera i seguiment…'],found:['M-14 reconocida · mueve el móvil despacio','M-14 found · move slowly','M-14 reconeguda · mou-te a poc a poc'],find:['Encuadra la tarjeta M-14 completa','Frame the entire M-14 card','Enquadra tota la targeta M-14'],https:['Abre esta experiencia desde su enlace HTTPS en Safari o Chrome.','Open the HTTPS link in Safari or Chrome.','Obre l’enllaç HTTPS a Safari o Chrome.'],error:['No se pudo iniciar la cámara. Abre el enlace en Safari o Chrome, permite la cámara y vuelve a intentarlo.','Camera could not start. Open in Safari or Chrome, allow camera access and try again.','No s’ha pogut iniciar la càmera. Obre Safari o Chrome, permet la càmera i torna-ho a provar.'],ready:['Capas de M-14 · modelo de proyecto','M-14 layers · project model','Capes de M-14 · model de projecte']};
const word=k=>words[k][lang==='en'?1:lang==='ca'?2:0];
let mind,anchor,piece,placement,orientation,active=false,busy=false,journey=[],step=0,playing=false,elapsed=0,last=0,found=false,epoch=0;
const message=m=>{$('#ar-message').textContent=m};
const status=()=>{$('#tracking-status').textContent=word(found?'found':'find');$('#tracking-status').classList.toggle('found',found);$('#scan-frame').hidden=found};
function stopReplay(){playing=false;$('#ar-play').textContent=t('arReplay')}
function phase(){if(!journey.length)return;piece.setPhase(journey[step].phase);$('#ar-phase-name').textContent=journey[step].phase+' · '+phaseText(journey[step].phase,lang)[0]}
function align(){if(!placement)return;const w=Number($('#width').value),marker=Number($('#marker-width').value);$('#width-value').textContent=w+' cm';orientation.scale.setScalar(w/(3*marker));orientation.rotation.set(Math.PI/2,0,0);placement.rotation.z=Number($('#angle').value)*Math.PI/180;placement.position.set(Number($('#offset-x').value)/marker,Number($('#offset-y').value)/marker,Number($('#offset-z').value)/marker)}
for(const id of['width','marker-width','offset-x','offset-y','offset-z','angle'])$('#'+id).addEventListener('input',align);
$('#ar-explode').addEventListener('input',e=>{stopReplay();piece?.setSeparation(Number(e.target.value)/100);$('#ar-explode-value').textContent=e.target.value+' %';$('#ar-phase-name').textContent=word('ready')});
$('#ar-play').addEventListener('click',()=>{if(playing){stopReplay();return}if(!piece||!journey.length)return;playing=true;step=0;elapsed=0;$('#ar-play').textContent=t('pause');phase()});
function halt(note){epoch++;active=false;busy=false;found=false;stopReplay();mind?.renderer.setAnimationLoop(null);mind?.controller?.stopProcessVideo();mind?.video?.srcObject?.getTracks().forEach(track=>track.stop());mind?.video?.remove();if(mind)mind.video=null;mind?.controller?.dispose();mind?.controller?.worker?.terminate();if(mind)mind.controller=null;if(anchor){anchor.visible=false;anchor.group.visible=false}$('#ar-gate').hidden=false;$('#ar-controls').hidden=true;$('#tracking-status').hidden=true;$('#scan-frame').hidden=true;$('#ar-stop').hidden=true;$('#ar-start').disabled=false;if(note)message(note)}
$('#ar-stop').addEventListener('click',()=>halt(t('arPauseHidden')));
$('#ar-start').addEventListener('click',async()=>{
 if(active||busy)return;
 if(!isSecureContext||!navigator.mediaDevices?.getUserMedia){message(word('https'));return}
 busy=true;const run=++epoch;$('#ar-start').disabled=true;message(word('loading'));
 try{
  const [{MindARThree},{THREE,createPiece,lights},r]=await Promise.all([import('../vendor/mindar-image-three.prod.js'),import('./model.mjs'),fetch('assets/target/m14.mind')]);
  if(!r.ok)throw Error('Target missing');await r.arrayBuffer();if(run!==epoch)return;
  if(!mind){mind=new MindARThree({container:$('#ar-container'),imageTargetSrc:'assets/target/m14.mind',maxTrack:1,uiLoading:'no',uiScanning:'no',uiError:'no',warmupTolerance:3,missTolerance:5});
   // Guard the library resize handler during camera permission and cleanup.
   const resize=mind.resize.bind(mind);mind.resize=()=>{if(mind.video&&mind.controller)resize()};
   mind.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));mind.renderer.outputColorSpace=THREE.SRGBColorSpace;mind.renderer.toneMapping=THREE.ACESFilmicToneMapping;mind.renderer.toneMappingExposure=1.15;
   lights(mind.scene);anchor=mind.addAnchor(0);placement=new THREE.Group();orientation=new THREE.Group();placement.add(orientation);anchor.group.add(placement);piece=createPiece();orientation.add(piece.root);align();
   anchor.onTargetFound=()=>{found=true;status()};anchor.onTargetLost=()=>{found=false;status()};
  }
  // Keep ownership of late permission responses: a hidden page must not retain a stream.
  mind._startVideo=async()=>{
   const stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}}});
   if(run!==epoch||document.hidden){stream.getTracks().forEach(track=>track.stop());throw Error('Camera cancelled')}
   const video=document.createElement('video');video.autoplay=true;video.muted=true;video.playsInline=true;video.setAttribute('playsinline','');video.style.position='absolute';mind.video=video;$('#ar-container').append(video);
   await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Camera timeout')),15000);video.addEventListener('loadedmetadata',()=>{clearTimeout(timer);video.width=video.videoWidth;video.height=video.videoHeight;resolve()},{once:true});video.srcObject=stream;video.play().catch(reject)});
   if(run!==epoch)throw Error('Camera cancelled');
  };
  await mind.start();if(run!==epoch||document.hidden){halt(t('arPauseHidden'));return}
  active=true;busy=false;$('#ar-gate').hidden=true;$('#ar-controls').hidden=false;$('#tracking-status').hidden=false;$('#ar-stop').hidden=false;status();
  last=performance.now();mind.renderer.setAnimationLoop(now=>{const dt=Math.min(.08,(now-last)/1000);last=now;if(playing&&found){elapsed+=dt;if(elapsed>4.5){elapsed=0;if(++step>=journey.length)stopReplay();else phase()}}piece.update(dt);mind.renderer.render(mind.scene,mind.camera)});
 }catch(error){console.error('AR start failed',error);if(run===epoch)halt(word('error'))}
});
try{const r=await fetch('data/m14.json');journey=selectJourney(await r.json())}catch{}$('#ar-play').disabled=!journey.length;
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(active||busy))halt(t('arPauseHidden'))});
window.addEventListener('pagehide',()=>halt());
if(new URLSearchParams(location.search).get('screen')==='1'){$('#marker-width').value='16';message(lang==='es'?'Apunta a la tarjeta que aparece en el PC. Encuadra sus cuatro esquinas, evita reflejos y empieza a unos 40–60 cm.':word('find'))}
