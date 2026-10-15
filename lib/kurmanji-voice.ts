import {enhanceClarity} from "./kurmanji-clarity";
export {isKurmanji} from "./kurdish";
const revision="054099b3aa363625feb30c456a8f98ab27b72dc7";
const modelBase=`https://huggingface.co/atenax/kurmanci-tts-piper/resolve/${revision}/`;
let voiceData:Promise<any[]>|undefined;
let phonemizer:Rpc|undefined,inference:Rpc|undefined,epoch=0,taskActive=false;
class Rpc{
worker:Worker;pending?:{reject:(e:Error)=>void;timer:ReturnType<typeof setTimeout>};
constructor(file:string,settings:object){this.worker=new Worker("/kurmanji-runtime/"+file,{type:"module"});this.worker.postMessage({type:"constructor",data:settings});}
call(type:string,data:any[]){return new Promise<any>((resolve,reject)=>{const done=()=>{if(this.pending)clearTimeout(this.pending.timer);this.pending=undefined;this.worker.onmessage=null;};this.pending={reject,timer:setTimeout(()=>{done();reject(Error("speech unavailable"));},120000)};this.worker.onmessage=e=>{done();resolve(e.data);};this.worker.onerror=e=>{e.preventDefault();done();reject(Error("speech unavailable"));};this.worker.onmessageerror=()=>{done();reject(Error("speech unavailable"));};this.worker.postMessage({type,data});});}
stop(){if(this.pending){clearTimeout(this.pending.timer);this.pending.reject(Error("cancelled"));this.pending=undefined;}this.worker.terminate();}
}
export function cancelKurmanjiVoice(){epoch++;taskActive=false;phonemizer?.stop();inference?.stop();phonemizer=undefined;inference=undefined;}
async function loadVoice(notice:(text:string)=>void){
if(!voiceData)voiceData=(async()=>{
notice("Preparing your Kurmanji voice… First use downloads the voice model (about 74 MB).");
const [config,model]=await Promise.all([fetch(modelBase+"model.onnx.json"),fetch(modelBase+"model.onnx")]);
if(!config.ok||!model.ok)throw Error("model unavailable");
return [await config.json(),URL.createObjectURL(await model.blob())];
})().catch(e=>{voiceData=undefined;throw e;});
return voiceData;
}
export async function synthesizeKurmanji(text:string,notice:(text:string)=>void){
if(taskActive)cancelKurmanjiVoice();
const gen=epoch;taskActive=true;
try{
const data=await loadVoice(notice);
if(gen!==epoch)throw Error("cancelled");
const basePath=new URL("/kurmanji-runtime/",window.location.origin).href;
if(!phonemizer)phonemizer=new Rpc("phonemize-worker.js",{basePath});
if(!inference)inference=new Rpc("onnx-worker.js",{basePath,numThreads:1});
const phon=phonemizer,onnx=inference;
notice("Creating speech with your selected Kurmanji voice…");
await phon.call("loadModule",[]);
if(gen!==epoch)throw Error("cancelled");
const phonemes=await phon.call("phonemize",[text,data]);
if(gen!==epoch)throw Error("cancelled");
const output=await onnx.call("generate",[phonemes,data,54]);
if(gen!==epoch)throw Error("cancelled");
let blob:Blob=output.file;
try{blob=await enhanceClarity(blob);}catch{/* The raw selected voice is still usable. */}
if(gen!==epoch)throw Error("cancelled");
notice("Kurmanji voice ready · Piper 54.");
return blob;
}catch(e){if(gen===epoch)cancelKurmanjiVoice();throw e;}finally{if(gen===epoch)taskActive=false;}
}
