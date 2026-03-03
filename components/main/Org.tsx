"use client";
import { useState, useEffect, useCallback } from "react";
import { T, ROLES, fn, DEPT_DESC, DIV } from "@/lib/constants";
import { Btn, Card, Bread } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

function OrgNode({icon,title,sub,color,children,cnt,ex,onTog,mob,onFicha}:any){return(<div style={{marginBottom:6}}><div onClick={onTog} style={{display:"flex",alignItems:"center",gap:8,padding:mob?"8px 10px":"10px 14px",background:"#fff",borderRadius:10,border:"1px solid "+T.g2,cursor:"pointer",borderLeft:"4px solid "+color}}><span style={{fontSize:18}}>{icon}</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:T.nv}}>{title}</div>{sub&&<div style={{fontSize:10,color:T.g4}}>{sub}</div>}</div>{onFicha&&<span onClick={(e:any)=>{e.stopPropagation();onFicha();}} style={{fontSize:14,cursor:"pointer",padding:"2px 6px",borderRadius:6,background:T.g1,border:"1px solid "+T.g2}} title="Ver ficha de puesto">📋</span>}{cnt!==undefined&&<span style={{background:T.g1,borderRadius:12,padding:"1px 8px",fontSize:10,fontWeight:600,color:T.g5}}>{cnt}</span>}<span style={{fontSize:12,color:T.g4,transform:ex?"rotate(90deg)":"none",transition:"transform .2s"}}>▶</span></div>{ex&&<div style={{marginLeft:mob?12:24,marginTop:4,borderLeft:"2px solid "+color+"22",paddingLeft:mob?8:14}}>{children}</div>}</div>);}

function MemberDetail({email,phone:initPhone,memberId,userId,userLevel,showT}:any){
  const [ph,sPh]=useState(initPhone||"");const [saving,sSaving]=useState(false);
  const [showReset,sShowReset]=useState(false);const [pw,sPw]=useState("");const [resetting,sResetting]=useState(false);
  const canReset=userId&&(userLevel||0)>=4;
  const savePhone=async()=>{sSaving(true);try{const sb=createClient();if(userId)await sb.from("profiles").update({phone:ph}).eq("id",userId);if(memberId)await sb.from("org_members").update({phone:ph}).eq("id",memberId);showT?.("Teléfono actualizado");}catch(e:any){showT?.(e.message||"Error","err");}sSaving(false);};
  const resetPw=async()=>{if(!userId||!pw)return;sResetting(true);try{const sb=createClient();const{data:{session}}=await sb.auth.getSession();const res=await fetch("/api/admin/reset-password",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+session?.access_token},body:JSON.stringify({user_id:userId,new_password:pw})});const json=await res.json();if(json.error)throw new Error(json.error);showT?.("Contraseña reseteada");sPw("");sShowReset(false);}catch(e:any){showT?.(e.message||"Error","err");}sResetting(false);};
  return(<div style={{padding:"8px 10px",background:"#F0F9FF",borderRadius:"0 0 7px 7px",border:"1px solid #93C5FD",borderTop:"1px dashed #93C5FD"}}>
    <div style={{display:"flex",gap:12,flexWrap:"wrap" as const,alignItems:"flex-start"}}>
      <div style={{minWidth:140}}><div style={{fontSize:10,fontWeight:700,color:T.g4,textTransform:"uppercase" as const}}>Email</div><div style={{fontSize:12,color:T.nv}}>{email||"—"}</div></div>
      <div style={{minWidth:140}}><div style={{fontSize:10,fontWeight:700,color:T.g4,textTransform:"uppercase" as const}}>Teléfono</div><div style={{display:"flex",gap:4,alignItems:"center"}}><input value={ph} onChange={e=>sPh(e.target.value)} placeholder="Sin teléfono" style={{padding:"4px 8px",borderRadius:6,border:"1px solid "+T.g3,fontSize:12,width:130}}/><Btn s="s" onClick={savePhone} disabled={saving}>{saving?"...":"💾"}</Btn></div></div>
    </div>
    {canReset&&<div style={{marginTop:8,paddingTop:8,borderTop:"1px solid #BFDBFE"}}>
      {!showReset?<button onClick={()=>sShowReset(true)} style={{padding:"4px 12px",borderRadius:6,border:"1px solid #FCA5A5",background:"#FEF2F2",color:"#DC2626",fontSize:11,fontWeight:600,cursor:"pointer"}}>🔑 Resetear Contraseña</button>
      :<div style={{display:"flex",gap:4,alignItems:"center",flexWrap:"wrap" as const}}><input type="password" value={pw} onChange={e=>sPw(e.target.value)} placeholder="Nueva contraseña (mín 6)" style={{padding:"4px 8px",borderRadius:6,border:"1px solid "+T.g3,fontSize:12,width:160}}/><Btn s="s" onClick={resetPw} disabled={resetting||pw.length<6}>{resetting?"...":"Confirmar"}</Btn><Btn v="g" s="s" onClick={()=>{sShowReset(false);sPw("");}}>✕</Btn></div>}
    </div>}
    {!userId&&<div style={{marginTop:4,fontSize:10,color:T.g4,fontStyle:"italic"}}>Sin cuenta vinculada en el sistema</div>}
  </div>);
}

