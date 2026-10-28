// Chapter 4 · use, one staging per zone of the quay (1:20, like the physical models).
// Each builder returns {group, update(t,time,pf,camera) -> {ghost?}, retOff, cues, pickables}.
// t is the story time (chapter 4 runs 40-53 s, the group fades in/out over 40-57 s).
import {THREE,RoundedBoxGeometry,MINT,GOLD,seg,io,out,win,lerp,clamp,rng,label,fadeable,setFade,outline,water,person,bollard,motorBoat,sailBoat,bench,palm,gull,truck,forklift,container,bigBag,pallet,rope,MATS} from './kit.mjs?v=7.0';
import {T,tr,fmt} from './text.mjs?v=7.0';

const CLOTHES=[0xeef6f0,0xd9c7a7,0x9fc9c0,0xe6b8a2,0xb8c4d6];

/** Shared helpers for a chapter-4 staging: neighbour slabs, walkers, gulls, quay with water. */
export function base(ctx){
 const{P,TABLE,conTex}=ctx,g=new THREE.Group();
 const slabMat=new THREE.MeshStandardMaterial({map:conTex,color:0xc9cdbf,roughness:.92,transparent:true,opacity:.9});
 const slab=x=>{const s=new THREE.Mesh(new RoundedBoxGeometry(P.w,P.h,P.d,2,.0006),slabMat);s.position.set(x,TABLE/2,0);s.castShadow=s.receiveShadow=true;g.add(s);return s};
 const ground=(x,z)=>Math.abs(z)<P.d/2&&Math.abs(x)<P.w*1.5+.008?0:TABLE;
 const walkers=specs=>specs.map((s,i)=>{const f=person(s.color??CLOTHES[i%CLOTHES.length]);f.userData.spec={span:P.w*3+.1,stride:.045,phase:i*.37,...s};g.add(f);return f});
 function walk(list,t,from=41,to=56){for(const f of list){const{speed,z,dir,phase,span,stride}=f.userData.spec,dist=(t-40)*speed,s=(dist/span+phase)%1,x=dir*(s*span-span/2);
  f.position.set(x,ground(x,z)+.0008*Math.abs(Math.sin(dist/stride*Math.PI)),z);f.rotation.y=dir>0?0:Math.PI;f.userData.update(dist/stride*Math.PI);
  f.scale.setScalar(Math.max(.001,Math.min(1,Math.min(s,1-s)*8)*seg(t,from,from+1.2)*(1-seg(t,to-1.5,to))))}}
 const posLabel=(text,x=0,z=P.d/2+.004)=>{const l=label({title:text,px:.00012});l.position.set(x,TABLE+.002,z);g.add(l);return l};
 const gulls=n=>Array.from({length:n},(_,i)=>{const b=gull();g.add(b);b.userData.i=i;return b});
 function fly(list,time){for(const b of list){const i=b.userData.i,a=time*(.5+.12*i)+i*Math.PI,R=Math.max(.13,P.w*.9);b.position.set(Math.cos(a)*R,.15+.025*i+.01*Math.sin(time*1.3+i),-.05+Math.sin(a)*R*.5);b.rotation.y=-a;b.userData.update(time*(9+i))}}
 function quay(quayZ,width,{bollards=true}={}){
  const wat=water(width,.17,quayZ,TABLE+.0002);g.add(wat);
  const coping=new THREE.Mesh(new THREE.BoxGeometry(width-.04,.003,.006),MATS.stone);coping.position.set(0,TABLE+.0015,quayZ+.003);coping.castShadow=coping.receiveShadow=true;g.add(coping);
  if(bollards)for(const k of[-.38,-.12,.12,.38]){const b=bollard();b.position.set(k*width,TABLE+.0065,quayZ+.0045);g.add(b)}
  return wat;
 }
 return{g,slab,ground,walkers,walk,posLabel,gulls,fly,quay};
}

