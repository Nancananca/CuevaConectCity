// Shared building blocks for the piece scenes: easing, textures, labels, ribbons, shaders and small 1:20 props.
import * as THREE from '../../vendor/three.module.js';
import {RoundedBoxGeometry} from '../../vendor/RoundedBoxGeometry.js';
export {THREE,RoundedBoxGeometry};

export const MINT=new THREE.Color('#7edbc2'),GOLD=new THREE.Color('#f2c46b'),PE_COLORS=['#79bba0','#163e41','#b5bfa2','#658c77','#30796b'];
export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const seg=(t,a,b)=>clamp((t-a)/(b-a));
export const io=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
export const out=x=>1-Math.pow(1-x,3);
export const back=x=>{const c=1.9;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2)};
export const win=(t,a,b,fi=.6,fo=.6)=>Math.min(seg(t,a,a+fi),1-seg(t,b-fo,b));
export const lerp=(a,b,t)=>a+(b-a)*t;
export function rng(seed){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}}

// ---------- textures ----------
export function canvasTexture(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t}
export function speckle(seed,base,palette,count,min,max){return canvasTexture(512,256,(g,w,h)=>{const r=rng(seed);g.fillStyle=base;g.fillRect(0,0,w,h);for(let i=0;i<count;i++){const x=r()*w,y=r()*h,s=min+r()*(max-min);g.fillStyle=palette[Math.floor(r()*palette.length)];g.beginPath();g.moveTo(x,y);g.lineTo(x+s,y-s*.4);g.lineTo(x+s*.6,y+s);g.closePath();g.fill()}})}
export const peTexture=()=>speckle(1407,'#286f69',PE_COLORS,1700,1,7);
export const concreteTexture=()=>speckle(1433,'#bac0b5',['rgba(255,255,245,.18)','rgba(55,67,57,.2)','rgba(120,128,118,.35)'],6500,.3,2.4);
// Smooth value noise shared by the tarp dissolve and the flake release order, so both match.
export function valueNoise(seed){const r=rng(seed),G=[13,9],g=Array.from({length:G[0]*G[1]},r),fine=Array.from({length:40*26},r);
 const at=(a,gx,gy,x,y)=>a[Math.min(gy-1,y)*gx+Math.min(gx-1,x)];
 const bil=(a,gx,gy,u,v)=>{const x=u*(gx-1),y=v*(gy-1),x0=Math.floor(x),y0=Math.floor(y),fx=x-x0,fy=y-y0,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
  return lerp(lerp(at(a,gx,gy,x0,y0),at(a,gx,gy,x0+1,y0),sx),lerp(at(a,gx,gy,x0,y0+1),at(a,gx,gy,x0+1,y0+1),sx),sy)};
 return(u,v)=>clamp((bil(g,G[0],G[1],u,v)*.72+bil(fine,40,26,u,v)*.28-.12)/.76,.002,.998)}
