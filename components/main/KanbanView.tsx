"use client";
import { useState } from "react";
import { T, ST, fn, isOD } from "@/lib/constants";
import { useC } from "@/lib/theme-context";

export function KanbanView({peds,users,user,onSel,onStatusChange,areas,deptos,mob}:any){
  const{colors,isDark,cardBg}=useC();
  const [dragId,sDragId]=useState<number|null>(null);
  const [dragOver,sDragOver]=useState<string|null>(null);
  const cols=[{st:ST.P,l:"Pendiente",c:T.rd},{st:ST.C,l:"En Curso",c:T.yl},{st:ST.E,l:"Compras",c:T.pr},{st:ST.V,l:"Validacion",c:T.bl},{st:ST.OK,l:"Completada",c:T.gn}];
  const nextSt=(st:string)=>{const i=cols.findIndex(c=>c.st===st);return i<cols.length-1?cols[i+1].st:st;};
  const handleDragStart=(e:any,id:number)=>{sDragId(id);e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",String(id));};
  const handleDragEnd=()=>{sDragId(null);sDragOver(null);};
  const handleDragOver=(e:any,st:string)=>{e.preventDefault();e.dataTransfer.dropEffect="move";sDragOver(st);};
  const handleDragLeave=()=>sDragOver(null);
  const handleDrop=(e:any,targetSt:string)=>{e.preventDefault();sDragOver(null);const id=Number(e.dataTransfer.getData("text/plain"));if(!id)return;const task=peds.find((p:any)=>p.id===id);if(task&&task.st!==targetSt){onStatusChange(id,targetSt);}sDragId(null);};
  return(<div>
    <h2 style={{margin:"0 0 4px",fontSize:mob?16:19,color:colors.nv,fontWeight:800}}>Kanban</h2>
    <p style={{color:colors.g4,fontSize:12,margin:"0 0 14px"}}>Arrastra las tareas entre columnas para cambiar estado</p>
    <div style={{display:mob?"flex":"grid",gridTemplateColumns:"repeat(5,1fr)",flexDirection:mob?"column" as const:undefined,gap:10,overflowX:mob?undefined:"auto" as const}}>
      {cols.map(col=>{const cp=peds.filter((p:any)=>p.st===col.st);const isOver=dragOver===col.st;return(<div key={col.st} onDragOver={e=>handleDragOver(e,col.st)} onDragLeave={handleDragLeave} onDrop={e=>handleDrop(e,col.st)} style={{background:isOver?(col.c+"20"):colors.g1,borderRadius:12,padding:10,minWidth:mob?undefined:180,borderTop:"3px solid "+col.c,transition:"background .15s",outline:isOver?"2px dashed "+col.c:"none"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontSize:12,fontWeight:700,color:colors.nv}}>{col.l}</span><span style={{fontSize:10,fontWeight:700,color:col.c,background:col.c+"20",borderRadius:10,padding:"1px 6px"}}>{cp.length}</span></div>
        {cp.length===0&&<div style={{fontSize:10,color:colors.g4,textAlign:"center" as const,padding:12}}>—</div>}
        {cp.map((p:any)=>{const ag=users.find((u:any)=>u.id===p.asTo);const od=p.st!==ST.OK&&isOD(p.fReq);const isDragging=dragId===p.id;const dept=(deptos||[]).find((d:any)=>d.id===p.dId);const area=dept?(areas||[]).find((a:any)=>a.id===dept.aId):null;return(<div key={p.id} draggable onDragStart={e=>handleDragStart(e,p.id)} onDragEnd={handleDragEnd} onClick={()=>onSel(p)} style={{background:od?(isDark?"#451A1A":"#FEF2F2"):cardBg,borderRadius:10,padding:"10px 10px",marginBottom:6,cursor:isDragging?"grabbing":"grab",border:"1px solid "+(isDragging?col.c:colors.g2),borderLeft:"3px solid "+(area?area.color:col.c),opacity:isDragging?.5:1,transition:"opacity .15s, transform .15s",transform:isDragging?"rotate(2deg)":"none",userSelect:"none" as const}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:4}}>
            <div style={{fontSize:9,color:colors.g4,fontWeight:600}}>#{p.id}{p.urg==="Urgente"?" 🔥":""}{od?" ⏰":""}</div>
            {col.st!==ST.OK&&<button onClick={(e:any)=>{e.stopPropagation();onStatusChange(p.id,nextSt(col.st));}} style={{background:"none",border:"1px solid "+colors.g3,borderRadius:4,cursor:"pointer",fontSize:mob?12:10,color:colors.g5,padding:mob?"6px 8px":"2px 4px",flexShrink:0,marginLeft:4,minWidth:mob?36:undefined,minHeight:mob?36:undefined}} title="Avanzar estado">→</button>}
          </div>
          <div style={{fontSize:11,fontWeight:700,color:colors.nv,lineHeight:1.3,marginBottom:4,wordBreak:"break-word" as const,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as const,overflow:"hidden"}}>{p.desc}</div>
          {area&&<div style={{display:"inline-block",fontSize:9,fontWeight:600,color:area.color,background:area.color+"15",padding:"1px 6px",borderRadius:8,marginBottom:4}}>{area.icon} {area.name}</div>}
          <div style={{fontSize:9,color:colors.g5}}>{p.tipo} · 📅 {p.fReq}</div>
          {ag&&<div style={{display:"flex",alignItems:"center",gap:4,marginTop:3}}><div style={{width:16,height:16,borderRadius:8,background:colors.nv+"20",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:colors.nv,fontWeight:700}}>{fn(ag).charAt(0)}</div><span style={{fontSize:10,fontWeight:600,color:colors.nv}}>{fn(ag)}</span></div>}
        </div>);})}
      </div>);})}
    </div>
  </div>);
}
