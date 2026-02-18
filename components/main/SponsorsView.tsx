"use client";
import { useState, useMemo, useRef } from "react";
import { SPON_ST, DOLAR_REF } from "@/lib/constants";
import { fmtD } from "@/lib/mappers";
import { Btn, Card } from "@/components/ui";
import { useC } from "@/lib/theme-context";
import { useDataStore } from "@/lib/store";

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
});

export function SponsorsView({user,mob,onAdd,onUpd,onDel,canjeUsado}:any){
  const sponsors = useDataStore(s => s.sponsors);
  const{colors,isDark,cardBg}=useC();
  const isSA=user?.role==="superadmin";
  const isJH=user&&(user.n||user.first_name||"").toLowerCase().includes("jes")&&(user.a||user.last_name||"").toLowerCase().includes("herrera");
  const canFullEdit=isSA||isJH;
  const [dolarRef,sDolarRef]=useState(()=>{if(typeof window!=="undefined"){const v=localStorage.getItem("lt_dolar_ref");if(v)return Number(v);}return DOLAR_REF;});
  const [editDolar,sEditDolar]=useState(false);
  const [dolarInput,sDolarInput]=useState(String(dolarRef));
  const saveDolar=()=>{const n=Number(dolarInput);if(n>0){sDolarRef(n);localStorage.setItem("lt_dolar_ref",String(n));}sEditDolar(false);};
  const [search,sSr]=useState("");
  const [fSt,sFSt]=useState("all");
  const [showForm,sShowForm]=useState(false);
  const [editId,sEditId]=useState<string|null>(null);
  const [expandId,sExpandId]=useState<string|null>(null);
  const [form,sForm]=useState(emptyForm());
  const [confirmDel,sConfirmDel]=useState<string|null>(null);
  const [importing,sImporting]=useState(false);
  const [importPreview,sImportPreview]=useState<any[]|null>(null);
  const fileRef=useRef<HTMLInputElement>(null);

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
    /* Classify each column */
    const cols=headers.map((h,i)=>({i,h,...classifyCol(h)}));
    /* If no column classified as "name", use the first column with text values */
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
      const XLSX=await import("xlsx");
      const data=new Uint8Array(await file.arrayBuffer());
      const wb=XLSX.read(data);
      const ws=wb.Sheets[wb.SheetNames[0]];
      const raw:any[][]=XLSX.utils.sheet_to_json(ws,{header:1,defval:"",blankrows:false});
      if(!raw.length){sImportErr("El archivo no tiene datos");return;}
      /* Find header row by keyword matching */
      const HKWS=["aporte","sponsor","nombre","exposic","periodo","período","varios","observ","pago","canjes","servicio"];
      let hIdx=-1;
      for(let i=0;i<Math.min(raw.length,15);i++){
        const cells=(raw[i]||[]).map((c:any)=>String(c||"").toLowerCase().trim());
        if(cells.filter(c=>HKWS.some(kw=>c.includes(kw))).length>=2){hIdx=i;break;}
      }
      /* Fallback: first row with 3+ non-empty cells */
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
    });
    sEditId(sp.id);sShowForm(true);
  };
  const closeForm=()=>{sShowForm(false);sEditId(null);sForm(emptyForm());};
  const saveForm=async()=>{
    const cash=Number(form.amount_cash)||0;
    const service=Number(form.amount_service)||0;
    const payload={
      name:form.name,
      amount_cash:cash,
      amount_service:service,
      amount:cash+service,
      end_date:form.end_date||null,
      exposure:form.exposure,
      notes:form.notes,
      status:form.status,
      payment_type:form.payment_type,
    };
    try{
      if(editId){await onUpd(editId,payload);}else{await onAdd(payload);}
      closeForm();
    }catch(e:any){sImportErr(e.message||"Error al guardar sponsor");}
  };

  /* ── Inline edit helpers ── */
  const inlineUpd=(sp:any,field:string,val:any)=>{
    const upd:any={[field]:val};
    // Recalculate total amount when cash or service changes
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
          {/* Service arc (background full circle) */}
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#3B82F6" strokeWidth={size/8} />
          {/* Cash arc on top */}
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

  return(<div style={{maxWidth:900}}>
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

        {/* Notes */}
        <div style={{marginBottom:12}}>
          <label style={lbl}>Varios / Observaciones</label>
          <textarea value={form.notes} onChange={e=>sForm(p=>({...p,notes:e.target.value}))} rows={3} style={{...inp,resize:"vertical" as const}} placeholder="Detalles adicionales..."/>
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
        const isOpen=expandId===sp.id;
        const cash=Number(sp.amount_cash||0);
        const service=Number(sp.amount_service||0);
        const total=cash+service;
        const monthly=isMensual(sp.payment_type);

        return(<Card key={sp.id} style={{padding:0,overflow:"hidden",borderLeft:"4px solid "+st.c,cursor:"pointer",transition:"box-shadow .2s",boxShadow:isOpen?"0 4px 16px rgba(0,0,0,.1)":"none"}} onClick={()=>sExpandId(isOpen?null:sp.id)}>
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
                  <span style={{fontSize:9,fontWeight:700,color:"#3B82F6"}}>🔄 Canjes</span>
                  <span style={{fontSize:9,fontWeight:700,color:barC}}>{pct}% usado</span>
                </div>
                <div style={{height:6,background:isDark?"#334155":"#E2E8F0",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:pct+"%",background:barC,borderRadius:3,transition:"width .3s"}}/></div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
                  <span style={{fontSize:8,color:colors.g5}}>Usado: {fmtARS(usado)}</span>
                  <span style={{fontSize:8,fontWeight:700,color:disp>0?"#059669":"#DC2626"}}>Disponible: {fmtARS(disp)}</span>
                </div>
                {usado===0&&<div style={{marginTop:3,fontSize:8,fontWeight:700,color:"#F59E0B",background:"#FEF3C7",padding:"1px 6px",borderRadius:4,display:"inline-block"}}>⚠️ Sin usar</div>}
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
            {sp.notes&&!isOpen&&<div style={{marginTop:4,fontSize:10,color:colors.g5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{sp.notes}</div>}
          </div>

          {/* ── Expanded inline edit ── */}
          {isOpen&&<div style={{borderTop:"1px solid "+colors.g2,padding:"12px 14px",background:isDark?"rgba(255,255,255,.03)":"#FAFAFA"}} onClick={e=>e.stopPropagation()}>
            {/* Name */}
            <div style={{marginBottom:8}}>
              <label style={lbl}>Sponsor</label>
              <input value={sp.name||""} onChange={e=>inlineUpd(sp,"name",e.target.value)} style={inp}/>
            </div>
            {/* Cash + Service amounts */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
              <div>
                <label style={lbl}>Aporte $ (Efectivo)</label>
                <input type="number" value={sp.amount_cash||""} onChange={e=>inlineUpd(sp,"amount_cash",Number(e.target.value)||0)} style={inp}/>
              </div>
              <div>
                <label style={lbl}>Aporte Pro/Ser (Canjes)</label>
                <input type="number" value={sp.amount_service||""} onChange={e=>inlineUpd(sp,"amount_service",Number(e.target.value)||0)} style={inp}/>
              </div>
            </div>
            {/* End date + Status */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
              <div>
                <label style={lbl}>Período / Vencimiento</label>
                <input type="date" value={sp.end_date||""} onChange={e=>inlineUpd(sp,"end_date",e.target.value)} style={inp}/>
              </div>
              <div>
                <label style={lbl}>Estado</label>
                <select value={sp.status||"active"} onChange={e=>inlineUpd(sp,"status",e.target.value)} style={inp}>
                  {Object.keys(SPON_ST).map(k=><option key={k} value={k}>{SPON_ST[k].l}</option>)}
                </select>
              </div>
            </div>
            {/* Payment type */}
            <div style={{marginBottom:8}}>
              <label style={lbl}>Tipo de Pago</label>
              <input value={sp.payment_type||""} onChange={e=>inlineUpd(sp,"payment_type",e.target.value)} style={inp} placeholder="Ej: pago mensual, canje, cheques"/>
            </div>
            {/* Exposure */}
            <div style={{marginBottom:8}}>
              <label style={lbl}>Exposición</label>
              <input value={sp.exposure||""} onChange={e=>inlineUpd(sp,"exposure",e.target.value)} style={inp} placeholder="Ej: Ropa: frente camiseta. Cartelería"/>
            </div>
            {/* Notes */}
            <div style={{marginBottom:8}}>
              <label style={lbl}>Varios / Observaciones</label>
              <textarea value={sp.notes||""} onChange={e=>inlineUpd(sp,"notes",e.target.value)} rows={2} style={{...inp,resize:"vertical" as const}}/>
            </div>
            {/* Actions */}
            <div style={{display:"flex",gap:6,justifyContent:"space-between"}}>
              {confirmDel===sp.id
                ?<div style={{display:"flex",gap:4,alignItems:"center"}}><span style={{fontSize:11,color:"#DC2626",fontWeight:600}}>Confirmar?</span><Btn v="r" s="s" onClick={()=>{onDel(sp.id);sConfirmDel(null);sExpandId(null);}}>Sí, eliminar</Btn><Btn v="g" s="s" onClick={()=>sConfirmDel(null)}>No</Btn></div>
                :<Btn v="r" s="s" onClick={()=>sConfirmDel(sp.id)}>Eliminar</Btn>}
              <Btn v="pu" s="s" onClick={()=>openEdit(sp)}>Editar completo</Btn>
            </div>
          </div>}
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
  </div>);
}
