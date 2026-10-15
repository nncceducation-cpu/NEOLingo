type Hooks={send:(event:any)=>void;status:(text:string)=>void;notice:(text:string)=>void;close:()=>void;play:()=>Promise<void>};
export class LiveTurns{
 queue:string[]=[];seen=new Set<string>();current:string|null=null;hasSpeech=false;ending=false;waiting=false;committing=false;closed=false;heard=false;playing=false;timer:ReturnType<typeof setTimeout>|undefined;grace:ReturnType<typeof setTimeout>|undefined;
 h:Hooks;constructor(h:Hooks){this.h=h;}
 event(e:any){
 if(this.closed)return;
 if(e.type==="input_audio_buffer.speech_started"){this.hasSpeech=true;this.heard=true;}
 if(e.type==="input_audio_buffer.committed"){
 this.hasSpeech=false;this.committing=false;
 if(e.item_id&&!this.seen.has(e.item_id)){this.heard=true;this.seen.add(e.item_id);this.queue.push(e.item_id);}
 this.pump();
 }
 if(e.type==="session.updated"&&this.ending&&this.waiting){
 clearTimeout(this.grace);this.grace=setTimeout(()=>this.flush(),200);
 }
 if(e.type==="error"&&e.error?.code==="input_audio_buffer_commit_empty"&&this.committing){
 this.committing=false;this.waiting=false;this.finish();
 }
 }
 pump(){if(this.closed||this.current||!this.queue.length){this.finish();return;}this.current=this.queue.shift()!;this.h.status("Translating…");this.h.send({type:"response.create",response:{conversation:"none",output_modalities:["text"],input:[{type:"item_reference",id:this.current}]}});}
 end(){if(this.closed||this.ending)return;this.ending=true;this.waiting=true;this.h.status("Finishing the last phrase…");this.h.send({type:"session.update",session:{type:"realtime",audio:{input:{turn_detection:null}}}});if(!this.playing)this.watchdog();} watchdog(){clearTimeout(this.timer);this.timer=setTimeout(()=>{if(!this.closed){this.h.notice("The final translation did not finish. Please reconnect and repeat the last phrase.");this.dispose();this.h.close();}},30000);}
 flush(){if(this.closed)return;this.waiting=false;if(this.hasSpeech){this.committing=true;this.h.send({type:"input_audio_buffer.commit",event_id:"finish_last_phrase"});}else this.finish();}
 async complete(success=true){
 if(this.closed||!this.current)return;
 const id=this.current;this.h.send({type:"conversation.item.delete",item_id:id});
 if(success){this.playing=true;clearTimeout(this.timer);try{await this.h.play();}finally{this.playing=false;if(this.ending&&!this.closed)this.watchdog();}}else this.h.notice("Translation unavailable. Please repeat the last phrase.");
 if(this.closed)return;this.current=null;this.pump();
 if(!this.ending&&!this.current)this.h.status("Listening — speak naturally");
 }
 finish(){if(this.ending&&!this.waiting&&!this.committing&&!this.current&&!this.queue.length&&!this.closed){if(!this.heard)this.h.notice("No clear speech was detected. Start again and repeat the full phrase.");this.dispose();this.h.close();}}
 dispose(){this.closed=true;clearTimeout(this.timer);clearTimeout(this.grace);this.queue=[];this.current=null;this.seen.clear();}
}
