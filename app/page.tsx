"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { T, AREAS, DEPTOS, ROLES, RK, DIV, TIPOS, ST, SC, AGT, MINSECS, fn, isOD, daysDiff } from "@/lib/constants";
import type { Profile, Task, TaskMessage, OrgMember as OrgMemberType, Milestone, Agenda, Minuta } from "@/lib/supabase/types";

const supabase = createClient();
const TODAY = new Date().toISOString().slice(0,10);

/* Helper: map DB profile to legacy shape used by components */
const profileToUser = (p: Profile) => ({ id: p.id, n: p.first_name, a: p.last_name, role: p.role, dId: p.dept_id, div: p.division, mail: p.email, tel: p.phone });
const taskFromDB = (t: Task, msgs: TaskMessage[]) => ({ id: t.id, div: t.division, cId: t.creator_id, cN: t.creator_name, dId: t.dept_id, tipo: t.tipo, desc: t.description, fReq: t.due_date, urg: t.urgency, st: t.status, asTo: t.assigned_to, rG: t.requires_expense, eOk: t.expense_ok, resp: t.resolution, cAt: t.created_at, monto: t.amount, log: msgs.map(m => ({ dt: m.created_at || "", uid: m.user_id, by: m.user_name, act: m.content, t: m.type })) });
const taskToDB = (p: any): Partial<Task> => ({ division: p.div || "", creator_id: p.cId, creator_name: p.cN, dept_id: p.dId, tipo: p.tipo, description: p.desc, due_date: p.fReq, urgency: p.urg, status: p.st, assigned_to: p.asTo, requires_expense: p.rG, expense_ok: p.eOk, resolution: p.resp, created_at: p.cAt, amount: p.monto });

/* constants removed - imported from @/lib/constants */


/* ── UI PRIMITIVES ── */
function Badge({s,sm}:{s:string;sm?:boolean}){const c=SC[s];return <span style={{background:c.bg,color:c.c,padding:sm?"1px 6px":"2px 9px",borderRadius:20,fontSize:sm?9:11,fontWeight:600,whiteSpace:"nowrap"}}>{c.i} {c.l}</span>;}

function Btn({children,onClick,v,s,disabled,style:st}:{children:any;onClick?:any;v?:string;s?:string;disabled?:boolean;style?:any}){
  const vs:any={p:{background:T.nv,color:"#fff"},r:{background:T.rd,color:"#fff"},s:{background:T.gn,color:"#fff"},w:{background:T.yl,color:"#fff"},g:{background:"transparent",color:T.nv,border:"1px solid "+T.g3},pu:{background:T.pr,color:"#fff"}};
  const sz:any={s:{padding:"4px 10px",fontSize:11},m:{padding:"7px 16px",fontSize:13}};
  return <button onClick={onClick} disabled={disabled} style={{border:"none",borderRadius:8,cursor:disabled?"not-allowed":"pointer",fontWeight:600,opacity:disabled?.5:1,...sz[s||"m"],...vs[v||"p"],...(st||{})}}>{children}</button>;
}

function Card({children,style:st,onClick}:{children:any;style?:any;onClick?:any}){return <div onClick={onClick} style={{background:"#fff",borderRadius:14,padding:18,boxShadow:"0 1px 4px rgba(0,0,0,.05)",border:"1px solid "+T.g2,...(st||{})}}>{children}</div>;}
function Ring({pct,color,size,icon}:{pct:number;color:string;size:number;icon?:string}){
  const r=(size/2)-6,ci=2*Math.PI*r,of2=ci-(pct/100)*ci;
  return(<div style={{position:"relative",width:size,height:size}}><svg width={size} height={size} style={{transform:"rotate(-90deg)"}}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.g2} strokeWidth="5"/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5" strokeDasharray={ci} strokeDashoffset={of2} strokeLinecap="round"/></svg><div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>{icon&&<span style={{fontSize:size/4}}>{icon}</span>}<span style={{fontSize:size/6,fontWeight:800,color}}>{pct}%</span></div></div>);
}

/* ── CHANGE PASSWORD MODAL ── */
function ChangePw({onX}:{onX:()=>void}){
  const [cur,sCur]=useState("");const [np,sNp]=useState("");const [np2,sNp2]=useState("");const [err,sErr]=useState("");const [ok,sOk]=useState(false);const [loading,sLoading]=useState(false);
  const submit=async(e:any)=>{e.preventDefault();sErr("");
    if(np.length<6){sErr("La nueva contraseña debe tener al menos 6 caracteres");return;}
    if(np!==np2){sErr("Las contraseñas no coinciden");return;}
    sLoading(true);
    // Verify current password by re-authenticating
    const{data:{session}}=await supabase.auth.getSession();
    const email=session?.user?.email;
    if(!email){sErr("No se pudo verificar la sesión");sLoading(false);return;}
    const{error:signErr}=await supabase.auth.signInWithPassword({email,password:cur});
    if(signErr){sErr("Contraseña actual incorrecta");sLoading(false);return;}
    const{error}=await supabase.auth.updateUser({password:np});
    sLoading(false);
    if(error){sErr(error.message);return;}
    sOk(true);
  };
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}} onClick={onX}>
    <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:14,padding:24,width:360,maxWidth:"90vw",boxShadow:"0 8px 32px rgba(0,0,0,.15)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h3 style={{margin:0,fontSize:16,color:T.nv}}>Cambiar contraseña</h3><button onClick={onX} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:T.g4}}>✕</button></div>
      {ok?<div><div style={{textAlign:"center" as const,padding:"20px 0"}}><div style={{fontSize:32,marginBottom:8}}>✅</div><div style={{fontSize:14,fontWeight:600,color:T.gn}}>Contraseña actualizada</div></div><div style={{textAlign:"center" as const,marginTop:12}}><Btn v="p" onClick={onX}>Cerrar</Btn></div></div>
      :<form onSubmit={submit} style={{display:"flex",flexDirection:"column" as const,gap:10}}>
        <div><label style={{fontSize:11,fontWeight:600,color:T.g5}}>Contraseña actual</label><input type="password" value={cur} onChange={e=>sCur(e.target.value)} required style={{width:"100%",padding:"8px 12px",borderRadius:8,border:"1px solid "+T.g3,fontSize:12,marginTop:3,boxSizing:"border-box" as const}}/></div>
        <div><label style={{fontSize:11,fontWeight:600,color:T.g5}}>Nueva contraseña</label><input type="password" value={np} onChange={e=>sNp(e.target.value)} required style={{width:"100%",padding:"8px 12px",borderRadius:8,border:"1px solid "+T.g3,fontSize:12,marginTop:3,boxSizing:"border-box" as const}}/></div>
        <div><label style={{fontSize:11,fontWeight:600,color:T.g5}}>Confirmar nueva contraseña</label><input type="password" value={np2} onChange={e=>sNp2(e.target.value)} required style={{width:"100%",padding:"8px 12px",borderRadius:8,border:"1px solid "+T.g3,fontSize:12,marginTop:3,boxSizing:"border-box" as const}}/></div>
        {err&&<div style={{color:T.rd,fontSize:11}}>{err}</div>}
        <Btn v="p" disabled={loading}>{loading?"Guardando...":"Cambiar contraseña"}</Btn>
      </form>}
    </div>
  </div>);
}

/* ── LOGIN ── */
function Login({onLogin}:{onLogin:(user:any)=>void}){
  const [email,sEmail]=useState("");const [pw,sPw]=useState("");const [err,sErr]=useState("");const [loading,sLoading]=useState(false);
  const bg={minHeight:"100vh",background:"linear-gradient(160deg,"+T.nv+","+T.rd+")",display:"flex" as const,alignItems:"center" as const,justifyContent:"center" as const,padding:20};
  const logo=<><img src="/logo.jpg" alt="Los Tordos Rugby Club" style={{width:120,height:120,objectFit:"contain",margin:"0 auto 18px",display:"block"}}/><h1 style={{color:"#fff",fontSize:30,margin:"0 0 4px",fontWeight:800,letterSpacing:1}}>Los Tordos Rugby Club</h1><p style={{color:"rgba(255,255,255,.6)",fontSize:14,margin:"0 0 32px",fontWeight:500}}>Sistema de Gestión</p></>;
  const submit=async(e:any)=>{e.preventDefault();sErr("");sLoading(true);
    const{error}=await supabase.auth.signInWithPassword({email,password:pw});
    if(error){sErr(error.message);sLoading(false);return;}
    const{data:{user:au}}=await supabase.auth.getUser();
    if(!au){sErr("Error de autenticación");sLoading(false);return;}
    const{data:profile}=await supabase.from("profiles").select("*").eq("id",au.id).single();
    if(!profile){sErr("Perfil no encontrado");sLoading(false);return;}
    onLogin(profileToUser(profile));
  };
  return(<div style={bg}><div style={{maxWidth:420,width:"100%",textAlign:"center" as const}}>{logo}<Card>
    <h2 style={{margin:"0 0 14px",fontSize:16,color:T.nv}}>Ingresá al sistema</h2>
    <form onSubmit={submit} style={{display:"flex",flexDirection:"column" as const,gap:10}}>
      <input type="email" value={email} onChange={e=>sEmail(e.target.value)} placeholder="Email" required style={{padding:"10px 14px",borderRadius:8,border:"1px solid "+T.g3,fontSize:13,outline:"none"}}/>
      <input type="password" value={pw} onChange={e=>sPw(e.target.value)} placeholder="Contraseña" required style={{padding:"10px 14px",borderRadius:8,border:"1px solid "+T.g3,fontSize:13,outline:"none"}}/>
      {err&&<div style={{color:T.rd,fontSize:12,textAlign:"left" as const}}>{err}</div>}
      <Btn v="r" disabled={loading}>{loading?"Ingresando...":"Ingresar"}</Btn>
    </form>
  </Card></div></div>);
}

/* ── THREAD ── */
function Thread({log,userId,onSend}:{log:any[];userId:string;onSend:any}){
  const [msg,sMsg]=useState("");const [showAtt,sShowAtt]=useState(false);const [attType,sAttType]=useState("");const [attVal,sAttVal]=useState("");
  const attTypes=[{k:"link",l:"🔗 Link",ph:"https://..."},{k:"video",l:"🎬 Video",ph:"URL del video..."},{k:"foto",l:"📷 Foto",ph:"URL de la imagen..."},{k:"ubi",l:"📍 Ubicación",ph:"Dirección o link de Maps..."},{k:"doc",l:"📄 Documento",ph:"URL del documento..."}];
  const sendAtt=()=>{if(attVal.trim()){const at=attTypes.find(a=>a.k===attType);onSend((at?at.l+": ":"📎 ")+attVal.trim());sAttVal("");sAttType("");sShowAtt(false);}};
  const renderMsg=(act:string)=>{const m=act.match(/(https?:\/\/\S+)/);if(m){const parts=act.split(m[1]);return <>{parts[0]}<a href={m[1]} target="_blank" rel="noopener noreferrer" style={{color:T.bl,textDecoration:"underline",wordBreak:"break-all" as const}}>{m[1]}</a>{parts[1]}</>;}return act;};
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
      {(!log||!log.length)&&<div style={{textAlign:"center" as const,color:T.g4,fontSize:12,padding:20}}>Sin mensajes aún</div>}
    </div>
    {showAtt&&<div style={{padding:10,background:"#F8FAFC",borderRadius:10,border:"1px solid "+T.g2,marginBottom:6}}>
      <div style={{fontSize:11,fontWeight:700,color:T.nv,marginBottom:8}}>📎 Adjuntar</div>
      {!attType?<div style={{display:"flex",flexWrap:"wrap" as const,gap:6}}>
        {attTypes.map(a=><button key={a.k} onClick={()=>sAttType(a.k)} style={{padding:"8px 14px",borderRadius:10,border:"1px solid "+T.g3,background:"#fff",fontSize:11,cursor:"pointer",fontWeight:600,color:T.nv}}>{a.l}</button>)}
        <button onClick={()=>sShowAtt(false)} style={{padding:"8px 14px",borderRadius:10,border:"none",background:"transparent",fontSize:11,cursor:"pointer",color:T.g4}}>✕ Cancelar</button>
      </div>
      :<div style={{display:"flex",gap:6,alignItems:"center"}}>
        <span style={{fontSize:11,fontWeight:600}}>{attTypes.find(a=>a.k===attType)?.l}</span>
        <input value={attVal} onChange={e=>sAttVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sendAtt();}} placeholder={attTypes.find(a=>a.k===attType)?.ph} style={{flex:1,padding:"7px 10px",borderRadius:8,border:"1px solid "+T.g3,fontSize:11}} autoFocus/>
        <Btn v="p" s="s" onClick={sendAtt} disabled={!attVal.trim()}>Enviar</Btn>
        <Btn v="g" s="s" onClick={()=>{sAttType("");sAttVal("");}}>←</Btn>
      </div>}
    </div>}
    <div style={{display:"flex",gap:6,paddingTop:8,borderTop:"1px solid "+T.g2}}>
      <button onClick={()=>{sShowAtt(!showAtt);sAttType("");sAttVal("");}} style={{width:36,height:36,borderRadius:18,background:showAtt?T.bl+"15":"#fff",border:"1px solid "+(showAtt?T.bl:T.g3),cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:showAtt?T.bl:T.g4}}>+</button>
      <input value={msg} onChange={e=>sMsg(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&msg.trim()){onSend(msg.trim());sMsg("");}}} placeholder="Escribí un mensaje..." style={{flex:1,padding:"8px 12px",borderRadius:20,border:"1px solid "+T.g3,fontSize:12,outline:"none"}}/>
      <button onClick={()=>{if(msg.trim()){onSend(msg.trim());sMsg("");}}} disabled={!msg.trim()} style={{width:36,height:36,borderRadius:18,background:msg.trim()?T.nv:T.g2,color:"#fff",border:"none",cursor:msg.trim()?"pointer":"default",fontSize:14}}>➤</button>
    </div>
  </div>);
}

