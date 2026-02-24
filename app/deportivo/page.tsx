"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { T, TD, DEP_ROLES, DEP_POSITIONS, DEP_INJ_TYPES, DEP_INJ_ZONES, DEP_INJ_SEV, DEP_WK, DEP_SEM, DEP_DIV, DEP_PHASE_TYPES, DEP_LINEUP_POS, DEP_TEST_CATS, DEP_CUERPO_TECNICO, fn } from "@/lib/constants";
import type { DepStaff, DepAthlete, DepInjury, DepCheckin, DepSeason, DepPhase, DepMicrocycle, DepTestType, DepTest, DepLineup } from "@/lib/supabase/types";
import { exportCSV, exportPDF } from "@/lib/export";
import { useRealtime } from "@/lib/realtime";
import { useTheme, darkCSS } from "@/lib/theme";
import { ThemeCtx, useC } from "@/lib/theme-context";
import { Toast, useMobile, Btn, Card } from "@/components/ui";

const supabase = createClient();
const TODAY = new Date().toISOString().slice(0,10);
const WK_KEYS: (keyof typeof DEP_WK)[] = ["sleep","fatigue","stress","soreness","mood"];
const drLv = (r:string)=>DEP_ROLES[r]?.lv||0;
const canAll = (r:string)=>["dd","dr","coord_pf","kinesiologo","medico"].includes(r);
const fmtD = (d:string)=>{if(!d)return"–";const p=d.slice(0,10).split("-");return p[2]+"/"+p[1]+"/"+p[0];};

/* semáforo score: normaliza (fatigue,stress,soreness invertidos) */
function semScore(c:DepCheckin):{score:number;color:string;bg:string;label:string}{
  const norm=(v:number,inv:boolean)=>inv?6-v:v;
  const avg=(norm(c.sleep,false)+norm(c.fatigue,true)+norm(c.stress,true)+norm(c.soreness,true)+norm(c.mood,false))/5;
  if(avg<=DEP_SEM.red.max) return{score:avg,color:DEP_SEM.red.c,bg:DEP_SEM.red.bg,label:DEP_SEM.red.l};
  if(avg<=DEP_SEM.yellow.max) return{score:avg,color:DEP_SEM.yellow.c,bg:DEP_SEM.yellow.bg,label:DEP_SEM.yellow.l};
  return{score:avg,color:DEP_SEM.green.c,bg:DEP_SEM.green.bg,label:DEP_SEM.green.l};
}


/* ── LOGIN (inline) ── */
function LoginPrompt({mob}:{mob:boolean}){
  const [email,sEmail]=useState("");
  const [pass,sPass]=useState("");
  const [err,sErr]=useState("");
  const [busy,sBusy]=useState(false);
  const doLogin=async()=>{
    sErr("");sBusy(true);
    const{error}=await supabase.auth.signInWithPassword({email,password:pass});
    if(error) sErr(error.message);
    else window.location.reload();
    sBusy(false);
  };
  return <div style={{minHeight:"100vh",background:"linear-gradient(160deg,"+T.nv+","+T.rd+")",display:"flex",alignItems:"center",justifyContent:"center",padding:mob?12:20}}>
    <div style={{maxWidth:420,width:"100%",textAlign:"center" as const}}>
      <img src="/logo.jpg" alt="Los Tordos" style={{width:mob?80:120,height:mob?80:120,objectFit:"contain",margin:"0 auto 18px",display:"block"}}/>
      <h1 style={{color:"#fff",fontSize:mob?22:30,margin:"0 0 4px",fontWeight:800}}>Módulo Deportivo</h1>
      <p style={{color:"rgba(255,255,255,.6)",fontSize:14,margin:"0 0 24px"}}>Iniciá sesión para acceder</p>
      <Card>
        <div style={{display:"flex",flexDirection:"column" as const,gap:10}}>
          <input value={email} onChange={e=>sEmail(e.target.value)} placeholder="Email" type="email" style={{width:"100%",padding:10,borderRadius:8,border:"1px solid "+T.g3,fontSize:13,boxSizing:"border-box" as const}}/>
          <input value={pass} onChange={e=>sPass(e.target.value)} placeholder="Contraseña" type="password" onKeyDown={e=>{if(e.key==="Enter"&&email&&pass)doLogin();}} style={{width:"100%",padding:10,borderRadius:8,border:"1px solid "+T.g3,fontSize:13,boxSizing:"border-box" as const}}/>
          {err&&<div style={{fontSize:12,color:T.rd,fontWeight:600}}>{err}</div>}
          <Btn v="r" onClick={doLogin} disabled={busy||!email||!pass}>{busy?"Ingresando...":"Ingresar"}</Btn>
        </div>
      </Card>
    </div>
  </div>;
}

