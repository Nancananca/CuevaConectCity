// «La saca»: the batch bag LOTE-BCN-PE-001, the shared origin of the 20 pieces.
// Chapter 4 is interactive: the visitor drags the stream of flakes into one of three moulds (promenade,
// roadway, quay edge) and watches that piece being born and put to use. Data from the project (datos/piezas.json).
// Anchored with gravity as up (the QR may be on the top or on a side of the bag). Origin = QR centre.
import {THREE,RoundedBoxGeometry,MINT,GOLD,PE_COLORS,clamp,seg,io,out,back,win,lerp,rng,peTexture,concreteTexture,valueNoise,tarpTexture,noiseTexture,glowTexture,label,fadeable,setFade,ribbonMaterial,ribbon,outline,water,person,palm,truck,MATS,motorBoat} from './kit.mjs?v=7.0';
import {FLAKE_VS,FLAKE_FS} from './scene.mjs?v=7.0';
import {T,tr,fmt,num} from './text.mjs?v=7.0';

const ZONE_COLORS={paseo:'#9fd8c5',vial:'#f2c46b',plataforma:'#e58f4f',plaza:'#7edbc2',borde:'#6fb5d8'};
// The three moulds (sizes at 1:40 around the bag; thickness exaggerated like the pieces' material chapter).
const MOULDS=[
 {id:'paseo',ids:'M-01 … M-06',m:[3,3],canto:80,a:-2.35},
 {id:'vial',ids:'M-07 … M-09',m:[6,3],canto:220,a:-1.57},
 {id:'borde',ids:'M-19 · M-20',m:[1.5,1.5],canto:80,a:-.79}];
const TXT={
 kick:['TÚ DECIDES','YOUR CALL','TU DECIDEIXES'],
 prompt:['¿Qué construyes con este lote? Arrastra la escama hasta un molde.','What will you build with this batch? Drag the flakes into a mould.','Què construeixes amb aquest lot? Arrossega l’escama fins a un motlle.'],
 drag:['Arrastra la escama','Drag the flakes','Arrossega l’escama'],
 opt:{paseo:[['Paseo','Promenade','Passeig'],['3 × 3 m · para caminar junto al agua.','3 × 3 m · for walking by the water.','3 × 3 m · per caminar vora l’aigua.']],
  vial:[['Vial','Roadway','Vial'],['6 × 3 m · 220 mm de hormigón para el tráfico.','6 × 3 m · 220 mm of concrete for traffic.','6 × 3 m · 220 mm de formigó per al trànsit.']],
  borde:[['Borde','Quay edge','Vora'],['1,5 × 1,5 m · en el límite con el mar.','1.5 × 1.5 m · right at the sea’s edge.','1,5 × 1,5 m · al límit amb el mar.']]},
 born:['Nace una pieza de {zone}','A {zone} piece is born','Neix una peça de {zone}'],
 bornLines:[['{m} m · PE 20 mm + hormigón {canto} mm','{ids} · lote {batch}'],['{m} m · PE 20 mm + concrete {canto} mm','{ids} · batch {batch}'],['{m} m · PE 20 mm + formigó {canto} mm','{ids} · lot {batch}']],
 note:['Del mismo lote salieron las 20 piezas del muelle.','The 20 pieces of the quay came from this same batch.','Del mateix lot van sortir les 20 peces del moll.'],
 caption:{kick:['04 · ELIGE','04 · CHOOSE','04 · TRIA'],title:['Un lote, muchas vidas.','One batch, many lives.','Un lot, moltes vides.'],text:['La misma escama puede ser paseo, vial o borde del muelle. Tú eliges cuál nace ahora.','The same flakes can become promenade, roadway or quay edge. You choose which one is born now.','La mateixa escama pot ser passeig, vial o vora del moll. Tu tries quina neix ara.']},
};

