// Index of every piece with its QR, AR, 3D and passport links (qr-piezas.html).
import {T,tr,pickLang} from './text.mjs?v=6.0';
const lang=pickLang(),L=a=>a[lang==='en'?1:lang==='ca'?2:0];
document.documentElement.lang=lang;
if(lang!=='es'){
 document.getElementById('h').innerHTML=L(['','One QR<br><em>per piece.</em>','Un QR<br><em>per peça.</em>']);
 document.getElementById('l').textContent=L(['','Each label opens its piece\'s animation. Inside the camera, just point at another piece to switch stories.','Cada etiqueta obre l’animació de la seva peça. Dins de la càmera, n’hi ha prou d’apuntar a una altra peça per canviar d’història.']);
 document.getElementById('pdf').textContent=L(['','A4 sheet to print · 25 mm ↗','Full A4 per imprimir · 25 mm ↗']);
 document.getElementById('back').textContent=L(['','← Experience','← Experiència']);
 document.getElementById('n').textContent=L(['','Print at 100 %: the AR computes distance from the real size of the label (25 mm including its white margin). On a screen the QR opens the animation, but anchoring is only exact with the label printed at its size.','Imprimeix al 100 %: l’AR calcula la distància a partir de la mida real de l’etiqueta (25 mm amb el marge blanc). En pantalla el QR obre l’animació, però l’ancoratge només és exacte amb l’etiqueta impresa a la seva mida.']);
}
const cat=await fetch('data/piezas-ar.json').then(r=>r.json());
const groups=[['paseo'],['vial'],['plataforma'],['plaza'],['borde']];
const html=groups.map(([z])=>{const list=cat.pieces.filter(p=>p.zone===z);
 return `<p class="zone">${tr(T.zoneLabel[z],lang).toUpperCase()} · ${list[0].family} · ${list[0].modelMm[0]} × ${list[0].modelMm[1]} mm</p><div class="grid">${list.map(card).join('')}</div>`}).join('')+
 `<p class="zone">${L(['SACA · LOTE','BAG · BATCH','SACA · LOT'])}</p><div class="grid">${card({id:'SACA',url:cat.bag.url,bag:true})}</div>`;
function card(p){const q=p.id==='M-14'?'':`p=${p.id}&`;
 return `<article class="card"><img src="assets/qr/${p.id}.png" alt="QR ${p.id}" loading="lazy"><b>${p.id}</b><small>${p.bag?'LOTE-BCN-PE-001':`${p.position}${p.reuse?' → '+p.reuse:''} · ${p.projectM[0]} × ${p.projectM[1]} m`}</small>
 <nav><a class="ar" href="./?${q}lang=${lang}">AR</a><a href="./?preview=1&p=${p.id}&lang=${lang}">3D</a>${p.bag?'':`<a href="pasaporte.html?p=${p.id}&lang=${lang}">${L(['Pasaporte','Passport','Passaport'])}</a>`}<a href="assets/qr/${p.id}-25mm.svg" download>SVG</a></nav></article>`}
document.getElementById('list').innerHTML=html;
