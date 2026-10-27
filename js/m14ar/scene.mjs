// «M-14 despierta»: the story of the piece, staged at real scale on the physical J2 model.
// Units are metres. Origin = centre of the QR on the top face of the piece.
// X = along the 150 mm edge (QR right), Y = up, Z = towards the reader (QR bottom edge).
import * as THREE from '../../vendor/three.module.js';
import {RoundedBoxGeometry} from '../../vendor/RoundedBoxGeometry.js';
import {T,tr} from './text.mjs';

export const PIECE={w:.15,d:.075,h:.004};
export const TIMELINE={loopStart:5,loopEnd:63,chapters:[5,17,29,40,53]};
const TABLE=-PIECE.h,Q01=.157,P13=-.157,MINT=new THREE.Color('#7edbc2'),PE_COLORS=['#79bba0','#163e41','#b5bfa2','#658c77','#30796b'];

const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const seg=(t,a,b)=>clamp((t-a)/(b-a));
const io=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
const out=x=>1-Math.pow(1-x,3);
const back=x=>{const c=1.9;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2)};
const win=(t,a,b,fi=.6,fo=.6)=>Math.min(seg(t,a,a+fi),1-seg(t,b-fo,b));
const lerp=(a,b,t)=>a+(b-a)*t;
function rng(seed){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}}

// ---------- textures ----------
function canvasTexture(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t}
function speckle(seed,base,palette,count,min,max){return canvasTexture(512,256,(g,w,h)=>{const r=rng(seed);g.fillStyle=base;g.fillRect(0,0,w,h);for(let i=0;i<count;i++){const x=r()*w,y=r()*h,s=min+r()*(max-min);g.fillStyle=palette[Math.floor(r()*palette.length)];g.beginPath();g.moveTo(x,y);g.lineTo(x+s,y-s*.4);g.lineTo(x+s*.6,y+s);g.closePath();g.fill()}})}
// Smooth value noise shared by the tarp dissolve and the flake release order, so both match.
function valueNoise(seed){const r=rng(seed),G=[13,9],g=Array.from({length:G[0]*G[1]},r),fine=Array.from({length:40*26},r);
 const at=(a,gx,gy,x,y)=>a[Math.min(gy-1,y)*gx+Math.min(gx-1,x)];
 const bil=(a,gx,gy,u,v)=>{const x=u*(gx-1),y=v*(gy-1),x0=Math.floor(x),y0=Math.floor(y),fx=x-x0,fy=y-y0,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
  return lerp(lerp(at(a,gx,gy,x0,y0),at(a,gx,gy,x0+1,y0),sx),lerp(at(a,gx,gy,x0,y0+1),at(a,gx,gy,x0+1,y0+1),sx),sy)};
 return(u,v)=>clamp((bil(g,G[0],G[1],u,v)*.72+bil(fine,40,26,u,v)*.28-.12)/.76,.002,.998)}
const BLUE_BAND=v=>((v*3+.05)%1+1)%1<.22;
function tarpTexture(){return canvasTexture(512,340,(g,w,h)=>{
 for(let y=0;y<h;y++){const v=1-(y+.5)/h;g.fillStyle=BLUE_BAND(v)?'#2a6ba8':'#eef1ec';g.fillRect(0,y,w,1)}
 const r=rng(91);for(let i=0;i<70;i++){const x=r()*w,y=r()*h,len=40+r()*160,a=r()*Math.PI;const grd=g.createLinearGradient(x,y,x+Math.cos(a)*len,y+Math.sin(a)*len);grd.addColorStop(0,'rgba(20,40,50,0)');grd.addColorStop(.5,`rgba(20,40,50,${.05+r()*.08})`);grd.addColorStop(1,'rgba(20,40,50,0)');g.strokeStyle=grd;g.lineWidth=2+r()*5;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*len,y+Math.sin(a)*len);g.stroke()}
 g.strokeStyle='rgba(30,50,60,.35)';g.lineWidth=3;g.setLineDash([9,7]);g.strokeRect(14,14,w-28,h-28);g.setLineDash([]);
 for(let i=0;i<10;i++)for(const y of[26,h-26]){g.beginPath();g.arc(30+i*(w-60)/9,y,6,0,7);g.fillStyle='#9aa6a3';g.fill();g.beginPath();g.arc(30+i*(w-60)/9,y,3,0,7);g.fillStyle='#38464a';g.fill()}
 g.save();g.translate(w*.62,h*.58);g.rotate(-.06);g.font='700 40px Archivo, Arial, sans-serif';g.fillStyle='rgba(30,60,80,.22)';g.fillText('REFIT · PORT VELL',-170,0);g.restore();
})}
function noiseTexture(noise){const t=canvasTexture(256,170,(g,w,h)=>{const img=g.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const n=Math.round(noise((x+.5)/w,1-(y+.5)/h)*255),i=(y*w+x)*4;img.data[i]=img.data[i+1]=img.data[i+2]=n;img.data[i+3]=255}g.putImageData(img,0,0)});t.colorSpace=THREE.NoColorSpace;return t}

