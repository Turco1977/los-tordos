"use client";
import { useState, useMemo } from "react";
import { BOOK_FAC, BOOK_ST, fn } from "@/lib/constants";
import { fmtD } from "@/lib/mappers";
import { Btn, Card } from "@/components/ui";
import { useC } from "@/lib/theme-context";
import { ClubMap } from "./ClubMap";

const TODAY=new Date().toISOString().slice(0,10);
const FKEYS=Object.keys(BOOK_FAC);
const SKEYS=Object.keys(BOOK_ST);
const DIAS_SEM=["Lu","Ma","Mi","Ju","Vi","Sa","Do"];
const REC_OPTS:{k:string;l:string;i:string;count:number}[]=[
  {k:"none",l:"Sin repetición",i:"1️⃣",count:1},
  {k:"semanal",l:"Semanal",i:"📅",count:12},
  {k:"mensual",l:"Mensual",i:"🗓️",count:6},
  {k:"anual",l:"Anual",i:"📆",count:3}
];

const getMonday=(dt:Date)=>{const d=new Date(dt);const day=d.getDay();const diff=d.getDate()-day+(day===0?-6:1);d.setDate(diff);return d;};
const addDays=(dt:Date,n:number)=>{const d=new Date(dt);d.setDate(d.getDate()+n);return d;};
const dateISO=(dt:Date)=>dt.toISOString().slice(0,10);
const timeToMin=(t:string)=>{const [h,m]=t.split(":").map(Number);return h*60+(m||0);};
const overlap=(a0:string,a1:string,b0:string,b1:string)=>timeToMin(a0)<timeToMin(b1)&&timeToMin(b0)<timeToMin(a1);

const generateDates=(startDate:string,rec:string)=>{
  if(rec==="none") return [startDate];
  const dates=[startDate];
  const d=new Date(startDate);
  const count=REC_OPTS.find(r=>r.k===rec)?.count||1;
  for(let i=1;i<count;i++){
    const nd=new Date(d);
    if(rec==="semanal") nd.setDate(nd.getDate()+7*i);
    else if(rec==="mensual") nd.setMonth(nd.getMonth()+i);
    else if(rec==="anual") nd.setFullYear(nd.getFullYear()+i);
    dates.push(nd.toISOString().slice(0,10));
  }
  return dates;
};

/* ── Division color groups for calendar cells ── */
const DIV_COL:Record<string,string>={};
["Escuelita","M5","M6","M7","M8","M9","M10","M11","M12"].forEach(d=>{DIV_COL[d]="#10B981";});
["M13","M14"].forEach(d=>{DIV_COL[d]="#3B82F6";});
["M15","M16","M17","M18","M19"].forEach(d=>{DIV_COL[d]="#F59E0B";});
["Plantel Superior","Intermedia","Primera"].forEach(d=>{DIV_COL[d]="#DC2626";});
const DIV_KEYS=Object.keys(DIV_COL).sort((a,b)=>b.length-a.length);// longest first for matching
const extractDiv=(title:string)=>{if(!title)return null;const t=title.trim();for(const d of DIV_KEYS){if(t.includes(d))return d;}const m=t.match(/M\d+/i);if(m)return m[0].toUpperCase();return null;};

const DIV_LIST=["","Escuelita","M5","M6","M7","M8","M9","M10","M11","M12","M13","M14","M15","M16","M17","M18","M19","Intermedia","Plantel Superior","Primera","Hockey"];
const emptyForm=()=>({facility:"cancha1",date:TODAY,time_start:"09:00",time_end:"10:00",title:"",division:"",description:"",notes:"",status:"pendiente",recurrence:"none"});