function OrgMember({m,isSA,onEdit,onDel,onAssign,onDm,onUp,onDown,isFirst,isLast,expanded,onToggle,matchedUser,userLevel,showT}:any){const ok=m.n&&m.a;return(<div style={{marginBottom:3}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 10px",background:ok?(expanded?"#EFF6FF":"#FAFAFA"):T.g1,borderRadius:expanded?"7px 7px 0 0":7,border:"1px solid "+(expanded?"#93C5FD":T.g2)}}><div onClick={ok?onToggle:undefined} style={{cursor:ok?"pointer":undefined,flex:1}}><div style={{fontSize:9,fontWeight:700,color:T.rd,textTransform:"uppercase" as const}}>{m.cargo}</div>{ok?<div style={{fontSize:12,fontWeight:700,color:T.nv}}>{m.n} {m.a} <span style={{fontSize:10,color:T.g4}}>{expanded?"▼":"▶"}</span></div>:<div style={{fontSize:11,color:T.g3,fontStyle:"italic"}}>Sin asignar</div>}</div><div style={{display:"flex",gap:3,alignItems:"center"}}>{isSA&&onUp&&!isFirst&&<Btn v="g" s="s" onClick={()=>onUp(m.id)}>▲</Btn>}{isSA&&onDown&&!isLast&&<Btn v="g" s="s" onClick={()=>onDown(m.id)}>▼</Btn>}{ok&&onDm&&<span title="Mensaje directo"><Btn v="g" s="s" onClick={()=>onDm(m)}>💬</Btn></span>}{ok&&onAssign&&<span title="Asignar tarea"><Btn v="g" s="s" onClick={()=>onAssign(m)}>📋</Btn></span>}{isSA&&<Btn v="g" s="s" onClick={()=>onEdit(m)}>✏️</Btn>}{isSA&&<Btn v="g" s="s" onClick={()=>onDel&&onDel(m.id)} style={{color:T.rd}}>🗑️</Btn>}</div></div>{expanded&&ok&&<MemberDetail email={m.mail} phone={m.tel} memberId={m.id} userId={matchedUser?.id} userLevel={userLevel} showT={showT}/>}</div>);}

/* ── Staff Ficha Modal ── */
const DEP_ROLE_LABELS:Record<string,string>={dd:"Director Deportivo",dr:"Director Rugby",manager:"Manager",entrenador:"Entrenador",pf:"Prep. Física",coord_pf:"Coord. Prep. Física",kinesiologo:"Kinesiólogo",medico:"Médico"};
const DEP_ROLES=Object.keys(DEP_ROLE_LABELS) as string[];

function StaffFichaModal({staff,canEdit,onClose,onSave,mob,userLevel,showT}:{staff:any;canEdit:boolean;onClose:()=>void;onSave:(d:any)=>void;mob:boolean;userLevel?:number;showT?:(msg:string,type?:"ok"|"err")=>void}){
  const [editing,sEditing]=useState(false);
  const [form,sForm]=useState({first_name:staff.first_name||"",last_name:staff.last_name||"",dep_role:staff.dep_role||"entrenador",divisions:staff.divisions||[] as string[],active:staff.active!==false,phone:staff.phone||""});
  const [saving,sSaving]=useState(false);
  const [showResetSF,sShowResetSF]=useState(false);const [newPwSF,sNewPwSF]=useState("");const [resettingSF,sResettingSF]=useState(false);
  const canResetSF=staff.user_id&&(userLevel||0)>=4;
  const resetPwSF=async()=>{if(!staff.user_id||!newPwSF)return;sResettingSF(true);try{const sb=createClient();const{data:{session}}=await sb.auth.getSession();const res=await fetch("/api/admin/reset-password",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+session?.access_token},body:JSON.stringify({user_id:staff.user_id,new_password:newPwSF})});const json=await res.json();if(json.error)throw new Error(json.error);showT?.("Contraseña reseteada");sNewPwSF("");sShowResetSF(false);}catch(e:any){showT?.(e.message||"Error","err");}sResettingSF(false);};
  useEffect(()=>{const h=(e:KeyboardEvent)=>{if(e.key==="Escape")onClose();};document.addEventListener("keydown",h);return()=>document.removeEventListener("keydown",h);},[onClose]);
  useEffect(()=>{document.body.style.overflow="hidden";return()=>{document.body.style.overflow="";};},[]);
  const toggleDiv=(d:string)=>sForm(p=>({...p,divisions:p.divisions.includes(d)?p.divisions.filter((x:string)=>x!==d):[...p.divisions,d]}));
  const handleSave=async()=>{sSaving(true);await onSave({id:staff.id,user_id:staff.user_id,...form});sSaving(false);sEditing(false);};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(10,22,40,.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:mob?8:12}} onClick={onClose}>
      <div onClick={(e:any)=>e.stopPropagation()} style={{background:"#fff",borderRadius:14,maxWidth:480,width:"100%",maxHeight:"85vh",display:"flex",flexDirection:"column" as const,overflow:"hidden"}}>
        <div style={{padding:"16px 20px 12px",borderBottom:"1px solid "+T.g2}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:22}}>👤</span>
              <div><h2 style={{margin:0,fontSize:16,fontWeight:800,color:T.nv}}>{staff.first_name} {staff.last_name}</h2>
              <div style={{display:"flex",gap:4,marginTop:2}}>
                <span style={{fontSize:10,color:"#fff",background:T.bl,borderRadius:10,padding:"1px 8px",fontWeight:600}}>{DEP_ROLE_LABELS[staff.dep_role]||staff.dep_role}</span>
                <span style={{fontSize:10,color:staff.active!==false?"#059669":"#DC2626",background:staff.active!==false?"#D1FAE5":"#FEE2E2",borderRadius:10,padding:"1px 8px",fontWeight:600}}>{staff.active!==false?"Activo":"Inactivo"}</span>
              </div></div>
            </div>
            <button onClick={onClose} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:T.g4}}>✕</button>
          </div>
        </div>
        <div style={{flex:1,padding:"12px 20px",overflowY:"auto" as const}}>
          {!editing?<>
            {staff.email&&<div style={{marginBottom:8}}><div style={{fontSize:10,fontWeight:700,color:T.g4,textTransform:"uppercase" as const}}>Email</div><div style={{fontSize:13,color:T.nv}}>{staff.email}</div></div>}
            <div style={{marginBottom:8}}><div style={{fontSize:10,fontWeight:700,color:T.g4,textTransform:"uppercase" as const}}>Teléfono</div><div style={{fontSize:13,color:T.nv}}>{staff.phone||"—"}</div></div>
            <div style={{marginBottom:8}}><div style={{fontSize:10,fontWeight:700,color:T.g4,textTransform:"uppercase" as const}}>Rol deportivo</div><div style={{fontSize:13,color:T.nv}}>{DEP_ROLE_LABELS[staff.dep_role]||staff.dep_role}</div></div>
            <div style={{marginBottom:8}}><div style={{fontSize:10,fontWeight:700,color:T.g4,textTransform:"uppercase" as const}}>Divisiones</div>
              <div style={{display:"flex",flexWrap:"wrap" as const,gap:4,marginTop:2}}>{(staff.divisions||[]).length>0?(staff.divisions||[]).map((d:string)=><span key={d} style={{fontSize:11,padding:"2px 8px",borderRadius:10,background:T.g1,border:"1px solid "+T.g2,color:T.nv,fontWeight:600}}>{d}</span>):<span style={{fontSize:11,color:T.g3,fontStyle:"italic"}}>Sin divisiones</span>}</div>
            </div>
            {canResetSF&&<div style={{marginTop:8,paddingTop:8,borderTop:"1px solid "+T.g2}}>
              {!showResetSF?<button onClick={()=>sShowResetSF(true)} style={{padding:"6px 14px",borderRadius:6,border:"1px solid #FCA5A5",background:"#FEF2F2",color:"#DC2626",fontSize:11,fontWeight:600,cursor:"pointer"}}>🔑 Resetear Contraseña</button>
              :<div style={{display:"flex",gap:4,alignItems:"center",flexWrap:"wrap" as const}}><input type="password" value={newPwSF} onChange={e=>sNewPwSF(e.target.value)} placeholder="Nueva contraseña (mín 6)" style={{padding:"4px 8px",borderRadius:6,border:"1px solid "+T.g3,fontSize:12,width:180}}/><button onClick={resetPwSF} disabled={resettingSF||newPwSF.length<6} style={{padding:"4px 12px",borderRadius:6,border:"none",background:T.nv,color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer",opacity:resettingSF||newPwSF.length<6?.5:1}}>{resettingSF?"...":"Confirmar"}</button><button onClick={()=>{sShowResetSF(false);sNewPwSF("");}} style={{padding:"4px 8px",borderRadius:6,border:"1px solid "+T.g3,background:"#fff",color:T.g5,fontSize:11,cursor:"pointer"}}>✕</button></div>}
            </div>}
          </>:<>
            <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8,marginBottom:10}}>
              <div><label style={{fontSize:10,fontWeight:700,color:T.g4,textTransform:"uppercase" as const}}>Nombre</label><input value={form.first_name} onChange={e=>sForm(p=>({...p,first_name:e.target.value}))} style={{width:"100%",padding:"6px 8px",borderRadius:6,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const}}/></div>
              <div><label style={{fontSize:10,fontWeight:700,color:T.g4,textTransform:"uppercase" as const}}>Apellido</label><input value={form.last_name} onChange={e=>sForm(p=>({...p,last_name:e.target.value}))} style={{width:"100%",padding:"6px 8px",borderRadius:6,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const}}/></div>
            </div>
            <div style={{marginBottom:10}}><label style={{fontSize:10,fontWeight:700,color:T.g4,textTransform:"uppercase" as const}}>Teléfono</label><input value={form.phone} onChange={e=>sForm(p=>({...p,phone:e.target.value}))} placeholder="Teléfono" style={{width:"100%",padding:"6px 8px",borderRadius:6,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const}}/></div>
            <div style={{marginBottom:10}}><label style={{fontSize:10,fontWeight:700,color:T.g4,textTransform:"uppercase" as const}}>Rol deportivo</label>
              <select value={form.dep_role} onChange={e=>sForm(p=>({...p,dep_role:e.target.value}))} style={{width:"100%",padding:"6px 8px",borderRadius:6,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const}}>
                {DEP_ROLES.map(r=><option key={r} value={r}>{DEP_ROLE_LABELS[r]}</option>)}
              </select>
            </div>
            <div style={{marginBottom:10}}><label style={{fontSize:10,fontWeight:700,color:T.g4,textTransform:"uppercase" as const}}>Divisiones</label>
              <div style={{display:"flex",flexWrap:"wrap" as const,gap:4,marginTop:4}}>
                {DIV.map(d=><button key={d} onClick={()=>toggleDiv(d)} style={{fontSize:11,padding:"3px 10px",borderRadius:10,border:"1px solid "+(form.divisions.includes(d)?T.bl:T.g2),background:form.divisions.includes(d)?"#DBEAFE":"#fff",color:form.divisions.includes(d)?T.bl:T.g5,fontWeight:600,cursor:"pointer"}}>{d}</button>)}
              </div>
            </div>
            <div style={{marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
              <label style={{fontSize:10,fontWeight:700,color:T.g4,textTransform:"uppercase" as const}}>Activo</label>
              <button onClick={()=>sForm(p=>({...p,active:!p.active}))} style={{padding:"3px 12px",borderRadius:10,border:"1px solid "+(form.active?"#059669":"#DC2626"),background:form.active?"#D1FAE5":"#FEE2E2",color:form.active?"#059669":"#DC2626",fontSize:11,fontWeight:600,cursor:"pointer"}}>{form.active?"Sí":"No"}</button>
            </div>
          </>}
        </div>
        <div style={{padding:"12px 20px",borderTop:"1px solid "+T.g2,display:"flex",justifyContent:"flex-end",gap:6}}>
          {canEdit&&!editing&&<button onClick={()=>sEditing(true)} style={{padding:"8px 20px",borderRadius:8,border:"1px solid "+T.bl,background:"#fff",color:T.bl,fontSize:12,fontWeight:600,cursor:"pointer"}}>Editar</button>}
          {editing&&<><button onClick={()=>sEditing(false)} style={{padding:"8px 20px",borderRadius:8,border:"1px solid "+T.g3,background:"#fff",color:T.g5,fontSize:12,fontWeight:600,cursor:"pointer"}}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} style={{padding:"8px 20px",borderRadius:8,border:"none",background:T.nv,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",opacity:saving?.6:1}}>{saving?"Guardando...":"Guardar"}</button></>}
          {!editing&&<button onClick={onClose} style={{padding:"8px 20px",borderRadius:8,border:"none",background:T.nv,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>Cerrar</button>}
        </div>
      </div>
    </div>);
}

/* ── Academia ── */
const AC_C={dir:"#1E3A5F",rugby:"#DC2626",hockey:"#EC4899",pf:"#F59E0B",med:"#10B981",sup:"#DC2626",juv:"#F59E0B",inf:"#3B82F6",esc:"#10B981"};
function P({cargo,name,color,star,onClick}:{cargo:string;name:string;color:string;star?:boolean;onClick?:()=>void}){
  const v=!name;return(<div onClick={onClick} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",background:v?T.g1:star?"#FEE2E2":"#FAFAFA",borderRadius:7,border:"1px solid "+(onClick?"#93C5FD":star?"#FECACA":T.g2),marginBottom:3,cursor:onClick?"pointer":undefined,transition:"border-color .2s"}}>
  <span style={{fontSize:10}}>{v?"⬜":star?"⭐":"👤"}</span><div style={{flex:1}}><div style={{fontSize:9,fontWeight:700,color,textTransform:"uppercase" as const}}>{cargo}</div>{v?<div style={{fontSize:11,color:T.g3,fontStyle:"italic"}}>Vacante</div>:<div style={{fontSize:12,fontWeight:700,color:T.nv}}>{name}</div>}</div>{onClick&&<span style={{fontSize:11,color:T.g4}}>✏️</span>}</div>);
}
/* Each division node groups its entrenador + PF together */
function DivNode({div,ent,pf,color,mob,ex,tog,k}:any){
  const staff=[ent&&{cargo:"Entrenador",name:ent},pf&&{cargo:"Prep. Física",name:pf}].filter(Boolean);
  return(<OrgNode mob={mob} icon="🏉" title={div} color={color} ex={!!ex[k]} onTog={()=>tog(k)} cnt={staff.filter((s:any)=>s.name).length+"/"+staff.length}>
    {staff.map((s:any,i:number)=><P key={i} cargo={s.cargo} name={s.name||""} color={color}/>)}
  </OrgNode>);
}

function AcademiaOrg({mob,ex,tog,depStaff,isSA,onStaffClick}:any){
  const m=(name:string)=>{if(!name||!depStaff?.length)return undefined;const nl=name.toLowerCase();const match=depStaff.find((s:any)=>{const full=((s.first_name||"")+" "+(s.last_name||"")).trim().toLowerCase();return full===nl;});return match?()=>onStaffClick(match):undefined;};
  return(<div>
    {/* Director Deportivo = nodo raíz, de él se desprenden las 4 ramas */}
    <OrgNode mob={mob} icon="🎯" title="Director Deportivo" sub="Franco Lucchini" color={AC_C.dir} ex={!!ex.acDD} onTog={()=>tog("acDD")}>
      <P cargo="Director Deportivo" name="Franco Lucchini" color={AC_C.dir} star onClick={m("Franco Lucchini")}/>

      {/* ── 1. DIRECTOR DE RUGBY ── */}
      <OrgNode mob={mob} icon="🏉" title="Director de Rugby" sub="Fernando Higgs" color={AC_C.rugby} ex={!!ex.acDR} onTog={()=>tog("acDR")} cnt="18">
        <P cargo="Director de Rugby" name="Fernando Higgs" color={AC_C.rugby} star onClick={m("Fernando Higgs")}/>

        <OrgNode mob={mob} icon="📋" title="Coordinadores de Especialidad" color={AC_C.rugby} ex={!!ex.acCo} onTog={()=>tog("acCo")} cnt="4">
          <P cargo="Coord. Infantiles" name="Carlos Efimenco" color={AC_C.rugby} onClick={m("Carlos Efimenco")}/>
          <P cargo="Coord. Ataque" name="Ricardo Donna" color={AC_C.rugby} onClick={m("Ricardo Donna")}/>
          <P cargo="Coord. LINE" name="Juan Ignacio Castillo" color={AC_C.rugby} onClick={m("Juan Ignacio Castillo")}/>
          <P cargo="Coord. SCRUM" name="Martin Silva" color={AC_C.rugby} onClick={m("Martin Silva")}/>
        </OrgNode>

        <OrgNode mob={mob} icon="🎽" title="Entrenadores" color={AC_C.rugby} ex={!!ex.acEnt} onTog={()=>tog("acEnt")} cnt="13">
          <OrgNode mob={mob} icon="🔴" title="Plantel Superior" color={AC_C.sup} ex={!!ex.acPS} onTog={()=>tog("acPS")} cnt="1">
            <P cargo="Entrenador" name="Pedro Garcia" color={AC_C.sup} onClick={m("Pedro Garcia")}/>
          </OrgNode>
          <OrgNode mob={mob} icon="🟡" title="M19" color={AC_C.juv} ex={!!ex.acM19} onTog={()=>tog("acM19")} cnt="1">
            <P cargo="Entrenador" name="Nicolas Ranieri" color={AC_C.juv} onClick={m("Nicolas Ranieri")}/>
          </OrgNode>
          <OrgNode mob={mob} icon="🟡" title="M17" color={AC_C.juv} ex={!!ex.acM17} onTog={()=>tog("acM17")} cnt="1">
            <P cargo="Entrenador" name="Gonzalo Intzes" color={AC_C.juv} onClick={m("Gonzalo Intzes")}/>
          </OrgNode>
          <OrgNode mob={mob} icon="🟡" title="M16" color={AC_C.juv} ex={!!ex.acM16} onTog={()=>tog("acM16")} cnt="1">
            <P cargo="Entrenador" name="Rodolfo Guerra" color={AC_C.juv} onClick={m("Rodolfo Guerra")}/>
          </OrgNode>
          <OrgNode mob={mob} icon="🟡" title="M15" color={AC_C.juv} ex={!!ex.acM15} onTog={()=>tog("acM15")} cnt="1">
            <P cargo="Entrenador" name="Sebastian Salas" color={AC_C.juv} onClick={m("Sebastian Salas")}/>
          </OrgNode>
          <OrgNode mob={mob} icon="🔵" title="M14" color={AC_C.inf} ex={!!ex.acM14} onTog={()=>tog("acM14")} cnt="1">
            <P cargo="Entrenador" name="Enrique Arroyo" color={AC_C.inf} onClick={m("Enrique Arroyo")}/>
          </OrgNode>
          <OrgNode mob={mob} icon="🔵" title="M13" color={AC_C.inf} ex={!!ex.acM13} onTog={()=>tog("acM13")} cnt="1">
            <P cargo="Entrenador" name="Ramiro Pontis Day" color={AC_C.inf} onClick={m("Ramiro Pontis Day")}/>
          </OrgNode>
          <OrgNode mob={mob} icon="🔵" title="M12" color={AC_C.inf} ex={!!ex.acM12} onTog={()=>tog("acM12")} cnt="1">
            <P cargo="Entrenador" name="Fabian Guzzo" color={AC_C.inf} onClick={m("Fabian Guzzo")}/>
          </OrgNode>
          <OrgNode mob={mob} icon="🔵" title="M11" color={AC_C.inf} ex={!!ex.acM11} onTog={()=>tog("acM11")} cnt="1">
            <P cargo="Entrenador" name="Maximiliano Ortega" color={AC_C.inf} onClick={m("Maximiliano Ortega")}/>
          </OrgNode>
          <OrgNode mob={mob} icon="🔵" title="M10" color={AC_C.inf} ex={!!ex.acM10} onTog={()=>tog("acM10")} cnt="1">
            <P cargo="Entrenador" name="Martin Sanchez" color={AC_C.inf} onClick={m("Martin Sanchez")}/>
          </OrgNode>
          <OrgNode mob={mob} icon="🟢" title="M9" color={AC_C.esc} ex={!!ex.acM9} onTog={()=>tog("acM9")} cnt="1">
            <P cargo="Entrenador" name="Daniel Pont Lezica" color={AC_C.esc} onClick={m("Daniel Pont Lezica")}/>
          </OrgNode>
          <OrgNode mob={mob} icon="🟢" title="M8" color={AC_C.esc} ex={!!ex.acM8} onTog={()=>tog("acM8")} cnt="1">
            <P cargo="Entrenador" name="Javier Badano" color={AC_C.esc} onClick={m("Javier Badano")}/>
          </OrgNode>
          <OrgNode mob={mob} icon="🟢" title="Escuelita" color={AC_C.esc} ex={!!ex.acEsc} onTog={()=>tog("acEsc")} cnt="1">
            <P cargo="Entrenador" name="Joel Aguero" color={AC_C.esc} onClick={m("Joel Aguero")}/>
          </OrgNode>
        </OrgNode>
      </OrgNode>

      {/* ── 2. DIRECTOR DE HOCKEY ── */}
      <OrgNode mob={mob} icon="🏑" title="Director de Hockey" sub="Florencia Marquez" color={AC_C.hockey} ex={!!ex.acDH} onTog={()=>tog("acDH")} cnt="1">
        <P cargo="Director Hockey" name="Florencia Marquez" color={AC_C.hockey} star onClick={m("Florencia Marquez")}/>
        <P cargo="Coordinador" name="" color={AC_C.hockey}/>
        <div style={{fontSize:10,color:T.g4,fontStyle:"italic",padding:4}}>Entrenadores por definir</div>
      </OrgNode>

      {/* ── 3. COORDINADOR PREP. FÍSICA ── */}
      <OrgNode mob={mob} icon="💪" title="Coordinador Preparación Física" sub="Matias Elias" color={AC_C.pf} ex={!!ex.acPF} onTog={()=>tog("acPF")} cnt="16">
        <P cargo="Coordinador PF" name="Matias Elias" color={AC_C.pf} star onClick={m("Matias Elias")}/>
        <OrgNode mob={mob} icon="🔴" title="Plantel Superior" color={AC_C.sup} ex={!!ex.pfPS} onTog={()=>tog("pfPS")} cnt="3">
          <P cargo="Prep. Física" name="Julieta Miranda" color={AC_C.sup} onClick={m("Julieta Miranda")}/>
          <P cargo="Prep. Física" name="David Boullaude" color={AC_C.sup} onClick={m("David Boullaude")}/>
          <P cargo="Prep. Física" name="Rodrigo Verger" color={AC_C.sup} onClick={m("Rodrigo Verger")}/>
        </OrgNode>
        <OrgNode mob={mob} icon="🟡" title="M19" color={AC_C.juv} ex={!!ex.pfM19} onTog={()=>tog("pfM19")} cnt="1">
          <P cargo="Prep. Física" name="Luis Puebla" color={AC_C.juv} onClick={m("Luis Puebla")}/>
        </OrgNode>
        <OrgNode mob={mob} icon="🟡" title="M17" color={AC_C.juv} ex={!!ex.pfM17} onTog={()=>tog("pfM17")} cnt="1">
          <P cargo="Prep. Física" name="Nicolas Hernandez" color={AC_C.juv} onClick={m("Nicolas Hernandez")}/>
        </OrgNode>
        <OrgNode mob={mob} icon="🟡" title="M16" color={AC_C.juv} ex={!!ex.pfM16} onTog={()=>tog("pfM16")} cnt="1">
          <P cargo="Prep. Física" name="" color={AC_C.juv}/>
        </OrgNode>
        <OrgNode mob={mob} icon="🟡" title="M15" color={AC_C.juv} ex={!!ex.pfM15} onTog={()=>tog("pfM15")} cnt="1">
          <P cargo="Prep. Física" name="" color={AC_C.juv}/>
        </OrgNode>
        <OrgNode mob={mob} icon="🔵" title="M14" color={AC_C.inf} ex={!!ex.pfM14} onTog={()=>tog("pfM14")} cnt="1">
          <P cargo="Prep. Física" name="Nicolas Gaido" color={AC_C.inf} onClick={m("Nicolas Gaido")}/>
        </OrgNode>
        <OrgNode mob={mob} icon="🔵" title="M13" color={AC_C.inf} ex={!!ex.pfM13} onTog={()=>tog("pfM13")} cnt="1">
          <P cargo="Prep. Física" name="Franco Gomez" color={AC_C.inf} onClick={m("Franco Gomez")}/>
        </OrgNode>
        <OrgNode mob={mob} icon="🔵" title="M12" color={AC_C.inf} ex={!!ex.pfM12} onTog={()=>tog("pfM12")} cnt="1">
          <P cargo="Prep. Física" name="Matias Boero" color={AC_C.inf} onClick={m("Matias Boero")}/>
        </OrgNode>
        <OrgNode mob={mob} icon="🔵" title="M11" color={AC_C.inf} ex={!!ex.pfM11} onTog={()=>tog("pfM11")} cnt="1">
          <P cargo="Prep. Física" name="Rodrigo Verger" color={AC_C.inf} onClick={m("Rodrigo Verger")}/>
        </OrgNode>
        <OrgNode mob={mob} icon="🔵" title="M10" color={AC_C.inf} ex={!!ex.pfM10} onTog={()=>tog("pfM10")} cnt="1">
          <P cargo="Prep. Física" name="Karen Carrion" color={AC_C.inf} onClick={m("Karen Carrion")}/>
        </OrgNode>
        <OrgNode mob={mob} icon="🟢" title="M9" color={AC_C.esc} ex={!!ex.pfM9} onTog={()=>tog("pfM9")} cnt="1">
          <P cargo="Prep. Física" name="Enzo Correa" color={AC_C.esc} onClick={m("Enzo Correa")}/>
        </OrgNode>
        <OrgNode mob={mob} icon="🟢" title="M8" color={AC_C.esc} ex={!!ex.pfM8} onTog={()=>tog("pfM8")} cnt="1">
          <P cargo="Prep. Física" name="Javier Badano" color={AC_C.esc} onClick={m("Javier Badano")}/>
        </OrgNode>
        <OrgNode mob={mob} icon="🟢" title="Escuelita" color={AC_C.esc} ex={!!ex.pfEsc} onTog={()=>tog("pfEsc")} cnt="2">
          <P cargo="Prep. Física" name="Joel Aguero" color={AC_C.esc} onClick={m("Joel Aguero")}/>
          <P cargo="Prep. Física" name="Federica Castilla" color={AC_C.esc} onClick={m("Federica Castilla")}/>
        </OrgNode>
      </OrgNode>

      {/* ── 4. EQUIPO MÉDICO ── */}
      <OrgNode mob={mob} icon="🩺" title="Equipo Médico" color={AC_C.med} ex={!!ex.acMed} onTog={()=>tog("acMed")} cnt="4">
        <OrgNode mob={mob} icon="🏥" title="Kinesiología" color={AC_C.med} ex={!!ex.acKin} onTog={()=>tog("acKin")} cnt="2">
          <P cargo="Kinesiólogo Rugby" name="Martin Azcurra" color={AC_C.med} onClick={m("Martin Azcurra")}/>
          <P cargo="Kinesiólogo Hockey" name="Carolina Armani" color={AC_C.med} onClick={m("Carolina Armani")}/>
        </OrgNode>
        <OrgNode mob={mob} icon="🥗" title="Nutrición" color={AC_C.med} ex={!!ex.acNut} onTog={()=>tog("acNut")} cnt="1">
          <P cargo="Nutricionista" name="Matias Zanni" color={AC_C.med} onClick={m("Matias Zanni")}/>
        </OrgNode>
        <OrgNode mob={mob} icon="🧠" title="Psicología" color={AC_C.med} ex={!!ex.acPsi} onTog={()=>tog("acPsi")} cnt="1">
          <P cargo="Psicóloga" name="Veronica Gomez" color={AC_C.med} onClick={m("Veronica Gomez")}/>
        </OrgNode>
      </OrgNode>
    </OrgNode>
  </div>);
}

function FichaModal({deptId,onX,mob}:{deptId:number;onX:()=>void;mob:boolean}){
  const f=DEPT_DESC[deptId];
  const [op,sOp]=useState<Record<string,boolean>>({pr:true,es:true,fn:true,kp:true,rl:true,ob:true});
  useEffect(()=>{const h=(e:KeyboardEvent)=>{if(e.key==="Escape")onX();};document.addEventListener("keydown",h);return()=>document.removeEventListener("keydown",h);},[onX]);
  useEffect(()=>{document.body.style.overflow="hidden";return()=>{document.body.style.overflow="";};},[]);
  if(!f)return null;
  const tg=(k:string)=>sOp(p=>({...p,[k]:!p[k]}));
  const hd=(k:string,icon:string,t:string)=>(<div onClick={()=>tg(k)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 0",cursor:"pointer",borderBottom:"1px solid "+T.g2}}><span>{icon}</span><span style={{flex:1,fontSize:13,fontWeight:700,color:T.nv}}>{t}</span><span style={{fontSize:11,color:T.g4,transform:op[k]?"rotate(90deg)":"none",transition:"transform .2s"}}>▶</span></div>);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(10,22,40,.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:mob?8:12}} onClick={onX}>
      <div onClick={(e:any)=>e.stopPropagation()} style={{background:"#fff",borderRadius:14,maxWidth:640,width:"100%",maxHeight:"85vh",display:"flex",flexDirection:"column" as const,overflow:"hidden"}}>
        <div style={{padding:"16px 20px 12px",borderBottom:"1px solid "+T.g2}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:22}}>📋</span>
              <div><h2 style={{margin:0,fontSize:16,fontWeight:800,color:T.nv}}>{f.titulo}</h2><span style={{fontSize:10,color:"#fff",background:T.bl,borderRadius:10,padding:"1px 8px",fontWeight:600}}>{f.responsable}</span></div>
            </div>
            <button onClick={onX} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:T.g4}}>✕</button>
          </div>
        </div>
        <div style={{flex:1,padding:"12px 20px",overflowY:"auto" as const}}>
          {hd("pr","🎯","Propósito del Departamento")}
          {op.pr&&<p style={{margin:"6px 0 8px",fontSize:12,color:T.g5,lineHeight:1.5}}>{f.proposito}</p>}
          {hd("es","🏗️","Estructura Interna")}
          {op.es&&<div style={{padding:"6px 0 8px"}}>{f.estructura.map((e,i)=>(<div key={i} style={{marginBottom:6}}><div style={{fontSize:12,fontWeight:700,color:T.nv}}>{e.area}</div>{e.items.map((it,j)=><div key={j} style={{fontSize:12,color:T.g5,paddingLeft:12}}>• {it}</div>)}</div>))}</div>}
          {hd("fn","✅","Funciones Principales")}
          {op.fn&&<div style={{padding:"6px 0 8px"}}>{f.funciones.map((fc,i)=><div key={i} style={{fontSize:12,color:T.g5,padding:"2px 0 2px 4px"}}>• {fc}</div>)}</div>}
          {hd("kp","📊","KPIs / Indicadores de Gestión")}
          {op.kp&&<div style={{padding:"6px 0 8px"}}>{f.kpis.map((k,i)=><div key={i} style={{fontSize:12,color:T.g5,padding:"2px 0 2px 4px"}}>• {k}</div>)}</div>}
          {hd("rl","🔗","Relaciones Transversales")}
          {op.rl&&<div style={{padding:"6px 0 8px"}}>{f.relaciones.map((r,i)=>(<div key={i} style={{display:"flex",gap:6,padding:"3px 0",flexWrap:"wrap" as const}}><span style={{fontSize:12,fontWeight:700,color:T.nv,minWidth:mob?80:120}}>{r.area}:</span><span style={{fontSize:12,color:T.g5}}>{r.desc}</span></div>))}</div>}
          {hd("ob","⚠️","Obligaciones")}
          {op.ob&&<div style={{padding:"6px 0 8px"}}>{f.obligaciones.map((o,i)=>(<div key={i} style={{fontSize:12,color:i===0?"#DC2626":T.g5,fontWeight:i===0?700:400,padding:"4px 8px",marginBottom:4,background:i===0?"#FEE2E2":"transparent",borderRadius:i===0?6:0,border:i===0?"1px solid #FECACA":"none",lineHeight:1.4}}>{o}</div>))}</div>}
        </div>
        <div style={{padding:"12px 20px",borderTop:"1px solid "+T.g2,display:"flex",justifyContent:"flex-end"}}><button onClick={onX} style={{padding:"8px 24px",borderRadius:8,border:"none",background:T.nv,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>Cerrar</button></div>
      </div>
    </div>);
}

export function Org({areas,deptos,users,om,onEditSave,onDelOm,onDelUser,onEditUser,isSA,onAssignTask,onDm,mob,pedidos,onSel,KPIs,Circles,DeptCircles,TList,onReorderOm,onReorderUser,showT,userLevel}:any){
  const [ex,sEx]=useState<any>({});const [ed,sEd]=useState<any>(null);const [ef,sEf]=useState({n:"",a:"",mail:"",tel:""});const [expId,sExpId]=useState<string|null>(null);
  const [tab,sTab]=useState("struct");const [tA,sTa]=useState<number|null>(null);const [tD,sTd]=useState<number|null>(null);const [detDept,sDetDept]=useState<number|null>(null);
  const [depStaff,sDepStaff]=useState<any[]>([]);const [selStaff,sSelStaff]=useState<any>(null);
  const tog=(k:string)=>sEx((p:any)=>({...p,[k]:!p[k]}));
  const findUser=(m:any)=>users.find((u:any)=>u.mail&&m.mail&&u.mail===m.mail)||users.find((u:any)=>u.n===m.n&&u.a===m.a);

  /* Fetch dep_staff + profiles for academia tab */
  const fetchDepStaff=useCallback(async()=>{
    const sb=createClient();
    const{data:staffRows}=await sb.from("dep_staff").select("*").eq("active",true);
    if(!staffRows?.length){sDepStaff([]);return;}
    const uids=staffRows.map((s:any)=>s.user_id);
    const{data:profiles}=await sb.from("profiles").select("id,first_name,last_name,role,email,phone").in("id",uids);
    const pMap=new Map((profiles||[]).map((p:any)=>[p.id,p]));
    sDepStaff(staffRows.map((s:any)=>{const pr=pMap.get(s.user_id);return{...s,first_name:pr?.first_name||"",last_name:pr?.last_name||"",email:pr?.email||"",phone:pr?.phone||""};}));
  },[]);
  useEffect(()=>{if(tab==="academia")fetchDepStaff();},[tab,fetchDepStaff]);

  /* Save staff edits */
  const handleStaffSave=async(d:any)=>{
    try{
      const sb=createClient();
      await sb.from("profiles").update({first_name:d.first_name,last_name:d.last_name,phone:d.phone||""}).eq("id",d.user_id);
      await sb.from("dep_staff").update({dep_role:d.dep_role,divisions:d.divisions,active:d.active}).eq("id",d.id);
      await fetchDepStaff();
      sSelStaff(null);
      showT?.("Perfil actualizado");
    }catch(e:any){showT?.(e.message||"Error","err");}
  };
  /* Depts sub-view */
  const tArea=tA?areas.find((a:any)=>a.id===tA):null;
  const tDepto=tD?deptos.find((d:any)=>d.id===tD):null;
  const tDeptoArea=tDepto?areas.find((a:any)=>a.id===tDepto.aId):null;
  const tPeds=tD?(pedidos||[]).filter((p:any)=>p.dId===tD):[];
  const tAreaIds=tA?deptos.filter((d:any)=>d.aId===tA).map((d:any)=>d.id):[];
  const tAreaPeds=tA?(pedidos||[]).filter((p:any)=>tAreaIds.indexOf(p.dId)>=0):[];
  return(<div style={{maxWidth:mob?undefined:720}}>
    <h2 style={{margin:"0 0 4px",fontSize:mob?16:19,color:T.nv,fontWeight:800}}>{tab==="academia"?"Academia Tordos":"Organigrama"}</h2><p style={{color:T.g4,fontSize:12,margin:"0 0 12px"}}>{tab==="academia"?"Estructura deportiva — Staff técnico y médico":"Estructura institucional Los Tordos Rugby Club"}</p>
    <div style={{display:"flex",gap:4,marginBottom:14}}>
      {[{k:"struct",l:"👥 Estructura"},{k:"academia",l:"🏉 Academia"},{k:"tasks",l:"📋 Departamentos"}].map(t=><button key={t.k} onClick={()=>{sTab(t.k);sTa(null);sTd(null);}} style={{padding:"7px 16px",borderRadius:8,border:"none",background:tab===t.k?T.nv:"#fff",color:tab===t.k?"#fff":T.g5,fontSize:12,fontWeight:600,cursor:"pointer"}}>{t.l}</button>)}
    </div>
    {tab==="struct"&&<div style={{maxWidth:mob?undefined:680}}>
    {ed&&<Card style={{marginBottom:12,maxWidth:mob?undefined:400,background:"#FFFBEB",border:"1px solid #FDE68A"}}><div style={{fontSize:11,fontWeight:600,color:T.g5,marginBottom:6}}>Editando: {ed.cargo}</div><div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:4,marginBottom:4}}><input value={ef.n} onChange={e=>sEf(p=>({...p,n:e.target.value}))} placeholder="Nombre" style={{padding:"6px 8px",borderRadius:6,border:"1px solid "+T.g3,fontSize:12}}/><input value={ef.a} onChange={e=>sEf(p=>({...p,a:e.target.value}))} placeholder="Apellido" style={{padding:"6px 8px",borderRadius:6,border:"1px solid "+T.g3,fontSize:12}}/></div><div style={{display:"flex",gap:4}}><Btn s="s" onClick={()=>{onEditSave(ed.id,ef);sEd(null);}}>Guardar</Btn><Btn v="g" s="s" onClick={()=>sEd(null)}>✕</Btn></div></Card>}
    <OrgNode mob={mob} icon="🏛️" title="Comisión Directiva" color={T.nv} ex={!!ex.cd} onTog={()=>tog("cd")} cnt={om.filter((m:any)=>m.t==="cd"&&m.n).length+"/8"}>{om.filter((m:any)=>m.t==="cd").sort((a:any,b:any)=>(a.so||0)-(b.so||0)).map((m:any,i:number,arr:any[])=><OrgMember key={m.id} m={m} isSA={isSA} isFirst={i===0} isLast={i===arr.length-1} onUp={onReorderOm?(id:string)=>onReorderOm(id,"up","cd"):undefined} onDown={onReorderOm?(id:string)=>onReorderOm(id,"down","cd"):undefined} onEdit={(mm:any)=>{sEd(mm);sEf({n:mm.n,a:mm.a,mail:mm.mail,tel:mm.tel});}} onDel={(id:string)=>onDelOm(id)} onAssign={(mm:any)=>{const u=findUser(mm);if(u)onAssignTask(u);}} onDm={onDm?(mm:any)=>{const u=findUser(mm);if(u)onDm(u);}:undefined} expanded={expId===m.id} onToggle={()=>sExpId(expId===m.id?null:m.id)} matchedUser={findUser(m)} userLevel={userLevel} showT={showT}/>)}</OrgNode>
    <OrgNode mob={mob} icon="⚡" title="Secretaría Ejecutiva" sub="Depende de CD" color={T.rd} ex={!!ex.se} onTog={()=>tog("se")} cnt={om.filter((m:any)=>m.t==="se"&&m.n).length+"/5"}>{om.filter((m:any)=>m.t==="se").sort((a:any,b:any)=>(a.so||0)-(b.so||0)).map((m:any,i:number,arr:any[])=><OrgMember key={m.id} m={m} isSA={isSA} isFirst={i===0} isLast={i===arr.length-1} onUp={onReorderOm?(id:string)=>onReorderOm(id,"up","se"):undefined} onDown={onReorderOm?(id:string)=>onReorderOm(id,"down","se"):undefined} onEdit={(mm:any)=>{sEd(mm);sEf({n:mm.n,a:mm.a,mail:mm.mail,tel:mm.tel});}} onDel={(id:string)=>onDelOm(id)} onAssign={(mm:any)=>{const u=findUser(mm);if(u)onAssignTask(u);}} onDm={onDm?(mm:any)=>{const u=findUser(mm);if(u)onDm(u);}:undefined} expanded={expId===m.id} onToggle={()=>sExpId(expId===m.id?null:m.id)} matchedUser={findUser(m)} userLevel={userLevel} showT={showT}/>)}</OrgNode>
    <div style={{marginLeft:mob?12:24,borderLeft:"2px solid "+T.rd+"22",paddingLeft:mob?8:14}}>
      {areas.filter((ar:any)=>ar.id!==100&&ar.id!==101).map((ar:any)=>{const ds=deptos.filter((d:any)=>d.aId===ar.id);const dsWithPeople=ds.filter((d:any)=>users.some((u:any)=>u.dId===d.id));const topDs=ds.filter((d:any)=>!d.pId);const hasContent=(d:any)=>{const hasPeople=users.some((u:any)=>u.dId===d.id);const hasChildren=ds.some((ch:any)=>ch.pId===d.id&&users.some((u:any)=>u.dId===ch.id));return hasPeople||hasChildren;};const renderDept=(d:any,color:string)=>{let pp=users.filter((u:any)=>u.dId===d.id).sort((a:any,b:any)=>(a.so||0)-(b.so||0));if(d.id===10)pp=pp.filter((u:any)=>(u.n||"").toLowerCase().includes("franco")&&(u.a||"").toLowerCase().includes("lucchini"));const children=ds.filter((ch:any)=>ch.pId===d.id).filter(hasContent);const resp=pp.find((u:any)=>u.role==="coordinador")||pp.find((u:any)=>u.role==="admin")||pp[0];const others=pp.filter((u:any)=>u.id!==(resp?resp.id:""));const cnt=pp.length+(children.length?` + ${children.length}`:``);return(<OrgNode mob={mob} key={d.id} icon="📂" title={d.name} color={color} ex={!!ex["d"+d.id]} onTog={()=>tog("d"+d.id)} cnt={cnt} onFicha={DEPT_DESC[d.id]?()=>sDetDept(d.id):undefined}>
            {resp&&<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:6,padding:"6px 10px",background:"#FEE2E2",borderRadius:7,border:"1px solid #FECACA",marginBottom:4}}><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:10}}>⭐</span><div><div style={{fontSize:9,fontWeight:700,color:T.rd,textTransform:"uppercase" as const}}>Responsable</div><div style={{fontSize:12,fontWeight:700,color:T.nv}}>{fn(resp)}</div></div></div><div style={{display:"flex",gap:3,alignItems:"center"}}>{isSA&&onReorderUser&&pp.indexOf(resp)>0&&<Btn v="g" s="s" onClick={()=>onReorderUser(resp.id,"up",d.id)}>▲</Btn>}{isSA&&onReorderUser&&pp.indexOf(resp)<pp.length-1&&<Btn v="g" s="s" onClick={()=>onReorderUser(resp.id,"down",d.id)}>▼</Btn>}{onDm&&<span title="Mensaje directo"><Btn v="g" s="s" onClick={()=>onDm(resp)}>💬</Btn></span>}{isSA&&<Btn v="g" s="s" onClick={()=>onEditUser(resp)}>✏️</Btn>}{isSA&&<Btn v="g" s="s" onClick={()=>onDelUser(resp.id)} style={{color:T.rd}}>🗑️</Btn>}</div></div>}
            {others.map((u:any)=>{const uIdx=pp.indexOf(u);return(<div key={u.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:6,padding:"6px 10px",background:"#FAFAFA",borderRadius:7,border:"1px solid "+T.g2,marginBottom:3}}><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:10}}>👤</span><div><div style={{fontSize:9,fontWeight:700,color:T.rd,textTransform:"uppercase" as const}}>{u.div||ROLES[u.role]?.l||""}</div><div style={{fontSize:12,fontWeight:700,color:T.nv}}>{fn(u)}</div></div></div><div style={{display:"flex",gap:3,alignItems:"center"}}>{isSA&&onReorderUser&&uIdx>0&&<Btn v="g" s="s" onClick={()=>onReorderUser(u.id,"up",d.id)}>▲</Btn>}{isSA&&onReorderUser&&uIdx<pp.length-1&&<Btn v="g" s="s" onClick={()=>onReorderUser(u.id,"down",d.id)}>▼</Btn>}{onDm&&<span title="Mensaje directo"><Btn v="g" s="s" onClick={()=>onDm(u)}>💬</Btn></span>}{isSA&&<Btn v="g" s="s" onClick={()=>onEditUser(u)}>✏️</Btn>}{isSA&&<Btn v="g" s="s" onClick={()=>onDelUser(u.id)} style={{color:T.rd}}>🗑️</Btn>}</div></div>);})}
            {others.length===0&&!resp&&children.length===0&&<div style={{fontSize:10,color:T.g4,fontStyle:"italic",padding:4}}>Sin integrantes</div>}
            {children.map((ch:any)=>renderDept(ch,color))}
          </OrgNode>);};return(<OrgNode mob={mob} key={ar.id} icon={ar.icon} title={ar.name} sub={dsWithPeople.length+" deptos"} color={ar.color} ex={!!ex["ar"+ar.id]} onTog={()=>tog("ar"+ar.id)} cnt={dsWithPeople.length}>{topDs.filter(hasContent).map((d:any)=>renderDept(d,ar.color))}</OrgNode>);})}
    </div>
    </div>}
    {tab==="academia"&&<div style={{maxWidth:mob?undefined:680}}>
      <AcademiaOrg mob={mob} ex={ex} tog={tog} depStaff={depStaff} isSA={isSA} onStaffClick={(s:any)=>sSelStaff(s)}/>
    </div>}
    {tab==="tasks"&&!tA&&!tD&&<div>
      {KPIs&&<KPIs peds={pedidos||[]} mob={mob}/>}
      {Circles&&<Circles areas={areas} deptos={deptos} pedidos={pedidos||[]} onAC={(id:number)=>{sTa(id);sTd(null);}} mob={mob}/>}
    </div>}
    {tab==="tasks"&&tA&&!tD&&<div>
      <Bread parts={[{label:"Áreas",onClick:()=>{sTa(null);sTd(null);}},{label:tArea?.name||""}]} mob={mob}/>
      <h2 style={{margin:"0 0 4px",fontSize:mob?16:19,color:T.nv,fontWeight:800}}>{tArea?.icon} {tArea?.name}</h2>
      <p style={{color:T.g4,fontSize:12,margin:"0 0 14px"}}>{deptos.filter((d:any)=>d.aId===tA).length} departamentos · {tAreaPeds.length} tareas</p>
      {KPIs&&<KPIs peds={tAreaPeds} mob={mob}/>}
      {DeptCircles&&<DeptCircles area={tArea} deptos={deptos} pedidos={pedidos||[]} onDC={(id:number)=>sTd(id)} mob={mob}/>}
    </div>}
    {tab==="tasks"&&tD&&tDepto&&<div>
      <Bread parts={[{label:"Áreas",onClick:()=>{sTa(null);sTd(null);}},{label:tDeptoArea?.name||"",onClick:()=>sTd(null)},{label:tDepto.name}]} mob={mob}/>
      {TList&&<TList title={tDepto.name} icon="📂" color={tDeptoArea?tDeptoArea.color:T.nv} peds={tPeds} users={users} onSel={onSel} search="" mob={mob}/>}
    </div>}
    {detDept!==null&&DEPT_DESC[detDept]&&<FichaModal deptId={detDept} onX={()=>sDetDept(null)} mob={mob}/>}
    {selStaff&&<StaffFichaModal staff={selStaff} canEdit={!!isSA} onClose={()=>sSelStaff(null)} onSave={handleStaffSave} mob={mob} userLevel={userLevel} showT={showT}/>}
  </div>);
}