// ---------- labels ----------
function label({title,lines=[],px=.00021,accent='#7edbc2',tone='dark'}){
 const pad=26,titleFont='650 44px Inter, Arial, sans-serif',lineFont='500 26px Mono, ui-monospace, monospace',c=document.createElement('canvas'),g=c.getContext('2d');
 g.font=titleFont;let w=title?g.measureText(title).width:0;g.font=lineFont;for(const l of lines)w=Math.max(w,g.measureText(l).width);
 const W=Math.ceil(w+pad*2+10),H=Math.ceil(pad*2+(title?50:0)+lines.length*36-(title?0:6));c.width=W;c.height=H;
 g.fillStyle=tone==='dark'?'rgba(5,30,38,.84)':'rgba(250,252,246,.9)';g.beginPath();g.roundRect(1,1,W-2,H-2,18);g.fill();
 g.strokeStyle=accent;g.globalAlpha=.75;g.lineWidth=2;g.stroke();g.globalAlpha=1;g.fillStyle=accent;g.fillRect(pad-12,pad+4,4,H-pad*2-8);
 let y=pad+38;if(title){g.font=titleFont;g.fillStyle=tone==='dark'?'#f4fff9':'#0c2c35';g.fillText(title,pad+4,y);y+=44}
 g.font=lineFont;g.fillStyle=tone==='dark'?accent:'#1d5b4c';for(const l of lines){g.fillText(l,pad+4,y);y+=36}
 const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
 const s=new THREE.Sprite(new THREE.SpriteMaterial({map,transparent:true,depthTest:false,depthWrite:false,opacity:1}));
 s.material.userData.base=1;s.scale.set(W*px,H*px,1);s.center.set(.5,0);s.renderOrder=40;return s;
}

// ---------- shaders ----------
const ribbonMaterial=(color=MINT,glow=30)=>new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,
 uniforms:{uProg:{value:0},uOpacity:{value:0},uColor:{value:color.clone()},uGlow:{value:glow}},
 vertexShader:'attribute float s;varying float vS;void main(){vS=s;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'uniform float uProg,uOpacity,uGlow;uniform vec3 uColor;varying float vS;void main(){float on=step(vS,uProg);float head=exp(-max(uProg-vS,0.)*uGlow);float a=min(1.,on*(.75+.6*head)*uOpacity);if(a<.004)discard;gl_FragColor=vec4(mix(uColor*.82,vec3(1.),head*.7),a);}'});
