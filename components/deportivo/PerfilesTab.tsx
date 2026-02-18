"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DEP_ROLES, DEP_DIV } from "@/lib/constants";
import type { DepStaff } from "@/lib/supabase/types";
import { useC } from "@/lib/theme-context";
import { Btn, Card } from "@/components/ui";

const supabase = createClient();

export function PerfilesTab({staffList,onUpdate,onDel,mob,showT,fetchAll}:any){
  const{colors,isDark,cardBg}=useC();
  const [showCreate,sShowCreate]=useState(false);
  const [creating,sCreating]=useState(false);
  const [creds,sCreds]=useState<{email:string;password:string}|null>(null);
  const [nFirst,sNFirst]=useState("");const [nLast,sNLast]=useState("");const [nEmail,sNEmail]=useState("");const [nPass,sNPass]=useState("");
  const [nRole,sNRole]=useState("entrenador");const [nDivs,sNDivs]=useState<string[]>([]);

  const [editId,sEditId]=useState<string|null>(null);
  const [editRole,sEditRole]=useState("");const [editDivs,sEditDivs]=useState<string[]>([]);

  const activeStaff=staffList.filter((s:DepStaff)=>s.active);

  const doCreate=async()=>{
    if(!nFirst||!nLast){showT("Completá nombre y apellido","err");return;}
    sCreating(true);
    try{
      const sess=await supabase.auth.getSession();
      const token=sess.data.session?.access_token;
      const res=await fetch("/api/deportivo/create-user",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},body:JSON.stringify({email:nEmail||undefined,password:nPass||undefined,first_name:nFirst,last_name:nLast,dep_role:nRole,divisions:nDivs})});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||"Error al crear usuario");
      if(data.credentials) sCreds(data.credentials);
      showT("Perfil creado exitosamente");
      sNFirst("");sNLast("");sNEmail("");sNPass("");sNRole("entrenador");sNDivs([]);
      sShowCreate(false);
      await fetchAll();
    }catch(e:any){showT(e.message||"Error","err");}
    sCreating(false);
  };

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <h2 style={{margin:0,fontSize:18,color:colors.nv}}>👤 Perfiles Deportivos ({activeStaff.length})</h2>
      <Btn v="p" s="s" onClick={()=>{sShowCreate(!showCreate);sCreds(null);}}>+ Crear perfil</Btn>
    </div>

    {/* Credentials display (shown once after creation) */}
    {creds&&<Card style={{marginBottom:14,background:isDark?"#064E3B":"#ECFDF5",border:"1px solid "+(isDark?"#065F46":"#A7F3D0")}}>
      <h3 style={{margin:"0 0 8px",fontSize:13,color:colors.nv}}>✅ Usuario creado — copiá las credenciales</h3>
      <div style={{background:isDark?"#0F172A":"#fff",borderRadius:8,padding:12,fontFamily:"monospace",fontSize:12,lineHeight:1.8,border:"1px solid "+colors.g3}}>
        <div><strong>Email:</strong> {creds.email}</div>
        <div><strong>Contraseña:</strong> {creds.password}</div>
      </div>
      <div style={{display:"flex",gap:8,marginTop:10}}>
        <Btn v="p" s="s" onClick={()=>{navigator.clipboard.writeText("Email: "+creds.email+"\nContraseña: "+creds.password);showT("Copiado al portapapeles");}}>📋 Copiar</Btn>
        <Btn v="g" s="s" onClick={()=>sCreds(null)}>Cerrar</Btn>
      </div>
    </Card>}

    {/* Create form */}
    {showCreate&&!creds&&<Card style={{marginBottom:14,background:isDark?colors.g2:"#FFFBEB",border:"1px solid "+(isDark?colors.g3:"#FDE68A")}}>
      <h3 style={{margin:"0 0 10px",fontSize:13,color:colors.nv}}>Crear nuevo perfil deportivo</h3>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:10}}>
        <div><label style={{fontSize:11,fontWeight:600,color:colors.g5}}>Nombre *</label><input value={nFirst} onChange={e=>sNFirst(e.target.value)} placeholder="Nombre" style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,marginTop:3,boxSizing:"border-box" as const,background:cardBg,color:colors.nv}}/></div>
        <div><label style={{fontSize:11,fontWeight:600,color:colors.g5}}>Apellido *</label><input value={nLast} onChange={e=>sNLast(e.target.value)} placeholder="Apellido" style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,marginTop:3,boxSizing:"border-box" as const,background:cardBg,color:colors.nv}}/></div>
        <div><label style={{fontSize:11,fontWeight:600,color:colors.g5}}>Email <span style={{fontWeight:400,color:colors.g4}}>(opcional, para login)</span></label><input value={nEmail} onChange={e=>sNEmail(e.target.value)} placeholder="email@ejemplo.com" type="email" style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,marginTop:3,boxSizing:"border-box" as const,background:cardBg,color:colors.nv}}/></div>
        <div><label style={{fontSize:11,fontWeight:600,color:colors.g5}}>Contraseña <span style={{fontWeight:400,color:colors.g4}}>(opcional, se autogenera)</span></label><input value={nPass} onChange={e=>sNPass(e.target.value)} placeholder="Dejar vacío para autogenerar" type="text" style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,marginTop:3,boxSizing:"border-box" as const,background:cardBg,color:colors.nv}}/></div>
        <div><label style={{fontSize:11,fontWeight:600,color:colors.g5}}>Rol deportivo *</label><select value={nRole} onChange={e=>sNRole(e.target.value)} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,marginTop:3,background:cardBg,color:colors.nv}}>{Object.entries(DEP_ROLES).map(([k,v])=><option key={k} value={k}>{v.i} {v.l}</option>)}</select></div>
      </div>
      <div style={{marginTop:8}}><label style={{fontSize:11,fontWeight:600,color:colors.g5}}>Divisiones asignadas</label>
        <div style={{display:"flex",gap:4,flexWrap:"wrap" as const,marginTop:4}}>{DEP_DIV.map(d=><button key={d} onClick={()=>sNDivs(prev=>prev.includes(d)?prev.filter(x=>x!==d):[...prev,d])} style={{padding:"4px 10px",borderRadius:16,fontSize:10,border:nDivs.includes(d)?"2px solid "+colors.nv:"1px solid "+colors.g3,background:nDivs.includes(d)?colors.nv+"10":cardBg,color:nDivs.includes(d)?colors.nv:colors.g5,cursor:"pointer",fontWeight:600}}>{d}</button>)}</div>
      </div>
      <div style={{display:"flex",gap:8,marginTop:12}}>
        <Btn v="p" onClick={doCreate} disabled={creating||!nFirst||!nLast}>{creating?"Creando...":"Crear perfil"}</Btn>
        <Btn v="g" onClick={()=>sShowCreate(false)}>Cancelar</Btn>
      </div>
    </Card>}

    {/* Staff list */}
    <div style={{display:"flex",flexDirection:"column" as const,gap:8}}>
      {activeStaff.map((s:any)=>{
        const r=DEP_ROLES[s.dep_role];
        const isEditing=editId===s.id;
        return <Card key={s.id}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700,color:colors.nv}}>{s.first_name} {s.last_name}</div>
              <div style={{fontSize:11,color:colors.g5}}>{s.email}</div>
              <div style={{fontSize:12,color:colors.g5,marginTop:2}}>{r?.i} {r?.l||s.dep_role} · Nivel {r?.lv||0}</div>
              {s.divisions.length>0&&<div style={{display:"flex",gap:4,flexWrap:"wrap" as const,marginTop:4}}>{s.divisions.map((d:string)=><span key={d} style={{background:colors.bl+"15",color:colors.bl,padding:"1px 8px",borderRadius:10,fontSize:10,fontWeight:600}}>{d}</span>)}</div>}
              {s.divisions.length===0&&<div style={{fontSize:10,color:colors.g4,marginTop:4}}>Sin divisiones asignadas</div>}
            </div>
            <div style={{display:"flex",gap:4}}>
              <Btn v="g" s="s" onClick={()=>{if(isEditing){sEditId(null);}else{sEditId(s.id);sEditRole(s.dep_role);sEditDivs([...s.divisions]);}}}>✏️</Btn>
              <Btn v="g" s="s" onClick={()=>{if(confirm("¿Desactivar este perfil?")){onDel(s.id);}}} style={{color:colors.rd}}>✕</Btn>
            </div>
          </div>
          {isEditing&&<div style={{marginTop:10,padding:10,background:colors.g1,borderRadius:8}}>
            <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8}}>
              <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Rol</label><select value={editRole} onChange={e=>sEditRole(e.target.value)} style={{width:"100%",padding:6,borderRadius:6,border:"1px solid "+colors.g3,fontSize:11,marginTop:2,background:cardBg,color:colors.nv}}>{Object.entries(DEP_ROLES).map(([k,v])=><option key={k} value={k}>{v.i} {v.l}</option>)}</select></div>
            </div>
            <div style={{marginTop:6}}><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Divisiones</label>
              <div style={{display:"flex",gap:4,flexWrap:"wrap" as const,marginTop:3}}>{DEP_DIV.map(d=><button key={d} onClick={()=>sEditDivs(prev=>prev.includes(d)?prev.filter(x=>x!==d):[...prev,d])} style={{padding:"3px 8px",borderRadius:12,fontSize:9,border:editDivs.includes(d)?"2px solid "+colors.nv:"1px solid "+colors.g3,background:editDivs.includes(d)?colors.nv+"10":cardBg,color:editDivs.includes(d)?colors.nv:colors.g5,cursor:"pointer",fontWeight:600}}>{d}</button>)}</div>
            </div>
            <Btn v="p" s="s" onClick={()=>{onUpdate(s.id,{dep_role:editRole,divisions:editDivs});sEditId(null);}} style={{marginTop:8}}>💾 Guardar</Btn>
          </div>}
        </Card>;
      })}
      {activeStaff.length===0&&<Card style={{textAlign:"center",padding:24,color:colors.g4}}><div style={{fontSize:32}}>👤</div><div style={{marginTop:8,fontSize:13}}>No hay perfiles deportivos. Creá el primero.</div></Card>}
    </div>
  </div>;
}
