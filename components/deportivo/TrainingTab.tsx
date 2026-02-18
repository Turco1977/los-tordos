"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { T, DEP_DIV } from "@/lib/constants";
import type { DepAthlete } from "@/lib/supabase/types";
import { Btn, Card } from "@/components/ui";

const supabase = createClient();
const TODAY = new Date().toISOString().slice(0,10);
const fmtD = (d:string)=>{if(!d)return"–";const p=d.slice(0,10).split("-");return p[2]+"/"+p[1]+"/"+p[0];};
const TRAIN_TYPES=["Entrenamiento","Gimnasio","Técnico","Táctico","Regenerativo","Partido amistoso"];

export function TrainingTab({athletes,division,canCreate,userId,mob,showT}:any){
  const [sessions,sSessions]=useState<any[]>([]);
  const [attendance,sAttendance]=useState<any[]>([]);
  const [loading,sLoading]=useState(true);
  const [showAdd,sShowAdd]=useState(false);
  const [selSess,sSelSess]=useState<any>(null);
  const [weekOff,sWeekOff]=useState(0);
  const [nf,sNf]=useState({division:division!=="all"?division:DEP_DIV[0],date:TODAY,time_start:"09:00",time_end:"11:00",type:TRAIN_TYPES[0],description:"",location:""});

  const fetchSessions=useCallback(async()=>{
    sLoading(true);
    const[sRes,aRes]=await Promise.all([
      supabase.from("dep_training_sessions").select("*").order("date",{ascending:false}),
      supabase.from("dep_attendance").select("*"),
    ]);
    if(sRes.data) sSessions(sRes.data);
    if(aRes.data) sAttendance(aRes.data);
    sLoading(false);
  },[]);
  useEffect(()=>{fetchSessions();},[fetchSessions]);

  /* Week calculation */
  const getMonday=(off:number)=>{const d=new Date();d.setDate(d.getDate()-d.getDay()+1+(off*7));return d;};
  const mon=getMonday(weekOff);
  const weekDays=Array.from({length:7},(_,i)=>{const d=new Date(mon);d.setDate(d.getDate()+i);return d.toISOString().slice(0,10);});
  const weekLabel=weekDays[0].slice(5)+" → "+weekDays[6].slice(5);

  const weekSessions=sessions.filter(s=>{
    if(division!=="all"&&s.division!==division) return false;
    return weekDays.includes(s.date);
  });

  const onAddSession=async()=>{
    try{
      const{data,error}=await supabase.from("dep_training_sessions").insert({...nf,created_by:userId}).select().single();
      if(error) throw error;
      sSessions(p=>[data,...p]);sShowAdd(false);showT("Sesión creada");
      sNf(prev=>({...prev,description:"",location:""}));
    }catch(e:any){showT(e.message||"Error","err");}
  };

  const onDelSession=async(id:number)=>{
    try{
      await supabase.from("dep_training_sessions").delete().eq("id",id);
      sSessions(p=>p.filter(s=>s.id!==id));sSelSess(null);showT("Sesión eliminada");
    }catch(e:any){showT(e.message||"Error","err");}
  };

  const onSaveAttendance=async(sessId:number,records:{athlete_id:number;status:string}[])=>{
    try{
      const rows=records.map(r=>({session_id:sessId,athlete_id:r.athlete_id,status:r.status,notes:"",recorded_by:userId}));
      const{error}=await supabase.from("dep_attendance").upsert(rows,{onConflict:"session_id,athlete_id"});
      if(error) throw error;
      // Refresh attendance
      const{data}=await supabase.from("dep_attendance").select("*").eq("session_id",sessId);
      sAttendance(prev=>[...prev.filter(a=>a.session_id!==sessId),...(data||[])]);
      showT("Asistencia guardada");
    }catch(e:any){showT(e.message||"Error","err");}
  };

  if(loading) return <div style={{textAlign:"center",padding:32,color:T.g4}}>Cargando...</div>;

  /* ── Attendance detail view ── */
  if(selSess){
    const sessAtts=attendance.filter(a=>a.session_id===selSess.id);
    const divAthletes=athletes.filter((a:DepAthlete)=>a.division===selSess.division&&a.active);
    const [localAtt,sLocalAtt]=useState<Record<number,string>>(()=>{
      const m:Record<number,string>={};
      divAthletes.forEach((a:DepAthlete)=>{
        const existing=sessAtts.find(x=>x.athlete_id===a.id);
        m[a.id]=existing?.status||"presente";
      });
      return m;
    });

    return <div>
      <Btn v="g" s="s" onClick={()=>sSelSess(null)} style={{marginBottom:12}}>← Volver</Btn>
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div>
            <h3 style={{margin:0,fontSize:15,color:T.nv}}>{selSess.type}</h3>
            <div style={{fontSize:11,color:T.g5}}>{selSess.division} · {fmtD(selSess.date)} · {selSess.time_start}–{selSess.time_end}</div>
            {selSess.description&&<div style={{fontSize:11,color:T.g4,marginTop:2}}>{selSess.description}</div>}
          </div>
          {canCreate&&<Btn v="r" s="s" onClick={()=>{if(confirm("¿Eliminar sesión?"))onDelSession(selSess.id);}}>Eliminar</Btn>}
        </div>
        <h4 style={{margin:"0 0 8px",fontSize:12,color:T.nv}}>Asistencia ({divAthletes.length} jugadores)</h4>
        <div style={{display:"flex",gap:4,marginBottom:10}}>
          {[{k:"presente",l:"Presente",c:T.gn},{k:"tarde",l:"Tarde",c:T.yl},{k:"ausente",l:"Ausente",c:T.rd},{k:"justificado",l:"Justificado",c:T.bl}].map(s=>
            <span key={s.k} style={{fontSize:10,color:s.c,fontWeight:600}}>{s.l}: {Object.values(localAtt).filter(v=>v===s.k).length}</span>
          )}
        </div>
        <div style={{display:"flex",flexDirection:"column" as const,gap:4}}>
          {divAthletes.map((a:DepAthlete)=><div key={a.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 8px",borderRadius:6,border:"1px solid "+T.g1}}>
            <span style={{fontSize:12,fontWeight:600,color:T.nv}}>{a.last_name}, {a.first_name}</span>
            <div style={{display:"flex",gap:3}}>
              {(["presente","tarde","ausente","justificado"] as const).map(st=>{
                const cols:any={presente:T.gn,tarde:T.yl,ausente:T.rd,justificado:T.bl};
                const labels:any={presente:"P",tarde:"T",ausente:"A",justificado:"J"};
                return <button key={st} onClick={()=>sLocalAtt(prev=>({...prev,[a.id]:st}))} style={{width:28,height:28,borderRadius:6,border:localAtt[a.id]===st?"2px solid "+cols[st]:"1px solid "+T.g3,background:localAtt[a.id]===st?cols[st]+"20":"#fff",color:localAtt[a.id]===st?cols[st]:T.g4,fontSize:10,fontWeight:700,cursor:"pointer"}}>{labels[st]}</button>;
              })}
            </div>
          </div>)}
        </div>
        {canCreate&&<div style={{marginTop:12}}><Btn v="s" onClick={()=>onSaveAttendance(selSess.id,Object.entries(localAtt).map(([id,st])=>({athlete_id:Number(id),status:st})))}>💾 Guardar asistencia</Btn></div>}
      </Card>
    </div>;
  }

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <h2 style={{margin:0,fontSize:18,color:T.nv}}>🏋️ Entrenamientos</h2>
      <div style={{display:"flex",gap:6}}>
        <Btn v="g" s="s" onClick={()=>sWeekOff(p=>p-1)}>← Sem</Btn>
        <span style={{fontSize:11,color:T.g5,fontWeight:600,padding:"4px 0"}}>{weekLabel}</span>
        <Btn v="g" s="s" onClick={()=>sWeekOff(p=>p+1)}>Sem →</Btn>
        {weekOff!==0&&<Btn v="g" s="s" onClick={()=>sWeekOff(0)}>Hoy</Btn>}
        {canCreate&&<Btn v="p" s="s" onClick={()=>sShowAdd(!showAdd)}>+ Sesión</Btn>}
      </div>
    </div>

    {/* Add session form */}
    {showAdd&&<Card style={{marginBottom:14,background:"#FFFBEB",border:"1px solid #FDE68A"}}>
      <h3 style={{margin:"0 0 10px",fontSize:13,color:T.nv}}>Nueva sesión</h3>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:10}}>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>División</label><select value={nf.division} onChange={e=>sNf(p=>({...p,division:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,marginTop:2}}>{DEP_DIV.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Fecha</label><input type="date" value={nf.date} onChange={e=>sNf(p=>({...p,date:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Hora inicio</label><input type="time" value={nf.time_start} onChange={e=>sNf(p=>({...p,time_start:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Hora fin</label><input type="time" value={nf.time_end} onChange={e=>sNf(p=>({...p,time_end:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Tipo</label><select value={nf.type} onChange={e=>sNf(p=>({...p,type:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,marginTop:2}}>{TRAIN_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Ubicación</label><input value={nf.location} onChange={e=>sNf(p=>({...p,location:e.target.value}))} placeholder="Cancha 1, Gimnasio..." style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
        <div style={{gridColumn:mob?"1":"1 / -1"}}><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Descripción</label><textarea value={nf.description} onChange={e=>sNf(p=>({...p,description:e.target.value}))} rows={2} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,resize:"vertical" as const,boxSizing:"border-box" as const,marginTop:2}}/></div>
      </div>
      <div style={{display:"flex",gap:8,marginTop:10}}><Btn v="p" onClick={onAddSession} disabled={!nf.date||!nf.division}>Crear sesión</Btn><Btn v="g" onClick={()=>sShowAdd(false)}>Cancelar</Btn></div>
    </Card>}

    {/* Weekly grid */}
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(7,1fr)",gap:6}}>
      {weekDays.map(day=>{
        const daySess=weekSessions.filter(s=>s.date===day);
        const d=new Date(day+"T12:00:00");
        const dayName=["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"][d.getDay()];
        const isToday=day===TODAY;
        return <div key={day} style={{background:isToday?"#EFF6FF":"#fff",borderRadius:10,border:"1px solid "+(isToday?T.bl+"40":T.g2),padding:mob?10:8,minHeight:mob?undefined:100}}>
          <div style={{fontSize:10,fontWeight:700,color:isToday?T.bl:T.g5,marginBottom:6}}>{dayName} {day.slice(8)}</div>
          {daySess.length===0&&<div style={{fontSize:10,color:T.g4}}>Sin sesiones</div>}
          {daySess.map(s=>{
            const sessAtts=attendance.filter(a=>a.session_id===s.id);
            const pres=sessAtts.filter(a=>a.status==="presente"||a.status==="tarde").length;
            return <div key={s.id} onClick={()=>sSelSess(s)} style={{padding:"6px 8px",borderRadius:6,background:T.gn+"10",border:"1px solid "+T.gn+"30",marginBottom:4,cursor:"pointer"}}>
              <div style={{fontSize:10,fontWeight:700,color:T.nv}}>{s.type}</div>
              <div style={{fontSize:9,color:T.g5}}>{s.division} · {s.time_start}</div>
              {sessAtts.length>0&&<div style={{fontSize:9,color:T.gn,fontWeight:600}}>{pres}/{sessAtts.length} presentes</div>}
            </div>;
          })}
        </div>;
      })}
    </div>

    {/* Stats */}
    {weekSessions.length>0&&<Card style={{marginTop:14}}>
      <h3 style={{margin:"0 0 8px",fontSize:13,color:T.nv}}>Resumen semanal</h3>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(4,1fr)",gap:10}}>
        <div style={{textAlign:"center" as const}}><div style={{fontSize:20,fontWeight:800,color:T.bl}}>{weekSessions.length}</div><div style={{fontSize:10,color:T.g5}}>Sesiones</div></div>
        {DEP_DIV.map(d=>{const cnt=weekSessions.filter(s=>s.division===d).length;if(!cnt) return null;return <div key={d} style={{textAlign:"center" as const}}><div style={{fontSize:20,fontWeight:800,color:T.nv}}>{cnt}</div><div style={{fontSize:10,color:T.g5}}>{d}</div></div>;})}
      </div>
    </Card>}

    {weekSessions.length===0&&<Card style={{textAlign:"center",padding:32,color:T.g4,marginTop:14}}><div style={{fontSize:32}}>🏋️</div><div style={{marginTop:8,fontSize:13}}>No hay sesiones esta semana</div></Card>}
  </div>;
}
