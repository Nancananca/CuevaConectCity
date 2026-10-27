import {THREE,lights} from './model.mjs';
import {createStoryScene} from './story-scene.mjs?v=3.0-surface';
import {initLanguage,setLanguage,t,lang} from './i18n.mjs?v=3.0-surface';
import {choose} from './story-data.mjs?v=3.0-surface';
import {AnchorSession} from './anchor-session.mjs?v=4.0-pilot';
import {mountInteractiveControls} from './interactive-controls.mjs?v=4.0-pilot';

const $=s=>document.querySelector(s),L=(es,en,ca)=>choose([es,en,ca],lang);
initLanguage();setLanguage(lang);
window.THREE=THREE;
const params=new URLSearchParams(location.search),fullTarget=params.get('target')==='full';
const session=new AnchorSession();
let engine,target,ready=false,compatible=false,starting=false,running=false,runToken=0;
let marker,story,controls,scene,camera,lastFrame=0,lastUi=0,startTimer,shown=false;
let autoAnchor=false,widthMm=25,latestWidth=null,scaleRejected=false;
const report={release:'4.0-pilot',engine:'@8thwall/engine-binary@1.0.0',three:THREE.REVISION,startedAt:new Date().toISOString(),target:fullTarget?'full-square':'official-portrait-crop',modelMm:[150,75,4],anchors:0,imageFound:0,imageLost:0,worldTrackingLost:0,events:[],physicalAlignmentConfirmed:false};
function record(event,detail=''){report.events.push({at:new Date().toISOString(),event,detail});if(report.events.length>150)report.events.shift()}
$('#experience-ui').innerHTML=`
<header class="exp-header"><a href="pasaporte.html?lang=${lang}">${t('back')}</a><span>M–14 / J2</span><button id="stop-ar" hidden>${L('Cerrar cámara','Close camera','Tancar càmera')}</button></header>
<section id="gate" class="exp-gate surface-gate interactive-gate"><div class="gate-inner">
<p class="eyebrow pilot-label">${L('PRUEBA 4.0 · AR INTERACTIVA','PILOT 4.0 · INTERACTIVE AR','PROVA 4.0 · AR INTERACTIVA')}</p>
<h1>${L('Reconoce la pieza.<br><em>Ancla su historia.</em>','Recognize the piece.<br><em>Anchor its story.</em>','Reconeix la peça.<br><em>Ancora la seva història.</em>')}</h1>
<p class="surface-lead">${L('Apunta al QR del centro. Cuando la escena se estabilice, pulsa Anclar aquí. Después podrás explorar las capas y los datos, aunque el QR salga del encuadre.','Point at the QR in the centre. When the scene settles, tap Anchor here. Then explore layers and data even when the QR leaves the camera view.','Apunta al QR del centre. Quan l’escena s’estabilitzi, prem Ancorar aquí. Després podràs explorar les capes i les dades encara que el QR surti de l’enquadrament.')}</p>
<div class="surface-spec"><span>M–14 / J2</span><span>15 × 7,5 cm · 4 mm</span></div>
<ol class="surface-steps"><li><span>01</span><div>${L('Activa la cámara y permite el movimiento del móvil.','Enable the camera and allow motion access.','Activa la càmera i permet el moviment del mòbil.')}</div></li><li><span>02</span><div>${L('Encuadra el QR y mueve el móvil suavemente de lado a lado para reconocer la mesa.','Frame the QR and gently move the phone sideways to recognize the table.','Enquadra el QR i mou el mòbil suaument de costat a costat per reconèixer la taula.')}</div></li><li><span>03</span><div>${L('Ancla una vez. Mantén la maqueta quieta y muévete alrededor.','Anchor once. Keep the model still and move around it.','Ancora un cop. Mantén la maqueta quieta i mou-te al voltant.')}</div></li></ol>
<div class="pilot-options"><label><input id="auto-anchor" type="checkbox">${L('Anclar automáticamente al estabilizarse','Anchor automatically when stable','Ancorar automàticament quan sigui estable')}</label><details><summary>${L('Ajuste de la etiqueta','Label setting','Ajust de l’etiqueta')}</summary><label>${L('Ancho total impreso, con margen blanco','Total printed width, including white margin','Amplada total impresa, amb marge blanc')} <input id="qr-width" type="number" min="20" max="60" step="1" value="25"> mm</label></details></div>
<div class="entry-actions"><button id="start-ar" class="primary" disabled>${L('Preparando la cámara…','Preparing the camera…','Preparant la càmera…')}</button><a class="secondary" href="experiencia.html?view=3d&lang=${lang}">${L('Explorar en 3D sin cámara','Explore in 3D without camera','Explorar en 3D sense càmera')}</a></div>
<p id="gate-message" class="device-note" role="status">${L('Cargando el motor de la prueba. La primera vez puede tardar.','Loading the pilot engine. The first visit may take a moment.','Carregant el motor de la prova. El primer cop pot trigar.')}</p>
<p class="entry-note">${L('Usa el mismo QR impreso de 25 mm, centrado y recto sobre la pieza; deja el lado de 15 cm horizontal respecto a la etiqueta. La cámara del teléfono abre la web: dentro reconoceremos el QR de nuevo para situar la escena.','Use the same 25 mm printed QR, centred and straight on the piece; align the 15 cm edge horizontally to the label. The phone camera opens the website: we recognize the QR again here to position the scene.','Fes servir el mateix QR imprès de 25 mm, centrat i recte sobre la peça; deixa el costat de 15 cm horitzontal respecte de l’etiqueta. La càmera del telèfon obre la web: aquí reconeixerem el QR de nou per situar l’escena.')}</p>
<details class="surface-help"><summary>${L('Sobre esta prueba','About this pilot','Sobre aquesta prova')}</summary><p>${L('Estamos probando reconocimiento inicial y seguimiento del entorno. Si la escena no alinea bien con la pieza, no la ancles: mejora la luz, limpia la lente y acerca el móvil sin perder el enfoque. La mesa debe tener detalles visibles. La estabilidad depende del dispositivo y del entorno; no está validada aún con esta versión.','We are testing initial recognition and environment tracking. If the scene does not align with the piece, do not anchor it: improve lighting, clean the lens and move closer while staying in focus. The table needs visible detail. Stability depends on the device and surroundings; this version has not yet been validated physically.','Estem provant el reconeixement inicial i el seguiment de l’entorn. Si l’escena no s’alinea amb la peça, no l’ancoris: millora la llum, neteja la lent i acosta el mòbil sense perdre l’enfocament. La taula ha de tenir detalls visibles. L’estabilitat depèn del dispositiu i de l’entorn; encara no està validada amb aquesta versió.')}</p><p>${L('El anclaje dura esta sesión. Si mueves la maqueta, pulsa Anclar de nuevo. Al cerrar la cámara o salir de la página tendrás que volver a anclar.','The anchor lasts for this session. If you move the model, tap Anchor again. Closing the camera or leaving the page requires a new anchor.','L’ancoratge dura aquesta sessió. Si mous la maqueta, prem Ancorar de nou. Si tanques la càmera o surts de la pàgina, hauràs de tornar a ancorar.')}</p><a class="entry-more" href="experiencia.html?lang=${lang}">${L('Abrir la AR del móvil · versión anterior ↗','Open the phone’s AR viewer · previous version ↗','Obrir l’AR del mòbil · versió anterior ↗')}</a></details>
<button id="save-pilot" class="pilot-download">${L('Guardar diagnóstico de la prueba','Save pilot diagnostics','Desar diagnòstic de la prova')}</button>
<p class="engine-credit">Powered by <a href="https://8thwall.org/">8th Wall</a> · Copyright © 2026 Niantic Spatial, Inc. All rights reserved. <a href="vendor/xr8/LICENSE">XR Engine License Agreement</a></p>
</div></section>
<div id="tracking" class="tracking-pill" role="status" hidden></div><div id="scan-guide" class="scan-guide" hidden></div>
<div id="anchor-dock" class="anchor-dock" hidden><p id="anchor-hint" role="status"></p><button id="anchor-here" disabled>${L('Anclar aquí','Anchor here','Ancorar aquí')}</button><button id="recover-anchor" class="recovery-button" hidden>${L('Volver a reconocer el QR','Recognize the QR again','Tornar a reconèixer el QR')}</button></div>
<div id="preview-ui" hidden></div>`;

