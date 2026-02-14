"use client";
import { useMemo } from "react";
import { useC } from "@/lib/theme-context";
import { Card } from "@/components/ui";

export function ActivityFeed({peds,users,onSel,mob}:any){
  const{colors,cardBg}=useC();
  const allLogs=useMemo(()=>peds.flatMap((p:any)=>(p.log||[]).map((l:any)=>({...l,taskId:p.id,taskDesc:p.desc,taskTipo:p.tipo}))).sort((a:any,b:any)=>(b.dt||"").localeCompare(a.dt||"")).slice(0,50),[peds]);
  return(<div style={{maxWidth:720}}>
    <h2 style={{margin:"0 0 4px",fontSize:mob?16:19,color:colors.nv,fontWeight:800}}>Actividad Reciente</h2>
    <p style={{color:colors.g4,fontSize:12,margin:"0 0 14px"}}>Ultimas 50 acciones en el sistema</p>
    {allLogs.length===0&&<Card style={{textAlign:"center" as const,padding:24,color:colors.g4}}>Sin actividad reciente</Card>}
    <div style={{display:"flex",flexDirection:"column" as const,gap:4}}>
      {allLogs.map((l:any,i:number)=><div key={i} style={{display:"flex",gap:8,padding:"8px 12px",background:cardBg,borderRadius:8,border:"1px solid "+colors.g2,alignItems:"start"}}>
        <div style={{width:8,height:8,borderRadius:4,background:l.t==="sys"?colors.bl:colors.gn,marginTop:6,flexShrink:0}}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
            <span style={{fontSize:10,fontWeight:700,color:colors.nv}}>{l.by}</span>
            <span style={{fontSize:9,color:colors.g4}}>{l.dt}</span>
          </div>
          <div style={{fontSize:11,color:colors.g5}}>{l.act}</div>
          <div onClick={()=>{const p=peds.find((p:any)=>p.id===l.taskId);if(p)onSel(p);}} style={{fontSize:9,color:colors.bl,cursor:"pointer",marginTop:2}}>📋 #{l.taskId} {l.taskDesc?.slice(0,40)}</div>
        </div>
      </div>)}
    </div>
  </div>);
}
