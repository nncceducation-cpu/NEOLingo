
import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {pitchHz,VoiceProfile} from '../lib/voice-profile.ts';
const results=[];function test(name,fn){try{fn();results.push({name,pass:true});}catch(e){results.push({name,pass:false,error:e.message});}}
const sine=(hz,amp=.2)=>Float32Array.from({length:2048},(_,i)=>amp*Math.sin(2*Math.PI*hz*i/48000));
for(const hz of [90,120,150,200,240,300])test('Pitch estimate '+hz+' Hz',()=>assert(Math.abs(pitchHz(sine(hz),48000)-hz)<4));
test('Low-range source selects masculine output',()=>{const v=new VoiceProfile();v.add(sine(120),48000);assert.equal(v.voice(),'onyx');});
test('Higher-range source selects feminine output',()=>{const v=new VoiceProfile();v.add(sine(240),48000);assert.equal(v.voice(),'nova');});
test('Feminine override wins over low source pitch',()=>{const v=new VoiceProfile();v.add(sine(120),48000);assert.equal(v.voice('feminine'),'nova');});
test('Masculine override wins over high source pitch',()=>{const v=new VoiceProfile();v.add(sine(240),48000);assert.equal(v.voice('masculine'),'onyx');});
test('Silence does not create a speaker estimate',()=>assert.equal(pitchHz(new Float32Array(2048),48000),null));
test('Very quiet audio does not create a speaker estimate',()=>assert.equal(pitchHz(sine(120,.001),48000),null));
test('New turn clears previous speaker pitch',()=>{const v=new VoiceProfile();v.add(sine(120),48000);v.reset();v.add(sine(240),48000);assert.equal(v.voice(),'nova');});
test('Median tolerates one outlier',()=>{const v=new VoiceProfile();for(const hz of [120,125,300,120,125])v.add(sine(hz),48000);assert.equal(v.voice(),'onyx');});
test('Only bounded scalar pitch estimates are retained',()=>{const v=new VoiceProfile();for(let i=0;i<100;i++)v.add(sine(120),48000);assert.equal(v.pitches.length,80);assert(v.pitches.every(x=>typeof x==='number'));});
await fs.writeFile('tests/.generated/voice-match-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify({passed:results.filter(x=>x.pass).length,total:results.length,failures:results.filter(x=>!x.pass)}));
