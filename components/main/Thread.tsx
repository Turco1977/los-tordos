"use client";
import { useState, useRef } from "react";
import { T, ROLES, fn } from "@/lib/constants";
import { Btn } from "@/components/ui";

export function Thread({log,userId,onSend,users}:{log:any[];userId:string;onSend:any;users?:any[]}){
  const [msg,sMsg]=useState("");const [showAtt,sShowAtt]=useState(false);const [attType,sAttType]=useState("");const [attVal,sAttVal]=useState("");
  const [mentionOpen,sMentionOpen]=useState(false);const [mentionQ,sMentionQ]=useState("");const mentionRef=useRef<HTMLInputElement>(null);
  const attTypes=[{k:"link",l:"\u{1F517} Link",ph:"https://..."},{k:"video",l:"\u{1F3AC} Video",ph:"URL del video..."},{k:"foto",l:"\u{1F4F7} Foto",ph:"URL de la imagen..."},{k:"ubi",l:"\u{1F4CD} Ubicaci\u00F3n",ph:"Direcci\u00F3n o link de Maps..."},{k:"doc",l:"\u{1F4C4} Documento",ph:"URL del documento..."}];
  const sendAtt=()=>{if(attVal.trim()){const at=attTypes.find(a=>a.k===attType);onSend((at?at.l+": ":"\u{1F4CE} ")+attVal.trim());sAttVal("");sAttType("");sShowAtt(false);}};
  const handleMsgChange=(val:string)=>{sMsg(val);const atIdx=val.lastIndexOf("@");if(atIdx>=0&&(atIdx===0||val[atIdx-1]===" ")){const q=val.slice(atIdx+1);if(!q.includes(" ")){sMentionOpen(true);sMentionQ(q.toLowerCase());return;}}sMentionOpen(false);};
  const insertMention=(u:any)=>{const atIdx=msg.lastIndexOf("@");const before=msg.slice(0,atIdx);sMsg(before+"@"+fn(u)+" ");sMentionOpen(false);mentionRef.current?.focus();};
  const filtUsers=(users||[]).filter((u:any)=>(fn(u)).toLowerCase().includes(mentionQ)).slice(0,5);
  const renderMsg=(act:string)=>{const m=act.match(/(https?:\/\/\S+)/);if(m){const parts=act.split(m[1]);return <>{parts[0]}<a href={m[1]} target="_blank" rel="noopener noreferrer" style={{color:T.bl,textDecoration:"underline",wordBreak:"break-all" as const}}>{m[1]}</a>{parts[1]}</>;}/* highlight @mentions */const mentionRx=/@[\w\s]+/g;const parts2=act.split(mentionRx);const mentions=act.match(mentionRx);if(mentions){return <>{parts2.map((pt,i)=><span key={i}>{pt}{mentions[i]?<span style={{color:T.bl,fontWeight:700}}>{mentions[i]}</span>:null}</span>)}</>;}return act;};
  return(<div style={{display:"flex",flexDirection:"column" as const,height:"100%"}}>
    <div style={{flex:1,overflowY:"auto" as const,padding:"8px 0",display:"flex",flexDirection:"column" as const,gap:6}}>
      {(log||[]).map((l:any,i:number)=>{
        const isMe=l.uid===userId,isSys=l.t==="sys";
        if(isSys) return(<div key={i} style={{textAlign:"center" as const,padding:"4px 0"}}><span style={{background:T.g1,borderRadius:12,padding:"3px 10px",fontSize:10,color:T.g4}}>{l.act} – {l.dt.slice(5,16)}</span></div>);
        const isAtt=/^(🔗|🎬|📷|📍|📄|📎)\s/.test(l.act);
        return(<div key={i} style={{display:"flex",flexDirection:"column" as const,alignItems:isMe?"flex-end":"flex-start",maxWidth:"85%",alignSelf:isMe?"flex-end":"flex-start"}}>
          <div style={{fontSize:9,color:T.g4,marginBottom:2,paddingLeft:4,paddingRight:4}}>{l.by} · {l.dt.slice(5,16)}</div>
          <div style={{background:isMe?(isAtt?"#E8F4FD":"#DCF8C6"):(isAtt?"#F0F4FF":"#fff"),border:"1px solid "+(isMe?(isAtt?"#B3D9F2":"#B7E89E"):(isAtt?"#D0D9E8":T.g2)),borderRadius:isMe?"14px 14px 4px 14px":"14px 14px 14px 4px",padding:"8px 12px",fontSize:12,color:T.nv,lineHeight:1.4}}>{renderMsg(l.act)}</div>
        </div>);
      })}
      {(!log||!log.length)&&<div style={{textAlign:"center" as const,color:T.g4,fontSize:12,padding:20}}>Sin mensajes a\u00FAn</div>}
    </div>
    {showAtt&&<div style={{padding:10,background:"#F8FAFC",borderRadius:10,border:"1px solid "+T.g2,marginBottom:6}}>
      <div style={{fontSize:11,fontWeight:700,color:T.nv,marginBottom:8}}>{"\u{1F4CE}"} Adjuntar</div>
      {!attType?<div style={{display:"flex",flexWrap:"wrap" as const,gap:6}}>
        {attTypes.map(a=><button key={a.k} onClick={()=>sAttType(a.k)} style={{padding:"8px 14px",borderRadius:10,border:"1px solid "+T.g3,background:"#fff",fontSize:11,cursor:"pointer",fontWeight:600,color:T.nv}}>{a.l}</button>)}
        <button onClick={()=>sShowAtt(false)} style={{padding:"8px 14px",borderRadius:10,border:"none",background:"transparent",fontSize:11,cursor:"pointer",color:T.g4}}>{"\u2715"} Cancelar</button>
      </div>
      :<div style={{display:"flex",gap:6,alignItems:"center"}}>
        <span style={{fontSize:11,fontWeight:600}}>{attTypes.find(a=>a.k===attType)?.l}</span>
        <input value={attVal} onChange={e=>sAttVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sendAtt();}} placeholder={attTypes.find(a=>a.k===attType)?.ph} style={{flex:1,padding:"7px 10px",borderRadius:8,border:"1px solid "+T.g3,fontSize:11}} autoFocus/>
        <Btn v="p" s="s" onClick={sendAtt} disabled={!attVal.trim()}>Enviar</Btn>
        <Btn v="g" s="s" onClick={()=>{sAttType("");sAttVal("");}}>←</Btn>
      </div>}
    </div>}
    <div style={{position:"relative" as const}}>
      {mentionOpen&&filtUsers.length>0&&<div style={{position:"absolute" as const,bottom:"100%",left:40,background:"#fff",border:"1px solid "+T.g3,borderRadius:8,boxShadow:"0 4px 12px rgba(0,0,0,.1)",maxHeight:140,overflowY:"auto" as const,zIndex:10,width:200}}>
        {filtUsers.map((u:any)=><div key={u.id} onClick={()=>insertMention(u)} style={{padding:"6px 10px",fontSize:11,cursor:"pointer",borderBottom:"1px solid "+T.g1,fontWeight:600,color:T.nv}}>{"\u{1F464}"} {fn(u)} <span style={{color:T.g4,fontWeight:400}}>({ROLES[u.role]?.l||""})</span></div>)}
      </div>}
      <div style={{display:"flex",gap:6,paddingTop:8,borderTop:"1px solid "+T.g2}}>
        <button onClick={()=>{sShowAtt(!showAtt);sAttType("");sAttVal("");}} style={{width:36,height:36,borderRadius:18,background:showAtt?T.bl+"15":"#fff",border:"1px solid "+(showAtt?T.bl:T.g3),cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:showAtt?T.bl:T.g4}}>+</button>
        <input ref={mentionRef} value={msg} onChange={e=>handleMsgChange(e.target.value)} onKeyDown={e=>{if(e.key==="Escape")sMentionOpen(false);if(e.key==="Enter"&&msg.trim()&&!mentionOpen){onSend(msg.trim());sMsg("");}}} placeholder="Escrib\u00ED un mensaje... (@menci\u00F3n)" style={{flex:1,padding:"8px 12px",borderRadius:20,border:"1px solid "+T.g3,fontSize:12,outline:"none"}}/>
        <button onClick={()=>{if(msg.trim()){onSend(msg.trim());sMsg("");}}} disabled={!msg.trim()} style={{width:36,height:36,borderRadius:18,background:msg.trim()?T.nv:T.g2,color:"#fff",border:"none",cursor:msg.trim()?"pointer":"default",fontSize:14}}>{"\u27A4"}</button>
      </div>
    </div>
  </div>);
}
