// Small synthesised sound design (no audio files). Must be unlocked from a user gesture.
export function createSound(){
 let ctx=null,master=null,noiseBuf=null,on=true,bed=null;
 function unlock(){
  if(ctx){ctx.resume?.();return}
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  ctx=new AC();master=ctx.createGain();master.gain.value=on?.55:0;
  const comp=ctx.createDynamicsCompressor();master.connect(comp);comp.connect(ctx.destination);
  noiseBuf=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  // Quiet harbour bed: filtered noise + two soft detuned tones.
  const n=ctx.createBufferSource();n.buffer=noiseBuf;n.loop=true;const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=380;const ng=ctx.createGain();ng.gain.value=.05;n.connect(lp);lp.connect(ng);ng.connect(master);n.start();
  const pad=ctx.createGain();pad.gain.value=.018;pad.connect(master);for(const f of[110,164.8]){const o=ctx.createOscillator();o.type='sine';o.frequency.value=f;o.detune.value=Math.random()*8-4;o.connect(pad);o.start()}
  bed={lp,ng};
 }
 const now=()=>ctx.currentTime;
 function tone(freq,dur=.6,{type='sine',gain=.18,attack=.01,glide=0,delay=0}={}){
  if(!ctx)return;const t=now()+delay,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(glide)o.frequency.exponentialRampToValueAtTime(freq*glide,t+dur);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+attack);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+.05);
 }
 function whoosh(dur=1.2,{from=300,to=2400,gain=.22,q=1.2,delay=0}={}){
  if(!ctx)return;const t=now()+delay,s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=noiseBuf;f.type='bandpass';f.Q.value=q;
  f.frequency.setValueAtTime(from,t);f.frequency.exponentialRampToValueAtTime(to,t+dur);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+dur*.4);g.gain.linearRampToValueAtTime(0,t+dur);
  s.connect(f);f.connect(g);g.connect(master);s.start(t);s.stop(t+dur+.05);
 }
 function sparkle(count=14,dur=1.6){for(let i=0;i<count;i++)tone(1800+Math.random()*2600,.18,{gain:.035,delay:Math.random()*dur,type:'triangle'})}
 const play={
  lock:()=>{tone(660,.5,{gain:.12});tone(990,.7,{gain:.1,delay:.09});tone(1320,.9,{gain:.07,delay:.18})},
  ring:()=>tone(220,1.4,{gain:.14,glide:2,type:'triangle'}),
  trace:()=>whoosh(1.6,{from:800,to:5000,gain:.07,q:4}),
  tarp:()=>whoosh(2.6,{from:200,to:700,gain:.16,q:.7}),
  tear:()=>{whoosh(1.4,{from:1500,to:300,gain:.2,q:.8});sparkle(18,1.2)},
  swirl:()=>whoosh(3,{from:300,to:1600,gain:.12,q:2}),
  land:()=>{sparkle(26,2);tone(196,1.4,{gain:.1,type:'triangle'})},
  pour:()=>whoosh(2.2,{from:180,to:420,gain:.18,q:.6}),
  explode:()=>tone(330,1,{gain:.1,glide:1.5,type:'triangle'}),
  join:()=>{tone(130,.5,{gain:.28,type:'sine',glide:.6});whoosh(.4,{from:2000,to:200,gain:.12})},
  column:()=>{tone(440,2.2,{gain:.07,attack:.6});tone(659,2.2,{gain:.05,attack:.8})},
  node:()=>tone(1046+Math.random()*200,.35,{gain:.06,type:'triangle'}),
  water:()=>{whoosh(3,{from:150,to:500,gain:.14,q:.5});if(bed){bed.lp.frequency.setTargetAtTime(900,now(),1.5);bed.ng.gain.setTargetAtTime(.09,now(),1.5)}},
  engine:()=>{whoosh(3.2,{from:90,to:160,gain:.22,q:.9});tone(55,3,{gain:.1,type:'sawtooth',attack:.6})},
  lift:()=>tone(150,1.6,{gain:.12,glide:1.6,type:'sawtooth',attack:.3}),
  set:()=>tone(98,.6,{gain:.25,glide:.7}),
  dissolve:()=>{sparkle(22,1.8);if(bed){bed.lp.frequency.setTargetAtTime(380,now(),2);bed.ng.gain.setTargetAtTime(.05,now(),2)}},
  rise:()=>whoosh(3,{from:400,to:3000,gain:.1,q:3}),
  converge:()=>whoosh(2,{from:3000,to:400,gain:.12,q:3}),
  flash:()=>{tone(523,1.6,{gain:.12});tone(784,1.8,{gain:.1,delay:.05});tone(1046,2.2,{gain:.08,delay:.1})},
 };
 return{unlock,play:name=>{if(on&&ctx&&play[name])try{play[name]()}catch{}},
  get on(){return on},
  set(v){on=v;if(master)master.gain.setTargetAtTime(v?.55:0,ctx.currentTime,.1);if(v)unlock()},
  suspend:()=>ctx?.suspend?.(),resume:()=>ctx?.resume?.()};
}