/* ── DETAIL MODAL ── */
function Det({p,user,users,onX,onTk,onAs,onRe,onSE,onEO,onFi,onVa,onMsg,onMonto,onDel,onEditSave}:any){
  const [at,sAt]=useState("");const [mt,sMt]=useState(p.monto||"");const [tab,sTab]=useState("chat");const [rp,sRp]=useState(p.resp||"");
  const [editing,sEditing]=useState(false);const [ef,sEf]=useState({tipo:p.tipo,desc:p.desc,fReq:p.fReq,urg:p.urg,div:p.div||"",rG:p.rG});
  const ag=users.find((u:any)=>u.id===p.asTo),isCo=["coordinador","admin","superadmin"].indexOf(user.role)>=0,isEm=user.role==="embudo",isM=p.asTo===user.id,isCr=p.cId===user.id;
  const isSA=user.role==="superadmin";
  const canT=["usuario","coordinador","embudo"].indexOf(user.role)>=0&&p.st===ST.P;
  const stf=users.filter((u:any)=>["usuario","coordinador","embudo"].indexOf(u.role)>=0);
  const od=p.st!==ST.OK&&isOD(p.fReq);
  const msgs=(p.log||[]).filter((l:any)=>l.t==="msg").length;

  return(<div style={{position:"fixed" as const,inset:0,background:"rgba(10,22,40,.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:12}} onClick={onX}>
    <div onClick={(e:any)=>e.stopPropagation()} style={{background:"#fff",borderRadius:14,maxWidth:640,width:"100%",height:"85vh",display:"flex",flexDirection:"column" as const,overflow:"hidden"}}>
      <div style={{padding:"16px 20px 12px",borderBottom:"1px solid "+T.g2,flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
          <div><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:10,color:T.g4}}>#{p.id}</span><Badge s={p.st} sm/>{od&&<span style={{fontSize:10,color:"#DC2626",fontWeight:700}}>⏰ VENCIDA</span>}{p.urg==="Urgente"&&<span style={{fontSize:10,color:T.rd,fontWeight:700}}>🔥 URGENTE</span>}</div><h2 style={{margin:"4px 0 0",fontSize:15,color:T.nv,fontWeight:800}}>{p.tipo}: {p.desc.slice(0,60)}</h2></div>
          <div style={{display:"flex",gap:4,alignItems:"center"}}>{isSA&&<Btn v="g" s="s" onClick={()=>{sEditing(true);sTab("edit");}}>✏️</Btn>}{isSA&&<Btn v="g" s="s" onClick={()=>{if(confirm("¿Eliminar esta tarea?")){onDel(p.id);onX();}}} style={{color:T.rd}}>🗑️</Btn>}<button onClick={onX} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:T.g4}}>✕</button></div>
        </div>
        <div style={{display:"flex",gap:12,marginTop:8,flexWrap:"wrap" as const,fontSize:11,color:T.g5}}>
          <span>📍 {p.div||"General"}</span><span>👤 {p.cN}</span>{ag&&<span>⚙️ {fn(ag)}</span>}<span>📅 {p.fReq}</span>{p.monto&&<span style={{color:T.pr,fontWeight:700}}>💰 ${p.monto.toLocaleString()}</span>}
        </div>
        <div style={{display:"flex",gap:4,marginTop:10}}>
          {[{k:"chat",l:"💬 Chat ("+msgs+")"},{k:"info",l:"📋 Detalle"},{k:"acc",l:"⚡ Acciones"},...(editing?[{k:"edit",l:"✏️ Editar"}]:[])].map(t=><button key={t.k} onClick={()=>sTab(t.k)} style={{padding:"5px 12px",borderRadius:6,border:"none",background:tab===t.k?T.nv:"transparent",color:tab===t.k?"#fff":T.g5,fontSize:11,fontWeight:600,cursor:"pointer"}}>{t.l}</button>)}
        </div>
      </div>
      <div style={{flex:1,padding:"12px 20px",overflow:"auto",display:"flex",flexDirection:"column" as const}}>
        {tab==="chat"&&<Thread log={p.log} userId={user.id} onSend={(txt:string)=>onMsg(p.id,txt)}/>}
        {tab==="edit"&&isSA&&<div style={{display:"flex",flexDirection:"column" as const,gap:10}}>
          <div style={{padding:10,background:"#FFFBEB",borderRadius:8,border:"1px solid #FDE68A"}}><span style={{fontSize:11,fontWeight:700,color:"#92400E"}}>👑 Edición Super Admin</span></div>
          <div><label style={{fontSize:11,fontWeight:600,color:T.g5}}>Tipo</label><div style={{display:"flex",flexWrap:"wrap" as const,gap:4,marginTop:3}}>{TIPOS.map(t=><button key={t} onClick={()=>sEf(prev=>({...prev,tipo:t}))} style={{padding:"4px 10px",borderRadius:16,fontSize:10,border:ef.tipo===t?"2px solid "+T.nv:"1px solid "+T.g3,background:ef.tipo===t?T.nv:"#fff",color:ef.tipo===t?"#fff":T.g5,cursor:"pointer"}}>{t}</button>)}</div></div>
          <div><label style={{fontSize:11,fontWeight:600,color:T.g5}}>Descripción</label><textarea value={ef.desc} onChange={e=>sEf(prev=>({...prev,desc:e.target.value}))} rows={3} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,resize:"vertical" as const,boxSizing:"border-box" as const,marginTop:3}}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div><label style={{fontSize:11,fontWeight:600,color:T.g5}}>División</label><input value={ef.div} onChange={e=>sEf(prev=>({...prev,div:e.target.value}))} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:3}}/></div>
            <div><label style={{fontSize:11,fontWeight:600,color:T.g5}}>Fecha límite</label><input type="date" value={ef.fReq} onChange={e=>sEf(prev=>({...prev,fReq:e.target.value}))} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:3}}/></div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}><label style={{fontSize:11,fontWeight:600,color:T.g5}}>Urgencia:</label>{["Normal","Urgente"].map(u=><button key={u} onClick={()=>sEf(prev=>({...prev,urg:u}))} style={{padding:"4px 12px",borderRadius:8,fontSize:11,border:ef.urg===u?"2px solid "+T.nv:"1px solid "+T.g3,background:ef.urg===u?T.nv+"15":"#fff",color:ef.urg===u?T.nv:T.g4,cursor:"pointer"}}>{u}</button>)}<label style={{display:"flex",alignItems:"center",gap:4,fontSize:11,cursor:"pointer",marginLeft:8}}><input type="checkbox" checked={ef.rG} onChange={e=>sEf(prev=>({...prev,rG:e.target.checked}))}/><span style={{fontWeight:600,color:T.g5}}>Requiere gasto</span></label></div>
          <div style={{display:"flex",gap:4,justifyContent:"flex-end",marginTop:4}}><Btn v="g" onClick={()=>{sEditing(false);sTab("info");}}>Cancelar</Btn><Btn v="p" onClick={()=>{onEditSave(p.id,ef);sEditing(false);sTab("info");}}>💾 Guardar cambios</Btn></div>
        </div>}
        {tab==="info"&&<div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            {[["DIVISIÓN",p.div||"–"],["SOLICITANTE",p.cN],["TIPO",p.tipo],["URGENCIA",p.urg],["FECHA LÍMITE",p.fReq],["CREADO",p.cAt],["REQUIERE GASTO",p.rG?"Sí 💰":"No"],["MONTO",p.monto?"$"+p.monto.toLocaleString():"–"]].map(([l,v],i)=>
              <div key={i}><div style={{fontSize:9,color:T.g4,fontWeight:700}}>{l}</div><div style={{fontSize:12,color:T.nv}}>{v}</div></div>
            )}
          </div>
          {ag&&<div style={{padding:8,background:T.g1,borderRadius:8,marginBottom:8}}><div style={{fontSize:9,color:T.g4,fontWeight:700}}>ASIGNADO A</div><div style={{fontSize:12,fontWeight:600,color:T.nv}}>👤 {fn(ag)}</div></div>}
          <div style={{fontSize:10,fontWeight:700,color:T.g4,marginTop:8,marginBottom:4}}>HISTORIAL</div>
          {(p.log||[]).slice().reverse().map((l:any,i:number)=>(<div key={i} style={{display:"flex",gap:8,padding:"6px 0",borderBottom:"1px solid "+T.g1}}><div style={{width:6,height:6,borderRadius:3,background:l.t==="sys"?T.bl:T.gn,marginTop:5,flexShrink:0}}/><div><div style={{fontSize:10,color:T.g4}}>{l.dt} · {l.by}</div><div style={{fontSize:11,color:T.nv}}>{l.act}</div></div></div>))}
        </div>}
        {tab==="acc"&&<div style={{display:"flex",flexDirection:"column" as const,gap:8}}>
          {p.st===ST.OK&&<div style={{padding:16,background:"#D1FAE5",borderRadius:10,textAlign:"center" as const}}><span style={{fontSize:24}}>✅</span><div style={{fontSize:14,fontWeight:700,color:"#065F46",marginTop:4}}>Tarea Completada</div></div>}
          {canT&&<Btn v="w" onClick={()=>{onTk(p.id);onX();}}>🙋 Tomar esta tarea</Btn>}
          {isCo&&(p.st===ST.P||p.st===ST.C)&&<div><div style={{fontSize:11,fontWeight:600,color:T.g5,marginBottom:4}}>Asignar a:</div><div style={{display:"flex",gap:4}}><select value={at} onChange={(e:any)=>sAt(e.target.value)} style={{flex:1,padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12}}><option value="">Seleccionar...</option>{stf.map((u:any)=><option key={u.id} value={u.id}>{fn(u)} ({ROLES[u.role]?.l})</option>)}</select><Btn disabled={!at} onClick={()=>{onAs(p.id,at);onX();}}>Asignar</Btn></div></div>}
          {(isM||isSA)&&p.st===ST.C&&<div style={{display:"flex",flexDirection:"column" as const,gap:6}}>
            <textarea value={rp} onChange={(e:any)=>sRp(e.target.value)} rows={2} placeholder="Resolución..." style={{padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,resize:"vertical" as const}}/>
            {p.rG&&!p.eOk&&<div><label style={{fontSize:11,color:T.g5}}>Monto ($)</label><input type="number" value={mt} onChange={(e:any)=>sMt(e.target.value)} style={{width:160,padding:"6px 8px",borderRadius:6,border:"1px solid "+T.g3,fontSize:12,marginLeft:6}}/></div>}
            <div style={{display:"flex",gap:4,flexWrap:"wrap" as const}}>
              <Btn v="g" s="s" onClick={()=>onRe(p.id,rp)}>💾 Guardar</Btn>
              {p.rG&&!p.eOk&&<Btn v="pu" s="s" onClick={()=>{if(mt)onMonto(p.id,Number(mt));onRe(p.id,rp);onSE(p.id);}}>💰 Enviar a Compras</Btn>}
              <Btn v="s" s="s" onClick={()=>{onRe(p.id,rp);onFi(p.id);}} disabled={!rp.trim()||(p.rG&&!p.eOk)}>✅ Terminado</Btn>
            </div>
          </div>}
          {isSA&&p.st!==ST.C&&p.st!==ST.OK&&<div style={{display:"flex",gap:4,flexWrap:"wrap" as const}}>
            {p.st===ST.P&&<Btn v="w" s="s" onClick={()=>{onTk(p.id);onX();}}>🙋 Tomar tarea</Btn>}
            {p.st===ST.E&&<><Btn v="s" s="s" onClick={()=>onEO(p.id,true)}>✅ Aprobar gasto</Btn><Btn v="r" s="s" onClick={()=>onEO(p.id,false)}>❌ Rechazar gasto</Btn></>}
            {p.st===ST.V&&<><Btn v="s" s="s" onClick={()=>onVa(p.id,true)}>✅ Validar</Btn><Btn v="r" s="s" onClick={()=>onVa(p.id,false)}>❌ Rechazar</Btn></>}
          </div>}
          {isEm&&!isSA&&p.st===ST.E&&<div style={{background:"#EDE9FE",padding:14,borderRadius:10}}><div style={{fontSize:13,fontWeight:700,color:"#5B21B6",marginBottom:8}}>💰 Aprobación{p.monto&&" – $"+p.monto.toLocaleString()}</div><div style={{display:"flex",gap:8}}><Btn v="s" onClick={()=>onEO(p.id,true)}>✅ Aprobar</Btn><Btn v="r" onClick={()=>onEO(p.id,false)}>❌ Rechazar</Btn></div></div>}
          {isCr&&!isSA&&p.st===ST.V&&<div style={{background:"#F0FDF4",padding:14,borderRadius:10}}><div style={{fontSize:13,fontWeight:700,color:"#166534",marginBottom:8}}>¿Confirmás resolución?</div><div style={{display:"flex",gap:8}}><Btn v="s" onClick={()=>onVa(p.id,true)}>✅ Validar</Btn><Btn v="r" onClick={()=>onVa(p.id,false)}>❌ Rechazar</Btn></div></div>}
          {!(canT||isCo||isSA||(isM&&p.st===ST.C)||(isEm&&p.st===ST.E)||(isCr&&p.st===ST.V)||p.st===ST.OK)&&<div style={{padding:16,textAlign:"center" as const,color:T.g4,fontSize:12}}>No hay acciones disponibles.</div>}
        </div>}
      </div>
    </div>
  </div>);
}

