import {t,lang,dateTime} from './i18n.mjs?v=3.0-surface';
import {CHAPTERS,FAMILIES,choose,storyEvent} from './story-data.mjs?v=3.0-surface';
import {createStoryScene,mountStory} from './story-scene.mjs?v=3.0-surface';
export async function startStoryPreview(){
const $=s=>document.querySelector(s),L=(es,en,ca)=>choose([es,en,ca],lang);
let passport={recordedJourney:[]},story=null,viewer=null,chapter=1,progress=.5,playing=false,manual=false,dashboard=false;
$('#preview-ui').innerHTML=`<section id="scene-caption" class="scene-caption" hidden><p class="eyebrow">${L('EXPLORACIÓN 3D · M-14','3D EXPLORATION · M-14','EXPLORACIÓ 3D · M-14')}</p><h1 id="chapter-title"></h1><p id="chapter-description"></p></section>
<button id="plastic-hotspot" class="hotspot" hidden>PE</button><button id="concrete-hotspot" class="hotspot" hidden>${t('concrete')}</button>
<section id="controls" class="exp-controls" hidden><nav class="chapters" aria-label="${L('Capítulos','Chapters','Capítols')}">${CHAPTERS.map((c,i)=>`<button data-chapter="${i}" aria-pressed="${i===chapter}">${String(i+1).padStart(2,'0')} ${choose(c.name,lang)}</button>`).join('')}</nav><div class="play-row"><button id="play-story">${L('Reproducir · 50 s','Play · 50 s','Reproduir · 50 s')}</button><input id="story-progress" type="range" min="0" max="100" value="50" aria-label="${L('Avance del capítulo','Chapter progress','Progrés del capítol')}"><output id="chapter-count">02 / 05</output></div><div class="tools-row"><button id="layers-button">${L('Separar capas','Separate layers','Separar capes')}</button><button id="dashboard-button" aria-pressed="false">${L('Panel de datos','Data panel','Panell de dades')}</button><button id="adjust-button" aria-expanded="false">${L('Geometría','Geometry','Geometria')}</button></div><div id="layer-control" hidden><label for="separation" class="exp-footnote">${t('separate')}</label><input id="separation" type="range" min="0" max="100" value="50" style="width:100%;accent-color:#82dfc3"></div><p class="exp-footnote" id="event-caption"></p>
<div id="adjust-controls" class="adjust-controls" hidden><div class="adjust-grid"><label>${L('Geometría de prueba','Test geometry','Geometria de prova')}<select id="family">${Object.entries(FAMILIES).map(([name,size])=>`<option value="${name}">${name} · ${size[0]} × ${size[1]} cm</option>`).join('')}</select></label></div><p>${L('M-14 es J2: 15 × 7,5 cm y 4 mm. Las otras familias son geometrías de comparación.','M-14 is J2: 15 × 7.5 cm and 4 mm. Other families are comparison geometries.','M-14 és J2: 15 × 7,5 cm i 4 mm. Les altres famílies són geometries de comparació.')}</p></div></section>
<dialog id="material-sheet" class="material-sheet"><button id="close-material" aria-label="${L('Cerrar','Close','Tancar')}">×</button><p class="eyebrow">M-14 / ${L('COMPOSICIÓN DE PROYECTO','PROJECT COMPOSITION','COMPOSICIÓ DE PROJECTE')}</p><h2 id="material-title"></h2><strong id="material-size"></strong><p id="material-text"></p><p class="micro">${L('Estos espesores son del proyecto. La maqueta mide 4 mm en total; sus capas son una representación visual.','These are project thicknesses. The scale model is 4 mm in total; its layers are a visual representation.','Aquests gruixos són del projecte. La maqueta fa 4 mm en total; les capes són una representació visual.')}</p></dialog>`;
function updateText(){const c=CHAPTERS[chapter];$('#chapter-title').textContent=choose(c.title,lang);$('#chapter-description').textContent=choose(c.text,lang);$('#chapter-count').textContent=String(chapter+1).padStart(2,'0')+' / 05';document.querySelectorAll('[data-chapter]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.chapter)===chapter)));const e=storyEvent(passport,chapter,progress);$('#event-caption').textContent=e?`${L('Lectura histórica','Recorded reading','Lectura històrica')} ${e.phase} · ${dateTime(e.at)} · ${L('no es directo','not live','no és directe')}`:L('Narración ilustrativa · no es directo','Illustrative story · not live','Narració il·lustrativa · no és directe');story?.drawDashboard(e,passport)}
function pause(){playing=false;$('#play-story').textContent=L('Reproducir · 50 s','Play · 50 s','Reproduir · 50 s')}
function setChapter(index,p=.5){chapter=index;progress=p;manual=false;story?.set(chapter,progress);$('#story-progress').value=progress*100;updateText()}
document.querySelectorAll('[data-chapter]').forEach(b=>b.addEventListener('click',()=>{pause();setChapter(Number(b.dataset.chapter))}));
$('#play-story').addEventListener('click',()=>{if(playing){pause();return}playing=true;setChapter(0,0);$('#play-story').textContent=t('pause')});
$('#story-progress').addEventListener('input',e=>{pause();setChapter(chapter,Number(e.target.value)/100)});
$('#layers-button').addEventListener('click',()=>{pause();setChapter(1,.5);$('#layer-control').hidden=!$('#layer-control').hidden});
$('#separation').addEventListener('input',e=>{pause();manual=true;story?.setSeparation(Number(e.target.value)/100)});
$('#dashboard-button').addEventListener('click',e=>{dashboard=!dashboard;story?.setDashboard(dashboard);e.currentTarget.setAttribute('aria-pressed',String(dashboard))});
$('#adjust-button').addEventListener('click',e=>{$('#adjust-controls').hidden=!$('#adjust-controls').hidden;e.currentTarget.setAttribute('aria-expanded',String(!$('#adjust-controls').hidden))});
function material(kind){$('#material-title').textContent=kind==='plastic'?t('plastic'):t('concrete');$('#material-size').textContent=kind==='plastic'?'20 mm':'80 mm';$('#material-text').textContent=kind==='plastic'?t('plasticDesc'):t('concreteDesc');$('#material-sheet').showModal()}
$('#plastic-hotspot').addEventListener('click',()=>material('plastic'));$('#concrete-hotspot').addEventListener('click',()=>material('concrete'));$('#close-material').addEventListener('click',()=>$('#material-sheet').close());
function frame(dt,camera){if(playing){progress+=dt/10;if(progress>=1){if(chapter<4)setChapter(chapter+1,0);else{progress=1;pause()}}if(!manual)story.set(chapter,progress);$('#story-progress').value=progress*100;updateText()}
 story.update(dt,camera);const rect=$('#scene-container').getBoundingClientRect(),bottom=$('#controls').getBoundingClientRect().top;
 for(const kind of['plastic','concrete']){const el=$('#'+kind+'-hotspot');if(chapter!==1){el.hidden=true;continue}const p=story.hotspot(kind).project(camera);const x=rect.left+(p.x*.5+.5)*rect.width,y=rect.top+(-p.y*.5+.5)*rect.height;el.hidden=p.z< -1||p.z>1||x<35||x>innerWidth-35||y<100||y>bottom-20;el.style.left=x+'px';el.style.top=y+'px'}
}

$('#family').value='J2';
$('#family').addEventListener('change',e=>{const size=FAMILIES[e.target.value]||FAMILIES.J2;story.root.scale.set(size[0]/15,.8,size[1]/7.5)});
document.body.classList.add('preview-mode');
story=createStoryScene(lang,{compact:true});story.root.scale.set(1,.8,1);story.set(chapter,progress);
viewer=mountStory($('#scene-container'),story,frame);
$('#gate').hidden=true;$('#preview-ui').hidden=false;$('#controls').hidden=false;$('#scene-caption').hidden=false;updateText();
try{const r=await fetch('data/m14.json');if(r.ok){passport=await r.json();updateText()}}catch{}
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
window.addEventListener('pagehide',()=>{pause();viewer?.dispose()},{once:true});
}