// Plaza (M-14 … M-18): in service at P-1x, taken up, stored and placed again at Q-0x.
function plaza(ctx){
 const{P,TABLE,piece,vars,lang,glow}=ctx,b=base(ctx),{g}=b,Q=P.w+.007,quayZ=-(P.d/2+.03),W=Math.max(.5,P.w*3.3);
 const wat=b.quay(quayZ,W);b.slab(-(P.w+.007));
 const q=outline(P.w,P.d);q.position.set(Q,TABLE+.0003,0);g.add(q);
 const own=outline(P.w+.004,P.d+.004,GOLD);own.position.y=.0005;g.add(own);
 b.posLabel(`${piece.position} · ${piece.id}`);b.posLabel(piece.reuse||'Q',Q);
 const ql=label({lines:[tr(T.quay,lang)],px:.00012});ql.position.set(-W*.4,TABLE+.003,quayZ-.017);g.add(ql);
 const people=b.walkers([{speed:.06,z:P.d*.16,dir:1},{speed:.045,z:-P.d*.37,dir:-1},{speed:.052,z:P.d*.4,dir:1}]);
 const boat=motorBoat();g.add(boat);
 const wake=Array.from({length:7},()=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:0}));s.scale.setScalar(.01);g.add(s);return s});
 const cable=rope();g.add(cable);
 const rl=label({title:fmt(tr(T.reuse,lang),vars),lines:[piece.id.replace('-','–')]});g.add(rl);
 return{group:g,retOff:[Q,TABLE+.012,0],cues:[['water',40.2],['lift',47],['set',51.5]],
  update(t,time,pf){
   wat.userData.update(time,out(seg(t,40.2,42.6))*W*.6);b.walk(people,t);
   const bs=seg(t,40.5,55.5),bx=lerp(-W/2,W/2,bs);boat.position.set(bx,TABLE+.004+.0012*Math.sin(time*2.1),quayZ-.087);boat.rotation.z=.03*Math.sin(time*1.7);boat.scale.setScalar(Math.max(.001,Math.min(1,Math.min(bs,1-bs)*9)));
   wake.forEach((w,i)=>{const k=((time*1.6+i/7)%1);w.position.set(bx-.065-k*.06,TABLE+.002,quayZ-.087+(i%2?.006:-.006)*k);w.material.opacity=pf*(1-k)*.5*boat.scale.x;w.scale.setScalar(.006+k*.012)});
   const lift=io(seg(t,47,48.4)),move=io(seg(t,48.4,50.6)),down=io(seg(t,50.6,51.8));
   const gp=[move*Q,t<50.6?lerp(.0002,.055,lift)+Math.sin(move*Math.PI)*.02:lerp(.055,TABLE,down),0];
   const ca=win(t,46.6,52.6,.5,.6);cable.visible=ca>0;cable.material.opacity=ca*.85*pf;cable.userData.set({x:gp[0],y:gp[1]+.0145,z:0},{x:gp[0],y:.22,z:0},0);
   setFade(rl,win(t,51.4,55.2,.5,.8));rl.position.set(Q,TABLE+.03,0);
   return{ghost:{pos:gp,a:t<53.6?win(t,46.2,55.2,.8,1.4):win(t,46.2,55.2,.8,1.4)}};
  }};
}

// Paseo (M-01 … M-06): a promenade by the water.
function paseo(ctx){
 const{P,TABLE,piece}=ctx,b=base(ctx),{g}=b,quayZ=-(P.d/2+.04),W=Math.max(.6,P.w*3.6);
 const wat=b.quay(quayZ,W,{bollards:false});b.slab(-(P.w+.007));b.slab(P.w+.007);b.posLabel(`${piece.position} · ${piece.id}`);
 for(const k of[-.32,0,.32]){const lamp=new THREE.Group(),pole=new THREE.Mesh(new THREE.CylinderGeometry(.0013,.0018,.2,8),MATS.dark),head=new THREE.Mesh(new THREE.SphereGeometry(.005,12,8),new THREE.MeshStandardMaterial({color:0xfff6dc,emissive:0xffe9b0,emissiveIntensity:.8}));
  pole.position.y=.1;head.position.y=.2;lamp.add(pole,head);lamp.position.set(k*W,TABLE,quayZ+.012);pole.castShadow=true;g.add(lamp)}
 const seat=bench();seat.position.set(-P.w*.28,TABLE,quayZ+.016);seat.rotation.y=Math.PI;g.add(seat);
 const sitter=person(0x9fc9c0,{seated:true});sitter.position.set(-P.w*.28,TABLE-.017,quayZ+.014);sitter.rotation.y=Math.PI/2;g.add(sitter);
 for(const[x,s]of[[-(P.w/2+.07),1],[P.w/2+.07,2]]){const p=palm(.19,s);p.position.set(x,TABLE,quayZ+.022);g.add(p)}
 const people=b.walkers([{speed:.05,z:P.d*.22,dir:1},{speed:.04,z:-P.d*.12,dir:-1,color:0xe6b8a2},{speed:.12,z:P.d*.38,dir:-1,stride:.07,color:0xd9c7a7}]);
 const sail=sailBoat();g.add(sail);const birds=b.gulls(2);
 return{group:g,retOff:[0,.0012,0],cues:[['water',40.2]],
  update(t,time){wat.userData.update(time,out(seg(t,40.2,42.6))*W*.6);b.walk(people,t);b.fly(birds,time);
   const bs=seg(t,40.5,56),bx=lerp(W/2,-W/2,bs);sail.position.set(bx,TABLE+.004+.001*Math.sin(time*1.8),quayZ-.095);sail.rotation.y=Math.PI;sail.rotation.x=.04*Math.sin(time*1.2);sail.scale.setScalar(Math.max(.001,Math.min(1,Math.min(bs,1-bs)*9)));
   sitter.rotation.z=.02*Math.sin(time*.8)}};
}