const BLUE_BAND=v=>((v*3+.05)%1+1)%1<.22;
export function tarpTexture(){return canvasTexture(512,340,(g,w,h)=>{
 for(let y=0;y<h;y++){const v=1-(y+.5)/h;g.fillStyle=BLUE_BAND(v)?'#2a6ba8':'#eef1ec';g.fillRect(0,y,w,1)}
 const r=rng(91);for(let i=0;i<70;i++){const x=r()*w,y=r()*h,len=40+r()*160,a=r()*Math.PI;const grd=g.createLinearGradient(x,y,x+Math.cos(a)*len,y+Math.sin(a)*len);grd.addColorStop(0,'rgba(20,40,50,0)');grd.addColorStop(.5,`rgba(20,40,50,${.05+r()*.08})`);grd.addColorStop(1,'rgba(20,40,50,0)');g.strokeStyle=grd;g.lineWidth=2+r()*5;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*len,y+Math.sin(a)*len);g.stroke()}
 g.strokeStyle='rgba(30,50,60,.35)';g.lineWidth=3;g.setLineDash([9,7]);g.strokeRect(14,14,w-28,h-28);g.setLineDash([]);
 for(let i=0;i<10;i++)for(const y of[26,h-26]){g.beginPath();g.arc(30+i*(w-60)/9,y,6,0,7);g.fillStyle='#9aa6a3';g.fill();g.beginPath();g.arc(30+i*(w-60)/9,y,3,0,7);g.fillStyle='#38464a';g.fill()}
 g.save();g.translate(w*.62,h*.58);g.rotate(-.06);g.font='700 40px Archivo, Arial, sans-serif';g.fillStyle='rgba(30,60,80,.22)';g.fillText('REFIT · PORT VELL',-170,0);g.restore();
})}
export function noiseTexture(noise){const t=canvasTexture(256,170,(g,w,h)=>{const img=g.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const n=Math.round(noise((x+.5)/w,1-(y+.5)/h)*255),i=(y*w+x)*4;img.data[i]=img.data[i+1]=img.data[i+2]=n;img.data[i+3]=255}g.putImageData(img,0,0)});t.colorSpace=THREE.NoColorSpace;return t}
export const glowTexture=()=>canvasTexture(64,64,(g,w)=>{const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(220,255,240,1)');gr.addColorStop(.35,'rgba(126,219,194,.6)');gr.addColorStop(1,'rgba(126,219,194,0)');g.fillStyle=gr;g.fillRect(0,0,w,w)});

// ---------- labels ----------
export function label({title,lines=[],px=.00012,accent='#7edbc2',tone='dark'}){
 const pad=26,titleFont='650 44px Inter, Arial, sans-serif',lineFont='500 26px Mono, ui-monospace, monospace',c=document.createElement('canvas'),g=c.getContext('2d');
 g.font=titleFont;let w=title?g.measureText(title).width:0;g.font=lineFont;for(const l of lines)w=Math.max(w,g.measureText(l).width);
 const W=Math.ceil(w+pad*2+10),H=Math.ceil(pad*2+(title?50:0)+lines.length*36-(title?0:6));c.width=W;c.height=H;
 g.fillStyle=tone==='dark'?'rgba(5,30,38,.84)':'rgba(250,252,246,.9)';g.beginPath();g.roundRect(1,1,W-2,H-2,18);g.fill();
 g.strokeStyle=accent;g.globalAlpha=.75;g.lineWidth=2;g.stroke();g.globalAlpha=1;g.fillStyle=accent;g.fillRect(pad-12,pad+4,4,H-pad*2-8);
 let y=pad+38;if(title){g.font=titleFont;g.fillStyle=tone==='dark'?'#f4fff9':'#0c2c35';g.fillText(title,pad+4,y);y+=44}
 g.font=lineFont;g.fillStyle=tone==='dark'?accent:'#1d5b4c';for(const l of lines){g.fillText(l,pad+4,y);y+=36}
 const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
 const s=new THREE.Sprite(new THREE.SpriteMaterial({map,transparent:true,depthTest:false,depthWrite:false,opacity:1}));
 s.material.userData.base=1;s.scale.set(W*px,H*px,1);s.center.set(.5,0);s.renderOrder=40;s.userData.isLabel=true;return s;
}

// ---------- fading (opacity driven by the timeline) ----------
export function fadeable(obj,base){obj.traverse(o=>{for(const m of[o.material].flat().filter(Boolean)){if(m.userData.base===undefined)m.userData.base=base??m.opacity;m.transparent=true}});return obj}
export function setFade(obj,a){obj.visible=a>.002;if(!obj.visible)return;obj.traverse(o=>{for(const m of[o.material].flat().filter(Boolean)){if(m.uniforms?.uOpacity)m.uniforms.uOpacity.value=(m.userData.base??1)*a;else m.opacity=(m.userData.base??1)*a}})}

// ---------- ribbons (flat strips in the XZ plane) ----------
export const ribbonMaterial=(color=MINT,glow=30)=>new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,
 uniforms:{uProg:{value:0},uOpacity:{value:0},uColor:{value:color.clone()},uGlow:{value:glow}},
 vertexShader:'attribute float s;varying float vS;void main(){vS=s;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'uniform float uProg,uOpacity,uGlow;uniform vec3 uColor;varying float vS;void main(){float on=step(vS,uProg);float head=exp(-max(uProg-vS,0.)*uGlow);float a=min(1.,on*(.75+.6*head)*uOpacity);if(a<.004)discard;gl_FragColor=vec4(mix(uColor*.82,vec3(1.),head*.7),a);}'});
export function ribbon(points,width,closed,material){
 const pts=closed?[...points,points[0]]:points,lens=[0];for(let i=1;i<pts.length;i++)lens.push(lens[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));
 const total=lens.at(-1),pos=[],s=[],idx=[];
 pts.forEach((p,i)=>{const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)];let dx=b[0]-a[0],dz=b[1]-a[1];const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;
  pos.push(p[0]-dz*width/2,0,p[1]+dx*width/2,p[0]+dz*width/2,0,p[1]-dx*width/2);s.push(lens[i]/total,lens[i]/total);if(i)idx.push(2*i-2,2*i-1,2*i,2*i-1,2*i+1,2*i)});
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('s',new THREE.Float32BufferAttribute(s,1));g.setIndex(idx);
 const m=new THREE.Mesh(g,material);m.frustumCulled=false;return m;
}
export function rectPath(w,d,n=60){const p=[],c=[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]];for(let k=0;k<4;k++){const a=c[k],b=c[(k+1)%4];for(let i=0;i<n;i++)p.push([lerp(a[0],b[0],i/n),lerp(a[1],b[1],i/n)])}return p}
export function outline(w,d,color=MINT,width=.0012){const r=ribbon(rectPath(w,d,30),width,true,ribbonMaterial(color,0));r.material.uniforms.uProg.value=1;return r}

