"use client";
import { useState, useEffect } from "react";
import { T, ROLES, ST, SC, PSC, PST, TIPOS, MONEDAS, fn, isOD } from "@/lib/constants";
import { rlv } from "@/lib/mappers";
import { Btn, FileField, Badge, PBadge, UserPicker } from "@/components/ui";
import { useC } from "@/lib/theme-context";
import { Thread } from "./Thread";
import { useDataStore } from "@/lib/store";

const TODAY = new Date().toISOString().slice(0,10);

export function Det({p,user,onX,onTk,onAs,onRe,onSE,onEO,onFi,onVa,onMsg,onMonto,onDel,onEditSave,onAddPresu,onUpdPresu,onDelPresu,onDup,onCheck,mob}:any){
  const users = useDataStore(s => s.users);
  const presu = useDataStore(s => s.presu);
  const provs = useDataStore(s => s.provs);
  const sponsors = useDataStore(s => s.sponsors);
  const {colors,isDark,cardBg}=useC();
  const [at,sAt]=useState("");const [mt,sMt]=useState(p.monto||"");const [tab,sTab]=useState("chat");const [rp,sRp]=useState(p.resp||"");
  const [editing,sEditing]=useState(false);const [ef,sEf]=useState({tipo:p.tipo,desc:p.desc,fReq:p.fReq,urg:p.urg,div:p.div||"",rG:p.rG});
  /* Checklist state (Feature 6) */
  const checkLogs=(p.log||[]).filter((l:any)=>l.t==="check");
  const [chkItems,sChkItems]=useState<{text:string;done:boolean}[]>(checkLogs.map((l:any)=>{try{return JSON.parse(l.act);}catch{return{text:l.act,done:false};}}).filter(Boolean));
  const [newChk,sNewChk]=useState("");
  const chkPct=chkItems.length?Math.round(chkItems.filter(c=>c.done).length/chkItems.length*100):0;
  const ag=users.find((u:any)=>u.id===p.asTo),isCo=rlv(user.role)>=3,isEm=user.role==="embudo",isM=p.asTo===user.id,isCr=p.cId===user.id;
  const isSA=user.role==="superadmin";
  const canT=rlv(user.role)>=2&&rlv(user.role)<=4&&p.st===ST.P;
  const stf=users.filter((u:any)=>rlv(u.role)>=2);
  const od=p.st!==ST.OK&&isOD(p.fReq);
  const msgs=(p.log||[]).filter((l:any)=>l.t==="msg").length;
  /* presupuestos for this task */
  const tPresu=(presu||[]).filter((pr:any)=>pr.task_id===p.id);
  const canManagePresu=true;
  const canChangeStatus=isSA||user.role==="admin"||user.role==="embudo";
  const [prSub,sPrSub]=useState("list");const [prSel,sPrSel]=useState<number[]>([]);
  const [pf,sPf]=useState({prov_id:"",prov_nombre:"",prov_contacto:"",descripcion:"",monto:"",moneda:"ARS",archivo_url:"",notas:""});
  const [provSearch,sProvSearch]=useState("");

  useEffect(()=>{const h=(e:KeyboardEvent)=>{if(e.key==="Escape")onX();};document.addEventListener("keydown",h);return()=>document.removeEventListener("keydown",h);},[onX]);
  useEffect(()=>{document.body.style.overflow="hidden";return()=>{document.body.style.overflow="";};},[]);

  return(<div role="dialog" aria-modal="true" style={{position:"fixed" as const,inset:0,background:"rgba(10,22,40,.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:mob?0:12}} onClick={onX}>
    <div onClick={(e:any)=>e.stopPropagation()} style={{background:cardBg,borderRadius:mob?0:14,maxWidth:mob?undefined:640,width:"100%",height:mob?"100vh":"85vh",display:"flex",flexDirection:"column" as const,overflow:"hidden"}}>
      <div style={{padding:"16px 20px 12px",borderBottom:"1px solid "+colors.g2,flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
          <div><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:10,color:colors.g4}}>#{p.id}</span><Badge s={p.st} sm/>{od&&<span style={{fontSize:10,color:"#DC2626",fontWeight:700}}>⏰ VENCIDA</span>}{p.urg==="Urgente"&&<span style={{fontSize:10,color:colors.rd,fontWeight:700}}>🔥 URGENTE</span>}</div><h2 style={{margin:"4px 0 0",fontSize:15,color:colors.nv,fontWeight:800}}>{p.tipo}: {p.desc.slice(0,60)}</h2></div>
          <div style={{display:"flex",gap:4,alignItems:"center"}}>{rlv(user.role)>=4&&<Btn v="g" s="s" onClick={()=>{sEditing(true);sTab("edit");}} title="Editar tarea">✏️</Btn>}{onDup&&rlv(user.role)>=3&&<Btn v="g" s="s" onClick={()=>onDup(p)} title="Duplicar tarea">📋</Btn>}{isSA&&<Btn v="g" s="s" onClick={()=>{if(confirm("¿Eliminar esta tarea?")){onDel(p.id);onX();}}} style={{color:colors.rd}} title="Eliminar tarea">🗑️</Btn>}<button onClick={onX} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:colors.g4}} title="Cerrar">✕</button></div>
        </div>
        <div style={{display:"flex",gap:12,marginTop:8,flexWrap:"wrap" as const,fontSize:11,color:colors.g5}}>
          <span>📍 {p.div||"General"}</span><span>👤 {p.cN}</span>{ag&&<span>⚙️ {fn(ag)}</span>}<span>📅 {p.fReq}</span>{p.monto&&<span style={{color:colors.pr,fontWeight:700}}>💰 ${p.monto.toLocaleString()}</span>}
        </div>
        <div style={{display:"flex",gap:mob?2:4,marginTop:10,flexWrap:"wrap" as const}}>
          {[{k:"chat",l:"💬 Chat ("+msgs+")"},{k:"info",l:"📋 Detalle"},{k:"acc",l:"⚡ Acciones"},{k:"check",l:"☑️ ("+(chkItems.filter(c=>c.done).length)+"/"+chkItems.length+")"},{k:"presu",l:"💰 Presu ("+tPresu.length+")"},...(editing?[{k:"edit",l:"✏️ Editar"}]:[])].map(t=><button key={t.k} onClick={()=>sTab(t.k)} style={{padding:mob?"8px 10px":"5px 12px",borderRadius:6,border:"none",background:tab===t.k?colors.nv:"transparent",color:tab===t.k?"#fff":colors.g5,fontSize:mob?12:11,fontWeight:600,cursor:"pointer",minHeight:mob?40:undefined}}>{t.l}</button>)}
        </div>
      </div>
      <div style={{flex:1,padding:"12px 20px",overflow:"auto",display:"flex",flexDirection:"column" as const}}>
        {tab==="chat"&&<Thread log={p.log} userId={user.id} onSend={(txt:string)=>onMsg(p.id,txt)} users={users}/>}
        {tab==="edit"&&rlv(user.role)>=4&&<div style={{display:"flex",flexDirection:"column" as const,gap:10}}>
          <div style={{padding:10,background:"#FFFBEB",borderRadius:8,border:"1px solid #FDE68A"}}><span style={{fontSize:11,fontWeight:700,color:"#92400E"}}>👑 Edición Administrativa</span></div>
          <div><label style={{fontSize:11,fontWeight:600,color:colors.g5}}>Tipo</label><div style={{display:"flex",flexWrap:"wrap" as const,gap:mob?6:4,marginTop:3}}>{TIPOS.map(t=><button key={t} onClick={()=>sEf(prev=>({...prev,tipo:t}))} style={{padding:mob?"8px 14px":"4px 10px",borderRadius:16,fontSize:mob?12:10,border:ef.tipo===t?"2px solid "+colors.nv:"1px solid "+colors.g3,background:ef.tipo===t?colors.nv:(isDark?"#1E293B":"#fff"),color:ef.tipo===t?"#fff":colors.g5,cursor:"pointer",minHeight:mob?40:undefined}}>{t}</button>)}</div></div>
          <div><label style={{fontSize:11,fontWeight:600,color:colors.g5}}>Descripción</label><textarea value={ef.desc} onChange={e=>sEf(prev=>({...prev,desc:e.target.value}))} rows={3} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,resize:"vertical" as const,boxSizing:"border-box" as const,marginTop:3}}/></div>
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8}}>
            <div><label style={{fontSize:11,fontWeight:600,color:colors.g5}}>División</label><input value={ef.div} onChange={e=>sEf(prev=>({...prev,div:e.target.value}))} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:3}}/></div>
            <div><label style={{fontSize:11,fontWeight:600,color:colors.g5}}>Fecha límite</label><input type="date" value={ef.fReq} onChange={e=>sEf(prev=>({...prev,fReq:e.target.value}))} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:3}}/></div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}><label style={{fontSize:11,fontWeight:600,color:colors.g5}}>Urgencia:</label>{["Normal","Urgente"].map(u=><button key={u} onClick={()=>sEf(prev=>({...prev,urg:u}))} style={{padding:"4px 12px",borderRadius:8,fontSize:11,border:ef.urg===u?"2px solid "+colors.nv:"1px solid "+colors.g3,background:ef.urg===u?colors.nv+"15":"#fff",color:ef.urg===u?colors.nv:colors.g4,cursor:"pointer"}}>{u}</button>)}<label style={{display:"flex",alignItems:"center",gap:4,fontSize:11,cursor:"pointer",marginLeft:8}}><input type="checkbox" checked={ef.rG} onChange={e=>sEf(prev=>({...prev,rG:e.target.checked}))}/><span style={{fontWeight:600,color:colors.g5}}>Requiere gasto</span></label></div>
          <div style={{display:"flex",gap:4,justifyContent:"flex-end",marginTop:4}}><Btn v="g" onClick={()=>{sEditing(false);sTab("info");}}>Cancelar</Btn><Btn v="p" onClick={()=>{onEditSave(p.id,ef);sEditing(false);sTab("info");}}>💾 Guardar cambios</Btn></div>
        </div>}
        {tab==="info"&&<div>
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:10,marginBottom:12}}>
            {[["DIVISIÓN",p.div||"–"],["SOLICITANTE",p.cN],["TIPO",p.tipo],["URGENCIA",p.urg],["FECHA LÍMITE",p.fReq],["CREADO",p.cAt],["REQUIERE GASTO",p.rG?"Sí 💰":"No"],["MONTO",p.monto?"$"+p.monto.toLocaleString():"–"]].map(([l,v],i)=>
              <div key={i}><div style={{fontSize:9,color:colors.g4,fontWeight:700}}>{l}</div><div style={{fontSize:12,color:colors.nv}}>{v}</div></div>
            )}
          </div>
          {ag&&<div style={{padding:8,background:colors.g1,borderRadius:8,marginBottom:8}}><div style={{fontSize:9,color:colors.g4,fontWeight:700}}>ASIGNADO A</div><div style={{fontSize:12,fontWeight:600,color:colors.nv}}>👤 {fn(ag)}</div></div>}
          <div style={{fontSize:10,fontWeight:700,color:colors.g4,marginTop:8,marginBottom:4}}>HISTORIAL</div>
          {(p.log||[]).slice().reverse().map((l:any,i:number)=>(<div key={i} style={{display:"flex",gap:8,padding:"6px 0",borderBottom:"1px solid "+colors.g1}}><div style={{width:6,height:6,borderRadius:3,background:l.t==="sys"?colors.bl:colors.gn,marginTop:5,flexShrink:0}}/><div><div style={{fontSize:10,color:colors.g4}}>{l.dt} · {l.by}</div><div style={{fontSize:11,color:colors.nv}}>{l.act}</div></div></div>))}
        </div>}
        {tab==="acc"&&<div style={{display:"flex",flexDirection:"column" as const,gap:8}}>
          {p.st===ST.OK&&<div style={{padding:16,background:"#D1FAE5",borderRadius:10,textAlign:"center" as const}}><span style={{fontSize:24}}>✅</span><div style={{fontSize:14,fontWeight:700,color:"#065F46",marginTop:4}}>Tarea Completada</div></div>}
          {canT&&<Btn v="w" onClick={()=>{onTk(p.id);onX();}}>🙋 Tomar esta tarea</Btn>}
          {isCo&&(p.st===ST.P||p.st===ST.C)&&<div><div style={{fontSize:11,fontWeight:600,color:colors.g5,marginBottom:4}}>Asignar a:</div><div style={{display:"flex",gap:4}}><UserPicker users={stf} value={at} onChange={(id)=>sAt(id)} placeholder="Buscar persona..." labelFn={(u:any)=>fn(u)+" ("+((ROLES[u.role]||{}).l||"")+")"}  style={{flex:1}}/><Btn disabled={!at} onClick={()=>{onAs(p.id,at);onX();}}>Asignar</Btn></div></div>}
          {(isM||isSA)&&p.st===ST.C&&<div style={{display:"flex",flexDirection:"column" as const,gap:6}}>
            <textarea value={rp} onChange={(e:any)=>sRp(e.target.value)} rows={2} placeholder="Resolución..." style={{padding:8,borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,resize:"vertical" as const}}/>
            {p.rG&&!p.eOk&&<div><label style={{fontSize:11,color:colors.g5}}>Monto ($)</label><input type="number" value={mt} onChange={(e:any)=>sMt(e.target.value)} style={{width:mob?"100%":160,padding:mob?"10px 10px":"6px 8px",borderRadius:6,border:"1px solid "+colors.g3,fontSize:mob?14:12,marginLeft:mob?0:6,marginTop:mob?4:0,boxSizing:"border-box" as const,minHeight:mob?44:undefined}}/></div>}
            <div style={{display:"flex",gap:4,flexWrap:"wrap" as const}}>
              <Btn v="g" s="s" onClick={()=>onRe(p.id,rp)}>💾 Guardar</Btn>
              {p.rG&&!p.eOk&&<Btn v="pu" s="s" onClick={()=>{if(mt)onMonto(p.id,Number(mt));onRe(p.id,rp);onSE(p.id);}}>💰 Enviar a Compras</Btn>}
              <Btn v="s" s="s" onClick={()=>{onRe(p.id,rp);onFi(p.id);}} disabled={!rp.trim()||(p.rG&&!p.eOk)}>✅ Terminado</Btn>
            </div>
          </div>}
          {isSA&&p.st!==ST.C&&p.st!==ST.OK&&<div style={{display:"flex",gap:4,flexWrap:"wrap" as const}}>
            {p.st===ST.P&&<Btn v="w" s="s" onClick={()=>{onTk(p.id);onX();}}>🙋 Tomar tarea</Btn>}
            {p.st===ST.E&&(()=>{const cp=tPresu.find((pr:any)=>pr.is_canje);return<><Btn v="s" s="s" onClick={()=>onEO(p.id,true)}>✅ Aprobar {cp?"canje":"gasto"}</Btn><Btn v="r" s="s" onClick={()=>onEO(p.id,false)}>❌ Rechazar {cp?"canje":"gasto"}</Btn></>;})()}
            {p.st===ST.V&&<><Btn v="s" s="s" onClick={()=>onVa(p.id,true)}>✅ Validar</Btn><Btn v="r" s="s" onClick={()=>onVa(p.id,false)}>❌ Rechazar</Btn></>}
          </div>}
          {isEm&&!isSA&&p.st===ST.E&&(()=>{const canjePresu=tPresu.find((pr:any)=>pr.is_canje);const canjeSp=canjePresu&&(sponsors||[]).find((s:any)=>s.id===canjePresu.sponsor_id);return <div style={{background:canjePresu?"#EFF6FF":"#EDE9FE",padding:14,borderRadius:10}}>
            <div style={{fontSize:13,fontWeight:700,color:canjePresu?"#1E40AF":"#5B21B6",marginBottom:8}}>{canjePresu?"🔄 Canje":"💰 Aprobación"}{p.monto&&" – $"+p.monto.toLocaleString()}</div>
            {canjeSp&&<div style={{padding:"6px 10px",background:"#DBEAFE",borderRadius:8,fontSize:11,marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontWeight:700,color:"#1E40AF"}}>Sponsor: {canjeSp.name}</span><span style={{fontWeight:600,color:"#059669"}}>Canjes: ${Math.round(Number(canjeSp.amount_service||0)).toLocaleString("es-AR")}</span></div>}
            {tPresu.length>0&&<div style={{fontSize:11,color:colors.pr,marginBottom:6,cursor:"pointer"}} onClick={()=>sTab("presu")}>📋 {tPresu.length} presupuesto(s) cargado(s) → Ver comparación</div>}
            <div style={{display:"flex",gap:8}}><Btn v="s" onClick={()=>onEO(p.id,true)}>✅ Aprobar{canjePresu?" canje":""}</Btn><Btn v="r" onClick={()=>onEO(p.id,false)}>❌ Rechazar</Btn></div>
          </div>;})()}
          {isCr&&!isSA&&p.st===ST.V&&<div style={{background:"#F0FDF4",padding:14,borderRadius:10}}><div style={{fontSize:13,fontWeight:700,color:"#166534",marginBottom:8}}>¿Confirmás resolución?</div><div style={{display:"flex",gap:8}}><Btn v="s" onClick={()=>onVa(p.id,true)}>✅ Validar</Btn><Btn v="r" onClick={()=>onVa(p.id,false)}>❌ Rechazar</Btn></div></div>}
          {!(canT||isCo||isSA||(isM&&p.st===ST.C)||(isEm&&p.st===ST.E)||(isCr&&p.st===ST.V)||p.st===ST.OK)&&<div style={{padding:16,textAlign:"center" as const,color:colors.g4,fontSize:12}}>No hay acciones disponibles.</div>}
        </div>}
        {tab==="check"&&<div style={{display:"flex",flexDirection:"column" as const,gap:8}}>
          {chkItems.length>0&&<div style={{marginBottom:4}}><div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:3}}><span style={{fontWeight:600,color:colors.nv}}>Progreso</span><span style={{fontWeight:700,color:chkPct>=100?colors.gn:colors.yl}}>{chkPct}%</span></div><div style={{height:6,background:colors.g2,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:chkPct+"%",background:chkPct>=100?colors.gn:colors.yl,borderRadius:3,transition:"width .3s"}}/></div></div>}
          {chkItems.map((c,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",background:c.done?"#D1FAE5":"#fff",borderRadius:6,border:"1px solid "+(c.done?colors.gn:colors.g2)}}>
            <input type="checkbox" checked={c.done} onChange={()=>{const nu=[...chkItems];nu[i]={...nu[i],done:!nu[i].done};sChkItems(nu);if(onCheck)onCheck(p.id,nu);}} style={{width:16,height:16}}/>
            <span style={{flex:1,fontSize:12,color:c.done?colors.gn:colors.nv,textDecoration:c.done?"line-through":"none"}}>{c.text}</span>
            <button onClick={()=>{const nu=chkItems.filter((_,j)=>j!==i);sChkItems(nu);if(onCheck)onCheck(p.id,nu);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:10,color:colors.g4}} title="Quitar item">✕</button>
          </div>)}
          <div style={{display:"flex",gap:4}}><input value={newChk} onChange={e=>sNewChk(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&newChk.trim()){const nu=[...chkItems,{text:newChk.trim(),done:false}];sChkItems(nu);sNewChk("");if(onCheck)onCheck(p.id,nu);}}} placeholder="Nuevo item..." style={{flex:1,padding:"6px 10px",borderRadius:6,border:"1px solid "+colors.g3,fontSize:12}}/><Btn v="p" s="s" disabled={!newChk.trim()} onClick={()=>{const nu=[...chkItems,{text:newChk.trim(),done:false}];sChkItems(nu);sNewChk("");if(onCheck)onCheck(p.id,nu);}}>+</Btn></div>
          {chkItems.length===0&&<div style={{textAlign:"center" as const,padding:16,color:colors.g4,fontSize:12}}>Sin checklist. Agregá items arriba.</div>}
        </div>}
        {tab==="presu"&&<div style={{display:"flex",flexDirection:"column" as const,gap:8}}>
          {/* Sub-tabs: list, add, compare */}
          <div style={{display:"flex",gap:4,marginBottom:4}}>
            {[{k:"list",l:"📋 Lista"},{k:"add",l:"➕ Agregar"},...(prSel.length>=2?[{k:"cmp",l:"⚖️ Comparar ("+prSel.length+")"}]:[])].map(st=><button key={st.k} onClick={()=>sPrSub(st.k)} style={{padding:mob?"8px 12px":"4px 10px",borderRadius:6,border:"none",background:prSub===st.k?colors.pr:"transparent",color:prSub===st.k?"#fff":colors.g5,fontSize:mob?12:10,fontWeight:600,cursor:"pointer",minHeight:mob?40:undefined}}>{st.l}</button>)}
          </div>
          {/* LIST */}
          {prSub==="list"&&<div style={{display:"flex",flexDirection:"column" as const,gap:6}}>
            {tPresu.length===0&&<div style={{textAlign:"center" as const,padding:20,color:colors.g4,fontSize:12}}>Sin presupuestos cargados</div>}
            {tPresu.map((pr:any)=>{const sel=prSel.indexOf(pr.id)>=0;return(<div key={pr.id} style={{padding:"10px 12px",background:sel?"#EDE9FE":"#fff",borderRadius:10,border:"1px solid "+(sel?colors.pr:colors.g2)}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <input type="checkbox" checked={sel} onChange={()=>{if(sel)sPrSel(s=>s.filter(x=>x!==pr.id));else sPrSel(s=>[...s,pr.id]);}} style={{width:14,height:14}}/>
                  <div><div style={{fontSize:12,fontWeight:700,color:colors.nv}}>{pr.proveedor_nombre||"Sin proveedor"}</div><div style={{fontSize:10,color:colors.g4}}>{pr.descripcion}</div></div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:14,fontWeight:800,color:pr.status===PST.APR?colors.gn:colors.nv}}>${Number(pr.monto).toLocaleString()} {pr.moneda}</span>
                  <PBadge s={pr.status} sm/>
                </div>
              </div>
              {pr.is_canje&&<div style={{marginTop:4}}><span style={{padding:"2px 8px",borderRadius:8,background:"#DBEAFE",color:"#1E40AF",fontSize:9,fontWeight:700}}>🔄 Canje{pr.sponsor_id&&(sponsors||[]).find((s:any)=>s.id===pr.sponsor_id)?" — "+(sponsors||[]).find((s:any)=>s.id===pr.sponsor_id).name:""}</span></div>}
              <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap" as const,fontSize:10,color:colors.g5}}>
                {pr.proveedor_contacto&&<span>📞 {pr.proveedor_contacto}</span>}
                {pr.archivo_url&&<a href={pr.archivo_url} target="_blank" rel="noopener noreferrer" style={{color:colors.bl,textDecoration:"underline"}}>📎 Archivo</a>}
                {pr.solicitado_at&&<span>📤 {pr.solicitado_at}</span>}
              </div>
              {canChangeStatus&&<div style={{display:"flex",gap:4,marginTop:6,flexWrap:"wrap" as const}}>
                {pr.status===PST.SOL&&<Btn v="g" s="s" onClick={()=>onUpdPresu(pr.id,{status:PST.REC,recibido_at:TODAY})}>📥 Recibido</Btn>}
                {(pr.status===PST.SOL||pr.status===PST.REC)&&<Btn v="s" s="s" onClick={()=>{onUpdPresu(pr.id,{status:PST.APR,resuelto_por:fn(user),resuelto_at:TODAY});/* sync monto to task */onMonto(p.id,Number(pr.monto));}}>✅ Aprobar</Btn>}
                {(pr.status===PST.SOL||pr.status===PST.REC)&&<Btn v="r" s="s" onClick={()=>onUpdPresu(pr.id,{status:PST.RECH,resuelto_por:fn(user),resuelto_at:TODAY})}>❌ Rechazar</Btn>}
                {pr.status===PST.REC&&<Btn v="w" s="s" onClick={()=>onUpdPresu(pr.id,{status:PST.SOL,recibido_at:null})}>↩ Devolver</Btn>}
                {isSA&&<Btn v="g" s="s" onClick={()=>{if(confirm("¿Eliminar presupuesto?"))onDelPresu(pr.id);}} style={{color:colors.rd}}>🗑️</Btn>}
              </div>}
              {pr.notas&&<div style={{fontSize:10,color:colors.g5,marginTop:4,fontStyle:"italic"}}>💬 {pr.notas}</div>}
            </div>);})}
            <Btn v="pu" onClick={()=>sPrSub("add")}>➕ Agregar presupuesto</Btn>
          </div>}
          {/* ADD */}
          {prSub==="add"&&canManagePresu&&<div style={{display:"flex",flexDirection:"column" as const,gap:8}}>
            <div style={{fontSize:12,fontWeight:700,color:colors.nv}}>Nuevo presupuesto</div>
            {/* Proveedor autocomplete */}
            <div><label style={{fontSize:11,fontWeight:600,color:colors.g5}}>Proveedor</label>
              <input value={provSearch} onChange={e=>{sProvSearch(e.target.value);sPf(prev=>({...prev,prov_nombre:e.target.value,prov_id:""}));}} placeholder="Buscar proveedor..." style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:3}}/>
              {provSearch&&(provs||[]).filter((pv:any)=>pv.nombre.toLowerCase().includes(provSearch.toLowerCase())).length>0&&<div style={{border:"1px solid "+colors.g3,borderRadius:8,marginTop:2,maxHeight:100,overflowY:"auto" as const,background:cardBg}}>
                {(provs||[]).filter((pv:any)=>pv.nombre.toLowerCase().includes(provSearch.toLowerCase())).map((pv:any)=><div key={pv.id} onClick={()=>{sPf(prev=>({...prev,prov_id:String(pv.id),prov_nombre:pv.nombre,prov_contacto:pv.contacto||pv.telefono||pv.email}));sProvSearch(pv.nombre);}} style={{padding:"6px 10px",fontSize:11,cursor:"pointer",borderBottom:"1px solid "+colors.g1}}>{pv.nombre} <span style={{color:colors.g4}}>({pv.rubro})</span></div>)}
              </div>}
            </div>
            <div><label style={{fontSize:11,fontWeight:600,color:colors.g5}}>Contacto proveedor</label><input value={pf.prov_contacto} onChange={e=>sPf(prev=>({...prev,prov_contacto:e.target.value}))} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:3}}/></div>
            <div><label style={{fontSize:11,fontWeight:600,color:colors.g5}}>Descripción</label><textarea value={pf.descripcion} onChange={e=>sPf(prev=>({...prev,descripcion:e.target.value}))} rows={2} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,resize:"vertical" as const,boxSizing:"border-box" as const,marginTop:3}}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 80px",gap:8}}>
              <div><label style={{fontSize:11,fontWeight:600,color:colors.g5}}>Monto ($)</label><input type="number" value={pf.monto} onChange={e=>sPf(prev=>({...prev,monto:e.target.value}))} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:3}}/></div>
              <div><label style={{fontSize:11,fontWeight:600,color:colors.g5}}>Moneda</label><select value={pf.moneda} onChange={e=>sPf(prev=>({...prev,moneda:e.target.value}))} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,marginTop:3}}>{MONEDAS.map(m=><option key={m} value={m}>{m}</option>)}</select></div>
            </div>
            <div><FileField value={pf.archivo_url} onChange={url=>sPf(prev=>({...prev,archivo_url:url}))} folder="presupuestos"/></div>
            <div><label style={{fontSize:11,fontWeight:600,color:colors.g5}}>Notas</label><input value={pf.notas} onChange={e=>sPf(prev=>({...prev,notas:e.target.value}))} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:3}}/></div>
            <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}><Btn v="g" onClick={()=>sPrSub("list")}>Cancelar</Btn><Btn v="pu" disabled={!pf.prov_nombre||!pf.monto} onClick={()=>{onAddPresu({task_id:p.id,proveedor_id:pf.prov_id?Number(pf.prov_id):null,proveedor_nombre:pf.prov_nombre,proveedor_contacto:pf.prov_contacto,descripcion:pf.descripcion,monto:Number(pf.monto),moneda:pf.moneda,archivo_url:pf.archivo_url,notas:pf.notas,status:PST.SOL,solicitado_por:fn(user),solicitado_at:TODAY});sPf({prov_id:"",prov_nombre:"",prov_contacto:"",descripcion:"",monto:"",moneda:"ARS",archivo_url:"",notas:""});sProvSearch("");sPrSub("list");}}>💰 Agregar</Btn></div>
          </div>}
          {/* COMPARE */}
          {prSub==="cmp"&&prSel.length>=2&&<div>
            <div style={{fontSize:12,fontWeight:700,color:colors.nv,marginBottom:8}}>⚖️ Comparación de presupuestos</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat("+Math.min(prSel.length,3)+",1fr)",gap:8}}>
              {prSel.slice(0,3).map(sid=>{const pr=tPresu.find((x:any)=>x.id===sid);if(!pr)return null;const isMin=prSel.map(id2=>tPresu.find((x:any)=>x.id===id2)).filter(Boolean).every((x:any)=>Number(pr.monto)<=Number(x.monto));
                return(<div key={pr.id} style={{padding:12,borderRadius:10,border:"2px solid "+(isMin?colors.gn:colors.g3),background:isMin?"#F0FDF4":"#fff"}}>
                  {isMin&&<div style={{fontSize:9,fontWeight:700,color:colors.gn,marginBottom:4}}>🏆 MEJOR PRECIO</div>}
                  <div style={{fontSize:13,fontWeight:700,color:colors.nv}}>{pr.proveedor_nombre}</div>
                  <div style={{fontSize:20,fontWeight:800,color:isMin?colors.gn:colors.nv,margin:"6px 0"}}>${Number(pr.monto).toLocaleString()}</div>
                  <div style={{fontSize:10,color:colors.g4}}>{pr.moneda}</div>
                  <PBadge s={pr.status} sm/>
                  <div style={{fontSize:10,color:colors.g5,marginTop:6}}>{pr.descripcion}</div>
                  {pr.archivo_url&&<a href={pr.archivo_url} target="_blank" rel="noopener noreferrer" style={{fontSize:10,color:colors.bl}}>📎 Ver archivo</a>}
                  {canChangeStatus&&(pr.status===PST.SOL||pr.status===PST.REC)&&<div style={{marginTop:8}}><Btn v="s" s="s" onClick={()=>{onUpdPresu(pr.id,{status:PST.APR,resuelto_por:fn(user),resuelto_at:TODAY});onMonto(p.id,Number(pr.monto));}}>✅ Aprobar este</Btn></div>}
                </div>);})}
            </div>
          </div>}
        </div>}
      </div>
    </div>
  </div>);
}
