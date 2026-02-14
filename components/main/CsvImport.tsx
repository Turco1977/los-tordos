"use client";
import { useState } from "react";
import { useC } from "@/lib/theme-context";
import { Btn } from "@/components/ui";

export function CsvImport({user,onImport,onX,mob}:any){
  const{colors,cardBg}=useC();
  const [rows,sRows]=useState<any[]>([]);const [err,sErr]=useState("");
  const parseCSV=(txt:string)=>{
    const lines=txt.trim().split("\n");if(lines.length<2){sErr("CSV debe tener encabezados + datos");return;}
    const hdr=lines[0].split(",").map(h=>h.trim().toLowerCase());
    const req=["tipo","descripcion","fecha_limite"];
    if(!req.every(r=>hdr.includes(r))){sErr("Columnas requeridas: tipo, descripcion, fecha_limite");return;}
    const parsed=lines.slice(1).map(line=>{const vals=line.split(",").map(v=>v.trim());const obj:any={};hdr.forEach((h,i)=>obj[h]=vals[i]||"");return obj;}).filter(r=>r.tipo&&r.descripcion&&r.fecha_limite);
    sRows(parsed);sErr("");
  };
  const handleFile=(e:any)=>{const f=e.target.files?.[0];if(!f)return;const reader=new FileReader();reader.onload=(ev:any)=>parseCSV(ev.target.result);reader.readAsText(f);};
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}} onClick={onX}>
    <div onClick={e=>e.stopPropagation()} style={{background:cardBg,borderRadius:14,padding:24,width:500,maxWidth:"90vw",maxHeight:"80vh",overflow:"auto",boxShadow:"0 8px 32px rgba(0,0,0,.15)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h3 style={{margin:0,fontSize:16,color:colors.nv}}>Importar CSV</h3><button onClick={onX} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:colors.g4}}>✕</button></div>
      <div style={{padding:10,background:colors.g1,borderRadius:8,marginBottom:12,fontSize:11,color:colors.g5}}>Columnas: tipo, descripcion, fecha_limite, division (opc), urgencia (opc)</div>
      <input type="file" accept=".csv" onChange={handleFile} style={{marginBottom:12,fontSize:12}}/>
      {err&&<div style={{color:colors.rd,fontSize:11,marginBottom:8}}>{err}</div>}
      {rows.length>0&&<div>
        <div style={{fontSize:11,fontWeight:700,color:colors.nv,marginBottom:6}}>{rows.length} tareas encontradas</div>
        <div style={{maxHeight:200,overflow:"auto",border:"1px solid "+colors.g2,borderRadius:8,marginBottom:12}}>
          <table style={{width:"100%",borderCollapse:"collapse" as const,fontSize:10}}><thead><tr style={{background:colors.g1}}><th style={{padding:4,textAlign:"left" as const}}>Tipo</th><th style={{padding:4,textAlign:"left" as const}}>Descripcion</th><th style={{padding:4,textAlign:"left" as const}}>Fecha</th></tr></thead><tbody>
            {rows.map((r,i)=><tr key={i} style={{borderBottom:"1px solid "+colors.g1}}><td style={{padding:4}}>{r.tipo}</td><td style={{padding:4}}>{r.descripcion?.slice(0,40)}</td><td style={{padding:4}}>{r.fecha_limite}</td></tr>)}
          </tbody></table>
        </div>
        <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}><Btn v="g" onClick={onX}>Cancelar</Btn><Btn v="s" onClick={()=>{onImport(rows);onX();}}>Importar {rows.length} tareas</Btn></div>
      </div>}
    </div>
  </div>);
}
