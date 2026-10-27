// Pose of the printed QR from its four corners. Pure math: no DOM, no three.js, testable in Node.
// Conventions
//  - Pixel array: XR8.CameraPixelArray output, full camera frame, origin top-left.
//  - Canvas: XR8 draws that frame to *fill* the canvas (GlTextureRenderer.fillTextureViewport).
//  - P: XR8 `reality.intrinsics`, column-major 4x4 projection matrix (three.js convention, camera looks down -Z).
//  - Object frame of the QR: X to the right of the symbol, Y towards its bottom edge, Z into the table.
//  - Content frame returned to the scene: X = QR right (150 mm edge), Y = up (out of the piece), Z = QR bottom (towards the reader).

export const LABEL={mm:25,modules:33,quiet:4};
/** Side of the black symbol (without the white margin) in metres, for a printed label width in mm. */
export const symbolSize=(labelMm=LABEL.mm)=>labelMm/1000*LABEL.modules/(LABEL.modules+2*LABEL.quiet);

/** Same maths as XR8's fillTextureViewport: scale the video to cover the canvas, centred. */
export function fillViewport(videoW,videoH,canvasW,canvasH){
 const aspect=canvasW/canvasH;let w,h;
 if(videoW/videoH<aspect){w=videoW;h=w/aspect}else{h=videoH;w=h*aspect}
 const t=canvasH/h;return{offsetX:.5*(canvasW-videoW*t),offsetY:.5*(canvasH-videoH*t),width:videoW*t,height:videoH*t};
}
export function pixelToCanvas(p,{cols,rows,canvasW,canvasH}){
 const v=fillViewport(cols,rows,canvasW,canvasH);
 return{x:v.offsetX+p.x/cols*v.width,y:v.offsetY+p.y/rows*v.height};
}
/** Canvas pixel -> normalised camera coordinates (x right, y down, at depth 1 in front of the camera). */
export function canvasToNormalized(c,P,canvasW,canvasH){
 const nx=2*c.x/canvasW-1,ny=1-2*c.y/canvasH;
 return{x:(nx+P[8])/P[0],y:-(ny+P[9])/P[5]};
}

function solve(A,b){ // Gaussian elimination with partial pivoting, A is n×n (array of rows)
 const n=b.length;A=A.map((r,i)=>[...r,b[i]]);
 for(let c=0;c<n;c++){
  let p=c;for(let r=c+1;r<n;r++)if(Math.abs(A[r][c])>Math.abs(A[p][c]))p=r;
  if(Math.abs(A[p][c])<1e-12)return null;[A[c],A[p]]=[A[p],A[c]];
  for(let r=0;r<n;r++){if(r===c)continue;const f=A[r][c]/A[c][c];if(f)for(let k=c;k<=n;k++)A[r][k]-=f*A[c][k]}
 }
 return A.map((r,i)=>r[n]/r[i]);
}
/** Homography (h33 = 1) mapping object points {x,y} to image points {x,y}; least squares when more than 4. */
export function homography(obj,img){
 const N=Array.from({length:8},()=>Array(8).fill(0)),v=Array(8).fill(0);
 const add=(row,rhs)=>{for(let i=0;i<8;i++){v[i]+=row[i]*rhs;for(let j=0;j<8;j++)N[i][j]+=row[i]*row[j]}};
 obj.forEach((o,i)=>{const{x:X,y:Y}=o,{x:u,y:w}=img[i];add([X,Y,1,0,0,0,-u*X,-u*Y],u);add([0,0,0,X,Y,1,-w*X,-w*Y],w)});
 const h=solve(N,v);return h&&[...h,1];
}
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],mul=(a,s)=>[a[0]*s,a[1]*s,a[2]*s];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],len=a=>Math.hypot(a[0],a[1],a[2]),norm=a=>mul(a,1/len(a));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const vec={sub,add,mul,dot,len,norm,cross};

/**
 * Planar pose from the 4 outer corners of the symbol, given in normalised camera coordinates
 * (order: topLeft, topRight, bottomRight, bottomLeft). Returns rotation columns and translation
 * in the OpenCV camera frame (x right, y down, z forward), metres.
 */
export function planarPose(norm4,size){
 const s=.5;const obj=[{x:-s,y:-s},{x:s,y:-s},{x:s,y:s},{x:-s,y:s}];
 const H=homography(obj,norm4);if(!H)return null;
 let h1=[H[0],H[3],H[6]],h2=[H[1],H[4],H[7]],h3=[H[2],H[5],H[8]];
 let l=2/(len(h1)+len(h2));if(h3[2]<0)l=-l;
 const a=norm(mul(h1,l)),b=norm(mul(h2,l));
 // Symmetric orthonormalisation of the two in-plane axes.
 const c=norm(add(a,b)),p=norm(cross(a,b)),d=norm(cross(p,c));
 const r1=mul(sub(c,d),Math.SQRT1_2),r2=mul(add(c,d),Math.SQRT1_2),r3=cross(r1,r2);
 const t=mul(h3,l*size);
 // Reprojection error of the corners, in normalised units, to reject bad fits.
 let err=0;obj.forEach((o,i)=>{const X=add(add(mul(r1,o.x*size),mul(r2,o.y*size)),t);err=Math.max(err,Math.hypot(X[0]/X[2]-norm4[i].x,X[1]/X[2]-norm4[i].y))});
 return t[2]>0?{r1,r2,r3,t,err}:null;
}