// Vial (M-07 … M-09): heavy port traffic over a 220 mm concrete layer.
function vial(ctx){
 const{P,TABLE,piece,L,glow}=ctx,b=base(ctx),{g}=b,span=P.w*2+.5;
 b.slab(-(P.w+.007));b.slab(P.w+.007);b.posLabel(`${piece.position} · ${piece.id}`);
 const lines=new THREE.Group();g.add(lines);
 for(let x=-P.w*1.5;x<P.w*1.5;x+=.04){const d=new THREE.Mesh(new THREE.PlaneGeometry(.022,.0025),new THREE.MeshBasicMaterial({color:0xf2f2ea,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));d.rotation.x=-Math.PI/2;d.position.set(x+.011,.0004,0);lines.add(d)}
 for(const z of[-1,1]){const e=new THREE.Mesh(new THREE.PlaneGeometry(P.w*3+.014,.0018),new THREE.MeshBasicMaterial({color:0xf2c46b,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));e.rotation.x=-Math.PI/2;e.position.set(0,.0004,z*(P.d/2-.006));lines.add(e)}
 const tr8=truck();tr8.scale.setScalar(.8);g.add(tr8);
 const car=new THREE.Group();{const body=new THREE.Mesh(new RoundedBoxGeometry(.2,.04,.085,3,.01),MATS.blue),cab=new THREE.Mesh(new RoundedBoxGeometry(.1,.035,.075,3,.012),new THREE.MeshStandardMaterial({color:0x1d3540,roughness:.2,metalness:.3}));body.position.y=.035;cab.position.set(-.01,.064,0);car.add(body,cab);
  for(const x of[-.065,.065])for(const z of[-.038,.038]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.016,.016,.012,16),MATS.rubber);w.rotation.x=Math.PI/2;w.position.set(x,.016,z);car.add(w)}car.traverse(o=>{if(o.isMesh)o.castShadow=true})}
 g.add(car);
 const press=Array.from({length:6},()=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:0,color:0xf2c46b}));s.scale.setScalar(.03);g.add(s);return s});
 const load=outline(P.w+.004,P.d+.004,GOLD,.0018);load.position.y=.0006;g.add(load);
 const cl=label({title:L('concreteLayer'),lines:[tr(T.zone.vial.title,ctx.lang)]});g.add(cl);
 return{group:g,retOff:[0,.0012,0],cues:[['engine',41.2],['engine',49.6]],
  update(t,time,pf){
   const ts=seg(t,41.2,49.2),tx=lerp(-span/2,span/2,ts);tr8.position.set(tx,0,0);tr8.visible=ts>0&&ts<1;
   for(const w of tr8.userData.wheels)w.rotation.y=-(t-41.2)*.14/.024;
   let on=0;press.forEach((p,i)=>{const axle=tr8.userData.wheels[i];const wx=tx+axle.position.x*.8,inside=Math.abs(wx)<P.w/2&&tr8.visible;p.position.set(wx,.003,axle.position.z*.8);p.material.opacity=inside?.9*pf:0;on=Math.max(on,inside?1:0)});
   load.material.uniforms.uOpacity.value=pf*(.25+.75*on*(.6+.4*Math.sin(time*20)));
   const cs=seg(t,49.6,55),cx=lerp(span/2,-span/2,io(cs));car.position.set(cx,0,0);car.rotation.y=Math.PI;car.visible=cs>0&&cs<1;
   setFade(cl,win(t,43,50,.6,.8));cl.position.set(0,.13,P.d/2+.01);
  }};
}

