"use client";
import { useState } from "react";
import { useC } from "@/lib/theme-context";
import { Btn } from "@/components/ui";
import * as XLSX from "xlsx";

const ACTIVO_COLS:{key:string,aliases:string[]}[]=[
  {key:"name",aliases:["nombre","name","descripcion","item"]},
  {key:"category",aliases:["categoria","category","cat"]},
  {key:"location",aliases:["ubicacion","location","lugar"]},
  {key:"quantity",aliases:["cantidad","quantity","qty","cant"]},
  {key:"condition",aliases:["condicion","condition","estado"]},
  {key:"brand",aliases:["marca","brand"]},
  {key:"model",aliases:["modelo","model"]},
  {key:"serial_number",aliases:["n_serie","serial","numero_serie","serial_number"]},
  {key:"purchase_date",aliases:["fecha_compra","purchase_date","fecha"]},
  {key:"warranty_until",aliases:["garantia_hasta","warranty_until","garantia"]},
  {key:"maint_frequency",aliases:["frec_mantenimiento","maint_frequency","frecuencia"]},
  {key:"notes",aliases:["notas","notes","observaciones"]},
];
const LOTE_COLS:{key:string,aliases:string[]}[]=[
  {key:"name",aliases:["nombre","name","descripcion","item"]},
  {key:"quantity",aliases:["cantidad","quantity","qty","cant"]},
  {key:"season",aliases:["temporada","season","ano","year"]},
  {key:"purchase_date",aliases:["fecha_compra","purchase_date","fecha"]},
  {key:"brand",aliases:["marca","brand"]},
  {key:"unit_cost",aliases:["costo_unitario","unit_cost","costo","precio"]},
  {key:"category",aliases:["categoria","category","cat"]},
  {key:"location",aliases:["ubicacion","location","lugar"]},
  {key:"notes",aliases:["notas","notes","observaciones"]},
];

const norm=(s:string)=>s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9_]/g,"_");

