import {THREE,createPiece,lights} from './model.mjs';
import {OrbitControls} from '../vendor/OrbitControls.js';
import {CHAPTERS,choose,smooth,clamp} from './story-data.mjs?v=3.0-surface';
export function createStoryScene(lang='es',{compact=false}={}){
 const root=new THREE.Group(),travel=new THREE.Group(),piece=createPiece();root.add(travel);travel.add(piece.root);
 const environment=new THREE.Group();root.add(environment);const mint=0x71dcc1,ink=0x143a44;
 const mat=(color,opacity=1)=>new THREE.MeshStandardMaterial({color,roughness:.8,transparent:opacity<1,opacity,depthWrite:opacity===1});
 const lineMat=new THREE.LineBasicMaterial({color:mint,transparent:true,opacity:.55});
 const line=points=>new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p))),lineMat);
 const box=(w,h,d,color,x,y,z,parent=environment)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));o.position.set(x,y,z);parent.add(o);return o};
 const base=new THREE.Mesh(new THREE.RingGeometry(2.1,2.12,80),new THREE.MeshBasicMaterial({color:mint,side:THREE.DoubleSide,transparent:true,opacity:.3}));base.rotation.x=-Math.PI/2;base.position.y=-.055;environment.add(base);
 const origin=new THREE.Group();environment.add(origin);const bag=box(.55,.65,.55,0xd5cbb3,-2.03,.3,0,origin);for(const x of[-2.22,-1.84]){const loop=new THREE.Mesh(new THREE.TorusGeometry(.13,.015,5,20,Math.PI),mat(0x6a8b7b));loop.position.set(x,.65,0);origin.add(loop)}
 for(let j=0;j<8;j++){const flap=box(.14,.04,.2,j%2?mint:0x325d56,-2.25+(j%3)*.17,.65+Math.floor(j/3)*.03,-.15+(j%2)*.25,origin);flap.rotation.y=j*.7}
 const chips=new THREE.Group();environment.add(chips);for(let i=0;i<42;i++){const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(.025+(i%5)*.009,0),mat([mint,0x2d7b71,0xb7caa4][i%3]));chips.add(mesh)}
 const places=new THREE.Group();environment.add(places);const slots=[];for(const x of[-1.02,1.02]){const outline=line([[-.82,0,-.47],[.82,0,-.47],[.82,0,.47],[-.82,0,.47],[-.82,0,-.47]]);outline.position.set(x,-.02,0);places.add(outline);slots.push(outline)}
 const path=line([[-1.03,.02,1.07],[-1.03,.02,1.35],[1.03,.02,1.35],[1.03,.02,1.07]]);places.add(path);
 function textTexture(text){const c=document.createElement('canvas');c.width=512;c.height=128;const g=c.getContext('2d');g.fillStyle='#b7e7d8';g.font='500 40px monospace';g.textAlign='center';g.fillText(text,256,74);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;return texture}
 for(const [i,title] of['P-14','Q-01'].entries()){const label=new THREE.Mesh(new THREE.PlaneGeometry(.9,.225),new THREE.MeshBasicMaterial({map:textTexture(title),transparent:true,side:THREE.DoubleSide,depthWrite:false}));label.rotation.x=-Math.PI/2;label.position.set(i?1.02:-1.02,.01,.86);places.add(label)}
 const quay=new THREE.Group();environment.add(quay);for(let i=0;i<7;i++){const tile=box(.5,.018,.36,ink,-1.75+i*.58,-.04,-1.17,quay);tile.material=mat(0x457b7d,.3)}
 const mast=line([[-1.85,0,-1.5],[-1.85,.9,-1.5],[-.8,.9,-1.5],[-1.85,.45,-1.5]]);quay.add(mast);
 const halo=new THREE.Mesh(new THREE.TorusGeometry(1.85,.014,6,80),new THREE.MeshBasicMaterial({color:mint,transparent:true,opacity:.7}));halo.rotation.x=-Math.PI/2;environment.add(halo);
 const c=document.createElement('canvas');c.width=768;c.height=420;const ctx=c.getContext('2d'),texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
 const dashboard=new THREE.Mesh(new THREE.PlaneGeometry(2.05,1.12),new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide,depthTest:false}));dashboard.position.set(0,1.75,-.6);dashboard.renderOrder=10;root.add(dashboard);dashboard.visible=false;
 let chapter=1,progress=.45,manual=null,footprint='project',eventKey='';
 const centeredFrame=line([[-1.5,-.04,-.75],[1.5,-.04,-.75],[1.5,-.04,.75],[-1.5,-.04,.75],[-1.5,-.04,-.75]]);environment.add(centeredFrame);centeredFrame.visible=compact;
 if(compact){origin.scale.setScalar(.5);origin.position.x=-.15;places.scale.set(.66,1,.48);quay.scale.set(.7,.55,.42);halo.scale.set(0.75,0.35,1)}
 dashboard.matrixAutoUpdate=false;
 function drawDashboard(event,passport){const key=event?.key+'|'+lang;if(key===eventKey)return;eventKey=key;ctx.clearRect(0,0,768,420);ctx.fillStyle='#092d38ee';ctx.beginPath();ctx.roundRect(0,0,768,420,22);ctx.fill();ctx.strokeStyle='#71dcc1';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#84bfb2';ctx.font='22px sans-serif';ctx.fillText(choose(['PASAPORTE · REGISTRO HISTÓRICO','PASSPORT · RECORDED HISTORY','PASSAPORT · REGISTRE HISTÒRIC'],lang),30,47);ctx.fillStyle='#fff';ctx.font='600 57px sans-serif';ctx.fillText('M–14',30,120);ctx.fillStyle='#8be5cc';ctx.font='32px monospace';ctx.fillText(event?.phase||'—',615,118);ctx.fillStyle='#c4ded5';ctx.font='25px sans-serif';ctx.fillText('PE 20 mm  +  '+choose(['hormigón','concrete','formigó'],lang)+' 80 mm',30,180);ctx.fillText(choose(['Lecturas de maqueta','Scale-model readings','Lectures de maqueta'],lang)+': '+(passport?.recordedJourney?.length||0),30,235);ctx.fillText(choose(['Posición registrada','Recorded position','Posició registrada'],lang)+': '+(event?.position||'—'),30,286);ctx.fillStyle='#91b5b0';ctx.font='20px sans-serif';ctx.fillText(choose(['16 oct 2026 · copia de consulta, sin conexión en directo','16 Oct 2026 · reference snapshot, no live connection','16 oct 2026 · còpia de consulta, sense connexió en directe'],lang),30,359);texture.needsUpdate=true}
 function update(dt,camera){piece.update(dt);const p=smooth(progress);const shape=footprint==='model'?2:1;piece.root.scale.set(1,1,shape);piece.root.position.set(0,0,0);piece.root.rotation.set(0,0,0);piece.boardGroup.visible=piece.concreteGroup.visible=true;travel.position.set(0,0,0);travel.scale.setScalar(1);piece.boardGroup.scale.set(1,1,1);piece.concreteGroup.position.y=manual??.4;
  origin.visible=chapter===0;chips.visible=chapter===0||chapter===4;places.visible=chapter===2||chapter===3;quay.visible=chapter===2;halo.visible=chapter===4;base.visible=true;
  if(manual===null){if(chapter===0){piece.concreteGroup.visible=false;piece.boardGroup.scale.x=.25+.75*p;piece.boardGroup.scale.z=.25+.75*p}if(chapter===1)piece.concreteGroup.position.y=.12+.65*Math.sin(p*Math.PI);if(chapter===2){travel.scale.setScalar(.52);travel.position.set(-1.02,.6*(1-smooth(progress*3)),0);piece.concreteGroup.position.y=0}if(chapter===3){travel.scale.setScalar(.52);travel.position.set(-1.02+2.04*p,.85*Math.sin(Math.PI*p),0);travel.rotation.y=.07*Math.sin(Math.PI*p);piece.concreteGroup.position.y=0}if(chapter===4)piece.concreteGroup.position.y=.65*p;}
  for(let i=0;i<chips.children.length;i++){const chip=chips.children[i],a=(progress*2+i/42)%1;if(chapter===0){chip.position.set(-2+2*a,.58+Math.sin(a*Math.PI)*.45,(i%7-3)*.08);chip.scale.setScalar(.6+.4*Math.sin(a*Math.PI))}else{const angle=(i/42+progress*.25)*Math.PI*2;chip.position.set(Math.cos(angle)*1.9,.1+Math.sin(a*Math.PI)*.22,Math.sin(angle)*(footprint==='model'?1.9:1.1))}chip.rotation.set(i+progress*4,i*.7+progress*3,0)}
  halo.scale.setScalar(.9+.12*Math.sin(progress*Math.PI));
  piece.guides.visible=(chapter===1||chapter===4)&&piece.concreteGroup.position.y>.05;piece.guides.scale.y=(.08+piece.concreteGroup.position.y)/.64;
  if(compact){base.visible=false;halo.visible=false;quay.visible=false;piece.concreteGroup.position.y*=.35;
   if(chapter===0){travel.scale.setScalar(.65);travel.position.x=.3}
   if(chapter===2||chapter===3){travel.scale.setScalar(.36);travel.position.x*=.66;travel.position.y*=.45}
   for(const chip of chips.children){chip.position.x*=.62;chip.position.z*=.46;chip.position.y*=.45;if(chapter===4)chip.position.y+=piece.concreteGroup.position.y+.12;chip.scale.setScalar(.65)}
   piece.guides.scale.y=(.08+piece.concreteGroup.position.y)/.64;
  }
  root.updateWorldMatrix(true,true);if(camera&&dashboard.visible){const point=root.localToWorld(new THREE.Vector3(0,compact?.75:1.75,compact?0:-.6));const scale=root.getWorldScale(new THREE.Vector3()).x;const world=new THREE.Matrix4().compose(point,camera.getWorldQuaternion(new THREE.Quaternion()),new THREE.Vector3(scale,scale,scale));dashboard.matrix.copy(root.matrixWorld).invert().multiply(world);dashboard.matrixWorldNeedsUpdate=true;}
 }
 return{root,piece,dashboard,set:(i,p)=>{chapter=i;progress=clamp(p);manual=null;travel.rotation.set(0,0,0)},setSeparation:v=>{manual=clamp(v)*.9;chapter=1},setFootprint:v=>footprint=v,setDashboard:v=>dashboard.visible=v,drawDashboard,update,hotspot:(kind)=>{const v=new THREE.Vector3(kind==='plastic'?.9:-.9,kind==='plastic'?.02:.11,0);return(kind==='plastic'?piece.boardGroup:piece.concreteGroup).localToWorld(v)},dispose:()=>{root.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of(Array.isArray(o.material)?o.material:[o.material])){m.map?.dispose();m.dispose()}})}};
}
export function mountStory(container,story,onFrame){
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;container.append(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.01,100);camera.position.set(4.1,3.6,5.4);lights(scene);scene.add(story.root);
 const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.3,0);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=3;controls.maxDistance=20;controls.maxPolarAngle=Math.PI*.49;controls.update();let previousFit=1;
 const resize=()=>{const w=container.clientWidth,h=container.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;const fit=Math.max(1,Math.min(2.2,.92/camera.aspect));camera.position.sub(controls.target).multiplyScalar(fit/previousFit).add(controls.target);previousFit=fit;camera.updateProjectionMatrix();controls.update()};
 const ro=new ResizeObserver(resize);ro.observe(container);resize();let last=performance.now();renderer.setAnimationLoop(now=>{const dt=Math.min(.06,(now-last)/1000);last=now;if(document.hidden)return;controls.update();if(onFrame)onFrame(dt,camera);else story.update(dt,camera);renderer.render(scene,camera)});
 return{renderer,camera,scene,dispose(){renderer.setAnimationLoop(null);ro.disconnect();controls.dispose();story.dispose();renderer.dispose()}};
}
