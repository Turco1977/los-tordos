"use client";
import { useState, useMemo } from "react";
import { useC } from "@/lib/theme-context";
import { FREQ, TIPOS, fn } from "@/lib/constants";

const DOW=["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

function nextGenDate(t:any):string{
  if(!t.active)return"—";
  if(!t.last_generated)return"Hoy (primera vez)";
  const last=new Date(t.last_generated+"T12:00:00");
  const freq=FREQ[t.frequency];
  if(!freq)return"—";
  let next:Date;
  if(t.frequency==="mensual"||t.frequency==="trimestral"){
    const months=t.frequency==="mensual"?1:3;
    next=new Date(last.getFullYear(),last.getMonth()+months,t.day_of_month||1);
  } else {
    next=new Date(last.getTime()+freq.days*864e5);
  }
  const today=new Date();today.setHours(0,0,0,0);
  if(next<=today)return"Hoy (pendiente)";
  const diff=Math.ceil((next.getTime()-today.getTime())/864e5);
  if(diff===1)return"Mañana";
  if(diff<7)return"En "+diff+" días";
  return next.toISOString().slice(0,10).split("-").reverse().join("/");
}

function lastGenLabel(d:string|null){
  if(!d)return"Nunca";
  const today=new Date().toISOString().slice(0,10);
  if(d===today)return"Hoy";
  const diff=Math.ceil((new Date(today).getTime()-new Date(d).getTime())/864e5);
  if(diff===1)return"Ayer";
  if(diff<7)return"Hace "+diff+" días";
  return d.split("-").reverse().join("/");
}

export function RecurrentTasks({templates,users,deptos,areas,user,mob,peds,onAdd,onUpd,onDel}:any){
  const{colors,isDark,cardBg}=useC();
  const [mode,sMode]=useState<"list"|"form">("list");
  const [editing,sEditing]=useState<any>(null);
  const [form,sForm]=useState({name:"",description:"",tipo:"Administrativo",dept_id:"",assigned_to:"",frequency:"semanal",day_of_week:1,day_of_month:1,urgency:"Normal"});
  const [formErr,sFormErr]=useState("");
  const iS:any={width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,background:cardBg,color:colors.nv};

  const isAdmin=user&&(user.role==="admin"||user.role==="superadmin"||user.role==="coordinador");

  /* Stats */
  const activeCount=templates.filter((t:any)=>t.active).length;
  const pendingGen=templates.filter((t:any)=>{
    if(!t.active)return false;
    if(!t.last_generated)return true;
    const freq=FREQ[t.frequency];
    if(!freq)return false;
    const last=new Date(t.last_generated+"T12:00:00");
    let next:Date;
    if(t.frequency==="mensual"||t.frequency==="trimestral"){
      const months=t.frequency==="mensual"?1:3;
      next=new Date(last.getFullYear(),last.getMonth()+months,t.day_of_month||1);
    } else {
      next=new Date(last.getTime()+freq.days*864e5);
    }
    const today=new Date();today.setHours(0,0,0,0);
    return next<=today;
  }).length;

  /* Recently auto-generated tasks (last 7 days, tagged recurrente) */
  const recentAuto=useMemo(()=>{
    const week=new Date(Date.now()-7*864e5).toISOString().slice(0,10);
    return (peds||[]).filter((p:any)=>{
      const hasTag=(p.log||[]).some((l:any)=>l.act?.includes("(recurrente)"));
      return hasTag&&p.cAt>=week;
    }).slice(0,10);
  },[peds]);

  if(mode==="form"){
    const needsDow=form.frequency==="semanal"||form.frequency==="quincenal";
    const needsDom=form.frequency==="mensual"||form.frequency==="trimestral";
    return(<div style={{maxWidth:640}}>
      <button onClick={()=>{sMode("list");sEditing(null);}} style={{background:"none",border:"1px solid "+colors.g3,borderRadius:6,cursor:"pointer",fontSize:12,padding:"4px 10px",color:colors.g5,marginBottom:10}}>← Volver</button>
      <div style={{background:cardBg,borderRadius:14,padding:mob?16:24,border:"1px solid "+colors.g2}}>
        <div style={{fontSize:mob?16:18,fontWeight:800,color:colors.nv,marginBottom:14}}>{editing?"✏️ Editar Template":"🔁 Nueva Tarea Recurrente"}</div>
        {formErr&&<div style={{padding:"8px 12px",borderRadius:8,background:"#FEE2E2",border:"1px solid #FCA5A5",color:"#DC2626",fontSize:11,fontWeight:600,marginBottom:10}}>{formErr}</div>}

        <div style={{marginBottom:8}}>
          <label style={{fontSize:11,fontWeight:700,color:colors.g5,display:"block",marginBottom:3}}>Nombre de la tarea *</label>
          <input value={form.name} onChange={e=>{sForm({...form,name:e.target.value});if(e.target.value.trim())sFormErr("");}} placeholder="Ej: Informe semanal de avance" style={{...iS,border:"1px solid "+(formErr&&!form.name.trim()?"#DC2626":colors.g3)}}/>
        </div>

        <div style={{marginBottom:8}}>
          <label style={{fontSize:11,fontWeight:700,color:colors.g5,display:"block",marginBottom:3}}>Descripción</label>
          <textarea value={form.description} onChange={e=>sForm({...form,description:e.target.value})} rows={3} placeholder="Detalle de lo que debe hacerse..." style={{...iS,resize:"vertical" as const}}/>
        </div>

        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8,marginBottom:8}}>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:colors.g5,display:"block",marginBottom:3}}>Tipo</label>
            <select value={form.tipo} onChange={e=>sForm({...form,tipo:e.target.value})} style={iS}>
              {TIPOS.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:colors.g5,display:"block",marginBottom:3}}>Urgencia</label>
            <select value={form.urgency} onChange={e=>sForm({...form,urgency:e.target.value})} style={iS}>
              {["Normal","Alta","Crítica"].map(u=><option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8,marginBottom:8}}>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:colors.g5,display:"block",marginBottom:3}}>Asignar a</label>
            <select value={form.assigned_to} onChange={e=>sForm({...form,assigned_to:e.target.value})} style={iS}>
              <option value="">Sin asignar (se asigna al crear)</option>
              {users.map((u:any)=><option key={u.id} value={u.id}>{fn(u)}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:colors.g5,display:"block",marginBottom:3}}>Departamento</label>
            <select value={form.dept_id} onChange={e=>sForm({...form,dept_id:e.target.value})} style={iS}>
              <option value="">General</option>
              {areas.map((a:any)=><optgroup key={a.id} label={a.name}>
                {deptos.filter((d:any)=>d.aId===a.id).map((d:any)=><option key={d.id} value={d.id}>{d.name}</option>)}
              </optgroup>)}
            </select>
          </div>
        </div>

        <div style={{background:colors.g2,borderRadius:8,padding:"10px 12px",marginBottom:8}}>
          <div style={{fontSize:12,fontWeight:700,color:colors.nv,marginBottom:8}}>Frecuencia</div>
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8}}>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:colors.g5,display:"block",marginBottom:3}}>Repetir cada</label>
              <select value={form.frequency} onChange={e=>sForm({...form,frequency:e.target.value})} style={iS}>
                {Object.keys(FREQ).map(k=><option key={k} value={k}>{FREQ[k].i} {FREQ[k].l}</option>)}
              </select>
            </div>
            {needsDow&&<div>
              <label style={{fontSize:11,fontWeight:700,color:colors.g5,display:"block",marginBottom:3}}>Día de la semana</label>
              <select value={form.day_of_week} onChange={e=>sForm({...form,day_of_week:Number(e.target.value)})} style={iS}>
                {DOW.map((d,i)=><option key={i} value={i}>{d}</option>)}
              </select>
            </div>}
            {needsDom&&<div>
              <label style={{fontSize:11,fontWeight:700,color:colors.g5,display:"block",marginBottom:3}}>Día del mes</label>
              <select value={form.day_of_month} onChange={e=>sForm({...form,day_of_month:Number(e.target.value)})} style={iS}>
                {Array.from({length:28},(_,i)=>i+1).map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </div>}
          </div>
        </div>

        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:12}}>
          <button onClick={()=>{sMode("list");sEditing(null);}} style={{padding:"8px 16px",borderRadius:8,border:"1px solid "+colors.g3,background:"transparent",fontSize:12,cursor:"pointer",color:colors.g5}}>Cancelar</button>
          <button onClick={()=>{
            if(!form.name.trim()){sFormErr("El nombre es obligatorio");return;}
            const assignee=users.find((u:any)=>u.id===form.assigned_to);
            const data:any={
              name:form.name.trim(),
              description:form.description,
              tipo:form.tipo,
              dept_id:form.dept_id?Number(form.dept_id):null,
              assigned_to:form.assigned_to||null,
              assigned_name:assignee?fn(assignee):"",
              frequency:form.frequency,
              day_of_week:form.day_of_week,
              day_of_month:form.day_of_month,
              urgency:form.urgency,
            };
            if(editing){onUpd(editing.id,data);}
            else{data.created_by=user.id;data.created_by_name=fn(user);data.active=true;onAdd(data);}
            sMode("list");sEditing(null);
          }} style={{padding:"8px 16px",borderRadius:8,border:"none",background:colors.nv,color:isDark?"#0F172A":"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>{editing?"Guardar Cambios":"Crear Template"}</button>
        </div>
      </div>
    </div>);
  }

  // ── LIST ──
  return(<div style={{maxWidth:900}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <div>
        <h2 style={{margin:0,fontSize:mob?16:19,fontWeight:800,color:colors.nv}}>🔁 Tareas Recurrentes</h2>
        <p style={{color:colors.g4,fontSize:12,margin:"2px 0 0"}}>Templates de tareas que se generan automáticamente</p>
      </div>
      {isAdmin&&<button onClick={()=>{sForm({name:"",description:"",tipo:"Administrativo",dept_id:"",assigned_to:"",frequency:"semanal",day_of_week:1,day_of_month:1,urgency:"Normal"});sEditing(null);sFormErr("");sMode("form");}} style={{padding:"7px 14px",borderRadius:8,border:"none",background:colors.nv,color:isDark?"#0F172A":"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Nuevo Template</button>}
    </div>

    {/* Summary cards */}
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(3,1fr)",gap:8,marginBottom:16}}>
      <div style={{background:cardBg,borderRadius:10,padding:"10px 14px",border:"1px solid "+colors.g2}}>
        <div style={{fontSize:9,fontWeight:700,color:colors.g4,textTransform:"uppercase" as const}}>Templates activos</div>
        <div style={{fontSize:22,fontWeight:800,color:colors.nv}}>{activeCount}</div>
      </div>
      <div style={{background:cardBg,borderRadius:10,padding:"10px 14px",border:"1px solid "+colors.g2}}>
        <div style={{fontSize:9,fontWeight:700,color:colors.g4,textTransform:"uppercase" as const}}>Pendientes de generar</div>
        <div style={{fontSize:22,fontWeight:800,color:pendingGen>0?"#DC2626":colors.gn}}>{pendingGen}</div>
      </div>
      <div style={{background:cardBg,borderRadius:10,padding:"10px 14px",border:"1px solid "+colors.g2,gridColumn:mob?"1/3":"auto"}}>
        <div style={{fontSize:9,fontWeight:700,color:colors.g4,textTransform:"uppercase" as const}}>Generadas esta semana</div>
        <div style={{fontSize:22,fontWeight:800,color:colors.bl}}>{recentAuto.length}</div>
      </div>
    </div>

    {/* Template list */}
    {templates.length===0&&<div style={{background:cardBg,borderRadius:14,padding:32,textAlign:"center" as const,border:"1px solid "+colors.g2}}>
      <div style={{fontSize:32,marginBottom:8}}>🔁</div>
      <div style={{fontSize:13,color:colors.g4,marginBottom:4}}>No hay templates de tareas recurrentes.</div>
      <div style={{fontSize:11,color:colors.g4}}>Creá uno para automatizar la generación de tareas repetitivas.</div>
    </div>}

    <div style={{display:"flex",flexDirection:"column" as const,gap:8}}>
      {templates.map((t:any)=>{
        const freq=FREQ[t.frequency]||FREQ.semanal;
        const nextGen=nextGenDate(t);
        const isPending=nextGen.includes("Hoy");
        const area=t.dept_id?areas.find((a:any)=>deptos.find((d:any)=>d.id===t.dept_id&&d.aId===a.id)):null;

        return(<div key={t.id} style={{background:cardBg,borderRadius:12,padding:"12px 16px",border:"1px solid "+colors.g2,opacity:t.active?1:0.5}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",gap:8}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                <span style={{fontSize:14,fontWeight:700,color:colors.nv}}>{t.name}</span>
                <span style={{fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:8,background:freq.i==="📅"?"#DBEAFE":freq.i==="📆"?"#E0E7FF":freq.i==="🗓️"?"#FEF3C7":"#EDE9FE",color:freq.i==="📅"?"#3B82F6":freq.i==="📆"?"#4F46E5":freq.i==="🗓️"?"#D97706":"#7C3AED"}}>{freq.i} {freq.l}</span>
                {!t.active&&<span style={{fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:6,background:"#FEE2E2",color:"#DC2626"}}>Inactiva</span>}
                {isPending&&t.active&&<span style={{fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:6,background:"#FEF3C7",color:"#D97706",animation:"pulse 2s infinite"}}>Pendiente</span>}
              </div>
              {t.description&&<div style={{fontSize:11,color:colors.g5,marginBottom:4,lineHeight:1.4}}>{t.description}</div>}
              <div style={{display:"flex",gap:8,flexWrap:"wrap" as const,fontSize:10,color:colors.g4}}>
                {t.assigned_name&&<span>👤 {t.assigned_name}</span>}
                {area&&<span>📂 {area.name}</span>}
                <span>📌 {t.tipo}</span>
                {(t.frequency==="semanal"||t.frequency==="quincenal")&&<span>Cada {DOW[t.day_of_week]}</span>}
                {(t.frequency==="mensual"||t.frequency==="trimestral")&&<span>Día {t.day_of_month}</span>}
              </div>
              <div style={{display:"flex",gap:12,marginTop:6,fontSize:10}}>
                <span style={{color:colors.g4}}>Última: <strong style={{color:colors.nv}}>{lastGenLabel(t.last_generated)}</strong></span>
                <span style={{color:isPending?"#D97706":colors.g4}}>Próxima: <strong style={{color:isPending?"#D97706":colors.nv}}>{nextGen}</strong></span>
              </div>
            </div>
            {isAdmin&&<div style={{display:"flex",flexDirection:"column" as const,gap:4,flexShrink:0}}>
              {/* Toggle active */}
              <button onClick={()=>onUpd(t.id,{active:!t.active})} title={t.active?"Desactivar":"Activar"} style={{padding:"4px 8px",borderRadius:6,border:"1px solid "+(t.active?colors.gn+"40":"#FCA5A5"),background:t.active?"#D1FAE5":"#FEE2E2",fontSize:10,cursor:"pointer",color:t.active?"#059669":"#DC2626",fontWeight:600}}>{t.active?"✅ Activa":"❌ Inactiva"}</button>
              <button onClick={()=>{sForm({name:t.name,description:t.description||"",tipo:t.tipo||"Administrativo",dept_id:t.dept_id?String(t.dept_id):"",assigned_to:t.assigned_to||"",frequency:t.frequency||"semanal",day_of_week:t.day_of_week||1,day_of_month:t.day_of_month||1,urgency:t.urgency||"Normal"});sEditing(t);sFormErr("");sMode("form");}} style={{padding:"4px 8px",borderRadius:6,border:"1px solid "+colors.g3,background:"transparent",fontSize:10,cursor:"pointer",color:colors.nv}}>✏️ Editar</button>
              <button onClick={()=>{if(confirm("¿Eliminar este template?"))onDel(t.id);}} style={{padding:"4px 8px",borderRadius:6,border:"1px solid #FCA5A5",background:"transparent",fontSize:10,cursor:"pointer",color:"#DC2626"}}>🗑</button>
            </div>}
          </div>
        </div>);
      })}
    </div>

    {/* Recently auto-generated */}
    {recentAuto.length>0&&<div style={{marginTop:20}}>
      <div style={{fontSize:13,fontWeight:700,color:colors.nv,marginBottom:8}}>🔄 Generadas automáticamente (últimos 7 días)</div>
      <div style={{display:"flex",flexDirection:"column" as const,gap:4}}>
        {recentAuto.map((p:any)=><div key={p.id} style={{background:cardBg,borderRadius:8,padding:"8px 12px",border:"1px solid "+colors.g2,display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:11}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:9,padding:"1px 5px",borderRadius:4,background:"#DBEAFE",color:"#3B82F6",fontWeight:600}}>🔁 Recurrente</span>
            <span style={{color:colors.nv,fontWeight:600}}>#{p.id} {p.desc?.slice(0,40)}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            {p.asTo&&<span style={{color:colors.g4,fontSize:10}}>👤 {users.find((u:any)=>u.id===p.asTo)?fn(users.find((u:any)=>u.id===p.asTo)):""}</span>}
            <span style={{color:colors.g4,fontSize:9}}>{p.cAt}</span>
          </div>
        </div>)}
      </div>
    </div>}
  </div>);
}
