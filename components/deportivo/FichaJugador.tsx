"use client";
import { useState } from "react";
import { T, DEP_POSITIONS, DEP_INJ_SEV, DEP_WK, DEP_SEM, DEP_DIV } from "@/lib/constants";
import type { DepInjury, DepCheckin } from "@/lib/supabase/types";
import { useC } from "@/lib/theme-context";
import { Btn, Card } from "@/components/ui";

const WK_KEYS: (keyof typeof DEP_WK)[] = ["sleep","fatigue","stress","soreness","mood"];
const fmtD = (d:string)=>{if(!d)return"–";const p=d.slice(0,10).split("-");return p[2]+"/"+p[1]+"/"+p[0];};

/* semáforo score: normaliza (fatigue,stress,soreness invertidos) */
function semScore(c:DepCheckin):{score:number;color:string;bg:string;label:string}{
  const norm=(v:number,inv:boolean)=>inv?6-v:v;
  const avg=(norm(c.sleep,false)+norm(c.fatigue,true)+norm(c.stress,true)+norm(c.soreness,true)+norm(c.mood,false))/5;
  if(avg<=DEP_SEM.red.max) return{score:avg,color:DEP_SEM.red.c,bg:DEP_SEM.red.bg,label:DEP_SEM.red.l};
  if(avg<=DEP_SEM.yellow.max) return{score:avg,color:DEP_SEM.yellow.c,bg:DEP_SEM.yellow.bg,label:DEP_SEM.yellow.l};
  return{score:avg,color:DEP_SEM.green.c,bg:DEP_SEM.green.bg,label:DEP_SEM.green.l};
}