/* ── NO ACCESS ── */
function NoAccess({mob,userName,onOut}:{mob:boolean;userName:string;onOut:()=>void}){
  return <div style={{minHeight:"100vh",background:T.g1,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <Card style={{maxWidth:420,textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:12}}>🔒</div>
      <h2 style={{fontSize:18,color:T.nv,margin:"0 0 8px"}}>Sin acceso</h2>
      <p style={{fontSize:13,color:T.g5,margin:"0 0 16px"}}>Hola {userName}, no tenés un rol deportivo asignado. Pedile al Director Deportivo que te agregue al staff.</p>
      <div style={{display:"flex",gap:8,justifyContent:"center"}}><Btn v="r" onClick={onOut}>Cerrar sesión</Btn></div>
    </Card>
  </div>;
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
  const [seasons,sSeasons]=useState<DepSeason[]>([]);
  const [phases,sPhases]=useState<DepPhase[]>([]);
  const [microcycles,sMicrocycles]=useState<DepMicrocycle[]>([]);
  const [testTypes,sTestTypes]=useState<DepTestType[]>([]);
  const [tests,sTests]=useState<DepTest[]>([]);
  const [lineups,sLineups]=useState<DepLineup[]>([]);

  // UI
  const [tab,sTab]=useState("dash");
  const [sbOpen,sSbOpen]=useState(false);
  const [sbCol,sSbCol]=useState(false);
  const [sbSec,sSbSec]=useState<string|null>(null);
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
  const safeFetch=async(query:any)=>{try{return await query;}catch{return{data:null,error:{message:"table missing"}};}};
  const fetchAll=useCallback(async()=>{
    if(!user) return;
    sLoading(true);
    const [stRes,athRes,injRes,ckRes]=await Promise.all([
      supabase.from("dep_staff").select("*"),
      supabase.from("dep_athletes").select("*").order("last_name"),
      supabase.from("dep_injuries").select("*").order("id",{ascending:false}),
      supabase.from("dep_checkins").select("*").order("date",{ascending:false}),
    ]);
    // Optional tables — may not exist yet
    const [seaRes,phRes,mcRes,ttRes,tsRes,luRes]=await Promise.all([
      safeFetch(supabase.from("dep_seasons").select("*").order("start_date",{ascending:false})),
      safeFetch(supabase.from("dep_phases").select("*").order("sort_order")),
      safeFetch(supabase.from("dep_microcycles").select("*").order("week_number")),
      safeFetch(supabase.from("dep_test_types").select("*").order("name")),
      safeFetch(supabase.from("dep_tests").select("*").order("date",{ascending:false})),
      safeFetch(supabase.from("dep_lineups").select("*").order("date",{ascending:false})),
    ]);
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
      sMyStaff(staff.find((s:any)=>s.user_id===user.id&&s.active)||null);
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
    if(seaRes.data) sSeasons(seaRes.data);
    if(phRes.data) sPhases(phRes.data);
    if(mcRes.data) sMicrocycles(mcRes.data);
    if(ttRes.data) sTestTypes(ttRes.data);
    if(tsRes.data){
      const aths=athRes.data||[];const tts=ttRes.data||[];
      sTests(tsRes.data.map((t:any)=>{
        const a=aths.find((at:any)=>at.id===t.athlete_id);
        const tt=tts.find((tp:any)=>tp.id===t.test_type_id);
        return{...t,athlete_name:a?a.first_name+" "+a.last_name:"?",test_name:tt?.name||"?",test_unit:tt?.unit||""};
      }));
    }
    if(luRes.data) sLineups(luRes.data);
    sLoading(false);
  },[user]);

  useEffect(()=>{if(user) fetchAll();},[user,fetchAll]);

  /* ── Realtime: auto-refresh on DB changes ── */
  useRealtime([
    {table:"dep_athletes",onChange:()=>fetchAll()},
    {table:"dep_injuries",onChange:()=>fetchAll()},
    {table:"dep_checkins",onChange:()=>fetchAll()},
    {table:"dep_staff",onChange:()=>fetchAll()},
    {table:"dep_seasons",onChange:()=>fetchAll()},
    {table:"dep_phases",onChange:()=>fetchAll()},
    {table:"dep_microcycles",onChange:()=>fetchAll()},
    {table:"dep_tests",onChange:()=>fetchAll()},
    {table:"dep_lineups",onChange:()=>fetchAll()},
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
    {k:"plantel",l:"👥",f:"Plantel"},
    {k:"planif",l:"📅",f:"Planificación"},
    {k:"pretemp",l:"🏋️‍♂️",f:"Pretemporada"},
    {k:"equipo",l:"🏉",f:"Equipo"},
    {k:"injuries",l:"🩹",f:"Lesiones"},
    {k:"wellness",l:"💚",f:"Wellness"},
    {k:"training",l:"🏋️",f:"Entrenamientos"},
    {k:"comm",l:"📱",f:"WhatsApp"},
    ...(canManageStaff?[{k:"perfiles",l:"👤",f:"Perfiles"}]:[]),
  ];

  /* ══════════════════════════ HANDLERS ══════════════════════════ */

  /* Title case: "juan perez" → "Juan Perez" */
  const tc=(s:string|undefined)=>s?s.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()):"";

  /* ── Add Athlete ── */
  const onAddAthlete=async(a:Partial<DepAthlete>)=>{
    try{
      const{error}=await supabase.from("dep_athletes").insert({
        first_name:tc(a.first_name),last_name:tc(a.last_name),division:a.division,position:a.position||"",
        birth_date:a.birth_date||null,dni:a.dni||"",phone:a.phone||"",email:a.email||"",
        sexo:a.sexo||"",categoria:a.categoria||"",obra_social:a.obra_social||"",
        peso:a.peso||null,estatura:a.estatura||null,celular:a.celular||"",
        tel_emergencia:a.tel_emergencia||"",ult_fichaje:a.ult_fichaje||null,
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
        first_name:tc(a.first_name),last_name:tc(a.last_name),division:a.division,position:a.position,
        birth_date:a.birth_date||null,dni:a.dni,phone:a.phone,email:a.email,
        sexo:a.sexo,categoria:a.categoria,obra_social:a.obra_social,
        peso:a.peso,estatura:a.estatura,celular:a.celular,
        tel_emergencia:a.tel_emergencia,ult_fichaje:a.ult_fichaje||null,
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

  /* ── Season CRUD ── */
  const onAddSeason=async(s:Partial<DepSeason>)=>{
    try{
      const{error}=await supabase.from("dep_seasons").insert({name:s.name,division:s.division||"M19",start_date:s.start_date,end_date:s.end_date,status:s.status||"planificada",objectives:s.objectives||"",created_by:user.id});
      if(error) throw error;
      showT("Entrenamiento creado");fetchAll();
    }catch(e:any){showT(e.message||"Error","err");}
  };
  const onUpdSeason=async(id:number,s:Partial<DepSeason>)=>{
    try{
      const{error}=await supabase.from("dep_seasons").update(s).eq("id",id);
      if(error) throw error;
      showT("Entrenamiento actualizado");fetchAll();
    }catch(e:any){showT(e.message||"Error","err");}
  };
  const onDelSeason=async(id:number)=>{
    try{
      const{error}=await supabase.from("dep_seasons").delete().eq("id",id);
      if(error) throw error;
      showT("Entrenamiento eliminado");fetchAll();
    }catch(e:any){showT(e.message||"Error","err");}
  };

  /* ── Phase CRUD ── */
  const onAddPhase=async(p:Partial<DepPhase>)=>{
    try{
      const{error}=await supabase.from("dep_phases").insert({season_id:p.season_id,name:p.name,type:p.type||"pretemporada",start_date:p.start_date,end_date:p.end_date,objectives:p.objectives||"",color:p.color||"#3B82F6",sort_order:p.sort_order||0});
      if(error) throw error;
      showT("Fase creada");fetchAll();
    }catch(e:any){showT(e.message||"Error","err");}
  };
  const onUpdPhase=async(id:number,p:Partial<DepPhase>)=>{
    try{
      const{error}=await supabase.from("dep_phases").update(p).eq("id",id);
      if(error) throw error;
      showT("Fase actualizada");fetchAll();
    }catch(e:any){showT(e.message||"Error","err");}
  };
  const onDelPhase=async(id:number)=>{
    try{
      const{error}=await supabase.from("dep_phases").delete().eq("id",id);
      if(error) throw error;
      showT("Fase eliminada");fetchAll();
    }catch(e:any){showT(e.message||"Error","err");}
  };

  /* ── Microcycle CRUD ── */
  const onAddMicro=async(m:Partial<DepMicrocycle>)=>{
    try{
      const{error}=await supabase.from("dep_microcycles").insert({phase_id:m.phase_id,week_number:m.week_number,week_start:m.week_start,focus:m.focus||"",intensity:m.intensity||5,notes:m.notes||""});
      if(error) throw error;
      showT("Microciclo creado");fetchAll();
    }catch(e:any){showT(e.message||"Error","err");}
  };
  const onUpdMicro=async(id:number,m:Partial<DepMicrocycle>)=>{
    try{
      const{error}=await supabase.from("dep_microcycles").update(m).eq("id",id);
      if(error) throw error;
      showT("Microciclo actualizado");fetchAll();
    }catch(e:any){showT(e.message||"Error","err");}
  };
  const onDelMicro=async(id:number)=>{
    try{
      const{error}=await supabase.from("dep_microcycles").delete().eq("id",id);
      if(error) throw error;
      showT("Microciclo eliminado");fetchAll();
    }catch(e:any){showT(e.message||"Error","err");}
  };

  /* ── Test CRUD ── */
  const onAddTest=async(t:Partial<DepTest>)=>{
    try{
      const{error}=await supabase.from("dep_tests").insert({athlete_id:t.athlete_id,test_type_id:t.test_type_id,date:t.date||TODAY,value:t.value,notes:t.notes||"",recorded_by:user.id});
      if(error) throw error;
      showT("Test registrado");fetchAll();
    }catch(e:any){showT(e.message||"Error","err");}
  };
  const onAddTestBatch=async(rows:{athlete_id:number;test_type_id:number;date:string;value:number}[])=>{
    try{
      const payload=rows.map(r=>({...r,notes:"",recorded_by:user.id}));
      const{error}=await supabase.from("dep_tests").insert(payload);
      if(error) throw error;
      showT(rows.length+" test"+(rows.length>1?"s":"")+" registrado"+(rows.length>1?"s":""));fetchAll();
    }catch(e:any){showT(e.message||"Error","err");}
  };
  const onDelTest=async(id:number)=>{
    try{
      const{error}=await supabase.from("dep_tests").delete().eq("id",id);
      if(error) throw error;
      showT("Test eliminado");fetchAll();
    }catch(e:any){showT(e.message||"Error","err");}
  };

  /* ── Lineup CRUD ── */
  const onAddLineup=async(l:Partial<DepLineup>)=>{
    try{
      const{error}=await supabase.from("dep_lineups").insert({date:l.date,match_name:l.match_name||"",division:l.division||"M19",formation:l.formation||{titulares:{},suplentes:[]},notes:l.notes||"",created_by:user.id});
      if(error) throw error;
      showT("Formación guardada");fetchAll();
    }catch(e:any){showT(e.message||"Error","err");}
  };
  const onUpdLineup=async(id:number,l:Partial<DepLineup>)=>{
    try{
      const{error}=await supabase.from("dep_lineups").update(l).eq("id",id);
      if(error) throw error;
      showT("Formación actualizada");fetchAll();
    }catch(e:any){showT(e.message||"Error","err");}
  };
  const onDelLineup=async(id:number)=>{
    try{
      const{error}=await supabase.from("dep_lineups").delete().eq("id",id);
      if(error) throw error;
      showT("Formación eliminada");fetchAll();
    }catch(e:any){showT(e.message||"Error","err");}
  };

  /* ══════════════════════════ RENDER ══════════════════════════ */

  /* ── Cuerpo técnico from constants ── */

  const navTo=(k:string)=>{sTab(k);sShowForm(null);sSelAth(null);sSelInj(null);if(mob)sSbOpen(false);};
  const sbBg=isDark?"#1E293B":T.nv;

  const sbContent=(<div style={{flex:1,overflowY:"auto" as const,padding:"8px 6px"}}>
    {/* Cuerpo Técnico — accordion style like main app */}
    <div style={{marginBottom:6}}>
      <div style={{fontSize:10,fontWeight:700,color:colors.g4,textTransform:"uppercase" as const,marginBottom:8,padding:"0 8px",letterSpacing:1}}>Cuerpo Técnico</div>
      {DEP_CUERPO_TECNICO.map(sec=><div key={sec.label} style={{marginBottom:3}}>
        <div onClick={()=>sSbSec(sbSec===sec.label?null:sec.label)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:mob?"12px 12px":"9px 10px",borderRadius:7,cursor:"pointer",background:sbSec===sec.label?"rgba(255,255,255,.1)":"transparent",borderLeft:"3px solid "+sec.color,minHeight:mob?48:undefined}}>
          <span style={{fontSize:mob?15:13,fontWeight:600}}>{sec.icon} {sec.label}</span>
          <span style={{fontSize:mob?12:11,color:"rgba(255,255,255,.4)"}}>{sec.members.length>0?sec.members.length:"–"}</span>
        </div>
        {sbSec===sec.label&&<div style={{marginTop:3}}>
          {sec.members.length===0&&<div style={{marginLeft:16,padding:mob?"10px 12px":"6px 10px",fontSize:mob?14:12,color:"rgba(255,255,255,.3)",fontStyle:"italic"}}>– vacante –</div>}
          {[...sec.members].sort((a,b)=>a.split(" ").slice(-1)[0].localeCompare(b.split(" ").slice(-1)[0])).map((name,i)=><div key={i} style={{marginLeft:16,padding:mob?"10px 12px":"5px 10px",borderRadius:5,fontSize:mob?14:12,color:"rgba(255,255,255,.7)",display:"flex",alignItems:"center",gap:7,minHeight:mob?44:undefined}}>
            <span style={{width:6,height:6,borderRadius:3,background:sec.color,display:"inline-block",flexShrink:0}}/>
            {name}
          </div>)}
        </div>}
      </div>)}
    </div>

    <div style={{height:1,background:"rgba(255,255,255,.08)",margin:"10px 8px"}}/>

    {/* Módulos (navigation) */}
    <div style={{marginBottom:6}}>
      <div style={{fontSize:10,fontWeight:700,color:colors.g4,textTransform:"uppercase" as const,marginBottom:6,padding:"0 8px",letterSpacing:1}}>Módulos</div>
      {tabs.map(t=><div key={t.k} onClick={()=>navTo(t.k)} style={{display:"flex",alignItems:"center",gap:8,padding:mob?"12px 12px":"9px 10px",borderRadius:7,cursor:"pointer",background:tab===t.k?"rgba(255,255,255,.1)":"transparent",fontSize:mob?15:13,fontWeight:tab===t.k?700:500,color:tab===t.k?"#fff":"rgba(255,255,255,.55)",marginBottom:2,minHeight:mob?48:undefined}}>
        <span style={{fontSize:mob?16:14}}>{t.l}</span>{t.f}
      </div>)}
    </div>

    <div style={{height:1,background:"rgba(255,255,255,.08)",margin:"10px 8px"}}/>

    {/* Plantel stats */}
    <div style={{marginTop:6,padding:"8px 10px",background:"rgba(255,255,255,.04)",borderRadius:7}}>
      <div style={{fontSize:10,fontWeight:700,color:colors.g4,textTransform:"uppercase" as const,marginBottom:6}}>Plantel M19</div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"2px 0"}}><span style={{color:"rgba(255,255,255,.45)"}}>👥 Jugadores</span><span style={{fontWeight:700,color:"rgba(255,255,255,.8)"}}>{athletes.filter(a=>a.active).length}</span></div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"2px 0"}}><span style={{color:"rgba(255,255,255,.45)"}}>🩹 Lesionados</span><span style={{fontWeight:700,color:T.rd}}>{injuries.filter(i=>i.status!=="alta").length}</span></div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"2px 0"}}><span style={{color:"rgba(255,255,255,.45)"}}>🏉 Formaciones</span><span style={{fontWeight:700,color:"rgba(255,255,255,.8)"}}>{lineups.length}</span></div>
    </div>
  </div>);

  return(<ThemeCtx.Provider value={{colors,isDark,cardBg}}>
    <style dangerouslySetInnerHTML={{__html:darkCSS}}/>
    <div style={{minHeight:"100vh",background:colors.g1,color:colors.nv,display:"flex"}}>

    {/* ── SIDEBAR (desktop) ── */}
    {!mob&&!sbCol&&<div style={{width:250,minWidth:250,background:sbBg,color:"#fff",display:"flex",flexDirection:"column" as const,borderRight:isDark?"1px solid "+colors.g3:"none",position:"sticky" as const,top:0,height:"100vh",overflowY:"auto" as const}}>
      <div style={{padding:"14px 12px",borderBottom:"1px solid rgba(255,255,255,.08)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div onClick={()=>sTab("dash")} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
          <img src="/logo.jpg" alt="Los Tordos" style={{width:32,height:32,borderRadius:6,objectFit:"contain"}}/>
          <div><div style={{fontSize:13,fontWeight:800}}>Deportivo</div><div style={{fontSize:9,color:colors.g4,letterSpacing:1,textTransform:"uppercase" as const}}>Los Tordos RC</div></div>
        </div>
        <button onClick={()=>sSbCol(true)} style={{background:"none",border:"none",color:colors.g4,fontSize:14,cursor:"pointer"}} title="Colapsar">◀</button>
      </div>
      {sbContent}
      <div style={{padding:"10px 12px",borderTop:"1px solid rgba(255,255,255,.08)",fontSize:10,color:"rgba(255,255,255,.4)"}}>
        <div>{profile?.first_name} {profile?.last_name}</div>
        <div style={{fontSize:9}}>{myStaff?DEP_ROLES[depRole]?.l:"Admin"}</div>
      </div>
    </div>}

    {/* Collapsed sidebar (desktop) */}
    {!mob&&sbCol&&<div style={{width:48,minWidth:48,background:sbBg,display:"flex",flexDirection:"column" as const,alignItems:"center",paddingTop:10,borderRight:isDark?"1px solid "+colors.g3:"none",position:"sticky" as const,top:0,height:"100vh"}}>
      <button onClick={()=>sSbCol(false)} style={{background:"none",border:"none",color:"#fff",fontSize:18,cursor:"pointer",marginBottom:14}} title="Expandir">☰</button>
      <img src="/logo.jpg" alt="" onClick={()=>sTab("dash")} style={{width:28,height:28,borderRadius:6,objectFit:"contain",marginBottom:10,cursor:"pointer"}}/>
      {tabs.map(t=><button key={t.k} onClick={()=>navTo(t.k)} title={t.f} style={{background:tab===t.k?"rgba(255,255,255,.15)":"none",border:"none",color:tab===t.k?"#fff":"rgba(255,255,255,.5)",fontSize:16,cursor:"pointer",padding:"8px 0",width:"100%"}}>{t.l}</button>)}
    </div>}

    {/* Mobile sidebar overlay */}
    {mob&&sbOpen&&<><div onClick={()=>sSbOpen(false)} style={{position:"fixed" as const,inset:0,background:"rgba(0,0,0,.5)",zIndex:99}}/>
    <div style={{position:"fixed" as const,top:0,left:0,bottom:0,width:260,background:sbBg,color:"#fff",display:"flex",flexDirection:"column" as const,zIndex:100,boxShadow:"4px 0 20px rgba(0,0,0,.3)"}}>
      <div style={{padding:"14px 12px",borderBottom:"1px solid rgba(255,255,255,.08)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div onClick={()=>{sTab("dash");sSbOpen(false);}} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer"}}><img src="/logo.jpg" alt="" style={{width:28,height:28,borderRadius:6,objectFit:"contain"}}/><span style={{fontSize:13,fontWeight:800}}>Deportivo</span></div>
        <button onClick={()=>sSbOpen(false)} style={{background:"none",border:"none",color:"#fff",fontSize:20,cursor:"pointer",minWidth:44,minHeight:44,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
      </div>
      {sbContent}
    </div></>}

    {/* ── MAIN CONTENT ── */}
    <div style={{flex:1,display:"flex",flexDirection:"column" as const,minWidth:0}}>
      {/* Top bar */}
      <div style={{background:isDark?colors.g2:T.nv,padding:mob?"10px 12px":"10px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky" as const,top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {mob&&<button onClick={()=>sSbOpen(true)} style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:8,padding:"6px 10px",color:"#fff",fontSize:16,cursor:"pointer"}}>☰</button>}
          <button onClick={()=>sTab("dash")} style={{background:tab==="dash"?"rgba(255,255,255,.15)":"rgba(255,255,255,.06)",border:"none",borderRadius:8,padding:"5px 12px",color:"#fff",fontSize:mob?11:12,cursor:"pointer",fontWeight:700,display:"flex",alignItems:"center",gap:4}}>📊 Dashboard</button>
          {tab!=="dash"&&<div style={{color:isDark?colors.nv:"rgba(255,255,255,.7)",fontSize:mob?12:14,fontWeight:600}}>{tabs.find(t=>t.k===tab)?.l} {tabs.find(t=>t.k===tab)?.f}</div>}
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <input value={search} onChange={e=>sSearch(e.target.value)} placeholder="Buscar..." style={{padding:"5px 10px",borderRadius:8,border:"1px solid rgba(255,255,255,.15)",fontSize:11,width:mob?100:160,background:"rgba(255,255,255,.08)",color:"#fff"}}/>
          <button onClick={toggleTheme} title={isDark?"Modo claro":"Modo oscuro"} style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:8,padding:"6px 10px",color:isDark?colors.nv:"rgba(255,255,255,.7)",fontSize:14,cursor:"pointer"}}>{isDark?"☀️":"🌙"}</button>
          <button onClick={out} style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:8,padding:"6px 12px",color:isDark?colors.nv:"rgba(255,255,255,.7)",fontSize:11,cursor:"pointer",fontWeight:600}}>Salir</button>
        </div>
      </div>

    {/* Content area */}
    <div style={{flex:1,padding:mob?"12px 12px 80px":"16px 24px 40px"}}>

      {/* ════════ DASHBOARD ════════ */}
      {tab==="dash"&&<DashboardTab athletes={filteredAthletes} checkins={checkins} injuries={injuries} latestCheckin={latestCheckin} activeInjuries={activeInjuries} mob={mob} onSelectAth={(a:DepAthlete)=>{sSelAth(a);sTab("plantel");}}/>}

      {/* ════════ PLANTEL ════════ */}
      {tab==="plantel"&&(
        selAth?<FichaJugador ath={selAth} injuries={injuries.filter(i=>i.athlete_id===selAth.id)} checkins={checkins.filter(c=>c.athlete_id===selAth.id).slice(0,30)} onBack={()=>sSelAth(null)} onEdit={canEditAthlete?(a:Partial<DepAthlete>)=>onUpdAthlete(selAth.id,a):undefined} onDeactivate={canEditAthlete?()=>{if(confirm("¿Desactivar jugador?")){onDeactivateAth(selAth.id);}}:undefined} latestCheckin={latestCheckin(selAth.id)} mob={mob}/>
        :showForm==="athlete"?<AthleteForm onSave={onAddAthlete} onCancel={()=>sShowForm(null)} mob={mob}/>
        :showForm==="bulk"?<BulkAthleteForm onSave={async(rows:Partial<DepAthlete>[])=>{
          try{
            const toNum=(v:any)=>{if(v===null||v===undefined||v==="")return null;const n=parseFloat(String(v).replace(",",".").replace(/[^\d.]/g,""));return isNaN(n)?null:n;};
            const toDate=(v:any)=>{if(!v||v==="")return null;const s=String(v).trim();if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;const d=new Date(s);return isNaN(d.getTime())?null:d.toISOString().slice(0,10);};
            const payload=rows.map(r=>({
              first_name:tc(r.first_name),last_name:tc(r.last_name),division:r.division||DEP_DIV[0],
              position:String(r.position||"").trim(),season:new Date().getFullYear().toString(),active:true,
              dni:String(r.dni||"").replace(/\D/g,""),phone:String(r.celular||r.phone||"").trim(),email:String(r.email||"").trim().toLowerCase(),
              birth_date:toDate(r.birth_date),sexo:String(r.sexo||"").trim(),categoria:String(r.categoria||"").trim(),
              obra_social:String(r.obra_social||"").trim(),peso:toNum(r.peso),estatura:toNum(r.estatura),
              celular:String(r.celular||"").trim(),tel_emergencia:String(r.tel_emergencia||"").trim(),ult_fichaje:toDate(r.ult_fichaje),
              emergency_contact:{},medical_info:{},photo_url:"",
            }));
            const{error}=await supabase.from("dep_athletes").insert(payload);
            if(error) throw error;
            showT(payload.length+" jugador"+(payload.length>1?"es":"")+" agregado"+(payload.length>1?"s":""));sShowForm(null);fetchAll();
          }catch(e:any){console.error("Bulk insert error:",e);showT(e.message||"Error al guardar","err");}
        }} onCancel={()=>sShowForm(null)} mob={mob}/>
        :<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <h2 style={{margin:0,fontSize:18,color:colors.nv}}>👥 Plantel ({filteredAthletes.length})</h2>
            <div style={{display:"flex",gap:6}}>{filteredAthletes.length>0&&<><Btn v="g" s="s" onClick={()=>{const h=["Apellido","Nombre","Fecha Nac.","DNI","Categoría","Sexo","O.Social","Peso","Estatura","Puesto","Email","Tel.Emergencia","Celular","Últ.Fichaje"];const r=filteredAthletes.map((a:DepAthlete)=>[a.last_name,a.first_name,fmtD(a.birth_date),a.dni,a.categoria||"",a.sexo||"",a.obra_social||"",a.peso?String(a.peso):"",a.estatura?String(a.estatura):"",a.position,a.email,a.tel_emergencia||"",a.celular||a.phone||"",a.ult_fichaje?fmtD(a.ult_fichaje):""]);exportCSV("plantel",h,r);}}>CSV</Btn><Btn v="g" s="s" onClick={()=>{const h=["Apellido","Nombre","Fecha Nac.","DNI","Categoría","Sexo","O.Social","Peso","Estatura","Puesto","Email","Tel.Emergencia","Celular","Últ.Fichaje"];const r=filteredAthletes.map((a:DepAthlete)=>[a.last_name,a.first_name,fmtD(a.birth_date),a.dni,a.categoria||"",a.sexo||"",a.obra_social||"",a.peso?String(a.peso):"",a.estatura?String(a.estatura):"",a.position,a.email,a.tel_emergencia||"",a.celular||a.phone||"",a.ult_fichaje?fmtD(a.ult_fichaje):""]);exportPDF("Plantel",h,r);}}>PDF</Btn></>}{canCreateAthlete&&<><Btn v="w" s="s" onClick={()=>sShowForm("bulk")}>⚡ Carga rápida</Btn><Btn v="p" s="s" onClick={()=>sShowForm("athlete")}>+ Jugador</Btn></>}</div>
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

      {/* ════════ PLANIFICACIÓN ════════ */}
      {tab==="planif"&&<PlanificacionTab seasons={seasons} phases={phases} microcycles={microcycles} onAddSeason={onAddSeason} onUpdSeason={onUpdSeason} onDelSeason={onDelSeason} onAddPhase={onAddPhase} onUpdPhase={onUpdPhase} onDelPhase={onDelPhase} onAddMicro={onAddMicro} onUpdMicro={onUpdMicro} onDelMicro={onDelMicro} canEdit={depLv>=4} mob={mob}/>}

      {/* ════════ PRETEMPORADA ════════ */}
      {tab==="pretemp"&&<PretemporadaTab athletes={filteredAthletes} tests={tests} testTypes={testTypes} onAddTest={onAddTest} onAddTestBatch={onAddTestBatch} onDelTest={onDelTest} canEdit={depLv>=4||depRole==="pf"||depRole==="coord_pf"} mob={mob}/>}

      {/* ════════ EQUIPO ════════ */}
      {tab==="equipo"&&<LineupTab athletes={athletes.filter(a=>a.active)} lineups={lineups} injuries={injuries} checkins={checkins} onAdd={onAddLineup} onUpd={onUpdLineup} onDel={onDelLineup} canEdit={depLv>=4||depRole==="entrenador"} mob={mob} latestCheckin={latestCheckin}/>}

      {/* ════════ WHATSAPP ════════ */}
      {tab==="comm"&&<CommTab athletes={athletes.filter(a=>a.active)} lineups={lineups} seasons={seasons} phases={phases} mob={mob} showT={showT}/>}

      {/* ════════ PERFILES ════════ */}
      {tab==="perfiles"&&canManageStaff&&<PerfilesTab staffList={staffList} onUpdate={onUpdStaff} onDel={onDelStaff} mob={mob} showT={showT} fetchAll={fetchAll}/>}

    </div>
    </div>{/* close main content flex:1 */}
    {toast&&<Toast msg={toast.msg} type={toast.type} onDone={()=>sToast(null)}/>}
  </div>
  </ThemeCtx.Provider>);
}

/* ══════════════════════════ DASHBOARD TAB ══════════════════════════ */
function DashboardTab({athletes,checkins,injuries,latestCheckin,activeInjuries,mob,onSelectAth}:any){
  const{colors,cardBg}=useC();
  const [semF,sSemF]=useState("all");
  const byDiv:Record<string,DepAthlete[]>={};
  athletes.forEach((a:DepAthlete)=>{if(!byDiv[a.division])byDiv[a.division]=[];byDiv[a.division].push(a);});

  const total=athletes.length;
  const withCheckin=athletes.filter((a:DepAthlete)=>latestCheckin(a.id)).length;
  const injActive=athletes.reduce((acc:number,a:DepAthlete)=>acc+activeInjuries(a.id).length,0);
  const reds=athletes.filter((a:DepAthlete)=>{const lc=latestCheckin(a.id);return lc&&semScore(lc).score<=DEP_SEM.red.max;}).length;
  const yellows=athletes.filter((a:DepAthlete)=>{const lc=latestCheckin(a.id);return lc&&semScore(lc).score>DEP_SEM.red.max&&semScore(lc).score<=DEP_SEM.yellow.max;}).length;

  const filtered=athletes.filter((a:DepAthlete)=>{
    if(semF==="all") return true;
    const lc=latestCheckin(a.id);
    if(!lc) return semF==="none";
    const s=semScore(lc);
    if(semF==="red") return s.score<=DEP_SEM.red.max;
    if(semF==="yellow") return s.score>DEP_SEM.red.max&&s.score<=DEP_SEM.yellow.max;
    if(semF==="green") return s.score>DEP_SEM.yellow.max;
    return true;
  });

  return <div>
    <h2 style={{margin:"0 0 14px",fontSize:18,color:colors.nv}}>📊 Dashboard Deportivo</h2>
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(5,1fr)",gap:10,marginBottom:16}}>
      {[
        {l:"Jugadores",v:total,i:"👥",c:colors.bl},
        {l:"Con check-in",v:withCheckin+"/"+total,i:"💚",c:colors.gn},
        {l:"Lesiones activas",v:injActive,i:"🩹",c:colors.rd},
        {l:"En alerta",v:reds,i:"🔴",c:"#DC2626"},
        {l:"Precaución",v:yellows,i:"🟡",c:colors.yl},
      ].map((s,i)=><Card key={i} style={{textAlign:"center",padding:mob?12:16}}>
        <div style={{fontSize:20}}>{s.i}</div>
        <div style={{fontSize:mob?20:24,fontWeight:800,color:s.c}}>{s.v}</div>
        <div style={{fontSize:10,color:colors.g5}}>{s.l}</div>
      </Card>)}
    </div>

    <div style={{display:"flex",gap:4,marginBottom:14,flexWrap:"wrap" as const}}>
      {[{k:"all",l:"Todos"},{k:"red",l:"🔴 Alerta"},{k:"yellow",l:"🟡 Precaución"},{k:"green",l:"🟢 Óptimo"},{k:"none",l:"⚪ Sin datos"}].map(f=>
        <button key={f.k} onClick={()=>sSemF(f.k)} style={{padding:"5px 12px",borderRadius:16,border:semF===f.k?"2px solid "+colors.nv:"1px solid "+colors.g3,background:semF===f.k?colors.nv+"10":cardBg,color:semF===f.k?colors.nv:colors.g5,fontSize:11,fontWeight:600,cursor:"pointer"}}>{f.l}</button>
      )}
    </div>

    {/* Grid by division */}
    {Object.keys(byDiv).sort().map(div=>{
      const divAthletes=byDiv[div].filter(a=>filtered.includes(a));
      if(divAthletes.length===0) return null;
      return <div key={div} style={{marginBottom:16}}>
        <h3 style={{fontSize:14,color:colors.nv,margin:"0 0 8px",fontWeight:700}}>{div} ({divAthletes.length})</h3>
        <div style={{display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)",gap:8}}>
          {divAthletes.map(a=>{
            const lc=latestCheckin(a.id);const ai=activeInjuries(a.id);
            const sem=lc?semScore(lc):null;
            const daysSince=lc?Math.round((Date.now()-new Date(lc.date).getTime())/864e5):999;
            return <div key={a.id} onClick={()=>onSelectAth(a)} style={{background:cardBg,borderRadius:10,padding:mob?10:12,border:"1px solid "+(sem?sem.color+"40":colors.g3),cursor:"pointer",position:"relative" as const}}>
              {ai.length>0&&<span style={{position:"absolute" as const,top:4,right:6,fontSize:10}}>🩹</span>}
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:14,background:sem?sem.bg:colors.g2,display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid "+(sem?sem.color:colors.g3),flexShrink:0}}>
                  <span style={{fontSize:sem?10:12,fontWeight:800,color:sem?sem.color:colors.g4}}>{sem?sem.score.toFixed(1):"–"}</span>
                </div>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:700,color:colors.nv,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{a.last_name}</div>
                  <div style={{fontSize:10,color:colors.g5}}>{a.position||"–"}</div>
                </div>
              </div>
              {daysSince>2&&lc&&<div style={{fontSize:9,color:colors.yl,marginTop:4,fontWeight:600}}>⚠️ {daysSince}d sin check-in</div>}
              {!lc&&<div style={{fontSize:9,color:colors.g4,marginTop:4}}>Sin datos</div>}
            </div>;
          })}
        </div>
      </div>;
    })}
    {filtered.length===0&&<Card style={{textAlign:"center",padding:32,color:colors.g4}}><div style={{fontSize:32}}>📊</div><div style={{marginTop:8}}>No hay jugadores para mostrar</div></Card>}
  </div>;
}

/* ══════════════════════════ FICHA JUGADOR ══════════════════════════ */
function FichaJugador({ath,injuries,checkins,onBack,onEdit,onDeactivate,latestCheckin,mob}:any){
  const{colors,cardBg}=useC();
  const [editing,sEditing]=useState(false);
  const [f,sF]=useState({first_name:ath.first_name,last_name:ath.last_name,division:ath.division,position:ath.position,birth_date:ath.birth_date||"",dni:ath.dni,sexo:ath.sexo||"",categoria:ath.categoria||"",obra_social:ath.obra_social||"",peso:ath.peso||"",estatura:ath.estatura||"",celular:ath.celular||"",tel_emergencia:ath.tel_emergencia||"",ult_fichaje:ath.ult_fichaje||"",phone:ath.phone,email:ath.email,emergency_contact:ath.emergency_contact||{},medical_info:ath.medical_info||{}});
  const sem=latestCheckin?semScore(latestCheckin):null;
  const activeInj=injuries.filter((i:DepInjury)=>i.status!=="alta");

  if(editing&&onEdit) return <div>
    <Btn v="g" s="s" onClick={()=>sEditing(false)} style={{marginBottom:12}}>← Cancelar</Btn>
    <h2 style={{fontSize:16,color:colors.nv,margin:"0 0 14px"}}>Editar: {ath.first_name} {ath.last_name}</h2>
    <Card>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:10}}>
        {[["Apellido","last_name"],["Nombre","first_name"],["Fecha Nac.","birth_date"],["Documento","dni"],["Categoría","categoria"],["Sexo","sexo"],["O. Social","obra_social"],["Peso (kg)","peso"],["Estatura (cm)","estatura"],["Email","email"],["Tel. Emergencia","tel_emergencia"],["Celular","celular"],["Últ. Fichaje","ult_fichaje"]].map(([l,k])=>{
          const isDate=k==="birth_date"||k==="ult_fichaje";
          const isNum=k==="peso"||k==="estatura";
          const isSexo=k==="sexo";
          if(isSexo) return <div key={k}><label style={{fontSize:11,fontWeight:600,color:T.g5}}>{l}</label><select value={(f as any)[k]||""} onChange={e=>sF(prev=>({...prev,[k]:e.target.value}))} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,marginTop:3}}><option value="">–</option><option value="M">M</option><option value="F">F</option></select></div>;
          return <div key={k}><label style={{fontSize:11,fontWeight:600,color:T.g5}}>{l}</label><input type={isDate?"date":isNum?"number":"text"} step={isNum?"0.1":undefined} value={(f as any)[k]||""} onChange={e=>sF(prev=>({...prev,[k]:isNum?(e.target.value?+e.target.value:""):e.target.value}))} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:3}}/></div>;
        })}
        <div><label style={{fontSize:11,fontWeight:600,color:T.g5}}>Puesto</label><select value={f.position} onChange={e=>sF(prev=>({...prev,position:e.target.value}))} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,marginTop:3}}><option value="">Seleccionar...</option>{DEP_POSITIONS.map(p=><option key={p} value={p}>{p}</option>)}</select></div>
      </div>
      <div style={{display:"flex",gap:8,marginTop:14}}><Btn v="p" onClick={()=>{onEdit({...f,peso:f.peso?+f.peso:null,estatura:f.estatura?+f.estatura:null});sEditing(false);}}>💾 Guardar</Btn><Btn v="g" onClick={()=>sEditing(false)}>Cancelar</Btn></div>
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
        {[["Fecha nacimiento",fmtD(ath.birth_date)],["Documento",ath.dni||"–"],["Categoría",ath.categoria||"–"],["Sexo",ath.sexo||"–"],["O. Social",ath.obra_social||"–"],["Peso",ath.peso?ath.peso+" kg":"–"],["Estatura",ath.estatura?ath.estatura+" cm":"–"],["Email",ath.email||"–"],["Celular",ath.celular||ath.phone||"–"],["Tel. Emergencia",ath.tel_emergencia||"–"],["Últ. Fichaje",ath.ult_fichaje?fmtD(ath.ult_fichaje):"–"]].map(([l,v],i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid "+T.g1}}><span style={{fontSize:11,color:T.g5}}>{l}</span><span style={{fontSize:11,color:T.nv,fontWeight:600}}>{v}</span></div>)}
      </Card>
      <Card>
        <h3 style={{margin:"0 0 8px",fontSize:13,color:T.nv}}>🆘 Emergencia / Médico</h3>
        {[["Contacto emerg.",ath.emergency_contact?.name||"–"],["Tel contacto",ath.emergency_contact?.phone||"–"],["Relación",ath.emergency_contact?.relation||"–"],["Grupo sanguíneo",ath.medical_info?.blood_type||"–"],["Alergias",ath.medical_info?.allergies||"–"],["Condiciones",ath.medical_info?.conditions||"–"]].map(([l,v],i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid "+T.g1}}><span style={{fontSize:11,color:T.g5}}>{l}</span><span style={{fontSize:11,color:T.nv,fontWeight:600}}>{v}</span></div>)}
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

/* ══════════════════════════ BULK ATHLETE FORM ══════════════════════════ */
const BULK_COLS=["last_name","first_name","birth_date","dni","categoria","sexo","obra_social","peso","estatura","position","email","tel_emergencia","celular","ult_fichaje"] as const;
const BULK_HEADERS=["Apellido","Nombre","Fecha Nac.","Documento","Categoría","Sexo","O.Social","Peso","Estatura","Puesto","Email","Tel.Emerg.","Celular","Últ.Fichaje"];
type BulkRow=Record<typeof BULK_COLS[number],string>&{_err?:boolean};
const emptyRow=():BulkRow=>({last_name:"",first_name:"",birth_date:"",dni:"",categoria:"",sexo:"",obra_social:"",peso:"",estatura:"",position:"",email:"",tel_emergencia:"",celular:"",ult_fichaje:"",_err:false});

/* Header aliases map — matches any common column name to our internal field */
const HEADER_MAP:Record<string,typeof BULK_COLS[number]>={};
(["apellido","last_name","apellidos"] as const).forEach(k=>HEADER_MAP[k]="last_name");
(["nombre","first_name","nombres","name"] as const).forEach(k=>HEADER_MAP[k]="first_name");
(["fecha_nac","fecha nac.","fecha nac","birth_date","fecha de nacimiento","nacimiento","fecha_nacimiento","fec. nac.","fec nac"] as const).forEach(k=>HEADER_MAP[k]="birth_date");
(["documento","dni","doc","nro_doc","nro doc","nro documento","n° doc"] as const).forEach(k=>HEADER_MAP[k]="dni");
(["categoria","categoría","cat"] as const).forEach(k=>HEADER_MAP[k]="categoria");
(["sexo","genero","género","sex"] as const).forEach(k=>HEADER_MAP[k]="sexo");
(["obra_social","o.social","obra social","os","o. social","obra soc"] as const).forEach(k=>HEADER_MAP[k]="obra_social");
(["peso","weight","kg"] as const).forEach(k=>HEADER_MAP[k]="peso");
(["estatura","altura","height","talla","cm"] as const).forEach(k=>HEADER_MAP[k]="estatura");
(["puesto","position","posicion","posición","pos"] as const).forEach(k=>HEADER_MAP[k]="position");
(["email","mail","correo","e-mail"] as const).forEach(k=>HEADER_MAP[k]="email");
(["tel_emergencia","tel emergencia","tel.emergencia","tel. emergencia","emergencia","tel emerg","tel.emerg.","contacto emergencia"] as const).forEach(k=>HEADER_MAP[k]="tel_emergencia");
(["celular","cel","telefono","teléfono","tel","phone","celular jugador"] as const).forEach(k=>HEADER_MAP[k]="celular");
(["ult_fichaje","últ.fichaje","ult.fichaje","ult fichaje","fichaje","ultimo fichaje","último fichaje"] as const).forEach(k=>HEADER_MAP[k]="ult_fichaje");

function matchHeaders(headerRow:string[]):(typeof BULK_COLS[number]|null)[]{
  return headerRow.map(h=>{
    const n=h.toLowerCase().trim().replace(/[*#]/g,"");
    return HEADER_MAP[n]||null;
  });
}

function BulkAthleteForm({onSave,onCancel,mob}:{onSave:(rows:Partial<DepAthlete>[])=>void;onCancel:()=>void;mob:boolean}){
  const [rows,sRows]=useState<BulkRow[]>([]);
  const [saving,sSaving]=useState(false);
  const [status,sStatus]=useState<string>("");
  const [fileName,sFileName]=useState("");

  const parseRowFromMap=(vals:string[],colMap:(typeof BULK_COLS[number]|null)[]):BulkRow=>{
    const r=emptyRow();
    colMap.forEach((field,i)=>{if(field&&vals[i])(r as any)[field]=vals[i].trim();});
    if(!r.first_name&&!r.last_name) r._err=true;
    return r;
  };

  const parseRowPositional=(cols:string[]):BulkRow=>{
    const r=emptyRow();
    BULK_COLS.forEach((k,i)=>{(r as any)[k]=(cols[i]||"").trim();});
    if(!r.first_name&&!r.last_name) r._err=true;
    return r;
  };

  const processData=(headerRow:string[]|null,dataRows:string[][])=>{
    let parsed:BulkRow[];
    if(headerRow){
      const colMap=matchHeaders(headerRow);
      const matched=colMap.filter(Boolean).length;
      if(matched>=2){
        sStatus(`✓ ${matched} columnas reconocidas de ${headerRow.length}`);
        parsed=dataRows.map(vals=>parseRowFromMap(vals,colMap));
      }else{
        sStatus("⚠ Encabezados no reconocidos, usando orden de columnas");
        parsed=dataRows.map(vals=>parseRowPositional(vals));
      }
    }else{
      parsed=dataRows.map(vals=>parseRowPositional(vals));
    }
    sRows(parsed.filter(r=>r.first_name||r.last_name));
  };

  const handleFile=async(file:File)=>{
    sFileName(file.name);
    const ext=file.name.split(".").pop()?.toLowerCase()||"";
    if(ext==="xlsx"||ext==="xls"){
      const XLSX=await import("xlsx");
      const buf=await file.arrayBuffer();
      const wb=XLSX.read(buf,{type:"array"});
      const ws=wb.Sheets[wb.SheetNames[0]];
      const raw:string[][]=XLSX.utils.sheet_to_json(ws,{header:1,defval:""});
      if(raw.length<2){sStatus("Archivo vacío");return;}
      const header=raw[0].map(String);
      const data=raw.slice(1).map(r=>r.map(String));
      processData(header,data);
    }else{
      const reader=new FileReader();
      reader.onload=(e)=>{
        const text=e.target?.result as string;
        if(!text){sStatus("Archivo vacío");return;}
        const lines=text.trim().split("\n").filter(l=>l.trim());
        if(lines.length===0){sStatus("Archivo vacío");return;}
        const sep=lines[0].includes("\t")?"\t":(lines[0].includes(";")?";":",");
        const first=lines[0].split(sep);
        const firstLow=first.map(s=>s.toLowerCase().trim());
        const isHeader=firstLow.some(s=>HEADER_MAP[s.replace(/[*#]/g,"")]!==undefined);
        if(isHeader){
          processData(first,lines.slice(1).map(l=>l.split(sep)));
        }else{
          processData(null,lines.map(l=>l.split(sep)));
        }
      };
      reader.readAsText(file);
    }
  };

  const updRow=(i:number,field:string,val:string)=>{
    sRows(prev=>prev.map((r,j)=>j===i?{...r,[field]:val,_err:false}:r));
  };
  const addRow=()=>sRows(prev=>[...prev,emptyRow()]);
  const delRow=(i:number)=>sRows(prev=>prev.filter((_,j)=>j!==i));

  const validRows=rows.filter(r=>r.first_name.trim()||r.last_name.trim());

  const handleSave=async()=>{
    if(validRows.length===0) return;
    sSaving(true);
    await onSave(validRows.map(r=>({
      last_name:r.last_name.trim(),first_name:r.first_name.trim(),
      birth_date:r.birth_date||undefined,dni:r.dni,categoria:r.categoria,sexo:r.sexo,
      obra_social:r.obra_social,peso:r.peso?+r.peso:null,estatura:r.estatura?+r.estatura:null,
      position:r.position,email:r.email,tel_emergencia:r.tel_emergencia,celular:r.celular,
      ult_fichaje:r.ult_fichaje||undefined,division:DEP_DIV[0],
    })));
    sSaving(false);
  };

  const inputSt:any={width:"100%",padding:"5px 6px",borderRadius:6,border:"1px solid "+T.g3,fontSize:10,boxSizing:"border-box" as const};

  return <div>
    <Btn v="g" s="s" onClick={onCancel} style={{marginBottom:12}}>← Cancelar</Btn>
    <h2 style={{fontSize:16,color:T.nv,margin:"0 0 14px"}}>⚡ Carga rápida de jugadores</h2>

    {/* Upload zone — always visible when no rows loaded */}
    {rows.length===0?<Card style={{marginBottom:14}}>
      <h3 style={{margin:"0 0 8px",fontSize:13,color:T.nv}}>Subí tu archivo Excel o CSV</h3>
      <p style={{fontSize:11,color:T.g5,margin:"0 0 4px"}}>Se reconocen automáticamente las columnas por nombre de encabezado.</p>
      <p style={{fontSize:10,color:T.g4,margin:"0 0 12px"}}>Formatos: .xlsx, .csv, .txt — Columnas posibles: {BULK_HEADERS.join(", ")}</p>
      <div style={{border:"2px dashed "+T.g3,borderRadius:12,padding:40,textAlign:"center" as const,cursor:"pointer",background:T.g1,transition:"border-color .2s"}}
        onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor=T.nv;}}
        onDragLeave={e=>{e.currentTarget.style.borderColor=T.g3;}}
        onDrop={e=>{e.preventDefault();e.currentTarget.style.borderColor=T.g3;const f=e.dataTransfer.files[0];if(f) handleFile(f);}}
        onClick={()=>{const inp=document.createElement("input");inp.type="file";inp.accept=".xlsx,.xls,.csv,.txt,.tsv";inp.onchange=(ev:any)=>{const f=ev.target.files?.[0];if(f) handleFile(f);};inp.click();}}>
        <div style={{fontSize:40,marginBottom:8}}>📄</div>
        <div style={{fontSize:14,fontWeight:700,color:T.nv}}>Arrastrá o hacé click para subir</div>
        <div style={{fontSize:11,color:T.g4,marginTop:6}}>.xlsx, .csv, .txt</div>
      </div>
      {status&&<p style={{fontSize:11,color:T.g5,marginTop:8,textAlign:"center" as const}}>{status}</p>}
      <div style={{textAlign:"center" as const,marginTop:16}}>
        <span style={{fontSize:11,color:T.g4}}>— o —</span>
      </div>
      <div style={{display:"flex",justifyContent:"center",marginTop:8}}>
        <Btn v="g" s="s" onClick={()=>sRows(Array.from({length:3},emptyRow))}>Cargar manualmente</Btn>
      </div>
    </Card>

    /* Table view — after file loaded or manual entry */
    :<Card>
      {fileName&&<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <span style={{fontSize:12,color:T.nv,fontWeight:600}}>📄 {fileName}</span>
        {status&&<span style={{fontSize:11,color:T.gn}}>{status}</span>}
        <Btn v="g" s="s" onClick={()=>{sRows([]);sFileName("");sStatus("");}}>Cambiar archivo</Btn>
      </div>}
      <div style={{overflowX:"auto" as const}}>
        <table style={{borderCollapse:"collapse" as const,fontSize:10,minWidth:900}}>
          <thead><tr style={{borderBottom:"2px solid "+T.g2}}>
            <th style={{textAlign:"left" as const,padding:"4px 3px",color:T.g5,fontWeight:700,width:24}}>#</th>
            {BULK_HEADERS.map((h,i)=><th key={i} style={{textAlign:"left" as const,padding:"4px 3px",color:T.g5,fontWeight:700,fontSize:9,whiteSpace:"nowrap" as const}}>{h}</th>)}
            <th style={{padding:"4px 3px",width:20}}></th>
          </tr></thead>
          <tbody>{rows.map((r,i)=><tr key={i} style={{borderBottom:"1px solid "+T.g1,background:r._err?"#FEF2F2":"transparent"}}>
            <td style={{padding:"3px",color:T.g4,fontSize:9}}>{i+1}</td>
            {BULK_COLS.map(k=><td key={k} style={{padding:"3px"}}><input value={(r as any)[k]||""} onChange={e=>updRow(i,k,e.target.value)} style={inputSt}/></td>)}
            <td style={{padding:"3px",textAlign:"center" as const}}><button onClick={()=>delRow(i)} style={{background:"none",border:"none",cursor:"pointer",color:T.rd,fontSize:13,padding:1}}>×</button></td>
          </tr>)}</tbody>
        </table>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:12}}>
        <Btn v="g" s="s" onClick={addRow}>+ Fila</Btn>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <span style={{fontSize:11,color:T.g5}}>{validRows.length} jugador{validRows.length!==1?"es":""} válido{validRows.length!==1?"s":""}</span>
          <Btn v="p" onClick={handleSave} disabled={validRows.length===0||saving}>{saving?"Guardando...":"Guardar "+validRows.length+" jugadores"}</Btn>
          <Btn v="g" onClick={onCancel}>Cancelar</Btn>
        </div>
      </div>
    </Card>}
  </div>;
}

/* ══════════════════════════ ATHLETE FORM ══════════════════════════ */
function AthleteForm({onSave,onCancel,mob}:any){
  const [f,sF]=useState({last_name:"",first_name:"",birth_date:"",dni:"",categoria:"",sexo:"",obra_social:"",peso:"" as string|number,estatura:"" as string|number,position:"",email:"",tel_emergencia:"",celular:"",ult_fichaje:"",division:DEP_DIV[0],phone:"",emergency_contact:{name:"",phone:"",relation:""},medical_info:{blood_type:"",allergies:"",conditions:""}});
  const inp=(l:string,k:string,opts?:{type?:string;step?:string})=><div key={k}><label style={{fontSize:11,fontWeight:600,color:T.g5}}>{l}</label><input type={opts?.type||"text"} step={opts?.step} value={(f as any)[k]||""} onChange={e=>sF(prev=>({...prev,[k]:e.target.value}))} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:3}}/></div>;
  return <div>
    <Btn v="g" s="s" onClick={onCancel} style={{marginBottom:12}}>← Cancelar</Btn>
    <h2 style={{fontSize:16,color:T.nv,margin:"0 0 14px"}}>+ Nuevo Jugador</h2>
    <Card>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:10}}>
        {inp("Apellido *","last_name")}
        {inp("Nombre *","first_name")}
        {inp("Fecha Nac.","birth_date",{type:"date"})}
        {inp("Documento","dni")}
        {inp("Categoría","categoria")}
        <div><label style={{fontSize:11,fontWeight:600,color:T.g5}}>Sexo</label><select value={f.sexo} onChange={e=>sF(prev=>({...prev,sexo:e.target.value}))} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,marginTop:3}}><option value="">–</option><option value="M">M</option><option value="F">F</option></select></div>
        {inp("O. Social","obra_social")}
        {inp("Peso (kg)","peso",{type:"number",step:"0.1"})}
        {inp("Estatura (cm)","estatura",{type:"number",step:"0.1"})}
        <div><label style={{fontSize:11,fontWeight:600,color:T.g5}}>Puesto</label><select value={f.position} onChange={e=>sF(prev=>({...prev,position:e.target.value}))} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,marginTop:3}}><option value="">Seleccionar...</option>{DEP_POSITIONS.map(p=><option key={p} value={p}>{p}</option>)}</select></div>
        {inp("Email","email",{type:"email"})}
        {inp("Tel. Emergencia","tel_emergencia")}
        {inp("Celular","celular")}
        {inp("Últ. Fichaje","ult_fichaje",{type:"date"})}
      </div>
      <div style={{display:"flex",gap:8,marginTop:14}}>
        <Btn v="p" onClick={()=>onSave({...f,peso:f.peso?+f.peso:null,estatura:f.estatura?+f.estatura:null})} disabled={!f.first_name||!f.last_name}>💾 Guardar</Btn>
        <Btn v="g" onClick={onCancel}>Cancelar</Btn>
      </div>
    </Card>
  </div>;
}

