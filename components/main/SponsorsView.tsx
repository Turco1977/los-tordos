"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { SPON_ST, SPON_TIER, DOLAR_REF, DIV, TAR_CATS, TAR_VIS, PIPE_ST, PIPE_SC, CONTR_ST, CONTR_SC, PROP_ST, PROP_SC, CONTACT_ROLES, SPON_EJES, HOSP_ST, MAT_CATS } from "@/lib/constants";
import { exportTarifarioPDF, exportPipelinePDF, exportContractsPDF } from "@/lib/export";
import { fmtD } from "@/lib/mappers";
import { Btn, Card } from "@/components/ui";
import { useC } from "@/lib/theme-context";
import { useDataStore } from "@/lib/store";
import { Thread } from "@/components/main/Thread";
import { SponDelivery } from "@/components/main/SponDelivery";
import { loadXLSX } from "@/lib/xlsx-cdn";
import { MentionInput, renderMentions } from "@/components/MentionInput";

const TODAY=new Date().toISOString().slice(0,10);
const daysLeft=(d:string)=>{if(!d)return Infinity;return Math.round((new Date(d).getTime()-new Date(TODAY).getTime())/864e5);};

/* Format ARS with dots as thousand separator */
const fmtARS=(n:number)=>{
  if(!n&&n!==0)return"$0";
  return "$"+Math.round(n).toLocaleString("es-AR");
};

const emptyForm=()=>({
  name:"",
  amount_cash:"",
  amount_service:"",
  end_date:"",
  exposure:"",
  notes:"",
  status:"active",
  payment_type:"",
  responsable:"Jesús Herrera",
  canje_instrucciones:"",
});

const emptyTarForm=()=>({categoria:"indumentaria_rugby",ubicacion:"",descripcion:"",visibilidad:"media",precio_min_usd:"",precio_max_usd:"",sponsor_asignado_id:""});

