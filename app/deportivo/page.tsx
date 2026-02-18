"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { T, DEP_ROLES, DEP_SEM, DEP_DIV } from "@/lib/constants";
import type { DepStaff, DepAthlete, DepInjury, DepCheckin } from "@/lib/supabase/types";
import { exportCSV, exportPDF } from "@/lib/export";
import { useRealtime } from "@/lib/realtime";
import { useTheme, darkCSS } from "@/lib/theme";
import { ThemeCtx } from "@/lib/theme-context";
import { Toast, useMobile, Btn, Card } from "@/components/ui";
import { LoginPrompt } from "@/components/deportivo/LoginPrompt";
import { NoAccess } from "@/components/deportivo/NoAccess";
import { DashboardTab } from "@/components/deportivo/DashboardTab";
import { FichaJugador } from "@/components/deportivo/FichaJugador";
import { AthleteForm } from "@/components/deportivo/AthleteForm";
import { BulkAthleteForm } from "@/components/deportivo/BulkAthleteForm";
import { InjuriesList } from "@/components/deportivo/InjuriesList";
import { InjuryDetail } from "@/components/deportivo/InjuryDetail";
import { InjuryForm } from "@/components/deportivo/InjuryForm";
import { WellnessTab } from "@/components/deportivo/WellnessTab";
import { TrainingTab } from "@/components/deportivo/TrainingTab";
import { PerfilesTab } from "@/components/deportivo/PerfilesTab";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const supabase = createClient();
const TODAY = new Date().toISOString().slice(0,10);
const drLv = (r:string)=>DEP_ROLES[r]?.lv||0;
const canAll = (r:string)=>["dd","dr","coord_pf","kinesiologo","medico"].includes(r);