/** Rotate vector v by quaternion q {x,y,z,w}. */
export function rotate(q,v){
 const{x,y,z,w}=q,ix=w*v[0]+y*v[2]-z*v[1],iy=w*v[1]+z*v[0]-x*v[2],iz=w*v[2]+x*v[1]-y*v[0],iw=-x*v[0]-y*v[1]-z*v[2];
 return[ix*w+iw*-x+iy*-z-iz*-y,iy*w+iw*-y+iz*-x-ix*-z,iz*w+iw*-z+ix*-y-iy*-x];
}

/** Intersection of the two diagonals of the image quad: the exact image of the square's centre. */
export function quadCentre(n){
 const[a,b,c,d]=n,d1=[c.x-a.x,c.y-a.y],d2=[d.x-b.x,d.y-b.y],den=d1[0]*d2[1]-d1[1]*d2[0];
 if(Math.abs(den)<1e-12)return{x:(a.x+c.x)/2,y:(a.y+c.y)/2};
 const s=((b.x-a.x)*d2[1]-(b.y-a.y)*d2[0])/den;return{x:a.x+s*d1[0],y:a.y+s*d1[1]};
}
/**
 * Pose of a QR lying on a level surface, using gravity from the SLAM world.
 * The centre ray is exact (diagonals); the corner rays are cut by the horizontal plane through the centre,
 * so every corner scales linearly with the depth: depth = real size / size at unit depth. Closed form,
 * and far less sensitive to corner noise than a free homography (tilt and depth no longer trade off).
 * Returns null when the cut is not a square (QR not horizontal, or bad corners).
 */
export function levelPose(norm4,size,camRot,up=[0,1,0]){
 const ray=n=>rotate(camRot,[n.x,-n.y,-1]); // normalised OpenCV coords -> world ray (three camera looks down -Z)
 const c=ray(quadCentre(norm4)),cu=dot(c,up);if(Math.abs(cu)<.08)return null; // looking almost parallel to the table
 const P=norm4.map(n=>{const r=ray(n),ru=dot(r,up);return ru*cu>0?mul(r,cu/ru):null}); // corners at unit centre depth
 if(P.some(p=>!p))return null;
 const d1=len(sub(P[2],P[0])),d2=len(sub(P[3],P[1])),sides=[0,1,2,3].map(i=>len(sub(P[(i+1)%4],P[i])));
 const unit=(d1+d2)/2/Math.SQRT2,mean=sides.reduce((a,b)=>a+b)/4;
 const squareness=Math.max(Math.abs(d1-d2)/((d1+d2)/2),...sides.map(s=>Math.abs(s-mean)/mean));
 const k=size/unit,pts=P.map(p=>mul(p,k));
 let x=sub(add(pts[1],pts[2]),add(pts[0],pts[3]));x=norm(sub(x,mul(up,dot(x,up))));
 let z=sub(add(pts[3],pts[2]),add(pts[0],pts[1]));z=norm(sub(z,mul(up,dot(z,up))));
 if(dot(cross(x,up),z)<0)return null; // mirrored: the QR is seen from below
 return{d:mul(c,k),xAxis:x,yAxis:up,zAxis:norm(cross(x,up)),squareness,distance:len(c)*k};
}

/**
 * Full chain for one detection: pixel-array corners -> world pose sample.
 * frame: {cols,rows,canvasW,canvasH,P,camPos:{x,y,z},camRot:{x,y,z,w}}
 * Returns {c (camera position), d (camera→QR offset in world, metres), xAxis, yAxis (content frame, world), err, distance}
 */
export function sampleFromCorners(corners,frame,labelMm=LABEL.mm,{level=true,maxSquareness=.12,maxTiltDeg=30}={}){
 const n=corners.map(p=>canvasToNormalized(pixelToCanvas(p,frame),frame.P,frame.canvasW,frame.canvasH));
 const pose=planarPose(n,symbolSize(labelMm));
 // The free pose is noisy but unbiased: if it says the QR is clearly not horizontal, do not force it flat.
 const freeTilt=pose?Math.acos(Math.min(1,Math.abs(rotate(frame.camRot,[pose.r3[0],-pose.r3[1],-pose.r3[2]])[1])))*180/Math.PI:0;
 if(level&&freeTilt<=maxTiltDeg){const lp=levelPose(n,symbolSize(labelMm),frame.camRot);
  if(lp&&lp.squareness<=maxSquareness)return{c:[frame.camPos.x,frame.camPos.y,frame.camPos.z],d:lp.d,xAxis:lp.xAxis,yAxis:lp.yAxis,zAxis:lp.zAxis,err:pose?.err??0,distance:lp.distance,squareness:lp.squareness,level:true}}
 if(!pose)return null;
 // OpenCV camera frame -> three.js camera frame: flip y and z.
 const F=v=>[v[0],-v[1],-v[2]];
 const q=frame.camRot,X=rotate(q,F(pose.r1)),down=rotate(q,F(pose.r2)),into=rotate(q,F(pose.r3));
 return{c:[frame.camPos.x,frame.camPos.y,frame.camPos.z],d:rotate(q,F(pose.t)),xAxis:X,yAxis:mul(into,-1),zAxis:down,err:pose.err,distance:len(pose.t),level:false};
}
