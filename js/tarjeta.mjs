import {createQrSvg} from './qr.mjs';
const $=s=>document.querySelector(s);
const hosted='https://cueva-m14.edrosyst.chatgpt.site';
const origin=location.protocol==='https:'?location.origin:hosted;
const ar=origin+'/ar.html?screen=1';
$('#phone-qr').innerHTML=createQrSvg(ar,25);$('#phone-link').href=ar;$('#phone-note').textContent='Primera prueba privada: si aparece el acceso de ChatGPT, entra con la misma cuenta que usas aquí.';
$('#qr-url').value=origin+'/';
function labels(){try{const url=new URL($('#qr-url').value);if(url.protocol!=='https:')throw Error('Usa un enlace HTTPS accesible desde el móvil.');$('#label-qrs').replaceChildren(...[25,20].map(mm=>{const f=document.createElement('figure');f.innerHTML=createQrSvg(url.href,mm);const c=document.createElement('figcaption');c.textContent=mm+' × '+mm+' mm · M-14';f.append(c);return f}));$('#qr-status').textContent='Margen blanco incluido. El QR de 20 mm necesita validación física.'}catch(e){$('#qr-status').textContent=e.message}}
$('#generate-qr').addEventListener('click',labels);labels();$('#print-labels').addEventListener('click',()=>window.print());$('#fullscreen').addEventListener('click',()=>$('.screen-target').requestFullscreen?.());
