"use client";
import { useMemo } from "react";
import { useC } from "@/lib/theme-context";
import { ST, fn, isOD, daysDiff } from "@/lib/constants";
import { rlv } from "@/lib/mappers";
import { Card } from "@/components/ui";

const TODAY = new Date().toISOString().slice(0,10);

export function DashWidgets({peds,presu,agendas,minutas,users,areas,deptos,onSel,mob,onNav}:any){
  const{colors,isDark,cardBg}=useC();
  const waStr=useMemo(()=>{const d=new Date();d.setDate(d.getDate()-7);return d.toISOString().slice(0,10);},[]);
  const active=useMemo(()=>peds.filter((p:any)=>p.st!==ST.OK),[peds]);
  const overdue=useMemo(()=>active.filter((p:any)=>isOD(p.fReq)),[active]);
  const upcoming=useMemo(()=>active.filter((p:any)=>p.fReq&&p.fReq>=TODAY&&daysDiff(TODAY,p.fReq)<=7).sort((a:any,b:any)=>(a.fReq||"").localeCompare(b.fReq||"")),[active]);
  const recentLogs=useMemo(()=>peds.flatMap((p:any)=>(p.log||[]).map((l:any)=>({...l,pId:p.id,pDesc:p.desc}))).sort((a:any,b:any)=>(b.dt||"").localeCompare(a.dt||"")).slice(0,8),[peds]);
  /* Workload by user */
  const workload=useMemo(()=>users.filter((u:any)=>rlv(u.role)>=2).map((u:any)=>{const tasks=active.filter((p:any)=>p.asTo===u.id);return{id:u.id,name:fn(u),count:tasks.length,overdue:tasks.filter((p:any)=>isOD(p.fReq)).length};}).filter((w:any)=>w.count>0).sort((a:any,b:any)=>b.count-a.count).slice(0,8),[users,active]);
  const maxWL=Math.max(...workload.map((w:any)=>w.count),1);
  /* Budget summary */
  const budgetApproved=useMemo(()=>presu.filter((pr:any)=>pr.status==="aprobado").reduce((s:number,pr:any)=>s+Number(pr.monto||0),0),[presu]);
  /* Tasks created this week */
  const createdThisWeek=useMemo(()=>peds.filter((p:any)=>p.cAt>=waStr).length,[peds,waStr]);
  const completedThisWeek=useMemo(()=>peds.filter((p:any)=>p.st===ST.OK&&p.log?.some((l:any)=>l.dt>=waStr)).length,[peds,waStr]);

  return(<div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:mob?8:14,marginBottom:mob?12:18}}>
    {/* Widget 1: Upcoming Deadlines */}
    <Card style={{padding:mob?"10px 12px":"14px 16px"}}>
      <div onClick={()=>onNav&&onNav("cal")} style={{fontSize:13,fontWeight:700,color:colors.nv,marginBottom:8,cursor:"pointer"}}>📅 Próximos Vencimientos <span style={{fontSize:10,color:colors.bl}}>→</span></div>
      {upcoming.length===0&&<div style={{fontSize:11,color:colors.g4,padding:8}}>Sin vencimientos próximos</div>}
      {upcoming.slice(0,5).map((p:any)=>{const d=daysDiff(TODAY,p.fReq);return(<div key={p.id} onClick={()=>onSel(p)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:"1px solid "+colors.g1,cursor:"pointer",fontSize:11}}>
        <div style={{flex:1,minWidth:0}}><span style={{color:colors.g4}}>#{p.id}</span> <span style={{fontWeight:600,color:colors.nv}}>{(p.desc||"").slice(0,30)}</span></div>
        <span style={{fontSize:10,fontWeight:600,padding:"1px 6px",borderRadius:8,background:d<=1?"#FEE2E2":d<=3?"#FEF3C7":"#D1FAE5",color:d<=1?"#DC2626":d<=3?"#92400E":"#065F46",flexShrink:0}}>{d===0?"Hoy":d===1?"Mañana":d+" días"}</span>
      </div>);})}
    </Card>
    {/* Widget 2: Recent Activity */}
    <Card style={{padding:mob?"10px 12px":"14px 16px"}}>
      <div onClick={()=>onNav&&onNav("feed")} style={{fontSize:13,fontWeight:700,color:colors.nv,marginBottom:8,cursor:"pointer"}}>📰 Actividad Reciente <span style={{fontSize:10,color:colors.bl}}>→</span></div>
      {recentLogs.length===0&&<div style={{fontSize:11,color:colors.g4,padding:8}}>Sin actividad</div>}
      {recentLogs.map((l:any,i:number)=><div key={i} onClick={()=>{const p=peds.find((p:any)=>p.id===l.pId);if(p)onSel(p);}} style={{display:"flex",gap:6,padding:"3px 0",borderBottom:"1px solid "+colors.g1,fontSize:10,cursor:"pointer"}}>
        <div style={{width:6,height:6,borderRadius:3,background:l.t==="sys"?colors.bl:colors.gn,marginTop:4,flexShrink:0}}/>
        <div style={{flex:1,minWidth:0}}><span style={{fontWeight:600,color:colors.nv}}>{l.by}</span> <span style={{color:colors.g5}}>{(l.act||"").slice(0,35)}</span><div style={{fontSize:9,color:colors.g4}}>#{l.pId} · {(l.dt||"").slice(5,16)}</div></div>
      </div>)}
    </Card>
    {/* Widget 3: Team Workload */}
    <Card style={{padding:mob?"10px 12px":"14px 16px"}}>
      <div onClick={()=>onNav&&onNav("kanban")} style={{fontSize:13,fontWeight:700,color:colors.nv,marginBottom:8,cursor:"pointer"}}>👥 Carga de Trabajo <span style={{fontSize:10,color:colors.bl}}>→</span></div>
      {workload.length===0&&<div style={{fontSize:11,color:colors.g4,padding:8}}>Sin tareas asignadas</div>}
      {workload.map((w:any)=><div key={w.id} onClick={()=>{const ut=peds.filter((p:any)=>p.asTo===w.id&&p.st!==ST.OK);if(ut.length===1)onSel(ut[0]);else if(ut.length>0)onSel(ut[0]);}} style={{marginBottom:6,cursor:"pointer"}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:2}}><span style={{fontWeight:600,color:colors.nv}}>{w.name}</span><span style={{color:colors.g4}}>{w.count} tareas{w.overdue>0?<span style={{color:"#DC2626"}}> ({w.overdue} ⏰)</span>:""}</span></div>
        <div style={{height:8,background:colors.g1,borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",borderRadius:4,width:(w.count/maxWL*100)+"%",background:w.overdue>0?"#DC2626":w.count>5?colors.yl:colors.gn}}/></div>
      </div>)}
    </Card>
    {/* Widget 4: Weekly Summary */}
    <Card style={{padding:mob?"10px 12px":"14px 16px"}}>
      <div style={{fontSize:13,fontWeight:700,color:colors.nv,marginBottom:8}}>📊 Resumen Semanal</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <div onClick={()=>onNav&&onNav("filter","ok")} style={{textAlign:"center" as const,padding:8,background:colors.gn+"10",borderRadius:8,cursor:"pointer"}}><div style={{fontSize:18,fontWeight:800,color:colors.gn}}>{completedThisWeek}</div><div style={{fontSize:9,color:colors.g5}}>Completadas</div></div>
        <div onClick={()=>onNav&&onNav("kanban")} style={{textAlign:"center" as const,padding:8,background:colors.bl+"10",borderRadius:8,cursor:"pointer"}}><div style={{fontSize:18,fontWeight:800,color:colors.bl}}>{createdThisWeek}</div><div style={{fontSize:9,color:colors.g5}}>Nuevas</div></div>
        <div onClick={()=>onNav&&onNav("filter","venc")} style={{textAlign:"center" as const,padding:8,background:"#DC262610",borderRadius:8,cursor:"pointer"}}><div style={{fontSize:18,fontWeight:800,color:"#DC2626"}}>{overdue.length}</div><div style={{fontSize:9,color:colors.g5}}>Vencidas</div></div>
        <div onClick={()=>onNav&&onNav("presu")} style={{textAlign:"center" as const,padding:8,background:colors.pr+"10",borderRadius:8,cursor:"pointer"}}><div style={{fontSize:18,fontWeight:800,color:colors.pr}}>${budgetApproved.toLocaleString()}</div><div style={{fontSize:9,color:colors.g5}}>$ Aprobado</div></div>
      </div>
    </Card>
  </div>);
}
