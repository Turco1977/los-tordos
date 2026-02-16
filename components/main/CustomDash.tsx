"use client";
import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useC } from "@/lib/theme-context";
import { ST, SC, fn, isOD, daysDiff, BOOK_FAC, BOOK_ST } from "@/lib/constants";
import { rlv } from "@/lib/mappers";
import { Card, Btn } from "@/components/ui";

/* Division color map (mirrors ReservasView) */
const DIV_COL:Record<string,string>={};
["Escuelita","M5","M6","M7","M8","M9","M10","M11","M12"].forEach(d=>{DIV_COL[d]="#10B981";});
["M13","M14"].forEach(d=>{DIV_COL[d]="#3B82F6";});
["M15","M16","M17","M18","M19"].forEach(d=>{DIV_COL[d]="#F59E0B";});
["Plantel Superior","Intermedia","Primera"].forEach(d=>{DIV_COL[d]="#DC2626";});
const DIV_KEYS=Object.keys(DIV_COL).sort((a,b)=>b.length-a.length);
const extractDiv=(title:string)=>{if(!title)return null;const t=title.trim();for(const d of DIV_KEYS){if(t.includes(d))return d;}const m=t.match(/M\d+/i);if(m)return m[0].toUpperCase();return null;};
const timeToMin=(t:string)=>{const [h,m]=t.split(":").map(Number);return h*60+(m||0);};
const getMonday=(dt:Date)=>{const d=new Date(dt);const day=d.getDay();const diff=d.getDate()-day+(day===0?-6:1);d.setDate(diff);return d;};
const addDays=(dt:Date,n:number)=>{const d=new Date(dt);d.setDate(d.getDate()+n);return d;};
const dateISO=(dt:Date)=>dt.toISOString().slice(0,10);
const DIAS_SEM=["Lu","Ma","Mi","Ju","Vi","Sa","Do"];
const FKEYS=Object.keys(BOOK_FAC);

const TODAY=new Date().toISOString().slice(0,10);

/* Widget definitions */
const WIDGET_META:Record<string,{title:string;icon:string;cols?:number}>={
  kpis:{title:"KPIs",icon:"📊",cols:2},
  deadlines:{title:"Próximos Vencimientos",icon:"📅"},
  activity:{title:"Actividad Reciente",icon:"📰"},
  workload:{title:"Carga de Trabajo",icon:"👥"},
  weekly:{title:"Resumen Semanal",icon:"📊"},
  areas:{title:"Áreas",icon:"🏉",cols:2},
  reports:{title:"Reportes",icon:"📄",cols:2},
  espacios:{title:"Espacios",icon:"🏟️",cols:2},
};
const DEFAULT_ORDER=["kpis","deadlines","activity","workload","weekly","areas","espacios","reports"];

type Layout={order:string[];hidden:string[]};

function loadLayout(userId:string):Layout{
  try{const raw=localStorage.getItem("dash-layout-"+userId);if(raw){const l=JSON.parse(raw);const saved=l.order||DEFAULT_ORDER;// append any new widgets not in saved order
  const missing=DEFAULT_ORDER.filter(id=>!saved.includes(id));return{order:[...saved,...missing],hidden:l.hidden||[]};}}catch{}
  return{order:[...DEFAULT_ORDER],hidden:[]};
}
function saveLayout(userId:string,layout:Layout){
  try{localStorage.setItem("dash-layout-"+userId,JSON.stringify(layout));}catch{}
}

