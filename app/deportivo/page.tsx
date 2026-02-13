"use client";
import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { createClient } from "@/lib/supabase/client";
import { T, TD, DEP_ROLES, DEP_POSITIONS, DEP_INJ_TYPES, DEP_INJ_ZONES, DEP_INJ_SEV, DEP_WK, DEP_SEM, DEP_DIV, fn } from "@/lib/constants";
import type { DepStaff, DepAthlete, DepInjury, DepCheckin } from "@/lib/supabase/types";
import { exportCSV, exportPDF } from "@/lib/export";
import { useRealtime } from "@/lib/realtime";
import { useTheme, darkCSS } from "@/lib/theme";

/* ── THEME CONTEXT ── */
const ThemeCtx = createContext<{colors:typeof T;isDark:boolean;cardBg:string}>({colors:T,isDark:false,cardBg:"#fff"});
const useC = () => useContext(ThemeCtx);

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

/* ── TOAST ── */
function Toast({msg,type,onDone}:{msg:string;type:"ok"|"err";onDone:()=>void}){
  useEffect(()=>{const t=setTimeout(onDone,3500);return()=>clearTimeout(t);},[onDone]);
  return <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",padding:"10px 20px",borderRadius:10,background:type==="ok"?"#065F46":"#991B1B",color:"#fff",fontSize:12,fontWeight:600,zIndex:9999,boxShadow:"0 4px 16px rgba(0,0,0,.2)",maxWidth:"90vw",textAlign:"center"}}>{type==="ok"?"✅":"❌"} {msg}</div>;
}

function useMobile(bp=768){
  const [mob,sMob]=useState(false);
  useEffect(()=>{const mq=window.matchMedia(`(max-width:${bp}px)`);sMob(mq.matches);const h=(e:any)=>sMob(e.matches);mq.addEventListener("change",h);return()=>mq.removeEventListener("change",h);},[bp]);
  return mob;
}

