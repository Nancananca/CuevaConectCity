// «La saca»: the batch bag LOTE-BCN-PE-001, the shared origin of the 20 pieces.
// Anchored with gravity as up (the QR may be on the top or on a side of the bag). Origin = QR centre.
import {THREE,RoundedBoxGeometry,MINT,PE_COLORS,clamp,seg,io,out,back,win,lerp,rng,peTexture,concreteTexture,valueNoise,tarpTexture,noiseTexture,glowTexture,label,fadeable,setFade,ribbonMaterial,ribbon,MATS,motorBoat} from './kit.mjs?v=6.0';
import {FLAKE_VS,FLAKE_FS,TIMELINE} from './scene.mjs?v=6.0';
import {T,tr,fmt,num} from './text.mjs?v=6.0';

const ZONE_COLORS={paseo:'#9fd8c5',vial:'#f2c46b',plataforma:'#e58f4f',plaza:'#7edbc2',borde:'#6fb5d8'};

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

 // 4 · twenty pieces fly out of the bag to their zones (miniatures at 1:120).
 const pieces=catalog.length?catalog:[];const conTex=concreteTexture(),peMat=new THREE.MeshStandardMaterial({map:peTexture(),roughness:.6}),conMat=new THREE.MeshStandardMaterial({map:conTex,roughness:.9,color:0xd5d8cc});
 const zonesOrder=['paseo','vial','plataforma','plaza','borde'],tiles=[],zoneLabels=[];
 zonesOrder.forEach((z,zi)=>{const list=pieces.filter(p=>p.zone===z),a0=Math.PI*(1.1+zi*.2),R=.2;
  list.forEach((p,k)=>{const w=p.projectM[0]/120,d=p.projectM[1]/120,g=new THREE.Group(),pe=new THREE.Mesh(new THREE.BoxGeometry(w,.0012,d),peMat),co=new THREE.Mesh(new THREE.BoxGeometry(w,.003,d),conMat);
   pe.position.y=.0006;co.position.y=.0027;g.add(pe,co);const edge=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w,.0042,d)),new THREE.LineBasicMaterial({color:ZONE_COLORS[z],transparent:true}));edge.position.y=.0021;g.add(edge);
   const a=a0+(k-(list.length-1)/2)*.07,rr=R+(k%2)*.04;g.userData={to:new THREE.Vector3(Math.cos(a)*rr,0,-Math.sin(a)*rr*.75),rot:-a+Math.PI/2,i:tiles.length};g.traverse(o=>{if(o.isMesh)o.castShadow=true});stage.add(g);tiles.push(g)});
  const la=label({title:tr(T.zoneLabel[z],lang),lines:[`${list.length} · ${list.map(p=>p.id).join(' ')}`.slice(0,40)],accent:ZONE_COLORS[z],px:.0001});la.position.set(Math.cos(a0)*(R+.11),.016,-Math.sin(a0)*(R+.11)*.75);stage.add(la);zoneLabels.push(la)});
 tiles.forEach(g=>fadeable(g));

 const flash=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:0}));stage.add(flash);
 const CUES=[['ring',.05],['tarp',9],['tear',18],['swirl',19.2],['land',22.4],['column',29.2],['node',31],['lift',40.5],['set',47],['dissolve',53.6],['rise',55],['converge',58.2],['flash',60]];
 const cue=(n,at)=>{if(lastT<at&&t>=at)cues.push(n)};
 const camPos=new THREE.Vector3(),tmp=new THREE.Vector3(),tmp2=new THREE.Vector3();
 function update(dt,camera){
  if(!paused){lastT=t;t+=dt;if(t>=TIMELINE.loopEnd){t=TIMELINE.loopStart;lastT=t-1e-4}}
  const time=performance.now()/1000;for(const[n,a]of CUES)cue(n,a);
  halo.material.uniforms.uProg.value=io(seg(t,.2,2));halo.material.uniforms.uOpacity.value=.5+.4*Math.sin(time*2);
  setFade(title,win(t,1.5,9,.6,.8));
  // 1 · refit
  const boatOn=win(t,4.6,26,1,1.2);setFade(boat,boatOn);setFade(cradle,boatOn);
  const lift=io(seg(t,9,12)),carry=io(seg(t,12,15.5));
  const bp=boat.position,c=new THREE.Vector3(lerp(bp.x,0,carry),lerp(bp.y+.03,.11,lift)+.004*Math.sin(time*1.3)*lift,lerp(bp.z,0,carry));
  tarp.visible=t>4.6&&t<19.6;if(tarp.visible){shapeTarp(c,1-lift,time);const thr=t<18?1-io(seg(t,4.6,6.4))*.999:io(seg(t,18,19.5));tarpMat.alphaTest=tarp.customDepthMaterial.alphaTest=clamp(thr,.001,.999)}
  setFade(tarpLabel,win(t,6,17.8,.5,.4));tarpLabel.position.set(c.x-.06,c.y+.015,c.z);
  // 2 · flakes pour into the bag
  U.uTime.value=time;U.uWaveT.value=time;U.uTarpC.value.copy(c);const ret=t>=53;U.uMode.value=ret?1:0;
  U.uTear.value=seg(t,18,19.5)*1.15;U.uSwirl.value=io(seg(t,19,22.2));U.uLand.value=io(seg(t,22.2,25));U.uSettle.value=seg(t,24,26);
  U.uRise.value=io(seg(t,53.6,56.2));U.uConverge.value=io(seg(t,58,60.2));U.uVis.value=ret?(t<61?1:0):(t>17.8&&t<26.2?1:0);flakes.visible=U.uVis.value>0;
  setFade(fill,t<53?seg(t,23.5,26):1-seg(t,53.6,55));
  // 3 · batch
  const id=win(t,29.2,39.6,1,1.2);column.material.uniforms.uOpacity.value=id;column.material.uniforms.uTime.value=time;column.visible=id>0;
  const cardIn=back(seg(t,30.2,31.2));setFade(card,id*seg(t,30.2,30.6));card.position.y=.085+.003*Math.sin(time*1.1);
  // 4 · twenty pieces
  const tf=win(t,40.2,55,.4,1.6);
  tiles.forEach(g=>{const{to,rot,i}=g.userData,k=io(seg(t,40.6+i*.25,42.4+i*.25));g.position.set(to.x*k,Math.sin(k*Math.PI)*.06+.003*(1-k),to.z*k);g.rotation.set(0,rot*k+(1-k)*time,0);g.scale.setScalar(Math.max(.001,Math.min(1,k*3)));setFade(g,tf)});
  zoneLabels.forEach((l,i)=>{l.material.opacity=win(t,46+i*.4,55,.6,1.2)});
  const fl=seg(t,59.8,61.2);flash.visible=fl>0&&fl<1;flash.material.opacity=Math.sin(fl*Math.PI)*.95;flash.scale.setScalar(.01+fl*.09);flash.position.y=.004;
  if(camera){camera.getWorldPosition(camPos);const s=root.getWorldScale(tmp2).x;for(const l of labels){if(!l.visible)continue;l.getWorldPosition(tmp);const k=clamp(camPos.distanceTo(tmp)/s/.32,.42,1.15);l.scale.set(l.userData.s0.x*k,l.userData.s0.y*k*(l===card?Math.max(.001,cardIn):1),1)}}
 }
 const labels=[];root.traverse(o=>{if(o.isSprite&&o.userData.isLabel){o.userData.s0=o.scale.clone();labels.push(o)}});
 const captions=T.bagCh.map(c=>({kick:tr(c.kick,lang),title:tr(c.title,lang),text:fmt(tr(c.text,lang),vars)}));
 return{root,piece:{id:'SACA',zone:'bag'},captions,chapterNames:T.bagShort.map(c=>tr(c,lang)),
  get time(){return t},get paused(){return paused},setPaused:v=>{paused=v},seek:v=>{t=v;lastT=v},
  chapterAt:(v=t)=>{if(v<TIMELINE.chapters[0])return -1;let i=0;TIMELINE.chapters.forEach((c,k)=>{if(v>=c)i=k});return i},
  restart:()=>{t=0;lastT=0},takeCues:()=>cues.splice(0),update,setViewHeight:()=>{},infoVars:vars,
  pick:raycaster=>raycaster.intersectObjects(tiles,true)[0]||raycaster.intersectObject(card)[0]?{kind:'bag'}:null,
  dispose(){root.traverse(o=>{o.geometry?.dispose();for(const m of[o.material].flat().filter(Boolean)){m.map?.dispose();m.dispose()}})}};
}