/* ══════════════════════════ INJURIES LIST ══════════════════════════ */
function InjuriesList({injuries,filteredAthletes,onSelect,onNew,mob,divF}:any){
  const [stF,sStF]=useState("activa");
  const athIds=new Set(filteredAthletes.map((a:DepAthlete)=>a.id));
  const filtered=injuries.filter((i:DepInjury)=>{
    if(divF!=="all"&&!athIds.has(i.athlete_id)) return false;
    if(stF!=="all"&&i.status!==stF) return false;
    return true;
  });
  const activas=injuries.filter((i:DepInjury)=>i.status==="activa"&&(divF==="all"||athIds.has(i.athlete_id))).length;
  const recup=injuries.filter((i:DepInjury)=>i.status==="recuperacion"&&(divF==="all"||athIds.has(i.athlete_id))).length;

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <h2 style={{margin:0,fontSize:18,color:T.nv}}>🩹 Lesiones</h2>
      {onNew&&<Btn v="r" s="s" onClick={onNew}>+ Nueva lesión</Btn>}
    </div>
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(3,1fr)",gap:10,marginBottom:14}}>
      <Card style={{textAlign:"center",padding:12}}><div style={{fontSize:20,fontWeight:800,color:T.rd}}>{activas}</div><div style={{fontSize:10,color:T.g5}}>Activas</div></Card>
      <Card style={{textAlign:"center",padding:12}}><div style={{fontSize:20,fontWeight:800,color:T.yl}}>{recup}</div><div style={{fontSize:10,color:T.g5}}>Recuperación</div></Card>
      {!mob&&<Card style={{textAlign:"center",padding:12}}><div style={{fontSize:20,fontWeight:800,color:T.gn}}>{injuries.filter((i:DepInjury)=>i.status==="alta").length}</div><div style={{fontSize:10,color:T.g5}}>Dadas de alta</div></Card>}
    </div>
    <div style={{display:"flex",gap:4,marginBottom:14}}>
      {[{k:"activa",l:"Activas"},{k:"recuperacion",l:"Recuperación"},{k:"alta",l:"Altas"},{k:"all",l:"Todas"}].map(f=>
        <button key={f.k} onClick={()=>sStF(f.k)} style={{padding:"5px 12px",borderRadius:16,border:stF===f.k?"2px solid "+T.nv:"1px solid "+T.g3,background:stF===f.k?T.nv+"10":"#fff",color:stF===f.k?T.nv:T.g5,fontSize:11,fontWeight:600,cursor:"pointer"}}>{f.l}</button>
      )}
    </div>
    <div style={{display:"flex",flexDirection:"column" as const,gap:8}}>
      {filtered.map((inj:DepInjury)=>{
        const sv=DEP_INJ_SEV[inj.severity];
        return <Card key={inj.id} onClick={()=>onSelect(inj)} style={{cursor:"pointer"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:T.nv}}>{inj.athlete_name}</div>
              <div style={{fontSize:12,color:T.g5}}>{inj.type} - {inj.zone}{inj.muscle?" ("+inj.muscle+")":""}</div>
              <div style={{fontSize:10,color:T.g4,marginTop:2}}>{fmtD(inj.date_injury)}{inj.description?" · "+inj.description.slice(0,50):""}</div>
            </div>
            <div style={{display:"flex",gap:4,alignItems:"center"}}>
              <span style={{background:sv?.bg,color:sv?.c,padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:700}}>{sv?.l}</span>
              <span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:inj.status==="alta"?"#D1FAE5":inj.status==="recuperacion"?"#FEF3C7":"#FEE2E2",color:inj.status==="alta"?T.gn:inj.status==="recuperacion"?T.yl:T.rd,fontWeight:600}}>{inj.status==="alta"?"Alta":inj.status==="recuperacion"?"Recup.":"Activa"}</span>
            </div>
          </div>
        </Card>;
      })}
      {filtered.length===0&&<Card style={{textAlign:"center",padding:24,color:T.g4}}><div style={{fontSize:24}}>🩹</div><div style={{marginTop:6,fontSize:12}}>No hay lesiones con ese filtro</div></Card>}
    </div>
  </div>;
}

