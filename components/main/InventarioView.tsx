"use client";
import { useState, useMemo } from "react";
import { INV_CAT, INV_COND, INV_MAINT_TYPE, INV_MAINT_FREQ, INV_DIST_ST, DIV, fn } from "@/lib/constants";
import { Btn, Card } from "@/components/ui";
import { useC } from "@/lib/theme-context";
import { useDataStore } from "@/lib/store";
import { InvImport } from "./InvImport";

const CATS=Object.keys(INV_CAT) as string[];
const CONDS=Object.keys(INV_COND) as string[];
const MFREQS=Object.keys(INV_MAINT_FREQ) as string[];
const MTYPES=Object.keys(INV_MAINT_TYPE) as string[];
const TODAY=new Date().toISOString().slice(0,10);

const emptyActivo=()=>({name:"",category:"infraestructura",location:"",quantity:1,condition:"bueno",responsible_id:"",notes:"",item_type:"activo" as const,brand:"",model:"",serial_number:"",purchase_date:"",warranty_until:"",maint_frequency:"",photo_url:""});
const emptyLote=()=>({name:"",category:"deportivo",location:"",quantity:1,condition:"nuevo",responsible_id:"",notes:"",item_type:"lote" as const,brand:"",model:"",serial_number:"",purchase_date:"",warranty_until:"",maint_frequency:"",photo_url:"",unit_cost:0,season:new Date().getFullYear().toString()});
const emptyMaint=()=>({date:TODAY,type:"service",description:"",cost:0,done_by:"",next_due:""});
const emptyDist=()=>({division:"",enlace_id:"",enlace_name:"",qty_given:0,season:new Date().getFullYear().toString(),given_date:TODAY,notes:""});