/** Flat strip following a polyline in the XZ plane; attribute s = normalised arc length. */
function ribbon(points,width,closed,material){
 const pts=closed?[...points,points[0]]:points,lens=[0];for(let i=1;i<pts.length;i++)lens.push(lens[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));
 const total=lens.at(-1),pos=[],s=[],idx=[];
 pts.forEach((p,i)=>{const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)];let dx=b[0]-a[0],dz=b[1]-a[1];const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;
  pos.push(p[0]-dz*width/2,0,p[1]+dx*width/2,p[0]+dz*width/2,0,p[1]-dx*width/2);s.push(lens[i]/total,lens[i]/total);if(i)idx.push(2*i-2,2*i-1,2*i,2*i-1,2*i+1,2*i)});
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('s',new THREE.Float32BufferAttribute(s,1));g.setIndex(idx);
 const m=new THREE.Mesh(g,material);m.frustumCulled=false;return m;
}
function rectPath(w,d,n=60){const p=[],c=[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]];for(let k=0;k<4;k++){const a=c[k],b=c[(k+1)%4];for(let i=0;i<n;i++)p.push([lerp(a[0],b[0],i/n),lerp(a[1],b[1],i/n)])}return p}
const FLAKE_VS=`
attribute vec2 aUv;attribute vec3 aLand;attribute vec4 aSeed;attribute vec3 aColor;
uniform float uTime,uTear,uSwirl,uLand,uSettle,uMode,uRise,uConverge,uVis,uWaveT;uniform vec3 uTarpC,uRetOff;uniform vec2 uTarpS;
varying vec3 vColor;varying float vLight;
float wave(vec2 p,float t){return .0036*sin(p.x*11.+t*2.1)+.0024*sin(p.y*15.-t*1.6+p.x*4.)+.0015*sin((p.x+p.y)*21.+t*2.9);}
vec3 rot(vec3 v,vec3 k,float a){float c=cos(a),s=sin(a);return v*c+cross(k,v)*s+k*dot(k,v)*(1.-c);}
void main(){
 vec2 tp=aUv-.5;vec3 tarp=uTarpC+vec3(tp.x*uTarpS.x,wave(tp,uWaveT),-tp.y*uTarpS.y);
 float tear=smoothstep(0.,1.,clamp((uTear-aSeed.x)*7.,0.,1.));
 float ang=aSeed.y*6.2832+uTime*(1.1+aSeed.z*1.6);
 float r=mix(.075,.017,uSwirl)*(.45+.55*aSeed.w);
 float y=mix(uTarpC.y,.026,uSwirl)+(aSeed.z-.5)*.045*(1.-.7*uSwirl)+.006*sin(uTime*2.5+aSeed.y*30.);
 vec3 swirl=vec3(cos(ang)*r,y,sin(ang)*r*.72);
 vec3 burst=normalize(tarp-uTarpC+vec3(0.,.0005,0.))*.03*sin(tear*3.1416);
 vec3 p=mix(tarp,swirl,tear)+burst;
 float l=smoothstep(0.,1.,clamp(uLand*1.6-aSeed.w*.6,0.,1.));
 p=mix(p,aLand,l)+vec3(0.,.022*sin(l*3.1416)*(1.-l),0.);
 float size=.0013*(.55+.9*aSeed.z)*tear*(1.-uSettle*smoothstep(.55,1.,l));
 vec3 col=mix(mix(vec3(.94,.95,.93),vec3(.17,.42,.66),step(fract(aUv.y*3.+.05),.22)),aColor,smoothstep(.15,.9,uSwirl));
 float calm=l;
 if(uMode>.5){
  vec3 start=aLand+uRetOff;
  float rr=smoothstep(0.,1.,clamp(uRise*1.5-aSeed.x*.5,0.,1.));
  float s=aSeed.y*6.2832+uTime*.55*(.8+.4*aSeed.z);float den=1.+sin(s)*sin(s);
  vec3 inf=vec3(.2*cos(s)/den,.045+.01*sin(s*3.+aSeed.w*6.)+(aSeed.z-.5)*.02,.11*sin(s)*cos(s)/den)+(aSeed.xyz-.5)*.01;
  float cv=smoothstep(0.,1.,clamp(uConverge*1.4-aSeed.w*.4,0.,1.));
  p=mix(mix(start,inf,rr),vec3(0.,.003,0.),cv);
  size=.0013*(.55+.9*aSeed.z)*rr*(1.-cv*cv);
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
const FLAKE_FS='varying vec3 vColor;varying float vLight;void main(){gl_FragColor=vec4(vColor*vLight,1.);}';
const WATER_FS=`
uniform float uTime,uOpacity,uReveal;uniform vec2 uSize;varying vec2 vUv;varying vec3 vW,vAx,vAy,vAz;
float h(vec2 p){return sin(p.x*95.+uTime*1.7)*.5+sin(p.y*130.-uTime*2.3+p.x*40.)*.35+sin((p.x*.7+p.y)*230.+uTime*3.1)*.18;}
void main(){
 vec2 p=(vUv-.5)*uSize;float e=.0007;float hx=(h(p+vec2(e,0.))-h(p-vec2(e,0.)))/(2.*e),hy=(h(p+vec2(0.,e))-h(p-vec2(0.,e)))/(2.*e);
 vec3 c=normalize(vec3(-hx*.0011,1.,hy*.0011));vec3 n=normalize(vAx*c.x+vAy*c.y+vAz*c.z);vec3 v=normalize(cameraPosition-vW);vec3 L=normalize(vAx*.35+vAy*.8+vAz*.45);
 float fres=pow(1.-max(dot(n,v),0.),3.);float spec=pow(max(dot(reflect(-L,n),v),0.),70.)*1.3;
 vec3 col=mix(vec3(.02,.2,.25),vec3(.16,.52,.56),.25+.55*fres)+spec*vec3(1.,.97,.9);
 float foam=smoothstep(.09,0.,vUv.y)*(.55+.45*sin(p.x*320.+uTime*4.));col=mix(col,vec3(.9,.98,.96),foam*.6);
 float edge=smoothstep(0.,.14,vUv.x)*smoothstep(1.,.86,vUv.x)*smoothstep(1.,.62,vUv.y);
 float d=length(vec2(p.x,vUv.y*uSize.y));float rev=smoothstep(uReveal,uReveal-.04,d);
 float a=uOpacity*edge*rev*(.78+.2*fres);if(a<.004)discard;gl_FragColor=vec4(col,a);
}`;

// ---------- the scene ----------
export function createM14Scene({lang='es',passport=null,shadows=true}={}){
 const root=new THREE.Group(),stage=new THREE.Group();root.add(stage);root.name='m14-root';
 const fading=[],cues=[];let t=0,paused=false,lastT=0;
 const L=k=>tr(T[k],lang);
 function fadeable(obj,base){obj.traverse(o=>{for(const m of[o.material].flat().filter(Boolean)){if(m.userData.base===undefined)m.userData.base=base??m.opacity;m.transparent=true}});fading.push(obj);return obj}
 function setFade(obj,a){obj.visible=a>.002;if(!obj.visible)return;obj.traverse(o=>{for(const m of[o.material].flat().filter(Boolean)){if(m.uniforms?.uOpacity)m.uniforms.uOpacity.value=(m.userData.base??1)*a;else m.opacity=(m.userData.base??1)*a}})}

 // Lights. The key light casts the only shadow; catchers show it on the real table and the real piece.
 stage.add(new THREE.HemisphereLight(0xf2fff4,0x1b3940,1.6));
 const key=new THREE.DirectionalLight(0xfff3dc,2.6);key.position.set(.12,.34,.2);key.target.position.set(0,0,0);stage.add(key,key.target);
 if(shadows){key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-.28,right:.28,top:.28,bottom:-.28,near:.05,far:1});key.shadow.bias=-.0004;key.shadow.normalBias=.002}
 const fill=new THREE.DirectionalLight(0x7ce0d0,.9);fill.position.set(-.3,.15,-.2);stage.add(fill);
 const catcher=(w,d,y,o)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.ShadowMaterial({color:0x00141a,opacity:o}));m.rotation.x=-Math.PI/2;m.position.y=y;m.receiveShadow=true;m.renderOrder=-5;stage.add(m);return m};
 catcher(.8,.8,TABLE+.0001,.26);catcher(PIECE.w,PIECE.d,.00015,.3);

 // The physical piece: invisible, but it writes depth so virtual objects pass behind it correctly.
 const occluder=new THREE.Mesh(new THREE.BoxGeometry(PIECE.w,PIECE.h,PIECE.d),new THREE.MeshBasicMaterial({colorWrite:false}));
 occluder.position.y=-PIECE.h/2;occluder.renderOrder=-10;occluder.name='piece';stage.add(occluder);

 // --- 0 · awakening: radar ring, traced contour, scan grid, identity tag ---
 const ring=new THREE.Mesh(new THREE.RingGeometry(.96,1,96),new THREE.MeshBasicMaterial({color:MINT,transparent:true,depthWrite:false,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.0004;stage.add(ring);
 const contour=ribbon(rectPath(PIECE.w+.003,PIECE.d+.003),.0014,true,ribbonMaterial(MINT,22));contour.position.y=.0004;stage.add(contour);
 const brackets=new THREE.Group();for(const[sx,sz]of[[-1,-1],[1,-1],[1,1],[-1,1]]){const x=sx*(PIECE.w/2+.006),z=sz*(PIECE.d/2+.006),k=.014;const b=ribbon([[x-sx*k,z],[x,z],[x,z-sz*k]],.0018,false,ribbonMaterial(MINT,0));b.material.uniforms.uProg.value=1;b.position.y=.0005;brackets.add(b)}stage.add(brackets);
 const scan=new THREE.Mesh(new THREE.PlaneGeometry(PIECE.w,PIECE.d),new THREE.ShaderMaterial({transparent:true,depthWrite:false,extensions:{derivatives:true},
  uniforms:{uSweep:{value:0},uOpacity:{value:0},uColor:{value:MINT.clone()}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform float uSweep,uOpacity;uniform vec3 uColor;varying vec2 vUv;void main(){vec2 g=vec2(20.,10.)*vUv;vec2 f=abs(fract(g-.5)-.5)/fwidth(g);float line=1.-min(min(f.x,f.y),1.);float behind=step(vUv.x,uSweep);float band=exp(-abs(vUv.x-uSweep)*45.);float a=(line*.65*behind+band*.6)*uOpacity;if(a<.004)discard;gl_FragColor=vec4(mix(uColor*.75,vec3(1.),band*.5),a);}'}));
 scan.rotation.x=-Math.PI/2;scan.position.y=.0006;stage.add(scan);
 const tag=fadeable(label({title:'M–14',lines:[L('tagSub'),'CUEVA-BCN-M-14'],px:.00013}));tag.position.set(-.05,.03,-.01);stage.add(tag);

 // --- 1 · origin: refit tarp -> flakes -> board ---
 const noise=valueNoise(2026),TW=.13,TD=.085;
 const tarpGeo=new THREE.PlaneGeometry(1,1,40,26);tarpGeo.rotateX(-Math.PI/2);
 const tarpBase=Float32Array.from(tarpGeo.attributes.position.array);
 const tarpMat=new THREE.MeshStandardMaterial({map:tarpTexture(),alphaMap:noiseTexture(noise),alphaTest:.999,side:THREE.DoubleSide,roughness:.78,metalness:0});
 const tarp=new THREE.Mesh(tarpGeo,tarpMat);tarp.castShadow=true;
 tarp.customDepthMaterial=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,alphaMap:tarpMat.alphaMap,alphaTest:.999});stage.add(tarp);
 const tarpLabel=fadeable(label({title:L('tarp'),px:.00012}));stage.add(tarpLabel);
 const wave=(x,z,w)=>.0036*Math.sin(x*11+w*2.1)+.0024*Math.sin(z*15-w*1.6+x*4)+.0015*Math.sin((x+z)*21+w*2.9);
 function shapeTarp(cy,w){const p=tarpGeo.attributes.position.array;for(let i=0;i<p.length;i+=3){const x=tarpBase[i],z=tarpBase[i+2];p[i]=x*TW;p[i+1]=cy+wave(x,-z,w);p[i+2]=z*TD}tarpGeo.attributes.position.needsUpdate=true;tarpGeo.computeVertexNormals()}

 const N=72*36,tri=new THREE.InstancedBufferGeometry();
 tri.setAttribute('position',new THREE.Float32BufferAttribute([-1,0,-.7,1,0,-.5,-.1,0,1],3));tri.instanceCount=N;
 const aUv=new Float32Array(N*2),aLand=new Float32Array(N*3),aSeed=new Float32Array(N*4),aColor=new Float32Array(N*3),r=rng(14);
 const pe=PE_COLORS.map(c=>new THREE.Color(c));
 for(let i=0;i<N;i++){const gx=i%72,gz=Math.floor(i/72),u=r(),v=r();aUv.set([u,v],i*2);
  aLand.set([(gx+.5)/72*.148-.074+(r()-.5)*.0015,.0012+r()*.0012,(gz+.5)/36*.074-.037+(r()-.5)*.0015],i*3);
  aSeed.set([noise(u,v),r(),r(),r()],i*4);const c=pe[Math.floor(r()*pe.length)];aColor.set([c.r,c.g,c.b],i*3)}
 tri.setAttribute('aUv',new THREE.InstancedBufferAttribute(aUv,2));tri.setAttribute('aLand',new THREE.InstancedBufferAttribute(aLand,3));
 tri.setAttribute('aSeed',new THREE.InstancedBufferAttribute(aSeed,4));tri.setAttribute('aColor',new THREE.InstancedBufferAttribute(aColor,3));
 const flakeU={uTime:{value:0},uTear:{value:0},uSwirl:{value:0},uLand:{value:0},uSettle:{value:0},uMode:{value:0},uRise:{value:0},uConverge:{value:0},uVis:{value:0},uWaveT:{value:0},uTarpC:{value:new THREE.Vector3(0,.09,0)},uTarpS:{value:new THREE.Vector2(TW,TD)},uRetOff:{value:new THREE.Vector3(Q01,TABLE+.012,0)}};
 const flakes=new THREE.Mesh(tri,new THREE.ShaderMaterial({uniforms:flakeU,vertexShader:FLAKE_VS,fragmentShader:FLAKE_FS,side:THREE.DoubleSide}));flakes.frustumCulled=false;stage.add(flakes);
 const flakeLabel=fadeable(label({title:L('flakes'),px:.00012}));flakeLabel.position.set(.075,.07,0);stage.add(flakeLabel);

 const peTex=speckle(1407,'#286f69',['#79bba0','#163e41','#b5bfa2','#658c77','#30796b'],1700,1,7),conTex=speckle(1433,'#bac0b5',['rgba(255,255,245,.18)','rgba(55,67,57,.2)','rgba(120,128,118,.35)'],6500,.3,2.4);
 const layers=new THREE.Group();stage.add(layers);
 const board=new THREE.Mesh(new RoundedBoxGeometry(PIECE.w,.0026,PIECE.d,2,.0006),new THREE.MeshStandardMaterial({map:peTex,roughness:.6,color:0xd8edcf}));board.name='pe';board.castShadow=true;layers.add(board);
 const conGeo=new RoundedBoxGeometry(PIECE.w,.0118,PIECE.d,2,.0009);conGeo.translate(0,.0059,0);
 const concrete=new THREE.Mesh(conGeo,new THREE.MeshStandardMaterial({map:conTex,roughness:.92,color:0xcfd3c6}));concrete.name='concrete';concrete.castShadow=true;layers.add(concrete);
 const engraving=new THREE.Mesh(new THREE.PlaneGeometry(.05,.02),new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,map:canvasTexture(512,200,(g,w,h)=>{g.fillStyle='#2f5653';g.font='600 92px Mono, monospace';g.fillText('M–14',14,96);g.font='500 34px Mono, monospace';g.fillText('CUEVA-BCN · PE',18,160)})}));
 engraving.rotation.x=-Math.PI/2;engraving.position.set(-.044,.0119,.018);concrete.add(engraving);
 fadeable(layers);
 const guides=new THREE.Group();for(const x of[-PIECE.w/2,PIECE.w/2])for(const z of[-PIECE.d/2,PIECE.d/2]){const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,0,z),new THREE.Vector3(x,1,z)]),new THREE.LineDashedMaterial({color:MINT,dashSize:.004,gapSize:.003,transparent:true}));l.computeLineDistances();guides.add(l)}stage.add(fadeable(guides,.7));
 const peLabel=fadeable(label({title:L('peLayer'),px:.00012})),conLabel=fadeable(label({title:L('concreteLayer'),px:.00012})),fmtLabel=fadeable(label({lines:[L('format'),L('mass')],px:.00012}));
 stage.add(peLabel,conLabel,fmtLabel);
 const pulse=new THREE.Mesh(new THREE.RingGeometry(.9,1,80),new THREE.MeshBasicMaterial({color:MINT,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));pulse.rotation.x=-Math.PI/2;stage.add(pulse);

 // --- 3 · identity: light column, passport card, ring of recorded readings ---
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
 const clock=at=>{try{return new Intl.DateTimeFormat('es-ES',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'}).format(new Date(at))}catch{return''}};
 const card=fadeable(label({title:'CUEVA-BCN-M-14',lines:[L('passportCard'),`${L('batch')} ${passport?.identity?.batchReference||'LOTE-BCN-PE-001'} · ${L('composition')}`,`${readings.length||8} ${L('readings')}`,L('integrity')],px:.00014}));
 card.position.set(0,.082,0);card.name='passport';stage.add(card);
 const RX=.118,RZ=.068,ringPts=Array.from({length:160},(_,i)=>{const a=i/160*Math.PI*2-Math.PI/2;return[Math.cos(a)*RX,Math.sin(a)*RZ]});
 const phaseRing=ribbon(ringPts,.0013,true,ribbonMaterial(MINT,10));phaseRing.position.y=TABLE+.0004;stage.add(phaseRing);
 const nodes=[];for(let i=0;i<8;i++){const a=i/8*Math.PI*2-Math.PI/2+Math.PI/8,ph='F'+(i+1),rec=readings.find(e=>e.phase===ph);
  const g=new THREE.Group();g.position.set(Math.cos(a)*RX,TABLE,Math.sin(a)*RZ);
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(.0042,.0042,.0014,24),new THREE.MeshStandardMaterial({color:0x0d3b40,emissive:MINT,emissiveIntensity:0,roughness:.4}));disc.position.y=.0007;disc.name='phase:'+ph;disc.castShadow=true;g.add(disc);
  const lbl=label({title:ph,lines:[tr(T.phases[ph],lang)+(rec?' · '+clock(rec.at):'')],px:.000105});lbl.material.userData.base=1;lbl.position.y=.009;g.add(lbl);
  g.userData={disc,lbl,phase:ph};nodes.push(g);stage.add(g)}
 const spark=new THREE.Sprite(new THREE.SpriteMaterial({map:canvasTexture(64,64,(g,w)=>{const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(220,255,240,1)');gr.addColorStop(.35,'rgba(126,219,194,.6)');gr.addColorStop(1,'rgba(126,219,194,0)');g.fillStyle=gr;g.fillRect(0,0,w,w)}),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
 spark.scale.setScalar(.012);stage.add(spark);

 // --- 4 · use and reuse: quay, water, people, boat, crane ---
 const port=new THREE.Group();stage.add(port);
 const WD=.17,water=new THREE.Mesh(new THREE.PlaneGeometry(.5,WD),new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:{value:0},uOpacity:{value:0},uReveal:{value:0},uSize:{value:new THREE.Vector2(.5,WD)}},
  vertexShader:'varying vec2 vUv;varying vec3 vW,vAx,vAy,vAz;void main(){vUv=uv;mat3 m=mat3(modelMatrix);vAx=normalize(m*vec3(1.,0.,0.));vAy=normalize(m*vec3(0.,0.,1.));vAz=normalize(m*vec3(0.,-1.,0.));vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',fragmentShader:WATER_FS}));
 water.rotation.x=-Math.PI/2;water.position.set(0,TABLE+.0002,-.068-WD/2);port.add(water);
 const stone=new THREE.MeshStandardMaterial({color:0xd9d4c4,roughness:.9}),iron=new THREE.MeshStandardMaterial({color:0x23383b,roughness:.5,metalness:.4});
 const coping=new THREE.Mesh(new THREE.BoxGeometry(.46,.003,.006),stone);coping.position.set(0,TABLE+.0015,-.065);coping.castShadow=coping.receiveShadow=true;port.add(coping);
 for(const x of[-.19,-.06,.06,.19]){const b=new THREE.Group(),post=new THREE.Mesh(new THREE.CylinderGeometry(.0028,.0034,.0065,16),iron),cap=new THREE.Mesh(new THREE.SphereGeometry(.0036,16,8,0,Math.PI*2,0,Math.PI/2),iron);cap.position.y=.0032;b.add(post,cap);b.position.set(x,TABLE+.0035+.003,-.0605);post.castShadow=cap.castShadow=true;port.add(b)}
 const slabMat=new THREE.MeshStandardMaterial({map:conTex,color:0xc9cdbf,roughness:.92,transparent:true,opacity:.92});
 const p13=new THREE.Mesh(new RoundedBoxGeometry(PIECE.w,PIECE.h,PIECE.d,2,.0006),slabMat);p13.position.set(P13,TABLE/2,0);p13.castShadow=p13.receiveShadow=true;port.add(p13);
 const q01=ribbon(rectPath(PIECE.w,PIECE.d,30),.0012,true,ribbonMaterial(MINT,0));q01.material.uniforms.uProg.value=1;q01.position.set(Q01,TABLE+.0003,0);port.add(q01);
 const p14=ribbon(rectPath(PIECE.w+.004,PIECE.d+.004,30),.0012,true,ribbonMaterial(new THREE.Color('#f2c46b'),0));p14.material.uniforms.uProg.value=1;p14.position.y=.0005;port.add(p14);
 const slotLabels=[['P-13',P13],['P-14 · M-14',0],['Q-01',Q01]].map(([s,x])=>{const l=label({title:s,px:.00012});l.material.userData.base=1;l.position.set(x,TABLE+.002,PIECE.d/2+.004);port.add(l);return l});
 const quayLabel=label({lines:[L('quay')],px:.00012});quayLabel.position.set(-.2,TABLE+.003,-.085);port.add(quayLabel);
 const figMat=new THREE.MeshStandardMaterial({color:0xeef6f0,roughness:.55});
 const people=[0,1,2].map(i=>{const f=new THREE.Group(),body=new THREE.Mesh(new THREE.CapsuleGeometry(.0085,.05,4,12),figMat),head=new THREE.Mesh(new THREE.SphereGeometry(.0078,16,12),figMat);
  body.position.y=.034;head.position.y=.077;body.castShadow=head.castShadow=true;f.add(body,head);f.userData={speed:[.06,.045,.052][i],z:[.012,-.028,.03][i],dir:i===1?-1:1,phase:i*.37};port.add(f);return f});
 const boat=new THREE.Group(),hullMat=new THREE.MeshStandardMaterial({color:0xf3f4ef,roughness:.45}),stripe=new THREE.MeshStandardMaterial({color:0x1f6f8b,roughness:.5});
 {const outline=new THREE.Shape([[-.056,-.017],[.035,-.018],[.066,0],[.035,.018],[-.056,.017]].map(([x,z])=>new THREE.Vector2(x,z)));
  const hg=new THREE.ExtrudeGeometry(outline,{depth:.011,bevelEnabled:true,bevelSize:.0015,bevelThickness:.0015,bevelSegments:2});hg.rotateX(Math.PI/2);hg.translate(0,.011,0);
  const hull=new THREE.Mesh(hg,hullMat),band=new THREE.Mesh(hg.clone(),stripe),cabin=new THREE.Mesh(new RoundedBoxGeometry(.036,.014,.026,2,.003),hullMat);
  band.scale.set(1.012,.22,1.04);band.position.y=.0035;cabin.position.set(-.014,.017,0);[hull,cabin].forEach(m=>m.castShadow=true);boat.add(hull,band,cabin);boat.position.y=TABLE+.004;port.add(boat)}
 const wake=Array.from({length:7},()=>{const s=new THREE.Sprite(spark.material.clone());s.material.opacity=0;s.scale.setScalar(.01);port.add(s);return s});
 fadeable(port);
 const ghost=new THREE.Group(),ghostMat=new THREE.MeshStandardMaterial({color:MINT,emissive:MINT,emissiveIntensity:.45,transparent:true,opacity:.34,depthWrite:false,roughness:.3});
 {const g=new THREE.BoxGeometry(PIECE.w,.0145,PIECE.d);g.translate(0,.00725,0);ghost.add(new THREE.Mesh(g,ghostMat),new THREE.LineSegments(new THREE.EdgesGeometry(g),new THREE.LineBasicMaterial({color:MINT,transparent:true})))}
 stage.add(ghost);fadeable(ghost);
 const cable=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(0,1,0)]),new THREE.LineBasicMaterial({color:0xd8efe6,transparent:true}));cable.frustumCulled=false;stage.add(fadeable(cable,.85));
 const reuseLabel=fadeable(label({title:L('reuse'),lines:['M–14'],px:.00012}));stage.add(reuseLabel);
 const flash=new THREE.Sprite(spark.material.clone());flash.material.opacity=0;stage.add(flash);

 const cue=(name,at)=>{if(lastT<at&&t>=at)cues.push(name)};
 function update(dt,camera){
  if(!paused){lastT=t;t+=dt;if(t>=TIMELINE.loopEnd){t=TIMELINE.loopStart;lastT=t-1e-4}}
  const time=performance.now()/1000;
  for(const[n,a]of[['ring',.05],['trace',.4],['tarp',5],['tear',9.2],['swirl',10.4],['land',13.6],['pour',17.4],['explode',20.2],['join',25.4],['column',29.2],['water',40.2],['lift',47],['set',51.5],['dissolve',53.6],['rise',55],['converge',58.2],['flash',60]])cue(n,a);
  // 0 · awakening (first lock only; the loop restarts at 5 s)
  const rr=seg(t,.05,1.4);ring.visible=t<1.5;ring.scale.setScalar(.01+out(rr)*.13);ring.material.opacity=(1-rr)*.9;
  contour.material.uniforms.uProg.value=t<5?io(seg(t,.4,2.2)):1;
  contour.material.uniforms.uOpacity.value=t<5?1:lerp(.28,.9,Math.max(win(t,60,62.6,.3,1.5),win(t,40,57,1,1)*.6));
  brackets.visible=true;brackets.children.forEach((b,i)=>{const p=t<5?back(seg(t,1.6+i*.12,2.2+i*.12)):1;b.scale.setScalar(Math.max(.001,p));b.material.uniforms.uOpacity.value=t<5?.9:.35});
  scan.material.uniforms.uSweep.value=io(seg(t,1.2,3));scan.material.uniforms.uOpacity.value=win(t,1.2,5,.2,1.4);
  setFade(tag,Math.max(win(t,2.4,9,.6,.8),0));tag.position.y=.03+out(seg(t,2.4,3.4))*.012;
  // 1 · origin
  const ty=lerp(.15,.068,out(seg(t,5,8)))+.003*Math.sin(time*1.3);flakeU.uTarpC.value.set(.004*Math.sin(time*.7),ty,0);flakeU.uWaveT.value=time;
  tarp.visible=t>5&&t<11;if(tarp.visible){shapeTarp(ty,time);tarp.position.x=flakeU.uTarpC.value.x;const thr=t<9.2?1-io(seg(t,5,6.6))*.999:io(seg(t,9.2,10.7));tarpMat.alphaTest=tarp.customDepthMaterial.alphaTest=clamp(thr,.001,.999)}
  setFade(tarpLabel,win(t,6,9.2,.5,.4));tarpLabel.position.set(-.07,ty+.012,-.03);
  flakeU.uTime.value=time;
  const ret=t>=53;flakeU.uMode.value=ret?1:0;
  flakeU.uTear.value=seg(t,9.2,10.7)*1.15;flakeU.uSwirl.value=io(seg(t,10.2,13.4));flakeU.uLand.value=io(seg(t,13.4,15.6));flakeU.uSettle.value=seg(t,14.8,16.2);
  flakeU.uRise.value=io(seg(t,53.6,56.2));flakeU.uConverge.value=io(seg(t,58,60.2));
  flakeU.uVis.value=ret?(t<61?1:0):(t>9&&t<16.4?1:0);flakes.visible=flakeU.uVis.value>0;
  setFade(flakeLabel,win(t,10.6,13.4,.4,.5));flakeLabel.position.y=.042+.006*Math.sin(time);
  // board + concrete (2 · material)
  const boardIn=seg(t,14.6,16.2),layersOn=t>=14.6&&t<39.5;
  setFade(layers,layersOn?Math.min(1,t<17?boardIn:1)*(t>36.5?1-seg(t,36.5,39.5):1)*(t>29?lerp(1,.55,seg(t,29,30)):1):0);
  const pour=io(seg(t,17.2,19.6)),ex=io(seg(t,20.2,22.6))*(1-io(seg(t,25.2,26.8)));
  concrete.visible=t>17.2&&layersOn;concrete.scale.y=Math.max(.001,pour);
  board.position.y=.0013+ex*.014;concrete.position.y=.0026+ex*.034;
  setFade(guides,win(t,20.2,26.8,.5,.4));guides.children.forEach(l=>{l.scale.y=Math.max(.001,concrete.position.y+.012*pour)});
  const lbl=win(t,21.2,26.2,.5,.4);setFade(peLabel,lbl);setFade(conLabel,lbl);setFade(fmtLabel,win(t,22,28.6,.5,.5));
  peLabel.position.set(.098,board.position.y-.002,.012);conLabel.position.set(.098,concrete.position.y+.003,.012);fmtLabel.position.set(0,concrete.position.y+.02,.03);
  const pj=seg(t,26.6,27.8);pulse.visible=pj>0&&pj<1;pulse.scale.setScalar(.06+pj*.08);pulse.material.opacity=(1-pj)*.8;pulse.position.y=.016;
  // 3 · identity
  const id=win(t,29.2,39.6,1,1.2);column.material.uniforms.uOpacity.value=id;column.material.uniforms.uTime.value=time;column.visible=id>0;column.scale.y=Math.max(.001,out(seg(t,29.2,30.4)));column.position.y=.045*column.scale.y;
  motes.material.uniforms.uOpacity.value=id;motes.material.uniforms.uTime.value=time;motes.visible=id>0;
  const cardIn=back(seg(t,30.2,31.2));setFade(card,id*seg(t,30.2,30.6));card.scale.y=card.userData.s0.y*Math.max(.001,cardIn);card.position.y=.082+.003*Math.sin(time*1.1);
  phaseRing.material.uniforms.uProg.value=io(seg(t,30.6,32));phaseRing.material.uniforms.uOpacity.value=id;
  nodes.forEach((g,i)=>{const on=seg(t,31.6+i*.75,32+i*.75),{disc,lbl}=g.userData;g.visible=id>0;disc.material.emissiveIntensity=on*(1.1+.5*Math.sin(time*4+i));disc.scale.setScalar(Math.max(.001,back(on)));lbl.material.opacity=on*id;lbl.visible=on*id>0;cue('node',31.6+i*.75)});
  const sp=seg(t,31.6,37.6);spark.visible=id>0&&sp>0&&sp<1;if(spark.visible){const a=(sp*8+.5)/8*Math.PI*2-Math.PI/2;spark.position.set(Math.cos(a)*RX,TABLE+.003,Math.sin(a)*RZ)}
  // 4 · use and reuse
  const pf=win(t,40,57,1.2,1.6);setFade(port,pf);water.material.uniforms.uReveal.value=out(seg(t,40.2,42.6))*.3;water.material.uniforms.uTime.value=time;
  people.forEach((f,i)=>{const{speed,z,dir,phase}=f.userData,span=.44,s=((t-40)*speed+phase)%1,x=dir*(s*span-span/2);
   const onPiece=Math.abs(x)<PIECE.w/2&&Math.abs(z)<PIECE.d/2;f.userData.y=lerp(f.userData.y??TABLE,onPiece?0:TABLE,.25);
   f.position.set(x,f.userData.y+.0012*Math.abs(Math.sin((t-40)*9+i)),z);f.rotation.y=dir>0?Math.PI/2:-Math.PI/2;f.rotation.z=.04*Math.sin((t-40)*9+i);
   const edge=Math.min(1,Math.min(s,1-s)*8);f.scale.setScalar(Math.max(.001,edge*seg(t,41,42.2)*(1-seg(t,55,56.5))))});
  const bs=seg(t,40.5,55.5),bx=lerp(-.26,.26,bs);boat.position.set(bx,TABLE+.004+.0012*Math.sin(time*2.1),-.155);boat.rotation.z=.03*Math.sin(time*1.7);boat.rotation.x=.02*Math.sin(time*1.3);
  boat.scale.setScalar(Math.max(.001,Math.min(1,Math.min(bs,1-bs)*9)));
  wake.forEach((w,i)=>{const k=((time*1.6+i/7)%1);w.position.set(bx-.065-k*.06,TABLE+.002,-.155+(i%2?.006:-.006)*k);w.material.opacity=pf*(1-k)*.5*boat.scale.x;w.scale.setScalar(.006+k*.012)});
  const lift=io(seg(t,47,48.4)),move=io(seg(t,48.4,50.6)),down=io(seg(t,50.6,51.8));
  ghost.position.set(move*Q01,t<50.6?lerp(.0002,.055,lift)+Math.sin(move*Math.PI)*.02:lerp(.055,TABLE,down),0);
  const gIn=win(t,46.2,55.2,.8,1.4);setFade(ghost,gIn);
  setFade(cable,win(t,46.6,52.6,.5,.6));cable.position.set(ghost.position.x,ghost.position.y+.0145,0);cable.scale.y=Math.max(.001,.22-ghost.position.y);
  setFade(reuseLabel,win(t,51.4,55.2,.5,.8));reuseLabel.position.set(Q01,TABLE+.03,0);
  slotLabels.forEach(l=>l.material.opacity=pf);quayLabel.material.opacity=pf;
  // Labels: world-sized, but never huge when the phone is close to them.
  if(camera){camera.getWorldPosition(camPos);for(const l of labels){if(!l.visible)continue;l.getWorldPosition(tmp);const k=clamp(camPos.distanceTo(tmp)/root.getWorldScale(tmp2).x/.32,.42,1.15);l.scale.set(l.userData.s0.x*k,l.userData.s0.y*k*(l===card?Math.max(.001,cardIn):1),1)}}
  // 5 · return
  const fl=seg(t,59.8,61.2);flash.visible=fl>0&&fl<1;flash.material.opacity=Math.sin(fl*Math.PI)*.95;flash.scale.setScalar(.01+fl*.09);flash.position.y=.004;
 }
 const labels=[];root.traverse(o=>{if(o.isSprite&&o.material.map&&o!==spark&&o!==flash&&!wake.includes(o)){o.userData.s0=o.scale.clone();labels.push(o)}});
 const camPos=new THREE.Vector3(),tmp=new THREE.Vector3(),tmp2=new THREE.Vector3();
 const pickables=[board,concrete,occluder,card,...nodes.map(n=>n.userData.disc)];
 return{root,
  get time(){return t},get paused(){return paused},
  setPaused:v=>{paused=v},
  seek:v=>{t=v;lastT=v},
  chapterAt:(v=t)=>{if(v<TIMELINE.chapters[0])return -1;let i=0;TIMELINE.chapters.forEach((c,k)=>{if(v>=c)i=k});return i},
  restart:()=>{t=0;lastT=0},
  takeCues:()=>cues.splice(0),
  update,
  setViewHeight:h=>{motes.material.uniforms.uViewH.value=h},
  pick(raycaster){const hit=raycaster.intersectObjects(pickables.filter(o=>{let v=true;o.traverseAncestors(a=>{if(!a.visible)v=false});return v&&o.visible}),false)[0];if(!hit)return null;const n=hit.object.name;return n.startsWith('phase:')?{kind:'phase',phase:n.slice(6)}:{kind:n==='pe'?'pe':n==='concrete'?'concrete':n==='passport'?'passport':'piece'}},
  dispose(){root.traverse(o=>{o.geometry?.dispose();for(const m of[o.material].flat().filter(Boolean)){m.map?.dispose();m.alphaMap?.dispose();m.dispose()}})},
 };
}
