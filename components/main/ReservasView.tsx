"use client";
import { useState, useMemo, useRef } from "react";
import { BOOK_FAC, BOOK_ST, RENTABLE_FAC, RENTAL_ST, RENTAL_APPROVERS, RENTAL_PAYMENT, fn } from "@/lib/constants";
import { fmtD } from "@/lib/mappers";
import { Btn, Card } from "@/components/ui";
import { useC } from "@/lib/theme-context";
import { ClubMap } from "./ClubMap";
import { useDataStore } from "@/lib/store";
import { uploadFile } from "@/lib/storage";

const TODAY=new Date().toISOString().slice(0,10);
const FKEYS=Object.keys(BOOK_FAC);
const SKEYS=Object.keys(BOOK_ST);
const DIAS_SEM=["Lu","Ma","Mi","Ju","Vi","Sa","Do"];
const REC_OPTS:{k:string;l:string;i:string}[]=[
  {k:"none",l:"Sin repetición",i:"1️⃣"},
  {k:"semanal",l:"Semanal (por día)",i:"📅"},
  {k:"mensual",l:"Mensual (6 meses)",i:"🗓️"},
  {k:"anual",l:"Anual (3 años)",i:"📆"}
];
const DIAS_SEMANA=[
  {k:1,l:"Lunes",s:"Lu"},{k:2,l:"Martes",s:"Ma"},{k:3,l:"Miércoles",s:"Mi"},
  {k:4,l:"Jueves",s:"Ju"},{k:5,l:"Viernes",s:"Vi"},{k:6,l:"Sábado",s:"Sa"},{k:0,l:"Domingo",s:"Do"}
];
const WEEKS_AHEAD=12;

const getMonday=(dt:Date)=>{const d=new Date(dt);const day=d.getDay();const diff=d.getDate()-day+(day===0?-6:1);d.setDate(diff);return d;};
const addDays=(dt:Date,n:number)=>{const d=new Date(dt);d.setDate(d.getDate()+n);return d;};
const dateISO=(dt:Date)=>dt.toISOString().slice(0,10);
const timeToMin=(t:string)=>{const [h,m]=t.split(":").map(Number);return h*60+(m||0);};
const overlap=(a0:string,a1:string,b0:string,b1:string)=>timeToMin(a0)<timeToMin(b1)&&timeToMin(b0)<timeToMin(a1);

const generateDates=(startDate:string,rec:string,recDays?:number[])=>{
  if(rec==="none") return [startDate];
  const start=new Date(startDate);
  if(rec==="semanal"&&recDays&&recDays.length>0){
    // Generate dates for selected weekdays over WEEKS_AHEAD weeks
    const dates:string[]=[];
    for(let w=0;w<WEEKS_AHEAD;w++){
      for(const dayNum of recDays){
        const d=new Date(start);
        d.setDate(d.getDate()+w*7);
        // Align to the correct day of week
        const curr=d.getDay();
        const diff=dayNum-curr;
        d.setDate(d.getDate()+diff);
        if(d>=start) dates.push(dateISO(d));
      }
    }
    // Deduplicate and sort
    return [...new Set(dates)].sort();
  }
  const dates=[startDate];
  for(let i=1;i<(rec==="mensual"?6:3);i++){
    const nd=new Date(start);
    if(rec==="semanal") nd.setDate(nd.getDate()+7*i);
    else if(rec==="mensual") nd.setMonth(nd.getMonth()+i);
    else if(rec==="anual") nd.setFullYear(nd.getFullYear()+i);
    dates.push(dateISO(nd));
  }
  return dates;
};

/* ── Division color groups for calendar cells ── */
const DIV_COL:Record<string,string>={};
["Escuelita","M5","M6","M7","M8","M9","M10","M11","M12"].forEach(d=>{DIV_COL[d]="#10B981";});
["M13","M14"].forEach(d=>{DIV_COL[d]="#3B82F6";});
["M15","M16","M17","M18","M19"].forEach(d=>{DIV_COL[d]="#F59E0B";});
["Plantel Superior","Intermedia","Primera"].forEach(d=>{DIV_COL[d]="#DC2626";});
const DIV_KEYS=Object.keys(DIV_COL).sort((a,b)=>b.length-a.length);
const extractDiv=(title:string)=>{if(!title)return null;const t=title.trim();for(const d of DIV_KEYS){if(t.includes(d))return d;}const m=t.match(/M\d+/i);if(m)return m[0].toUpperCase();return null;};
const divSortKey=(b:any)=>{const div=b.division||extractDiv(b.title)||"";const m=div.match(/(\d+)/);return m?Number(m[1]):div==="Escuelita"?0:div==="Intermedia"?50:div==="Plantel Superior"?60:div==="Primera"?61:div==="Hockey"?70:99;};

const DIV_LIST=["","Escuelita","M5","M6","M7","M8","M9","M10","M11","M12","M13","M14","M15","M16","M17","M18","M19","Intermedia","Plantel Superior","Primera","Hockey"];
const emptyForm=()=>({facility:"cancha1",date:TODAY,time_start:"09:00",time_end:"10:00",title:"",division:"",description:"",notes:"",status:"pendiente",recurrence:"none",recDays:[] as number[]});
const genSeriesId=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);

