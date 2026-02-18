"use client";
import { useState, useMemo } from "react";
import { useC } from "@/lib/theme-context";
import { Card, Btn } from "@/components/ui";
import { ST, SC, fn, isOD, ROLES } from "@/lib/constants";
import { rlv } from "@/lib/mappers";
import { useDataStore } from "@/lib/store";

/* Relative time in Spanish (copied from ActivityFeed) */
function timeAgo(dt:string){
  if(!dt)return"";
  const now=Date.now();
  const d=new Date(dt).getTime();
  const diff=Math.floor((now-d)/1000);
  if(diff<60)return"hace un momento";
  if(diff<3600)return"hace "+Math.floor(diff/60)+"m";
  if(diff<86400)return"hace "+Math.floor(diff/3600)+"h";
  if(diff<172800)return"ayer";
  if(diff<604800)return"hace "+Math.floor(diff/86400)+"d";
  return dt.slice(0,10);
}

/* Icon + color by action content (copied from ActivityFeed) */
function actionMeta(act:string,t:string):{icon:string;color:string}{
  const a=act.toLowerCase();
  if(a.includes("creó tarea"))return{icon:"➕",color:"#10B981"};
  if(a.includes("tomó la tarea"))return{icon:"🤚",color:"#3B82F6"};
  if(a.includes("asignó"))return{icon:"👤",color:"#8B5CF6"};
  if(a.includes("cambió estado"))return{icon:"🔄",color:"#F59E0B"};
  if(a.includes("cambió fecha"))return{icon:"📅",color:"#EC4899"};
  if(a.includes("envió a compras"))return{icon:"💰",color:"#7C3AED"};
  if(a.includes("aprobó"))return{icon:"✅",color:"#10B981"};
  if(a.includes("rechazó"))return{icon:"❌",color:"#DC2626"};
  if(a.includes("validó"))return{icon:"✅",color:"#059669"};
  if(a.includes("envió a validación"))return{icon:"🔵",color:"#3B82F6"};
  if(a.includes("editó"))return{icon:"✏️",color:"#6B7280"};
  if(a.includes("duplicada"))return{icon:"📋",color:"#6B7280"};
  if(a.includes("eliminó"))return{icon:"🗑️",color:"#DC2626"};
  if(a.includes("importado"))return{icon:"📥",color:"#6B7280"};
  if(t==="msg")return{icon:"💬",color:"#3B82F6"};
  if(t==="check")return{icon:"☑️",color:"#10B981"};
  return{icon:"📌",color:"#6B7280"};
}

/* Group date label (copied from ActivityFeed) */
function dateLabel(dt:string){
  if(!dt)return"Sin fecha";
  const d=dt.slice(0,10);
  const today=new Date().toISOString().slice(0,10);
  const yd=new Date(Date.now()-86400000).toISOString().slice(0,10);
  if(d===today)return"Hoy";
  if(d===yd)return"Ayer";
  const parts=d.split("-");
  return parts[2]+"/"+parts[1]+"/"+parts[0];
}

