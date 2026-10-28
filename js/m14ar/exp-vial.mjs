// Vial (M-07): a roadway piece of the port. Chapter 4 (40–64 s), cinematic, at 1:20 like the physical model.
//  40.0–41.5  the road appears: neighbour slabs, lane markings, a raised sidewalk with walkers, street lamps
//  41.6–49.2  truck 1 crosses the real piece; wheel-load pulses on the slab, gold outline flashing
//  43.2–53.6  "X-ray" section in front of the piece: 20 mm PE + {canto} mm concrete next to the 80 mm of a
//             pedestrian piece; illustrative load arrows spread down under each wheel that is on the piece
//  49.6–55.4  a forklift carries a big bag of flakes the other way
//  53.0–64.0  dusk: lamps light up, pools of light on the road; truck 2 and a van cross with headlights
// Load arrows are an explanatory drawing, labelled as illustrative: no structural result is shown.
import {THREE,RoundedBoxGeometry,GOLD,MINT,seg,io,win,lerp,clamp,label,setFade,outline,truck,forklift,pallet,bigBag,MATS} from './kit.mjs?v=7.0';
import {base} from './zones.mjs?v=7.0';
import {tr,fmt} from './text.mjs?v=7.0';

const CAPTION={kick:['04 · USO','04 · USE','04 · ÚS'],
 title:['Hecha para el tráfico del puerto.','Built for port traffic.','Feta per al trànsit del port.'],
 text:['Pieza de vial en {pos}: camiones, carretillas y furgonetas pasan sobre ella cada día. Por eso su capa de hormigón es de {canto} mm.',
  'A roadway piece at {pos}: trucks, forklifts and vans cross it every day. That is why its concrete layer is {canto} mm.',
  'Peça de vial a {pos}: camions, carretons i furgonetes hi passen cada dia. Per això la seva capa de formigó és de {canto} mm.']};
const TXT={section:['Sección · {canto} mm de hormigón','Section · {canto} mm of concrete','Secció · {canto} mm de formigó'],
 pe:['{pe} mm de PE reciclado','{pe} mm of recycled PE','{pe} mm de PE reciclat'],
 loads:['Reparto de cargas · ilustrativo','Load spreading · illustrative','Repartiment de càrregues · il·lustratiu'],
 walk:['80 mm · pieza peatonal','80 mm · pedestrian piece','80 mm · peça per a vianants'],
 dusk:['Al caer la tarde, el tráfico sigue','At dusk, the traffic goes on','En caure la tarda, el trànsit continua']};

