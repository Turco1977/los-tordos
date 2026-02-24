"use client";
import { useState } from "react";
import { T, fn, ST } from "@/lib/constants";
import { Btn, Card, FileField } from "@/components/ui";
import { MentionInput } from "@/components/MentionInput";
import { useDataStore } from "@/lib/store";

const TODAY = new Date().toISOString().slice(0,10);

const AREAS_COMM=["Infantiles","Juveniles","Plantel Superior","Hockey","Social","Infraestructura","Otro"];
const PIEZAS=["Post para Instagram","Historia","Flyer digital","Flyer para imprimir","Video corto","Placa institucional","Mail informativo","Otro"];
const OBJETIVOS=["Informar","Convocar gente","Conseguir inscriptos","Conseguir sponsors","Generar pertenencia","Otro"];
const PUBLICOS=["Padres","Jugadores","Socios","Ex jugadores","Público general","Sponsors"];
const TONOS=["Formal institucional","Deportivo y motivador","Informal y cercano","Urgente","Celebración"];
const MATERIALES=["Fotos","Logo","Video","Texto base","No tengo material"];

function Chips({label,items,sel,onTog,multi=true,mob}:{label:string;items:string[];sel:string[];onTog:(v:string)=>void;multi?:boolean;mob?:boolean}){
  return <div style={{marginBottom:10}}>
    <label style={{fontSize:12,fontWeight:600,color:T.g5}}>{label}</label>
    <div style={{display:"flex",flexWrap:"wrap" as const,gap:mob?6:4,marginTop:4}}>
      {items.map(it=>{const on=sel.indexOf(it)>=0;return <button key={it} onClick={()=>onTog(it)} style={{padding:mob?"8px 14px":"4px 12px",borderRadius:18,fontSize:mob?12:11,border:on?"2px solid "+T.nv:"1px solid "+T.g3,background:on?T.nv:"#fff",color:on?"#fff":T.g5,cursor:"pointer",minHeight:mob?40:undefined}}>{it}</button>;})}
    </div>
  </div>;
}