export function CustomDash({peds,presu,agendas,minutas,users,areas,deptos,user,mob,bookings,onSel,onFilter,onNav,onExportWeekly,onExportMonthly,onAC}:any){
  const{colors,isDark,cardBg}=useC();
  const [layout,sLayout]=useState<Layout>(()=>loadLayout(user?.id||""));
  const [editing,sEditing]=useState(false);
  const dragItem=useRef<string|null>(null);
  const dragOver=useRef<string|null>(null);

  useEffect(()=>{if(user?.id)sLayout(loadLayout(user.id));},[user?.id]);

  const setAndSave=useCallback((l:Layout)=>{sLayout(l);if(user?.id)saveLayout(user.id,l);},[user?.id]);

  const isVisible=(id:string)=>!layout.hidden.includes(id);
  const toggleWidget=(id:string)=>{
    const h=layout.hidden.includes(id)?layout.hidden.filter(x=>x!==id):[...layout.hidden,id];
    setAndSave({...layout,hidden:h});
  };
  const resetLayout=()=>setAndSave({order:[...DEFAULT_ORDER],hidden:[]});

  /* Drag handlers */
  const onDragStart=(id:string)=>{dragItem.current=id;};
  const onDragEnter=(id:string)=>{dragOver.current=id;};
  const onDragEnd=()=>{
    if(!dragItem.current||!dragOver.current||dragItem.current===dragOver.current){dragItem.current=null;dragOver.current=null;return;}
    const arr=[...layout.order];
    const fromIdx=arr.indexOf(dragItem.current);
    const toIdx=arr.indexOf(dragOver.current);
    if(fromIdx<0||toIdx<0){dragItem.current=null;dragOver.current=null;return;}
    arr.splice(fromIdx,1);
    arr.splice(toIdx,0,dragItem.current);
    setAndSave({...layout,order:arr});
    dragItem.current=null;dragOver.current=null;
  };

  /* Data computations */
  const waStr=useMemo(()=>{const d=new Date();d.setDate(d.getDate()-7);return d.toISOString().slice(0,10);},[]);
  const active=useMemo(()=>peds.filter((p:any)=>p.st!==ST.OK),[peds]);
  const overdue=useMemo(()=>active.filter((p:any)=>isOD(p.fReq)),[active]);
  const upcoming=useMemo(()=>active.filter((p:any)=>p.fReq&&p.fReq>=TODAY&&daysDiff(TODAY,p.fReq)<=7).sort((a:any,b:any)=>(a.fReq||"").localeCompare(b.fReq||"")),[active]);
  const recentLogs=useMemo(()=>peds.flatMap((p:any)=>(p.log||[]).map((l:any)=>({...l,pId:p.id,pDesc:p.desc}))).sort((a:any,b:any)=>(b.dt||"").localeCompare(a.dt||"")).slice(0,8),[peds]);
  const workload=useMemo(()=>users.filter((u:any)=>rlv(u.role)>=2).map((u:any)=>{const tasks=active.filter((p:any)=>p.asTo===u.id);return{id:u.id,name:fn(u),count:tasks.length,overdue:tasks.filter((p:any)=>isOD(p.fReq)).length};}).filter((w:any)=>w.count>0).sort((a:any,b:any)=>b.count-a.count).slice(0,8),[users,active]);
  const maxWL=Math.max(...workload.map((w:any)=>w.count),1);
  const budgetApproved=useMemo(()=>presu.filter((pr:any)=>pr.status==="aprobado").reduce((s:number,pr:any)=>s+Number(pr.monto||0),0),[presu]);
  const createdThisWeek=useMemo(()=>peds.filter((p:any)=>p.cAt>=waStr).length,[peds,waStr]);
  const completedThisWeek=useMemo(()=>peds.filter((p:any)=>p.st===ST.OK&&p.log?.some((l:any)=>l.dt>=waStr)).length,[peds,waStr]);

  /* KPI data */
  const kpiData=useMemo(()=>{
    const ok=peds.filter((p:any)=>p.st===ST.OK).length;
    const pe=peds.filter((p:any)=>p.st===ST.P).length;
    const od=overdue.length;
    const gasto=peds.filter((p:any)=>p.monto).length;
    return[
      {k:"ok",l:"Completadas",v:ok,i:"✅",c:colors.gn,bg:colors.gn+"10"},
      {k:"pend",l:"Pendientes",v:pe,i:"🔴",c:colors.rd,bg:colors.rd+"10"},
      {k:"venc",l:"Vencidas",v:od,i:"⏰",c:"#DC2626",bg:"#DC262610"},
      {k:"gasto",l:"Con Gasto",v:gasto,i:"💰",c:colors.pr,bg:colors.pr+"10"},
    ];
  },[peds,overdue,colors]);

  /* Area circle data */
  const areaData=useMemo(()=>areas.map((a:any)=>{
    const dIds=deptos.filter((d:any)=>d.aId===a.id).map((d:any)=>d.id);
    const ap=peds.filter((p:any)=>dIds.indexOf(p.dId)>=0);
    const ok=ap.filter((p:any)=>p.st===ST.OK).length;
    const pct=ap.length?Math.round(ok/ap.length*100):0;
    return{...a,total:ap.length,ok,pct};
  }),[areas,deptos,peds]);

  /* Espacios weekly calendar data */
  const weekStart=useMemo(()=>getMonday(new Date()),[]);
  const weekDays=useMemo(()=>Array.from({length:7},(_,i)=>dateISO(addDays(weekStart,i))),[weekStart]);
  const cellBookings=useCallback((fk:string,d:string)=>(bookings||[]).filter((b:any)=>b.facility===fk&&b.date===d&&b.status!=="cancelada"),[bookings]);

  /* Widget renderers */
  const renderWidget=(id:string)=>{
    switch(id){
      case "kpis": return(<div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(4,1fr)",gap:8}}>
        {kpiData.map(k=><div key={k.k} onClick={()=>onFilter(k.k)} style={{background:cardBg,borderRadius:12,padding:"12px 14px",border:"1px solid "+colors.g2,cursor:"pointer",textAlign:"center" as const}}>
          <div style={{fontSize:22,fontWeight:800,color:k.c}}>{k.v}</div>
          <div style={{fontSize:10,color:colors.g5,marginTop:2}}>{k.i} {k.l}</div>
        </div>)}
      </div>);

      case "deadlines": return(<Card style={{padding:mob?"10px 12px":"14px 16px"}}>
        <div onClick={()=>onNav("cal")} style={{fontSize:13,fontWeight:700,color:colors.nv,marginBottom:8,cursor:"pointer"}}>📅 Próximos Vencimientos <span style={{fontSize:10,color:colors.bl}}>→</span></div>
        {upcoming.length===0&&<div style={{fontSize:11,color:colors.g4,padding:8}}>Sin vencimientos próximos</div>}
        {upcoming.slice(0,5).map((p:any)=>{const d=daysDiff(TODAY,p.fReq);return(<div key={p.id} onClick={()=>onSel(p)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:"1px solid "+colors.g1,cursor:"pointer",fontSize:11}}>
          <div style={{flex:1,minWidth:0}}><span style={{color:colors.g4}}>#{p.id}</span> <span style={{fontWeight:600,color:colors.nv}}>{(p.desc||"").slice(0,30)}</span></div>
          <span style={{fontSize:10,fontWeight:600,padding:"1px 6px",borderRadius:8,background:d<=1?"#FEE2E2":d<=3?"#FEF3C7":"#D1FAE5",color:d<=1?"#DC2626":d<=3?"#92400E":"#065F46",flexShrink:0}}>{d===0?"Hoy":d===1?"Mañana":d+" días"}</span>
        </div>);})}
      </Card>);

      case "activity": return(<Card style={{padding:mob?"10px 12px":"14px 16px"}}>
        <div onClick={()=>onNav("feed")} style={{fontSize:13,fontWeight:700,color:colors.nv,marginBottom:8,cursor:"pointer"}}>📰 Actividad Reciente <span style={{fontSize:10,color:colors.bl}}>→</span></div>
        {recentLogs.length===0&&<div style={{fontSize:11,color:colors.g4,padding:8}}>Sin actividad</div>}
        {recentLogs.map((l:any,i:number)=><div key={i} onClick={()=>{const p=peds.find((pp:any)=>pp.id===l.pId);if(p)onSel(p);}} style={{display:"flex",gap:6,padding:"3px 0",borderBottom:"1px solid "+colors.g1,fontSize:10,cursor:"pointer"}}>
          <div style={{width:6,height:6,borderRadius:3,background:l.t==="sys"?colors.bl:colors.gn,marginTop:4,flexShrink:0}}/>
          <div style={{flex:1,minWidth:0}}><span style={{fontWeight:600,color:colors.nv}}>{l.by}</span> <span style={{color:colors.g5}}>{(l.act||"").slice(0,35)}</span><div style={{fontSize:9,color:colors.g4}}>#{l.pId} · {(l.dt||"").slice(5,16)}</div></div>
        </div>)}
      </Card>);

      case "workload": return(<Card style={{padding:mob?"10px 12px":"14px 16px"}}>
        <div onClick={()=>onNav("kanban")} style={{fontSize:13,fontWeight:700,color:colors.nv,marginBottom:8,cursor:"pointer"}}>👥 Carga de Trabajo <span style={{fontSize:10,color:colors.bl}}>→</span></div>
        {workload.length===0&&<div style={{fontSize:11,color:colors.g4,padding:8}}>Sin tareas asignadas</div>}
        {workload.map((w:any)=><div key={w.id} style={{marginBottom:6}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:2}}><span style={{fontWeight:600,color:colors.nv}}>{w.name}</span><span style={{color:colors.g4}}>{w.count} tareas{w.overdue>0?<span style={{color:"#DC2626"}}> ({w.overdue} ⏰)</span>:""}</span></div>
          <div style={{height:8,background:colors.g1,borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",borderRadius:4,width:(w.count/maxWL*100)+"%",background:w.overdue>0?"#DC2626":w.count>5?colors.yl:colors.gn}}/></div>
        </div>)}
      </Card>);

      case "weekly": return(<Card style={{padding:mob?"10px 12px":"14px 16px"}}>
        <div style={{fontSize:13,fontWeight:700,color:colors.nv,marginBottom:8}}>📊 Resumen Semanal</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div onClick={()=>onNav("filter","ok")} style={{textAlign:"center" as const,padding:8,background:colors.gn+"10",borderRadius:8,cursor:"pointer"}}><div style={{fontSize:18,fontWeight:800,color:colors.gn}}>{completedThisWeek}</div><div style={{fontSize:9,color:colors.g5}}>Completadas</div></div>
          <div onClick={()=>onNav("kanban")} style={{textAlign:"center" as const,padding:8,background:colors.bl+"10",borderRadius:8,cursor:"pointer"}}><div style={{fontSize:18,fontWeight:800,color:colors.bl}}>{createdThisWeek}</div><div style={{fontSize:9,color:colors.g5}}>Nuevas</div></div>
          <div onClick={()=>onNav("filter","venc")} style={{textAlign:"center" as const,padding:8,background:"#DC262610",borderRadius:8,cursor:"pointer"}}><div style={{fontSize:18,fontWeight:800,color:"#DC2626"}}>{overdue.length}</div><div style={{fontSize:9,color:colors.g5}}>Vencidas</div></div>
          <div onClick={()=>onNav("presu")} style={{textAlign:"center" as const,padding:8,background:colors.pr+"10",borderRadius:8,cursor:"pointer"}}><div style={{fontSize:18,fontWeight:800,color:colors.pr}}>${budgetApproved.toLocaleString()}</div><div style={{fontSize:9,color:colors.g5}}>$ Aprobado</div></div>
        </div>
      </Card>);

      case "areas": return(<div style={{display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(auto-fill,minmax(140px,1fr))",gap:8}}>
        {areaData.map((a:any)=><div key={a.id} onClick={()=>onAC(a.id)} style={{background:cardBg,borderRadius:12,padding:"12px 10px",border:"1px solid "+colors.g2,cursor:"pointer",textAlign:"center" as const}}>
          <div style={{fontSize:18,marginBottom:4}}>{a.icon}</div>
          <div style={{fontSize:11,fontWeight:700,color:colors.nv,marginBottom:4}}>{a.name}</div>
          {/* Mini progress ring */}
          <svg width="48" height="48" viewBox="0 0 48 48" style={{display:"block",margin:"0 auto 4px"}}>
            <circle cx="24" cy="24" r="20" fill="none" stroke={colors.g2} strokeWidth="4"/>
            <circle cx="24" cy="24" r="20" fill="none" stroke={a.color} strokeWidth="4" strokeDasharray={2*Math.PI*20} strokeDashoffset={2*Math.PI*20*(1-a.pct/100)} strokeLinecap="round" transform="rotate(-90 24 24)"/>
            <text x="24" y="27" textAnchor="middle" fontSize="11" fontWeight="800" fill={colors.nv}>{a.pct}%</text>
          </svg>
          <div style={{fontSize:9,color:colors.g4}}>{a.ok}/{a.total} tareas</div>
        </div>)}
      </div>);

      case "reports": return(<div style={{display:"flex",gap:8,flexWrap:"wrap" as const}}>
        <Btn v="g" s="s" onClick={onExportWeekly}>Reporte Semanal</Btn>
        <Btn v="g" s="s" onClick={onExportMonthly}>Reporte Mensual</Btn>
      </div>);

      case "espacios": return(<Card style={{padding:mob?"10px 12px":"14px 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div onClick={()=>onNav("reservas")} style={{fontSize:13,fontWeight:700,color:colors.nv,cursor:"pointer"}}>🏟️ Espacios - Semana Actual <span style={{fontSize:10,color:colors.bl}}>→</span></div>
        </div>
        <div style={{overflowX:"auto" as const}}>
          <div style={{minWidth:600}}>
            {/* Header row */}
            <div style={{display:"grid",gridTemplateColumns:"90px repeat(7,1fr)",gap:2,marginBottom:2}}>
              <div style={{padding:"4px 6px",fontSize:9,fontWeight:700,color:colors.g4,background:isDark?"#1E293B":"#F8FAFC",borderRadius:4}}></div>
              {weekDays.map((d,i)=>{const isToday=d===TODAY;return(
                <div key={d} style={{padding:"4px 2px",textAlign:"center" as const,fontSize:9,fontWeight:isToday?800:600,color:isToday?colors.bl:colors.nv,background:isToday?(isDark?"#1E3A5F":"#EFF6FF"):(isDark?"#1E293B":"#F8FAFC"),borderRadius:4,border:isToday?"1px solid "+colors.bl:"none"}}>
                  {DIAS_SEM[i]} {d.slice(8)}/{d.slice(5,7)}
                </div>);
              })}
            </div>
            {/* Facility rows */}
            {FKEYS.map(fk=>{const fac=BOOK_FAC[fk];
              // Check if this facility has any bookings this week
              const hasAny=weekDays.some(d=>cellBookings(fk,d).length>0);
              if(!hasAny)return null;
              return(
              <div key={fk} style={{display:"grid",gridTemplateColumns:"90px repeat(7,1fr)",gap:2,marginBottom:2}}>
                <div style={{padding:"3px 4px",fontSize:8,fontWeight:700,color:fac.c,background:fac.c+"10",borderRadius:4,display:"flex",alignItems:"center",gap:2,borderLeft:"2px solid "+fac.c,lineHeight:1.1}}>
                  <span style={{fontSize:10}}>{fac.i}</span><span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{fac.l}</span>
                </div>
                {weekDays.map(d=>{
                  const cb=cellBookings(fk,d);
                  const isToday=d===TODAY;
                  const sorted=[...cb].sort((a:any,b:any)=>timeToMin(a.time_start)-timeToMin(b.time_start));
                  const groups:any[][]=[];
                  sorted.forEach((b:any)=>{
                    const last=groups[groups.length-1];
                    if(last&&last[0].time_start===b.time_start) last.push(b);
                    else groups.push([b]);
                  });
                  return(<div key={d} style={{padding:2,background:isToday?(isDark?"#1E3A5F10":"#EFF6FF50"):cardBg,border:"1px solid "+colors.g2,borderRadius:4,minHeight:28,display:"flex",flexDirection:"column" as const,gap:1,justifyContent:"flex-start"}}>
                    {cb.length===0&&<div style={{fontSize:8,color:colors.g3,textAlign:"center" as const,paddingTop:4}}>—</div>}
                    {groups.map((grp,gi)=>(
                      <div key={gi} style={{display:"flex",gap:1}}>
                        {grp.map((b:any)=>{const div=b.division||extractDiv(b.title);const dc=div?DIV_COL[div]:null;const st=BOOK_ST[b.status];return(
                          <div key={b.id} style={{padding:"2px 3px",borderRadius:3,background:dc?dc+"20":st?.bg||colors.g1,border:"1px solid "+(dc||st?.c||colors.g3)+"40",flex:1,minWidth:0}} title={(div?div+": ":"")+b.title+" ("+b.time_start+"-"+b.time_end+")"}>
                            <div style={{fontSize:8,fontWeight:800,color:dc||st?.c||colors.g5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,lineHeight:1.1}}>{div||b.title}</div>
                            <div style={{fontSize:7,color:dc||colors.g5,fontWeight:600}}>{b.time_start}</div>
                          </div>);})}
                      </div>))}
                  </div>);
                })}
              </div>);})}
          </div>
        </div>
      </Card>);

      default: return null;
    }
  };

  const visibleWidgets=layout.order.filter(id=>isVisible(id));

  return(<div>
    {/* Header */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:16}}>
      <div>
        <h2 style={{margin:"0 0 4px",fontSize:mob?16:19,color:colors.nv,fontWeight:800}}>Dashboard</h2>
        <p style={{color:colors.g4,fontSize:12,margin:0}}>KPIs institucionales · Manual Operativo 2035</p>
      </div>
      <button onClick={()=>sEditing(!editing)} style={{padding:"6px 12px",borderRadius:8,border:editing?"2px solid "+colors.bl:"1px solid "+colors.g3,background:editing?colors.bl+"10":cardBg,color:editing?colors.bl:colors.g5,fontSize:11,fontWeight:600,cursor:"pointer"}}>{editing?"✓ Listo":"⚙️ Personalizar"}</button>
    </div>

    {/* Edit panel */}
    {editing&&<div style={{background:cardBg,borderRadius:12,padding:"12px 16px",border:"1px solid "+colors.bl+"40",marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{fontSize:12,fontWeight:700,color:colors.nv}}>Personalizar Dashboard</div>
        <button onClick={resetLayout} style={{padding:"4px 10px",borderRadius:6,border:"1px solid "+colors.g3,background:"transparent",fontSize:10,cursor:"pointer",color:colors.g5}}>Resetear</button>
      </div>
      <div style={{fontSize:10,color:colors.g4,marginBottom:8}}>Arrastrá para reordenar · Click para mostrar/ocultar</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap" as const}}>
        {layout.order.map(id=>{
          const meta=WIDGET_META[id];if(!meta)return null;
          const vis=isVisible(id);
          return(<button key={id} onClick={()=>toggleWidget(id)} style={{padding:"5px 10px",borderRadius:8,border:"1px solid "+(vis?colors.gn+"40":"#FCA5A5"),background:vis?"#D1FAE5":"#FEE2E2",color:vis?"#059669":"#DC2626",fontSize:10,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
            <span>{meta.icon}</span>{meta.title}<span style={{fontSize:8}}>{vis?"✓":"✕"}</span>
          </button>);
        })}
      </div>
    </div>}

    {/* Widgets grid */}
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:mob?8:14,marginBottom:mob?12:18}}>
      {visibleWidgets.map(id=>{
        const meta=WIDGET_META[id];if(!meta)return null;
        const fullWidth=meta.cols===2;
        return(<div key={id}
          draggable={editing}
          onDragStart={()=>onDragStart(id)}
          onDragEnter={()=>onDragEnter(id)}
          onDragEnd={onDragEnd}
          onDragOver={e=>e.preventDefault()}
          style={{gridColumn:fullWidth?"1/-1":"auto",cursor:editing?"grab":"auto",opacity:1,position:"relative" as const,transition:"transform .15s"}}>
          {editing&&<div style={{position:"absolute" as const,top:4,right:4,zIndex:2,display:"flex",gap:3}}>
            <span style={{fontSize:10,padding:"2px 6px",borderRadius:4,background:colors.g2,color:colors.g4,cursor:"grab"}}>⠿</span>
          </div>}
          {renderWidget(id)}
        </div>);
      })}
    </div>
  </div>);
}
