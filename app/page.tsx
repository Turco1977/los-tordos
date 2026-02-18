"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { T, TD, AREAS, DEPTOS, ROLES, RK, DIV, TIPOS, ST, SC, AGT, MINSECS, PST, PSC, MONEDAS, RUBROS, fn, isOD, daysDiff, PJ_ST, PJ_PR, FREQ, INV_CAT, INV_COND, BOOK_FAC, BOOK_ST, SPON_TIER, SPON_ST } from "@/lib/constants";
import type { Profile, Task, TaskMessage, OrgMember as OrgMemberType, Milestone, Agenda, Minuta, Presupuesto, Proveedor } from "@/lib/supabase/types";
import { notify, fetchNotifications, markRead } from "@/lib/notifications";
import { exportCSV, exportPDF, exportICal, exportMinutaPDF, exportMinutaWord, exportReportPDF, exportProjectPDF } from "@/lib/export";
import { useRealtime } from "@/lib/realtime";
import { paginate } from "@/lib/pagination";
import { uploadFile, getFileIcon, formatFileSize } from "@/lib/storage";
import { useTheme, darkCSS } from "@/lib/theme";
import { ThemeCtx, useC } from "@/lib/theme-context";
import { Toast, useMobile, Btn, Card, Ring, Pager, FileField, Bread, Badge, OfflineIndicator } from "@/components/ui";
import { profileToUser, taskToDB, presuFromDB, presuToDB, provFromDB } from "@/lib/mappers";
import { useOfflineData } from "@/lib/use-offline";
import { clearAll as clearOfflineDB } from "@/lib/offline-store";
import { Login } from "@/components/main/Login";
import { ChangePw } from "@/components/main/ChangePw";
import { SB } from "@/components/main/Sidebar";
import { MyDash } from "@/components/main/MyDash";
import { Det } from "@/components/main/Det";
import { TList } from "@/components/main/TaskList";
import { KPIs } from "@/components/main/KPIs";
import { Circles } from "@/components/main/Circles";
import { DeptCircles } from "@/components/main/DeptCircles";
import { Org } from "@/components/main/Org";
import { NP } from "@/components/main/NewPedido";
import { Proyecto } from "@/components/main/Proyecto";
import { Profs } from "@/components/main/Profs";
import { Depts } from "@/components/main/Depts";
import { Reuniones } from "@/components/main/Reuniones";
import PresView from "@/components/main/PresView";
import CalView from "@/components/main/CalView";
import { DashWidgets } from "@/components/main/DashWidgets";
import { CustomDash } from "@/components/main/CustomDash";
import { ProyectosView } from "@/components/main/ProyectosView";
import { KanbanView } from "@/components/main/KanbanView";
import { ActivityFeed } from "@/components/main/ActivityFeed";
import { CommView } from "@/components/main/CommView";
import { CommandPalette } from "@/components/main/CommandPalette";
import { RecurrentTasks } from "@/components/main/RecurrentTasks";
import { InventarioView } from "@/components/main/InventarioView";
import { ReservasView } from "@/components/main/ReservasView";
import { SponsorsView } from "@/components/main/SponsorsView";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const supabase = createClient();
const TODAY = new Date().toISOString().slice(0,10);

/* ── ROLE LEVEL HELPER ── */
const rlv=(role:string)=>ROLES[role]?.lv||0;

/* ── INPUT SANITIZER (XSS prevention) ── */
const sanitize=(s:string)=>s.replace(/<\/?[^>]+(>|$)/g,"").replace(/javascript:/gi,"").replace(/on\w+\s*=/gi,"").trim();

/* ── PUSH NOTIFICATIONS HOOK ── */
function usePushNotifs(user:any,peds:any[]){
  const [pushEnabled,sPushEnabled]=useState(false);
  useEffect(()=>{
    if(!user||!("Notification" in window))return;
    sPushEnabled(Notification.permission==="granted");
  },[user]);
  const requestPush=async()=>{
    if(!("Notification" in window))return;
    const perm=await Notification.requestPermission();
    sPushEnabled(perm==="granted");
  };
  const sendPush=(title:string,body:string,icon?:string)=>{
    if(pushEnabled&&document.hidden){
      new Notification(title,{body,icon:icon||"/logo.jpg",badge:"/logo.jpg"});
    }
  };
  /* Check for overdue tasks every 5 minutes */
  useEffect(()=>{
    if(!pushEnabled||!user||!peds.length)return;
    const check=()=>{
      const od=peds.filter(p=>p.st!==ST.OK&&isOD(p.fReq)&&(p.asTo===user.id||p.cId===user.id));
      if(od.length>0) sendPush("⏰ Tareas vencidas","Tenés "+od.length+" tarea(s) vencida(s)");
    };
    const iv=setInterval(check,300000);// 5min
    return()=>clearInterval(iv);
  },[pushEnabled,user,peds]);
  return {pushEnabled,requestPush,sendPush};
}


/* ── KPI filter helpers ── */
const KPIF:{[k:string]:{l:string;i:string;c:string}}={ok:{l:"Completadas",i:"✅",c:T.gn},pend:{l:"Pendientes",i:"🔴",c:T.rd},venc:{l:"Vencidas",i:"⏰",c:"#DC2626"},gasto:{l:"Con Gasto",i:"💰",c:T.pr}};
const kpiFilter=(peds:any[],k:string)=>{switch(k){case"ok":return peds.filter(p=>p.st===ST.OK);case"pend":return peds.filter(p=>p.st===ST.P);case"venc":return peds.filter(p=>p.st!==ST.OK&&isOD(p.fReq));case"gasto":return peds.filter(p=>p.monto);default:return peds;}};

/* ── NOTIFS ── */
function notifs(user:any,peds:any[]){const n:any[]=[];if(["coordinador","admin","superadmin"].indexOf(user.role)>=0){const pp=peds.filter(p=>p.st===ST.P);if(pp.length)n.push({t:"🔴 "+pp.length+" pendientes",c:T.rd,act:"dash",filter:ST.P});}if(user.role==="embudo"){const ee=peds.filter(p=>p.st===ST.E);if(ee.length)n.push({t:"💰 "+ee.length+" esperando aprobación",c:T.pr,act:"dash",filter:ST.E});}const myV=peds.filter(p=>p.st===ST.V&&p.cId===user.id);if(myV.length)n.push({t:"🔵 "+myV.length+" esperando validación",c:T.bl,act:"my",filter:ST.V,first:myV[0]});const od=peds.filter(p=>p.st!==ST.OK&&isOD(p.fReq));if(od.length)n.push({t:"⏰ "+od.length+" vencidas",c:"#DC2626",act:"dash",filter:"overdue",first:od[0]});/* escalation: tasks stuck >7 days */if(["coordinador","admin","superadmin"].indexOf(user.role)>=0){const stuck=peds.filter(p=>p.st!==ST.OK&&p.st!==ST.P&&p.cAt&&daysDiff(p.cAt,TODAY)>7&&!isOD(p.fReq));if(stuck.length)n.push({t:"🚨 "+stuck.length+" tareas sin avance (+7d)",c:"#7C3AED",act:"dash",first:stuck[0]});}return n;}

