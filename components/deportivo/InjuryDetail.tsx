"use client";
import { useState } from "react";
import { T, DEP_INJ_SEV } from "@/lib/constants";
import { Btn, Card } from "@/components/ui";

const TODAY = new Date().toISOString().slice(0,10);
const fmtD = (d:string)=>{if(!d)return"–";const p=d.slice(0,10).split("-");return p[2]+"/"+p[1]+"/"+p[0];};

export function InjuryDetail({inj,onBack,onUpdate,mob}:any){
  const sv=DEP_INJ_SEV[inj.severity];
  const [st,sSt]=useState(inj.status);
  const [dr,sDr]=useState(inj.date_return||"");
  const [notes,sNotes]=useState(inj.notes);
  return <div>
    <Btn v="g" s="s" onClick={onBack} style={{marginBottom:12}}>← Volver</Btn>
    <Card>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <h2 style={{margin:0,fontSize:16,color:T.nv}}>Lesión #{inj.id}</h2>
        <span style={{background:sv?.bg,color:sv?.c,padding:"4px 12px",borderRadius:12,fontSize:12,fontWeight:700}}>{sv?.l}</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:10}}>
        {[["Jugador",inj.athlete_name],["Tipo",inj.type],["Zona",inj.zone],["Músculo",inj.muscle||"–"],["Fecha lesión",fmtD(inj.date_injury)],["Fecha retorno",inj.date_return?fmtD(inj.date_return):"–"],["Descripción",inj.description||"–"]].map(([l,v],i)=><div key={i}><div style={{fontSize:10,color:T.g4,fontWeight:700}}>{l}</div><div style={{fontSize:12,color:T.nv}}>{v}</div></div>)}
      </div>
      {onUpdate&&<div style={{marginTop:16,padding:14,background:T.g1,borderRadius:10}}>
        <h3 style={{margin:"0 0 10px",fontSize:13,color:T.nv}}>Actualizar estado</h3>
        <div style={{display:"flex",gap:4,marginBottom:10}}>
          {(["activa","recuperacion","alta"] as const).map(s=><button key={s} onClick={()=>sSt(s)} style={{padding:"5px 12px",borderRadius:8,border:st===s?"2px solid "+T.nv:"1px solid "+T.g3,background:st===s?T.nv+"10":"#fff",fontSize:11,fontWeight:600,cursor:"pointer",color:st===s?T.nv:T.g5}}>{s==="activa"?"Activa":s==="recuperacion"?"Recuperación":"Alta"}</button>)}
        </div>
        {st==="alta"&&<div style={{marginBottom:8}}><label style={{fontSize:11,fontWeight:600,color:T.g5}}>Fecha de retorno</label><input type="date" value={dr} onChange={e=>sDr(e.target.value)} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:3}}/></div>}
        <div style={{marginBottom:8}}><label style={{fontSize:11,fontWeight:600,color:T.g5}}>Notas</label><textarea value={notes} onChange={e=>sNotes(e.target.value)} rows={3} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,resize:"vertical" as const,boxSizing:"border-box" as const,marginTop:3}}/></div>
        <Btn v="p" onClick={()=>onUpdate(inj.id,{status:st,date_return:st==="alta"?dr||TODAY:null,notes})}>💾 Guardar cambios</Btn>
      </div>}
    </Card>
  </div>;
}
