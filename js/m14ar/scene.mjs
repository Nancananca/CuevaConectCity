// «Despierta la pieza»: the story of one piece, staged at real scale on its physical 1:20 model.
// Units are metres. Origin = centre of the QR on the top face of the piece.
// X = along the QR's right edge, Y = up, Z = towards the reader (QR bottom edge).
// Chapters 0-3 and 5 are shared; chapter 4 (use) comes from the piece's zone (zones.mjs).
import {THREE,RoundedBoxGeometry,MINT,PE_COLORS,clamp,seg,io,out,back,win,lerp,rng,canvasTexture,peTexture,concreteTexture,valueNoise,tarpTexture,noiseTexture,glowTexture,
 label,fadeable,setFade,ribbonMaterial,ribbon,rectPath} from './kit.mjs?v=7.0';
import {ZONES} from './zones.mjs?v=7.0';
import {EXPERIENCES} from './experiences.mjs?v=7.0';
import {T,tr,fmt,pieceVars} from './text.mjs?v=7.0';

export const TIMELINE={loopStart:5,loopEnd:63,chapters:[5,17,29,40,53]};
/** Default piece (M-14) for tools that only need its size. */
export const PIECE={w:.15,d:.075,h:.004};
export const M14={id:'M-14',zone:'plaza',family:'J2',modelMm:[150,75,4],projectM:[3,1.5],peMm:20,concreteMm:80,position:'P-14',reuse:'Q-01',qrCenterMm:[0,0]};

export const FLAKE_VS=`
attribute vec2 aUv;attribute vec3 aLand;attribute vec4 aSeed;attribute vec3 aColor;
uniform float uTime,uTear,uSwirl,uLand,uSettle,uMode,uRise,uConverge,uVis,uWaveT,uSwirlR,uInfR,uSize;uniform vec3 uTarpC,uRetOff;uniform vec2 uTarpS;
varying vec3 vColor;varying float vLight;
float wave(vec2 p,float t){return .0036*sin(p.x*11.+t*2.1)+.0024*sin(p.y*15.-t*1.6+p.x*4.)+.0015*sin((p.x+p.y)*21.+t*2.9);}
vec3 rot(vec3 v,vec3 k,float a){float c=cos(a),s=sin(a);return v*c+cross(k,v)*s+k*dot(k,v)*(1.-c);}
void main(){
 vec2 tp=aUv-.5;vec3 tarp=uTarpC+vec3(tp.x*uTarpS.x,wave(tp,uWaveT),-tp.y*uTarpS.y);
 float tear=smoothstep(0.,1.,clamp((uTear-aSeed.x)*7.,0.,1.));
 float ang=aSeed.y*6.2832+uTime*(1.1+aSeed.z*1.6);
 float r=mix(uSwirlR,.017,uSwirl)*(.45+.55*aSeed.w);
 float y=mix(uTarpC.y,.026,uSwirl)+(aSeed.z-.5)*.045*(1.-.7*uSwirl)+.006*sin(uTime*2.5+aSeed.y*30.);
 vec3 swirl=vec3(cos(ang)*r,y,sin(ang)*r*.72);
 vec3 burst=normalize(tarp-uTarpC+vec3(0.,.0005,0.))*.03*sin(tear*3.1416);
 vec3 p=mix(tarp,swirl,tear)+burst;
 float l=smoothstep(0.,1.,clamp(uLand*1.6-aSeed.w*.6,0.,1.));
 p=mix(p,aLand,l)+vec3(0.,.022*sin(l*3.1416)*(1.-l),0.);
 float size=uSize*(.55+.9*aSeed.z)*tear*(1.-uSettle*smoothstep(.55,1.,l));
 vec3 col=mix(mix(vec3(.94,.95,.93),vec3(.17,.42,.66),step(fract(aUv.y*3.+.05),.22)),aColor,smoothstep(.15,.9,uSwirl));
 float calm=l;
 if(uMode>.5){
  vec3 start=aLand+uRetOff;
  float rr=smoothstep(0.,1.,clamp(uRise*1.5-aSeed.x*.5,0.,1.));
  float s=aSeed.y*6.2832+uTime*.55*(.8+.4*aSeed.z);float den=1.+sin(s)*sin(s);
  vec3 inf=vec3(uInfR*cos(s)/den,.045+.01*sin(s*3.+aSeed.w*6.)+(aSeed.z-.5)*.02,uInfR*.55*sin(s)*cos(s)/den)+(aSeed.xyz-.5)*.01;
  float cv=smoothstep(0.,1.,clamp(uConverge*1.4-aSeed.w*.4,0.,1.));
  p=mix(mix(start,inf,rr),vec3(0.,.003,0.),cv);
  size=uSize*(.55+.9*aSeed.z)*rr*(1.-cv*cv);
  col=mix(aColor,vec3(.62,1.,.86),cv*.8+rr*.2);calm=0.;
 }
 size*=uVis;
 float spin=(uTime*(2.+aSeed.w*5.)+aSeed.y*20.)*(1.-calm);
 vec3 axis=normalize(aSeed.xyz-.5+vec3(.001,.002,0.));
 vec3 v=rot(position*size,axis,spin),n=rot(vec3(0.,1.,0.),axis,spin);
 gl_Position=projectionMatrix*modelViewMatrix*vec4(p+v,1.);
 vLight=.42+.58*abs(dot(normalize(mat3(modelMatrix)*n),normalize(vec3(.3,.9,.4))));
 vColor=col;
}`;
export const FLAKE_FS='varying vec3 vColor;varying float vLight;void main(){gl_FragColor=vec4(vColor*vLight,1.);}';

