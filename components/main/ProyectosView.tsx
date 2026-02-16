"use client";
import { useState } from "react";
import { useC } from "@/lib/theme-context";
import { PJ_ST } from "@/lib/constants";

const PJ_EJES=["Deportivo","Social","Institucional","Infraestructura"];
const PJ_STATUS:{[k:string]:{l:string;c:string;bg:string}}={borrador:{l:"Borrador",c:"#6B7280",bg:"#F3F4F6"},enviado:{l:"Enviado",c:"#3B82F6",bg:"#DBEAFE"},aprobado:{l:"Aprobado",c:"#10B981",bg:"#D1FAE5"},rechazado:{l:"Rechazado",c:"#DC2626",bg:"#FEE2E2"}};
const emptyForm=()=>({nombre:"",responsable:"",equipo:"",obj_lograr:"",obj_beneficio:"",eje:"",adn:"",descripcion:"",duracion:"",etapas:"",rec_eco:"",rec_hum:"",rec_infra:"",riesgo_mal:"",riesgo_clave:"",entregables:""});
const parseFormData=(desc:string)=>{try{return JSON.parse(desc);}catch{return emptyForm();}};
const wordCount=(t:string)=>t.trim().split(/\s+/).filter(Boolean).length;

export function ProyectosView({projects,users,user,mob,onAddProject,onUpdProject,onDelProject}:any){
  const{colors,isDark,cardBg}=useC();
  const [mode,sMode]=useState<"list"|"form"|"view">("list");
  const [selProj,sSelProj]=useState<any>(null);
  const [form,sForm]=useState(emptyForm());
  const [editing,sEditing]=useState(false);
  const [formErr,sFormErr]=useState("");
  const upd=(k:string,v:string)=>{sForm(f=>({...f,[k]:v}));if(k==="nombre"&&v.trim())sFormErr("");};
  const iS:any={width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,background:cardBg,color:colors.nv};
  const tS:any={...iS,resize:"vertical" as const};
  const secHdr=(n:string,title:string)=><div style={{background:colors.g2,borderRadius:8,padding:"8px 12px",marginBottom:10,marginTop:n==="1"?0:16}}><span style={{fontSize:13,fontWeight:800,color:colors.nv}}>{n} {title}</span></div>;
  const field=(label:string,key:string,type?:"textarea"|"select")=><div style={{marginBottom:8}}>
    <label style={{fontSize:11,fontWeight:700,color:colors.g5,display:"block",marginBottom:3}}>{label}</label>
    {type==="textarea"?<textarea value={(form as any)[key]||""} onChange={e=>upd(key,e.target.value)} rows={3} style={tS}/>
    :type==="select"?<select value={(form as any)[key]||""} onChange={e=>upd(key,e.target.value)} style={iS}><option value="">Seleccionar...</option>{PJ_EJES.map(e=><option key={e} value={e}>{e}</option>)}</select>
    :<input value={(form as any)[key]||""} onChange={e=>upd(key,e.target.value)} style={iS}/>}
  </div>;
  const viewField=(label:string,val:string)=>val?<div style={{marginBottom:8}}><div style={{fontSize:10,fontWeight:700,color:colors.g4,textTransform:"uppercase" as const,marginBottom:2}}>{label}</div><div style={{fontSize:12,color:colors.nv,lineHeight:1.5,whiteSpace:"pre-wrap" as const}}>{val}</div></div>:null;

  // ── List ──
  if(mode==="list") return(<div style={{maxWidth:900}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <div><h2 style={{margin:0,fontSize:mob?16:19,fontWeight:800,color:colors.nv}}>📋 Proyectos</h2><p style={{color:colors.g4,fontSize:12,margin:"2px 0 0"}}>Modelo de Presentación de Proyectos · Plan 2035</p></div>
      <button onClick={()=>{sForm(emptyForm());sEditing(false);sMode("form");}} style={{padding:"7px 14px",borderRadius:8,border:"none",background:colors.nv,color:isDark?"#0F172A":"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Nuevo Proyecto</button>
    </div>
    {projects.length===0&&<div style={{background:cardBg,borderRadius:14,padding:32,textAlign:"center" as const,border:"1px solid "+colors.g2}}><div style={{fontSize:32,marginBottom:8}}>📋</div><div style={{fontSize:13,color:colors.g4,marginBottom:4}}>No hay proyectos presentados aún.</div><div style={{fontSize:11,color:colors.g4}}>Usá el botón "+ Nuevo Proyecto" para crear tu primera propuesta.</div></div>}
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(auto-fill,minmax(320px,1fr))",gap:12}}>
      {projects.map((p:any)=>{const fd=parseFormData(p.description);const st=PJ_STATUS[p.status]||PJ_STATUS.borrador;return(<div key={p.id} onClick={()=>{sSelProj(p);sMode("view");}} style={{background:cardBg,borderRadius:14,padding:16,border:"1px solid "+colors.g2,cursor:"pointer",boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:6}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:700,color:colors.nv,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{p.name||"Sin nombre"}</div>
            {fd.responsable&&<div style={{fontSize:11,color:colors.g5,marginTop:2}}>👤 {fd.responsable}</div>}
          </div>
          <span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:10,background:st.bg,color:st.c,flexShrink:0,marginLeft:8}}>{st.l}</span>
        </div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap" as const,marginBottom:6}}>
          {fd.eje&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:8,background:colors.g2,color:colors.nv,fontWeight:600}}>{fd.eje}</span>}
        </div>
        {fd.descripcion&&<div style={{fontSize:11,color:colors.g5,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as const}}>{fd.descripcion}</div>}
        <div style={{fontSize:9,color:colors.g4,marginTop:6}}>Por {p.created_by_name||"\u2014"} · {p.created_at?.slice(0,10)}</div>
      </div>);})}
    </div>
  </div>);

  // ── Form (create / edit) ──
  if(mode==="form") return(<div style={{maxWidth:720}}>
    <button onClick={()=>{sMode(selProj?"view":"list");if(!selProj)sSelProj(null);}} style={{background:"none",border:"1px solid "+colors.g3,borderRadius:6,cursor:"pointer",fontSize:12,padding:"4px 10px",color:colors.g5,marginBottom:10}}>← Volver</button>
    <div style={{background:cardBg,borderRadius:14,padding:mob?16:24,border:"1px solid "+colors.g2}}>
      <div style={{textAlign:"center" as const,marginBottom:16}}>
        <div style={{fontSize:mob?16:20,fontWeight:800,color:colors.nv}}>📝 Modelo de Presentación de Proyectos</div>
        <div style={{fontSize:12,color:colors.g4,marginTop:2}}>Los Tordos Rugby Club – Plan 2035</div>
      </div>

      {formErr&&<div style={{padding:"8px 12px",borderRadius:8,background:"#FEE2E2",border:"1px solid #FCA5A5",color:"#DC2626",fontSize:11,fontWeight:600,marginBottom:10}}>{formErr}</div>}
      {secHdr("1️⃣","Datos del Proyecto")}
      <div style={{marginBottom:8}}>
        <label style={{fontSize:11,fontWeight:700,color:colors.g5,display:"block",marginBottom:3}}>Nombre del proyecto *</label>
        <input value={form.nombre} onChange={e=>upd("nombre",e.target.value)} style={{...iS,border:"1px solid "+(formErr&&!form.nombre.trim()?"#DC2626":colors.g3)}}/>
      </div>
      {field("Responsable (socio proponente)","responsable")}
      {field("Equipo inicial","equipo","textarea")}

      {secHdr("2️⃣","Objetivo Central")}
      {field("¿Qué busca lograr?","obj_lograr","textarea")}
      {field("¿Qué beneficio genera para el club?","obj_beneficio","textarea")}

      {secHdr("3️⃣","Alineación Estratégica")}
      {field("Eje","eje","select")}
      {field("Alineación con ADN Tordos","adn","textarea")}

      {secHdr("4️⃣","Descripción Breve")}
      <div style={{marginBottom:8}}>
        <label style={{fontSize:11,fontWeight:700,color:colors.g5,display:"block",marginBottom:3}}>Explicado simple, como pitch de 2 minutos (máx. 200 palabras)</label>
        <textarea value={form.descripcion} onChange={e=>upd("descripcion",e.target.value)} rows={5} style={tS}/>
        <div style={{fontSize:10,color:wordCount(form.descripcion)>200?"#DC2626":colors.g4,textAlign:"right" as const,marginTop:2}}>{wordCount(form.descripcion)}/200 palabras</div>
      </div>

      {secHdr("5️⃣","Cronograma Tentativo")}
      {field("Duración estimada","duracion")}
      {field("Etapas principales","etapas","textarea")}

      {secHdr("6️⃣","Estimación Básica de Costos y Recursos")}
      {field("Recursos económicos","rec_eco","textarea")}
      {field("Recursos humanos","rec_hum","textarea")}
      {field("Infraestructura / equipamiento","rec_infra","textarea")}

      {secHdr("7️⃣","Riesgos y Condiciones Críticas")}
      {field("¿Qué puede salir mal?","riesgo_mal","textarea")}
      {field("¿Qué es clave para que funcione?","riesgo_clave","textarea")}

      {secHdr("8️⃣","Entregables Esperados")}
      {field("Resultado concreto y medible","entregables","textarea")}

      <div style={{background:colors.g2,borderRadius:8,padding:"10px 12px",marginTop:16,marginBottom:16}}>
        <div style={{fontSize:11,color:colors.g5}}>🎤 <strong>Formato de presentación:</strong> Pitch oral de 7 minutos en SE o CD.</div>
      </div>

      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <button onClick={()=>{sMode(selProj?"view":"list");if(!selProj)sSelProj(null);}} style={{padding:"8px 16px",borderRadius:8,border:"1px solid "+colors.g3,background:"transparent",fontSize:12,cursor:"pointer",color:colors.g5}}>Cancelar</button>
        <button onClick={()=>{if(!form.nombre.trim()){sFormErr("El nombre del proyecto es obligatorio");return;}const desc=JSON.stringify(form);if(editing&&selProj){onUpdProject(selProj.id,{name:form.nombre.trim(),description:desc});sSelProj({...selProj,name:form.nombre.trim(),description:desc});sMode("view");}else{onAddProject({name:form.nombre.trim(),description:desc,status:"borrador"});sMode("list");}}} style={{padding:"8px 16px",borderRadius:8,border:"none",background:colors.g4,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>Guardar Borrador</button>
        <button onClick={()=>{if(!form.nombre.trim()){sFormErr("El nombre del proyecto es obligatorio");return;}const desc=JSON.stringify(form);if(editing&&selProj){onUpdProject(selProj.id,{name:form.nombre.trim(),description:desc,status:"enviado"});sSelProj({...selProj,name:form.nombre.trim(),description:desc,status:"enviado"});sMode("view");}else{onAddProject({name:form.nombre.trim(),description:desc,status:"enviado"});sMode("list");}}} style={{padding:"8px 16px",borderRadius:8,border:"none",background:colors.nv,color:isDark?"#0F172A":"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>Enviar Proyecto</button>
      </div>
    </div>
  </div>);

  // ── View ──
  const p=selProj;
  const fd=parseFormData(p.description);
  const st=PJ_STATUS[p.status]||PJ_STATUS.borrador;
  const isAdmin=user&&(user.role==="admin"||user.role==="superadmin"||user.role==="coordinador");
  const isOwner=user&&p.created_by===user.id;

  return(<div style={{maxWidth:720}}>
    <button onClick={()=>{sMode("list");sSelProj(null);}} style={{background:"none",border:"1px solid "+colors.g3,borderRadius:6,cursor:"pointer",fontSize:12,padding:"4px 10px",color:colors.g5,marginBottom:10}}>← Volver a lista</button>
    <div style={{background:cardBg,borderRadius:14,padding:mob?16:24,border:"1px solid "+colors.g2}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:12}}>
        <div style={{flex:1}}>
          <div style={{fontSize:mob?18:22,fontWeight:800,color:colors.nv}}>{p.name}</div>
          <div style={{fontSize:11,color:colors.g4,marginTop:2}}>Presentado por {p.created_by_name||"\u2014"} · {p.created_at?.slice(0,10)}</div>
        </div>
        <span style={{fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:10,background:st.bg,color:st.c}}>{st.l}</span>
      </div>

      {secHdr("1️⃣","Datos del Proyecto")}
      {viewField("Nombre",fd.nombre)}
      {viewField("Responsable",fd.responsable)}
      {viewField("Equipo inicial",fd.equipo)}

      {secHdr("2️⃣","Objetivo Central")}
      {viewField("Qué busca lograr",fd.obj_lograr)}
      {viewField("Beneficio para el club",fd.obj_beneficio)}

      {secHdr("3️⃣","Alineación Estratégica")}
      {fd.eje&&<div style={{marginBottom:8}}><span style={{fontSize:11,padding:"3px 10px",borderRadius:8,background:colors.g2,color:colors.nv,fontWeight:700}}>{fd.eje}</span></div>}
      {viewField("Alineación con ADN Tordos",fd.adn)}

      {secHdr("4️⃣","Descripción Breve")}
      {viewField("",fd.descripcion)}

      {secHdr("5️⃣","Cronograma Tentativo")}
      {viewField("Duración",fd.duracion)}
      {viewField("Etapas principales",fd.etapas)}

      {secHdr("6️⃣","Estimación de Costos y Recursos")}
      {viewField("Recursos económicos",fd.rec_eco)}
      {viewField("Recursos humanos",fd.rec_hum)}
      {viewField("Infraestructura / equipamiento",fd.rec_infra)}

      {secHdr("7️⃣","Riesgos y Condiciones Críticas")}
      {viewField("Qué puede salir mal",fd.riesgo_mal)}
      {viewField("Clave para que funcione",fd.riesgo_clave)}

      {secHdr("8️⃣","Entregables Esperados")}
      {viewField("Resultado concreto y medible",fd.entregables)}

      <div style={{background:colors.g2,borderRadius:8,padding:"10px 12px",marginTop:16}}>
        <div style={{fontSize:11,color:colors.g5}}>🎤 <strong>Formato:</strong> Pitch oral de 7 minutos en SE o CD.</div>
      </div>

      {/* Actions */}
      <div style={{display:"flex",gap:8,justifyContent:"space-between",marginTop:16,flexWrap:"wrap" as const}}>
        <div style={{display:"flex",gap:6}}>
          {(isOwner||isAdmin)&&<button onClick={()=>{sForm({...emptyForm(),...fd,nombre:fd.nombre||p.name});sEditing(true);sMode("form");}} style={{padding:"7px 14px",borderRadius:8,border:"1px solid "+colors.g3,background:"transparent",fontSize:11,cursor:"pointer",color:colors.nv,fontWeight:600}}>✏️ Editar</button>}
          {(isOwner||isAdmin)&&<button onClick={()=>{if(confirm("¿Eliminar este proyecto?"))onDelProject(p.id);sMode("list");sSelProj(null);}} style={{padding:"7px 14px",borderRadius:8,border:"1px solid #FCA5A5",background:"transparent",fontSize:11,cursor:"pointer",color:"#DC2626",fontWeight:600}}>🗑 Eliminar</button>}
        </div>
        {isAdmin&&p.status==="enviado"&&<div style={{display:"flex",gap:6}}>
          <button onClick={()=>{if(confirm("¿Aprobar este proyecto? Esta acción no se puede deshacer.")){onUpdProject(p.id,{status:"aprobado"});sSelProj({...p,status:"aprobado"});}}} style={{padding:"7px 14px",borderRadius:8,border:"none",background:"#10B981",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>✅ Aprobar</button>
          <button onClick={()=>{if(confirm("¿Rechazar este proyecto? Esta acción no se puede deshacer.")){onUpdProject(p.id,{status:"rechazado"});sSelProj({...p,status:"rechazado"});}}} style={{padding:"7px 14px",borderRadius:8,border:"none",background:"#DC2626",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>❌ Rechazar</button>
        </div>}
      </div>
    </div>
  </div>);
}