export function FichaJugador({ath,injuries,checkins,onBack,onEdit,onDeactivate,latestCheckin,mob}:any){
  const{colors,cardBg}=useC();
  const [editing,sEditing]=useState(false);
  const [f,sF]=useState({first_name:ath.first_name,last_name:ath.last_name,division:ath.division,position:ath.position,birth_date:ath.birth_date||"",dni:ath.dni,phone:ath.phone,email:ath.email,emergency_contact:ath.emergency_contact||{},medical_info:ath.medical_info||{}});
  const sem=latestCheckin?semScore(latestCheckin):null;
  const activeInj=injuries.filter((i:DepInjury)=>i.status!=="alta");

  if(editing&&onEdit) return <div>
    <Btn v="g" s="s" onClick={()=>sEditing(false)} style={{marginBottom:12}}>← Cancelar</Btn>
    <h2 style={{fontSize:16,color:colors.nv,margin:"0 0 14px"}}>Editar: {ath.first_name} {ath.last_name}</h2>
    <Card>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:10}}>
        {[["Nombre","first_name"],["Apellido","last_name"]].map(([l,k])=><div key={k}><label style={{fontSize:11,fontWeight:600,color:T.g5}}>{l}</label><input value={(f as any)[k]} onChange={e=>sF(prev=>({...prev,[k]:e.target.value}))} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:3}}/></div>)}
        <div><label style={{fontSize:11,fontWeight:600,color:T.g5}}>División</label><select value={f.division} onChange={e=>sF(prev=>({...prev,division:e.target.value}))} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,marginTop:3}}>{DEP_DIV.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
        <div><label style={{fontSize:11,fontWeight:600,color:T.g5}}>Posición</label><select value={f.position} onChange={e=>sF(prev=>({...prev,position:e.target.value}))} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,marginTop:3}}><option value="">Seleccionar...</option>{DEP_POSITIONS.map(p=><option key={p} value={p}>{p}</option>)}</select></div>
        <div><label style={{fontSize:11,fontWeight:600,color:T.g5}}>Fecha nacimiento</label><input type="date" value={f.birth_date} onChange={e=>sF(prev=>({...prev,birth_date:e.target.value}))} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:3}}/></div>
        <div><label style={{fontSize:11,fontWeight:600,color:T.g5}}>DNI</label><input value={f.dni} onChange={e=>sF(prev=>({...prev,dni:e.target.value}))} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:3}}/></div>
        <div><label style={{fontSize:11,fontWeight:600,color:T.g5}}>Teléfono</label><input value={f.phone} onChange={e=>sF(prev=>({...prev,phone:e.target.value}))} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:3}}/></div>
        <div><label style={{fontSize:11,fontWeight:600,color:T.g5}}>Email</label><input value={f.email} onChange={e=>sF(prev=>({...prev,email:e.target.value}))} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:3}}/></div>
      </div>
      <div style={{marginTop:12}}><h4 style={{fontSize:12,color:T.nv,margin:"0 0 8px"}}>Contacto de emergencia</h4>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:8}}>
          {[["Nombre","name"],["Teléfono","phone"],["Relación","relation"]].map(([l,k])=><div key={k}><label style={{fontSize:10,color:T.g5}}>{l}</label><input value={(f.emergency_contact as any)?.[k]||""} onChange={e=>sF(prev=>({...prev,emergency_contact:{...prev.emergency_contact,[k]:e.target.value}}))} style={{width:"100%",padding:6,borderRadius:6,border:"1px solid "+T.g3,fontSize:11,boxSizing:"border-box" as const,marginTop:2}}/></div>)}
        </div>
      </div>
      <div style={{marginTop:12}}><h4 style={{fontSize:12,color:T.nv,margin:"0 0 8px"}}>Información médica</h4>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:8}}>
          {[["Grupo sanguíneo","blood_type"],["Alergias","allergies"],["Condiciones","conditions"]].map(([l,k])=><div key={k}><label style={{fontSize:10,color:T.g5}}>{l}</label><input value={(f.medical_info as any)?.[k]||""} onChange={e=>sF(prev=>({...prev,medical_info:{...prev.medical_info,[k]:e.target.value}}))} style={{width:"100%",padding:6,borderRadius:6,border:"1px solid "+T.g3,fontSize:11,boxSizing:"border-box" as const,marginTop:2}}/></div>)}
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginTop:14}}><Btn v="p" onClick={()=>{onEdit(f);sEditing(false);}}>💾 Guardar</Btn><Btn v="g" onClick={()=>sEditing(false)}>Cancelar</Btn></div>
    </Card>
  </div>;

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <Btn v="g" s="s" onClick={onBack}>← Volver</Btn>
      <div style={{display:"flex",gap:6}}>
        {onEdit&&<Btn v="g" s="s" onClick={()=>sEditing(true)}>✏️ Editar</Btn>}
        {onDeactivate&&<Btn v="r" s="s" onClick={onDeactivate}>Desactivar</Btn>}
      </div>
    </div>

    {/* Header */}
    <Card style={{marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:60,height:60,borderRadius:30,background:sem?sem.bg:colors.g2,display:"flex",alignItems:"center",justifyContent:"center",border:"3px solid "+(sem?sem.color:colors.g3)}}>
          <span style={{fontSize:24}}>🏉</span>
        </div>
        <div style={{flex:1}}>
          <h2 style={{margin:0,fontSize:20,color:colors.nv}}>{ath.first_name} {ath.last_name}</h2>
          <div style={{fontSize:12,color:colors.g5}}>{ath.position||"Sin posición"} · {ath.division} · Temporada {ath.season}</div>
          {sem&&<div style={{marginTop:4}}><span style={{background:sem.bg,color:sem.color,padding:"2px 10px",borderRadius:12,fontSize:11,fontWeight:700}}>{sem.label} ({sem.score.toFixed(1)})</span></div>}
          {activeInj.length>0&&<div style={{marginTop:4}}><span style={{background:"#FEE2E2",color:colors.rd,padding:"2px 10px",borderRadius:12,fontSize:11,fontWeight:700}}>🩹 {activeInj.length} lesión{activeInj.length>1?"es":""} activa{activeInj.length>1?"s":""}</span></div>}
        </div>
      </div>
    </Card>

    {/* Info grid */}
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:12,marginBottom:12}}>
      <Card>
        <h3 style={{margin:"0 0 8px",fontSize:13,color:T.nv}}>📋 Datos personales</h3>
        {[["Fecha nacimiento",fmtD(ath.birth_date)],["DNI",ath.dni||"–"],["Teléfono",ath.phone||"–"],["Email",ath.email||"–"]].map(([l,v],i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid "+T.g1}}><span style={{fontSize:11,color:T.g5}}>{l}</span><span style={{fontSize:11,color:T.nv,fontWeight:600}}>{v}</span></div>)}
      </Card>
      <Card>
        <h3 style={{margin:"0 0 8px",fontSize:13,color:T.nv}}>🆘 Emergencia / Médico</h3>
        {[["Contacto",ath.emergency_contact?.name||"–"],["Tel contacto",ath.emergency_contact?.phone||"–"],["Relación",ath.emergency_contact?.relation||"–"],["Grupo sanguíneo",ath.medical_info?.blood_type||"–"],["Alergias",ath.medical_info?.allergies||"–"],["Condiciones",ath.medical_info?.conditions||"–"]].map(([l,v],i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid "+T.g1}}><span style={{fontSize:11,color:T.g5}}>{l}</span><span style={{fontSize:11,color:T.nv,fontWeight:600}}>{v}</span></div>)}
      </Card>
    </div>

    {/* Last wellness */}
    {latestCheckin&&<Card style={{marginBottom:12}}>
      <h3 style={{margin:"0 0 8px",fontSize:13,color:T.nv}}>💚 Último check-in ({fmtD(latestCheckin.date)})</h3>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
        {WK_KEYS.map(k=>{
          const cfg=DEP_WK[k];const v=(latestCheckin as any)[k];
          return <div key={k} style={{textAlign:"center" as const}}>
            <div style={{fontSize:16}}>{cfg.i}</div>
            <div style={{fontSize:18,fontWeight:800,color:v>=4?T.gn:v>=3?T.yl:T.rd}}>{v}</div>
            <div style={{fontSize:8,color:T.g5}}>{cfg.l}</div>
            <div style={{fontSize:8,color:T.g4}}>{cfg.labels[v-1]}</div>
          </div>;
        })}
      </div>
    </Card>}

    {/* Wellness history (bar chart) */}
    {checkins.length>0&&<Card style={{marginBottom:12}}>
      <h3 style={{margin:"0 0 8px",fontSize:13,color:T.nv}}>📈 Wellness últimos {checkins.length} registros</h3>
      <div style={{display:"flex",gap:2,alignItems:"flex-end",height:80}}>
        {checkins.slice().reverse().map((c:DepCheckin,i:number)=>{
          const s=semScore(c);
          return <div key={i} style={{flex:1,minWidth:4,height:(s.score/5)*100+"%",background:s.color,borderRadius:2,cursor:"pointer"}} title={fmtD(c.date)+": "+s.score.toFixed(1)}/>;
        })}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}><span style={{fontSize:9,color:T.g4}}>{fmtD(checkins[checkins.length-1]?.date)}</span><span style={{fontSize:9,color:T.g4}}>{fmtD(checkins[0]?.date)}</span></div>
    </Card>}

    {/* Injury history */}
    <Card>
      <h3 style={{margin:"0 0 8px",fontSize:13,color:T.nv}}>🩹 Historial de lesiones ({injuries.length})</h3>
      {injuries.length===0&&<div style={{fontSize:12,color:T.g4,padding:12,textAlign:"center" as const}}>Sin lesiones registradas</div>}
      {injuries.map((inj:DepInjury)=>{
        const sv=DEP_INJ_SEV[inj.severity];
        return <div key={inj.id} style={{padding:"8px 0",borderBottom:"1px solid "+T.g1,display:"flex",gap:10,alignItems:"center"}}>
          <span style={{background:sv?.bg||T.g1,color:sv?.c||T.g5,padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:700}}>{sv?.l||inj.severity}</span>
          <div style={{flex:1}}>
            <div style={{fontSize:12,fontWeight:600,color:T.nv}}>{inj.type} - {inj.zone}{inj.muscle?" ("+inj.muscle+")":""}</div>
            <div style={{fontSize:10,color:T.g5}}>{fmtD(inj.date_injury)} {inj.date_return?"→ "+fmtD(inj.date_return):""}</div>
          </div>
          <span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:inj.status==="alta"?"#D1FAE5":inj.status==="recuperacion"?"#FEF3C7":"#FEE2E2",color:inj.status==="alta"?T.gn:inj.status==="recuperacion"?T.yl:T.rd,fontWeight:600}}>{inj.status==="alta"?"Alta":inj.status==="recuperacion"?"Recuperación":"Activa"}</span>
        </div>;
      })}
    </Card>
  </div>;
}
