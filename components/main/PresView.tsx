"use client";
import { useState } from "react";
import { T, PSC, PST, MONEDAS, RUBROS, ST, fn, isOD, daysDiff } from "@/lib/constants";
import { fmtD } from "@/lib/mappers";
import { Btn, Card, PBadge, FileField } from "@/components/ui";
import { exportCSV, exportPDF } from "@/lib/export";

const TODAY = new Date().toISOString().slice(0,10);

export default function PresView({presu,provs,peds,users,areas,deptos,user,onAddPresu,onUpdPresu,onDelPresu,onAddProv,onSel,mob,UserPicker}:any){
  const [tab,sTab]=useState("todos");const [fSt,sFSt]=useState("all");const [fProv,sFProv]=useState("");const [fArea,sFArea]=useState("");const [search,sSr]=useState("");
  const [pvMode,sPvMode]=useState("list");const [pvF,sPvF]=useState({nombre:"",contacto:"",email:"",telefono:"",rubro:"",notas:""});
  const isSA=user.role==="superadmin";const canManage=isSA||user.role==="admin"||user.role==="embudo";
  const [addMode,sAddMode]=useState(false);const [provSearch2,sProvSearch2]=useState("");
  const [npf,sNpf]=useState({task_id:"",prov_id:"",prov_nombre:"",prov_contacto:"",descripcion:"",monto:"",moneda:"ARS",archivo_url:"",notas:""});
  const resetNpf=()=>{sNpf({task_id:"",prov_id:"",prov_nombre:"",prov_contacto:"",descripcion:"",monto:"",moneda:"ARS",archivo_url:"",notas:""});sProvSearch2("");sAddMode(false);};

  /* TODOS */
  if(tab==="todos"){
    let vis=[...presu];
    if(fSt!=="all") vis=vis.filter((pr:any)=>pr.status===fSt);
    if(fProv) vis=vis.filter((pr:any)=>pr.proveedor_nombre.toLowerCase().includes(fProv.toLowerCase()));
    if(search){const s=search.toLowerCase();vis=vis.filter((pr:any)=>(pr.proveedor_nombre+pr.descripcion+pr.notas+(pr.id+"")).toLowerCase().includes(s));}
    if(fArea){const ar=areas.find((a:any)=>a.id===Number(fArea));if(ar){const dIds=deptos.filter((d:any)=>d.aId===ar.id).map((d:any)=>d.id);const tIds=peds.filter((p:any)=>dIds.indexOf(p.dId)>=0).map((p:any)=>p.id);vis=vis.filter((pr:any)=>tIds.indexOf(pr.task_id)>=0);}}
    const doExportPresu=(fmt:"csv"|"pdf")=>{
      const headers=["#","Tarea","Proveedor","Descripción","Monto","Moneda","Estado","Fecha"];
      const rows=vis.map((pr:any)=>[String(pr.id),String(pr.task_id),pr.proveedor_nombre,pr.descripcion,String(pr.monto),pr.moneda,PSC[pr.status]?.l||pr.status,pr.solicitado_at||""]);
      if(fmt==="csv") exportCSV("presupuestos",headers,rows);
      else exportPDF("Presupuestos",headers,rows,{landscape:true});
    };
    return(<div style={{maxWidth:800}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:4}}>
        <div><h2 style={{margin:"0 0 4px",fontSize:mob?16:19,color:T.nv,fontWeight:800}}>💰 Presupuestos</h2><p style={{color:T.g4,fontSize:12,margin:0}}>Repositorio de cotizaciones y comparación de proveedores</p></div>
        <div style={{display:"flex",gap:4,alignItems:"center"}}>{vis.length>0&&<><Btn v="g" s="s" onClick={()=>doExportPresu("csv")}>CSV</Btn><Btn v="g" s="s" onClick={()=>doExportPresu("pdf")}>PDF</Btn></>}{canManage&&!addMode&&<Btn v="pu" s="s" onClick={()=>sAddMode(true)}>+ Nuevo Presupuesto</Btn>}</div>
      </div>
      <div style={{display:"flex",gap:4,marginBottom:12,marginTop:10}}>{[{k:"todos",l:"📋 Todos"},{k:"provs",l:"🏢 Proveedores"},{k:"kpis",l:"📊 KPIs"}].map(t=><button key={t.k} onClick={()=>sTab(t.k)} style={{padding:"6px 14px",borderRadius:8,border:"none",background:tab===t.k?T.pr:"#fff",color:tab===t.k?"#fff":T.g5,fontSize:12,fontWeight:600,cursor:"pointer"}}>{t.l}</button>)}</div>
      {/* Add presupuesto form */}
      {addMode&&canManage&&<Card style={{marginBottom:14,background:"#F5F3FF",border:"1px solid "+T.pr+"33"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div style={{fontSize:12,fontWeight:700,color:T.pr}}>➕ Nuevo presupuesto</div><button onClick={resetNpf} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:T.g4}}>✕</button></div>
        <div style={{marginBottom:8}}><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Tarea vinculada *</label><select value={npf.task_id} onChange={e=>sNpf(p=>({...p,task_id:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,marginTop:2}}><option value="">Seleccionar tarea...</option>{peds.filter((p:any)=>p.st!=="ok").map((p:any)=><option key={p.id} value={p.id}>#{p.id} – {p.tipo}: {p.desc.slice(0,50)}</option>)}</select></div>
        <div style={{marginBottom:8}}><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Proveedor *</label>
          <input value={provSearch2} onChange={e=>{sProvSearch2(e.target.value);sNpf(p=>({...p,prov_nombre:e.target.value,prov_id:""}));}} placeholder="Buscar o escribir proveedor..." style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/>
          {provSearch2&&(provs||[]).filter((pv:any)=>pv.nombre.toLowerCase().includes(provSearch2.toLowerCase())).length>0&&<div style={{border:"1px solid "+T.g3,borderRadius:8,marginTop:2,maxHeight:100,overflowY:"auto" as const,background:"#fff"}}>
            {(provs||[]).filter((pv:any)=>pv.nombre.toLowerCase().includes(provSearch2.toLowerCase())).map((pv:any)=><div key={pv.id} onClick={()=>{sNpf(p=>({...p,prov_id:String(pv.id),prov_nombre:pv.nombre,prov_contacto:pv.contacto||pv.telefono||pv.email}));sProvSearch2(pv.nombre);}} style={{padding:"6px 10px",fontSize:11,cursor:"pointer",borderBottom:"1px solid "+T.g1}}>{pv.nombre} <span style={{color:T.g4}}>({pv.rubro})</span></div>)}
          </div>}
        </div>
        <div style={{marginBottom:8}}><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Contacto proveedor</label><input value={npf.prov_contacto} onChange={e=>sNpf(p=>({...p,prov_contacto:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
        <div style={{marginBottom:8}}><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Descripción</label><textarea value={npf.descripcion} onChange={e=>sNpf(p=>({...p,descripcion:e.target.value}))} rows={2} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,resize:"vertical" as const,boxSizing:"border-box" as const,marginTop:2}}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 80px",gap:8,marginBottom:8}}>
          <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Monto ($) *</label><input type="number" value={npf.monto} onChange={e=>sNpf(p=>({...p,monto:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
          <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Moneda</label><select value={npf.moneda} onChange={e=>sNpf(p=>({...p,moneda:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,marginTop:2}}>{MONEDAS.map(m=><option key={m} value={m}>{m}</option>)}</select></div>
        </div>
        <div style={{marginBottom:8}}><FileField value={npf.archivo_url} onChange={url=>sNpf(p=>({...p,archivo_url:url}))} folder="presupuestos"/></div>
        <div style={{marginBottom:8}}><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Notas</label><input value={npf.notas} onChange={e=>sNpf(p=>({...p,notas:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
        <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}><Btn v="g" s="s" onClick={resetNpf}>Cancelar</Btn><Btn v="pu" s="s" disabled={!npf.task_id||!npf.prov_nombre||!npf.monto} onClick={()=>{onAddPresu({task_id:Number(npf.task_id),proveedor_id:npf.prov_id?Number(npf.prov_id):null,proveedor_nombre:npf.prov_nombre,proveedor_contacto:npf.prov_contacto,descripcion:npf.descripcion,monto:Number(npf.monto),moneda:npf.moneda,archivo_url:npf.archivo_url,notas:npf.notas,status:PST.SOL,solicitado_por:fn(user),solicitado_at:TODAY});resetNpf();}}>💰 Cargar presupuesto</Btn></div>
      </Card>}
      {/* Filters */}
      <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap" as const,alignItems:"center"}}>
        <input value={search} onChange={e=>sSr(e.target.value)} placeholder="🔍 Buscar..." style={{padding:"5px 10px",borderRadius:8,border:"1px solid "+T.g3,fontSize:11,width:140}}/>
        <select value={fSt} onChange={e=>sFSt(e.target.value)} style={{padding:"5px 8px",borderRadius:8,border:"1px solid "+T.g3,fontSize:11}}>
          <option value="all">Todos los estados</option>{Object.keys(PSC).map(k=><option key={k} value={k}>{PSC[k].i} {PSC[k].l}</option>)}
        </select>
        <select value={fArea} onChange={e=>sFArea(e.target.value)} style={{padding:"5px 8px",borderRadius:8,border:"1px solid "+T.g3,fontSize:11}}>
          <option value="">Todas las áreas</option>{areas.map((a:any)=><option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
        </select>
        <input value={fProv} onChange={e=>sFProv(e.target.value)} placeholder="Proveedor..." style={{padding:"5px 10px",borderRadius:8,border:"1px solid "+T.g3,fontSize:11,width:120}}/>
      </div>
      {/* Summary */}
      <div style={{display:"flex",gap:6,marginBottom:12}}>
        {Object.keys(PSC).map(k=>{const cnt=presu.filter((pr:any)=>pr.status===k).length;return <span key={k} onClick={()=>sFSt(fSt===k?"all":k)} style={{padding:"3px 10px",borderRadius:14,background:fSt===k?PSC[k].bg:"#fff",border:"1px solid "+(fSt===k?PSC[k].c:T.g3),fontSize:10,fontWeight:600,color:PSC[k].c,cursor:"pointer"}}>{PSC[k].i} {cnt}</span>;})}
      </div>
      {/* List */}
      {vis.length===0&&<Card style={{textAlign:"center" as const,padding:24,color:T.g4}}><span style={{fontSize:24}}>📭</span><div style={{marginTop:6,fontSize:12}}>Sin presupuestos</div></Card>}
      {vis.map((pr:any)=>{const tk=peds.find((p:any)=>p.id===pr.task_id);const ar=tk?areas.find((a:any)=>{const dIds=deptos.filter((d:any)=>d.aId===a.id).map((d:any)=>d.id);return dIds.indexOf(tk.dId)>=0;}):null;
        return(<Card key={pr.id} style={{padding:"10px 14px",marginBottom:6,cursor:"pointer",borderLeft:"3px solid "+PSC[pr.status].c}} onClick={()=>{if(tk)onSel(tk);}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
            <div><div style={{fontSize:12,fontWeight:700,color:T.nv}}>{pr.proveedor_nombre||"Sin proveedor"}</div><div style={{fontSize:10,color:T.g4}}>{pr.descripcion}{tk?" · Tarea #"+tk.id+" "+tk.desc.slice(0,30):""}</div></div>
            <div style={{textAlign:"right" as const}}><div style={{fontSize:14,fontWeight:800,color:pr.status===PST.APR?T.gn:T.nv}}>${Number(pr.monto).toLocaleString()}</div><PBadge s={pr.status} sm/></div>
          </div>
          <div style={{display:"flex",gap:8,marginTop:4,fontSize:10,color:T.g5}}>{ar&&<span>{ar.icon} {ar.name}</span>}{pr.solicitado_at&&<span>📤 {pr.solicitado_at}</span>}{pr.archivo_url&&<span style={{color:T.bl}}>📎</span>}</div>
        </Card>);})}
    </div>);
  }

  /* PROVEEDORES */
  if(tab==="provs"){
    return(<div style={{maxWidth:800}}>
      <h2 style={{margin:"0 0 4px",fontSize:mob?16:19,color:T.nv,fontWeight:800}}>💰 Presupuestos</h2>
      <p style={{color:T.g4,fontSize:12,margin:"0 0 14px"}}>Repositorio de cotizaciones y comparación de proveedores</p>
      <div style={{display:"flex",gap:4,marginBottom:12}}>{[{k:"todos",l:"📋 Todos"},{k:"provs",l:"🏢 Proveedores"},{k:"kpis",l:"📊 KPIs"}].map(t=><button key={t.k} onClick={()=>sTab(t.k)} style={{padding:"6px 14px",borderRadius:8,border:"none",background:tab===t.k?T.pr:"#fff",color:tab===t.k?"#fff":T.g5,fontSize:12,fontWeight:600,cursor:"pointer"}}>{t.l}</button>)}</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:700,color:T.nv}}>🏢 Directorio de Proveedores ({provs.length})</div>
        {canManage&&<Btn v="pu" s="s" onClick={()=>sPvMode(pvMode==="add"?"list":"add")}>{pvMode==="add"?"✕ Cancelar":"+ Nuevo proveedor"}</Btn>}
      </div>
      {pvMode==="add"&&<Card style={{marginBottom:12,background:"#F5F3FF",border:"1px solid "+T.pr+"33"}}>
        <div style={{fontSize:12,fontWeight:700,color:T.pr,marginBottom:8}}>➕ Nuevo proveedor</div>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8,marginBottom:8}}>
          <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Nombre *</label><input value={pvF.nombre} onChange={e=>sPvF(p=>({...p,nombre:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
          <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Contacto</label><input value={pvF.contacto} onChange={e=>sPvF(p=>({...p,contacto:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:8,marginBottom:8}}>
          <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Email</label><input value={pvF.email} onChange={e=>sPvF(p=>({...p,email:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
          <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Teléfono</label><input value={pvF.telefono} onChange={e=>sPvF(p=>({...p,telefono:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
          <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Rubro</label><select value={pvF.rubro} onChange={e=>sPvF(p=>({...p,rubro:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,marginTop:2}}><option value="">Seleccionar...</option>{RUBROS.map(r=><option key={r} value={r}>{r}</option>)}</select></div>
        </div>
        <div style={{marginBottom:8}}><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Notas</label><input value={pvF.notas} onChange={e=>sPvF(p=>({...p,notas:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
        <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}><Btn v="g" s="s" onClick={()=>sPvMode("list")}>Cancelar</Btn><Btn v="pu" s="s" disabled={!pvF.nombre} onClick={()=>{onAddProv({...pvF,created_at:TODAY});sPvF({nombre:"",contacto:"",email:"",telefono:"",rubro:"",notas:""});sPvMode("list");}}>✅ Guardar</Btn></div>
      </Card>}
      {provs.length===0&&<Card style={{textAlign:"center" as const,padding:24,color:T.g4}}>Sin proveedores registrados</Card>}
      {provs.map((pv:any)=>{const pvPresu=presu.filter((pr:any)=>pr.proveedor_id===pv.id);const aprobados=pvPresu.filter((pr:any)=>pr.status===PST.APR);const totalApr=aprobados.reduce((s:number,pr:any)=>s+Number(pr.monto),0);
        return(<Card key={pv.id} style={{padding:"10px 14px",marginBottom:6,borderLeft:"3px solid "+T.pr}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
            <div><div style={{fontSize:13,fontWeight:700,color:T.nv}}>{pv.nombre}</div><div style={{fontSize:10,color:T.g4}}>{pv.rubro}{pv.contacto?" · "+pv.contacto:""}</div></div>
            <div style={{textAlign:"right" as const}}><div style={{fontSize:10,color:T.g5}}>Cotizaciones: {pvPresu.length}</div>{totalApr>0&&<div style={{fontSize:12,fontWeight:700,color:T.gn}}>✅ ${totalApr.toLocaleString()}</div>}</div>
          </div>
          <div style={{display:"flex",gap:8,marginTop:4,fontSize:10,color:T.g5}}>{pv.email&&<span>📧 {pv.email}</span>}{pv.telefono&&<span>📞 {pv.telefono}</span>}</div>
        </Card>);})}
    </div>);
  }

  /* KPIs */
  if(tab==="kpis"){
    const totalApr=presu.filter((pr:any)=>pr.status===PST.APR).reduce((s:number,pr:any)=>s+Number(pr.monto),0);
    const pendientes=presu.filter((pr:any)=>pr.status===PST.SOL||pr.status===PST.REC).length;
    const recibidos=presu.filter((pr:any)=>pr.status!==PST.SOL&&pr.solicitado_at&&pr.recibido_at);
    const avgDays=recibidos.length?Math.round(recibidos.reduce((s:number,pr:any)=>{const d=daysDiff(pr.solicitado_at,pr.recibido_at);return s+(isNaN(d)?0:d);},0)/recibidos.length):0;
    /* gasto por area */
    const areaGasto=areas.map((ar:any)=>{const dIds=deptos.filter((d:any)=>d.aId===ar.id).map((d:any)=>d.id);const tIds=peds.filter((p:any)=>dIds.indexOf(p.dId)>=0).map((p:any)=>p.id);const aprArea=presu.filter((pr:any)=>pr.status===PST.APR&&tIds.indexOf(pr.task_id)>=0);const tot=aprArea.reduce((s:number,pr:any)=>s+Number(pr.monto),0);return{...ar,gasto:tot};}).filter((a:any)=>a.gasto>0).sort((a:any,b:any)=>b.gasto-a.gasto);
    const maxGasto=areaGasto.length?areaGasto[0].gasto:1;
    return(<div style={{maxWidth:800}}>
      <h2 style={{margin:"0 0 4px",fontSize:mob?16:19,color:T.nv,fontWeight:800}}>💰 Presupuestos</h2>
      <p style={{color:T.g4,fontSize:12,margin:"0 0 14px"}}>Repositorio de cotizaciones y comparación de proveedores</p>
      <div style={{display:"flex",gap:4,marginBottom:12}}>{[{k:"todos",l:"📋 Todos"},{k:"provs",l:"🏢 Proveedores"},{k:"kpis",l:"📊 KPIs"}].map(t=><button key={t.k} onClick={()=>sTab(t.k)} style={{padding:"6px 14px",borderRadius:8,border:"none",background:tab===t.k?T.pr:"#fff",color:tab===t.k?"#fff":T.g5,fontSize:12,fontWeight:600,cursor:"pointer"}}>{t.l}</button>)}</div>
      <div style={{display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)",gap:10,marginBottom:18}}>
        <Card style={{padding:"10px 12px",borderTop:"3px solid "+T.gn}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:16}}>✅</span><span style={{fontSize:17,fontWeight:800,color:T.gn}}>${totalApr.toLocaleString()}</span></div><div style={{fontSize:10,color:T.g4,marginTop:3}}>Total Aprobado</div></Card>
        <Card style={{padding:"10px 12px",borderTop:"3px solid "+T.yl}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:16}}>⏳</span><span style={{fontSize:17,fontWeight:800,color:T.yl}}>{pendientes}</span></div><div style={{fontSize:10,color:T.g4,marginTop:3}}>Pendientes</div></Card>
        <Card style={{padding:"10px 12px",borderTop:"3px solid "+T.bl}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:16}}>📊</span><span style={{fontSize:17,fontWeight:800,color:T.bl}}>{presu.length}</span></div><div style={{fontSize:10,color:T.g4,marginTop:3}}>Total Cotizaciones</div></Card>
        <Card style={{padding:"10px 12px",borderTop:"3px solid "+T.pr}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:16}}>⏱️</span><span style={{fontSize:17,fontWeight:800,color:T.pr}}>{avgDays}d</span></div><div style={{fontSize:10,color:T.g4,marginTop:3}}>Tiempo resp. prom.</div></Card>
      </div>
      {/* Auto PDF Report */}
      <div style={{marginBottom:14}}><Btn v="pu" s="s" onClick={()=>{const odPeds=peds.filter((p:any)=>p.st!==ST.OK&&isOD(p.fReq));const hdr=["KPI","Valor"];const rows=[["Total tareas",String(peds.length)],["Completadas",String(peds.filter((p:any)=>p.st===ST.OK).length)],["Pendientes",String(peds.filter((p:any)=>p.st===ST.P).length)],["En curso",String(peds.filter((p:any)=>p.st===ST.C).length)],["Vencidas",String(odPeds.length)],["---","---"],["Presupuesto aprobado","$"+totalApr.toLocaleString()],["Cotizaciones pendientes",String(pendientes)],["Tiempo respuesta prom.",avgDays+"d"],["---","---"],...odPeds.slice(0,10).map((p:any)=>["Vencida #"+p.id,p.desc.slice(0,40)+" ("+p.fReq+")"])];exportPDF("Reporte Los Tordos — "+TODAY,hdr,rows);}}>📄 Generar Reporte PDF</Btn></div>
      {areaGasto.length>0&&<Card style={{padding:14,marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:700,color:T.nv,marginBottom:10}}>Gasto aprobado por Área</div>
        {areaGasto.map((a:any)=><div key={a.id} style={{marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}><span style={{fontWeight:600,color:T.nv}}>{a.icon} {a.name}</span><span style={{fontWeight:700,color:T.gn}}>${a.gasto.toLocaleString()}</span></div>
          <div style={{height:8,background:T.g2,borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:Math.round(a.gasto/maxGasto*100)+"%",background:a.color,borderRadius:4}}/></div>
        </div>)}
      </Card>}
      {/* Tendencia mensual */}
      {(()=>{const meses=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];const now=new Date();const monthData:any[]=[];for(let i=5;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);const ym=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");const mPresu=presu.filter((pr:any)=>pr.solicitado_at&&pr.solicitado_at.startsWith(ym));const apr=mPresu.filter((pr:any)=>pr.status===PST.APR).reduce((s:number,pr:any)=>s+Number(pr.monto),0);const sol=mPresu.reduce((s:number,pr:any)=>s+Number(pr.monto),0);monthData.push({label:meses[d.getMonth()]+" "+String(d.getFullYear()).slice(2),apr,sol,count:mPresu.length});}
      const maxM=Math.max(...monthData.map((m:any)=>m.sol),1);
      return monthData.some((m:any)=>m.count>0)?<Card style={{padding:14,marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:700,color:T.nv,marginBottom:10}}>📈 Tendencia últimos 6 meses</div>
        <div style={{display:"flex",gap:mob?4:8,alignItems:"flex-end",height:120}}>
          {monthData.map((m:any,i:number)=><div key={i} style={{flex:1,display:"flex",flexDirection:"column" as const,alignItems:"center",gap:2}}>
            <span style={{fontSize:9,fontWeight:700,color:T.gn}}>{m.apr>0?"$"+Math.round(m.apr/1000)+"k":""}</span>
            <div style={{width:"100%",display:"flex",flexDirection:"column" as const,gap:1,justifyContent:"flex-end",height:80}}>
              <div style={{height:Math.max(2,Math.round(m.apr/maxM*80)),background:T.gn,borderRadius:3}} title={"Aprobado: $"+m.apr.toLocaleString()}/>
              <div style={{height:Math.max(2,Math.round((m.sol-m.apr)/maxM*80)),background:T.yl+"60",borderRadius:3}} title={"Pendiente: $"+(m.sol-m.apr).toLocaleString()}/>
            </div>
            <span style={{fontSize:9,color:T.g4,fontWeight:600}}>{m.label}</span>
            <span style={{fontSize:8,color:T.g5}}>{m.count}</span>
          </div>)}
        </div>
        <div style={{display:"flex",gap:12,marginTop:8,fontSize:10}}><span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:10,height:10,borderRadius:2,background:T.gn}}/> Aprobado</span><span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:10,height:10,borderRadius:2,background:T.yl+"60"}}/> Pendiente</span></div>
      </Card>:null;})()}
      {/* Top proveedores */}
      {(()=>{const provGasto:Record<string,{nombre:string;total:number;count:number}>={};presu.filter((pr:any)=>pr.status===PST.APR).forEach((pr:any)=>{const k=pr.proveedor_nombre||"?";if(!provGasto[k])provGasto[k]={nombre:k,total:0,count:0};provGasto[k].total+=Number(pr.monto);provGasto[k].count++;});const top=Object.values(provGasto).sort((a:any,b:any)=>b.total-a.total).slice(0,5);const maxProv=top.length?top[0].total:1;
      return top.length>0?<Card style={{padding:14,marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:700,color:T.nv,marginBottom:10}}>🏢 Top 5 Proveedores (aprobado)</div>
        {top.map((pv:any,i:number)=><div key={i} style={{marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}><span style={{fontWeight:600,color:T.nv}}>{i+1}. {pv.nombre} <span style={{color:T.g4,fontWeight:400}}>({pv.count} cotiz.)</span></span><span style={{fontWeight:700,color:T.pr}}>${pv.total.toLocaleString()}</span></div>
          <div style={{height:6,background:T.g2,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:Math.round(pv.total/maxProv*100)+"%",background:T.pr,borderRadius:3}}/></div>
        </div>)}
      </Card>:null;})()}
      {/* Carga de trabajo */}
      {(()=>{const workload:Record<string,{name:string;active:number;overdue:number;total:number}>={};peds.forEach((p:any)=>{if(!p.asTo)return;if(!workload[p.asTo])workload[p.asTo]={name:"",active:0,overdue:0,total:0};workload[p.asTo].total++;if(p.st!==ST.OK){workload[p.asTo].active++;if(isOD(p.fReq))workload[p.asTo].overdue++;}});Object.keys(workload).forEach(uid=>{const u=users.find((u2:any)=>u2.id===uid);workload[uid].name=u?fn(u):"?";});const sorted=Object.values(workload).sort((a:any,b:any)=>b.active-a.active).slice(0,10);const maxW=sorted.length?sorted[0].active:1;
      return sorted.length>0?<Card style={{padding:14}}>
        <div style={{fontSize:13,fontWeight:700,color:T.nv,marginBottom:10}}>👥 Carga de trabajo (tareas activas)</div>
        {sorted.map((w:any,i:number)=><div key={i} style={{marginBottom:6}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:2}}><span style={{fontWeight:600,color:T.nv}}>{w.name}</span><span style={{display:"flex",gap:6}}><span style={{fontWeight:700,color:T.yl}}>{w.active} activas</span>{w.overdue>0&&<span style={{fontWeight:700,color:"#DC2626"}}>⏰ {w.overdue}</span>}<span style={{color:T.g4}}>{w.total} total</span></span></div>
          <div style={{height:6,background:T.g2,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:Math.round(w.active/maxW*100)+"%",background:w.overdue>0?"#DC2626":w.active>5?T.yl:T.gn,borderRadius:3}}/></div>
        </div>)}
      </Card>:null;})()}
    </div>);
  }
  return null;
}