function loadEngine(){
 if(window.XR8)return Promise.resolve(window.XR8);
 return new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>finish(new Error('Engine load timeout')),90000);
  const loaded=()=>finish(null,window.XR8);
  function finish(error,value){clearTimeout(timeout);window.removeEventListener('xrloaded',loaded);error?reject(error):resolve(value)}
  window.addEventListener('xrloaded',loaded,{once:true});
  const script=document.createElement('script');script.src=new URL('vendor/xr8/xr.js',document.baseURI).href;script.async=true;script.dataset.preloadChunks='slam';script.onerror=()=>finish(new Error('Engine download failed'));document.head.append(script);
 });
}
async function prepare(){
 try{
  const [xr,response]=await Promise.all([loadEngine(),fetch(`assets/target/xr8/qr-m14${fullTarget?'-full':''}.json`)]);
  if(!response.ok)throw new Error('Target HTTP '+response.status);
  engine=xr;target=await response.json();target.imagePath=new URL(target.imagePath,document.baseURI).href;
  await engine.loadChunk('slam');
  const allowedDevices=engine.XrConfig.device().MOBILE;
  compatible=engine.XrDevice.isDeviceBrowserCompatible({allowedDevices});
  report.deviceCompatible=compatible;record('prepared',compatible?'compatible':'incompatible');ready=true;
  $('#start-ar').disabled=!compatible;
  $('#start-ar').textContent=compatible?L('Activar cámara','Enable camera','Activar càmera'):L('AR disponible en móviles compatibles','AR requires a compatible mobile device','AR disponible en mòbils compatibles');
  $('#gate-message').textContent=compatible?L('Preparado. La cámara se activa al pulsar el botón.','Ready. The camera starts when you tap the button.','Preparat. La càmera s’activa quan prems el botó.'):L('Abre esta página en Safari de iPhone o en un navegador Android compatible. Desde el ordenador puedes explorar la historia en 3D.','Open this page in iPhone Safari or a compatible Android browser. On a computer, explore the story in 3D.','Obre aquesta pàgina a Safari d’iPhone o en un navegador Android compatible. A l’ordinador pots explorar la història en 3D.');
 }catch(error){record('load-error',String(error));$('#start-ar').textContent=L('No se ha podido preparar la AR','AR could not be prepared','No s’ha pogut preparar l’AR');$('#gate-message').textContent=L('Recarga la página con conexión a Internet. También puedes abrir el visor 3D o la AR de la versión anterior.','Reload with an Internet connection. You can also open the 3D viewer or the previous AR version.','Recarrega la pàgina amb connexió a Internet. També pots obrir el visor 3D o l’AR de la versió anterior.');console.error('M14 pilot prepare',error)}
}
function setTracking(status){
 if(status!=='NORMAL'&&status!=='LIMITED')return;
 if(session.tracking!==status){if(session.locked&&status==='LIMITED')report.worldTrackingLost++;record('tracking',status)}
 session.setTracking(status);
}
function observe(detail){
 if(!running||detail.name!==target.name||session.locked)return;
 latestWidth=detail.scale*detail.scaledWidth;
 scaleRejected=!(Number.isFinite(latestWidth)&&latestWidth>=session.expectedWidth*.75&&latestWidth<=session.expectedWidth*1.25);
 session.observe(detail,performance.now());
}
function anchor(){
 if(!running||!session.anchor(performance.now()))return;
 report.anchors++;report.lastEstimatedCropWidthMm=latestWidth*1000;record('anchored',autoAnchor?'automatic':'button');shown=false;updateUi(performance.now());
}
function reanchor(){
 if(!running)return;session.reset();shown=false;controls?.setVisible(false);if(marker)marker.visible=false;record('reanchor');updateUi(performance.now());
}
function updateUi(now){
 const locked=!!session.locked,visible=running&&locked&&session.visible(now);
 if(visible!==shown){controls?.setVisible(visible);shown=visible}
 $('#tracking').hidden=!running;$('#tracking').classList.toggle('found',visible);
 $('#tracking').textContent=locked?(session.tracking==='NORMAL'?L('Anclado · puedes mover el móvil','Anchored · move your phone around','Ancorat · pots moure el mòbil'):L('Recuperando el entorno…','Recovering tracking…','Recuperant l’entorn…')):L('Reconociendo la pieza…','Recognizing the piece…','Reconeixent la peça…');
 $('#anchor-dock').hidden=!running||visible;$('#scan-guide').hidden=!running||locked||!!session.pose;
 $('#anchor-here').hidden=locked;$('#anchor-here').disabled=!session.ready(now);
 $('#recover-anchor').hidden=!locked||visible;
 $('#anchor-hint').textContent=locked?L('Se ha perdido el seguimiento del entorno. Vuelve a mirar la mesa y muévete despacio. Si no se recupera, vuelve a reconocer el QR.','Environment tracking was lost. Look back at the table and move slowly. If it does not recover, recognize the QR again.','S’ha perdut el seguiment de l’entorn. Torna a mirar la taula i mou-te a poc a poc. Si no es recupera, torna a reconèixer el QR.'):
 session.tracking!=='NORMAL'?L('Encuadra el QR y mueve el móvil suavemente de lado a lado para reconocer el entorno.','Frame the QR and gently move the phone sideways to recognize the surroundings.','Enquadra el QR i mou el mòbil suaument de costat a costat per reconèixer l’entorn.'):
 scaleRejected?L('QR detectado. Mueve el móvil suavemente para ajustar la escala. Comprueba que la etiqueta mide lo indicado, incluido el margen blanco.','QR detected. Move the phone gently to estimate scale. Check that the label matches the stated width, including its white margin.','QR detectat. Mou el mòbil suaument per ajustar l’escala. Comprova que l’etiqueta fa l’amplada indicada, amb el marge blanc.'):
 session.ready(now)?L('Comprueba que el contorno coincide con la pieza y pulsa Anclar aquí.','Check that the outline matches the piece, then tap Anchor here.','Comprova que el contorn coincideix amb la peça i prem Ancorar aquí.'):
 session.pose?L('QR reconocido. Mantén el móvil estable un instante…','QR recognized. Hold steady for a moment…','QR reconegut. Mantén el mòbil estable un instant…'):
 L('Acércate al QR del centro sin perder el enfoque. Mantén visibles sus bordes blancos.','Move closer to the central QR while staying in focus. Keep its white border visible.','Acosta’t al QR del centre sense perdre l’enfocament. Mantén visibles les vores blanques.');
}
function setupScene(){
 ({scene,camera}=engine.Threejs.xrScene());
 camera.near=.005;camera.far=100;camera.updateProjectionMatrix();
 lights(scene);marker=new THREE.Group();marker.visible=false;scene.add(marker);
 const meterModel=new THREE.Group();meterModel.rotation.x=Math.PI/2;meterModel.position.z=-.004;meterModel.scale.set(.05,.04,.05);marker.add(meterModel);
 story=createStoryScene(lang,{compact:true});meterModel.add(story.root);story.setSeparation(0);
 controls=mountInteractiveControls(story,{isVisible:()=>running&&!!session.locked&&session.visible(performance.now()),onReanchor:reanchor});
 controls.setVisible(false);lastFrame=performance.now();record('scene-ready');
}
function onFrame({processCpuResult}){
 if(!running||!marker)return;
 const now=performance.now(),dt=Math.min(.06,(now-lastFrame)/1000);lastFrame=now;
 const reality=processCpuResult?.reality;if(reality?.trackingStatus)setTracking(reality.trackingStatus);
 if(autoAnchor&&session.ready(now))anchor();
 const pose=session.current();marker.visible=session.visible(now);
 if(pose){marker.position.copy(pose.position);marker.quaternion.copy(pose.rotation)}
 marker.updateWorldMatrix(true,true);controls.frame(dt,camera);
 if(now-lastUi>120){lastUi=now;updateUi(now)}
}
function stop(reason='closed'){
 const wasActive=starting||running;runToken++;starting=running=false;clearTimeout(startTimer);
 if(wasActive){try{engine?.stop()}catch{}record('stopped',reason)}
 controls?.setVisible(false);story?.dispose();marker?.removeFromParent();marker=story=controls=scene=camera=null;
 session.reset();session.setTracking('LIMITED');shown=false;$('#preview-ui').replaceChildren();$('#preview-ui').hidden=true;
 for(const id of['tracking','anchor-dock','scan-guide','stop-ar'])$('#'+id).hidden=true;
 $('#gate').hidden=false;$('#start-ar').disabled=!(ready&&compatible);$('#start-ar').textContent=L('Activar cámara','Enable camera','Activar càmera');
}
function fail(error){
 if(!starting&&!running)return;
 record('session-error',typeof error==='object'?String(error.message||error.type||error.permission||'unknown'):String(error));console.error('M14 pilot session',error);
 stop('error');$('#gate-message').textContent=L('No se ha podido iniciar o mantener la AR. Permite cámara y movimiento en el navegador y vuelve a intentarlo. Si continúa, abre la AR del móvil o el visor 3D.','AR could not start or continue. Allow camera and motion in your browser and retry. If this continues, use the phone’s AR viewer or the 3D viewer.','No s’ha pogut iniciar o mantenir l’AR. Permet càmera i moviment al navegador i torna-ho a provar. Si continua, obre l’AR del mòbil o el visor 3D.');
}
$('#start-ar').addEventListener('click',async()=>{
 if(!ready||!compatible||starting||running)return;
 widthMm=Number($('#qr-width').value);
 if(!Number.isFinite(widthMm)||widthMm<20||widthMm>60){$('#gate-message').textContent=L('Indica un ancho entre 20 y 60 mm. La pegatina original mide 25 mm.','Enter a width between 20 and 60 mm. The original label is 25 mm.','Indica una amplada entre 20 i 60 mm. L’adhesiu original fa 25 mm.');return}
 starting=true;const token=++runToken;$('#start-ar').disabled=true;
 // Invoke iOS permission prompts directly from the user's click, before awaiting.
 const permissions=[];
 for(const api of[window.DeviceMotionEvent,window.DeviceOrientationEvent])if(typeof api?.requestPermission==='function'){try{permissions.push(api.requestPermission())}catch(error){permissions.push(Promise.reject(error))}}
 try{
  const results=await Promise.all(permissions);if(token!==runToken||document.hidden){stop('interrupted-start');return}
  if(results.some(result=>result!=='granted'))throw new Error('Motion permission denied');
  autoAnchor=$('#auto-anchor').checked;session.reset();session.setTracking('LIMITED');
  session.expectedWidth=widthMm/1000*target.properties.width/target.properties.originalWidth;
  report.labelWidthMm=widthMm;report.expectedCropWidthMm=session.expectedWidth*1000;report.autoAnchor=autoAnchor;
  latestWidth=null;scaleRejected=false;engine.clearCameraPipelineModules();
  engine.XrController.configure({disableWorldTracking:false,scale:'absolute',imageTargetData:[target]});
  engine.addCameraPipelineModules([
   engine.GlTextureRenderer.pipelineModule(),engine.Threejs.pipelineModule(),engine.XrController.pipelineModule(),
   {name:'m14-qr-world-anchor',onStart:()=>{if(token!==runToken)return;try{running=true;starting=false;clearTimeout(startTimer);setupScene();$('#gate').hidden=true;$('#stop-ar').hidden=false;updateUi(performance.now())}catch(error){fail(error)}},
    onUpdate:onFrame,onException:fail,
    onCameraStatusChange:({status})=>{record('camera',status);if(status==='failed')fail(new Error('Camera failed'))},
    listeners:[
     {event:'reality.trackingstatus',process:({detail})=>setTracking(detail.status)},
     {event:'reality.imagefound',process:({detail})=>{if(detail.name!==target.name)return;report.imageFound++;record('image-found');observe(detail)}},
     {event:'reality.imageupdated',process:({detail})=>observe(detail)},
     {event:'reality.imagelost',process:({detail})=>{if(detail.name!==target.name)return;report.imageLost++;record('image-lost',session.locked?'anchor-preserved':'not-anchored');session.imageLost();scaleRejected=false}},
    ]}
  ]);
  $('#gate-message').textContent=L('Permite la cámara cuando te lo pida el navegador…','Allow camera access when your browser asks…','Permet la càmera quan t’ho demani el navegador…');
  startTimer=setTimeout(()=>fail(new Error('Camera start timeout')),60000);
  engine.run({canvas:$('#camerafeed'),allowedDevices:engine.XrConfig.device().MOBILE,cameraConfig:{direction:engine.XrConfig.camera().BACK}});
 }catch(error){fail(error)}
});
$('#anchor-here').addEventListener('click',anchor);$('#recover-anchor').addEventListener('click',reanchor);
$('#stop-ar').addEventListener('click',()=>{stop();$('#gate-message').textContent=L('Cámara cerrada. Puedes guardar el diagnóstico o volver a probar.','Camera closed. Save the diagnostics or try again.','Càmera tancada. Pots desar el diagnòstic o tornar a provar.')});
$('#save-pilot').addEventListener('click',()=>{
 const data={...report,savedAt:new Date().toISOString(),tracking:session.tracking,anchorActive:!!session.locked,userAgent:navigator.userAgent,physicalAlignmentConfirmed:false,note:'Local diagnostic only. Image recognition/anchor counts do not certify alignment, physical scale or drift. No camera frames are included.'};
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='M14-AR-interactiva-diagnostico.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
});
addEventListener('pagehide',()=>stop('pagehide'));
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(running||starting)){stop('background');$('#gate-message').textContent=L('La cámara se cerró al salir. Actívala para reconocer y anclar de nuevo.','The camera closed when you left. Enable it to recognize and anchor again.','La càmera s’ha tancat en sortir. Activa-la per reconèixer i ancorar de nou.')}});
prepare();