/* ── TarifarioPanel ── */
function TarifarioPanel({tarifario,sponsors,dolarRef,colors,isDark,cardBg,mob,canFullEdit,onAdd,onUpd,onDel}:any){
  const items:any[]=tarifario||[];
  const [catFilter,sCatFilter]=useState("all");
  const [showForm,sShowForm]=useState(false);
  const [editId,sEditId]=useState<number|null>(null);
  const [form,sForm]=useState(emptyTarForm());
  const [confirmDel,sConfirmDel]=useState<number|null>(null);

  const vis=useMemo(()=>{
    let v=[...items].filter((t:any)=>t.activo!==false);
    if(catFilter!=="all")v=v.filter((t:any)=>t.categoria===catFilter);
    return v;
  },[items,catFilter]);

  /* KPIs */
  const total=items.filter((t:any)=>t.activo!==false).length;
  const ocupadas=items.filter((t:any)=>t.activo!==false&&t.sponsor_asignado_id).length;
  const libres=total-ocupadas;
  const ingresoMin=items.filter((t:any)=>t.activo!==false).reduce((s:number,t:any)=>s+Number(t.precio_min_usd||0),0);
  const ingresoMax=items.filter((t:any)=>t.activo!==false).reduce((s:number,t:any)=>s+Number(t.precio_max_usd||0),0);

  /* Group by category */
  const grouped=useMemo(()=>{
    const g:Record<string,any[]>={};
    for(const t of vis){const k=t.categoria||"otro";if(!g[k])g[k]=[];g[k].push(t);}
    return g;
  },[vis]);

  const openAdd=()=>{sForm(emptyTarForm());sEditId(null);sShowForm(true);};
  const openEdit=(t:any)=>{sForm({categoria:t.categoria||"indumentaria_rugby",ubicacion:t.ubicacion||"",descripcion:t.descripcion||"",visibilidad:t.visibilidad||"media",precio_min_usd:String(t.precio_min_usd||""),precio_max_usd:String(t.precio_max_usd||""),sponsor_asignado_id:String(t.sponsor_asignado_id||"")});sEditId(t.id);sShowForm(true);};

  const handleSave=async()=>{
    if(!form.ubicacion.trim())return;
    const d={categoria:form.categoria,ubicacion:form.ubicacion.trim(),descripcion:form.descripcion.trim(),visibilidad:form.visibilidad,precio_min_usd:Number(form.precio_min_usd)||0,precio_max_usd:Number(form.precio_max_usd)||0,sponsor_asignado_id:form.sponsor_asignado_id?Number(form.sponsor_asignado_id):null};
    if(editId){await onUpd(editId,d);}else{await onAdd(d);}
    sShowForm(false);sEditId(null);sForm(emptyTarForm());
  };

  const fN=(n:number)=>n?"$"+Math.round(n).toLocaleString("es-AR"):"–";
  const getSponName=(id:number|null)=>{if(!id)return null;const sp=(sponsors||[]).find((s:any)=>s.id===id);return sp?.name||"Sponsor #"+id;};

  return(<div>
    {/* KPIs */}
    <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:14}}>
      {[{l:"Total espacios",v:total,c:colors.bl},{l:"Ocupadas",v:ocupadas,c:"#10B981"},{l:"Libres",v:libres,c:"#F59E0B"},{l:"Ingreso potencial USD",v:`${fN(ingresoMin)} – ${fN(ingresoMax)}`,c:colors.nv}].map((k,i)=>(
        <Card key={i} style={{flex:"1 1 140px",padding:"10px 14px",textAlign:"center" as const}}>
          <div style={{fontSize:18,fontWeight:800,color:k.c}}>{k.v}</div>
          <div style={{fontSize:10,color:colors.g4,marginTop:2}}>{k.l}</div>
          {k.l==="Libres"&&total>0&&<div style={{marginTop:4,height:6,borderRadius:3,background:isDark?"rgba(255,255,255,.08)":"#F3F4F6",overflow:"hidden"}}>
            <div style={{height:"100%",width:Math.round((ocupadas/total)*100)+"%",borderRadius:3,background:"#10B981",transition:"width .3s"}}/>
          </div>}
        </Card>
      ))}
    </div>

    {/* Filter chips + actions */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8,marginBottom:12}}>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        <button onClick={()=>sCatFilter("all")} style={{padding:"5px 12px",borderRadius:20,border:"1px solid "+(catFilter==="all"?colors.rd:colors.g3),background:catFilter==="all"?colors.rd:"transparent",color:catFilter==="all"?"#fff":colors.g5,fontSize:11,fontWeight:600,cursor:"pointer"}}>Todos</button>
        {Object.entries(TAR_CATS).map(([k,v])=>(
          <button key={k} onClick={()=>sCatFilter(k)} style={{padding:"5px 12px",borderRadius:20,border:"1px solid "+(catFilter===k?v.c:colors.g3),background:catFilter===k?v.c:"transparent",color:catFilter===k?"#fff":colors.g5,fontSize:11,fontWeight:600,cursor:"pointer"}}>{v.i} {v.l}</button>
        ))}
      </div>
      <div style={{display:"flex",gap:6}}>
        <Btn v="g" s="s" onClick={()=>exportTarifarioPDF(items.filter((t:any)=>t.activo!==false),dolarRef)}>PDF</Btn>
        {canFullEdit&&<Btn v="pu" s="s" onClick={openAdd}>+ Tarifa</Btn>}
      </div>
    </div>

    {/* Form */}
    {showForm&&canFullEdit&&<Card style={{padding:14,marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:700,color:colors.nv,marginBottom:8}}>{editId?"Editar Tarifa":"Nueva Tarifa"}</div>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8}}>
        <div>
          <label style={{fontSize:10,color:colors.g4}}>Categoría</label>
          <select value={form.categoria} onChange={e=>sForm({...form,categoria:e.target.value})} style={{width:"100%",padding:"6px 8px",borderRadius:6,border:"1px solid "+colors.g3,fontSize:12,background:cardBg,color:colors.nv}}>
            {Object.entries(TAR_CATS).map(([k,v])=><option key={k} value={k}>{v.l}</option>)}
          </select>
        </div>
        <div>
          <label style={{fontSize:10,color:colors.g4}}>Ubicación</label>
          <input value={form.ubicacion} onChange={e=>sForm({...form,ubicacion:e.target.value})} placeholder="Ej: Camiseta titular - pecho" style={{width:"100%",padding:"6px 8px",borderRadius:6,border:"1px solid "+colors.g3,fontSize:12,background:cardBg,color:colors.nv}}/>
        </div>
        <div>
          <label style={{fontSize:10,color:colors.g4}}>Visibilidad</label>
          <select value={form.visibilidad} onChange={e=>sForm({...form,visibilidad:e.target.value})} style={{width:"100%",padding:"6px 8px",borderRadius:6,border:"1px solid "+colors.g3,fontSize:12,background:cardBg,color:colors.nv}}>
            {Object.entries(TAR_VIS).map(([k,v])=><option key={k} value={k}>{v.l}</option>)}
          </select>
        </div>
        <div>
          <label style={{fontSize:10,color:colors.g4}}>Descripción</label>
          <input value={form.descripcion} onChange={e=>sForm({...form,descripcion:e.target.value})} placeholder="Descripción opcional" style={{width:"100%",padding:"6px 8px",borderRadius:6,border:"1px solid "+colors.g3,fontSize:12,background:cardBg,color:colors.nv}}/>
        </div>
        <div>
          <label style={{fontSize:10,color:colors.g4}}>Precio Mín USD</label>
          <input type="number" value={form.precio_min_usd} onChange={e=>sForm({...form,precio_min_usd:e.target.value})} placeholder="0" style={{width:"100%",padding:"6px 8px",borderRadius:6,border:"1px solid "+colors.g3,fontSize:12,background:cardBg,color:colors.nv}}/>
        </div>
        <div>
          <label style={{fontSize:10,color:colors.g4}}>Precio Máx USD</label>
          <input type="number" value={form.precio_max_usd} onChange={e=>sForm({...form,precio_max_usd:e.target.value})} placeholder="0" style={{width:"100%",padding:"6px 8px",borderRadius:6,border:"1px solid "+colors.g3,fontSize:12,background:cardBg,color:colors.nv}}/>
        </div>
        <div>
          <label style={{fontSize:10,color:colors.g4}}>Sponsor Asignado</label>
          <select value={form.sponsor_asignado_id} onChange={e=>sForm({...form,sponsor_asignado_id:e.target.value})} style={{width:"100%",padding:"6px 8px",borderRadius:6,border:"1px solid "+colors.g3,fontSize:12,background:cardBg,color:colors.nv}}>
            <option value="">— Libre —</option>
            {(sponsors||[]).filter((s:any)=>s.status==="active").map((s:any)=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginTop:10}}>
        <Btn v="pu" s="s" onClick={handleSave}>{editId?"Guardar":"Agregar"}</Btn>
        <Btn v="g" s="s" onClick={()=>{sShowForm(false);sEditId(null);}}>Cancelar</Btn>
      </div>
    </Card>}

    {/* Delete confirmation */}
    {confirmDel!==null&&<Card style={{padding:14,marginBottom:14,borderLeft:"4px solid #DC2626"}}>
      <div style={{fontSize:13,fontWeight:700,color:"#DC2626",marginBottom:8}}>Confirmar eliminación</div>
      <div style={{display:"flex",gap:8}}>
        <Btn v="r" s="s" onClick={()=>{onDel(confirmDel);sConfirmDel(null);}}>Eliminar</Btn>
        <Btn v="g" s="s" onClick={()=>sConfirmDel(null)}>Cancelar</Btn>
      </div>
    </Card>}

    {/* Tables grouped by category */}
    {Object.entries(grouped).map(([cat,rows])=>{
      const catInfo=TAR_CATS[cat]||{l:cat,i:"📦",c:"#6B7280"};
      return(<Card key={cat} style={{padding:0,overflow:"hidden",marginBottom:14}}>
        <div style={{padding:"10px 14px",background:isDark?"rgba(255,255,255,.05)":"rgba(0,0,0,.02)",borderBottom:"1px solid "+colors.g2,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:16}}>{catInfo.i}</span>
          <span style={{fontSize:14,fontWeight:700,color:colors.nv}}>{catInfo.l}</span>
          <span style={{fontSize:11,color:colors.g4}}>({rows.length})</span>
        </div>
        <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:700}}>
            <thead>
              <tr style={{background:isDark?"rgba(255,255,255,.06)":"#F7F8FA"}}>
                {["Ubicación","Vis.","USD Mín","USD Máx","ARS Mín","ARS Máx","Sponsor",""].map((h,i)=>(
                  <th key={i} style={{padding:"7px 10px",fontSize:10,fontWeight:700,color:colors.g5,textAlign:i>=2&&i<=5?"right":"left",borderBottom:"1px solid "+colors.g2,whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((t:any)=>{
                const vInfo=TAR_VIS[t.visibilidad]||TAR_VIS.media;
                const sponName=getSponName(t.sponsor_asignado_id);
                return(<tr key={t.id} style={{borderBottom:"1px solid "+colors.g2}}>
                  <td style={{padding:"7px 10px",fontSize:12,color:colors.nv,fontWeight:500}}>{t.ubicacion}</td>
                  <td style={{padding:"7px 10px"}}><span style={{padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,background:vInfo.bg,color:vInfo.c}}>{vInfo.l}</span></td>
                  <td style={{padding:"7px 10px",fontSize:12,color:colors.nv,textAlign:"right",fontFamily:"monospace"}}>{fN(t.precio_min_usd)}</td>
                  <td style={{padding:"7px 10px",fontSize:12,color:colors.nv,textAlign:"right",fontFamily:"monospace"}}>{fN(t.precio_max_usd)}</td>
                  <td style={{padding:"7px 10px",fontSize:12,color:colors.g5,textAlign:"right",fontFamily:"monospace"}}>{fN(Number(t.precio_min_usd||0)*dolarRef)}</td>
                  <td style={{padding:"7px 10px",fontSize:12,color:colors.g5,textAlign:"right",fontFamily:"monospace"}}>{fN(Number(t.precio_max_usd||0)*dolarRef)}</td>
                  <td style={{padding:"7px 10px"}}>
                    {sponName
                      ?<span style={{padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,background:"#D1FAE5",color:"#10B981",cursor:"pointer"}} title="Ver sponsor">{sponName}</span>
                      :canFullEdit
                        ?<select value="" onChange={async(e)=>{const sid=Number(e.target.value);if(sid)await onUpd(t.id,{sponsor_asignado_id:sid});}} style={{padding:"2px 6px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:10,background:cardBg,color:"#3B82F6",cursor:"pointer",maxWidth:100}}>
                          <option value="">Libre</option>
                          {(sponsors||[]).filter((s:any)=>s.status==="active").map((s:any)=><option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        :<span style={{padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,background:"#DBEAFE",color:"#3B82F6"}}>Libre</span>}
                  </td>
                  <td style={{padding:"7px 10px",whiteSpace:"nowrap"}}>
                    {canFullEdit&&<>
                      <button onClick={()=>openEdit(t)} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,padding:2}} title="Editar">✏️</button>
                      <button onClick={()=>sConfirmDel(t.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,padding:2}} title="Eliminar">🗑️</button>
                    </>}
                  </td>
                </tr>);
              })}
            </tbody>
          </table>
        </div>
      </Card>);
    })}

    {vis.length===0&&<div style={{textAlign:"center",padding:40,color:colors.g4,fontSize:13}}>No hay tarifas{catFilter!=="all"?" en esta categoría":""}</div>}
  </div>);
}

/* ══════════════════════════════════════════════════════════════
   PipelinePanel — Kanban comercial
   ══════════════════════════════════════════════════════════════ */
const emptyPipeForm=()=>({nombre:"",contacto:"",email:"",telefono:"",etapa:PIPE_ST.PROSP,monto_potencial_usd:"",probabilidad:"10",proxima_accion:"",proxima_fecha:"",responsable:"Jesús Herrera",notas:""});
const PIPE_COLS=[PIPE_ST.PROSP,PIPE_ST.CONT,PIPE_ST.PROP,PIPE_ST.NEG,PIPE_ST.CIERRE];

function PipelinePanel({items,sponsors,dolarRef,colors,isDark,cardBg,mob,canFullEdit,onAdd,onUpd,onDel,onAddSponsor}:any){
  const deals:any[]=items||[];
  const [showForm,sShowForm]=useState(false);
  const [editId,sEditId]=useState<number|null>(null);
  const [form,sForm]=useState(emptyPipeForm());
  const [confirmDel,sConfirmDel]=useState<number|null>(null);
  const [dragId,sDragId]=useState<number|null>(null);
  const [showLost,sShowLost]=useState(false);

  const activeDeals=deals.filter(d=>d.etapa!==PIPE_ST.PERD);
  const lostDeals=deals.filter(d=>d.etapa===PIPE_ST.PERD);
  const totalMonto=activeDeals.reduce((s:number,d:any)=>s+Number(d.monto_potencial_usd||0),0);
  const ponderado=activeDeals.reduce((s:number,d:any)=>s+Number(d.monto_potencial_usd||0)*(Number(d.probabilidad||0)/100),0);
  const cierreDeals=deals.filter(d=>d.etapa===PIPE_ST.CIERRE).length;
  const totalActive=activeDeals.length;
  const tasaConv=totalActive>0?Math.round((cierreDeals/(totalActive))*100):0;

  const openAdd=()=>{sForm(emptyPipeForm());sEditId(null);sShowForm(true);};
  const openEdit=(d:any)=>{sForm({nombre:d.nombre||"",contacto:d.contacto||"",email:d.email||"",telefono:d.telefono||"",etapa:d.etapa||PIPE_ST.PROSP,monto_potencial_usd:String(d.monto_potencial_usd||""),probabilidad:String(d.probabilidad||"10"),proxima_accion:d.proxima_accion||"",proxima_fecha:d.proxima_fecha||"",responsable:d.responsable||"Jesús Herrera",notas:d.notas||""});sEditId(d.id);sShowForm(true);};

  const handleSave=async()=>{
    if(!form.nombre.trim())return;
    const d={nombre:form.nombre.trim(),contacto:form.contacto.trim(),email:form.email.trim(),telefono:form.telefono.trim(),etapa:form.etapa,monto_potencial_usd:Number(form.monto_potencial_usd)||0,probabilidad:Number(form.probabilidad)||0,proxima_accion:form.proxima_accion.trim(),proxima_fecha:form.proxima_fecha||null,responsable:form.responsable.trim(),notas:form.notas.trim()};
    if(editId){await onUpd(editId,d);}else{await onAdd(d);}
    sShowForm(false);sEditId(null);sForm(emptyPipeForm());
  };

  const handleDrop=(col:string)=>{
    if(!dragId)return;
    const deal=deals.find(d=>d.id===dragId);
    if(deal&&deal.etapa!==col){onUpd(dragId,{etapa:col});}
    sDragId(null);
  };

  const convertToSponsor=async(deal:any)=>{
    const sponData={name:deal.nombre,amount_cash:0,amount_service:0,status:"active",notes:"Convertido desde pipeline. "+deal.notas,responsable:deal.responsable};
    const newSpon=await onAddSponsor(sponData);
    if(newSpon?.id){await onUpd(deal.id,{sponsor_id:newSpon.id,etapa:PIPE_ST.CIERRE});}
  };

  const fN=(n:number)=>n?"$"+Math.round(n).toLocaleString("es-AR"):"–";
  const lbl:any={fontSize:10,fontWeight:600,color:colors.g5,display:"block",marginBottom:2};
  const inp:any={width:"100%",padding:"7px 10px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,background:cardBg,color:colors.nv,boxSizing:"border-box"};

  return(<div>
    {/* KPIs */}
    <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:14}}>
      {[{l:"Deals activos",v:totalActive,c:colors.bl},{l:"Monto USD",v:fN(totalMonto),c:"#10B981"},{l:"Ponderado USD",v:fN(ponderado),c:"#8B5CF6"},{l:"Tasa conversión",v:tasaConv+"%",c:colors.yl}].map((k,i)=>(
        <Card key={i} style={{flex:"1 1 130px",padding:"10px 14px",textAlign:"center" as const}}>
          <div style={{fontSize:18,fontWeight:800,color:k.c}}>{k.v}</div>
          <div style={{fontSize:10,color:colors.g4,marginTop:2}}>{k.l}</div>
        </Card>
      ))}
    </div>

    {/* Actions */}
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
      <div style={{display:"flex",gap:6}}>
        {lostDeals.length>0&&<button onClick={()=>sShowLost(!showLost)} style={{padding:"5px 12px",borderRadius:20,border:"1px solid #DC2626",background:showLost?"#FEE2E2":"transparent",color:"#DC2626",fontSize:11,fontWeight:600,cursor:"pointer"}}>❌ Perdidos ({lostDeals.length})</button>}
      </div>
      <div style={{display:"flex",gap:6}}>
        <Btn v="g" s="s" onClick={()=>exportPipelinePDF(deals,dolarRef)}>PDF</Btn>
        {canFullEdit&&<Btn v="pu" s="s" onClick={openAdd}>+ Deal</Btn>}
      </div>
    </div>

    {/* Kanban columns */}
    <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:8,minHeight:200}}>
      {PIPE_COLS.map(col=>{
        const sc=PIPE_SC[col];
        const colDeals=deals.filter(d=>d.etapa===col);
        return(<div key={col} onDragOver={e=>{e.preventDefault();e.currentTarget.style.background=sc.bg;}} onDragLeave={e=>{e.currentTarget.style.background="transparent";}} onDrop={e=>{e.preventDefault();e.currentTarget.style.background="transparent";handleDrop(col);}} style={{flex:"1 1 160px",minWidth:mob?140:160,background:"transparent",borderRadius:10,padding:6,transition:"background .2s"}}>
          <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:8,padding:"4px 8px",borderRadius:8,background:sc.bg}}>
            <span>{sc.i}</span>
            <span style={{fontSize:11,fontWeight:700,color:sc.c}}>{sc.l}</span>
            <span style={{fontSize:10,fontWeight:700,color:sc.c,marginLeft:"auto",background:"rgba(0,0,0,.06)",borderRadius:10,padding:"1px 6px"}}>{colDeals.length}</span>
          </div>
          {colDeals.map(deal=>(
            <div key={deal.id} draggable={canFullEdit} onDragStart={()=>sDragId(deal.id)} onClick={()=>openEdit(deal)} style={{background:cardBg,border:"1px solid "+colors.g2,borderRadius:10,padding:"8px 10px",marginBottom:6,cursor:"pointer",boxShadow:dragId===deal.id?"0 4px 12px rgba(0,0,0,.15)":"none",opacity:dragId===deal.id?.5:1,transition:"all .15s"}}>
              <div style={{fontSize:12,fontWeight:700,color:colors.nv,marginBottom:2}}>{deal.nombre}</div>
              {deal.monto_potencial_usd>0&&<div style={{fontSize:11,fontWeight:600,color:"#10B981"}}>USD {fN(deal.monto_potencial_usd)}</div>}
              <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                <span style={{fontSize:9,color:colors.g4}}>{deal.probabilidad||0}%</span>
                <span style={{fontSize:9,color:colors.g5}}>{deal.responsable}</span>
              </div>
              {deal.proxima_accion&&<div style={{fontSize:9,color:colors.g5,marginTop:3,fontStyle:"italic"}}>→ {deal.proxima_accion}</div>}
              {col===PIPE_ST.CIERRE&&!deal.sponsor_id&&canFullEdit&&<button onClick={e=>{e.stopPropagation();convertToSponsor(deal);}} style={{marginTop:6,width:"100%",padding:"4px 8px",borderRadius:6,border:"1px solid #10B981",background:"#D1FAE5",color:"#10B981",fontSize:10,fontWeight:700,cursor:"pointer"}}>Convertir a Sponsor</button>}
            </div>
          ))}
        </div>);
      })}
    </div>

    {/* Lost deals */}
    {showLost&&<Card style={{marginTop:10,padding:12}}>
      <div style={{fontSize:13,fontWeight:700,color:"#DC2626",marginBottom:8}}>❌ Deals perdidos</div>
      {lostDeals.map(d=>(
        <div key={d.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid "+colors.g2}}>
          <div><span style={{fontWeight:600,color:colors.nv,fontSize:12}}>{d.nombre}</span>{d.monto_potencial_usd>0&&<span style={{fontSize:11,color:colors.g4,marginLeft:8}}>USD {fN(d.monto_potencial_usd)}</span>}</div>
          {canFullEdit&&<div style={{display:"flex",gap:4}}>
            <Btn v="g" s="s" onClick={()=>{onUpd(d.id,{etapa:PIPE_ST.PROSP});}}>Reactivar</Btn>
            <Btn v="r" s="s" onClick={()=>{onDel(d.id);}}>Borrar</Btn>
          </div>}
        </div>
      ))}
    </Card>}

    {/* Form modal */}
    {showForm&&<div style={{position:"fixed" as const,inset:0,background:"rgba(0,0,0,.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>{sShowForm(false);sEditId(null);}}>
      <div style={{background:cardBg,borderRadius:16,padding:mob?16:24,width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto" as const,boxShadow:"0 8px 32px rgba(0,0,0,.2)"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontSize:14,fontWeight:800,color:colors.nv}}>{editId?"Editar Deal":"Nuevo Deal"}</div>
          <button onClick={()=>{sShowForm(false);sEditId(null);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:colors.g4}}>✕</button>
        </div>
        <div style={{marginBottom:8}}><label style={lbl}>Nombre *</label><input value={form.nombre} onChange={e=>sForm(p=>({...p,nombre:e.target.value}))} style={inp}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          <div><label style={lbl}>Contacto</label><input value={form.contacto} onChange={e=>sForm(p=>({...p,contacto:e.target.value}))} style={inp}/></div>
          <div><label style={lbl}>Email</label><input type="email" value={form.email} onChange={e=>sForm(p=>({...p,email:e.target.value}))} style={inp}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          <div><label style={lbl}>Teléfono</label><input value={form.telefono} onChange={e=>sForm(p=>({...p,telefono:e.target.value}))} style={inp}/></div>
          <div><label style={lbl}>Etapa</label><select value={form.etapa} onChange={e=>sForm(p=>({...p,etapa:e.target.value}))} style={inp}>{Object.entries(PIPE_SC).map(([k,v])=><option key={k} value={k}>{v.i} {v.l}</option>)}</select></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          <div><label style={lbl}>Monto potencial USD</label><input type="number" value={form.monto_potencial_usd} onChange={e=>sForm(p=>({...p,monto_potencial_usd:e.target.value}))} style={inp}/></div>
          <div><label style={lbl}>Probabilidad %</label><input type="number" value={form.probabilidad} onChange={e=>sForm(p=>({...p,probabilidad:e.target.value}))} style={inp} min={0} max={100}/></div>
        </div>
        <div style={{marginBottom:8}}><label style={lbl}>Responsable</label><input value={form.responsable} onChange={e=>sForm(p=>({...p,responsable:e.target.value}))} style={inp}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          <div><label style={lbl}>Próxima acción</label><input value={form.proxima_accion} onChange={e=>sForm(p=>({...p,proxima_accion:e.target.value}))} style={inp}/></div>
          <div><label style={lbl}>Próxima fecha</label><input type="date" value={form.proxima_fecha} onChange={e=>sForm(p=>({...p,proxima_fecha:e.target.value}))} style={inp}/></div>
        </div>
        <div style={{marginBottom:12}}><label style={lbl}>Notas</label><textarea value={form.notas} onChange={e=>sForm(p=>({...p,notas:e.target.value}))} rows={2} style={{...inp,resize:"vertical" as const}}/></div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          {editId&&canFullEdit&&<Btn v="r" s="s" onClick={()=>{onDel(editId);sShowForm(false);sEditId(null);}}>Eliminar</Btn>}
          {editId&&form.etapa!==PIPE_ST.PERD&&canFullEdit&&<Btn v="g" s="s" onClick={()=>{onUpd(editId,{etapa:PIPE_ST.PERD});sShowForm(false);sEditId(null);}}>Marcar Perdido</Btn>}
          <Btn v="g" s="s" onClick={()=>{sShowForm(false);sEditId(null);}}>Cancelar</Btn>
          <Btn v="s" s="s" onClick={handleSave}>Guardar</Btn>
        </div>
      </div>
    </div>}
  </div>);
}

/* ══════════════════════════════════════════════════════════════
   ContratosPanel — Gestión de contratos
   ══════════════════════════════════════════════════════════════ */
const emptyContrForm=()=>({sponsor_id:"",titulo:"",fecha_inicio:"",fecha_fin:"",monto_cash:"",monto_canje:"",ubicaciones_ids:[] as number[],condiciones:"",alerta_dias:"30"});

function ContratosPanel({contracts,sponsors,tarifario,colors,isDark,cardBg,mob,canFullEdit,onAdd,onUpd,onDel}:any){
  const items:any[]=contracts||[];
  const [showForm,sShowForm]=useState(false);
  const [editId,sEditId]=useState<number|null>(null);
  const [form,sForm]=useState(emptyContrForm());
  const [confirmDel,sConfirmDel]=useState<number|null>(null);

  const getEstado=(c:any)=>{if(c.estado==="renovado")return CONTR_ST.REN;if(!c.fecha_fin)return CONTR_ST.VIG;if(c.fecha_fin<TODAY)return CONTR_ST.VENC;const diff=Math.round((new Date(c.fecha_fin).getTime()-new Date(TODAY).getTime())/864e5);return diff<=(c.alerta_dias||30)?CONTR_ST.PROX:CONTR_ST.VIG;};
  const vigentes=items.filter(c=>getEstado(c)===CONTR_ST.VIG);
  const porVencer=items.filter(c=>getEstado(c)===CONTR_ST.PROX);
  const vencidos=items.filter(c=>getEstado(c)===CONTR_ST.VENC);
  const montoVig=vigentes.reduce((s:number,c:any)=>s+Number(c.monto_cash||0),0)+porVencer.reduce((s:number,c:any)=>s+Number(c.monto_cash||0),0);

  const getSponName=(id:number|null)=>{if(!id)return"–";const sp=(sponsors||[]).find((s:any)=>s.id===id);return sp?.name||"#"+id;};
  const fN=(n:number)=>n?"$"+Math.round(n).toLocaleString("es-AR"):"–";

  const openAdd=()=>{sForm(emptyContrForm());sEditId(null);sShowForm(true);};
  const openEdit=(c:any)=>{sForm({sponsor_id:String(c.sponsor_id||""),titulo:c.titulo||"",fecha_inicio:c.fecha_inicio||"",fecha_fin:c.fecha_fin||"",monto_cash:String(c.monto_cash||""),monto_canje:String(c.monto_canje||""),ubicaciones_ids:c.ubicaciones_ids||[],condiciones:c.condiciones||"",alerta_dias:String(c.alerta_dias||30)});sEditId(c.id);sShowForm(true);};

  const handleRenew=(c:any)=>{
    const nextStart=c.fecha_fin?new Date(new Date(c.fecha_fin).getTime()+864e5).toISOString().slice(0,10):"";
    sForm({sponsor_id:String(c.sponsor_id||""),titulo:c.titulo||"",fecha_inicio:nextStart,fecha_fin:"",monto_cash:String(c.monto_cash||""),monto_canje:String(c.monto_canje||""),ubicaciones_ids:c.ubicaciones_ids||[],condiciones:c.condiciones||"",alerta_dias:String(c.alerta_dias||30)});
    sEditId(null);sShowForm(true);
    // Mark old as renovado
    onUpd(c.id,{estado:"renovado"});
  };

  const handleSave=async()=>{
    if(!form.titulo.trim())return;
    const d={sponsor_id:Number(form.sponsor_id)||null,titulo:form.titulo.trim(),fecha_inicio:form.fecha_inicio||null,fecha_fin:form.fecha_fin||null,monto_cash:Number(form.monto_cash)||0,monto_canje:Number(form.monto_canje)||0,ubicaciones_ids:form.ubicaciones_ids,condiciones:form.condiciones.trim(),alerta_dias:Number(form.alerta_dias)||30};
    if(editId){await onUpd(editId,d);}else{await onAdd(d);}
    sShowForm(false);sEditId(null);sForm(emptyContrForm());
  };

  const tarItems=(tarifario||[]).filter((t:any)=>t.activo!==false);
  const lbl:any={fontSize:10,fontWeight:600,color:colors.g5,display:"block",marginBottom:2};
  const inp:any={width:"100%",padding:"7px 10px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,background:cardBg,color:colors.nv,boxSizing:"border-box"};

  return(<div>
    {/* Alert banner */}
    {porVencer.length>0&&<Card style={{marginBottom:12,padding:"10px 14px",background:isDark?"rgba(245,158,11,.12)":"#FEF3C7",border:"1px solid #F59E0B"}}>
      <div style={{fontSize:12,fontWeight:700,color:"#D97706",marginBottom:4}}>⚠️ {porVencer.length} contrato{porVencer.length>1?"s":""} por vencer</div>
      {porVencer.map(c=><div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:11,padding:"3px 0"}}>
        <span><strong>{getSponName(c.sponsor_id)}</strong> — {c.titulo} (vence {c.fecha_fin})</span>
        {canFullEdit&&<Btn v="s" s="s" onClick={()=>handleRenew(c)}>Renovar</Btn>}
      </div>)}
    </Card>}
    {vencidos.length>0&&<Card style={{marginBottom:12,padding:"10px 14px",background:isDark?"rgba(220,38,38,.12)":"#FEE2E2",border:"1px solid #DC2626"}}>
      <div style={{fontSize:12,fontWeight:700,color:"#DC2626"}}>🔴 {vencidos.length} contrato{vencidos.length>1?"s":""} vencido{vencidos.length>1?"s":""}</div>
    </Card>}

    {/* KPIs */}
    <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:14}}>
      {[{l:"Vigentes",v:vigentes.length,c:"#10B981"},{l:"Por vencer",v:porVencer.length,c:"#F59E0B"},{l:"Vencidos",v:vencidos.length,c:"#DC2626"},{l:"Monto vigente",v:fN(montoVig),c:colors.nv}].map((k,i)=>(
        <Card key={i} style={{flex:"1 1 130px",padding:"10px 14px",textAlign:"center" as const}}>
          <div style={{fontSize:18,fontWeight:800,color:k.c}}>{k.v}</div>
          <div style={{fontSize:10,color:colors.g4,marginTop:2}}>{k.l}</div>
        </Card>
      ))}
    </div>

    {/* Actions */}
    <div style={{display:"flex",justifyContent:"flex-end",gap:6,marginBottom:12}}>
      <Btn v="g" s="s" onClick={()=>exportContractsPDF(items,sponsors)}>PDF</Btn>
      {canFullEdit&&<Btn v="pu" s="s" onClick={openAdd}>+ Contrato</Btn>}
    </div>

    {/* Table */}
    <div style={{overflowX:"auto"}}>
    <table style={{width:"100%",borderCollapse:"collapse" as const,fontSize:11}}>
      <thead><tr style={{background:isDark?"rgba(255,255,255,.05)":"#F7F8FA"}}>
        {["Sponsor","Título","Inicio","Fin","Cash $","Canje $","Estado",""].map((h,i)=><th key={i} style={{padding:"6px 8px",textAlign:i>=4&&i<=5?"right":"left" as const,fontWeight:700,color:colors.g5,fontSize:10,borderBottom:"2px solid "+colors.g2}}>{h}</th>)}
      </tr></thead>
      <tbody>{items.map(c=>{const est=getEstado(c);const sc=CONTR_SC[est];return(
        <tr key={c.id} style={{borderBottom:"1px solid "+colors.g2}}>
          <td style={{padding:"6px 8px",fontWeight:600,color:colors.nv}}>{getSponName(c.sponsor_id)}</td>
          <td style={{padding:"6px 8px",color:colors.nv}}>{c.titulo}</td>
          <td style={{padding:"6px 8px",color:colors.g5,fontSize:10}}>{c.fecha_inicio||"–"}</td>
          <td style={{padding:"6px 8px",color:colors.g5,fontSize:10}}>{c.fecha_fin||"–"}</td>
          <td style={{padding:"6px 8px",textAlign:"right",fontWeight:600,color:"#10B981"}}>{fN(c.monto_cash)}</td>
          <td style={{padding:"6px 8px",textAlign:"right",fontWeight:600,color:"#3B82F6"}}>{fN(c.monto_canje)}</td>
          <td style={{padding:"6px 8px"}}><span style={{padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,background:sc.bg,color:sc.c}}>{sc.i} {sc.l}</span></td>
          <td style={{padding:"6px 8px"}}>
            {canFullEdit&&<div style={{display:"flex",gap:4}}>
              <button onClick={()=>openEdit(c)} style={{background:"none",border:"none",cursor:"pointer",fontSize:12}} title="Editar">✏️</button>
              {est===CONTR_ST.PROX&&<button onClick={()=>handleRenew(c)} style={{background:"none",border:"none",cursor:"pointer",fontSize:12}} title="Renovar">🔄</button>}
              {confirmDel===c.id?<><Btn v="r" s="s" onClick={()=>{onDel(c.id);sConfirmDel(null);}}>Sí</Btn><Btn v="g" s="s" onClick={()=>sConfirmDel(null)}>No</Btn></>:<button onClick={()=>sConfirmDel(c.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:12}} title="Eliminar">🗑️</button>}
            </div>}
          </td>
        </tr>);})}</tbody>
    </table>
    {items.length===0&&<div style={{textAlign:"center",padding:40,color:colors.g4,fontSize:13}}>No hay contratos registrados</div>}
    </div>

    {/* Form modal */}
    {showForm&&<div style={{position:"fixed" as const,inset:0,background:"rgba(0,0,0,.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>{sShowForm(false);sEditId(null);}}>
      <div style={{background:cardBg,borderRadius:16,padding:mob?16:24,width:"100%",maxWidth:520,maxHeight:"90vh",overflowY:"auto" as const,boxShadow:"0 8px 32px rgba(0,0,0,.2)"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontSize:14,fontWeight:800,color:colors.nv}}>{editId?"Editar Contrato":"Nuevo Contrato"}</div>
          <button onClick={()=>{sShowForm(false);sEditId(null);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:colors.g4}}>✕</button>
        </div>
        <div style={{marginBottom:8}}><label style={lbl}>Sponsor</label><select value={form.sponsor_id} onChange={e=>sForm(p=>({...p,sponsor_id:e.target.value}))} style={inp}><option value="">— Seleccionar —</option>{(sponsors||[]).map((s:any)=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
        <div style={{marginBottom:8}}><label style={lbl}>Título *</label><input value={form.titulo} onChange={e=>sForm(p=>({...p,titulo:e.target.value}))} style={inp}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          <div><label style={lbl}>Fecha inicio</label><input type="date" value={form.fecha_inicio} onChange={e=>sForm(p=>({...p,fecha_inicio:e.target.value}))} style={inp}/></div>
          <div><label style={lbl}>Fecha fin</label><input type="date" value={form.fecha_fin} onChange={e=>sForm(p=>({...p,fecha_fin:e.target.value}))} style={inp}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          <div><label style={lbl}>Monto Cash $</label><input type="number" value={form.monto_cash} onChange={e=>sForm(p=>({...p,monto_cash:e.target.value}))} style={inp}/></div>
          <div><label style={lbl}>Monto Canje $</label><input type="number" value={form.monto_canje} onChange={e=>sForm(p=>({...p,monto_canje:e.target.value}))} style={inp}/></div>
        </div>
        <div style={{marginBottom:8}}><label style={lbl}>Alerta días antes</label><input type="number" value={form.alerta_dias} onChange={e=>sForm(p=>({...p,alerta_dias:e.target.value}))} style={inp}/></div>
        {tarItems.length>0&&<div style={{marginBottom:8}}><label style={lbl}>Ubicaciones del tarifario</label>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {tarItems.map((t:any)=>{const sel=form.ubicaciones_ids.includes(t.id);return(
              <button key={t.id} onClick={()=>sForm(p=>({...p,ubicaciones_ids:sel?p.ubicaciones_ids.filter((x:number)=>x!==t.id):[...p.ubicaciones_ids,t.id]}))} style={{padding:"3px 8px",borderRadius:12,border:"1px solid "+(sel?"#10B981":colors.g3),background:sel?"#D1FAE5":"transparent",color:sel?"#10B981":colors.g5,fontSize:10,fontWeight:600,cursor:"pointer"}}>{t.ubicacion}</button>
            );})}
          </div>
        </div>}
        <div style={{marginBottom:12}}><label style={lbl}>Condiciones</label><textarea value={form.condiciones} onChange={e=>sForm(p=>({...p,condiciones:e.target.value}))} rows={2} style={{...inp,resize:"vertical" as const}}/></div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <Btn v="g" s="s" onClick={()=>{sShowForm(false);sEditId(null);}}>Cancelar</Btn>
          <Btn v="s" s="s" onClick={handleSave}>Guardar</Btn>
        </div>
      </div>
    </div>}
  </div>);
}

/* ══════════════════════════════════════════════════════════════
   DashboardPanel — Métricas e ingresos
   ══════════════════════════════════════════════════════════════ */
function DashboardPanel({sponsors,tarifario,contracts,pipeline,dolarRef,colors,isDark,cardBg,mob}:any){
  const sp:any[]=sponsors||[];
  const tar:any[]=tarifario||[];
  const ctr:any[]=contracts||[];
  const pipe:any[]=pipeline||[];

  const activeSpon=sp.filter(s=>s.status==="active");
  const totalCash=activeSpon.reduce((s:number,x:any)=>s+Number(x.amount_cash||0),0);
  const totalService=activeSpon.reduce((s:number,x:any)=>s+Number(x.amount_service||0),0);
  const totalUSD=dolarRef>0?Math.round((totalCash+totalService)/dolarRef):0;
  const activeTar=tar.filter(t=>t.activo!==false);
  const ocupadas=activeTar.filter(t=>t.sponsor_asignado_id).length;
  const ocupPct=activeTar.length>0?Math.round((ocupadas/activeTar.length)*100):0;
  const pipeTotal=pipe.filter(p=>p.etapa!=="perdido").reduce((s:number,p:any)=>s+Number(p.monto_potencial_usd||0),0);

  const fN=(n:number)=>n?"$"+Math.round(n).toLocaleString("es-AR"):"–";

  /* Donut chart: Cash vs Canje */
  const donutR=60;const donutC=Math.PI*2*donutR;
  const cashPct=(totalCash+totalService)>0?totalCash/(totalCash+totalService):0;
  const cashLen=cashPct*donutC;
  const canjLen=(1-cashPct)*donutC;

  /* Occupation by category */
  const cats=["indumentaria_rugby","hockey","espacio","digital"];
  const catLabels:Record<string,string>={indumentaria_rugby:"Indumentaria",hockey:"Hockey",espacio:"Espacio",digital:"Digital"};
  const catColors:Record<string,string>={indumentaria_rugby:"#C8102E",hockey:"#EC4899",espacio:"#F59E0B",digital:"#3B82F6"};
  const catData=cats.map(k=>{const all=activeTar.filter(t=>t.categoria===k);const occ=all.filter(t=>t.sponsor_asignado_id).length;return{k,l:catLabels[k],total:all.length,occ,pct:all.length>0?Math.round((occ/all.length)*100):0};});

  /* Pipeline funnel */
  const funnelStages=[PIPE_ST.PROSP,PIPE_ST.CONT,PIPE_ST.PROP,PIPE_ST.NEG,PIPE_ST.CIERRE];
  const funnelData=funnelStages.map(s=>{const d=pipe.filter(p=>p.etapa===s);return{s,l:PIPE_SC[s].l,c:PIPE_SC[s].c,count:d.length,monto:d.reduce((a:number,p:any)=>a+Number(p.monto_potencial_usd||0),0)};});
  const maxFunnel=Math.max(...funnelData.map(f=>f.count),1);

  /* Top 10 sponsors */
  const top10=[...sp].sort((a,b)=>(Number(b.amount_cash||0)+Number(b.amount_service||0))-(Number(a.amount_cash||0)+Number(a.amount_service||0))).slice(0,10);

  return(<div>
    {/* KPIs */}
    <div style={{display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)",gap:10,marginBottom:16}}>
      {[{l:"Ingreso activo ARS",v:fN(totalCash+totalService),c:"#10B981"},{l:"Sponsors activos",v:activeSpon.length,c:"#8B5CF6"},{l:"Ocupación tarifario",v:ocupPct+"%",c:"#F59E0B"},{l:"Pipeline USD",v:fN(pipeTotal),c:"#3B82F6"}].map((k,i)=>(
        <Card key={i} style={{padding:"12px 16px",textAlign:"center" as const,borderTop:"3px solid "+k.c}}>
          <div style={{fontSize:22,fontWeight:800,color:k.c}}>{k.v}</div>
          <div style={{fontSize:10,color:colors.g4,marginTop:2}}>{k.l}</div>
        </Card>
      ))}
    </div>

    <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:14,marginBottom:16}}>
      {/* Donut: Cash vs Canje */}
      <Card style={{padding:16}}>
        <div style={{fontSize:13,fontWeight:700,color:colors.nv,marginBottom:10}}>Ingresos por tipo</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:20}}>
          <svg width={150} height={150} viewBox="0 0 150 150">
            <circle cx={75} cy={75} r={donutR} fill="none" stroke={isDark?"#1E293B":"#E8ECF1"} strokeWidth={18}/>
            {(totalCash+totalService)>0&&<><circle cx={75} cy={75} r={donutR} fill="none" stroke="#10B981" strokeWidth={18} strokeDasharray={`${cashLen} ${donutC}`} strokeDashoffset={donutC*0.25} strokeLinecap="round"/>
            <circle cx={75} cy={75} r={donutR} fill="none" stroke="#3B82F6" strokeWidth={18} strokeDasharray={`${canjLen} ${donutC}`} strokeDashoffset={donutC*0.25-cashLen} strokeLinecap="round"/></>}
            <text x={75} y={72} textAnchor="middle" fill={colors.nv} fontSize={14} fontWeight={800}>{fN(totalCash+totalService)}</text>
            <text x={75} y={88} textAnchor="middle" fill={colors.g4} fontSize={9}>Total ARS</text>
          </svg>
          <div style={{fontSize:11}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><span style={{width:10,height:10,borderRadius:"50%",background:"#10B981",display:"inline-block"}}/><span style={{color:colors.nv}}>Cash {fN(totalCash)}</span></div>
            <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{width:10,height:10,borderRadius:"50%",background:"#3B82F6",display:"inline-block"}}/><span style={{color:colors.nv}}>Canje {fN(totalService)}</span></div>
          </div>
        </div>
      </Card>

      {/* Bar: Occupation by category */}
      <Card style={{padding:16}}>
        <div style={{fontSize:13,fontWeight:700,color:colors.nv,marginBottom:10}}>Ocupación por categoría</div>
        {catData.map(c=>(
          <div key={c.k} style={{marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:2}}>
              <span style={{fontWeight:600,color:colors.nv}}>{c.l}</span>
              <span style={{color:colors.g4}}>{c.occ}/{c.total} ({c.pct}%)</span>
            </div>
            <div style={{height:14,borderRadius:7,background:isDark?"rgba(255,255,255,.06)":"#F3F4F6",overflow:"hidden"}}>
              <div style={{height:"100%",width:c.pct+"%",borderRadius:7,background:catColors[c.k],transition:"width .3s"}}/>
            </div>
          </div>
        ))}
      </Card>
    </div>

    {/* Pipeline funnel */}
    <Card style={{padding:16,marginBottom:16}}>
      <div style={{fontSize:13,fontWeight:700,color:colors.nv,marginBottom:10}}>Pipeline Funnel</div>
      <div style={{display:"flex",gap:6,alignItems:"flex-end",height:120}}>
        {funnelData.map(f=>(
          <div key={f.s} style={{flex:1,display:"flex",flexDirection:"column" as const,alignItems:"center"}}>
            <div style={{fontSize:14,fontWeight:800,color:f.c,marginBottom:2}}>{f.count}</div>
            <div style={{width:"100%",maxWidth:60,borderRadius:"6px 6px 0 0",background:f.c,height:Math.max(8,Math.round((f.count/maxFunnel)*80)),transition:"height .3s"}}/>
            <div style={{fontSize:8,color:colors.g4,marginTop:4,textAlign:"center"}}>{f.l}</div>
            {f.monto>0&&<div style={{fontSize:8,color:colors.g5,fontWeight:600}}>${Math.round(f.monto).toLocaleString("es-AR")}</div>}
          </div>
        ))}
      </div>
    </Card>

    {/* Top 10 sponsors */}
    <Card style={{padding:16}}>
      <div style={{fontSize:13,fontWeight:700,color:colors.nv,marginBottom:10}}>Top 10 Sponsors por monto</div>
      <table style={{width:"100%",borderCollapse:"collapse" as const,fontSize:11}}>
        <thead><tr style={{borderBottom:"2px solid "+colors.g2}}>
          {["#","Sponsor","Cash","Canje","Total"].map((h,i)=><th key={i} style={{padding:"4px 6px",textAlign:i>=2?"right":"left" as const,fontWeight:700,color:colors.g5,fontSize:10}}>{h}</th>)}
        </tr></thead>
        <tbody>{top10.map((s,i)=>{const t=Number(s.amount_cash||0)+Number(s.amount_service||0);return(
          <tr key={s.id} style={{borderBottom:"1px solid "+colors.g2}}>
            <td style={{padding:"4px 6px",fontWeight:600,color:colors.g4}}>{i+1}</td>
            <td style={{padding:"4px 6px",fontWeight:600,color:colors.nv}}>{s.name}</td>
            <td style={{padding:"4px 6px",textAlign:"right",color:"#10B981",fontWeight:600}}>{fN(s.amount_cash)}</td>
            <td style={{padding:"4px 6px",textAlign:"right",color:"#3B82F6",fontWeight:600}}>{fN(s.amount_service)}</td>
            <td style={{padding:"4px 6px",textAlign:"right",fontWeight:800,color:colors.nv}}>{fN(t)}</td>
          </tr>);})}</tbody>
      </table>
      {top10.length===0&&<div style={{textAlign:"center",padding:20,color:colors.g4}}>No hay sponsors</div>}
    </Card>
  </div>);
}

/* ══════════════════════════════════════════════════════════════
   PropuestasPanel — Propuestas comerciales con aprobación SE
   ══════════════════════════════════════════════════════════════ */
const emptyPropForm=()=>({nombre_prospecto:"",contacto:"",rubro:"",nivel_propuesto:"white",aporte_dinero:"",aporte_canje:"",detalle_canje:"",ubicaciones_propuestas:[] as number[],descuento_pct:"",valor_final:"",justificacion:"",estado:PROP_ST.BOR});

function PropuestasPanel({propuestas,votos,mensajes,sponsors,tarifario,colors,isDark,cardBg,mob,canCreate,canVote,user,onAdd,onUpd,onDel,onVote,onMsg,onAddSponsor}:any){
  const items:any[]=propuestas||[];
  const [showForm,sShowForm]=useState(false);
  const [editId,sEditId]=useState<number|null>(null);
  const [form,sForm]=useState(emptyPropForm());
  const [detailId,sDetailId]=useState<number|null>(null);
  const [msgText,sMsgText]=useState("");
  const [fSt,sFSt]=useState("all");

  const fN=(n:number)=>n?"$"+Math.round(n).toLocaleString("es-AR"):"–";
  const lbl:any={fontSize:10,fontWeight:600,color:colors.g5,display:"block",marginBottom:2};
  const inp:any={width:"100%",padding:"7px 10px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,background:cardBg,color:colors.nv,boxSizing:"border-box"};

  const tarItems=(tarifario||[]).filter((t:any)=>t.activo!==false);
  const calcTarifario=(ids:number[])=>ids.reduce((s:number,id:number)=>{const t=tarItems.find((x:any)=>x.id===id);return s+(t?Number(t.precio_max_usd||0):0);},0);

  const openAdd=()=>{sForm(emptyPropForm());sEditId(null);sShowForm(true);};
  const openEdit=(p:any)=>{sForm({nombre_prospecto:p.nombre_prospecto||"",contacto:p.contacto||"",rubro:p.rubro||"",nivel_propuesto:p.nivel_propuesto||"white",aporte_dinero:String(p.aporte_dinero||""),aporte_canje:String(p.aporte_canje||""),detalle_canje:p.detalle_canje||"",ubicaciones_propuestas:p.ubicaciones_propuestas||[],descuento_pct:String(p.descuento_pct||""),valor_final:String(p.valor_final||""),justificacion:p.justificacion||"",estado:p.estado||PROP_ST.BOR});sEditId(p.id);sShowForm(true);};

  const handleSave=async()=>{
    if(!form.nombre_prospecto.trim())return;
    const valTar=calcTarifario(form.ubicaciones_propuestas);
    const d={...form,nombre_prospecto:form.nombre_prospecto.trim(),aporte_dinero:Number(form.aporte_dinero)||0,aporte_canje:Number(form.aporte_canje)||0,ubicaciones_propuestas:form.ubicaciones_propuestas,valor_tarifario:valTar,descuento_pct:Number(form.descuento_pct)||0,valor_final:Number(form.valor_final)||0};
    if(editId){await onUpd(editId,d);}else{await onAdd(d);}
    sShowForm(false);sEditId(null);
  };

  const formalizar=async(p:any)=>{
    const sponData={name:p.nombre_prospecto,amount_cash:p.aporte_dinero||0,amount_service:p.aporte_canje||0,status:"active",notes:"Formalizado desde propuesta #"+p.id,nivel:p.nivel_propuesto,responsable:"Jesús Herrera"};
    await onAddSponsor(sponData);
    await onUpd(p.id,{estado:PROP_ST.FORM});
  };

  const vis=fSt==="all"?items:items.filter(p=>p.estado===fSt);
  const detail=detailId?items.find((p:any)=>p.id===detailId):null;
  const detailVotos=(votos||[]).filter((v:any)=>v.propuesta_id===detailId);
  const detailMsgs=(mensajes||[]).filter((m:any)=>m.propuesta_id===detailId);
  const alreadyVoted=detailVotos.some((v:any)=>v.user_id===user?.id);

  if(detail)return(<div>
    <button onClick={()=>sDetailId(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:colors.bl,marginBottom:8}}>← Volver a propuestas</button>
    <Card style={{padding:16,marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:10}}>
        <div><div style={{fontSize:16,fontWeight:800,color:colors.nv}}>{detail.nombre_prospecto}</div>
        <div style={{fontSize:11,color:colors.g4}}>{detail.contacto} · {detail.rubro}</div></div>
        <span style={{padding:"3px 10px",borderRadius:12,fontSize:10,fontWeight:600,background:PROP_SC[detail.estado]?.bg,color:PROP_SC[detail.estado]?.c}}>{PROP_SC[detail.estado]?.i} {PROP_SC[detail.estado]?.l}</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
        <div><div style={{fontSize:10,color:colors.g4}}>Aporte Cash</div><div style={{fontSize:14,fontWeight:700,color:"#10B981"}}>{fN(detail.aporte_dinero)}</div></div>
        <div><div style={{fontSize:10,color:colors.g4}}>Aporte Canje</div><div style={{fontSize:14,fontWeight:700,color:"#3B82F6"}}>{fN(detail.aporte_canje)}</div></div>
        <div><div style={{fontSize:10,color:colors.g4}}>Nivel</div><div style={{fontSize:14,fontWeight:700,color:SPON_TIER[detail.nivel_propuesto]?.c||colors.g5}}>{SPON_TIER[detail.nivel_propuesto]?.i} {SPON_TIER[detail.nivel_propuesto]?.l}</div></div>
      </div>
      {detail.justificacion&&<div style={{fontSize:11,color:colors.g5,marginBottom:8,padding:8,background:isDark?"rgba(255,255,255,.03)":"#F7F8FA",borderRadius:8}}><strong>Justificación:</strong> {detail.justificacion}</div>}
      {canCreate&&detail.estado===PROP_ST.BOR&&<Btn v="s" s="s" onClick={()=>onUpd(detail.id,{estado:PROP_ST.PROP_SE})}>Enviar a SE</Btn>}
      {canCreate&&detail.estado===PROP_ST.NEG&&<Btn v="s" s="s" onClick={()=>onUpd(detail.id,{estado:PROP_ST.PROP_SE})}>Enviar a SE</Btn>}
      {detail.estado===PROP_ST.APR&&canCreate&&<Btn v="s" s="s" onClick={()=>formalizar(detail)}>Formalizar (crear sponsor)</Btn>}
    </Card>
    {/* Voting */}
    {(detail.estado===PROP_ST.PROP_SE||detail.estado===PROP_ST.DEL)&&<Card style={{padding:14,marginBottom:12}}>
      <div style={{fontSize:13,fontWeight:700,color:colors.nv,marginBottom:8}}>Votación SE</div>
      {detailVotos.map((v:any)=><div key={v.id} style={{fontSize:11,padding:"4px 0",borderBottom:"1px solid "+colors.g2}}>
        <strong>{v.user_name}</strong>: <span style={{color:v.voto==="aprobado"?"#10B981":"#DC2626",fontWeight:600}}>{v.voto==="aprobado"?"Aprobó":"Rechazó"}</span> {v.comentario&&<span style={{color:colors.g4}}>— {v.comentario}</span>}
      </div>)}
      {canVote&&!alreadyVoted&&<div style={{display:"flex",gap:6,marginTop:8}}>
        <Btn v="s" s="s" onClick={()=>{onVote({propuesta_id:detail.id,voto:"aprobado"});if(detailVotos.length>=2)onUpd(detail.id,{estado:PROP_ST.APR});}}>Aprobar</Btn>
        <Btn v="r" s="s" onClick={()=>{onVote({propuesta_id:detail.id,voto:"rechazado"});onUpd(detail.id,{estado:PROP_ST.RECH});}}>Rechazar</Btn>
      </div>}
      {alreadyVoted&&<div style={{fontSize:10,color:colors.g4,marginTop:6}}>Ya votaste esta propuesta</div>}
    </Card>}
    {/* Thread */}
    <Card style={{padding:14}}>
      <div style={{fontSize:13,fontWeight:700,color:colors.nv,marginBottom:8}}>Deliberación</div>
      {detailMsgs.map((m:any)=><div key={m.id} style={{fontSize:11,padding:"4px 0",borderBottom:"1px solid "+colors.g2}}>
        <strong style={{color:colors.bl}}>{m.user_name}</strong> <span style={{color:colors.g4,fontSize:9}}>{m.created_at?.slice(0,10)}</span>
        <div style={{color:colors.nv,marginTop:2}}>{m.content}</div>
      </div>)}
      <div style={{display:"flex",gap:6,marginTop:8}}>
        <input value={msgText} onChange={e=>sMsgText(e.target.value)} placeholder="Escribir comentario..." style={{flex:1,...inp}} onKeyDown={e=>{if(e.key==="Enter"&&msgText.trim()){onMsg(detail.id,msgText);sMsgText("");}}}/>
        <Btn v="s" s="s" onClick={()=>{if(msgText.trim()){onMsg(detail.id,msgText);sMsgText("");}}}>Enviar</Btn>
      </div>
    </Card>
  </div>);

  return(<div>
    {/* Filter + actions */}
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
        <button onClick={()=>sFSt("all")} style={{padding:"4px 10px",borderRadius:14,border:"1px solid "+(fSt==="all"?colors.rd:colors.g3),background:fSt==="all"?colors.rd:"transparent",color:fSt==="all"?"#fff":colors.g5,fontSize:10,fontWeight:600,cursor:"pointer"}}>Todas ({items.length})</button>
        {Object.entries(PROP_SC).map(([k,v])=>{const c=items.filter(p=>p.estado===k).length;return c>0?<button key={k} onClick={()=>sFSt(k)} style={{padding:"4px 10px",borderRadius:14,border:"1px solid "+(fSt===k?v.c:colors.g3),background:fSt===k?v.bg:"transparent",color:fSt===k?v.c:colors.g5,fontSize:10,fontWeight:600,cursor:"pointer"}}>{v.i} {v.l} ({c})</button>:null;})}
      </div>
      {canCreate&&<Btn v="pu" s="s" onClick={openAdd}>+ Propuesta</Btn>}
    </div>
    {/* List */}
    {vis.map(p=><Card key={p.id} style={{padding:"10px 14px",marginBottom:8,cursor:"pointer"}} onClick={()=>sDetailId(p.id)}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontSize:13,fontWeight:700,color:colors.nv}}>{p.nombre_prospecto}</div><div style={{fontSize:10,color:colors.g4}}>{p.contacto} · {SPON_TIER[p.nivel_propuesto]?.l||"White"} · {fN(p.aporte_dinero+p.aporte_canje)}</div></div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{padding:"3px 8px",borderRadius:10,fontSize:9,fontWeight:600,background:PROP_SC[p.estado]?.bg,color:PROP_SC[p.estado]?.c}}>{PROP_SC[p.estado]?.i} {PROP_SC[p.estado]?.l}</span>
          {canCreate&&<button onClick={e=>{e.stopPropagation();openEdit(p);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:12}}>✏️</button>}
        </div>
      </div>
    </Card>)}
    {vis.length===0&&<div style={{textAlign:"center",padding:40,color:colors.g4,fontSize:13}}>No hay propuestas</div>}

    {/* Form modal */}
    {showForm&&<div style={{position:"fixed" as const,inset:0,background:"rgba(0,0,0,.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>sShowForm(false)}>
      <div style={{background:cardBg,borderRadius:16,padding:mob?16:24,width:"100%",maxWidth:560,maxHeight:"90vh",overflowY:"auto" as const,boxShadow:"0 8px 32px rgba(0,0,0,.2)"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:14,fontWeight:800,color:colors.nv,marginBottom:14}}>{editId?"Editar Propuesta":"Nueva Propuesta"}</div>
        <div style={{marginBottom:8}}><label style={lbl}>Prospecto *</label><input value={form.nombre_prospecto} onChange={e=>sForm(p=>({...p,nombre_prospecto:e.target.value}))} style={inp}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          <div><label style={lbl}>Contacto</label><input value={form.contacto} onChange={e=>sForm(p=>({...p,contacto:e.target.value}))} style={inp}/></div>
          <div><label style={lbl}>Rubro</label><input value={form.rubro} onChange={e=>sForm(p=>({...p,rubro:e.target.value}))} style={inp}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          <div><label style={lbl}>Nivel propuesto</label><select value={form.nivel_propuesto} onChange={e=>sForm(p=>({...p,nivel_propuesto:e.target.value}))} style={inp}>{Object.entries(SPON_TIER).map(([k,v])=><option key={k} value={k}>{v.i} {v.l}</option>)}</select></div>
          <div><label style={lbl}>Estado</label><select value={form.estado} onChange={e=>sForm(p=>({...p,estado:e.target.value}))} style={inp}>{Object.entries(PROP_SC).map(([k,v])=><option key={k} value={k}>{v.i} {v.l}</option>)}</select></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          <div><label style={lbl}>Aporte Cash $</label><input type="number" value={form.aporte_dinero} onChange={e=>sForm(p=>({...p,aporte_dinero:e.target.value}))} style={inp}/></div>
          <div><label style={lbl}>Aporte Canje $</label><input type="number" value={form.aporte_canje} onChange={e=>sForm(p=>({...p,aporte_canje:e.target.value}))} style={inp}/></div>
        </div>
        <div style={{marginBottom:8}}><label style={lbl}>Detalle canje</label><input value={form.detalle_canje} onChange={e=>sForm(p=>({...p,detalle_canje:e.target.value}))} style={inp}/></div>
        {tarItems.length>0&&<div style={{marginBottom:8}}><label style={lbl}>Ubicaciones tarifario (valor auto: USD {calcTarifario(form.ubicaciones_propuestas)})</label>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{tarItems.map((t:any)=>{const sel=form.ubicaciones_propuestas.includes(t.id);return(
            <button key={t.id} onClick={()=>sForm(p=>({...p,ubicaciones_propuestas:sel?p.ubicaciones_propuestas.filter((x:number)=>x!==t.id):[...p.ubicaciones_propuestas,t.id]}))} style={{padding:"3px 8px",borderRadius:12,border:"1px solid "+(sel?"#10B981":colors.g3),background:sel?"#D1FAE5":"transparent",color:sel?"#10B981":colors.g5,fontSize:10,fontWeight:600,cursor:"pointer"}}>{t.ubicacion}</button>
          );})}</div>
        </div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          <div><label style={lbl}>Descuento %</label><input type="number" value={form.descuento_pct} onChange={e=>sForm(p=>({...p,descuento_pct:e.target.value}))} style={inp}/></div>
          <div><label style={lbl}>Valor final $</label><input type="number" value={form.valor_final} onChange={e=>sForm(p=>({...p,valor_final:e.target.value}))} style={inp}/></div>
        </div>
        <div style={{marginBottom:12}}><label style={lbl}>Justificación</label><textarea value={form.justificacion} onChange={e=>sForm(p=>({...p,justificacion:e.target.value}))} rows={3} style={{...inp,resize:"vertical" as const}}/></div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          {editId&&<Btn v="r" s="s" onClick={()=>{onDel(editId);sShowForm(false);}}>Eliminar</Btn>}
          <Btn v="g" s="s" onClick={()=>sShowForm(false)}>Cancelar</Btn>
          <Btn v="s" s="s" onClick={handleSave}>Guardar</Btn>
        </div>
      </div>
    </div>}
  </div>);
}

/* ══════════════════════════════════════════════════════════════
   MaterialesPanel — Repositorio descargable
   ══════════════════════════════════════════════════════════════ */
function MaterialesPanel({materiales,colors,isDark,cardBg,mob,canUpload,onAdd,onDel}:any){
  const items:any[]=materiales||[];
  const archivos=useDataStore(s=>s.archivos);
  const [showForm,sShowForm]=useState(false);
  const [form,sForm]=useState({titulo:"",descripcion:"",categoria:"general",archivo_url:"",archivo_nombre:""});
  const [archSearch,sArchSearch]=useState("");
  const lbl:any={fontSize:10,fontWeight:600,color:colors.g5,display:"block",marginBottom:2};
  const inp:any={width:"100%",padding:"7px 10px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,background:cardBg,color:colors.nv,boxSizing:"border-box"};

  const filteredArch=useMemo(()=>{
    const all:any[]=archivos||[];
    if(!archSearch.trim())return all.slice(0,30);
    const q=archSearch.toLowerCase();
    return all.filter((a:any)=>((a.titulo||"")+(a.name||"")).toLowerCase().includes(q)).slice(0,30);
  },[archivos,archSearch]);

  const selectArchivo=(a:any)=>{
    sForm(p=>({...p,archivo_url:a.url,archivo_nombre:a.titulo||a.name||"",titulo:p.titulo||a.titulo||a.name||""}));
    sArchSearch("");
  };

  const handleSave=async()=>{
    if(!form.titulo.trim()||!form.archivo_url)return;
    await onAdd({titulo:form.titulo.trim(),descripcion:form.descripcion.trim(),categoria:form.categoria,archivo_url:form.archivo_url,archivo_nombre:form.archivo_nombre||form.titulo.trim()});
    sShowForm(false);sForm({titulo:"",descripcion:"",categoria:"general",archivo_url:"",archivo_nombre:""});
  };

  const grouped:Record<string,any[]>={};
  for(const m of items){const k=m.categoria||"general";if(!grouped[k])grouped[k]=[];grouped[k].push(m);}

  return(<div>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
      <div><div style={{fontSize:16,fontWeight:800,color:colors.nv}}>Materiales</div><div style={{fontSize:11,color:colors.g4}}>Repositorio de brochures, propuestas y documentos</div></div>
      {canUpload&&<Btn v="pu" s="s" onClick={()=>sShowForm(true)}>+ Material</Btn>}
    </div>
    {Object.entries(grouped).map(([cat,rows])=>{const ci=MAT_CATS[cat]||MAT_CATS.general;return(
      <div key={cat} style={{marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:700,color:colors.nv,marginBottom:8}}>{ci.i} {ci.l}</div>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:10}}>
          {rows.map(m=><Card key={m.id} style={{padding:14}}>
            <div style={{fontSize:13,fontWeight:700,color:colors.nv,marginBottom:4}}>{m.titulo}</div>
            {m.descripcion&&<div style={{fontSize:10,color:colors.g4,marginBottom:6}}>{m.descripcion}</div>}
            <div style={{fontSize:9,color:colors.g4,marginBottom:6}}>Subido por {m.subido_por_name} · {m.created_at?.slice(0,10)}</div>
            <div style={{display:"flex",gap:4}}>
              {m.archivo_url&&<a href={m.archivo_url} target="_blank" rel="noopener noreferrer" style={{padding:"4px 10px",borderRadius:6,background:colors.bl,color:"#fff",fontSize:10,fontWeight:600,textDecoration:"none"}}>Descargar</a>}
              {canUpload&&<button onClick={()=>onDel(m.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:12}} title="Eliminar">🗑️</button>}
            </div>
          </Card>)}
        </div>
      </div>
    );})}
    {items.length===0&&<div style={{textAlign:"center",padding:40,color:colors.g4}}>No hay materiales cargados</div>}
    {showForm&&<div style={{position:"fixed" as const,inset:0,background:"rgba(0,0,0,.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>sShowForm(false)}>
      <div style={{background:cardBg,borderRadius:16,padding:20,width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto" as const,boxShadow:"0 8px 32px rgba(0,0,0,.2)"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:14,fontWeight:800,color:colors.nv,marginBottom:14}}>Agregar Material</div>

        {/* Archivo selector from Archivos */}
        <div style={{marginBottom:10}}>
          <label style={lbl}>Archivo (de la sección Archivos) *</label>
          {form.archivo_url
            ?<div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,background:isDark?"rgba(16,185,129,.1)":"#ECFDF5",border:"1px solid #10B981"}}>
              <span style={{fontSize:12,fontWeight:600,color:"#10B981",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>✅ {form.archivo_nombre}</span>
              <button onClick={()=>sForm(p=>({...p,archivo_url:"",archivo_nombre:""}))} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:"#DC2626"}} title="Quitar">✕</button>
            </div>
            :<div>
              <input value={archSearch} onChange={e=>sArchSearch(e.target.value)} placeholder="Buscar en Archivos..." style={{...inp,marginBottom:4}}/>
              <div style={{maxHeight:180,overflowY:"auto" as const,border:"1px solid "+colors.g3,borderRadius:8}}>
                {filteredArch.length===0&&<div style={{padding:12,textAlign:"center",color:colors.g4,fontSize:11}}>No se encontraron archivos{archSearch?" con ese nombre":""}</div>}
                {filteredArch.map((a:any)=>(
                  <div key={a.id} onClick={()=>selectArchivo(a)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderBottom:"1px solid "+colors.g2,cursor:"pointer",fontSize:11,transition:"background .15s"}} onMouseOver={e=>(e.currentTarget.style.background=isDark?"rgba(255,255,255,.05)":"#F7F8FA")} onMouseOut={e=>(e.currentTarget.style.background="transparent")}>
                    <span style={{fontSize:16}}>{/\.(pdf)$/i.test(a.name||"")?"📄":/\.(xlsx?|csv)$/i.test(a.name||"")?"📊":/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(a.name||"")?"🖼️":"📁"}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:600,color:colors.nv,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{a.titulo||a.name}</div>
                      {a.titulo&&a.name&&a.titulo!==a.name&&<div style={{fontSize:9,color:colors.g4}}>{a.name}</div>}
                    </div>
                    <span style={{fontSize:9,color:colors.g4,whiteSpace:"nowrap" as const}}>{a.created_at?.slice(0,10)}</span>
                  </div>
                ))}
              </div>
            </div>
          }
        </div>

        <div style={{marginBottom:8}}><label style={lbl}>Título *</label><input value={form.titulo} onChange={e=>sForm(p=>({...p,titulo:e.target.value}))} style={inp}/></div>
        <div style={{marginBottom:8}}><label style={lbl}>Categoría</label><select value={form.categoria} onChange={e=>sForm(p=>({...p,categoria:e.target.value}))} style={inp}>{Object.entries(MAT_CATS).map(([k,v])=><option key={k} value={k}>{v.i} {v.l}</option>)}</select></div>
        <div style={{marginBottom:12}}><label style={lbl}>Descripción</label><textarea value={form.descripcion} onChange={e=>sForm(p=>({...p,descripcion:e.target.value}))} rows={2} style={{...inp,resize:"vertical" as const}}/></div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <Btn v="g" s="s" onClick={()=>sShowForm(false)}>Cancelar</Btn>
          <Btn v="s" s="s" disabled={!form.archivo_url||!form.titulo.trim()} onClick={handleSave}>Agregar</Btn>
        </div>
      </div>
    </div>}
  </div>);
}

/* ══════════════════════════════════════════════════════════════
   HospitalidadPanel — Invitaciones y asistencia (Brandi)
   ══════════════════════════════════════════════════════════════ */
function HospitalidadPanel({invitaciones,sponsors,contactos,fixtures,colors,isDark,cardBg,mob,canManage,onAdd,onUpd,onDel}:any){
  const items:any[]=invitaciones||[];
  const [showForm,sShowForm]=useState(false);
  const [editId,sEditId]=useState<number|null>(null);
  const [form,sForm]=useState({partido_fecha:"",partido_rival:"",sponsor_id:"",contacto_id:"",entradas:"2",estacionamiento:false,zona_vip:false,fixture_id:"" as string});
  const lbl:any={fontSize:10,fontWeight:600,color:colors.g5,display:"block",marginBottom:2};
  const inp:any={width:"100%",padding:"7px 10px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,background:cardBg,color:colors.nv,boxSizing:"border-box"};

  const getSponName=(id:number|null)=>{if(!id)return"–";const sp=(sponsors||[]).find((s:any)=>s.id===id);return sp?.name||"#"+id;};

  /* KPIs */
  const thisMonth=TODAY.slice(0,7);
  const mesInvs=items.filter(i=>i.created_at?.slice(0,7)===thisMonth);
  const enviadas=mesInvs.length;
  const asistieron=mesInvs.filter(i=>i.asistio===true).length;
  const tasaAsis=enviadas>0?Math.round((asistieron/enviadas)*100):0;
  const entradasMes=mesInvs.reduce((s:number,i:any)=>s+Number(i.entradas||0),0);

  /* Sin contacto >30 días */
  const activeSpon=(sponsors||[]).filter((s:any)=>s.status==="active");
  const sinContacto=activeSpon.filter((sp:any)=>{const last=items.filter(i=>i.sponsor_id===sp.id).sort((a:any,b:any)=>(b.created_at||"").localeCompare(a.created_at||""))[0];if(!last)return true;return daysLeft(last.created_at?.slice(0,10)||"")< -30;});

  /* Próximos partidos de local (todos, no solo primera) */
  const proxPartidos=((fixtures||[]) as any[]).filter((f:any)=>f.date>=TODAY&&f.is_local).sort((a:any,b:any)=>a.date.localeCompare(b.date)).slice(0,20);

  const openAdd=(fixture?:any)=>{sForm({partido_fecha:fixture?.date||"",partido_rival:fixture?.rival||"",sponsor_id:"",contacto_id:"",entradas:"2",estacionamiento:false,zona_vip:false,fixture_id:fixture?.id||""});sEditId(null);sShowForm(true);};
  const handleSave=async()=>{
    if(!form.sponsor_id)return;
    const d={partido_fecha:form.partido_fecha||null,partido_rival:form.partido_rival,sponsor_id:Number(form.sponsor_id),contacto_id:form.contacto_id?Number(form.contacto_id):null,entradas:Number(form.entradas)||0,estacionamiento:form.estacionamiento,zona_vip:form.zona_vip,estado_invitacion:"enviada"};
    if(editId){await onUpd(editId,d);}else{await onAdd(d);}
    sShowForm(false);sEditId(null);
  };

  return(<div>
    {/* KPIs */}
    <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:14}}>
      {[{l:"Invitaciones (mes)",v:enviadas,c:colors.bl,i:"📨"},{l:"Tasa asistencia",v:tasaAsis+"%",c:"#10B981",i:"📊"},{l:"Entradas (mes)",v:entradasMes,c:"#8B5CF6",i:"🎫"},{l:"Sin contacto >30d",v:sinContacto.length,c:sinContacto.length>0?"#DC2626":"#10B981",i:"⚠️"}].map((k,i)=>(
        <Card key={i} style={{flex:"1 1 130px",padding:"10px 14px",textAlign:"center" as const}}>
          <div style={{fontSize:18,fontWeight:800,color:k.c}}>{k.v}</div>
          <div style={{fontSize:10,color:colors.g4,marginTop:2}}>{k.i} {k.l}</div>
        </Card>
      ))}
    </div>

    {/* Sin contacto alert */}
    {sinContacto.length>0&&<Card style={{marginBottom:12,padding:"10px 14px",background:isDark?"rgba(220,38,38,.1)":"#FEF2F2",border:"1px solid #FECACA"}}>
      <div style={{fontSize:12,fontWeight:700,color:"#DC2626",marginBottom:4}}>⚠️ Sponsors sin contacto hace +30 días</div>
      {sinContacto.map((sp:any)=><span key={sp.id} style={{fontSize:10,color:"#DC2626",marginRight:8}}>{sp.name}</span>)}
    </Card>}

    {/* Próximos partidos */}
    {proxPartidos.length>0&&<Card style={{padding:14,marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:700,color:colors.nv,marginBottom:8}}>📅 Próximos partidos de local</div>
      {proxPartidos.slice(0,8).map((f:any)=><div key={f.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:"1px solid "+colors.g2}}>
        <span style={{fontSize:11,color:colors.nv}}>{f.date} vs {f.rival||"TBC"}{f.division?<span style={{fontSize:9,color:colors.g4,marginLeft:6}}>({f.division})</span>:null}</span>
        {canManage&&<Btn v="s" s="s" onClick={()=>openAdd(f)}>Invitar sponsors</Btn>}
      </div>)}
    </Card>}

    {/* Actions */}
    <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
      {canManage&&<Btn v="pu" s="s" onClick={()=>openAdd()}>+ Invitación</Btn>}
    </div>

    {/* Table */}
    <div style={{overflowX:"auto"}}>
    <table style={{width:"100%",borderCollapse:"collapse" as const,fontSize:11}}>
      <thead><tr style={{background:isDark?"rgba(255,255,255,.05)":"#F7F8FA"}}>
        {["Fecha","Rival","Sponsor","Entradas","Estac.","VIP","Estado","Asistió",""].map((h,i)=><th key={i} style={{padding:"6px 8px",textAlign:"left" as const,fontWeight:700,color:colors.g5,fontSize:10,borderBottom:"2px solid "+colors.g2}}>{h}</th>)}
      </tr></thead>
      <tbody>{items.map(inv=>{const hst=HOSP_ST[inv.estado_invitacion]||HOSP_ST.pendiente;return(
        <tr key={inv.id} style={{borderBottom:"1px solid "+colors.g2}}>
          <td style={{padding:"6px 8px",color:colors.g5,fontSize:10}}>{inv.partido_fecha||"–"}</td>
          <td style={{padding:"6px 8px",color:colors.nv}}>{inv.partido_rival||"–"}</td>
          <td style={{padding:"6px 8px",fontWeight:600,color:colors.nv}}>{getSponName(inv.sponsor_id)}</td>
          <td style={{padding:"6px 8px",color:colors.nv}}>{inv.entradas}</td>
          <td style={{padding:"6px 8px"}}>{inv.estacionamiento?"🅿️":"–"}</td>
          <td style={{padding:"6px 8px"}}>{inv.zona_vip?"⭐":"–"}</td>
          <td style={{padding:"6px 8px"}}><span style={{padding:"2px 8px",borderRadius:10,fontSize:9,fontWeight:600,background:hst.bg,color:hst.c}}>{hst.i} {hst.l}</span></td>
          <td style={{padding:"6px 8px"}}>{inv.asistio===true?"✅":inv.asistio===false?"❌":"–"}</td>
          <td style={{padding:"6px 8px"}}>
            {canManage&&<div style={{display:"flex",gap:3}}>
              {inv.asistio===null&&<><Btn v="s" s="s" onClick={()=>onUpd(inv.id,{asistio:true,estado_invitacion:"confirmada"})}>Sí</Btn><Btn v="g" s="s" onClick={()=>onUpd(inv.id,{asistio:false})}>No</Btn></>}
              <button onClick={()=>onDel(inv.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:11}}>🗑️</button>
            </div>}
          </td>
        </tr>);})}</tbody>
    </table>
    {items.length===0&&<div style={{textAlign:"center",padding:40,color:colors.g4}}>No hay invitaciones registradas</div>}
    </div>

    {/* Form */}
    {showForm&&<div style={{position:"fixed" as const,inset:0,background:"rgba(0,0,0,.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>sShowForm(false)}>
      <div style={{background:cardBg,borderRadius:16,padding:20,width:"100%",maxWidth:440,boxShadow:"0 8px 32px rgba(0,0,0,.2)"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:14,fontWeight:800,color:colors.nv,marginBottom:14}}>Nueva Invitación</div>
        <div style={{marginBottom:8}}>
          <label style={lbl}>Partido *</label>
          <select value={form.fixture_id} onChange={e=>{const fid=e.target.value;const fix=proxPartidos.find((f:any)=>String(f.id)===fid);sForm(p=>({...p,fixture_id:fid,partido_fecha:fix?.date||"",partido_rival:fix?.rival||""}));}} style={inp}>
            <option value="">— Seleccionar partido —</option>
            {proxPartidos.map((f:any)=><option key={f.id} value={f.id}>{f.date} vs {f.rival||"TBC"}{f.division?" ("+f.division+")":""}</option>)}
          </select>
          {form.partido_fecha&&<div style={{fontSize:10,color:colors.g4,marginTop:4}}>📅 {form.partido_fecha} vs {form.partido_rival||"TBC"}</div>}
        </div>
        <div style={{marginBottom:8}}><label style={lbl}>Sponsor *</label><select value={form.sponsor_id} onChange={e=>sForm(p=>({...p,sponsor_id:e.target.value}))} style={inp}><option value="">— Seleccionar —</option>{(sponsors||[]).filter((s:any)=>s.status==="active").map((s:any)=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:8}}>
          <div><label style={lbl}>Entradas</label><input type="number" value={form.entradas} onChange={e=>sForm(p=>({...p,entradas:e.target.value}))} style={inp}/></div>
          <div style={{display:"flex",alignItems:"center",gap:4,paddingTop:14}}><input type="checkbox" checked={form.estacionamiento} onChange={e=>sForm(p=>({...p,estacionamiento:e.target.checked}))}/><span style={{fontSize:10,color:colors.g5}}>Estac.</span></div>
          <div style={{display:"flex",alignItems:"center",gap:4,paddingTop:14}}><input type="checkbox" checked={form.zona_vip} onChange={e=>sForm(p=>({...p,zona_vip:e.target.checked}))}/><span style={{fontSize:10,color:colors.g5}}>VIP</span></div>
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <Btn v="g" s="s" onClick={()=>sShowForm(false)}>Cancelar</Btn>
          <Btn v="s" s="s" onClick={handleSave}>Crear</Btn>
        </div>
      </div>
    </div>}
  </div>);
}

export function SponsorsView({user,mob,onAdd,onUpd,onDel,canjeUsado,sponMsgs,onSponMsg,onAddDelivery,sponDeliveries,onUpdDelivery,navTarget,onNavDone,onAddTarifa,onUpdTarifa,onDelTarifa,onAddContract,onUpdContract,onDelContract,onAddPipeline,onUpdPipeline,onDelPipeline,onAddContacto,onUpdContacto,onDelContacto,onAddPropuesta,onUpdPropuesta,onDelPropuesta,onAddPropVoto,onAddPropMsg,onAddHosp,onUpdHosp,onDelHosp,onAddMaterial,onUpdMaterial,onDelMaterial}:any){
  const sponsors = useDataStore(s => s.sponsors);
  const users = useDataStore(s => s.users);
  const tarifario = useDataStore(s => s.tarifario);
  const sponContracts = useDataStore(s => s.sponContracts);
  const sponPipeline = useDataStore(s => s.sponPipeline);
  const sponContactos = useDataStore(s => s.sponContactos);
  const sponPropuestas = useDataStore(s => s.sponPropuestas);
  const sponPropVotos = useDataStore(s => s.sponPropVotos);
  const sponPropMsgs = useDataStore(s => s.sponPropMsgs);
  const hospInvitaciones = useDataStore(s => s.hospInvitaciones);
  const sponMateriales = useDataStore(s => s.sponMateriales);
  const fixtures = useDataStore(s => s.fixtures);
  const{colors,isDark,cardBg}=useC();
  const [topTab,sTopTab]=useState<"dashboard"|"clientes"|"propuestas"|"tarifario"|"materiales"|"hospitalidad">("dashboard");
  const [spTab,sSpTab]=useState<"general"|"contactos"|"canjes"|"hospitalidad"|"docs"|"timeline">("general");
  const [showDelivery,sShowDelivery]=useState(false);
  const [detailId,sDetailId]=useState<number|null>(null);
  const isSA=user?.role==="superadmin";
  useEffect(()=>{if(navTarget&&navTarget.startsWith("sponsors:")){const id=Number(navTarget.split(":")[1]);if(id){sDetailId(id);sSpTab("general");}if(onNavDone)onNavDone();}},[navTarget]);
  const isJH=user&&(user.n||user.first_name||"").toLowerCase().includes("jes")&&(user.a||user.last_name||"").toLowerCase().includes("herrera");
  const canFullEdit=isSA||isJH;
  const isGC=user&&(user.n||user.first_name||"").toLowerCase().includes("gómez")&&(user.a||user.last_name||"").toLowerCase().includes("centurión");
  const isBrandi=user&&(user.n||user.first_name||"").toLowerCase().includes("victoria")&&(user.a||user.last_name||"").toLowerCase().includes("brandi");
  const isSE=isSA||user?.role==="admin";
  const [dolarRef,sDolarRef]=useState(()=>{if(typeof window!=="undefined"){const v=localStorage.getItem("lt_dolar_ref");if(v)return Number(v);}return DOLAR_REF;});
  const [editDolar,sEditDolar]=useState(false);
  const [dolarInput,sDolarInput]=useState(String(dolarRef));
  const saveDolar=()=>{const n=Number(dolarInput);if(n>0){sDolarRef(n);localStorage.setItem("lt_dolar_ref",String(n));}sEditDolar(false);};
  const [search,sSr]=useState("");
  const [fSt,sFSt]=useState("all");
  const [showForm,sShowForm]=useState(false);
  const [editId,sEditId]=useState<string|null>(null);
  const [form,sForm]=useState(emptyForm());
  const [confirmDel,sConfirmDel]=useState<string|null>(null);
  const [importing,sImporting]=useState(false);
  const [importPreview,sImportPreview]=useState<any[]|null>(null);
  const fileRef=useRef<HTMLInputElement>(null);
  const [showCF,setSCF]=useState(false);
  const [cfData,setCFData]=useState({nombre:"",cargo:"",telefono:"",email:"",rol:"comercial",es_principal:false});
  const [editCId,setEditCId]=useState<number|null>(null);

  /* ── Import (Excel + Manual) ── */
  const [importErr,sImportErr]=useState<string|null>(null);
  const [showManual,sShowManual]=useState(false);
  const [manualText,sManualText]=useState("");

  /* Column classification by keywords */
  const classifyCol=(h:string):{field:string;type:"text"|"num"}=>{
    const l=h.toLowerCase().trim();
    if(["sponsor","nombre","name"].some(k=>l===k)||l.length<=2)return{field:"name",type:"text"};
    if(l.includes("aporte")&&(l.includes("pro")||l.includes("ser")||l.includes("canje")))return{field:"amount_service",type:"num"};
    if(l.includes("aporte")||l.includes("cash")||l.includes("efectivo"))return{field:"amount_cash",type:"num"};
    if(l.includes("period")||l.includes("período")||l.includes("venc"))return{field:"end_date",type:"text"};
    if(l.includes("expos")||l.includes("ropa")||l.includes("cartel"))return{field:"exposure",type:"text"};
    if(l.includes("varios")||l.includes("observ")||l.includes("nota"))return{field:"notes",type:"text"};
    if(l.includes("pago")||l.includes("tipo"))return{field:"payment_type",type:"text"};
    return{field:"",type:"text"};
  };

  /* Parse rows (from Excel or manual text) into sponsor objects */
  const parseRows=(headers:string[],dataRows:any[][])=>{
    const cols=headers.map((h,i)=>({i,h,...classifyCol(h)}));
    if(!cols.some(c=>c.field==="name")){
      const firstText=cols.find(c=>{
        const vals=dataRows.map(r=>r[c.i]).filter(v=>typeof v==="string"&&v.trim().length>1);
        return vals.length>=dataRows.length*0.3;
      });
      if(firstText)firstText.field="name";
      else if(cols.length>0)cols[0].field="name";
    }
    const num=(v:any)=>{if(!v&&v!==0)return 0;const n=Number(String(v).replace(/[$.,%\s]/g,""));return isNaN(n)?0:n;};
    return dataRows.map((r:any[])=>{
      const sp:any={name:"",amount_cash:0,amount_service:0,end_date:null,exposure:"",notes:"",payment_type:"",status:"active"};
      const extras:string[]=[];
      cols.forEach(c=>{
        const val=r[c.i];
        if(val===undefined||val===null||String(val).trim()==="")return;
        if(c.field==="name")sp.name=String(val).trim();
        else if(c.field==="amount_cash")sp.amount_cash=num(val);
        else if(c.field==="amount_service")sp.amount_service=num(val);
        else if(c.field==="end_date")sp.end_date=String(val).trim()||null;
        else if(c.field==="exposure")sp.exposure=String(val).trim();
        else if(c.field==="notes")sp.notes=String(val).trim();
        else if(c.field==="payment_type")sp.payment_type=String(val).trim();
        else if(String(val).trim())extras.push(String(val).trim());
      });
      if(extras.length&&!sp.notes)sp.notes=extras.join("; ");
      else if(extras.length)sp.notes=sp.notes+"; "+extras.join("; ");
      return sp;
    }).filter((s:any)=>s.name&&s.name.length>1);
  };

  /* Excel file handler */
  const handleFile=async(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0];
    if(!file)return;
    sImportErr(null);
    try{
      const XLSX=await loadXLSX();
      const data=new Uint8Array(await file.arrayBuffer());
      const wb=XLSX.read(data);
      const ws=wb.Sheets[wb.SheetNames[0]];
      const raw:any[][]=XLSX.utils.sheet_to_json(ws,{header:1,defval:"",blankrows:false});
      if(!raw.length){sImportErr("El archivo no tiene datos");return;}
      const HKWS=["aporte","sponsor","nombre","exposic","periodo","período","varios","observ","pago","canjes","servicio"];
      let hIdx=-1;
      for(let i=0;i<Math.min(raw.length,15);i++){
        const cells=(raw[i]||[]).map((c:any)=>String(c||"").toLowerCase().trim());
        if(cells.filter(c=>HKWS.some(kw=>c.includes(kw))).length>=2){hIdx=i;break;}
      }
      if(hIdx<0){
        for(let i=0;i<Math.min(raw.length,15);i++){
          const filled=(raw[i]||[]).filter((c:any)=>String(c||"").trim()!=="");
          if(filled.length>=3){hIdx=i;break;}
        }
      }
      if(hIdx<0)hIdx=0;
      const headers=(raw[hIdx]||[]).map((h:any)=>String(h||"").trim());
      const dataRows=raw.slice(hIdx+1).filter((r:any[])=>r.some((c:any)=>String(c||"").trim()!==""));
      if(!dataRows.length){sImportErr("Sin filas de datos. Headers: "+headers.join(" | "));return;}
      const mapped=parseRows(headers,dataRows);
      if(!mapped.length){sImportErr("Sin sponsors válidos. Headers: "+headers.join(" | "));return;}
      sImportPreview(mapped);
    }catch(err:any){
      sImportErr("Error: "+(err.message||"formato no reconocido"));
    }
    if(fileRef.current)fileRef.current.value="";
  };

  /* Manual text paste handler */
  const handleManualPaste=()=>{
    if(!manualText.trim())return;
    sImportErr(null);
    const lines=manualText.trim().split("\n").map(l=>l.split("\t").length>1?l.split("\t"):l.split(";").length>1?l.split(";"):l.split(","));
    if(lines.length<2){sImportErr("Mínimo 2 filas (encabezados + datos)");return;}
    const headers=lines[0].map(h=>h.trim());
    const dataRows=lines.slice(1).filter(r=>r.some(c=>c.trim()!==""));
    const mapped=parseRows(headers,dataRows);
    if(!mapped.length){sImportErr("Sin sponsors válidos. Headers: "+headers.join(" | "));return;}
    sImportPreview(mapped);sShowManual(false);sManualText("");
  };

  const confirmImport=async()=>{
    if(!importPreview?.length)return;
    sImporting(true);sImportErr(null);
    let ok=0,fail=0;
    for(const sp of importPreview){
      try{
        const total=(sp.amount_cash||0)+(sp.amount_service||0);
        await onAdd({...sp,amount:total});
        ok++;
      }catch{fail++;}
    }
    sImporting(false);sImportPreview(null);
    if(fail>0)sImportErr(`Importados: ${ok}, Errores: ${fail}`);
  };

  /* ── Derived data ── */
  const all:any[]=sponsors||[];
  const active=useMemo(()=>all.filter((s:any)=>s.status==="active"),[all]);
  const totalCash=useMemo(()=>active.reduce((s:number,sp:any)=>s+Number(sp.amount_cash||0),0),[active]);
  const totalService=useMemo(()=>active.reduce((s:number,sp:any)=>s+Number(sp.amount_service||0),0),[active]);
  const totalAll=totalCash+totalService;
  const expiring=useMemo(()=>all.filter((s:any)=>{const dl=daysLeft(s.end_date);return dl>=0&&dl<=30&&s.status==="active";}),[all]);

  /* Filter */
  const vis=useMemo(()=>{
    let v=[...all];
    if(fSt!=="all")v=v.filter((s:any)=>s.status===fSt);
    if(search){const q=search.toLowerCase();v=v.filter((s:any)=>((s.name||"")+(s.exposure||"")+(s.notes||"")+(s.payment_type||"")).toLowerCase().includes(q));}
    v.sort((a:any,b:any)=>{const ta=(Number(a.amount_cash||0)+Number(a.amount_service||0));const tb=(Number(b.amount_cash||0)+Number(b.amount_service||0));return tb-ta;});
    return v;
  },[all,fSt,search]);

  /* ── Form helpers ── */
  const openAdd=()=>{sForm(emptyForm());sEditId(null);sShowForm(true);};
  const openEdit=(sp:any)=>{
    sForm({
      name:sp.name||"",
      amount_cash:String(sp.amount_cash||""),
      amount_service:String(sp.amount_service||""),
      end_date:sp.end_date||"",
      exposure:sp.exposure||"",
      notes:sp.notes||"",
      status:sp.status||"active",
      payment_type:sp.payment_type||"",
      responsable:sp.responsable||"Jesús Herrera",
      canje_instrucciones:sp.canje_instrucciones||"",
    });
    sEditId(sp.id);sShowForm(true);
  };
  const closeForm=()=>{sShowForm(false);sEditId(null);sForm(emptyForm());};
  const saveForm=async()=>{
    const cash=Number(form.amount_cash)||0;
    const service=Number(form.amount_service)||0;
    const payload:any={
      name:form.name,
      amount_cash:cash,
      amount_service:service,
      amount:cash+service,
      end_date:form.end_date||null,
      exposure:form.exposure,
      notes:form.notes,
      status:form.status,
      payment_type:form.payment_type,
      responsable:form.responsable,
      canje_instrucciones:form.canje_instrucciones,
    };
    try{
      if(editId){await onUpd(editId,payload);}else{await onAdd(payload);}
      closeForm();
    }catch(e:any){sImportErr(e.message||"Error al guardar sponsor");}
  };

  /* ── Inline edit helpers ── */
  const inlineUpd=(sp:any,field:string,val:any)=>{
    const upd:any={[field]:val};
    if(field==="amount_cash"){
      upd.amount=Number(val||0)+Number(sp.amount_service||0);
    }else if(field==="amount_service"){
      upd.amount=Number(sp.amount_cash||0)+Number(val||0);
    }
    onUpd(sp.id,upd);
  };

  /* ── Donut chart helper (cash vs service) ── */
  const DonutChart=({cash,service,size}:{cash:number;service:number;size:number})=>{
    const total=cash+service;
    if(total===0)return <div style={{width:size,height:size,borderRadius:"50%",background:colors.g2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:size/5,color:colors.g4}}>$0</span></div>;
    const cashPct=Math.round((cash/total)*100);
    const r=(size/2)-4;
    const ci=2*Math.PI*r;
    return(
      <div style={{position:"relative",width:size,height:size}}>
        <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#3B82F6" strokeWidth={size/8} />
          {cashPct>0&&<circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#10B981" strokeWidth={size/8} strokeDasharray={ci} strokeDashoffset={ci-(cashPct/100)*ci} strokeLinecap="butt" />}
        </svg>
        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column" as const,alignItems:"center",justifyContent:"center"}}>
          <span style={{fontSize:size/7,fontWeight:800,color:colors.nv}}>{cashPct}%</span>
        </div>
      </div>
    );
  };

  /* ── Monthly payment indicator ── */
  const isMensual=(pt:string)=>(pt||"").toLowerCase().includes("mensual");

  /* ── Styles ── */
  const lbl:React.CSSProperties={fontSize:10,fontWeight:600,color:colors.g5,marginBottom:2,display:"block"};
  const inp:React.CSSProperties={width:"100%",padding:mob?10:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:mob?14:12,boxSizing:"border-box" as const,marginTop:2,background:cardBg,color:colors.nv,minHeight:mob?44:undefined};

  /* ══════════════════════════════════════════════════════════════
     DETAIL VIEW — when a sponsor is selected
     ══════════════════════════════════════════════════════════════ */
  const detailSp=detailId!=null?all.find((s:any)=>s.id===detailId):null;
  if(detailSp){
    const sp=detailSp;
    const st=SPON_ST[sp.status]||SPON_ST.inactive;
    const dl=daysLeft(sp.end_date);
    const isExp=dl>=0&&dl<=30&&sp.status==="active";
    const cash=Number(sp.amount_cash||0);
    const service=Number(sp.amount_service||0);
    const total=cash+service;
    const monthly=isMensual(sp.payment_type);
    const usado=(canjeUsado||{})[sp.id]||0;
    const disp=service-usado;
    const pct=service>0?Math.min(100,Math.round(usado/service*100)):0;
    const barC=pct>80?"#DC2626":pct>50?"#F59E0B":"#10B981";

    return(<div style={{maxWidth:700}}>
      {/* Back button */}
      <button onClick={()=>{sDetailId(null);sSpTab("general");sConfirmDel(null);}} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:6,padding:"8px 0",marginBottom:8,color:colors.pr,fontSize:13,fontWeight:700}}>
        <span style={{fontSize:18}}>&#8592;</span> Volver a Clientes
      </button>

      {/* Header card */}
      <Card style={{padding:mob?14:18,borderLeft:"5px solid "+st.c,marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:10}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap" as const,marginBottom:6}}>
              <span style={{background:st.bg,color:st.c,padding:"3px 10px",borderRadius:12,fontSize:11,fontWeight:600}}>{st.l}</span>
              {monthly&&<span style={{background:isDark?"rgba(59,130,246,.15)":"#DBEAFE",color:"#3B82F6",padding:"3px 8px",borderRadius:8,fontSize:10,fontWeight:700}}>Mensual</span>}
              {sp.payment_type&&!monthly&&<span style={{background:isDark?"rgba(139,92,246,.15)":"#EDE9FE",color:colors.pr,padding:"3px 8px",borderRadius:8,fontSize:10,fontWeight:600}}>{sp.payment_type}</span>}
            </div>
            <h2 style={{margin:"0 0 8px",fontSize:mob?20:24,fontWeight:800,color:colors.nv}}>{sp.name}</h2>
            {/* Responsable */}
            <div style={{fontSize:12,color:colors.g5,marginBottom:4}}>
              <span style={{fontWeight:700,color:colors.nv}}>Responsable:</span> {sp.responsable||"Jesús Herrera"}
            </div>
          </div>
          <DonutChart cash={cash} service={service} size={mob?60:72}/>
        </div>

        {/* Amounts row */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
          <div style={{padding:"8px 10px",background:isDark?"rgba(16,185,129,.08)":"#ECFDF5",borderRadius:8,textAlign:"center" as const}}>
            <div style={{fontSize:9,color:"#10B981",fontWeight:600}}>Aporte $</div>
            <div style={{fontSize:16,fontWeight:800,color:"#10B981"}}>{fmtARS(cash)}</div>
          </div>
          <div style={{padding:"8px 10px",background:isDark?"rgba(59,130,246,.08)":"#EFF6FF",borderRadius:8,textAlign:"center" as const}}>
            <div style={{fontSize:9,color:"#3B82F6",fontWeight:600}}>Canjes</div>
            <div style={{fontSize:16,fontWeight:800,color:"#3B82F6"}}>{fmtARS(service)}</div>
          </div>
          <div style={{padding:"8px 10px",background:isDark?"rgba(255,255,255,.05)":colors.g1,borderRadius:8,textAlign:"center" as const}}>
            <div style={{fontSize:9,color:colors.g5,fontWeight:600}}>Total</div>
            <div style={{fontSize:16,fontWeight:800,color:colors.nv}}>{fmtARS(total)}</div>
          </div>
        </div>

        {/* Canje progress bar */}
        {service>0&&<div style={{padding:"8px 10px",background:isDark?"rgba(59,130,246,.08)":"#F0F7FF",borderRadius:8,marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
            <span style={{fontSize:10,fontWeight:700,color:"#3B82F6"}}>Canjes</span>
            <span style={{fontSize:10,fontWeight:700,color:barC}}>{pct}% usado</span>
          </div>
          <div style={{height:8,background:isDark?"#334155":"#E2E8F0",borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:pct+"%",background:barC,borderRadius:4,transition:"width .3s"}}/></div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
            <span style={{fontSize:9,color:colors.g5}}>Usado: {fmtARS(usado)}</span>
            <span style={{fontSize:9,fontWeight:700,color:disp>0?"#059669":"#DC2626"}}>Disponible: {fmtARS(disp)}</span>
          </div>
          {usado===0&&<div style={{marginTop:4,fontSize:9,fontWeight:700,color:"#F59E0B",background:"#FEF3C7",padding:"2px 8px",borderRadius:4,display:"inline-block"}}>Sin usar</div>}
        </div>}

        {/* Instrucciones para el canje */}
        {(sp.canje_instrucciones||service>0)&&<div style={{padding:"8px 10px",background:isDark?"rgba(59,130,246,.05)":"#F8FAFF",borderRadius:8,marginBottom:10,border:"1px solid "+(isDark?"rgba(59,130,246,.15)":"#DBEAFE")}}>
          <div style={{fontSize:10,fontWeight:700,color:"#3B82F6",marginBottom:3}}>Instrucciones para el canje</div>
          <div style={{fontSize:12,color:colors.nv,lineHeight:1.5,whiteSpace:"pre-wrap" as const}}>{sp.canje_instrucciones?renderMentions(sp.canje_instrucciones):<span style={{color:colors.g4,fontStyle:"italic"}}>Sin instrucciones cargadas</span>}</div>
        </div>}

        {/* Info rows */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:11}}>
          {sp.end_date&&<div>
            <span style={{color:colors.g5}}>Vencimiento: </span>
            <span style={{fontWeight:600,color:colors.nv}}>{fmtD(sp.end_date)}</span>
            {sp.status==="active"&&(
              dl<0?<span style={{marginLeft:6,fontSize:10,fontWeight:700,color:"#DC2626",background:"#FEE2E2",padding:"1px 6px",borderRadius:6}}>Vencido {Math.abs(dl)}d</span>
              :isExp?<span style={{marginLeft:6,fontSize:10,fontWeight:700,color:"#D97706",background:"#FEF3C7",padding:"1px 6px",borderRadius:6}}>Vence en {dl}d</span>
              :<span style={{marginLeft:6,fontSize:10,color:colors.g4}}>{dl}d restantes</span>
            )}
          </div>}
          {sp.exposure&&<div><span style={{color:colors.g5}}>Exposición: </span><span style={{fontWeight:600,color:colors.pr}}>{sp.exposure}</span></div>}
        </div>
        {sp.notes&&<div style={{marginTop:8,fontSize:11,color:colors.g5,lineHeight:1.5,whiteSpace:"pre-wrap" as const}}><span style={{fontWeight:600,color:colors.nv}}>Notas: </span>{renderMentions(sp.notes)}</div>}
      </Card>

      {/* ── Tabs: General / Contactos / Canjes / Hospitalidad / Docs / Timeline ── */}
      <Card style={{padding:0,overflow:"hidden"}}>
        <div style={{display:"flex",borderBottom:"1px solid "+colors.g2,overflowX:"auto"}}>
          {([["general","General"],["contactos","Contactos"],["canjes","Canjes"],["hospitalidad","Hospitalidad"],["docs","Mensajes"],["timeline","Timeline"]] as const).map(([k,l])=><button key={k} onClick={()=>sSpTab(k)} style={{flex:"0 0 auto",padding:"10px 12px",border:"none",borderBottom:spTab===k?"3px solid "+colors.pr:"3px solid transparent",background:"transparent",color:spTab===k?colors.pr:colors.g4,fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>{k==="general"?"🏢 ":k==="contactos"?"👥 ":k==="canjes"?"📦 ":k==="hospitalidad"?"🤝 ":k==="docs"?"💬 ":"📋 "}{l}</button>)}
        </div>

        {/* General tab — CRM ficha + inline edit */}
        {spTab==="general"&&<div style={{padding:mob?"12px":"16px"}}>
          {/* CRM fields */}
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8,marginBottom:12}}>
            <div><label style={lbl}>Razón Social</label><input value={sp.razon_social||""} onChange={e=>inlineUpd(sp,"razon_social",e.target.value)} style={inp} placeholder="Razón social"/></div>
            <div><label style={lbl}>CUIT</label><input value={sp.cuit||""} onChange={e=>inlineUpd(sp,"cuit",e.target.value)} style={inp} placeholder="30-12345678-9"/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8,marginBottom:12}}>
            <div><label style={lbl}>Rubro</label><input value={sp.rubro||""} onChange={e=>inlineUpd(sp,"rubro",e.target.value)} style={inp} placeholder="Ej: Salud, Construcción"/></div>
            <div><label style={lbl}>Dirección</label><input value={sp.direccion||""} onChange={e=>inlineUpd(sp,"direccion",e.target.value)} style={inp} placeholder="Dirección"/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8,marginBottom:12}}>
            <div><label style={lbl}>Web</label><input value={sp.web||""} onChange={e=>inlineUpd(sp,"web",e.target.value)} style={inp} placeholder="https://..."/></div>
            <div><label style={lbl}>Logo URL</label><input value={sp.logo_url||""} onChange={e=>inlineUpd(sp,"logo_url",e.target.value)} style={inp} placeholder="https://..."/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8,marginBottom:12}}>
            <div><label style={lbl}>Nivel</label>
              <select value={sp.nivel||"white"} onChange={e=>inlineUpd(sp,"nivel",e.target.value)} style={inp}>
                {Object.entries(SPON_TIER).map(([k,v])=><option key={k} value={k}>{v.i} {v.l}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Eje Estratégico</label>
              <select value={sp.eje_estrategico||""} onChange={e=>inlineUpd(sp,"eje_estrategico",e.target.value)} style={inp}>
                <option value="">— Sin asignar —</option>
                {Object.entries(SPON_EJES).map(([k,v]:any)=><option key={k} value={k}>{v.i} {v.l}</option>)}
              </select>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8,marginBottom:12}}>
            <div><label style={lbl}>Responsable</label><input value={sp.responsable==null?"Jesús Herrera":sp.responsable} onChange={e=>inlineUpd(sp,"responsable",e.target.value)} style={inp} placeholder="Jesús Herrera"/></div>
            <div><label style={lbl}>Estado</label>
              <select value={sp.status||"active"} onChange={e=>inlineUpd(sp,"status",e.target.value)} style={inp}>
                {Object.keys(SPON_ST).map(k=><option key={k} value={k}>{SPON_ST[k].l}</option>)}
              </select>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8,marginBottom:12}}>
            <div><label style={lbl}>Aporte $ (Efectivo)</label><input type="number" value={sp.amount_cash||""} onChange={e=>inlineUpd(sp,"amount_cash",Number(e.target.value)||0)} style={inp}/></div>
            <div><label style={lbl}>Aporte Pro/Ser (Canjes)</label><input type="number" value={sp.amount_service||""} onChange={e=>inlineUpd(sp,"amount_service",Number(e.target.value)||0)} style={inp}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8,marginBottom:12}}>
            <div><label style={lbl}>Período / Vencimiento</label><input type="date" value={sp.end_date||""} onChange={e=>inlineUpd(sp,"end_date",e.target.value)} style={inp}/></div>
            <div><label style={lbl}>Tipo de Pago</label><input value={sp.payment_type||""} onChange={e=>inlineUpd(sp,"payment_type",e.target.value)} style={inp} placeholder="Ej: pago mensual, canje, cheques"/></div>
          </div>
          <div style={{marginBottom:8}}><label style={lbl}>Exposición</label><input value={sp.exposure||""} onChange={e=>inlineUpd(sp,"exposure",e.target.value)} style={inp} placeholder="Ej: Ropa: frente camiseta. Cartelería"/></div>
          <div style={{marginBottom:8}}><label style={lbl}>Detalle Canje</label><input value={sp.detalle_canje||""} onChange={e=>inlineUpd(sp,"detalle_canje",e.target.value)} style={inp} placeholder="Qué incluye el canje"/></div>
          <div style={{marginBottom:8}}><label style={lbl}>Instrucciones para el Canje</label><MentionInput users={users} value={sp.canje_instrucciones||""} onChange={v=>inlineUpd(sp,"canje_instrucciones",v)} rows={3} style={{...inp,resize:"vertical" as const}} placeholder="Ej: Contactar a Juan (tel 351-xxx)..."/></div>
          <div style={{marginBottom:12}}><label style={lbl}>Varios / Observaciones</label><MentionInput users={users} value={sp.notes||""} onChange={v=>inlineUpd(sp,"notes",v)} rows={2} style={{...inp,resize:"vertical" as const}}/></div>
          <div style={{display:"flex",gap:6,justifyContent:"space-between"}}>
            {confirmDel===sp.id
              ?<div style={{display:"flex",gap:4,alignItems:"center"}}><span style={{fontSize:11,color:"#DC2626",fontWeight:600}}>Confirmar?</span><Btn v="r" s="s" onClick={()=>{onDel(sp.id);sConfirmDel(null);sDetailId(null);}}>Sí, eliminar</Btn><Btn v="g" s="s" onClick={()=>sConfirmDel(null)}>No</Btn></div>
              :<Btn v="r" s="s" onClick={()=>sConfirmDel(sp.id)}>Eliminar</Btn>}
          </div>
        </div>}

        {/* Contactos tab — CRUD for sponsor_contactos */}
        {spTab==="contactos"&&<div style={{padding:mob?"10px 12px":"12px 16px",minHeight:200}}>
          {(()=>{
            const spContacts=(sponContactos||[]).filter((c:any)=>c.sponsor_id===sp.id);
            const saveCont=async()=>{
              if(!cfData.nombre.trim())return;
              const d={sponsor_id:sp.id,nombre:cfData.nombre.trim(),cargo:cfData.cargo.trim(),telefono:cfData.telefono.trim(),email:cfData.email.trim(),rol:cfData.rol,es_principal:cfData.es_principal};
              if(editCId){await onUpdContacto(editCId,d);}else{await onAddContacto(d);}
              setSCF(false);setEditCId(null);setCFData({nombre:"",cargo:"",telefono:"",email:"",rol:"comercial",es_principal:false});
            };
            const editCont=(c:any)=>{setCFData({nombre:c.nombre||"",cargo:c.cargo||"",telefono:c.telefono||"",email:c.email||"",rol:c.rol||"comercial",es_principal:!!c.es_principal});setEditCId(c.id);setSCF(true);};
            const rolInfo=(r:string)=>(CONTACT_ROLES as any)[r]||{l:r,c:"#6B7280",bg:"#F3F4F6"};
            return(<>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{fontSize:13,fontWeight:700,color:colors.nv}}>Contactos ({spContacts.length})</div>
                {canFullEdit&&<Btn v="pu" s="s" onClick={()=>{setCFData({nombre:"",cargo:"",telefono:"",email:"",rol:"comercial",es_principal:false});setEditCId(null);setSCF(true);}}>+ Contacto</Btn>}
              </div>
              {spContacts.map((c:any)=>{const ri=rolInfo(c.rol);return(
                <Card key={c.id} style={{padding:"10px 14px",marginBottom:8,borderLeft:c.es_principal?"4px solid #F59E0B":"4px solid "+colors.g2}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:colors.nv}}>{c.nombre} {c.es_principal&&<span style={{fontSize:9,color:"#F59E0B",fontWeight:700}}>★ Principal</span>}</div>
                      <div style={{fontSize:11,color:colors.g5}}>{c.cargo}</div>
                      <div style={{fontSize:10,color:colors.g4,marginTop:2}}>
                        {c.telefono&&<span style={{marginRight:8}}>📞 {c.telefono}</span>}
                        {c.email&&<span>✉️ {c.email}</span>}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:4,alignItems:"center"}}>
                      <span style={{padding:"2px 8px",borderRadius:10,fontSize:9,fontWeight:600,background:ri.bg,color:ri.c}}>{ri.l}</span>
                      {canFullEdit&&<button onClick={()=>editCont(c)} style={{background:"none",border:"none",cursor:"pointer",fontSize:12}}>✏️</button>}
                      {canFullEdit&&<button onClick={()=>onDelContacto(c.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:12}}>🗑️</button>}
                    </div>
                  </div>
                </Card>
              );})}
              {spContacts.length===0&&<div style={{textAlign:"center",padding:30,color:colors.g4,fontSize:12}}>Sin contactos registrados</div>}
              {showCF&&<div style={{position:"fixed" as const,inset:0,background:"rgba(0,0,0,.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setSCF(false)}>
                <div style={{background:cardBg,borderRadius:16,padding:20,width:"100%",maxWidth:440,boxShadow:"0 8px 32px rgba(0,0,0,.2)"}} onClick={e=>e.stopPropagation()}>
                  <div style={{fontSize:14,fontWeight:800,color:colors.nv,marginBottom:14}}>{editCId?"Editar Contacto":"Nuevo Contacto"}</div>
                  <div style={{marginBottom:8}}><label style={lbl}>Nombre *</label><input value={cfData.nombre} onChange={e=>setCFData(p=>({...p,nombre:e.target.value}))} style={inp}/></div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                    <div><label style={lbl}>Cargo</label><input value={cfData.cargo} onChange={e=>setCFData(p=>({...p,cargo:e.target.value}))} style={inp}/></div>
                    <div><label style={lbl}>Rol</label><select value={cfData.rol} onChange={e=>setCFData(p=>({...p,rol:e.target.value}))} style={inp}>{Object.entries(CONTACT_ROLES).map(([k,v]:any)=><option key={k} value={k}>{v.l}</option>)}</select></div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                    <div><label style={lbl}>Teléfono</label><input value={cfData.telefono} onChange={e=>setCFData(p=>({...p,telefono:e.target.value}))} style={inp}/></div>
                    <div><label style={lbl}>Email</label><input type="email" value={cfData.email} onChange={e=>setCFData(p=>({...p,email:e.target.value}))} style={inp}/></div>
                  </div>
                  <div style={{marginBottom:12,display:"flex",alignItems:"center",gap:6}}><input type="checkbox" checked={cfData.es_principal} onChange={e=>setCFData(p=>({...p,es_principal:e.target.checked}))}/><span style={{fontSize:11,color:colors.g5}}>Contacto principal</span></div>
                  <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                    <Btn v="g" s="s" onClick={()=>setSCF(false)}>Cancelar</Btn>
                    <Btn v="s" s="s" onClick={saveCont}>Guardar</Btn>
                  </div>
                </div>
              </div>}
            </>);
          })()}
        </div>}

        {/* Canjes tab — entregas/deliveries */}
        {spTab==="canjes"&&<div style={{padding:mob?"10px 12px":"12px 16px",minHeight:320}}>
          {(()=>{
            const dels=(sponDeliveries||[]).filter((d:any)=>d.sponsor_id===sp.id);
            const totalEntregado=dels.reduce((s:number,d:any)=>s+Number(d.total_value||0),0);
            const destBadge=(d:string)=>{
              if(d==="division")return{bg:isDark?"rgba(59,130,246,.15)":"#DBEAFE",c:"#3B82F6",l:"División"};
              if(d==="consumo")return{bg:isDark?"rgba(139,92,246,.15)":"#EDE9FE",c:"#8B5CF6",l:"Consumo"};
              return{bg:isDark?"rgba(16,185,129,.15)":"#D1FAE5",c:"#10B981",l:"Venta"};
            };
            return(<>
              <div style={{display:"flex",gap:10,marginBottom:12,flexWrap:"wrap" as const}}>
                <div style={{flex:1,minWidth:120,padding:"10px 12px",background:isDark?"rgba(16,185,129,.08)":"#ECFDF5",borderRadius:8,textAlign:"center" as const}}>
                  <div style={{fontSize:9,color:"#10B981",fontWeight:600}}>Total Entregado</div>
                  <div style={{fontSize:18,fontWeight:800,color:"#10B981"}}>{fmtARS(totalEntregado)}</div>
                </div>
                <div style={{flex:1,minWidth:120,padding:"10px 12px",background:isDark?"rgba(59,130,246,.08)":"#EFF6FF",borderRadius:8,textAlign:"center" as const}}>
                  <div style={{fontSize:9,color:"#3B82F6",fontWeight:600}}>Entregas</div>
                  <div style={{fontSize:18,fontWeight:800,color:"#3B82F6"}}>{dels.length}</div>
                </div>
              </div>
              <Btn v="s" s="s" onClick={()=>sShowDelivery(true)} style={{marginBottom:12,width:"100%"}}>+ Nueva Entrega</Btn>
              {dels.length===0&&<div style={{textAlign:"center" as const,padding:24,color:colors.g4,fontSize:12}}>Sin entregas registradas</div>}
              {dels.map((d:any)=>{
                const b=destBadge(d.destination);
                return(<Card key={d.id} style={{marginBottom:10,padding:"12px 14px",borderLeft:"4px solid "+b.c}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:6}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:700,color:colors.nv}}>{d.description}</div>
                      <div style={{fontSize:11,color:colors.g5,marginTop:2}}>{d.quantity} × {fmtARS(Number(d.unit_value||0))} = <span style={{fontWeight:700,color:colors.nv}}>{fmtARS(Number(d.total_value||0))}</span></div>
                    </div>
                    <span style={{background:b.bg,color:b.c,padding:"2px 8px",borderRadius:12,fontSize:10,fontWeight:600,whiteSpace:"nowrap" as const}}>{b.l}{d.destination==="division"&&d.division?": "+d.division:""}</span>
                  </div>
                  {d.destination==="consumo"&&d.person_name&&<div style={{fontSize:11,color:"#8B5CF6",marginBottom:4}}>Uso: {d.person_name}</div>}
                  {d.destination==="venta"&&<div style={{padding:"8px 10px",background:isDark?"rgba(16,185,129,.06)":"#F0FDF4",borderRadius:8,marginBottom:6}}>
                    <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap" as const}}>
                      <div style={{flex:1,minWidth:80}}><label style={{fontSize:9,fontWeight:600,color:"#10B981",display:"block"}}>Vendidos</label><input type="number" value={d.qty_sold||0} min={0} max={d.quantity||999} onChange={e=>{const v=Math.min(Number(e.target.value)||0,d.quantity||999);onUpdDelivery&&onUpdDelivery(d.id,{qty_sold:v});}} style={{width:70,padding:"4px 6px",borderRadius:6,border:"1px solid "+colors.g3,fontSize:12,background:cardBg,color:colors.nv}}/><span style={{fontSize:10,color:colors.g5,marginLeft:4}}>/ {d.quantity}</span></div>
                      <div style={{flex:1,minWidth:80}}><label style={{fontSize:9,fontWeight:600,color:"#10B981",display:"block"}}>Recaudado $</label><input type="number" value={d.revenue||0} onChange={e=>{const v=Number(e.target.value)||0;onUpdDelivery&&onUpdDelivery(d.id,{revenue:v});}} style={{width:100,padding:"4px 6px",borderRadius:6,border:"1px solid "+colors.g3,fontSize:12,background:cardBg,color:colors.nv}}/></div>
                    </div>
                    {(d.qty_sold||0)>0&&<div style={{marginTop:4,fontSize:10,color:"#10B981",fontWeight:600}}>{Math.round(((d.qty_sold||0)/(d.quantity||1))*100)}% vendido — {fmtARS(Number(d.revenue||0))} recaudado</div>}
                  </div>}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:10,color:colors.g5,marginTop:4}}><span>{fmtD(d.received_date||d.created_at)}</span><span>Recibió: {d.received_by_name||"—"}</span></div>
                  {d.notes&&<div style={{fontSize:10,color:colors.g4,marginTop:4,fontStyle:"italic"}}>{d.notes}</div>}
                </Card>);
              })}
              {showDelivery&&<SponDelivery sponsor={sp} user={user} mob={mob} onSave={onAddDelivery} onClose={()=>sShowDelivery(false)}/>}
            </>);
          })()}
        </div>}

        {/* Hospitalidad tab — invitaciones de este sponsor */}
        {spTab==="hospitalidad"&&<div style={{padding:mob?"10px 12px":"12px 16px",minHeight:200}}>
          {(()=>{
            const spInvs=(hospInvitaciones||[]).filter((i:any)=>i.sponsor_id===sp.id);
            const asist=spInvs.filter((i:any)=>i.asistio===true).length;
            const tasa=spInvs.length>0?Math.round((asist/spInvs.length)*100):0;
            return(<>
              <div style={{display:"flex",gap:10,marginBottom:12,flexWrap:"wrap"}}>
                <div style={{flex:1,minWidth:100,padding:"8px 10px",background:isDark?"rgba(59,130,246,.08)":"#EFF6FF",borderRadius:8,textAlign:"center" as const}}>
                  <div style={{fontSize:16,fontWeight:800,color:"#3B82F6"}}>{spInvs.length}</div>
                  <div style={{fontSize:9,color:colors.g4}}>Invitaciones</div>
                </div>
                <div style={{flex:1,minWidth:100,padding:"8px 10px",background:isDark?"rgba(16,185,129,.08)":"#ECFDF5",borderRadius:8,textAlign:"center" as const}}>
                  <div style={{fontSize:16,fontWeight:800,color:"#10B981"}}>{tasa}%</div>
                  <div style={{fontSize:9,color:colors.g4}}>Asistencia</div>
                </div>
              </div>
              {spInvs.map((inv:any)=>{const hst=HOSP_ST[inv.estado_invitacion]||HOSP_ST.pendiente;return(
                <div key={inv.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid "+colors.g2,fontSize:11}}>
                  <div><span style={{color:colors.nv,fontWeight:600}}>{inv.partido_fecha||"–"}</span> vs {inv.partido_rival||"TBC"} — {inv.entradas} entradas</div>
                  <div style={{display:"flex",gap:4,alignItems:"center"}}>
                    <span style={{padding:"2px 6px",borderRadius:8,fontSize:9,fontWeight:600,background:hst.bg,color:hst.c}}>{hst.i} {hst.l}</span>
                    {inv.asistio===true?"✅":inv.asistio===false?"❌":""}
                  </div>
                </div>
              );})}
              {spInvs.length===0&&<div style={{textAlign:"center",padding:30,color:colors.g4,fontSize:12}}>Sin invitaciones para este sponsor</div>}
            </>);
          })()}
        </div>}

        {/* Docs/Chat tab */}
        {spTab==="docs"&&<div style={{padding:mob?"10px 12px":"12px 16px",minHeight:320}}>
          <Thread
            log={(sponMsgs||[]).filter((m:any)=>m.sponsor_id===sp.id).map((m:any)=>({dt:m.created_at||"",uid:m.user_id,by:m.user_name,act:m.content,t:m.type||"msg"}))}
            userId={user?.id}
            onSend={(txt:string)=>onSponMsg&&onSponMsg(sp.id,txt)}
            users={users}
          />
        </div>}

        {/* Timeline tab — combined activity */}
        {spTab==="timeline"&&<div style={{padding:mob?"10px 12px":"12px 16px",minHeight:200}}>
          {(()=>{
            const events:any[]=[];
            (sponMsgs||[]).filter((m:any)=>m.sponsor_id===sp.id).forEach((m:any)=>events.push({dt:m.created_at,type:"msg",text:`💬 ${m.user_name}: ${m.content}`}));
            (sponDeliveries||[]).filter((d:any)=>d.sponsor_id===sp.id).forEach((d:any)=>events.push({dt:d.created_at,type:"delivery",text:`📦 Entrega: ${d.description} — ${fmtARS(Number(d.total_value||0))}`}));
            (hospInvitaciones||[]).filter((i:any)=>i.sponsor_id===sp.id).forEach((i:any)=>events.push({dt:i.created_at,type:"hosp",text:`🤝 Invitación: ${i.partido_fecha||""} vs ${i.partido_rival||"TBC"} (${i.entradas} entradas)`}));
            events.sort((a,b)=>(b.dt||"").localeCompare(a.dt||""));
            return(<>
              {events.length===0&&<div style={{textAlign:"center",padding:30,color:colors.g4,fontSize:12}}>Sin actividad registrada</div>}
              {events.map((ev,i)=>(
                <div key={i} style={{padding:"6px 0",borderBottom:"1px solid "+colors.g2,fontSize:11}}>
                  <span style={{color:colors.g4,fontSize:9,marginRight:6}}>{ev.dt?.slice(0,10)}</span>
                  <span style={{color:colors.nv}}>{ev.text}</span>
                </div>
              ))}
            </>);
          })()}
        </div>}
      </Card>
    </div>);
  }

  /* ══════════════════════════════════════════════════════════════
     LIST VIEW — main sponsors grid
     ══════════════════════════════════════════════════════════════ */
  return(<div style={{maxWidth:900}}>
    {/* ── Top-level tab bar ── */}
    <div style={{display:"flex",gap:0,marginBottom:12,borderBottom:"2px solid "+colors.g2,overflowX:"auto"}}>
      {([["dashboard","📊 Dashboard"],["clientes","🏢 Clientes"],["propuestas","📝 Propuestas"],["tarifario","💰 Tarifario"],["materiales","📁 Materiales"],["hospitalidad","🤝 Hospitalidad"]] as const).map(([t,l])=>(
        <button key={t} onClick={()=>sTopTab(t as any)} style={{padding:"8px 14px",fontSize:mob?10:12,fontWeight:topTab===t?700:500,color:topTab===t?colors.rd:colors.g4,background:"none",border:"none",borderBottom:topTab===t?"2px solid "+colors.rd:"2px solid transparent",marginBottom:-2,cursor:"pointer",transition:"all .2s",whiteSpace:"nowrap"}}>{l}</button>
      ))}
    </div>

    {topTab==="dashboard"?<DashboardPanel sponsors={sponsors} tarifario={tarifario} contracts={sponContracts} pipeline={sponPipeline} dolarRef={dolarRef} colors={colors} isDark={isDark} cardBg={cardBg} mob={mob}/>:null}
    {topTab==="tarifario"?<TarifarioPanel tarifario={tarifario} sponsors={sponsors} dolarRef={dolarRef} colors={colors} isDark={isDark} cardBg={cardBg} mob={mob} canFullEdit={canFullEdit} onAdd={onAddTarifa} onUpd={onUpdTarifa} onDel={onDelTarifa}/>:null}
    {topTab==="propuestas"?<PropuestasPanel propuestas={sponPropuestas} votos={sponPropVotos} mensajes={sponPropMsgs} sponsors={sponsors} tarifario={tarifario} colors={colors} isDark={isDark} cardBg={cardBg} mob={mob} canCreate={canFullEdit||isGC} canVote={isSE} user={user} onAdd={onAddPropuesta} onUpd={onUpdPropuesta} onDel={onDelPropuesta} onVote={onAddPropVoto} onMsg={onAddPropMsg} onAddSponsor={onAdd}/>:null}
    {topTab==="materiales"?<MaterialesPanel materiales={sponMateriales} colors={colors} isDark={isDark} cardBg={cardBg} mob={mob} canUpload={canFullEdit} onAdd={onAddMaterial} onDel={onDelMaterial}/>:null}
    {topTab==="hospitalidad"?<HospitalidadPanel invitaciones={hospInvitaciones} sponsors={sponsors} contactos={sponContactos} fixtures={fixtures} colors={colors} isDark={isDark} cardBg={cardBg} mob={mob} canManage={canFullEdit||isBrandi} onAdd={onAddHosp} onUpd={onUpdHosp} onDel={onDelHosp}/>:null}

    {topTab==="clientes"?<>
    {/* ── Header ── */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:4}}>
      <div>
        <h2 style={{margin:"0 0 4px",fontSize:mob?16:19,color:colors.nv,fontWeight:800}}>Sponsors</h2>
        <p style={{color:colors.g4,fontSize:12,margin:0}}>Gestión de patrocinadores y sponsors del club</p>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" as const}}>
        {editDolar?<div style={{display:"flex",alignItems:"center",gap:4}}><span style={{fontSize:10,fontWeight:600,color:colors.g5}}>USD $</span><input type="number" value={dolarInput} onChange={e=>sDolarInput(e.target.value)} style={{width:80,padding:"4px 8px",borderRadius:6,border:"1px solid #10B981",fontSize:12,fontWeight:700,background:cardBg,color:colors.nv}} autoFocus onKeyDown={e=>{if(e.key==="Enter")saveDolar();if(e.key==="Escape")sEditDolar(false);}}/><Btn v="s" s="s" onClick={saveDolar}>OK</Btn><Btn v="g" s="s" onClick={()=>sEditDolar(false)}>✕</Btn></div>
        :<div style={{display:"flex",alignItems:"center",gap:4}}>
          <span style={{background:isDark?"rgba(16,185,129,.15)":"#D1FAE5",color:"#10B981",padding:"4px 10px",borderRadius:8,fontSize:11,fontWeight:700}}>dólar ${dolarRef.toLocaleString("es-AR")}</span>
          {canFullEdit&&<Btn v="g" s="s" onClick={()=>{sDolarInput(String(dolarRef));sEditDolar(true);}}>✏️</Btn>}
        </div>}
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} style={{display:"none"}}/>
        <Btn v="g" s="s" onClick={()=>fileRef.current?.click()}>📥 Excel</Btn>
        <Btn v="g" s="s" onClick={()=>{sShowManual(!showManual);sImportErr(null);}}>📋 Manual</Btn>
        <Btn v="pu" s="s" onClick={openAdd}>+ Sponsor</Btn>
      </div>
    </div>

    {/* ── Import Error ── */}
    {importErr&&<div style={{padding:"8px 14px",marginBottom:10,borderRadius:8,background:isDark?"rgba(220,38,38,.15)":"#FEF2F2",border:"1px solid #FECACA",color:"#DC2626",fontSize:12,fontWeight:600,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span>{importErr}</span><button onClick={()=>sImportErr(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:"#DC2626"}} title="Cerrar error">✕</button></div>}

    {/* ── Manual paste ── */}
    {showManual&&<Card style={{marginBottom:14,background:isDark?"#0D1B2A":"#F0F4FF",border:"1px solid #93C5FD"}}>
      <div style={{fontSize:13,fontWeight:700,color:isDark?"#60A5FA":"#1E40AF",marginBottom:8}}>📋 Carga manual — pegá datos del Excel</div>
      <p style={{fontSize:11,color:colors.g5,margin:"0 0 8px"}}>Copiá las celdas del Excel (con encabezados) y pegalas acá. Se separan por tabs, punto y coma, o comas.</p>
      <p style={{fontSize:10,color:colors.g4,margin:"0 0 8px",fontStyle:"italic"}}>Ejemplo: Sponsor{"\t"}Aporte ${"\t"}Aporte Pro/Ser{"\t"}Período{"\t"}Exposición{"\t"}Varios</p>
      <textarea value={manualText} onChange={e=>sManualText(e.target.value)} rows={8} placeholder={"Sponsor\tAporte $\tAporte Pro/Ser\tPeríodo\tExposición\tVarios\nUroclínica\t2000000\t0\t2025\tRopa: frente camiseta\tPago mensual"} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+colors.g3,fontSize:11,fontFamily:"monospace",background:cardBg,color:colors.nv,boxSizing:"border-box" as const,resize:"vertical" as const}}/>
      <div style={{display:"flex",gap:6,justifyContent:"flex-end",marginTop:8}}>
        <Btn v="g" s="s" onClick={()=>{sShowManual(false);sManualText("");}}>Cancelar</Btn>
        <Btn v="s" s="s" disabled={!manualText.trim()} onClick={handleManualPaste}>Procesar</Btn>
      </div>
    </Card>}

    {/* ── Import Preview ── */}
    {importPreview&&<Card style={{marginBottom:14,background:isDark?"#0D2818":"#F0FDF4",border:"1px solid #BBF7D0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{fontSize:13,fontWeight:700,color:isDark?"#4ADE80":"#166534"}}>📥 Vista previa: {importPreview.length} sponsors del Excel</div>
        <button onClick={()=>sImportPreview(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:colors.g4}} title="Cerrar vista previa">✕</button>
      </div>
      <div style={{maxHeight:300,overflowY:"auto" as const,marginBottom:10}}>
        <table style={{width:"100%",borderCollapse:"collapse" as const,fontSize:11}}>
          <thead><tr style={{background:isDark?"rgba(0,0,0,.2)":"#E8F5E9"}}>
            <th style={{padding:"4px 6px",textAlign:"left" as const,fontWeight:700,color:colors.nv}}>Sponsor</th>
            <th style={{padding:"4px 6px",textAlign:"right" as const,fontWeight:700,color:"#10B981"}}>Aporte $</th>
            <th style={{padding:"4px 6px",textAlign:"right" as const,fontWeight:700,color:"#3B82F6"}}>Canjes</th>
            <th style={{padding:"4px 6px",textAlign:"left" as const,fontWeight:700,color:colors.g5}}>Exposición</th>
            <th style={{padding:"4px 6px",textAlign:"left" as const,fontWeight:700,color:colors.g5}}>Notas</th>
          </tr></thead>
          <tbody>{importPreview.map((sp,i)=><tr key={i} style={{borderBottom:"1px solid "+colors.g2}}>
            <td style={{padding:"4px 6px",fontWeight:600,color:colors.nv}}>{sp.name}</td>
            <td style={{padding:"4px 6px",textAlign:"right" as const,color:"#10B981",fontWeight:600}}>{fmtARS(sp.amount_cash)}</td>
            <td style={{padding:"4px 6px",textAlign:"right" as const,color:"#3B82F6",fontWeight:600}}>{fmtARS(sp.amount_service)}</td>
            <td style={{padding:"4px 6px",color:colors.g5,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{sp.exposure}</td>
            <td style={{padding:"4px 6px",color:colors.g5,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{sp.notes}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
        <Btn v="g" s="s" onClick={()=>sImportPreview(null)}>Cancelar</Btn>
        <Btn v="s" s="s" disabled={importing} onClick={confirmImport}>{importing?`Importando...`:`Importar ${importPreview.length} sponsors`}</Btn>
      </div>
    </Card>}

    {/* ── KPI Dashboard ── */}
    <div style={{display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)",gap:10,margin:"14px 0"}}>
      <Card style={{padding:"10px 12px",borderTop:"3px solid #10B981"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:10,color:colors.g4,fontWeight:600}}>Total Aportes $</span>
          <span style={{fontSize:15,fontWeight:800,color:"#10B981"}}>{fmtARS(totalCash)}</span>
        </div>
      </Card>
      <Card style={{padding:"10px 12px",borderTop:"3px solid #3B82F6"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:10,color:colors.g4,fontWeight:600}}>Total Canjes $</span>
          <span style={{fontSize:15,fontWeight:800,color:"#3B82F6"}}>{fmtARS(totalService)}</span>
        </div>
      </Card>
      <Card style={{padding:"10px 12px",borderTop:"3px solid "+colors.pr}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:10,color:colors.g4,fontWeight:600}}>Sponsors Activos</span>
          <span style={{fontSize:15,fontWeight:800,color:colors.pr}}>{active.length}</span>
        </div>
      </Card>
      <Card style={{padding:"10px 12px",borderTop:"3px solid "+(expiring.length>0?"#DC2626":colors.yl)}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:10,color:colors.g4,fontWeight:600}}>Por Vencer</span>
          <span style={{fontSize:15,fontWeight:800,color:expiring.length>0?"#DC2626":colors.yl}}>{expiring.length}</span>
        </div>
      </Card>
    </div>

    {/* ── Filter bar ── */}
    <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap" as const,alignItems:"center"}}>
      <input value={search} onChange={e=>sSr(e.target.value)} placeholder="Buscar sponsor..." style={{padding:mob?"10px 12px":"5px 10px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:mob?13:11,width:mob?140:180,background:cardBg,color:colors.nv,minHeight:mob?44:undefined}}/>
      <select value={fSt} onChange={e=>sFSt(e.target.value)} style={{padding:mob?"10px 8px":"5px 8px",borderRadius:8,border:"1px solid "+colors.g3,fontSize:mob?13:11,background:cardBg,color:colors.nv,minHeight:mob?44:undefined}}>
        <option value="all">Todos los estados</option>{Object.keys(SPON_ST).map(k=><option key={k} value={k}>{SPON_ST[k].l}</option>)}
      </select>
    </div>

    {/* ── Status summary chips ── */}
    <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap" as const}}>
      {Object.keys(SPON_ST).map(k=>{const cnt=all.filter((s:any)=>s.status===k).length;return <span key={k} onClick={()=>sFSt(fSt===k?"all":k)} style={{padding:mob?"8px 12px":"3px 10px",borderRadius:14,background:fSt===k?SPON_ST[k].bg:cardBg,border:"1px solid "+(fSt===k?SPON_ST[k].c:colors.g3),fontSize:mob?12:10,fontWeight:600,color:SPON_ST[k].c,cursor:"pointer",minHeight:mob?36:undefined,display:"inline-flex",alignItems:"center"}}>{SPON_ST[k].l} {cnt}</span>;})}
    </div>

    {/* ── Modal overlay – Add/Edit form ── */}
    {showForm&&<div style={{position:"fixed" as const,inset:0,background:"rgba(0,0,0,.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={closeForm}>
      <div style={{background:cardBg,borderRadius:16,padding:mob?16:24,width:"100%",maxWidth:520,maxHeight:"90vh",overflowY:"auto" as const,boxShadow:"0 8px 32px rgba(0,0,0,.2)"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontSize:14,fontWeight:800,color:colors.nv}}>{editId?"Editar Sponsor":"Nuevo Sponsor"}</div>
          <button onClick={closeForm} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:colors.g4}} title="Cerrar formulario">✕</button>
        </div>

        {/* Sponsor name */}
        <div style={{marginBottom:8}}>
          <label style={lbl}>Sponsor *</label>
          <input value={form.name} onChange={e=>sForm(p=>({...p,name:e.target.value}))} style={inp} placeholder="Ej: Uroclínica, Friolatina"/>
        </div>

        {/* Responsable */}
        <div style={{marginBottom:8}}>
          <label style={lbl}>Responsable</label>
          <input value={form.responsable} onChange={e=>sForm(p=>({...p,responsable:e.target.value}))} style={inp} placeholder="Jesús Herrera"/>
        </div>

        {/* Amount cash + Amount service */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          <div>
            <label style={lbl}>Aporte $ (Efectivo)</label>
            <input type="number" value={form.amount_cash} onChange={e=>sForm(p=>({...p,amount_cash:e.target.value}))} style={inp} placeholder="0"/>
          </div>
          <div>
            <label style={lbl}>Aporte Pro/Ser (Canjes)</label>
            <input type="number" value={form.amount_service} onChange={e=>sForm(p=>({...p,amount_service:e.target.value}))} style={inp} placeholder="0"/>
          </div>
        </div>

        {/* End date + Status */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          <div>
            <label style={lbl}>Período / Vencimiento</label>
            <input type="date" value={form.end_date} onChange={e=>sForm(p=>({...p,end_date:e.target.value}))} style={inp}/>
          </div>
          <div>
            <label style={lbl}>Estado</label>
            <select value={form.status} onChange={e=>sForm(p=>({...p,status:e.target.value}))} style={inp}>
              {Object.keys(SPON_ST).map(k=><option key={k} value={k}>{SPON_ST[k].l}</option>)}
            </select>
          </div>
        </div>

        {/* Payment type */}
        <div style={{marginBottom:8}}>
          <label style={lbl}>Tipo de Pago</label>
          <input value={form.payment_type} onChange={e=>sForm(p=>({...p,payment_type:e.target.value}))} style={inp} placeholder="Ej: pago mensual, canje, cheques"/>
        </div>

        {/* Exposure */}
        <div style={{marginBottom:8}}>
          <label style={lbl}>Exposición</label>
          <input value={form.exposure} onChange={e=>sForm(p=>({...p,exposure:e.target.value}))} style={inp} placeholder="Ej: Ropa: frente camiseta. Cartelería"/>
        </div>

        {/* Instrucciones canje */}
        <div style={{marginBottom:8}}>
          <label style={lbl}>Instrucciones para el Canje</label>
          <MentionInput users={users} value={form.canje_instrucciones} onChange={v=>sForm(p=>({...p,canje_instrucciones:v}))} rows={3} style={{...inp,resize:"vertical" as const}} placeholder="Ej: Contactar a Juan (tel 351-xxx), pedir factura a nombre de..."/>
        </div>

        {/* Notes */}
        <div style={{marginBottom:12}}>
          <label style={lbl}>Varios / Observaciones</label>
          <MentionInput users={users} value={form.notes} onChange={v=>sForm(p=>({...p,notes:v}))} rows={3} style={{...inp,resize:"vertical" as const}} placeholder="Detalles adicionales..."/>
        </div>

        {/* Total preview */}
        {(Number(form.amount_cash)||Number(form.amount_service))?<div style={{marginBottom:12,padding:"8px 12px",borderRadius:8,background:isDark?"rgba(16,185,129,.1)":"#ECFDF5",border:"1px solid #10B981"}}>
          <div style={{fontSize:10,color:"#10B981",fontWeight:600,marginBottom:2}}>Total Aporte</div>
          <div style={{fontSize:16,fontWeight:800,color:"#10B981"}}>{fmtARS((Number(form.amount_cash)||0)+(Number(form.amount_service)||0))}</div>
          <div style={{fontSize:10,color:colors.g5,marginTop:2}}>Efectivo: {fmtARS(Number(form.amount_cash)||0)} | Canjes: {fmtARS(Number(form.amount_service)||0)}</div>
        </div>:null}

        {/* Actions */}
        <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
          <Btn v="g" s="s" onClick={closeForm}>Cancelar</Btn>
          <Btn v="pu" s="s" disabled={!form.name.trim()} onClick={saveForm}>{editId?"Guardar Cambios":"Crear Sponsor"}</Btn>
        </div>
      </div>
    </div>}

    {/* ── Sponsor Cards Grid ── */}
    {vis.length===0&&<Card style={{textAlign:"center" as const,padding:24,color:colors.g4}}><div style={{marginTop:6,fontSize:12}}>Sin sponsors{(fSt!=="all"||search)?" con esos filtros":""}</div></Card>}
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:10}}>
      {vis.map((sp:any)=>{
        const st=SPON_ST[sp.status]||SPON_ST.inactive;
        const dl=daysLeft(sp.end_date);
        const isExp=dl>=0&&dl<=30&&sp.status==="active";
        const cash=Number(sp.amount_cash||0);
        const service=Number(sp.amount_service||0);
        const total=cash+service;
        const monthly=isMensual(sp.payment_type);

        return(<Card key={sp.id} style={{padding:0,overflow:"hidden",borderLeft:"4px solid "+st.c,cursor:"pointer",transition:"box-shadow .2s"}} onClick={()=>{sDetailId(sp.id);sSpTab("general");}}>
          <div style={{padding:"12px 14px"}}>
            {/* Top row: status badge + payment indicator */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <span style={{background:st.bg,color:st.c,padding:"2px 8px",borderRadius:12,fontSize:10,fontWeight:600}}>{st.l}</span>
              <div style={{display:"flex",gap:4,alignItems:"center"}}>
                {monthly&&<span style={{background:isDark?"rgba(59,130,246,.15)":"#DBEAFE",color:"#3B82F6",padding:"2px 6px",borderRadius:8,fontSize:9,fontWeight:700}}>Mensual</span>}
                {sp.payment_type&&!monthly&&<span style={{background:isDark?"rgba(139,92,246,.15)":"#EDE9FE",color:colors.pr,padding:"2px 6px",borderRadius:8,fontSize:9,fontWeight:600}}>{sp.payment_type}</span>}
              </div>
            </div>

            {/* Name + donut */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:15,fontWeight:800,color:colors.nv,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{sp.name}</div>
                {/* Amounts */}
                <div style={{display:"flex",gap:10,flexWrap:"wrap" as const}}>
                  <div>
                    <div style={{fontSize:9,color:colors.g5,fontWeight:600}}>Aporte $</div>
                    <div style={{fontSize:14,fontWeight:800,color:"#10B981"}}>{fmtARS(cash)}</div>
                  </div>
                  <div>
                    <div style={{fontSize:9,color:colors.g5,fontWeight:600}}>Canjes</div>
                    <div style={{fontSize:14,fontWeight:800,color:"#3B82F6"}}>{fmtARS(service)}</div>
                  </div>
                  <div>
                    <div style={{fontSize:9,color:colors.g5,fontWeight:600}}>Total</div>
                    <div style={{fontSize:14,fontWeight:800,color:colors.nv}}>{fmtARS(total)}</div>
                  </div>
                </div>
              </div>
              {/* Donut chart */}
              <DonutChart cash={cash} service={service} size={52}/>
            </div>

            {/* Canje progress bar */}
            {service>0&&(()=>{const usado=(canjeUsado||{})[sp.id]||0;const disp=service-usado;const pct=Math.min(100,Math.round(usado/service*100));const barC=pct>80?"#DC2626":pct>50?"#F59E0B":"#10B981";return(
              <div style={{marginTop:6,padding:"6px 8px",background:isDark?"rgba(59,130,246,.08)":"#F0F7FF",borderRadius:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                  <span style={{fontSize:9,fontWeight:700,color:"#3B82F6"}}>Canjes</span>
                  <span style={{fontSize:9,fontWeight:700,color:barC}}>{pct}% usado</span>
                </div>
                <div style={{height:6,background:isDark?"#334155":"#E2E8F0",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:pct+"%",background:barC,borderRadius:3,transition:"width .3s"}}/></div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
                  <span style={{fontSize:8,color:colors.g5}}>Usado: {fmtARS(usado)}</span>
                  <span style={{fontSize:8,fontWeight:700,color:disp>0?"#059669":"#DC2626"}}>Disponible: {fmtARS(disp)}</span>
                </div>
                {usado===0&&<div style={{marginTop:3,fontSize:8,fontWeight:700,color:"#F59E0B",background:"#FEF3C7",padding:"1px 6px",borderRadius:4,display:"inline-block"}}>Sin usar</div>}
              </div>);})()}

            {/* Período */}
            {sp.end_date&&<div style={{marginTop:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:10,color:colors.g5}}>Período: {fmtD(sp.end_date)}</span>
              {sp.status==="active"&&(
                dl<0?<span style={{fontSize:10,fontWeight:700,color:"#DC2626",background:"#FEE2E2",padding:"2px 6px",borderRadius:8}}>Vencido hace {Math.abs(dl)} días</span>
                :isExp?<span style={{fontSize:10,fontWeight:700,color:"#D97706",background:"#FEF3C7",padding:"2px 6px",borderRadius:8}}>Vence en {dl} días</span>
                :<span style={{fontSize:10,color:colors.g4}}>{dl} días restantes</span>
              )}
            </div>}

            {/* Exposure badge */}
            {sp.exposure&&<div style={{marginTop:5}}>
              <span style={{background:isDark?"rgba(139,92,246,.12)":"#F3F0FF",color:colors.pr,padding:"2px 8px",borderRadius:8,fontSize:10,fontWeight:600,display:"inline-block",maxWidth:"100%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{sp.exposure}</span>
            </div>}

            {/* Notes preview */}
            {sp.notes&&<div style={{marginTop:4,fontSize:10,color:colors.g5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{renderMentions(sp.notes)}</div>}
          </div>
        </Card>);})}
    </div>

    {/* ── Summary: Cash vs Service breakdown ── */}
    {all.length>0&&<Card style={{padding:14,marginTop:18}}>
      <div style={{fontSize:13,fontWeight:700,color:colors.nv,marginBottom:12}}>Resumen de Aportes</div>
      <div style={{display:"flex",alignItems:"center",gap:mob?12:20}}>
        <DonutChart cash={totalCash} service={totalService} size={80}/>
        <div style={{flex:1}}>
          {/* Cash bar */}
          <div style={{marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}>
              <span style={{fontWeight:600,color:"#10B981"}}>Efectivo</span>
              <span style={{fontWeight:700,color:"#10B981"}}>{fmtARS(totalCash)}</span>
            </div>
            <div style={{height:8,background:isDark?"rgba(255,255,255,.06)":colors.g2,borderRadius:5,overflow:"hidden"}}>
              <div style={{height:"100%",width:totalAll>0?Math.round(totalCash/totalAll*100)+"%":"0%",background:"#10B981",borderRadius:5,transition:"width .4s"}}/>
            </div>
          </div>
          {/* Service bar */}
          <div style={{marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}>
              <span style={{fontWeight:600,color:"#3B82F6"}}>Canjes / Servicios</span>
              <span style={{fontWeight:700,color:"#3B82F6"}}>{fmtARS(totalService)}</span>
            </div>
            <div style={{height:8,background:isDark?"rgba(255,255,255,.06)":colors.g2,borderRadius:5,overflow:"hidden"}}>
              <div style={{height:"100%",width:totalAll>0?Math.round(totalService/totalAll*100)+"%":"0%",background:"#3B82F6",borderRadius:5,transition:"width .4s"}}/>
            </div>
          </div>
          {/* Total */}
          <div style={{borderTop:"1px solid "+colors.g2,paddingTop:6,display:"flex",justifyContent:"space-between",fontSize:12}}>
            <span style={{fontWeight:700,color:colors.nv}}>Total Aportes Activos</span>
            <span style={{fontWeight:800,color:colors.nv}}>{fmtARS(totalAll)}</span>
          </div>
          {totalAll>0&&<div style={{fontSize:10,color:colors.g5,marginTop:2,textAlign:"right" as const}}>
            USD ~${Math.round(totalAll/dolarRef).toLocaleString("es-AR")} (ref ${dolarRef.toLocaleString("es-AR")})
          </div>}
        </div>
      </div>
    </Card>}
  </>:null}
  </div>);
}
