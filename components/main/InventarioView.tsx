"use client";
import { useState, useMemo } from "react";
import { INV_CAT, INV_COND, fn } from "@/lib/constants";
import { Btn, Card } from "@/components/ui";
import { useC } from "@/lib/theme-context";
import { useDataStore } from "@/lib/store";

const CATS=Object.keys(INV_CAT) as string[];
const CONDS=Object.keys(INV_COND) as string[];
const emptyForm=()=>({name:"",category:"deportivo",location:"",quantity:1,condition:"bueno",responsible_id:"",notes:""});

export function InventarioView({user,mob,onAdd,onUpd,onDel}:any){
  const items = useDataStore(s => s.inventory);
  const users = useDataStore(s => s.users);
  const{colors,isDark,cardBg}=useC();
  const [search,sSr]=useState("");const [fCat,sFCat]=useState("all");const [fCond,sFCond]=useState("all");
  const [form,sForm]=useState<any>(null);const [editId,sEditId]=useState<number|null>(null);

  /* filtered items */
  const vis=useMemo(()=>{
    let r=[...(items||[])];
    if(fCat!=="all") r=r.filter((it:any)=>it.category===fCat);
    if(fCond!=="all") r=r.filter((it:any)=>it.condition===fCond);
    if(search){const s=search.toLowerCase();r=r.filter((it:any)=>((it.name||"")+(it.location||"")+(it.notes||"")+(it.category||"")).toLowerCase().includes(s));}
    return r;
  },[items,fCat,fCond,search]);

  /* KPIs */
  const totalItems=(items||[]).length;
  const totalQty=(items||[]).reduce((s:number,it:any)=>s+(Number(it.quantity)||0),0);
  const reparar=(items||[]).filter((it:any)=>it.condition==="reparar").length;
  const baja=(items||[]).filter((it:any)=>it.condition==="baja").length;

  /* helpers */
  const userName=(uid:string)=>{const u=(users||[]).find((u:any)=>u.id===uid);return u?fn(u):""};
  const openAdd=()=>{sEditId(null);sForm(emptyForm());};
  const openEdit=(it:any)=>{sEditId(it.id);sForm({name:it.name||"",category:it.category||"deportivo",location:it.location||"",quantity:it.quantity||1,condition:it.condition||"bueno",responsible_id:it.responsible_id||"",notes:it.notes||""});};
  const closeForm=()=>{sForm(null);sEditId(null);};
  const save=()=>{if(!form.name.trim())return;const payload={name:form.name.trim(),category:form.category,location:form.location.trim(),quantity:Number(form.quantity)||1,condition:form.condition,responsible_id:form.responsible_id||null,responsible_name:form.responsible_id?userName(form.responsible_id):"",notes:form.notes.trim()};if(editId){onUpd(editId,payload);}else{onAdd(payload);}closeForm();};
  const iS:any={width:"100%",padding:"7px 10px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,boxSizing:"border-box" as const,background:cardBg,color:colors.nv};

  return(<div style={{maxWidth:900}}>
    {/* Header */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:4}}>
      <div><h2 style={{margin:"0 0 4px",fontSize:mob?16:19,color:colors.nv,fontWeight:800}}>📦 Inventario</h2><p style={{color:colors.g4,fontSize:12,margin:0}}>Gestión de equipamiento y activos del club</p></div>
      {!form&&<Btn v="pu" s="s" onClick={openAdd}>+ Nuevo Item</Btn>}
    </div>

    {/* KPI cards */}
    <div style={{display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)",gap:10,margin:"14px 0"}}>
      <Card style={{padding:"10px 12px",borderTop:"3px solid "+colors.pr}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:16}}>📦</span><span style={{fontSize:17,fontWeight:800,color:colors.pr}}>{totalItems}</span></div><div style={{fontSize:10,color:colors.g4,marginTop:3}}>Items Totales</div></Card>
      <Card style={{padding:"10px 12px",borderTop:"3px solid "+colors.bl}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:16}}>🔢</span><span style={{fontSize:17,fontWeight:800,color:colors.bl}}>{totalQty}</span></div><div style={{fontSize:10,color:colors.g4,marginTop:3}}>Cantidad Total</div></Card>
      <Card style={{padding:"10px 12px",borderTop:"3px solid #DC2626"}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:16}}>🔧</span><span style={{fontSize:17,fontWeight:800,color:"#DC2626"}}>{reparar}</span></div><div style={{fontSize:10,color:colors.g4,marginTop:3}}>A Reparar</div></Card>
      <Card style={{padding:"10px 12px",borderTop:"3px solid #6B7280"}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:16}}>🚫</span><span style={{fontSize:17,fontWeight:800,color:"#6B7280"}}>{baja}</span></div><div style={{fontSize:10,color:colors.g4,marginTop:3}}>De Baja</div></Card>
    </div>

    {/* Filters */}
    <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap" as const,alignItems:"center"}}>
      <input value={search} onChange={e=>sSr(e.target.value)} placeholder="Buscar..." style={{padding:"5px 10px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:11,width:mob?120:160}}/>
      <select value={fCat} onChange={e=>sFCat(e.target.value)} style={{padding:"5px 8px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:11}}>
        <option value="all">Todas las categorías</option>{CATS.map(k=><option key={k} value={k}>{INV_CAT[k].i} {INV_CAT[k].l}</option>)}
      </select>
      <select value={fCond} onChange={e=>sFCond(e.target.value)} style={{padding:"5px 8px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:11}}>
        <option value="all">Todas las condiciones</option>{CONDS.map(k=><option key={k} value={k}>{INV_COND[k].l}</option>)}
      </select>
      {(fCat!=="all"||fCond!=="all"||search)&&<button onClick={()=>{sFCat("all");sFCond("all");sSr("");}} style={{padding:"4px 10px",borderRadius:8,border:"1px solid "+colors.g3,background:"transparent",fontSize:10,cursor:"pointer",color:colors.g5}}>Limpiar filtros</button>}
    </div>

    {/* Add/Edit form */}
    {form&&<Card style={{marginBottom:14,background:isDark?"rgba(139,92,246,.08)":"#F5F3FF",border:"1px solid "+colors.pr+"33"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div style={{fontSize:12,fontWeight:700,color:colors.pr}}>{editId?"✏️ Editar item":"➕ Nuevo item"}</div><button onClick={closeForm} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:colors.g4}} title="Cerrar">✕</button></div>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8,marginBottom:8}}>
        <div style={{gridColumn:mob?"1":"1/3"}}><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Nombre *</label><input value={form.name} onChange={e=>sForm((f:any)=>({...f,name:e.target.value}))} placeholder="Nombre del item..." style={{...iS,marginTop:2}}/></div>
        <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Categoría</label><select value={form.category} onChange={e=>sForm((f:any)=>({...f,category:e.target.value}))} style={{...iS,marginTop:2}}>{CATS.map(k=><option key={k} value={k}>{INV_CAT[k].i} {INV_CAT[k].l}</option>)}</select></div>
        <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Ubicación</label><input value={form.location} onChange={e=>sForm((f:any)=>({...f,location:e.target.value}))} placeholder="Ej: Depósito, Cancha 1..." style={{...iS,marginTop:2}}/></div>
        <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Cantidad</label><input type="number" min={1} value={form.quantity} onChange={e=>sForm((f:any)=>({...f,quantity:e.target.value}))} style={{...iS,marginTop:2}}/></div>
        <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Condición</label><select value={form.condition} onChange={e=>sForm((f:any)=>({...f,condition:e.target.value}))} style={{...iS,marginTop:2}}>{CONDS.map(k=><option key={k} value={k}>{INV_COND[k].l}</option>)}</select></div>
        <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Responsable</label><select value={form.responsible_id} onChange={e=>sForm((f:any)=>({...f,responsible_id:e.target.value}))} style={{...iS,marginTop:2}}><option value="">Sin asignar</option>{(users||[]).map((u:any)=><option key={u.id} value={u.id}>{fn(u)}</option>)}</select></div>
        <div style={{gridColumn:mob?"1":"1/3"}}><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Notas</label><textarea value={form.notes} onChange={e=>sForm((f:any)=>({...f,notes:e.target.value}))} rows={2} placeholder="Observaciones..." style={{...iS,marginTop:2,resize:"vertical" as const}}/></div>
      </div>
      <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}><Btn v="g" s="s" onClick={closeForm}>Cancelar</Btn><Btn v="pu" s="s" disabled={!form.name.trim()} onClick={save}>{editId?"💾 Guardar cambios":"✅ Agregar item"}</Btn></div>
    </Card>}

    {/* Condition summary pills */}
    <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap" as const}}>
      {CONDS.map(k=>{const cnt=(items||[]).filter((it:any)=>it.condition===k).length;return <span key={k} onClick={()=>sFCond(fCond===k?"all":k)} style={{padding:"3px 10px",borderRadius:14,background:fCond===k?INV_COND[k].bg:cardBg,border:"1px solid "+(fCond===k?INV_COND[k].c:colors.g3),fontSize:10,fontWeight:600,color:INV_COND[k].c,cursor:"pointer"}}>{INV_COND[k].l} {cnt}</span>;})}
    </div>

    {/* Items grid */}
    {vis.length===0&&<Card style={{textAlign:"center" as const,padding:24,color:colors.g4}}><span style={{fontSize:24}}>📭</span><div style={{marginTop:6,fontSize:12}}>Sin items{search||fCat!=="all"||fCond!=="all"?" con estos filtros":""}</div></Card>}
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
      {vis.map((it:any)=>{const cat=INV_CAT[it.category]||INV_CAT.otro;const cond=INV_COND[it.condition]||INV_COND.bueno;const resp=it.responsible_id?userName(it.responsible_id):(it.responsible_name||"");
        return(<Card key={it.id} style={{padding:"12px 14px",borderLeft:"3px solid "+cat.c}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:6}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                <span style={{fontSize:16}}>{cat.i}</span>
                <span style={{fontSize:13,fontWeight:700,color:colors.nv,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{it.name}</span>
              </div>
              <div style={{fontSize:10,color:colors.g5}}><span style={{padding:"1px 6px",borderRadius:6,background:cat.c+"18",color:cat.c,fontWeight:600,fontSize:9}}>{cat.l}</span></div>
            </div>
            <span style={{padding:"2px 8px",borderRadius:10,background:cond.bg,color:cond.c,fontSize:9,fontWeight:700,flexShrink:0}}>{cond.l}</span>
          </div>
          <div style={{display:"flex",gap:10,fontSize:10,color:colors.g5,marginBottom:6,flexWrap:"wrap" as const}}>
            {it.location&&<span>📍 {it.location}</span>}
            <span>x{it.quantity||1}</span>
            {resp&&<span>👤 {resp}</span>}
          </div>
          {it.notes&&<div style={{fontSize:10,color:colors.g4,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as const,marginBottom:6}}>{it.notes}</div>}
          <div style={{display:"flex",gap:4,justifyContent:"flex-end"}} onClick={e=>e.stopPropagation()}>
            <button onClick={()=>openEdit(it)} style={{padding:"3px 8px",borderRadius:6,border:"1px solid "+colors.g3,background:"transparent",fontSize:10,cursor:"pointer",color:colors.nv,fontWeight:600}} title="Editar item">✏️</button>
            <button onClick={()=>{if(confirm("Eliminar "+it.name+"?"))onDel(it.id);}} style={{padding:"3px 8px",borderRadius:6,border:"1px solid #FCA5A5",background:"transparent",fontSize:10,cursor:"pointer",color:"#DC2626",fontWeight:600}} title="Eliminar item">🗑</button>
          </div>
        </Card>);})}
    </div>
  </div>);
}
