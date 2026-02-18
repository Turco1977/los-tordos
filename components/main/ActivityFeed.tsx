"use client";
import { useState, useMemo } from "react";
import { useC } from "@/lib/theme-context";
import { Card, Btn } from "@/components/ui";
import { useDataStore } from "@/lib/store";

/* Relative time in Spanish */
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

/* Icon + color by action content */
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

/* Group date label */
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

export function ActivityFeed({onSel,mob}:any){
  const peds = useDataStore(s => s.peds);
  const users = useDataStore(s => s.users);
  const{colors,isDark,cardBg}=useC();
  const [filter,sFilter]=useState("all");
  const [limit,sLimit]=useState(50);

  const allLogs=useMemo(()=>{
    let logs=peds.flatMap((p:any)=>(p.log||[]).map((l:any)=>({...l,taskId:p.id,taskDesc:p.desc,taskTipo:p.tipo,taskSt:p.st})));
    if(filter==="msg")logs=logs.filter((l:any)=>l.t==="msg");
    else if(filter==="sys")logs=logs.filter((l:any)=>l.t==="sys");
    else if(filter==="status")logs=logs.filter((l:any)=>l.act?.toLowerCase().includes("cambió estado")||l.act?.toLowerCase().includes("validó")||l.act?.toLowerCase().includes("aprobó")||l.act?.toLowerCase().includes("rechazó"));
    return logs.sort((a:any,b:any)=>(b.dt||"").localeCompare(a.dt||"")).slice(0,limit);
  },[peds,filter,limit]);

  // Group by date
  const grouped=useMemo(()=>{
    const map=new Map<string,any[]>();
    allLogs.forEach((l:any)=>{
      const key=dateLabel(l.dt);
      if(!map.has(key))map.set(key,[]);
      map.get(key)!.push(l);
    });
    return Array.from(map.entries());
  },[allLogs]);

  return(<div style={{maxWidth:720}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
      <div><h2 style={{margin:0,fontSize:mob?16:19,color:colors.nv,fontWeight:800}}>Timeline de Actividad</h2>
      <p style={{color:colors.g4,fontSize:12,margin:"2px 0 0"}}>Historial de acciones en tiempo real</p></div>
    </div>
    {/* Filters */}
    <div style={{display:"flex",gap:4,marginBottom:14,marginTop:8,flexWrap:"wrap" as const}}>
      {[{k:"all",l:"Todos"},{k:"sys",l:"Sistema"},{k:"msg",l:"Mensajes"},{k:"status",l:"Cambios de estado"}].map(f=>
        <Btn key={f.k} v={filter===f.k?"p":"g"} s="s" onClick={()=>sFilter(f.k)}>{f.l}</Btn>
      )}
    </div>
    {allLogs.length===0&&<Card style={{textAlign:"center" as const,padding:24,color:colors.g4}}>Sin actividad{filter!=="all"?" con este filtro":""}</Card>}
    {/* Timeline */}
    {grouped.map(([dateKey,logs])=>(
      <div key={dateKey} style={{marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <div style={{height:1,flex:1,background:colors.g2}}/>
          <span style={{fontSize:10,fontWeight:700,color:colors.g4,textTransform:"uppercase",letterSpacing:1}}>{dateKey}</span>
          <div style={{height:1,flex:1,background:colors.g2}}/>
        </div>
        <div style={{position:"relative",paddingLeft:24}}>
          {/* Vertical timeline line */}
          <div style={{position:"absolute",left:11,top:0,bottom:0,width:2,background:colors.g2}}/>
          {logs.map((l:any,i:number)=>{
            const meta=actionMeta(l.act||"",l.t);
            return(<div key={i} style={{position:"relative",marginBottom:i<logs.length-1?8:0}}>
              {/* Timeline dot */}
              <div style={{position:"absolute",left:-17,top:8,width:14,height:14,borderRadius:7,background:cardBg,border:"2px solid "+meta.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,zIndex:1}}/>
              {/* Card */}
              <div style={{background:cardBg,borderRadius:10,border:"1px solid "+colors.g2,padding:"8px 12px",marginLeft:4}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:12}}>{meta.icon}</span>
                    <span style={{fontSize:11,fontWeight:700,color:colors.nv}}>{l.by}</span>
                    {l.t==="msg"&&<span style={{fontSize:8,padding:"1px 5px",borderRadius:4,background:colors.bl+"15",color:colors.bl,fontWeight:600}}>mensaje</span>}
                  </div>
                  <span style={{fontSize:9,color:colors.g4}}>{timeAgo(l.dt)}</span>
                </div>
                <div style={{fontSize:11,color:colors.g5,lineHeight:1.4}}>{l.t==="msg"?<span style={{fontStyle:"italic" as const}}>&ldquo;{l.act}&rdquo;</span>:l.act}</div>
                <div onClick={()=>{const p=peds.find((p:any)=>p.id===l.taskId);if(p)onSel(p);}} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:9,color:colors.bl,cursor:"pointer",marginTop:4,padding:"2px 6px",borderRadius:4,background:colors.bl+"08"}}>
                  📋 #{l.taskId} {l.taskDesc?.slice(0,35)}
                </div>
              </div>
            </div>);
          })}
        </div>
      </div>
    ))}
    {allLogs.length>=limit&&<div style={{textAlign:"center",marginTop:12}}>
      <Btn v="g" s="s" onClick={()=>sLimit(l=>l+50)}>Cargar mas</Btn>
    </div>}
  </div>);
}
