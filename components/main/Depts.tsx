"use client";
import { useState } from "react";
import { T, ST, AREAS, DEPTOS } from "@/lib/constants";
import { Btn, Card } from "@/components/ui";
import { useDataStore } from "@/lib/store";

export function Depts({onSel,mob,TList}:any){
  const pedidos = useDataStore(s => s.peds);
  const users = useDataStore(s => s.users);
  const areas = AREAS;
  const deptos = DEPTOS;
  const [selA,sSelA]=useState<number|null>(null);
  const [selD,sSelD]=useState<number|null>(null);
  const fDeptos=selA?deptos.filter((d:any)=>d.aId===selA):deptos;
  const selDepto=selD?deptos.find((d:any)=>d.id===selD):null;
  const selArea=selDepto?areas.find((a:any)=>a.id===selDepto.aId):null;
  const dPeds=selD?pedidos.filter((p:any)=>p.dId===selD):[];
  if(selD&&selDepto){
    return(<div style={{maxWidth:720}}>
      <Btn v="g" s="s" onClick={()=>sSelD(null)} style={{marginBottom:12}}>← Volver a Departamentos</Btn>
      {TList&&<TList title={selDepto.name} icon="📂" color={selArea?selArea.color:T.nv} peds={dPeds} onSel={onSel} search="" mob={mob}/>}
    </div>);
  }
  return(<div style={{maxWidth:720}}>
    <h2 style={{margin:"0 0 4px",fontSize:19,color:T.nv,fontWeight:800}}>📂 Departamentos</h2>
    <p style={{color:T.g4,fontSize:12,margin:"0 0 14px"}}>Tareas por departamento</p>
    <div style={{display:"flex",gap:4,marginBottom:14,flexWrap:"wrap" as const}}>
      <Btn v={selA===null?"p":"g"} s="s" onClick={()=>sSelA(null)}>Todas las áreas</Btn>
      {areas.map((a:any)=><Btn key={a.id} v={selA===a.id?"p":"g"} s="s" onClick={()=>sSelA(selA===a.id?null:a.id)}>{a.icon} {a.name}</Btn>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
      {fDeptos.map((d:any)=>{const ar=areas.find((a:any)=>a.id===d.aId);const dp=pedidos.filter((p:any)=>p.dId===d.id);const pe=dp.filter((p:any)=>p.st===ST.P).length,cu=dp.filter((p:any)=>[ST.C,ST.E,ST.V].indexOf(p.st)>=0).length,ok=dp.filter((p:any)=>p.st===ST.OK).length;
        return(<Card key={d.id} onClick={()=>sSelD(d.id)} style={{padding:"14px 16px",cursor:"pointer",borderLeft:"4px solid "+(ar?ar.color:T.nv)}}>
          <div style={{fontSize:13,fontWeight:700,color:T.nv}}>{d.name}</div>
          <div style={{fontSize:10,color:T.g4,marginTop:2}}>{ar?ar.icon+" "+ar.name:""}</div>
          <div style={{display:"flex",gap:8,marginTop:8,fontSize:11}}>
            {pe>0&&<span style={{color:T.rd}}>🔴 {pe}</span>}
            {cu>0&&<span style={{color:T.yl}}>🟡 {cu}</span>}
            {ok>0&&<span style={{color:T.gn}}>🟢 {ok}</span>}
            {dp.length===0&&<span style={{color:T.g4}}>Sin tareas</span>}
          </div>
        </Card>);})}
    </div>
  </div>);
}