export function createBagScene({lang='es',passport=null,catalog=[],shadows=true}={}){
 const root=new THREE.Group(),stage=new THREE.Group();root.add(stage);
 const vars={batch:passport?.identity?.batchReference||'LOTE-BCN-PE-001',kg:num(passport?.metrics?.estimatedMassKg,lang)},L=k=>fmt(tr(T[k],lang),vars);
 const cues=[];let t=0,paused=false,lastT=0;
 stage.add(new THREE.HemisphereLight(0xf2fff4,0x1b3940,1.6));
 const key=new THREE.DirectionalLight(0xfff3dc,2.4);key.position.set(.12,.34,.2);stage.add(key,key.target);
 if(shadows){key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-.3,right:.3,top:.3,bottom:-.3,near:.05,far:1.2});key.shadow.bias=-.0004}
 const glow=glowTexture();

 // Halo on the bag: the record is here.
 const halo=ribbon(Array.from({length:120},(_,i)=>{const a=i/120*Math.PI*2;return[Math.cos(a)*.035,Math.sin(a)*.035]}),.0016,true,ribbonMaterial(MINT,18));halo.position.y=.001;stage.add(halo);
 const title=fadeable(label({title:tr(T.bagTitle,lang),lines:[vars.batch,L('piecesOfBatch')]}));title.position.set(0,.05,0);stage.add(title);

 // 1 · refit: a boat on its cradle under a PE cover.
 const boat=motorBoat();boat.scale.setScalar(1.5);boat.position.set(.2,0,-.03);boat.rotation.y=-.5;stage.add(boat);
 const cradle=new THREE.Group();for(const x of[-.04,.04]){const c=new THREE.Mesh(new THREE.BoxGeometry(.006,.012,.05),MATS.wood);c.position.set(x,.006,0);cradle.add(c)}cradle.position.copy(boat.position);cradle.rotation.y=boat.rotation.y;stage.add(cradle);
 boat.position.y=.012;fadeable(boat);fadeable(cradle);
 const noise=valueNoise(77),TW=.16,TD=.09;
 const tarpGeo=new THREE.PlaneGeometry(1,1,40,26);tarpGeo.rotateX(-Math.PI/2);const tarpBase=Float32Array.from(tarpGeo.attributes.position.array);
 const tarpMat=new THREE.MeshStandardMaterial({map:tarpTexture(),alphaMap:noiseTexture(noise),alphaTest:.001,side:THREE.DoubleSide,roughness:.78});
 const tarp=new THREE.Mesh(tarpGeo,tarpMat);tarp.castShadow=true;tarp.customDepthMaterial=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,alphaMap:tarpMat.alphaMap,alphaTest:.001});stage.add(tarp);
 const wave=(x,z,w)=>.0036*Math.sin(x*11+w*2.1)+.0024*Math.sin(z*15-w*1.6+x*4)+.0015*Math.sin((x+z)*21+w*2.9);
 // Draped over the boat (a soft dome), then lifted flat and carried over the bag.
 function shapeTarp(c,drape,time){const p=tarpGeo.attributes.position.array;for(let i=0;i<p.length;i+=3){const x=tarpBase[i],z=tarpBase[i+2],dome=Math.max(0,1-(x*x*3.2+z*z*5))*.045;
  p[i]=c.x+x*TW;p[i+1]=c.y+wave(x,-z,time)*(1-drape)+(dome-.03)*drape;p[i+2]=c.z+z*TD}tarpGeo.attributes.position.needsUpdate=true;tarpGeo.computeVertexNormals()}
 const tarpLabel=fadeable(label({title:tr(T.tarp,lang)}));stage.add(tarpLabel);

 // 2 · flakes into the bag (same shader as the pieces; landing spots on the bag mouth).
 const N=2200,tri=new THREE.InstancedBufferGeometry();tri.setAttribute('position',new THREE.Float32BufferAttribute([-1,0,-.7,1,0,-.5,-.1,0,1],3));tri.instanceCount=N;
 const aUv=new Float32Array(N*2),aLand=new Float32Array(N*3),aSeed=new Float32Array(N*4),aColor=new Float32Array(N*3),r=rng(9),pe=PE_COLORS.map(c=>new THREE.Color(c));
 for(let i=0;i<N;i++){const u=r(),v=r(),a=r()*Math.PI*2,rr=Math.sqrt(r())*.024;aUv.set([u,v],i*2);aLand.set([Math.cos(a)*rr,.002+r()*.004,Math.sin(a)*rr],i*3);aSeed.set([noise(u,v),r(),r(),r()],i*4);const c=pe[Math.floor(r()*pe.length)];aColor.set([c.r,c.g,c.b],i*3)}
 for(const[k,a,n]of[['aUv',aUv,2],['aLand',aLand,3],['aSeed',aSeed,4],['aColor',aColor,3]])tri.setAttribute(k,new THREE.InstancedBufferAttribute(a,n));
 const U={uTime:{value:0},uTear:{value:0},uSwirl:{value:0},uLand:{value:0},uSettle:{value:0},uMode:{value:0},uRise:{value:0},uConverge:{value:0},uVis:{value:0},uWaveT:{value:0},
  uTarpC:{value:new THREE.Vector3()},uTarpS:{value:new THREE.Vector2(TW,TD)},uRetOff:{value:new THREE.Vector3()},uSwirlR:{value:.07},uInfR:{value:.2},uSize:{value:.0013}};
 const flakes=new THREE.Mesh(tri,new THREE.ShaderMaterial({uniforms:U,vertexShader:FLAKE_VS,fragmentShader:FLAKE_FS,side:THREE.DoubleSide}));flakes.frustumCulled=false;stage.add(flakes);
 const fill=new THREE.Mesh(new THREE.CircleGeometry(.026,40),new THREE.MeshStandardMaterial({map:peTexture(),roughness:.7,transparent:true}));fill.rotation.x=-Math.PI/2;fill.position.y=.0015;stage.add(fadeable(fill));

 // 3 · batch: column, passport card and the F0 reading.
 const column=new THREE.Mesh(new THREE.CylinderGeometry(.03,.036,.09,40,1,true),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
  uniforms:{uTime:{value:0},uOpacity:{value:0},uColor:{value:MINT.clone()}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform float uTime,uOpacity;uniform vec3 uColor;varying vec2 vUv;void main(){float a=pow(1.-vUv.y,1.6)*(.25+.15*sin(vUv.y*42.-uTime*6.))*uOpacity;gl_FragColor=vec4(uColor,a);}'}));column.position.y=.045;stage.add(column);
 const f0=(passport?.history||[]).find(e=>e.type==='lote');
 const clock=at=>{try{return new Intl.DateTimeFormat('es-ES',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'}).format(new Date(at))}catch{return''}};
 const card=fadeable(label({title:'CUEVA-BCN-SACA',lines:[L('passportCard'),`${tr(T.batch,lang)} ${vars.batch} · PE`,`F0 · ${f0?clock(f0.at):'16/10'} · ${L('integrity').split('·')[0].trim()}`,`≈ ${vars.kg} kg · ${tr(['estimado','estimated','estimat'],lang)}`],px:.00014}));card.position.set(0,.085,0);stage.add(card);

 // 4 · choose: moulds around the bag, a stream of flakes that follows the finger, three endings.
 const conTex=concreteTexture(),peMat=new THREE.MeshStandardMaterial({map:peTexture(),roughness:.6,color:0xd8edcf}),conMat=new THREE.MeshStandardMaterial({map:conTex,roughness:.9,color:0xd5d8cc});
 const R0=.16,choose=new THREE.Group();stage.add(choose);
 const moulds=MOULDS.map(m=>{const w=m.m[0]/40,d=m.m[1]/40,g=new THREE.Group(),c=new THREE.Color(ZONE_COLORS[m.id]);g.position.set(Math.cos(m.a)*R0,0,-Math.sin(m.a)*R0);
  const wallM=new THREE.MeshStandardMaterial({color:0x6c7a78,roughness:.7,transparent:true});
  for(const[x,z,ww,dd]of[[0,-d/2-.002,w+.008,.004],[0,d/2+.002,w+.008,.004],[-w/2-.002,0,.004,d],[w/2+.002,0,.004,d]]){const wall=new THREE.Mesh(new THREE.BoxGeometry(ww,.012,dd),wallM);wall.position.set(x,.006,z);wall.castShadow=true;g.add(wall)}
  const ring=outline(w+.014,d+.014,c,.0022);ring.position.y=.0004;g.add(ring);
  const lbl=label({title:tr(TXT.opt[m.id][0],lang),lines:[`${m.m[0]} × ${m.m[1]} m`.replace(/\./g,lang==='en'?'.':',')],accent:ZONE_COLORS[m.id],px:.0001});lbl.position.set(0,.022,0);g.add(lbl);
  const H1=.0016,H2=H1*m.canto/20*1.13*.7,pe=new THREE.Mesh(new THREE.BoxGeometry(w,H1,d),peMat),co=new THREE.Mesh(new THREE.BoxGeometry(w,H2,d),conMat);pe.position.y=H1/2;co.position.y=H1+H2/2;
  const slab=new THREE.Group();slab.add(pe,co);slab.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true});g.add(slab);
  g.userData={m,w,d,ring,lbl,slab,pe,co,H1,H2,walls:g.children.filter(o=>o.isMesh&&o.material===wallM)};choose.add(g);return g});
 fadeable(choose);
 // the stream: instanced flakes travelling along an arc from the bag mouth to the target
 const SN=240,stream=new THREE.InstancedMesh(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute([-1,0,-.7,1,0,-.5,-.1,0,1],3)),new THREE.MeshStandardMaterial({color:0xffffff,side:THREE.DoubleSide,roughness:.6}),SN);
 stream.geometry.computeVertexNormals();const sr=rng(31),scol=new THREE.Color();for(let i=0;i<SN;i++){stream.setColorAt(i,scol.set(PE_COLORS[i%PE_COLORS.length]))}stream.frustumCulled=false;stage.add(stream);
 const sm=new THREE.Matrix4(),sq=new THREE.Quaternion(),sv=new THREE.Vector3(),ss=new THREE.Vector3(),seeds=Array.from({length:SN},()=>[sr(),sr(),sr(),sr()]);
 const target=new THREE.Vector3(0,0,R0),aim=new THREE.Vector3(0,0,R0);
 function drawStream(on,time,to){stream.visible=on>0;if(!on)return;for(let i=0;i<SN;i++){const[a,b,c,d]=seeds[i],u=(time*.7+a)%1,mid=new THREE.Vector3(to.x*.5,.07+.02*b,to.z*.5);
  const p=new THREE.Vector3(0,.012,0).multiplyScalar((1-u)*(1-u)).addScaledVector(mid,2*u*(1-u)).addScaledVector(to,u*u);p.x+=(b-.5)*.008*Math.sin(u*Math.PI);p.z+=(c-.5)*.008*Math.sin(u*Math.PI);
  sq.setFromAxisAngle(sv.set(b-.5,1,c-.5).normalize(),time*(2+d*4)+a*20);ss.setScalar(.0011*(.6+d)*on*Math.sin(Math.min(1,u*1.2)*Math.PI*.95+.05));sm.compose(p,sq,ss);stream.setMatrixAt(i,sm)}stream.instanceMatrix.needsUpdate=true}
 // endings: a little life for the new piece
 const life=new THREE.Group();stage.add(life);
 const walkers=[person(0xeef6f0),person(0xd9c7a7)];walkers.forEach(w=>{w.scale.setScalar(.5);life.add(w)});
 const tree=palm(.1,3);life.add(tree);
 const lorry=truck();lorry.scale.setScalar(.4);life.add(lorry);
 const sea=water(.16,.07,0,-.0005);life.add(sea);const dinghy=motorBoat();dinghy.scale.setScalar(.3);life.add(dinghy);
 const bornL=label({title:'',lines:['']});fadeable(life);
 const dragL=fadeable(label({lines:['⟷  '+tr(TXT.drag,lang)],accent:'#f2c46b'}));stage.add(dragL);
 let bornLabel=null;
 const plane=new THREE.Plane(),hit=new THREE.Vector3(),nrm=new THREE.Vector3(),org=new THREE.Vector3();
 function groundPoint(rc){stage.updateWorldMatrix(true,false);nrm.set(0,1,0).transformDirection(stage.matrixWorld);org.setFromMatrixPosition(stage.matrixWorld);plane.setFromNormalAndCoplanarPoint(nrm,org);
  if(!rc.ray.intersectPlane(plane,hit))return null;stage.worldToLocal(hit);const l=Math.hypot(hit.x,hit.z);if(l>.26)hit.multiplyScalar(.26/l);hit.y=0;return hit.clone()}
 const nearest=p=>{let best=null,bd=1e9;for(const g of moulds){const d=Math.hypot(p.x-g.position.x,p.z-g.position.z);if(d<bd){bd=d;best=g}}return bd<Math.max(best.userData.w,best.userData.d)/2+.03?best.userData.m.id:null};
 let dragging=false,choiceAt=-1;
 const it={holdAt:2,choice:null,hover:null,kick:TXT.kick,prompt:TXT.prompt,
  options:MOULDS.map(m=>({id:m.id,label:TXT.opt[m.id][0],detail:TXT.opt[m.id][1],color:ZONE_COLORS[m.id]})),
  pointer(type,rc){if(it.choice)return false;const p=groundPoint(rc);
   if(type==='down'){if(!p)return false;dragging=true;aim.copy(p);return true}
   if(type==='move'&&dragging){if(p)aim.copy(p);it.hover=nearest(aim);return true}
   if(type==='hover'){if(p)it.hover=nearest(p);return false}
   if(type==='up'&&dragging){dragging=false;const pick=nearest(aim);if(pick)it.choose(pick);return true}
   return false},
  choose(id){if(it.choice)return;it.choice=id;choiceAt=-1},
  reset(){it.choice=null;it.hover=null;dragging=false;choiceAt=-1;if(bornLabel){stage.remove(bornLabel);bornLabel=null}}};
 const TL={loopStart:5,loopEnd:74,chapters:[5,17,29,40,64],useEnd:64,hold:42},RS=11;
 const flash=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:0}));stage.add(flash);
 const CUES=[['ring',.05],['tarp',9],['tear',18],['swirl',19.2],['land',22.4],['column',29.2],['node',31],['lift',40.5],['dissolve',53.6+RS],['rise',55+RS],['converge',58.2+RS],['flash',60+RS]];
 let standby=false,lastWall=0;const waiting=()=>!it.choice&&t>=TL.hold-1e-6;
 const cue=(n,at)=>{if(lastT<at&&t>=at)cues.push(n)};
 const camPos=new THREE.Vector3(),tmp=new THREE.Vector3(),tmp2=new THREE.Vector3();
 function update(dt,camera){
  if(!paused&&!standby){lastT=t;t+=dt;if(!it.choice&&lastT<=TL.hold&&t>TL.hold)t=TL.hold;if(t>=TL.loopEnd){t=TL.loopStart;lastT=t-1e-4;it.reset()}}
  const time=performance.now()/1000,tR=t-RS,dtw=lastWall?Math.min(.05,time-lastWall):0;lastWall=time;for(const[n,a]of CUES)cue(n,a);
  if(standby){halo.material.uniforms.uProg.value=1;halo.material.uniforms.uOpacity.value=.45+.25*Math.sin(time*4);for(const o of stage.children)if(!o.isLight&&o!==halo&&o!==key.target)o.visible=false;return}
  for(const o of stage.children)o.visible=true;
  halo.material.uniforms.uProg.value=io(seg(t,.2,2));halo.material.uniforms.uOpacity.value=.5+.4*Math.sin(time*2);
  setFade(title,win(t,1.5,9,.6,.8));
  // 1 · refit
  const boatOn=win(t,4.6,26,1,1.2);setFade(boat,boatOn);setFade(cradle,boatOn);
  const lift=io(seg(t,9,12)),carry=io(seg(t,12,15.5));
  const bp=boat.position,c=new THREE.Vector3(lerp(bp.x,0,carry),lerp(bp.y+.03,.11,lift)+.004*Math.sin(time*1.3)*lift,lerp(bp.z,0,carry));
  tarp.visible=t>4.6&&t<19.6;if(tarp.visible){shapeTarp(c,1-lift,time);const thr=t<18?1-io(seg(t,4.6,6.4))*.999:io(seg(t,18,19.5));tarpMat.alphaTest=tarp.customDepthMaterial.alphaTest=clamp(thr,.001,.999)}
  setFade(tarpLabel,win(t,6,17.8,.5,.4));tarpLabel.position.set(c.x-.06,c.y+.015,c.z);
  // 2 · flakes pour into the bag
  U.uTime.value=time;U.uWaveT.value=time;U.uTarpC.value.copy(c);const ret=tR>=53;U.uMode.value=ret?1:0;
  U.uTear.value=seg(t,18,19.5)*1.15;U.uSwirl.value=io(seg(t,19,22.2));U.uLand.value=io(seg(t,22.2,25));U.uSettle.value=seg(t,24,26);
  U.uRise.value=io(seg(tR,53.6,56.2));U.uConverge.value=io(seg(tR,58,60.2));U.uVis.value=ret?(tR<61?1:0):(t>17.8&&t<26.2?1:0);flakes.visible=U.uVis.value>0;
  setFade(fill,t<40?seg(t,23.5,26):t<64?1-.6*seg(t,40,41):1-seg(tR,53.6,55));
  // 3 · batch
  const id=win(t,29.2,39.6,1,1.2);column.material.uniforms.uOpacity.value=id;column.material.uniforms.uTime.value=time;column.visible=id>0;
  const cardIn=back(seg(t,30.2,31.2));setFade(card,id*seg(t,30.2,30.6));card.position.y=.085+.003*Math.sin(time*1.1);
  // 4 · choose
  if(t<TL.hold-.5&&it.choice)it.reset();if(t>TL.hold+.05&&!it.choice){it.choice='paseo';choiceAt=TL.hold}if(it.choice&&choiceAt<0)choiceAt=t;
  const cf=win(t,40,64.6,.8,1.2);setFade(choose,cf);
  const T0=choiceAt,chosen=moulds.find(g=>g.userData.m.id===it.choice);
  moulds.forEach((g,i)=>{const u=g.userData,appear=back(seg(t,40.2+i*.25,41+i*.25)),isC=g===chosen;g.scale.setScalar(Math.max(.001,appear*(it.choice&&!isC?1-seg(t,T0,T0+1):1)));
   const hot=!it.choice&&it.hover===u.m.id;u.ring.material.uniforms.uOpacity.value=cf*(hot?1:.45+.25*Math.sin(time*4+i));u.lbl.material.opacity=cf*(it.choice&&!isC?0:1);
   const fillK=isC?io(seg(t,T0+.8,T0+3)):0,pour=isC?io(seg(t,T0+3.2,T0+5)):0,lift=isC?io(seg(t,T0+5.4,T0+6.8)):0;
   u.slab.visible=fillK>0;u.pe.scale.y=Math.max(.001,fillK);u.pe.position.y=u.H1*fillK/2;u.co.visible=pour>0;u.co.scale.y=Math.max(.001,pour);u.co.position.y=u.H1+u.H2*pour/2;
   u.slab.position.y=lift*.004;u.walls.forEach(w=>{w.material.opacity=1-lift;w.visible=lift<1})});
  // stream: follows the finger while deciding, then pours into the chosen mould
  if(waiting()){if(!dragging){const k=(time*.25)%MOULDS.length|0,m=moulds[k];aim.lerp(new THREE.Vector3(m.position.x*.9,0,m.position.z*.9),Math.min(1,dtw*1.5))}target.lerp(aim,Math.min(1,dtw*10))}
  else if(chosen)target.lerp(new THREE.Vector3(chosen.position.x,.012,chosen.position.z),Math.min(1,dtw*6));
  drawStream(waiting()?1:(chosen&&t<T0+2.8?1-seg(t,T0+2.2,T0+2.8):0),time,target);
  setFade(dragL,waiting()&&!dragging?.6+.4*Math.sin(time*3):0);dragL.position.set(target.x*.6,.075,target.z*.6);
  // life of the new piece
  const lf=chosen?win(t,T0+7,64.4,.8,1.4):0;setFade(life,lf);
  if(chosen){const P=chosen.position,u=chosen.userData,z=u.m.id;
   walkers.forEach((w,i)=>{w.visible=z==='paseo';const s=seg(t,T0+7.4+i*1.2,T0+15+i*1.2),x=lerp(-u.w/2-.02,u.w/2+.02,s);w.position.set(P.x+x*(i?-1:1),.0015+u.H1+u.H2,P.z+(i?.01:-.008));w.rotation.y=i?Math.PI:0;w.userData.update((t-T0)*7)});
   tree.visible=z==='paseo';tree.position.set(P.x+u.w/2+.012,0,P.z-u.d/2);
   lorry.visible=z==='vial';const ls=seg(t,T0+7.4,T0+13.4);lorry.position.set(P.x+lerp(-u.w,u.w,ls),u.H1+u.H2,P.z);lorry.userData.wheels.forEach(w=>w.rotation.y=-(t-T0)*6);
   sea.visible=dinghy.visible=z==='borde';sea.position.set(P.x,-.0005,P.z-u.d/2-.004-.035);sea.userData.update(time,.2);const bs=out(seg(t,T0+7.4,T0+12));dinghy.position.set(P.x+lerp(-.12,.01,bs),.002+.001*Math.sin(time*2),P.z-u.d/2-.03);
   if(!bornLabel&&t>T0+5.6){const zn=tr(TXT.opt[z][0],lang).toLowerCase(),mm=`${u.m.m[0]} × ${u.m.m[1]}`.replace(/\./g,lang==='en'?'.':',');
    bornLabel=fadeable(label({title:fmt(tr(TXT.born,lang),{zone:zn}),lines:[...tr(TXT.bornLines,lang).map(l=>fmt(l,{m:mm,canto:u.m.canto,ids:u.m.ids,batch:vars.batch})),tr(TXT.note,lang)],accent:ZONE_COLORS[z],px:.00011}));bornLabel.userData.s0=bornLabel.scale.clone();labels.push(bornLabel);stage.add(bornLabel)}
   if(bornLabel){setFade(bornLabel,win(t,T0+5.8,64,.6,1));bornLabel.position.set(P.x,.06,P.z)}
   U.uRetOff.value.set(P.x,u.H1+u.H2,P.z)}
  const fl=seg(tR,59.8,61.2);flash.visible=fl>0&&fl<1;flash.material.opacity=Math.sin(fl*Math.PI)*.95;flash.scale.setScalar(.01+fl*.09);flash.position.y=.004;
  if(camera){camera.getWorldPosition(camPos);const s=root.getWorldScale(tmp2).x;for(const l of labels){if(!l.visible)continue;l.getWorldPosition(tmp);const k=clamp(camPos.distanceTo(tmp)/s/.32,.42,1.15);l.scale.set(l.userData.s0.x*k,l.userData.s0.y*k*(l===card?Math.max(.001,cardIn):1),1)}}
 }
 const labels=[];root.traverse(o=>{if(o.isSprite&&o.userData.isLabel){o.userData.s0=o.scale.clone();labels.push(o)}});
 const captions=T.bagCh.map((c,i)=>i===3?TXT.caption:c).map(c=>({kick:tr(c.kick,lang),title:tr(c.title,lang),text:fmt(tr(c.text,lang),vars)}));
 return{root,piece:{id:'SACA',zone:'bag'},captions,chapterNames:T.bagShort.map(c=>tr(c,lang)),timeline:TL,interaction:it,waiting,
  setStandby:v=>{standby=v},get standby(){return standby},
  pointer:(type,rc)=>waiting()?it.pointer(type,rc):false,
  get time(){return t},get paused(){return paused},setPaused:v=>{paused=v},seek:v=>{t=v;lastT=v},
  chapterAt:(v=t)=>{if(v<TL.chapters[0])return -1;let i=0;TL.chapters.forEach((c,k)=>{if(v>=c)i=k});return i},
  restart:()=>{t=0;lastT=0;it.reset()},takeCues:()=>cues.splice(0),update,setViewHeight:()=>{},infoVars:vars,
  pick:raycaster=>raycaster.intersectObject(card)[0]||raycaster.intersectObjects(moulds,true)[0]?{kind:'bag'}:null,
  dispose(){root.traverse(o=>{o.geometry?.dispose();for(const m of[o.material].flat().filter(Boolean)){m.map?.dispose();m.dispose()}})}};
}