/* ── MY DASHBOARD ── */
function MyDash({user,peds,users,onSel}:any){
  const [tab,sTab]=useState("active");
  const isEnl=user.role==="enlace"||user.role==="manager";
  const myPeds=peds.filter((p:any)=>{if(isEnl)return p.cId===user.id;return p.asTo===user.id;});
  const active=myPeds.filter((p:any)=>p.st!==ST.OK),done=myPeds.filter((p:any)=>p.st===ST.OK);
  const total=myPeds.length,okC=done.length,pct=total?Math.round(okC/total*100):0;
  const overdue=active.filter((p:any)=>isOD(p.fReq));
  const vis=tab==="active"?active:done;
  return(<div style={{maxWidth:720}}>
    <div style={{display:"flex",gap:16,alignItems:"center",marginBottom:20}}>
      <Ring pct={pct} color={pct>=80?T.gn:pct>=40?T.yl:T.rd} size={90} icon={isEnl?"🔗":"👤"}/>
      <div style={{flex:1}}><h2 style={{margin:0,fontSize:20,color:T.nv,fontWeight:800}}>{isEnl?"Mis Pedidos":"Mis Tareas"}</h2><div style={{fontSize:12,color:T.g5}}>{fn(user)}{user.div?" · "+user.div:""}</div><div style={{display:"flex",gap:12,marginTop:8,fontSize:12}}><span style={{fontWeight:700,color:T.nv}}>{total} total</span><span style={{fontWeight:700,color:T.gn}}>✅ {okC}</span><span style={{fontWeight:700,color:T.yl}}>🟡 {active.length}</span>{overdue.length>0&&<span style={{fontWeight:700,color:"#DC2626"}}>⏰ {overdue.length}</span>}</div></div>
    </div>
    <div style={{display:"flex",gap:4,marginBottom:14}}>
      {[{k:"active",l:"🟡 Activas ("+active.length+")",bg:T.nv},{k:"done",l:"✅ Realizadas ("+done.length+")",bg:T.gn}].map(t=>
        <button key={t.k} onClick={()=>sTab(t.k)} style={{padding:"7px 16px",borderRadius:8,border:"none",background:tab===t.k?t.bg:"#fff",color:tab===t.k?"#fff":T.g5,fontSize:12,fontWeight:600,cursor:"pointer"}}>{t.l}</button>
      )}
    </div>
    <div style={{display:"flex",flexDirection:"column" as const,gap:8}}>
      {vis.length===0&&<Card style={{textAlign:"center",padding:28,color:T.g4}}><span style={{fontSize:28}}>🎉</span><div style={{marginTop:6,fontSize:13}}>Sin tareas</div></Card>}
      {vis.map((p:any)=>{const od2=p.st!==ST.OK&&isOD(p.fReq),msgs=(p.log||[]).filter((l:any)=>l.t==="msg").length;
        return(<Card key={p.id} style={{padding:"14px 16px",cursor:"pointer",borderLeft:"4px solid "+SC[p.st].c,background:od2?"#FEF2F2":"#fff"}} onClick={()=>onSel(p)}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><Badge s={p.st} sm/>{od2&&<span style={{fontSize:9,color:"#DC2626",fontWeight:700}}>⏰</span>}{p.urg==="Urgente"&&<span style={{fontSize:9,color:T.rd,fontWeight:700}}>🔥</span>}<span style={{fontSize:10,color:T.g4}}>#{p.id}</span></div>
          <div style={{fontSize:13,fontWeight:700,color:T.nv}}>{p.desc}</div>
          <div style={{fontSize:11,color:T.g5,marginTop:3}}>{p.div&&<span>📍 {p.div} · </span>}{p.tipo} · 📅 {p.fReq} · 💬 {msgs}</div>
        </Card>);})}
    </div>
  </div>);
}

/* ── SIDEBAR ── */
function SB({areas,deptos,pedidos,aA,aD,onAC,onDC,col,onCol,isPersonal}:any){
  if(col) return(<div style={{width:48,minWidth:48,background:T.nv,display:"flex",flexDirection:"column" as const,alignItems:"center",paddingTop:10}}><button onClick={onCol} style={{background:"none",border:"none",color:"#fff",fontSize:18,cursor:"pointer",marginBottom:14}}>☰</button><span style={{fontSize:14}}>🏉</span></div>);
  return(
    <div style={{width:250,minWidth:250,background:T.nv,color:"#fff",display:"flex",flexDirection:"column" as const}}>
      <div style={{padding:"14px 12px",borderBottom:"1px solid rgba(255,255,255,.08)",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:16}}>🏉</span><span style={{fontSize:13,fontWeight:800}}>LOS TORDOS</span></div><div style={{fontSize:9,color:T.g4,letterSpacing:1,textTransform:"uppercase" as const,marginTop:2}}>Panel de Control</div></div><button onClick={onCol} style={{background:"none",border:"none",color:T.g4,fontSize:14,cursor:"pointer"}}>◀</button></div>
      <div style={{flex:1,overflowY:"auto" as const,padding:"8px 6px"}}>
        {!isPersonal&&areas.map((ar:any)=>{const ds=deptos.filter((d:any)=>d.aId===ar.id),ids=ds.map((d:any)=>d.id),ap=pedidos.filter((p:any)=>ids.indexOf(p.dId)>=0),pe=ap.filter((p:any)=>p.st===ST.P).length,cu=ap.filter((p:any)=>[ST.C,ST.E,ST.V].indexOf(p.st)>=0).length,ok=ap.filter((p:any)=>p.st===ST.OK).length;
          return(<div key={ar.id} style={{marginBottom:4}}><div onClick={()=>onAC(ar.id)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 8px",borderRadius:7,cursor:"pointer",background:aA===ar.id?"rgba(255,255,255,.1)":"transparent",borderLeft:"3px solid "+ar.color}}><span style={{fontSize:11,fontWeight:600}}>{ar.icon} {ar.name}</span><div style={{display:"flex",gap:4,fontSize:9}}>{pe>0&&<span style={{color:T.rd}}>🔴{pe}</span>}{cu>0&&<span style={{color:T.yl}}>🟡{cu}</span>}{ok>0&&<span style={{color:T.gn}}>🟢{ok}</span>}</div></div>
            {aA===ar.id&&<div style={{marginTop:2}}>{ds.map((d:any)=>{const dc=pedidos.filter((p:any)=>p.dId===d.id).length;return(<div key={d.id} onClick={()=>onDC(d.id)} style={{marginLeft:14,padding:"4px 8px",borderRadius:5,cursor:"pointer",background:aD===d.id?"rgba(255,255,255,.14)":"transparent",fontSize:10,color:aD===d.id?"#fff":"rgba(255,255,255,.45)",fontWeight:aD===d.id?600:400,display:"flex",justifyContent:"space-between"}}><span>📂 {d.name}</span>{dc>0&&<span style={{background:"rgba(255,255,255,.12)",borderRadius:8,padding:"0 5px",fontSize:9}}>{dc}</span>}</div>);})}</div>}
          </div>);
        })}
        <div style={{marginTop:10,padding:8,background:"rgba(255,255,255,.04)",borderRadius:7}}>
          <div style={{fontSize:9,fontWeight:700,color:T.g4,textTransform:"uppercase" as const,marginBottom:4}}>Global</div>
          {Object.keys(SC).map(k=><div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:10,padding:"1px 0"}}><span style={{color:"rgba(255,255,255,.45)"}}>{SC[k].i} {SC[k].l}</span><span style={{fontWeight:700,color:SC[k].c}}>{pedidos.filter((p:any)=>p.st===k).length}</span></div>)}
        </div>
      </div>
    </div>
  );
}

/* ── KPIs ── */
function KPIs({peds}:{peds:any[]}){
  const tot=peds.length,ok=peds.filter(p=>p.st===ST.OK).length,pe=peds.filter(p=>p.st===ST.P).length;
  const active=peds.filter(p=>p.st!==ST.OK),overdue=active.filter(p=>isOD(p.fReq)).length;
  const kpis=[{l:"Completadas",v:ok+"/"+tot,c:T.gn,i:"✅"},{l:"Pendientes",v:pe,c:T.rd,i:"🔴"},{l:"Vencidas",v:overdue,c:"#DC2626",i:"⏰"},{l:"Con Gasto",v:peds.filter(p=>p.monto).length,c:T.pr,i:"💰"}];
  return(<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10,marginBottom:18}}>{kpis.map((k,i)=>(<Card key={i} style={{padding:"10px 12px",borderTop:"3px solid "+k.c}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:16}}>{k.i}</span><span style={{fontSize:17,fontWeight:800,color:k.c}}>{k.v}</span></div><div style={{fontSize:10,color:T.g4,marginTop:3}}>{k.l}</div></Card>))}</div>);
}

/* ── CIRCLES ── */
function Circles({areas,deptos,pedidos,onAC}:any){
  return(<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14}}>
    {areas.map((ar:any)=>{const ids=deptos.filter((d:any)=>d.aId===ar.id).map((d:any)=>d.id),ap=pedidos.filter((p:any)=>ids.indexOf(p.dId)>=0),tot=ap.length,ok=ap.filter((p:any)=>p.st===ST.OK).length,pe=ap.filter((p:any)=>p.st===ST.P).length,cu=ap.filter((p:any)=>[ST.C,ST.E,ST.V].indexOf(p.st)>=0).length,pct=tot?Math.round(ok/tot*100):0;
      return(<div key={ar.id} onClick={()=>onAC(ar.id)} style={{background:"#fff",borderRadius:16,padding:"20px 16px",textAlign:"center" as const,cursor:"pointer",border:"1px solid "+T.g2}}><Ring pct={pct} color={ar.color} size={100} icon={ar.icon}/><div style={{fontSize:14,fontWeight:700,color:T.nv,marginTop:6}}>{ar.name}</div><div style={{display:"flex",justifyContent:"center",gap:8,fontSize:11,marginTop:5}}><span style={{color:T.rd}}>🔴{pe}</span><span style={{color:T.yl}}>🟡{cu}</span><span style={{color:T.gn}}>🟢{ok}</span></div></div>);})}
  </div>);
}

/* ── TASK LIST ── */
function TList({title,icon,color,peds,users,onSel,search}:any){
  const [f,sF]=useState("all");
  let v=f==="all"?peds:peds.filter((p:any)=>p.st===f);
  if(search){const s=search.toLowerCase();v=v.filter((p:any)=>(p.desc+p.cN+p.tipo+p.div+(p.id+"")).toLowerCase().includes(s));}
  return(<div>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><div style={{width:30,height:30,borderRadius:8,background:color+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>{icon}</div><div><h2 style={{margin:0,fontSize:16,color:T.nv,fontWeight:800}}>{title}</h2><p style={{margin:0,fontSize:11,color:T.g4}}>{v.length} tareas</p></div></div>
    <div style={{display:"flex",gap:4,marginBottom:10,flexWrap:"wrap" as const}}><Btn v={f==="all"?"p":"g"} s="s" onClick={()=>sF("all")}>Todos</Btn>{Object.keys(SC).map(k=><Btn key={k} v={f===k?"p":"g"} s="s" onClick={()=>sF(f===k?"all":k)}>{SC[k].i} {peds.filter((p:any)=>p.st===k).length}</Btn>)}</div>
    <Card style={{padding:0,overflow:"hidden"}}><table style={{width:"100%",borderCollapse:"collapse" as const,fontSize:12}}><thead><tr style={{background:T.g1}}>{["#","Tipo","Solicitante","Fecha","Estado","Asignado"].map((h,i)=><th key={i} style={{padding:"7px 8px",textAlign:"left" as const,fontSize:10,color:T.g4,fontWeight:700}}>{h}</th>)}</tr></thead><tbody>
      {v.length===0&&<tr><td colSpan={6} style={{padding:28,textAlign:"center" as const,color:T.g4}}>Sin tareas</td></tr>}
      {v.map((p:any)=>{const ag=users.find((u:any)=>u.id===p.asTo),od=p.st!==ST.OK&&isOD(p.fReq);return(<tr key={p.id} onClick={()=>onSel(p)} style={{borderBottom:"1px solid "+T.g1,cursor:"pointer",background:od?"#FEF2F2":"transparent"}}><td style={{padding:"7px 8px",fontWeight:600,color:T.nv}}>{p.id}</td><td style={{padding:"7px 8px"}}>{p.tipo}</td><td style={{padding:"7px 8px",fontSize:11}}>{p.cN}</td><td style={{padding:"7px 8px",fontSize:11}}>{p.fReq}{od&&<span style={{marginLeft:4,fontSize:9,color:"#DC2626"}}>⏰</span>}</td><td style={{padding:"7px 8px"}}><Badge s={p.st} sm/></td><td style={{padding:"7px 8px",fontSize:11,color:T.g4}}>{ag?fn(ag):"–"}</td></tr>);})}
    </tbody></table></Card>
  </div>);
}

/* ── ORGANIGRAMA ── */
function OrgNode({icon,title,sub,color,children,cnt,ex,onTog}:any){return(<div style={{marginBottom:6}}><div onClick={onTog} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:"#fff",borderRadius:10,border:"1px solid "+T.g2,cursor:"pointer",borderLeft:"4px solid "+color}}><span style={{fontSize:18}}>{icon}</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:T.nv}}>{title}</div>{sub&&<div style={{fontSize:10,color:T.g4}}>{sub}</div>}</div>{cnt!==undefined&&<span style={{background:T.g1,borderRadius:12,padding:"1px 8px",fontSize:10,fontWeight:600,color:T.g5}}>{cnt}</span>}<span style={{fontSize:12,color:T.g4,transform:ex?"rotate(90deg)":"none",transition:"transform .2s"}}>▶</span></div>{ex&&<div style={{marginLeft:24,marginTop:4,borderLeft:"2px solid "+color+"22",paddingLeft:14}}>{children}</div>}</div>);}

