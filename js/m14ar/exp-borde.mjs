// Borde (M-19, J1 75 × 75 mm): where the quay meets the sea. Cinematic chapter 4, 40–64 s.
//  40–42.5 the sea opens behind the piece · 41–46 a boat arrives · 46–49.6 a person walks to the bollard and moors it
//  49.6–53 calm, a neighbour fishes from the edge · 53–57.5 swell: the boat rocks, spray jumps the edge and wets the piece
//  57.5–64 calm returns at dusk: warm light on the water, the quay lamp switches on.
import {THREE,seg,io,out,win,lerp,clamp,label,water,person,bollard,motorBoat,rope,canvasTexture,MATS} from './kit.mjs?v=7.0';
import {base} from './zones.mjs?v=7.0';
import {tr} from './text.mjs?v=7.0';

const CAPTION={
 kick:['04 · USO','04 · USE','04 · ÚS'],
 title:['Donde el muelle se encuentra con el mar.','Where the quay meets the sea.','On el moll es troba amb el mar.'],
 text:['Posición {pos}, en el borde: amarres, oleaje y sal cada día. Escena ilustrativa; su pasaporte guarda las lecturas reales.','Position {pos}, at the edge: moorings, swell and salt every day. Illustrative scene; its passport keeps the real readings.','Posició {pos}, a la vora: amarratges, onatge i sal cada dia. Escena il·lustrativa; el seu passaport guarda les lectures reals.'],
};

/** Many small glowing particles in one draw call. */
function particles(n,size,color,map,blending=THREE.AdditiveBlending){
 const geo=new THREE.BufferGeometry(),pos=new Float32Array(n*3);geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
 const pts=new THREE.Points(geo,new THREE.PointsMaterial({size,map,color,transparent:true,opacity:0,depthWrite:false,blending,sizeAttenuation:true}));
 pts.frustumCulled=false;return pts;
}

