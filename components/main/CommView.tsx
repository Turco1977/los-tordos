"use client";
import { useState } from "react";
import { ST, AGT, DIV, fn, isOD, AREAS, DEPTOS } from "@/lib/constants";
import { fmtD } from "@/lib/mappers";
import { useC } from "@/lib/theme-context";
import { Btn, Card } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { useDataStore } from "@/lib/store";

const supabase = createClient();
const TODAY = new Date().toISOString().slice(0,10);

export function CommView({user,mob}:any){
  const peds = useDataStore(s => s.peds);
  const presu = useDataStore(s => s.presu);
  const agendas = useDataStore(s => s.agendas);
  const minutas = useDataStore(s => s.minutas);
  const users = useDataStore(s => s.users);
  const areas = AREAS;
  const deptos = DEPTOS;
  const{colors,cardBg}=useC();
  const [tmpl,sTmpl]=useState("");const [msg,sMsg]=useState("");const [copied,sCopied]=useState(false);
  const [showPlus,sShowPlus]=useState(false);
  const [plusPanel,sPlusPanel]=useState<string|null>(null);const [uploading,sUploading]=useState(false);
  const [pollQ,sPollQ]=useState("");const [pollOpts,sPollOpts]=useState(["","",""]);
  const [evTitle,sEvTitle]=useState("");const [evDate,sEvDate]=useState(TODAY);const [evTime,sEvTime]=useState("18:00");const [evPlace,sEvPlace]=useState("Club Los Tordos");
  const [contactSel,sContactSel]=useState("");
  const sig="\n\n---\n🏉 Los Tordos Rugby Club\nSistema de Gestión";
  const now=new Date();const weekAgo=new Date(now);weekAgo.setDate(weekAgo.getDate()-7);const waStr=weekAgo.toISOString().slice(0,10);
  const createdThisWeek=peds.filter((p:any)=>p.cAt>=waStr).length;
  const completedThisWeek=peds.filter((p:any)=>p.st===ST.OK&&p.log?.some((l:any)=>l.dt>=waStr&&l.act?.includes("Validó"))).length;
  const overdue=peds.filter((p:any)=>p.st!==ST.OK&&isOD(p.fReq));
  const pendPresu=presu.filter((pr:any)=>pr.status==="solicitado"||pr.status==="recibido");
  const nextAg=agendas.find((a:any)=>a.date>=TODAY);
  /* Latest minuta helper */
  const latestMin=minutas?.length?[...minutas].sort((a:any,b:any)=>(b.date||"").localeCompare(a.date||""))[0]:null;
  /* Templates */
  const templates:any={
    resumen:{l:"📊 Resumen Semanal",gen:()=>`📊 *Resumen Semanal Los Tordos*\n\n📋 Tareas creadas: ${createdThisWeek}\n✅ Completadas: ${completedThisWeek}\n⏰ Vencidas: ${overdue.length}\n📊 Total activas: ${peds.filter((p:any)=>p.st!==ST.OK).length}${sig}`},
    reunion:{l:"📅 Próxima Reunión",gen:()=>`📅 *Convocatoria a Reunión*\n\n${nextAg?`Fecha: ${fmtD(nextAg.date)}\nTipo: ${AGT[nextAg.type]?.title||""}\n\nTemas:\n${(nextAg.sections||[]).map((s:any,i:number)=>`${i+1}. ${s.t}`).join("\n")}`:"Sin reuniones programadas"}${sig}`},
    minuta:{l:"📝 Minuta",gen:()=>{if(!latestMin)return"📝 No hay minutas disponibles"+sig;const mi=latestMin;const tipo=AGT[mi.type]?.title||mi.type;const secs=(mi.sections||[]).map((s:any,i:number)=>typeof s==="string"?s:`*${s.title||"Sección "+(i+1)}*\n${s.content||""}`).filter((s:string)=>s.trim()).join("\n\n");const tareas=(mi.tareas||[]).filter((t:any)=>t.desc).map((t:any,i:number)=>`${i+1}. ${t.desc}${t.fecha?" (📅 "+t.fecha+")":""}`).join("\n");return`📝 *Minuta – ${tipo}*${mi.areaName?" · "+mi.areaName:""}\n\n📆 Fecha: ${fmtD(mi.date)}\n🕐 ${mi.horaInicio||""} – ${mi.horaCierre||""}\n📍 ${mi.lugar||"Club Los Tordos"}\n\n👥 *Presentes:* ${(mi.presentes||[]).join(", ")||"–"}\n❌ *Ausentes:* ${(mi.ausentes||[]).join(", ")||"–"}\n\n${secs?`📋 *Desarrollo:*\n\n${secs}`:""}\n\n${tareas?`✅ *Tareas asignadas:*\n${tareas}`:""}${sig}`;}},
    vencidas:{l:"⏰ Tareas Vencidas",gen:()=>`⏰ *Tareas Vencidas (${overdue.length})*\n\n${overdue.slice(0,15).map((p:any)=>`• #${p.id} ${p.desc?.slice(0,40)} (📅 ${p.fReq})`).join("\n")}${overdue.length>15?"\n... y "+(overdue.length-15)+" más":""}${sig}`},
    presupuestos:{l:"💰 Estado Presupuestos",gen:()=>`💰 *Estado de Presupuestos*\n\nPendientes: ${pendPresu.length}\nAprobados: ${presu.filter((pr:any)=>pr.status==="aprobado").length}\nTotal aprobado: $${presu.filter((pr:any)=>pr.status==="aprobado").reduce((s:number,pr:any)=>s+Number(pr.monto||0),0).toLocaleString()}${sig}`},
    cd:{l:"🏛️ Resumen CD",gen:()=>{const cdPeds=peds.filter((p:any)=>[50,51,52,53,54,80,81,82].includes(p.dId));return`🏛️ *Comisión Directiva*\n\n📋 Tareas: ${cdPeds.length}\n✅ Completadas: ${cdPeds.filter((p:any)=>p.st===ST.OK).length}\n⏰ Pendientes: ${cdPeds.filter((p:any)=>p.st===ST.P).length}${sig}`;}},
    se:{l:"⚡ Resumen SE",gen:()=>{const sePeds=peds.filter((p:any)=>p.dId===55||p.dId===56);return`⚡ *Secretaría Ejecutiva*\n\n📋 Tareas: ${sePeds.length}\n✅ Completadas: ${sePeds.filter((p:any)=>p.st===ST.OK).length}\n⏰ Pendientes: ${sePeds.filter((p:any)=>p.st===ST.P).length}${sig}`;}},
    asistencia:{l:"📋 Asistencia",gen:()=>{const div=DIV;return`📋 *Control de Asistencia*\n\n📆 Fecha: ${fmtD(TODAY)}\n\n${div.map((d:string)=>`*${d}:*\n✅ Presentes: \n❌ Ausentes: `).join("\n\n")}${sig}`;}},
    citacion:{l:"🏉 Citación",gen:()=>`🏉 *Citación a Entrenamiento*\n\n📆 ${fmtD(TODAY)}\n🕐 Horario: 19:00 hs\n📍 Club Los Tordos\n\nCitados:\n• \n\n⚠️ Confirmar asistencia\n_Los Tordos Rugby Club_`},
    convocatoria:{l:"📣 Convocatoria",gen:()=>`📣 *Convocatoria General*\n\n🏉 Los Tordos Rugby Club\n📆 ${fmtD(TODAY)}\n📍 Club Los Tordos\n\n*Motivo:*\n\n*Agenda:*\n1. \n2. \n3. \n\n⚠️ Se solicita puntual asistencia\n_Comisión Directiva - Los Tordos RC_`},
    libre:{l:"✏️ Mensaje Libre",gen:()=>""}
  };
  const selTmpl=(k:string)=>{sTmpl(k);sMsg(templates[k].gen());};
  const sendWA=()=>{window.open("https://wa.me/?text="+encodeURIComponent(msg),"_blank");};
  const copyMsg=()=>{navigator.clipboard.writeText(msg);sCopied(true);setTimeout(()=>sCopied(false),2000);};
  /* File upload handler */
  const handleFileUpload=async(accept:string)=>{const inp=document.createElement("input");inp.type="file";inp.accept=accept;inp.onchange=async()=>{const f=inp.files?.[0];if(!f)return;sUploading(true);try{const path=`comm/${Date.now()}-${f.name}`;const{error}=await supabase.storage.from("attachments").upload(path,f,{upsert:true});if(error)throw error;const{data:{publicUrl}}=supabase.storage.from("attachments").getPublicUrl(path);sMsg(prev=>prev+(prev?"\n\n":"")+"📎 "+f.name+"\n"+publicUrl);}catch(e:any){sMsg("Error al subir: "+(e.message||""));}sUploading(false);sShowPlus(false);sPlusPanel(null);};inp.click();};
  /* Insert contact */
  const insertContact=(uid:string)=>{const u=users.find((x:any)=>x.id===uid);if(!u)return;const txt=`👤 *${fn(u)}*\n${u.mail?"📧 "+u.mail+"\n":""}${u.tel?"📱 "+u.tel:""}`;sMsg(prev=>prev+(prev?"\n\n":"")+txt);sShowPlus(false);sPlusPanel(null);sContactSel("");};
  /* Insert poll */
  const insertPoll=()=>{const opts=pollOpts.filter(o=>o.trim());if(!pollQ.trim()||opts.length<2)return;const txt=`📊 *ENCUESTA*\n\n${pollQ}\n\n${opts.map((o,i)=>`${["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣"][i]||"•"} ${o}`).join("\n")}\n\n_Respondé con el número de tu opción_`;sMsg(prev=>prev+(prev?"\n\n":"")+txt);sShowPlus(false);sPlusPanel(null);sPollQ("");sPollOpts(["","",""]);};
  /* Insert event */
  const insertEvent=()=>{if(!evTitle.trim())return;const txt=`📅 *EVENTO*\n\n${evTitle}\n📆 ${fmtD(evDate)} · 🕐 ${evTime}\n📍 ${evPlace}\n\n_Los Tordos Rugby Club_`;sMsg(prev=>prev+(prev?"\n\n":"")+txt);sShowPlus(false);sPlusPanel(null);sEvTitle("");sEvDate(TODAY);sEvTime("18:00");sEvPlace("Club Los Tordos");};
  return(<div style={{maxWidth:640}}>
    <h2 style={{margin:"0 0 4px",fontSize:mob?16:19,color:colors.nv,fontWeight:800}}>Comunicar</h2>
    <p style={{color:colors.g4,fontSize:12,margin:"0 0 14px"}}>Enviar comunicaciones por WhatsApp</p>
    {/* Template grid */}
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(4,1fr)",gap:8,marginBottom:14}}>
      {Object.keys(templates).map(k=><Card key={k} onClick={()=>selTmpl(k)} style={{padding:"10px 12px",cursor:"pointer",textAlign:"center" as const,border:tmpl===k?"2px solid "+colors.nv:"1px solid "+colors.g2}}>
        <div style={{fontSize:11,fontWeight:700,color:colors.nv}}>{templates[k].l}</div>
      </Card>)}
    </div>
    {/* Message area */}
    <Card>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{fontSize:12,fontWeight:700,color:colors.nv}}>Mensaje</div>
        {/* + Button for attachments */}
        <div style={{position:"relative" as const}}>
          <button onClick={()=>{sShowPlus(!showPlus);sPlusPanel(null);}} style={{width:32,height:32,borderRadius:"50%",background:colors.nv,color:"#fff",border:"none",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{showPlus?"\u00D7":"+"}</button>
          {showPlus&&!plusPanel&&<div style={{position:"absolute" as const,right:0,top:36,background:cardBg,borderRadius:12,boxShadow:"0 4px 20px rgba(0,0,0,.15)",border:"1px solid "+colors.g2,zIndex:50,minWidth:220,overflow:"hidden"}}>
            <div onClick={()=>handleFileUpload("*/*")} style={{padding:"12px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid "+colors.g2,fontSize:14}}><span style={{fontSize:20}}>📁</span><span style={{fontWeight:600}}>Archivo</span></div>
            <div onClick={()=>handleFileUpload("image/*,video/*")} style={{padding:"12px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid "+colors.g2,fontSize:14}}><span style={{fontSize:20}}>🖼️</span><span style={{fontWeight:600}}>Fotos y videos</span></div>
            <div onClick={()=>sPlusPanel("contacto")} style={{padding:"12px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid "+colors.g2,fontSize:14}}><span style={{fontSize:20}}>👤</span><span style={{fontWeight:600}}>Contacto</span></div>
            <div onClick={()=>sPlusPanel("encuesta")} style={{padding:"12px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid "+colors.g2,fontSize:14}}><span style={{fontSize:20}}>📊</span><span style={{fontWeight:600}}>Encuesta</span></div>
            <div onClick={()=>sPlusPanel("evento")} style={{padding:"12px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,fontSize:14}}><span style={{fontSize:20}}>📅</span><span style={{fontWeight:600}}>Evento</span></div>
          </div>}
          {showPlus&&plusPanel==="contacto"&&<div style={{position:"absolute" as const,right:0,top:36,background:cardBg,borderRadius:12,boxShadow:"0 4px 20px rgba(0,0,0,.15)",border:"1px solid "+colors.g2,zIndex:50,minWidth:260,padding:12}}>
            <div style={{fontSize:12,fontWeight:700,color:colors.nv,marginBottom:8}}>👤 Seleccionar contacto</div>
            <select value={contactSel} onChange={e=>sContactSel(e.target.value)} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,marginBottom:8}}><option value="">Elegir...</option>{users.map((u:any)=><option key={u.id} value={u.id}>{fn(u)}</option>)}</select>
            <div style={{display:"flex",gap:6}}><Btn v="g" s="s" onClick={()=>{sPlusPanel(null);}}>Cancelar</Btn><Btn v="s" s="s" disabled={!contactSel} onClick={()=>insertContact(contactSel)}>Insertar</Btn></div>
          </div>}
          {showPlus&&plusPanel==="encuesta"&&<div style={{position:"absolute" as const,right:0,top:36,background:cardBg,borderRadius:12,boxShadow:"0 4px 20px rgba(0,0,0,.15)",border:"1px solid "+colors.g2,zIndex:50,minWidth:280,padding:12}}>
            <div style={{fontSize:12,fontWeight:700,color:colors.nv,marginBottom:8}}>📊 Crear encuesta</div>
            <input value={pollQ} onChange={e=>sPollQ(e.target.value)} placeholder="Pregunta..." style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,marginBottom:6,boxSizing:"border-box" as const}}/>
            {pollOpts.map((o,i)=><input key={i} value={o} onChange={e=>{const n=[...pollOpts];n[i]=e.target.value;sPollOpts(n);}} placeholder={`Opción ${i+1}`} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:11,marginBottom:4,boxSizing:"border-box" as const}}/>)}
            <button onClick={()=>sPollOpts([...pollOpts,""])} style={{border:"none",background:"none",color:colors.bl,fontSize:11,cursor:"pointer",marginBottom:6}}>+ Agregar opción</button>
            <div style={{display:"flex",gap:6}}><Btn v="g" s="s" onClick={()=>sPlusPanel(null)}>Cancelar</Btn><Btn v="s" s="s" onClick={insertPoll}>Insertar</Btn></div>
          </div>}
          {showPlus&&plusPanel==="evento"&&<div style={{position:"absolute" as const,right:0,top:36,background:cardBg,borderRadius:12,boxShadow:"0 4px 20px rgba(0,0,0,.15)",border:"1px solid "+colors.g2,zIndex:50,minWidth:280,padding:12}}>
            <div style={{fontSize:12,fontWeight:700,color:colors.nv,marginBottom:8}}>📅 Crear evento</div>
            <input value={evTitle} onChange={e=>sEvTitle(e.target.value)} placeholder="Título del evento" style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,marginBottom:6,boxSizing:"border-box" as const}}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:6}}><input type="date" value={evDate} onChange={e=>sEvDate(e.target.value)} style={{padding:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:11}}/><input type="time" value={evTime} onChange={e=>sEvTime(e.target.value)} style={{padding:7,borderRadius:7,border:"1px solid "+colors.g3,fontSize:11}}/></div>
            <input value={evPlace} onChange={e=>sEvPlace(e.target.value)} placeholder="Lugar" style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,marginBottom:8,boxSizing:"border-box" as const}}/>
            <div style={{display:"flex",gap:6}}><Btn v="g" s="s" onClick={()=>sPlusPanel(null)}>Cancelar</Btn><Btn v="s" s="s" onClick={insertEvent}>Insertar</Btn></div>
          </div>}
        </div>
      </div>
      {uploading&&<div style={{padding:8,background:"#FEF3C7",borderRadius:8,fontSize:11,color:"#92400E",marginBottom:6}}>⏳ Subiendo archivo...</div>}
      <textarea value={msg} onChange={e=>sMsg(e.target.value)} rows={10} placeholder="Seleccioná una plantilla o escribí un mensaje libre..." style={{width:"100%",padding:10,borderRadius:8,border:"1px solid "+colors.g3,fontSize:12,resize:"vertical" as const,boxSizing:"border-box" as const,fontFamily:"monospace"}}/>
      <div style={{display:"flex",gap:8,marginTop:10,justifyContent:"flex-end"}}>
        <Btn v="g" onClick={copyMsg}>{copied?"✅ Copiado":"📋 Copiar"}</Btn>
        <Btn v="s" onClick={sendWA} disabled={!msg.trim()}>📱 Enviar por WhatsApp</Btn>
      </div>
    </Card>
  </div>);
}