/* ── UI PRIMITIVES ── */
function Btn({children,onClick,v,s,disabled,style:st}:{children:any;onClick?:any;v?:string;s?:string;disabled?:boolean;style?:any}){
  const{colors,isDark}=useC();
  const vs:any={p:{background:colors.nv,color:isDark?"#0F172A":"#fff"},r:{background:colors.rd,color:"#fff"},s:{background:colors.gn,color:"#fff"},w:{background:colors.yl,color:"#fff"},g:{background:"transparent",color:colors.nv,border:"1px solid "+colors.g3}};
  const sz:any={s:{padding:"4px 10px",fontSize:11},m:{padding:"7px 16px",fontSize:13}};
  return <button onClick={onClick} disabled={disabled} style={{border:"none",borderRadius:8,cursor:disabled?"not-allowed":"pointer",fontWeight:600,opacity:disabled?.5:1,...sz[s||"m"],...vs[v||"p"],...(st||{})}}>{children}</button>;
}
function Card({children,style:st,onClick}:{children:any;style?:any;onClick?:any}){const{cardBg,colors}=useC();return <div onClick={onClick} style={{background:cardBg,borderRadius:14,padding:18,boxShadow:"0 1px 4px rgba(0,0,0,.05)",border:"1px solid "+colors.g2,...(st||{})}}>{children}</div>;}

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
    if(stRes.data){
      // Fetch only profiles that belong to dep_staff
      const staffUserIds=stRes.data.map((s:any)=>s.user_id);
      const{data:profiles}=staffUserIds.length>0
        ?await supabase.from("profiles").select("id,first_name,last_name,role,email").in("id",staffUserIds)
        :{data:[]};
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

  return(<ThemeCtx.Provider value={{colors,isDark,cardBg}}>
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

/* ══════════════════════════ BULK ATHLETE FORM ══════════════════════════ */
type BulkRow={first_name:string;last_name:string;division:string;position:string;_err?:boolean};
const emptyRow=():BulkRow=>({first_name:"",last_name:"",division:DEP_DIV[0],position:"",_err:false});

function BulkAthleteForm({onSave,onCancel,mob}:{onSave:(rows:Partial<DepAthlete>[])=>void;onCancel:()=>void;mob:boolean}){
  const [mode,sMode]=useState<"paste"|"table">("paste");
  const [rows,sRows]=useState<BulkRow[]>(Array.from({length:5},emptyRow));
  const [pasteVal,sPasteVal]=useState("");
  const [saving,sSaving]=useState(false);

  const divSet=new Set(DEP_DIV.map(d=>d.toLowerCase()));
  const posSet=new Set(DEP_POSITIONS.map(p=>p.toLowerCase()));

  const matchDiv=(v:string):string=>{
    const low=v.trim().toLowerCase();
    const exact=DEP_DIV.find(d=>d.toLowerCase()===low);
    if(exact) return exact;
    const partial=DEP_DIV.find(d=>d.toLowerCase().includes(low));
    return partial||"";
  };
  const matchPos=(v:string):string=>{
    const low=v.trim().toLowerCase();
    const exact=DEP_POSITIONS.find(p=>p.toLowerCase()===low);
    if(exact) return exact;
    const partial=DEP_POSITIONS.find(p=>p.toLowerCase().includes(low));
    return partial||v.trim();
  };

  const parsePaste=()=>{
    const lines=pasteVal.trim().split("\n").filter(l=>l.trim());
    if(lines.length===0) return;
    const parsed:BulkRow[]=lines.map(line=>{
      const sep=line.includes("\t")?"\t":",";
      const cols=line.split(sep).map(c=>c.trim());
      const first_name=cols[0]||"";
      const last_name=cols[1]||"";
      const rawDiv=cols[2]||"";
      const rawPos=cols[3]||"";
      const division=matchDiv(rawDiv);
      const position=matchPos(rawPos);
      return{first_name,last_name,division:division||DEP_DIV[0],position,_err:rawDiv!==""&&!division};
    });
    sRows(parsed);
    sMode("table");
  };

  const updRow=(i:number,field:keyof BulkRow,val:string)=>{
    sRows(prev=>prev.map((r,j)=>j===i?{...r,[field]:val,_err:false}:r));
  };
  const addRow=()=>sRows(prev=>[...prev,emptyRow()]);
  const delRow=(i:number)=>sRows(prev=>prev.filter((_,j)=>j!==i));

  const validRows=rows.filter(r=>r.first_name.trim()&&r.last_name.trim());

  const handleSave=async()=>{
    if(validRows.length===0) return;
    sSaving(true);
    await onSave(validRows.map(r=>({first_name:r.first_name.trim(),last_name:r.last_name.trim(),division:r.division,position:r.position})));
    sSaving(false);
  };

  const inputSt:any={width:"100%",padding:"6px 8px",borderRadius:6,border:"1px solid "+T.g3,fontSize:11,boxSizing:"border-box" as const};
  const selectSt:any={...inputSt,background:"#fff"};

  return <div>
    <Btn v="g" s="s" onClick={onCancel} style={{marginBottom:12}}>← Cancelar</Btn>
    <h2 style={{fontSize:16,color:T.nv,margin:"0 0 14px"}}>⚡ Carga rápida de jugadores</h2>

    {/* Mode tabs */}
    <div style={{display:"flex",gap:4,marginBottom:14}}>
      {([["paste","Pegar datos"],["table","Tabla manual"]] as const).map(([k,l])=>
        <button key={k} onClick={()=>sMode(k)} style={{padding:"6px 16px",borderRadius:8,border:mode===k?"2px solid "+T.nv:"1px solid "+T.g3,background:mode===k?T.nv+"10":"#fff",color:mode===k?T.nv:T.g5,fontSize:12,fontWeight:600,cursor:"pointer"}}>{l}</button>
      )}
    </div>

    {/* Paste mode */}
    {mode==="paste"&&<Card style={{marginBottom:14}}>
      <h3 style={{margin:"0 0 8px",fontSize:13,color:T.nv}}>Pegá desde Excel o CSV</h3>
      <p style={{fontSize:11,color:T.g5,margin:"0 0 8px"}}>Formato: Nombre, Apellido, División, Posición (una fila por jugador)</p>
      <textarea value={pasteVal} onChange={e=>sPasteVal(e.target.value)} placeholder={"Juan\tPérez\tPrimera\tApertura\nMarcos\tGómez\tIntermedia\tPilar"} rows={8} style={{width:"100%",padding:10,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,fontFamily:"monospace",resize:"vertical" as const,boxSizing:"border-box" as const}}/>
      <div style={{display:"flex",gap:8,marginTop:10}}>
        <Btn v="p" onClick={parsePaste} disabled={!pasteVal.trim()}>Cargar en tabla</Btn>
        <Btn v="g" onClick={onCancel}>Cancelar</Btn>
      </div>
    </Card>}

    {/* Table mode */}
    {mode==="table"&&<Card>
      <div style={{overflowX:"auto" as const}}>
        <table style={{width:"100%",borderCollapse:"collapse" as const,fontSize:11}}>
          <thead><tr style={{borderBottom:"2px solid "+T.g2}}>
            <th style={{textAlign:"left" as const,padding:"6px 4px",color:T.g5,fontWeight:700,width:"5%"}}>#</th>
            <th style={{textAlign:"left" as const,padding:"6px 4px",color:T.g5,fontWeight:700,width:"25%"}}>Nombre *</th>
            <th style={{textAlign:"left" as const,padding:"6px 4px",color:T.g5,fontWeight:700,width:"25%"}}>Apellido *</th>
            <th style={{textAlign:"left" as const,padding:"6px 4px",color:T.g5,fontWeight:700,width:"20%"}}>División</th>
            <th style={{textAlign:"left" as const,padding:"6px 4px",color:T.g5,fontWeight:700,width:"20%"}}>Posición</th>
            <th style={{padding:"6px 4px",width:"5%"}}></th>
          </tr></thead>
          <tbody>{rows.map((r,i)=><tr key={i} style={{borderBottom:"1px solid "+T.g1,background:r._err?"#FEF2F2":"transparent"}}>
            <td style={{padding:"4px",color:T.g4,fontSize:10}}>{i+1}</td>
            <td style={{padding:"4px"}}><input value={r.first_name} onChange={e=>updRow(i,"first_name",e.target.value)} style={inputSt}/></td>
            <td style={{padding:"4px"}}><input value={r.last_name} onChange={e=>updRow(i,"last_name",e.target.value)} style={inputSt}/></td>
            <td style={{padding:"4px"}}><select value={r.division} onChange={e=>updRow(i,"division",e.target.value)} style={{...selectSt,borderColor:r._err?T.rd:T.g3}}>{DEP_DIV.map(d=><option key={d} value={d}>{d}</option>)}</select></td>
            <td style={{padding:"4px"}}><select value={r.position} onChange={e=>updRow(i,"position",e.target.value)} style={selectSt}><option value="">–</option>{DEP_POSITIONS.map(p=><option key={p} value={p}>{p}</option>)}</select></td>
            <td style={{padding:"4px",textAlign:"center" as const}}><button onClick={()=>delRow(i)} style={{background:"none",border:"none",cursor:"pointer",color:T.rd,fontSize:14,padding:2}} title="Eliminar fila">×</button></td>
          </tr>)}</tbody>
        </table>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:12}}>
        <Btn v="g" s="s" onClick={addRow}>+ Fila</Btn>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <span style={{fontSize:11,color:T.g5}}>{validRows.length} jugador{validRows.length!==1?"es":""} válido{validRows.length!==1?"s":""}</span>
          <Btn v="p" onClick={handleSave} disabled={validRows.length===0||saving}>{saving?"Guardando...":"Guardar todos"}</Btn>
          <Btn v="g" onClick={onCancel}>Cancelar</Btn>
        </div>
      </div>
      {rows.some(r=>r._err)&&<div style={{marginTop:8,fontSize:11,color:T.rd,fontWeight:600}}>⚠ Las filas en rojo tienen una división no reconocida. Revisá y corregí antes de guardar.</div>}
    </Card>}
  </div>;
}