// Plataforma (M-10 … M-13): loading and unloading on a working platform.
function plataforma(ctx){
 const{P,TABLE,piece}=ctx,b=base(ctx),{g}=b,xR=P.w+.007;
 b.slab(-(P.w+.007));b.slab(xR);b.posLabel(`${piece.position} · ${piece.id}`);
 const c1=container(MATS.orange);c1.position.set(xR+P.w*.18,0,-P.d*.18);c1.rotation.y=.04;g.add(c1);
 const c2=container(MATS.teal);c2.position.set(-(P.w+.007)-P.w*.12,0,-P.d*.2);c2.rotation.y=-.05;g.add(c2);
 const c3=container(MATS.white);c3.position.set(xR+P.w*.18,.13,-P.d*.18);c3.rotation.y=-.03;g.add(c3);
 const fk=forklift();g.add(fk);const load=new THREE.Group();load.add(pallet());const bag=bigBag();bag.position.y=.007;load.add(bag);g.add(load);
 const worker=person(0xe3b53a);g.add(worker);
 const xs=-(P.w/2+.15),xe=P.w/2+.015;
 return{group:g,retOff:[0,.0012,0],cues:[['engine',41.4],['set',47.8]],
  update(t,time){
   const go=io(seg(t,41.4,47)),lower=seg(t,47,48),back=io(seg(t,48.2,53));
   const fx=t<48.2?lerp(xs,xe,go):lerp(xe,xs+.03,back);fk.position.set(fx,0,P.d*.12);
   const lift=t<47?.02:lerp(.02,.004,lower);fk.userData.carriage.position.y=.012+lift;
   if(t<48.2){load.position.set(fx+.07,.012+lift-.012,P.d*.12)}else load.position.set(xe+.07,.004,P.d*.12);
   const ws=seg(t,42,52),wx=lerp(-P.w*.9,P.w*.6,ws);worker.position.set(wx,b.ground(wx,-P.d*.3),-P.d*.3);worker.rotation.y=0;worker.userData.update((t-42)*.05/.045*Math.PI);worker.scale.setScalar(Math.max(.001,Math.min(1,Math.min(ws,1-ws)*8)));
  }};
}

// Borde (M-19, M-20): the quay edge, where boats moor.
function borde(ctx){
 const{P,TABLE,piece,glow}=ctx,b=base(ctx),{g}=b,quayZ=-(P.d/2+.007),W=Math.max(.5,P.w*6);
 const wat=b.quay(quayZ,W,{bollards:false});b.slab(-(P.w+.007));b.slab(P.w+.007);b.posLabel(`${piece.position} · ${piece.id}`);
 const post=bollard();post.position.set(P.w/2+.035,TABLE+.0065,quayZ+.0045);g.add(post);
 const boat=motorBoat();g.add(boat);const line=rope();g.add(line);
 const watcher=person(0x9fc9c0);watcher.position.set(-P.w*.15,0,-P.d*.18);watcher.rotation.y=Math.PI/2;g.add(watcher);
 const foam=Array.from({length:10},(_,i)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:0,color:0xffffff}));s.userData.x=(i/9-.5)*W*.6;g.add(s);return s});
 const birds=b.gulls(2),bowLocal=new THREE.Vector3(.064,.013,0),bow=new THREE.Vector3();
 return{group:g,retOff:[0,.0012,0],cues:[['water',40.2],['set',46.6]],
  update(t,time,pf){
   wat.userData.update(time,out(seg(t,40.2,42.6))*W*.6);b.fly(birds,time);
   const arrive=out(seg(t,41,46.2)),bx=lerp(-W*.45,P.w/2+.02,arrive);boat.position.set(bx,TABLE+.004+.0015*Math.sin(time*2.3),quayZ-.034);boat.rotation.z=.04*Math.sin(time*1.9);boat.rotation.x=.03*Math.sin(time*1.4);
   boat.updateMatrixWorld();bow.copy(bowLocal).applyMatrix4(boat.matrix);
   const tie=seg(t,46.6,48);line.visible=tie>0;line.material.opacity=pf*.95;
   const top={x:post.position.x,y:post.position.y+.004,z:post.position.z};line.userData.set(bow,{x:lerp(bow.x,top.x,tie),y:lerp(bow.y,top.y,tie),z:lerp(bow.z,top.z,tie)},.006+.004*Math.sin(time*2.3));
   watcher.userData.update(0);watcher.rotation.z=.02*Math.sin(time);
   foam.forEach((s,i)=>{const k=(time*.8+i*.37)%1;s.position.set(s.userData.x,TABLE+.002,quayZ-.004-k*.01);s.material.opacity=pf*Math.sin(k*Math.PI)*.35;s.scale.setScalar(.008+k*.012)});
  }};
}

export const ZONES={plaza,paseo,vial,plataforma,borde};