export function CommReq({user,mob,onSub,onX}:any){
  const users = useDataStore(s => s.users);
  const leo=users.find((u:any)=>(u.a||"").toLowerCase()==="sturniolo"&&(u.n||"").toLowerCase().startsWith("lea"));
  const [f,sF]=useState({area:"",fechaPub:"",piezas:[] as string[],desc:"",fecha:"",hora:"",lugar:"",responsable:"",costo:"",objetivos:[] as string[],publicos:[] as string[],tono:"",materiales:[] as string[],aprueba:"Leandro Sturniolo"});
  const up=(k:string,v:any)=>sF((p:any)=>({...p,[k]:v}));
  const togArr=(k:string,v:string)=>sF((p:any)=>{const arr:string[]=p[k]||[];return{...p,[k]:arr.indexOf(v)>=0?arr.filter((x:string)=>x!==v):[...arr,v]};});
  const togSingle=(k:string,v:string)=>sF((p:any)=>({...p,[k]:p[k]===v?"":v}));

  const [archivos,sArchivos]=useState<string[]>([]);
  const ok=f.area&&f.piezas.length>0&&f.desc.trim()&&f.fechaPub;

  const buildDesc=()=>{
    const lines:string[]=[];
    lines.push("📣 PEDIDO DE COMUNICACIÓN");
    lines.push("═══════════════════════");
    lines.push("");
    lines.push("👤 Solicitante: "+fn(user));
    lines.push("🏷️ Área/División: "+f.area);
    lines.push("📅 Fecha de publicación: "+f.fechaPub);
    lines.push("");
    lines.push("📦 Piezas solicitadas: "+f.piezas.join(", "));
    lines.push("");
    lines.push("📝 Descripción:");
    lines.push(f.desc);
    if(f.fecha||f.hora||f.lugar||f.responsable||f.costo){
      lines.push("");
      lines.push("📌 Información clave:");
      if(f.fecha)lines.push("  • Fecha: "+f.fecha);
      if(f.hora)lines.push("  • Hora: "+f.hora);
      if(f.lugar)lines.push("  • Lugar: "+f.lugar);
      if(f.responsable)lines.push("  • Responsable/Contacto: "+f.responsable);
      if(f.costo)lines.push("  • Costo: "+f.costo);
    }
    if(f.objetivos.length>0){lines.push("");lines.push("🎯 Objetivo: "+f.objetivos.join(", "));}
    if(f.publicos.length>0){lines.push("");lines.push("👥 Público objetivo: "+f.publicos.join(", "));}
    if(f.tono){lines.push("");lines.push("🎨 Tono: "+f.tono);}
    if(f.materiales.length>0){lines.push("");lines.push("📎 Material adjunto: "+f.materiales.join(", "));}
    if(f.aprueba){lines.push("");lines.push("✅ Aprueba: "+f.aprueba);}
    if(archivos.length>0){lines.push("");lines.push("📁 Archivos adjuntos:");archivos.forEach((url,i)=>lines.push("  • Archivo "+(i+1)+": "+url));}
    return lines.join("\n");
  };

  return(<Card style={{maxWidth:mob?undefined:600}}>
    <h2 style={{margin:"0 0 14px",fontSize:mob?15:17,color:T.nv,fontWeight:800}}>📣 Pedido de Comunicación</h2>

    {/* Solicitante */}
    <div style={{padding:"8px 12px",background:T.g1,borderRadius:8,fontSize:12,marginBottom:12}}>{fn(user)}{user.div?" · "+user.div:""}</div>

    {/* Área */}
    <Chips label="Área/División *" items={AREAS_COMM} sel={f.area?[f.area]:[]} onTog={v=>up("area",f.area===v?"":v)} multi={false} mob={mob}/>

    {/* Fecha publicación */}
    <div style={{marginBottom:10}}>
      <label style={{fontSize:12,fontWeight:600,color:T.g5}}>Fecha de publicación *</label>
      <input type="date" value={f.fechaPub} onChange={(e:any)=>up("fechaPub",e.target.value)} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:13,boxSizing:"border-box" as const,marginTop:3}}/>
    </div>

    {/* Piezas */}
    <Chips label="¿Qué necesitás? * (podés elegir varias)" items={PIEZAS} sel={f.piezas} onTog={v=>togArr("piezas",v)} mob={mob}/>

    {/* Descripción */}
    <div style={{marginBottom:10}}>
      <label style={{fontSize:12,fontWeight:600,color:T.g5}}>¿De qué se trata? *</label>
      <MentionInput users={users} value={f.desc} onChange={(val:string)=>up("desc",val)} rows={3} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,resize:"vertical" as const,boxSizing:"border-box" as const,marginTop:3}}/>
    </div>

    {/* Información clave */}
    <div style={{marginBottom:10}}>
      <label style={{fontSize:12,fontWeight:700,color:T.nv,marginBottom:6,display:"block"}}>📌 Información clave</label>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8}}>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Fecha del evento</label><input value={f.fecha} onChange={(e:any)=>up("fecha",e.target.value)} placeholder="ej: Sábado 15/3" style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Hora</label><input value={f.hora} onChange={(e:any)=>up("hora",e.target.value)} placeholder="ej: 10:00 hs" style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Lugar</label><input value={f.lugar} onChange={(e:any)=>up("lugar",e.target.value)} placeholder="ej: Cancha principal" style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Responsable/Contacto</label>{(()=>{const areaUsers=f.area&&f.area!=="Otro"?users.filter((u:any)=>u.div===f.area):[];return areaUsers.length>0?<select value={f.responsable} onChange={(e:any)=>up("responsable",e.target.value)} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,marginTop:2}}><option value="">Seleccionar...</option>{areaUsers.map((u:any)=><option key={u.id} value={fn(u)}>{fn(u)}</option>)}</select>:<input value={f.responsable} onChange={(e:any)=>up("responsable",e.target.value)} placeholder="Nombre y teléfono" style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/>;})()}</div>
      </div>
      <div style={{marginTop:8}}><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Costo (si aplica)</label><input value={f.costo} onChange={(e:any)=>up("costo",e.target.value)} placeholder="ej: $5.000 por persona" style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
    </div>

    {/* Objetivo */}
    <Chips label="Objetivo del mensaje (podés elegir varios)" items={OBJETIVOS} sel={f.objetivos} onTog={v=>togArr("objetivos",v)} mob={mob}/>

    {/* Público */}
    <Chips label="Público objetivo (podés elegir varios)" items={PUBLICOS} sel={f.publicos} onTog={v=>togArr("publicos",v)} mob={mob}/>

    {/* Tono */}
    <Chips label="Tono del mensaje" items={TONOS} sel={f.tono?[f.tono]:[]} onTog={v=>togSingle("tono",v)} multi={false} mob={mob}/>

    {/* Material */}
    <Chips label="Material adjunto (podés elegir varios)" items={MATERIALES} sel={f.materiales} onTog={v=>togArr("materiales",v)} mob={mob}/>

    {/* Archivos de referencia */}
    <div style={{marginBottom:12}}>
      <label style={{fontSize:12,fontWeight:600,color:T.g5}}>📁 Archivos de referencia</label>
      <div style={{marginTop:4}}>
        <FileField value="" onChange={(url:string)=>{if(url)sArchivos(prev=>[...prev,url]);}} folder="comunicacion"/>
      </div>
      {archivos.length>0&&<div style={{display:"flex",flexWrap:"wrap" as const,gap:4,marginTop:6}}>
        {archivos.map((url,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",background:"#E8F4FD",borderRadius:16,fontSize:10,border:"1px solid #B3D9F2"}}>
          <span>📎</span><a href={url} target="_blank" rel="noopener noreferrer" style={{color:T.bl,maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>Archivo {i+1}</a>
          <button onClick={()=>sArchivos(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer",fontSize:10,color:T.g4,padding:0}} title="Quitar">✕</button>
        </div>)}
      </div>}
    </div>

    {/* Quién aprueba */}
    <div style={{marginBottom:12}}>
      <label style={{fontSize:12,fontWeight:600,color:T.g5}}>¿Quién aprueba el contenido final?</label>
      <input value={f.aprueba} onChange={(e:any)=>up("aprueba",e.target.value)} placeholder="Nombre del responsable que da OK final" style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:3}}/>
    </div>

    {/* Botones */}
    <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
      <Btn v="g" onClick={onX}>Cancelar</Btn>
      <Btn v="r" disabled={!ok} onClick={()=>{
        const ts=TODAY+" "+new Date().toTimeString().slice(0,5);
        const piezasTit=f.piezas.length<=2?f.piezas.join(", "):f.piezas.slice(0,2).join(", ")+" +"+String(f.piezas.length-2);
        const asTo=leo?.id||null;
        onSub({
          id:0,
          div:f.area,
          cId:user.id,
          cN:fn(user),
          dId:3,
          tipo:"Comunicación",
          tit:"Pedido Comunicación: "+piezasTit,
          desc:buildDesc(),
          fReq:f.fechaPub,
          urg:"Normal",
          st:asTo?ST.C:ST.P,
          asTo,
          rG:false,
          eOk:null,
          resp:"",
          cAt:TODAY,
          monto:null,
          log:[{dt:ts,uid:user.id,by:fn(user),act:"Creó pedido de comunicación",t:"sys"},...(asTo?[{dt:ts,uid:user.id,by:fn(user),act:"Asignó a "+(leo?fn(leo):"Leo Sturniolo"),t:"sys"}]:[]),...archivos.map((url,i)=>({dt:ts,uid:user.id,by:fn(user),act:"📎 Archivo "+(i+1)+": "+url,t:"msg"}))],
          _presu:null
        });
      }}>📨 Enviar pedido</Btn>
    </div>
  </Card>);
}