export function createPieceScene({piece=M14,lang='es',passport=null,shadows=true}={}){
 const P={w:piece.modelMm[0]/1000,d:piece.modelMm[1]/1000,h:(piece.modelMm[2]||4)/1000},TABLE=-P.h,big=Math.max(P.w,P.d);
 const vars=pieceVars(piece,passport,lang),L=k=>fmt(tr(T[k],lang),vars);
 const root=new THREE.Group(),stage=new THREE.Group();root.add(stage);root.name='piece-root';
 // The QR may sit off-centre on the piece: the stage is shifted so that the origin stays on the QR.
 stage.position.set(-(piece.qrCenterMm?.[0]||0)/1000,0,-(piece.qrCenterMm?.[1]||0)/1000);
 const cues=[];let t=0,paused=false,lastT=0;

 // Lights. The key light casts the only shadow; catchers show it on the real table and the real piece.
 stage.add(new THREE.HemisphereLight(0xf2fff4,0x1b3940,1.6));
 const key=new THREE.DirectionalLight(0xfff3dc,2.6);key.position.set(.12,.34,.2);key.target.position.set(0,0,0);stage.add(key,key.target);
 const ext=Math.max(.28,big*.9+.12);
 if(shadows){key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-ext,right:ext,top:ext,bottom:-ext,near:.05,far:1.2});key.shadow.bias=-.0004;key.shadow.normalBias=.002}
 const fill=new THREE.DirectionalLight(0x7ce0d0,.9);fill.position.set(-.3,.15,-.2);stage.add(fill);
 const catcher=(w,d,y,o)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.ShadowMaterial({color:0x00141a,opacity:o}));m.rotation.x=-Math.PI/2;m.position.y=y;m.receiveShadow=true;m.renderOrder=-5;stage.add(m);return m};
 catcher(2*ext+.2,2*ext+.2,TABLE+.0001,.26);catcher(P.w,P.d,.00015,.3);

 // The physical piece: invisible, but it writes depth so virtual objects pass behind it correctly.
 const occluder=new THREE.Mesh(new THREE.BoxGeometry(P.w,P.h,P.d),new THREE.MeshBasicMaterial({colorWrite:false}));
 occluder.position.y=-P.h/2;occluder.renderOrder=-10;occluder.name='piece';stage.add(occluder);

 // --- 0 · awakening: radar ring, traced contour, scan grid, identity tag ---
 const ring=new THREE.Mesh(new THREE.RingGeometry(.96,1,96),new THREE.MeshBasicMaterial({color:MINT,transparent:true,depthWrite:false,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.0004;stage.add(ring);
 const contour=ribbon(rectPath(P.w+.003,P.d+.003),.0014,true,ribbonMaterial(MINT,22));contour.position.y=.0004;stage.add(contour);
 const brackets=new THREE.Group();for(const[sx,sz]of[[-1,-1],[1,-1],[1,1],[-1,1]]){const x=sx*(P.w/2+.006),z=sz*(P.d/2+.006),k=Math.min(.014,big*.1);const b=ribbon([[x-sx*k,z],[x,z],[x,z-sz*k]],.0018,false,ribbonMaterial(MINT,0));b.material.uniforms.uProg.value=1;b.position.y=.0005;brackets.add(b)}stage.add(brackets);
 const scan=new THREE.Mesh(new THREE.PlaneGeometry(P.w,P.d),new THREE.ShaderMaterial({transparent:true,depthWrite:false,extensions:{derivatives:true},
  uniforms:{uSweep:{value:0},uOpacity:{value:0},uColor:{value:MINT.clone()},uGrid:{value:new THREE.Vector2(Math.round(P.w/.0075),Math.round(P.d/.0075))}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform float uSweep,uOpacity;uniform vec3 uColor;uniform vec2 uGrid;varying vec2 vUv;void main(){vec2 g=uGrid*vUv;vec2 f=abs(fract(g-.5)-.5)/fwidth(g);float line=1.-min(min(f.x,f.y),1.);float behind=step(vUv.x,uSweep);float band=exp(-abs(vUv.x-uSweep)*45.);float a=(line*.65*behind+band*.6)*uOpacity;if(a<.004)discard;gl_FragColor=vec4(mix(uColor*.75,vec3(1.),band*.5),a);}'}));
 scan.rotation.x=-Math.PI/2;scan.position.y=.0006;stage.add(scan);
 const tag=fadeable(label({title:piece.id.replace('-','–'),lines:[L('tagSub'),`CUEVA-BCN-${piece.id} · ${tr(T.zoneLabel[piece.zone]||T.zoneLabel.plaza,lang)}`],px:.00013}));tag.position.set(-Math.min(.05,P.w*.33),.03,-.01);stage.add(tag);

 // --- 1 · origin: refit tarp -> flakes -> board ---
 const noise=valueNoise(2026),TW=Math.min(.2,Math.max(.1,P.w*.87)),TD=Math.min(.14,Math.max(.075,P.d*1.13));
 const tarpGeo=new THREE.PlaneGeometry(1,1,40,26);tarpGeo.rotateX(-Math.PI/2);
 const tarpBase=Float32Array.from(tarpGeo.attributes.position.array);
 const tarpMat=new THREE.MeshStandardMaterial({map:tarpTexture(),alphaMap:noiseTexture(noise),alphaTest:.999,side:THREE.DoubleSide,roughness:.78,metalness:0});
 const tarp=new THREE.Mesh(tarpGeo,tarpMat);tarp.castShadow=true;
 tarp.customDepthMaterial=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,alphaMap:tarpMat.alphaMap,alphaTest:.999});stage.add(tarp);
 const tarpLabel=fadeable(label({title:L('tarp')}));stage.add(tarpLabel);
 const wave=(x,z,w)=>.0036*Math.sin(x*11+w*2.1)+.0024*Math.sin(z*15-w*1.6+x*4)+.0015*Math.sin((x+z)*21+w*2.9);
 function shapeTarp(cy,w){const p=tarpGeo.attributes.position.array;for(let i=0;i<p.length;i+=3){const x=tarpBase[i],z=tarpBase[i+2];p[i]=x*TW;p[i+1]=cy+wave(x,-z,w);p[i+2]=z*TD}tarpGeo.attributes.position.needsUpdate=true;tarpGeo.computeVertexNormals()}

 const N0=2592,nx=Math.max(8,Math.round(Math.sqrt(N0*P.w/P.d))),nz=Math.max(8,Math.floor(N0/nx)),N=nx*nz,tri=new THREE.InstancedBufferGeometry();
 tri.setAttribute('position',new THREE.Float32BufferAttribute([-1,0,-.7,1,0,-.5,-.1,0,1],3));tri.instanceCount=N;
 const aUv=new Float32Array(N*2),aLand=new Float32Array(N*3),aSeed=new Float32Array(N*4),aColor=new Float32Array(N*3),r=rng(14),pe=PE_COLORS.map(c=>new THREE.Color(c));
 for(let i=0;i<N;i++){const gx=i%nx,gz=Math.floor(i/nx),u=r(),v=r();aUv.set([u,v],i*2);
  aLand.set([(gx+.5)/nx*(P.w-.002)-(P.w-.002)/2+(r()-.5)*.0015,.0012+r()*.0012,(gz+.5)/nz*(P.d-.002)-(P.d-.002)/2+(r()-.5)*.0015],i*3);
  aSeed.set([noise(u,v),r(),r(),r()],i*4);const c=pe[Math.floor(r()*pe.length)];aColor.set([c.r,c.g,c.b],i*3)}
 tri.setAttribute('aUv',new THREE.InstancedBufferAttribute(aUv,2));tri.setAttribute('aLand',new THREE.InstancedBufferAttribute(aLand,3));
 tri.setAttribute('aSeed',new THREE.InstancedBufferAttribute(aSeed,4));tri.setAttribute('aColor',new THREE.InstancedBufferAttribute(aColor,3));
 const flakeU={uTime:{value:0},uTear:{value:0},uSwirl:{value:0},uLand:{value:0},uSettle:{value:0},uMode:{value:0},uRise:{value:0},uConverge:{value:0},uVis:{value:0},uWaveT:{value:0},
  uTarpC:{value:new THREE.Vector3(0,.09,0)},uTarpS:{value:new THREE.Vector2(TW,TD)},uRetOff:{value:new THREE.Vector3()},uSwirlR:{value:Math.max(.06,big*.5)},uInfR:{value:Math.max(.2,P.w/2+.09)},uSize:{value:.0013*Math.sqrt(Math.max(1,P.w*P.d/.01125))}};
 const flakes=new THREE.Mesh(tri,new THREE.ShaderMaterial({uniforms:flakeU,vertexShader:FLAKE_VS,fragmentShader:FLAKE_FS,side:THREE.DoubleSide}));flakes.frustumCulled=false;stage.add(flakes);
 const flakeLabel=fadeable(label({title:L('flakes')}));flakeLabel.position.set(P.w/2,.07,0);stage.add(flakeLabel);

 // --- 2 · material: PE board + concrete layer (thickness from the project data) ---
 const conTex=concreteTexture(),boardH=.0026,conH=boardH*piece.concreteMm/piece.peMm*1.13;
 const layers=new THREE.Group();stage.add(layers);
 const board=new THREE.Mesh(new RoundedBoxGeometry(P.w,boardH,P.d,2,.0006),new THREE.MeshStandardMaterial({map:peTexture(),roughness:.6,color:0xd8edcf}));board.name='pe';board.castShadow=true;layers.add(board);
 const conGeo=new RoundedBoxGeometry(P.w,conH,P.d,2,.0009);conGeo.translate(0,conH/2,0);
 const concrete=new THREE.Mesh(conGeo,new THREE.MeshStandardMaterial({map:conTex,roughness:.92,color:0xcfd3c6}));concrete.name='concrete';concrete.castShadow=true;layers.add(concrete);
 const engraving=new THREE.Mesh(new THREE.PlaneGeometry(.05,.02),new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,map:canvasTexture(512,200,(g)=>{g.fillStyle='#2f5653';g.font='600 92px Mono, monospace';g.fillText(piece.id.replace('-','–'),14,96);g.font='500 34px Mono, monospace';g.fillText('CUEVA-BCN · PE',18,160)})}));
 engraving.rotation.x=-Math.PI/2;engraving.position.set(-P.w/2+.031,conH+.0001,Math.min(.018,P.d/2-.012));concrete.add(engraving);
 fadeable(layers);
 const guides=new THREE.Group();for(const x of[-P.w/2,P.w/2])for(const z of[-P.d/2,P.d/2]){const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,0,z),new THREE.Vector3(x,1,z)]),new THREE.LineDashedMaterial({color:MINT,dashSize:.004,gapSize:.003,transparent:true}));l.computeLineDistances();guides.add(l)}stage.add(fadeable(guides,.7));
 const showMass=piece.concreteMm===80&&vars.kg!=='—';
 const peLabel=fadeable(label({title:L('peLayer')})),conLabel=fadeable(label({title:L('concreteLayer')})),fmtLabel=fadeable(label({lines:showMass?[L('format'),L('mass')]:[L('format')]}));
 stage.add(peLabel,conLabel,fmtLabel);
 const pulse=new THREE.Mesh(new THREE.RingGeometry(.9,1,80),new THREE.MeshBasicMaterial({color:MINT,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));pulse.rotation.x=-Math.PI/2;stage.add(pulse);

 // --- 3 · identity: light column, passport card, ring of the recorded readings ---
 const column=new THREE.Mesh(new THREE.CylinderGeometry(.011,.016,.09,40,1,true),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
  uniforms:{uTime:{value:0},uOpacity:{value:0},uColor:{value:MINT.clone()}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform float uTime,uOpacity;uniform vec3 uColor;varying vec2 vUv;void main(){float a=pow(1.-vUv.y,1.6)*(.3+.18*sin(vUv.y*42.-uTime*6.))*uOpacity;gl_FragColor=vec4(uColor,a);}'}));
 column.position.y=.045;stage.add(column);
 const motesG=new THREE.BufferGeometry(),M=140,mp=new Float32Array(M*3),r2=rng(5);for(let i=0;i<M;i++)mp.set([r2(),r2(),r2()],i*3);motesG.setAttribute('position',new THREE.BufferAttribute(mp,3));
 const motes=new THREE.Points(motesG,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uTime:{value:0},uOpacity:{value:0},uViewH:{value:1000}},
  vertexShader:'uniform float uTime,uViewH;varying float vA;void main(){float y=fract(position.y+uTime*.22);float a=position.x*6.2832+uTime*.6;float r=.004+position.z*.009;vec3 p=vec3(cos(a)*r,y*.09,sin(a)*r);vA=sin(y*3.1416);vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=max(1.5,uViewH*.5*projectionMatrix[1][1]*.0016/-mv.z);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform float uOpacity;varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,d)*vA*uOpacity;gl_FragColor=vec4(.6,1.,.88,a);}'}));
 motes.frustumCulled=false;stage.add(motes);
 const readings=(passport?.recordedJourney||[]).filter(e=>/^F[1-8]$/.test(e.phase));
 const phases=readings.length?readings.map(e=>e.phase):piece.reuse?['F1','F2','F3','F4','F5','F6','F7','F8']:['F1','F2','F3','F4','F5','F8'];
 const clock=at=>{try{return new Intl.DateTimeFormat('es-ES',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'}).format(new Date(at))}catch{return''}};
 const card=fadeable(label({title:`CUEVA-BCN-${piece.id}`,lines:[L('passportCard'),`${L('batch')} ${vars.batch} · ${L('composition')}`,`${readings.length||phases.length} ${L('readings')}`,L('integrity')],px:.00014}));
 card.position.set(0,.082,0);card.name='passport';stage.add(card);
 const RX=P.w/2+.043,RZ=P.d/2+.031,ringPts=Array.from({length:160},(_,i)=>{const a=i/160*Math.PI*2-Math.PI/2;return[Math.cos(a)*RX,Math.sin(a)*RZ]});
 const phaseRing=ribbon(ringPts,.0013,true,ribbonMaterial(MINT,10));phaseRing.position.y=TABLE+.0004;stage.add(phaseRing);
 const NODE_STEP=Math.min(.75,6/phases.length),nodes=phases.map((ph,i)=>{const a=i/phases.length*Math.PI*2-Math.PI/2+Math.PI/phases.length,rec=readings.find(e=>e.phase===ph);
  const g=new THREE.Group();g.position.set(Math.cos(a)*RX,TABLE,Math.sin(a)*RZ);
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(.0042,.0042,.0014,24),new THREE.MeshStandardMaterial({color:0x0d3b40,emissive:MINT,emissiveIntensity:0,roughness:.4}));disc.position.y=.0007;disc.name='phase:'+ph;disc.castShadow=true;g.add(disc);
  const lbl=label({title:ph,lines:[fmt(tr(T.phases[ph],lang),vars)+(rec?' · '+clock(rec.at):'')],px:.000105});lbl.position.y=.009;g.add(lbl);
  g.userData={disc,lbl,phase:ph,a};stage.add(g);return g});
 const glow=glowTexture(),spark=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
 spark.scale.setScalar(.012);stage.add(spark);

 // --- 4 · use: the zone's own staging ---
 const ctx={P,TABLE,piece,vars,lang,L,stage,glow,conTex};
 // Chapter 4 comes from the piece's experience (experiences.mjs) or, as a fallback, its zone (zones.mjs).
 // It starts at 40 s and lasts zone.duration; an experience with an interaction holds the clock at
 // 40 + interaction.holdAt until the visitor decides. The return chapter follows it (10 s).
 const zone=(EXPERIENCES[piece.experience]||ZONES[piece.zone]||ZONES.plaza)(ctx);
 const D=zone.duration||13,U1=40+D,R=U1-53,hold=zone.interaction?40+zone.interaction.holdAt:null;
 const TL={loopStart:5,loopEnd:63+R,chapters:[5,17,29,40,U1],useEnd:U1,hold};
 stage.add(zone.group);fadeable(zone.group);
 flakeU.uRetOff.value.fromArray(zone.retOff||[0,.0012,0]);

 // Hologram of the piece: the identity that leaves the physical model (zone may move it in chapter 4).
 const ghost=new THREE.Group(),ghostMat=new THREE.MeshStandardMaterial({color:MINT,emissive:MINT,emissiveIntensity:.45,transparent:true,opacity:.34,depthWrite:false,roughness:.3});
 {const H=boardH+conH,g=new THREE.BoxGeometry(P.w,H,P.d);g.translate(0,H/2,0);ghost.add(new THREE.Mesh(g,ghostMat),new THREE.LineSegments(new THREE.EdgesGeometry(g),new THREE.LineBasicMaterial({color:MINT,transparent:true})))}
 stage.add(ghost);fadeable(ghost);
 const flash=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:0}));stage.add(flash);

 const CUES=[['ring',.05],['trace',.4],['tarp',5],['tear',9.2],['swirl',10.4],['land',13.6],['pour',17.4],['explode',20.2],['join',25.4],['column',29.2],['dissolve',53.6+R],['rise',55+R],['converge',58.2+R],['flash',60+R],...(zone.cues||[])];
 const cue=(name,at)=>{if(lastT<at&&t>=at)cues.push(name)};
 let standby=false;
 const waiting=()=>hold!==null&&!zone.interaction.choice&&t>=hold-1e-6;
 function update(dt,camera){
  if(!paused&&!standby){lastT=t;t+=dt;
   if(hold!==null&&!zone.interaction.choice&&lastT<=hold&&t>hold)t=hold; // wait for the visitor's decision
   if(t>=TL.loopEnd){t=TL.loopStart;lastT=t-1e-4;zone.interaction?.reset?.()}}
  const time=performance.now()/1000,tR=t-R;
  for(const[n,a]of CUES)cue(n,a);
  if(standby){ // Not anchored yet: only the outline of the piece, so the visitor sees where the story will appear.
   contour.visible=brackets.visible=true;contour.material.uniforms.uProg.value=1;contour.material.uniforms.uOpacity.value=.45+.25*Math.sin(time*4);
   brackets.children.forEach(b=>{b.scale.setScalar(1);b.material.uniforms.uOpacity.value=.6});ring.visible=false;flakes.visible=tarp.visible=false;
   setFade(zone.group,0);setFade(ghost,0);setFade(tag,0);setFade(card,0);setFade(layers,0);scan.material.uniforms.uOpacity.value=0;column.visible=motes.visible=spark.visible=flash.visible=pulse.visible=false;nodes.forEach(n=>n.visible=false);
   return}
  // 0 · awakening (first lock only; the loop restarts at 5 s)
  const rr=seg(t,.05,1.4);ring.visible=t<1.5;ring.scale.setScalar(.01+out(rr)*(big*.6+.04));ring.material.opacity=(1-rr)*.9;
  contour.material.uniforms.uProg.value=t<5?io(seg(t,.4,2.2)):1;
  contour.material.uniforms.uOpacity.value=t<5?1:lerp(.28,.9,Math.max(win(tR,60,62.6,.3,1.5),win(t,40,U1+4,1,1)*.6));
  brackets.children.forEach((b,i)=>{const p=t<5?back(seg(t,1.6+i*.12,2.2+i*.12)):1;b.scale.setScalar(Math.max(.001,p));b.material.uniforms.uOpacity.value=t<5?.9:.35});
  scan.material.uniforms.uSweep.value=io(seg(t,1.2,3));scan.material.uniforms.uOpacity.value=win(t,1.2,5,.2,1.4);
  setFade(tag,win(t,2.4,9,.6,.8));tag.position.y=.03+out(seg(t,2.4,3.4))*.012;
  // 1 · origin
  const ty=lerp(.15,.068,out(seg(t,5,8)))+.003*Math.sin(time*1.3);flakeU.uTarpC.value.set(.004*Math.sin(time*.7),ty,0);flakeU.uWaveT.value=time;
  tarp.visible=t>5&&t<11;if(tarp.visible){shapeTarp(ty,time);tarp.position.x=flakeU.uTarpC.value.x;const thr=t<9.2?1-io(seg(t,5,6.6))*.999:io(seg(t,9.2,10.7));tarpMat.alphaTest=tarp.customDepthMaterial.alphaTest=clamp(thr,.001,.999)}
  setFade(tarpLabel,win(t,6,9.2,.5,.4));tarpLabel.position.set(-TW*.55,ty+.012,-.03);
  flakeU.uTime.value=time;
  const ret=tR>=53;flakeU.uMode.value=ret?1:0;
  flakeU.uTear.value=seg(t,9.2,10.7)*1.15;flakeU.uSwirl.value=io(seg(t,10.2,13.4));flakeU.uLand.value=io(seg(t,13.4,15.6));flakeU.uSettle.value=seg(t,14.8,16.2);
  flakeU.uRise.value=io(seg(tR,53.6,56.2));flakeU.uConverge.value=io(seg(tR,58,60.2));
  flakeU.uVis.value=ret?(tR<61?1:0):(t>9&&t<16.4?1:0);flakes.visible=flakeU.uVis.value>0;
  setFade(flakeLabel,win(t,10.6,13.4,.4,.5));flakeLabel.position.y=.042+.006*Math.sin(time);
  // 2 · material
  const boardIn=seg(t,14.6,16.2),layersOn=t>=14.6&&t<39.5;
  setFade(layers,layersOn?Math.min(1,t<17?boardIn:1)*(t>36.5?1-seg(t,36.5,39.5):1)*(t>29?lerp(1,.55,seg(t,29,30)):1):0);
  const pour=io(seg(t,17.2,19.6)),ex=io(seg(t,20.2,22.6))*(1-io(seg(t,25.2,26.8)));
  concrete.visible=t>17.2&&layersOn;concrete.scale.y=Math.max(.001,pour);
  board.position.y=boardH/2+ex*.014;concrete.position.y=boardH+ex*(.02+conH);
  setFade(guides,win(t,20.2,26.8,.5,.4));guides.children.forEach(l=>{l.scale.y=Math.max(.001,concrete.position.y+conH*pour)});
  const lb=win(t,21.2,26.2,.5,.4);setFade(peLabel,lb);setFade(conLabel,lb);setFade(fmtLabel,win(t,22,28.6,.5,.5));
  peLabel.position.set(P.w/2+.023,board.position.y-.002,.012);conLabel.position.set(P.w/2+.023,concrete.position.y+conH*.3,.012);fmtLabel.position.set(0,concrete.position.y+conH+.008,.03);
  const pj=seg(t,26.6,27.8);pulse.visible=pj>0&&pj<1;pulse.scale.setScalar(big*.4+pj*big*.55);pulse.material.opacity=(1-pj)*.8;pulse.position.y=boardH+conH+.002;
  // 3 · identity
  const id=win(t,29.2,39.6,1,1.2);column.material.uniforms.uOpacity.value=id;column.material.uniforms.uTime.value=time;column.visible=id>0;column.scale.y=Math.max(.001,out(seg(t,29.2,30.4)));column.position.y=.045*column.scale.y;
  motes.material.uniforms.uOpacity.value=id;motes.material.uniforms.uTime.value=time;motes.visible=id>0;
  const cardIn=back(seg(t,30.2,31.2));setFade(card,id*seg(t,30.2,30.6));card.position.y=.082+.003*Math.sin(time*1.1);
  phaseRing.material.uniforms.uProg.value=io(seg(t,30.6,32));phaseRing.material.uniforms.uOpacity.value=id;
  nodes.forEach((g,i)=>{const at=31.6+i*NODE_STEP,on=seg(t,at,at+.4),{disc,lbl}=g.userData;g.visible=id>0;disc.material.emissiveIntensity=on*(1.1+.5*Math.sin(time*4+i));disc.scale.setScalar(Math.max(.001,back(on)));lbl.material.opacity=on*id;lbl.visible=on*id>0;cue('node',at)});
  const sp=seg(t,31.6,31.6+NODE_STEP*nodes.length);spark.visible=id>0&&sp>0&&sp<1;if(spark.visible){const a=sp*Math.PI*2-Math.PI/2+Math.PI/nodes.length;spark.position.set(Math.cos(a)*RX,TABLE+.003,Math.sin(a)*RZ)}
  // 4 · use (zone) + the hologram's default path: it rises from the model and dissolves into the return
  const pf=win(t,40,U1+4,1.2,1.6);setFade(zone.group,pf);
  const g=zone.update(t,time,pf,camera,{waiting:waiting(),tR})||{};
  if(g.retOff)flakeU.uRetOff.value.fromArray(g.retOff);if(g.cue)cues.push(g.cue);
  if(g.ghost){ghost.position.set(...g.ghost.pos);setFade(ghost,g.ghost.a)}
  else{ghost.position.set(0,lerp(.0002,.02,io(seg(tR,52,53.6))),0);setFade(ghost,win(tR,51.6,55.2,.6,1.4))}
  // Labels: world-sized, but never huge when the phone is close to them.
  if(camera){camera.getWorldPosition(camPos);const s=root.getWorldScale(tmp2).x;for(const l of labels){if(!l.visible)continue;l.getWorldPosition(tmp);const k=clamp(camPos.distanceTo(tmp)/s/.32,.42,1.15);l.scale.set(l.userData.s0.x*k,l.userData.s0.y*k*(l===card?Math.max(.001,cardIn):1),1)}}
  // 5 · return
  const fl=seg(tR,59.8,61.2);flash.visible=fl>0&&fl<1;flash.material.opacity=Math.sin(fl*Math.PI)*.95;flash.scale.setScalar(.01+fl*.09);flash.position.y=.004;
 }
 const labels=[];root.traverse(o=>{if(o.isSprite&&o.userData.isLabel){o.userData.s0=o.scale.clone();labels.push(o)}});
 const camPos=new THREE.Vector3(),tmp=new THREE.Vector3(),tmp2=new THREE.Vector3();
 const pickables=[board,concrete,occluder,card,...nodes.map(n=>n.userData.disc),...(zone.pickables||[])];
 const captions=[0,1,2,3,4].map(i=>{const c=i===3?(zone.caption||T.zone[piece.zone]||T.zone.plaza):T.ch[i];return{kick:fmt(tr(c.kick,lang),vars),title:fmt(tr(c.title,lang),vars),text:fmt(tr(c.text,lang),vars)}});
 return{root,piece,captions,chapterNames:T.chShort.map(c=>tr(c,lang)),timeline:TL,interaction:zone.interaction||null,waiting,
  setStandby:v=>{standby=v},get standby(){return standby},
  get time(){return t},get paused(){return paused},
  setPaused:v=>{paused=v},
  seek:v=>{t=v;lastT=v},
  chapterAt:(v=t)=>{if(v<TL.chapters[0])return -1;let i=0;TL.chapters.forEach((c,k)=>{if(v>=c)i=k});return i},
  restart:()=>{t=0;lastT=0;zone.interaction?.reset?.()},
  takeCues:()=>cues.splice(0),
  update,
  setViewHeight:h=>{motes.material.uniforms.uViewH.value=h},
  pointer:(type,raycaster)=>waiting()||zone.interaction?.active?.()?zone.interaction.pointer?.(type,raycaster)??false:false,
  pick(raycaster){const hit=raycaster.intersectObjects(pickables.filter(o=>{let v=true;o.traverseAncestors(a=>{if(!a.visible)v=false});return v&&o.visible}),false)[0];if(!hit)return null;const n=hit.object.name;return n.startsWith('phase:')?{kind:'phase',phase:n.slice(6)}:{kind:['pe','concrete','passport'].includes(n)?n:'piece'}},
  infoVars:vars,
  dispose(){root.traverse(o=>{o.geometry?.dispose();for(const m of[o.material].flat().filter(Boolean)){m.map?.dispose();m.alphaMap?.dispose();m.dispose()}})},
 };
}
/** Kept for the tools that build the original M-14 scene. */
export const createM14Scene=opts=>createPieceScene({piece:M14,...opts});
