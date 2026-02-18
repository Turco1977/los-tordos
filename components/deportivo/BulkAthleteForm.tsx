"use client";
import { useState } from "react";
import { T, DEP_DIV, DEP_POSITIONS } from "@/lib/constants";
import type { DepAthlete } from "@/lib/supabase/types";
import { Btn, Card } from "@/components/ui";

type BulkRow={first_name:string;last_name:string;division:string;position:string;_err?:boolean};
const emptyRow=():BulkRow=>({first_name:"",last_name:"",division:DEP_DIV[0],position:"",_err:false});

export function BulkAthleteForm({onSave,onCancel,mob}:{onSave:(rows:Partial<DepAthlete>[])=>void;onCancel:()=>void;mob:boolean}){
  const [mode,sMode]=useState<"paste"|"table">("paste");
  const [rows,sRows]=useState<BulkRow[]>(Array.from({length:5},emptyRow));
  const [pasteVal,sPasteVal]=useState("");
  const [saving,sSaving]=useState(false);

  const divSet=new Set(DEP_DIV.map(d=>d.toLowerCase()));
  const posSet=new Set(DEP_POSITIONS.map(p=>p.toLowerCase()));

  const matchDiv=(v:string):string=>{
    const low=v.trim().toLowerCase();
    const exact=DEP_DIV.find(d=>d.toLowerCase()===low);
    if(exact) return exact;
    const partial=DEP_DIV.find(d=>d.toLowerCase().includes(low));
    return partial||"";
  };
  const matchPos=(v:string):string=>{
    const low=v.trim().toLowerCase();
    const exact=DEP_POSITIONS.find(p=>p.toLowerCase()===low);
    if(exact) return exact;
    const partial=DEP_POSITIONS.find(p=>p.toLowerCase().includes(low));
    return partial||v.trim();
  };

  const parsePaste=()=>{
    const lines=pasteVal.trim().split("\n").filter(l=>l.trim());
    if(lines.length===0) return;
    const parsed:BulkRow[]=lines.map(line=>{
      const sep=line.includes("\t")?"\t":",";
      const cols=line.split(sep).map(c=>c.trim());
      const first_name=cols[0]||"";
      const last_name=cols[1]||"";
      const rawDiv=cols[2]||"";
      const rawPos=cols[3]||"";
      const division=matchDiv(rawDiv);
      const position=matchPos(rawPos);
      return{first_name,last_name,division:division||DEP_DIV[0],position,_err:rawDiv!==""&&!division};
    });
    sRows(parsed);
    sMode("table");
  };

  const updRow=(i:number,field:keyof BulkRow,val:string)=>{
    sRows(prev=>prev.map((r,j)=>j===i?{...r,[field]:val,_err:false}:r));
  };
  const addRow=()=>sRows(prev=>[...prev,emptyRow()]);
  const delRow=(i:number)=>sRows(prev=>prev.filter((_,j)=>j!==i));

  const validRows=rows.filter(r=>r.first_name.trim()&&r.last_name.trim());

  const handleSave=async()=>{
    if(validRows.length===0) return;
    sSaving(true);
    await onSave(validRows.map(r=>({first_name:r.first_name.trim(),last_name:r.last_name.trim(),division:r.division,position:r.position})));
    sSaving(false);
  };

  const inputSt:any={width:"100%",padding:"6px 8px",borderRadius:6,border:"1px solid "+T.g3,fontSize:11,boxSizing:"border-box" as const};
  const selectSt:any={...inputSt,background:"#fff"};

  return <div>
    <Btn v="g" s="s" onClick={onCancel} style={{marginBottom:12}}>← Cancelar</Btn>
    <h2 style={{fontSize:16,color:T.nv,margin:"0 0 14px"}}>⚡ Carga rápida de jugadores</h2>

    {/* Mode tabs */}
    <div style={{display:"flex",gap:4,marginBottom:14}}>
      {([["paste","Pegar datos"],["table","Tabla manual"]] as const).map(([k,l])=>
        <button key={k} onClick={()=>sMode(k)} style={{padding:"6px 16px",borderRadius:8,border:mode===k?"2px solid "+T.nv:"1px solid "+T.g3,background:mode===k?T.nv+"10":"#fff",color:mode===k?T.nv:T.g5,fontSize:12,fontWeight:600,cursor:"pointer"}}>{l}</button>
      )}
    </div>

    {/* Paste mode */}
    {mode==="paste"&&<Card style={{marginBottom:14}}>
      <h3 style={{margin:"0 0 8px",fontSize:13,color:T.nv}}>Pegá desde Excel o CSV</h3>
      <p style={{fontSize:11,color:T.g5,margin:"0 0 8px"}}>Formato: Nombre, Apellido, División, Posición (una fila por jugador)</p>
      <textarea value={pasteVal} onChange={e=>sPasteVal(e.target.value)} placeholder={"Juan\tPérez\tPrimera\tApertura\nMarcos\tGómez\tIntermedia\tPilar"} rows={8} style={{width:"100%",padding:10,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,fontFamily:"monospace",resize:"vertical" as const,boxSizing:"border-box" as const}}/>
      <div style={{display:"flex",gap:8,marginTop:10}}>
        <Btn v="p" onClick={parsePaste} disabled={!pasteVal.trim()}>Cargar en tabla</Btn>
        <Btn v="g" onClick={onCancel}>Cancelar</Btn>
      </div>
    </Card>}

    {/* Table mode */}
    {mode==="table"&&<Card>
      <div style={{overflowX:"auto" as const}}>
        <table style={{width:"100%",borderCollapse:"collapse" as const,fontSize:11}}>
          <thead><tr style={{borderBottom:"2px solid "+T.g2}}>
            <th style={{textAlign:"left" as const,padding:"6px 4px",color:T.g5,fontWeight:700,width:"5%"}}>#</th>
            <th style={{textAlign:"left" as const,padding:"6px 4px",color:T.g5,fontWeight:700,width:"25%"}}>Nombre *</th>
            <th style={{textAlign:"left" as const,padding:"6px 4px",color:T.g5,fontWeight:700,width:"25%"}}>Apellido *</th>
            <th style={{textAlign:"left" as const,padding:"6px 4px",color:T.g5,fontWeight:700,width:"20%"}}>División</th>
            <th style={{textAlign:"left" as const,padding:"6px 4px",color:T.g5,fontWeight:700,width:"20%"}}>Posición</th>
            <th style={{padding:"6px 4px",width:"5%"}}></th>
          </tr></thead>
          <tbody>{rows.map((r,i)=><tr key={i} style={{borderBottom:"1px solid "+T.g1,background:r._err?"#FEF2F2":"transparent"}}>
            <td style={{padding:"4px",color:T.g4,fontSize:10}}>{i+1}</td>
            <td style={{padding:"4px"}}><input value={r.first_name} onChange={e=>updRow(i,"first_name",e.target.value)} style={inputSt}/></td>
            <td style={{padding:"4px"}}><input value={r.last_name} onChange={e=>updRow(i,"last_name",e.target.value)} style={inputSt}/></td>
            <td style={{padding:"4px"}}><select value={r.division} onChange={e=>updRow(i,"division",e.target.value)} style={{...selectSt,borderColor:r._err?T.rd:T.g3}}>{DEP_DIV.map(d=><option key={d} value={d}>{d}</option>)}</select></td>
            <td style={{padding:"4px"}}><select value={r.position} onChange={e=>updRow(i,"position",e.target.value)} style={selectSt}><option value="">–</option>{DEP_POSITIONS.map(p=><option key={p} value={p}>{p}</option>)}</select></td>
            <td style={{padding:"4px",textAlign:"center" as const}}><button onClick={()=>delRow(i)} style={{background:"none",border:"none",cursor:"pointer",color:T.rd,fontSize:14,padding:2}} title="Eliminar fila">×</button></td>
          </tr>)}</tbody>
        </table>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:12}}>
        <Btn v="g" s="s" onClick={addRow}>+ Fila</Btn>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <span style={{fontSize:11,color:T.g5}}>{validRows.length} jugador{validRows.length!==1?"es":""} válido{validRows.length!==1?"s":""}</span>
          <Btn v="p" onClick={handleSave} disabled={validRows.length===0||saving}>{saving?"Guardando...":"Guardar todos"}</Btn>
          <Btn v="g" onClick={onCancel}>Cancelar</Btn>
        </div>
      </div>
      {rows.some(r=>r._err)&&<div style={{marginTop:8,fontSize:11,color:T.rd,fontWeight:600}}>⚠ Las filas en rojo tienen una división no reconocida. Revisá y corregí antes de guardar.</div>}
    </Card>}
  </div>;
}
