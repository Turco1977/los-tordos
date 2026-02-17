"use client";
import { useState } from "react";
import { useC } from "@/lib/theme-context";
import { PJ_ST, PJ_PR } from "@/lib/constants";
import { UserPicker, FileField } from "@/components/ui";
import { exportProjectPDF } from "@/lib/export";

const PJ_EJES=["Deportivo","Social","Institucional","Infraestructura"];
const PJ_STATUS:{[k:string]:{l:string;c:string;bg:string}}={borrador:{l:"Borrador",c:"#6B7280",bg:"#F3F4F6"},enviado:{l:"Enviado",c:"#3B82F6",bg:"#DBEAFE"},aprobado:{l:"Aprobado",c:"#10B981",bg:"#D1FAE5"},rechazado:{l:"Rechazado",c:"#DC2626",bg:"#FEE2E2"}};
const emptyForm=()=>({nombre:"",responsable:"",equipo:"",obj_lograr:"",obj_beneficio:"",eje:"",adn:"",descripcion:"",duracion:"",etapas:"",rec_eco:"",rec_hum:"",rec_infra:"",riesgo_mal:"",riesgo_clave:"",entregables:""});
const parseFormData=(desc:any)=>{try{if(!desc||typeof desc!=="string")return emptyForm();return JSON.parse(desc)||emptyForm();}catch{return emptyForm();}};
const wordCount=(t:string)=>t.trim().split(/\s+/).filter(Boolean).length;
const COLS=Object.keys(PJ_ST) as string[];
const fmtAmt=(n:number)=>n.toLocaleString("es-AR");