export function ReservasView({user,mob,onAdd,onUpd,onDel,onDelMulti,onUpdMulti,onAddRental,onUpdRental,onUpdRentalConfig}:any){
  const bookings = useDataStore(s => s.bookings);
  const users = useDataStore(s => s.users);
  const rentalConfig = useDataStore(s => s.rentalConfig);
  const {colors,isDark,cardBg}=useC();

  /* tabs */
  const [tab,sTab]=useState<"calendario"|"mapa"|"alquileres">("calendario");
  const [mapDate,sMapDate]=useState(TODAY);
  /* week nav */
  const [weekStart,sWeekStart]=useState(()=>getMonday(new Date()));
  /* filters */
  const [fFac,sFFac]=useState("");
  const [fSearch,sFSearch]=useState("");
  const [fDateFrom,sFDateFrom]=useState("");
  const [fDateTo,sFDateTo]=useState("");
  /* modal / editing */
  const [showAdd,sShowAdd]=useState(false);
  const [form,sForm]=useState<any>(emptyForm());
  const [editId,sEditId]=useState<string|null>(null);
  const [editForm,sEditForm]=useState<any>(null);
  /* sort */
  const [sortAsc,sSortAsc]=useState(true);
  /* series action modals */
  const [delModal,sDelModal]=useState<any>(null);
  const [saveModal,sSaveModal]=useState(false);
  /* multi-select for bulk delete */
  const [selMode,sSelMode]=useState(false);
  const [selIds,sSelIds]=useState<Set<string>>(new Set());

  /* ── find series siblings ── */
  const getSiblings=(b:any)=>{
    if(!b) return [];
    const all=bookings||[];
    // By series_id first
    if(b.series_id) return all.filter((x:any)=>x.series_id===b.series_id&&x.id!==b.id);
    // Fallback: same facility+title+time
    return all.filter((x:any)=>x.id!==b.id&&x.facility===b.facility&&x.title===b.title&&x.time_start===b.time_start&&x.time_end===b.time_end);
  };
  const getEditingBooking=()=>{
    if(!editId) return null;
    return (bookings||[]).find((b:any)=>String(b.id)===editId)||null;
  };

  /* ── week days ── */
  const weekDays=useMemo(()=>{const d:string[]=[];for(let i=0;i<7;i++) d.push(dateISO(addDays(weekStart,i)));return d;},[weekStart]);

  /* ── filtered bookings ── */
  const filtered=useMemo(()=>{
    let v=[...(bookings||[])];
    if(fFac) v=v.filter((b:any)=>b.facility===fFac);
    if(fSearch){const s=fSearch.toLowerCase();v=v.filter((b:any)=>(b.title+b.description+b.notes+(BOOK_FAC[b.facility]?.l||"")).toLowerCase().includes(s));}
    if(fDateFrom) v=v.filter((b:any)=>b.date>=fDateFrom);
    if(fDateTo) v=v.filter((b:any)=>b.date<=fDateTo);
    return v;
  },[bookings,fFac,fSearch,fDateFrom,fDateTo]);

  /* ── KPIs this week ── */
  const weekBookings=useMemo(()=>(bookings||[]).filter((b:any)=>b.date>=weekDays[0]&&b.date<=weekDays[6]),[bookings,weekDays]);
  const kConfirmed=weekBookings.filter((b:any)=>b.status==="confirmada").length;
  const kPending=weekBookings.filter((b:any)=>b.status==="pendiente").length;
  const facCounts=useMemo(()=>{const m:Record<string,number>={};weekBookings.forEach((b:any)=>{m[b.facility]=(m[b.facility]||0)+1;});return m;},[weekBookings]);

  /* ── overlap info (non-blocking) ── */
  const getOverlapping=(fac:string,date:string,ts:string,te:string,excludeId?:string)=>{
    return (bookings||[]).filter((b:any)=>b.facility===fac&&b.date===date&&b.status!=="cancelada"&&(excludeId?String(b.id)!==String(excludeId):true)&&overlap(ts,te,b.time_start,b.time_end));
  };
  const formOverlap=getOverlapping(form.facility,form.date,form.time_start,form.time_end);
  const editOverlap=editForm?getOverlapping(editForm.facility,editForm.date,editForm.time_start,editForm.time_end,editId||undefined):[];

  /* ── helpers ── */
  const resetForm=()=>{sForm(emptyForm());sShowAdd(false);};
  const openForm=(fac?:string,date?:string)=>{
    const f=emptyForm();
    if(fac) f.facility=fac;
    if(date) f.date=date;
    f.title=BOOK_FAC[f.facility]?.l||"";
    sForm(f);sShowAdd(true);
  };
  const startEdit=(b:any)=>{sShowAdd(false);sEditId(String(b.id));sEditForm({facility:b.facility,date:b.date,time_start:b.time_start,time_end:b.time_end,title:b.title,division:b.division||"",description:b.description||"",notes:b.notes||"",status:b.status});};
  const cancelEdit=()=>{sEditId(null);sEditForm(null);};
  const userName=(uid:string)=>{const u=(users||[]).find((u2:any)=>u2.id===uid);return u?fn(u):"";};

  /* ── DELETE handlers ── */
  const promptDelete=(b:any)=>{
    const sibs=getSiblings(b);
    if(sibs.length>0){
      sDelModal(b);// show modal with options
    } else {
      // single event, just delete
      if(confirm("Eliminar este espacio?")){ onDel(String(b.id)); if(editId===String(b.id)) cancelEdit(); }
    }
  };
  const doDelete=(scope:"one"|"all")=>{
    if(!delModal) return;
    const b=delModal;
    if(scope==="one"){
      onDel(String(b.id));
    } else {
      // delete entire series
      const sibs=getSiblings(b);
      const ids=[String(b.id),...sibs.map((s:any)=>String(s.id))];
      if(onDelMulti){ onDelMulti(ids); }
      else { ids.forEach(id=>onDel(id)); }
    }
    if(editId===String(b.id)) cancelEdit();
    sDelModal(null);
  };

  /* ── SAVE handlers ── */
  const doSave=(scope:"one"|"future")=>{
    if(!editId||!editForm) return;
    const cur=getEditingBooking();
    if(scope==="one"){
      onUpd(editId,editForm);
    } else {
      // update this + future siblings
      const sibs=getSiblings(cur);
      const futureIds=sibs.filter((s:any)=>s.date>=cur.date).map((s:any)=>String(s.id));
      const allIds=[editId,...futureIds];
      // Fields to propagate (not date — each keeps its own date)
      const shared:{[k:string]:any}={};
      for(const k of ["facility","time_start","time_end","title","division","description","notes","status"]){
        shared[k]=editForm[k];
      }
      if(onUpdMulti){ onUpdMulti(allIds,shared); }
      else { allIds.forEach(id=>onUpd(id,id===editId?editForm:shared)); }
    }
    cancelEdit();
    sSaveModal(false);
  };
  const handleSaveClick=()=>{
    if(!editId||!editForm) return;
    const cur=getEditingBooking();
    const sibs=getSiblings(cur);
    if(sibs.length>0){
      sSaveModal(true);// show modal
    } else {
      doSave("one");
    }
  };

  const [saving,sSaving]=useState(false);
  const handleSave=async()=>{
    if(saving) return;
    sSaving(true);
    try{
      const title=form.title||BOOK_FAC[form.facility]?.l||"Reserva";
      const dates=generateDates(form.date,form.recurrence||"none",form.recDays);
      const sid=dates.length>1?genSeriesId():"";
      const items=dates.map((d:string)=>({facility:form.facility,date:d,time_start:form.time_start,time_end:form.time_end,title,division:form.division||"",description:form.description,notes:form.notes,status:form.status,series_id:sid,booked_by:user.id,booked_by_name:fn(user)}));
      await onAdd(items.length===1?items[0]:items);
      resetForm();
    }catch(e){/* error handled by parent */}
    finally{sSaving(false);}
  };

  /* ── sorted list ── */
  const sortedFiltered=useMemo(()=>[...filtered].sort((a:any,b:any)=>sortAsc?a.date.localeCompare(b.date):b.date.localeCompare(a.date)),[filtered,sortAsc]);

  /* ── booking cell lookup (facility+date) ── */
  const cellBookings=(fac:string,date:string)=>(bookings||[]).filter((b:any)=>b.facility===fac&&b.date===date&&b.status!=="cancelada");

  /* ── inline input style ── */
  const iSt:any={padding:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,width:"100%",marginTop:2,background:cardBg,color:isDark?"#E2E8F0":undefined};
  const lblSt:any={fontSize:10,fontWeight:600,color:colors.g5};

  /* ── Modal overlay style ── */
  const modalOvr:any={position:"fixed" as const,top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20};
  const modalBox:any={background:cardBg,borderRadius:14,padding:24,maxWidth:400,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"};

  /* ═══════ RENDER ═══════ */
  return(<div style={{maxWidth:mob?undefined:1000}}>
    <h2 style={{margin:"0 0 4px",fontSize:mob?16:19,color:colors.nv,fontWeight:800}}>🏟️ Espacios</h2>
    <p style={{color:colors.g4,fontSize:12,margin:"0 0 14px"}}>Gestión de canchas, espacios e instalaciones del club</p>

    {/* ══ DELETE MODAL ══ */}
    {delModal&&<div style={modalOvr} onClick={()=>sDelModal(null)}>
      <div style={modalBox} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:14,fontWeight:800,color:colors.nv,marginBottom:4}}>Eliminar espacio</div>
        <div style={{fontSize:12,color:colors.g5,marginBottom:16}}>
          Este evento es parte de una serie ({getSiblings(delModal).length+1} eventos).
        </div>
        <div style={{display:"flex",flexDirection:"column" as const,gap:8}}>
          <button onClick={()=>doDelete("one")} style={{padding:"10px 16px",borderRadius:8,border:"1px solid #DC2626",background:isDark?"#7F1D1D":"#FEF2F2",color:"#DC2626",fontSize:12,fontWeight:700,cursor:"pointer",textAlign:"left" as const}}>
            🗑️ Solo este evento
            <div style={{fontSize:10,fontWeight:400,color:colors.g4,marginTop:2}}>Eliminar únicamente la reserva del {fmtD(delModal.date)}</div>
          </button>
          <button onClick={()=>doDelete("all")} style={{padding:"10px 16px",borderRadius:8,border:"1px solid #DC2626",background:"#DC2626",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",textAlign:"left" as const}}>
            🗑️ Toda la serie
            <div style={{fontSize:10,fontWeight:400,color:"#fecaca",marginTop:2}}>Eliminar los {getSiblings(delModal).length+1} eventos de esta serie</div>
          </button>
          <button onClick={()=>sDelModal(null)} style={{padding:"8px 16px",borderRadius:8,border:"1px solid "+colors.g3,background:cardBg,color:colors.g5,fontSize:12,fontWeight:600,cursor:"pointer"}}>
            Cancelar
          </button>
        </div>
      </div>
    </div>}

    {/* ══ SAVE SCOPE MODAL ══ */}
    {saveModal&&<div style={modalOvr} onClick={()=>sSaveModal(false)}>
      <div style={modalBox} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:14,fontWeight:800,color:colors.nv,marginBottom:4}}>Guardar cambios</div>
        <div style={{fontSize:12,color:colors.g5,marginBottom:16}}>
          Este evento es parte de una serie. ¿Aplicar cambios a...?
        </div>
        <div style={{display:"flex",flexDirection:"column" as const,gap:8}}>
          <button onClick={()=>doSave("one")} style={{padding:"10px 16px",borderRadius:8,border:"1px solid "+colors.bl,background:isDark?"#1E3A5F":"#EFF6FF",color:colors.bl,fontSize:12,fontWeight:700,cursor:"pointer",textAlign:"left" as const}}>
            📌 Solo este evento
            <div style={{fontSize:10,fontWeight:400,color:colors.g4,marginTop:2}}>Cambiar únicamente la reserva del {editForm?fmtD(editForm.date):""}</div>
          </button>
          <button onClick={()=>doSave("future")} style={{padding:"10px 16px",borderRadius:8,border:"1px solid "+colors.bl,background:colors.bl,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",textAlign:"left" as const}}>
            📅 Este y eventos futuros
            <div style={{fontSize:10,fontWeight:400,color:"#bfdbfe",marginTop:2}}>Aplicar cambios a este evento y todos los siguientes de la serie</div>
          </button>
          <button onClick={()=>sSaveModal(false)} style={{padding:"8px 16px",borderRadius:8,border:"1px solid "+colors.g3,background:cardBg,color:colors.g5,fontSize:12,fontWeight:600,cursor:"pointer"}}>
            Cancelar
          </button>
        </div>
      </div>
    </div>}

    {/* ── KPI CARDS ── */}
    <div style={{display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)",gap:10,marginBottom:18}}>
      <Card style={{padding:"10px 12px",borderTop:"3px solid "+colors.nv}}>
        <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:16}}>📋</span><span style={{fontSize:17,fontWeight:800,color:colors.nv}}>{weekBookings.length}</span></div>
        <div style={{fontSize:10,color:colors.g4,marginTop:3}}>Espacios esta semana</div>
      </Card>
      <Card style={{padding:"10px 12px",borderTop:"3px solid #10B981"}}>
        <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:16}}>✅</span><span style={{fontSize:17,fontWeight:800,color:"#10B981"}}>{kConfirmed}</span></div>
        <div style={{fontSize:10,color:colors.g4,marginTop:3}}>Confirmadas</div>
      </Card>
      <Card style={{padding:"10px 12px",borderTop:"3px solid #F59E0B"}}>
        <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:16}}>⏳</span><span style={{fontSize:17,fontWeight:800,color:"#F59E0B"}}>{kPending}</span></div>
        <div style={{fontSize:10,color:colors.g4,marginTop:3}}>Pendientes</div>
      </Card>
      <Card style={{padding:"10px 12px",borderTop:"3px solid "+colors.pr}}>
        <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:16}}>🏟️</span><span style={{fontSize:17,fontWeight:800,color:colors.pr}}>{Object.keys(facCounts).length}</span></div>
        <div style={{fontSize:10,color:colors.g4,marginTop:3}}>Instalaciones usadas</div>
      </Card>
    </div>

    {/* ── per-facility mini badges ── */}
    {Object.keys(facCounts).length>0&&<div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap" as const}}>
      {FKEYS.filter(k=>facCounts[k]).map(k=><span key={k} style={{padding:mob?"6px 12px":"3px 10px",borderRadius:14,background:BOOK_FAC[k].c+"18",border:"1px solid "+BOOK_FAC[k].c+"40",fontSize:mob?11:10,fontWeight:600,color:BOOK_FAC[k].c,minHeight:mob?32:undefined,display:"inline-flex",alignItems:"center"}}>{BOOK_FAC[k].i} {BOOK_FAC[k].l}: {facCounts[k]}</span>)}
    </div>}

    {/* ── TABS ── */}
    <div style={{display:"flex",gap:4,marginBottom:14}}>
      {(["calendario","mapa","alquileres"] as const).map(t=><button key={t} onClick={()=>sTab(t)} style={{padding:mob?"10px 20px":"7px 18px",borderRadius:8,border:tab===t?"2px solid "+colors.bl:"1px solid "+colors.g3,background:tab===t?(isDark?"#1E3A5F":"#EFF6FF"):cardBg,color:tab===t?colors.bl:colors.g5,fontSize:mob?13:12,fontWeight:tab===t?700:500,cursor:"pointer",minHeight:mob?44:undefined}}>{t==="calendario"?"📅 Calendario":t==="mapa"?"🗺️ Mapa":"🏠 Alquileres"}</button>)}
    </div>

    {/* ── FILTERS + ADD ── */}
    <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap" as const,alignItems:"center"}}>
      <input value={fSearch} onChange={e=>sFSearch(e.target.value)} placeholder="Buscar titulo..." style={{padding:mob?"10px 12px":"5px 10px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:mob?13:11,width:mob?150:140,background:cardBg,color:isDark?"#E2E8F0":undefined,minHeight:mob?44:undefined}}/>
      <select value={fFac} onChange={e=>sFFac(e.target.value)} style={{padding:mob?"10px 8px":"5px 8px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:mob?13:11,background:cardBg,color:isDark?"#E2E8F0":undefined,minHeight:mob?44:undefined}}>
        <option value="">Todas las instalaciones</option>{FKEYS.map(k=><option key={k} value={k}>{BOOK_FAC[k].i} {BOOK_FAC[k].l}</option>)}
      </select>
      {tab==="calendario"&&<>
        <input type="date" value={fDateFrom} onChange={e=>sFDateFrom(e.target.value)} style={{padding:mob?"10px 8px":"5px 8px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:mob?13:11,background:cardBg,color:isDark?"#E2E8F0":undefined,minHeight:mob?44:undefined}} title="Desde"/>
        <input type="date" value={fDateTo} onChange={e=>sFDateTo(e.target.value)} style={{padding:mob?"10px 8px":"5px 8px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:mob?13:11,background:cardBg,color:isDark?"#E2E8F0":undefined,minHeight:mob?44:undefined}} title="Hasta"/>
      </>}
      {(fFac||fSearch||fDateFrom||fDateTo)&&<button onClick={()=>{sFFac("");sFSearch("");sFDateFrom("");sFDateTo("");}} style={{padding:"5px 10px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:11,background:cardBg,cursor:"pointer",color:colors.g4}}>Limpiar</button>}
      <div style={{flex:1}}/>
      {onAdd&&<Btn v="s" s="s" onClick={()=>{if(showAdd){resetForm();}else{openForm();}}}>
        {showAdd?"✕ Cancelar":"+ Nuevo Espacio"}
      </Btn>}
    </div>

    {/* ── ADD BOOKING FORM ── */}
    {showAdd&&onAdd&&<Card style={{marginBottom:14,background:isDark?"#0D2818":"#F0FDF4",border:"1px solid #BBF7D0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{fontSize:12,fontWeight:700,color:isDark?"#4ADE80":"#166534"}}>🏟️ Reservar Espacio</div>
        <button onClick={resetForm} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:colors.g4}} title="Cerrar formulario">✕</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8,marginBottom:8}}>
        <div><label style={lblSt}>Instalación *</label>
          <select value={form.facility} onChange={e=>{const fk=e.target.value;sForm((p:any)=>({...p,facility:fk,title:p.title===BOOK_FAC[p.facility]?.l?BOOK_FAC[fk]?.l||"":p.title}));}} style={{...iSt}}>
            {FKEYS.map(k=><option key={k} value={k}>{BOOK_FAC[k].i} {BOOK_FAC[k].l}</option>)}
          </select>
        </div>
        <div><label style={lblSt}>Fecha *</label><input type="date" value={form.date} onChange={e=>sForm((p:any)=>({...p,date:e.target.value}))} style={iSt}/></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"1fr 1fr 1fr 1fr 1fr",gap:8,marginBottom:8}}>
        <div><label style={lblSt}>Hora inicio *</label><input type="time" value={form.time_start} onChange={e=>sForm((p:any)=>({...p,time_start:e.target.value}))} style={iSt}/></div>
        <div><label style={lblSt}>Hora fin *</label><input type="time" value={form.time_end} onChange={e=>sForm((p:any)=>({...p,time_end:e.target.value}))} style={iSt}/></div>
        <div><label style={lblSt}>Título</label><input value={form.title} onChange={e=>sForm((p:any)=>({...p,title:e.target.value}))} placeholder="Ej: Entrenamiento M19" style={iSt}/></div>
        <div><label style={lblSt}>División</label>
          <select value={form.division} onChange={e=>sForm((p:any)=>({...p,division:e.target.value}))} style={iSt}>
            {DIV_LIST.map(d=><option key={d} value={d}>{d||"— Sin división —"}</option>)}
          </select>
        </div>
        {!mob&&<div><label style={lblSt}>Estado</label>
          <select value={form.status} onChange={e=>sForm((p:any)=>({...p,status:e.target.value}))} style={iSt}>
            {SKEYS.map(k=><option key={k} value={k}>{BOOK_ST[k].i} {BOOK_ST[k].l}</option>)}
          </select>
        </div>}
      </div>
      {mob&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
        <div><label style={lblSt}>Estado</label>
          <select value={form.status} onChange={e=>sForm((p:any)=>({...p,status:e.target.value}))} style={iSt}>
            {SKEYS.map(k=><option key={k} value={k}>{BOOK_ST[k].i} {BOOK_ST[k].l}</option>)}
          </select>
        </div>
      </div>}
      {/* ── Recurrence ── */}
      <div style={{marginBottom:8}}>
        <label style={lblSt}>Repetir</label>
        <div style={{display:"flex",gap:4,marginTop:4,flexWrap:"wrap" as const}}>
          {REC_OPTS.map(r=><button key={r.k} onClick={()=>sForm((p:any)=>({...p,recurrence:r.k,recDays:r.k==="semanal"?p.recDays||[]:[]}))} style={{padding:"5px 12px",borderRadius:14,border:(form.recurrence||"none")===r.k?"2px solid "+colors.bl:"1px solid "+colors.g3,background:(form.recurrence||"none")===r.k?(isDark?"#1E3A5F":"#EFF6FF"):cardBg,color:(form.recurrence||"none")===r.k?colors.bl:colors.g5,fontSize:10,fontWeight:600,cursor:"pointer"}}>{r.i} {r.l}</button>)}
        </div>
        {form.recurrence==="semanal"&&<div style={{marginTop:6}}>
          <label style={{...lblSt,marginBottom:4,display:"block"}}>Días de la semana</label>
          <div style={{display:"flex",gap:4}}>
            {DIAS_SEMANA.map(d=>{const sel=(form.recDays||[]).includes(d.k);return(
              <button key={d.k} onClick={()=>sForm((p:any)=>{const cur=p.recDays||[];return{...p,recDays:sel?cur.filter((x:number)=>x!==d.k):[...cur,d.k]};})} style={{padding:"6px 10px",borderRadius:8,border:sel?"2px solid "+colors.bl:"1px solid "+colors.g3,background:sel?(isDark?"#1E3A5F":"#DBEAFE"):cardBg,color:sel?colors.bl:colors.g5,fontSize:11,fontWeight:sel?700:500,cursor:"pointer",minWidth:36}}>{d.s}</button>
            );})}
          </div>
          {(form.recDays||[]).length>0&&<div style={{fontSize:10,color:colors.g4,marginTop:4,fontStyle:"italic" as const}}>
            Se crearán {generateDates(form.date,"semanal",form.recDays).length} reservas en las próximas {WEEKS_AHEAD} semanas
          </div>}
        </div>}
        {form.recurrence==="mensual"&&<div style={{fontSize:10,color:colors.g4,marginTop:4,fontStyle:"italic" as const}}>Se crearán 6 reservas (una por mes)</div>}
        {form.recurrence==="anual"&&<div style={{fontSize:10,color:colors.g4,marginTop:4,fontStyle:"italic" as const}}>Se crearán 3 reservas (una por año)</div>}
      </div>
      <div style={{marginBottom:8}}><label style={lblSt}>Descripción</label><textarea value={form.description} onChange={e=>sForm((p:any)=>({...p,description:e.target.value}))} rows={2} style={{...iSt,resize:"vertical" as const}} placeholder="Detalles de la reserva..."/></div>
      <div style={{marginBottom:8}}><label style={lblSt}>Notas</label><input value={form.notes} onChange={e=>sForm((p:any)=>({...p,notes:e.target.value}))} style={iSt} placeholder="Notas internas..."/></div>
      {formOverlap.length>0&&<div style={{padding:"8px 12px",borderRadius:8,background:isDark?"#1E3A5F":"#EFF6FF",border:"1px solid #93C5FD",fontSize:11,fontWeight:600,color:isDark?"#93C5FD":"#1D4ED8",marginBottom:8}}>ℹ️ Ya hay {formOverlap.length} reserva(s) en {BOOK_FAC[form.facility]?.l} el {fmtD(form.date)} en ese horario: {formOverlap.map((b:any)=>b.division||b.title).join(", ")}</div>}
      <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
        <Btn v="g" s="s" onClick={resetForm}>Cancelar</Btn>
        <Btn v="s" s="s" disabled={saving||(form.recurrence==="semanal"&&(form.recDays||[]).length===0)} onClick={handleSave}>{saving?"⏳ Guardando...":"✅ Reservar Espacio"}{!saving&&form.recurrence&&form.recurrence!=="none"?` (${generateDates(form.date,form.recurrence,form.recDays).length})`:""}</Btn>
      </div>
    </Card>}

    {/* ═══════ TAB: MAPA ═══════ */}
    {tab==="mapa"&&<div style={{marginBottom:18}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <label style={{fontSize:11,fontWeight:600,color:colors.g5}}>Fecha:</label>
        <input type="date" value={mapDate} onChange={e=>sMapDate(e.target.value)} style={{padding:"5px 10px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,background:cardBg,color:isDark?"#E2E8F0":undefined}}/>
        <button onClick={()=>sMapDate(TODAY)} style={{padding:"4px 10px",borderRadius:6,border:"1px solid "+colors.g3,background:cardBg,fontSize:10,fontWeight:600,color:colors.bl,cursor:"pointer"}}>Hoy</button>
      </div>
      <ClubMap
        bookings={bookings}
        date={mapDate}
        mob={mob}
        onSelectFacility={(facKey:string)=>{openForm(facKey,mapDate);}}
        onSelectBooking={(b:any)=>{startEdit(b);}}
      />
    </div>}

    {/* ═══════ TAB: CALENDARIO ═══════ */}
    {tab==="calendario"&&<>
      {/* ═══════ EDIT BOOKING (above calendar) ═══════ */}
      {editId&&editForm&&<Card style={{marginBottom:14,borderLeft:"4px solid "+BOOK_FAC[editForm.facility]?.c,background:isDark?"#1E293B":"#FAFAFA"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:12,fontWeight:700,color:colors.nv}}>Editar Espacio #{editId}</div>
          <div style={{display:"flex",gap:4,alignItems:"center"}}>
            {onDel&&<button onClick={()=>{const b=getEditingBooking();if(b)promptDelete(b);}} style={{background:"none",border:"1px solid #DC2626",borderRadius:6,padding:"3px 8px",fontSize:10,color:"#DC2626",cursor:"pointer",fontWeight:600}}>Eliminar</button>}
            <button onClick={cancelEdit} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:colors.g4}} title="Cancelar edición">✕</button>
          </div>
        </div>
        <div style={{display:"flex",gap:4,marginBottom:10,flexWrap:"wrap" as const}}>
          {SKEYS.map(k=>{const s=BOOK_ST[k];return(
            <button key={k} onClick={()=>sEditForm((p:any)=>({...p,status:k}))} style={{padding:"4px 12px",borderRadius:14,border:editForm.status===k?"2px solid "+s.c:"1px solid "+colors.g3,background:editForm.status===k?s.bg:cardBg,color:s.c,fontSize:10,fontWeight:700,cursor:"pointer"}}>{s.i} {s.l}</button>
          );})}
        </div>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8,marginBottom:8}}>
          <div><label style={lblSt}>Instalación</label>
            <select value={editForm.facility} onChange={e=>sEditForm((p:any)=>({...p,facility:e.target.value}))} style={iSt}>
              {FKEYS.map(k=><option key={k} value={k}>{BOOK_FAC[k].i} {BOOK_FAC[k].l}</option>)}
            </select>
          </div>
          <div><label style={lblSt}>Fecha</label><input type="date" value={editForm.date} onChange={e=>sEditForm((p:any)=>({...p,date:e.target.value}))} style={iSt}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"1fr 1fr 1fr 1fr",gap:8,marginBottom:8}}>
          <div><label style={lblSt}>Hora inicio</label><input type="time" value={editForm.time_start} onChange={e=>sEditForm((p:any)=>({...p,time_start:e.target.value}))} style={iSt}/></div>
          <div><label style={lblSt}>Hora fin</label><input type="time" value={editForm.time_end} onChange={e=>sEditForm((p:any)=>({...p,time_end:e.target.value}))} style={iSt}/></div>
          <div><label style={lblSt}>Título</label><input value={editForm.title} onChange={e=>sEditForm((p:any)=>({...p,title:e.target.value}))} style={iSt}/></div>
          <div><label style={lblSt}>División</label>
            <select value={editForm.division||""} onChange={e=>sEditForm((p:any)=>({...p,division:e.target.value}))} style={iSt}>
              {DIV_LIST.map(d=><option key={d} value={d}>{d||"— Sin división —"}</option>)}
            </select>
          </div>
        </div>
        <div style={{marginBottom:8}}><label style={lblSt}>Descripción</label><textarea value={editForm.description} onChange={e=>sEditForm((p:any)=>({...p,description:e.target.value}))} rows={2} style={{...iSt,resize:"vertical" as const}}/></div>
        <div style={{marginBottom:8}}><label style={lblSt}>Notas</label><input value={editForm.notes} onChange={e=>sEditForm((p:any)=>({...p,notes:e.target.value}))} style={iSt}/></div>
        {editOverlap.length>0&&<div style={{padding:"8px 12px",borderRadius:8,background:isDark?"#1E3A5F":"#EFF6FF",border:"1px solid #93C5FD",fontSize:11,fontWeight:600,color:isDark?"#93C5FD":"#1D4ED8",marginBottom:8}}>ℹ️ Comparte horario con: {editOverlap.map((b:any)=>b.division||b.title).join(", ")}</div>}
        <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
          <Btn v="g" s="s" onClick={cancelEdit}>Cancelar</Btn>
          <Btn v="p" s="s" onClick={handleSaveClick}>Guardar cambios</Btn>
        </div>
      </Card>}

      {/* ── WEEK VIEW ── */}
      <Card style={{padding:mob?10:14,marginBottom:18,overflow:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <button onClick={()=>sWeekStart(addDays(weekStart,-7))} style={{background:"none",border:"1px solid "+colors.g3,borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:14,color:colors.nv}} title="Semana anterior">◀</button>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{fontSize:mob?12:14,fontWeight:800,color:colors.nv}}>Semana del {fmtD(weekDays[0])} al {fmtD(weekDays[6])}</div>
            <button onClick={()=>sWeekStart(getMonday(new Date()))} style={{padding:"3px 8px",borderRadius:6,border:"1px solid "+colors.g3,background:cardBg,fontSize:10,fontWeight:600,color:colors.bl,cursor:"pointer"}}>Hoy</button>
          </div>
          <button onClick={()=>sWeekStart(addDays(weekStart,7))} style={{background:"none",border:"1px solid "+colors.g3,borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:14,color:colors.nv}} title="Semana siguiente">▶</button>
        </div>

        {/* week grid: facilities as rows, days as columns */}
        <div style={{minWidth:mob?700:undefined}}>
          {/* header row */}
          <div style={{display:"grid",gridTemplateColumns:"120px repeat(7,1fr)",gap:2,marginBottom:2}}>
            <div style={{padding:"6px 8px",fontSize:10,fontWeight:700,color:colors.g4,background:isDark?"#1E293B":"#F8FAFC",borderRadius:6}}>Instalación</div>
            {weekDays.map((d,i)=>{const isToday=d===TODAY;return(
              <div key={d} style={{padding:"6px 4px",textAlign:"center" as const,fontSize:10,fontWeight:isToday?800:600,color:isToday?colors.bl:colors.nv,background:isToday?(isDark?"#1E3A5F":"#EFF6FF"):(isDark?"#1E293B":"#F8FAFC"),borderRadius:6,border:isToday?"2px solid "+colors.bl:"none"}}>
                {DIAS_SEM[i]} {d.slice(8)}/{d.slice(5,7)}
              </div>);
            })}
          </div>

          {/* facility rows */}
          {FKEYS.map(fk=>{const fac=BOOK_FAC[fk];return(
            <div key={fk} style={{display:"grid",gridTemplateColumns:"120px repeat(7,1fr)",gap:2,marginBottom:2}}>
              <div style={{padding:"4px 6px",fontSize:10,fontWeight:700,color:fac.c,background:fac.c+"10",borderRadius:6,display:"flex",alignItems:"center",gap:3,borderLeft:"3px solid "+fac.c,lineHeight:1.2}}>
                <span style={{fontSize:12}}>{fac.i}</span><span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"normal" as const,wordBreak:"break-word" as const}}>{fac.l}</span>
              </div>
              {weekDays.map(d=>{
                const cb=cellBookings(fk,d);
                const isToday=d===TODAY;
                // Group by time_start, sorted by time then division number
                const sorted=[...cb].sort((a:any,b:any)=>{const td=timeToMin(a.time_start)-timeToMin(b.time_start);return td!==0?td:divSortKey(a)-divSortKey(b);});
                const groups:any[][]=[];
                sorted.forEach((b:any)=>{
                  const last=groups[groups.length-1];
                  if(last&&last[0].time_start===b.time_start) last.push(b);
                  else groups.push([b]);
                });
                return(<div key={d} style={{padding:3,background:isToday?(isDark?"#1E3A5F10":"#EFF6FF50"):cardBg,border:"1px solid "+colors.g2,borderRadius:6,minHeight:38,cursor:"pointer",position:"relative" as const,display:"flex",flexDirection:"column" as const,gap:2,justifyContent:"flex-start"}} onClick={()=>{if(showAdd){sForm((p:any)=>({...p,facility:fk,date:d,title:p.title===BOOK_FAC[p.facility]?.l?BOOK_FAC[fk]?.l||"":p.title}));}else{openForm(fk,d);}}}>
                  {cb.length===0&&<div style={{fontSize:9,color:colors.g3,textAlign:"center" as const,paddingTop:6,flex:1}}>—</div>}
                  {groups.map((grp,gi)=>(
                    <div key={gi} style={{display:"flex",gap:2}}>
                      {grp.map((b:any)=>{const st=BOOK_ST[b.status];const div=b.division||extractDiv(b.title);const dc=div?DIV_COL[div]:null;return(
                        <div key={b.id} onClick={e=>{e.stopPropagation();startEdit(b);}} onTouchEnd={e=>{e.stopPropagation();e.preventDefault();startEdit(b);}} style={{padding:"3px 4px",borderRadius:5,background:b.is_rental?"#7C3AED18":(dc?dc+"20":st.bg),cursor:"pointer",border:"1px solid "+(b.is_rental?"#7C3AED":(dc||st.c))+"40",position:"relative" as const,zIndex:2,minHeight:24,touchAction:"manipulation" as const,flex:1,minWidth:0}} title={(b.is_rental?"🏠 ":"")+(div?div+": ":"")+b.title+" ("+b.time_start+"-"+b.time_end+")"}>
                          <div style={{fontSize:9,fontWeight:800,color:b.is_rental?"#7C3AED":(dc||st.c),overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,lineHeight:1.2}}>{b.is_rental?"🏠 ":""}{div||b.title}</div>
                          <div style={{fontSize:7,color:b.is_rental?"#7C3AED":(dc||colors.g5),fontWeight:600}}>{b.time_start}</div>
                        </div>);})}
                    </div>))}
                </div>);
              })}
            </div>);})}
        </div>
      </Card>

      {/* ═══════ BOOKING LIST ═══════ */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,gap:6}}>
        <div style={{fontSize:13,fontWeight:700,color:colors.nv}}>Listado de Espacios ({filtered.length})</div>
        <div style={{display:"flex",gap:4,alignItems:"center"}}>
          {selMode&&selIds.size>0&&<button onClick={()=>{if(confirm(`Eliminar ${selIds.size} espacio(s)?`)){const ids=[...selIds];if(onDelMulti){onDelMulti(ids);}else{ids.forEach(id=>onDel(id));}sSelIds(new Set());sSelMode(false);}}} style={{padding:"4px 10px",borderRadius:8,border:"1px solid #DC2626",background:"#DC2626",fontSize:10,fontWeight:700,color:"#fff",cursor:"pointer"}}>🗑️ Eliminar ({selIds.size})</button>}
          <button onClick={()=>{if(selMode){sSelMode(false);sSelIds(new Set());}else{sSelMode(true);}}} style={{padding:"4px 10px",borderRadius:8,border:"1px solid "+(selMode?"#DC2626":colors.g3),background:selMode?(isDark?"#7F1D1D":"#FEF2F2"):cardBg,fontSize:10,fontWeight:600,color:selMode?"#DC2626":colors.g5,cursor:"pointer"}}>{selMode?"✕ Cancelar":"☑️ Seleccionar"}</button>
          <button onClick={()=>sSortAsc(!sortAsc)} style={{padding:"4px 10px",borderRadius:8,border:"1px solid "+colors.g3,background:cardBg,fontSize:10,fontWeight:600,color:colors.g5,cursor:"pointer"}}>{sortAsc?"▲ Asc":"▼ Desc"}</button>
        </div>
      </div>
      {selMode&&<div style={{display:"flex",gap:6,marginBottom:8,alignItems:"center"}}>
        <button onClick={()=>{if(selIds.size===sortedFiltered.length){sSelIds(new Set());}else{sSelIds(new Set(sortedFiltered.map((b:any)=>String(b.id))));}}} style={{padding:"3px 10px",borderRadius:6,border:"1px solid "+colors.bl,background:cardBg,fontSize:10,fontWeight:600,color:colors.bl,cursor:"pointer"}}>{selIds.size===sortedFiltered.length?"Deseleccionar todo":"Seleccionar todo"}</button>
        <span style={{fontSize:10,color:colors.g4}}>{selIds.size} seleccionado(s)</span>
      </div>}

      {/* status summary pills */}
      <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap" as const}}>
        {SKEYS.map(k=>{const cnt=(bookings||[]).filter((b:any)=>b.status===k).length;return(
          <span key={k} style={{padding:"3px 10px",borderRadius:14,background:BOOK_ST[k].bg,border:"1px solid "+BOOK_ST[k].c+"40",fontSize:10,fontWeight:600,color:BOOK_ST[k].c}}>{BOOK_ST[k].i} {BOOK_ST[k].l}: {cnt}</span>
        );})}
      </div>

      {sortedFiltered.length===0&&<Card style={{textAlign:"center" as const,padding:24,color:colors.g4}}>
        <span style={{fontSize:24}}>📭</span>
        <div style={{marginTop:6,fontSize:12}}>Sin espacios reservados{fFac||fSearch||fDateFrom||fDateTo?" con los filtros seleccionados":""}</div>
      </Card>}

      {sortedFiltered.map((b:any)=>{
        const fac=BOOK_FAC[b.facility]||{l:"?",i:"?",c:colors.g4};
        const st=BOOK_ST[b.status]||BOOK_ST.pendiente;
        const isEditing=editId===String(b.id);
        const isSel=selIds.has(String(b.id));
        return(<Card key={b.id} style={{padding:"10px 14px",marginBottom:6,cursor:"pointer",borderLeft:"3px solid "+(selMode&&isSel?"#DC2626":fac.c),opacity:b.status==="cancelada"?.6:1,background:isEditing?(isDark?"#1E293B":"#F0F9FF"):isSel?(isDark?"#7F1D1D":"#FEF2F2"):cardBg}} onClick={()=>{if(selMode){sSelIds(prev=>{const n=new Set(prev);const id=String(b.id);if(n.has(id))n.delete(id);else n.add(id);return n;});}else if(!isEditing)startEdit(b);}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                {selMode&&<input type="checkbox" checked={isSel} readOnly style={{width:16,height:16,cursor:"pointer",accentColor:"#DC2626"}}/>}
                <span style={{fontSize:13}}>{fac.i}</span>
                <span style={{fontSize:12,fontWeight:700,color:colors.nv,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{b.title}</span>
              </div>
              <div style={{fontSize:10,color:colors.g4,marginTop:2}}>{fac.l} &middot; {fmtD(b.date)} &middot; {b.time_start}-{b.time_end}{(b.division||"")&&<span style={{marginLeft:4,padding:"0 5px",borderRadius:8,background:(DIV_COL[b.division]||colors.g4)+"18",color:DIV_COL[b.division]||colors.g4,fontWeight:700,fontSize:9}}>{b.division}</span>}</div>
              {b.description&&<div style={{fontSize:10,color:colors.g5,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{b.description}</div>}
            </div>
            <div style={{display:"flex",flexDirection:"column" as const,alignItems:"flex-end",gap:4,flexShrink:0}}>
              <span style={{background:st.bg,color:st.c,padding:"1px 8px",borderRadius:12,fontSize:10,fontWeight:600,whiteSpace:"nowrap" as const}}>{st.i} {st.l}</span>
              {(b.booked_by||b.booked_by_name)&&<span style={{fontSize:9,color:colors.g4}}>por {b.booked_by_name||userName(b.booked_by)}</span>}
              <div style={{display:"flex",gap:4,marginTop:2}}>
                <button onClick={e=>{e.stopPropagation();startEdit(b);}} style={{padding:"3px 8px",borderRadius:6,border:"1px solid "+colors.bl,background:"none",fontSize:9,fontWeight:700,color:colors.bl,cursor:"pointer"}}>✏️ Editar</button>
                {onDel&&<button onClick={e=>{e.stopPropagation();promptDelete(b);}} style={{padding:"3px 8px",borderRadius:6,border:"1px solid #DC2626",background:"none",fontSize:9,fontWeight:700,color:"#DC2626",cursor:"pointer"}}>🗑️</button>}
              </div>
            </div>
          </div>
          {b.notes&&<div style={{fontSize:9,color:colors.g5,marginTop:4,fontStyle:"italic" as const}}>Notas: {b.notes}</div>}
        </Card>);
      })}
    </>}

    {/* edit card when in map tab */}
    {tab==="mapa"&&editId&&editForm&&<Card style={{marginTop:14,borderLeft:"4px solid "+BOOK_FAC[editForm.facility]?.c,background:isDark?"#1E293B":"#FAFAFA"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{fontSize:12,fontWeight:700,color:colors.nv}}>Editar Espacio #{editId}</div>
        <div style={{display:"flex",gap:4,alignItems:"center"}}>
          {onDel&&<button onClick={()=>{const b=getEditingBooking();if(b)promptDelete(b);}} style={{background:"none",border:"1px solid #DC2626",borderRadius:6,padding:"3px 8px",fontSize:10,color:"#DC2626",cursor:"pointer",fontWeight:600}}>Eliminar</button>}
          <button onClick={cancelEdit} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:colors.g4}} title="Cancelar edición">✕</button>
        </div>
      </div>
      <div style={{display:"flex",gap:4,marginBottom:10,flexWrap:"wrap" as const}}>
        {SKEYS.map(k=>{const s=BOOK_ST[k];return(
          <button key={k} onClick={()=>sEditForm((p:any)=>({...p,status:k}))} style={{padding:"4px 12px",borderRadius:14,border:editForm.status===k?"2px solid "+s.c:"1px solid "+colors.g3,background:editForm.status===k?s.bg:cardBg,color:s.c,fontSize:10,fontWeight:700,cursor:"pointer"}}>{s.i} {s.l}</button>
        );})}
      </div>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr 1fr",gap:8,marginBottom:8}}>
        <div><label style={lblSt}>Hora inicio</label><input type="time" value={editForm.time_start} onChange={e=>sEditForm((p:any)=>({...p,time_start:e.target.value}))} style={iSt}/></div>
        <div><label style={lblSt}>Hora fin</label><input type="time" value={editForm.time_end} onChange={e=>sEditForm((p:any)=>({...p,time_end:e.target.value}))} style={iSt}/></div>
        <div><label style={lblSt}>Título</label><input value={editForm.title} onChange={e=>sEditForm((p:any)=>({...p,title:e.target.value}))} style={iSt}/></div>
        <div><label style={lblSt}>División</label>
          <select value={editForm.division||""} onChange={e=>sEditForm((p:any)=>({...p,division:e.target.value}))} style={iSt}>
            {DIV_LIST.map(d=><option key={d} value={d}>{d||"— Sin división —"}</option>)}
          </select>
        </div>
      </div>
      <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
        <Btn v="g" s="s" onClick={cancelEdit}>Cancelar</Btn>
        <Btn v="p" s="s" onClick={handleSaveClick}>Guardar</Btn>
      </div>
    </Card>}

    {/* ═══════ TAB: ALQUILERES ═══════ */}
    {tab==="alquileres"&&<AlquileresTab user={user} mob={mob} bookings={bookings} users={users} rentalConfig={rentalConfig} colors={colors} isDark={isDark} cardBg={cardBg} iSt={iSt} lblSt={lblSt} onAddRental={onAddRental} onUpdRental={onUpdRental} onUpdRentalConfig={onUpdRentalConfig}/>}
  </div>);
}

/* ═══════════════════════════════════════════════════════════════════
   ALQUILERES TAB — Separate component for clarity
   ═══════════════════════════════════════════════════════════════════ */

const RENTAL_FAC_LABELS:Record<string,string>={salon:"Salon Blanco",pergola:"Pérgola",pajarera:"Pajarera"};

function AlquileresTab({user,mob,bookings,users,rentalConfig,colors,isDark,cardBg,iSt,lblSt,onAddRental,onUpdRental,onUpdRentalConfig}:any){
  const isAd=user.role==="admin"||user.role==="superadmin"||user.role==="coordinador";
  const [showForm,sShowForm]=useState(false);
  const [showTarifas,sShowTarifas]=useState(false);
  const [uploading,sUploading]=useState<number|null>(null);
  const fileRef=useRef<HTMLInputElement>(null);
  const [saving,sSaving]=useState(false);
  const [rForm,sRForm]=useState<any>({facility:"salon",date:TODAY,time_start:"18:00",time_end:"23:00",renter_name:"",renter_phone:"",rental_fee:40000,notes:""});

  /* rentals only */
  const rentals=useMemo(()=>(bookings||[]).filter((b:any)=>b.is_rental).sort((a:any,b:any)=>b.date>a.date?1:b.date<a.date?-1:0),[bookings]);

  /* KPIs */
  const thisMonth=new Date().toISOString().slice(0,7);
  const kSolicited=rentals.filter((r:any)=>r.rental_status==="solicitado").length;
  const kPendPago=rentals.filter((r:any)=>r.rental_status==="pendiente_pago").length;
  const kConfirmed=rentals.filter((r:any)=>(r.rental_status==="aprobado"||r.rental_status==="condicion_ok")&&r.date?.startsWith(thisMonth)).length;
  const kTotal=rentals.filter((r:any)=>(r.rental_status==="aprobado"||r.rental_status==="condicion_ok"||r.rental_status==="pago_recibido")).reduce((s:number,r:any)=>s+Number(r.rental_fee||0),0);

  /* who is the approver for a given date */
  const getApprover=(date:string)=>{
    const dow=new Date(date+"T12:00:00").getDay();
    const isFriSat=dow===5||dow===6;
    const target=isFriSat?RENTAL_APPROVERS.friSat:RENTAL_APPROVERS.other;
    return (users||[]).find((u:any)=>u.n===target.first_name&&u.a===target.last_name);
  };

  /* can current user act as first approver for this date? */
  const canApproveFirst=(date:string)=>{
    if(isAd) return true;
    const approver=getApprover(date);
    return approver&&approver.id===user.id;
  };

  /* can current user act as final approver (Bautista Pontis)? */
  const canApproveFinal=()=>{
    if(isAd) return true;
    const bp=RENTAL_APPROVERS.final;
    return user.n===bp.first_name&&user.a===bp.last_name;
  };

  /* auto-fill fee when facility changes */
  const updateFee=(fac:string)=>{
    const cfg=(rentalConfig||[]).find((c:any)=>c.facility===fac);
    return cfg?Number(cfg.fee):40000;
  };

  /* submit new rental */
  const handleSubmit=async()=>{
    if(!rForm.renter_name.trim()){alert("Nombre del solicitante es obligatorio");return;}
    if(saving) return;
    sSaving(true);
    try{
      const title=RENTAL_FAC_LABELS[rForm.facility]||rForm.facility;
      await onAddRental({
        facility:rForm.facility,date:rForm.date,time_start:rForm.time_start,time_end:rForm.time_end,
        title:"🏠 "+title,description:"Alquiler: "+rForm.renter_name,notes:rForm.notes,
        booked_by:user.id,booked_by_name:fn(user),
        is_rental:true,rental_status:"solicitado",status:"pendiente",
        renter_name:rForm.renter_name,renter_phone:rForm.renter_phone,rental_fee:rForm.rental_fee,
        payment_proof_url:"",approved_by_name:"",condition_status:null
      });
      sRForm({facility:"salon",date:TODAY,time_start:"18:00",time_end:"23:00",renter_name:"",renter_phone:"",rental_fee:updateFee("salon"),notes:""});
      sShowForm(false);
    }catch{}
    finally{sSaving(false);}
  };

  /* upload comprobante */
  const handleUploadProof=async(rentalId:number,file:File)=>{
    sUploading(rentalId);
    const res=await uploadFile(file,"comprobantes");
    if("error" in res){alert(res.error);sUploading(null);return;}
    await onUpdRental(rentalId,{payment_proof_url:res.url,rental_status:"pago_recibido"});
    sUploading(null);
  };

  /* approver name label */
  const approverLabel=(date:string)=>{
    const dow=new Date(date+"T12:00:00").getDay();
    const isFriSat=dow===5||dow===6;
    const t=isFriSat?RENTAL_APPROVERS.friSat:RENTAL_APPROVERS.other;
    return t.first_name+" "+t.last_name;
  };

  const fmtMoney=(n:number)=>"$"+Number(n||0).toLocaleString("es-AR");

  return(<div>
    {/* ── KPI CARDS ── */}
    <div style={{display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)",gap:10,marginBottom:18}}>
      <Card style={{padding:"10px 12px",borderTop:"3px solid #F59E0B"}}>
        <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:16}}>📩</span><span style={{fontSize:17,fontWeight:800,color:"#F59E0B"}}>{kSolicited}</span></div>
        <div style={{fontSize:10,color:colors.g4,marginTop:3}}>Solicitados</div>
      </Card>
      <Card style={{padding:"10px 12px",borderTop:"3px solid #8B5CF6"}}>
        <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:16}}>💰</span><span style={{fontSize:17,fontWeight:800,color:"#8B5CF6"}}>{kPendPago}</span></div>
        <div style={{fontSize:10,color:colors.g4,marginTop:3}}>Pendientes Pago</div>
      </Card>
      <Card style={{padding:"10px 12px",borderTop:"3px solid #10B981"}}>
        <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:16}}>✅</span><span style={{fontSize:17,fontWeight:800,color:"#10B981"}}>{kConfirmed}</span></div>
        <div style={{fontSize:10,color:colors.g4,marginTop:3}}>Confirmados (mes)</div>
      </Card>
      <Card style={{padding:"10px 12px",borderTop:"3px solid "+colors.nv}}>
        <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:16}}>💵</span><span style={{fontSize:17,fontWeight:800,color:colors.nv}}>{fmtMoney(kTotal)}</span></div>
        <div style={{fontSize:10,color:colors.g4,marginTop:3}}>Total recaudado</div>
      </Card>
    </div>

    {/* ── CONFIGURAR TARIFAS (admin only) ── */}
    {isAd&&onUpdRentalConfig&&<Card style={{marginBottom:14,border:"1px solid "+colors.g3}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={()=>sShowTarifas(!showTarifas)}>
        <div style={{fontSize:12,fontWeight:700,color:colors.nv}}>⚙️ Configurar Tarifas</div>
        <span style={{fontSize:12,color:colors.g4}}>{showTarifas?"▲":"▼"}</span>
      </div>
      {showTarifas&&<div style={{marginTop:10}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          {(rentalConfig||[]).map((cfg:any)=><div key={cfg.id} style={{padding:10,borderRadius:8,border:"1px solid "+colors.g3,background:cardBg}}>
            <div style={{fontSize:11,fontWeight:700,color:colors.nv,marginBottom:4}}>{RENTAL_FAC_LABELS[cfg.facility]||cfg.facility}</div>
            <label style={lblSt}>Fee ($)</label>
            <input type="number" value={cfg.fee} onChange={e=>{const val=Number(e.target.value);onUpdRentalConfig(cfg.id,{fee:val});}} style={{...iSt,width:120}}/>
          </div>)}
        </div>
      </div>}
    </Card>}

    {/* ── NEW RENTAL BUTTON + FORM ── */}
    <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
      {onAddRental&&<Btn v="s" s="s" onClick={()=>sShowForm(!showForm)}>{showForm?"✕ Cancelar":"+ Nuevo Alquiler"}</Btn>}
    </div>

    {showForm&&onAddRental&&<Card style={{marginBottom:14,background:isDark?"#1A0D2E":"#F5F3FF",border:"1px solid #C4B5FD"}}>
      <div style={{fontSize:12,fontWeight:700,color:isDark?"#A78BFA":"#5B21B6",marginBottom:10}}>🏠 Nuevo Alquiler</div>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8,marginBottom:8}}>
        <div><label style={lblSt}>Espacio *</label>
          <select value={rForm.facility} onChange={e=>{const f=e.target.value;sRForm((p:any)=>({...p,facility:f,rental_fee:updateFee(f)}));}} style={iSt}>
            {RENTABLE_FAC.map(k=><option key={k} value={k}>{BOOK_FAC[k]?.i} {RENTAL_FAC_LABELS[k]}</option>)}
          </select>
        </div>
        <div><label style={lblSt}>Fecha *</label><input type="date" value={rForm.date} onChange={e=>sRForm((p:any)=>({...p,date:e.target.value}))} style={iSt}/></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"1fr 1fr 1fr 1fr",gap:8,marginBottom:8}}>
        <div><label style={lblSt}>Hora inicio *</label><input type="time" value={rForm.time_start} onChange={e=>sRForm((p:any)=>({...p,time_start:e.target.value}))} style={iSt}/></div>
        <div><label style={lblSt}>Hora fin *</label><input type="time" value={rForm.time_end} onChange={e=>sRForm((p:any)=>({...p,time_end:e.target.value}))} style={iSt}/></div>
        <div><label style={lblSt}>Nombre solicitante *</label><input value={rForm.renter_name} onChange={e=>sRForm((p:any)=>({...p,renter_name:e.target.value}))} placeholder="Juan Pérez" style={iSt}/></div>
        <div><label style={lblSt}>Teléfono</label><input value={rForm.renter_phone} onChange={e=>sRForm((p:any)=>({...p,renter_phone:e.target.value}))} placeholder="261-555-1234" style={iSt}/></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8,marginBottom:8}}>
        <div><label style={lblSt}>Fee ($)</label><input type="number" value={rForm.rental_fee} onChange={e=>sRForm((p:any)=>({...p,rental_fee:Number(e.target.value)}))} style={iSt}/></div>
        <div><label style={lblSt}>Notas</label><input value={rForm.notes} onChange={e=>sRForm((p:any)=>({...p,notes:e.target.value}))} placeholder="Notas adicionales..." style={iSt}/></div>
      </div>
      <div style={{fontSize:10,color:colors.g4,marginBottom:8,fontStyle:"italic" as const}}>
        Aprobador disponibilidad: {approverLabel(rForm.date)} ({new Date(rForm.date+"T12:00:00").getDay()===5||new Date(rForm.date+"T12:00:00").getDay()===6?"Vie/Sáb":"Lun-Jue/Dom"})
      </div>
      <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
        <Btn v="g" s="s" onClick={()=>sShowForm(false)}>Cancelar</Btn>
        <Btn v="s" s="s" disabled={saving} onClick={handleSubmit}>{saving?"⏳ Guardando...":"✅ Registrar Alquiler"}</Btn>
      </div>
    </Card>}

    {/* hidden file input for proof upload */}
    <input ref={fileRef} type="file" accept="image/*,.pdf" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f&&uploading!==null) handleUploadProof(uploading,f);e.target.value="";}}/>

    {/* ── RENTAL LIST ── */}
    {rentals.length===0&&<Card style={{textAlign:"center" as const,padding:24,color:colors.g4}}>
      <span style={{fontSize:24}}>🏠</span>
      <div style={{marginTop:6,fontSize:12}}>Sin alquileres registrados</div>
    </Card>}

    {rentals.map((r:any)=>{
      const fac=BOOK_FAC[r.facility]||{l:"?",i:"?",c:colors.g4};
      const rst=RENTAL_ST[r.rental_status]||RENTAL_ST.solicitado;
      const isPast=r.date<TODAY;

      return(<Card key={r.id} style={{padding:"12px 14px",marginBottom:8,borderLeft:"4px solid "+(rst.c||"#8B5CF6")}}>
        {/* header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:6}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:700,color:colors.nv}}>🏠 {RENTAL_FAC_LABELS[r.facility]||fac.l} · {fmtD(r.date)} · {r.time_start}-{r.time_end}</div>
            <div style={{fontSize:11,color:colors.g5,marginTop:2}}>👤 {r.renter_name||"—"}{r.renter_phone?(" · 📱 "+r.renter_phone):""}</div>
            <div style={{fontSize:11,color:colors.g5,marginTop:2}}>💰 {fmtMoney(r.rental_fee)} · <span style={{background:rst.bg,color:rst.c,padding:"1px 8px",borderRadius:12,fontSize:10,fontWeight:600}}>{rst.i} {rst.l}</span></div>
            {r.approved_by_name&&<div style={{fontSize:10,color:colors.g4,marginTop:2}}>Aprobado por: {r.approved_by_name}</div>}
            {r.notes&&<div style={{fontSize:10,color:colors.g4,marginTop:2,fontStyle:"italic" as const}}>Notas: {r.notes}</div>}
          </div>
        </div>

        {/* ── Payment info box (when pendiente_pago) ── */}
        {r.rental_status==="pendiente_pago"&&<div style={{padding:"10px 14px",borderRadius:8,background:isDark?"#1E1B4B":"#EDE9FE",border:"1px solid #C4B5FD",marginBottom:8}}>
          <div style={{fontSize:11,fontWeight:700,color:"#7C3AED",marginBottom:4}}>💰 Datos de pago</div>
          <div style={{fontSize:11,color:isDark?"#C4B5FD":"#5B21B6"}}>Transferir a: <strong>{RENTAL_PAYMENT.alias}</strong></div>
          <div style={{fontSize:11,color:isDark?"#C4B5FD":"#5B21B6"}}>Monto: <strong>{fmtMoney(r.rental_fee)}</strong></div>
          <div style={{fontSize:11,color:isDark?"#C4B5FD":"#5B21B6"}}>Enviar comprobante a: <strong>{RENTAL_PAYMENT.phone}</strong></div>
        </div>}

        {/* ── Proof image (when uploaded) ── */}
        {r.payment_proof_url&&<div style={{marginBottom:8}}>
          <a href={r.payment_proof_url} target="_blank" rel="noopener noreferrer" style={{fontSize:10,color:colors.bl,fontWeight:600}}>🧾 Ver comprobante de pago</a>
        </div>}

        {/* ── Actions ── */}
        <div style={{display:"flex",gap:4,flexWrap:"wrap" as const}}>
          {/* Step 1: solicitado → disponible/no_disponible (Victoria/Lucía or admin) */}
          {r.rental_status==="solicitado"&&canApproveFirst(r.date)&&<>
            <button onClick={()=>onUpdRental(r.id,{rental_status:"pendiente_pago"})} style={{padding:"5px 12px",borderRadius:8,border:"1px solid #3B82F6",background:isDark?"#1E3A5F":"#DBEAFE",color:"#3B82F6",fontSize:10,fontWeight:700,cursor:"pointer"}}>👍 Disponible</button>
            <button onClick={()=>onUpdRental(r.id,{rental_status:"no_disponible"})} style={{padding:"5px 12px",borderRadius:8,border:"1px solid #DC2626",background:isDark?"#7F1D1D":"#FEE2E2",color:"#DC2626",fontSize:10,fontWeight:700,cursor:"pointer"}}>❌ No disponible</button>
          </>}

          {/* Step 2: pendiente_pago → upload comprobante (admin) */}
          {r.rental_status==="pendiente_pago"&&isAd&&<button onClick={()=>{sUploading(r.id);fileRef.current?.click();}} disabled={uploading===r.id} style={{padding:"5px 12px",borderRadius:8,border:"1px solid #8B5CF6",background:isDark?"#1E1B4B":"#EDE9FE",color:"#8B5CF6",fontSize:10,fontWeight:700,cursor:"pointer"}}>{uploading===r.id?"⏳ Subiendo...":"🧾 Subir comprobante"}</button>}

          {/* Step 3: pago_recibido → aprobado/rechazado (Bautista or admin) */}
          {r.rental_status==="pago_recibido"&&canApproveFinal()&&<>
            <button onClick={()=>onUpdRental(r.id,{rental_status:"aprobado",approved_by_name:fn(user)})} style={{padding:"5px 12px",borderRadius:8,border:"1px solid #10B981",background:isDark?"#064E3B":"#D1FAE5",color:"#10B981",fontSize:10,fontWeight:700,cursor:"pointer"}}>✅ Aprobar</button>
            <button onClick={()=>onUpdRental(r.id,{rental_status:"rechazado"})} style={{padding:"5px 12px",borderRadius:8,border:"1px solid #DC2626",background:isDark?"#7F1D1D":"#FEE2E2",color:"#DC2626",fontSize:10,fontWeight:700,cursor:"pointer"}}>❌ Rechazar</button>
          </>}

          {/* Step 4: Post-event condition (admin) */}
          {r.rental_status==="aprobado"&&isPast&&isAd&&<>
            <button onClick={()=>onUpdRental(r.id,{rental_status:"condicion_ok",condition_status:"ok"})} style={{padding:"5px 12px",borderRadius:8,border:"1px solid #10B981",background:isDark?"#064E3B":"#D1FAE5",color:"#10B981",fontSize:10,fontWeight:700,cursor:"pointer"}}>👌 Condición OK</button>
            <button onClick={()=>onUpdRental(r.id,{rental_status:"condicion_problema",condition_status:"problema"})} style={{padding:"5px 12px",borderRadius:8,border:"1px solid #DC2626",background:isDark?"#7F1D1D":"#FEE2E2",color:"#DC2626",fontSize:10,fontWeight:700,cursor:"pointer"}}>⚠️ Problema</button>
          </>}
        </div>
      </Card>);
    })}
  </div>);
}
