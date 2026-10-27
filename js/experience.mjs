import {initLanguage,setLanguage,t,lang} from './i18n.mjs?v=3.0-surface';
import {choose} from './story-data.mjs?v=3.0-surface';
import {deviceRoute,nativeLinks,PUBLIC_BASE,SURFACE_RELEASE} from './surface-ar.mjs?v=3.0-surface';
const $=s=>document.querySelector(s),L=(es,en,ca)=>choose([es,en,ca],lang);
initLanguage();setLanguage(lang);
const params=new URLSearchParams(location.search),preview=params.get('view')==='3d';
const previewUrl='experiencia.html?view=3d&lang='+lang;
const entryUrl='experiencia.html?lang='+lang;
$('#experience-ui').innerHTML=`
<header class="exp-header"><a href="pasaporte.html?lang=${lang}">${t('back')}</a><span>M–14 / J2</span>${preview?`<a class="surface-return" href="${entryUrl}">${L('Abrir AR ↗','Open AR ↗','Obrir AR ↗')}</a>`:''}</header>
<section class="exp-gate surface-gate" id="gate"><div class="gate-inner">
<p class="eyebrow">${L('EXPERIENCIA 3.0 · AR EN TU ESPACIO','EXPERIENCE 3.0 · AR IN YOUR SPACE','EXPERIÈNCIA 3.0 · AR AL TEU ESPAI')}</p>
<h1>${L('Colócala una vez.<br><em>Explórala alrededor.</em>','Place it once.<br><em>Walk around it.</em>','Col·loca-la un cop.<br><em>Explora-la al voltant.</em>')}</h1>
<p class="surface-lead">${L('El QR te trae hasta aquí. Después, el móvil sitúa la animación sobre una superficie: ya no necesita seguir viendo la etiqueta.','The QR brings you here. Your phone then places the animation on a surface: it no longer needs to keep seeing the label.','El QR et porta fins aquí. Després, el mòbil situa l’animació sobre una superfície: ja no necessita continuar veient l’etiqueta.')}</p>
<div class="surface-spec"><span>M–14 / J2</span><span>15 × 7,5 cm · 4 mm</span></div>
<ol class="surface-steps"><li><span>01</span><div>${L('Abre la AR del móvil.','Open your phone’s AR viewer.','Obre l’AR del mòbil.')}</div></li><li><span>02</span><div>${L('Apunta a la mesa y coloca la escena.','Point at the table and place the scene.','Apunta a la taula i col·loca l’escena.')}</div></li><li><span>03</span><div>${L('Muévete alrededor y descubre sus capas.','Walk around it and discover its layers.','Mou-te al voltant i descobreix-ne les capes.')}</div></li></ol>
<div class="entry-actions"><a id="native-ar" class="primary native-link" rel="ar" href="assets/models/m14-j2.usdz" hidden><img src="assets/models/m14-j2.png" alt=""><span>${L('Colocar M-14 en mi espacio','Place M-14 in my space','Col·locar M-14 al meu espai')}</span></a><a id="android-ar" class="primary" href="${previewUrl}" hidden>${L('Colocar M-14 en mi espacio','Place M-14 in my space','Col·locar M-14 al meu espai')}</a></div>
<p id="device-note" class="device-note" role="status"></p>
<div id="desktop-qr" class="desktop-qr" hidden><img src="assets/target/qr-m14.png" width="1025" height="1025" alt="${L('Escanea para abrir en tu móvil','Scan to open on your phone','Escaneja per obrir al teu mòbil')}"><p>${L('Escanea con la cámara de tu móvil.<br>iPhone y Android compatibles.','Scan with your phone’s camera.<br>Compatible iPhone and Android devices.','Escaneja amb la càmera del mòbil.<br>iPhone i Android compatibles.')}</p></div>
<a class="secondary surface-preview" href="${previewUrl}">${L('Explorar historia en 3D · sin cámara','Explore the 3D story · no camera','Explorar la història en 3D · sense càmera')}</a>
<p class="entry-note">${L('La animación AR se repite en bucle. Los capítulos, materiales y datos interactivos están en el visor 3D.','The AR animation loops. Interactive chapters, materials and data are in the 3D viewer.','L’animació AR es repeteix en bucle. Els capítols, materials i dades interactives són al visor 3D.')}</p>
<details class="surface-help"><summary>${L('Colocación y compatibilidad','Placement and compatibility','Col·locació i compatibilitat')}</summary><p>${L('Colócala una vez sobre la mesa y alinéala a mano con la maqueta. La lectura del QR no fija automáticamente su posición. Mantén la pieza física quieta durante la prueba.','Place it once on the table and align it manually with the scale model. Reading the QR does not automatically fix its position. Keep the physical piece still during the trial.','Col·loca-la un cop sobre la taula i alinea-la a mà amb la maqueta. Llegir el QR no en fixa automàticament la posició. Mantén la peça física quieta durant la prova.')}</p><p>${L('Usa una superficie con detalles y buena luz, sin reflejos. Si aparece solo una vista 3D, ese móvil o su visor no tiene la AR disponible. Puedes seguir explorando sin cámara.','Use a detailed surface in good light, without reflections. If only a 3D view appears, AR is not available on that phone or viewer. You can keep exploring without a camera.','Fes servir una superfície amb detalls i bona llum, sense reflexos. Si només apareix una vista 3D, aquell mòbil o visor no té l’AR disponible. Pots continuar explorant sense càmera.')}</p><p>${L('El visor nativo solicita los permisos de cámara. Esta página no inicia el seguimiento visual del QR.','The native viewer requests camera permissions. This page does not start visual QR tracking.','El visor natiu demana els permisos de càmera. Aquesta pàgina no inicia el seguiment visual del QR.')}</p></details>
<p id="gate-message" class="entry-note" role="status"></p>
<a class="entry-more" href="tarjeta.html">${L('QR y guía de prueba ↗','QR and trial guide ↗','QR i guia de prova ↗')}</a>
</div></section><div id="preview-ui" hidden></div>`;