// ---------- water ----------
const WATER_FS=`
uniform float uTime,uOpacity,uReveal;uniform vec2 uSize;uniform float uFoamEdge;varying vec2 vUv;varying vec3 vW,vAx,vAy,vAz;
float h(vec2 p){return sin(p.x*95.+uTime*1.7)*.5+sin(p.y*130.-uTime*2.3+p.x*40.)*.35+sin((p.x*.7+p.y)*230.+uTime*3.1)*.18;}
void main(){
 vec2 p=(vUv-.5)*uSize;float e=.0007;float hx=(h(p+vec2(e,0.))-h(p-vec2(e,0.)))/(2.*e),hy=(h(p+vec2(0.,e))-h(p-vec2(0.,e)))/(2.*e);
 vec3 c=normalize(vec3(-hx*.0011,1.,hy*.0011));vec3 n=normalize(vAx*c.x+vAy*c.y+vAz*c.z);vec3 v=normalize(cameraPosition-vW);vec3 L=normalize(vAx*.35+vAy*.8+vAz*.45);
 float fres=pow(1.-max(dot(n,v),0.),3.);float spec=pow(max(dot(reflect(-L,n),v),0.),70.)*1.3;
 vec3 col=mix(vec3(.02,.2,.25),vec3(.16,.52,.56),.25+.55*fres)+spec*vec3(1.,.97,.9);
 float foam=smoothstep(uFoamEdge,0.,vUv.y)*(.55+.45*sin(p.x*320.+uTime*4.));col=mix(col,vec3(.9,.98,.96),foam*.6);
 float edge=smoothstep(0.,.14,vUv.x)*smoothstep(1.,.86,vUv.x)*smoothstep(1.,.62,vUv.y);
 float d=length(vec2(p.x,vUv.y*uSize.y));float rev=smoothstep(uReveal,uReveal-.04,d);
 float a=uOpacity*edge*rev*(.78+.2*fres);if(a<.004)discard;gl_FragColor=vec4(col,a);
}`;
/** Water plane whose near edge (the quay) is at z = quayZ, extending away from the reader. */
export function water(width,depth,quayZ,y){
 const m=new THREE.Mesh(new THREE.PlaneGeometry(width,depth),new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:{value:0},uOpacity:{value:0},uReveal:{value:0},uSize:{value:new THREE.Vector2(width,depth)},uFoamEdge:{value:.09}},
  vertexShader:'varying vec2 vUv;varying vec3 vW,vAx,vAy,vAz;void main(){vUv=uv;mat3 m=mat3(modelMatrix);vAx=normalize(m*vec3(1.,0.,0.));vAy=normalize(m*vec3(0.,0.,1.));vAz=normalize(m*vec3(0.,-1.,0.));vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',fragmentShader:WATER_FS}));
 m.rotation.x=-Math.PI/2;m.position.set(0,y,quayZ-depth/2);
 m.userData.update=(time,reveal)=>{m.material.uniforms.uTime.value=time;m.material.uniforms.uReveal.value=reveal};return m;
}