/* ══════════════════════════ ATHLETE FORM ══════════════════════════ */
function AthleteForm({onSave,onCancel,mob}:any){
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
    if(!nFirst||!nLast||!nEmail){showT("Completá nombre, apellido y email","err");return;}
    sCreating(true);
    try{
      const sess=await supabase.auth.getSession();
      const token=sess.data.session?.access_token;
      const res=await fetch("/api/deportivo/create-user",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},body:JSON.stringify({email:nEmail,password:nPass||undefined,first_name:nFirst,last_name:nLast,dep_role:nRole,divisions:nDivs})});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||"Error al crear usuario");
      sCreds(data.credentials);
      showT("Perfil creado exitosamente");
      sNFirst("");sNLast("");sNEmail("");sNPass("");sNRole("entrenador");sNDivs([]);
      fetchAll();
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
        <div><label style={{fontSize:11,fontWeight:600,color:colors.g5}}>Email *</label><input value={nEmail} onChange={e=>sNEmail(e.target.value)} placeholder="email@ejemplo.com" type="email" style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,marginTop:3,boxSizing:"border-box" as const,background:cardBg,color:colors.nv}}/></div>
        <div><label style={{fontSize:11,fontWeight:600,color:colors.g5}}>Contraseña <span style={{fontWeight:400,color:colors.g4}}>(opcional, se autogenera)</span></label><input value={nPass} onChange={e=>sNPass(e.target.value)} placeholder="Dejar vacío para autogenerar" type="text" style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,marginTop:3,boxSizing:"border-box" as const,background:cardBg,color:colors.nv}}/></div>
        <div><label style={{fontSize:11,fontWeight:600,color:colors.g5}}>Rol deportivo *</label><select value={nRole} onChange={e=>sNRole(e.target.value)} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,marginTop:3,background:cardBg,color:colors.nv}}>{Object.entries(DEP_ROLES).map(([k,v])=><option key={k} value={k}>{v.i} {v.l}</option>)}</select></div>
      </div>
      <div style={{marginTop:8}}><label style={{fontSize:11,fontWeight:600,color:colors.g5}}>Divisiones asignadas</label>
        <div style={{display:"flex",gap:4,flexWrap:"wrap" as const,marginTop:4}}>{DEP_DIV.map(d=><button key={d} onClick={()=>sNDivs(prev=>prev.includes(d)?prev.filter(x=>x!==d):[...prev,d])} style={{padding:"4px 10px",borderRadius:16,fontSize:10,border:nDivs.includes(d)?"2px solid "+colors.nv:"1px solid "+colors.g3,background:nDivs.includes(d)?colors.nv+"10":cardBg,color:nDivs.includes(d)?colors.nv:colors.g5,cursor:"pointer",fontWeight:600}}>{d}</button>)}</div>
      </div>
      <div style={{display:"flex",gap:8,marginTop:12}}>
        <Btn v="p" onClick={doCreate} disabled={creating||!nFirst||!nLast||!nEmail}>{creating?"Creando...":"Crear perfil"}</Btn>
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
