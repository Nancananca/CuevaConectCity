// Turns noisy QR pose samples into one stable anchor in the SLAM world.
// States: 'search' (nothing seen) -> 'follow' (QR seen, world tracking not ready or not enough samples)
//         -> 'locked' (anchor fixed in the world; the QR may leave the view).
// While locked, new sightings refine the anchor slowly; a consistent jump means the piece was moved: re-anchor.
// v7 robustness:
//  - sightings taken while the phone turns fast are not used to lock (image and pose may be from different instants);
//  - the anchor follows SLAM drift: recent sightings weigh more than old ones;
//  - after a tracking loss the anchor is 'stale' and two agreeing sightings re-anchor it at once;
//  - 'marker' mode: on a featureless table the world tracking may never become NORMAL; after a steady run of
//    sightings the story may still start, attached to the QR, and becomes world-anchored as soon as tracking allows.
import {vec} from './pose.mjs?v=7.0';
const{sub,add,mul,dot,len,norm,cross}=vec,UP=[0,1,0];

export const ANCHOR_RULES={
 lockSamples:5,lockWindowMs:2600,lockSpreadM:.01,lockYawDeg:6,maxErr:.02,
 refineGateM:.03,refineGateDeg:12,moveSamples:4,moveWindowMs:1600,
 tiltLimitDeg:28,scaleBaselineM:.035,forceLockMs:3500,depthGate:.18,moveDecoded:3,
 lockMotionDeg:40,refineMotionDeg:90,driftMs:6000,markerMs:2500,markerSamples:8,staleSamples:2,
};
const deg=r=>r*180/Math.PI;
const angle=(a,b)=>Math.acos(Math.max(-1,Math.min(1,dot(norm(a),norm(b)))));

/** Gravity-aligned frame: the piece lies on a table, so Y is world up and only the yaw comes from the QR. */
export function levelFrame(s,tiltLimitDeg=ANCHOR_RULES.tiltLimitDeg,force=false){
 const tilt=deg(angle(s.yAxis,UP));
 if(tilt>tiltLimitDeg&&!force)return{x:norm(s.xAxis),y:norm(s.yAxis),level:false,tilt};
 // Upright objects (the bag) keep gravity as up and take only the heading from the label.
 const src=tilt>tiltLimitDeg&&Math.abs(dot(norm(s.xAxis),UP))>.7?s.zAxis:s.xAxis;if(src!==s.xAxis)s={...s,xAxis:src};
 const x=norm(sub(s.xAxis,mul(UP,dot(s.xAxis,UP))));
 return{x,y:UP,level:true,tilt};
}
// Closer sightings are more precise (corner noise grows with distance); plane-constrained ones more than free ones;
// sightings taken while the phone turns are less reliable.
const quality=e=>Math.min(1,(.14/Math.max(.08,e.distance||.14))**2)*(e.level===false?.5:1)*Math.max(.15,1-(e.motion||0)/120);
const median=a=>{const s=[...a].sort((p,q)=>p-q),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2};