export function bordeExperience(ctx){
 const{P,TABLE,piece,lang,glow}=ctx,b=base(ctx),{g}=b,L=a=>tr(a,lang);
 // Neutral radial glow, so warm colours stay warm (the shared glow texture is mint).
 const warm=canvasTexture(64,64,(c,w)=>{const gr=c.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.4,'rgba(255,255,255,.45)');gr.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=gr;c.fillRect(0,0,w,w)});
 const quayZ=-(P.d/2+.007),W=Math.max(.5,P.w*6),BZ=quayZ-.034;
 const wat=b.quay(quayZ,W,{bollards:false});b.slab(-(P.w+.007));b.slab(P.w+.007);b.posLabel(`${piece.position} · ${piece.id}`);

 // Quay furniture: the mooring bollard right of the piece, a lamp on the left.
 const post=bollard();post.position.set(P.w/2+.035,TABLE+.0065,quayZ+.0045);g.add(post);
 const lamp=new THREE.Group(),lampHead=new THREE.MeshStandardMaterial({color:0xfff6dc,emissive:0xffd890,emissiveIntensity:0,roughness:.4});
 {const pole=new THREE.Mesh(new THREE.CylinderGeometry(.0012,.0016,.17,8),MATS.dark),arm=new THREE.Mesh(new THREE.BoxGeometry(.018,.0015,.0015),MATS.dark),head=new THREE.Mesh(new THREE.SphereGeometry(.0045,12,8),lampHead);
  pole.position.y=.085;arm.position.set(.008,.168,0);head.position.set(.016,.164,0);pole.castShadow=true;lamp.add(pole,arm,head)}
 lamp.position.set(-(P.w/2+.05),TABLE,quayZ+.012);g.add(lamp);
 const lampGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:warm,color:0xffc878,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:0}));lampGlow.scale.setScalar(.05);lampGlow.position.set(lamp.position.x+.016,TABLE+.164,lamp.position.z);g.add(lampGlow);
 const pool=new THREE.Mesh(new THREE.CircleGeometry(.05,32),new THREE.MeshBasicMaterial({map:warm,color:0xffb860,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:0}));pool.rotation.x=-Math.PI/2;pool.position.set(lamp.position.x+.016,.0006,lamp.position.z+.02);g.add(pool);

 // The boat, its wake and the mooring line.
 const boat=motorBoat();g.add(boat);const line=rope();g.add(line);
 const cabinLight=new THREE.Sprite(new THREE.SpriteMaterial({map:warm,color:0xffd9a0,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:0}));cabinLight.scale.setScalar(.022);g.add(cabinLight);
 const wake=particles(24,.007,0xffffff,glow);g.add(wake);
 const bowLocal=new THREE.Vector3(.064,.013,0),cabinLocal=new THREE.Vector3(-.012,.02,0),bow=new THREE.Vector3(),cab=new THREE.Vector3();

 // People: one walks to the bollard and moors the boat; a neighbour sits on the edge fishing.
 const mooring=person(0x9fc9c0);g.add(mooring);
 const sitter=person(0xe6b8a2,{seated:true});sitter.position.set(-(P.w+.007)+.012,-.039,quayZ+.007);sitter.rotation.y=Math.PI/2;g.add(sitter);
 const rodGeo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),rod=new THREE.Line(rodGeo,new THREE.LineBasicMaterial({color:0x2b3436,transparent:true}));rod.frustumCulled=false;g.add(rod);
 const fishLine=rope();fishLine.material.color.set(0xdde8e4);g.add(fishLine);

 // Sea life: foam against the edge, spray in the swell, a wet patch on the piece, gulls, dusk light.
 const foam=particles(36,.006,0xffffff,glow);g.add(foam);
 const SPRAY=110,spray=particles(SPRAY,.008,0xf4fdff,warm,THREE.NormalBlending);g.add(spray);
 const seed=Array.from({length:SPRAY},(_,i)=>({x:(Math.sin(i*12.9898)*.5)*.18,v:.3+((i*7)%10)/10*.2,vz:.06+((i*3)%10)/10*.1,vx:((i*5)%10/10-.5)*.06,burst:i%2}));
 const wet=new THREE.Mesh(new THREE.PlaneGeometry(P.w*1.9,P.d*.7),new THREE.MeshBasicMaterial({color:0x10262c,transparent:true,opacity:0,depthWrite:false,
  alphaMap:canvasTexture(128,64,(c,w,h)=>{const gr=c.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#fff');gr.addColorStop(1,'#000');c.fillStyle=gr;c.fillRect(0,0,w,h)})}));
 wet.material.alphaMap.colorSpace=THREE.NoColorSpace;wet.rotation.x=-Math.PI/2;wet.position.set(0,.0005,-P.d/2+P.d*.35);g.add(wet);
 const birds=b.gulls(2);
 const sun=new THREE.Sprite(new THREE.SpriteMaterial({map:warm,color:0xff7a3a,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:0}));sun.scale.setScalar(.16);sun.position.set(-.08,.03,quayZ-.3);g.add(sun);
 const tint=new THREE.Mesh(new THREE.PlaneGeometry(W*.9,.17),new THREE.MeshBasicMaterial({map:warm,color:0xff8a4c,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:0}));tint.rotation.x=-Math.PI/2;tint.position.set(-.04,TABLE+.0006,quayZ-.085);g.add(tint);
 const swellLabel=label({lines:[L(['Mar de fondo · ilustrativo','Swell · illustrative','Mar de fons · il·lustratiu'])],px:.00011});swellLabel.position.set(-.06,.07,quayZ-.04);g.add(swellLabel);

 const pfMat=(m,a,pf)=>{m.opacity=a*pf};
 return{duration:24,group:g,caption:CAPTION,retOff:[0,.0012,0],pickables:[],
  cues:[['water',40.2],['engine',41.2],['set',49.2],['water',54.2],['water',55.6],['node',58.6]],
  update(t,time,pf){
   const swell=win(t,53,57.5,1,1.6),dusk=seg(t,57.5,60.5),calmEnd=1-seg(t,63,64);
   wat.userData.update(time,out(seg(t,40.2,42.6))*W*.6);b.fly(birds,time);
   birds.forEach(bd=>{bd.position.y+=dusk*.06;bd.scale.setScalar(Math.max(.001,1-dusk*.7))});
   // Boat: arrives, eases into its berth, then rocks with the swell.
   const arrive=out(seg(t,41,46.2)),bx=lerp(-W*.45,post.position.x-.02,arrive),amp=1+swell*3.2;
   boat.position.set(bx,TABLE+.004+.0015*amp*Math.sin(time*2.3),BZ+.004*swell*Math.sin(time*1.7));boat.rotation.set(.03*amp*Math.sin(time*1.4),.06*(1-arrive),.04*amp*Math.sin(time*1.9));
   boat.updateMatrixWorld();bow.copy(bowLocal).applyMatrix4(boat.matrix);cab.copy(cabinLocal).applyMatrix4(boat.matrix);
   cabinLight.position.copy(cab);cabinLight.material.opacity=dusk*.9*pf;
   const speed=1-arrive,wp=wake.geometry.attributes.position;
   for(let i=0;i<24;i++){const k=((time*1.4+i/24)%1);wp.setXYZ(i,bx-.06-k*.08,TABLE+.002,BZ+((i%2)*2-1)*.012*k)}wp.needsUpdate=true;wake.material.opacity=pf*.55*speed;
   // Mooring: walk to the bollard, catch the line from the bow, tie it.
   const wk=io(seg(t,46,48.2)),mx=lerp(-.012,post.position.x-.013,wk),mz=-P.d/2+.009;
   const back=swell*.008;mooring.position.set(mx,b.ground(mx,mz),mz+back);mooring.rotation.y=wk<1?0:Math.PI/2;mooring.userData.update(t<48.2?(t-46)*.05/.045*Math.PI:0);
   mooring.scale.setScalar(Math.max(.001,seg(t,45,46)));
   const hand={x:mooring.position.x+.004,y:mooring.position.y+.05,z:mooring.position.z-.008},top={x:post.position.x,y:post.position.y+.004,z:post.position.z};
   const thr=seg(t,47.4,48.4),tie=seg(t,48.6,49.6);line.visible=thr>0;line.material.opacity=pf*.95;
   const end=tie>0?{x:lerp(hand.x,top.x,tie),y:lerp(hand.y,top.y,tie),z:lerp(hand.z,top.z,tie)}:{x:lerp(bow.x,hand.x,thr),y:lerp(bow.y,hand.y,thr)+Math.sin(thr*Math.PI)*.03,z:lerp(bow.z,hand.z,thr)};
   line.userData.set(bow,end,(tie>=1?.004+.006*(1-swell)*(.5+.5*Math.sin(time*2.3)):.008)*(1-swell*.6));
   // Neighbour fishing from the edge.
   const s=sitter.position,tipBob=.003*Math.sin(time*1.6);
   const hx=s.x,hy=s.y+.062,hz=s.z-.012,tx=hx+.01,ty=hy+.045+tipBob,tz=hz-.075;
   rodGeo.attributes.position.setXYZ(0,hx,hy,hz);rodGeo.attributes.position.setXYZ(1,tx,ty,tz);rodGeo.attributes.position.needsUpdate=true;rod.material.opacity=pf;
   fishLine.material.opacity=pf*.6;fishLine.userData.set({x:tx,y:ty,z:tz},{x:tx+.004,y:TABLE+.0005,z:tz-.02},.012);
   sitter.rotation.z=.02*Math.sin(time*.8);
   // Foam always breathing against the quay; spray in two bursts during the swell.
   const fp=foam.geometry.attributes.position;
   for(let i=0;i<36;i++){const k=(time*(.6+swell*.8)+i*.37)%1;fp.setXYZ(i,(i/35-.5)*W*.55,TABLE+.002+k*.004*swell,quayZ-.003-k*.012*(1+swell))}fp.needsUpdate=true;foam.material.opacity=pf*(.35+.4*swell);
   const sp=spray.geometry.attributes.position;let live=0;
   for(let i=0;i<SPRAY;i++){const q=seed[i],t0=q.burst?55.6:54.2,a=t-t0;
    if(a>0&&a<.9){const y=TABLE+q.v*a-.7*a*a;sp.setXYZ(i,q.x+q.vx*a,Math.max(TABLE+.001,y),quayZ-.004+q.vz*a);live++}else sp.setXYZ(i,0,-1,0)}
   sp.needsUpdate=true;spray.material.opacity=pf*(live?.95:0);
   pfMat(wet.material,clamp(seg(t,54.5,55.2)*.5-seg(t,57,63)*.5,0,.5),pf);
   swellLabel.material.opacity=win(t,53.4,57.2,.5,.6)*pf;swellLabel.visible=swellLabel.material.opacity>0;
   // Dusk: warm light on the water, the lamp switches on (with a small flicker).
   const on=seg(t,58.4,58.9),flick=on<1?(Math.sin(t*90)>0?1:.3):1;
   lampHead.emissiveIntensity=on*1.4*flick*calmEnd;pfMat(lampGlow.material,on*.9*flick,pf);pfMat(pool.material,on*.35,pf);
   pfMat(sun.material,dusk*.8,pf);pfMat(tint.material,dusk*.35,pf);
  }};
}