export function InvImport({itemType,onImport,onX,mob}:{itemType:"activo"|"lote",onImport:(rows:any[])=>void,onX:()=>void,mob?:boolean}){
  const{colors,cardBg}=useC();
  const [rows,sRows]=useState<any[]>([]);
  const [err,sErr]=useState("");
  const [mapped,sMapped]=useState<string[]>([]);

  const cols=itemType==="lote"?LOTE_COLS:ACTIVO_COLS;
  const colGuide=cols.map(c=>c.aliases[0]).join(", ");

  const parseFile=(file:File)=>{
    const reader=new FileReader();
    reader.onload=(ev:any)=>{
      try{
        const data=new Uint8Array(ev.target.result);
        const wb=XLSX.read(data,{type:"array"});
        const ws=wb.Sheets[wb.SheetNames[0]];
        const json:any[]=XLSX.utils.sheet_to_json(ws,{defval:""});
        if(!json.length){sErr("Archivo vacío o sin datos");sRows([]);return;}

        // Map headers
        const fileHeaders=Object.keys(json[0]);
        const headerMap:Record<string,string>={};
        const mappedKeys:string[]=[];
        for(const col of cols){
          const match=fileHeaders.find(fh=>col.aliases.includes(norm(fh)));
          if(match){headerMap[match]=col.key;mappedKeys.push(col.key);}
        }
        sMapped(mappedKeys);

        if(!headerMap[fileHeaders.find(fh=>cols[0].aliases.includes(norm(fh)))||""]){
          sErr("No se encontró columna 'nombre'. Columnas esperadas: "+colGuide);sRows([]);return;
        }

        // Build rows
        const parsed=json.map(row=>{
          const obj:any={item_type:itemType};
          for(const[fileKey,dbKey]of Object.entries(headerMap)){
            let val=row[fileKey];
            if(dbKey==="quantity"||dbKey==="unit_cost")val=Number(val)||( dbKey==="quantity"?1:0);
            else if(dbKey==="purchase_date"||dbKey==="warranty_until"){
              if(typeof val==="number"){const d=XLSX.SSF.parse_date_code(val);if(d)val=`${d.y}-${String(d.m).padStart(2,"0")}-${String(d.d).padStart(2,"0")}`;}
              else val=val?String(val).trim():"";
            }
            else val=String(val??"").trim();
            obj[dbKey]=val;
          }
          // defaults
          if(!obj.condition)obj.condition=itemType==="lote"?"nuevo":"bueno";
          if(!obj.category)obj.category=itemType==="lote"?"deportivo":"infraestructura";
          if(!obj.quantity)obj.quantity=1;
          if(itemType==="lote"&&!obj.season)obj.season=new Date().getFullYear().toString();
          if(!obj.purchase_date)obj.purchase_date=null;
          if(!obj.warranty_until)obj.warranty_until=null;
          return obj;
        }).filter(r=>r.name);

        if(!parsed.length){sErr("No se encontraron filas con nombre");sRows([]);return;}
        sRows(parsed);sErr("");
      }catch(e:any){sErr("Error al leer archivo: "+(e.message||"formato inválido"));sRows([]);}
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFile=(e:any)=>{const f=e.target.files?.[0];if(!f)return;parseFile(f);};

  const previewCols=itemType==="lote"
    ?[{k:"name",l:"Nombre"},{k:"quantity",l:"Cant"},{k:"season",l:"Temp"},{k:"brand",l:"Marca"},{k:"unit_cost",l:"Costo"}]
    :[{k:"name",l:"Nombre"},{k:"category",l:"Cat"},{k:"location",l:"Ubic"},{k:"quantity",l:"Cant"},{k:"condition",l:"Cond"}];

  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}} onClick={onX}>
    <div onClick={e=>e.stopPropagation()} style={{background:cardBg,borderRadius:14,padding:24,width:560,maxWidth:"92vw",maxHeight:"80vh",overflow:"auto",boxShadow:"0 8px 32px rgba(0,0,0,.15)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h3 style={{margin:0,fontSize:16,color:colors.nv}}>Importar {itemType==="lote"?"Lotes":"Activos"} (Excel/CSV)</h3>
        <button onClick={onX} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:colors.g4}}>✕</button>
      </div>
      <div style={{padding:10,background:colors.g1,borderRadius:8,marginBottom:12,fontSize:11,color:colors.g5}}>
        <strong>Columnas esperadas:</strong> {colGuide}
        <br/><span style={{fontSize:10,opacity:.7}}>Solo &quot;nombre&quot; es obligatoria. Los headers se detectan automáticamente (tildes opcionales).</span>
      </div>
      <input type="file" accept=".xlsx,.csv,.xls" onChange={handleFile} style={{marginBottom:12,fontSize:12}}/>
      {err&&<div style={{color:colors.rd||"#DC2626",fontSize:11,marginBottom:8,padding:"6px 10px",background:"#FEF2F2",borderRadius:6}}>{err}</div>}
      {rows.length>0&&<div>
        <div style={{fontSize:11,fontWeight:700,color:colors.nv,marginBottom:4}}>{rows.length} items encontrados</div>
        {mapped.length<cols.length&&<div style={{fontSize:10,color:"#F59E0B",marginBottom:6}}>Columnas no encontradas: {cols.filter(c=>!mapped.includes(c.key)).map(c=>c.aliases[0]).join(", ")}</div>}
        <div style={{maxHeight:220,overflow:"auto",border:"1px solid "+colors.g2,borderRadius:8,marginBottom:12}}>
          <table style={{width:"100%",borderCollapse:"collapse" as const,fontSize:10}}>
            <thead><tr style={{background:colors.g1}}>
              {previewCols.map(c=><th key={c.k} style={{padding:"4px 6px",textAlign:"left" as const,fontWeight:600,color:colors.g5}}>{c.l}</th>)}
            </tr></thead>
            <tbody>
              {rows.slice(0,50).map((r,i)=><tr key={i} style={{borderBottom:"1px solid "+colors.g1}}>
                {previewCols.map(c=><td key={c.k} style={{padding:"4px 6px"}}>{c.k==="name"?String(r[c.k]||"").slice(0,40):String(r[c.k]??"")}</td>)}
              </tr>)}
              {rows.length>50&&<tr><td colSpan={previewCols.length} style={{padding:4,textAlign:"center",fontSize:10,color:colors.g4}}>...y {rows.length-50} más</td></tr>}
            </tbody>
          </table>
        </div>
        <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
          <Btn v="g" onClick={onX}>Cancelar</Btn>
          <Btn v="s" onClick={()=>{onImport(rows);onX();}}>Importar {rows.length} items</Btn>
        </div>
      </div>}
    </div>
  </div>);
}
