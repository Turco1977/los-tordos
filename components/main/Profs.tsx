"use client";
import { useState } from "react";
import { T, ROLES, RK, fn } from "@/lib/constants";
import { Btn, Card } from "@/components/ui";

export function Profs({users,deptos,areas,onDel,onAdd,onEditUser,isAd,onAssignTask,mob}:any){
  const [adding,sAdding]=useState(false);const [editing,sEditing]=useState<any>(null);
  const [nf,sNf]=useState({n:"",a:"",role:"usuario",dId:"",div:"",mail:"",tel:""});
  const [ef,sEf]=useState({n:"",a:"",role:"",dId:"",div:"",mail:"",tel:""});
  const resetNew=()=>{sNf({n:"",a:"",role:"usuario",dId:"",div:"",mail:"",tel:""});sAdding(false);};
  return(<div style={{maxWidth:720}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <h2 style={{margin:0,fontSize:19,color:T.nv,fontWeight:800}}>👥 Perfiles</h2>
      {isAd&&<Btn v="p" s="s" onClick={()=>sAdding(true)}>+ Nuevo perfil</Btn>}
    </div>
    {adding&&<Card style={{marginBottom:14,background:"#F0FDF4",border:"1px solid #BBF7D0"}}>
      <div style={{fontSize:12,fontWeight:700,color:"#166534",marginBottom:10}}>➕ Nuevo perfil</div>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8,marginBottom:8}}>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Nombre *</label><input value={nf.n} onChange={e=>sNf(p=>({...p,n:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Apellido *</label><input value={nf.a} onChange={e=>sNf(p=>({...p,a:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8,marginBottom:8}}>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Rol *</label><select value={nf.role} onChange={e=>sNf(p=>({...p,role:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,marginTop:2}}>{RK.map(k=><option key={k} value={k}>{ROLES[k].i} {ROLES[k].l}</option>)}</select></div>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Departamento</label><select value={nf.dId} onChange={e=>sNf(p=>({...p,dId:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,marginTop:2}}><option value="">Seleccionar...</option>{deptos.map((d:any)=>{const ar=areas.find((a:any)=>a.id===d.aId);return <option key={d.id} value={d.id}>{ar?ar.icon+" ":""}{d.name}</option>;})}</select></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:8,marginBottom:8}}>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>División</label><input value={nf.div} onChange={e=>sNf(p=>({...p,div:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Email</label><input value={nf.mail} onChange={e=>sNf(p=>({...p,mail:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Teléfono</label><input value={nf.tel} onChange={e=>sNf(p=>({...p,tel:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
      </div>
      <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}><Btn v="g" s="s" onClick={resetNew}>Cancelar</Btn><Btn v="s" s="s" disabled={!nf.n||!nf.a} onClick={()=>{onAdd({id:"u"+Date.now(),n:nf.n,a:nf.a,role:nf.role,dId:Number(nf.dId)||1,div:nf.div,mail:nf.mail,tel:nf.tel});resetNew();}}>✅ Crear</Btn></div>
    </Card>}
    {editing&&<Card style={{marginBottom:14,background:"#FFFBEB",border:"1px solid #FDE68A"}}>
      <div style={{fontSize:12,fontWeight:700,color:"#92400E",marginBottom:10}}>✏️ Editando: {ef.n} {ef.a}</div>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8,marginBottom:8}}>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Nombre</label><input value={ef.n} onChange={e=>sEf(p=>({...p,n:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Apellido</label><input value={ef.a} onChange={e=>sEf(p=>({...p,a:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8,marginBottom:8}}>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Rol</label><select value={ef.role} onChange={e=>sEf(p=>({...p,role:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,marginTop:2}}>{RK.map(k=><option key={k} value={k}>{ROLES[k].i} {ROLES[k].l}</option>)}</select></div>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Departamento</label><select value={ef.dId} onChange={e=>sEf(p=>({...p,dId:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,marginTop:2}}><option value="">Seleccionar...</option>{deptos.map((d:any)=>{const ar=areas.find((a:any)=>a.id===d.aId);return <option key={d.id} value={d.id}>{ar?ar.icon+" ":""}{d.name}</option>;})}</select></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:8,marginBottom:8}}>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>División</label><input value={ef.div} onChange={e=>sEf(p=>({...p,div:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Email</label><input value={ef.mail} onChange={e=>sEf(p=>({...p,mail:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Teléfono</label><input value={ef.tel} onChange={e=>sEf(p=>({...p,tel:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
      </div>
      <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}><Btn v="g" s="s" onClick={()=>sEditing(null)}>Cancelar</Btn><Btn v="p" s="s" onClick={()=>{onEditUser(editing.id,{n:ef.n,a:ef.a,role:ef.role,dId:Number(ef.dId)||editing.dId,div:ef.div,mail:ef.mail,tel:ef.tel});sEditing(null);}}>💾 Guardar</Btn></div>
    </Card>}
    {RK.map(k=>{const l=users.filter((u:any)=>u.role===k);if(!l.length)return null;return(<div key={k} style={{marginBottom:14}}><div style={{fontSize:13,fontWeight:700,color:T.nv,marginBottom:6}}>{ROLES[k].i} {ROLES[k].l} ({l.length})</div>{l.map((u:any)=>{const d=deptos.find((x:any)=>x.id===u.dId),a=d?areas.find((x:any)=>x.id===d.aId):null;return(<Card key={u.id} style={{padding:"9px 12px",marginBottom:4,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:13,fontWeight:600,color:T.nv}}>{fn(u)}</div><div style={{fontSize:10,color:T.g4}}>{a?a.name:""} → {d?d.name:""}{u.div?" · "+u.div:""}</div></div><div style={{display:"flex",gap:4}}>{isAd&&onAssignTask&&<Btn v="g" s="s" onClick={()=>onAssignTask(u)} style={{color:T.bl}}>📋</Btn>}{isAd&&<><Btn v="g" s="s" onClick={()=>{sEditing(u);sEf({n:u.n,a:u.a,role:u.role,dId:String(u.dId),div:u.div||"",mail:u.mail||"",tel:u.tel||""});}}>✏️</Btn>{["superadmin"].indexOf(u.role)<0&&<Btn v="g" s="s" onClick={()=>onDel(u.id)} style={{color:T.rd}}>🗑️</Btn>}</>}</div></Card>);})}</div>);})}
  </div>);
}