/* ══════════════════════════ INJURY DETAIL ══════════════════════════ */
function InjuryDetail({inj,onBack,onUpdate,mob}:any){
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

/* ══════════════════════════ INJURY FORM ══════════════════════════ */
function InjuryForm({athletes,onSave,onCancel,mob}:any){
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

/* ══════════════════════════ WELLNESS TAB ══════════════════════════ */
function WellnessTab({athletes,checkins,onAdd,mob}:any){
  const [mode,sMode]=useState<"view"|"input">("view");
  const [dateF,sDateF]=useState(TODAY);
  const [curAth,sCurAth]=useState(0);
  const [vals,sVals]=useState({sleep:3,fatigue:3,stress:3,soreness:3,mood:3,notes:""});

  const dayCheckins=checkins.filter((c:DepCheckin)=>c.date===dateF);
  const checkedIds=new Set(dayCheckins.map((c:DepCheckin)=>c.athlete_id));
  const unchecked=athletes.filter((a:DepAthlete)=>!checkedIds.has(a.id));

  const startInput=(athId:number)=>{
    const existing=dayCheckins.find((c:DepCheckin)=>c.athlete_id===athId);
    if(existing) sVals({sleep:existing.sleep,fatigue:existing.fatigue,stress:existing.stress,soreness:existing.soreness,mood:existing.mood,notes:existing.notes});
    else sVals({sleep:3,fatigue:3,stress:3,soreness:3,mood:3,notes:""});
    sCurAth(athId);sMode("input");
  };

  const saveAndNext=()=>{
    if(!onAdd) return;
    onAdd({athlete_id:curAth,date:dateF,...vals});
    // Auto next unchecked
    const nextIdx=unchecked.findIndex((a:DepAthlete)=>a.id===curAth);
    const next=unchecked[nextIdx+1];
    if(next){sCurAth(next.id);sVals({sleep:3,fatigue:3,stress:3,soreness:3,mood:3,notes:""});}
    else sMode("view");
  };

  if(mode==="input"){
    const ath=athletes.find((a:DepAthlete)=>a.id===curAth);
    return <div>
      <Btn v="g" s="s" onClick={()=>sMode("view")} style={{marginBottom:12}}>← Volver</Btn>
      <Card>
        <h3 style={{margin:"0 0 4px",fontSize:14,color:T.nv}}>Check-in: {ath?.first_name} {ath?.last_name}</h3>
        <div style={{fontSize:11,color:T.g5,marginBottom:14}}>{ath?.division} · {fmtD(dateF)}</div>
        {WK_KEYS.map(k=>{
          const cfg=DEP_WK[k];const v=(vals as any)[k];
          return <div key={k} style={{marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <span style={{fontSize:12,fontWeight:600,color:T.nv}}>{cfg.i} {cfg.l}</span>
              <span style={{fontSize:12,fontWeight:700,color:v>=4?T.gn:v>=3?T.yl:T.rd}}>{v} - {cfg.labels[v-1]}</span>
            </div>
            <div style={{display:"flex",gap:6}}>
              {[1,2,3,4,5].map(n=><button key={n} onClick={()=>sVals(prev=>({...prev,[k]:n}))} style={{flex:1,padding:"10px 0",borderRadius:8,border:(vals as any)[k]===n?"2px solid "+T.nv:"1px solid "+T.g3,background:(vals as any)[k]===n?T.nv:"#fff",color:(vals as any)[k]===n?"#fff":T.g5,fontSize:14,fontWeight:700,cursor:"pointer"}}>{n}</button>)}
            </div>
          </div>;
        })}
        <div style={{marginBottom:10}}><label style={{fontSize:11,fontWeight:600,color:T.g5}}>Notas</label><textarea value={vals.notes} onChange={e=>sVals(prev=>({...prev,notes:e.target.value}))} rows={2} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,resize:"vertical" as const,boxSizing:"border-box" as const,marginTop:3}}/></div>
        <div style={{display:"flex",gap:8}}>
          <Btn v="s" onClick={saveAndNext}>💾 Guardar{unchecked.length>1?" y siguiente":""}</Btn>
          <Btn v="g" onClick={()=>sMode("view")}>Cancelar</Btn>
        </div>
      </Card>
    </div>;
  }

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <h2 style={{margin:0,fontSize:18,color:T.nv}}>💚 Wellness</h2>
      <input type="date" value={dateF} onChange={e=>sDateF(e.target.value)} style={{padding:"6px 10px",borderRadius:8,border:"1px solid "+T.g3,fontSize:12}}/>
    </div>

    {/* Summary */}
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(3,1fr)",gap:10,marginBottom:14}}>
      <Card style={{textAlign:"center",padding:12}}><div style={{fontSize:20,fontWeight:800,color:T.gn}}>{dayCheckins.length}</div><div style={{fontSize:10,color:T.g5}}>Registrados</div></Card>
      <Card style={{textAlign:"center",padding:12}}><div style={{fontSize:20,fontWeight:800,color:T.yl}}>{unchecked.length}</div><div style={{fontSize:10,color:T.g5}}>Pendientes</div></Card>
      {!mob&&<Card style={{textAlign:"center",padding:12}}><div style={{fontSize:20,fontWeight:800,color:T.bl}}>{athletes.length}</div><div style={{fontSize:10,color:T.g5}}>Total plantel</div></Card>}
    </div>

    {/* Batch start */}
    {onAdd&&unchecked.length>0&&<Card style={{marginBottom:14,background:"#F0FDF4",border:"1px solid #BBF7D0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontSize:13,fontWeight:700,color:"#166534"}}>{unchecked.length} jugador{unchecked.length>1?"es":""} sin check-in</div><div style={{fontSize:11,color:"#15803D"}}>Completá los registros del día</div></div>
        <Btn v="s" onClick={()=>startInput(unchecked[0].id)}>▶ Iniciar</Btn>
      </div>
    </Card>}

    {/* Day grid */}
    {dayCheckins.length>0&&<Card>
      <h3 style={{margin:"0 0 10px",fontSize:13,color:T.nv}}>Registros del {fmtD(dateF)}</h3>
      <div style={{overflowX:"auto" as const}}>
        <table style={{width:"100%",borderCollapse:"collapse" as const,fontSize:11}}>
          <thead><tr style={{borderBottom:"2px solid "+T.g2}}>
            <th style={{textAlign:"left" as const,padding:"6px 8px",color:T.g5,fontWeight:700}}>Jugador</th>
            {WK_KEYS.map(k=><th key={k} style={{textAlign:"center" as const,padding:"6px 4px",color:T.g5,fontWeight:700}}>{DEP_WK[k].i}</th>)}
            <th style={{textAlign:"center" as const,padding:"6px 4px",color:T.g5,fontWeight:700}}>Score</th>
          </tr></thead>
          <tbody>{dayCheckins.map((c:DepCheckin)=>{
            const sem=semScore(c);
            return <tr key={c.id} onClick={()=>{if(onAdd) startInput(c.athlete_id);}} style={{borderBottom:"1px solid "+T.g1,cursor:onAdd?"pointer":"default"}}>
              <td style={{padding:"6px 8px",fontWeight:600,color:T.nv}}>{c.athlete_name}</td>
              {WK_KEYS.map(k=>{const v=(c as any)[k];return<td key={k} style={{textAlign:"center" as const,padding:"6px 4px",fontWeight:700,color:v>=4?T.gn:v>=3?T.yl:T.rd}}>{v}</td>;})}
              <td style={{textAlign:"center" as const,padding:"6px 4px"}}><span style={{background:sem.bg,color:sem.color,padding:"2px 8px",borderRadius:10,fontWeight:700}}>{sem.score.toFixed(1)}</span></td>
            </tr>;
          })}</tbody>
        </table>
      </div>
    </Card>}

    {/* Unchecked list */}
    {unchecked.length>0&&onAdd&&<div style={{marginTop:14}}>
      <h3 style={{fontSize:13,color:T.g5,margin:"0 0 8px"}}>Pendientes de check-in</h3>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:6}}>
        {unchecked.map((a:DepAthlete)=><div key={a.id} onClick={()=>startInput(a.id)} style={{padding:"8px 12px",background:"#fff",borderRadius:8,border:"1px solid "+T.g3,cursor:"pointer",fontSize:12,fontWeight:600,color:T.nv}}>{a.last_name}, {a.first_name} <span style={{color:T.g4,fontWeight:400}}>({a.division})</span></div>)}
      </div>
    </div>}

    {dayCheckins.length===0&&unchecked.length===0&&<Card style={{textAlign:"center",padding:24,color:T.g4}}><div style={{fontSize:24}}>💚</div><div style={{marginTop:6,fontSize:12}}>No hay jugadores para mostrar</div></Card>}
  </div>;
}

/* ══════════════════════════ TRAINING TAB ══════════════════════════ */
const TRAIN_TYPES=["Entrenamiento","Gimnasio","Técnico","Táctico","Regenerativo","Partido amistoso"];
function TrainingTab({athletes,division,canCreate,userId,mob,showT}:any){
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

/* ══════════════════════════ STAFF TAB ══════════════════════════ */
function PerfilesTab({staffList,onUpdate,onDel,mob,showT,fetchAll}:any){
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

/* ══════════════════════════ PLANIFICACIÓN TAB ══════════════════════════ */
function PlanificacionTab({seasons,phases,microcycles,onAddSeason,onUpdSeason,onDelSeason,onAddPhase,onUpdPhase,onDelPhase,onAddMicro,onUpdMicro,onDelMicro,canEdit,mob}:any){
  const{colors,isDark,cardBg}=useC();
  const [selSeason,sSelSeason]=useState<number|null>(null);
  const [showAddSeason,sShowAddSeason]=useState(false);
  const [showAddPhase,sShowAddPhase]=useState(false);
  const [selPhase,sSelPhase]=useState<number|null>(null);
  const [showAddMicro,sShowAddMicro]=useState(false);
  const [sf,sSf]=useState({name:"",start_date:"",end_date:"",objectives:"",status:"planificada"});
  const [pf,sPf]=useState({name:"",type:"pretemporada" as string,start_date:"",end_date:"",objectives:"",color:"#C8102E"});
  const [mf,sMf]=useState({week_number:1,week_start:"",focus:"",intensity:5,notes:""});

  const sea=selSeason?seasons.find((s:any)=>s.id===selSeason):null;
  const seaPhases=phases.filter((p:any)=>p.season_id===selSeason).sort((a:any,b:any)=>a.sort_order-b.sort_order);
  const ph=selPhase?phases.find((p:any)=>p.id===selPhase):null;
  const phMicros=microcycles.filter((m:any)=>m.phase_id===selPhase).sort((a:any,b:any)=>a.week_number-b.week_number);

  /* ── Phase detail + microcycles ── */
  if(ph&&selSeason){
    const pt=DEP_PHASE_TYPES[ph.type]||DEP_PHASE_TYPES.pretemporada;
    return <div>
      <Btn v="g" s="s" onClick={()=>sSelPhase(null)} style={{marginBottom:12}}>← Volver a entrenamiento</Btn>
      <Card style={{marginBottom:14,borderLeft:"4px solid "+pt.c}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <h3 style={{margin:0,fontSize:16,color:colors.nv}}>{pt.i} {ph.name}</h3>
            <div style={{fontSize:11,color:colors.g5}}>{pt.l} · {fmtD(ph.start_date)} → {fmtD(ph.end_date)}</div>
            {ph.objectives&&<div style={{fontSize:12,color:colors.g5,marginTop:4}}>{ph.objectives}</div>}
          </div>
          {canEdit&&<Btn v="r" s="s" onClick={()=>{if(confirm("¿Eliminar fase y sus microciclos?"))onDelPhase(ph.id);}}>Eliminar</Btn>}
        </div>
      </Card>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <h3 style={{margin:0,fontSize:14,color:colors.nv}}>Microciclos ({phMicros.length})</h3>
        {canEdit&&<Btn v="p" s="s" onClick={()=>{sMf({week_number:phMicros.length+1,week_start:"",focus:"",intensity:5,notes:""});sShowAddMicro(!showAddMicro);}}>+ Microciclo</Btn>}
      </div>

      {showAddMicro&&canEdit&&<Card style={{marginBottom:14,background:isDark?colors.g2:"#FFFBEB",border:"1px solid "+(isDark?colors.g3:"#FDE68A")}}>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:10}}>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Semana #</label><input type="number" value={mf.week_number} onChange={e=>sMf(p=>({...p,week_number:+e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Inicio semana</label><input type="date" value={mf.week_start} onChange={e=>sMf(p=>({...p,week_start:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Foco</label><input value={mf.focus} onChange={e=>sMf(p=>({...p,focus:e.target.value}))} placeholder="Ej: Fuerza máxima" style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Intensidad (1-10): {mf.intensity}</label><input type="range" min={1} max={10} value={mf.intensity} onChange={e=>sMf(p=>({...p,intensity:+e.target.value}))} style={{width:"100%",marginTop:6}}/></div>
          <div style={{gridColumn:mob?"1":"1 / -1"}}><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Notas</label><textarea value={mf.notes} onChange={e=>sMf(p=>({...p,notes:e.target.value}))} rows={2} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:12,resize:"vertical" as const,boxSizing:"border-box" as const,marginTop:2}}/></div>
        </div>
        <div style={{display:"flex",gap:8,marginTop:10}}><Btn v="p" onClick={()=>{onAddMicro({phase_id:ph.id,...mf});sShowAddMicro(false);}} disabled={!mf.week_start}>Crear</Btn><Btn v="g" onClick={()=>sShowAddMicro(false)}>Cancelar</Btn></div>
      </Card>}

      {phMicros.length===0&&<Card style={{textAlign:"center",padding:24,color:colors.g4}}><div style={{fontSize:24}}>📅</div><div style={{marginTop:6,fontSize:12}}>Sin microciclos. Agregá el primero.</div></Card>}
      <div style={{display:"flex",flexDirection:"column" as const,gap:8}}>
        {phMicros.map((m:any)=>{
          const intColor=m.intensity<=3?T.gn:m.intensity<=6?T.yl:m.intensity<=8?"#F97316":T.rd;
          return <Card key={m.id}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{background:intColor+"20",color:intColor,padding:"2px 10px",borderRadius:10,fontSize:11,fontWeight:700}}>S{m.week_number}</span>
                  <span style={{fontSize:13,fontWeight:700,color:colors.nv}}>{m.focus||"Sin foco"}</span>
                </div>
                <div style={{fontSize:11,color:colors.g5,marginTop:4}}>Semana del {fmtD(m.week_start)} · Intensidad: {m.intensity}/10</div>
                {m.notes&&<div style={{fontSize:11,color:colors.g4,marginTop:2}}>{m.notes}</div>}
              </div>
              <div style={{width:40,height:40,borderRadius:20,background:intColor+"15",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:14,fontWeight:800,color:intColor}}>{m.intensity}</span>
              </div>
            </div>
            {canEdit&&<div style={{display:"flex",gap:4,marginTop:8}}><Btn v="r" s="s" onClick={()=>{if(confirm("¿Eliminar microciclo?"))onDelMicro(m.id);}}>Eliminar</Btn></div>}
          </Card>;
        })}
      </div>

      {/* Intensity chart */}
      {phMicros.length>1&&<Card style={{marginTop:14}}>
        <h4 style={{margin:"0 0 8px",fontSize:12,color:colors.nv}}>📈 Curva de intensidad</h4>
        <div style={{display:"flex",gap:2,alignItems:"flex-end",height:60}}>
          {phMicros.map((m:any)=>{
            const intColor=m.intensity<=3?T.gn:m.intensity<=6?T.yl:m.intensity<=8?"#F97316":T.rd;
            return <div key={m.id} style={{flex:1,height:(m.intensity/10)*100+"%",background:intColor,borderRadius:3,minWidth:8}} title={"S"+m.week_number+": "+m.intensity+"/10"}/>;
          })}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}><span style={{fontSize:9,color:colors.g4}}>S{phMicros[0]?.week_number}</span><span style={{fontSize:9,color:colors.g4}}>S{phMicros[phMicros.length-1]?.week_number}</span></div>
      </Card>}
    </div>;
  }

  /* ── Season detail + phases ── */
  if(sea){
    const stCol=sea.status==="activa"?T.gn:sea.status==="finalizada"?T.g4:T.bl;
    return <div>
      <Btn v="g" s="s" onClick={()=>sSelSeason(null)} style={{marginBottom:12}}>← Volver</Btn>
      <Card style={{marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <h2 style={{margin:0,fontSize:18,color:colors.nv}}>{sea.name}</h2>
            <div style={{fontSize:11,color:colors.g5}}>{fmtD(sea.start_date)} → {fmtD(sea.end_date)} · <span style={{color:stCol,fontWeight:700}}>{sea.status}</span></div>
            {sea.objectives&&<div style={{fontSize:12,color:colors.g5,marginTop:4}}>{sea.objectives}</div>}
          </div>
          {canEdit&&<div style={{display:"flex",gap:4}}>
            <Btn v="g" s="s" onClick={()=>onUpdSeason(sea.id,{status:sea.status==="planificada"?"activa":sea.status==="activa"?"finalizada":"planificada"})}>{sea.status==="planificada"?"Activar":sea.status==="activa"?"Finalizar":"Reactivar"}</Btn>
            <Btn v="r" s="s" onClick={()=>{if(confirm("¿Eliminar entrenamiento y todo su contenido?"))onDelSeason(sea.id);}}>Eliminar</Btn>
          </div>}
        </div>
      </Card>

      {/* Timeline visual */}
      {seaPhases.length>0&&<Card style={{marginBottom:14}}>
        <h3 style={{margin:"0 0 10px",fontSize:13,color:colors.nv}}>Timeline</h3>
        <div style={{display:"flex",gap:2,borderRadius:8,overflow:"hidden",height:28}}>
          {seaPhases.map((p:any)=>{
            const seaStart=new Date(sea.start_date).getTime(),seaEnd=new Date(sea.end_date).getTime();
            const pStart=new Date(p.start_date).getTime(),pEnd=new Date(p.end_date).getTime();
            const totalDays=(seaEnd-seaStart)||1;
            const w=Math.max(((pEnd-pStart)/totalDays)*100,5);
            const pt=DEP_PHASE_TYPES[p.type]||DEP_PHASE_TYPES.pretemporada;
            return <div key={p.id} onClick={()=>sSelPhase(p.id)} style={{width:w+"%",background:p.color||pt.c,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",minWidth:24}} title={p.name+": "+fmtD(p.start_date)+" → "+fmtD(p.end_date)}>
              <span style={{fontSize:mob?8:9,color:"#fff",fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,padding:"0 4px"}}>{p.name}</span>
            </div>;
          })}
        </div>
      </Card>}

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <h3 style={{margin:0,fontSize:14,color:colors.nv}}>Fases ({seaPhases.length})</h3>
        {canEdit&&<Btn v="p" s="s" onClick={()=>{sPf({name:"",type:"pretemporada",start_date:sea.start_date,end_date:sea.end_date,objectives:"",color:"#C8102E"});sShowAddPhase(!showAddPhase);}}>+ Fase</Btn>}
      </div>

      {showAddPhase&&canEdit&&<Card style={{marginBottom:14,background:cardBg,border:"1px solid "+colors.g3}}>
        <h4 style={{margin:"0 0 10px",fontSize:12,color:colors.nv}}>Nueva fase</h4>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:10}}>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Nombre</label><input value={pf.name} onChange={e=>sPf(p=>({...p,name:e.target.value}))} placeholder="Ej: Pretemporada I" style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Tipo</label><select value={pf.type} onChange={e=>sPf(p=>({...p,type:e.target.value,color:DEP_PHASE_TYPES[e.target.value]?.c||"#3B82F6"}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:12,marginTop:2}}>{Object.entries(DEP_PHASE_TYPES).map(([k,v])=><option key={k} value={k}>{(v as any).i} {(v as any).l}</option>)}</select></div>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Inicio</label><input type="date" value={pf.start_date} onChange={e=>sPf(p=>({...p,start_date:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Fin</label><input type="date" value={pf.end_date} onChange={e=>sPf(p=>({...p,end_date:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
          <div style={{gridColumn:mob?"1":"1 / -1"}}><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Objetivos</label><textarea value={pf.objectives} onChange={e=>sPf(p=>({...p,objectives:e.target.value}))} rows={2} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:12,resize:"vertical" as const,boxSizing:"border-box" as const,marginTop:2}}/></div>
        </div>
        <div style={{display:"flex",gap:8,marginTop:10}}><Btn v="p" onClick={()=>{onAddPhase({season_id:sea.id,...pf,sort_order:seaPhases.length});sShowAddPhase(false);}} disabled={!pf.name||!pf.start_date||!pf.end_date}>Crear</Btn><Btn v="g" onClick={()=>sShowAddPhase(false)}>Cancelar</Btn></div>
      </Card>}

      <div style={{display:"flex",flexDirection:"column" as const,gap:8}}>
        {seaPhases.map((p:any)=>{
          const pt=DEP_PHASE_TYPES[p.type]||DEP_PHASE_TYPES.pretemporada;
          const pMicros=microcycles.filter((m:any)=>m.phase_id===p.id);
          return <Card key={p.id} onClick={()=>sSelPhase(p.id)} style={{cursor:"pointer",borderLeft:"4px solid "+(p.color||pt.c)}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:colors.nv}}>{pt.i} {p.name}</div>
                <div style={{fontSize:11,color:colors.g5}}>{pt.l} · {fmtD(p.start_date)} → {fmtD(p.end_date)}</div>
                {p.objectives&&<div style={{fontSize:11,color:colors.g4,marginTop:2}}>{p.objectives.slice(0,80)}</div>}
              </div>
              <div style={{textAlign:"center" as const}}>
                <div style={{fontSize:16,fontWeight:800,color:p.color||pt.c}}>{pMicros.length}</div>
                <div style={{fontSize:9,color:colors.g5}}>semanas</div>
              </div>
            </div>
          </Card>;
        })}
        {seaPhases.length===0&&<Card style={{textAlign:"center",padding:24,color:colors.g4}}><div style={{fontSize:24}}>📅</div><div style={{marginTop:6,fontSize:12}}>Sin fases. Agregá la primera.</div></Card>}
      </div>
    </div>;
  }

  /* ── Seasons list ── */
  const activeSea=seasons.filter((s:any)=>s.status==="activa");
  const otherSea=seasons.filter((s:any)=>s.status!=="activa");

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <h2 style={{margin:0,fontSize:18,color:colors.nv}}>📅 Planificación</h2>
      {canEdit&&<Btn v="p" s="s" onClick={()=>sShowAddSeason(!showAddSeason)}>+ Entrenamiento</Btn>}
    </div>

    {showAddSeason&&canEdit&&<Card style={{marginBottom:14,background:cardBg,border:"1px solid "+colors.g3}}>
      <h3 style={{margin:"0 0 10px",fontSize:13,color:colors.nv}}>Nuevo entrenamiento</h3>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:10}}>
        <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Nombre</label><input value={sf.name} onChange={e=>sSf(p=>({...p,name:e.target.value}))} placeholder="Ej: Martes Forwards" style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
        <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Fecha</label><input type="date" value={sf.start_date} onChange={e=>sSf(p=>({...p,start_date:e.target.value,end_date:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
      </div>

      {/* Bloques de actividades */}
      <div style={{marginTop:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <label style={{fontSize:11,fontWeight:700,color:colors.nv}}>Actividades</label>
          <button onClick={()=>sSf(p=>({...p,objectives:JSON.stringify([...(JSON.parse(p.objectives||"[]")),{actividad:"",responsable:"",tiempo:""}])}))} style={{background:colors.nv+"10",border:"1px solid "+colors.nv+"30",borderRadius:6,padding:"3px 10px",fontSize:10,fontWeight:600,color:colors.nv,cursor:"pointer"}}>+ Bloque</button>
        </div>
        {(()=>{let blocks:{actividad:string;responsable:string;tiempo:string}[]=[];try{blocks=JSON.parse(sf.objectives||"[]");}catch{blocks=[];}if(!Array.isArray(blocks))blocks=[];
        return blocks.length===0?<div style={{fontSize:11,color:colors.g4,padding:"8px 0"}}>Sin actividades aún. Agregá un bloque.</div>
        :<div style={{display:"flex",flexDirection:"column" as const,gap:6}}>
          {/* Header */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 60px 24px",gap:6,padding:"0 2px"}}>
            <span style={{fontSize:9,fontWeight:700,color:colors.g4,textTransform:"uppercase" as const}}>Actividad</span>
            <span style={{fontSize:9,fontWeight:700,color:colors.g4,textTransform:"uppercase" as const}}>Responsable</span>
            <span style={{fontSize:9,fontWeight:700,color:colors.g4,textTransform:"uppercase" as const}}>Tiempo</span>
            <span></span>
          </div>
          {blocks.map((b,i)=><div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 60px 24px",gap:6,alignItems:"center"}}>
            <input value={b.actividad} placeholder="Ej: Activación" onChange={e=>{const nb=[...blocks];nb[i]={...nb[i],actividad:e.target.value};sSf(p=>({...p,objectives:JSON.stringify(nb)}));}} style={{padding:6,borderRadius:6,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const}}/>
            <input value={b.responsable} placeholder="Ej: Nico" onChange={e=>{const nb=[...blocks];nb[i]={...nb[i],responsable:e.target.value};sSf(p=>({...p,objectives:JSON.stringify(nb)}));}} style={{padding:6,borderRadius:6,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const}}/>
            <input value={b.tiempo} placeholder="5'" onChange={e=>{const nb=[...blocks];nb[i]={...nb[i],tiempo:e.target.value};sSf(p=>({...p,objectives:JSON.stringify(nb)}));}} style={{padding:6,borderRadius:6,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,textAlign:"center" as const}}/>
            <button onClick={()=>{const nb=blocks.filter((_,j)=>j!==i);sSf(p=>({...p,objectives:JSON.stringify(nb)}));}} style={{background:"none",border:"none",color:T.rd,cursor:"pointer",fontSize:14,padding:0}}>×</button>
          </div>)}
          <div style={{fontSize:10,color:colors.g5,textAlign:"right" as const,marginTop:2}}>Total: {blocks.reduce((s,b)=>{const n=parseInt(b.tiempo)||0;return s+n;},0)} min</div>
        </div>;})()}
      </div>

      <div style={{display:"flex",gap:8,marginTop:12}}><Btn v="p" onClick={()=>{onAddSeason(sf);sShowAddSeason(false);sSf({name:"",start_date:"",end_date:"",objectives:"",status:"planificada"});}} disabled={!sf.name||!sf.start_date}>Crear</Btn><Btn v="g" onClick={()=>sShowAddSeason(false)}>Cancelar</Btn></div>
    </Card>}

    {activeSea.length>0&&<div style={{marginBottom:14}}>
      <h3 style={{fontSize:13,color:colors.nv,margin:"0 0 8px"}}>Entrenamientos activos</h3>
      {activeSea.map((s:any)=>{
        let blocks:{actividad:string;responsable:string;tiempo:string}[]=[];try{blocks=JSON.parse(s.objectives||"[]");}catch{blocks=[];}if(!Array.isArray(blocks))blocks=[];
        return <Card key={s.id} onClick={()=>sSelSeason(s.id)} style={{cursor:"pointer",borderLeft:"4px solid "+T.gn}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:700,color:colors.nv}}>{s.name}</div>
              <div style={{fontSize:11,color:colors.g5}}>{fmtD(s.start_date)}</div>
            </div>
            <span style={{background:"#D1FAE5",color:T.gn,padding:"4px 12px",borderRadius:12,fontSize:11,fontWeight:700}}>Activa</span>
          </div>
          {blocks.length>0&&<div style={{marginTop:8,borderTop:"1px solid "+colors.g2,paddingTop:8}}>
            {blocks.map((b,i)=><div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 50px",gap:6,fontSize:12,padding:"3px 0",borderBottom:i<blocks.length-1?"1px solid "+colors.g1:"none"}}>
              <span style={{fontWeight:600,color:colors.nv}}>{b.actividad}</span>
              <span style={{color:colors.g5}}>{b.responsable}</span>
              <span style={{color:colors.g4,textAlign:"right" as const,fontWeight:600}}>{b.tiempo}</span>
            </div>)}
            <div style={{fontSize:10,color:colors.g5,textAlign:"right" as const,marginTop:4,fontWeight:700}}>Total: {blocks.reduce((s,b)=>{const n=parseInt(b.tiempo)||0;return s+n;},0)} min</div>
          </div>}
        </Card>;
      })}
    </div>}

    {otherSea.length>0&&<div>
      <h3 style={{fontSize:13,color:colors.g5,margin:"0 0 8px"}}>Otros entrenamientos</h3>
      <div style={{display:"flex",flexDirection:"column" as const,gap:8}}>
        {otherSea.map((s:any)=>{
          let blocks:{actividad:string;responsable:string;tiempo:string}[]=[];try{blocks=JSON.parse(s.objectives||"[]");}catch{blocks=[];}if(!Array.isArray(blocks))blocks=[];
          const stCol=s.status==="finalizada"?T.g4:T.bl;
          return <Card key={s.id} onClick={()=>sSelSeason(s.id)} style={{cursor:"pointer"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:colors.nv}}>{s.name}</div>
                <div style={{fontSize:11,color:colors.g5}}>{fmtD(s.start_date)} · {blocks.length} actividades</div>
              </div>
              <span style={{color:stCol,fontSize:11,fontWeight:700}}>{s.status}</span>
            </div>
          </Card>;
        })}
      </div>
    </div>}

    {seasons.length===0&&<Card style={{textAlign:"center",padding:32,color:colors.g4}}><div style={{fontSize:32}}>📅</div><div style={{marginTop:8,fontSize:13}}>No hay temporadas creadas. Empezá creando una.</div></Card>}
  </div>;
}

/* ══════════════════════════ PRETEMPORADA TAB ══════════════════════════ */
function PretemporadaTab({athletes,tests,testTypes,onAddTest,onAddTestBatch,onDelTest,canEdit,mob}:any){
  const{colors,cardBg}=useC();
  const [mode,sMode]=useState<"overview"|"batch"|"history">("overview");
  const [selType,sSelType]=useState<number|null>(null);
  const [batchDate,sBatchDate]=useState(TODAY);
  const [batchType,sBatchType]=useState<number>(testTypes[0]?.id||0);
  const [batchVals,sBatchVals]=useState<Record<number,string>>({});

  const tt=selType?testTypes.find((t:any)=>t.id===selType):null;

  /* Group tests by category */
  const byCat:Record<string,any[]>={};
  testTypes.forEach((t:any)=>{if(!byCat[t.category])byCat[t.category]=[];byCat[t.category].push(t);});

  /* Latest test per athlete per type */
  const latestVal=(athId:number,typeId:number)=>{
    return tests.find((t:any)=>t.athlete_id===athId&&t.test_type_id===typeId);
  };

  /* Benchmark comparison */
  const benchColor=(val:number,tt:any)=>{
    if(!tt.benchmark_m19) return colors.g5;
    if(tt.higher_is_better){
      if(val>=tt.benchmark_m19) return T.gn;
      if(val>=tt.benchmark_m19*0.85) return T.yl;
      return T.rd;
    }else{
      if(val<=tt.benchmark_m19) return T.gn;
      if(val<=tt.benchmark_m19*1.15) return T.yl;
      return T.rd;
    }
  };

  /* ── Batch entry ── */
  if(mode==="batch"&&canEdit){
    const bType=testTypes.find((t:any)=>t.id===batchType);
    return <div>
      <Btn v="g" s="s" onClick={()=>sMode("overview")} style={{marginBottom:12}}>← Volver</Btn>
      <Card>
        <h3 style={{margin:"0 0 10px",fontSize:14,color:colors.nv}}>🏋️ Carga de tests en lote</h3>
        <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap" as const}}>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Test</label><select value={batchType} onChange={e=>{sBatchType(+e.target.value);sBatchVals({});}} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:12,marginTop:2}}>{testTypes.map((t:any)=><option key={t.id} value={t.id}>{t.name} ({t.unit})</option>)}</select></div>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Fecha</label><input type="date" value={batchDate} onChange={e=>sBatchDate(e.target.value)} style={{padding:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
        </div>
        {bType&&<div style={{fontSize:11,color:colors.g5,marginBottom:10}}>📏 Benchmark M19: {bType.benchmark_m19?bType.benchmark_m19+" "+bType.unit:"N/A"} {bType.higher_is_better===true?"(mayor = mejor)":bType.higher_is_better===false?"(menor = mejor)":""}</div>}
        <div style={{display:"flex",flexDirection:"column" as const,gap:4}}>
          {athletes.map((a:any)=>{
            const prev=latestVal(a.id,batchType);
            return <div key={a.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:6,border:"1px solid "+colors.g1}}>
              <div style={{flex:1,fontSize:12,fontWeight:600,color:colors.nv}}>{a.last_name}, {a.first_name}</div>
              {prev&&<span style={{fontSize:10,color:colors.g4}}>Anterior: {prev.value} {prev.test_unit}</span>}
              <input value={batchVals[a.id]||""} onChange={e=>sBatchVals(p=>({...p,[a.id]:e.target.value}))} placeholder={bType?.unit||"Valor"} type="number" step="0.1" style={{width:80,padding:"5px 8px",borderRadius:6,border:"1px solid "+colors.g3,fontSize:12,textAlign:"center" as const}}/>
            </div>;
          })}
        </div>
        <div style={{display:"flex",gap:8,marginTop:14,alignItems:"center"}}>
          <Btn v="p" onClick={()=>{
            const rows=Object.entries(batchVals).filter(([,v])=>v&&+v>0).map(([id,v])=>({athlete_id:+id,test_type_id:batchType,date:batchDate,value:+v}));
            if(rows.length===0) return;
            onAddTestBatch(rows);sBatchVals({});
          }} disabled={Object.values(batchVals).filter(v=>v&&+v>0).length===0}>💾 Guardar {Object.values(batchVals).filter(v=>v&&+v>0).length} tests</Btn>
          <Btn v="g" onClick={()=>sMode("overview")}>Cancelar</Btn>
        </div>
      </Card>
    </div>;
  }

  /* ── History view for a test type ── */
  if(mode==="history"&&tt){
    const typeTests=tests.filter((t:any)=>t.test_type_id===tt.id).sort((a:any,b:any)=>b.date.localeCompare(a.date));
    const dates:string[]=[...new Set<string>(typeTests.map((t:any)=>t.date))].slice(0,10);
    return <div>
      <Btn v="g" s="s" onClick={()=>{sMode("overview");sSelType(null);}} style={{marginBottom:12}}>← Volver</Btn>
      <Card style={{marginBottom:14}}>
        <h3 style={{margin:"0 0 4px",fontSize:15,color:colors.nv}}>{tt.name}</h3>
        <div style={{fontSize:11,color:colors.g5}}>{tt.description} · Unidad: {tt.unit} {tt.benchmark_m19?"· Benchmark M19: "+tt.benchmark_m19+" "+tt.unit:""}</div>
      </Card>

      {/* Comparison table */}
      <Card>
        <h4 style={{margin:"0 0 8px",fontSize:12,color:colors.nv}}>Historial por jugador</h4>
        <div style={{overflowX:"auto" as const}}>
          <table style={{width:"100%",borderCollapse:"collapse" as const,fontSize:11}}>
            <thead><tr style={{borderBottom:"2px solid "+colors.g2}}>
              <th style={{textAlign:"left" as const,padding:"6px 8px",color:colors.g5,fontWeight:700}}>Jugador</th>
              {dates.map(d=><th key={d} style={{textAlign:"center" as const,padding:"6px 4px",color:colors.g5,fontWeight:700,fontSize:9}}>{d.slice(5)}</th>)}
            </tr></thead>
            <tbody>{athletes.map((a:any)=>{
              const athTests=typeTests.filter((t:any)=>t.athlete_id===a.id);
              if(athTests.length===0) return null;
              return <tr key={a.id} style={{borderBottom:"1px solid "+colors.g1}}>
                <td style={{padding:"6px 8px",fontWeight:600,color:colors.nv,whiteSpace:"nowrap" as const}}>{a.last_name}</td>
                {dates.map(d=>{
                  const t=athTests.find((t:any)=>t.date===d);
                  return <td key={d} style={{textAlign:"center" as const,padding:"6px 4px",fontWeight:700,color:t?benchColor(t.value,tt):colors.g4}}>{t?t.value:"–"}</td>;
                })}
              </tr>;
            })}</tbody>
          </table>
        </div>
      </Card>
    </div>;
  }

  /* ── Overview ── */
  const totalTests=tests.length;
  const testedAthletes=new Set(tests.map((t:any)=>t.athlete_id)).size;

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <h2 style={{margin:0,fontSize:18,color:colors.nv}}>🏋️ Pretemporada — Tests físicos</h2>
      {canEdit&&<Btn v="p" s="s" onClick={()=>{sBatchType(testTypes[0]?.id||0);sBatchVals({});sMode("batch");}}>+ Cargar tests</Btn>}
    </div>

    <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(4,1fr)",gap:10,marginBottom:14}}>
      <Card style={{textAlign:"center",padding:12}}><div style={{fontSize:20,fontWeight:800,color:colors.bl}}>{testTypes.length}</div><div style={{fontSize:10,color:colors.g5}}>Tipos de test</div></Card>
      <Card style={{textAlign:"center",padding:12}}><div style={{fontSize:20,fontWeight:800,color:colors.nv}}>{totalTests}</div><div style={{fontSize:10,color:colors.g5}}>Tests registrados</div></Card>
      <Card style={{textAlign:"center",padding:12}}><div style={{fontSize:20,fontWeight:800,color:T.gn}}>{testedAthletes}</div><div style={{fontSize:10,color:colors.g5}}>Jugadores testeados</div></Card>
      <Card style={{textAlign:"center",padding:12}}><div style={{fontSize:20,fontWeight:800,color:colors.g4}}>{athletes.length-testedAthletes}</div><div style={{fontSize:10,color:colors.g5}}>Sin tests</div></Card>
    </div>

    {/* Fitness semáforo */}
    <Card style={{marginBottom:14}}>
      <h3 style={{margin:"0 0 10px",fontSize:13,color:colors.nv}}>Semáforo fitness — últimos tests vs benchmark M19</h3>
      <div style={{overflowX:"auto" as const}}>
        <table style={{width:"100%",borderCollapse:"collapse" as const,fontSize:11}}>
          <thead><tr style={{borderBottom:"2px solid "+colors.g2}}>
            <th style={{textAlign:"left" as const,padding:"6px 8px",color:colors.g5,fontWeight:700}}>Jugador</th>
            {testTypes.filter((t:any)=>t.benchmark_m19).map((t:any)=><th key={t.id} style={{textAlign:"center" as const,padding:"6px 4px",color:colors.g5,fontWeight:700,fontSize:9}}>{t.name}</th>)}
          </tr></thead>
          <tbody>{athletes.map((a:any)=>{
            const hasAny=testTypes.some((tt:any)=>latestVal(a.id,tt.id));
            if(!hasAny) return null;
            return <tr key={a.id} style={{borderBottom:"1px solid "+colors.g1}}>
              <td style={{padding:"6px 8px",fontWeight:600,color:colors.nv,whiteSpace:"nowrap" as const}}>{a.last_name}</td>
              {testTypes.filter((t:any)=>t.benchmark_m19).map((tt:any)=>{
                const v=latestVal(a.id,tt.id);
                return <td key={tt.id} style={{textAlign:"center" as const,padding:"6px 4px"}}>
                  {v?<span style={{background:benchColor(v.value,tt)+"20",color:benchColor(v.value,tt),padding:"2px 6px",borderRadius:8,fontWeight:700,fontSize:10}}>{v.value}</span>:<span style={{color:colors.g4}}>–</span>}
                </td>;
              })}
            </tr>;
          })}</tbody>
        </table>
      </div>
    </Card>

    {/* Test types by category */}
    {Object.entries(byCat).map(([cat,types])=>{
      const catInfo=DEP_TEST_CATS[cat]||{l:cat,i:"📊"};
      return <div key={cat} style={{marginBottom:14}}>
        <h3 style={{fontSize:13,color:colors.nv,margin:"0 0 8px"}}>{catInfo.i} {catInfo.l}</h3>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:8}}>
          {types.map((t:any)=>{
            const cnt=tests.filter((x:any)=>x.test_type_id===t.id).length;
            return <Card key={t.id} onClick={()=>{sSelType(t.id);sMode("history");}} style={{cursor:"pointer",padding:mob?10:12}}>
              <div style={{fontSize:13,fontWeight:700,color:colors.nv}}>{t.name}</div>
              <div style={{fontSize:10,color:colors.g5}}>{t.unit} {t.benchmark_m19?"· Ref: "+t.benchmark_m19:""}</div>
              <div style={{fontSize:11,color:colors.bl,fontWeight:600,marginTop:4}}>{cnt} registro{cnt!==1?"s":""}</div>
            </Card>;
          })}
        </div>
      </div>;
    })}

    {testTypes.length===0&&<Card style={{textAlign:"center",padding:32,color:colors.g4}}><div style={{fontSize:32}}>🏋️</div><div style={{marginTop:8,fontSize:13}}>No hay tipos de test configurados</div></Card>}
  </div>;
}

/* ══════════════════════════ LINEUP TAB ══════════════════════════ */
function LineupTab({athletes,lineups,injuries,checkins,onAdd,onUpd,onDel,canEdit,mob,latestCheckin}:any){
  const{colors,cardBg}=useC();
  const [selLineup,sSelLineup]=useState<number|null>(null);
  const [editing,sEditing]=useState(false);
  const [form,sForm]=useState({date:TODAY,match_name:"",division:"M19",notes:"",titulares:{} as Record<string,{athlete_id:number;name:string}>,suplentes:[] as {athlete_id:number;name:string;pos:string}[]});
  const [pickPos,sPickPos]=useState<string|null>(null);

  const lu=selLineup?lineups.find((l:any)=>l.id===selLineup):null;
  const activeInj=injuries.filter((i:any)=>i.status!=="alta");
  const injuredIds=new Set(activeInj.map((i:any)=>i.athlete_id));

  const athName=(id:number)=>{const a=athletes.find((a:any)=>a.id===id);return a?a.last_name+", "+a.first_name:"?";};

  const assignedIds=new Set([...Object.values(form.titulares).map((v:any)=>v.athlete_id),...form.suplentes.map((s:any)=>s.athlete_id)]);
  const available=athletes.filter((a:any)=>!assignedIds.has(a.id));

  const startNew=()=>{
    sForm({date:TODAY,match_name:"",division:"M19",notes:"",titulares:{},suplentes:[]});
    sEditing(true);sSelLineup(null);
  };

  const startEdit=(l:any)=>{
    sForm({date:l.date,match_name:l.match_name,division:l.division,notes:l.notes,titulares:l.formation?.titulares||{},suplentes:l.formation?.suplentes||[]});
    sEditing(true);
  };

  const saveLU=()=>{
    const payload={date:form.date,match_name:form.match_name,division:form.division,notes:form.notes,formation:{titulares:form.titulares,suplentes:form.suplentes}};
    if(lu) onUpd(lu.id,payload);
    else onAdd(payload);
    sEditing(false);sSelLineup(null);
  };

  const genWhatsApp=()=>{
    const lines=["*🏉 FORMACIÓN — "+form.match_name+"*","📅 "+fmtD(form.date)+" · "+form.division,"","*TITULARES*"];
    Object.entries(DEP_LINEUP_POS).forEach(([num,posName])=>{
      const t=form.titulares[num];
      lines.push(num+". "+posName+": "+(t?t.name:"—"));
    });
    if(form.suplentes.length>0){lines.push("");lines.push("*SUPLENTES*");form.suplentes.forEach((s:any,i:number)=>lines.push((16+i)+". "+s.name+" ("+s.pos+")"));}
    if(form.notes){lines.push("");lines.push("📝 "+form.notes);}
    lines.push("");lines.push("_Los Tordos RC_");
    return lines.join("\n");
  };

  /* ── Editor ── */
  if(editing){
    return <div>
      <Btn v="g" s="s" onClick={()=>{sEditing(false);if(lu)sSelLineup(lu.id);}} style={{marginBottom:12}}>← Cancelar</Btn>
      <Card style={{marginBottom:14}}>
        <h3 style={{margin:"0 0 10px",fontSize:14,color:colors.nv}}>{lu?"Editar formación":"Nueva formación"}</h3>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:10,marginBottom:14}}>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Partido</label><input value={form.match_name} onChange={e=>sForm(p=>({...p,match_name:e.target.value}))} placeholder="Ej: vs CUBA" style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Fecha</label><input type="date" value={form.date} onChange={e=>sForm(p=>({...p,date:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Notas</label><input value={form.notes} onChange={e=>sForm(p=>({...p,notes:e.target.value}))} placeholder="Observaciones..." style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
        </div>
      </Card>

      {/* Pitch layout */}
      <Card style={{marginBottom:14,background:"#0D4A2B",borderRadius:14,padding:mob?12:20}}>
        <h4 style={{margin:"0 0 12px",color:"rgba(255,255,255,.8)",fontSize:12,textAlign:"center" as const}}>🏉 Titulares (15)</h4>
        {/* Forwards */}
        <div style={{marginBottom:8}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:6}}>
            {["1","2","3"].map(n=><PosSlot key={n} n={n} pos={DEP_LINEUP_POS[n]} val={form.titulares[n]} injured={form.titulares[n]?injuredIds.has(form.titulares[n].athlete_id):false} onClick={()=>sPickPos(n)} onClear={()=>sForm(p=>{const t={...p.titulares};delete t[n];return{...p,titulares:t};})} mob={mob}/>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:6}}>
            {["4","5"].map(n=><PosSlot key={n} n={n} pos={DEP_LINEUP_POS[n]} val={form.titulares[n]} injured={form.titulares[n]?injuredIds.has(form.titulares[n].athlete_id):false} onClick={()=>sPickPos(n)} onClear={()=>sForm(p=>{const t={...p.titulares};delete t[n];return{...p,titulares:t};})} mob={mob}/>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
            {["6","8","7"].map(n=><PosSlot key={n} n={n} pos={DEP_LINEUP_POS[n]} val={form.titulares[n]} injured={form.titulares[n]?injuredIds.has(form.titulares[n].athlete_id):false} onClick={()=>sPickPos(n)} onClear={()=>sForm(p=>{const t={...p.titulares};delete t[n];return{...p,titulares:t};})} mob={mob}/>)}
          </div>
        </div>
        {/* Backs */}
        <div style={{borderTop:"1px dashed rgba(255,255,255,.2)",paddingTop:8}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:6}}>
            {["9","10"].map(n=><PosSlot key={n} n={n} pos={DEP_LINEUP_POS[n]} val={form.titulares[n]} injured={form.titulares[n]?injuredIds.has(form.titulares[n].athlete_id):false} onClick={()=>sPickPos(n)} onClear={()=>sForm(p=>{const t={...p.titulares};delete t[n];return{...p,titulares:t};})} mob={mob}/>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6,marginBottom:6}}>
            {["11","12","13","14"].map(n=><PosSlot key={n} n={n} pos={DEP_LINEUP_POS[n]} val={form.titulares[n]} injured={form.titulares[n]?injuredIds.has(form.titulares[n].athlete_id):false} onClick={()=>sPickPos(n)} onClear={()=>sForm(p=>{const t={...p.titulares};delete t[n];return{...p,titulares:t};})} mob={mob}/>)}
          </div>
          <div style={{display:"flex",justifyContent:"center"}}>
            <div style={{width:mob?"60%":"30%"}}><PosSlot n="15" pos={DEP_LINEUP_POS["15"]} val={form.titulares["15"]} injured={form.titulares["15"]?injuredIds.has(form.titulares["15"].athlete_id):false} onClick={()=>sPickPos("15")} onClear={()=>sForm(p=>{const t={...p.titulares};delete t["15"];return{...p,titulares:t};})} mob={mob}/></div>
          </div>
        </div>
      </Card>

      {/* Athlete picker modal */}
      {pickPos&&<Card style={{marginBottom:14,border:"2px solid "+colors.bl}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <h4 style={{margin:0,fontSize:13,color:colors.nv}}>Seleccionar jugador para #{pickPos} — {DEP_LINEUP_POS[pickPos]}</h4>
          <Btn v="g" s="s" onClick={()=>sPickPos(null)}>✕</Btn>
        </div>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:4,maxHeight:300,overflowY:"auto" as const}}>
          {available.map((a:any)=>{
            const isInj=injuredIds.has(a.id);
            return <div key={a.id} onClick={()=>{sForm(p=>({...p,titulares:{...p.titulares,[pickPos]:{athlete_id:a.id,name:a.first_name+" "+a.last_name}}}));sPickPos(null);}} style={{padding:"6px 8px",borderRadius:6,border:"1px solid "+(isInj?"#FCA5A5":colors.g2),background:isInj?"#FEF2F2":cardBg,cursor:"pointer",fontSize:11,fontWeight:600,color:colors.nv}}>
              {a.last_name}, {a.first_name} <span style={{color:colors.g4,fontWeight:400}}>({a.position||"–"})</span>
              {isInj&&<span style={{color:T.rd,fontSize:9}}> 🩹</span>}
            </div>;
          })}
        </div>
      </Card>}

      {/* Suplentes */}
      <Card style={{marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <h4 style={{margin:0,fontSize:13,color:colors.nv}}>Suplentes ({form.suplentes.length})</h4>
          <Btn v="g" s="s" onClick={()=>sForm(p=>({...p,suplentes:[...p.suplentes,{athlete_id:0,name:"",pos:""}]}))}>+ Suplente</Btn>
        </div>
        {form.suplentes.map((_s:any,i:number)=><div key={i} style={{display:"flex",gap:6,alignItems:"center",marginBottom:6}}>
          <select value={form.suplentes[i].athlete_id} onChange={e=>{const a=athletes.find((at:any)=>at.id===+e.target.value);sForm(p=>{const s=[...p.suplentes];s[i]={...s[i],athlete_id:+e.target.value,name:a?a.first_name+" "+a.last_name:""};return{...p,suplentes:s};});}} style={{flex:1,padding:6,borderRadius:6,border:"1px solid "+colors.g3,fontSize:11}}>
            <option value={0}>Seleccionar...</option>
            {available.concat(form.suplentes[i].athlete_id?[athletes.find((a:any)=>a.id===form.suplentes[i].athlete_id)].filter(Boolean):[]).map((a:any)=><option key={a.id} value={a.id}>{a.last_name}, {a.first_name}</option>)}
          </select>
          <input value={form.suplentes[i].pos} onChange={e=>sForm(p=>{const s=[...p.suplentes];s[i]={...s[i],pos:e.target.value};return{...p,suplentes:s};})} placeholder="Posición" style={{width:80,padding:6,borderRadius:6,border:"1px solid "+colors.g3,fontSize:11}}/>
          <button onClick={()=>sForm(p=>({...p,suplentes:p.suplentes.filter((_:any,j:number)=>j!==i)}))} style={{background:"none",border:"none",color:T.rd,cursor:"pointer",fontSize:14}}>×</button>
        </div>)}
      </Card>

      <div style={{display:"flex",gap:8}}>
        <Btn v="p" onClick={saveLU}>💾 Guardar formación</Btn>
        <Btn v="s" onClick={()=>{const txt=genWhatsApp();const url="https://wa.me/?text="+encodeURIComponent(txt);window.open(url,"_blank");}} disabled={Object.keys(form.titulares).length===0}>📱 Enviar por WhatsApp</Btn>
        <Btn v="g" onClick={()=>{sEditing(false);if(lu)sSelLineup(lu.id);}}>Cancelar</Btn>
      </div>
    </div>;
  }

  /* ── Lineup detail ── */
  if(lu){
    const tit=lu.formation?.titulares||{};
    const sup=lu.formation?.suplentes||[];
    return <div>
      <Btn v="g" s="s" onClick={()=>sSelLineup(null)} style={{marginBottom:12}}>← Volver</Btn>
      <Card style={{marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <h2 style={{margin:0,fontSize:18,color:colors.nv}}>{lu.match_name||"Sin nombre"}</h2>
            <div style={{fontSize:11,color:colors.g5}}>{fmtD(lu.date)} · {lu.division}</div>
            {lu.notes&&<div style={{fontSize:11,color:colors.g4,marginTop:2}}>{lu.notes}</div>}
          </div>
          {canEdit&&<div style={{display:"flex",gap:4}}>
            <Btn v="g" s="s" onClick={()=>startEdit(lu)}>✏️ Editar</Btn>
            <Btn v="r" s="s" onClick={()=>{if(confirm("¿Eliminar formación?")){onDel(lu.id);sSelLineup(null);}}}>Eliminar</Btn>
          </div>}
        </div>
      </Card>

      <Card style={{marginBottom:14}}>
        <h3 style={{margin:"0 0 10px",fontSize:13,color:colors.nv}}>Titulares</h3>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:6}}>
          {Object.entries(DEP_LINEUP_POS).map(([num,posName])=>{
            const t=tit[num];
            const isInj=t&&injuredIds.has(t.athlete_id);
            return <div key={num} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:6,border:"1px solid "+(isInj?"#FCA5A5":colors.g1),background:isInj?"#FEF2F2":cardBg}}>
              <span style={{width:24,height:24,borderRadius:12,background:colors.nv,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,flexShrink:0}}>{num}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:9,color:colors.g4}}>{posName}</div>
                <div style={{fontSize:12,fontWeight:600,color:t?colors.nv:colors.g4}}>{t?t.name:"— vacante —"}</div>
              </div>
              {isInj&&<span style={{fontSize:10}}>🩹</span>}
            </div>;
          })}
        </div>
      </Card>

      {sup.length>0&&<Card style={{marginBottom:14}}>
        <h3 style={{margin:"0 0 8px",fontSize:13,color:colors.nv}}>Suplentes ({sup.length})</h3>
        {sup.map((s:any,i:number)=><div key={i} style={{padding:"4px 0",borderBottom:"1px solid "+colors.g1,display:"flex",gap:6,alignItems:"center",fontSize:12}}>
          <span style={{fontWeight:700,color:colors.g5}}>{16+i}.</span>
          <span style={{fontWeight:600,color:colors.nv}}>{s.name}</span>
          <span style={{color:colors.g4}}>({s.pos})</span>
        </div>)}
      </Card>}

      <Btn v="s" onClick={()=>{
        sForm({date:lu.date,match_name:lu.match_name,division:lu.division,notes:lu.notes,titulares:lu.formation?.titulares||{},suplentes:lu.formation?.suplentes||[]});
        const txt=genWhatsApp();const url="https://wa.me/?text="+encodeURIComponent(txt);window.open(url,"_blank");
      }}>📱 Enviar por WhatsApp</Btn>
    </div>;
  }

  /* ── Lineups list ── */
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <h2 style={{margin:0,fontSize:18,color:colors.nv}}>🏉 Formaciones</h2>
      {canEdit&&<Btn v="p" s="s" onClick={startNew}>+ Nueva formación</Btn>}
    </div>

    {lineups.length===0&&<Card style={{textAlign:"center",padding:32,color:colors.g4}}><div style={{fontSize:32}}>🏉</div><div style={{marginTop:8,fontSize:13}}>No hay formaciones guardadas. Creá la primera.</div></Card>}

    <div style={{display:"flex",flexDirection:"column" as const,gap:8}}>
      {lineups.map((l:any)=>{
        const tCount=Object.keys(l.formation?.titulares||{}).length;
        const sCount=(l.formation?.suplentes||[]).length;
        return <Card key={l.id} onClick={()=>sSelLineup(l.id)} style={{cursor:"pointer"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:colors.nv}}>{l.match_name||"Sin nombre"}</div>
              <div style={{fontSize:11,color:colors.g5}}>{fmtD(l.date)} · {l.division}</div>
            </div>
            <div style={{textAlign:"center" as const}}>
              <div style={{fontSize:16,fontWeight:800,color:colors.nv}}>{tCount}/15</div>
              <div style={{fontSize:9,color:colors.g5}}>+{sCount} sup</div>
            </div>
          </div>
        </Card>;
      })}
    </div>
  </div>;
}

/* ── Position slot helper ── */
function PosSlot({n,pos,val,injured,onClick,onClear,mob}:{n:string;pos:string;val?:{athlete_id:number;name:string};injured:boolean;onClick:()=>void;onClear:()=>void;mob:boolean}){
  return <div onClick={val?undefined:onClick} style={{background:val?(injured?"rgba(220,38,38,.3)":"rgba(255,255,255,.15)"):"rgba(255,255,255,.06)",border:"1px dashed "+(val?"rgba(255,255,255,.3)":"rgba(255,255,255,.15)"),borderRadius:8,padding:mob?"8px 4px":"10px 6px",textAlign:"center" as const,cursor:val?"default":"pointer",position:"relative" as const}}>
    <div style={{fontSize:10,fontWeight:800,color:"rgba(255,255,255,.5)"}}>{n}</div>
    <div style={{fontSize:mob?9:10,color:"rgba(255,255,255,.7)",fontWeight:600}}>{val?val.name:pos}</div>
    {injured&&<div style={{fontSize:8,color:"#FCA5A5"}}>🩹 Lesionado</div>}
    {val&&<button onClick={e=>{e.stopPropagation();onClear();}} style={{position:"absolute" as const,top:2,right:4,background:"none",border:"none",color:"rgba(255,255,255,.4)",cursor:"pointer",fontSize:10}}>×</button>}
  </div>;
}

/* ══════════════════════════ COMUNICACIÓN WHATSAPP TAB ══════════════════════════ */
function CommTab({athletes,lineups,seasons,phases,mob,showT}:any){
  const{colors,isDark,cardBg}=useC();
  const [tpl,sTpl]=useState<"lineup"|"citacion"|"horarios"|"custom">("citacion");
  const [msg,sMsg]=useState("");
  const [selLU,sSelLU]=useState<number|null>(null);

  /* ── Citación template ── */
  const genCitacion=(dia:string,hora:string,lugar:string,tipo:string)=>{
    const lines=["*🏉 CITACIÓN — Los Tordos M19*","","📅 "+dia,"⏰ "+hora,"📍 "+lugar,"🏋️ "+tipo,"","*Jugadores citados:*"];
    athletes.forEach((a:any,i:number)=>{lines.push((i+1)+". "+a.first_name+" "+a.last_name);});
    lines.push("","⚠️ Confirmar asistencia respondiendo este mensaje.","","_Los Tordos RC_");
    return lines.join("\n");
  };

  /* ── Schedule template ── */
  const genSchedule=(semana:string,items:{dia:string;hora:string;tipo:string;lugar:string}[])=>{
    const lines=["*📅 CRONOGRAMA SEMANAL — Los Tordos M19*","Semana: "+semana,""];
    items.forEach(item=>{lines.push("▸ *"+item.dia+"* "+item.hora+" — "+item.tipo+(item.lugar?" ("+item.lugar+")":""));});
    lines.push("","_Los Tordos RC_");
    return lines.join("\n");
  };

  const [citF,sCitF]=useState({dia:TODAY,hora:"09:00",lugar:"Club Los Tordos",tipo:"Entrenamiento"});
  const [schItems,sSchItems]=useState([{dia:"Lunes",hora:"09:00",tipo:"Entrenamiento",lugar:"Cancha 1"}]);

  const [customMsg,sCustomMsg]=useState("");

  const preview=()=>{
    if(tpl==="citacion") return genCitacion(fmtD(citF.dia),citF.hora,citF.lugar,citF.tipo);
    if(tpl==="horarios") return genSchedule("Actual",schItems);
    if(tpl==="lineup"&&selLU){
      const lu=lineups.find((l:any)=>l.id===selLU);
      if(!lu) return "";
      const lines=["*🏉 FORMACIÓN — "+(lu.match_name||"Partido")+"*","📅 "+fmtD(lu.date),"","*TITULARES*"];
      Object.entries(DEP_LINEUP_POS).forEach(([num,posName])=>{
        const t=(lu.formation?.titulares||{})[num];
        lines.push(num+". "+posName+": "+(t?t.name:"—"));
      });
      const sup=lu.formation?.suplentes||[];
      if(sup.length>0){lines.push("");lines.push("*SUPLENTES*");sup.forEach((s:any,i:number)=>lines.push((16+i)+". "+s.name+" ("+s.pos+")"));}
      lines.push("","_Los Tordos RC_");
      return lines.join("\n");
    }
    if(tpl==="custom") return customMsg;
    return "";
  };

  const sendWA=()=>{
    const txt=preview();
    if(!txt) return;
    const url="https://wa.me/?text="+encodeURIComponent(txt);
    window.open(url,"_blank");
  };

  const copyClip=()=>{
    const txt=preview();
    if(!txt) return;
    navigator.clipboard.writeText(txt);
    showT("Copiado al portapapeles");
  };

  return <div>
    <h2 style={{margin:"0 0 14px",fontSize:18,color:colors.nv}}>📱 Comunicación WhatsApp</h2>

    {/* Template selector */}
    <div style={{display:"flex",gap:4,marginBottom:14,flexWrap:"wrap" as const}}>
      {([["citacion","📋 Citación"],["horarios","📅 Horarios"],["lineup","🏉 Formación"],["custom","✏️ Libre"]] as const).map(([k,l])=>
        <button key={k} onClick={()=>sTpl(k)} style={{padding:"7px 14px",borderRadius:8,border:tpl===k?"2px solid "+colors.nv:"1px solid "+colors.g3,background:tpl===k?colors.nv+"10":cardBg,color:tpl===k?colors.nv:colors.g5,fontSize:12,fontWeight:600,cursor:"pointer"}}>{l}</button>
      )}
    </div>

    {/* ── Citación form ── */}
    {tpl==="citacion"&&<Card style={{marginBottom:14}}>
      <h3 style={{margin:"0 0 10px",fontSize:13,color:colors.nv}}>📋 Generar citación</h3>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:10}}>
        <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Fecha</label><input type="date" value={citF.dia} onChange={e=>sCitF(p=>({...p,dia:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
        <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Hora</label><input type="time" value={citF.hora} onChange={e=>sCitF(p=>({...p,hora:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
        <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Lugar</label><input value={citF.lugar} onChange={e=>sCitF(p=>({...p,lugar:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
        <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Tipo</label><select value={citF.tipo} onChange={e=>sCitF(p=>({...p,tipo:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:12,marginTop:2}}><option>Entrenamiento</option><option>Partido</option><option>Gimnasio</option><option>Reunión</option></select></div>
      </div>
    </Card>}

    {/* ── Horarios form ── */}
    {tpl==="horarios"&&<Card style={{marginBottom:14}}>
      <h3 style={{margin:"0 0 10px",fontSize:13,color:colors.nv}}>📅 Armar cronograma semanal</h3>
      {schItems.map((item,i)=><div key={i} style={{display:"flex",gap:6,marginBottom:6,alignItems:"center",flexWrap:"wrap" as const}}>
        <select value={item.dia} onChange={e=>sSchItems(p=>p.map((it,j)=>j===i?{...it,dia:e.target.value}:it))} style={{padding:6,borderRadius:6,border:"1px solid "+colors.g3,fontSize:11}}>
          {["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"].map(d=><option key={d}>{d}</option>)}
        </select>
        <input type="time" value={item.hora} onChange={e=>sSchItems(p=>p.map((it,j)=>j===i?{...it,hora:e.target.value}:it))} style={{padding:6,borderRadius:6,border:"1px solid "+colors.g3,fontSize:11}}/>
        <input value={item.tipo} onChange={e=>sSchItems(p=>p.map((it,j)=>j===i?{...it,tipo:e.target.value}:it))} placeholder="Tipo" style={{flex:1,padding:6,borderRadius:6,border:"1px solid "+colors.g3,fontSize:11,minWidth:80}}/>
        <input value={item.lugar} onChange={e=>sSchItems(p=>p.map((it,j)=>j===i?{...it,lugar:e.target.value}:it))} placeholder="Lugar" style={{flex:1,padding:6,borderRadius:6,border:"1px solid "+colors.g3,fontSize:11,minWidth:80}}/>
        <button onClick={()=>sSchItems(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:T.rd,cursor:"pointer",fontSize:14}}>×</button>
      </div>)}
      <Btn v="g" s="s" onClick={()=>sSchItems(p=>[...p,{dia:"Lunes",hora:"09:00",tipo:"Entrenamiento",lugar:""}])}>+ Agregar</Btn>
    </Card>}

    {/* ── Lineup selector ── */}
    {tpl==="lineup"&&<Card style={{marginBottom:14}}>
      <h3 style={{margin:"0 0 10px",fontSize:13,color:colors.nv}}>🏉 Seleccionar formación</h3>
      {lineups.length===0&&<div style={{fontSize:12,color:colors.g4}}>No hay formaciones guardadas. Creá una en la pestaña Equipo.</div>}
      <div style={{display:"flex",flexDirection:"column" as const,gap:4}}>
        {lineups.map((l:any)=><div key={l.id} onClick={()=>sSelLU(l.id)} style={{padding:"8px 10px",borderRadius:6,border:selLU===l.id?"2px solid "+colors.nv:"1px solid "+colors.g3,background:selLU===l.id?colors.nv+"10":cardBg,cursor:"pointer"}}>
          <div style={{fontSize:12,fontWeight:600,color:colors.nv}}>{l.match_name||"Sin nombre"} — {fmtD(l.date)}</div>
          <div style={{fontSize:10,color:colors.g5}}>{Object.keys(l.formation?.titulares||{}).length}/15 titulares</div>
        </div>)}
      </div>
    </Card>}

    {/* ── Custom message ── */}
    {tpl==="custom"&&<Card style={{marginBottom:14}}>
      <h3 style={{margin:"0 0 10px",fontSize:13,color:colors.nv}}>✏️ Mensaje libre</h3>
      <textarea value={customMsg} onChange={e=>sCustomMsg(e.target.value)} rows={6} placeholder="Escribí tu mensaje..." style={{width:"100%",padding:10,borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,resize:"vertical" as const,boxSizing:"border-box" as const}}/>
    </Card>}

    {/* ── Preview ── */}
    {preview()&&<Card style={{marginBottom:14,background:isDark?colors.g2:"#F0FDF4",border:"1px solid "+(isDark?colors.g3:"#BBF7D0")}}>
      <h4 style={{margin:"0 0 8px",fontSize:12,color:colors.nv}}>Vista previa</h4>
      <pre style={{fontSize:11,color:colors.nv,whiteSpace:"pre-wrap" as const,fontFamily:"inherit",margin:0,lineHeight:1.6}}>{preview()}</pre>
    </Card>}

    {/* ── Actions ── */}
    <div style={{display:"flex",gap:8}}>
      <Btn v="s" onClick={sendWA} disabled={!preview()}>📱 Enviar por WhatsApp</Btn>
      <Btn v="g" onClick={copyClip} disabled={!preview()}>📋 Copiar texto</Btn>
    </div>
  </div>;
}
