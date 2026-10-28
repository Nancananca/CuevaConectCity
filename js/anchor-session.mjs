// Stores a pose in the SLAM/world coordinate system, never a screen position.
const finite=v=>typeof v==='number'&&Number.isFinite(v);
export function readWorldPose(detail){
 if(!detail||!['x','y','z'].every(k=>finite(detail.position?.[k]))||!['x','y','z','w'].every(k=>finite(detail.rotation?.[k])))return null;
 const p=detail.position,q=detail.rotation,n=Math.hypot(q.x,q.y,q.z,q.w);
 if(n<.5||n>1.5)return null;
 return{position:{x:p.x,y:p.y,z:p.z},rotation:{x:q.x/n,y:q.y/n,z:q.z/n,w:q.w/n}};
}
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const angularDistance=(a,b)=>2*Math.acos(Math.min(1,Math.abs(a.x*b.x+a.y*b.y+a.z*b.z+a.w*b.w)));
export class AnchorSession{
 constructor({expectedWidth=null}={}){this.expectedWidth=expectedWidth;this.reset();this.tracking='LIMITED'}
 reset(){this.pose=null;this.locked=null;this.reference=null;this.referenceWidth=null;this.firstAt=null;this.lastAt=-Infinity;this.samples=0;this.lockCount=0}
 setTracking(status){this.tracking=status;if(status!=='NORMAL'){this.reference=null;this.firstAt=null;this.samples=0}}
 observe(detail,now){
  if(this.locked)return false;
  const pose=readWorldPose(detail);if(!pose||!finite(now)){this.imageLost();return false}
  const width=detail.scale*detail.scaledWidth;
  if(this.expectedWidth&&(!finite(width)||width<this.expectedWidth*.75||width>this.expectedWidth*1.25)){this.imageLost();return false}
  const gap=now-this.lastAt;this.pose=pose;this.lastAt=now;
  if(this.tracking!=='NORMAL'){this.reference=null;this.firstAt=null;this.samples=0;return true}
  if(!this.reference||gap>350||distance(pose.position,this.reference.position)>.007||angularDistance(pose.rotation,this.reference.rotation)>Math.PI/30||(this.expectedWidth&&Math.abs(width-this.referenceWidth)>this.expectedWidth*.08)){this.reference=pose;this.referenceWidth=width;this.firstAt=now;this.samples=1}
  else this.samples++;
  return true;
 }
 ready(now){return this.tracking==='NORMAL'&&!this.locked&&!!this.pose&&now-this.lastAt<300&&this.samples>=8&&this.firstAt!==null&&now-this.firstAt>=800}
 anchor(now){if(!this.ready(now))return false;this.locked=structuredClone(this.pose);this.lockCount++;return true}
 imageLost(){if(!this.locked){this.pose=null;this.reference=null;this.firstAt=null;this.samples=0;this.lastAt=-Infinity}}
 visible(now){return this.tracking==='NORMAL'&&!!(this.locked||(this.pose&&now-this.lastAt<300))}
 current(){return this.locked||this.pose}
}
