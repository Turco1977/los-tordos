"use client";
import { useState, useMemo } from "react";
import { INV_CAT, INV_COND, fn } from "@/lib/constants";
import { Btn, Card } from "@/components/ui";
import { useC } from "@/lib/theme-context";

const CATS=Object.keys(INV_CAT) as string[];
const CONDS=Object.keys(INV_COND) as string[];
const emptyForm=()=>({nombre:"",categoria:"deportivo",ubicacion:"",cantidad:1,condicion:"bueno",responsable_id:"",notas:""});

export function InventarioView({items,users,user,mob,onAdd,onUpd,onDel}:any){
  const{colors,isDark,cardBg}=useC();
  const [search,sSr]=useState("");const [fCat,sFCat]=useState("all");const [fCond,sFCond]=useState("all");
  const [form,sForm]=useState<any>(null);const [editId,sEditId]=useState<number|null>(null);

  /* filtered items */
  const vis=useMemo(()=>{
    let r=[...(items||[])];
    if(fCat!=="all") r=r.filter((it:any)=>it.categoria===fCat);
    if(fCond!=="all") r=r.filter((it:any)=>it.condicion===fCond);
    if(search){const s=search.toLowerCase();r=r.filter((it:any)=>(it.nombre+it.ubicacion+it.notas+(it.categoria||"")).toLowerCase().includes(s));}
    return r;
  },[items,fCat,fCond,search]);

  /* KPIs */
  const totalItems=(items||[]).length;
  const totalQty=(items||[]).reduce((s:number,it:any)=>s+(Number(it.cantidad)||0),0);
  const reparar=(items||[]).filter((it:any)=>it.condicion==="reparar").length;
  const baja=(items||[]).filter((it:any)=>it.condicion==="baja").length;

  /* helpers */
  const userName=(uid:string)=>{const u=(users||[]).find((u:any)=>u.id===uid);return u?fn(u):""};
  const openAdd=()=>{sEditId(null);sForm(emptyForm());};
  const openEdit=(it:any)=>{sEditId(it.id);sForm({nombre:it.nombre||"",categoria:it.categoria||"deportivo",ubicacion:it.ubicacion||"",cantidad:it.cantidad||1,condicion:it.condicion||"bueno",responsable_id:it.responsable_id||"",notas:it.notas||""});};
  const closeForm=()=>{sForm(null);sEditId(null);};
  const save=()=>{if(!form.nombre.trim())return;const payload={nombre:form.nombre.trim(),categoria:form.categoria,ubicacion:form.ubicacion.trim(),cantidad:Number(form.cantidad)||1,condicion:form.condicion,responsable_id:form.responsable_id||null,responsable_nombre:form.responsable_id?userName(form.responsable_id):"",notas:form.notas.trim()};if(editId){onUpd(editId,payload);}else{onAdd(payload);}closeForm();};
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
        <option value="all">Todas las categorias</option>{CATS.map(k=><option key={k} value={k}>{INV_CAT[k].i} {INV_CAT[k].l}</option>)}
      </select>
      <select value={fCond} onChange={e=>sFCond(e.target.value)} style={{padding:"5px 8px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:11}}>
        <option value="all">Todas las condiciones</option>{CONDS.map(k=><option key={k} value={k}>{INV_COND[k].l}</option>)}
      </select>
      {(fCat!=="all"||fCond!=="all"||search)&&<button onClick={()=>{sFCat("all");sFCond("all");sSr("");}} style={{padding:"4px 10px",borderRadius:8,border:"1px solid "+colors.g3,background:"transparent",fontSize:10,cursor:"pointer",color:colors.g5}}>Limpiar filtros</button>}
    </div>

    {/* Add/Edit form */}
    {form&&<Card style={{marginBottom:14,background:isDark?"rgba(139,92,246,.08)":"#F5F3FF",border:"1px solid "+colors.pr+"33"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div style={{fontSize:12,fontWeight:700,color:colors.pr}}>{editId?"✏️ Editar item":"➕ Nuevo item"}</div><button onClick={closeForm} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:colors.g4}}>✕</button></div>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8,marginBottom:8}}>
        <div style={{gridColumn:mob?"1":"1/3"}}><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Nombre *</label><input value={form.nombre} onChange={e=>sForm((f:any)=>({...f,nombre:e.target.value}))} placeholder="Nombre del item..." style={{...iS,marginTop:2,border:"1px solid "+(!form.nombre.trim()&&editId!==null?"#DC2626":colors.g3)}}/></div>
        <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Categoria</label><select value={form.categoria} onChange={e=>sForm((f:any)=>({...f,categoria:e.target.value}))} style={{...iS,marginTop:2}}>{CATS.map(k=><option key={k} value={k}>{INV_CAT[k].i} {INV_CAT[k].l}</option>)}</select></div>
        <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Ubicacion</label><input value={form.ubicacion} onChange={e=>sForm((f:any)=>({...f,ubicacion:e.target.value}))} placeholder="Ej: Deposito, Cancha 1..." style={{...iS,marginTop:2}}/></div>
        <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Cantidad</label><input type="number" min={1} value={form.cantidad} onChange={e=>sForm((f:any)=>({...f,cantidad:e.target.value}))} style={{...iS,marginTop:2}}/></div>
        <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Condicion</label><select value={form.condicion} onChange={e=>sForm((f:any)=>({...f,condicion:e.target.value}))} style={{...iS,marginTop:2}}>{CONDS.map(k=><option key={k} value={k}>{INV_COND[k].l}</option>)}</select></div>
        <div><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Responsable</label><select value={form.responsable_id} onChange={e=>sForm((f:any)=>({...f,responsable_id:e.target.value}))} style={{...iS,marginTop:2}}><option value="">Sin asignar</option>{(users||[]).map((u:any)=><option key={u.id} value={u.id}>{fn(u)}</option>)}</select></div>
        <div style={{gridColumn:mob?"1":"1/3"}}><label style={{fontSize:10,fontWeight:600,color:colors.g5}}>Notas</label><textarea value={form.notas} onChange={e=>sForm((f:any)=>({...f,notas:e.target.value}))} rows={2} placeholder="Observaciones..." style={{...iS,marginTop:2,resize:"vertical" as const}}/></div>
      </div>
      <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}><Btn v="g" s="s" onClick={closeForm}>Cancelar</Btn><Btn v="pu" s="s" disabled={!form.nombre.trim()} onClick={save}>{editId?"💾 Guardar cambios":"✅ Agregar item"}</Btn></div>
    </Card>}

    {/* Condition summary pills */}
    <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap" as const}}>
      {CONDS.map(k=>{const cnt=(items||[]).filter((it:any)=>it.condicion===k).length;return <span key={k} onClick={()=>sFCond(fCond===k?"all":k)} style={{padding:"3px 10px",borderRadius:14,background:fCond===k?INV_COND[k].bg:cardBg,border:"1px solid "+(fCond===k?INV_COND[k].c:colors.g3),fontSize:10,fontWeight:600,color:INV_COND[k].c,cursor:"pointer"}}>{INV_COND[k].l} {cnt}</span>;})}
    </div>

    {/* Items grid */}
    {vis.length===0&&<Card style={{textAlign:"center" as const,padding:24,color:colors.g4}}><span style={{fontSize:24}}>📭</span><div style={{marginTop:6,fontSize:12}}>Sin items{search||fCat!=="all"||fCond!=="all"?" con estos filtros":""}</div></Card>}
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
      {vis.map((it:any)=>{const cat=INV_CAT[it.categoria]||INV_CAT.otro;const cond=INV_COND[it.condicion]||INV_COND.bueno;const resp=it.responsable_id?userName(it.responsable_id):(it.responsable_nombre||"");
        return(<Card key={it.id} style={{padding:"12px 14px",borderLeft:"3px solid "+cat.c}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:6}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                <span style={{fontSize:16}}>{cat.i}</span>
                <span style={{fontSize:13,fontWeight:700,color:colors.nv,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{it.nombre}</span>
              </div>
              <div style={{fontSize:10,color:colors.g5}}><span style={{padding:"1px 6px",borderRadius:6,background:cat.c+"18",color:cat.c,fontWeight:600,fontSize:9}}>{cat.l}</span></div>
            </div>
            <span style={{padding:"2px 8px",borderRadius:10,background:cond.bg,color:cond.c,fontSize:9,fontWeight:700,flexShrink:0}}>{cond.l}</span>
          </div>
          <div style={{display:"flex",gap:10,fontSize:10,color:colors.g5,marginBottom:6,flexWrap:"wrap" as const}}>
            {it.ubicacion&&<span>📍 {it.ubicacion}</span>}
            <span>x{it.cantidad||1}</span>
            {resp&&<span>👤 {resp}</span>}
          </div>
          {it.notas&&<div style={{fontSize:10,color:colors.g4,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as const,marginBottom:6}}>{it.notas}</div>}
          <div style={{display:"flex",gap:4,justifyContent:"flex-end"}} onClick={e=>e.stopPropagation()}>
            <button onClick={()=>openEdit(it)} style={{padding:"3px 8px",borderRadius:6,border:"1px solid "+colors.g3,background:"transparent",fontSize:10,cursor:"pointer",color:colors.nv,fontWeight:600}}>✏️</button>
            <button onClick={()=>{if(confirm("Eliminar "+it.nombre+"?"))onDel(it.id);}} style={{padding:"3px 8px",borderRadius:6,border:"1px solid #FCA5A5",background:"transparent",fontSize:10,cursor:"pointer",color:"#DC2626",fontWeight:600}}>🗑</button>
          </div>
        </Card>);})}
    </div>
  </div>);
}