function OrgMember({m,isSA,onEdit,onDel}:any){const ok=m.n&&m.a;return(<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 10px",background:ok?"#FAFAFA":T.g1,borderRadius:7,border:"1px solid "+T.g2,marginBottom:3}}><div><div style={{fontSize:9,fontWeight:700,color:T.rd,textTransform:"uppercase" as const}}>{m.cargo}</div>{ok?<div style={{fontSize:12,fontWeight:700,color:T.nv}}>{m.n} {m.a}</div>:<div style={{fontSize:11,color:T.g3,fontStyle:"italic"}}>Sin asignar</div>}</div>{isSA&&<div style={{display:"flex",gap:3}}><Btn v="g" s="s" onClick={()=>onEdit(m)}>✏️</Btn><Btn v="g" s="s" onClick={()=>onDel&&onDel(m.id)} style={{color:T.rd}}>🗑️</Btn></div>}</div>);}

function Org({areas,deptos,users,om,onEditSave,onDelOm,onDelUser,onEditUser,isSA}:any){
  const [ex,sEx]=useState<any>({});const [ed,sEd]=useState<any>(null);const [ef,sEf]=useState({n:"",a:"",mail:"",tel:""});
  const tog=(k:string)=>sEx((p:any)=>({...p,[k]:!p[k]}));
  return(<div style={{maxWidth:680}}><h2 style={{margin:"0 0 4px",fontSize:19,color:T.nv,fontWeight:800}}>Organigrama</h2><p style={{color:T.g4,fontSize:12,margin:"0 0 18px"}}>Estructura institucional Los Tordos Rugby Club</p>
    {ed&&<Card style={{marginBottom:12,maxWidth:400,background:"#FFFBEB",border:"1px solid #FDE68A"}}><div style={{fontSize:11,fontWeight:600,color:T.g5,marginBottom:6}}>Editando: {ed.cargo}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:4}}><input value={ef.n} onChange={e=>sEf(p=>({...p,n:e.target.value}))} placeholder="Nombre" style={{padding:"6px 8px",borderRadius:6,border:"1px solid "+T.g3,fontSize:12}}/><input value={ef.a} onChange={e=>sEf(p=>({...p,a:e.target.value}))} placeholder="Apellido" style={{padding:"6px 8px",borderRadius:6,border:"1px solid "+T.g3,fontSize:12}}/></div><div style={{display:"flex",gap:4}}><Btn s="s" onClick={()=>{onEditSave(ed.id,ef);sEd(null);}}>Guardar</Btn><Btn v="g" s="s" onClick={()=>sEd(null)}>✕</Btn></div></Card>}
    <OrgNode icon="🏛️" title="Comisión Directiva" color={T.nv} ex={!!ex.cd} onTog={()=>tog("cd")} cnt={om.filter((m:any)=>m.t==="cd"&&m.n).length+"/8"}>{om.filter((m:any)=>m.t==="cd").map((m:any)=><OrgMember key={m.id} m={m} isSA={isSA} onEdit={(mm:any)=>{sEd(mm);sEf({n:mm.n,a:mm.a,mail:mm.mail,tel:mm.tel});}} onDel={(id:string)=>onDelOm(id)}/>)}</OrgNode>
    <div style={{marginLeft:24,borderLeft:"2px solid "+T.nv+"22",paddingLeft:14}}>
      <OrgNode icon="⚡" title="Secretaría Ejecutiva" sub="Depende de CD" color={T.rd} ex={!!ex.se} onTog={()=>tog("se")} cnt={om.filter((m:any)=>m.t==="se"&&m.n).length+"/5"}>{om.filter((m:any)=>m.t==="se").map((m:any)=><OrgMember key={m.id} m={m} isSA={isSA} onEdit={(mm:any)=>{sEd(mm);sEf({n:mm.n,a:mm.a,mail:mm.mail,tel:mm.tel});}} onDel={(id:string)=>onDelOm(id)}/>)}</OrgNode>
      <div style={{marginLeft:24,borderLeft:"2px solid "+T.rd+"22",paddingLeft:14}}>
        {areas.filter((ar:any)=>ar.id!==100&&ar.id!==101).map((ar:any)=>{const ds=deptos.filter((d:any)=>d.aId===ar.id);const dsWithPeople=ds.filter((d:any)=>users.some((u:any)=>u.dId===d.id));return(<OrgNode key={ar.id} icon={ar.icon} title={ar.name} sub={dsWithPeople.length+" deptos"} color={ar.color} ex={!!ex["ar"+ar.id]} onTog={()=>tog("ar"+ar.id)} cnt={dsWithPeople.length}>{dsWithPeople.map((d:any)=>{const pp=users.filter((u:any)=>u.dId===d.id);const resp=pp.find((u:any)=>u.role==="coordinador")||pp.find((u:any)=>u.role==="admin")||pp[0];const others=pp.filter((u:any)=>u.id!==(resp?resp.id:""));return(<OrgNode key={d.id} icon="📂" title={d.name} color={ar.color} ex={!!ex["d"+d.id]} onTog={()=>tog("d"+d.id)} cnt={pp.length}>
              {resp&&<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:6,padding:"6px 10px",background:"#FEE2E2",borderRadius:7,border:"1px solid #FECACA",marginBottom:4}}><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:10}}>⭐</span><div><div style={{fontSize:9,fontWeight:700,color:T.rd,textTransform:"uppercase" as const}}>Responsable</div><div style={{fontSize:12,fontWeight:700,color:T.nv}}>{fn(resp)}</div></div></div>{isSA&&<div style={{display:"flex",gap:3}}><Btn v="g" s="s" onClick={()=>onEditUser(resp)}>✏️</Btn><Btn v="g" s="s" onClick={()=>onDelUser(resp.id)} style={{color:T.rd}}>🗑️</Btn></div>}</div>}
              {others.map((u:any)=>(<div key={u.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:6,padding:"6px 10px",background:"#FAFAFA",borderRadius:7,border:"1px solid "+T.g2,marginBottom:3}}><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:10}}>👤</span><div><div style={{fontSize:9,fontWeight:700,color:T.rd,textTransform:"uppercase" as const}}>{u.div||ROLES[u.role]?.l||""}</div><div style={{fontSize:12,fontWeight:700,color:T.nv}}>{fn(u)}</div></div></div>{isSA&&<div style={{display:"flex",gap:3}}><Btn v="g" s="s" onClick={()=>onEditUser(u)}>✏️</Btn><Btn v="g" s="s" onClick={()=>onDelUser(u.id)} style={{color:T.rd}}>🗑️</Btn></div>}</div>))}
              {others.length===0&&!resp&&<div style={{fontSize:10,color:T.g4,fontStyle:"italic",padding:4}}>Sin integrantes</div>}
            </OrgNode>);})}</OrgNode>);})}
      </div>
    </div>
  </div>);
}