export function ReservasView({bookings,users,user,mob,onAdd,onUpd,onDel}:any){
  const {colors,isDark,cardBg}=useC();

  /* tabs */
  const [tab,sTab]=useState<"calendario"|"mapa">("calendario");
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

  /* ── conflict detection ── */
  const hasConflict=(fac:string,date:string,ts:string,te:string,excludeId?:string)=>{
    return (bookings||[]).some((b:any)=>b.facility===fac&&b.date===date&&b.status!=="cancelada"&&(excludeId?String(b.id)!==String(excludeId):true)&&overlap(ts,te,b.time_start,b.time_end));
  };
  const formConflict=hasConflict(form.facility,form.date,form.time_start,form.time_end);
  const editConflict=editForm?hasConflict(editForm.facility,editForm.date,editForm.time_start,editForm.time_end,editId||undefined):false;

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
  const saveEdit=()=>{if(!editId||!editForm)return;onUpd(editId,editForm);cancelEdit();};
  const userName=(uid:string)=>{const u=(users||[]).find((u2:any)=>u2.id===uid);return u?fn(u):"";};

  const [saving,sSaving]=useState(false);
  const handleSave=async()=>{
    if(saving) return;
    sSaving(true);
    try{
      const title=form.title||BOOK_FAC[form.facility]?.l||"Reserva";
      const dates=generateDates(form.date,form.recurrence||"none");
      const items=dates.map((d:string)=>({facility:form.facility,date:d,time_start:form.time_start,time_end:form.time_end,title,division:form.division||"",description:form.description,notes:form.notes,status:form.status,booked_by:user.id,booked_by_name:fn(user)}));
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

  /* ═══════ RENDER ═══════ */
  return(<div style={{maxWidth:mob?undefined:1000}}>
    <h2 style={{margin:"0 0 4px",fontSize:mob?16:19,color:colors.nv,fontWeight:800}}>🏟️ Espacios</h2>
    <p style={{color:colors.g4,fontSize:12,margin:"0 0 14px"}}>Gestión de canchas, espacios e instalaciones del club</p>

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
      {FKEYS.filter(k=>facCounts[k]).map(k=><span key={k} style={{padding:"3px 10px",borderRadius:14,background:BOOK_FAC[k].c+"18",border:"1px solid "+BOOK_FAC[k].c+"40",fontSize:10,fontWeight:600,color:BOOK_FAC[k].c}}>{BOOK_FAC[k].i} {BOOK_FAC[k].l}: {facCounts[k]}</span>)}
    </div>}

    {/* ── TABS ── */}
    <div style={{display:"flex",gap:4,marginBottom:14}}>
      {(["calendario","mapa"] as const).map(t=><button key={t} onClick={()=>sTab(t)} style={{padding:"7px 18px",borderRadius:8,border:tab===t?"2px solid "+colors.bl:"1px solid "+colors.g3,background:tab===t?(isDark?"#1E3A5F":"#EFF6FF"):cardBg,color:tab===t?colors.bl:colors.g5,fontSize:12,fontWeight:tab===t?700:500,cursor:"pointer"}}>{t==="calendario"?"📅 Calendario":"🗺️ Mapa"}</button>)}
    </div>

    {/* ── FILTERS + ADD ── */}
    <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap" as const,alignItems:"center"}}>
      <input value={fSearch} onChange={e=>sFSearch(e.target.value)} placeholder="Buscar titulo..." style={{padding:"5px 10px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:11,width:140,background:cardBg,color:isDark?"#E2E8F0":undefined}}/>
      <select value={fFac} onChange={e=>sFFac(e.target.value)} style={{padding:"5px 8px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:11,background:cardBg,color:isDark?"#E2E8F0":undefined}}>
        <option value="">Todas las instalaciones</option>{FKEYS.map(k=><option key={k} value={k}>{BOOK_FAC[k].i} {BOOK_FAC[k].l}</option>)}
      </select>
      {tab==="calendario"&&<>
        <input type="date" value={fDateFrom} onChange={e=>sFDateFrom(e.target.value)} style={{padding:"5px 8px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:11,background:cardBg,color:isDark?"#E2E8F0":undefined}} title="Desde"/>
        <input type="date" value={fDateTo} onChange={e=>sFDateTo(e.target.value)} style={{padding:"5px 8px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:11,background:cardBg,color:isDark?"#E2E8F0":undefined}} title="Hasta"/>
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
        <button onClick={resetForm} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:colors.g4}}>✕</button>
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
        <div style={{display:"flex",gap:4,marginTop:4}}>
          {REC_OPTS.map(r=><button key={r.k} onClick={()=>sForm((p:any)=>({...p,recurrence:r.k}))} style={{padding:"5px 12px",borderRadius:14,border:(form.recurrence||"none")===r.k?"2px solid "+colors.bl:"1px solid "+colors.g3,background:(form.recurrence||"none")===r.k?(isDark?"#1E3A5F":"#EFF6FF"):cardBg,color:(form.recurrence||"none")===r.k?colors.bl:colors.g5,fontSize:10,fontWeight:600,cursor:"pointer"}}>{r.i} {r.l}</button>)}
        </div>
        {form.recurrence&&form.recurrence!=="none"&&<div style={{fontSize:10,color:colors.g4,marginTop:4,fontStyle:"italic" as const}}>
          Se crearán {REC_OPTS.find(r=>r.k===form.recurrence)?.count||1} reservas ({form.recurrence==="semanal"?"12 semanas":form.recurrence==="mensual"?"6 meses":"3 años"})
        </div>}
      </div>
      <div style={{marginBottom:8}}><label style={lblSt}>Descripción</label><textarea value={form.description} onChange={e=>sForm((p:any)=>({...p,description:e.target.value}))} rows={2} style={{...iSt,resize:"vertical" as const}} placeholder="Detalles de la reserva..."/></div>
      <div style={{marginBottom:8}}><label style={lblSt}>Notas</label><input value={form.notes} onChange={e=>sForm((p:any)=>({...p,notes:e.target.value}))} style={iSt} placeholder="Notas internas..."/></div>
      {formConflict&&<div style={{padding:"8px 12px",borderRadius:8,background:isDark?"#7F1D1D":"#FEF2F2",border:"1px solid #FECACA",fontSize:11,fontWeight:600,color:"#DC2626",marginBottom:8}}>⚠️ Conflicto: ya existe una reserva en {BOOK_FAC[form.facility]?.l} el {fmtD(form.date)} que se superpone con el horario seleccionado.</div>}
      <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
        <Btn v="g" s="s" onClick={resetForm}>Cancelar</Btn>
        <Btn v="s" s="s" disabled={saving} onClick={handleSave}>{saving?"⏳ Guardando...":"✅ Reservar Espacio"}{!saving&&form.recurrence&&form.recurrence!=="none"?` (${REC_OPTS.find(r=>r.k===form.recurrence)?.count||1})`:""}</Btn>
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
            {onDel&&<button onClick={()=>{if(confirm("Eliminar este espacio?"))onDel(editId);cancelEdit();}} style={{background:"none",border:"1px solid #DC2626",borderRadius:6,padding:"3px 8px",fontSize:10,color:"#DC2626",cursor:"pointer",fontWeight:600}}>Eliminar</button>}
            <button onClick={cancelEdit} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:colors.g4}}>✕</button>
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
        {editConflict&&<div style={{padding:"8px 12px",borderRadius:8,background:isDark?"#7F1D1D":"#FEF2F2",border:"1px solid #FECACA",fontSize:11,fontWeight:600,color:"#DC2626",marginBottom:8}}>⚠️ Conflicto: se superpone con otra reserva en {BOOK_FAC[editForm.facility]?.l} el {fmtD(editForm.date)}.</div>}
        <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
          <Btn v="g" s="s" onClick={cancelEdit}>Cancelar</Btn>
          <Btn v="p" s="s" onClick={saveEdit}>Guardar cambios</Btn>
        </div>
      </Card>}

      {/* ── WEEK VIEW ── */}
      <Card style={{padding:mob?10:14,marginBottom:18,overflow:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <button onClick={()=>sWeekStart(addDays(weekStart,-7))} style={{background:"none",border:"1px solid "+colors.g3,borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:14,color:colors.nv}}>◀</button>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{fontSize:mob?12:14,fontWeight:800,color:colors.nv}}>Semana del {fmtD(weekDays[0])} al {fmtD(weekDays[6])}</div>
            <button onClick={()=>sWeekStart(getMonday(new Date()))} style={{padding:"3px 8px",borderRadius:6,border:"1px solid "+colors.g3,background:cardBg,fontSize:10,fontWeight:600,color:colors.bl,cursor:"pointer"}}>Hoy</button>
          </div>
          <button onClick={()=>sWeekStart(addDays(weekStart,7))} style={{background:"none",border:"1px solid "+colors.g3,borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:14,color:colors.nv}}>▶</button>
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
                return(<div key={d} style={{padding:4,background:isToday?(isDark?"#1E3A5F10":"#EFF6FF50"):cardBg,border:"1px solid "+colors.g2,borderRadius:6,minHeight:38,cursor:"pointer",position:"relative" as const}} onClick={()=>{if(showAdd){sForm((p:any)=>({...p,facility:fk,date:d,title:p.title===BOOK_FAC[p.facility]?.l?BOOK_FAC[fk]?.l||"":p.title}));}else{openForm(fk,d);}}}>
                  {cb.length===0&&<div style={{fontSize:9,color:colors.g3,textAlign:"center" as const,paddingTop:6}}>—</div>}
                  {cb.map((b:any,j:number)=>{const st=BOOK_ST[b.status];const div=b.division||extractDiv(b.title);const dc=div?DIV_COL[div]:null;return(
                    <div key={b.id||j} onClick={e=>{e.stopPropagation();startEdit(b);}} onTouchEnd={e=>{e.stopPropagation();e.preventDefault();startEdit(b);}} style={{padding:"5px 6px",borderRadius:6,background:dc?dc+"20":st.bg,marginBottom:2,cursor:"pointer",border:"1px solid "+(dc||st.c)+"40",position:"relative" as const,zIndex:2,minHeight:28,touchAction:"manipulation" as const}} title={(div?div+": ":"")+b.title+" ("+b.time_start+"-"+b.time_end+")"}>
                      <div style={{fontSize:10,fontWeight:800,color:dc||st.c,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,lineHeight:1.3}}>{div||b.title}</div>
                      <div style={{fontSize:8,color:dc||colors.g5,fontWeight:600}}>{b.time_start}</div>
                    </div>);})}
                </div>);
              })}
            </div>);})}
        </div>
      </Card>

      {/* old edit form removed — now rendered above calendar */}

      {/* ═══════ BOOKING LIST ═══════ */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{fontSize:13,fontWeight:700,color:colors.nv}}>Listado de Espacios ({filtered.length})</div>
        <button onClick={()=>sSortAsc(!sortAsc)} style={{padding:"4px 10px",borderRadius:8,border:"1px solid "+colors.g3,background:cardBg,fontSize:10,fontWeight:600,color:colors.g5,cursor:"pointer"}}>{sortAsc?"▲ Fecha asc":"▼ Fecha desc"}</button>
      </div>

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
        return(<Card key={b.id} style={{padding:"10px 14px",marginBottom:6,cursor:"pointer",borderLeft:"3px solid "+fac.c,opacity:b.status==="cancelada"?.6:1,background:isEditing?(isDark?"#1E293B":"#F0F9FF"):cardBg}} onClick={()=>{if(!isEditing)startEdit(b);}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
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
                {onDel&&<button onClick={e=>{e.stopPropagation();if(confirm("Eliminar este espacio?"))onDel(String(b.id));}} style={{padding:"3px 8px",borderRadius:6,border:"1px solid #DC2626",background:"none",fontSize:9,fontWeight:700,color:"#DC2626",cursor:"pointer"}}>🗑️</button>}
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
          {onDel&&<button onClick={()=>{if(confirm("Eliminar?"))onDel(editId);cancelEdit();}} style={{background:"none",border:"1px solid #DC2626",borderRadius:6,padding:"3px 8px",fontSize:10,color:"#DC2626",cursor:"pointer",fontWeight:600}}>Eliminar</button>}
          <button onClick={cancelEdit} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:colors.g4}}>✕</button>
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
        <Btn v="p" s="s" onClick={saveEdit}>Guardar</Btn>
      </div>
    </Card>}
  </div>);
}
