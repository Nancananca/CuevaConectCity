// Plaza (M-14, the original QR): life on the square, works, a crane takes the piece up — and the visitor decides.
// Drag to swing the crane: A = Q-01 (reuse on the square) or B = the truck (return to the plant). Each choice has
// its own ending; both say what the field test actually recorded (F6 stock -> F7 Q-01 -> F8 return).
import {THREE,RoundedBoxGeometry,MINT,GOLD,seg,io,out,back,win,lerp,clamp,label,setFade,fadeable,outline,motorBoat,MATS,peTexture} from './kit.mjs?v=7.0';
import {base} from './zones.mjs?v=7.0';
import {T,tr,fmt} from './text.mjs?v=7.0';

const TXT={
 caption:{kick:['04 · USO Y REÚSO','04 · USE & REUSE','04 · ÚS I REÚS'],title:['Cambia de lugar. Sigue siendo {id}.','A different place. Still {id}.','Canvia de lloc. Continua sent {id}.'],
  text:['En servicio en {pos}. Llegan obras a la plaza: la pieza se desmonta… y tú decides adónde va.','In service at {pos}. Works reach the square: the piece is taken up… and you decide where it goes.','En servei a {pos}. Arriben obres a la plaça: la peça es desmunta… i tu decideixes on va.']},
 works:['F6 · Obras: se desmonta','F6 · Works: taken up','F6 · Obres: es desmunta'],
 prompt:['¿Adónde llevas {id}? Gira la grúa con el dedo.','Where do you take {id}? Swing the crane with your finger.','On portes {id}? Gira la grua amb el dit.'],
 kick:['TÚ DECIDES','YOUR CALL','TU DECIDEIXES'],
 aLabel:['{reuse} · Reúso','{reuse} · Reuse','{reuse} · Reús'],aDetail:['Vuelve a la plaza: nuevo lugar, misma identidad.','Back on the square: new place, same identity.','Torna a la plaça: nou lloc, mateixa identitat.'],
 bLabel:['Planta · Retorno','Plant · Return','Planta · Retorn'],bDetail:['Al camión y a PLASTICPeople: la materia empieza otro ciclo.','Onto the truck to PLASTICPeople: the material starts another loop.','Al camió i a PLASTICPeople: la matèria comença un altre cicle.'],
 drag:['Arrastra para girar','Drag to swing','Arrossega per girar'],
 aDone:['F7 · Instalada en {reuse}','F7 · Installed at {reuse}','F7 · Instal·lada a {reuse}'],
 bDone:['F8 · Retorno a planta','F8 · Return to the plant','F8 · Retorn a planta'],
 aNote:['Así lo registró la prueba de campo del 16/10.','This is what the 16/10 field test recorded.','Així ho va registrar la prova de camp del 16/10.'],
 bNote:['En la prueba, {id} pasó por {reuse} y después retornó.','In the test, {id} went to {reuse} first and then returned.','A la prova, {id} va passar per {reuse} i després va retornar.'],
 truck:['Camión · retorno','Truck · return','Camió · retorn'],
};