// ---------- 1:20 props (a 1.75 m person is 87 mm tall) ----------
const mat=(color,o={})=>new THREE.MeshStandardMaterial({color,roughness:.6,...o});
export const MATS={stone:mat(0xd9d4c4,{roughness:.9}),iron:mat(0x23383b,{roughness:.5,metalness:.4}),white:mat(0xf3f4ef,{roughness:.45}),blue:mat(0x1f6f8b,{roughness:.5}),
 wood:mat(0x9a7451,{roughness:.8}),green:mat(0x4f8f5a,{roughness:.7}),trunk:mat(0x8c7457,{roughness:.9}),orange:mat(0xd9792b,{roughness:.6}),teal:mat(0x2b7f7a,{roughness:.6}),
 yellow:mat(0xe3b53a,{roughness:.55}),dark:mat(0x2b3436,{roughness:.6}),rubber:mat(0x1d2224,{roughness:.9}),sail:mat(0xf7f5ee,{roughness:.8,side:THREE.DoubleSide})};
const shadowed=o=>{o.traverse(m=>{if(m.isMesh)m.castShadow=true});return o};

/** Walking figure with swinging legs and arms. update(phase) animates one stride per 2π. */
export function person(color=0xeef6f0,{seated=false}={}){
 const g=new THREE.Group(),skin=mat(color,{roughness:.55}),legs=mat(new THREE.Color(color).multiplyScalar(.72),{roughness:.6});
 const limb=(r,len,m)=>{const p=new THREE.Group(),c=new THREE.Mesh(new THREE.CapsuleGeometry(r,len,3,8),m);c.position.y=-len/2-r;p.add(c);return p};
 const legL=limb(.003,.034,legs),legR=limb(.003,.034,legs);legL.position.set(0,.043,.0042);legR.position.set(0,.043,-.0042);
 const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.0072,.02,3,10),skin);torso.position.y=.06;torso.scale.z=.82;
 const head=new THREE.Mesh(new THREE.SphereGeometry(.0062,14,10),skin);head.position.y=.081;
 const armL=limb(.0022,.026,skin),armR=limb(.0022,.026,skin);armL.position.set(0,.071,.0095);armR.position.set(0,.071,-.0095);
 g.add(legL,legR,torso,head,armL,armR);shadowed(g);
 if(seated){legL.rotation.z=legR.rotation.z=Math.PI/2;g.userData.update=()=>{};return g}
 g.userData.update=ph=>{const s=Math.sin(ph);legL.rotation.z=s*.5;legR.rotation.z=-s*.5;armL.rotation.z=-s*.4;armR.rotation.z=s*.4};
 return g;
}
export function bollard(){const b=new THREE.Group(),post=new THREE.Mesh(new THREE.CylinderGeometry(.0028,.0034,.0065,16),MATS.iron),cap=new THREE.Mesh(new THREE.SphereGeometry(.0036,16,8,0,Math.PI*2,0,Math.PI/2),MATS.iron);cap.position.y=.0032;b.add(post,cap);return shadowed(b)}
export function motorBoat(){
 const boat=new THREE.Group(),shape=new THREE.Shape([[-.056,-.017],[.035,-.018],[.066,0],[.035,.018],[-.056,.017]].map(([x,z])=>new THREE.Vector2(x,z)));
 const hg=new THREE.ExtrudeGeometry(shape,{depth:.011,bevelEnabled:true,bevelSize:.0015,bevelThickness:.0015,bevelSegments:2});hg.rotateX(Math.PI/2);hg.translate(0,.011,0);
 const hull=new THREE.Mesh(hg,MATS.white),band=new THREE.Mesh(hg.clone(),MATS.blue),cabin=new THREE.Mesh(new RoundedBoxGeometry(.036,.014,.026,2,.003),MATS.white);
 band.scale.set(1.012,.22,1.04);band.position.y=.0035;cabin.position.set(-.014,.017,0);boat.add(hull,band,cabin);return shadowed(boat);
}
export function sailBoat(){
 const boat=motorBoat();boat.remove(boat.children[2]);
 const mast=new THREE.Mesh(new THREE.CylinderGeometry(.0009,.0009,.11,6),MATS.dark);mast.position.set(.005,.066,0);
 const sailShape=new THREE.Shape([new THREE.Vector2(0,0),new THREE.Vector2(.05,0),new THREE.Vector2(0,.095)]);
 const sail=new THREE.Mesh(new THREE.ShapeGeometry(sailShape),MATS.sail);sail.position.set(-.046,.016,0);
 const jib=new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0,0),new THREE.Vector2(.045,0),new THREE.Vector2(0,.08)])),MATS.sail);jib.rotation.y=Math.PI;jib.position.set(.052,.016,0);
 boat.add(mast,sail,jib);return shadowed(boat);
}
export function bench(){const b=new THREE.Group(),seat=new THREE.Mesh(new RoundedBoxGeometry(.09,.003,.022,1,.001),MATS.wood),back=new THREE.Mesh(new RoundedBoxGeometry(.09,.016,.003,1,.001),MATS.wood);
 seat.position.y=.022;back.position.set(0,.034,-.011);back.rotation.x=-.15;b.add(seat,back);for(const x of[-.038,.038]){const l=new THREE.Mesh(new THREE.BoxGeometry(.003,.022,.02),MATS.iron);l.position.set(x,.011,0);b.add(l)}return shadowed(b)}
