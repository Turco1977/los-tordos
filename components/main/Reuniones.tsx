"use client";
import { useState, useEffect, useRef } from "react";
import { AGT, MINSECS, DEPTOS, ROLES, fn, AREAS } from "@/lib/constants";
import { fmtD } from "@/lib/mappers";
import { useC } from "@/lib/theme-context";
import { Btn, Card } from "@/components/ui";
import { exportMinutaPDF, exportMinutaWord, exportODPDF, exportODWord, shareODWhatsApp, shareMinutaWhatsApp } from "@/lib/export";
import { useDataStore } from "@/lib/store";
import { MentionInput, renderMentions } from "@/components/MentionInput";

const TODAY = new Date().toISOString().slice(0,10);

export function Reuniones({onAddAg,onUpdAg,onDelAg,onAddMin,onUpdMin,onDelMin,onCreateTasks,onApproveMin,onRejectMin,user,mob}:any){
  const agendas = useDataStore(s => s.agendas);
  const minutas = useDataStore(s => s.minutas);
  const om = useDataStore(s => s.om);
  const users = useDataStore(s => s.users);
  const areas = AREAS;
  const {colors,isDark,cardBg}=useC();
  const [tab,sTab]=useState("cd");const [mode,sMode]=useState("home");const [selId,sSelId]=useState<number|null>(null);
  const [agDate,sAgDate]=useState(TODAY);const [agSecs,sAgSecs]=useState<{t:string;sub:string[];notes:string;atts:{type:string;label:string;val:string}[]}[]>([]);const [agPres,sAgPres]=useState<string[]>([]);const [areaName,sAreaName]=useState("");const [deptName,sDeptName]=useState("");
  const [attOpenIdx,sAttOpenIdx]=useState<number|null>(null);const [attType2,sAttType2]=useState("");const [attVal2,sAttVal2]=useState("");
  const [miDate,sMiDate]=useState(TODAY);const [miHI,sMiHI]=useState("18:00");const [miHC,sMiHC]=useState("20:00");const [miLugar,sMiLugar]=useState("Club Los Tordos");
  const [miPres,sMiPres]=useState<string[]>([]);const [miSecs,sMiSecs]=useState<string[]>([]);const [miTareas,sMiTareas]=useState<{desc:string;respId:string;fecha:string}[]>([]);const [miAgId,sMiAgId]=useState<number|null>(null);
  const tmpl=AGT[tab];
  const selAreaObj=areaName?areas.find((a:any)=>a.name===areaName):null;
  const areaDepts=selAreaObj?DEPTOS.filter((d:any)=>d.aId===selAreaObj.id):[];
  const members=tab==="cd"?om.filter((m:any)=>m.t==="cd"&&m.n):tab==="se"?om.filter((m:any)=>m.t==="se"&&m.n):areaName?(()=>{const ar=areas.find((a:any)=>a.name===areaName);if(!ar)return[];const dIds=DEPTOS.filter((d:any)=>d.aId===ar.id).map((d:any)=>d.id);return users.filter((u:any)=>dIds.includes(u.dId)).map((u:any)=>({id:u.id,n:u.n,a:u.a,cargo:ROLES[u.role]?.l||u.role}));})():[];
  const APPROVAL_QUORUM:{[k:string]:number}={cd:8,se:3};
  const isSA=user.role==="superadmin"||user.role==="admin";
  const userDeptIds=(users.find((u:any)=>u.id===user.id))?.dId;
  const userAreaIds=userDeptIds?DEPTOS.filter((d:any)=>d.id===userDeptIds).map((d:any)=>d.aId):[];
  const canApproveCd=isSA||userAreaIds.includes(100);const canApproveSe=isSA||userAreaIds.includes(101);
  const canApproveType=(type:string)=>type==="cd"?canApproveCd:type==="se"?canApproveSe:false;
  const pendingApprovals=minutas.filter((m:any)=>(m.type==="cd"||m.type==="se")&&m.status==="final"&&canApproveType(m.type)&&!(m.approvals||[]).some((a:any)=>a.userId===user.id));
  const fAg=agendas.filter((a:any)=>a.type===tab&&(tab!=="area"||!areaName||a.areaName===areaName));const fMi=minutas.filter((m:any)=>m.type===tab&&(tab!=="area"||!areaName||m.areaName===areaName));
  const resetAg=()=>{sAgDate(TODAY);sAgSecs(tmpl.secs.map((s:any)=>({t:s.t,sub:[...s.sub],notes:"",atts:[]})));sAgPres([]);sAreaName("");sDeptName("");};
  const resetMin=()=>{sMiDate(TODAY);sMiHI("18:00");sMiHC("20:00");sMiLugar("Club Los Tordos");sMiPres([]);sMiSecs(MINSECS[tab].map(()=>""));sMiTareas([]);sMiAgId(null);sAreaName("");sDeptName("");};
  const startNewAg=()=>{resetAg();sMode("newOD");};const startNewMin=(agId?:number)=>{resetMin();if(agId)sMiAgId(agId);sMode("newMin");};
  const stf=users.filter((u:any)=>["usuario","coordinador","embudo","admin","superadmin","enlace"].indexOf(u.role)>=0);
  const attTypes2=[{k:"link",l:"\u{1F517} Link",ph:"https://..."},{k:"video",l:"\u{1F3AC} Video",ph:"URL del video..."},{k:"foto",l:"\u{1F4F7} Foto",ph:"URL de la imagen..."},{k:"doc",l:"\u{1F4C4} Documento",ph:"URL del documento..."}];

  /* Autosave for editMin mode */
  const [autoSaved,sAutoSaved]=useState(false);
  const autoSaveRef=useRef<any>(null);
  useEffect(()=>{
    if(mode!=="editMin"||!selId){sAutoSaved(false);return;}
    sAutoSaved(false);
    if(autoSaveRef.current)clearTimeout(autoSaveRef.current);
    autoSaveRef.current=setTimeout(()=>{
      const mi=minutas.find((m:any)=>m.id===selId);
      if(!mi)return;
      const secs=miSecs.map((c:string,i:number)=>({title:(mi.sections||[])[i]?.title||`Sección ${i+1}`,content:c}));
      onUpdMin(mi.id,{sections:secs,tareas:miTareas.filter((t:any)=>t.desc),presentes:[...miPres],date:miDate,hora_inicio:miHI,hora_cierre:miHC,lugar:miLugar,_silent:true});
      sAutoSaved(true);
    },3000);
    return()=>{if(autoSaveRef.current)clearTimeout(autoSaveRef.current);};
  },[miDate,miHI,miHC,miLugar,miPres,miSecs,miTareas,mode,selId]);

  /* Draft persistence for newMin mode */
  const draftKey="minuta-draft-"+tab;
  const draftRestoredRef=useRef(false);
  const [draftRestored,sDraftRestored]=useState(false);
  useEffect(()=>{
    if(mode==="newMin"&&!draftRestoredRef.current){
      draftRestoredRef.current=true;
      try{
        const raw=localStorage.getItem(draftKey);
        if(raw){const d=JSON.parse(raw);if(d.miDate)sMiDate(d.miDate);if(d.miHI)sMiHI(d.miHI);if(d.miHC)sMiHC(d.miHC);if(d.miLugar)sMiLugar(d.miLugar);if(d.miPres)sMiPres(d.miPres);if(d.miSecs)sMiSecs(d.miSecs);if(d.miTareas)sMiTareas(d.miTareas);if(d.areaName)sAreaName(d.areaName);sDraftRestored(true);}
      }catch{}
    }
    if(mode!=="newMin"){draftRestoredRef.current=false;sDraftRestored(false);}
  },[mode]);
  useEffect(()=>{
    if(mode!=="newMin")return;
    const timer=setTimeout(()=>{
      const hasContent=miSecs.some((s:string)=>s.trim())||miTareas.some((t:any)=>t.desc.trim());
      if(hasContent)localStorage.setItem(draftKey,JSON.stringify({miDate,miHI,miHC,miLugar,miPres,miSecs,miTareas,areaName}));
    },2000);
    return()=>clearTimeout(timer);
  },[miDate,miHI,miHC,miLugar,miPres,miSecs,miTareas,areaName,mode]);

  /* HOME */
  if(mode==="home") return(<div style={{maxWidth:720}}>
    <h2 style={{margin:"0 0 4px",fontSize:19,color:colors.nv,fontWeight:800}}>{"\u{1F4C5}"} Reuniones</h2>
    <p style={{color:colors.g4,fontSize:12,margin:"0 0 14px"}}>{"\u00D3"}rdenes del d{"\u00ED"}a y minutas institucionales</p>
    <div style={{display:"flex",gap:4,marginBottom:16}}>{Object.keys(AGT).map(k=><Btn key={k} v={tab===k?"p":"g"} s="s" onClick={()=>sTab(k)}>{AGT[k].icon} {AGT[k].title}</Btn>)}</div>
    <Card style={{marginBottom:14,borderLeft:"4px solid "+tmpl.color,padding:"12px 16px"}}>
      <div style={{fontSize:14,fontWeight:700,color:colors.nv}}>{tmpl.icon} {tmpl.title}</div>
      <div style={{fontSize:11,color:colors.g4}}>Periodicidad: {tmpl.per} {"\u00B7"} Duraci{"\u00F3"}n: {tmpl.dur}</div>
    </Card>
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:10,marginBottom:18}}>
      <Card style={{padding:mob?"14px 12px":"18px 16px",cursor:"pointer",textAlign:"center" as const,border:"2px solid "+colors.g2}} onClick={startNewAg}>
        <span style={{fontSize:28}}>{"\u{1F4CB}"}</span><div style={{fontSize:13,fontWeight:700,color:colors.nv,marginTop:6}}>Nueva Orden del D{"\u00ED"}a</div><div style={{fontSize:10,color:colors.g4}}>Crear agenda para pr{"\u00F3"}xima reuni{"\u00F3"}n</div>
      </Card>
      <Card style={{padding:"18px 16px",cursor:"pointer",textAlign:"center" as const,border:"2px solid "+colors.g2}} onClick={()=>startNewMin()}>
        <span style={{fontSize:28}}>{"\u{1F4DD}"}</span><div style={{fontSize:13,fontWeight:700,color:colors.nv,marginTop:6}}>Nueva Minuta</div><div style={{fontSize:10,color:colors.g4}}>Registrar acta de reuni{"\u00F3"}n</div>
      </Card>
    </div>
    {pendingApprovals.length>0&&<Card style={{marginBottom:14,borderLeft:"4px solid #F59E0B",padding:"12px 16px",background:"#FFFBEB"}}>
      <div style={{fontSize:13,fontWeight:700,color:"#92400E",marginBottom:8}}>{"\u{1F4CB}"} Minutas pendientes de tu aprobaci{"\u00F3"}n</div>
      {pendingApprovals.map((m:any)=>{const q=APPROVAL_QUORUM[m.type]||5;const apps=m.approvals||[];return <div key={m.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #FDE68A"}}>
        <div style={{flex:1,cursor:"pointer"}} onClick={()=>{sSelId(m.id);sMode("viewMin");}}>
          <div style={{fontSize:12,fontWeight:600,color:colors.nv}}>{"\u{1F4DD}"} Minuta {m.type.toUpperCase()} {"\u2013"} {fmtD(m.date)}</div>
          <div style={{fontSize:10,color:colors.g4}}>Progreso: {apps.length}/{q} aprobaciones</div>
          <div style={{height:4,background:"#FDE68A",borderRadius:2,marginTop:3,width:120}}><div style={{height:"100%",background:"#F59E0B",borderRadius:2,width:Math.min(100,apps.length/q*100)+"%"}}/></div>
        </div>
        <div style={{display:"flex",gap:4,flexShrink:0}}><Btn v="w" s="s" onClick={()=>onApproveMin(m.id)} style={{background:"#10B981",color:"#fff",border:"none"}}>{"\u2705"}</Btn><Btn v="w" s="s" onClick={()=>onRejectMin?.(m.id)} style={{background:"#DC2626",color:"#fff",border:"none"}}>{"\u274C"}</Btn></div>
      </div>;})}
    </Card>}
    <div style={{fontSize:13,fontWeight:700,color:colors.nv,marginBottom:8}}>{"\u{1F4DA}"} Historial</div>
    {fAg.length===0&&fMi.length===0&&<Card style={{textAlign:"center" as const,padding:24,color:colors.g4}}><span style={{fontSize:24}}>{"\u{1F4ED}"}</span><div style={{marginTop:6,fontSize:12}}>Sin registros a{"\u00FA"}n</div></Card>}
    {fAg.length>0&&<div style={{marginBottom:12}}><div style={{fontSize:11,fontWeight:700,color:colors.g4,marginBottom:4}}>{"\u{1F4CB}"} {"\u00D3"}RDENES DEL D{"\u00CD"}A</div>
      {fAg.map((a:any)=><Card key={a.id} style={{padding:"10px 14px",marginBottom:4,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{flex:1,cursor:"pointer"}} onClick={()=>{sSelId(a.id);sMode("viewOD");}}><div style={{fontSize:12,fontWeight:600,color:colors.nv}}>{"\u{1F4CB}"} Orden del D{"\u00ED"}a {"\u2013"} {fmtD(a.date)}{a.areaName?" · "+a.areaName:""}</div><div style={{fontSize:10,color:colors.g4}}>{a.status==="enviada"?"\u2705 Enviada":"\u{1F4DD} Borrador"} {"\u00B7"} Creada: {fmtD(a.createdAt)}</div></div>
        <div style={{display:"flex",gap:4,alignItems:"center"}}><button onClick={(e)=>{e.stopPropagation();if(confirm("\u00BFEliminar esta Orden del D\u00EDa?"))onDelAg(a.id);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:colors.rd,padding:4}} title="Eliminar">{"\u{1F5D1}\uFE0F"}</button><span style={{color:colors.g4}}>{"\u203A"}</span></div>
      </Card>)}</div>}
    {fMi.length>0&&<div><div style={{fontSize:11,fontWeight:700,color:colors.g4,marginBottom:4}}>{"\u{1F4DD}"} MINUTAS</div>
      {fMi.map((m:any)=>{const q=APPROVAL_QUORUM[m.type];const apps=m.approvals||[];const stLabel=m.status==="aprobada"?"\u2705 Aprobada ("+apps.length+" firmas)":m.status==="final"&&q?"Pendiente aprobaci\u00F3n ("+apps.length+"/"+q+")":m.status==="final"?"\u2705 Finalizada":"\u{1F4DD} Borrador";const stBg=m.status==="aprobada"?"#D1FAE5":m.status==="final"&&q?"#FEF3C7":"transparent";return <Card key={m.id} style={{padding:"10px 14px",marginBottom:4,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{flex:1,cursor:"pointer"}} onClick={()=>{sSelId(m.id);sMode("viewMin");}}><div style={{fontSize:12,fontWeight:600,color:colors.nv}}>{"\u{1F4DD}"} Minuta {"\u2013"} {fmtD(m.date)}{m.areaName?" · "+m.areaName:""}</div><div style={{fontSize:10,color:m.status==="aprobada"?"#065F46":colors.g4,background:stBg,display:"inline-block",padding:stBg!=="transparent"?"1px 8px":"0",borderRadius:10}}>{stLabel}</div>{m.tareas?.length?<span style={{fontSize:10,color:colors.g4}}> · {"\u{1F4CB}"} {m.tareas.length} tareas</span>:null}</div>
        <div style={{display:"flex",gap:4,alignItems:"center"}}><button onClick={(e)=>{e.stopPropagation();if(confirm("\u00BFEliminar esta Minuta?"))onDelMin(m.id);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:colors.rd,padding:4}} title="Eliminar">{"\u{1F5D1}\uFE0F"}</button><span style={{color:colors.g4}}>{"\u203A"}</span></div>
      </Card>;})}
    </div>}
  </div>);

  /* ── Shared section editor for newOD / editOD ── */
  const renderSecEditor=()=>{
    const addAtt2=(idx:number)=>{if(attVal2.trim()){const at=attTypes2.find(a=>a.k===attType2);sAgSecs(p=>p.map((s,i)=>i===idx?{...s,atts:[...s.atts,{type:attType2,label:at?at.l:"\u{1F4CE}",val:attVal2.trim()}]}:s));sAttVal2("");sAttType2("");sAttOpenIdx(null);}};
    return(<>
      <div style={{fontSize:12,fontWeight:700,color:colors.nv,marginBottom:8}}>Estructura del Orden del D{"\u00ED"}a</div>
      {agSecs.map((sec,i)=><div key={i} style={{marginBottom:10,padding:10,background:colors.g1,borderRadius:8,border:"1px solid "+colors.g2}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
          <span style={{fontSize:11,fontWeight:700,color:colors.g4,minWidth:18}}>{i+1}.</span>
          <input value={sec.t} onChange={e=>{const n=[...agSecs];n[i]={...n[i],t:e.target.value};sAgSecs(n);}} style={{flex:1,padding:"4px 8px",borderRadius:6,border:"1px solid "+colors.g3,fontSize:12,fontWeight:700,color:colors.nv}}/>
          <div style={{display:"flex",gap:2}}>
            {i>0&&<button onClick={()=>{const n=[...agSecs];[n[i-1],n[i]]=[n[i],n[i-1]];sAgSecs(n);}} style={{background:"none",border:"1px solid "+colors.g3,borderRadius:4,cursor:"pointer",fontSize:10,padding:"2px 5px",color:colors.g5}} title="Mover arriba">{"\u25B2"}</button>}
            {i<agSecs.length-1&&<button onClick={()=>{const n=[...agSecs];[n[i],n[i+1]]=[n[i+1],n[i]];sAgSecs(n);}} style={{background:"none",border:"1px solid "+colors.g3,borderRadius:4,cursor:"pointer",fontSize:10,padding:"2px 5px",color:colors.g5}} title="Mover abajo">{"\u25BC"}</button>}
            {agSecs.length>1&&<button onClick={()=>sAgSecs(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"1px solid #FECACA",borderRadius:4,cursor:"pointer",fontSize:10,padding:"2px 5px",color:colors.rd}} title="Eliminar secci\u00F3n">{"\u2715"}</button>}
          </div>
        </div>
        {/* Subtemas */}
        <div style={{paddingLeft:24,marginBottom:4}}>
          {sec.sub.map((sb,j)=><div key={j} style={{display:"flex",alignItems:"center",gap:4,marginBottom:3}}>
            <span style={{fontSize:10,color:colors.g4}}>{"\u2022"}</span>
            <input value={sb} onChange={e=>{const n=[...agSecs];const nsub=[...n[i].sub];nsub[j]=e.target.value;n[i]={...n[i],sub:nsub};sAgSecs(n);}} style={{flex:1,padding:"3px 6px",borderRadius:5,border:"1px solid "+colors.g3,fontSize:10,color:colors.g5}}/>
            <button onClick={()=>{const n=[...agSecs];n[i]={...n[i],sub:n[i].sub.filter((_,k)=>k!==j)};sAgSecs(n);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:10,color:colors.g4,padding:0}}>{"\u2715"}</button>
          </div>)}
          <button onClick={()=>{const n=[...agSecs];n[i]={...n[i],sub:[...n[i].sub,""]};sAgSecs(n);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:10,color:colors.bl,fontWeight:600,padding:"2px 0"}}>+ Agregar subtema</button>
        </div>
        {/* Notas */}
        <MentionInput users={users} value={sec.notes} onChange={v=>{const n=[...agSecs];n[i]={...n[i],notes:v};sAgSecs(n);}} rows={2} placeholder="Notas adicionales..." style={{width:"100%",padding:6,borderRadius:6,border:"1px solid "+colors.g3,fontSize:11,resize:"vertical" as const,boxSizing:"border-box" as const,marginTop:4}}/>
        {/* Adjuntos */}
        <div style={{marginTop:4}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
            <span style={{fontSize:10,fontWeight:600,color:colors.g5}}>Adjuntos</span>
            <button onClick={()=>{sAttOpenIdx(attOpenIdx===i?null:i);sAttType2("");sAttVal2("");}} style={{width:20,height:20,borderRadius:10,background:attOpenIdx===i?colors.bl+"15":cardBg,border:"1px solid "+(attOpenIdx===i?colors.bl:colors.g3),cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",color:attOpenIdx===i?colors.bl:colors.g4,fontWeight:700,padding:0}}>+</button>
          </div>
          {attOpenIdx===i&&<div style={{padding:8,background:colors.g1,borderRadius:8,border:"1px solid "+colors.g2,marginBottom:4}}>
            {!attType2?<div style={{display:"flex",flexWrap:"wrap" as const,gap:4}}>
              {attTypes2.map(a=><button key={a.k} onClick={()=>sAttType2(a.k)} style={{padding:"5px 10px",borderRadius:8,border:"1px solid "+colors.g3,background:cardBg,fontSize:10,cursor:"pointer",fontWeight:600,color:colors.nv}}>{a.l}</button>)}
              <button onClick={()=>sAttOpenIdx(null)} style={{padding:"5px 10px",borderRadius:8,border:"none",background:"transparent",fontSize:10,cursor:"pointer",color:colors.g4}}>{"\u2715"}</button>
            </div>
            :<div style={{display:"flex",gap:4,alignItems:"center"}}>
              <span style={{fontSize:10,fontWeight:600}}>{attTypes2.find(a=>a.k===attType2)?.l}</span>
              <input value={attVal2} onChange={e=>sAttVal2(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addAtt2(i);}} placeholder={attTypes2.find(a=>a.k===attType2)?.ph} style={{flex:1,padding:"5px 8px",borderRadius:6,border:"1px solid "+colors.g3,fontSize:10}} autoFocus/>
              <Btn v="p" s="s" onClick={()=>addAtt2(i)} disabled={!attVal2.trim()}>OK</Btn>
              <Btn v="g" s="s" onClick={()=>{sAttType2("");sAttVal2("");}}>←</Btn>
            </div>}
          </div>}
          {sec.atts.length>0&&<div style={{display:"flex",flexWrap:"wrap" as const,gap:3}}>{sec.atts.map((a,j)=><div key={j} style={{display:"flex",alignItems:"center",gap:3,padding:"2px 8px",background:"#E8F4FD",borderRadius:12,fontSize:9,border:"1px solid #B3D9F2"}}><span>{a.label}</span><span style={{color:colors.bl,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{a.val}</span><button onClick={()=>{const n=[...agSecs];n[i]={...n[i],atts:n[i].atts.filter((_,k)=>k!==j)};sAgSecs(n);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:9,color:colors.g4,padding:0}}>{"\u2715"}</button></div>)}</div>}
        </div>
      </div>)}
      <button onClick={()=>sAgSecs(p=>[...p,{t:"",sub:[],notes:"",atts:[]}])} style={{width:"100%",padding:8,borderRadius:8,border:"2px dashed "+colors.g3,background:"transparent",cursor:"pointer",fontSize:11,fontWeight:600,color:colors.bl,marginBottom:12}}>+ Agregar secci{"\u00F3"}n</button>
      {/* Asistencia */}
      {members.length>0&&<div style={{marginBottom:10}}>
        <label style={{fontSize:11,fontWeight:600,color:colors.g5,marginBottom:4,display:"block"}}>Convocados / Presentes</label>
        <div style={{display:"flex",flexWrap:"wrap" as const,gap:4}}>{members.map((m:any)=>{const name=m.n+" "+m.a;const chk=agPres.indexOf(name)>=0;return <label key={m.id} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:16,border:"1px solid "+(chk?colors.gn:colors.g3),background:chk?"#D1FAE5":cardBg,fontSize:10,cursor:"pointer"}}><input type="checkbox" checked={chk} onChange={()=>{if(chk)sAgPres(p=>p.filter(x=>x!==name));else sAgPres(p=>[...p,name]);}} style={{width:12,height:12}}/><span style={{fontWeight:chk?600:400}}>{m.cargo}: {name}</span></label>;})}</div>
      </div>}
    </>);
  };

  /* NUEVA ORDEN DEL DÍA */
  if(mode==="newOD"){
    const saveSecs=()=>agSecs.map(s=>({t:s.t,sub:s.sub.filter(x=>x.trim()),notes:s.notes,atts:s.atts}));
    const doSendOD=async(status:string)=>{
      const secs=saveSecs();
      const agObj={id:0,type:tab,areaName:areaName||undefined,date:agDate,sections:secs,presentes:[...agPres],status,createdAt:TODAY};
      const agId=await onAddAg(agObj);
      if(status==="enviada"){
        const minSecs=secs.map((s:any,i:number)=>({title:`${i+1}. ${s.t}`,content:""}));
        const aus=members.filter((m:any)=>agPres.indexOf(m.n+" "+m.a)<0).map((m:any)=>m.n+" "+m.a);
        onAddMin({id:0,type:tab,areaName:areaName||undefined,agendaId:agId||0,date:agDate,horaInicio:"",horaCierre:"",lugar:"Club Los Tordos",presentes:[...agPres],ausentes:aus,sections:minSecs,tareas:[],status:"borrador",createdAt:TODAY});
      }
      sMode("home");
    };
    return(<div style={{maxWidth:640}}>
      <Btn v="g" s="s" onClick={()=>sMode("home")} style={{marginBottom:12}}>{"\u2190"} Volver</Btn>
      <Card>
        <h2 style={{margin:"0 0 14px",fontSize:17,color:colors.nv,fontWeight:800}}>{"\u{1F4CB}"} Nueva Orden del D{"\u00ED"}a {"\u2013"} {tmpl.title}</h2>
        <div style={{padding:8,background:colors.g1,borderRadius:8,fontSize:11,color:colors.g5,marginBottom:12}}>Periodicidad: {tmpl.per} {"\u00B7"} Duraci{"\u00F3"}n: {tmpl.dur}</div>
        <div style={{marginBottom:10}}><label style={{fontSize:12,fontWeight:600,color:colors.g5}}>Fecha de reuni{"\u00F3"}n</label><input type="date" value={agDate} onChange={e=>sAgDate(e.target.value)} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:3}}/></div>
        {tab==="area"&&<div style={{marginBottom:10}}><label style={{fontSize:12,fontWeight:600,color:colors.g5}}>{"\u00C1"}rea</label><select value={areaName} onChange={e=>{sAreaName(e.target.value);sDeptName("");}} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,marginTop:3}}><option value="">Seleccionar...</option>{areas.filter((a:any)=>a.id!==100&&a.id!==101).map((a:any)=><option key={a.id} value={a.name}>{a.icon} {a.name}</option>)}</select></div>}
        {tab==="area"&&areaName&&areaDepts.length>0&&<div style={{marginBottom:10}}><label style={{fontSize:12,fontWeight:600,color:colors.g5}}>Departamento</label><select value={deptName} onChange={e=>sDeptName(e.target.value)} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,marginTop:3}}><option value="">Todos los departamentos</option>{areaDepts.map((d:any)=><option key={d.id} value={d.name}>{d.name}</option>)}</select></div>}
        {renderSecEditor()}
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:12}}>
          <Btn v="g" onClick={()=>sMode("home")}>Cancelar</Btn>
          <Btn v="p" onClick={()=>doSendOD("borrador")}>{"\u{1F4BE}"} Guardar borrador</Btn>
          <Btn v="r" onClick={()=>doSendOD("enviada")}>{"\u{1F4E8}"} Guardar y enviar</Btn>
        </div>
      </Card>
    </div>);
  }

  /* EDITAR ORDEN DEL DÍA */
  if(mode==="editOD"){
    const ag=agendas.find((a:any)=>a.id===selId);
    if(!ag) return <div><Btn v="g" s="s" onClick={()=>sMode("home")}>{"\u2190"} Volver</Btn><p>No encontrada</p></div>;
    const saveSecs=()=>agSecs.map(s=>({t:s.t,sub:s.sub.filter(x=>x.trim()),notes:s.notes,atts:s.atts}));
    const doSaveEdit=(status?:string)=>{
      const secs=saveSecs();
      const upd:any={sections:secs,presentes:[...agPres],date:agDate,area_name:areaName||null};
      if(status) upd.status=status;
      onUpdAg(ag.id,upd);
      if(status==="enviada"){
        const minSecs=secs.map((s:any,i:number)=>({title:`${i+1}. ${s.t}`,content:""}));
        const aus=members.filter((m:any)=>agPres.indexOf(m.n+" "+m.a)<0).map((m:any)=>m.n+" "+m.a);
        onAddMin({id:0,type:tab,areaName:areaName||undefined,agendaId:ag.id,date:agDate,horaInicio:"",horaCierre:"",lugar:"Club Los Tordos",presentes:[...agPres],ausentes:aus,sections:minSecs,tareas:[],status:"borrador",createdAt:TODAY});
      }
      sMode("home");
    };
    return(<div style={{maxWidth:640}}>
      <Btn v="g" s="s" onClick={()=>{sSelId(ag.id);sMode("viewOD");}} style={{marginBottom:12}}>{"\u2190"} Volver a OD</Btn>
      <Card>
        <h2 style={{margin:"0 0 14px",fontSize:17,color:colors.nv,fontWeight:800}}>{"\u270F\uFE0F"} Editar Orden del D{"\u00ED"}a{ag.areaName?" – "+ag.areaName:""}</h2>
        <div style={{marginBottom:10}}><label style={{fontSize:12,fontWeight:600,color:colors.g5}}>Fecha de reuni{"\u00F3"}n</label><input type="date" value={agDate} onChange={e=>sAgDate(e.target.value)} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:3}}/></div>
        {tab==="area"&&<div style={{marginBottom:10}}><label style={{fontSize:12,fontWeight:600,color:colors.g5}}>{"\u00C1"}rea</label><select value={areaName} onChange={e=>{sAreaName(e.target.value);sDeptName("");}} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,marginTop:3}}><option value="">Seleccionar...</option>{areas.filter((a:any)=>a.id!==100&&a.id!==101).map((a:any)=><option key={a.id} value={a.name}>{a.icon} {a.name}</option>)}</select></div>}
        {tab==="area"&&areaName&&areaDepts.length>0&&<div style={{marginBottom:10}}><label style={{fontSize:12,fontWeight:600,color:colors.g5}}>Departamento</label><select value={deptName} onChange={e=>sDeptName(e.target.value)} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,marginTop:3}}><option value="">Todos los departamentos</option>{areaDepts.map((d:any)=><option key={d.id} value={d.name}>{d.name}</option>)}</select></div>}
        {renderSecEditor()}
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:12}}>
          <Btn v="g" onClick={()=>{sSelId(ag.id);sMode("viewOD");}}>Cancelar</Btn>
          <Btn v="p" onClick={()=>doSaveEdit()}>{"\u{1F4BE}"} Guardar cambios</Btn>
          {ag.status==="borrador"&&<Btn v="r" onClick={()=>doSaveEdit("enviada")}>{"\u{1F4E8}"} Guardar y enviar</Btn>}
        </div>
      </Card>
    </div>);
  }

  /* VER ORDEN DEL DÍA */
  if(mode==="viewOD"){
    const ag=agendas.find((a:any)=>a.id===selId);
    if(!ag) return <div><Btn v="g" s="s" onClick={()=>sMode("home")}>{"\u2190"} Volver</Btn><p>No encontrada</p></div>;
    const enterEdit=()=>{
      sAgDate(ag.date);sAreaName(ag.areaName||"");
      sAgSecs((ag.sections||[]).map((s:any)=>({t:s.t||"",sub:s.sub?[...s.sub]:[],notes:s.notes||"",atts:s.atts?[...s.atts]:[]})));
      sAgPres(ag.presentes?[...ag.presentes]:[]);
      sMode("editOD");
    };
    const doSendFromView=()=>{
      onUpdAg(ag.id,{status:"enviada"});
      const secs=ag.sections||[];
      const minSecs=secs.map((s:any,i:number)=>({title:`${i+1}. ${s.t}`,content:""}));
      const pres=ag.presentes||[];
      const aus=members.filter((m:any)=>pres.indexOf(m.n+" "+m.a)<0).map((m:any)=>m.n+" "+m.a);
      onAddMin({id:0,type:tab,areaName:ag.areaName||undefined,agendaId:ag.id,date:ag.date,horaInicio:"",horaCierre:"",lugar:"Club Los Tordos",presentes:[...pres],ausentes:aus,sections:minSecs,tareas:[],status:"borrador",createdAt:TODAY});
    };
    return(<div style={{maxWidth:640}}>
      <Btn v="g" s="s" onClick={()=>sMode("home")} style={{marginBottom:12}}>{"\u2190"} Volver</Btn>
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:14}}>
          <div><h2 style={{margin:0,fontSize:17,color:colors.nv,fontWeight:800}}>{"\u{1F4CB}"} Orden del D{"\u00ED"}a{ag.areaName?" – "+ag.areaName:""}</h2><div style={{fontSize:11,color:colors.g4,marginTop:2}}>Fecha: {fmtD(ag.date)} {"\u00B7"} {ag.status==="enviada"?"\u2705 Enviada":"\u{1F4DD} Borrador"}</div></div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap" as const}}>
            {ag.status==="borrador"&&<Btn v="g" s="s" onClick={enterEdit}>{"\u270F\uFE0F"} Editar</Btn>}
            {ag.status==="borrador"&&<Btn v="r" s="s" onClick={doSendFromView}>{"\u{1F4E8}"} Enviar</Btn>}
            <Btn v="p" s="s" onClick={()=>startNewMin(ag.id)}>{"\u{1F4DD}"} Crear Minuta</Btn>
            <Btn v="g" s="s" onClick={()=>shareODWhatsApp({typeTitle:AGT[ag.type]?.title||"",areaName:ag.areaName,date:ag.date,presentes:ag.presentes,sections:ag.sections,status:ag.status})} title="Compartir por WhatsApp" style={{color:"#25D366"}}>WhatsApp</Btn>
            <Btn v="g" s="s" onClick={()=>exportODPDF({typeTitle:AGT[ag.type]?.title||"",areaName:ag.areaName,date:ag.date,presentes:ag.presentes,sections:ag.sections,status:ag.status})} title="Descargar PDF">PDF</Btn>
            <Btn v="g" s="s" onClick={()=>exportODWord({typeTitle:AGT[ag.type]?.title||"",areaName:ag.areaName,date:ag.date,presentes:ag.presentes,sections:ag.sections,status:ag.status})} title="Descargar Word">Word</Btn>
          </div>
        </div>
        {/* Presentes convocados */}
        {ag.presentes&&ag.presentes.length>0&&<div style={{marginBottom:12}}>
          <div style={{fontSize:10,fontWeight:700,color:colors.gn,marginBottom:4}}>{"\u2705"} CONVOCADOS ({ag.presentes.length})</div>
          <div style={{display:"flex",flexWrap:"wrap" as const,gap:4}}>{ag.presentes.map((p:string,i:number)=><span key={i} style={{padding:"3px 10px",borderRadius:14,background:"#D1FAE5",border:"1px solid #6EE7B7",fontSize:10,fontWeight:600,color:"#065F46"}}>{p}</span>)}</div>
        </div>}
        <div style={{borderTop:"2px solid "+colors.nv,paddingTop:12}}>
          <div style={{textAlign:"center" as const,marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:700,color:colors.g4,textTransform:"uppercase" as const}}>Los Tordos Rugby Club</div>
            <div style={{fontSize:15,fontWeight:800,color:colors.nv}}>{AGT[ag.type]?.title}</div>
            <div style={{fontSize:11,color:colors.g5}}>Orden del D{"\u00ED"}a {"\u2013"} {fmtD(ag.date)}</div>
          </div>
          {(ag.sections||[]).map((s:any,i:number)=><div key={i} style={{marginBottom:8,padding:"8px 10px",background:i%2===0?colors.g1:cardBg,borderRadius:6}}>
            <div style={{fontSize:12,fontWeight:700,color:colors.nv}}>{i+1}. {s.t}</div>
            {s.sub&&s.sub.length>0&&s.sub.map((sb:string,j:number)=><div key={j} style={{fontSize:10,color:colors.g5,paddingLeft:12}}>{"\u2022"} {sb}</div>)}
            {s.notes&&<div style={{fontSize:11,color:colors.bl,marginTop:3,fontStyle:"italic",paddingLeft:12}}>{"\u{1F4AC}"} {renderMentions(s.notes)}</div>}
            {s.atts&&s.atts.length>0&&<div style={{display:"flex",flexWrap:"wrap" as const,gap:3,marginTop:3,paddingLeft:12}}>{s.atts.map((a:any,j:number)=><a key={j} href={a.val} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:3,padding:"2px 8px",background:"#E8F4FD",borderRadius:12,fontSize:9,border:"1px solid #B3D9F2",textDecoration:"none",color:colors.bl}}>{a.label} {a.val.length>30?a.val.slice(0,30)+"...":a.val}</a>)}</div>}
          </div>)}
        </div>
      </Card>
    </div>);
  }

  /* NUEVA MINUTA */
  if(mode==="newMin"){
    const secVals=miSecs.length===MINSECS[tab].length?miSecs:MINSECS[tab].map(()=>"");
    return(<div style={{maxWidth:640}}>
      <Btn v="g" s="s" onClick={()=>sMode("home")} style={{marginBottom:12}}>{"\u2190"} Volver</Btn>
      <Card>
        <h2 style={{margin:"0 0 14px",fontSize:17,color:colors.nv,fontWeight:800}}>{"\u{1F4DD}"} Nueva Minuta {"\u2013"} {tmpl.title}</h2>
        {draftRestored&&<div style={{padding:8,background:"#DBEAFE",borderRadius:8,fontSize:11,color:"#1E40AF",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span>Borrador recuperado</span><button onClick={()=>{localStorage.removeItem(draftKey);sDraftRestored(false);resetMin();}} style={{background:"none",border:"none",color:"#1E40AF",textDecoration:"underline",cursor:"pointer",fontSize:11}}>Descartar</button></div>}
        {miAgId&&<div style={{padding:8,background:"#EDE9FE",borderRadius:8,fontSize:11,color:"#5B21B6",marginBottom:12}}>{"\u{1F4CB}"} Vinculada a Orden del D{"\u00ED"}a #{miAgId}</div>}
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8,marginBottom:10}}>
          <div><label style={{fontSize:11,fontWeight:600,color:colors.g5}}>Fecha</label><input type="date" value={miDate} onChange={e=>sMiDate(e.target.value)} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
          <div><label style={{fontSize:11,fontWeight:600,color:colors.g5}}>Lugar</label><input value={miLugar} onChange={e=>sMiLugar(e.target.value)} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8,marginBottom:10}}>
          <div><label style={{fontSize:11,fontWeight:600,color:colors.g5}}>Hora inicio</label><input type="time" value={miHI} onChange={e=>sMiHI(e.target.value)} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
          <div><label style={{fontSize:11,fontWeight:600,color:colors.g5}}>Hora cierre</label><input type="time" value={miHC} onChange={e=>sMiHC(e.target.value)} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
        </div>
        {tab==="area"&&<div style={{marginBottom:10}}><label style={{fontSize:11,fontWeight:600,color:colors.g5}}>{"\u00C1"}rea</label><select value={areaName} onChange={e=>{sAreaName(e.target.value);sDeptName("");}} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:12,marginTop:2}}><option value="">Seleccionar...</option>{areas.filter((a:any)=>a.id!==100&&a.id!==101).map((a:any)=><option key={a.id} value={a.name}>{a.icon} {a.name}</option>)}</select></div>}
        {tab==="area"&&areaName&&areaDepts.length>0&&<div style={{marginBottom:10}}><label style={{fontSize:11,fontWeight:600,color:colors.g5}}>Departamento</label><select value={deptName} onChange={e=>sDeptName(e.target.value)} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:12,marginTop:2}}><option value="">Todos los departamentos</option>{areaDepts.map((d:any)=><option key={d.id} value={d.name}>{d.name}</option>)}</select></div>}
        {members.length>0&&<div style={{marginBottom:10}}>
          <label style={{fontSize:11,fontWeight:600,color:colors.g5,marginBottom:4,display:"block"}}>Presentes</label>
          <div style={{display:"flex",flexWrap:"wrap" as const,gap:4}}>{members.map((m:any)=>{const name=m.n+" "+m.a;const chk=miPres.indexOf(name)>=0;return <label key={m.id} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:16,border:"1px solid "+(chk?colors.gn:colors.g3),background:chk?"#D1FAE5":cardBg,fontSize:10,cursor:"pointer"}}><input type="checkbox" checked={chk} onChange={()=>{if(chk)sMiPres(p=>p.filter(x=>x!==name));else sMiPres(p=>[...p,name]);}} style={{width:12,height:12}}/><span style={{fontWeight:chk?600:400}}>{m.cargo}: {name}</span></label>;})}</div>
          <div style={{fontSize:10,color:colors.g4,marginTop:4}}>Ausentes: {members.filter((m:any)=>miPres.indexOf(m.n+" "+m.a)<0).map((m:any)=>m.n+" "+m.a).join(", ")||"\u2013"}</div>
        </div>}
        <div style={{fontSize:12,fontWeight:700,color:colors.nv,marginBottom:8,marginTop:8}}>Contenido</div>
        {MINSECS[tab].map((title:string,i:number)=><div key={i} style={{marginBottom:8}}><label style={{fontSize:11,fontWeight:600,color:colors.g5}}>{i+1}. {title}</label><MentionInput users={users} value={secVals[i]||""} onChange={v=>{const n=[...secVals];n[i]=v;sMiSecs(n);}} rows={3} placeholder={"Completar "+title.toLowerCase()+"..."} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:11,resize:"vertical" as const,boxSizing:"border-box" as const,marginTop:2}}/></div>)}
        <div style={{marginTop:12,padding:12,background:"#FEF3C7",borderRadius:10,border:"1px solid #FDE68A"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><div style={{fontSize:12,fontWeight:700,color:"#92400E"}}>{"\u{1F4CB}"} Tareas asignadas</div><Btn v="w" s="s" onClick={()=>sMiTareas(p=>[...p,{desc:"",respId:"",fecha:""}])}>+ Agregar tarea</Btn></div>
          {miTareas.length===0&&<div style={{fontSize:11,color:colors.g4,textAlign:"center" as const,padding:8}}>Sin tareas. Se crear{"\u00E1"}n autom{"\u00E1"}ticamente al finalizar la minuta.</div>}
          {miTareas.map((t:any,i:number)=><div key={i} style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr auto auto auto",gap:6,marginBottom:6,alignItems:"end"}}>
            <div><label style={{fontSize:9,color:colors.g5}}>Tarea</label><MentionInput as="input" users={users} value={t.desc} onChange={v=>{const n=[...miTareas];n[i]={...n[i],desc:v};sMiTareas(n);}} placeholder="Descripci\u00F3n..." style={{width:"100%",padding:6,borderRadius:6,border:"1px solid "+colors.g3,fontSize:11,boxSizing:"border-box" as const}}/></div>
            <div><label style={{fontSize:9,color:colors.g5}}>Responsable</label><select value={t.respId} onChange={e=>{const n=[...miTareas];n[i]={...n[i],respId:e.target.value};sMiTareas(n);}} style={{padding:6,borderRadius:6,border:"1px solid "+colors.g3,fontSize:11}}><option value="">Seleccionar...</option>{stf.map((u:any)=><option key={u.id} value={u.id}>{fn(u)}</option>)}</select></div>
            <div><label style={{fontSize:9,color:colors.g5}}>Fecha</label><input type="date" value={t.fecha} onChange={e=>{const n=[...miTareas];n[i]={...n[i],fecha:e.target.value};sMiTareas(n);}} style={{padding:6,borderRadius:6,border:"1px solid "+colors.g3,fontSize:11}}/></div>
            <button onClick={()=>sMiTareas(p=>p.filter((_:any,j:number)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:colors.rd,padding:"4px"}}>{"\u2715"}</button>
          </div>)}
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:14}}>
          <Btn v="g" onClick={()=>sMode("home")}>Cancelar</Btn>
          <Btn v="p" onClick={()=>{const aus=members.filter((m:any)=>miPres.indexOf(m.n+" "+m.a)<0).map((m:any)=>m.n+" "+m.a);onAddMin({id:0,type:tab,areaName:areaName||undefined,agendaId:miAgId,date:miDate,horaInicio:miHI,horaCierre:miHC,lugar:miLugar,presentes:[...miPres],ausentes:aus,sections:MINSECS[tab].map((t2:string,i2:number)=>({title:t2,content:secVals[i2]||""})),tareas:miTareas.filter((t2:any)=>t2.desc),status:"borrador",createdAt:TODAY});localStorage.removeItem(draftKey);sMode("home");}}>{"\u{1F4BE}"} Guardar borrador</Btn>
          <Btn v="r" onClick={()=>{const aus=members.filter((m:any)=>miPres.indexOf(m.n+" "+m.a)<0).map((m:any)=>m.n+" "+m.a);const vt=miTareas.filter((t2:any)=>t2.desc.trim());onAddMin({id:0,type:tab,areaName:areaName||undefined,agendaId:miAgId,date:miDate,horaInicio:miHI,horaCierre:miHC,lugar:miLugar,presentes:[...miPres],ausentes:aus,sections:MINSECS[tab].map((t2:string,i2:number)=>({title:t2,content:secVals[i2]||""})),tareas:miTareas.filter((t2:any)=>t2.desc),status:"final",createdAt:TODAY});if(vt.length>0)onCreateTasks(vt);localStorage.removeItem(draftKey);sMode("home");}}>{"\u2705"} Finalizar y crear tareas</Btn>
        </div>
      </Card>
    </div>);
  }

  /* EDITAR MINUTA */
  if(mode==="editMin"){
    const mi=minutas.find((m:any)=>m.id===selId);
    if(!mi) return <div><Btn v="g" s="s" onClick={()=>sMode("home")}>{"\u2190"} Volver</Btn><p>No encontrada</p></div>;
    const doSaveMin=(status?:string)=>{
      if(autoSaveRef.current)clearTimeout(autoSaveRef.current);
      const aus=members.filter((m:any)=>miPres.indexOf(m.n+" "+m.a)<0).map((m:any)=>m.n+" "+m.a);
      const secs=miSecs.map((c:string,i:number)=>({title:(mi.sections||[])[i]?.title||`Secci\u00F3n ${i+1}`,content:c}));
      const upd:any={sections:secs,tareas:miTareas.filter((t:any)=>t.desc),presentes:[...miPres],ausentes:aus,date:miDate,hora_inicio:miHI,hora_cierre:miHC,lugar:miLugar};
      if(status) upd.status=status;
      onUpdMin(mi.id,upd);
      if(status==="final"){const vt=miTareas.filter((t:any)=>t.desc.trim());if(vt.length>0)onCreateTasks(vt);}
      sMode("home");
    };
    return(<div style={{maxWidth:640}}>
      <Btn v="g" s="s" onClick={()=>{sSelId(mi.id);sMode("viewMin");}} style={{marginBottom:12}}>{"\u2190"} Volver a Minuta</Btn>
      <Card>
        <h2 style={{margin:"0 0 14px",fontSize:17,color:colors.nv,fontWeight:800}}>{"\u270F\uFE0F"} Editar Minuta {"\u2013"} {AGT[mi.type]?.title}{mi.areaName?" · "+mi.areaName:""}</h2>
        {mi.agendaId&&<div style={{padding:8,background:"#EDE9FE",borderRadius:8,fontSize:11,color:"#5B21B6",marginBottom:12}}>{"\u{1F4CB}"} Vinculada a Orden del D{"\u00ED"}a #{mi.agendaId}</div>}
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8,marginBottom:10}}>
          <div><label style={{fontSize:11,fontWeight:600,color:colors.g5}}>Fecha</label><input type="date" value={miDate} onChange={e=>sMiDate(e.target.value)} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
          <div><label style={{fontSize:11,fontWeight:600,color:colors.g5}}>Lugar</label><input value={miLugar} onChange={e=>sMiLugar(e.target.value)} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8,marginBottom:10}}>
          <div><label style={{fontSize:11,fontWeight:600,color:colors.g5}}>Hora inicio</label><input type="time" value={miHI} onChange={e=>sMiHI(e.target.value)} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
          <div><label style={{fontSize:11,fontWeight:600,color:colors.g5}}>Hora cierre</label><input type="time" value={miHC} onChange={e=>sMiHC(e.target.value)} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
        </div>
        {/* Presentes */}
        {members.length>0&&<div style={{marginBottom:10}}>
          <label style={{fontSize:11,fontWeight:600,color:colors.g5,marginBottom:4,display:"block"}}>Presentes</label>
          <div style={{display:"flex",flexWrap:"wrap" as const,gap:4}}>{members.map((m:any)=>{const name=m.n+" "+m.a;const chk=miPres.indexOf(name)>=0;return <label key={m.id} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:16,border:"1px solid "+(chk?colors.gn:colors.g3),background:chk?"#D1FAE5":cardBg,fontSize:10,cursor:"pointer"}}><input type="checkbox" checked={chk} onChange={()=>{if(chk)sMiPres(p=>p.filter(x=>x!==name));else sMiPres(p=>[...p,name]);}} style={{width:12,height:12}}/><span style={{fontWeight:chk?600:400}}>{m.cargo}: {name}</span></label>;})}</div>
        </div>}
        {/* Secciones editables */}
        <div style={{fontSize:12,fontWeight:700,color:colors.nv,marginBottom:8,marginTop:8}}>Contenido</div>
        {(mi.sections||[]).map((s:any,i:number)=><div key={i} style={{marginBottom:8}}><label style={{fontSize:11,fontWeight:600,color:colors.g5}}>{i+1}. {s.title}</label><MentionInput users={users} value={miSecs[i]||""} onChange={v=>{const n=[...miSecs];n[i]=v;sMiSecs(n);}} rows={3} placeholder={"Completar "+s.title.toLowerCase()+"..."} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:11,resize:"vertical" as const,boxSizing:"border-box" as const,marginTop:2}}/></div>)}
        {/* Tareas */}
        <div style={{marginTop:12,padding:12,background:"#FEF3C7",borderRadius:10,border:"1px solid #FDE68A"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><div style={{fontSize:12,fontWeight:700,color:"#92400E"}}>{"\u{1F4CB}"} Tareas asignadas</div><Btn v="w" s="s" onClick={()=>sMiTareas(p=>[...p,{desc:"",respId:"",fecha:""}])}>+ Agregar tarea</Btn></div>
          {miTareas.length===0&&<div style={{fontSize:11,color:colors.g4,textAlign:"center" as const,padding:8}}>Sin tareas. Agreg{"\u00E1"} tareas y finaliz{"\u00E1"} para crearlas en el sistema.</div>}
          {miTareas.map((t:any,i:number)=><div key={i} style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr auto auto auto",gap:6,marginBottom:6,alignItems:"end"}}>
            <div><label style={{fontSize:9,color:colors.g5}}>Tarea</label><MentionInput as="input" users={users} value={t.desc} onChange={v=>{const n=[...miTareas];n[i]={...n[i],desc:v};sMiTareas(n);}} placeholder="Descripci\u00F3n..." style={{width:"100%",padding:6,borderRadius:6,border:"1px solid "+colors.g3,fontSize:11,boxSizing:"border-box" as const}}/></div>
            <div><label style={{fontSize:9,color:colors.g5}}>Responsable</label><select value={t.respId} onChange={e=>{const n=[...miTareas];n[i]={...n[i],respId:e.target.value};sMiTareas(n);}} style={{padding:6,borderRadius:6,border:"1px solid "+colors.g3,fontSize:11}}><option value="">Seleccionar...</option>{stf.map((u:any)=><option key={u.id} value={u.id}>{fn(u)}</option>)}</select></div>
            <div><label style={{fontSize:9,color:colors.g5}}>Fecha</label><input type="date" value={t.fecha} onChange={e=>{const n=[...miTareas];n[i]={...n[i],fecha:e.target.value};sMiTareas(n);}} style={{padding:6,borderRadius:6,border:"1px solid "+colors.g3,fontSize:11}}/></div>
            <button onClick={()=>sMiTareas(p=>p.filter((_:any,j:number)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:colors.rd,padding:"4px"}}>{"\u2715"}</button>
          </div>)}
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",alignItems:"center",marginTop:14}}>
          {autoSaved&&<span style={{fontSize:10,color:colors.gn,marginRight:"auto"}}>Auto-guardado</span>}
          <Btn v="g" onClick={()=>{if(autoSaveRef.current)clearTimeout(autoSaveRef.current);sSelId(mi.id);sMode("viewMin");}}>Cancelar</Btn>
          <Btn v="p" onClick={()=>doSaveMin()}>{"\u{1F4BE}"} Guardar cambios</Btn>
          {mi.status==="borrador"&&<Btn v="r" onClick={()=>doSaveMin("final")}>{"\u2705"} Finalizar y crear tareas</Btn>}
        </div>
      </Card>
    </div>);
  }

  /* VER MINUTA */
  if(mode==="viewMin"){
    const mi=minutas.find((m:any)=>m.id===selId);
    if(!mi) return <div><Btn v="g" s="s" onClick={()=>sMode("home")}>{"\u2190"} Volver</Btn><p>No encontrada</p></div>;
    const enterEditMin=()=>{
      sMiDate(mi.date||TODAY);sMiHI(mi.horaInicio||"18:00");sMiHC(mi.horaCierre||"20:00");sMiLugar(mi.lugar||"Club Los Tordos");
      sMiPres(mi.presentes?[...mi.presentes]:[]);
      sMiSecs((mi.sections||[]).map((s:any)=>s.content||""));
      sMiTareas(mi.tareas?mi.tareas.map((t:any)=>({desc:t.desc||"",respId:t.respId||"",fecha:t.fecha||""})):[]);
      sAreaName(mi.areaName||"");
      sMode("editMin");
    };
    return(<div style={{maxWidth:640}}>
      <Btn v="g" s="s" onClick={()=>sMode("home")} style={{marginBottom:12}}>{"\u2190"} Volver</Btn>
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:4}}>
          <div/>
          <div style={{display:"flex",gap:4,flexWrap:"wrap" as const}}>
            <Btn v="g" s="s" onClick={enterEditMin}>{"\u270F\uFE0F"} Editar</Btn>
            <Btn v="g" s="s" onClick={()=>shareMinutaWhatsApp({type:mi.type,typeTitle:AGT[mi.type]?.title||"",areaName:mi.areaName,date:mi.date,horaInicio:mi.horaInicio,horaCierre:mi.horaCierre,lugar:mi.lugar,presentes:mi.presentes,ausentes:mi.ausentes,sections:mi.sections,tareas:(mi.tareas||[]).map((t:any)=>({desc:t.desc,resp:stf.find((u:any)=>u.id===t.respId)?fn(stf.find((u:any)=>u.id===t.respId)):"–",fecha:t.fecha})),status:mi.status})} title="Compartir por WhatsApp" style={{color:"#25D366"}}>WhatsApp</Btn>
            <Btn v="g" s="s" onClick={()=>exportMinutaPDF({type:mi.type,typeTitle:AGT[mi.type]?.title||"",areaName:mi.areaName,date:mi.date,horaInicio:mi.horaInicio,horaCierre:mi.horaCierre,lugar:mi.lugar,presentes:mi.presentes,ausentes:mi.ausentes,sections:mi.sections,tareas:(mi.tareas||[]).map((t:any)=>({desc:t.desc,resp:stf.find((u:any)=>u.id===t.respId)?fn(stf.find((u:any)=>u.id===t.respId)):"–",fecha:t.fecha})),status:mi.status})} title="Descargar PDF">PDF</Btn>
            <Btn v="g" s="s" onClick={()=>exportMinutaWord({type:mi.type,typeTitle:AGT[mi.type]?.title||"",areaName:mi.areaName,date:mi.date,horaInicio:mi.horaInicio,horaCierre:mi.horaCierre,lugar:mi.lugar,presentes:mi.presentes,ausentes:mi.ausentes,sections:mi.sections,tareas:(mi.tareas||[]).map((t:any)=>({desc:t.desc,resp:stf.find((u:any)=>u.id===t.respId)?fn(stf.find((u:any)=>u.id===t.respId)):"–",fecha:t.fecha})),status:mi.status})} title="Descargar Word">Word</Btn>
          </div>
        </div>
        <div style={{textAlign:"center" as const,borderBottom:"2px solid "+colors.nv,paddingBottom:12,marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:700,color:colors.g4,textTransform:"uppercase" as const}}>Los Tordos Rugby Club</div>
          <div style={{fontSize:16,fontWeight:800,color:colors.nv}}>Minuta {"\u2013"} {AGT[mi.type]?.title}{mi.areaName?" · "+mi.areaName:""}</div>
          <div style={{display:"flex",justifyContent:"center",gap:12,marginTop:4,fontSize:11,color:colors.g5}}><span>{"\u{1F4C5}"} {fmtD(mi.date)}</span>{mi.horaInicio&&<span>{"\u{1F550}"} {mi.horaInicio} {"\u2013"} {mi.horaCierre}</span>}{mi.lugar&&<span>{"\u{1F4CD}"} {mi.lugar}</span>}</div>
          <div style={{marginTop:6}}><span style={{fontSize:10,padding:"2px 10px",borderRadius:12,background:mi.status==="aprobada"?"#D1FAE5":mi.status==="final"?"#D1FAE5":"#FEF3C7",color:mi.status==="aprobada"?"#065F46":mi.status==="final"?"#065F46":"#92400E",fontWeight:600}}>{mi.status==="aprobada"?"\u2705 Aprobada":mi.status==="final"?"\u2705 Finalizada":"\u{1F4DD} Borrador"}</span></div>
        </div>
        {/* Approval panel */}
        {(()=>{const q=APPROVAL_QUORUM[mi.type];const apps=mi.approvals||[];if(!q||mi.status==="borrador")return null;const alreadyApproved=apps.some((a:any)=>a.userId===user.id);const canApprove=canApproveType(mi.type)&&mi.status==="final"&&!alreadyApproved;return <div style={{marginBottom:12,padding:12,borderRadius:10,border:"1px solid "+(mi.status==="aprobada"?"#6EE7B7":"#FDE68A"),background:mi.status==="aprobada"?"#ECFDF5":"#FFFBEB"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontSize:12,fontWeight:700,color:mi.status==="aprobada"?"#065F46":"#92400E"}}>{mi.status==="aprobada"?"\u2705 Minuta Aprobada":"Aprobaci\u00F3n de Minuta"}</div>
            <span style={{fontSize:11,fontWeight:700,color:mi.status==="aprobada"?"#065F46":"#92400E"}}>{apps.length}/{q}</span>
          </div>
          <div style={{height:6,background:mi.status==="aprobada"?"#A7F3D0":"#FDE68A",borderRadius:3,marginBottom:8}}><div style={{height:"100%",background:mi.status==="aprobada"?"#10B981":"#F59E0B",borderRadius:3,width:Math.min(100,apps.length/q*100)+"%",transition:"width 0.3s"}}/></div>
          {apps.length>0&&<div style={{marginBottom:8}}>{apps.map((a:any,i:number)=><div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 0",fontSize:11}}><span style={{color:a.vote==="rechazar"?"#DC2626":"#10B981"}}>{a.vote==="rechazar"?"\u274C":"\u2705"}</span><span style={{fontWeight:600,color:colors.nv}}>{a.userName}</span><span style={{color:colors.g4,fontSize:10}}>{fmtD(a.date)}</span></div>)}</div>}
          {canApprove&&<div style={{display:"flex",gap:8}}><Btn v="p" s="s" onClick={()=>onApproveMin(mi.id)} style={{background:"#10B981",border:"none",color:"#fff"}}>{"\u2705"} Aprobar</Btn><Btn v="p" s="s" onClick={()=>onRejectMin?.(mi.id)} style={{background:"#DC2626",border:"none",color:"#fff"}}>{"\u274C"} Rechazar</Btn></div>}
          {alreadyApproved&&mi.status!=="aprobada"&&<div style={{fontSize:11,color:apps.find((a:any)=>a.userId===user.id)?.vote==="rechazar"?"#DC2626":"#065F46",fontWeight:600}}>{apps.find((a:any)=>a.userId===user.id)?.vote==="rechazar"?"\u274C Rechazaste esta minuta":"\u2705 Ya aprobaste esta minuta"}</div>}
        </div>;})()}
        {(mi.presentes?.length>0||mi.ausentes?.length>0)&&<div style={{marginBottom:12,display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8}}>
          <div><div style={{fontSize:10,fontWeight:700,color:colors.gn,marginBottom:2}}>{"\u2705"} PRESENTES</div>{(mi.presentes||[]).map((p:string,i:number)=><div key={i} style={{fontSize:11,color:colors.nv}}>{"\u2022"} {p}</div>)}</div>
          <div><div style={{fontSize:10,fontWeight:700,color:colors.rd,marginBottom:2}}>{"\u274C"} AUSENTES</div>{(mi.ausentes||[]).length>0?(mi.ausentes||[]).map((a:string,i:number)=><div key={i} style={{fontSize:11,color:colors.g4}}>{"\u2022"} {a}</div>):<div style={{fontSize:11,color:colors.g4}}>{"\u2013"}</div>}</div>
        </div>}
        {(mi.sections||[]).map((s:any,i:number)=><div key={i} style={{marginBottom:10}}><div style={{fontSize:12,fontWeight:700,color:colors.nv,borderBottom:"1px solid "+colors.g2,paddingBottom:3,marginBottom:4}}>{i+1}. {s.title}</div><div style={{fontSize:11,color:colors.g5,paddingLeft:8,whiteSpace:"pre-wrap" as const}}>{s.content?renderMentions(s.content):"\u2013"}</div></div>)}
        {mi.tareas&&mi.tareas.length>0&&<div style={{marginTop:10,padding:10,background:"#FEF3C7",borderRadius:8,border:"1px solid #FDE68A"}}>
          <div style={{fontSize:12,fontWeight:700,color:"#92400E",marginBottom:6}}>{"\u{1F4CB}"} Tareas asignadas ({mi.tareas.length})</div>
          <table style={{width:"100%",borderCollapse:"collapse" as const,fontSize:11}}><thead><tr style={{background:"#FDE68A"}}>{["Tarea","Responsable","Fecha","Estado"].map((h,i)=><th key={i} style={{padding:"4px 6px",textAlign:"left" as const,fontSize:10}}>{h}</th>)}</tr></thead><tbody>
            {mi.tareas.map((t:any,i:number)=>{const resp=stf.find((u:any)=>u.id===t.respId);return <tr key={i} style={{borderBottom:"1px solid #FDE68A"}}><td style={{padding:"4px 6px"}}>{renderMentions(t.desc)}</td><td style={{padding:"4px 6px"}}>{resp?fn(resp):"\u2013"}</td><td style={{padding:"4px 6px"}}>{t.fecha||"\u2013"}</td><td style={{padding:"4px 6px"}}>{mi.status==="final"?<span style={{color:colors.gn,fontWeight:600}}>{"\u2705"} Creada</span>:<span style={{color:colors.g4}}>Pendiente</span>}</td></tr>;})}
          </tbody></table>
        </div>}
        <div style={{display:"flex",gap:4,justifyContent:"flex-end",marginTop:14}}>
          <Btn v="p" onClick={enterEditMin}>{"\u270F\uFE0F"} Editar Minuta</Btn>
        </div>
      </Card>
    </div>);
  }
  return null;
}