export function plazaExperience(ctx){
 const{P,TABLE,piece,vars,lang}=ctx,L=k=>fmt(tr(TXT[k],lang),vars),b=base(ctx),{g}=b;
 const Q=P.w+.007,quayZ=-(P.d/2+.03),W=Math.max(.5,P.w*3.3),GH=.0145; // GH: height of the piece hologram (PE + concrete)
 const HOLD=52.5,DUR=24;
 // --- the square ---
 const wat=b.quay(quayZ,W);
 const slotQ=outline(P.w,P.d);slotQ.position.set(Q,TABLE+.0003,0);g.add(slotQ);
 const own=outline(P.w+.004,P.d+.004,GOLD);own.position.y=.0005;g.add(own);
 b.posLabel(`${piece.position} · ${piece.id}`);const qLabel=b.posLabel(piece.reuse||'Q-01',Q);
 const people=b.walkers([{speed:.06,z:P.d*.16,dir:1},{speed:.045,z:-P.d*.37,dir:-1},{speed:.052,z:P.d*.4,dir:1}]);
 const after=b.walkers([{speed:.05,z:.012,dir:1,span:.42,phase:.1},{speed:.042,z:-.018,dir:-1,span:.42,phase:.55}]);
 after.forEach(f=>f.userData.spec.offsetX=Q*.6);
 const boat=motorBoat();g.add(boat);
 const cones=new THREE.Group();for(const[sx,sz]of[[-1,-1],[1,-1],[1,1],[-1,1]]){const c=new THREE.Group(),cone=new THREE.Mesh(new THREE.ConeGeometry(.0045,.013,12),MATS.orange),band=new THREE.Mesh(new THREE.CylinderGeometry(.0028,.0034,.002,12),MATS.white);cone.position.y=.0065;band.position.y=.007;c.add(cone,band);c.position.set(sx*(P.w/2+.008),0,sz*(P.d/2+.008));cone.castShadow=true;cones.add(c)}g.add(cones);
 // --- the crane, on the quay behind the piece ---
 const M=new THREE.Vector3(0,TABLE,quayZ+.004),H=.19,JIB=.2;
 const targets={P:{x:0,z:0},A:{x:Q,z:0},B:{x:-Q,z:.022}};
 for(const k in targets){const v=targets[k];v.a=Math.atan2(v.z-M.z,v.x-M.x);v.r=Math.hypot(v.x-M.x,v.z-M.z)}
 const crane=new THREE.Group();crane.position.copy(M);g.add(crane);
 const yellow=MATS.yellow,steel=new THREE.LineBasicMaterial({color:0xb08a1d,transparent:true});
 const mast=new THREE.Group();crane.add(mast);
 for(const[x,z]of[[-1,-1],[1,-1],[1,1],[-1,1]]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.0016,H,.0016),yellow);leg.position.set(x*.0055,H/2,z*.0055);leg.castShadow=true;mast.add(leg)}
 {const pts=[];for(let y=0;y<H;y+=.012)for(const[a,b2]of[[[-1,-1],[1,-1]],[[1,-1],[1,1]],[[1,1],[-1,1]],[[-1,1],[-1,-1]]])pts.push(new THREE.Vector3(a[0]*.0055,y,a[1]*.0055),new THREE.Vector3(b2[0]*.0055,y+.012,b2[1]*.0055));mast.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts),steel))}
 const footing=new THREE.Mesh(new THREE.BoxGeometry(.026,.004,.026),MATS.stone);footing.position.y=.002;crane.add(footing);
 const slew=new THREE.Group();slew.position.y=H;crane.add(slew);
 const jib=new THREE.Mesh(new THREE.BoxGeometry(JIB,.0045,.0045),yellow);jib.position.x=JIB/2;jib.castShadow=true;
 const cjib=new THREE.Mesh(new THREE.BoxGeometry(.06,.0045,.0045),yellow);cjib.position.x=-.03;
 const weight=new THREE.Mesh(new RoundedBoxGeometry(.018,.012,.012,1,.002),MATS.stone);weight.position.set(-.052,-.006,0);
 const cab=new THREE.Mesh(new RoundedBoxGeometry(.012,.01,.01,1,.002),MATS.white);cab.position.set(.008,-.007,.008);
 const apex=new THREE.Mesh(new THREE.ConeGeometry(.005,.03,4),yellow);apex.position.y=.017;
 const ties=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,.032,0),new THREE.Vector3(JIB*.8,0,0),new THREE.Vector3(0,.032,0),new THREE.Vector3(-.055,0,0)]),steel);
 const trolley=new THREE.Mesh(new THREE.BoxGeometry(.009,.004,.007),MATS.dark);trolley.position.y=-.004;
 slew.add(jib,cjib,weight,cab,apex,ties,trolley);[cjib,weight,cab,apex].forEach(m=>m.castShadow=true);
 const hook=new THREE.Group(),block=new THREE.Mesh(new RoundedBoxGeometry(.007,.008,.005,1,.0015),MATS.dark),hk=new THREE.Mesh(new THREE.TorusGeometry(.0028,.0008,6,12,Math.PI*1.4),MATS.iron);hk.position.y=-.007;hook.add(block,hk);g.add(hook);
 const lineGeo=n=>{const geo=new THREE.BufferGeometry().setFromPoints(Array.from({length:n},()=>new THREE.Vector3()));const l=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:0xe9e1c8,transparent:true}));l.frustumCulled=false;g.add(l);return l};
 const cable=lineGeo(2),slings=lineGeo(8);
 // --- the truck (ending B) and the reused slab (ending A) ---
 const truck=new THREE.Group();{const cabT=new THREE.Mesh(new RoundedBoxGeometry(.05,.062,.078,2,.008),MATS.white),glass=new THREE.Mesh(new THREE.BoxGeometry(.002,.022,.064),new THREE.MeshStandardMaterial({color:0x1f3b46,roughness:.2,metalness:.3})),deck=new THREE.Mesh(new THREE.BoxGeometry(.18,.006,.088),MATS.dark),rail=new THREE.Mesh(new THREE.BoxGeometry(.18,.004,.002),MATS.yellow);
  cabT.position.set(-.118,.041,0);glass.position.set(-.144,.052,0);deck.position.set(0,.026,0);rail.position.set(0,.031,.044);truck.add(cabT,glass,deck,rail);
  for(const x of[-.11,-.04,.06])for(const z of[-.038,.038]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.013,.013,.01,16),MATS.rubber);w.rotation.x=Math.PI/2;w.position.set(x,.013,z);truck.add(w)}
  truck.traverse(o=>{if(o.isMesh)o.castShadow=true});truck.position.set(targets.B.x,TABLE,targets.B.z);g.add(truck)}
 const DECK=TABLE+.029;
 const reused=new THREE.Group();{const pe=new THREE.Mesh(new RoundedBoxGeometry(P.w,.0026,P.d,2,.0006),new THREE.MeshStandardMaterial({map:peTexture(),roughness:.6,color:0xd8edcf})),co=new THREE.Mesh(new RoundedBoxGeometry(P.w,GH-.0026,P.d,2,.0009),new THREE.MeshStandardMaterial({map:ctx.conTex,roughness:.92,color:0xcfd3c6}));
  pe.position.y=.0013;co.position.y=.0026+(GH-.0026)/2;reused.add(pe,co);reused.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true}});reused.position.set(Q,TABLE,0);reused.scale.y=.28;g.add(reused)}
 const markA=outline(P.w+.01,P.d+.01,MINT,.0024);markA.position.set(Q,TABLE+.0006,0);g.add(markA);
 const markB=outline(.19,.098,GOLD,.0024);markB.position.set(targets.B.x,DECK+.004,targets.B.z);g.add(markB);
 const worksL=label({title:L('works')});g.add(worksL);
 const dragL=label({lines:['⟷  '+L('drag')],accent:'#f2c46b'});g.add(dragL);
 const aL=label({title:fmt(tr(TXT.aLabel,lang),vars),accent:'#7edbc2'}),bL=label({title:L('truck'),accent:'#f2c46b'});g.add(aL,bL);
 const doneL=label({title:'',lines:['']});g.add(doneL);
 const doneA=label({title:L('aDone'),lines:[L('aNote')]}),doneB=label({title:L('bDone'),lines:[L('bNote')],accent:'#f2c46b'});g.add(doneA,doneB);g.remove(doneL);
 for(const l of[worksL,dragL,aL,bL,doneA,doneB])fadeable(l);

 // --- interaction ---
 let theta=targets.P.a,thetaTarget=targets.P.a,radius=targets.P.r,dragging=false,choiceAt=0,theta0=0,lastWall=0;
 const plane=new THREE.Plane(),hit=new THREE.Vector3(),nrm=new THREE.Vector3(),org=new THREE.Vector3();
 const lo=Math.min(targets.A.a,targets.B.a)-.15,hi=Math.max(targets.A.a,targets.B.a)+.15;
 function groundAngle(rc){g.updateWorldMatrix(true,false);nrm.set(0,1,0).transformDirection(g.matrixWorld);org.setFromMatrixPosition(g.matrixWorld);plane.setFromNormalAndCoplanarPoint(nrm,org);
  if(!rc.ray.intersectPlane(plane,hit))return null;g.worldToLocal(hit);return clamp(Math.atan2(hit.z-M.z,hit.x-M.x),lo,hi)}
 const near=a=>Math.abs(a-targets.A.a)<.2?'A':Math.abs(a-targets.B.a)<.2?'B':null;
 const it={holdAt:HOLD-40,choice:null,hover:null,kick:TXT.kick,prompt:TXT.prompt.map(s=>fmt(s,vars)),
  options:[{id:'A',label:TXT.aLabel.map(s=>fmt(s,vars)),detail:TXT.aDetail,color:'#7edbc2'},{id:'B',label:TXT.bLabel,detail:TXT.bDetail,color:'#f2c46b'}],
  pointer(type,rc){if(it.choice)return false;const a=groundAngle(rc);
   if(type==='down'){if(a===null)return false;dragging=true;thetaTarget=a;return true}
   if(type==='move'&&dragging){if(a!==null)thetaTarget=a;return true}
   if(type==='hover'){if(a!==null)it.hover=near(a);return false}
   if(type==='up'&&dragging){dragging=false;const pick=near(thetaTarget)||near(theta);if(pick){it.choose(pick);return true}return true}
   return false},
  choose(id){if(it.choice)return;it.choice=id;choiceAt=-1;theta0=theta},
  reset(){it.choice=null;it.hover=null;dragging=false;theta=thetaTarget=targets.P.a}};

 const wobble=time=>.002*Math.sin(time*1.7);
 return{group:g,duration:DUR,caption:TXT.caption,interaction:it,retOff:[Q,TABLE+.012,0],
  cues:[['water',40.2],['lift',46.2],['lift',50],['set',57.2]],
  update(t,time,pf,camera,{waiting}){
   const dtw=lastWall?Math.min(.05,time-lastWall):0;lastWall=time;
   if(t<HOLD-.5&&it.choice)it.reset();                       // the visitor went back in the story
   if(t>HOLD+.05&&!it.choice){it.choice='A';choiceAt=HOLD;theta0=theta} // skipped ahead: the recorded path
   if(it.choice&&choiceAt<0)choiceAt=t;
   wat.userData.update(time,out(seg(t,40.2,42.6))*W*.6);
   b.walk(people,t,41,46.4);
   for(const f of after){const s=f.userData.spec;b.walk([f],t,58.5,64);f.position.x+=s.offsetX;f.position.y=Math.abs(f.position.x-Q)<P.w/2&&Math.abs(f.position.z)<P.d/2&&it.choice==='A'?0+.0008:f.position.y;f.visible=it.choice==='A'}
   const bs=seg(t,40.5,63.5),bx=lerp(-W/2,W/2,bs);boat.position.set(bx,TABLE+.004+.0012*Math.sin(time*2.1),quayZ-.087);boat.scale.setScalar(Math.max(.001,Math.min(1,Math.min(bs,1-bs)*9)));
   const cn=seg(t,45.4,46.4)*(1-seg(t,57,58.5));cones.children.forEach((c,i)=>c.scale.setScalar(Math.max(.001,back(clamp(cn*1.4-i*.1)))));
   // crane: rises, swings to the piece, lifts it
   const up=io(seg(t,46,48.4)),gone=it.choice?io(seg(t,choiceAt+8.5,choiceAt+10.5)):0;
   crane.visible=up>0&&gone<1;crane.scale.set(1,Math.max(.001,up*(1-gone)),1);
   let hookY=H-.012,gy=0,ga=0,carrying=false;
   if(!it.choice){
    if(t<HOLD){theta=lerp(targets.A.a+.4,targets.P.a,io(seg(t,47.4,49.2)));radius=lerp(.05,targets.P.r,io(seg(t,47.8,49.4)))}
    const lower=io(seg(t,49.2,50.2)),raise=io(seg(t,50.6,52.3));
    const top=TABLE+.004+GH+.03,carryY=.075;hookY=t<50.6?lerp(H-.02,GH+.03,lower):lerp(GH+.03,carryY+GH+.03,raise);
    gy=t<50.6?.0002:lerp(.0002,carryY,raise);ga=t>49.6?1:0;carrying=t>50.2;
    if(waiting){theta+=(thetaTarget-theta)*Math.min(1,dtw*6);radius=lerp(radius,theta<targets.P.a?lerp(targets.P.r,targets.A.r,clamp((targets.P.a-theta)/(targets.P.a-targets.A.a))):lerp(targets.P.r,targets.B.r,clamp((theta-targets.P.a)/(targets.B.a-targets.P.a))),Math.min(1,dtw*6));
     it.hover=dragging?near(thetaTarget):it.hover;hookY=carryY+GH+.03+.002*Math.sin(time*2);gy=carryY+wobble(time)}
   }else{
    const T0=choiceAt,dest=targets[it.choice],sw=io(seg(t,T0,T0+2.6)),low=io(seg(t,T0+2.8,T0+4.6)),rel=io(seg(t,T0+4.9,T0+6.2));
    theta=lerp(theta0,dest.a,sw);radius=lerp(radius,dest.r,Math.min(1,sw*1.2));
    const floor=it.choice==='A'?TABLE:DECK,carryY=.075;gy=lerp(carryY,floor,low);hookY=t<T0+4.9?gy+GH+.03:lerp(floor+GH+.03,H-.02,rel);carrying=t<T0+4.9;ga=1;
    if(it.choice==='B'){const drive=io(seg(t,T0+6.6,T0+11.2));truck.position.x=lerp(targets.B.x,-W*.55,drive);if(t>T0+4.6)gy=DECK}
   }
   slew.rotation.y=-theta;trolley.position.x=radius;
   const hx=M.x+Math.cos(theta)*radius,hz=M.z+Math.sin(theta)*radius;hook.position.set(hx,TABLE+hookY,hz);hook.visible=crane.visible;
   const cp=cable.geometry.attributes.position;cp.setXYZ(0,hx,TABLE+H-.004,hz);cp.setXYZ(1,hx,TABLE+hookY,hz);cp.needsUpdate=true;cable.visible=crane.visible;
   // the hologram hangs from the hook while carried; on the truck it rides with it
   let gp=[hx,TABLE+gy,hz];if(!it.choice&&t<50.6)gp=[0,.0002,0];
   if(it.choice==='B'&&t>choiceAt+4.6)gp=[truck.position.x,DECK,targets.B.z];
   if(it.choice==='A'&&t>choiceAt+4.6)gp=[Q,TABLE,0];
   const sp=slings.geometry.attributes.position,top=gp[1]+GH;let k=0;for(const[sx,sz]of[[-1,-1],[1,-1],[1,1],[-1,1]]){sp.setXYZ(k++,hx,TABLE+hookY-.006,hz);sp.setXYZ(k++,gp[0]+sx*P.w*.42,top,gp[2]+sz*P.d*.42)}sp.needsUpdate=true;
   slings.visible=carrying&&ga>0&&crane.visible;
   // targets, labels and endings
   const dec=!it.choice&&t>=HOLD-.6;markA.material.uniforms.uOpacity.value=pf*(dec?.5+.5*(it.hover==='A'?1:.35+.25*Math.sin(time*5)):0);markB.material.uniforms.uOpacity.value=pf*(dec?.5+.5*(it.hover==='B'?1:.35+.25*Math.sin(time*5+1)):0);
   setFade(aL,dec?pf:0);aL.position.set(Q,.04,0);setFade(bL,dec||(it.choice==='B'&&t<choiceAt+7)?pf:0);bL.position.set(truck.position.x,.09,targets.B.z);
   setFade(dragL,dec&&!dragging?pf*(.6+.4*Math.sin(time*3)):0);dragL.position.set(hx,TABLE+hookY+.025,hz);
   setFade(worksL,win(t,46.4,51.8,.5,.6));worksL.position.set(0,.11,0);
   const solid=it.choice==='A'?io(seg(t,choiceAt+5,choiceAt+6.4)):0;reused.visible=solid>0;reused.scale.y=Math.max(.001,solid);
   setFade(doneA,it.choice==='A'?win(t,choiceAt+5.4,DUR+40,.6,.8):0);doneA.position.set(Q,.06,0);
   setFade(doneB,it.choice==='B'?win(t,choiceAt+6.4,DUR+40,.6,.8):0);doneB.position.set(-W*.32,.08,targets.B.z);
   qLabel.material.opacity=pf;truck.visible=t>45.6;
   const ret=it.choice==='B'?[truck.position.x,DECK+.008,targets.B.z]:[Q,TABLE+.012,0];
   const ghostA=it.choice==='A'?1-io(seg(t,choiceAt+5.4,choiceAt+6.6)):1;
   return{ghost:{pos:gp,a:t<49.4?0:Math.min(ga,ghostA)*win(t,49.4,DUR+40+1.6,.5,1.4)},retOff:ret};
  }};
}