export function palm(h=.19,seed=1){
 const g=new THREE.Group(),r=rng(seed),curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(0,0,0),new THREE.Vector3(.012,h*.5,0),new THREE.Vector3(.022,h,0));
 g.add(new THREE.Mesh(new THREE.TubeGeometry(curve,12,.0042,8),MATS.trunk));
 const leafShape=new THREE.Shape();leafShape.moveTo(0,0);leafShape.quadraticCurveTo(.03,.012,.075,0);leafShape.quadraticCurveTo(.03,-.004,0,0);
 for(let i=0;i<9;i++){const leaf=new THREE.Mesh(new THREE.ShapeGeometry(leafShape,6),new THREE.MeshStandardMaterial({color:new THREE.Color().setHSL(.3+r()*.05,.45,.32+r()*.08),roughness:.7,side:THREE.DoubleSide}));
  const p=leaf.geometry.attributes.position;for(let k=0;k<p.count;k++){const x=p.getX(k);p.setZ(k,-x*x*4)}leaf.geometry.computeVertexNormals();
  const holder=new THREE.Group();holder.position.set(.022,h,0);holder.rotation.y=i/9*Math.PI*2+r()*.3;leaf.rotation.x=-Math.PI/2;leaf.rotation.y=-.35-r()*.3;holder.add(leaf);g.add(holder)}
 return shadowed(g);
}
/** A gull: two wing triangles flapping. */
export function gull(){const g=new THREE.Group(),m=new THREE.MeshStandardMaterial({color:0xf5f7f6,roughness:.6,side:THREE.DoubleSide}),body=new THREE.Mesh(new THREE.CapsuleGeometry(.0018,.009,3,6),m);body.rotation.z=Math.PI/2;g.add(body);
 const wing=s=>{const w=new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0,0),new THREE.Vector2(.004,0),new THREE.Vector2(-.002,.022)])),m);w.rotation.x=s*Math.PI/2;const h=new THREE.Group();h.add(w);return h};
 const l=wing(1),r=wing(-1);g.add(l,r);g.userData.update=ph=>{const a=Math.sin(ph)*.6;l.rotation.x=a;r.rotation.x=-a};return g}
