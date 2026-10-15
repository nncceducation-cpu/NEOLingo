export const runtime="nodejs";
import {liveConfig} from "../../../lib/neolingo";
const attempts=new Map<string,{count:number,reset:number}>();
export async function POST(req:Request){
const error=(message:string,status:number)=>Response.json({error:message},{status,headers:{"Cache-Control":"no-store"}});
if(req.headers.get("origin")&&req.headers.get("origin")!==new URL(req.url).origin)return error("Request not allowed.",403);
const now=Date.now(),ip=req.headers.get("cf-connecting-ip")||"local";for(const [k,v]of attempts)if(v.reset<now)attempts.delete(k);let b=attempts.get(ip);if(!b){b={count:0,reset:now+60000};attempts.set(ip,b);}if(++b.count>4)return error("Please wait a minute before reconnecting live voice.",429);
try{const data=await req.json() as any;if(typeof data.sdp!=="string"||data.sdp.length>60000||!data.sdp.startsWith("v=0")||typeof data.target!=="string"||!data.target.trim()||data.target.length>70)return error("Choose a language and try connecting again.",400);
const key=process.env.OPENAI_API_KEY;if(!key)return error("Live voice is not configured yet.",503);
const form=new FormData();form.set("sdp",data.sdp);form.set("session",JSON.stringify(liveConfig(data.target,!!data.bidirectional,!!data.back,!!data.gloss,typeof data.source==="string"?data.source.slice(0,70):"Auto-detect",["General","Medical","Legal","Corporate"].includes(data.context)?data.context:"General",typeof data.terms==="string"?data.terms.slice(0,400):"",data.microphone)));
const r=await fetch("https://api.openai.com/v1/realtime/calls",{method:"POST",headers:{Authorization:"Bearer "+key},body:form,signal:AbortSignal.timeout(30000)});
if(!r.ok)return error("Live voice is unavailable. You can still use recorded voice or text translation.",502);
return new Response(r.body,{headers:{"Content-Type":"application/sdp","Cache-Control":"no-store"}});
}catch{return error("Live voice could not connect. You can still use recorded voice or text translation.",502);}
}
