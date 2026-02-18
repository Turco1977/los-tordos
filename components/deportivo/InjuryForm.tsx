"use client";
import { useState } from "react";
import { T, DEP_INJ_TYPES, DEP_INJ_ZONES, DEP_INJ_SEV } from "@/lib/constants";
import type { DepAthlete } from "@/lib/supabase/types";
import { Btn, Card } from "@/components/ui";

const TODAY = new Date().toISOString().slice(0,10);

export function InjuryForm({athletes,onSave,onCancel,mob}:any){
  const [f,sF]=useState<{athlete_id:number;type:string;zone:string;muscle:string;severity:"leve"|"moderada"|"grave";description:string;date_injury:string;notes:string}>({athlete_id:0,type:DEP_INJ_TYPES[0],zone:DEP_INJ_ZONES[0],muscle:"",severity:"moderada",description:"",date_injury:TODAY,notes:""});
  return <div>
    <Btn v="g" s="s" onClick={onCancel} style={{marginBottom:12}}>← Cancelar</Btn>
    <h2 style={{fontSize:16,color:T.nv,margin:"0 0 14px"}}>+ Nueva Lesión</h2>
    <Card>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:10}}>
        <div style={{gridColumn:mob?"1":"1 / -1"}}><label style={{fontSize:11,fontWeight:600,color:T.g5}}>Jugador *</label><select value={f.athlete_id} onChange={e=>sF(prev=>({...prev,athlete_id:Number(e.target.value)}))} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,marginTop:3}}><option value={0}>Seleccionar...</option>{athletes.map((a:DepAthlete)=><option key={a.id} value={a.id}>{a.last_name}, {a.first_name} ({a.division})</option>)}</select></div>
        <div><label style={{fontSize:11,fontWeight:600,color:T.g5}}>Tipo *</label><select value={f.type} onChange={e=>sF(prev=>({...prev,type:e.target.value}))} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,marginTop:3}}>{DEP_INJ_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
        <div><label style={{fontSize:11,fontWeight:600,color:T.g5}}>Zona *</label><select value={f.zone} onChange={e=>sF(prev=>({...prev,zone:e.target.value}))} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,marginTop:3}}>{DEP_INJ_ZONES.map(z=><option key={z} value={z}>{z}</option>)}</select></div>
        <div><label style={{fontSize:11,fontWeight:600,color:T.g5}}>Músculo (opcional)</label><input value={f.muscle} onChange={e=>sF(prev=>({...prev,muscle:e.target.value}))} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:3}}/></div>
        <div><label style={{fontSize:11,fontWeight:600,color:T.g5}}>Severidad *</label><div style={{display:"flex",gap:4,marginTop:3}}>{(["leve","moderada","grave"] as const).map(s=>{const sv=DEP_INJ_SEV[s];return<button key={s} onClick={()=>sF(prev=>({...prev,severity:s}))} style={{flex:1,padding:"6px 0",borderRadius:8,border:f.severity===s?"2px solid "+sv.c:"1px solid "+T.g3,background:f.severity===s?sv.bg:"#fff",color:f.severity===s?sv.c:T.g5,fontSize:11,fontWeight:600,cursor:"pointer"}}>{sv.l}</button>;})}</div></div>
        <div><label style={{fontSize:11,fontWeight:600,color:T.g5}}>Fecha lesión</label><input type="date" value={f.date_injury} onChange={e=>sF(prev=>({...prev,date_injury:e.target.value}))} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:3}}/></div>
        <div style={{gridColumn:mob?"1":"1 / -1"}}><label style={{fontSize:11,fontWeight:600,color:T.g5}}>Descripción</label><textarea value={f.description} onChange={e=>sF(prev=>({...prev,description:e.target.value}))} rows={2} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,resize:"vertical" as const,boxSizing:"border-box" as const,marginTop:3}}/></div>
        <div style={{gridColumn:mob?"1":"1 / -1"}}><label style={{fontSize:11,fontWeight:600,color:T.g5}}>Notas</label><textarea value={f.notes} onChange={e=>sF(prev=>({...prev,notes:e.target.value}))} rows={2} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,resize:"vertical" as const,boxSizing:"border-box" as const,marginTop:3}}/></div>
      </div>
      <div style={{display:"flex",gap:8,marginTop:14}}>
        <Btn v="r" onClick={()=>onSave(f)} disabled={!f.athlete_id}>🩹 Registrar lesión</Btn>
        <Btn v="g" onClick={onCancel}>Cancelar</Btn>
      </div>
    </Card>
  </div>;
}