export function truck(){
 const g=new THREE.Group(),cab=new THREE.Mesh(new RoundedBoxGeometry(.072,.11,.112,2,.008),MATS.white),glass=new THREE.Mesh(new THREE.BoxGeometry(.002,.035,.09),new THREE.MeshStandardMaterial({color:0x1f3b46,roughness:.2,metalness:.3}));
 cab.position.set(.15,.075,0);glass.position.set(.187,.098,0);
 const chassis=new THREE.Mesh(new THREE.BoxGeometry(.33,.012,.09),MATS.dark);chassis.position.set(0,.03,0);
 const box=new THREE.Mesh(new RoundedBoxGeometry(.24,.12,.118,2,.003),MATS.teal);box.position.set(-.035,.098,0);
 const logo=new THREE.Mesh(new THREE.PlaneGeometry(.12,.04),new THREE.MeshBasicMaterial({transparent:true,map:canvasTexture(512,170,(c,w,h)=>{c.font='800 66px Archivo, Arial, sans-serif';c.fillStyle='#e8fff6';c.fillText('PORT · BCN',22,104)})}));logo.position.set(-.035,.1,.0595);
 g.add(cab,glass,chassis,box,logo);g.userData.wheels=[];
 for(const x of[.14,-.06,-.12])for(const z of[-.047,.047]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.024,.024,.018,20),MATS.rubber);w.rotation.x=Math.PI/2;w.position.set(x,.024,z);g.add(w);g.userData.wheels.push(w)}
 return shadowed(g);
}
export function forklift(){
 const g=new THREE.Group(),body=new THREE.Mesh(new RoundedBoxGeometry(.075,.04,.055,2,.006),MATS.yellow);body.position.set(0,.032,0);
 const cage=new THREE.Group();for(const x of[-.02,.02])for(const z of[-.024,.024]){const p=new THREE.Mesh(new THREE.BoxGeometry(.003,.05,.003),MATS.dark);p.position.set(x,.077,z);cage.add(p)}
 const roof=new THREE.Mesh(new THREE.BoxGeometry(.046,.003,.052),MATS.dark);roof.position.y=.103;cage.add(roof);
 const mast=new THREE.Group();for(const z of[-.016,.016]){const r=new THREE.Mesh(new THREE.BoxGeometry(.004,.11,.006),MATS.dark);r.position.set(.042,.06,z);mast.add(r)}
 const carriage=new THREE.Group();for(const z of[-.013,.013]){const f=new THREE.Mesh(new THREE.BoxGeometry(.05,.002,.006),MATS.iron);f.position.set(.07,0,z);carriage.add(f)}
 carriage.position.y=.012;g.add(body,cage,mast,carriage);
 for(const x of[-.025,.028])for(const z of[-.029,.029]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.011,.011,.01,16),MATS.rubber);w.rotation.x=Math.PI/2;w.position.set(x,.011,z);g.add(w)}
 g.userData.carriage=carriage;return shadowed(g);
}
export function container(color=MATS.orange,len=.15){
 const g=new THREE.Group(),box=new THREE.Mesh(new THREE.BoxGeometry(len,.13,.12),color);box.position.y=.065;g.add(box);
 const ribs=new THREE.MeshStandardMaterial({color:new THREE.Color(color.color).multiplyScalar(.75),roughness:.6});
 for(let i=0;i<9;i++){const r=new THREE.Mesh(new THREE.BoxGeometry(.002,.124,.1215),ribs);r.position.set(-len/2+.01+i*(len-.02)/8,.065,0);g.add(r)}
 return shadowed(g);
}
/** The batch bag (big bag) at 1:20: about 50 mm. */
export function bigBag(scale=1){const g=new THREE.Group(),bag=new THREE.Mesh(new RoundedBoxGeometry(.05,.052,.05,3,.008),new THREE.MeshStandardMaterial({color:0xe6dfca,roughness:.95}));bag.position.y=.028;g.add(bag);
 for(const[x,z]of[[-.02,-.02],[.02,-.02],[.02,.02],[-.02,.02]]){const loop=new THREE.Mesh(new THREE.TorusGeometry(.006,.0012,5,12,Math.PI),MATS.green);loop.position.set(x,.054,z);loop.rotation.y=Math.atan2(z,x);g.add(loop)}
 g.scale.setScalar(scale);return shadowed(g)}
export function pallet(){const p=new THREE.Mesh(new THREE.BoxGeometry(.06,.007,.06),MATS.wood);p.position.y=.0035;const g=new THREE.Group();g.add(p);return shadowed(g)}
export function rope(){const geo=new THREE.BufferGeometry().setFromPoints(Array.from({length:24},()=>new THREE.Vector3()));const l=new THREE.Line(geo,new THREE.LineBasicMaterial({color:0xe9e1c8,transparent:true}));l.frustumCulled=false;
 l.userData.set=(a,b,sag)=>{const p=geo.attributes.position;for(let i=0;i<24;i++){const t=i/23;p.setXYZ(i,lerp(a.x,b.x,t),lerp(a.y,b.y,t)-Math.sin(t*Math.PI)*sag,lerp(a.z,b.z,t))}p.needsUpdate=true};return l}
