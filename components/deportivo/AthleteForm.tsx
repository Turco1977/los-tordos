"use client";
import { useState } from "react";
import { T, DEP_DIV, DEP_POSITIONS } from "@/lib/constants";
import { Btn, Card } from "@/components/ui";

export function AthleteForm({onSave,onCancel,mob}:any){
  const [f,sF]=useState({first_name:"",last_name:"",division:DEP_DIV[0],position:"",birth_date:"",dni:"",phone:"",email:"",emergency_contact:{name:"",phone:"",relation:""},medical_info:{blood_type:"",allergies:"",conditions:""}});
  return <div>
    <Btn v="g" s="s" onClick={onCancel} style={{marginBottom:12}}>← Cancelar</Btn>
    <h2 style={{fontSize:16,color:T.nv,margin:"0 0 14px"}}>+ Nuevo Jugador</h2>
    <Card>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:10}}>
        {[["Nombre *","first_name"],["Apellido *","last_name"]].map(([l,k])=><div key={k}><label style={{fontSize:11,fontWeight:600,color:T.g5}}>{l}</label><input value={(f as any)[k]} onChange={e=>sF(prev=>({...prev,[k]:e.target.value}))} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:3}}/></div>)}
        <div><label style={{fontSize:11,fontWeight:600,color:T.g5}}>División *</label><select value={f.division} onChange={e=>sF(prev=>({...prev,division:e.target.value}))} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,marginTop:3}}>{DEP_DIV.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
        <div><label style={{fontSize:11,fontWeight:600,color:T.g5}}>Posición</label><select value={f.position} onChange={e=>sF(prev=>({...prev,position:e.target.value}))} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,marginTop:3}}><option value="">Seleccionar...</option>{DEP_POSITIONS.map(p=><option key={p} value={p}>{p}</option>)}</select></div>
        <div><label style={{fontSize:11,fontWeight:600,color:T.g5}}>Fecha nacimiento</label><input type="date" value={f.birth_date} onChange={e=>sF(prev=>({...prev,birth_date:e.target.value}))} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:3}}/></div>
        <div><label style={{fontSize:11,fontWeight:600,color:T.g5}}>DNI</label><input value={f.dni} onChange={e=>sF(prev=>({...prev,dni:e.target.value}))} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:3}}/></div>
        <div><label style={{fontSize:11,fontWeight:600,color:T.g5}}>Teléfono</label><input value={f.phone} onChange={e=>sF(prev=>({...prev,phone:e.target.value}))} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:3}}/></div>
        <div><label style={{fontSize:11,fontWeight:600,color:T.g5}}>Email</label><input value={f.email} onChange={e=>sF(prev=>({...prev,email:e.target.value}))} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:3}}/></div>
      </div>
      <div style={{marginTop:12}}><h4 style={{fontSize:12,color:T.nv,margin:"0 0 8px"}}>Contacto de emergencia</h4>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:8}}>
          {[["Nombre","name"],["Teléfono","phone"],["Relación","relation"]].map(([l,k])=><div key={k}><label style={{fontSize:10,color:T.g5}}>{l}</label><input value={(f.emergency_contact as any)[k]} onChange={e=>sF(prev=>({...prev,emergency_contact:{...prev.emergency_contact,[k]:e.target.value}}))} style={{width:"100%",padding:6,borderRadius:6,border:"1px solid "+T.g3,fontSize:11,boxSizing:"border-box" as const,marginTop:2}}/></div>)}
        </div>
      </div>
      <div style={{marginTop:12}}><h4 style={{fontSize:12,color:T.nv,margin:"0 0 8px"}}>Información médica</h4>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:8}}>
          {[["Grupo sanguíneo","blood_type"],["Alergias","allergies"],["Condiciones","conditions"]].map(([l,k])=><div key={k}><label style={{fontSize:10,color:T.g5}}>{l}</label><input value={(f.medical_info as any)[k]} onChange={e=>sF(prev=>({...prev,medical_info:{...prev.medical_info,[k]:e.target.value}}))} style={{width:"100%",padding:6,borderRadius:6,border:"1px solid "+T.g3,fontSize:11,boxSizing:"border-box" as const,marginTop:2}}/></div>)}
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginTop:14}}>
        <Btn v="p" onClick={()=>onSave(f)} disabled={!f.first_name||!f.last_name}>💾 Guardar</Btn>
        <Btn v="g" onClick={onCancel}>Cancelar</Btn>
      </div>
    </Card>
  </div>;
}
