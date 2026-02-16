"use client";
import { useState, useRef, useCallback } from "react";
import { T, SC, PSC, AGT, ST, isOD, daysDiff, fn } from "@/lib/constants";
import { fmtD } from "@/lib/mappers";
import { Btn, Card } from "@/components/ui";
import { exportICal } from "@/lib/export";

const TODAY = new Date().toISOString().slice(0,10);

export default function CalView({peds,agendas,minutas,presu,reminders,areas,deptos,users,user,onSel,onAddReminder,onDelReminder,onNav,onDateChange,mob}:any){
  const MESES=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const DIAS_SEM=["Lu","Ma","Mi","Ju","Vi","Sá","Do"];
  const daysInMonth=(y:number,m:number)=>new Date(y,m+1,0).getDate();
  const firstDayOfMonth=(y:number,m:number)=>{const d=new Date(y,m,1).getDay();return d===0?6:d-1;};
  const toISO=(y:number,m:number,d:number)=>`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const getMonday=(dt:Date)=>{const d=new Date(dt);const day=d.getDay();const diff=d.getDate()-day+(day===0?-6:1);d.setDate(diff);return d;};
  const addDays=(dt:Date,n:number)=>{const d=new Date(dt);d.setDate(d.getDate()+n);return d;};
  const dateToISO=(dt:Date)=>dt.toISOString().slice(0,10);
  const REMIND_COLORS=["#3B82F6","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899"];

  const isPersonalUser=user.role==="enlace"||user.role==="manager"||user.role==="usuario";
  const [tab,sTab]=useState<"mes"|"sem"|"hoy">("mes");
  const [month,sMonth]=useState(()=>new Date());
  const [weekStart,sWeekStart]=useState(()=>getMonday(new Date()));
  const [selDay,sSelDay]=useState<string|null>(null);
  const [fTypes,sFTypes]=useState<Record<string,boolean>>({task:true,agenda:true,minuta:true,presu:true,reminder:true});
  const [fArea,sFArea]=useState("");
  /* reminder form */
  const [showAddR,sShowAddR]=useState(false);
  const [rForm,sRForm]=useState<any>({title:"",date:TODAY,description:"",color:"#3B82F6",recurrence:"none",assigned_to:"",assigned_name:""});
  const resetR=()=>{sRForm({title:"",date:TODAY,description:"",color:"#3B82F6",recurrence:"none",assigned_to:"",assigned_name:""});sShowAddR(false);};
  const RECUR_OPTS=[{k:"none",l:"Una vez"},{k:"weekly",l:"Semanal"},{k:"biweekly",l:"Quincenal"},{k:"monthly",l:"Mensual"},{k:"quarterly",l:"Trimestral"},{k:"yearly",l:"Anual"}];

  /* expand recurring reminders into visible date range (current year ±1) */
  const expandReminder=(r:any):{date:string;type:string;icon:string;color:string;label:string;sub?:string;data:any}[]=>{
    const rec=r.recurrence||"none";
    const base=new Date(r.date+"T12:00:00");
    if(isNaN(base.getTime()))return[];
    const results:{date:string;type:string;icon:string;color:string;label:string;sub?:string;data:any}[]=[];
    const recLabel=rec!=="none"?" 🔁":"";
    const makeEvt=(iso:string)=>({date:iso,type:"reminder",icon:"🔔",color:r.color||T.bl,label:r.title+recLabel,data:r});
    if(rec==="none"){results.push(makeEvt(r.date));return results;}
    const rangeStart=new Date();rangeStart.setFullYear(rangeStart.getFullYear()-1);
    const rangeEnd=new Date();rangeEnd.setFullYear(rangeEnd.getFullYear()+1);
    let cur=new Date(base);
    const allDates:Date[]=[];
    const step=(d:Date,forward:boolean)=>{const n=new Date(d);const dir=forward?1:-1;
      if(rec==="weekly")n.setDate(n.getDate()+7*dir);
      else if(rec==="biweekly")n.setDate(n.getDate()+14*dir);
      else if(rec==="monthly")n.setMonth(n.getMonth()+1*dir);
      else if(rec==="quarterly")n.setMonth(n.getMonth()+3*dir);
      else if(rec==="yearly")n.setFullYear(n.getFullYear()+1*dir);
      return n;};
    /* forward from base */
    cur=new Date(base);
    while(cur<=rangeEnd){if(cur>=rangeStart)allDates.push(new Date(cur));cur=step(cur,true);if(allDates.length>200)break;}
    /* backward from base */
    cur=step(new Date(base),false);
    while(cur>=rangeStart){allDates.push(new Date(cur));cur=step(cur,false);if(allDates.length>200)break;}
    allDates.forEach(d=>{const iso=d.toISOString().slice(0,10);results.push(makeEvt(iso));});
    return results;
  };

  /* build events */
  const events:{date:string;type:string;icon:string;color:string;label:string;sub?:string;data:any}[]=[];
  const myPeds=isPersonalUser?peds.filter((p:any)=>p.cId===user.id||p.asTo===user.id):peds;
  myPeds.filter((p:any)=>p.fReq).forEach((p:any)=>{const ag=users.find((u:any)=>u.id===p.asTo);events.push({date:p.fReq,type:"task",icon:SC[p.st]?.i||"📋",color:SC[p.st]?.c||T.bl,label:p.desc||"",sub:ag?fn(ag):undefined,data:p});});
  if(!isPersonalUser){
    agendas.filter((a:any)=>a.date).forEach((a:any)=>events.push({date:a.date,type:"agenda",icon:"📋",color:AGT[a.type]?.color||T.bl,label:"OD "+(AGT[a.type]?.title||""),data:a}));
    minutas.filter((m:any)=>m.date).forEach((m:any)=>events.push({date:m.date,type:"minuta",icon:"📝",color:AGT[m.type]?.color||T.gn,label:"Minuta "+(AGT[m.type]?.title||""),data:m}));
    presu.filter((pr:any)=>pr.solicitado_at).forEach((pr:any)=>events.push({date:pr.solicitado_at,type:"presu",icon:PSC[pr.status]?.i||"📤",color:PSC[pr.status]?.c||T.yl,label:pr.proveedor_nombre||"Presupuesto",data:pr}));
  }
  /* reminders — expand recurring */
  (reminders||[]).forEach((r:any)=>expandReminder(r).forEach(e=>events.push(e)));
  /* filter events */
  let fEvts=events.filter(e=>fTypes[e.type]);
  if(fArea){const ar=areas.find((a:any)=>a.id===Number(fArea));if(ar){const dIds=deptos.filter((d:any)=>d.aId===ar.id).map((d:any)=>d.id);fEvts=fEvts.filter(e=>{if(e.type==="task")return dIds.indexOf(e.data.dId)>=0;return true;});}}
  const evtsByDate=(d:string)=>fEvts.filter(e=>e.date===d);

  const handleEvtClick=(e:any)=>{
    if(e.type==="task"&&onSel) onSel(e.data);
    else if((e.type==="agenda"||e.type==="minuta")&&onNav) onNav("reun");
    else if(e.type==="presu"&&onNav) onNav("presu");
  };

  /* drag & drop state */
  const dragRef=useRef<{evt:any;fromDate:string}|null>(null);
  const [dragOverDate,sDragOverDate]=useState<string|null>(null);
  const handleDragStart=(e:any,evt:any)=>{if(evt.type!=="task")return;e.dataTransfer.effectAllowed="move";dragRef.current={evt,fromDate:evt.date};};
  const handleDragOver=(e:any,iso:string)=>{e.preventDefault();e.dataTransfer.dropEffect="move";if(dragOverDate!==iso)sDragOverDate(iso);};
  const handleDragLeave=()=>{sDragOverDate(null);};
  const handleDrop=useCallback((e:any,iso:string)=>{e.preventDefault();sDragOverDate(null);const d=dragRef.current;if(!d||!d.evt||d.fromDate===iso)return;if(d.evt.type==="task"&&onDateChange){onDateChange(d.evt.data.id,iso);}dragRef.current=null;},[onDateChange]);

  /* touch drag state for mobile */
  const touchRef=useRef<{evt:any;el:HTMLDivElement|null;clone:HTMLDivElement|null;startX:number;startY:number}|null>(null);
  const handleTouchStart=(te:any,evt:any)=>{if(evt.type!=="task")return;const t=te.touches[0];touchRef.current={evt,el:te.currentTarget,clone:null,startX:t.clientX,startY:t.clientY};};
  const handleTouchMove=useCallback((te:any)=>{const tr=touchRef.current;if(!tr)return;te.preventDefault();const t=te.touches[0];if(!tr.clone){const dx=Math.abs(t.clientX-tr.startX),dy=Math.abs(t.clientY-tr.startY);if(dx<8&&dy<8)return;const c=document.createElement("div");c.textContent=tr.evt.label;c.style.cssText="position:fixed;z-index:999;padding:4px 10px;border-radius:10px;background:"+tr.evt.color+"30;color:"+tr.evt.color+";font-size:11px;font-weight:700;pointer-events:none;box-shadow:0 4px 12px rgba(0,0,0,.15);";document.body.appendChild(c);tr.clone=c;}tr.clone.style.left=t.clientX-40+"px";tr.clone.style.top=t.clientY-20+"px";},[]);
  const handleTouchEnd=useCallback((te:any)=>{const tr=touchRef.current;if(!tr)return;if(tr.clone){tr.clone.remove();const t=te.changedTouches[0];const el=document.elementFromPoint(t.clientX,t.clientY);const dateCell=el?.closest?.("[data-date]") as HTMLElement|null;if(dateCell){const iso=dateCell.dataset.date;if(iso&&iso!==tr.evt.date&&tr.evt.type==="task"&&onDateChange){onDateChange(tr.evt.data.id,iso);}}};touchRef.current=null;},[onDateChange]);

  /* EVENT PILL */
  const EvtPill=({e,compact}:{e:any;compact?:boolean})=>(
    <div draggable={e.type==="task"} onDragStart={(ev)=>handleDragStart(ev,e)} onTouchStart={(ev)=>handleTouchStart(ev,e)} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onClick={(ev)=>{ev.stopPropagation();handleEvtClick(e);}} style={{padding:compact?"1px 4px":"3px 8px",borderRadius:10,background:e.color+"18",cursor:"pointer",overflow:"hidden"}} title={e.type==="reminder"?(e.label+(e.data.description?" — "+e.data.description:"")+(e.data.assigned_name?" → "+e.data.assigned_name:"")+(e.data.recurrence&&e.data.recurrence!=="none"?" (🔁 "+e.data.recurrence+")":"")+(e.data.user_name?" · por "+e.data.user_name:"")):e.label}>
      <div style={{display:"flex",alignItems:"center",gap:3}}>
        <span style={{fontSize:compact?8:10,flexShrink:0}}>{e.icon}</span>
        {!compact&&<span style={{fontSize:10,fontWeight:600,color:e.color,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,flex:1}}>{e.label}</span>}
        {!compact&&e.type==="reminder"&&onDelReminder&&<button onClick={(ev)=>{ev.stopPropagation();if(confirm("¿Eliminar recordatorio?"))onDelReminder(e.data.id);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:9,color:T.g4,padding:0,flexShrink:0}}>✕</button>}
      </div>
      {!compact&&e.sub&&<div style={{fontSize:9,color:T.g5,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>👤 {e.sub}</div>}
    </div>
  );

  /* FILTER BAR */
  const FilterBar=()=>(
    <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap" as const,alignItems:"center"}}>
      {[{k:"task",l:"Tareas",i:"📋"},{k:"agenda",l:"Reuniones",i:"📅"},{k:"minuta",l:"Minutas",i:"📝"},{k:"presu",l:"Presupuestos",i:"📤"},{k:"reminder",l:"Recordatorios",i:"🔔"}].filter(x=>!isPersonalUser||x.k==="task"||x.k==="reminder").map(ft=>(
        <button key={ft.k} onClick={()=>sFTypes(p=>({...p,[ft.k]:!p[ft.k]}))} style={{padding:"4px 10px",borderRadius:14,border:"1px solid "+(fTypes[ft.k]?T.nv:T.g3),background:fTypes[ft.k]?T.nv+"12":"#fff",color:fTypes[ft.k]?T.nv:T.g4,fontSize:10,fontWeight:600,cursor:"pointer"}}>{ft.i} {ft.l}</button>
      ))}
      {!isPersonalUser&&<select value={fArea} onChange={e=>sFArea(e.target.value)} style={{padding:"4px 8px",borderRadius:8,border:"1px solid "+T.g3,fontSize:10}}>
        <option value="">Todas las áreas</option>{areas.map((a:any)=><option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
      </select>}
      {onAddReminder&&<button onClick={()=>sShowAddR(!showAddR)} style={{padding:"4px 10px",borderRadius:14,border:"1px solid "+T.gn,background:showAddR?T.gn:T.gn+"12",color:showAddR?"#fff":T.gn,fontSize:10,fontWeight:600,cursor:"pointer"}}>+ Recordatorio</button>}
      <button onClick={()=>exportICal("los-tordos-calendario",events.map(e=>({title:e.label,date:e.date,description:e.type,type:e.type})))} style={{padding:"4px 10px",borderRadius:14,border:"1px solid "+T.bl,background:T.bl+"12",color:T.bl,fontSize:10,fontWeight:600,cursor:"pointer"}}>📅 iCal</button>
    </div>
  );

  /* MES VIEW */
  const MonthView=()=>{
    const y=month.getFullYear(),m=month.getMonth();
    const dim=daysInMonth(y,m),fd=firstDayOfMonth(y,m);
    const prevDim=daysInMonth(y,m===0?11:m-1);
    const cells:any[]=[];
    for(let i=fd-1;i>=0;i--) cells.push({d:prevDim-i,cur:false,iso:""});
    for(let d=1;d<=dim;d++) cells.push({d,cur:true,iso:toISO(y,m,d)});
    while(cells.length%7!==0) cells.push({d:cells.length-fd-dim+1,cur:false,iso:""});

    return(<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <button onClick={()=>sMonth(new Date(y,m-1,1))} style={{background:"none",border:"1px solid "+T.g3,borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:14,color:T.nv}}>◀</button>
        <div style={{fontSize:mob?14:16,fontWeight:800,color:T.nv}}>{MESES[m]} {y}</div>
        <button onClick={()=>sMonth(new Date(y,m+1,1))} style={{background:"none",border:"1px solid "+T.g3,borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:14,color:T.nv}}>▶</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1}}>
        {DIAS_SEM.map(d=><div key={d} style={{textAlign:"center" as const,fontSize:10,fontWeight:700,color:T.g4,padding:"4px 0"}}>{d}</div>)}
        {cells.map((c,i)=>{
          const dayEvts=c.cur?evtsByDate(c.iso):[];
          const isToday=c.iso===TODAY;
          const hasOverdue=dayEvts.some(e=>e.type==="task"&&e.data.st!=="ok"&&isOD(e.data.fReq));
          const isDragOver=dragOverDate===c.iso;
          return(<div key={i} data-date={c.iso} onClick={()=>{if(c.cur){sSelDay(selDay===c.iso?null:c.iso);}}} onDragOver={c.cur?(ev)=>handleDragOver(ev,c.iso):undefined} onDragLeave={c.cur?handleDragLeave:undefined} onDrop={c.cur?(ev)=>handleDrop(ev,c.iso):undefined} style={{minHeight:mob?44:80,padding:mob?"2px":"4px 6px",background:isDragOver?"#DBEAFE":(isToday?"#EFF6FF":(hasOverdue&&c.cur?"#FEF2F2":"#fff")),border:isDragOver?"2px dashed "+T.bl:(isToday?"2px solid "+T.bl:"1px solid "+T.g2),borderRadius:6,cursor:c.cur?"pointer":"default",overflow:"hidden",transition:"background .15s,border .15s"}}>
            <div style={{fontSize:mob?10:12,fontWeight:isToday?800:c.cur?600:400,color:c.cur?(isToday?T.bl:T.nv):T.g3,marginBottom:2}}>{c.d}</div>
            {c.cur&&!mob&&dayEvts.slice(0,3).map((e,j)=><div key={j} style={{marginBottom:1}}><EvtPill e={e}/></div>)}
            {c.cur&&mob&&dayEvts.length>0&&<div style={{display:"flex",gap:2,flexWrap:"wrap" as const}}>{dayEvts.slice(0,4).map((e,j)=><div key={j} style={{width:6,height:6,borderRadius:3,background:e.color}}/>)}</div>}
            {c.cur&&!mob&&dayEvts.length>3&&<div style={{fontSize:9,color:T.g4,fontWeight:600}}>+{dayEvts.length-3} más</div>}
            {c.cur&&mob&&dayEvts.length>4&&<div style={{fontSize:8,color:T.g4}}>+{dayEvts.length-4}</div>}
          </div>);
        })}
      </div>
      {/* Day detail panel */}
      {selDay&&<Card style={{marginTop:12,borderLeft:"4px solid "+T.bl}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{fontSize:14,fontWeight:800,color:T.nv}}>{selDay===TODAY?"Hoy — ":""}{fmtD(selDay)}</div>
          <button onClick={()=>sSelDay(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:T.g4}}>✕</button>
        </div>
        {evtsByDate(selDay).length===0&&<div style={{fontSize:12,color:T.g4,textAlign:"center" as const,padding:12}}>Sin eventos este día</div>}
        {evtsByDate(selDay).map((e,i)=><div key={i} style={{marginBottom:4}}><EvtPill e={e}/></div>)}
      </Card>}
    </div>);
  };

  /* SEMANA VIEW */
  const WeekView=()=>{
    const days:string[]=[];
    for(let i=0;i<7;i++) days.push(dateToISO(addDays(weekStart,i)));
    return(<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <button onClick={()=>sWeekStart(addDays(weekStart,-7))} style={{background:"none",border:"1px solid "+T.g3,borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:14,color:T.nv}}>◀</button>
        <div style={{fontSize:mob?12:14,fontWeight:800,color:T.nv}}>Semana del {fmtD(days[0])} al {fmtD(days[6])}</div>
        <button onClick={()=>sWeekStart(addDays(weekStart,7))} style={{background:"none",border:"1px solid "+T.g3,borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:14,color:T.nv}}>▶</button>
      </div>
      <div style={{display:mob?"flex":"grid",gridTemplateColumns:"repeat(7,1fr)",flexDirection:mob?"column" as const:undefined,gap:mob?6:4}}>
        {days.map((d,i)=>{
          const dayEvts=evtsByDate(d);
          const isToday=d===TODAY;
          const isDO=dragOverDate===d;
          return(<div key={i} data-date={d} onDragOver={(ev)=>handleDragOver(ev,d)} onDragLeave={handleDragLeave} onDrop={(ev)=>handleDrop(ev,d)} style={{background:isDO?"#DBEAFE":(isToday?"#EFF6FF":"#fff"),border:isDO?"2px dashed "+T.bl:(isToday?"2px solid "+T.bl:"1px solid "+T.g2),borderRadius:10,padding:mob?"10px 12px":"8px",minHeight:mob?undefined:120,transition:"background .15s,border .15s"}}>
            <div style={{fontSize:11,fontWeight:isToday?800:600,color:isToday?T.bl:T.nv,marginBottom:6}}>{DIAS_SEM[i]} {d.slice(8)}{isToday?" (Hoy)":""}</div>
            {dayEvts.length===0&&<div style={{fontSize:10,color:T.g3}}>—</div>}
            {dayEvts.map((e,j)=><div key={j} draggable={e.type==="task"} onDragStart={(ev)=>handleDragStart(ev,e)} onTouchStart={(ev)=>handleTouchStart(ev,e)} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} style={{marginBottom:3,cursor:"pointer"}} onClick={()=>handleEvtClick(e)}>
              <div style={{padding:"4px 8px",background:e.color+"12",borderRadius:8,border:"1px solid "+e.color+"30"}}>
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <span style={{fontSize:10}}>{e.icon}</span>
                  <span style={{fontSize:10,fontWeight:600,color:e.color,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{e.label}</span>
                </div>
                {e.sub&&<div style={{fontSize:9,color:T.g5,marginTop:1}}>👤 {e.sub}</div>}
              </div>
            </div>)}
          </div>);
        })}
      </div>
    </div>);
  };

  /* HOY VIEW */
  const TodayView=()=>{
    const todayEvts=evtsByDate(TODAY);
    const next7:string[]=[];for(let i=1;i<=7;i++) next7.push(dateToISO(addDays(new Date(),i)));
    const upcomingEvts=next7.flatMap(d=>evtsByDate(d).map(e=>({...e,dateLabel:fmtD(d)})));
    const overdueEvts=fEvts.filter(e=>e.type==="task"&&e.date<TODAY&&e.data.st!=="ok");
    return(<div>
      {overdueEvts.length>0&&<div style={{marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:700,color:"#DC2626",marginBottom:6}}>⏰ Tareas vencidas ({overdueEvts.length})</div>
        {overdueEvts.map((e,i)=><div key={i} style={{marginBottom:4,cursor:"pointer"}} onClick={()=>handleEvtClick(e)}>
          <div style={{padding:"6px 10px",background:"#FEF2F2",borderRadius:8,border:"1px solid #FECACA"}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:11}}>{e.icon}</span>
              <span style={{fontSize:11,fontWeight:600,color:"#DC2626",flex:1}}>{e.label}</span>
              <span style={{fontSize:9,color:T.g4,flexShrink:0}}>{fmtD(e.date)}</span>
            </div>
            {e.sub&&<div style={{fontSize:9,color:T.g5,marginTop:2,paddingLeft:20}}>👤 {e.sub}</div>}
          </div>
        </div>)}
      </div>}
      <div style={{marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:700,color:T.nv,marginBottom:6}}>Hoy — {fmtD(TODAY)}</div>
        {todayEvts.length===0&&<Card style={{textAlign:"center" as const,padding:20,color:T.g4}}><span style={{fontSize:20}}>📭</span><div style={{marginTop:4,fontSize:12}}>Sin eventos hoy</div></Card>}
        {todayEvts.map((e,i)=><div key={i} style={{marginBottom:4,cursor:"pointer"}} onClick={()=>handleEvtClick(e)}>
          <div style={{padding:"6px 10px",background:e.color+"12",borderRadius:8,border:"1px solid "+e.color+"30"}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:11}}>{e.icon}</span>
              <span style={{fontSize:11,fontWeight:600,color:e.color,flex:1}}>{e.label}</span>
              <span style={{fontSize:9,padding:"1px 6px",borderRadius:10,background:e.color+"20",color:e.color,fontWeight:600,flexShrink:0}}>{e.type}</span>
            </div>
            {e.sub&&<div style={{fontSize:9,color:T.g5,marginTop:2,paddingLeft:20}}>👤 {e.sub}</div>}
          </div>
        </div>)}
      </div>
      <div>
        <div style={{fontSize:13,fontWeight:700,color:T.nv,marginBottom:6}}>Próximos 7 días</div>
        {upcomingEvts.length===0&&<Card style={{textAlign:"center" as const,padding:20,color:T.g4}}><span style={{fontSize:20}}>✨</span><div style={{marginTop:4,fontSize:12}}>Sin eventos próximos</div></Card>}
        {upcomingEvts.map((e,i)=><div key={i} style={{marginBottom:4,cursor:"pointer"}} onClick={()=>handleEvtClick(e)}>
          <div style={{padding:"6px 10px",background:"#fff",borderRadius:8,border:"1px solid "+T.g2}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:11}}>{e.icon}</span>
              <span style={{fontSize:11,fontWeight:600,color:e.color,flex:1}}>{e.label}</span>
              <span style={{fontSize:9,color:T.g4,flexShrink:0}}>{(e as any).dateLabel}</span>
            </div>
            {e.sub&&<div style={{fontSize:9,color:T.g5,marginTop:2,paddingLeft:20}}>👤 {e.sub}</div>}
          </div>
        </div>)}
      </div>
    </div>);
  };

  return(<div style={{maxWidth:mob?undefined:900}}>
    <h2 style={{margin:"0 0 4px",fontSize:mob?16:19,color:T.nv,fontWeight:800}}>📅 Calendario</h2>
    <p style={{color:T.g4,fontSize:12,margin:"0 0 14px"}}>Vista unificada de eventos, tareas y reuniones</p>
    <div style={{display:"flex",gap:4,marginBottom:14}}>
      {([["mes","📅 Mes"],["sem","📋 Semana"],["hoy","📌 Hoy"]] as const).map(([k,l])=><button key={k} onClick={()=>sTab(k)} style={{padding:"6px 14px",borderRadius:8,border:"none",background:tab===k?T.nv:"#fff",color:tab===k?"#fff":T.g5,fontSize:12,fontWeight:600,cursor:"pointer"}}>{l}</button>)}
    </div>
    <FilterBar/>
    {showAddR&&onAddReminder&&<Card style={{marginBottom:14,background:"#F0FDF4",border:"1px solid #BBF7D0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div style={{fontSize:12,fontWeight:700,color:"#166534"}}>🔔 Nuevo recordatorio</div><button onClick={resetR} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:T.g4}}>✕</button></div>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8,marginBottom:8}}>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Título *</label><input value={rForm.title} onChange={e=>sRForm((p:any)=>({...p,title:e.target.value}))} placeholder="Ej: Pago cuota de luz, Fichas médicas..." style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Fecha inicio *</label><input type="date" value={rForm.date} onChange={e=>sRForm((p:any)=>({...p,date:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
      </div>
      <div style={{marginBottom:8}}><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Descripción</label><input value={rForm.description} onChange={e=>sRForm((p:any)=>({...p,description:e.target.value}))} placeholder="Detalles opcionales..." style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8,marginBottom:8}}>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Repetir</label><div style={{display:"flex",flexWrap:"wrap" as const,gap:3,marginTop:3}}>{RECUR_OPTS.map(o=><button key={o.k} onClick={()=>sRForm((p:any)=>({...p,recurrence:o.k}))} style={{padding:"3px 8px",borderRadius:12,fontSize:10,fontWeight:600,border:rForm.recurrence===o.k?"2px solid "+T.nv:"1px solid "+T.g3,background:rForm.recurrence===o.k?T.nv+"12":"#fff",color:rForm.recurrence===o.k?T.nv:T.g4,cursor:"pointer"}}>{o.l}</button>)}</div></div>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Asignar a (opcional)</label><select value={rForm.assigned_to||""} onChange={e=>sRForm((p:any)=>({...p,assigned_to:e.target.value,assigned_name:e.target.value?users.find((u:any)=>u.id===e.target.value)?(fn(users.find((u:any)=>u.id===e.target.value))):""
:""}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,marginTop:3}}><option value="">Yo mismo</option>{users.map((u:any)=><option key={u.id} value={u.id}>{fn(u)}</option>)}</select></div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Color:</label><div style={{display:"flex",gap:4}}>{REMIND_COLORS.map(c=><div key={c} onClick={()=>sRForm((p:any)=>({...p,color:c}))} style={{width:22,height:22,borderRadius:11,background:c,cursor:"pointer",border:rForm.color===c?"3px solid "+T.nv:"2px solid transparent"}}/>)}</div></div>
      <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}><Btn v="g" s="s" onClick={resetR}>Cancelar</Btn><Btn v="s" s="s" disabled={!rForm.title||!rForm.date} onClick={()=>{onAddReminder({title:rForm.title,date:rForm.date,description:rForm.description,color:rForm.color,recurrence:rForm.recurrence||"none",assigned_to:rForm.assigned_to||null,assigned_name:rForm.assigned_name||""});resetR();}}>🔔 Crear recordatorio</Btn></div>
    </Card>}
    {tab==="mes"&&<MonthView/>}
    {tab==="sem"&&<WeekView/>}
    {tab==="hoy"&&<TodayView/>}
  </div>);
}