/* semáforo score: normaliza (fatigue,stress,soreness invertidos) */
function semScore(c:DepCheckin):{score:number;color:string;bg:string;label:string}{
  const norm=(v:number,inv:boolean)=>inv?6-v:v;
  const avg=(norm(c.sleep,false)+norm(c.fatigue,true)+norm(c.stress,true)+norm(c.soreness,true)+norm(c.mood,false))/5;
  if(avg<=DEP_SEM.red.max) return{score:avg,color:DEP_SEM.red.c,bg:DEP_SEM.red.bg,label:DEP_SEM.red.l};
  if(avg<=DEP_SEM.yellow.max) return{score:avg,color:DEP_SEM.yellow.c,bg:DEP_SEM.yellow.bg,label:DEP_SEM.yellow.l};
  return{score:avg,color:DEP_SEM.green.c,bg:DEP_SEM.green.bg,label:DEP_SEM.green.l};
}
/* ── MAIN APP ── */
export default function DeportivoApp(){
  const mob=useMobile();
  const {mode:themeMode,toggle:toggleTheme,colors,isDark,cardBg,headerBg}=useTheme();
  const [user,sUser]=useState<any>(null);
  const [profile,sProfile]=useState<any>(null);
  const [myStaff,sMyStaff]=useState<DepStaff|null>(null);
  const [authChecked,sAuthChecked]=useState(false);
  const [loading,sLoading]=useState(true);

  // Data
  const [athletes,sAthletes]=useState<DepAthlete[]>([]);
  const [injuries,sInjuries]=useState<DepInjury[]>([]);
  const [checkins,sCheckins]=useState<DepCheckin[]>([]);
  const [staffList,sStaffList]=useState<DepStaff[]>([]);

  // UI
  const [tab,sTab]=useState("dash");
  const [toast,sToast]=useState<{msg:string;type:"ok"|"err"}|null>(null);
  const showT=(msg:string,type:"ok"|"err"="ok")=>sToast({msg,type});

  // Filters
  const [divF,sDivF]=useState("all");
  const [search,sSearch]=useState("");

  // Forms
  const [showForm,sShowForm]=useState<string|null>(null);
  const [selAth,sSelAth]=useState<DepAthlete|null>(null);
  const [selInj,sSelInj]=useState<DepInjury|null>(null);

  /* ── Auth check ── */
  useEffect(()=>{
    (async()=>{
      const{data:{session}}=await supabase.auth.getSession();
      if(session?.user){
        sUser(session.user);
        const{data:p}=await supabase.from("profiles").select("*").eq("id",session.user.id).single();
        if(p) sProfile(p);
      }
      sAuthChecked(true);
    })();
  },[]);

  /* ── Fetch all deportivo data ── */
  const fetchAll=useCallback(async()=>{
    if(!user) return;
    sLoading(true);
    const [stRes,athRes,injRes,ckRes]=await Promise.all([
      supabase.from("dep_staff").select("*"),
      supabase.from("dep_athletes").select("*").order("last_name"),
      supabase.from("dep_injuries").select("*").order("id",{ascending:false}),
      supabase.from("dep_checkins").select("*").order("date",{ascending:false}),
    ]);
    const errors:string[]=[];
    if(stRes.error) errors.push("Staff: "+stRes.error.message);
    if(athRes.error) errors.push("Jugadores: "+athRes.error.message);
    if(injRes.error) errors.push("Lesiones: "+injRes.error.message);
    if(ckRes.error) errors.push("Check-ins: "+ckRes.error.message);
    if(errors.length) showT(errors.join("; "),"err");
    if(stRes.data){
      const staffUserIds=stRes.data.map((s:any)=>s.user_id);
      const{data:profiles}=staffUserIds.length>0
        ?await supabase.from("profiles").select("id,first_name,last_name,role,email").in("id",staffUserIds)
        :{data:[] as any[]};
      const pMap=new Map((profiles||[]).map((p:any)=>[p.id,p]));
      const staff=stRes.data.map((s:any)=>{
        const pr=pMap.get(s.user_id);
        return{...s,first_name:pr?.first_name||"",last_name:pr?.last_name||"",email:pr?.email||""};
      });
      sStaffList(staff);
      const me=staff.find((s:any)=>s.user_id===user.id&&s.active);
      sMyStaff(me||null);
    }
    if(athRes.data) sAthletes(athRes.data);
    if(injRes.data){
      const aths=athRes.data||[];
      sInjuries(injRes.data.map((inj:any)=>{
        const a=aths.find((at:any)=>at.id===inj.athlete_id);
        return{...inj,athlete_name:a?a.first_name+" "+a.last_name:"?"};
      }));
    }
    if(ckRes.data){
      const aths=athRes.data||[];
      sCheckins(ckRes.data.map((c:any)=>{
        const a=aths.find((at:any)=>at.id===c.athlete_id);
        return{...c,athlete_name:a?a.first_name+" "+a.last_name:"?"};
      }));
    }
    sLoading(false);
  },[user]);

  useEffect(()=>{if(user) fetchAll();},[user,fetchAll]);

  /* ── Realtime: auto-refresh on DB changes ── */
  useRealtime([
    {table:"dep_athletes",onChange:()=>fetchAll()},
    {table:"dep_injuries",onChange:()=>fetchAll()},
    {table:"dep_checkins",onChange:()=>fetchAll()},
    {table:"dep_staff",onChange:()=>fetchAll()},
  ],!!user);

  const out=async()=>{await supabase.auth.signOut();sUser(null);sProfile(null);sMyStaff(null);};

  if(!authChecked) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:colors.g1}}><div style={{fontSize:14,color:colors.g4}}>Cargando...</div></div>;
  if(!user) return <LoginPrompt mob={mob}/>;
  if(loading) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:colors.g1}}><div style={{fontSize:14,color:colors.g4}}>Cargando módulo deportivo...</div></div>;

  // Superadmin/admin can always access (to set up staff initially)
  const isAdmin=profile&&(profile.role==="superadmin"||profile.role==="admin");
  if(!myStaff&&!isAdmin) return <NoAccess mob={mob} userName={profile?.first_name||""} onOut={out}/>;

  const depRole=myStaff?.dep_role||"dd"; // admin defaults to dd-level access
  const depLv=myStaff?drLv(depRole):5;
  const myDivs=myStaff?.divisions||[];
  const seeAllDivs=canAll(depRole)||isAdmin;

  /* ── Filter athletes by division ── */
  const filteredAthletes=athletes.filter(a=>{
    if(!a.active) return false;
    if(divF!=="all"&&a.division!==divF) return false;
    if(!seeAllDivs&&myDivs.length>0&&!myDivs.includes(a.division)) return false;
    if(search){const s=search.toLowerCase();return(a.first_name+" "+a.last_name+" "+a.position+" "+a.division).toLowerCase().includes(s);}
    return true;
  });

  /* ── Latest checkin per athlete ── */
  const latestCheckin=(athId:number):DepCheckin|null=>{
    return checkins.find(c=>c.athlete_id===athId)||null;
  };

  /* ── Active injuries per athlete ── */
  const activeInjuries=(athId:number):DepInjury[]=>{
    return injuries.filter(inj=>inj.athlete_id===athId&&inj.status!=="alta");
  };

  /* ── Permission helpers ── */
  const canCreateAthlete=depLv>=4||depRole==="entrenador";
  const canEditAthlete=depLv>=4;
  const canCreateInjury=depLv>=4||depRole==="kinesiologo"||depRole==="medico";
  const canCreateCheckin=depLv>=4||depRole==="pf"||depRole==="coord_pf";
  const canCreateTraining=depLv>=4||depRole==="entrenador"||depRole==="coord_pf"||depRole==="pf";
  const canManageStaff=depLv>=4||isAdmin;

  /* ── TABS ── */
  const tabs=[
    {k:"dash",l:"📊",f:"Dashboard"},
    {k:"plantel",l:"👥",f:"Plantel"},
    {k:"injuries",l:"🩹",f:"Lesiones"},
    {k:"wellness",l:"💚",f:"Wellness"},
    {k:"training",l:"🏋️",f:"Entrenamientos"},
    ...(canManageStaff?[{k:"perfiles",l:"👤",f:"Perfiles"}]:[]),
  ];

  /* ══════════════════════════ HANDLERS ══════════════════════════ */

  /* ── Add Athlete ── */
  const onAddAthlete=async(a:Partial<DepAthlete>)=>{
    try{
      const{error}=await supabase.from("dep_athletes").insert({
        first_name:a.first_name,last_name:a.last_name,division:a.division,position:a.position||"",
        birth_date:a.birth_date||null,dni:a.dni||"",phone:a.phone||"",email:a.email||"",
        emergency_contact:a.emergency_contact||{},medical_info:a.medical_info||{},
        season:new Date().getFullYear().toString(),active:true,
      });
      if(error) throw error;
      showT("Jugador agregado");sShowForm(null);fetchAll();
    }catch(e:any){showT(e.message||"Error","err");}
  };

  /* ── Update Athlete ── */
  const onUpdAthlete=async(id:number,a:Partial<DepAthlete>)=>{
    try{
      const{error}=await supabase.from("dep_athletes").update({
        first_name:a.first_name,last_name:a.last_name,division:a.division,position:a.position,
        birth_date:a.birth_date||null,dni:a.dni,phone:a.phone,email:a.email,
        emergency_contact:a.emergency_contact,medical_info:a.medical_info,
      }).eq("id",id);
      if(error) throw error;
      showT("Jugador actualizado");sShowForm(null);sSelAth(null);fetchAll();
    }catch(e:any){showT(e.message||"Error","err");}
  };

  /* ── Deactivate Athlete ── */
  const onDeactivateAth=async(id:number)=>{
    try{
      const{error}=await supabase.from("dep_athletes").update({active:false}).eq("id",id);
      if(error) throw error;
      showT("Jugador desactivado");sSelAth(null);fetchAll();
    }catch(e:any){showT(e.message||"Error","err");}
  };

  /* ── Add Injury ── */
  const onAddInjury=async(inj:Partial<DepInjury>)=>{
    try{
      const{error}=await supabase.from("dep_injuries").insert({
        athlete_id:inj.athlete_id,reported_by:user.id,type:inj.type,zone:inj.zone,
        muscle:inj.muscle||"",severity:inj.severity,description:inj.description||"",
        date_injury:inj.date_injury,status:"activa",notes:inj.notes||"",
      });
      if(error) throw error;
      showT("Lesión registrada");sShowForm(null);fetchAll();
    }catch(e:any){showT(e.message||"Error","err");}
  };

  /* ── Update Injury Status ── */
  const onUpdInjury=async(id:number,updates:Partial<DepInjury>)=>{
    try{
      const{error}=await supabase.from("dep_injuries").update(updates).eq("id",id);
      if(error) throw error;
      showT("Lesión actualizada");sSelInj(null);fetchAll();
    }catch(e:any){showT(e.message||"Error","err");}
  };

  /* ── Add Checkin ── */
  const onAddCheckin=async(ck:Partial<DepCheckin>)=>{
    try{
      const{error}=await supabase.from("dep_checkins").upsert({
        athlete_id:ck.athlete_id,date:ck.date||TODAY,sleep:ck.sleep,fatigue:ck.fatigue,
        stress:ck.stress,soreness:ck.soreness,mood:ck.mood,notes:ck.notes||"",recorded_by:user.id,
      },{onConflict:"athlete_id,date"});
      if(error) throw error;
      showT("Check-in guardado");fetchAll();
    }catch(e:any){showT(e.message||"Error","err");}
  };

  /* ── Staff CRUD ── */
  const onUpdStaff=async(id:string,updates:Partial<DepStaff>)=>{
    try{
      const{error}=await supabase.from("dep_staff").update(updates).eq("id",id);
      if(error) throw error;
      showT("Staff actualizado");fetchAll();
    }catch(e:any){showT(e.message||"Error","err");}
  };
  const onDelStaff=async(id:string)=>{
    try{
      const{error}=await supabase.from("dep_staff").update({active:false}).eq("id",id);
      if(error) throw error;
      showT("Staff desactivado");fetchAll();
    }catch(e:any){showT(e.message||"Error","err");}
  };

  /* ══════════════════════════ RENDER ══════════════════════════ */

  return(<ErrorBoundary><ThemeCtx.Provider value={{colors,isDark,cardBg}}>
    <style dangerouslySetInnerHTML={{__html:darkCSS}}/>
    <div style={{minHeight:"100vh",background:colors.g1,color:colors.nv}}>
    {/* Header */}
    <div style={{background:isDark?colors.g2:T.nv,padding:mob?"10px 12px":"12px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky" as const,top:0,zIndex:100}}>
      <div style={{display:"flex",alignItems:"center",gap:mob?8:12}}>
        <img src="/logo.jpg" alt="Los Tordos" style={{width:mob?32:40,height:mob?32:40,borderRadius:8,objectFit:"contain"}}/>
        <div>
          <div style={{color:isDark?colors.nv:"#fff",fontSize:mob?14:18,fontWeight:800}}>Deportivo</div>
          <div style={{color:isDark?"rgba(148,163,184,.7)":"rgba(255,255,255,.5)",fontSize:10}}>{myStaff?DEP_ROLES[depRole]?.l:"Admin"} · {profile?.first_name} {profile?.last_name}</div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <button onClick={toggleTheme} title={isDark?"Modo claro":"Modo oscuro"} style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:8,padding:"6px 10px",color:isDark?colors.nv:"rgba(255,255,255,.7)",fontSize:14,cursor:"pointer"}}>{isDark?"☀️":"🌙"}</button>
        <button onClick={out} style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:8,padding:"6px 12px",color:isDark?colors.nv:"rgba(255,255,255,.7)",fontSize:11,cursor:"pointer",fontWeight:600}}>Salir</button>
      </div>
    </div>

    {/* Tab bar */}
    <div style={{background:cardBg,borderBottom:"1px solid "+colors.g2,padding:"0 "+( mob?"8px":"24px"),display:"flex",gap:0,overflowX:"auto" as const}}>
      {tabs.map(t=><button key={t.k} onClick={()=>{sTab(t.k);sShowForm(null);sSelAth(null);sSelInj(null);}} style={{padding:mob?"10px 12px":"12px 20px",border:"none",borderBottom:tab===t.k?"3px solid "+colors.rd:"3px solid transparent",background:"none",color:tab===t.k?colors.nv:colors.g4,fontSize:mob?12:13,fontWeight:tab===t.k?700:500,cursor:"pointer",whiteSpace:"nowrap" as const}}>{t.l} {!mob&&t.f}</button>)}
    </div>

    {/* Division filter + search */}
    <div style={{padding:mob?"10px 12px":"12px 24px",display:"flex",gap:8,flexWrap:"wrap" as const,alignItems:"center"}}>
      <select value={divF} onChange={e=>sDivF(e.target.value)} style={{padding:"6px 10px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,background:cardBg,color:colors.nv}}>
        <option value="all">Todas las divisiones</option>
        {DEP_DIV.map(d=><option key={d} value={d}>{d}</option>)}
      </select>
      <input value={search} onChange={e=>sSearch(e.target.value)} placeholder="Buscar..." style={{padding:"6px 10px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,width:mob?120:180}}/>
    </div>

    {/* Content */}
    <div style={{padding:mob?"0 12px 80px":"0 24px 40px"}}>

      {/* ════════ DASHBOARD ════════ */}
      {tab==="dash"&&<DashboardTab athletes={filteredAthletes} checkins={checkins} injuries={injuries} latestCheckin={latestCheckin} activeInjuries={activeInjuries} mob={mob} onSelectAth={(a:DepAthlete)=>{sSelAth(a);sTab("plantel");}}/>}

      {/* ════════ PLANTEL ════════ */}
      {tab==="plantel"&&(
        selAth?<FichaJugador ath={selAth} injuries={injuries.filter(i=>i.athlete_id===selAth.id)} checkins={checkins.filter(c=>c.athlete_id===selAth.id).slice(0,30)} onBack={()=>sSelAth(null)} onEdit={canEditAthlete?(a:Partial<DepAthlete>)=>onUpdAthlete(selAth.id,a):undefined} onDeactivate={canEditAthlete?()=>{if(confirm("¿Desactivar jugador?")){onDeactivateAth(selAth.id);}}:undefined} latestCheckin={latestCheckin(selAth.id)} mob={mob}/>
        :showForm==="athlete"?<AthleteForm onSave={onAddAthlete} onCancel={()=>sShowForm(null)} mob={mob}/>
        :showForm==="bulk"?<BulkAthleteForm onSave={async(rows:Partial<DepAthlete>[])=>{
          try{
            const payload=rows.map(r=>({first_name:r.first_name,last_name:r.last_name,division:r.division||DEP_DIV[0],position:r.position||"",season:new Date().getFullYear().toString(),active:true,dni:"",phone:"",email:"",emergency_contact:{},medical_info:{},birth_date:null}));
            const{error}=await supabase.from("dep_athletes").insert(payload);
            if(error) throw error;
            showT(payload.length+" jugador"+(payload.length>1?"es":"")+" agregado"+(payload.length>1?"s":""));sShowForm(null);fetchAll();
          }catch(e:any){showT(e.message||"Error","err");}
        }} onCancel={()=>sShowForm(null)} mob={mob}/>
        :<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <h2 style={{margin:0,fontSize:18,color:colors.nv}}>👥 Plantel ({filteredAthletes.length})</h2>
            <div style={{display:"flex",gap:6}}>{filteredAthletes.length>0&&<><Btn v="g" s="s" onClick={()=>{const h=["Apellido","Nombre","División","Posición","DNI","Email","Teléfono"];const r=filteredAthletes.map((a:DepAthlete)=>[a.last_name,a.first_name,a.division,a.position,a.dni,a.email,a.phone]);exportCSV("plantel",h,r);}}>CSV</Btn><Btn v="g" s="s" onClick={()=>{const h=["Apellido","Nombre","División","Posición","DNI","Email","Teléfono"];const r=filteredAthletes.map((a:DepAthlete)=>[a.last_name,a.first_name,a.division,a.position,a.dni,a.email,a.phone]);exportPDF("Plantel",h,r);}}>PDF</Btn></>}{canCreateAthlete&&<><Btn v="w" s="s" onClick={()=>sShowForm("bulk")}>⚡ Carga rápida</Btn><Btn v="p" s="s" onClick={()=>sShowForm("athlete")}>+ Jugador</Btn></>}</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:10}}>
            {filteredAthletes.map(a=>{
              const lc=latestCheckin(a.id);const ai=activeInjuries(a.id);
              const sem=lc?semScore(lc):null;
              return<Card key={a.id} onClick={()=>sSelAth(a)} style={{cursor:"pointer",position:"relative" as const}}>
                {ai.length>0&&<div style={{position:"absolute" as const,top:8,right:8,background:"#FEE2E2",borderRadius:12,padding:"2px 8px",fontSize:9,fontWeight:700,color:colors.rd}}>🩹 {ai.length}</div>}
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:40,height:40,borderRadius:20,background:sem?sem.bg:colors.g2,display:"flex",alignItems:"center",justifyContent:"center",border:"3px solid "+(sem?sem.color:colors.g3)}}>
                    <span style={{fontSize:16}}>🏉</span>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:700,color:colors.nv}}>{a.last_name}, {a.first_name}</div>
                    <div style={{fontSize:11,color:colors.g5}}>{a.position||"Sin posición"} · {a.division}</div>
                  </div>
                </div>
                {sem&&<div style={{marginTop:8,display:"flex",gap:6,alignItems:"center"}}>
                  <span style={{width:8,height:8,borderRadius:4,background:sem.color,display:"inline-block"}}/>
                  <span style={{fontSize:10,color:sem.color,fontWeight:600}}>{sem.label} ({sem.score.toFixed(1)})</span>
                </div>}
                {!lc&&<div style={{marginTop:8,fontSize:10,color:colors.g4}}>Sin check-in</div>}
              </Card>;
            })}
          </div>
          {filteredAthletes.length===0&&<Card style={{textAlign:"center",padding:32,color:colors.g4}}><div style={{fontSize:32}}>👥</div><div style={{marginTop:8,fontSize:13}}>No hay jugadores{divF!=="all"?" en "+divF:""}</div></Card>}
        </div>
      )}

      {/* ════════ LESIONES ════════ */}
      {tab==="injuries"&&(
        selInj?<InjuryDetail inj={selInj} onBack={()=>sSelInj(null)} onUpdate={canCreateInjury?onUpdInjury:undefined} mob={mob}/>
        :showForm==="injury"?<InjuryForm athletes={athletes.filter(a=>a.active)} onSave={onAddInjury} onCancel={()=>sShowForm(null)} mob={mob}/>
        :<InjuriesList injuries={injuries} filteredAthletes={filteredAthletes} onSelect={sSelInj} onNew={canCreateInjury?()=>sShowForm("injury"):undefined} mob={mob} divF={divF}/>
      )}

      {/* ════════ WELLNESS ════════ */}
      {tab==="wellness"&&<WellnessTab athletes={filteredAthletes} checkins={checkins} onAdd={canCreateCheckin?onAddCheckin:undefined} mob={mob}/>}

      {/* ════════ ENTRENAMIENTOS ════════ */}
      {tab==="training"&&<TrainingTab athletes={filteredAthletes} division={divF} canCreate={canCreateTraining} userId={user.id} mob={mob} showT={showT}/>}

      {/* ════════ PERFILES ════════ */}
      {tab==="perfiles"&&canManageStaff&&<PerfilesTab staffList={staffList} onUpdate={onUpdStaff} onDel={onDelStaff} mob={mob} showT={showT} fetchAll={fetchAll}/>}

    </div>
    {toast&&<Toast msg={toast.msg} type={toast.type} onDone={()=>sToast(null)}/>}
  </div>
  </ThemeCtx.Provider></ErrorBoundary>);
}
