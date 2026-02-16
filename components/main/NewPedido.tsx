"use client";
import { useState } from "react";
import { T, DIV, TIPOS, MONEDAS, ST, fn } from "@/lib/constants";
import { Btn, Card, FileField } from "@/components/ui";

const TODAY = new Date().toISOString().slice(0,10);

export function NP({user,users,deptos,areas,onSub,onX,preAssign,mob,provs,sponsors,canjeUsado}:any){
  const isE=["enlace","manager","usuario","embudo"].indexOf(user.role)>=0;
  const isHigh=["superadmin","admin","coordinador"].indexOf(user.role)>=0;
  const [f,sF]=useState({aId:"",dId:isE?String(user.dId):"",div:isE?user.div:"",asTo:"",tipo:"",desc:"",fReq:"",urg:"Normal",rG:false});
  const up=(k:string,v:any)=>sF((p:any)=>({...p,[k]:v}));
  const selArea=f.aId?areas.find((a:any)=>a.id===Number(f.aId)):null;
  /* Canje state */
  const [isCanje,sIsCanje]=useState(false);
  const [canjeSpId,sCanjeSpId]=useState("");
  const activeSp=(sponsors||[]).filter((s:any)=>s.status==="active"&&Number(s.amount_service||0)>0);
  const selSp=canjeSpId?activeSp.find((s:any)=>String(s.id)===canjeSpId):null;
  const spUsado=selSp?(canjeUsado||{})[selSp.id]||0:0;
  const spDisp=selSp?Number(selSp.amount_service||0)-spUsado:0;
  /* Presupuesto inline */
  const [prf,sPrf]=useState({prov_nombre:"",prov_contacto:"",prov_id:"",descripcion:"",monto:"",moneda:"ARS",archivo_url:"",notas:""});
  const [provSearch,sProvSearch]=useState("");
  const canjeOk=!isCanje||(canjeSpId&&prf.monto);
  const presuOk=!f.rG||(prf.prov_nombre&&prf.monto&&canjeOk);
  const ok=f.tipo&&f.desc&&f.fReq&&presuOk;const pastDate=f.fReq&&f.fReq<TODAY;
  const [atts,sAtts]=useState<{type:string;label:string;val:string}[]>([]);const [showAtt,sShowAtt]=useState(false);const [attType,sAttType]=useState("");const [attVal,sAttVal]=useState("");
  const attTypes=[{k:"link",l:"🔗 Link",ph:"https://..."},{k:"video",l:"🎬 Video",ph:"URL del video..."},{k:"foto",l:"📷 Foto",ph:"URL de la imagen..."},{k:"ubi",l:"📍 Ubicación",ph:"Dirección o link de Maps..."},{k:"doc",l:"📄 Documento",ph:"URL del documento..."}];
  const addAtt=()=>{if(attVal.trim()){const at=attTypes.find(a=>a.k===attType);sAtts(p=>[...p,{type:attType,label:at?at.l:"📎",val:attVal.trim()}]);sAttVal("");sAttType("");sShowAtt(false);}};
  return(<Card style={{maxWidth:mob?undefined:560}}>
    <h2 style={{margin:"0 0 14px",fontSize:mob?15:17,color:T.nv,fontWeight:800}}>🏉 Nueva Tarea</h2>
    {preAssign&&<div style={{padding:"8px 12px",background:"#EDE9FE",borderRadius:8,fontSize:12,marginBottom:12,display:"flex",alignItems:"center",gap:6}}>📋 <span style={{fontWeight:600,color:"#5B21B6"}}>Asignando a: {fn(preAssign)}</span>{preAssign.div&&<span style={{fontSize:10,color:T.g4}}>· {preAssign.div}</span>}</div>}
    {isE&&!preAssign&&<div style={{padding:"8px 12px",background:T.g1,borderRadius:8,fontSize:12,marginBottom:12}}>{fn(user)}{user.div?" · "+user.div:""}</div>}
    {isHigh&&<><div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8,marginBottom:10}}><div><label style={{fontSize:12,fontWeight:600,color:T.g5}}>Área</label><select value={f.aId} onChange={(e:any)=>{sF((p:any)=>({...p,aId:e.target.value,dId:""}));}} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,marginTop:3}}><option value="">Todas</option>{areas.map((a:any)=><option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}</select></div><div><label style={{fontSize:12,fontWeight:600,color:T.g5}}>Departamento</label><select value={f.dId} onChange={(e:any)=>up("dId",e.target.value)} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,marginTop:3}}><option value="">General</option>{(selArea?deptos.filter((d:any)=>d.aId===selArea.id):deptos).map((d:any)=><option key={d.id} value={d.id}>{d.name}</option>)}</select></div></div><div style={{marginBottom:10}}><label style={{fontSize:12,fontWeight:600,color:T.g5}}>División</label><select value={f.div} onChange={(e:any)=>up("div",e.target.value)} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,marginTop:3}}><option value="">General</option>{DIV.map(d=><option key={d} value={d}>{d}</option>)}</select></div></>}
    <div style={{marginBottom:10}}><label style={{fontSize:12,fontWeight:600,color:T.g5}}>Tipo *</label><div style={{display:"flex",flexWrap:"wrap" as const,gap:mob?6:4,marginTop:4}}>{TIPOS.map(t=><button key={t} onClick={()=>up("tipo",t)} style={{padding:mob?"8px 14px":"4px 12px",borderRadius:18,fontSize:mob?12:11,border:f.tipo===t?"2px solid "+T.nv:"1px solid "+T.g3,background:f.tipo===t?T.nv:"#fff",color:f.tipo===t?"#fff":T.g5,cursor:"pointer",minHeight:mob?40:undefined}}>{t}</button>)}</div></div>
    <div style={{marginBottom:10}}><label style={{fontSize:12,fontWeight:600,color:T.g5}}>Descripción *</label><textarea value={f.desc} onChange={(e:any)=>up("desc",e.target.value)} rows={3} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,resize:"vertical" as const,boxSizing:"border-box" as const,marginTop:3}}/></div>
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:8,marginBottom:10}}><div><label style={{fontSize:12,fontWeight:600,color:T.g5}}>Fecha límite *</label><input type="date" value={f.fReq} onChange={(e:any)=>up("fReq",e.target.value)} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:13,boxSizing:"border-box" as const,marginTop:3}}/></div><div><label style={{fontSize:12,fontWeight:600,color:T.g5}}>Urgencia</label><div style={{display:"flex",gap:4,marginTop:3}}>{["Normal","Urgente"].map(u=><button key={u} onClick={()=>up("urg",u)} style={{flex:1,padding:mob?10:6,borderRadius:8,fontSize:mob?13:11,fontWeight:600,border:f.urg===u?"2px solid "+T.nv:"1px solid "+T.g3,background:f.urg===u?T.nv+"15":"#fff",color:f.urg===u?T.nv:T.g4,cursor:"pointer",minHeight:mob?44:undefined}}>{u}</button>)}</div></div></div>
    <div style={{display:"flex",gap:12,marginBottom:f.rG?4:12,flexWrap:"wrap" as const}}>
      <label style={{display:"flex",alignItems:"center",gap:6,fontSize:12,cursor:"pointer"}}><input type="checkbox" checked={f.rG&&!isCanje} onChange={(e:any)=>{up("rG",e.target.checked);if(e.target.checked)sIsCanje(false);}}/><span style={{fontWeight:600,color:T.g5}}>Requiere gasto 💰</span></label>
      <label style={{display:"flex",alignItems:"center",gap:6,fontSize:12,cursor:"pointer"}}><input type="checkbox" checked={isCanje} onChange={(e:any)=>{sIsCanje(e.target.checked);if(e.target.checked)up("rG",true);}}/><span style={{fontWeight:600,color:"#3B82F6"}}>Canje 🔄</span></label>
    </div>
    {isCanje&&<div style={{padding:12,background:"#EFF6FF",borderRadius:10,border:"1px solid #3B82F640",marginBottom:f.rG?4:12}}>
      <div style={{fontSize:11,fontWeight:700,color:"#3B82F6",marginBottom:8}}>🔄 Seleccionar Sponsor para Canje</div>
      <select value={canjeSpId} onChange={e=>{sCanjeSpId(e.target.value);const sp=activeSp.find((s:any)=>String(s.id)===e.target.value);if(sp)sPrf(p=>({...p,prov_nombre:sp.name}));}} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid #3B82F640",fontSize:12,marginBottom:6}}>
        <option value="">Elegir sponsor...</option>
        {activeSp.map((s:any)=>{const used=(canjeUsado||{})[s.id]||0;const disp=Number(s.amount_service||0)-used;return <option key={s.id} value={s.id}>{s.name} — Disponible: ${Math.round(disp).toLocaleString("es-AR")}</option>;})}
      </select>
      {selSp&&<div style={{padding:"8px 10px",background:"#DBEAFE",borderRadius:8,fontSize:11}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
          <span style={{fontWeight:700,color:"#1E40AF"}}>{selSp.name}</span>
          <span style={{fontWeight:700,color:spDisp>0?"#059669":"#DC2626"}}>Disponible: ${Math.round(spDisp).toLocaleString("es-AR")}</span>
        </div>
        <div style={{height:6,background:"#93C5FD",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:Math.min(100,Number(selSp.amount_service||0)?spUsado/Number(selSp.amount_service)*100:0)+"%",background:spUsado/Number(selSp.amount_service||1)>0.8?"#DC2626":spUsado/Number(selSp.amount_service||1)>0.5?"#F59E0B":"#10B981",borderRadius:3}}/></div>
        <div style={{fontSize:9,color:"#1E40AF",marginTop:2}}>Usado: ${Math.round(spUsado).toLocaleString("es-AR")} de ${Math.round(Number(selSp.amount_service||0)).toLocaleString("es-AR")}</div>
      </div>}
    </div>}
    {f.rG&&<div style={{padding:12,background:isCanje?"#EFF6FF":"#F5F3FF",borderRadius:10,border:"1px solid "+(isCanje?"#3B82F640":T.pr+"33"),marginBottom:12}}>
      <div style={{fontSize:11,fontWeight:700,color:isCanje?"#3B82F6":T.pr,marginBottom:8}}>{isCanje?"🔄 Datos del canje":"💰 Datos del presupuesto"}</div>
      <div style={{marginBottom:6}}><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Proveedor *</label>
        <input value={provSearch} onChange={e=>{sProvSearch(e.target.value);sPrf(p=>({...p,prov_nombre:e.target.value,prov_id:""}));}} placeholder="Buscar o escribir proveedor..." style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/>
        {provSearch&&(provs||[]).filter((pv:any)=>pv.nombre.toLowerCase().includes(provSearch.toLowerCase())).length>0&&<div style={{border:"1px solid "+T.g3,borderRadius:8,marginTop:2,maxHeight:80,overflowY:"auto" as const,background:"#fff"}}>
          {(provs||[]).filter((pv:any)=>pv.nombre.toLowerCase().includes(provSearch.toLowerCase())).slice(0,5).map((pv:any)=><div key={pv.id} onClick={()=>{sPrf(p=>({...p,prov_id:String(pv.id),prov_nombre:pv.nombre,prov_contacto:pv.contacto||pv.telefono||pv.email}));sProvSearch(pv.nombre);}} style={{padding:"5px 10px",fontSize:11,cursor:"pointer",borderBottom:"1px solid "+T.g1}}>{pv.nombre} <span style={{color:T.g4}}>({pv.rubro})</span></div>)}
        </div>}
      </div>
      <div style={{marginBottom:6}}><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Contacto proveedor</label><input value={prf.prov_contacto} onChange={e=>sPrf(p=>({...p,prov_contacto:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 80px",gap:8,marginBottom:6}}>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Monto ($) *</label><input type="number" value={prf.monto} onChange={e=>sPrf(p=>({...p,monto:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
        <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Moneda</label><select value={prf.moneda} onChange={e=>sPrf(p=>({...p,moneda:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,marginTop:2}}>{MONEDAS.map(m=><option key={m} value={m}>{m}</option>)}</select></div>
      </div>
      <div style={{marginBottom:6}}><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Descripción</label><textarea value={prf.descripcion} onChange={e=>sPrf(p=>({...p,descripcion:e.target.value}))} rows={2} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,resize:"vertical" as const,boxSizing:"border-box" as const,marginTop:2}}/></div>
      <div style={{marginBottom:6}}><FileField value={prf.archivo_url} onChange={url=>sPrf(p=>({...p,archivo_url:url}))} folder="presupuestos"/></div>
      <div><label style={{fontSize:10,fontWeight:600,color:T.g5}}>Notas</label><input value={prf.notas} onChange={e=>sPrf(p=>({...p,notas:e.target.value}))} style={{width:"100%",padding:7,borderRadius:7,border:"1px solid "+T.g3,fontSize:12,boxSizing:"border-box" as const,marginTop:2}}/></div>
      {!prf.prov_nombre&&!prf.monto&&<div style={{marginTop:6,fontSize:10,color:T.rd,fontWeight:600}}>⚠️ Completá proveedor y monto para poder enviar la tarea</div>}
    </div>}
    <div style={{marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><label style={{fontSize:12,fontWeight:600,color:T.g5}}>Adjuntos</label><button onClick={()=>{sShowAtt(!showAtt);sAttType("");sAttVal("");}} style={{width:28,height:28,borderRadius:14,background:showAtt?T.bl+"15":"#fff",border:"1px solid "+(showAtt?T.bl:T.g3),cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",color:showAtt?T.bl:T.g4,fontWeight:700}}>+</button></div>
      {showAtt&&<div style={{padding:10,background:"#F8FAFC",borderRadius:10,border:"1px solid "+T.g2,marginBottom:8}}>
        {!attType?<div style={{display:"flex",flexWrap:"wrap" as const,gap:6}}>
          {attTypes.map(a=><button key={a.k} onClick={()=>sAttType(a.k)} style={{padding:"8px 14px",borderRadius:10,border:"1px solid "+T.g3,background:"#fff",fontSize:11,cursor:"pointer",fontWeight:600,color:T.nv}}>{a.l}</button>)}
          <button onClick={()=>sShowAtt(false)} style={{padding:"8px 14px",borderRadius:10,border:"none",background:"transparent",fontSize:11,cursor:"pointer",color:T.g4}}>✕</button>
        </div>
        :<div style={{display:"flex",gap:6,alignItems:"center"}}>
          <span style={{fontSize:11,fontWeight:600}}>{attTypes.find(a=>a.k===attType)?.l}</span>
          <input value={attVal} onChange={e=>sAttVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addAtt();}} placeholder={attTypes.find(a=>a.k===attType)?.ph} style={{flex:1,padding:"7px 10px",borderRadius:8,border:"1px solid "+T.g3,fontSize:11}} autoFocus/>
          <Btn v="p" s="s" onClick={addAtt} disabled={!attVal.trim()}>Agregar</Btn>
          <Btn v="g" s="s" onClick={()=>{sAttType("");sAttVal("");}}>←</Btn>
        </div>}
      </div>}
      {atts.length>0&&<div style={{display:"flex",flexWrap:"wrap" as const,gap:4}}>{atts.map((a,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",background:"#E8F4FD",borderRadius:16,fontSize:10,border:"1px solid #B3D9F2"}}><span>{a.label}</span><span style={{color:T.bl,maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{a.val}</span><button onClick={()=>sAtts(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer",fontSize:10,color:T.g4,padding:0}}>✕</button></div>)}</div>}
    </div>
    {pastDate&&<div style={{padding:"6px 10px",background:"#FEF2F2",borderRadius:8,border:"1px solid #FECACA",fontSize:11,color:"#991B1B",marginBottom:8}}>⚠️ La fecha límite es anterior a hoy</div>}
    <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn v="g" onClick={onX}>Cancelar</Btn><Btn v="r" disabled={!ok} onClick={()=>{const dId=Number(f.dId)||user.dId;const pa=preAssign;const ts=TODAY+" "+new Date().toTimeString().slice(0,5);onSub({id:0,div:f.div||user.div||"",cId:user.id,cN:fn(user),dId,tipo:f.tipo,desc:f.desc,fReq:f.fReq,urg:f.urg,st:pa?ST.C:ST.P,asTo:pa?pa.id:null,rG:f.rG,eOk:null,resp:"",cAt:TODAY,monto:f.rG&&prf.monto?Number(prf.monto):null,log:[{dt:ts,uid:user.id,by:fn(user),act:"Creó la tarea",t:"sys"},...(pa?[{dt:ts,uid:user.id,by:fn(user),act:"Asignó a "+fn(pa),t:"sys"}]:[]),...atts.map(a=>({dt:ts,uid:user.id,by:fn(user),act:a.label+": "+a.val,t:"msg"}))],_presu:f.rG?{proveedor_id:prf.prov_id?Number(prf.prov_id):null,proveedor_nombre:prf.prov_nombre,proveedor_contacto:prf.prov_contacto,descripcion:prf.descripcion,monto:Number(prf.monto),moneda:prf.moneda,archivo_url:prf.archivo_url,notas:prf.notas,is_canje:isCanje,sponsor_id:isCanje&&canjeSpId?Number(canjeSpId):null}:null});}}>📨 Enviar</Btn></div>
  </Card>);
}