export function vialExperience(ctx){
 const{P,TABLE,piece,vars,lang,glow}=ctx,b=base(ctx),{g}=b,X=k=>fmt(tr(TXT[k],lang),vars);
 const span=P.w*3+.32,roadZ=0,walkZ=P.d/2+.022;
 b.slab(-(P.w+.007));b.slab(P.w+.007);b.posLabel(`${piece.position} · ${piece.id}`,0,P.d/2+.044);

 // Road markings (one shared geometry per kind).
 const markMat=new THREE.MeshBasicMaterial({color:0xf2f2ea,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
 const edgeMat=new THREE.MeshBasicMaterial({color:0xf2c46b,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
 const dashGeo=new THREE.PlaneGeometry(.022,.0025);dashGeo.rotateX(-Math.PI/2);
 for(let x=-P.w*1.5;x<P.w*1.5;x+=.04){const d=new THREE.Mesh(dashGeo,markMat);d.position.set(x+.011,.0004,roadZ);g.add(d)}
 const edgeGeo=new THREE.PlaneGeometry(P.w*3+.014,.0018);edgeGeo.rotateX(-Math.PI/2);
 for(const z of[-1,1]){const e=new THREE.Mesh(edgeGeo,edgeMat);e.position.set(0,.0004,z*(P.d/2-.006));g.add(e)}

 // Sidewalk on the reader's side, kerb at slab height, with walkers.
 const walkMat=new THREE.MeshStandardMaterial({color:0xb9b5aa,roughness:.95,transparent:true});
 const sidewalk=new THREE.Mesh(new RoundedBoxGeometry(span,P.h+.002,.03,1,.0008),walkMat);sidewalk.position.set(0,TABLE+(P.h+.002)/2,walkZ);sidewalk.receiveShadow=true;g.add(sidewalk);
 const people=b.walkers([{speed:.05,z:walkZ-.006,dir:1,span},{speed:.042,z:walkZ+.007,dir:-1,span,color:0xe6b8a2},{speed:.06,z:walkZ,dir:1,span,phase:.6,color:0x9fc9c0}]);

 // Street lamps behind the road; heads and light pools come on at dusk.
 const poleGeo=new THREE.CylinderGeometry(.0013,.0018,.19,8),armGeo=new THREE.BoxGeometry(.03,.0016,.0016),headGeo=new THREE.BoxGeometry(.012,.004,.007);
 const headMat=new THREE.MeshStandardMaterial({color:0xfff6dc,emissive:0xffd98a,emissiveIntensity:0}),poolMat=new THREE.MeshBasicMaterial({map:glow,color:0xffd98a,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:0});
 const poolGeo=new THREE.PlaneGeometry(.11,.08);poolGeo.rotateX(-Math.PI/2);
 const pools=[];
 for(const x of[-P.w*1.05,0,P.w*1.05]){const lamp=new THREE.Group(),pole=new THREE.Mesh(poleGeo,MATS.dark),arm=new THREE.Mesh(armGeo,MATS.dark),head=new THREE.Mesh(headGeo,headMat);
  pole.position.y=.095;arm.position.set(0,.19,.014);head.position.set(0,.187,.026);pole.castShadow=true;lamp.add(pole,arm,head);lamp.position.set(x,TABLE,-(P.d/2+.022));g.add(lamp);
  const pool=new THREE.Mesh(poolGeo,poolMat);pool.position.set(x,.0008,-.012);g.add(pool);pools.push(pool)}

 // Vehicles at 1:20 (truck slightly reduced so it stays readable on a phone).
 const TS=.8,t1=truck(),t2=truck();t1.scale.setScalar(TS);t2.scale.setScalar(TS);g.add(t1,t2);
 const van=new THREE.Group();{const body=new THREE.Mesh(new RoundedBoxGeometry(.2,.05,.085,3,.01),MATS.white),cab=new THREE.Mesh(new RoundedBoxGeometry(.12,.035,.078,3,.012),new THREE.MeshStandardMaterial({color:0x1d3540,roughness:.2,metalness:.3}));body.position.y=.04;cab.position.set(.02,.074,0);van.add(body,cab);
  const band=new THREE.Mesh(new THREE.BoxGeometry(.201,.008,.086),MATS.blue);band.position.y=.042;van.add(band);van.userData.wheels=[];
  for(const x of[-.065,.065])for(const z of[-.038,.038]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.016,.016,.012,16),MATS.rubber);w.rotation.x=Math.PI/2;w.position.set(x,.016,z);van.add(w);van.userData.wheels.push(w)}van.traverse(o=>{if(o.isMesh)o.castShadow=true})}
 g.add(van);
 const fk=forklift(),fkLoad=new THREE.Group();fkLoad.add(pallet());{const bag=bigBag();bag.position.y=.007;fkLoad.add(bag)}g.add(fk,fkLoad);

 // Headlights: warm glow at the front and a soft beam on the road.
 const beamGeo=new THREE.BufferGeometry();beamGeo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,.16,0,-.05,.16,0,.05],3));
 const lights=()=>{const h=new THREE.Group(),beamMat=new THREE.MeshBasicMaterial({color:0xffe6a8,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
  const beam=new THREE.Mesh(beamGeo,beamMat);beam.position.y=.002;h.add(beam);const spots=[-1,1].map(s=>{const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:0xfff0c8,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:0}));sp.scale.setScalar(.022);sp.position.set(0,.03,s*.028);h.add(sp);return sp});
  g.add(h);h.userData={beamMat,spots};return h};
 const hl1=lights(),hl2=lights(),hlv=lights();

 // Wheel-load pulses on the slab (pooled).
 const pulseMat=new THREE.SpriteMaterial({map:glow,color:0xf2c46b,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:0});
 const pulses=Array.from({length:8},()=>{const s=new THREE.Sprite(pulseMat.clone());s.scale.setScalar(.03);g.add(s);return s});
 const load=outline(P.w+.004,P.d+.004,GOLD,.0018);load.position.y=.0006;g.add(load);

 // X-ray section standing behind the road (vertical, facing the reader, never hiding the real piece). Exaggerated thickness like chapter 2.
 const K=1.6,boardH=.0026*K,conH=.0026*piece.concreteMm/piece.peMm*1.13*K,walkH=.0026*80/piece.peMm*1.13*K;
 const sec=new THREE.Group();sec.position.set(0,.092,-(P.d/2+.05));g.add(sec); // high enough to read over a passing truck
 const secBack=new THREE.Mesh(new THREE.PlaneGeometry(P.w+.03,conH+boardH+.03),new THREE.MeshBasicMaterial({color:0x05222b,transparent:true,opacity:.58,depthWrite:false}));secBack.position.y=(conH+boardH)/2;sec.add(secBack);
 const conSec=new THREE.Mesh(new THREE.PlaneGeometry(P.w,conH),new THREE.MeshBasicMaterial({map:ctx.conTex,color:0x9a9f95,transparent:true}));conSec.position.y=boardH+conH/2;conSec.position.z=.0005;conSec.name='concrete';sec.add(conSec);
 const peSec=new THREE.Mesh(new THREE.PlaneGeometry(P.w,boardH),new THREE.MeshBasicMaterial({color:0x2f9a7e,transparent:true}));peSec.position.y=boardH/2;peSec.position.z=.0005;peSec.name='pe';sec.add(peSec);
 // Dashed outline: how thick a pedestrian piece would be.
 const dash=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(P.w*.32,walkH)),new THREE.LineDashedMaterial({color:0x9fd8c5,dashSize:.003,gapSize:.002,transparent:true}));dash.computeLineDistances();dash.position.set(-P.w*.32,boardH+walkH/2,.001);sec.add(dash);
 const arrowGeo=new THREE.ConeGeometry(.0026,.007,10);arrowGeo.rotateX(Math.PI);
 const arrows=Array.from({length:18},()=>{const a=new THREE.Mesh(arrowGeo,new THREE.MeshBasicMaterial({color:0xf2c46b,transparent:true,opacity:0,depthWrite:false}));a.position.z=.002;sec.add(a);return a});
 const secLabel=label({title:X('section'),lines:[X('pe'),X('loads')]});secLabel.position.set(P.w*.18,conH+boardH+.018,0);sec.add(secLabel);
 const walkLabel=label({lines:[X('walk')],px:.0001,accent:'#9fd8c5'});walkLabel.position.set(-P.w*.32,boardH+walkH+.004,0);sec.add(walkLabel);
 const duskLabel=label({lines:[X('dusk')],px:.00011,accent:'#f2c46b'});duskLabel.position.set(-P.w*.9,.2,-(P.d/2+.05));g.add(duskLabel);

 const wheelX=(veh,s,x)=>veh.userData.wheels.map(w=>({x:x+w.position.x*s,z:w.position.z*s}));
 function drive(t,veh,hl,t0,t1v,dir,s){
  const k=seg(t,t0,t1v),x=lerp(-dir*span/2,dir*span/2,io(k)*.15+k*.85);veh.visible=k>0&&k<1;
  veh.position.set(x,0,roadZ);veh.rotation.y=dir>0?0:Math.PI;for(const w of veh.userData.wheels||[])w.rotation.y=-dir*x/.024;
  hl.visible=veh.visible;hl.position.set(x+dir*.155*s,0,roadZ);hl.rotation.y=dir>0?0:Math.PI;return veh.visible?wheelX(veh,s,x).map(p=>({...p,x:dir>0?p.x:2*x-p.x})):[]}

 return{duration:24,group:g,caption:CAPTION,retOff:[0,.0012,0],pickables:[conSec,peSec],
  cues:[['engine',41.6],['explode',43.4],['engine',49.6],['set',53.4],['engine',55.2],['engine',59.4]],
  update(t,time,pf){
   b.walk(people,t,40.6,63.5);for(const f of people)f.position.y+=P.h+.002;
   const dusk=seg(t,53,56.5)*(1-seg(t,62.6,64));
   headMat.emissiveIntensity=dusk*1.6;poolMat.opacity=dusk*.3*pf;setFade(duskLabel,win(t,53.4,58.6,.6,.8)*pf);
   // Traffic.
   const contacts=[...drive(t,t1,hl1,41.6,49.2,1,TS),...drive(t,t2,hl2,55.2,61.4,1,TS),...drive(t,van,hlv,59.4,63.6,-1,1)];
   const fs=seg(t,49.6,55.4),fx=lerp(span/2,-span/2,io(fs));fk.visible=fkLoad.visible=fs>0&&fs<1;fk.position.set(fx,0,-P.d*.18);fk.rotation.y=Math.PI;fkLoad.position.set(fx-.07,.012,-P.d*.18);
   if(fk.visible&&Math.abs(fx)<P.w/2)contacts.push({x:fx+.025,z:-P.d*.18},{x:fx-.028,z:-P.d*.18});
   for(const[h,light]of[[hl1,.25+.75*dusk],[hl2,1],[hlv,1]]){h.userData.beamMat.opacity=pf*.07*light*dusk;h.userData.spots.forEach(s=>s.material.opacity=pf*light*Math.max(.25,dusk))}
   // Wheel loads on the piece.
   const onPiece=contacts.filter(c=>Math.abs(c.x)<P.w/2);
   pulses.forEach((p,i)=>{const c=onPiece[i];p.visible=!!c;if(c){p.position.set(c.x,.003,c.z);p.material.opacity=pf*(.55+.35*Math.sin(time*18+i));p.scale.setScalar(.026+.006*Math.sin(time*18+i))}});
   load.material.uniforms.uOpacity.value=pf*(.22+.78*(onPiece.length?(.6+.4*Math.sin(time*20)):0));
   // X-ray section.
   const sv=win(t,43.2,53.6,.9,1);setFade(sec,sv*pf);sec.scale.set(1,Math.max(.001,io(seg(t,43.2,44.4))),1);
   const cols=onPiece.map(c=>c.x).slice(0,6);
   arrows.forEach((a,i)=>{const col=cols[Math.floor(i/3)],fan=(i%3-1);if(col===undefined||sv<.05){a.material.opacity=0;return}
    const k=((time*1.6+i*.13)%1),y=boardH+conH-k*conH;a.position.set(col+fan*k*conH*.9,y,.002);a.rotation.z=-fan*.5;a.material.opacity=pf*sv*Math.sin(k*Math.PI)*.95});
  }};
}
