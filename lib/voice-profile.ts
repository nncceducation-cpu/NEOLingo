export function pitchHz(frame:Float32Array,sampleRate:number):number|null{
let mean=0;for(const x of frame)mean+=x;mean/=frame.length;let energy=0;for(const x of frame)energy+=(x-mean)**2;if(Math.sqrt(energy/frame.length)<.006)return null;
const lo=Math.floor(sampleRate/380),hi=Math.min(Math.floor(sampleRate/70),Math.floor(frame.length/2));let best=0;const peaks:{lag:number;score:number}[]=[];
for(let lag=lo;lag<=hi;lag++){let a=0,b=0,c=0;for(let i=0;i<frame.length-lag;i++){const x=frame[i]-mean,y=frame[i+lag]-mean;a+=x*y;b+=x*x;c+=y*y;}const score=a/Math.sqrt(b*c||1);peaks.push({lag,score});best=Math.max(best,score);}
if(best<.8)return null;const candidates=peaks.filter((p,i)=>i>0&&i<peaks.length-1&&p.score>=best-.03&&p.score>=peaks[i-1].score&&p.score>=peaks[i+1].score);
return candidates.length?sampleRate/candidates[0].lag:null;
}
export class VoiceProfile{
 pitches:number[]=[];
 add(frame:Float32Array,rate:number){const f=pitchHz(frame,rate);if(f&&f>=70&&f<=380){this.pitches.push(f);if(this.pitches.length>80)this.pitches.shift();}}
 reset(){this.pitches=[];}
 voice(style="match"){if(style==="masculine")return "onyx";if(style==="feminine")return "nova";if(!this.pitches.length)return "coral";const a=[...this.pitches].sort((x,y)=>x-y);return a[Math.floor(a.length/2)]<175?"onyx":"nova";}
}
export function monitorVoice(stream:MediaStream,profile:VoiceProfile){if(typeof AudioContext==="undefined")return ()=>{};const ctx=new AudioContext(),analyser=ctx.createAnalyser();analyser.fftSize=2048;ctx.createMediaStreamSource(stream).connect(analyser);const frame=new Float32Array(analyser.fftSize);const timer=setInterval(()=>{if(stream.getAudioTracks().some(t=>t.enabled)){analyser.getFloatTimeDomainData(frame);profile.add(frame,ctx.sampleRate);}},120);return()=>{clearInterval(timer);void ctx.close();};}
