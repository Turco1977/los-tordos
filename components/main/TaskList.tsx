"use client";
import { useState } from "react";
import { T, TIPOS, ST, SC, fn, isOD } from "@/lib/constants";
import { rlv } from "@/lib/mappers";
import { useC } from "@/lib/theme-context";
import { Btn, Card, Pager, Badge } from "@/components/ui";
import { paginate } from "@/lib/pagination";
import { exportCSV, exportPDF } from "@/lib/export";

export function TList({title,icon,color,peds,users,onSel,search,mob,onBulk,onImport,user}:any){
  const{colors,isDark,cardBg}=useC();
  const [f,sF]=useState("all");
  const [pg,sPg]=useState(1);
  const [bulkSel,sBulkSel]=useState<number[]>([]);
  const [showImport,sShowImport]=useState(false);
  const [showFilters,sShowFilters]=useState(false);
  const [fTipo,sFTipo]=useState("");
  const [fUrg,sFUrg]=useState("");
  const [fAsTo,sFAsTo]=useState("");
  const [fDateFrom,sFDateFrom]=useState("");
  const [fDateTo,sFDateTo]=useState("");
  const [sortBy,sSortBy]=useState("id");const [sortDir,sSortDir]=useState<"asc"|"desc">("desc");
  const PER_PAGE=20;
  let v=f==="all"?peds:peds.filter((p:any)=>p.st===f);
  if(search){const s=search.toLowerCase();v=v.filter((p:any)=>(p.desc+p.cN+p.tipo+p.div+(p.id+"")).toLowerCase().includes(s));}
  if(fTipo)v=v.filter((p:any)=>p.tipo===fTipo);
  if(fUrg)v=v.filter((p:any)=>p.urg===fUrg);
  if(fAsTo)v=v.filter((p:any)=>p.asTo===fAsTo);
  if(fDateFrom)v=v.filter((p:any)=>p.fReq>=fDateFrom);
  if(fDateTo)v=v.filter((p:any)=>p.fReq<=fDateTo);
  v=[...v].sort((a:any,b:any)=>{const dir=sortDir==="asc"?1:-1;if(sortBy==="date")return((a.fReq||"").localeCompare(b.fReq||""))*dir;if(sortBy==="tipo")return((a.tipo||"").localeCompare(b.tipo||""))*dir;return(a.id-b.id)*dir;});
  const allFiltered=v;
  const pgData=paginate(v,pg,PER_PAGE);v=pgData.data;
  const doExport=(fmt:"csv"|"pdf")=>{
    const headers=["#","Tipo","Descripción","Solicitante","Fecha","Estado","Asignado"];
    const rows=allFiltered.map((p:any)=>{const ag=users.find((u:any)=>u.id===p.asTo);return[String(p.id),p.tipo,p.desc,p.cN,p.fReq,SC[p.st]?.l||p.st,ag?fn(ag):"–"];});
    if(fmt==="csv") exportCSV("tareas-"+title.replace(/\s/g,"_"),headers,rows);
    else exportPDF("Tareas — "+title,headers,rows,{landscape:true});
  };
  const odBg=isDark?"#451A1A":"#FEF2F2";
  const toggleBulk=(id:number)=>sBulkSel(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const allVis=v.map((p:any)=>p.id);
  const allSelected=allVis.length>0&&allVis.every((id:number)=>bulkSel.includes(id));
  return(<div>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,justifyContent:"space-between"}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:30,height:30,borderRadius:8,background:color+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>{icon}</div><div><h2 style={{margin:0,fontSize:mob?14:16,color:colors.nv,fontWeight:800}}>{title}</h2><p style={{margin:0,fontSize:11,color:colors.g4}}>{allFiltered.length} tareas</p></div></div><div style={{display:"flex",gap:4}}>{allFiltered.length>0&&<><Btn v="g" s="s" onClick={()=>doExport("csv")}>CSV</Btn><Btn v="g" s="s" onClick={()=>doExport("pdf")}>PDF</Btn></>}{onImport&&user&&(user.role==="superadmin"||user.role==="admin")&&<Btn v="g" s="s" onClick={()=>sShowImport(true)}>📥 Importar</Btn>}</div></div>
    {/* Bulk action bar (Feature 3) */}
    {bulkSel.length>0&&onBulk&&<div style={{display:"flex",gap:6,alignItems:"center",padding:"6px 10px",background:colors.nv+"10",borderRadius:8,marginBottom:8,flexWrap:"wrap" as const}}>
      <label style={{display:"flex",alignItems:"center",gap:4,fontSize:10,cursor:"pointer"}}><input type="checkbox" checked={allSelected} onChange={()=>{if(allSelected)sBulkSel([]);else sBulkSel(allVis);}}/><span style={{fontWeight:600}}>Todos</span></label>
      <span style={{fontSize:10,fontWeight:700,color:colors.nv}}>{bulkSel.length} seleccionados</span>
      <select onChange={e=>{if(e.target.value){onBulk(bulkSel,"status",e.target.value);sBulkSel([]);}}} style={{padding:"3px 6px",borderRadius:6,border:"1px solid "+colors.g3,fontSize:10}} defaultValue=""><option value="">Cambiar estado...</option>{Object.keys(SC).map(k=><option key={k} value={k}>{SC[k].l}</option>)}</select>
      <select onChange={e=>{if(e.target.value){onBulk(bulkSel,"assign",e.target.value);sBulkSel([]);}}} style={{padding:"3px 6px",borderRadius:6,border:"1px solid "+colors.g3,fontSize:10}} defaultValue=""><option value="">Asignar a...</option>{users.filter((u:any)=>rlv(u.role)>=2).map((u:any)=><option key={u.id} value={u.id}>{fn(u)}</option>)}</select>
      <Btn v="g" s="s" onClick={()=>sBulkSel([])}>✕ Limpiar</Btn>
    </div>}
    <div style={{display:"flex",gap:6,marginBottom:8,alignItems:"center",flexWrap:"wrap" as const}}>
      <Btn v={showFilters?"p":"g"} s="s" onClick={()=>sShowFilters(!showFilters)}>🔍 Filtros{(fTipo||fUrg||fAsTo||fDateFrom||fDateTo)?" •":""}</Btn>
      <div style={{display:"flex",gap:4,alignItems:"center"}}>
        <select value={sortBy} onChange={e=>{sSortBy(e.target.value);sPg(1);}} style={{padding:"4px 8px",borderRadius:6,border:"1px solid "+colors.g3,fontSize:10,background:cardBg,color:colors.nv}}>
          <option value="id">Ordenar: #ID</option><option value="date">Ordenar: Fecha</option><option value="tipo">Ordenar: Tipo</option>
        </select>
        <button onClick={()=>{sSortDir(d=>d==="asc"?"desc":"asc");sPg(1);}} style={{padding:"3px 6px",borderRadius:6,border:"1px solid "+colors.g3,background:cardBg,fontSize:10,cursor:"pointer",color:colors.nv}}>{sortDir==="asc"?"↑":"↓"}</button>
      </div>
    </div>
    {showFilters&&<div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap" as const,padding:10,background:colors.g1,borderRadius:8}}>
      <select value={fTipo} onChange={e=>{sFTipo(e.target.value);sPg(1);}} style={{padding:"5px 8px",borderRadius:6,border:"1px solid "+colors.g3,fontSize:10,background:cardBg,color:colors.nv}}><option value="">Tipo: Todos</option>{TIPOS.map(t=><option key={t} value={t}>{t}</option>)}</select>
      <select value={fUrg} onChange={e=>{sFUrg(e.target.value);sPg(1);}} style={{padding:"5px 8px",borderRadius:6,border:"1px solid "+colors.g3,fontSize:10,background:cardBg,color:colors.nv}}><option value="">Urgencia: Todas</option><option value="Normal">Normal</option><option value="Urgente">Urgente</option></select>
      <select value={fAsTo} onChange={e=>{sFAsTo(e.target.value);sPg(1);}} style={{padding:"5px 8px",borderRadius:6,border:"1px solid "+colors.g3,fontSize:10,background:cardBg,color:colors.nv}}><option value="">Asignado: Todos</option>{users.filter((u:any)=>rlv(u.role)>=2).map((u:any)=><option key={u.id} value={u.id}>{fn(u)}</option>)}</select>
      <input type="date" value={fDateFrom} onChange={e=>{sFDateFrom(e.target.value);sPg(1);}} style={{padding:"4px 6px",borderRadius:6,border:"1px solid "+colors.g3,fontSize:10,background:cardBg,color:colors.nv}} title="Desde"/>
      <input type="date" value={fDateTo} onChange={e=>{sFDateTo(e.target.value);sPg(1);}} style={{padding:"4px 6px",borderRadius:6,border:"1px solid "+colors.g3,fontSize:10,background:cardBg,color:colors.nv}} title="Hasta"/>
      {(fTipo||fUrg||fAsTo||fDateFrom||fDateTo)&&<button onClick={()=>{sFTipo("");sFUrg("");sFAsTo("");sFDateFrom("");sFDateTo("");sPg(1);}} style={{padding:"4px 8px",borderRadius:6,border:"none",background:colors.rd,color:"#fff",fontSize:10,fontWeight:600,cursor:"pointer"}}>✕ Limpiar</button>}
    </div>}
    <div style={{display:"flex",gap:4,marginBottom:10,flexWrap:"wrap" as const}}><Btn v={f==="all"?"p":"g"} s="s" onClick={()=>{sF("all");sPg(1);}}>Todos</Btn>{Object.keys(SC).map(k=><Btn key={k} v={f===k?"p":"g"} s="s" onClick={()=>{sF(f===k?"all":k);sPg(1);}}>{SC[k].i} {peds.filter((p:any)=>p.st===k).length}</Btn>)}</div>
    {mob?<div style={{display:"flex",flexDirection:"column" as const,gap:8}}>
      {v.length===0&&<Card style={{textAlign:"center" as const,padding:24,color:colors.g4}}>Sin tareas</Card>}
      {v.map((p:any)=>{const ag=users.find((u:any)=>u.id===p.asTo),od=p.st!==ST.OK&&isOD(p.fReq);return(<Card key={p.id} style={{padding:"10px 14px",cursor:"pointer",borderLeft:"4px solid "+SC[p.st].c,background:od?odBg:cardBg,display:"flex",gap:8,alignItems:"start"}}>
        {onBulk&&<input type="checkbox" checked={bulkSel.includes(p.id)} onChange={()=>toggleBulk(p.id)} onClick={(e:any)=>e.stopPropagation()} style={{width:14,height:14,marginTop:4,flexShrink:0}}/>}
        <div onClick={()=>onSel(p)} style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><span style={{fontSize:10,fontWeight:600,color:colors.nv}}>#{p.id}</span><Badge s={p.st} sm/>{od&&<span style={{fontSize:9,color:"#DC2626"}}>⏰</span>}{p.urg==="Urgente"&&<span style={{fontSize:9,color:colors.rd}}>🔥</span>}</div>
          <div style={{fontSize:12,fontWeight:700,color:colors.nv,marginBottom:3}}>{p.desc}</div>
          <div style={{fontSize:10,color:colors.g5}}>{p.tipo} · 📅 {p.fReq}{ag?" · ⚙️ "+fn(ag):""}</div>
        </div>
      </Card>);})}
    </div>
    :<Card style={{padding:0,overflow:"hidden"}}><table style={{width:"100%",borderCollapse:"collapse" as const,fontSize:12,color:colors.nv}}><thead><tr style={{background:colors.g1}}>{[...(onBulk?[""]:[]),"#","Tipo","Solicitante","Fecha","Estado","Asignado"].map((h,i)=><th key={i} style={{padding:"7px 8px",textAlign:"left" as const,fontSize:10,color:colors.g4,fontWeight:700,width:i===0&&onBulk?24:undefined}}>{h}</th>)}</tr></thead><tbody>
      {v.length===0&&<tr><td colSpan={onBulk?7:6} style={{padding:28,textAlign:"center" as const,color:colors.g4}}>Sin tareas</td></tr>}
      {v.map((p:any)=>{const ag=users.find((u:any)=>u.id===p.asTo),od=p.st!==ST.OK&&isOD(p.fReq);return(<tr key={p.id} onClick={()=>onSel(p)} style={{borderBottom:"1px solid "+colors.g1,cursor:"pointer",background:od?odBg:"transparent"}}>{onBulk&&<td style={{padding:"7px 4px"}} onClick={e=>e.stopPropagation()}><input type="checkbox" checked={bulkSel.includes(p.id)} onChange={()=>toggleBulk(p.id)} style={{width:14,height:14}}/></td>}<td style={{padding:"7px 8px",fontWeight:600,color:colors.nv}}>{p.id}</td><td style={{padding:"7px 8px"}}>{p.tipo}</td><td style={{padding:"7px 8px",fontSize:11}}>{p.cN}</td><td style={{padding:"7px 8px",fontSize:11}}>{p.fReq}{od&&<span style={{marginLeft:4,fontSize:9,color:"#DC2626"}}>⏰</span>}</td><td style={{padding:"7px 8px"}}><Badge s={p.st} sm/></td><td style={{padding:"7px 8px",fontSize:11,color:colors.g4}}>{ag?fn(ag):"–"}</td></tr>);})}
    </tbody></table></Card>}
    <Pager page={pgData.page} totalPages={pgData.totalPages} onPage={(p:number)=>{sPg(p);window.scrollTo({top:0,behavior:"smooth"});}}/>
  </div>);
}