export function InventarioView({user,mob,onAdd,onUpd,onDel,onAddMaint,onUpdMaint,onDelMaint,onAddDist,onUpdDist,onDelDist,onBulkAdd}:any){
  const items = useDataStore(s => s.inventory);
  const invMaint = useDataStore(s => s.invMaint);
  const invDist = useDataStore(s => s.invDist);
  const users = useDataStore(s => s.users);
  const{colors,isDark,cardBg}=useC();

  const [tab,sTab]=useState<"activos"|"material"|"resumen">("activos");
  const [search,sSr]=useState("");const [fCat,sFCat]=useState("all");const [fCond,sFCond]=useState("all");
  const [form,sForm]=useState<any>(null);const [editId,sEditId]=useState<number|null>(null);
  const [fichaId,sFichaId]=useState<number|null>(null);
  const [maintForm,sMaintForm]=useState<any>(null);
  const [distForm,sDistForm]=useState<any>(null);
  const [loteDetId,sLoteDetId]=useState<number|null>(null);
  const [retForm,sRetForm]=useState<any>(null);
  const [showImport,sShowImport]=useState(false);
  const [matSport,sMatSport]=useState<"pick"|"rugby"|"hockey">("pick");

  /* Split items by type */
  const activos=useMemo(()=>(items||[]).filter((it:any)=>it.item_type!=="lote"),[items]);
  const lotes=useMemo(()=>(items||[]).filter((it:any)=>it.item_type==="lote"),[items]);

  /* Filtered activos */
  const visActivos=useMemo(()=>{
    let r=[...activos];
    if(fCat!=="all") r=r.filter((it:any)=>it.category===fCat);
    if(fCond!=="all") r=r.filter((it:any)=>it.condition===fCond);
    if(search){const s=search.toLowerCase();r=r.filter((it:any)=>((it.name||"")+(it.location||"")+(it.notes||"")+(it.brand||"")+(it.model||"")+(it.serial_number||"")).toLowerCase().includes(s));}
    return r;
  },[activos,fCat,fCond,search]);

  /* Filtered lotes */
  const visLotes=useMemo(()=>{
    let r=[...lotes];
    if(matSport==="rugby") r=r.filter((it:any)=>(it.name||"").startsWith("[Rugby]"));
    else if(matSport==="hockey") r=r.filter((it:any)=>(it.name||"").startsWith("[Hockey]"));
    if(search){const s=search.toLowerCase();r=r.filter((it:any)=>((it.name||"")+(it.season||"")+(it.brand||"")).toLowerCase().includes(s));}
    return r;
  },[lotes,search,matSport]);
  /* Strip [Rugby]/[Hockey] prefix for display */
  const cleanName=(name:string)=>name.replace(/^\[(Rugby|Hockey)\]\s*/,"");

  /* KPIs - Activos */
  const totalActivos=activos.length;
  const maintOverdue=activos.filter((it:any)=>it.next_maint_date&&it.next_maint_date<TODAY).length;
  const enReparacion=activos.filter((it:any)=>it.condition==="reparar").length;
  const deBaja=activos.filter((it:any)=>it.condition==="baja").length;

  /* KPIs - Lotes */
  const totalDistribuido=invDist.reduce((s:number,d:any)=>s+(d.qty_given||0),0);
  const totalDevuelto=invDist.reduce((s:number,d:any)=>s+(d.qty_returned||0),0);
  const totalPendiente=invDist.filter((d:any)=>d.status==="activa").reduce((s:number,d:any)=>s+((d.qty_given||0)-(d.qty_returned||0)-(d.qty_lost||0)-(d.qty_broken||0)),0);
  const totalPerdidas=invDist.reduce((s:number,d:any)=>s+(d.qty_lost||0),0);

  /* helpers */
  const userName=(uid:string)=>{const u=(users||[]).find((u:any)=>u.id===uid);return u?fn(u):""};
  const enlaceUsers=(div?:string)=>(users||[]).filter((u:any)=>(u.role==="enlace"||u.role==="manager")&&(!div||u.div===div));

  const openAddActivo=()=>{sEditId(null);sForm(emptyActivo());};
  const openAddLote=()=>{sEditId(null);sForm(emptyLote());};
  const openEdit=(it:any)=>{sEditId(it.id);sForm({...it});};
  const closeForm=()=>{sForm(null);sEditId(null);};
  const save=()=>{
    if(!form.name.trim())return;
    const payload:any={...form,name:form.name.trim(),notes:(form.notes||"").trim(),quantity:Number(form.quantity)||1,unit_cost:Number(form.unit_cost)||0};
    if(form.responsible_id)payload.responsible_name=userName(form.responsible_id);
    else{payload.responsible_id=null;payload.responsible_name="";}
    if(!payload.purchase_date)payload.purchase_date=null;
    if(!payload.warranty_until)payload.warranty_until=null;
    if(!payload.maint_frequency){payload.next_maint_date=null;}
    if(editId){onUpd(editId,payload);}else{onAdd(payload);}
    closeForm();
  };

  const saveMaint=(invId:number)=>{
    if(!maintForm)return;
    const payload={...maintForm,inventory_id:invId,cost:Number(maintForm.cost)||0,created_by:user.id};
    if(!payload.next_due)payload.next_due=null;
    onAddMaint(payload);
    sMaintForm(null);
  };

  const saveDist=(invId:number)=>{
    if(!distForm||!distForm.division||!distForm.qty_given)return;
    const payload={...distForm,inventory_id:invId,qty_given:Number(distForm.qty_given)||0,enlace_name:distForm.enlace_id?userName(distForm.enlace_id):""};
    if(!payload.enlace_id)payload.enlace_id=null;
    onAddDist(payload);
    sDistForm(null);
  };

  const saveReturn=(dist:any)=>{
    if(!retForm)return;
    const upd:any={};
    if(retForm.returned)upd.qty_returned=(dist.qty_returned||0)+Number(retForm.returned);
    if(retForm.lost)upd.qty_lost=(dist.qty_lost||0)+Number(retForm.lost);
    if(retForm.broken)upd.qty_broken=(dist.qty_broken||0)+Number(retForm.broken);
    if(Object.keys(upd).length)onUpdDist(dist.id,upd);
    sRetForm(null);
  };

  const iS:any={width:"100%",padding:"7px 10px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,background:cardBg,color:colors.nv};
  const tabBtn=(k:string,l:string,active:boolean)=><button key={k} onClick={()=>{sTab(k as any);sFichaId(null);sLoteDetId(null);closeForm();}} style={{padding:"8px 18px",borderRadius:8,border:"none",background:active?colors.nv:"transparent",color:active?"#fff":colors.g5,fontSize:12,fontWeight:active?700:500,cursor:"pointer"}}>{l}</button>;

  /* ======================== FICHA ACTIVO ======================== */
  const fichaItem=fichaId?activos.find((it:any)=>it.id===fichaId):null;
  const fichaHist=fichaId?(invMaint||[]).filter((m:any)=>m.inventory_id===fichaId).sort((a:any,b:any)=>(b.date||"").localeCompare(a.date||"")):[];

  const renderFicha=()=>{
    if(!fichaItem)return null;
    const cat=INV_CAT[fichaItem.category]||INV_CAT.otro;
    const cond=INV_COND[fichaItem.condition]||INV_COND.bueno;
    const isOverdue=fichaItem.next_maint_date&&fichaItem.next_maint_date<TODAY;
    return(<div>
      <button onClick={()=>sFichaId(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:colors.bl,fontWeight:600,marginBottom:10,padding:0}}>← Volver a Activos</button>
      <Card style={{padding:16,marginBottom:14,borderLeft:"4px solid "+cat.c}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",flexWrap:"wrap",gap:10}}>
          <div style={{flex:1,minWidth:200}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><span style={{fontSize:22}}>{cat.i}</span><h3 style={{margin:0,fontSize:18,color:colors.nv,fontWeight:800}}>{fichaItem.name}</h3></div>
            <span style={{padding:"3px 10px",borderRadius:10,background:cond.bg,color:cond.c,fontSize:10,fontWeight:700}}>{cond.l}</span>
            {isOverdue&&<span style={{marginLeft:8,padding:"3px 10px",borderRadius:10,background:"#FEE2E2",color:"#DC2626",fontSize:10,fontWeight:700}}>⚠️ Service vencido</span>}
          </div>
          <div style={{display:"flex",gap:4}}>
            <Btn v="g" s="s" onClick={()=>openEdit(fichaItem)}>✏️ Editar</Btn>
            <Btn v="g" s="s" onClick={()=>{if(confirm("Eliminar "+fichaItem.name+"?"))onDel(fichaItem.id);sFichaId(null);}}>🗑</Btn>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:8,marginTop:14,fontSize:11,color:colors.g5}}>
          {fichaItem.brand&&<div><strong>Marca:</strong> {fichaItem.brand}</div>}
          {fichaItem.model&&<div><strong>Modelo:</strong> {fichaItem.model}</div>}
          {fichaItem.serial_number&&<div><strong>N° Serie:</strong> {fichaItem.serial_number}</div>}
          {fichaItem.location&&<div><strong>Ubicación:</strong> {fichaItem.location}</div>}
          {fichaItem.responsible_id&&<div><strong>Responsable:</strong> {userName(fichaItem.responsible_id)||fichaItem.responsible_name}</div>}
          {fichaItem.purchase_date&&<div><strong>Compra:</strong> {fichaItem.purchase_date}</div>}
          {fichaItem.warranty_until&&<div><strong>Garantía hasta:</strong> {fichaItem.warranty_until}</div>}
          {fichaItem.maint_frequency&&<div><strong>Frec. mant.:</strong> {INV_MAINT_FREQ[fichaItem.maint_frequency]?.l||fichaItem.maint_frequency}</div>}
          {fichaItem.next_maint_date&&<div><strong>Próx. service:</strong> <span style={{color:isOverdue?"#DC2626":colors.gn,fontWeight:700}}>{fichaItem.next_maint_date}</span></div>}
        </div>
        {fichaItem.notes&&<div style={{marginTop:8,fontSize:11,color:colors.g4,fontStyle:"italic"}}>{fichaItem.notes}</div>}
      </Card>

      {/* Maintenance history */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <h4 style={{margin:0,fontSize:14,color:colors.nv}}>🔧 Historial de Mantenimiento</h4>
        {!maintForm&&<Btn v="pu" s="s" onClick={()=>sMaintForm(emptyMaint())}>+ Registrar</Btn>}
      </div>

      {maintForm&&<Card style={{marginBottom:12,background:isDark?"rgba(59,130,246,.08)":"#EFF6FF",border:"1px solid "+colors.bl+"33",padding:14}}>
        <div style={{fontSize:12,fontWeight:700,color:colors.bl,marginBottom:8}}>➕ Nuevo registro de mantenimiento</div>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:8,marginBottom:8}}>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Fecha *</label><input type="date" value={maintForm.date} onChange={e=>sMaintForm((f:any)=>({...f,date:e.target.value}))} style={{...iS,marginTop:2}}/></div>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Tipo</label><select value={maintForm.type} onChange={e=>sMaintForm((f:any)=>({...f,type:e.target.value}))} style={{...iS,marginTop:2}}>{MTYPES.map(k=><option key={k} value={k}>{INV_MAINT_TYPE[k].i} {INV_MAINT_TYPE[k].l}</option>)}</select></div>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Costo</label><input type="number" min={0} value={maintForm.cost} onChange={e=>sMaintForm((f:any)=>({...f,cost:e.target.value}))} style={{...iS,marginTop:2}}/></div>
          <div style={{gridColumn:mob?"1":"1/3"}}><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Descripción</label><input value={maintForm.description} onChange={e=>sMaintForm((f:any)=>({...f,description:e.target.value}))} placeholder="Qué se hizo..." style={{...iS,marginTop:2}}/></div>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Realizado por</label><input value={maintForm.done_by} onChange={e=>sMaintForm((f:any)=>({...f,done_by:e.target.value}))} placeholder="Nombre o empresa" style={{...iS,marginTop:2}}/></div>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Próximo programado</label><input type="date" value={maintForm.next_due} onChange={e=>sMaintForm((f:any)=>({...f,next_due:e.target.value}))} style={{...iS,marginTop:2}}/></div>
        </div>
        <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}><Btn v="g" s="s" onClick={()=>sMaintForm(null)}>Cancelar</Btn><Btn v="pu" s="s" onClick={()=>saveMaint(fichaItem.id)}>✅ Registrar</Btn></div>
      </Card>}

      {fichaHist.length===0&&<Card style={{textAlign:"center" as const,padding:20,color:colors.g4}}><span style={{fontSize:20}}>📋</span><div style={{marginTop:4,fontSize:11}}>Sin registros de mantenimiento</div></Card>}
      {fichaHist.map((m:any)=>{const mt=INV_MAINT_TYPE[m.type]||INV_MAINT_TYPE.service;return(
        <Card key={m.id} style={{padding:"10px 14px",marginBottom:6,borderLeft:"3px solid "+mt.c}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}><span>{mt.i}</span><span style={{fontSize:12,fontWeight:700,color:colors.nv}}>{mt.l}</span><span style={{fontSize:10,color:colors.g4}}>· {m.date}</span></div>
            <div style={{display:"flex",gap:4,alignItems:"center"}}>
              {m.cost>0&&<span style={{fontSize:10,color:colors.gn,fontWeight:700}}>${Number(m.cost).toLocaleString()}</span>}
              <button onClick={()=>{if(confirm("Eliminar registro?"))onDelMaint(m.id);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:10,color:"#DC2626"}}>🗑</button>
            </div>
          </div>
          {m.description&&<div style={{fontSize:11,color:colors.g5,marginTop:4}}>{m.description}</div>}
          <div style={{display:"flex",gap:12,fontSize:10,color:colors.g4,marginTop:4}}>
            {m.done_by&&<span>👤 {m.done_by}</span>}
            {m.next_due&&<span>📅 Próx: <strong style={{color:m.next_due<TODAY?"#DC2626":colors.gn}}>{m.next_due}</strong></span>}
          </div>
        </Card>
      );})}
    </div>);
  };

  /* ======================== DETALLE LOTE ======================== */
  const loteItem=loteDetId?lotes.find((it:any)=>it.id===loteDetId):null;
  const loteDists=loteDetId?(invDist||[]).filter((d:any)=>d.inventory_id===loteDetId):[];
  const loteDistribuido=loteDists.reduce((s:number,d:any)=>s+(d.qty_given||0),0);
  const loteStock=loteItem?((loteItem.quantity||0)-loteDistribuido):0;

  const renderLoteDet=()=>{
    if(!loteItem)return null;
    return(<div>
      <button onClick={()=>sLoteDetId(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:colors.bl,fontWeight:600,marginBottom:10,padding:0}}>← Volver a Lotes</button>
      <Card style={{padding:16,marginBottom:14,borderLeft:"4px solid #C8102E"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",flexWrap:"wrap",gap:10}}>
          <div>
            <h3 style={{margin:"0 0 4px",fontSize:17,color:colors.nv,fontWeight:800}}>🏉 {loteItem.name}</h3>
            <div style={{fontSize:11,color:colors.g5}}>Temporada {loteItem.season||"—"} · Compra: {loteItem.purchase_date||"—"} {loteItem.brand?`· ${loteItem.brand}`:""}</div>
          </div>
          <div style={{display:"flex",gap:4}}>
            <Btn v="g" s="s" onClick={()=>openEdit(loteItem)}>✏️</Btn>
            <Btn v="g" s="s" onClick={()=>{if(confirm("Eliminar lote?"))onDel(loteItem.id);sLoteDetId(null);}}>🗑</Btn>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{marginTop:12}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:colors.g5,marginBottom:4}}>
            <span>Distribuido: {loteDistribuido} / {loteItem.quantity||0}</span>
            <span>Stock disponible: <strong style={{color:loteStock>0?colors.gn:"#DC2626"}}>{loteStock}</strong></span>
          </div>
          <div style={{background:colors.g2,borderRadius:6,height:8,overflow:"hidden"}}>
            <div style={{width:Math.min(100,(loteDistribuido/(loteItem.quantity||1))*100)+"%",height:"100%",background:"linear-gradient(90deg,#3B82F6,#10B981)",borderRadius:6,transition:"width .3s"}}/>
          </div>
          {loteItem.unit_cost>0&&<div style={{fontSize:10,color:colors.g4,marginTop:4}}>Costo unitario: ${Number(loteItem.unit_cost).toLocaleString()}</div>}
        </div>
      </Card>

      {/* Distribute button */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <h4 style={{margin:0,fontSize:14,color:colors.nv}}>📦 Distribuciones</h4>
        {!distForm&&loteStock>0&&<Btn v="pu" s="s" onClick={()=>sDistForm(emptyDist())}>+ Distribuir</Btn>}
      </div>

      {/* Distribution form */}
      {distForm&&<Card style={{marginBottom:12,background:isDark?"rgba(139,92,246,.08)":"#F5F3FF",border:"1px solid "+colors.pr+"33",padding:14}}>
        <div style={{fontSize:12,fontWeight:700,color:colors.pr,marginBottom:8}}>➕ Nueva distribución</div>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:8,marginBottom:8}}>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>División *</label><select value={distForm.division} onChange={e=>sDistForm((f:any)=>({...f,division:e.target.value,enlace_id:"",enlace_name:""}))} style={{...iS,marginTop:2}}><option value="">Seleccionar...</option>{DIV.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Enlace</label><select value={distForm.enlace_id} onChange={e=>{const u=(users||[]).find((u:any)=>u.id===e.target.value);sDistForm((f:any)=>({...f,enlace_id:e.target.value,enlace_name:u?fn(u):""}));}} style={{...iS,marginTop:2}}><option value="">Sin asignar</option>{enlaceUsers(distForm.division).map((u:any)=><option key={u.id} value={u.id}>{fn(u)}</option>)}</select></div>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Cantidad * (máx {loteStock})</label><input type="number" min={1} max={loteStock} value={distForm.qty_given} onChange={e=>sDistForm((f:any)=>({...f,qty_given:e.target.value}))} style={{...iS,marginTop:2}}/></div>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Fecha entrega</label><input type="date" value={distForm.given_date} onChange={e=>sDistForm((f:any)=>({...f,given_date:e.target.value}))} style={{...iS,marginTop:2}}/></div>
          <div style={{gridColumn:mob?"1":"2/4"}}><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Notas</label><input value={distForm.notes} onChange={e=>sDistForm((f:any)=>({...f,notes:e.target.value}))} placeholder="Observaciones..." style={{...iS,marginTop:2}}/></div>
        </div>
        <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}><Btn v="g" s="s" onClick={()=>sDistForm(null)}>Cancelar</Btn><Btn v="pu" s="s" disabled={!distForm.division||!distForm.qty_given||Number(distForm.qty_given)>loteStock} onClick={()=>saveDist(loteItem.id)}>✅ Distribuir</Btn></div>
      </Card>}

      {/* Distribution table */}
      {loteDists.length===0&&<Card style={{textAlign:"center" as const,padding:20,color:colors.g4}}><span style={{fontSize:20}}>📭</span><div style={{marginTop:4,fontSize:11}}>Sin distribuciones</div></Card>}
      {loteDists.length>0&&<div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
          <thead><tr style={{background:isDark?colors.g2:colors.g1}}>
            {["División","Enlace","Entreg.","Devueltas","Perdidas","Rotas","Pend.","Estado",""].map(h=><th key={h} style={{padding:"8px 6px",textAlign:"left",fontWeight:700,color:colors.g5,borderBottom:"1px solid "+colors.g3,fontSize:10}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {loteDists.map((d:any)=>{
              const pend=(d.qty_given||0)-(d.qty_returned||0)-(d.qty_lost||0)-(d.qty_broken||0);
              const st=INV_DIST_ST[d.status]||INV_DIST_ST.activa;
              return(<tr key={d.id} style={{borderBottom:"1px solid "+colors.g3+"66"}}>
                <td style={{padding:"8px 6px",fontWeight:600}}>{d.division}</td>
                <td style={{padding:"8px 6px"}}>{d.enlace_name||"—"}</td>
                <td style={{padding:"8px 6px",fontWeight:700}}>{d.qty_given}</td>
                <td style={{padding:"8px 6px",color:colors.gn}}>{d.qty_returned||0}</td>
                <td style={{padding:"8px 6px",color:"#DC2626"}}>{d.qty_lost||0}</td>
                <td style={{padding:"8px 6px",color:"#F59E0B"}}>{d.qty_broken||0}</td>
                <td style={{padding:"8px 6px",fontWeight:700,color:pend>0?"#DC2626":colors.gn}}>{pend}</td>
                <td style={{padding:"8px 6px"}}><span style={{padding:"2px 8px",borderRadius:10,background:st.bg,color:st.c,fontSize:9,fontWeight:700}}>{st.l}</span></td>
                <td style={{padding:"8px 6px"}}>
                  <div style={{display:"flex",gap:3}}>
                    {d.status==="activa"&&pend>0&&<button onClick={()=>sRetForm(retForm?.id===d.id?null:{id:d.id,returned:"",lost:"",broken:""})} style={{padding:"2px 6px",borderRadius:4,border:"1px solid "+colors.g3,background:"transparent",fontSize:9,cursor:"pointer",color:colors.nv}} title="Registrar devolución">📥</button>}
                    {d.status==="activa"&&pend===0&&<button onClick={()=>onUpdDist(d.id,{status:"cerrada"})} style={{padding:"2px 6px",borderRadius:4,border:"1px solid "+colors.gn,background:"transparent",fontSize:9,cursor:"pointer",color:colors.gn}} title="Cerrar">✅</button>}
                    <button onClick={()=>{if(confirm("Eliminar distribución?"))onDelDist(d.id);}} style={{padding:"2px 6px",borderRadius:4,border:"1px solid #FCA5A5",background:"transparent",fontSize:9,cursor:"pointer",color:"#DC2626"}} title="Eliminar">🗑</button>
                  </div>
                </td>
              </tr>);
            })}
          </tbody>
        </table>
      </div>}

      {/* Return form inline */}
      {retForm&&<Card style={{marginTop:8,padding:12,background:isDark?"rgba(16,185,129,.08)":"#ECFDF5",border:"1px solid "+colors.gn+"33"}}>
        <div style={{fontSize:11,fontWeight:700,color:colors.gn,marginBottom:6}}>📥 Registrar devolución / pérdida / rotura</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Devueltas</label><input type="number" min={0} value={retForm.returned} onChange={e=>sRetForm((f:any)=>({...f,returned:e.target.value}))} style={{...iS,width:80,marginTop:2}}/></div>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Perdidas</label><input type="number" min={0} value={retForm.lost} onChange={e=>sRetForm((f:any)=>({...f,lost:e.target.value}))} style={{...iS,width:80,marginTop:2}}/></div>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Rotas</label><input type="number" min={0} value={retForm.broken} onChange={e=>sRetForm((f:any)=>({...f,broken:e.target.value}))} style={{...iS,width:80,marginTop:2}}/></div>
        </div>
        <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}><Btn v="g" s="s" onClick={()=>sRetForm(null)}>Cancelar</Btn><Btn v="pu" s="s" onClick={()=>{const d=loteDists.find((x:any)=>x.id===retForm.id);if(d)saveReturn(d);}}>✅ Guardar</Btn></div>
      </Card>}
    </div>);
  };

  /* ======================== RENDER ======================== */
  return(<div style={{maxWidth:960}}>
    {/* Header */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:4}}>
      <div><h2 style={{margin:"0 0 4px",fontSize:mob?16:19,color:colors.nv,fontWeight:800}}>📦 Inventario</h2><p style={{color:colors.g4,fontSize:12,margin:0}}>Gestión de equipamiento y activos del club</p></div>
    </div>

    {/* Tabs */}
    <div style={{display:"flex",gap:4,marginBottom:14,background:isDark?colors.g2:"#F1F5F9",borderRadius:10,padding:3}}>
      {tabBtn("activos","🏗️ Activos Fijos",tab==="activos")}
      {tabBtn("material","🏉 Material Deportivo",tab==="material")}
      {tabBtn("resumen","📊 Resumen",tab==="resumen")}
    </div>

    {/* ======================== TAB: ACTIVOS FIJOS ======================== */}
    {tab==="activos"&&!fichaId&&<div>
      {/* KPI cards */}
      <div style={{display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)",gap:10,margin:"0 0 14px"}}>
        <Card style={{padding:"10px 12px",borderTop:"3px solid "+colors.pr}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:16}}>🏗️</span><span style={{fontSize:17,fontWeight:800,color:colors.pr}}>{totalActivos}</span></div><div style={{fontSize:10,color:colors.g4,marginTop:3}}>Activos Totales</div></Card>
        <Card style={{padding:"10px 12px",borderTop:"3px solid "+(maintOverdue>0?"#DC2626":colors.gn)}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:16}}>🔧</span><span style={{fontSize:17,fontWeight:800,color:maintOverdue>0?"#DC2626":colors.gn}}>{maintOverdue}</span></div><div style={{fontSize:10,color:colors.g4,marginTop:3}}>Services Vencidos</div></Card>
        <Card style={{padding:"10px 12px",borderTop:"3px solid #F59E0B"}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:16}}>🛠️</span><span style={{fontSize:17,fontWeight:800,color:"#F59E0B"}}>{enReparacion}</span></div><div style={{fontSize:10,color:colors.g4,marginTop:3}}>En Reparación</div></Card>
        <Card style={{padding:"10px 12px",borderTop:"3px solid #6B7280"}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:16}}>🚫</span><span style={{fontSize:17,fontWeight:800,color:"#6B7280"}}>{deBaja}</span></div><div style={{fontSize:10,color:colors.g4,marginTop:3}}>De Baja</div></Card>
      </div>

      {/* Filters + Add btn */}
      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap" as const,alignItems:"center"}}>
        <input value={search} onChange={e=>sSr(e.target.value)} placeholder="Buscar..." style={{padding:"5px 10px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:11,width:mob?120:160,background:cardBg,color:colors.nv}}/>
        <select value={fCat} onChange={e=>sFCat(e.target.value)} style={{padding:"5px 8px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:11,background:cardBg,color:colors.nv}}>
          <option value="all">Todas las categorías</option>{CATS.map(k=><option key={k} value={k}>{INV_CAT[k].i} {INV_CAT[k].l}</option>)}
        </select>
        <select value={fCond} onChange={e=>sFCond(e.target.value)} style={{padding:"5px 8px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:11,background:cardBg,color:colors.nv}}>
          <option value="all">Todas las condiciones</option>{CONDS.map(k=><option key={k} value={k}>{INV_COND[k].l}</option>)}
        </select>
        {(fCat!=="all"||fCond!=="all"||search)&&<button onClick={()=>{sFCat("all");sFCond("all");sSr("");}} style={{padding:"4px 10px",borderRadius:8,border:"1px solid "+colors.g3,background:"transparent",fontSize:10,cursor:"pointer",color:colors.g5}}>Limpiar filtros</button>}
        <div style={{flex:1}}/>
        {!form&&<><Btn v="g" s="s" onClick={()=>sShowImport(true)}>📥 Importar</Btn><Btn v="pu" s="s" onClick={openAddActivo}>+ Nuevo Activo</Btn></>}
      </div>

      {/* Condition summary pills */}
      <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap" as const}}>
        {CONDS.map(k=>{const cnt=activos.filter((it:any)=>it.condition===k).length;return <span key={k} onClick={()=>sFCond(fCond===k?"all":k)} style={{padding:"3px 10px",borderRadius:14,background:fCond===k?INV_COND[k].bg:cardBg,border:"1px solid "+(fCond===k?INV_COND[k].c:colors.g3),fontSize:10,fontWeight:600,color:INV_COND[k].c,cursor:"pointer"}}>{INV_COND[k].l} {cnt}</span>;})}
      </div>

      {/* Add/Edit form for activos */}
      {form&&form.item_type==="activo"&&<Card style={{marginBottom:14,background:isDark?"rgba(139,92,246,.08)":"#F5F3FF",border:"1px solid "+colors.pr+"33"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div style={{fontSize:12,fontWeight:700,color:colors.pr}}>{editId?"✏️ Editar activo":"➕ Nuevo activo fijo"}</div><button onClick={closeForm} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:colors.g4}} title="Cerrar">✕</button></div>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:8,marginBottom:8}}>
          <div style={{gridColumn:mob?"1":"1/4"}}><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Nombre *</label><input value={form.name} onChange={e=>sForm((f:any)=>({...f,name:e.target.value}))} placeholder="Nombre del activo..." style={{...iS,marginTop:2}}/></div>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Categoría</label><select value={form.category} onChange={e=>sForm((f:any)=>({...f,category:e.target.value}))} style={{...iS,marginTop:2}}>{CATS.map(k=><option key={k} value={k}>{INV_CAT[k].i} {INV_CAT[k].l}</option>)}</select></div>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Condición</label><select value={form.condition} onChange={e=>sForm((f:any)=>({...f,condition:e.target.value}))} style={{...iS,marginTop:2}}>{CONDS.map(k=><option key={k} value={k}>{INV_COND[k].l}</option>)}</select></div>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Ubicación</label><input value={form.location} onChange={e=>sForm((f:any)=>({...f,location:e.target.value}))} placeholder="Ej: Depósito" style={{...iS,marginTop:2}}/></div>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Marca</label><input value={form.brand} onChange={e=>sForm((f:any)=>({...f,brand:e.target.value}))} style={{...iS,marginTop:2}}/></div>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Modelo</label><input value={form.model} onChange={e=>sForm((f:any)=>({...f,model:e.target.value}))} style={{...iS,marginTop:2}}/></div>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>N° de Serie</label><input value={form.serial_number} onChange={e=>sForm((f:any)=>({...f,serial_number:e.target.value}))} style={{...iS,marginTop:2}}/></div>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Responsable</label><select value={form.responsible_id} onChange={e=>sForm((f:any)=>({...f,responsible_id:e.target.value}))} style={{...iS,marginTop:2}}><option value="">Sin asignar</option>{(users||[]).map((u:any)=><option key={u.id} value={u.id}>{fn(u)}</option>)}</select></div>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Fecha de compra</label><input type="date" value={form.purchase_date} onChange={e=>sForm((f:any)=>({...f,purchase_date:e.target.value}))} style={{...iS,marginTop:2}}/></div>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Garantía hasta</label><input type="date" value={form.warranty_until} onChange={e=>sForm((f:any)=>({...f,warranty_until:e.target.value}))} style={{...iS,marginTop:2}}/></div>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Frec. mantenimiento</label><select value={form.maint_frequency} onChange={e=>sForm((f:any)=>({...f,maint_frequency:e.target.value}))} style={{...iS,marginTop:2}}><option value="">Ninguna</option>{MFREQS.map(k=><option key={k} value={k}>{INV_MAINT_FREQ[k].l}</option>)}</select></div>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Cantidad</label><input type="number" min={1} value={form.quantity} onChange={e=>sForm((f:any)=>({...f,quantity:e.target.value}))} style={{...iS,marginTop:2}}/></div>
          <div style={{gridColumn:mob?"1":"1/4"}}><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Notas</label><textarea value={form.notes} onChange={e=>sForm((f:any)=>({...f,notes:e.target.value}))} rows={2} placeholder="Observaciones..." style={{...iS,marginTop:2,resize:"vertical" as const}}/></div>
        </div>
        <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}><Btn v="g" s="s" onClick={closeForm}>Cancelar</Btn><Btn v="pu" s="s" disabled={!form.name.trim()} onClick={save}>{editId?"💾 Guardar":"✅ Agregar"}</Btn></div>
      </Card>}

      {/* Items bubble grid */}
      {visActivos.length===0&&!form&&<Card style={{textAlign:"center" as const,padding:24,color:colors.g4}}><span style={{fontSize:24}}>📭</span><div style={{marginTop:6,fontSize:12}}>Sin activos fijos{search||fCat!=="all"||fCond!=="all"?" con estos filtros":""}</div></Card>}
      <div style={{display:"flex",flexWrap:"wrap" as const,gap:mob?8:12,justifyContent:"flex-start"}}>
        {visActivos.map((it:any)=>{const cat=INV_CAT[it.category]||INV_CAT.otro;const cond=INV_COND[it.condition]||INV_COND.bueno;const isOverdue=it.next_maint_date&&it.next_maint_date<TODAY;const sz=mob?70:80;
          return(<div key={it.id} onClick={()=>sFichaId(it.id)} style={{display:"flex",flexDirection:"column" as const,alignItems:"center",cursor:"pointer",width:mob?80:100}} title={it.name+(it.location?" · "+it.location:"")+(it.notes?" · "+it.notes:"")}>
            <div style={{width:sz,height:sz,borderRadius:"50%",background:cond.bg,border:"3px solid "+(isOverdue?"#DC2626":cond.c),display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column" as const,transition:"transform .15s",position:"relative" as const}}>
              <span style={{fontSize:sz>70?22:18,fontWeight:800,color:cond.c,lineHeight:1}}>{it.quantity||1}</span>
              <span style={{fontSize:8,color:cond.c,fontWeight:600,marginTop:1}}>{cat.i}</span>
              {isOverdue&&<span style={{position:"absolute" as const,top:-2,right:-2,fontSize:10}}>⚠️</span>}
            </div>
            <div style={{marginTop:4,fontSize:mob?8:9,fontWeight:600,color:colors.nv,textAlign:"center" as const,lineHeight:1.2,maxWidth:mob?80:100,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as const}}>{it.name}</div>
            <div style={{fontSize:7,color:cond.c,fontWeight:700,marginTop:1}}>{cond.l}</div>
          </div>);})}
      </div>
    </div>}

    {/* Ficha detail view */}
    {tab==="activos"&&fichaId&&renderFicha()}

    {/* ======================== TAB: MATERIAL DEPORTIVO ======================== */}
    {tab==="material"&&!loteDetId&&matSport==="pick"&&<div>
      {/* Sport picker */}
      <div style={{display:"flex",gap:mob?16:24,justifyContent:"center",alignItems:"center",padding:mob?"30px 0":"50px 0",flexWrap:"wrap" as const}}>
        {[{k:"rugby" as const,icon:"🏉",label:"Rugby",color:"#C8102E",count:lotes.filter((it:any)=>(it.name||"").startsWith("[Rugby]")).length},
          {k:"hockey" as const,icon:"🏑",label:"Hockey",color:"#3B82F6",count:lotes.filter((it:any)=>(it.name||"").startsWith("[Hockey]")).length}
        ].map(sp=>(
          <div key={sp.k} onClick={()=>sMatSport(sp.k)} style={{display:"flex",flexDirection:"column" as const,alignItems:"center",cursor:"pointer",transition:"transform .15s"}}>
            <div style={{width:mob?120:150,height:mob?120:150,borderRadius:"50%",background:sp.color+"12",border:"4px solid "+sp.color,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column" as const,transition:"background .2s"}}>
              <span style={{fontSize:mob?48:60}}>{sp.icon}</span>
              <span style={{fontSize:mob?20:26,fontWeight:800,color:sp.color,marginTop:4}}>{sp.count}</span>
            </div>
            <div style={{marginTop:10,fontSize:mob?15:17,fontWeight:800,color:colors.nv}}>{sp.label}</div>
            <div style={{fontSize:11,color:colors.g4}}>{sp.count} items</div>
          </div>
        ))}
      </div>
      {/* KPI cards */}
      <div style={{display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)",gap:10,margin:"14px 0"}}>
        <Card style={{padding:"10px 12px",borderTop:"3px solid "+colors.bl}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:16}}>📦</span><span style={{fontSize:17,fontWeight:800,color:colors.bl}}>{totalDistribuido}</span></div><div style={{fontSize:10,color:colors.g4,marginTop:3}}>Total Distribuido</div></Card>
        <Card style={{padding:"10px 12px",borderTop:"3px solid "+colors.gn}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:16}}>✅</span><span style={{fontSize:17,fontWeight:800,color:colors.gn}}>{totalDevuelto}</span></div><div style={{fontSize:10,color:colors.g4,marginTop:3}}>Devuelto</div></Card>
        <Card style={{padding:"10px 12px",borderTop:"3px solid #DC2626"}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:16}}>⏳</span><span style={{fontSize:17,fontWeight:800,color:"#DC2626"}}>{totalPendiente}</span></div><div style={{fontSize:10,color:colors.g4,marginTop:3}}>Pendientes Devolución</div></Card>
        <Card style={{padding:"10px 12px",borderTop:"3px solid #F59E0B"}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:16}}>⚠️</span><span style={{fontSize:17,fontWeight:800,color:"#F59E0B"}}>{totalPerdidas}</span></div><div style={{fontSize:10,color:colors.g4,marginTop:3}}>Pérdidas</div></Card>
      </div>
    </div>}

    {tab==="material"&&!loteDetId&&matSport!=="pick"&&<div>
      {/* Back + sport header */}
      <button onClick={()=>sMatSport("pick")} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:colors.bl,fontWeight:600,marginBottom:10,padding:0}}>← Volver</button>
      <h3 style={{margin:"0 0 14px",fontSize:mob?16:18,fontWeight:800,color:colors.nv}}>{matSport==="rugby"?"🏉 Material Rugby":"🏑 Material Hockey"} <span style={{fontSize:13,fontWeight:500,color:colors.g4}}>({visLotes.length} items)</span></h3>

      {/* Search + Add */}
      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap" as const,alignItems:"center"}}>
        <input value={search} onChange={e=>sSr(e.target.value)} placeholder="Buscar lotes..." style={{padding:"5px 10px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:11,width:mob?140:200,background:cardBg,color:colors.nv}}/>
        <div style={{flex:1}}/>
        {!form&&<><Btn v="g" s="s" onClick={()=>sShowImport(true)}>📥 Importar</Btn><Btn v="pu" s="s" onClick={openAddLote}>+ Nuevo Lote</Btn></>}
      </div>

      {/* Add/Edit lote form */}
      {form&&form.item_type==="lote"&&<Card style={{marginBottom:14,background:isDark?"rgba(200,16,46,.08)":"#FEF2F2",border:"1px solid #C8102E33"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div style={{fontSize:12,fontWeight:700,color:"#C8102E"}}>{editId?"✏️ Editar lote":"➕ Nuevo lote de material"}</div><button onClick={closeForm} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:colors.g4}} title="Cerrar">✕</button></div>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:8,marginBottom:8}}>
          <div style={{gridColumn:mob?"1":"1/4"}}><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Nombre del material *</label><input value={form.name} onChange={e=>sForm((f:any)=>({...f,name:e.target.value}))} placeholder="Ej: Pelotas Gilbert Match" style={{...iS,marginTop:2}}/></div>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Cantidad comprada *</label><input type="number" min={1} value={form.quantity} onChange={e=>sForm((f:any)=>({...f,quantity:e.target.value}))} style={{...iS,marginTop:2}}/></div>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Temporada</label><input value={form.season} onChange={e=>sForm((f:any)=>({...f,season:e.target.value}))} placeholder="2026" style={{...iS,marginTop:2}}/></div>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Fecha compra</label><input type="date" value={form.purchase_date} onChange={e=>sForm((f:any)=>({...f,purchase_date:e.target.value}))} style={{...iS,marginTop:2}}/></div>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Marca</label><input value={form.brand} onChange={e=>sForm((f:any)=>({...f,brand:e.target.value}))} placeholder="Ej: Gilbert" style={{...iS,marginTop:2}}/></div>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Costo unitario ($)</label><input type="number" min={0} value={form.unit_cost} onChange={e=>sForm((f:any)=>({...f,unit_cost:e.target.value}))} style={{...iS,marginTop:2}}/></div>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Categoría</label><select value={form.category} onChange={e=>sForm((f:any)=>({...f,category:e.target.value}))} style={{...iS,marginTop:2}}>{CATS.map(k=><option key={k} value={k}>{INV_CAT[k].i} {INV_CAT[k].l}</option>)}</select></div>
          <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Ubicación</label><input value={form.location} onChange={e=>sForm((f:any)=>({...f,location:e.target.value}))} placeholder="Depósito" style={{...iS,marginTop:2}}/></div>
          <div style={{gridColumn:mob?"1":"1/4"}}><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Notas</label><textarea value={form.notes} onChange={e=>sForm((f:any)=>({...f,notes:e.target.value}))} rows={2} placeholder="Observaciones..." style={{...iS,marginTop:2,resize:"vertical" as const}}/></div>
        </div>
        <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}><Btn v="g" s="s" onClick={closeForm}>Cancelar</Btn><Btn v="pu" s="s" disabled={!form.name.trim()||!form.quantity} onClick={save}>{editId?"💾 Guardar":"✅ Crear Lote"}</Btn></div>
      </Card>}

      {/* Lotes bubble grid */}
      {visLotes.length===0&&!form&&<Card style={{textAlign:"center" as const,padding:24,color:colors.g4}}><span style={{fontSize:24}}>📭</span><div style={{marginTop:6,fontSize:12}}>Sin lotes de material{search?" con estos filtros":""}</div></Card>}
      <div style={{display:"flex",flexWrap:"wrap" as const,gap:mob?8:12,justifyContent:"flex-start"}}>
        {visLotes.map((it:any)=>{
          const dists=(invDist||[]).filter((d:any)=>d.inventory_id===it.id);
          const distributed=dists.reduce((s:number,d:any)=>s+(d.qty_given||0),0);
          const stock=(it.quantity||0)-distributed;
          const cond=INV_COND[it.condition]||INV_COND.bueno;
          const sz=mob?70:80;
          return(<div key={it.id} onClick={()=>sLoteDetId(it.id)} style={{display:"flex",flexDirection:"column" as const,alignItems:"center",cursor:"pointer",width:mob?80:100}} title={cleanName(it.name||"")+(it.brand?" · "+it.brand:"")+(it.notes?" · "+it.notes:"")}>
            <div style={{width:sz,height:sz,borderRadius:"50%",background:cond.bg,border:"3px solid "+cond.c,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column" as const,transition:"transform .15s",position:"relative" as const}}>
              <span style={{fontSize:sz>70?22:18,fontWeight:800,color:cond.c,lineHeight:1}}>{it.quantity||0}</span>
              <span style={{fontSize:7,color:cond.c,fontWeight:600,marginTop:1}}>stock {stock}</span>
            </div>
            <div style={{marginTop:4,fontSize:mob?8:9,fontWeight:600,color:colors.nv,textAlign:"center" as const,lineHeight:1.2,maxWidth:mob?80:100,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as const}}>{cleanName(it.name||"")}</div>
            <div style={{fontSize:7,color:cond.c,fontWeight:700,marginTop:1}}>{cond.l}</div>
          </div>);})}
      </div>
    </div>}

    {/* Lote detail view */}
    {tab==="material"&&loteDetId&&renderLoteDet()}

    {/* ======================== TAB: RESUMEN ======================== */}
    {tab==="resumen"&&<div>
      {/* Combined KPIs */}
      <div style={{display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)",gap:10,margin:"0 0 14px"}}>
        <Card style={{padding:"10px 12px",borderTop:"3px solid "+colors.pr}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:16}}>🏗️</span><span style={{fontSize:17,fontWeight:800,color:colors.pr}}>{totalActivos}</span></div><div style={{fontSize:10,color:colors.g4,marginTop:3}}>Activos Fijos</div></Card>
        <Card style={{padding:"10px 12px",borderTop:"3px solid #C8102E"}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:16}}>🏉</span><span style={{fontSize:17,fontWeight:800,color:"#C8102E"}}>{lotes.length}</span></div><div style={{fontSize:10,color:colors.g4,marginTop:3}}>Lotes Material</div></Card>
        <Card style={{padding:"10px 12px",borderTop:"3px solid "+colors.bl}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:16}}>📦</span><span style={{fontSize:17,fontWeight:800,color:colors.bl}}>{totalDistribuido}</span></div><div style={{fontSize:10,color:colors.g4,marginTop:3}}>Items Distribuidos</div></Card>
        <Card style={{padding:"10px 12px",borderTop:"3px solid "+colors.gn}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:16}}>✅</span><span style={{fontSize:17,fontWeight:800,color:colors.gn}}>{totalDevuelto}</span></div><div style={{fontSize:10,color:colors.g4,marginTop:3}}>Devueltos</div></Card>
      </div>

      {/* Alerts */}
      <h4 style={{margin:"0 0 10px",fontSize:14,color:colors.nv}}>⚠️ Alertas</h4>
      <div style={{display:"flex",flexDirection:"column" as const,gap:8,marginBottom:16}}>
        {/* Overdue maintenance */}
        {activos.filter((it:any)=>it.next_maint_date&&it.next_maint_date<TODAY).map((it:any)=>(
          <Card key={"maint-"+it.id} style={{padding:"10px 14px",borderLeft:"3px solid #DC2626",cursor:"pointer"}} onClick={()=>{sTab("activos");sFichaId(it.id);}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:14}}>🔧</span><span style={{fontSize:12,fontWeight:700,color:"#DC2626"}}>Service vencido:</span><span style={{fontSize:12,color:colors.nv}}>{it.name}</span><span style={{fontSize:10,color:colors.g4}}>· Vencido: {it.next_maint_date}</span></div>
          </Card>
        ))}
        {/* Pending returns by division */}
        {(() => {
          const divPend:Record<string,number>={};
          (invDist||[]).filter((d:any)=>d.status==="activa").forEach((d:any)=>{
            const pend=(d.qty_given||0)-(d.qty_returned||0)-(d.qty_lost||0)-(d.qty_broken||0);
            if(pend>0)divPend[d.division]=(divPend[d.division]||0)+pend;
          });
          return Object.entries(divPend).map(([div,cnt])=>(
            <Card key={"pend-"+div} style={{padding:"10px 14px",borderLeft:"3px solid #F59E0B"}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:14}}>⏳</span><span style={{fontSize:12,fontWeight:700,color:"#F59E0B"}}>Devolución pendiente:</span><span style={{fontSize:12,color:colors.nv}}>{div}</span><span style={{fontSize:10,color:colors.g4}}>· {cnt} items</span></div>
            </Card>
          ));
        })()}
        {/* Losses */}
        {totalPerdidas>0&&<Card style={{padding:"10px 14px",borderLeft:"3px solid #DC2626"}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:14}}>⚠️</span><span style={{fontSize:12,fontWeight:700,color:"#DC2626"}}>Pérdidas totales: {totalPerdidas} items</span></div>
        </Card>}
        {/* No alerts */}
        {maintOverdue===0&&totalPendiente===0&&totalPerdidas===0&&<Card style={{textAlign:"center" as const,padding:20,color:colors.gn}}><span style={{fontSize:20}}>✅</span><div style={{marginTop:4,fontSize:12}}>Sin alertas activas</div></Card>}
      </div>

      {/* Division summary table */}
      <h4 style={{margin:"0 0 10px",fontSize:14,color:colors.nv}}>📊 Resumen por División</h4>
      {(()=>{
        const divData:Record<string,{given:number;returned:number;lost:number;broken:number;pending:number}>={};
        (invDist||[]).forEach((d:any)=>{
          if(!divData[d.division])divData[d.division]={given:0,returned:0,lost:0,broken:0,pending:0};
          const dd=divData[d.division];
          dd.given+=(d.qty_given||0);dd.returned+=(d.qty_returned||0);dd.lost+=(d.qty_lost||0);dd.broken+=(d.qty_broken||0);
          dd.pending+=Math.max(0,(d.qty_given||0)-(d.qty_returned||0)-(d.qty_lost||0)-(d.qty_broken||0));
        });
        const entries=Object.entries(divData);
        if(entries.length===0)return <Card style={{textAlign:"center" as const,padding:16,color:colors.g4,fontSize:11}}>Sin distribuciones registradas</Card>;
        return(<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
          <thead><tr style={{background:isDark?colors.g2:colors.g1}}>
            {["División","Entregadas","Devueltas","Perdidas","Rotas","Pendientes"].map(h=><th key={h} style={{padding:"8px 10px",textAlign:"left",fontWeight:700,color:colors.g5,borderBottom:"1px solid "+colors.g3,fontSize:10}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {entries.map(([div,d])=><tr key={div} style={{borderBottom:"1px solid "+colors.g3+"66"}}>
              <td style={{padding:"8px 10px",fontWeight:600}}>{div}</td>
              <td style={{padding:"8px 10px"}}>{d.given}</td>
              <td style={{padding:"8px 10px",color:colors.gn}}>{d.returned}</td>
              <td style={{padding:"8px 10px",color:"#DC2626"}}>{d.lost}</td>
              <td style={{padding:"8px 10px",color:"#F59E0B"}}>{d.broken}</td>
              <td style={{padding:"8px 10px",fontWeight:700,color:d.pending>0?"#DC2626":colors.gn}}>{d.pending}</td>
            </tr>)}
          </tbody>
        </table></div>);
      })()}
    </div>}
    {showImport&&<InvImport itemType={tab==="material"?"lote":"activo"} mob={mob} onImport={(rows)=>onBulkAdd(rows)} onX={()=>sShowImport(false)}/>}
  </div>);
}