export function ProyectosView({projects,projTasks,projBudgets,users,user,mob,onAddProject,onUpdProject,onDelProject,onAddTask,onUpdTask,onDelTask,onAddBudget,onDelBudget}:any){
  const{colors,isDark,cardBg}=useC();
  const [mode,sMode]=useState<"list"|"form"|"view">("list");
  const [selProj,sSelProj]=useState<any>(null);
  const [form,sForm]=useState(emptyForm());
  const [editing,sEditing]=useState(false);
  const [formErr,sFormErr]=useState("");
  const [viewTab,sViewTab]=useState<"tareas"|"presupuestos"|"propuesta">("tareas");
  const [taskForm,sTaskForm]=useState<any>(null);
  const [editTask,sEditTask]=useState<any>(null);
  const [taskSearch,sTaskSearch]=useState("");
  const [taskPriFilter,sTaskPriFilter]=useState<string>("all");
  const [showBudgetForm,sShowBudgetForm]=useState(false);
  const [budgetForm,sBudgetForm]=useState<{provider:string;options:{label:string;description:string;amount:string}[];file_url:string}>({provider:"",options:[{label:"Opción 1",description:"",amount:""},{label:"Opción 2",description:"",amount:""}],file_url:""});

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
  const viewField=(label:string,val:any)=>val&&typeof val==="string"?<div style={{marginBottom:8}}><div style={{fontSize:10,fontWeight:700,color:colors.g4,textTransform:"uppercase" as const,marginBottom:2}}>{label}</div><div style={{fontSize:12,color:colors.nv,lineHeight:1.5,whiteSpace:"pre-wrap" as const}}>{val}</div></div>:null;

  /* Task helpers */
  const projTasksFor=(pid:number)=>(projTasks||[]).filter((t:any)=>t.project_id===pid);
  const taskProgress=(pid:number)=>{const ts=projTasksFor(pid);const total=ts.length;const done=ts.filter((t:any)=>t.status==="done").length;return{total,done,pct:total?Math.round(done/total*100):0};};

  /* Budget helpers */
  const budgetsFor=(pid:number)=>(projBudgets||[]).filter((b:any)=>b.project_id===pid);
  const resetBudgetForm=()=>{sBudgetForm({provider:"",options:[{label:"Opción 1",description:"",amount:""},{label:"Opción 2",description:"",amount:""}],file_url:""});sShowBudgetForm(false);};

  /* View-mode computations (must be before early returns to keep hooks order stable) */
  const viewProj=selProj;
  const viewFd=viewProj?parseFormData(viewProj.description):emptyForm();
  const viewSt=viewProj?(PJ_STATUS[viewProj.status]||PJ_STATUS.borrador):PJ_STATUS.borrador;
  const viewTasks=viewProj?projTasksFor(viewProj.id):[];
  const viewProg=viewProj?taskProgress(viewProj.id):{total:0,done:0,pct:0};
  const viewBudgets=viewProj?budgetsFor(viewProj.id):[];
  const filteredTasks=(()=>{
    let ts=viewTasks;
    if(taskSearch){const s=taskSearch.toLowerCase();ts=ts.filter((t:any)=>((t.title||"")+(t.description||"")+(t.assignee_name||"")).toLowerCase().includes(s));}
    if(taskPriFilter!=="all")ts=ts.filter((t:any)=>t.priority===taskPriFilter);
    return ts;
  })();

  // ── List ──
  if(mode==="list") return(<div style={{maxWidth:900}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <div><h2 style={{margin:0,fontSize:mob?16:19,fontWeight:800,color:colors.nv}}>📋 Proyectos</h2><p style={{color:colors.g4,fontSize:12,margin:"2px 0 0"}}>Modelo de Presentación de Proyectos · Plan 2035</p></div>
      <button onClick={()=>{sForm(emptyForm());sEditing(false);sMode("form");}} style={{padding:"7px 14px",borderRadius:8,border:"none",background:colors.nv,color:isDark?"#0F172A":"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Nuevo Proyecto</button>
    </div>
    {projects.length===0&&<div style={{background:cardBg,borderRadius:14,padding:32,textAlign:"center" as const,border:"1px solid "+colors.g2}}><div style={{fontSize:32,marginBottom:8}}>📋</div><div style={{fontSize:13,color:colors.g4,marginBottom:4}}>No hay proyectos presentados aún.</div><div style={{fontSize:11,color:colors.g4}}>Usá el botón "+ Nuevo Proyecto" para crear tu primera propuesta.</div></div>}
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(auto-fill,minmax(320px,1fr))",gap:12}}>
      {projects.map((p:any)=>{const fd=parseFormData(p.description);const st=PJ_STATUS[p.status]||PJ_STATUS.borrador;const prog=taskProgress(p.id);return(<div key={p.id} onClick={()=>{sSelProj(p);sViewTab("tareas");sMode("view");}} style={{background:cardBg,borderRadius:14,padding:16,border:"1px solid "+colors.g2,cursor:"pointer",boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:6}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:700,color:colors.nv,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{p.name||"Sin nombre"}</div>
            {fd.responsable&&<div style={{fontSize:11,color:colors.g5,marginTop:2}}>👤 {fd.responsable}</div>}
          </div>
          <div style={{display:"flex",flexDirection:"column" as const,alignItems:"flex-end",gap:4,flexShrink:0,marginLeft:8}}>
            <span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:10,background:st.bg,color:st.c}}>{st.l}</span>
            {prog.pct===100&&prog.total>0&&<span style={{fontSize:8,fontWeight:700,padding:"2px 6px",borderRadius:8,background:"#D1FAE5",color:"#059669"}}>COMPLETE</span>}
          </div>
        </div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap" as const,marginBottom:6}}>
          {fd.eje&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:8,background:colors.g2,color:colors.nv,fontWeight:600}}>{fd.eje}</span>}
        </div>
        {fd.descripcion&&<div style={{fontSize:11,color:colors.g5,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as const,marginBottom:6}}>{fd.descripcion}</div>}
        {/* Progress bar */}
        {prog.total>0&&<div style={{marginBottom:4}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:colors.g4,marginBottom:2}}>
            <span>{prog.done}/{prog.total} tareas</span><span>{prog.pct}%</span>
          </div>
          <div style={{height:4,borderRadius:2,background:colors.g2,overflow:"hidden"}}>
            <div style={{height:"100%",width:prog.pct+"%",borderRadius:2,background:prog.pct===100?"#10B981":"#3B82F6",transition:"width .3s"}}/>
          </div>
        </div>}
        {/* Status summary pills */}
        {prog.total>0&&<div style={{display:"flex",gap:3,flexWrap:"wrap" as const,marginTop:4}}>
          {COLS.map(col=>{const cnt=projTasksFor(p.id).filter((t:any)=>t.status===col).length;return cnt>0?<span key={col} style={{fontSize:8,padding:"1px 5px",borderRadius:6,background:PJ_ST[col].bg,color:PJ_ST[col].c,fontWeight:600}}>{PJ_ST[col].i} {cnt}</span>:null;})}
        </div>}
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

  // ── View (detail with tabs) ──
  const p=viewProj;
  if(!p) return null;
  const fd=viewFd;
  const st=viewSt;
  const isAdmin=user&&(user.role==="admin"||user.role==="superadmin"||user.role==="coordinador");
  const isOwner=user&&p.created_by===user.id;
  const tasks=viewTasks;
  const prog=viewProg;
  const budgets=viewBudgets;

  // Comparison table data
  const maxOpts=budgets.reduce((mx:number,b:any)=>{const opts=Array.isArray(b.options)?b.options:(()=>{try{return JSON.parse(b.options)||[];}catch{return[];}})();return Math.max(mx,opts.length);},0);
  const parseBudgetOpts=(b:any)=>Array.isArray(b.options)?b.options:(()=>{try{return JSON.parse(b.options)||[];}catch{return[];}})();

  return(<div style={{maxWidth:mob?undefined:1100}}>
    <button onClick={()=>{sMode("list");sSelProj(null);sEditTask(null);sTaskForm(null);sShowBudgetForm(false);}} style={{background:"none",border:"1px solid "+colors.g3,borderRadius:6,cursor:"pointer",fontSize:12,padding:"4px 10px",color:colors.g5,marginBottom:10}}>← Volver a lista</button>

    {/* Project header */}
    <div style={{background:cardBg,borderRadius:14,padding:mob?"12px 14px":"14px 20px",border:"1px solid "+colors.g2,marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:8}}>
        <div style={{flex:1}}>
          <div style={{fontSize:mob?16:20,fontWeight:800,color:colors.nv}}>{p.name}</div>
          <div style={{fontSize:11,color:colors.g4,marginTop:2}}>Por {p.created_by_name||"\u2014"} · {p.created_at?.slice(0,10)}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:10,background:st.bg,color:st.c}}>{st.l}</span>
          {prog.pct===100&&prog.total>0&&<span style={{fontSize:9,fontWeight:700,padding:"3px 8px",borderRadius:8,background:"#D1FAE5",color:"#059669"}}>COMPLETE</span>}
        </div>
      </div>
      {/* Progress bar */}
      {prog.total>0&&<div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:colors.g4,marginBottom:3}}>
          <span>{prog.done} de {prog.total} tareas completadas</span><span style={{fontWeight:700,color:prog.pct===100?"#10B981":colors.nv}}>{prog.pct}%</span>
        </div>
        <div style={{height:6,borderRadius:3,background:colors.g2,overflow:"hidden"}}>
          <div style={{height:"100%",width:prog.pct+"%",borderRadius:3,background:prog.pct===100?"#10B981":"#3B82F6",transition:"width .3s"}}/>
        </div>
      </div>}
      {/* Actions */}
      <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap" as const}}>
        {(isOwner||isAdmin)&&<button onClick={()=>{sForm({...emptyForm(),...fd,nombre:fd.nombre||p.name});sEditing(true);sMode("form");}} style={{padding:"5px 10px",borderRadius:6,border:"1px solid "+colors.g3,background:"transparent",fontSize:10,cursor:"pointer",color:colors.nv,fontWeight:600}}>✏️ Editar</button>}
        {(isOwner||isAdmin)&&<button onClick={()=>{if(confirm("¿Eliminar este proyecto y todas sus tareas?"))onDelProject(p.id);sMode("list");sSelProj(null);}} style={{padding:"5px 10px",borderRadius:6,border:"1px solid #FCA5A5",background:"transparent",fontSize:10,cursor:"pointer",color:"#DC2626",fontWeight:600}}>🗑 Eliminar</button>}
        {isAdmin&&p.status==="enviado"&&<>
          <button onClick={()=>{if(confirm("¿Aprobar este proyecto?")){onUpdProject(p.id,{status:"aprobado"});sSelProj({...p,status:"aprobado"});}}} style={{padding:"5px 10px",borderRadius:6,border:"none",background:"#10B981",color:"#fff",fontSize:10,fontWeight:700,cursor:"pointer"}}>✅ Aprobar</button>
          <button onClick={()=>{if(confirm("¿Rechazar este proyecto?")){onUpdProject(p.id,{status:"rechazado"});sSelProj({...p,status:"rechazado"});}}} style={{padding:"5px 10px",borderRadius:6,border:"none",background:"#DC2626",color:"#fff",fontSize:10,fontWeight:700,cursor:"pointer"}}>❌ Rechazar</button>
        </>}
        <button onClick={()=>exportProjectPDF(p,fd,budgets.map((b:any)=>({...b,options:parseBudgetOpts(b)})),tasks,prog)} style={{padding:"5px 10px",borderRadius:6,border:"1px solid "+colors.g3,background:"transparent",fontSize:10,cursor:"pointer",color:colors.nv,fontWeight:600}}>📄 Informe</button>
      </div>
    </div>

    {/* Tabs */}
    <div style={{display:"flex",gap:2,marginBottom:12,overflowX:"auto" as const}}>
      {(["tareas","presupuestos","propuesta"] as const).map(tab=><button key={tab} onClick={()=>sViewTab(tab)} style={{padding:"7px 16px",borderRadius:"8px 8px 0 0",border:"1px solid "+colors.g2,borderBottom:viewTab===tab?"2px solid "+colors.nv:"1px solid "+colors.g2,background:viewTab===tab?cardBg:"transparent",fontSize:12,fontWeight:viewTab===tab?700:500,color:viewTab===tab?colors.nv:colors.g4,cursor:"pointer",whiteSpace:"nowrap" as const}}>{tab==="tareas"?"📊 Tablero de Tareas"+(prog.total>0?" ("+prog.total+")":""):tab==="presupuestos"?"💰 Presupuestos"+(budgets.length>0?" ("+budgets.length+")":""):"📝 Propuesta"}</button>)}
    </div>

    {/* ── TAREAS TAB ── */}
    {viewTab==="tareas"&&<div>
      {/* Toolbar */}
      <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap" as const,alignItems:"center"}}>
        <button onClick={()=>sTaskForm({title:"",description:"",status:"backlog",priority:"medium",assignee_id:"",due_date:""})} style={{padding:"6px 12px",borderRadius:8,border:"none",background:colors.nv,color:isDark?"#0F172A":"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>+ Tarea</button>
        <input value={taskSearch} onChange={e=>sTaskSearch(e.target.value)} placeholder="Buscar tarea..." style={{padding:"6px 10px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:11,width:mob?120:180,background:cardBg,color:colors.nv}}/>
        <select value={taskPriFilter} onChange={e=>sTaskPriFilter(e.target.value)} style={{padding:"6px 8px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:11,background:cardBg,color:colors.nv}}>
          <option value="all">Todas las prioridades</option>
          {Object.keys(PJ_PR).map(k=><option key={k} value={k}>{PJ_PR[k].i} {PJ_PR[k].l}</option>)}
        </select>
        {/* Status summary */}
        <div style={{display:"flex",gap:4,marginLeft:"auto"}}>
          {COLS.map(col=>{const cnt=tasks.filter((t:any)=>t.status===col).length;return <span key={col} style={{fontSize:9,padding:"2px 6px",borderRadius:6,background:PJ_ST[col].bg,color:PJ_ST[col].c,fontWeight:600}}>{PJ_ST[col].i} {cnt}</span>;})}
        </div>
      </div>

      {/* New task form */}
      {taskForm&&!editTask&&<div style={{background:cardBg,borderRadius:12,padding:14,border:"1px solid "+colors.g2,marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:700,color:colors.nv,marginBottom:8}}>Nueva Tarea</div>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8}}>
          <div style={{gridColumn:mob?"1":"1/3"}}>
            <input value={taskForm.title} onChange={e=>sTaskForm({...taskForm,title:e.target.value})} placeholder="Título de la tarea *" style={iS}/>
          </div>
          <div style={{gridColumn:mob?"1":"1/3"}}>
            <textarea value={taskForm.description} onChange={e=>sTaskForm({...taskForm,description:e.target.value})} placeholder="Descripción (opcional)" rows={2} style={tS}/>
          </div>
          <select value={taskForm.status} onChange={e=>sTaskForm({...taskForm,status:e.target.value})} style={iS}>
            {COLS.map(k=><option key={k} value={k}>{PJ_ST[k].i} {PJ_ST[k].l}</option>)}
          </select>
          <select value={taskForm.priority} onChange={e=>sTaskForm({...taskForm,priority:e.target.value})} style={iS}>
            {Object.keys(PJ_PR).map(k=><option key={k} value={k}>{PJ_PR[k].i} {PJ_PR[k].l}</option>)}
          </select>
          <UserPicker users={users} value={taskForm.assignee_id||""} onChange={(id:string,u:any)=>sTaskForm({...taskForm,assignee_id:id,assignee_name:u?((u.n||"")+" "+(u.a||"")).trim():""})} placeholder="Sin asignar"/>
          <input type="date" value={taskForm.due_date||""} onChange={e=>sTaskForm({...taskForm,due_date:e.target.value})} style={iS}/>
        </div>
        <div style={{display:"flex",gap:6,justifyContent:"flex-end",marginTop:8}}>
          <button onClick={()=>sTaskForm(null)} style={{padding:"6px 12px",borderRadius:6,border:"1px solid "+colors.g3,background:"transparent",fontSize:11,cursor:"pointer",color:colors.g5}}>Cancelar</button>
          <button onClick={()=>{if(!taskForm.title.trim())return;onAddTask({project_id:p.id,title:taskForm.title.trim(),description:taskForm.description||"",status:taskForm.status,priority:taskForm.priority,assignee_id:taskForm.assignee_id||null,assignee_name:taskForm.assignee_name||"",due_date:taskForm.due_date||null});sTaskForm(null);}} style={{padding:"6px 12px",borderRadius:6,border:"none",background:colors.nv,color:isDark?"#0F172A":"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>Crear Tarea</button>
        </div>
      </div>}

      {/* Kanban Board */}
      {tasks.length===0&&!taskForm?<div style={{background:cardBg,borderRadius:14,padding:32,textAlign:"center" as const,border:"1px solid "+colors.g2}}>
        <div style={{fontSize:28,marginBottom:8}}>📊</div>
        <div style={{fontSize:13,color:colors.g4,marginBottom:4}}>Este proyecto no tiene tareas aún.</div>
        <div style={{fontSize:11,color:colors.g4}}>Usá el botón "+ Tarea" para agregar la primera.</div>
      </div>:
      <div style={{display:"flex",gap:8,overflowX:"auto" as const,paddingBottom:8,...(mob?{flexDirection:"column" as const}:{})}}>
        {COLS.map(col=>{const colTasks=filteredTasks.filter((t:any)=>t.status===col);return(
          <div key={col} style={{minWidth:mob?"100%":200,flex:1,background:isDark?"rgba(255,255,255,.03)":"rgba(0,0,0,.02)",borderRadius:10,padding:8}}>
            {/* Column header */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,padding:"0 4px"}}>
              <div style={{display:"flex",alignItems:"center",gap:4}}>
                <span style={{fontSize:11}}>{PJ_ST[col].i}</span>
                <span style={{fontSize:11,fontWeight:700,color:PJ_ST[col].c}}>{PJ_ST[col].l}</span>
              </div>
              <span style={{fontSize:10,fontWeight:700,color:colors.g4,background:colors.g2,borderRadius:8,padding:"1px 6px"}}>{colTasks.length}</span>
            </div>
            {/* Cards */}
            <div style={{display:"flex",flexDirection:"column" as const,gap:6,minHeight:40}}>
              {colTasks.map((t:any)=>{
                const pri=PJ_PR[t.priority]||PJ_PR.medium;
                const isEditing=editTask?.id===t.id;
                const isOverdue=t.due_date&&t.status!=="done"&&t.due_date<new Date().toISOString().slice(0,10);

                if(isEditing) return(<div key={t.id} style={{background:cardBg,borderRadius:10,padding:10,border:"2px solid "+colors.nv}}>
                  <input value={editTask.title} onChange={e=>sEditTask({...editTask,title:e.target.value})} style={{...iS,marginBottom:6,fontWeight:700}}/>
                  <textarea value={editTask.description||""} onChange={e=>sEditTask({...editTask,description:e.target.value})} rows={2} placeholder="Descripción" style={{...tS,marginBottom:6}}/>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:6}}>
                    <select value={editTask.status} onChange={e=>sEditTask({...editTask,status:e.target.value})} style={iS}>
                      {COLS.map(k=><option key={k} value={k}>{PJ_ST[k].l}</option>)}
                    </select>
                    <select value={editTask.priority} onChange={e=>sEditTask({...editTask,priority:e.target.value})} style={iS}>
                      {Object.keys(PJ_PR).map(k=><option key={k} value={k}>{PJ_PR[k].i} {PJ_PR[k].l}</option>)}
                    </select>
                    <UserPicker users={users} value={editTask.assignee_id||""} onChange={(id:string,u:any)=>sEditTask({...editTask,assignee_id:id||null,assignee_name:u?((u.n||"")+" "+(u.a||"")).trim():""})} placeholder="Sin asignar"/>
                    <input type="date" value={editTask.due_date||""} onChange={e=>sEditTask({...editTask,due_date:e.target.value||null})} style={iS}/>
                  </div>
                  <div style={{display:"flex",gap:4,justifyContent:"space-between"}}>
                    <button onClick={()=>{if(confirm("¿Eliminar esta tarea?")){onDelTask(t.id);sEditTask(null);}}} style={{padding:"4px 8px",borderRadius:6,border:"1px solid #FCA5A5",background:"transparent",fontSize:10,cursor:"pointer",color:"#DC2626"}} title="Eliminar tarea">🗑</button>
                    <div style={{display:"flex",gap:4}}>
                      <button onClick={()=>sEditTask(null)} style={{padding:"4px 10px",borderRadius:6,border:"1px solid "+colors.g3,background:"transparent",fontSize:10,cursor:"pointer",color:colors.g5}}>Cancelar</button>
                      <button onClick={()=>{if(!editTask.title.trim())return;onUpdTask(t.id,{title:editTask.title.trim(),description:editTask.description||"",status:editTask.status,priority:editTask.priority,assignee_id:editTask.assignee_id||null,assignee_name:editTask.assignee_name||"",due_date:editTask.due_date||null});sEditTask(null);}} style={{padding:"4px 10px",borderRadius:6,border:"none",background:colors.nv,color:isDark?"#0F172A":"#fff",fontSize:10,fontWeight:700,cursor:"pointer"}}>Guardar</button>
                    </div>
                  </div>
                </div>);

                return(<div key={t.id} onClick={()=>sEditTask({...t})} style={{background:cardBg,borderRadius:10,padding:"8px 10px",border:"1px solid "+colors.g2,cursor:"pointer",borderLeft:"3px solid "+pri.c}}>
                  <div style={{fontSize:11,fontWeight:600,color:colors.nv,marginBottom:4,lineHeight:1.3}}>{String(t.title||"")}</div>
                  {t.description&&typeof t.description==="string"&&<div style={{fontSize:10,color:colors.g5,marginBottom:4,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as const}}>{t.description}</div>}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap" as const,gap:3}}>
                    <div style={{display:"flex",gap:3,alignItems:"center"}}>
                      <span style={{fontSize:8,padding:"1px 5px",borderRadius:4,background:pri.c+"15",color:pri.c,fontWeight:600}}>{pri.i} {pri.l}</span>
                      {isOverdue&&<span style={{fontSize:8,padding:"1px 5px",borderRadius:4,background:"#FEE2E2",color:"#DC2626",fontWeight:600}}>Vencida</span>}
                    </div>
                    <div style={{display:"flex",gap:3,alignItems:"center"}}>
                      {typeof t.due_date==="string"&&t.due_date&&<span style={{fontSize:9,color:isOverdue?"#DC2626":colors.g4}}>{t.due_date.slice(5).replace("-","/")}</span>}
                      {typeof t.assignee_name==="string"&&t.assignee_name&&<span style={{fontSize:9,color:colors.g4,maxWidth:60,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>👤 {t.assignee_name.split(" ")[0]}</span>}
                    </div>
                  </div>
                  {/* Quick status change buttons */}
                  <div style={{display:"flex",gap:2,marginTop:6}} onClick={e=>e.stopPropagation()}>
                    {COLS.filter(c=>c!==t.status).slice(0,3).map(c=><button key={c} onClick={()=>onUpdTask(t.id,{status:c})} title={"Mover a "+PJ_ST[c].l} style={{fontSize:8,padding:"2px 5px",borderRadius:4,border:"1px solid "+PJ_ST[c].c+"30",background:PJ_ST[c].bg,color:PJ_ST[c].c,cursor:"pointer",fontWeight:600}}>{PJ_ST[c].i}</button>)}
                  </div>
                </div>);
              })}
            </div>
          </div>
        );})}
      </div>}
    </div>}

    {/* ── PRESUPUESTOS TAB ── */}
    {viewTab==="presupuestos"&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontSize:14,fontWeight:700,color:colors.nv}}>💰 Presupuestos del Proyecto</div>
        {!showBudgetForm&&<button onClick={()=>sShowBudgetForm(true)} style={{padding:"6px 12px",borderRadius:8,border:"none",background:colors.nv,color:isDark?"#0F172A":"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>+ Agregar</button>}
      </div>

      {/* Budget form */}
      {showBudgetForm&&<div style={{background:cardBg,borderRadius:12,padding:14,border:"1px solid "+colors.g2,marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:700,color:colors.nv,marginBottom:10}}>Nuevo Presupuesto</div>
        <div style={{marginBottom:8}}>
          <label style={{fontSize:11,fontWeight:700,color:colors.g5,display:"block",marginBottom:3}}>Proveedor *</label>
          <input value={budgetForm.provider} onChange={e=>sBudgetForm({...budgetForm,provider:e.target.value})} placeholder="Nombre del proveedor" style={iS}/>
        </div>
        <div style={{marginBottom:8}}>
          <label style={{fontSize:11,fontWeight:700,color:colors.g5,display:"block",marginBottom:6}}>Opciones</label>
          {budgetForm.options.map((opt,i)=><div key={i} style={{display:"flex",gap:6,marginBottom:6,alignItems:"center"}}>
            <input value={opt.label} onChange={e=>{const opts=[...budgetForm.options];opts[i]={...opts[i],label:e.target.value};sBudgetForm({...budgetForm,options:opts});}} placeholder={"Opción "+(i+1)} style={{...iS,width:mob?100:140}}/>
            <input value={opt.description} onChange={e=>{const opts=[...budgetForm.options];opts[i]={...opts[i],description:e.target.value};sBudgetForm({...budgetForm,options:opts});}} placeholder="Descripción" style={{...iS,flex:1}}/>
            <div style={{position:"relative" as const}}>
              <span style={{position:"absolute" as const,left:8,top:"50%",transform:"translateY(-50%)",fontSize:12,color:colors.g4,pointerEvents:"none" as const}}>$</span>
              <input type="number" value={opt.amount} onChange={e=>{const opts=[...budgetForm.options];opts[i]={...opts[i],amount:e.target.value};sBudgetForm({...budgetForm,options:opts});}} placeholder="0" style={{...iS,width:mob?100:130,paddingLeft:20}}/>
            </div>
            {budgetForm.options.length>2&&<button onClick={()=>{const opts=budgetForm.options.filter((_,j)=>j!==i);sBudgetForm({...budgetForm,options:opts});}} style={{padding:"4px 6px",borderRadius:4,border:"1px solid #FCA5A5",background:"transparent",fontSize:10,cursor:"pointer",color:"#DC2626",flexShrink:0}} title="Quitar opción">✕</button>}
          </div>)}
          <button onClick={()=>sBudgetForm({...budgetForm,options:[...budgetForm.options,{label:"Opción "+(budgetForm.options.length+1),description:"",amount:""}]})} style={{padding:"4px 10px",borderRadius:6,border:"1px dashed "+colors.g3,background:"transparent",fontSize:10,cursor:"pointer",color:colors.g4}}>+ Agregar opción</button>
        </div>
        <div style={{marginBottom:10}}>
          <label style={{fontSize:11,fontWeight:700,color:colors.g5,display:"block",marginBottom:3}}>Archivo adjunto</label>
          <FileField value={budgetForm.file_url} onChange={(url:string)=>sBudgetForm({...budgetForm,file_url:url})} folder="project-budgets"/>
        </div>
        <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
          <button onClick={resetBudgetForm} style={{padding:"6px 12px",borderRadius:6,border:"1px solid "+colors.g3,background:"transparent",fontSize:11,cursor:"pointer",color:colors.g5}}>Cancelar</button>
          <button onClick={()=>{if(!budgetForm.provider.trim())return;const opts=budgetForm.options.map(o=>({label:o.label||"",description:o.description||"",amount:Number(o.amount)||0}));onAddBudget({project_id:p.id,provider:budgetForm.provider.trim(),options:opts,file_url:budgetForm.file_url||"",created_by_name:user?((user.n||"")+" "+(user.a||"")).trim():""});resetBudgetForm();}} style={{padding:"6px 12px",borderRadius:6,border:"none",background:colors.nv,color:isDark?"#0F172A":"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>Guardar</button>
        </div>
      </div>}

      {/* Budget list */}
      {budgets.length===0&&!showBudgetForm&&<div style={{background:cardBg,borderRadius:14,padding:32,textAlign:"center" as const,border:"1px solid "+colors.g2}}>
        <div style={{fontSize:28,marginBottom:8}}>💰</div>
        <div style={{fontSize:13,color:colors.g4,marginBottom:4}}>No hay presupuestos cargados.</div>
        <div style={{fontSize:11,color:colors.g4}}>Usá el botón "+ Agregar" para cargar la primera cotización.</div>
      </div>}

      {budgets.map((b:any)=>{const opts=parseBudgetOpts(b);return(
        <div key={b.id} style={{background:cardBg,borderRadius:12,padding:14,border:"1px solid "+colors.g2,marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontSize:13,fontWeight:700,color:colors.nv}}>🏢 {b.provider}</div>
            <button onClick={()=>{if(confirm("¿Eliminar este presupuesto?"))onDelBudget(b.id);}} style={{padding:"3px 7px",borderRadius:4,border:"1px solid #FCA5A5",background:"transparent",fontSize:10,cursor:"pointer",color:"#DC2626"}} title="Eliminar">🗑</button>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap" as const,marginBottom:8}}>
            {opts.map((o:any,i:number)=><div key={i} style={{background:isDark?"rgba(255,255,255,.05)":"#f8f9fa",borderRadius:8,padding:"8px 14px",minWidth:100,textAlign:"center" as const,border:"1px solid "+colors.g2}}>
              <div style={{fontSize:10,fontWeight:600,color:colors.g4,marginBottom:2}}>{o.label||"Opción "+(i+1)}</div>
              {o.description&&<div style={{fontSize:9,color:colors.g5,marginBottom:2}}>{o.description}</div>}
              <div style={{fontSize:14,fontWeight:800,color:colors.nv}}>${fmtAmt(o.amount||0)}</div>
            </div>)}
          </div>
          {b.file_url&&<div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:11,color:colors.g4}}>📎</span>
            <a href={b.file_url} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:"#3B82F6",textDecoration:"none",fontWeight:600}} onClick={e=>e.stopPropagation()}>Ver archivo</a>
          </div>}
          {b.created_by_name&&<div style={{fontSize:9,color:colors.g4,marginTop:4}}>Por {b.created_by_name} · {b.created_at?.slice(0,10)}</div>}
        </div>
      );})}

      {/* Comparison table */}
      {budgets.length>=2&&<div style={{background:cardBg,borderRadius:12,padding:14,border:"1px solid "+colors.g2,marginTop:14}}>
        <div style={{fontSize:13,fontWeight:700,color:colors.nv,marginBottom:10}}>📊 Resumen Comparativo</div>
        <div style={{overflowX:"auto" as const}}>
          <table style={{width:"100%",borderCollapse:"collapse" as const,fontSize:11}}>
            <thead>
              <tr>
                <th style={{padding:"6px 10px",textAlign:"left" as const,background:colors.nv,color:isDark?"#0F172A":"#fff",borderRadius:"6px 0 0 0",fontSize:10,fontWeight:700}}>Proveedor</th>
                {Array.from({length:maxOpts},(_,i)=><th key={i} style={{padding:"6px 10px",textAlign:"right" as const,background:colors.nv,color:isDark?"#0F172A":"#fff",fontSize:10,fontWeight:700,...(i===maxOpts-1?{borderRadius:"0 6px 0 0"}:{})}}>Opc {i+1}</th>)}
              </tr>
            </thead>
            <tbody>
              {budgets.map((b:any,bi:number)=>{const opts=parseBudgetOpts(b);return(
                <tr key={b.id} style={{background:bi%2?(isDark?"rgba(255,255,255,.03)":"#f9f9f9"):"transparent"}}>
                  <td style={{padding:"6px 10px",borderBottom:"1px solid "+colors.g2,fontWeight:600,color:colors.nv}}>{b.provider}</td>
                  {Array.from({length:maxOpts},(_,i)=>{
                    const opt=opts[i];
                    const amt=opt?.amount||0;
                    const colAmts=budgets.map((bb:any)=>{const oo=parseBudgetOpts(bb);return oo[i]?.amount||0;}).filter((a:number)=>a>0);
                    const isMin=colAmts.length>1&&amt>0&&amt===Math.min(...colAmts);
                    return <td key={i} style={{padding:"6px 10px",borderBottom:"1px solid "+colors.g2,textAlign:"right" as const,fontWeight:isMin?800:400,color:isMin?"#059669":colors.nv,background:isMin?(isDark?"rgba(16,185,129,.15)":"#D1FAE5"):"transparent"}}>{amt>0?"$"+fmtAmt(amt):"–"}</td>;
                  })}
                </tr>
              );})}
            </tbody>
          </table>
        </div>
        <div style={{fontSize:9,color:colors.g4,marginTop:6}}>✅ El menor precio por opción se resalta en verde</div>
      </div>}
    </div>}

    {/* ── PROPUESTA TAB ── */}
    {viewTab==="propuesta"&&<div style={{background:cardBg,borderRadius:14,padding:mob?16:24,border:"1px solid "+colors.g2}}>
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
    </div>}
  </div>);
}