/* ── NUEVO PEDIDO ── */
function NP({user,users,deptos,areas,onSub,onX,preAssign}:any){
  const isE=["enlace","manager","usuario","embudo"].indexOf(user.role)>=0;
  const isHigh=["superadmin","admin","coordinador"].indexOf(user.role)>=0;
  const [f,sF]=useState({aId:"",dId:isE?String(user.dId):"",div:isE?user.div:"",asTo:"",tipo:"",desc:"",fReq:"",urg:"Normal",rG:false});
  const up=(k:string,v:any)=>sF((p:any)=>({...p,[k]:v}));
  const selArea=f.aId?areas.find((a:any)=>a.id===Number(f.aId)):null;
  const ok=f.tipo&&f.desc&&f.fReq;
  const [atts,sAtts]=useState<{type:string;label:string;val:string}[]>([]);const [showAtt,sShowAtt]=useState(false);const [attType,sAttType]=useState("");const [attVal,sAttVal]=useState("");
  const attTypes=[{k:"link",l:"🔗 Link",ph:"https://..."},{k:"video",l:"🎬 Video",ph:"URL del video..."},{k:"foto",l:"📷 Foto",ph:"URL de la imagen..."},{k:"ubi",l:"📍 Ubicación",ph:"Dirección o link de Maps..."},{k:"doc",l:"📄 Documento",ph:"URL del documento..."}];
  const addAtt=()=>{if(attVal.trim()){const at=attTypes.find(a=>a.k===attType);sAtts(p=>[...p,{type:attType,label:at?at.l:"📎",val:attVal.trim()}]);sAttVal("");sAttType("");sShowAtt(false);}};
  return(<Card style={{maxWidth:560}}>
    <h2 style={{margin:"0 0 14px",fontSize:17,color:T.nv,fontWeight:800}}>🏉 Nueva Tarea</h2>
    {preAssign&&<div style={{padding:"8px 12px",background:"#EDE9FE",borderRadius:8,fontSize:12,marginBottom:12,display:"flex",alignItems:"center",gap:6}}>📋 <span style={{fontWeight:600,color:"#5B21B6"}}>Asignando a: {fn(preAssign)}</span>{preAssign.div&&<span style={{fontSize:10,color:T.g4}}>· {preAssign.div}</span>}</div>}
    {isE&&!preAssign&&<div style={{padding:"8px 12px",background:T.g1,borderRadius:8,fontSize:12,marginBottom:12}}>{fn(user)}{user.div?" · "+user.div:""}</div>}
    {isHigh&&<><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}><div><label style={{fontSize:12,fontWeight:600,color:T.g5}}>Área</label><select value={f.aId} onChange={(e:any)=>{sF((p:any)=>({...p,aId:e.target.value,dId:""}));}} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,marginTop:3}}><option value="">Todas</option>{areas.map((a:any)=><option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}</select></div><div><label style={{fontSize:12,fontWeight:600,color:T.g5}}>Departamento</label><select value={f.dId} onChange={(e:any)=>up("dId",e.target.value)} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,marginTop:3}}><option value="">General</option>{(selArea?deptos.filter((d:any)=>d.aId===selArea.id):deptos).map((d:any)=><option key={d.id} value={d.id}>{d.name}</option>)}</select></div></div><div style={{marginBottom:10}}><label style={{fontSize:12,fontWeight:600,color:T.g5}}>División</label><select value={f.div} onChange={(e:any)=>up("div",e.target.value)} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,marginTop:3}}><option value="">General</option>{DIV.map(d=><option key={d} value={d}>{d}</option>)}</select></div></>}
    <div style={{marginBottom:10}}><label style={{fontSize:12,fontWeight:600,color:T.g5}}>Tipo *</label><div style={{display:"flex",flexWrap:"wrap" as const,gap:4,marginTop:4}}>{TIPOS.map(t=><button key={t} onClick={()=>up("tipo",t)} style={{padding:"4px 12px",borderRadius:18,fontSize:11,border:f.tipo===t?"2px solid "+T.nv:"1px solid "+T.g3,background:f.tipo===t?T.nv:"#fff",color:f.tipo===t?"#fff":T.g5,cursor:"pointer"}}>{t}</button>)}</div></div>
    <div style={{marginBottom:10}}><label style={{fontSize:12,fontWeight:600,color:T.g5}}>Descripción *</label><textarea value={f.desc} onChange={(e:any)=>up("desc",e.target.value)} rows={3} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,resize:"vertical" as const,boxSizing:"border-box" as const,marginTop:3}}/></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}><div><label style={{fontSize:12,fontWeight:600,color:T.g5}}>Fecha límite *</label><input type="date" value={f.fReq} onChange={(e:any)=>up("fReq",e.target.value)} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:13,boxSizing:"border-box" as const,marginTop:3}}/></div><div><label style={{fontSize:12,fontWeight:600,color:T.g5}}>Urgencia</label><div style={{display:"flex",gap:4,marginTop:3}}>{["Normal","Urgente"].map(u=><button key={u} onClick={()=>up("urg",u)} style={{flex:1,padding:6,borderRadius:8,fontSize:11,fontWeight:600,border:f.urg===u?"2px solid "+T.nv:"1px solid "+T.g3,background:f.urg===u?T.nv+"15":"#fff",color:f.urg===u?T.nv:T.g4,cursor:"pointer"}}>{u}</button>)}</div></div></div>
    <div style={{marginBottom:12}}><label style={{display:"flex",alignItems:"center",gap:6,fontSize:12,cursor:"pointer"}}><input type="checkbox" checked={f.rG} onChange={(e:any)=>up("rG",e.target.checked)}/><span style={{fontWeight:600,color:T.g5}}>Requiere gasto 💰</span></label></div>
    <div style={{marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><label style={{fontSize:12,fontWeight:600,color:T.g5}}>Adjuntos</label><button onClick={()=>{sShowAtt(!showAtt);sAttType("");sAttVal("");}} style={{width:28,height:28,borderRadius:14,background:showAtt?T.bl+"15":"#fff",border:"1px solid "+(showAtt?T.bl:T.g3),cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",color:showAtt?T.bl:T.g4,fontWeight:700}}>+</button></div>
      {showAtt&&<div style={{padding:10,background:"#F8FAFC",borderRadius:10,border:"1px solid "+T.g2,marginBottom:8}}>
        {!attType?<div style={{display:"flex",flexWrap:"wrap" as const,gap:6}}>
          {attTypes.map(a=><button key={a.k} onClick={()=>sAttType(a.k)} style={{padding:"8px 14px",borderRadius:10,border:"1px solid "+T.g3,background:"#fff",fontSize:11,cursor:"pointer",fontWeight:600,color:T.nv}}>{a.l}</button>)}
          <button onClick={()=>sShowAtt(false)} style={{padding:"8px 14px",borderRadius:10,border:"none",background:"transparent",fontSize:11,cursor:"pointer",color:T.g4}}>✕</button>
        </div>
        :<div style={{display:"flex",gap:6,alignItems:"center"}}>
          <span style={{fontSize:11,fontWeight:600}}>{attTypes.find(a=>a.k===attType)?.l}</span>
          <input value={attVal} onChange={e=>sAttVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addAtt();}} placeholder={attTypes.find(a=>a.k===attType)?.ph} style={{flex:1,padding:"7px 10px",borderRadius:8,border:"1px solid "+T.g3,fontSize:11}} autoFocus/>
          <Btn v="p" s="s" onClick={addAtt} disabled={!attVal.trim()}>Agregar</Btn>
          <Btn v="g" s="s" onClick={()=>{sAttType("");sAttVal("");}}>←</Btn>
        </div>}
      </div>}
      {atts.length>0&&<div style={{display:"flex",flexWrap:"wrap" as const,gap:4}}>{atts.map((a,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",background:"#E8F4FD",borderRadius:16,fontSize:10,border:"1px solid #B3D9F2"}}><span>{a.label}</span><span style={{color:T.bl,maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{a.val}</span><button onClick={()=>sAtts(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer",fontSize:10,color:T.g4,padding:0}}>✕</button></div>)}</div>}
    </div>
    <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn v="g" onClick={onX}>Cancelar</Btn><Btn v="r" disabled={!ok} onClick={()=>{const dId=Number(f.dId)||user.dId;const pa=preAssign;const ts=TODAY+" "+new Date().toTimeString().slice(0,5);onSub({id:0,div:f.div||user.div||"",cId:user.id,cN:fn(user),dId,tipo:f.tipo,desc:f.desc,fReq:f.fReq,urg:f.urg,st:pa?ST.C:ST.P,asTo:pa?pa.id:null,rG:f.rG,eOk:null,resp:"",cAt:TODAY,monto:null,log:[{dt:ts,uid:user.id,by:fn(user),act:"Creó la tarea",t:"sys"},...(pa?[{dt:ts,uid:user.id,by:fn(user),act:"Asignó a "+fn(pa),t:"sys"}]:[]),...atts.map(a=>({dt:ts,uid:user.id,by:fn(user),act:a.label+": "+a.val,t:"msg"}))]});}}>📨 Enviar</Btn></div>
  </Card>);
}

/* ── PROYECTO ── */
function Proyecto({hitos,setHitos,isAd}:any){return(<div style={{maxWidth:700}}><h2 style={{margin:"0 0 4px",fontSize:19,color:T.nv,fontWeight:800}}>📋 Plan Maestro 2035</h2><p style={{color:T.g4,fontSize:12,margin:"0 0 18px"}}>Hitos de infraestructura</p>{hitos.map((h:any)=>(<Card key={h.id} style={{marginBottom:10,borderLeft:"4px solid "+h.color,display:"flex",gap:16,alignItems:"center"}}><Ring pct={h.pct} color={h.color} size={70}/><div style={{flex:1}}><div style={{fontSize:10,fontWeight:700,color:h.color,textTransform:"uppercase" as const}}>{h.fase} · {h.periodo}</div><div style={{fontSize:14,fontWeight:700,color:T.nv,margin:"3px 0"}}>{h.name}</div><div style={{height:4,background:T.g2,borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:h.pct+"%",background:h.color,borderRadius:4}}/></div></div>{isAd&&<div style={{display:"flex",gap:3}}><Btn v="g" s="s" onClick={()=>setHitos((p:any)=>p.map((x:any)=>x.id===h.id?{...x,pct:Math.max(0,x.pct-5)}:x))}>−</Btn><Btn v="g" s="s" onClick={()=>setHitos((p:any)=>p.map((x:any)=>x.id===h.id?{...x,pct:Math.min(100,x.pct+5)}:x))}>+</Btn></div>}</Card>))}</div>);}

/* ── PERFILES ── */
function Profs({users,deptos,areas,onDel,onAdd,onEditUser,isAd,onAssignTask}:any){
  const [adding,sAdding]=useState(false);const [editing,sEditing]=useState<any>(null);
  const [nf,sNf]=useState({n:"",a:"",role:"usuario",dId:"",div:"",mail:"",tel:""});
  const [ef,sEf]=useState({n:"",a:"",role:"",dId:"",div:"",mail:"",tel:""});
  const resetNew=()=>{sNf({n:"",a:"",role:"usuario",dId:"",div:"",mail:"",tel:""});sAdding(false);};
  return(<div style={{maxWidth:720}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <h2 style={{margin:0,fontSize:19,color:T.nv,fontWeight:800}}>👥 Perfiles</h2>
      {isAd&&<Btn v="p" s="s" onClick={()=>sAdding(true)}>+ Nuevo perfil</Btn>}
    </div>
    {adding&&<Card style={{marginBottom:14,background:"#F0FDF4",border:"1px solid #BBF7D0"}}>
      <div style={{fontSize:12,fontWeight:700,color:"#166534",marginBottom:10}}>➕ Nuevo perfil</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Nombre *</label><input value={nf.n} onChange={e=>sNf(p=>({...p,n:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Apellido *</label><input value={nf.a} onChange={e=>sNf(p=>({...p,a:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Rol *</label><select value={nf.role} onChange={e=>sNf(p=>({...p,role:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,marginTop:2}}>{RK.map(k=><option key={k} value={k}>{ROLES[k].i} {ROLES[k].l}</option>)}</select></div>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Departamento</label><select value={nf.dId} onChange={e=>sNf(p=>({...p,dId:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,marginTop:2}}><option value="">Seleccionar...</option>{deptos.map((d:any)=>{const ar=areas.find((a:any)=>a.id===d.aId);return <option key={d.id} value={d.id}>{ar?ar.icon+" ":""}{d.name}</option>;})}</select></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:8}}>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>División</label><input value={nf.div} onChange={e=>sNf(p=>({...p,div:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Email</label><input value={nf.mail} onChange={e=>sNf(p=>({...p,mail:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Teléfono</label><input value={nf.tel} onChange={e=>sNf(p=>({...p,tel:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
      </div>
      <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}><Btn v="g" s="s" onClick={resetNew}>Cancelar</Btn><Btn v="s" s="s" disabled={!nf.n||!nf.a} onClick={()=>{onAdd({id:"u"+Date.now(),n:nf.n,a:nf.a,role:nf.role,dId:Number(nf.dId)||1,div:nf.div,mail:nf.mail,tel:nf.tel});resetNew();}}>✅ Crear</Btn></div>
    </Card>}
    {editing&&<Card style={{marginBottom:14,background:"#FFFBEB",border:"1px solid #FDE68A"}}>
      <div style={{fontSize:12,fontWeight:700,color:"#92400E",marginBottom:10}}>✏️ Editando: {ef.n} {ef.a}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Nombre</label><input value={ef.n} onChange={e=>sEf(p=>({...p,n:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Apellido</label><input value={ef.a} onChange={e=>sEf(p=>({...p,a:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Rol</label><select value={ef.role} onChange={e=>sEf(p=>({...p,role:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,marginTop:2}}>{RK.map(k=><option key={k} value={k}>{ROLES[k].i} {ROLES[k].l}</option>)}</select></div>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Departamento</label><select value={ef.dId} onChange={e=>sEf(p=>({...p,dId:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,marginTop:2}}><option value="">Seleccionar...</option>{deptos.map((d:any)=>{const ar=areas.find((a:any)=>a.id===d.aId);return <option key={d.id} value={d.id}>{ar?ar.icon+" ":""}{d.name}</option>;})}</select></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:8}}>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>División</label><input value={ef.div} onChange={e=>sEf(p=>({...p,div:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Email</label><input value={ef.mail} onChange={e=>sEf(p=>({...p,mail:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Teléfono</label><input value={ef.tel} onChange={e=>sEf(p=>({...p,tel:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
      </div>
      <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}><Btn v="g" s="s" onClick={()=>sEditing(null)}>Cancelar</Btn><Btn v="p" s="s" onClick={()=>{onEditUser(editing.id,{n:ef.n,a:ef.a,role:ef.role,dId:Number(ef.dId)||editing.dId,div:ef.div,mail:ef.mail,tel:ef.tel});sEditing(null);}}>💾 Guardar</Btn></div>
    </Card>}
    {RK.map(k=>{const l=users.filter((u:any)=>u.role===k);if(!l.length)return null;return(<div key={k} style={{marginBottom:14}}><div style={{fontSize:13,fontWeight:700,color:T.nv,marginBottom:6}}>{ROLES[k].i} {ROLES[k].l} ({l.length})</div>{l.map((u:any)=>{const d=deptos.find((x:any)=>x.id===u.dId),a=d?areas.find((x:any)=>x.id===d.aId):null;return(<Card key={u.id} style={{padding:"9px 12px",marginBottom:4,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:13,fontWeight:600,color:T.nv}}>{fn(u)}</div><div style={{fontSize:10,color:T.g4}}>{a?a.name:""} → {d?d.name:""}{u.div?" · "+u.div:""}</div></div><div style={{display:"flex",gap:4}}>{isAd&&onAssignTask&&<Btn v="g" s="s" onClick={()=>onAssignTask(u)} style={{color:T.bl}}>📋</Btn>}{isAd&&<><Btn v="g" s="s" onClick={()=>{sEditing(u);sEf({n:u.n,a:u.a,role:u.role,dId:String(u.dId),div:u.div||"",mail:u.mail||"",tel:u.tel||""});}}>✏️</Btn>{["superadmin"].indexOf(u.role)<0&&<Btn v="g" s="s" onClick={()=>onDel(u.id)} style={{color:T.rd}}>🗑️</Btn>}</>}</div></Card>);})}</div>);})}
  </div>);
}

/* ── DEPARTAMENTOS ── */
function Depts({areas,deptos,pedidos,users,onSel}:any){
  const [selA,sSelA]=useState<number|null>(null);
  const [selD,sSelD]=useState<number|null>(null);
  const fDeptos=selA?deptos.filter((d:any)=>d.aId===selA):deptos;
  const selDepto=selD?deptos.find((d:any)=>d.id===selD):null;
  const selArea=selDepto?areas.find((a:any)=>a.id===selDepto.aId):null;
  const dPeds=selD?pedidos.filter((p:any)=>p.dId===selD):[];
  if(selD&&selDepto){
    return(<div style={{maxWidth:720}}>
      <Btn v="g" s="s" onClick={()=>sSelD(null)} style={{marginBottom:12}}>← Volver a Departamentos</Btn>
      <TList title={selDepto.name} icon="📂" color={selArea?selArea.color:T.nv} peds={dPeds} users={users} onSel={onSel} search=""/>
    </div>);
  }
  return(<div style={{maxWidth:720}}>
    <h2 style={{margin:"0 0 4px",fontSize:19,color:T.nv,fontWeight:800}}>📂 Departamentos</h2>
    <p style={{color:T.g4,fontSize:12,margin:"0 0 14px"}}>Tareas por departamento</p>
    <div style={{display:"flex",gap:4,marginBottom:14,flexWrap:"wrap" as const}}>
      <Btn v={selA===null?"p":"g"} s="s" onClick={()=>sSelA(null)}>Todas las áreas</Btn>
      {areas.map((a:any)=><Btn key={a.id} v={selA===a.id?"p":"g"} s="s" onClick={()=>sSelA(selA===a.id?null:a.id)}>{a.icon} {a.name}</Btn>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
      {fDeptos.map((d:any)=>{const ar=areas.find((a:any)=>a.id===d.aId);const dp=pedidos.filter((p:any)=>p.dId===d.id);const pe=dp.filter((p:any)=>p.st===ST.P).length,cu=dp.filter((p:any)=>[ST.C,ST.E,ST.V].indexOf(p.st)>=0).length,ok=dp.filter((p:any)=>p.st===ST.OK).length;
        return(<Card key={d.id} onClick={()=>sSelD(d.id)} style={{padding:"14px 16px",cursor:"pointer",borderLeft:"4px solid "+(ar?ar.color:T.nv)}}>
          <div style={{fontSize:13,fontWeight:700,color:T.nv}}>{d.name}</div>
          <div style={{fontSize:10,color:T.g4,marginTop:2}}>{ar?ar.icon+" "+ar.name:""}</div>
          <div style={{display:"flex",gap:8,marginTop:8,fontSize:11}}>
            {pe>0&&<span style={{color:T.rd}}>🔴 {pe}</span>}
            {cu>0&&<span style={{color:T.yl}}>🟡 {cu}</span>}
            {ok>0&&<span style={{color:T.gn}}>🟢 {ok}</span>}
            {dp.length===0&&<span style={{color:T.g4}}>Sin tareas</span>}
          </div>
        </Card>);})}
    </div>
  </div>);
}

/* ── REUNIONES ── */
function Reuniones({agendas,minutas,om,users,areas,onAddAg,onUpdAg,onAddMin,onUpdMin,onCreateTasks,user}:any){
  const [tab,sTab]=useState("cd");const [mode,sMode]=useState("home");const [selId,sSelId]=useState<number|null>(null);
  const [agDate,sAgDate]=useState(TODAY);const [agNotes,sAgNotes]=useState<string[]>([]);const [areaName,sAreaName]=useState("");
  const [miDate,sMiDate]=useState(TODAY);const [miHI,sMiHI]=useState("18:00");const [miHC,sMiHC]=useState("20:00");const [miLugar,sMiLugar]=useState("Club Los Tordos");
  const [miPres,sMiPres]=useState<string[]>([]);const [miSecs,sMiSecs]=useState<string[]>([]);const [miTareas,sMiTareas]=useState<{desc:string;respId:string;fecha:string}[]>([]);const [miAgId,sMiAgId]=useState<number|null>(null);
  const tmpl=AGT[tab];const members=tab==="cd"?om.filter((m:any)=>m.t==="cd"&&m.n):tab==="se"?om.filter((m:any)=>m.t==="se"&&m.n):[];
  const fAg=agendas.filter((a:any)=>a.type===tab);const fMi=minutas.filter((m:any)=>m.type===tab);
  const resetAg=()=>{sAgDate(TODAY);sAgNotes(tmpl.secs.map(()=>""));sAreaName("");};
  const resetMin=()=>{sMiDate(TODAY);sMiHI("18:00");sMiHC("20:00");sMiLugar("Club Los Tordos");sMiPres([]);sMiSecs(MINSECS[tab].map(()=>""));sMiTareas([]);sMiAgId(null);sAreaName("");};
  const startNewAg=()=>{resetAg();sMode("newOD");};const startNewMin=(agId?:number)=>{resetMin();if(agId)sMiAgId(agId);sMode("newMin");};
  const stf=users.filter((u:any)=>["usuario","coordinador","embudo","admin","superadmin","enlace"].indexOf(u.role)>=0);

  /* HOME */
  if(mode==="home") return(<div style={{maxWidth:720}}>
    <h2 style={{margin:"0 0 4px",fontSize:19,color:T.nv,fontWeight:800}}>📅 Reuniones</h2>
    <p style={{color:T.g4,fontSize:12,margin:"0 0 14px"}}>Órdenes del día y minutas institucionales</p>
    <div style={{display:"flex",gap:4,marginBottom:16}}>{Object.keys(AGT).map(k=><Btn key={k} v={tab===k?"p":"g"} s="s" onClick={()=>sTab(k)}>{AGT[k].icon} {AGT[k].title}</Btn>)}</div>
    <Card style={{marginBottom:14,borderLeft:"4px solid "+tmpl.color,padding:"12px 16px"}}>
      <div style={{fontSize:14,fontWeight:700,color:T.nv}}>{tmpl.icon} {tmpl.title}</div>
      <div style={{fontSize:11,color:T.g4}}>Periodicidad: {tmpl.per} · Duración: {tmpl.dur}</div>
    </Card>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>
      <Card style={{padding:"18px 16px",cursor:"pointer",textAlign:"center" as const,border:"2px solid "+T.g2}} onClick={startNewAg}>
        <span style={{fontSize:28}}>📋</span><div style={{fontSize:13,fontWeight:700,color:T.nv,marginTop:6}}>Nueva Orden del Día</div><div style={{fontSize:10,color:T.g4}}>Crear agenda para próxima reunión</div>
      </Card>
      <Card style={{padding:"18px 16px",cursor:"pointer",textAlign:"center" as const,border:"2px solid "+T.g2}} onClick={()=>startNewMin()}>
        <span style={{fontSize:28}}>📝</span><div style={{fontSize:13,fontWeight:700,color:T.nv,marginTop:6}}>Nueva Minuta</div><div style={{fontSize:10,color:T.g4}}>Registrar acta de reunión</div>
      </Card>
    </div>
    <div style={{fontSize:13,fontWeight:700,color:T.nv,marginBottom:8}}>📚 Historial</div>
    {fAg.length===0&&fMi.length===0&&<Card style={{textAlign:"center" as const,padding:24,color:T.g4}}><span style={{fontSize:24}}>📭</span><div style={{marginTop:6,fontSize:12}}>Sin registros aún</div></Card>}
    {fAg.length>0&&<div style={{marginBottom:12}}><div style={{fontSize:11,fontWeight:700,color:T.g4,marginBottom:4}}>📋 ÓRDENES DEL DÍA</div>
      {fAg.map((a:any)=><Card key={a.id} style={{padding:"10px 14px",marginBottom:4,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}} onClick={()=>{sSelId(a.id);sMode("viewOD");}}>
        <div><div style={{fontSize:12,fontWeight:600,color:T.nv}}>📋 Orden del Día – {a.date}{a.areaName?" · "+a.areaName:""}</div><div style={{fontSize:10,color:T.g4}}>{a.status==="enviada"?"✅ Enviada":"📝 Borrador"} · Creada: {a.createdAt}</div></div><span style={{color:T.g4}}>›</span>
      </Card>)}</div>}
    {fMi.length>0&&<div><div style={{fontSize:11,fontWeight:700,color:T.g4,marginBottom:4}}>📝 MINUTAS</div>
      {fMi.map((m:any)=><Card key={m.id} style={{padding:"10px 14px",marginBottom:4,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}} onClick={()=>{sSelId(m.id);sMode("viewMin");}}>
        <div><div style={{fontSize:12,fontWeight:600,color:T.nv}}>📝 Minuta – {m.date}{m.areaName?" · "+m.areaName:""}</div><div style={{fontSize:10,color:T.g4}}>{m.status==="final"?"✅ Finalizada":"📝 Borrador"}{m.tareas?.length?" · 📋 "+m.tareas.length+" tareas":""}</div></div><span style={{color:T.g4}}>›</span>
      </Card>)}</div>}
  </div>);

  /* NUEVA ORDEN DEL DÍA */
  if(mode==="newOD"){
    const notes=agNotes.length===tmpl.secs.length?agNotes:tmpl.secs.map(()=>"");
    return(<div style={{maxWidth:640}}>
      <Btn v="g" s="s" onClick={()=>sMode("home")} style={{marginBottom:12}}>← Volver</Btn>
      <Card>
        <h2 style={{margin:"0 0 14px",fontSize:17,color:T.nv,fontWeight:800}}>📋 Nueva Orden del Día – {tmpl.title}</h2>
        <div style={{padding:8,background:T.g1,borderRadius:8,fontSize:11,color:T.g5,marginBottom:12}}>Periodicidad: {tmpl.per} · Duración: {tmpl.dur}</div>
        <div style={{marginBottom:10}}><label style={{fontSize:12,fontWeight:600,color:T.g5}}>Fecha de reunión</label><input type="date" value={agDate} onChange={e=>sAgDate(e.target.value)} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:3}}/></div>
        {tab==="area"&&<div style={{marginBottom:10}}><label style={{fontSize:12,fontWeight:600,color:T.g5}}>Área / Subcomisión</label><select value={areaName} onChange={e=>sAreaName(e.target.value)} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,marginTop:3}}><option value="">Seleccionar...</option>{areas.filter((a:any)=>a.id!==100&&a.id!==101).map((a:any)=><option key={a.id} value={a.name}>{a.icon} {a.name}</option>)}</select></div>}
        <div style={{fontSize:12,fontWeight:700,color:T.nv,marginBottom:8}}>Estructura del Orden del Día</div>
        {tmpl.secs.map((s:any,i:number)=><div key={i} style={{marginBottom:10,padding:10,background:"#FAFAFA",borderRadius:8,border:"1px solid "+T.g2}}>
          <div style={{fontSize:12,fontWeight:700,color:T.nv,marginBottom:2}}>{i+1}. {s.t}</div>
          {s.sub.length>0&&<div style={{marginBottom:4}}>{s.sub.map((sb:string,j:number)=><div key={j} style={{fontSize:10,color:T.g5,paddingLeft:12}}>• {sb}</div>)}</div>}
          <textarea value={notes[i]||""} onChange={e=>{const n=[...notes];n[i]=e.target.value;sAgNotes(n);}} rows={2} placeholder="Notas adicionales..." style={{width:"100%",padding:6,borderRadius:6,border:"1px solid "+T.g3,fontSize:11,resize:"vertical" as const,boxSizing:"border-box" as const,marginTop:4}}/>
        </div>)}
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:12}}>
          <Btn v="g" onClick={()=>sMode("home")}>Cancelar</Btn>
          <Btn v="p" onClick={()=>{onAddAg({id:0,type:tab,areaName:areaName||undefined,date:agDate,sections:tmpl.secs.map((s:any,i:number)=>({t:s.t,sub:s.sub,notes:notes[i]||""})),status:"borrador",createdAt:TODAY});sMode("home");}}>💾 Guardar borrador</Btn>
          <Btn v="r" onClick={()=>{onAddAg({id:0,type:tab,areaName:areaName||undefined,date:agDate,sections:tmpl.secs.map((s:any,i:number)=>({t:s.t,sub:s.sub,notes:notes[i]||""})),status:"enviada",createdAt:TODAY});sMode("home");}}>📨 Guardar y enviar</Btn>
        </div>
      </Card>
    </div>);
  }

  /* VER ORDEN DEL DÍA */
  if(mode==="viewOD"){
    const ag=agendas.find((a:any)=>a.id===selId);
    if(!ag) return <div><Btn v="g" s="s" onClick={()=>sMode("home")}>← Volver</Btn><p>No encontrada</p></div>;
    return(<div style={{maxWidth:640}}>
      <Btn v="g" s="s" onClick={()=>sMode("home")} style={{marginBottom:12}}>← Volver</Btn>
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:14}}>
          <div><h2 style={{margin:0,fontSize:17,color:T.nv,fontWeight:800}}>📋 Orden del Día{ag.areaName?" – "+ag.areaName:""}</h2><div style={{fontSize:11,color:T.g4,marginTop:2}}>Fecha: {ag.date} · {ag.status==="enviada"?"✅ Enviada":"📝 Borrador"}</div></div>
          <div style={{display:"flex",gap:4}}>{ag.status==="borrador"&&<Btn v="r" s="s" onClick={()=>onUpdAg(ag.id,{status:"enviada"})}>📨 Enviar</Btn>}<Btn v="p" s="s" onClick={()=>startNewMin(ag.id)}>📝 Crear Minuta</Btn></div>
        </div>
        <div style={{borderTop:"2px solid "+T.nv,paddingTop:12}}>
          <div style={{textAlign:"center" as const,marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:700,color:T.g4,textTransform:"uppercase" as const}}>Los Tordos Rugby Club</div>
            <div style={{fontSize:15,fontWeight:800,color:T.nv}}>{AGT[ag.type]?.title}</div>
            <div style={{fontSize:11,color:T.g5}}>Orden del Día – {ag.date}</div>
          </div>
          {(ag.sections||[]).map((s:any,i:number)=><div key={i} style={{marginBottom:8,padding:"8px 10px",background:i%2===0?"#FAFAFA":"#fff",borderRadius:6}}>
            <div style={{fontSize:12,fontWeight:700,color:T.nv}}>{i+1}. {s.t}</div>
            {s.sub&&s.sub.length>0&&s.sub.map((sb:string,j:number)=><div key={j} style={{fontSize:10,color:T.g5,paddingLeft:12}}>• {sb}</div>)}
            {s.notes&&<div style={{fontSize:11,color:T.bl,marginTop:3,fontStyle:"italic",paddingLeft:12}}>💬 {s.notes}</div>}
          </div>)}
        </div>
      </Card>
    </div>);
  }

  /* NUEVA MINUTA */
  if(mode==="newMin"){
    const secVals=miSecs.length===MINSECS[tab].length?miSecs:MINSECS[tab].map(()=>"");
    return(<div style={{maxWidth:640}}>
      <Btn v="g" s="s" onClick={()=>sMode("home")} style={{marginBottom:12}}>← Volver</Btn>
      <Card>
        <h2 style={{margin:"0 0 14px",fontSize:17,color:T.nv,fontWeight:800}}>📝 Nueva Minuta – {tmpl.title}</h2>
        {miAgId&&<div style={{padding:8,background:"#EDE9FE",borderRadius:8,fontSize:11,color:"#5B21B6",marginBottom:12}}>📋 Vinculada a Orden del Día #{miAgId}</div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
          <div><label style={{fontSize:11,fontWeight:600,color:T.g5}}>Fecha</label><input type="date" value={miDate} onChange={e=>sMiDate(e.target.value)} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
          <div><label style={{fontSize:11,fontWeight:600,color:T.g5}}>Lugar</label><input value={miLugar} onChange={e=>sMiLugar(e.target.value)} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
          <div><label style={{fontSize:11,fontWeight:600,color:T.g5}}>Hora inicio</label><input type="time" value={miHI} onChange={e=>sMiHI(e.target.value)} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
          <div><label style={{fontSize:11,fontWeight:600,color:T.g5}}>Hora cierre</label><input type="time" value={miHC} onChange={e=>sMiHC(e.target.value)} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
        </div>
        {tab==="area"&&<div style={{marginBottom:10}}><label style={{fontSize:11,fontWeight:600,color:T.g5}}>Área / Subcomisión</label><select value={areaName} onChange={e=>sAreaName(e.target.value)} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,marginTop:2}}><option value="">Seleccionar...</option>{areas.filter((a:any)=>a.id!==100&&a.id!==101).map((a:any)=><option key={a.id} value={a.name}>{a.icon} {a.name}</option>)}</select></div>}
        {members.length>0&&<div style={{marginBottom:10}}>
          <label style={{fontSize:11,fontWeight:600,color:T.g5,marginBottom:4,display:"block"}}>Presentes</label>
          <div style={{display:"flex",flexWrap:"wrap" as const,gap:4}}>{members.map((m:any)=>{const name=m.n+" "+m.a;const chk=miPres.indexOf(name)>=0;return <label key={m.id} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:16,border:"1px solid "+(chk?T.gn:T.g3),background:chk?"#D1FAE5":"#fff",fontSize:10,cursor:"pointer"}}><input type="checkbox" checked={chk} onChange={()=>{if(chk)sMiPres(p=>p.filter(x=>x!==name));else sMiPres(p=>[...p,name]);}} style={{width:12,height:12}}/><span style={{fontWeight:chk?600:400}}>{m.cargo}: {name}</span></label>;})}</div>
          <div style={{fontSize:10,color:T.g4,marginTop:4}}>Ausentes: {members.filter((m:any)=>miPres.indexOf(m.n+" "+m.a)<0).map((m:any)=>m.n+" "+m.a).join(", ")||"–"}</div>
        </div>}
        <div style={{fontSize:12,fontWeight:700,color:T.nv,marginBottom:8,marginTop:8}}>Contenido</div>
        {MINSECS[tab].map((title:string,i:number)=><div key={i} style={{marginBottom:8}}><label style={{fontSize:11,fontWeight:600,color:T.g5}}>{i+1}. {title}</label><textarea value={secVals[i]||""} onChange={e=>{const n=[...secVals];n[i]=e.target.value;sMiSecs(n);}} rows={3} placeholder={"Completar "+title.toLowerCase()+"..."} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:11,resize:"vertical" as const,boxSizing:"border-box" as const,marginTop:2}}/></div>)}
        <div style={{marginTop:12,padding:12,background:"#FEF3C7",borderRadius:10,border:"1px solid #FDE68A"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><div style={{fontSize:12,fontWeight:700,color:"#92400E"}}>📋 Tareas asignadas</div><Btn v="w" s="s" onClick={()=>sMiTareas(p=>[...p,{desc:"",respId:"",fecha:""}])}>+ Agregar tarea</Btn></div>
          {miTareas.length===0&&<div style={{fontSize:11,color:T.g4,textAlign:"center" as const,padding:8}}>Sin tareas. Se crearán automáticamente al finalizar la minuta.</div>}
          {miTareas.map((t:any,i:number)=><div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto auto auto",gap:6,marginBottom:6,alignItems:"end"}}>
            <div><label style={{fontSize:9,color:T.g5}}>Tarea</label><input value={t.desc} onChange={e=>{const n=[...miTareas];n[i]={...n[i],desc:e.target.value};sMiTareas(n);}} placeholder="Descripción..." style={{width:"100%",padding:6,borderRadius:6,border:"1px solid "+T.g3,fontSize:11,boxSizing:"border-box" as const}}/></div>
            <div><label style={{fontSize:9,color:T.g5}}>Responsable</label><select value={t.respId} onChange={e=>{const n=[...miTareas];n[i]={...n[i],respId:e.target.value};sMiTareas(n);}} style={{padding:6,borderRadius:6,border:"1px solid "+T.g3,fontSize:11}}><option value="">Seleccionar...</option>{stf.map((u:any)=><option key={u.id} value={u.id}>{fn(u)}</option>)}</select></div>
            <div><label style={{fontSize:9,color:T.g5}}>Fecha</label><input type="date" value={t.fecha} onChange={e=>{const n=[...miTareas];n[i]={...n[i],fecha:e.target.value};sMiTareas(n);}} style={{padding:6,borderRadius:6,border:"1px solid "+T.g3,fontSize:11}}/></div>
            <button onClick={()=>sMiTareas(p=>p.filter((_:any,j:number)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:T.rd,padding:"4px"}}>✕</button>
          </div>)}
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:14}}>
          <Btn v="g" onClick={()=>sMode("home")}>Cancelar</Btn>
          <Btn v="p" onClick={()=>{const aus=members.filter((m:any)=>miPres.indexOf(m.n+" "+m.a)<0).map((m:any)=>m.n+" "+m.a);onAddMin({id:0,type:tab,areaName:areaName||undefined,agendaId:miAgId,date:miDate,horaInicio:miHI,horaCierre:miHC,lugar:miLugar,presentes:[...miPres],ausentes:aus,sections:MINSECS[tab].map((t2:string,i2:number)=>({title:t2,content:secVals[i2]||""})),tareas:miTareas.filter((t2:any)=>t2.desc),status:"borrador",createdAt:TODAY});sMode("home");}}>💾 Guardar borrador</Btn>
          <Btn v="r" onClick={()=>{const aus=members.filter((m:any)=>miPres.indexOf(m.n+" "+m.a)<0).map((m:any)=>m.n+" "+m.a);const vt=miTareas.filter((t2:any)=>t2.desc&&t2.respId);onAddMin({id:0,type:tab,areaName:areaName||undefined,agendaId:miAgId,date:miDate,horaInicio:miHI,horaCierre:miHC,lugar:miLugar,presentes:[...miPres],ausentes:aus,sections:MINSECS[tab].map((t2:string,i2:number)=>({title:t2,content:secVals[i2]||""})),tareas:miTareas.filter((t2:any)=>t2.desc),status:"final",createdAt:TODAY});if(vt.length>0)onCreateTasks(vt);sMode("home");}}>✅ Finalizar y crear tareas</Btn>
        </div>
      </Card>
    </div>);
  }

  /* VER MINUTA */
  if(mode==="viewMin"){
    const mi=minutas.find((m:any)=>m.id===selId);
    if(!mi) return <div><Btn v="g" s="s" onClick={()=>sMode("home")}>← Volver</Btn><p>No encontrada</p></div>;
    return(<div style={{maxWidth:640}}>
      <Btn v="g" s="s" onClick={()=>sMode("home")} style={{marginBottom:12}}>← Volver</Btn>
      <Card>
        <div style={{textAlign:"center" as const,borderBottom:"2px solid "+T.nv,paddingBottom:12,marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:700,color:T.g4,textTransform:"uppercase" as const}}>Los Tordos Rugby Club</div>
          <div style={{fontSize:16,fontWeight:800,color:T.nv}}>Minuta – {AGT[mi.type]?.title}{mi.areaName?" · "+mi.areaName:""}</div>
          <div style={{display:"flex",justifyContent:"center",gap:12,marginTop:4,fontSize:11,color:T.g5}}><span>📅 {mi.date}</span>{mi.horaInicio&&<span>🕐 {mi.horaInicio} – {mi.horaCierre}</span>}{mi.lugar&&<span>📍 {mi.lugar}</span>}</div>
          <div style={{marginTop:6}}><span style={{fontSize:10,padding:"2px 10px",borderRadius:12,background:mi.status==="final"?"#D1FAE5":"#FEF3C7",color:mi.status==="final"?"#065F46":"#92400E",fontWeight:600}}>{mi.status==="final"?"✅ Finalizada":"📝 Borrador"}</span></div>
        </div>
        {(mi.presentes?.length>0||mi.ausentes?.length>0)&&<div style={{marginBottom:12,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div><div style={{fontSize:10,fontWeight:700,color:T.gn,marginBottom:2}}>✅ PRESENTES</div>{(mi.presentes||[]).map((p:string,i:number)=><div key={i} style={{fontSize:11,color:T.nv}}>• {p}</div>)}</div>
          <div><div style={{fontSize:10,fontWeight:700,color:T.rd,marginBottom:2}}>❌ AUSENTES</div>{(mi.ausentes||[]).length>0?(mi.ausentes||[]).map((a:string,i:number)=><div key={i} style={{fontSize:11,color:T.g4}}>• {a}</div>):<div style={{fontSize:11,color:T.g4}}>–</div>}</div>
        </div>}
        {(mi.sections||[]).map((s:any,i:number)=><div key={i} style={{marginBottom:10}}><div style={{fontSize:12,fontWeight:700,color:T.nv,borderBottom:"1px solid "+T.g2,paddingBottom:3,marginBottom:4}}>{i+1}. {s.title}</div><div style={{fontSize:11,color:T.g5,paddingLeft:8,whiteSpace:"pre-wrap" as const}}>{s.content||"–"}</div></div>)}
        {mi.tareas&&mi.tareas.length>0&&<div style={{marginTop:10,padding:10,background:"#FEF3C7",borderRadius:8,border:"1px solid #FDE68A"}}>
          <div style={{fontSize:12,fontWeight:700,color:"#92400E",marginBottom:6}}>📋 Tareas asignadas ({mi.tareas.length})</div>
          <table style={{width:"100%",borderCollapse:"collapse" as const,fontSize:11}}><thead><tr style={{background:"#FDE68A"}}>{["Tarea","Responsable","Fecha","Estado"].map((h,i)=><th key={i} style={{padding:"4px 6px",textAlign:"left" as const,fontSize:10}}>{h}</th>)}</tr></thead><tbody>
            {mi.tareas.map((t:any,i:number)=>{const resp=stf.find((u:any)=>u.id===t.respId);return <tr key={i} style={{borderBottom:"1px solid #FDE68A"}}><td style={{padding:"4px 6px"}}>{t.desc}</td><td style={{padding:"4px 6px"}}>{resp?fn(resp):"–"}</td><td style={{padding:"4px 6px"}}>{t.fecha||"–"}</td><td style={{padding:"4px 6px"}}>{mi.status==="final"?<span style={{color:T.gn,fontWeight:600}}>✅ Creada</span>:<span style={{color:T.g4}}>Pendiente</span>}</td></tr>;})}
          </tbody></table>
        </div>}
        {mi.status==="borrador"&&<div style={{display:"flex",gap:4,justifyContent:"flex-end",marginTop:14}}>
          <Btn v="r" onClick={()=>{onUpdMin(mi.id,{status:"final"});const vt=(mi.tareas||[]).filter((t:any)=>t.desc&&t.respId);if(vt.length>0)onCreateTasks(vt);}}>✅ Finalizar y crear tareas</Btn>
        </div>}
      </Card>
    </div>);
  }
  return null;
}

/* ── NOTIFS ── */
function notifs(user:any,peds:any[]){const n:any[]=[];if(["coordinador","admin","superadmin"].indexOf(user.role)>=0){const pp=peds.filter(p=>p.st===ST.P);if(pp.length)n.push({t:"🔴 "+pp.length+" pendientes",c:T.rd});}if(user.role==="embudo"){const ee=peds.filter(p=>p.st===ST.E);if(ee.length)n.push({t:"💰 "+ee.length+" esperando aprobación",c:T.pr});}const myV=peds.filter(p=>p.st===ST.V&&p.cId===user.id);if(myV.length)n.push({t:"🔵 "+myV.length+" esperando validación",c:T.bl});const od=peds.filter(p=>p.st!==ST.OK&&isOD(p.fReq));if(od.length)n.push({t:"⏰ "+od.length+" vencidas",c:"#DC2626"});return n;}

/* ── MAIN APP ── */
export default function App(){
  const [areas]=useState(AREAS);const [deptos]=useState(DEPTOS);
  const [users,sUs]=useState<any[]>([]);const [om,sOm]=useState<any[]>([]);const [peds,sPd]=useState<any[]>([]);const [hitos,sHi]=useState<any[]>([]);const [agendas,sAgs]=useState<any[]>([]);const [minutas,sMins]=useState<any[]>([]);
  const [user,sU]=useState<any>(null);const [authChecked,sAuthChecked]=useState(false);
  const [vw,sVw]=useState("dash");const [sel,sSl]=useState<any>(null);const [aA,sAA]=useState<number|null>(null);const [aD,sAD]=useState<number|null>(null);const [sbCol,sSbCol]=useState(false);const [search,sSr]=useState("");const [shNot,sShNot]=useState(false);const [preAT,sPreAT]=useState<any>(null);const [showPw,sShowPw]=useState(false);

  /* ── Fetch all data from Supabase ── */
  const fetchAll = useCallback(async()=>{
    const [pRes,mRes,omRes,msRes,agRes,miRes]=await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("tasks").select("*").order("id",{ascending:false}),
      supabase.from("org_members").select("*"),
      supabase.from("milestones").select("*").order("id"),
      supabase.from("agendas").select("*").order("id",{ascending:false}),
      supabase.from("minutas").select("*").order("id",{ascending:false}),
    ]);
    if(pRes.data) sUs(pRes.data.map((p:any)=>profileToUser(p)));
    if(omRes.data) sOm(omRes.data.map((m:any)=>({id:m.id,t:m.type,cargo:m.cargo,n:m.first_name,a:m.last_name,mail:m.email,tel:m.phone})));
    if(msRes.data) sHi(msRes.data.map((h:any)=>({id:h.id,fase:h.phase,name:h.name,periodo:h.period,pct:h.pct,color:h.color})));
    if(agRes.data) sAgs(agRes.data.map((a:any)=>({id:a.id,type:a.type,areaName:a.area_name,date:a.date,sections:a.sections,status:a.status,createdAt:a.created_at})));
    if(miRes.data) sMins(miRes.data.map((m:any)=>({id:m.id,type:m.type,areaName:m.area_name,agendaId:m.agenda_id,date:m.date,horaInicio:m.hora_inicio,horaCierre:m.hora_cierre,lugar:m.lugar,presentes:m.presentes,ausentes:m.ausentes,sections:m.sections,tareas:m.tareas,status:m.status,createdAt:m.created_at})));
    // Tasks + messages
    if(mRes.data){
      const tmRes=await supabase.from("task_messages").select("*").order("created_at");
      const msgs:any[]=tmRes.data||[];
      sPd(mRes.data.map((t:any)=>{
        const tMsgs=msgs.filter((m:any)=>m.task_id===t.id).map((m:any)=>({dt:m.created_at||"",uid:m.user_id,by:m.user_name,act:m.content,t:m.type}));
        return{id:t.id,div:t.division,cId:t.creator_id,cN:t.creator_name,dId:t.dept_id,tipo:t.tipo,desc:t.description,fReq:t.due_date,urg:t.urgency,st:t.status,asTo:t.assigned_to,rG:t.requires_expense,eOk:t.expense_ok,resp:t.resolution,cAt:t.created_at,monto:t.amount,log:tMsgs};
      }));
    }
  },[]);

  /* ── Check existing session on mount ── */
  useEffect(()=>{
    (async()=>{
      const{data:{session}}=await supabase.auth.getSession();
      if(session?.user){
        const{data:profile}=await supabase.from("profiles").select("*").eq("id",session.user.id).single();
        if(profile) sU(profileToUser(profile));
      }
      sAuthChecked(true);
    })();
  },[]);

  /* ── Fetch data when user logs in ── */
  useEffect(()=>{if(user) fetchAll();},[user,fetchAll]);

  const out=async()=>{await supabase.auth.signOut();sU(null);sVw("dash");sSl(null);sAA(null);sAD(null);sSr("");sPd([]);sUs([]);sOm([]);sHi([]);sAgs([]);sMins([]);};
  const isAd=user&&(user.role==="admin"||user.role==="superadmin");
  const isSA=user&&user.role==="superadmin";
  const isPersonal=user&&(user.role==="enlace"||user.role==="manager"||user.role==="usuario");

  if(!authChecked) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:T.g1}}><div style={{fontSize:14,color:T.g4}}>Cargando...</div></div>;
  if(!user) return <Login onLogin={(u:any)=>sU(u)}/>;

  const nts=notifs(user,peds);
  const hAC=(id:number)=>{sAA(aA===id?null:id);sAD(null);sVw("dash");};
  const hDC=(id:number)=>sAD(aD===id?null:id);

  let vT="",vI="",vC=T.nv,vP=peds;
  if(aD){const dd=deptos.find(x=>x.id===aD),aar=dd?areas.find(x=>x.id===dd.aId):null;vT=dd?dd.name:"";vI="📂";vC=aar?aar.color:T.nv;vP=peds.filter(p=>p.dId===aD);}
  else if(aA){const aar2=areas.find(x=>x.id===aA),ids2=deptos.filter(d=>d.aId===aA).map(d=>d.id);vT=aar2?aar2.name:"";vI=aar2?aar2.icon:"";vC=aar2?aar2.color:T.nv;vP=peds.filter(p=>ids2.indexOf(p.dId)>=0);}

  let nav:any[]=[];
  if(isPersonal){nav=[{k:"my",l:"Mis Tareas",sh:true},{k:"new",l:"+ Tarea",sh:true},{k:"org",l:"Organigrama",sh:true},{k:"profs",l:"Perfiles",sh:true},{k:"proy",l:"Plan 2035",sh:true}];}
  else{nav=[{k:"dash",l:"Dashboard",sh:true},{k:"org",l:"Organigrama",sh:true},{k:"dept",l:"Departamentos",sh:true},...(isSA?[{k:"reun",l:"📅 Reuniones",sh:true}]:[]),{k:"proy",l:"Plan 2035",sh:true},{k:"profs",l:"Perfiles",sh:true},{k:"new",l:"+ Tarea",sh:true}];}

  /* ── addLog: optimistic local + persist to Supabase ── */
  const addLog=async(id:number,uid:string,by:string,act:string,t?:string)=>{
    const ts=TODAY+" "+new Date().toTimeString().slice(0,5);
    const tp=t||"sys";
    sPd(p=>p.map(x=>x.id===id?{...x,log:[...(x.log||[]),{dt:ts,uid,by,act,t:tp}]}:x));
    await supabase.from("task_messages").insert({task_id:id,user_id:uid,user_name:by,content:act,type:tp});
  };

  if(isPersonal&&vw==="dash") { setTimeout(()=>sVw("my"),0); return null; }

  return(
    <div style={{display:"flex",minHeight:"100vh",background:T.g1,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <SB areas={areas} deptos={deptos} pedidos={peds} aA={aA} aD={aD} onAC={hAC} onDC={hDC} col={sbCol} onCol={()=>sSbCol(!sbCol)} isPersonal={isPersonal}/>
      <div style={{flex:1,display:"flex",flexDirection:"column" as const,minWidth:0}}>
        <div style={{background:"#fff",borderBottom:"1px solid "+T.g2,padding:"0 14px",display:"flex",justifyContent:"space-between",alignItems:"center",height:48}}>
          <div style={{display:"flex",gap:1,overflowX:"auto" as const,alignItems:"center"}}>{nav.filter(n=>n.sh).map(n=><button key={n.k} onClick={()=>{sVw(n.k);if(n.k==="dash"||n.k==="my"){sAA(null);sAD(null);}}} style={{padding:"6px 11px",border:"none",borderRadius:7,background:vw===n.k?T.nv:"transparent",color:vw===n.k?"#fff":T.g5,fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap" as const}}>{n.l}</button>)}</div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
            <div style={{position:"relative" as const}}><input value={search} onChange={e=>sSr(e.target.value)} placeholder="🔍 Buscar..." style={{padding:"5px 10px",borderRadius:8,border:"1px solid "+T.g3,fontSize:11,width:130}}/></div>
            <div style={{position:"relative" as const}}><button onClick={()=>sShNot(!shNot)} style={{background:"none",border:"none",fontSize:16,cursor:"pointer",position:"relative" as const}}>🔔{nts.length>0&&<span style={{position:"absolute" as const,top:-4,right:-4,width:14,height:14,borderRadius:7,background:T.rd,color:"#fff",fontSize:8,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{nts.length}</span>}</button>{shNot&&<div style={{position:"absolute" as const,right:0,top:32,background:"#fff",borderRadius:10,boxShadow:"0 4px 16px rgba(0,0,0,.12)",border:"1px solid "+T.g2,width:260,zIndex:100,padding:8}}><div style={{fontSize:11,fontWeight:700,color:T.nv,marginBottom:6}}>Notificaciones</div>{nts.length===0&&<div style={{fontSize:11,color:T.g4,padding:8}}>Todo al día ✅</div>}{nts.map((n,i)=><div key={i} style={{padding:"6px 8px",borderRadius:6,background:n.c+"10",marginBottom:3,fontSize:11,color:n.c,fontWeight:600}}>{n.t}</div>)}</div>}</div>
            <div style={{textAlign:"right" as const}}><div style={{fontSize:11,fontWeight:700,color:T.nv}}>{fn(user)}</div><div style={{fontSize:9,color:T.g4}}>{ROLES[user.role]?.i} {ROLES[user.role]?.l}{user.div?" · "+user.div:""}</div></div>
            <button onClick={()=>sShowPw(true)} title="Cambiar contraseña" style={{width:28,height:28,borderRadius:7,border:"1px solid "+T.g2,background:"#fff",cursor:"pointer",fontSize:12}}>🔒</button>
            <button onClick={out} style={{width:28,height:28,borderRadius:7,border:"1px solid "+T.g2,background:"#fff",cursor:"pointer",fontSize:12}}>↩</button>
          </div>
        </div>
        <div style={{flex:1,padding:"20px 16px",overflowY:"auto" as const,marginTop:4}}>
          {vw==="my"&&isPersonal&&<MyDash user={user} peds={peds} users={users} onSel={(p:any)=>sSl(p)}/>}
          {vw==="org"&&<Org areas={areas} deptos={deptos} users={users} om={om} onEditSave={async(id:string,d:any)=>{sOm(p=>p.map(m=>m.id===id?{...m,...d}:m));await supabase.from("org_members").update({first_name:d.n,last_name:d.a,email:d.mail||"",phone:d.tel||""}).eq("id",id);}} onDelOm={async(id:string)=>{sOm(p=>p.filter(m=>m.id!==id));await supabase.from("org_members").delete().eq("id",id);}} onDelUser={async(id:string)=>{sUs(p=>p.filter(u=>u.id!==id));await supabase.from("profiles").delete().eq("id",id);}} onEditUser={(u:any)=>{sVw("profs");}} isSA={isSA}/>}
          {vw==="dept"&&<Depts areas={areas} deptos={deptos} pedidos={peds} users={users} onSel={(p:any)=>sSl(p)}/>}
          {vw==="reun"&&isSA&&<Reuniones agendas={agendas} minutas={minutas} om={om} users={users} areas={areas} user={user}
            onAddAg={async(a:any)=>{const{data}=await supabase.from("agendas").insert({type:a.type,area_name:a.areaName||null,date:a.date,sections:a.sections,status:a.status,created_at:a.createdAt||TODAY}).select().single();if(data)sAgs(p=>[{...a,id:data.id},...p]);else sAgs(p=>[a,...p]);}}
            onUpdAg={async(id:number,d:any)=>{sAgs(p=>p.map(a=>a.id===id?{...a,...d}:a));await supabase.from("agendas").update(d).eq("id",id);}}
            onAddMin={async(m:any)=>{const{data}=await supabase.from("minutas").insert({type:m.type,area_name:m.areaName||null,agenda_id:m.agendaId||null,date:m.date,hora_inicio:m.horaInicio,hora_cierre:m.horaCierre,lugar:m.lugar,presentes:m.presentes,ausentes:m.ausentes,sections:m.sections,tareas:m.tareas,status:m.status,created_at:m.createdAt||TODAY}).select().single();if(data)sMins(p=>[{...m,id:data.id},...p]);else sMins(p=>[m,...p]);}}
            onUpdMin={async(id:number,d:any)=>{sMins(p=>p.map(m=>m.id===id?{...m,...d}:m));const upd:any={};if(d.status)upd.status=d.status;await supabase.from("minutas").update(upd).eq("id",id);}}
            onCreateTasks={async(tareas:any[])=>{const ts=TODAY+" "+new Date().toTimeString().slice(0,5);const newTasks:any[]=[];for(const t of tareas){const resp=users.find((u:any)=>u.id===t.respId);const row:any={division:"",creator_id:user.id,creator_name:fn(user),dept_id:resp?.dId||1,tipo:"Administrativo",description:t.desc,due_date:t.fecha||"",urgency:"Normal",status:"curso",assigned_to:t.respId||null,requires_expense:false,expense_ok:null,resolution:"",created_at:TODAY,amount:null};const{data}=await supabase.from("tasks").insert(row).select().single();const tid=data?.id||0;if(tid){await supabase.from("task_messages").insert([{task_id:tid,user_id:user.id,user_name:fn(user),content:"Creó tarea desde minuta",type:"sys"},{task_id:tid,user_id:user.id,user_name:fn(user),content:"Asignó a "+(resp?fn(resp):""),type:"sys"}]);newTasks.push({id:tid,div:"",cId:user.id,cN:fn(user),dId:resp?.dId||1,tipo:"Administrativo",desc:t.desc,fReq:t.fecha||"",urg:"Normal",st:ST.C,asTo:t.respId,rG:false,eOk:null,resp:"",cAt:TODAY,monto:null,log:[{dt:ts,uid:user.id,by:fn(user),act:"Creó tarea desde minuta",t:"sys"},{dt:ts,uid:user.id,by:fn(user),act:"Asignó a "+(resp?fn(resp):""),t:"sys"}]});}}sPd(p=>[...newTasks,...p]);}}
          />}
          {vw==="profs"&&<Profs users={users} deptos={deptos} areas={areas} onDel={async(id:string)=>{sUs(p=>p.filter(u=>u.id!==id));await supabase.from("profiles").delete().eq("id",id);}} onAdd={async(u:any)=>{
            const{data:{session}}=await supabase.auth.getSession();const tok=session?.access_token;
            if(!tok||!u.mail){sUs(p=>[...p,u]);return;}
            const res=await fetch("/api/admin/create-user",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+tok},body:JSON.stringify({email:u.mail,first_name:u.n,last_name:u.a,role:u.role,dept_id:u.dId,division:u.div,phone:u.tel})});
            const json=await res.json();if(json.user){sUs(p=>[...p,{...u,id:json.user.id}]);}else{sUs(p=>[...p,u]);}
          }} onEditUser={async(id:string,d:any)=>{
            const oldUser=users.find(u=>u.id===id);
            sUs(p=>p.map(u=>u.id===id?{...u,...d}:u));
            await supabase.from("profiles").update({first_name:d.n,last_name:d.a,role:d.role,dept_id:d.dId,division:d.div,email:d.mail||"",phone:d.tel||""}).eq("id",id);
            if(d.mail&&oldUser&&d.mail!==oldUser.mail){const{data:{session}}=await supabase.auth.getSession();const tok=session?.access_token;if(tok)await fetch("/api/admin/create-user",{method:"PUT",headers:{"Content-Type":"application/json","Authorization":"Bearer "+tok},body:JSON.stringify({userId:id,email:d.mail})});}
          }} isAd={isAd} onAssignTask={(u:any)=>{sPreAT(u);sVw("new");}}/>}
          {vw==="new"&&<NP user={user} users={users} deptos={deptos} areas={areas} preAssign={preAT} onSub={async(p:any)=>{
            const row:any=taskToDB(p);
            const{data}=await supabase.from("tasks").insert(row).select().single();
            const tid=data?.id||p.id;
            const localP={...p,id:tid};
            sPd(ps=>[localP,...ps]);
            // Persist log entries
            for(const l of (p.log||[])){await supabase.from("task_messages").insert({task_id:tid,user_id:l.uid,user_name:l.by,content:l.act,type:l.t});}
            sPreAT(null);sVw(isPersonal?"my":"dash");sAA(null);sAD(null);
          }} onX={()=>{sPreAT(null);sVw(isPersonal?"my":"dash");}}/>}
          {vw==="proy"&&<Proyecto hitos={hitos} setHitos={(updater:any)=>{sHi((prev:any)=>{const next=typeof updater==="function"?updater(prev):updater;next.forEach((h:any)=>{supabase.from("milestones").update({pct:h.pct}).eq("id",h.id);});return next;});}} isAd={isAd}/>}
          {vw==="dash"&&!isPersonal&&!aA&&!aD&&<><h2 style={{margin:"0 0 4px",fontSize:19,color:T.nv,fontWeight:800}}>Dashboard</h2><p style={{color:T.g4,fontSize:12,margin:"0 0 16px"}}>KPIs institucionales · Manual Operativo 2035</p><KPIs peds={peds}/><Circles areas={areas} deptos={deptos} pedidos={peds} onAC={hAC}/></>}
          {vw==="dash"&&!isPersonal&&(aA||aD)&&<div><Btn v="g" s="s" onClick={()=>{if(aD)sAD(null);else sAA(null);}} style={{marginBottom:12}}>← {aD?"Volver al área":"Dashboard"}</Btn><TList title={vT} icon={vI} color={vC} peds={vP} users={users} onSel={(p:any)=>sSl(p)} search={search}/></div>}
        </div>
      </div>
      {showPw&&<ChangePw onX={()=>sShowPw(false)}/>}
      {sel&&<Det p={peds.find(x=>x.id===sel.id)||sel} user={user} users={users} onX={()=>sSl(null)}
        onTk={async(id:number)=>{sPd(p=>p.map(x=>x.id===id?{...x,asTo:user.id,st:ST.C}:x));await supabase.from("tasks").update({assigned_to:user.id,status:ST.C}).eq("id",id);addLog(id,user.id,fn(user),"Tomó la tarea","sys");}}
        onAs={async(id:number,uid:string)=>{const ag=users.find(u=>u.id===uid);const newSt=peds.find(x=>x.id===id)?.st===ST.P?ST.C:peds.find(x=>x.id===id)?.st;sPd(p=>p.map(x=>x.id===id?{...x,asTo:uid,st:x.st===ST.P?ST.C:x.st}:x));await supabase.from("tasks").update({assigned_to:uid,status:newSt}).eq("id",id);addLog(id,user.id,fn(user),"Asignó a "+(ag?fn(ag):""),"sys");}}
        onRe={async(id:number,r:string)=>{sPd(p=>p.map(x=>x.id===id?{...x,resp:r}:x));await supabase.from("tasks").update({resolution:r}).eq("id",id);}}
        onSE={async(id:number)=>{sPd(p=>p.map(x=>x.id===id?{...x,st:ST.E}:x));await supabase.from("tasks").update({status:ST.E}).eq("id",id);addLog(id,user.id,fn(user),"Envió a Compras","sys");sSl(null);}}
        onEO={async(id:number,ok:boolean)=>{sPd(p=>p.map(x=>x.id===id?{...x,st:ST.C,eOk:ok}:x));await supabase.from("tasks").update({status:ST.C,expense_ok:ok}).eq("id",id);addLog(id,user.id,fn(user),ok?"Compras aprobó":"Compras rechazó","sys");sSl(null);}}
        onFi={async(id:number)=>{sPd(p=>p.map(x=>x.id===id?{...x,st:ST.V}:x));await supabase.from("tasks").update({status:ST.V}).eq("id",id);addLog(id,user.id,fn(user),"Envió a validación","sys");sSl(null);}}
        onVa={async(id:number,ok:boolean)=>{const ns=ok?ST.OK:ST.C;sPd(p=>p.map(x=>x.id===id?{...x,st:ns}:x));await supabase.from("tasks").update({status:ns}).eq("id",id);addLog(id,user.id,fn(user),ok?"Validó OK ✅":"Rechazó","sys");sSl(null);}}
        onMsg={async(id:number,txt:string)=>{await addLog(id,user.id,fn(user),txt,"msg");}}
        onMonto={async(id:number,m:number)=>{sPd(p=>p.map(x=>x.id===id?{...x,monto:m}:x));await supabase.from("tasks").update({amount:m}).eq("id",id);}}
        onDel={async(id:number)=>{sPd(p=>p.filter(x=>x.id!==id));await supabase.from("tasks").delete().eq("id",id);sSl(null);}}
        onEditSave={async(id:number,d:any)=>{sPd(p=>p.map(x=>x.id===id?{...x,...d}:x));await supabase.from("tasks").update({tipo:d.tipo,description:d.desc,due_date:d.fReq,urgency:d.urg,division:d.div||"",requires_expense:d.rG}).eq("id",id);addLog(id,user.id,fn(user),"Editó la tarea (Super Admin)","sys");}}
      />}
    </div>
  );
}