export class QrAnchor{
 constructor(rules={},{forceLevel=false}={}){this.rules={...ANCHOR_RULES,...rules};this.forceLevel=forceLevel;this.reset()}
 reset(){this.stale=false;this.wasTracking=null;this.recentDistances=[];this.samples=[];this.locked=null;this.scale=1;this.scaleEstimate=null;this.since=[];this.outliers=[];this.normalSince=null;this.followSince=null;this.lockCount=this.lockCount||0;this.lastSeen=-Infinity;this.state='search'}
 position(s){return add(s.c,s.d)}
 /** Feed one sample (from sampleFromCorners) at time `now` (ms). `tracking` is XR8's 'NORMAL' | 'LIMITED'. */
 add(s,now,tracking){
  const R=this.rules;if(!s||s.err>R.maxErr)return this.state;
  if(this.locked&&tracking!=='NORMAL')this.stale=true; // a tracking loss may move the SLAM world under the anchor
  const frame=levelFrame(s,R.tiltLimitDeg,this.forceLevel),entry={...s,frame,now};this.lastSeen=now;
  const ds=this.recentDistances.filter(o=>now-o.now<2500);this.recentDistances=[...ds,{now,d:s.distance}].slice(-9);
  if(ds.length>=3){const m=median(ds.map(o=>o.d));if(Math.abs(s.distance-m)/m>R.depthGate)return this.state}
  if(this.locked){
   if(tracking!=='NORMAL')return this.state; // camera poses are unreliable: keep the anchor as it is
   if((s.motion||0)>R.refineMotionDeg)return this.state;
   const p=this.position(entry),dp=len(sub(p,this.locked.p)),dyaw=deg(angle(frame.x,this.locked.x));
   if(dp<=R.refineGateM&&dyaw<=R.refineGateDeg){
    this.outliers=[];this.stale=false;this.remember(entry);
    // The anchor is the quality-weighted mean of the consistent sightings since the lock, recent ones
    // weighing more so that it follows any slow drift of the SLAM world.
    const ws=this.since.map(e=>quality(e)*Math.exp(-(now-e.now)/R.driftMs)),W=ws.reduce((a,b)=>a+b,0)||1;
    this.locked.p=mul(this.since.reduce((a,e,i)=>add(a,mul(this.position(e),ws[i])),[0,0,0]),1/W);
    if(this.locked.y===UP)this.locked.x=norm(this.since.reduce((a,e,i)=>add(a,mul(e.frame.x,ws[i])),[0,0,0]));
   }else{
    this.outliers=this.outliers.filter(o=>now-o.now<R.moveWindowMs);this.outliers.push(entry);
    const need=this.stale?R.staleSamples:R.moveSamples,decoded=this.outliers.filter(o=>o.decoded!==false).length;
    if(this.outliers.length>=need&&decoded>=Math.min(need,R.moveDecoded)&&this.consistent(this.outliers.slice(-need))){this.lock(this.outliers.slice(-need),now,this.stale?'relocalized':'moved');this.outliers=[];this.stale=false}
   }
   return this.state;
  }
  this.samples=this.samples.filter(o=>now-o.now<R.lockWindowMs);this.samples.push(entry);
  if(this.state!=='follow')this.followSince=now;this.state='follow';
  if(tracking!=='NORMAL'){this.normalSince=null;this.since=[];return this.state} // world may still rescale: no history yet
  this.since=this.since.filter(o=>now-o.now<6000);this.remember(entry);
  this.normalSince??=now;const steady=this.samples.filter(e=>(e.motion||0)<=R.lockMotionDeg),last=steady.slice(-R.lockSamples);
  if(last.length>=R.lockSamples&&this.consistent(last))this.lock(last,now,'auto');
  // Never leave the visitor waiting: after a while with good tracking, lock on the best recent sightings,
  // provided they roughly agree (twice the normal spread).
  else if(now-this.normalSince>R.forceLockMs&&last.length>=3&&this.consistent(last,2))this.lock(last,now,'forced');
  return this.state;
 }
 consistent(list,k=1){
  const R=this.rules,ps=list.map(e=>this.position(e)),m=[0,1,2].map(i=>median(ps.map(p=>p[i])));
  if(ps.some(p=>len(sub(p,m))>R.lockSpreadM*k))return false;
  const x=norm(list.reduce((a,e)=>add(a,e.frame.x),[0,0,0]));
  return list.every(e=>deg(angle(e.frame.x,x))<=R.lockYawDeg*k);
 }
 lock(list,now,reason){
  const ws=list.map(quality),W=ws.reduce((a,b)=>a+b,0),p=mul(list.reduce((a,e,i)=>add(a,mul(this.position(e),ws[i])),[0,0,0]),1/W);
  const x=norm(list.reduce((a,e)=>add(a,e.frame.x),[0,0,0])),y=list.every(e=>e.frame.level)?UP:norm(list.reduce((a,e)=>add(a,e.frame.y),[0,0,0]));
  this.locked={p,x,y,at:now,reason};this.samples=[];this.state='locked';this.lockCount++;
  this.since=reason==='moved'?[...list]:this.since.filter(e=>len(sub(this.position(e),p))<=this.rules.refineGateM&&deg(angle(e.frame.x,x))<=this.rules.refineGateDeg);
 }
 remember(entry){this.since.push(entry);if(this.since.length>30)this.since.shift();this.estimateScale()}
 /** Marker mode: a steady run of agreeing sightings while world tracking is still not NORMAL. */
 markerReady(now){
  const R=this.rules;if(this.state!=='follow'||!this.followSince||now-this.followSince<R.markerMs)return false;
  const recent=this.samples.filter(e=>now-e.now<R.lockWindowMs);
  return recent.length>=Math.min(R.markerSamples,5)&&this.consistent(recent.slice(-5),1.6);
 }
 /** 0..1 progress towards a lock, for the UI. */
 progress(now){if(this.locked)return 1;const R=this.rules,n=this.samples.filter(e=>now-e.now<R.lockWindowMs&&(e.motion||0)<=R.lockMotionDeg).length;return Math.min(.95,n/R.lockSamples*.9)}
 /** Least-squares SLAM/metric scale: positions c + k·d of the same point must agree from different viewpoints. */
 estimateScale(){ // diagnostic
  const R=this.rules,S=this.since;if(S.length<6)return;
  const cm=mul(S.reduce((a,e)=>add(a,e.c),[0,0,0]),1/S.length),dm=mul(S.reduce((a,e)=>add(a,e.d),[0,0,0]),1/S.length);
  let num=0,den=0;for(const e of S){const dc=sub(e.c,cm),dd=sub(e.d,dm);num+=dot(dc,dd);den+=dot(dd,dd)}
  if(Math.sqrt(den/S.length)<R.scaleBaselineM)return;
  this.scaleEstimate=-num/den; // diagnostic only (biased low with noisy sightings): never applied to the scene
 }
 /** Pose to render now, or null. In 'follow' it is the latest smoothed sighting. */
 pose(now){
  if(this.locked){const{p,x,y}=this.locked;return{p,x,y,z:norm(cross(x,y)),scale:this.scale,locked:true}}
  const last=this.samples.at(-1);if(!last||now-last.now>900)return null;
  const recent=this.samples.slice(-5),ps=recent.map(e=>this.position(e)),p=[0,1,2].map(i=>median(ps.map(q=>q[i])));
  const x=norm(recent.reduce((a,e)=>add(a,e.frame.x),[0,0,0])),y=last.frame.y;
  return{p,x,y,z:norm(cross(x,y)),scale:this.scale,locked:false};
 }
}