export function ProfileActivity({onSel,mob}:any){
  const peds = useDataStore(s => s.peds);
  const users = useDataStore(s => s.users);
  const{colors,isDark,cardBg}=useC();
  const [selUser,sSelUser]=useState<string|null>(null);
  const [limit,sLimit]=useState(50);

  /* Ranking: compute stats per user */
  const ranking=useMemo(()=>{
    const eligible=users.filter((u:any)=>rlv(u.role)>=1);
    return eligible.map((u:any)=>{
      const logs=peds.flatMap((p:any)=>(p.log||[]).filter((l:any)=>l.uid===u.id));
      const isEmb=u.role==="embudo";
      const assigned=peds.filter((p:any)=>p.asTo===u.id||(isEmb&&p.st===ST.E));
      const active=assigned.filter((p:any)=>p.st!==ST.OK);
      const completed=peds.filter((p:any)=>p.asTo===u.id&&p.st===ST.OK);
      const overdue=active.filter((p:any)=>p.fReq&&isOD(p.fReq));
      const lastDt=logs.length>0?logs.sort((a:any,b:any)=>(b.dt||"").localeCompare(a.dt||""))[0].dt:"";
      return{id:u.id,name:fn(u),role:u.role,totalLogs:logs.length,tasksActive:active.length,tasksCompleted:completed.length,tasksOverdue:overdue.length,lastActivity:lastDt};
    }).sort((a:any,b:any)=>b.totalLogs-a.totalLogs);
  },[peds,users]);

  /* Timeline filtered by selected user */
  const selUserRole=selUser?users.find((u:any)=>u.id===selUser)?.role:null;
  const timeline=useMemo(()=>{
    if(!selUser)return[];
    const isEmb=selUserRole==="embudo";
    let logs=peds.flatMap((p:any)=>{
      const match=isEmb?(l:any)=>l.uid===selUser||p.st===ST.E:(l:any)=>l.uid===selUser;
      return(p.log||[]).filter(match).map((l:any)=>({...l,taskId:p.id,taskDesc:p.desc,taskSt:p.st}));
    });
    /* Deduplicate for embudo (a log could match both uid and st===E) */
    if(isEmb){const seen=new Set<string>();logs=logs.filter((l:any)=>{const k=l.taskId+"|"+l.dt+"|"+l.act;if(seen.has(k))return false;seen.add(k);return true;});}
    logs=logs.sort((a:any,b:any)=>(b.dt||"").localeCompare(a.dt||"")).slice(0,limit);
    /* Group by date */
    const map=new Map<string,any[]>();
    logs.forEach((l:any)=>{
      const key=dateLabel(l.dt);
      if(!map.has(key))map.set(key,[]);
      map.get(key)!.push(l);
    });
    return Array.from(map.entries());
  },[peds,selUser,selUserRole,limit]);

  const selUserData=selUser?ranking.find((r:any)=>r.id===selUser):null;

  return(<div style={{display:"flex",flexDirection:mob?"column":"row" as any,gap:mob?12:16,minHeight:300}}>
    {/* Left panel: Ranking */}
    <div style={{flex:mob?"none":"0 0 40%",maxWidth:mob?"100%":"40%",minWidth:0}}>
      <div style={{fontSize:13,fontWeight:700,color:colors.nv,marginBottom:8}}>Ranking de Actividad</div>
      <div style={{display:"flex",flexDirection:"column" as const,gap:4}}>
        {ranking.length===0&&<div style={{fontSize:11,color:colors.g4,padding:12}}>Sin usuarios activos</div>}
        {ranking.map((r:any,i:number)=>{
          const isSel=selUser===r.id;
          const roleInfo=ROLES[r.role];
          return(<div key={r.id} onClick={()=>{sSelUser(isSel?null:r.id);sLimit(50);}}
            style={{background:isSel?(isDark?"#1E3A5F":colors.bl+"10"):cardBg,borderRadius:10,padding:mob?"10px 10px":"8px 10px",border:"1px solid "+(isSel?colors.bl+"60":colors.g2),cursor:"pointer",transition:"all .15s"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:6,minWidth:0}}>
                <span style={{fontSize:11,fontWeight:800,color:colors.g4,width:18,textAlign:"center" as const,flexShrink:0}}>#{i+1}</span>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:11,fontWeight:700,color:isSel?colors.bl:colors.nv,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{r.name}</div>
                  <div style={{fontSize:9,color:colors.g4}}>{roleInfo?.i||"👤"} {roleInfo?.l||r.role}</div>
                </div>
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
                {r.tasksOverdue>0&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:6,background:"#FEE2E2",color:"#DC2626",fontWeight:700}}>{r.tasksOverdue} venc</span>}
                <span style={{fontSize:10,fontWeight:700,color:colors.g5}}>{r.totalLogs}</span>
              </div>
            </div>
            {/* Mini stats row */}
            <div style={{display:"flex",gap:8,marginTop:4,fontSize:9,color:colors.g4}}>
              <span title="Activas">🔴 {r.tasksActive}</span>
              <span title="Completadas">🟢 {r.tasksCompleted}</span>
              {r.lastActivity&&<span style={{marginLeft:"auto"}}>{timeAgo(r.lastActivity)}</span>}
            </div>
          </div>);
        })}
      </div>
    </div>

    {/* Right panel: Timeline */}
    <div style={{flex:1,minWidth:0}}>
      {!selUser&&<Card style={{textAlign:"center" as const,padding:mob?24:40,color:colors.g4}}>
        <div style={{fontSize:24,marginBottom:8}}>👤</div>
        <div style={{fontSize:13,fontWeight:600}}>Selecciona un perfil</div>
        <div style={{fontSize:11,marginTop:4}}>Hace click en un usuario del ranking para ver su timeline</div>
      </Card>}

      {selUser&&selUserData&&<div>
        {/* Selected user header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div>
            <div style={{fontSize:14,fontWeight:800,color:colors.nv}}>{selUserData.name}</div>
            <div style={{fontSize:10,color:colors.g4}}>{ROLES[selUserData.role]?.i} {ROLES[selUserData.role]?.l} — {selUserData.totalLogs} acciones</div>
          </div>
          <Btn v="g" s="s" onClick={()=>sSelUser(null)}>← Volver</Btn>
        </div>

        {/* Stats cards */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:12}}>
          <div style={{background:colors.gn+"10",borderRadius:8,padding:"8px 6px",textAlign:"center" as const}}>
            <div style={{fontSize:16,fontWeight:800,color:colors.gn}}>{selUserData.tasksCompleted}</div>
            <div style={{fontSize:9,color:colors.g5}}>Completadas</div>
          </div>
          <div style={{background:colors.rd+"10",borderRadius:8,padding:"8px 6px",textAlign:"center" as const}}>
            <div style={{fontSize:16,fontWeight:800,color:colors.rd}}>{selUserData.tasksActive}</div>
            <div style={{fontSize:9,color:colors.g5}}>Activas</div>
          </div>
          <div style={{background:"#DC262610",borderRadius:8,padding:"8px 6px",textAlign:"center" as const}}>
            <div style={{fontSize:16,fontWeight:800,color:"#DC2626"}}>{selUserData.tasksOverdue}</div>
            <div style={{fontSize:9,color:colors.g5}}>Vencidas</div>
          </div>
        </div>

        {/* Timeline */}
        {timeline.length===0&&<Card style={{textAlign:"center" as const,padding:20,color:colors.g4,fontSize:11}}>Sin actividad registrada para este usuario</Card>}
        {timeline.map(([dateKey,logs])=>(
          <div key={dateKey} style={{marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <div style={{height:1,flex:1,background:colors.g2}}/>
              <span style={{fontSize:10,fontWeight:700,color:colors.g4,textTransform:"uppercase" as const,letterSpacing:1}}>{dateKey}</span>
              <div style={{height:1,flex:1,background:colors.g2}}/>
            </div>
            <div style={{position:"relative",paddingLeft:24}}>
              <div style={{position:"absolute",left:11,top:0,bottom:0,width:2,background:colors.g2}}/>
              {logs.map((l:any,i:number)=>{
                const meta=actionMeta(l.act||"",l.t);
                return(<div key={i} style={{position:"relative",marginBottom:i<logs.length-1?6:0}}>
                  <div style={{position:"absolute",left:-17,top:8,width:14,height:14,borderRadius:7,background:cardBg,border:"2px solid "+meta.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,zIndex:1}}/>
                  <div style={{background:cardBg,borderRadius:10,border:"1px solid "+colors.g2,padding:"7px 10px",marginLeft:4}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
                      <div style={{display:"flex",alignItems:"center",gap:5}}>
                        <span style={{fontSize:11}}>{meta.icon}</span>
                        <span style={{fontSize:10,fontWeight:700,color:colors.nv}}>{l.by}</span>
                        {l.t==="msg"&&<span style={{fontSize:8,padding:"1px 5px",borderRadius:4,background:colors.bl+"15",color:colors.bl,fontWeight:600}}>mensaje</span>}
                      </div>
                      <span style={{fontSize:9,color:colors.g4}}>{timeAgo(l.dt)}</span>
                    </div>
                    <div style={{fontSize:10,color:colors.g5,lineHeight:1.4}}>{l.t==="msg"?<span style={{fontStyle:"italic" as const}}>&ldquo;{l.act}&rdquo;</span>:l.act}</div>
                    <div onClick={(e)=>{e.stopPropagation();const p=peds.find((p:any)=>p.id===l.taskId);if(p)onSel(p);}} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:9,color:colors.bl,cursor:"pointer",marginTop:3,padding:"2px 6px",borderRadius:4,background:colors.bl+"08"}}>
                      📋 #{l.taskId} {l.taskDesc?.slice(0,35)}
                    </div>
                  </div>
                </div>);
              })}
            </div>
          </div>
        ))}
        {selUser&&timeline.length>0&&timeline.reduce((s,g)=>s+g[1].length,0)>=limit&&<div style={{textAlign:"center",marginTop:10}}>
          <Btn v="g" s="s" onClick={()=>sLimit(l=>l+50)}>Cargar mas</Btn>
        </div>}
      </div>}
    </div>
  </div>);
}