/* ── MAIN APP ── */
export default function App(){
  const [areas]=useState(AREAS);const [deptos]=useState(DEPTOS);
  const [users,sUs]=useState<any[]>([]);const [om,sOm]=useState<any[]>([]);const [peds,sPd]=useState<any[]>([]);const [hitos,sHi]=useState<any[]>([]);const [agendas,sAgs]=useState<any[]>([]);const [minutas,sMins]=useState<any[]>([]);
  const [presu,sPr]=useState<any[]>([]);const [provs,sPv]=useState<any[]>([]);const [reminders,sRems]=useState<any[]>([]);
  const [projects,sProjects]=useState<any[]>([]);const [projTasks,sProjTasks]=useState<any[]>([]);
  const [taskTemplates,sTaskTemplates]=useState<any[]>([]);
  const [projBudgets,sProjBudgets]=useState<any[]>([]);
  const [inventory,sInventory]=useState<any[]>([]);const [bookings,sBookings]=useState<any[]>([]);const [sponsors,sSponsors]=useState<any[]>([]);
  const [dbNotifs,sDbNotifs]=useState<any[]>([]);
  const [user,sU]=useState<any>(null);const [authChecked,sAuthChecked]=useState(false);
  const [vw,sVw_]=useState("dash");const [prevVw,sPrevVw]=useState<string|null>(null);
  const sVw=(v:string)=>{sPrevVw(vw);sVw_(v);};const [sel,sSl]=useState<any>(null);const [aA,sAA]=useState<number|null>(null);const [aD,sAD]=useState<number|null>(null);const [sbCol,sSbCol]=useState(false);const [search,sSr]=useState("");const [shNot,sShNot]=useState(false);const [preAT,sPreAT]=useState<any>(null);const [showPw,sShowPw]=useState(false);const [toast,sToast]=useState<{msg:string;type:"ok"|"err"}|null>(null);const [kpiFilt,sKpiFilt]=useState<string|null>(null);
  /* Global Search state (Feature 1) */
  const [gsOpen,sGsOpen]=useState(false);const gsRef=useRef<HTMLDivElement>(null);
  const [cmdOpen,sCmdOpen]=useState(false);
  const mob=useMobile();const [sbOpen,sSbOpen]=useState(false);
  const {pushEnabled,requestPush,sendPush}=usePushNotifs(user,peds);
  const {mode:themeMode,toggle:toggleTheme,colors,isDark,cardBg,headerBg}=useTheme();
  const showT=(msg:string,type:"ok"|"err"="ok")=>sToast({msg,type});
  const [dataLoading,sDataLoading]=useState(true);
  const {offlineState,loadFromCache,saveToCache,offlineMutate,sync,cacheLoaded}=useOfflineData(user);

  /* ── Fetch all data from Supabase ── */
  const fetchAll = useCallback(async()=>{
    const [pRes,mRes,omRes,msRes,agRes,miRes,prRes,pvRes,remRes,projRes,ptRes,ttRes,invRes,bkRes,spRes,pbRes]=await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("tasks").select("*").order("id",{ascending:false}).limit(500),
      supabase.from("org_members").select("*"),
      supabase.from("milestones").select("*").order("id"),
      supabase.from("agendas").select("*").order("id",{ascending:false}).limit(100),
      supabase.from("minutas").select("*").order("id",{ascending:false}).limit(100),
      supabase.from("presupuestos").select("*").order("id",{ascending:false}).limit(200),
      supabase.from("proveedores").select("*").order("id",{ascending:false}).limit(200),
      supabase.from("reminders").select("*").order("date",{ascending:true}),
      supabase.from("projects").select("*").order("id",{ascending:false}),
      supabase.from("project_tasks").select("*").order("id",{ascending:false}),
      supabase.from("task_templates").select("*").order("id",{ascending:false}),
      supabase.from("inventory").select("*").order("id",{ascending:false}),
      supabase.from("bookings").select("*").order("id",{ascending:false}),
      supabase.from("sponsors").select("*").order("id",{ascending:false}),
      supabase.from("project_budgets").select("*").order("id",{ascending:false}),
    ]);
    const errors:string[]=[];
    if(pRes.error) errors.push("Perfiles: "+pRes.error.message);
    if(mRes.error) errors.push("Tareas: "+mRes.error.message);
    if(omRes.error) errors.push("Organigrama: "+omRes.error.message);
    if(prRes.error) errors.push("Presupuestos: "+prRes.error.message);
    if(errors.length) showT(errors.join("; "),"err");
    if(pRes.data) sUs(pRes.data.map((p:any)=>profileToUser(p)));
    if(omRes.data) sOm(omRes.data.map((m:any)=>({id:m.id,t:m.type,cargo:m.cargo,n:m.first_name,a:m.last_name,mail:m.email,tel:m.phone,so:m.sort_order||0})));
    if(msRes.data) sHi(msRes.data.map((h:any)=>({id:h.id,fase:h.phase,name:h.name,periodo:h.period,pct:h.pct,color:h.color})));
    if(agRes.data) sAgs(agRes.data.map((a:any)=>({id:a.id,type:a.type,areaName:a.area_name,date:a.date,sections:a.sections,presentes:a.presentes||[],status:a.status,createdAt:a.created_at})));
    if(miRes.data) sMins(miRes.data.map((m:any)=>({id:m.id,type:m.type,areaName:m.area_name,agendaId:m.agenda_id,date:m.date,horaInicio:m.hora_inicio,horaCierre:m.hora_cierre,lugar:m.lugar,presentes:m.presentes,ausentes:m.ausentes,sections:m.sections,tareas:m.tareas,status:m.status,createdAt:m.created_at})));
    if(prRes.data) sPr(prRes.data.map(presuFromDB));
    if(pvRes.data) sPv(pvRes.data.map(provFromDB));
    if(remRes.data) sRems(remRes.data);
    if(projRes.data) sProjects(projRes.data);
    if(ptRes.data) sProjTasks(ptRes.data);
    if(ttRes.data) sTaskTemplates(ttRes.data);
    if(invRes.data) sInventory(invRes.data);
    if(bkRes.data) sBookings(bkRes.data);
    if(spRes.data) sSponsors(spRes.data);
    if(pbRes.data) sProjBudgets(pbRes.data);
    // Tasks + messages
    let tmData:any[]=[];
    if(mRes.data){
      const tmRes=await supabase.from("task_messages").select("*").order("created_at");
      const msgs:any[]=tmRes.data||[];
      tmData=msgs;
      sPd(mRes.data.map((t:any)=>{
        const tMsgs=msgs.filter((m:any)=>m.task_id===t.id).map((m:any)=>({dt:m.created_at||"",uid:m.user_id,by:m.user_name,act:m.content,t:m.type}));
        return{id:t.id,div:t.division,cId:t.creator_id,cN:t.creator_name,dId:t.dept_id,tipo:t.tipo,desc:t.description,fReq:t.due_date,urg:t.urgency,st:t.status,asTo:t.assigned_to,rG:t.requires_expense,eOk:t.expense_ok,resp:t.resolution,cAt:t.created_at,monto:t.amount,log:tMsgs};
      }));
    }
    sDataLoading(false);
    // Save raw Supabase data to IndexedDB for offline use
    const anyData=pRes.data||mRes.data||omRes.data;
    if(anyData){
      saveToCache({
        profiles:pRes.data||[],tasks:mRes.data||[],task_messages:tmData,
        org_members:omRes.data||[],milestones:msRes.data||[],
        agendas:agRes.data||[],minutas:miRes.data||[],
        presupuestos:prRes.data||[],proveedores:pvRes.data||[],
        reminders:remRes.data||[],projects:projRes.data||[],
        project_tasks:ptRes.data||[],task_templates:ttRes.data||[],
        inventory:invRes.data||[],bookings:bkRes.data||[],
        sponsors:spRes.data||[],project_budgets:pbRes.data||[],
      });
    }
  },[saveToCache]);

  /* ── Check existing session on mount ── */
  useEffect(()=>{
    (async()=>{
      const{data:{session}}=await supabase.auth.getSession();
      if(session?.user){
        const{data:profile}=await supabase.from("profiles").select("*").eq("id",session.user.id).single();
        if(profile) sU(profileToUser(profile));
      }
      sAuthChecked(true);
    })();
  },[]);

  /* ── Load cached data from IndexedDB (instant UI) ── */
  useEffect(()=>{
    if(!user||cacheLoaded)return;
    loadFromCache({
      profiles:(d:any[])=>sUs(d.map((p:any)=>profileToUser(p))),
      tasks:(d:any[])=>{/* handled with task_messages below */},
      org_members:(d:any[])=>sOm(d.map((m:any)=>({id:m.id,t:m.type,cargo:m.cargo,n:m.first_name,a:m.last_name,mail:m.email,tel:m.phone,so:m.sort_order||0}))),
      milestones:(d:any[])=>sHi(d.map((h:any)=>({id:h.id,fase:h.phase,name:h.name,periodo:h.period,pct:h.pct,color:h.color}))),
      agendas:(d:any[])=>sAgs(d.map((a:any)=>({id:a.id,type:a.type,areaName:a.area_name,date:a.date,sections:a.sections,presentes:a.presentes||[],status:a.status,createdAt:a.created_at}))),
      minutas:(d:any[])=>sMins(d.map((m:any)=>({id:m.id,type:m.type,areaName:m.area_name,agendaId:m.agenda_id,date:m.date,horaInicio:m.hora_inicio,horaCierre:m.hora_cierre,lugar:m.lugar,presentes:m.presentes,ausentes:m.ausentes,sections:m.sections,tareas:m.tareas,status:m.status,createdAt:m.created_at}))),
      presupuestos:(d:any[])=>sPr(d.map(presuFromDB)),
      proveedores:(d:any[])=>sPv(d.map(provFromDB)),
      reminders:(d:any[])=>sRems(d),
      projects:(d:any[])=>sProjects(d),
      project_tasks:(d:any[])=>sProjTasks(d),
      task_templates:(d:any[])=>sTaskTemplates(d),
      inventory:(d:any[])=>sInventory(d),
      bookings:(d:any[])=>sBookings(d),
      sponsors:(d:any[])=>sSponsors(d),
      project_budgets:(d:any[])=>sProjBudgets(d),
    }).then(async()=>{
      // Load tasks + messages from cache together
      try{
        const{getAll}=await import("@/lib/offline-store");
        const[cachedTasks,cachedMsgs]=await Promise.all([getAll("tasks"),getAll("task_messages")]);
        if(cachedTasks.length){
          sPd(cachedTasks.map((t:any)=>{
            const tMsgs=(cachedMsgs||[]).filter((m:any)=>m.task_id===t.id).map((m:any)=>({dt:m.created_at||"",uid:m.user_id,by:m.user_name,act:m.content,t:m.type}));
            return{id:t.id,div:t.division,cId:t.creator_id,cN:t.creator_name,dId:t.dept_id,tipo:t.tipo,desc:t.description,fReq:t.due_date,urg:t.urgency,st:t.status,asTo:t.assigned_to,rG:t.requires_expense,eOk:t.expense_ok,resp:t.resolution,cAt:t.created_at,monto:t.amount,log:tMsgs};
          }));
          sDataLoading(false);
        }
      }catch{}
    });
  },[user,cacheLoaded,loadFromCache]);

  /* ── Fetch data when user logs in ── */
  useEffect(()=>{if(user) fetchAll();},[user,fetchAll]);

  /* ── Realtime: auto-refresh on DB changes (only when online) ── */
  useRealtime([
    {table:"tasks",onChange:()=>fetchAll()},
    {table:"task_messages",onInsert:(msg:any)=>{
      sPd(p=>p.map(x=>{
        if(x.id!==msg.task_id) return x;
        const dup=(x.log||[]).some((l:any)=>l.uid===msg.user_id&&l.act===msg.content&&l.dt?.slice(0,16)===msg.created_at?.slice(0,16));
        if(dup) return x;
        return{...x,log:[...(x.log||[]),{dt:msg.created_at||"",uid:msg.user_id,by:msg.user_name,act:msg.content,t:msg.type}]};
      }));
    },onChange:()=>fetchAll()},
    {table:"presupuestos",onChange:()=>fetchAll()},
    {table:"projects",onChange:()=>fetchAll()},
    {table:"project_tasks",onChange:()=>fetchAll()},
    {table:"task_templates",onChange:()=>fetchAll()},
    {table:"inventory",onChange:()=>fetchAll()},
    {table:"bookings",onChange:()=>fetchAll()},
    {table:"sponsors",onChange:()=>fetchAll()},
    {table:"project_budgets",onChange:()=>fetchAll()},
    {table:"notifications",onChange:()=>refreshNotifs()},
  ],!!user&&offlineState.isOnline);

  /* ── Auth token helper for API calls ── */
  const getToken=async()=>{const{data:{session}}=await supabase.auth.getSession();return session?.access_token||"";};

  /* ── Fetch persistent notifications ── */
  const [notifTotal,sNotifTotal]=useState(0);
  const [notifFilter,sNotifFilter]=useState<string>("all");
  const [notifPage,sNotifPage]=useState(0);
  const NOTIF_LIMIT=30;
  const refreshNotifs=useCallback(async(opts?:{filter?:string;offset?:number;append?:boolean})=>{
    const tok=await getToken();
    if(!tok)return;
    const f=opts?.filter||"all";
    const offset=opts?.offset||0;
    const typeParam=f==="task"||f==="budget"||f==="deadline"?f:"";
    const readParam=f==="unread"?false:null;
    const{notifications:n,total}=await fetchNotifications(tok,{limit:NOTIF_LIMIT,offset,type:typeParam,read:readParam});
    if(opts?.append)sDbNotifs(prev=>[...prev,...n]);
    else sDbNotifs(n);
    sNotifTotal(total);
  },[]);
  useEffect(()=>{if(user){refreshNotifs();const iv=setInterval(()=>refreshNotifs(),60000);return()=>clearInterval(iv);}},[user,refreshNotifs]);

  /* ── Send notification helper ── */
  const sendNotif=async(userId:string,title:string,message:string,type:"task"|"budget"|"deadline"|"injury"|"info"="task",link="",sendEmail=false)=>{
    const tok=await getToken();
    if(tok) await notify({token:tok,user_id:userId,title,message,type,link,send_email:sendEmail});
  };

  /* ── Periodic deadline & overdue notifications (once per task per day) ── */
  useEffect(()=>{
    if(!user||!peds.length)return;
    const check=async()=>{
      const today=new Date().toISOString().slice(0,10);
      const key="notif-dl-"+today;
      let sent:string[];
      try{sent=JSON.parse(localStorage.getItem(key)||"[]");}catch{sent=[];}
      const tomorrow=new Date(Date.now()+86400000).toISOString().slice(0,10);
      const toSend:Array<{uid:string;title:string;msg:string;tag:string}>=[];
      peds.forEach((p:any)=>{
        if(p.st===ST.OK)return;
        /* Overdue: notify assignee + creator */
        if(p.fReq&&isOD(p.fReq)){
          if(p.asTo&&!sent.includes("od-"+p.id+"-"+p.asTo))toSend.push({uid:p.asTo,title:"Tarea vencida #"+p.id,msg:(p.desc||"").slice(0,60),tag:"od-"+p.id+"-"+p.asTo});
          if(p.cId&&p.cId!==p.asTo&&!sent.includes("od-"+p.id+"-"+p.cId))toSend.push({uid:p.cId,title:"Tarea vencida #"+p.id,msg:(p.desc||"").slice(0,60),tag:"od-"+p.id+"-"+p.cId});
        }
        /* Approaching deadline (within 24h) */
        if(p.fReq&&p.fReq===tomorrow){
          if(p.asTo&&!sent.includes("dl-"+p.id+"-"+p.asTo))toSend.push({uid:p.asTo,title:"Tarea vence mañana #"+p.id,msg:(p.desc||"").slice(0,60),tag:"dl-"+p.id+"-"+p.asTo});
          if(p.cId&&p.cId!==p.asTo&&!sent.includes("dl-"+p.id+"-"+p.cId))toSend.push({uid:p.cId,title:"Tarea vence mañana #"+p.id,msg:(p.desc||"").slice(0,60),tag:"dl-"+p.id+"-"+p.cId});
        }
      });
      if(!toSend.length)return;
      const newSent=[...sent];
      for(const s of toSend.slice(0,20)){await sendNotif(s.uid,s.title,s.msg,"deadline");newSent.push(s.tag);}
      try{localStorage.setItem(key,JSON.stringify(newSent));}catch{}
    };
    const t=setTimeout(check,5000);/* run 5s after mount */
    const iv=setInterval(check,300000);/* then every 5min */
    return()=>{clearTimeout(t);clearInterval(iv);};
  },[user,peds]);

  const out=async()=>{await supabase.auth.signOut();try{await clearOfflineDB();}catch{}sU(null);sVw("dash");sSl(null);sAA(null);sAD(null);sSr("");sPd([]);sUs([]);sOm([]);sHi([]);sAgs([]);sMins([]);sPr([]);sPv([]);sRems([]);sDbNotifs([]);sProjects([]);sProjTasks([]);sProjBudgets([]);sTaskTemplates([]);sInventory([]);sBookings([]);sSponsors([]);};
  const isAd=user&&(user.role==="admin"||user.role==="superadmin");
  const isSA=user&&user.role==="superadmin";
  const isPersonal=user&&(user.role==="enlace"||user.role==="manager"||user.role==="usuario");

  /* Canje usage per sponsor: sum of approved canje presupuestos */
  const canjeUsado=useMemo(()=>{const m:Record<number,number>={};presu.forEach((pr:any)=>{if(pr.is_canje&&pr.sponsor_id&&pr.status==="aprobado"){m[pr.sponsor_id]=(m[pr.sponsor_id]||0)+Number(pr.monto||0);}});return m;},[presu]);

  /* Global Search logic (Feature 1) */
  const gsResults=useCallback(()=>{
    if(!search||search.length<2)return{tasks:[],users:[],presu:[]};
    const s=search.toLowerCase();
    const tasks=peds.filter((p:any)=>(p.desc+p.cN+p.tipo+(p.id+"")).toLowerCase().includes(s)).slice(0,5);
    const usrs=users.filter((u:any)=>(u.n+" "+u.a).toLowerCase().includes(s)).slice(0,5);
    const pres=presu.filter((pr:any)=>(pr.proveedor_nombre+pr.descripcion).toLowerCase().includes(s)).slice(0,5);
    return{tasks,users:usrs,presu:pres};
  },[search,peds,users,presu]);
  /* Close global search on outside click */
  useEffect(()=>{const h=(e:any)=>{if(gsRef.current&&!gsRef.current.contains(e.target))sGsOpen(false);};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);

  /* Cmd+K command palette + keyboard shortcuts */
  useEffect(()=>{
    if(!user)return;
    const h=(e:KeyboardEvent)=>{
      const tag=(e.target as HTMLElement)?.tagName;
      const inInput=tag==="INPUT"||tag==="TEXTAREA"||tag==="SELECT";
      // Cmd+K or Ctrl+K: toggle command palette
      if((e.metaKey||e.ctrlKey)&&e.key==="k"){e.preventDefault();sCmdOpen(o=>!o);return;}
      // Shortcuts only when not typing in an input and palette is closed
      if(inInput||cmdOpen||sel||showPw)return;
      if(e.key==="n"||e.key==="N"){e.preventDefault();sVw("new");}
      else if(e.key==="d"||e.key==="D"){e.preventDefault();sVw(isPersonal?"my":"dash");sAA(null);sAD(null);sKpiFilt(null);}
      else if(e.key==="k"||e.key==="K"){e.preventDefault();sVw("kanban");}
      else if(e.key==="c"||e.key==="C"){e.preventDefault();sVw("cal");}
      else if(e.key==="r"||e.key==="R"){e.preventDefault();sVw("reun");}
      else if(e.key==="p"||e.key==="P"){e.preventDefault();sVw("presu");}
      else if(e.key==="/"){e.preventDefault();sCmdOpen(true);}
    };
    document.addEventListener("keydown",h);
    return()=>document.removeEventListener("keydown",h);
  },[user,cmdOpen,sel,showPw,isPersonal]);

  /* Bulk action handler (Feature 3) */
  const handleBulk=async(ids:number[],action:string,value:string)=>{
    try{if(action==="status"){sPd(p=>p.map(x=>ids.includes(x.id)?{...x,st:value}:x));for(const id of ids){await supabase.from("tasks").update({status:value}).eq("id",id);await addLog(id,user.id,fn(user),"Cambió estado a "+SC[value]?.l,"sys");}showT(ids.length+" tareas actualizadas");}
    else if(action==="assign"){sPd(p=>p.map(x=>ids.includes(x.id)?{...x,asTo:value,st:x.st===ST.P?ST.C:x.st}:x));const ag=users.find((u:any)=>u.id===value);for(const id of ids){await supabase.from("tasks").update({assigned_to:value,status:peds.find(x=>x.id===id)?.st===ST.P?ST.C:undefined}).eq("id",id);await addLog(id,user.id,fn(user),"Asignó a "+(ag?fn(ag):""),"sys");}showT(ids.length+" tareas asignadas");}
    }catch(e:any){showT(e.message||"Error","err");}
  };

  /* CSV Import handler (Feature 12) */
  const handleImport=async(rows:any[])=>{
    try{const ts=TODAY+" "+new Date().toTimeString().slice(0,5);const newTasks:any[]=[];
    for(const r of rows){const row:any={division:r.division||"",creator_id:user.id,creator_name:fn(user),dept_id:user.dId||1,tipo:r.tipo,description:r.descripcion,due_date:r.fecha_limite,urgency:r.urgencia||"Normal",status:ST.P,assigned_to:null,requires_expense:false,expense_ok:null,resolution:"",created_at:TODAY,amount:null};
    const{data}=await supabase.from("tasks").insert(row).select().single();const tid=data?.id||0;
    if(tid){await supabase.from("task_messages").insert({task_id:tid,user_id:user.id,user_name:fn(user),content:"Creó tarea (importado CSV)",type:"sys"});
    newTasks.push({id:tid,div:r.division||"",cId:user.id,cN:fn(user),dId:user.dId||1,tipo:r.tipo,desc:r.descripcion,fReq:r.fecha_limite,urg:r.urgencia||"Normal",st:ST.P,asTo:null,rG:false,eOk:null,resp:"",cAt:TODAY,monto:null,log:[{dt:ts,uid:user.id,by:fn(user),act:"Creó tarea (importado CSV)",t:"sys"}]});}}
    sPd(p=>[...newTasks,...p]);showT(newTasks.length+" tareas importadas");
    }catch(e:any){showT(e.message||"Error al importar","err");}
  };

  /* ── Auto-generate recurring tasks (must be before early returns - rules of hooks) ── */
  const autoGenRef=useRef(false);
  const isPersonalForGen=user&&(user.role==="enlace"||user.role==="manager"||user.role==="usuario");
  useEffect(()=>{
    if(!user||isPersonalForGen||autoGenRef.current||!taskTemplates.length||dataLoading)return;
    const isCoordOrAdmin=user.role==="admin"||user.role==="superadmin"||user.role==="coordinador";
    if(!isCoordOrAdmin)return;
    autoGenRef.current=true;
    (async()=>{
      const today=new Date();today.setHours(0,0,0,0);
      const todayStr=today.toISOString().slice(0,10);
      for(const tpl of taskTemplates){
        if(!tpl.active)continue;
        let shouldGen=false;
        if(!tpl.last_generated){shouldGen=true;}
        else{
          const last=new Date(tpl.last_generated+"T12:00:00");
          const freq=FREQ[tpl.frequency];
          if(!freq)continue;
          let next:Date;
          if(tpl.frequency==="mensual"||tpl.frequency==="trimestral"){
            const months=tpl.frequency==="mensual"?1:3;
            next=new Date(last.getFullYear(),last.getMonth()+months,tpl.day_of_month||1);
          }else{next=new Date(last.getTime()+freq.days*864e5);}
          shouldGen=next<=today;
        }
        if(!shouldGen)continue;
        try{
          const dueDate=new Date(today.getTime()+7*864e5).toISOString().slice(0,10);
          const row:any={division:"",creator_id:user.id,creator_name:fn(user),dept_id:tpl.dept_id||1,tipo:tpl.tipo||"Administrativo",description:tpl.name+(tpl.description?" - "+tpl.description:""),due_date:dueDate,urgency:tpl.urgency||"Normal",status:tpl.assigned_to?ST.C:ST.P,assigned_to:tpl.assigned_to||null,requires_expense:false,expense_ok:null,resolution:"",created_at:todayStr,amount:null};
          const{data}=await supabase.from("tasks").insert(row).select().single();
          if(data){
            await supabase.from("task_messages").insert({task_id:data.id,user_id:user.id,user_name:fn(user),content:"Creó tarea automáticamente (recurrente: "+tpl.name+")",type:"sys"});
            await supabase.from("task_templates").update({last_generated:todayStr}).eq("id",tpl.id);
          }
        }catch(e){/* silent */}
      }
      fetchAll();
    })();
  },[user,taskTemplates,dataLoading]);

  /* Command Palette items (must be before early returns - rules of hooks) */
  const isPersonal_=user&&(user.role==="enlace"||user.role==="manager"||user.role==="usuario");
  const cmdItems=useMemo(()=>{
    if(!user)return[];
    const items:any[]=[];
    const navItems=[
      {id:"nav-dash",label:isPersonal_?"Mis Tareas":"Dashboard",icon:isPersonal_?"📋":"📊",keywords:"d,inicio,home",action:()=>{sVw(isPersonal_?"my":"dash");sAA(null);sAD(null);sKpiFilt(null);}},
      {id:"nav-kanban",label:"Kanban",icon:"📊",keywords:"k,tablero,board",action:()=>sVw("kanban")},
      {id:"nav-cal",label:"Calendario",icon:"📅",keywords:"c,calendar,fecha",action:()=>sVw("cal")},
      {id:"nav-reun",label:"Reuniones",icon:"🤝",keywords:"r,agenda,minuta",action:()=>sVw("reun")},
      {id:"nav-presu",label:"Presupuestos",icon:"💰",keywords:"p,budget,gasto",action:()=>sVw("presu")},
      {id:"nav-proy",label:"Proyectos",icon:"📋",keywords:"proyecto,board",action:()=>sVw("proyectos")},
      {id:"nav-org",label:"Organigrama",icon:"🏛️",keywords:"estructura,org",action:()=>sVw("org")},
      {id:"nav-profs",label:"Perfiles",icon:"👤",keywords:"personas,users",action:()=>sVw("profs")},
      {id:"nav-feed",label:"Actividad",icon:"📰",keywords:"feed,timeline",action:()=>sVw("feed")},
      {id:"nav-recur",label:"Recurrentes",icon:"🔁",keywords:"template,automatica,repetir",action:()=>sVw("recurrentes")},
      {id:"nav-plan",label:"Plan 2035",icon:"🎯",keywords:"hitos,roadmap",action:()=>sVw("proy")},
      {id:"nav-inv",label:"Inventario",icon:"📦",keywords:"equipo,stock,material",action:()=>sVw("inventario")},
      {id:"nav-res",label:"Espacios",icon:"🏟️",keywords:"cancha,booking,reserva,espacio",action:()=>sVw("reservas")},
      {id:"nav-spon",label:"Sponsors",icon:"🥇",keywords:"sponsor,patrocinador,crm",action:()=>sVw("sponsors")},
    ];
    navItems.forEach(n=>items.push({...n,category:"nav"}));
    items.push({id:"act-new",label:"Nueva tarea",icon:"➕",category:"action",keywords:"crear,add,agregar",action:()=>sVw("new")});
    items.push({id:"act-theme",label:isDark?"Modo claro":"Modo oscuro",icon:isDark?"☀️":"🌙",category:"action",keywords:"tema,theme,dark,light",action:toggleTheme});
    items.push({id:"act-pw",label:"Cambiar contrasena",icon:"🔒",category:"action",keywords:"password,clave",action:()=>sShowPw(true)});
    items.push({id:"act-logout",label:"Cerrar sesion",icon:"↩",category:"action",keywords:"salir,logout",action:out});
    peds.slice(0,8).forEach(p=>items.push({id:"task-"+p.id,label:"#"+p.id+" "+p.desc?.slice(0,40),icon:SC[p.st]?.i||"📌",category:"task",badge:p.st,keywords:p.tipo+","+p.cN,action:()=>sSl(p)}));
    users.slice(0,5).forEach(u=>items.push({id:"user-"+u.id,label:fn(u),icon:"👤",category:"user",keywords:u.role+","+(ROLES[u.role]?.l||""),action:()=>{sVw("profs");}}));
    return items;
  },[user,isPersonal_,isDark,peds,users,toggleTheme]);

  if(!authChecked) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:colors.g1}}><div style={{fontSize:14,color:colors.g4}}>Cargando...</div></div>;
  if(!user) return <Login onLogin={(u:any)=>sU(u)} mob={mob}/>;

  const computedNts=notifs(user,peds);
  const unreadDb=dbNotifs.filter((n:any)=>!n.read);
  const badgeCount=computedNts.length+unreadDb.length;
  const ntColor=(type:string)=>type==="task"?T.bl:type==="budget"?T.pr:type==="deadline"?T.rd:T.gn;
  /* Date label for notification grouping */
  const ntDateLabel=(dt:string)=>{if(!dt)return"Sin fecha";const d=dt.slice(0,10);const today=new Date().toISOString().slice(0,10);const yd=new Date(Date.now()-86400000).toISOString().slice(0,10);if(d===today)return"Hoy";if(d===yd)return"Ayer";const p=d.split("-");return p[2]+"/"+p[1]+"/"+p[0];};
  /* Group dbNotifs by date */
  const ntGrouped=useMemo(()=>{const map=new Map<string,any[]>();dbNotifs.forEach((n:any)=>{const key=ntDateLabel(n.created_at);if(!map.has(key))map.set(key,[]);map.get(key)!.push(n);});return Array.from(map.entries());},[dbNotifs]);
  const hAC=(id:number)=>{sAA(aA===id?null:id);sAD(null);sKpiFilt(null);sVw("dash");};
  const hDC=(id:number)=>sAD(aD===id?null:id);

  let vT="",vI="",vC=T.nv,vP=peds;
  if(aD){const dd=deptos.find(x=>x.id===aD),aar=dd?areas.find(x=>x.id===dd.aId):null;vT=dd?dd.name:"";vI="📂";vC=aar?aar.color:T.nv;vP=peds.filter(p=>p.dId===aD);}
  else if(aA){const aar2=areas.find(x=>x.id===aA),ids2=deptos.filter(d=>d.aId===aA).map(d=>d.id);vT=aar2?aar2.name:"";vI=aar2?aar2.icon:"";vC=aar2?aar2.color:T.nv;vP=peds.filter(p=>ids2.indexOf(p.dId)>=0);}

  let nav:any[]=[];
  if(isPersonal){nav=[{k:"my",l:"Mis Tareas",sh:true},{k:"cal",l:"📅 Calendario",sh:true},{k:"new",l:"+ Tarea",sh:true}];}
  else{nav=[{k:"dash",l:"Dashboard",sh:true},{k:"kanban",l:"📊 Kanban",sh:true},{k:"feed",l:"📰 Actividad",sh:true},{k:"cal",l:"📅 Calendario",sh:true},{k:"new",l:"+ Tarea",sh:true}];}

  /* ── addLog: optimistic local + persist to Supabase ── */
  const addLog=async(id:number,uid:string,by:string,act:string,t?:string)=>{
    const ts=TODAY+" "+new Date().toTimeString().slice(0,5);
    const tp=t||"sys";
    sPd(p=>p.map(x=>x.id===id?{...x,log:[...(x.log||[]),{dt:ts,uid,by,act,t:tp}]}:x));
    await supabase.from("task_messages").insert({task_id:id,user_id:uid,user_name:by,content:act,type:tp});
  };

  if(isPersonal&&vw==="dash") { setTimeout(()=>sVw("my"),0); return null; }

  return(
    <ErrorBoundary>
    <ThemeCtx.Provider value={{colors,isDark,cardBg}}>
    <style dangerouslySetInnerHTML={{__html:darkCSS}}/>
    <div style={{display:"flex",minHeight:"100vh",background:colors.g1,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",color:colors.nv}}>
      <SB areas={areas} deptos={deptos} pedidos={peds} aA={aA} aD={aD} onAC={hAC} onDC={hDC} col={sbCol} onCol={()=>sSbCol(!sbCol)} isPersonal={isPersonal} mob={mob} sbOpen={sbOpen} onClose={()=>sSbOpen(false)} vw={vw} onNav={(v:string)=>sVw(v)} user={user}/>
      <div style={{flex:1,display:"flex",flexDirection:"column" as const,minWidth:0}}>
        <div style={{background:headerBg,borderBottom:"1px solid "+colors.g2,padding:mob?"0 6px":"0 14px",display:"flex",justifyContent:"space-between",alignItems:"center",height:mob?52:48}}>
          <div style={{display:"flex",gap:1,overflowX:"auto" as const,alignItems:"center"}}>
            {mob&&<button aria-label="Menú" onClick={()=>sSbOpen(true)} title="Abrir menú" style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:colors.nv,padding:"4px 6px",flexShrink:0,minHeight:44,minWidth:44}}>☰</button>}
            {nav.filter(n=>n.sh).map(n=><button key={n.k} onClick={()=>{sVw(n.k);if(n.k==="dash"||n.k==="my"){sAA(null);sAD(null);sKpiFilt(null);}}} style={{padding:mob?"8px 10px":"6px 11px",border:"none",borderRadius:7,background:vw===n.k?colors.nv:"transparent",color:vw===n.k?(isDark?"#0F172A":"#fff"):colors.g5,fontSize:mob?12:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap" as const,minHeight:44}}>{n.l}</button>)}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:mob?6:10,flexShrink:0}}>
            <div ref={gsRef} style={{position:"relative" as const}}><input value={search} onChange={e=>{sSr(e.target.value);sGsOpen(true);}} onFocus={()=>{if(search.length>=2)sGsOpen(true);}} onKeyDown={e=>{if(e.key==="Escape")sGsOpen(false);}} placeholder="Buscar..." style={{padding:mob?"8px 10px":"5px 10px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:mob?13:11,width:mob?100:140,minHeight:mob?40:undefined}}/>
              {gsOpen&&search.length>=2&&(()=>{const r=gsResults();const hasR=r.tasks.length||r.users.length||r.presu.length;return hasR?<div style={{position:"absolute" as const,top:32,right:0,background:cardBg,borderRadius:10,boxShadow:"0 4px 16px rgba(0,0,0,.12)",border:"1px solid "+colors.g2,width:280,zIndex:100,maxHeight:360,overflowY:"auto" as const,padding:6}}>
                {r.tasks.length>0&&<div><div style={{fontSize:9,fontWeight:700,color:colors.g4,padding:"4px 8px",textTransform:"uppercase" as const}}>Tareas</div>{r.tasks.map((p:any)=><div key={p.id} onClick={()=>{sSl(p);sGsOpen(false);sSr("");}} style={{padding:"5px 8px",borderRadius:6,cursor:"pointer",fontSize:11,color:colors.nv,fontWeight:600}}><span style={{color:colors.g4}}>#{p.id}</span> {p.desc?.slice(0,35)} <Badge s={p.st} sm/></div>)}</div>}
                {r.users.length>0&&<div><div style={{fontSize:9,fontWeight:700,color:colors.g4,padding:"4px 8px",textTransform:"uppercase" as const}}>Personas</div>{r.users.map((u:any)=><div key={u.id} onClick={()=>{sVw("profs");sGsOpen(false);sSr("");}} style={{padding:"5px 8px",borderRadius:6,cursor:"pointer",fontSize:11,color:colors.nv}}>👤 {fn(u)} <span style={{color:colors.g4,fontSize:9}}>{ROLES[u.role]?.l}</span></div>)}</div>}
                {r.presu.length>0&&<div><div style={{fontSize:9,fontWeight:700,color:colors.g4,padding:"4px 8px",textTransform:"uppercase" as const}}>Presupuestos</div>{r.presu.map((pr:any)=><div key={pr.id} onClick={()=>{sVw("presu");sGsOpen(false);sSr("");}} style={{padding:"5px 8px",borderRadius:6,cursor:"pointer",fontSize:11,color:colors.nv}}>💰 {pr.proveedor_nombre} <span style={{color:colors.g4,fontSize:9}}>${Number(pr.monto).toLocaleString()}</span></div>)}</div>}
              </div>:<div style={{position:"absolute" as const,top:32,right:0,background:cardBg,borderRadius:10,boxShadow:"0 4px 16px rgba(0,0,0,.12)",border:"1px solid "+colors.g2,width:280,zIndex:100,padding:"16px 12px",textAlign:"center" as const}}><div style={{fontSize:11,color:colors.g4}}>Sin resultados para &ldquo;{search}&rdquo;</div></div>;})()}
            </div>
            <OfflineIndicator state={offlineState} onSync={async()=>{const r=await sync();if(r.processed>0)showT(r.processed+" cambio"+(r.processed>1?"s":"")+" sincronizado"+(r.processed>1?"s":""));}}/>
            <button aria-label="Notificaciones" onClick={()=>{sShNot(!shNot);if(!shNot){sNotifFilter("all");sNotifPage(0);refreshNotifs();}}} title="Notificaciones" style={{background:"none",border:"none",fontSize:mob?18:16,cursor:"pointer",position:"relative" as const,minWidth:mob?40:undefined,minHeight:mob?40:undefined,display:"flex",alignItems:"center",justifyContent:"center"}}>🔔{badgeCount>0&&<span style={{position:"absolute" as const,top:-4,right:-4,minWidth:14,height:14,borderRadius:7,background:colors.rd,color:"#fff",fontSize:8,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 2px"}}>{badgeCount>99?"99+":badgeCount}</span>}</button>
            {!mob&&<div style={{textAlign:"right" as const}}><div style={{fontSize:11,fontWeight:700,color:colors.nv}}>{fn(user)}</div><div style={{fontSize:9,color:colors.g4}}>{ROLES[user.role]?.i} {ROLES[user.role]?.l}{user.div?" · "+user.div:""}</div></div>}
            <button aria-label="Cambiar tema" onClick={toggleTheme} title={isDark?"Modo claro":"Modo oscuro"} style={{width:mob?40:28,height:mob?40:28,borderRadius:7,border:"1px solid "+colors.g2,background:cardBg,cursor:"pointer",fontSize:mob?14:12,display:"flex",alignItems:"center",justifyContent:"center"}}>{isDark?"☀️":"🌙"}</button>
            <button aria-label="Cambiar contraseña" onClick={()=>sShowPw(true)} title="Cambiar contraseña" style={{width:mob?40:28,height:mob?40:28,borderRadius:7,border:"1px solid "+colors.g2,background:cardBg,cursor:"pointer",fontSize:mob?14:12,display:"flex",alignItems:"center",justifyContent:"center"}}>🔒</button>
            <button aria-label="Cerrar sesión" onClick={out} title="Cerrar sesión" style={{width:mob?40:28,height:mob?40:28,borderRadius:7,border:"1px solid "+colors.g2,background:cardBg,cursor:"pointer",fontSize:mob?14:12,display:"flex",alignItems:"center",justifyContent:"center"}}>↩</button>
          </div>
        </div>
        <div style={{flex:1,padding:mob?"12px 8px":"20px 16px",overflowY:"auto" as const,marginTop:4}}>
          {dataLoading?<div style={{display:"flex",flexDirection:"column" as const,gap:12,padding:16}}>{[1,2,3,4].map(i=><div key={i} style={{background:cardBg,borderRadius:14,padding:18,border:"1px solid "+colors.g2}}><div style={{height:12,width:i%2?"60%":"40%",background:colors.g2,borderRadius:6,marginBottom:10}}/><div style={{height:8,width:"80%",background:colors.g2,borderRadius:4,marginBottom:6}}/><div style={{height:8,width:"50%",background:colors.g2,borderRadius:4}}/></div>)}</div>:<>
          {vw==="my"&&isPersonal&&<MyDash user={user} peds={peds} users={users} onSel={(p:any)=>sSl(p)} mob={mob} search={search} presu={presu}/>}
          {/* Kanban View (Feature 4) */}
          {vw==="kanban"&&!isPersonal&&<KanbanView peds={peds} users={users} user={user} areas={areas} deptos={deptos} onSel={(p:any)=>sSl(p)} mob={mob} onStatusChange={async(id:number,newSt:string)=>{try{sPd(p=>p.map(x=>x.id===id?{...x,st:newSt}:x));await supabase.from("tasks").update({status:newSt}).eq("id",id);addLog(id,user.id,fn(user),"Cambió estado a "+SC[newSt]?.l,"sys");showT("Estado actualizado");}catch(e:any){showT(e.message||"Error","err");}}}/>}
          {/* Activity Feed (Feature 5) */}
          {vw==="feed"&&!isPersonal&&<ActivityFeed peds={peds} users={users} onSel={(p:any)=>sSl(p)} mob={mob}/>}
          {/* Communications (Feature 9) */}
          {vw==="comm"&&(isAd||user.role==="coordinador")&&<CommView peds={peds} presu={presu} agendas={agendas} minutas={minutas} users={users} areas={areas} deptos={deptos} user={user} mob={mob}/>}
          {/* Recurring Tasks */}
          {vw==="recurrentes"&&(isAd||user.role==="coordinador")&&<RecurrentTasks templates={taskTemplates} users={users} deptos={deptos} areas={areas} user={user} mob={mob} peds={peds}
            onAdd={async(d:any)=>{try{const{data,error}=await supabase.from("task_templates").insert(d).select().single();if(error)throw new Error(error.message);if(data)sTaskTemplates(prev=>[data,...prev]);showT("Template creado");}catch(e:any){showT(e.message||"Error","err");}}}
            onUpd={async(id:number,d:any)=>{try{sTaskTemplates(prev=>prev.map(t=>t.id===id?{...t,...d}:t));await supabase.from("task_templates").update(d).eq("id",id);showT("Template actualizado");}catch(e:any){showT(e.message||"Error","err");}}}
            onDel={async(id:number)=>{try{sTaskTemplates(prev=>prev.filter(t=>t.id!==id));await supabase.from("task_templates").delete().eq("id",id);showT("Template eliminado");}catch(e:any){showT(e.message||"Error","err");}}}
          />}
          {/* Inventario */}
          {vw==="inventario"&&(isAd||user.role==="coordinador")&&<InventarioView items={inventory} users={users} user={user} mob={mob}
            onAdd={async(d:any)=>{try{const{data,error}=await supabase.from("inventory").insert(d).select().single();if(error)throw new Error(error.message);if(data)sInventory(prev=>[data,...prev]);showT("Item agregado");}catch(e:any){showT(e.message||"Error","err");}}}
            onUpd={async(id:number,d:any)=>{try{sInventory(prev=>prev.map(x=>x.id===id?{...x,...d}:x));await supabase.from("inventory").update(d).eq("id",id);showT("Item actualizado");}catch(e:any){showT(e.message||"Error","err");}}}
            onDel={async(id:number)=>{try{sInventory(prev=>prev.filter(x=>x.id!==id));await supabase.from("inventory").delete().eq("id",id);showT("Item eliminado");}catch(e:any){showT(e.message||"Error","err");}}}
          />}
          {/* Reservas */}
          {vw==="reservas"&&<ReservasView bookings={bookings} users={users} user={user} mob={mob}
            onAdd={async(d:any)=>{try{const items=Array.isArray(d)?d:[d];const{data,error}=await supabase.from("bookings").insert(items).select();if(error)throw new Error(error.message);if(data)sBookings(prev=>[...data,...prev]);showT(items.length>1?`${items.length} espacios reservados`:"Espacio reservado");}catch(e:any){showT(e.message||"Error","err");}}}
            onUpd={async(id:number,d:any)=>{try{sBookings(prev=>prev.map(x=>x.id===id?{...x,...d}:x));await supabase.from("bookings").update(d).eq("id",id);showT("Espacio actualizado");}catch(e:any){showT(e.message||"Error","err");}}}
            onDel={async(id:number)=>{try{sBookings(prev=>prev.filter(x=>x.id!==Number(id)));await supabase.from("bookings").delete().eq("id",id);showT("Espacio eliminado");}catch(e:any){showT(e.message||"Error","err");}}}
            onDelMulti={async(ids:string[])=>{try{const numIds=ids.map(Number);sBookings(prev=>prev.filter(x=>!numIds.includes(x.id)));await supabase.from("bookings").delete().in("id",numIds);showT(`${ids.length} espacios eliminados`);}catch(e:any){showT(e.message||"Error","err");}}}
            onUpdMulti={async(ids:string[],d:any)=>{try{const numIds=ids.map(Number);sBookings(prev=>prev.map(x=>numIds.includes(x.id)?{...x,...d}:x));await supabase.from("bookings").update(d).in("id",numIds);showT(`${ids.length} espacios actualizados`);}catch(e:any){showT(e.message||"Error","err");}}}
          />}
          {/* Sponsors */}
          {vw==="sponsors"&&(isAd||user.role==="coordinador"||user.role==="embudo")&&<SponsorsView sponsors={sponsors} user={user} mob={mob} canjeUsado={canjeUsado}
            onAdd={async(d:any)=>{const row={...d,created_by:user.id,created_by_name:fn(user)};const{data,error}=await supabase.from("sponsors").insert(row).select().single();if(error)throw new Error(error.message);if(data){sSponsors(prev=>[data,...prev]);showT("Sponsor agregado");}}}
            onUpd={async(id:number,d:any)=>{try{sSponsors(prev=>prev.map(x=>x.id===id?{...x,...d}:x));await supabase.from("sponsors").update(d).eq("id",id);showT("Sponsor actualizado");}catch(e:any){showT(e.message||"Error","err");}}}
            onDel={async(id:number)=>{try{sSponsors(prev=>prev.filter(x=>x.id!==id));await supabase.from("sponsors").delete().eq("id",id);showT("Sponsor eliminado");}catch(e:any){showT(e.message||"Error","err");}}}
          />}
          {/* Proyectos */}
          {vw==="proyectos"&&<ProyectosView projects={projects} projTasks={projTasks} projBudgets={projBudgets} users={users} user={user} mob={mob}
            onAddProject={async(p:any)=>{try{const row={name:p.name,description:p.description||"",created_by:user.id,created_by_name:fn(user),status:p.status||"borrador"};const{data,error}=await supabase.from("projects").insert(row).select().single();if(error)throw new Error(error.message);if(data)sProjects(prev=>[data,...prev]);showT(p.status==="enviado"?"Proyecto enviado":"Borrador guardado");}catch(e:any){showT(e.message||"Error","err");}}}
            onUpdProject={async(id:number,d:any)=>{try{sProjects(prev=>prev.map(p=>p.id===id?{...p,...d}:p));await supabase.from("projects").update(d).eq("id",id);showT("Proyecto actualizado");}catch(e:any){showT(e.message||"Error","err");}}}
            onDelProject={async(id:number)=>{try{sProjects(prev=>prev.filter(p=>p.id!==id));sProjTasks(prev=>prev.filter((t:any)=>t.project_id!==id));await supabase.from("projects").delete().eq("id",id);showT("Proyecto eliminado");}catch(e:any){showT(e.message||"Error","err");}}}
            onAddTask={async(t:any)=>{try{const{data,error}=await supabase.from("project_tasks").insert(t).select().single();if(error)throw new Error(error.message);if(data)sProjTasks(prev=>[data,...prev]);showT("Tarea creada");}catch(e:any){showT(e.message||"Error","err");}}}
            onUpdTask={async(id:number,d:any)=>{try{sProjTasks(prev=>prev.map((t:any)=>t.id===id?{...t,...d}:t));await supabase.from("project_tasks").update(d).eq("id",id);showT("Tarea actualizada");}catch(e:any){showT(e.message||"Error","err");}}}
            onDelTask={async(id:number)=>{try{sProjTasks(prev=>prev.filter((t:any)=>t.id!==id));await supabase.from("project_tasks").delete().eq("id",id);showT("Tarea eliminada");}catch(e:any){showT(e.message||"Error","err");}}}
            onAddBudget={async(b:any)=>{try{const{data,error}=await supabase.from("project_budgets").insert(b).select().single();if(error)throw new Error(error.message);if(data)sProjBudgets(prev=>[data,...prev]);showT("Presupuesto agregado");}catch(e:any){showT(e.message||"Error","err");}}}
            onUpdBudget={async(id:number,d:any)=>{try{sProjBudgets(prev=>prev.map(b=>b.id===id?{...b,...d}:b));await supabase.from("project_budgets").update(d).eq("id",id);showT("Presupuesto actualizado");}catch(e:any){showT(e.message||"Error","err");}}}
            onDelBudget={async(id:number)=>{try{sProjBudgets(prev=>prev.filter(b=>b.id!==id));await supabase.from("project_budgets").delete().eq("id",id);showT("Presupuesto eliminado");}catch(e:any){showT(e.message||"Error","err");}}}
          />}
          {vw==="org"&&<Org areas={areas} deptos={deptos} users={users} om={om} pedidos={peds} onSel={(p:any)=>sSl(p)} onEditSave={async(id:string,d:any)=>{sOm(p=>p.map(m=>m.id===id?{...m,...d}:m));await supabase.from("org_members").update({first_name:d.n,last_name:d.a,email:d.mail||"",phone:d.tel||""}).eq("id",id);}} onDelOm={async(id:string)=>{sOm(p=>p.filter(m=>m.id!==id));await supabase.from("org_members").delete().eq("id",id);}} onDelUser={async(id:string)=>{sUs(p=>p.filter(u=>u.id!==id));await supabase.from("profiles").delete().eq("id",id);}} onEditUser={(u:any)=>{sVw("profs");}} isSA={isSA} onAssignTask={(u:any)=>{sPreAT(u);sVw("new");}} mob={mob}
            onReorderOm={async(id:string,dir:string,type:string)=>{const grp=om.filter((m:any)=>m.t===type).sort((a:any,b:any)=>(a.so||0)-(b.so||0));const idx=grp.findIndex((m:any)=>m.id===id);const si=dir==="up"?idx-1:idx+1;if(si<0||si>=grp.length)return;[grp[idx],grp[si]]=[grp[si],grp[idx]];const upd:any={};grp.forEach((m:any,i:number)=>{upd[m.id]=i;});sOm(prev=>prev.map((m:any)=>upd[m.id]!==undefined?{...m,so:upd[m.id]}:m));for(const m of grp){await supabase.from("org_members").update({sort_order:upd[m.id]}).eq("id",m.id);}}}
            onReorderUser={async(uid:string,dir:string,dId:number)=>{const grp=users.filter((u:any)=>u.dId===dId).sort((a:any,b:any)=>(a.so||0)-(b.so||0));const idx=grp.findIndex((u:any)=>u.id===uid);const si=dir==="up"?idx-1:idx+1;if(si<0||si>=grp.length)return;[grp[idx],grp[si]]=[grp[si],grp[idx]];const upd:any={};grp.forEach((u:any,i:number)=>{upd[u.id]=i;});sUs(prev=>prev.map((u:any)=>upd[u.id]!==undefined?{...u,so:upd[u.id]}:u));for(const u of grp){await supabase.from("profiles").update({sort_order:upd[u.id]}).eq("id",u.id);}}}
          />}
          {vw==="cal"&&<CalView peds={peds} agendas={agendas} minutas={minutas} presu={presu} reminders={reminders} areas={areas} deptos={deptos} users={users} user={user} onSel={(p:any)=>sSl(p)} mob={mob}
            onNav={(v:string)=>sVw(v)}
            onDateChange={async(id:number,newDate:string)=>{try{sPd(p=>p.map(x=>x.id===id?{...x,fReq:newDate}:x));await supabase.from("tasks").update({due_date:newDate}).eq("id",id);addLog(id,user.id,fn(user),"Cambió fecha límite a "+newDate.split("-").reverse().join("/"),"sys");showT("Fecha actualizada");}catch(e:any){showT(e.message||"Error","err");}}}
            onAddReminder={async(r:any)=>{try{const row:any={user_id:user.id,user_name:fn(user),title:r.title,date:r.date,description:r.description||"",color:r.color||"#3B82F6",recurrence:r.recurrence||"none",assigned_to:r.assigned_to||null,assigned_name:r.assigned_name||""};const{data,error}=await supabase.from("reminders").insert(row).select().single();if(error)throw new Error(error.message);sRems(p=>[...(data?[data]:[]),...p]);showT("Recordatorio creado");}catch(e:any){showT(e.message||"Error","err");}}}
            onDelReminder={async(id:number)=>{try{sRems(p=>p.filter(x=>x.id!==id));await supabase.from("reminders").delete().eq("id",id);showT("Recordatorio eliminado");}catch(e:any){showT(e.message||"Error","err");}}}
          />}
          {vw==="presu"&&(isAd||user.role==="coordinador"||user.role==="embudo")&&<div>{prevVw==="cal"&&<button onClick={()=>sVw("cal")} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"5px 12px",borderRadius:8,border:"1px solid "+colors.g3,background:colors.g1,color:colors.nv,fontSize:11,fontWeight:600,cursor:"pointer",marginBottom:10}}>← Volver al Calendario</button>}<PresView presu={presu} provs={provs} peds={peds} users={users} areas={areas} deptos={deptos} user={user} mob={mob}
            onSel={(p:any)=>sSl(p)}
            onAddPresu={async(d:any)=>{try{const row=presuToDB(d);const{data,error}=await supabase.from("presupuestos").insert(row).select().single();if(error)throw new Error(error.message);sPr(p=>[presuFromDB(data),...p]);showT("Presupuesto agregado");}catch(e:any){showT(e.message||"Error","err");}}}
            onUpdPresu={async(id:number,d:any)=>{try{const prev=presu.find(x=>x.id===id);sPr(p=>p.map(x=>x.id===id?{...x,...d}:x));await supabase.from("presupuestos").update(d).eq("id",id);if(d.status&&prev&&d.status!==prev.status&&prev.solicitado_por){const stLabel=d.status==="aprobado"?"aprobado":d.status==="rechazado"?"rechazado":d.status==="recibido"?"recibido":"actualizado";const reqUser=users.find((u:any)=>fn(u)===prev.solicitado_por||u.id===prev.solicitado_por);if(reqUser&&reqUser.id!==user.id)sendNotif(reqUser.id,"Presupuesto "+stLabel,prev.descripcion?.slice(0,60)||"","budget");}showT("Presupuesto actualizado");}catch(e:any){showT(e.message||"Error","err");}}}
            onDelPresu={async(id:number)=>{try{sPr(p=>p.filter(x=>x.id!==id));await supabase.from("presupuestos").delete().eq("id",id);showT("Presupuesto eliminado");}catch(e:any){showT(e.message||"Error","err");}}}
            onAddProv={async(d:any)=>{try{const{data,error}=await supabase.from("proveedores").insert(d).select().single();if(error)throw new Error(error.message);sPv(p=>[provFromDB(data),...p]);showT("Proveedor agregado");}catch(e:any){showT(e.message||"Error","err");}}}
          /></div>}
          {vw==="reun"&&(isAd||user.role==="coordinador")&&<div>{prevVw==="cal"&&<button onClick={()=>sVw("cal")} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"5px 12px",borderRadius:8,border:"1px solid "+colors.g3,background:colors.g1,color:colors.nv,fontSize:11,fontWeight:600,cursor:"pointer",marginBottom:10}}>← Volver al Calendario</button>}<Reuniones agendas={agendas} minutas={minutas} om={om} users={users} areas={areas} user={user} mob={mob}
            onAddAg={async(a:any)=>{try{const{data,error}=await supabase.from("agendas").insert({type:a.type,area_name:a.areaName||null,date:a.date,sections:a.sections,presentes:a.presentes||[],status:a.status,created_at:a.createdAt||TODAY}).select().single();if(error)throw new Error(error.message);const nid=data?.id||0;sAgs(p=>[{...a,id:nid},...p]);showT(a.status==="enviada"?"OD enviada y minuta creada":"OD guardada");return nid;}catch(e:any){showT(e.message||"Error al guardar OD","err");return 0;}}}
            onUpdAg={async(id:number,d:any)=>{try{sAgs(p=>p.map(a=>a.id===id?{...a,...d,areaName:d.area_name!==undefined?d.area_name:a.areaName}:a));const dbUpd:any={};if(d.status)dbUpd.status=d.status;if(d.sections)dbUpd.sections=d.sections;if(d.presentes)dbUpd.presentes=d.presentes;if(d.date)dbUpd.date=d.date;if(d.area_name!==undefined)dbUpd.area_name=d.area_name;await supabase.from("agendas").update(dbUpd).eq("id",id);showT("OD actualizada");}catch(e:any){showT(e.message||"Error","err");}}}
            onDelAg={async(id:number)=>{try{sAgs(p=>p.filter(a=>a.id!==id));await supabase.from("agendas").delete().eq("id",id);showT("OD eliminada");}catch(e:any){showT(e.message||"Error","err");}}}
            onAddMin={async(m:any)=>{try{const{data}=await supabase.from("minutas").insert({type:m.type,area_name:m.areaName||null,agenda_id:m.agendaId||null,date:m.date,hora_inicio:m.horaInicio,hora_cierre:m.horaCierre,lugar:m.lugar,presentes:m.presentes,ausentes:m.ausentes,sections:m.sections,tareas:m.tareas,status:m.status,created_at:m.createdAt||TODAY}).select().single();if(data)sMins(p=>[{...m,id:data.id},...p]);else sMins(p=>[m,...p]);showT(m.status==="final"?"Minuta finalizada":"Minuta guardada");}catch(e:any){showT(e.message||"Error al guardar minuta","err");}}}
            onUpdMin={async(id:number,d:any)=>{try{sMins(p=>p.map(m=>m.id===id?{...m,...d}:m));const upd:any={};if(d.status)upd.status=d.status;if(d.sections)upd.sections=d.sections;if(d.tareas)upd.tareas=d.tareas;if(d.presentes)upd.presentes=d.presentes;if(d.ausentes)upd.ausentes=d.ausentes;if(d.date)upd.date=d.date;if(d.hora_inicio!==undefined)upd.hora_inicio=d.hora_inicio;if(d.hora_cierre!==undefined)upd.hora_cierre=d.hora_cierre;if(d.lugar!==undefined)upd.lugar=d.lugar;await supabase.from("minutas").update(upd).eq("id",id);showT("Minuta actualizada");}catch(e:any){showT(e.message||"Error","err");}}}
            onDelMin={async(id:number)=>{try{sMins(p=>p.filter(m=>m.id!==id));await supabase.from("minutas").delete().eq("id",id);showT("Minuta eliminada");}catch(e:any){showT(e.message||"Error","err");}}}
            onCreateTasks={async(tareas:any[])=>{try{const ts=TODAY+" "+new Date().toTimeString().slice(0,5);const newTasks:any[]=[];for(const t of tareas){const resp=users.find((u:any)=>u.id===t.respId);const row:any={division:"",creator_id:user.id,creator_name:fn(user),dept_id:resp?.dId||1,tipo:"Administrativo",description:t.desc,due_date:t.fecha||"",urgency:"Normal",status:"curso",assigned_to:t.respId||null,requires_expense:false,expense_ok:null,resolution:"",created_at:TODAY,amount:null};const{data}=await supabase.from("tasks").insert(row).select().single();const tid=data?.id||0;if(tid){await supabase.from("task_messages").insert([{task_id:tid,user_id:user.id,user_name:fn(user),content:"Creó tarea desde minuta",type:"sys"},{task_id:tid,user_id:user.id,user_name:fn(user),content:"Asignó a "+(resp?fn(resp):""),type:"sys"}]);newTasks.push({id:tid,div:"",cId:user.id,cN:fn(user),dId:resp?.dId||1,tipo:"Administrativo",desc:t.desc,fReq:t.fecha||"",urg:"Normal",st:ST.C,asTo:t.respId,rG:false,eOk:null,resp:"",cAt:TODAY,monto:null,log:[{dt:ts,uid:user.id,by:fn(user),act:"Creó tarea desde minuta",t:"sys"},{dt:ts,uid:user.id,by:fn(user),act:"Asignó a "+(resp?fn(resp):""),t:"sys"}]});}}sPd(p=>[...newTasks,...p]);showT(newTasks.length+" tarea(s) creada(s)");}catch(e:any){showT(e.message||"Error al crear tareas","err");}}}
          /></div>}
          {vw==="profs"&&<Profs users={users} deptos={deptos} areas={areas} onDel={async(id:string)=>{try{sUs(p=>p.filter(u=>u.id!==id));await supabase.from("profiles").delete().eq("id",id);showT("Perfil eliminado");}catch(e:any){showT(e.message||"Error","err");}}} onAdd={async(u:any)=>{
            try{const{data:{session}}=await supabase.auth.getSession();const tok=session?.access_token;
            if(!tok||!u.mail){sUs(p=>[...p,u]);showT("Perfil creado (sin cuenta auth)");return;}
            const res=await fetch("/api/admin/create-user",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+tok},body:JSON.stringify({email:u.mail,first_name:u.n,last_name:u.a,role:u.role,dept_id:u.dId,division:u.div,phone:u.tel})});
            const json=await res.json();if(json.error){showT(json.error,"err");return;}if(json.user){sUs(p=>[...p,{...u,id:json.user.id}]);showT("Usuario creado correctamente");}else{sUs(p=>[...p,u]);showT("Perfil creado");}
            }catch(e:any){showT(e.message||"Error al crear usuario","err");}
          }} onEditUser={async(id:string,d:any)=>{
            try{const oldUser=users.find(u=>u.id===id);
            sUs(p=>p.map(u=>u.id===id?{...u,...d}:u));
            await supabase.from("profiles").update({first_name:d.n,last_name:d.a,role:d.role,dept_id:d.dId,division:d.div,email:d.mail||"",phone:d.tel||""}).eq("id",id);
            if(d.mail&&oldUser&&d.mail!==oldUser.mail){const{data:{session}}=await supabase.auth.getSession();const tok=session?.access_token;if(tok)await fetch("/api/admin/create-user",{method:"PUT",headers:{"Content-Type":"application/json","Authorization":"Bearer "+tok},body:JSON.stringify({userId:id,email:d.mail})});}
            showT("Perfil actualizado");}catch(e:any){showT(e.message||"Error","err");}
          }} isAd={isAd} onAssignTask={(u:any)=>{sPreAT(u);sVw("new");}} mob={mob}/>}
          {vw==="new"&&<NP user={user} users={users} deptos={deptos} areas={areas} preAssign={preAT} mob={mob} provs={provs} sponsors={sponsors} canjeUsado={canjeUsado} onSub={async(p:any)=>{
            try{const row:any=taskToDB(p);
            const{data,error}=await supabase.from("tasks").insert(row).select().single();
            if(error)throw new Error(error.message);
            const tid=data?.id||p.id;
            const localP={...p,id:tid};
            sPd(ps=>[localP,...ps]);
            for(const l of (p.log||[])){await supabase.from("task_messages").insert({task_id:tid,user_id:l.uid,user_name:l.by,content:l.act,type:l.t});}
            /* Auto-create presupuesto if rG */
            if(p._presu&&tid){const prRow=presuToDB({...p._presu,task_id:tid,status:PST.SOL,solicitado_por:fn(user),solicitado_at:TODAY});const{data:prData}=await supabase.from("presupuestos").insert(prRow).select().single();if(prData)sPr(prev=>[presuFromDB(prData),...prev]);}
            sPreAT(null);sVw(isPersonal?"my":"dash");sAA(null);sAD(null);showT(p._presu?(p._presu.is_canje?"Tarea creada con canje":"Tarea creada con presupuesto"):"Tarea creada");}catch(e:any){showT(e.message||"Error al crear tarea","err");}
          }} onX={()=>{sPreAT(null);sVw(isPersonal?"my":"dash");}}/>}
          {vw==="proy"&&<Proyecto hitos={hitos} setHitos={(updater:any)=>{sHi((prev:any)=>{const next=typeof updater==="function"?updater(prev):updater;next.forEach((h:any)=>{supabase.from("milestones").update({pct:h.pct}).eq("id",h.id);});return next;});}} isAd={isAd} mob={mob}/>}
          {vw==="dash"&&!isPersonal&&!aA&&!aD&&!kpiFilt&&<CustomDash peds={peds} presu={presu} agendas={agendas} minutas={minutas} users={users} areas={areas} deptos={deptos} user={user} mob={mob} bookings={bookings} onSel={(p:any)=>sSl(p)} onFilter={(k:string)=>sKpiFilt(k)} onAC={hAC} isSA={isSA} onNav={(view:string,filt?:string)=>{if(view==="filter"&&filt){sKpiFilt(filt);}else{sVw(view);}}}
            onExportWeekly={()=>{const today=new Date();const weekAgo=new Date(today.getTime()-7*86400000);const fmtD2=(d:Date)=>d.toISOString().slice(0,10);const range=fmtD2(weekAgo)+" al "+fmtD2(today);const ok=peds.filter((p:any)=>p.st===ST.OK);const pend=peds.filter((p:any)=>p.st===ST.P);const od=peds.filter((p:any)=>p.st!==ST.OK&&isOD(p.fReq));const approvedPr=presu.filter((pr:any)=>pr.status==="aprobado");const pendPr=presu.filter((pr:any)=>pr.status!=="aprobado"&&pr.status!=="rechazado");const topAreas=areas.map((a:any)=>{const dIds=deptos.filter((d:any)=>d.aId===a.id).map((d:any)=>d.id);const aP=peds.filter((p:any)=>dIds.indexOf(p.dId)>=0);const aOk=aP.filter((p:any)=>p.st===ST.OK).length;return{name:a.name,total:aP.length,completed:aOk,pct:aP.length?Math.round(aOk/aP.length*100):0};}).filter((a:any)=>a.total>0);exportReportPDF({period:"Semanal",dateRange:range,stats:[{label:"Total tareas",value:String(peds.length),color:"#0A1628"},{label:"Completadas",value:String(ok.length),color:"#10B981"},{label:"Pendientes",value:String(pend.length),color:"#DC2626"},{label:"Vencidas",value:String(od.length),color:"#7C3AED"}],tasksByStatus:Object.keys(SC).map(k=>({status:SC[k].l,icon:SC[k].i,count:peds.filter((p:any)=>p.st===k).length,color:SC[k].c})),completedTasks:ok.slice(0,20).map((p:any)=>{const ag=users.find((u:any)=>u.id===p.asTo);return{id:p.id,desc:p.desc,assignee:ag?fn(ag):"–",date:p.fReq};}),pendingTasks:[...od,...pend].slice(0,20).map((p:any)=>{const ag=users.find((u:any)=>u.id===p.asTo);return{id:p.id,desc:p.desc,assignee:ag?fn(ag):"–",date:p.fReq,overdue:p.st!==ST.OK&&isOD(p.fReq)};}),budgetSummary:{total:presu.reduce((s:number,p:any)=>s+Number(p.monto||0),0),approved:approvedPr.reduce((s:number,p:any)=>s+Number(p.monto||0),0),pending:pendPr.reduce((s:number,p:any)=>s+Number(p.monto||0),0),currency:"ARS"},topAreas});}}
            onExportMonthly={()=>{const today=new Date();const monthAgo=new Date(today.getFullYear(),today.getMonth()-1,today.getDate());const fmtD2=(d:Date)=>d.toISOString().slice(0,10);const range=fmtD2(monthAgo)+" al "+fmtD2(today);const ok=peds.filter((p:any)=>p.st===ST.OK);const pend=peds.filter((p:any)=>p.st===ST.P);const od=peds.filter((p:any)=>p.st!==ST.OK&&isOD(p.fReq));const approvedPr=presu.filter((pr:any)=>pr.status==="aprobado");const pendPr=presu.filter((pr:any)=>pr.status!=="aprobado"&&pr.status!=="rechazado");const topAreas=areas.map((a:any)=>{const dIds=deptos.filter((d:any)=>d.aId===a.id).map((d:any)=>d.id);const aP=peds.filter((p:any)=>dIds.indexOf(p.dId)>=0);const aOk=aP.filter((p:any)=>p.st===ST.OK).length;return{name:a.name,total:aP.length,completed:aOk,pct:aP.length?Math.round(aOk/aP.length*100):0};}).filter((a:any)=>a.total>0);exportReportPDF({period:"Mensual",dateRange:range,stats:[{label:"Total tareas",value:String(peds.length),color:"#0A1628"},{label:"Completadas",value:String(ok.length),color:"#10B981"},{label:"Pendientes",value:String(pend.length),color:"#DC2626"},{label:"Vencidas",value:String(od.length),color:"#7C3AED"}],tasksByStatus:Object.keys(SC).map(k=>({status:SC[k].l,icon:SC[k].i,count:peds.filter((p:any)=>p.st===k).length,color:SC[k].c})),completedTasks:ok.slice(0,20).map((p:any)=>{const ag=users.find((u:any)=>u.id===p.asTo);return{id:p.id,desc:p.desc,assignee:ag?fn(ag):"–",date:p.fReq};}),pendingTasks:[...od,...pend].slice(0,20).map((p:any)=>{const ag=users.find((u:any)=>u.id===p.asTo);return{id:p.id,desc:p.desc,assignee:ag?fn(ag):"–",date:p.fReq,overdue:p.st!==ST.OK&&isOD(p.fReq)};}),budgetSummary:{total:presu.reduce((s:number,p:any)=>s+Number(p.monto||0),0),approved:approvedPr.reduce((s:number,p:any)=>s+Number(p.monto||0),0),pending:pendPr.reduce((s:number,p:any)=>s+Number(p.monto||0),0),currency:"ARS"},topAreas});}}
          />}
          {vw==="dash"&&!isPersonal&&!aA&&!aD&&kpiFilt&&(()=>{const fl=KPIF[kpiFilt];const fp=kpiFilter(peds,kpiFilt);return <div><Bread parts={[{label:"Dashboard",onClick:()=>sKpiFilt(null)},{label:fl?.l||""}]} mob={mob}/><TList title={fl?.l||""} icon={fl?.i||""} color={fl?.c||T.bl} peds={fp} users={users} onSel={(p:any)=>sSl(p)} search={search} mob={mob} onBulk={handleBulk} onImport={handleImport} user={user}/></div>;})()}
          {vw==="dash"&&!isPersonal&&aA&&!aD&&(aA===100||aA===101)&&<div><Bread parts={[{label:"Dashboard",onClick:()=>{sAA(null);sKpiFilt(null);}},{label:vT}]} mob={mob}/><KPIs peds={vP} mob={mob} onFilter={(k:string)=>{sAA(null);sKpiFilt(k);}}/><TList title={vT} icon={vI} color={vC} peds={vP} users={users} onSel={(p:any)=>sSl(p)} search={search} mob={mob} onBulk={handleBulk} onImport={handleImport} user={user}/></div>}
          {vw==="dash"&&!isPersonal&&aA&&!aD&&aA!==100&&aA!==101&&(()=>{const selAr=areas.find((a:any)=>a.id===aA);return <div><Bread parts={[{label:"Dashboard",onClick:()=>{sAA(null);sKpiFilt(null);}},{label:selAr?.name||""}]} mob={mob}/><h2 style={{margin:"0 0 4px",fontSize:mob?16:19,color:colors.nv,fontWeight:800}}>{selAr?.icon} {selAr?.name}</h2><p style={{color:colors.g4,fontSize:12,margin:"0 0 16px"}}>{deptos.filter((d:any)=>d.aId===aA).length} departamentos</p><KPIs peds={vP} mob={mob} onFilter={(k:string)=>{sAA(null);sKpiFilt(k);}}/><DeptCircles area={selAr} deptos={deptos} pedidos={peds} onDC={(id:number)=>sAD(id)} mob={mob}/></div>;})()}
          {vw==="dash"&&!isPersonal&&aD&&(()=>{const selAr=areas.find((a:any)=>a.id===aA);const selDp=deptos.find((d:any)=>d.id===aD);return <div><Bread parts={[{label:"Dashboard",onClick:()=>{sAA(null);sAD(null);sKpiFilt(null);}},{label:selAr?.name||"",onClick:()=>{sAD(null);sKpiFilt(null);}},{label:selDp?.name||""}]} mob={mob}/><TList title={vT} icon={vI} color={vC} peds={vP} users={users} onSel={(p:any)=>sSl(p)} search={search} mob={mob} onBulk={handleBulk} onImport={handleImport} user={user}/></div>;})()}
          </>}
        </div>
      </div>
      {showPw&&<ChangePw onX={()=>sShowPw(false)}/>}
      {sel&&<Det p={peds.find(x=>x.id===sel.id)||sel} user={user} users={users} presu={presu} provs={provs} sponsors={sponsors} onX={()=>sSl(null)} mob={mob}
        onDup={async(p:any)=>{try{const ts=TODAY+" "+new Date().toTimeString().slice(0,5);const row:any=taskToDB({...p,st:ST.P,asTo:null,resp:"",monto:null,eOk:null,cAt:TODAY,cId:user.id,cN:fn(user)});const{data,error}=await supabase.from("tasks").insert(row).select().single();if(error)throw new Error(error.message);const tid=data?.id||0;const newP={...p,id:tid,st:ST.P,asTo:null,resp:"",monto:null,eOk:null,cAt:TODAY,cId:user.id,cN:fn(user),log:[{dt:ts,uid:user.id,by:fn(user),act:"Creó tarea (duplicada de #"+p.id+")",t:"sys"}]};sPd(ps=>[newP,...ps]);await supabase.from("task_messages").insert({task_id:tid,user_id:user.id,user_name:fn(user),content:"Creó tarea (duplicada de #"+p.id+")",type:"sys"});sSl(newP);showT("Tarea duplicada");}catch(e:any){showT(e.message||"Error","err");}}}
        onCheck={async(id:number,items:any[])=>{try{/* save checklist as special log entries */for(const item of items){await supabase.from("task_messages").upsert({task_id:id,user_id:user.id,user_name:fn(user),content:JSON.stringify(item),type:"check"});}/* update local */const ts=TODAY+" "+new Date().toTimeString().slice(0,5);sPd(p=>p.map(x=>x.id===id?{...x,log:[...(x.log||[]).filter((l:any)=>l.t!=="check"),...items.map(item=>({dt:ts,uid:user.id,by:fn(user),act:JSON.stringify(item),t:"check"}))]}:x));}catch(e:any){showT(e.message||"Error","err");}}}
        onAddPresu={async(d:any)=>{try{const row=presuToDB(d);const{data,error}=await supabase.from("presupuestos").insert(row).select().single();if(error)throw new Error(error.message);sPr(p=>[presuFromDB(data),...p]);showT("Presupuesto agregado");}catch(e:any){showT(e.message||"Error","err");}}}
        onUpdPresu={async(id:number,d:any)=>{try{const prev=presu.find(x=>x.id===id);sPr(p=>p.map(x=>x.id===id?{...x,...d}:x));await supabase.from("presupuestos").update(d).eq("id",id);if(d.status&&prev&&d.status!==prev.status&&prev.solicitado_por){const stLabel=d.status==="aprobado"?"aprobado":d.status==="rechazado"?"rechazado":d.status==="recibido"?"recibido":"actualizado";const reqUser=users.find((u:any)=>fn(u)===prev.solicitado_por||u.id===prev.solicitado_por);if(reqUser&&reqUser.id!==user.id)sendNotif(reqUser.id,"Presupuesto "+stLabel,prev.descripcion?.slice(0,60)||"","budget");}showT("Presupuesto actualizado");}catch(e:any){showT(e.message||"Error","err");}}}
        onDelPresu={async(id:number)=>{try{sPr(p=>p.filter(x=>x.id!==id));await supabase.from("presupuestos").delete().eq("id",id);showT("Presupuesto eliminado");}catch(e:any){showT(e.message||"Error","err");}}}
        onTk={async(id:number)=>{try{sPd(p=>p.map(x=>x.id===id?{...x,asTo:user.id,st:ST.C}:x));await supabase.from("tasks").update({assigned_to:user.id,status:ST.C}).eq("id",id);addLog(id,user.id,fn(user),"Tomó la tarea","sys");showT("Tarea tomada");}catch(e:any){showT(e.message||"Error","err");}}}
        onAs={async(id:number,uid:string)=>{try{const ag=users.find(u=>u.id===uid);const p2=peds.find(x=>x.id===id);const newSt=p2?.st===ST.P?ST.C:p2?.st;sPd(p=>p.map(x=>x.id===id?{...x,asTo:uid,st:x.st===ST.P?ST.C:x.st}:x));await supabase.from("tasks").update({assigned_to:uid,status:newSt}).eq("id",id);addLog(id,user.id,fn(user),"Asignó a "+(ag?fn(ag):""),"sys");sendNotif(uid,"Te asignaron una tarea",p2?.desc||"","task","",true);showT("Tarea asignada");}catch(e:any){showT(e.message||"Error","err");}}}
        onRe={async(id:number,r:string)=>{try{const sr=sanitize(r);sPd(p=>p.map(x=>x.id===id?{...x,resp:sr}:x));await supabase.from("tasks").update({resolution:sr}).eq("id",id);showT("Resolución guardada");}catch(e:any){showT(e.message||"Error","err");}}}
        onSE={async(id:number)=>{try{sPd(p=>p.map(x=>x.id===id?{...x,st:ST.E}:x));await supabase.from("tasks").update({status:ST.E}).eq("id",id);addLog(id,user.id,fn(user),"Envió a Compras","sys");users.filter(u=>u.role==="embudo").forEach(u=>sendNotif(u.id,"Nueva tarea en Compras",peds.find(x=>x.id===id)?.desc||"","budget"));showT("Enviado a Compras");sSl(null);}catch(e:any){showT(e.message||"Error","err");}}}
        onEO={async(id:number,ok:boolean)=>{try{const p2=peds.find(x=>x.id===id);sPd(p=>p.map(x=>x.id===id?{...x,st:ST.C,eOk:ok}:x));await supabase.from("tasks").update({status:ST.C,expense_ok:ok}).eq("id",id);addLog(id,user.id,fn(user),ok?"Compras aprobó":"Compras rechazó","sys");if(p2?.asTo)sendNotif(p2.asTo,ok?"Gasto aprobado":"Gasto rechazado",p2.desc||"","budget");if(p2?.cId&&p2.cId!==p2.asTo)sendNotif(p2.cId,ok?"Gasto aprobado":"Gasto rechazado",p2.desc||"","budget");showT(ok?"Gasto aprobado":"Gasto rechazado");sSl(null);}catch(e:any){showT(e.message||"Error","err");}}}
        onFi={async(id:number)=>{try{const p2=peds.find(x=>x.id===id);sPd(p=>p.map(x=>x.id===id?{...x,st:ST.V}:x));await supabase.from("tasks").update({status:ST.V}).eq("id",id);addLog(id,user.id,fn(user),"Envió a validación","sys");if(p2?.cId)sendNotif(p2.cId,"Tarea lista para validar",p2.desc||"","task");showT("Enviado a validación");sSl(null);}catch(e:any){showT(e.message||"Error","err");}}}
        onVa={async(id:number,ok:boolean)=>{try{const p2=peds.find(x=>x.id===id);const ns=ok?ST.OK:ST.C;sPd(p=>p.map(x=>x.id===id?{...x,st:ns}:x));await supabase.from("tasks").update({status:ns}).eq("id",id);addLog(id,user.id,fn(user),ok?"Validó OK ✅":"Rechazó","sys");if(p2?.asTo)sendNotif(p2.asTo,ok?"Tarea completada":"Tarea rechazada",p2.desc||"","task");let autoInv=false;if(ok&&p2?.rG&&p2?.tipo==="Material deportivo"){const ag=users.find((u:any)=>u.id===p2.asTo);const{data:invD}=await supabase.from("inventory").insert({name:p2.desc||"Material",category:"deportivo",quantity:1,condition:"nuevo",responsible_id:p2.asTo||null,responsible_name:ag?fn(ag):"",notes:"Auto tarea #"+id}).select().single();if(invD){sInventory(prev=>[invD,...prev]);autoInv=true;}}showT(ok?(autoInv?"Completada + Inventario":"Tarea completada"):"Tarea rechazada");sSl(null);}catch(e:any){showT(e.message||"Error","err");}}}
        onMsg={async(id:number,txt:string)=>{try{const safe=sanitize(txt);if(!safe)return;await addLog(id,user.id,fn(user),safe,"msg");/* Notify assignee on new comment */const p2=peds.find(x=>x.id===id);if(p2?.asTo&&p2.asTo!==user.id){sendNotif(p2.asTo,"Nuevo comentario en tarea #"+id,txt.slice(0,80),"task");}/* @mention notifications (Feature 7) */const mentionRx=/@([\w\s]+?)(?=\s@|$)/g;let match;while((match=mentionRx.exec(txt))!==null){const mName=match[1].trim();const mUser=users.find((u:any)=>(fn(u)).toLowerCase()===mName.toLowerCase());if(mUser&&mUser.id!==user.id&&mUser.id!==p2?.asTo){sendNotif(mUser.id,"Te mencionaron en tarea #"+id,txt.slice(0,80),"task");}}}catch(e:any){showT("Error al enviar mensaje","err");}}}
        onMonto={async(id:number,m:number)=>{try{sPd(p=>p.map(x=>x.id===id?{...x,monto:m}:x));await supabase.from("tasks").update({amount:m}).eq("id",id);}catch(e:any){showT(e.message||"Error","err");}}}
        onDel={async(id:number)=>{try{sPd(p=>p.filter(x=>x.id!==id));await supabase.from("tasks").delete().eq("id",id);showT("Tarea eliminada");sSl(null);}catch(e:any){showT(e.message||"Error","err");}}}
        onEditSave={async(id:number,d:any)=>{try{const sd={...d,desc:sanitize(d.desc||"")};sPd(p=>p.map(x=>x.id===id?{...x,...sd}:x));await supabase.from("tasks").update({tipo:sd.tipo,description:sd.desc,due_date:sd.fReq,urgency:sd.urg,division:sd.div||"",requires_expense:sd.rG}).eq("id",id);addLog(id,user.id,fn(user),"Editó la tarea","sys");showT("Tarea actualizada");}catch(e:any){showT(e.message||"Error","err");}}}
      />}
      {/* ── Notification Center Panel ── */}
      {shNot&&<>
        <div onClick={()=>sShNot(false)} style={{position:"fixed" as const,inset:0,background:"rgba(0,0,0,.3)",zIndex:200}}/>
        <div style={{position:"fixed" as const,top:0,right:0,bottom:0,width:mob?"100%":360,background:cardBg,zIndex:201,boxShadow:"-4px 0 24px rgba(0,0,0,.12)",display:"flex",flexDirection:"column" as const,borderLeft:"1px solid "+colors.g2}}>
          {/* Header */}
          <div style={{padding:"14px 16px",borderBottom:"1px solid "+colors.g2,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
            <div style={{fontSize:15,fontWeight:800,color:colors.nv}}>Notificaciones</div>
            <button onClick={()=>sShNot(false)} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:colors.g4,padding:4,minWidth:36,minHeight:36,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          </div>
          {/* Filters */}
          <div style={{padding:"8px 16px",borderBottom:"1px solid "+colors.g2,display:"flex",gap:4,flexWrap:"wrap" as const,flexShrink:0}}>
            {[{k:"all",l:"Todas"},{k:"unread",l:"No leidas"},{k:"task",l:"Tareas"},{k:"budget",l:"Compras"},{k:"deadline",l:"Vencimientos"}].map(f=>
              <button key={f.k} onClick={()=>{sNotifFilter(f.k);sNotifPage(0);refreshNotifs({filter:f.k,offset:0});}} style={{padding:"5px 10px",borderRadius:6,border:"1px solid "+(notifFilter===f.k?colors.bl:colors.g3),background:notifFilter===f.k?colors.bl+"15":"transparent",color:notifFilter===f.k?colors.bl:colors.g5,fontSize:10,fontWeight:600,cursor:"pointer"}}>{f.l}</button>
            )}
          </div>
          {/* Computed notifications (real-time) */}
          {computedNts.length>0&&<div style={{padding:"8px 16px",borderBottom:"1px solid "+colors.g2,flexShrink:0}}>
            <div style={{fontSize:9,fontWeight:700,color:colors.g4,textTransform:"uppercase" as const,letterSpacing:1,marginBottom:4}}>En tiempo real</div>
            {computedNts.map((n:any,i:number)=><div key={"c"+i} onClick={()=>{sShNot(false);if(n.first)sSl(n.first);else if(n.act){sVw(n.act);sAA(null);sAD(null);}}} style={{padding:"8px 10px",borderRadius:8,background:n.c+"10",marginBottom:3,fontSize:11,color:n.c,fontWeight:600,cursor:"pointer",borderLeft:"3px solid "+n.c}}>{n.t}</div>)}
          </div>}
          {/* DB notifications grouped by date */}
          <div style={{flex:1,overflowY:"auto" as const,padding:"8px 16px"}}>
            {dbNotifs.length===0&&<div style={{textAlign:"center" as const,padding:24,color:colors.g4,fontSize:11}}>Sin notificaciones{notifFilter!=="all"?" con este filtro":""}</div>}
            {ntGrouped.map(([dateKey,items])=>(
              <div key={dateKey} style={{marginBottom:12}}>
                <div style={{fontSize:9,fontWeight:700,color:colors.g4,textTransform:"uppercase" as const,letterSpacing:1,marginBottom:4,padding:"0 2px"}}>{dateKey}</div>
                {items.map((n:any)=>{const c=ntColor(n.type);const unread=!n.read;return(
                  <div key={n.id} onClick={()=>{if(unread){getToken().then(tok=>markRead(tok,[n.id]));sDbNotifs(prev=>prev.map(x=>x.id===n.id?{...x,read:true}:x));}sShNot(false);if(n.link){window.location.hash=n.link;}else{sVw("dash");sAA(null);sAD(null);}}} style={{padding:"8px 10px",borderRadius:8,background:unread?c+"10":"transparent",marginBottom:3,cursor:"pointer",borderLeft:unread?"3px solid "+c:"3px solid transparent",transition:"background .15s"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:6}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:11,fontWeight:unread?700:500,color:unread?colors.nv:colors.g5}}>{n.title}</div>
                        {n.message&&<div style={{fontSize:10,color:colors.g4,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{n.message}</div>}
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                        {unread&&<span style={{width:6,height:6,borderRadius:3,background:c,flexShrink:0}}/>}
                        <span style={{fontSize:9,color:colors.g4,whiteSpace:"nowrap" as const}}>{n.created_at?n.created_at.slice(11,16):""}</span>
                      </div>
                    </div>
                  </div>
                );})}
              </div>
            ))}
            {/* Load more */}
            {dbNotifs.length<notifTotal&&<div style={{textAlign:"center",padding:"8px 0"}}>
              <button onClick={()=>{const next=notifPage+1;sNotifPage(next);refreshNotifs({filter:notifFilter,offset:next*NOTIF_LIMIT,append:true});}} style={{padding:"6px 16px",borderRadius:6,border:"1px solid "+colors.g3,background:"transparent",color:colors.bl,fontSize:10,fontWeight:600,cursor:"pointer"}}>Cargar mas ({notifTotal-dbNotifs.length} restantes)</button>
            </div>}
          </div>
          {/* Footer actions */}
          <div style={{padding:"10px 16px",borderTop:"1px solid "+colors.g2,display:"flex",gap:6,flexShrink:0,flexWrap:"wrap" as const}}>
            {unreadDb.length>0&&<button onClick={async()=>{const tok=await getToken();await markRead(tok);sDbNotifs(prev=>prev.map((n:any)=>({...n,read:true})));}} style={{flex:1,padding:"8px 0",borderRadius:6,border:"1px solid "+colors.g3,background:"transparent",color:colors.bl,fontSize:10,fontWeight:600,cursor:"pointer"}}>Marcar todas como leidas</button>}
            {!pushEnabled&&"Notification" in (typeof window!=="undefined"?window:{})&&<button onClick={requestPush} style={{flex:1,padding:"8px 0",borderRadius:6,border:"1px solid "+colors.bl,background:"transparent",color:colors.bl,fontSize:10,fontWeight:600,cursor:"pointer"}}>Activar push</button>}
          </div>
        </div>
      </>}
      <CommandPalette open={cmdOpen} onClose={()=>sCmdOpen(false)} items={cmdItems}/>
      {toast&&<Toast msg={toast.msg} type={toast.type} onDone={()=>sToast(null)}/>}
    </div>
    </ThemeCtx.Provider>
    </ErrorBoundary>
  );
}