let config={canonicalUrl:PUBLIC_BASE};
try{const r=await fetch('data/deployment.json',{cache:'no-store',signal:AbortSignal.timeout(3500)});if(r.ok)config=await r.json()}catch{}
let links;try{links=nativeLinks({baseUrl:config.canonicalUrl,lang})}catch{links=nativeLinks({lang})}
$('#native-ar').href=links.quickLook;$('#android-ar').href=links.androidIntent;
let quickLook=false;try{quickLook=$('#native-ar').relList.supports('ar')}catch{}
const route=deviceRoute({userAgent:navigator.userAgent,platform:navigator.platform,maxTouchPoints:navigator.maxTouchPoints,quickLook});
if(route==='quick-look'){
 $('#native-ar').hidden=false;
 $('#device-note').textContent=L('Se abrirá el visor AR de iPhone o iPad.','The iPhone or iPad AR viewer will open.','S’obrirà el visor AR de l’iPhone o l’iPad.');
}else if(route==='android'){
 $('#android-ar').hidden=false;
 $('#device-note').textContent=L('Se abrirá el visor de Google. En móviles sin AR disponible, mostrará el modelo en 3D.','Google’s viewer will open. On phones without available AR, it will show the model in 3D.','S’obrirà el visor de Google. En mòbils sense AR disponible, mostrarà el model en 3D.');
}else if(route==='apple-browser'){
 $('#device-note').textContent=L('Abre esta página en Safari para probar la AR de iPhone o iPad. Aquí puedes explorar la historia en 3D.','Open this page in Safari to try iPhone or iPad AR. You can explore the 3D story here.','Obre aquesta pàgina a Safari per provar l’AR de l’iPhone o l’iPad. Aquí pots explorar la història en 3D.');
}else{
 $('#desktop-qr').hidden=false;
 $('#device-note').textContent=L('La AR se abre desde un móvil compatible.','AR opens on a compatible phone.','L’AR s’obre des d’un mòbil compatible.');
}
for(const id of['native-ar','android-ar'])$('#'+id).addEventListener('click',()=>{
 try{sessionStorage.setItem('m14-native-last-launch',JSON.stringify({release:SURFACE_RELEASE,route,at:new Date().toISOString(),placementConfirmed:false}))}catch{}
});
if(preview){
 try{const {startStoryPreview}=await import('./story-preview.mjs?v=3.0-surface');await startStoryPreview();
 if(params.get('ar')==='unavailable'){
  const note=document.createElement('div');note.className='native-fallback';note.setAttribute('role','status');
  const copy=document.createElement('span');copy.textContent=L('El visor AR no se ha podido abrir. Puedes explorar la pieza en 3D.','The AR viewer could not open. You can explore the piece in 3D.','El visor AR no s’ha pogut obrir. Pots explorar la peça en 3D.');
  const close=document.createElement('button');close.textContent='×';close.setAttribute('aria-label',L('Cerrar aviso','Dismiss notice','Tancar avís'));close.addEventListener('click',()=>note.remove());note.append(copy,close);$('#experience-ui').append(note);
 }
 }catch(err){console.error('3D preview',err);$('#gate-message').textContent=t('failed3d');$('#gate').hidden=false;$('#preview-ui').hidden=true;document.body.classList.remove('preview-mode')}
}
