"use client";
import { useState } from "react";
import { T, ST, SC, fn, isOD } from "@/lib/constants";
import { Card, Ring, Badge } from "@/components/ui";
import { useDataStore } from "@/lib/store";

export function MyDash({user,onSel,mob,search,onUpdDist,onNotifyAdmin,onConfirmReceipt}:any){
  const peds = useDataStore(s => s.peds);
  const users = useDataStore(s => s.users);
  const presu = useDataStore(s => s.presu);
  const invDist = useDataStore(s => s.invDist);
  const inventory = useDataStore(s => s.inventory);
  const [tab,sTab]=useState("active");
  const [subFilt,sSubFilt]=useState<string|null>(null);
  const [matAction,sMatAction]=useState<{distId:number;type:string}|null>(null);
  const [matQty,sMatQty]=useState("");
  const [matNote,sMatNote]=useState("");
  const [invTab,sInvTab]=useState<"activas"|"historial">("activas");
  const [retDistId,sRetDistId]=useState<number|null>(null);
  const [retQty,sRetQty]=useState("");
  const isEnl=user.role==="enlace"||user.role==="manager";

  /* My distributions (enlace) — all assigned to me */
  const allMyDists=(invDist||[]).filter((d:any)=>d.enlace_id===user.id||(user.div&&d.division===user.div));
  const myDists=allMyDists.filter((d:any)=>d.status==="activa");
  const myDistsHist=allMyDists.filter((d:any)=>d.status!=="activa");
  const getItemName=(invId:number)=>{const it=(inventory||[]).find((i:any)=>i.id===invId);return it?it.name:"Material";};

  const submitReturn=()=>{
    if(!retDistId||!retQty)return;
    const dist=allMyDists.find((d:any)=>d.id===retDistId);
    if(!dist)return;
    const qty=Number(retQty)||0;if(qty<=0)return;
    const upd:any={qty_returned:(dist.qty_returned||0)+qty};
    const itemName=getItemName(dist.inventory_id);
    if(onUpdDist)onUpdDist(dist.id,upd);
    if(onNotifyAdmin)onNotifyAdmin("Devolución de material",`${fn(user)} devolvió ${qty} ${itemName} de ${dist.division}.`);
    sRetDistId(null);sRetQty("");
  };

  const submitAction=()=>{
    if(!matAction||!matQty)return;
    const dist=allMyDists.find((d:any)=>d.id===matAction.distId);
    if(!dist)return;
    const qty=Number(matQty)||0;if(qty<=0)return;
    const upd:any={};
    const itemName=getItemName(dist.inventory_id);
    if(matAction.type==="perdida"){
      upd.qty_lost=(dist.qty_lost||0)+qty;
      if(onNotifyAdmin)onNotifyAdmin("Pérdida declarada",`${fn(user)} declaró ${qty} ${itemName} perdido(s) en ${dist.division}. ${matNote?"Nota: "+matNote:""}`);
    }else if(matAction.type==="rotura"){
      upd.qty_broken=(dist.qty_broken||0)+qty;
      if(onNotifyAdmin)onNotifyAdmin("Rotura reportada",`${fn(user)} reportó ${qty} ${itemName} roto(s) en ${dist.division}. ${matNote?"Nota: "+matNote:""}`);
    }else if(matAction.type==="arreglo"){
      if(onNotifyAdmin)onNotifyAdmin("Pedido de arreglo",`${fn(user)} solicita arreglo de ${qty} ${itemName} en ${dist.division}. ${matNote?"Nota: "+matNote:""}`);
    }
    if(Object.keys(upd).length&&onUpdDist)onUpdDist(dist.id,upd);
    sMatAction(null);sMatQty("");sMatNote("");
  };

  let myPeds=peds.filter((p:any)=>p.cId===user.id||p.asTo===user.id);
  if(search){const s=search.toLowerCase();myPeds=myPeds.filter((p:any)=>(p.tit+p.desc+p.cN+p.tipo+p.div+(p.id+"")).toLowerCase().includes(s));}
  const active=myPeds.filter((p:any)=>p.st!==ST.OK),done=myPeds.filter((p:any)=>p.st===ST.OK);
  const total=myPeds.length,okC=done.length,pct=total?Math.round(okC/total*100):0;
  const overdue=active.filter((p:any)=>isOD(p.fReq));
  let vis=tab==="active"?active:done;
  if(subFilt==="venc")vis=overdue;
  else if(subFilt==="gasto")vis=myPeds.filter((p:any)=>p.monto);
  const clk=(t:string,sf?:string)=>{sTab(t);sSubFilt(sf||null);};
  return(<div style={{maxWidth:720}}>
    <div style={{display:"flex",gap:mob?10:16,alignItems:"center",marginBottom:mob?14:20}}>
      <Ring pct={pct} color={pct>=80?T.gn:pct>=40?T.yl:T.rd} size={mob?70:90} icon={isEnl?"🔗":"👤"}/>
      <div style={{flex:1}}><h2 style={{margin:0,fontSize:20,color:T.nv,fontWeight:800}}>{isEnl?"Mis Pedidos":"Mis Tareas"}</h2><div style={{fontSize:12,color:T.g5}}>{fn(user)}{user.div?" · "+user.div:""}</div><div style={{display:"flex",gap:12,marginTop:8,fontSize:12}}><span onClick={()=>clk("active")} style={{fontWeight:700,color:T.nv,cursor:"pointer"}}>{total} total</span><span onClick={()=>clk("done")} style={{fontWeight:700,color:T.gn,cursor:"pointer"}}>✅ {okC}</span><span onClick={()=>clk("active")} style={{fontWeight:700,color:T.yl,cursor:"pointer"}}>🟡 {active.length}</span>{overdue.length>0&&<span onClick={()=>clk("active","venc")} style={{fontWeight:700,color:"#DC2626",cursor:"pointer"}}>⏰ {overdue.length}</span>}</div></div>
    </div>

    {/* Mi Inventario section (enlace/manager) */}
    {isEnl&&allMyDists.length>0&&<div style={{marginBottom:20}}>
      <h3 style={{margin:"0 0 10px",fontSize:15,color:T.nv,fontWeight:700}}>📦 Mi Inventario</h3>
      <div style={{display:"flex",gap:4,marginBottom:10}}>
        <button onClick={()=>sInvTab("activas")} style={{padding:"6px 14px",borderRadius:8,border:"none",background:invTab==="activas"?T.nv:"#fff",color:invTab==="activas"?"#fff":T.g5,fontSize:11,fontWeight:600,cursor:"pointer"}}>Activas ({myDists.length})</button>
        <button onClick={()=>sInvTab("historial")} style={{padding:"6px 14px",borderRadius:8,border:"none",background:invTab==="historial"?T.g5:"#fff",color:invTab==="historial"?"#fff":T.g5,fontSize:11,fontWeight:600,cursor:"pointer"}}>Historial ({myDistsHist.length})</button>
      </div>
      <div style={{display:"flex",flexDirection:"column" as const,gap:8}}>
        {(invTab==="activas"?myDists:myDistsHist).map((d:any)=>{
          const pend=(d.qty_given||0)-(d.qty_returned||0)-(d.qty_lost||0)-(d.qty_broken||0);
          const itemName=getItemName(d.inventory_id);
          return(<Card key={d.id} style={{padding:"12px 14px",borderLeft:"3px solid "+(d.status==="activa"?"#C8102E":"#9CA3AF")}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:4}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.nv}}>{itemName}</div>
                <div style={{fontSize:10,color:T.g5,marginTop:2}}>📍 {d.division} · Entregadas: {d.qty_given}{d.given_date?" · "+d.given_date:""}</div>
                {d.received?<div style={{fontSize:10,color:T.gn,marginTop:2,fontWeight:600}}>✅ Recibido{d.received_at?" el "+new Date(d.received_at).toLocaleDateString():""}</div>:<div style={{fontSize:10,color:"#D97706",marginTop:2,fontWeight:600}}>⏳ Pendiente de confirmación</div>}
                {d.status==="activa"&&<div style={{fontSize:10,color:T.g5,marginTop:2}}>Pendientes: <strong style={{color:pend>0?"#DC2626":T.gn}}>{pend}</strong>{d.qty_returned>0&&<span style={{color:T.gn}}> · Dev: {d.qty_returned}</span>}{d.qty_lost>0&&<span style={{color:"#DC2626"}}> · Perd: {d.qty_lost}</span>}{d.qty_broken>0&&<span style={{color:"#F59E0B"}}> · Rotas: {d.qty_broken}</span>}</div>}
                {d.status!=="activa"&&<div style={{fontSize:10,color:T.g4,marginTop:2}}>Estado: <span style={{fontWeight:700}}>{d.status}</span> · Entregadas: {d.qty_given} · Dev: {d.qty_returned||0} · Perd: {d.qty_lost||0}</div>}
              </div>
            </div>
            {/* Confirm receipt button */}
            {d.status==="activa"&&!d.received&&onConfirmReceipt&&<button onClick={()=>onConfirmReceipt(d.id)} style={{marginTop:6,padding:"6px 14px",borderRadius:8,border:"1px solid "+T.gn,background:"#DCFCE7",color:"#16A34A",fontSize:11,cursor:"pointer",fontWeight:700}}>✅ Confirmar recepción</button>}
            {/* Receipt summary after confirmed */}
            {d.received&&d.status==="activa"&&<div style={{marginTop:6,padding:8,background:"#F0FDF4",borderRadius:8,border:"1px solid #BBF7D0",fontSize:10,color:T.g5}}>
              <strong>Recibo:</strong> {d.qty_given} {itemName} · {d.division}{d.received_at?" · Confirmado: "+new Date(d.received_at).toLocaleDateString():""}
            </div>}
            {/* Actions for active distributions */}
            {d.status==="activa"&&pend>0&&<div style={{display:"flex",gap:4,marginTop:6,flexWrap:"wrap" as const}}>
              {(()=>{const ma=matAction;const isA=(t:string)=>ma!==null&&ma.distId===d.id&&ma.type===t;return <>
              <button onClick={()=>sMatAction(isA("perdida")?null:{distId:d.id,type:"perdida"})} style={{padding:"4px 10px",borderRadius:6,border:"1px solid #FCA5A5",background:isA("perdida")?"#FEE2E2":"transparent",fontSize:10,cursor:"pointer",color:"#DC2626",fontWeight:600}}>Declarar pérdida</button>
              <button onClick={()=>sMatAction(isA("rotura")?null:{distId:d.id,type:"rotura"})} style={{padding:"4px 10px",borderRadius:6,border:"1px solid #FDE68A",background:isA("rotura")?"#FEF3C7":"transparent",fontSize:10,cursor:"pointer",color:"#F59E0B",fontWeight:600}}>Reportar rotura</button>
              <button onClick={()=>sMatAction(isA("arreglo")?null:{distId:d.id,type:"arreglo"})} style={{padding:"4px 10px",borderRadius:6,border:"1px solid "+T.bl+"66",background:isA("arreglo")?"#DBEAFE":"transparent",fontSize:10,cursor:"pointer",color:T.bl,fontWeight:600}}>Pedir arreglo</button>
              <button onClick={()=>sRetDistId(retDistId===d.id?null:d.id)} style={{padding:"4px 10px",borderRadius:6,border:"1px solid "+T.gn,background:retDistId===d.id?"#DCFCE7":"transparent",fontSize:10,cursor:"pointer",color:T.gn,fontWeight:600}}>Devolver</button>
              </>;})()}
            </div>}
            {/* Return form */}
            {retDistId===d.id&&<div style={{marginTop:8,padding:10,background:"#F0FDF4",borderRadius:8,border:"1px solid #BBF7D0"}}>
              <div style={{fontSize:11,fontWeight:600,color:T.gn,marginBottom:6}}>📥 Devolver material (máx {pend})</div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <input type="number" min={1} max={pend} value={retQty} onChange={e=>sRetQty(e.target.value)} placeholder="Cantidad" style={{width:80,padding:"5px 8px",borderRadius:6,border:"1px solid #E5E7EB",fontSize:11}}/>
                <button onClick={()=>{sRetDistId(null);sRetQty("");}} style={{padding:"4px 10px",borderRadius:6,border:"1px solid #E5E7EB",background:"transparent",fontSize:10,cursor:"pointer",color:T.g5}}>Cancelar</button>
                <button onClick={submitReturn} disabled={!retQty||Number(retQty)<=0||Number(retQty)>pend} style={{padding:"4px 10px",borderRadius:6,border:"none",background:T.gn,color:"#fff",fontSize:10,cursor:"pointer",fontWeight:600,opacity:!retQty||Number(retQty)<=0||Number(retQty)>pend?0.5:1}}>Devolver</button>
              </div>
            </div>}
            {/* Action form (perdida/rotura/arreglo) */}
            {matAction&&matAction.distId===d.id&&<div style={{marginTop:8,padding:10,background:"#F9FAFB",borderRadius:8,border:"1px solid #E5E7EB"}}>
              <div style={{fontSize:11,fontWeight:600,color:T.g5,marginBottom:6}}>
                {matAction.type==="perdida"?"⚠️ Declarar pérdida":matAction.type==="rotura"?"🔧 Reportar rotura":"🛠️ Pedir arreglo"}
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap" as const,marginBottom:6}}>
                <input type="number" min={1} max={pend} value={matQty} onChange={e=>sMatQty(e.target.value)} placeholder="Cantidad" style={{width:80,padding:"5px 8px",borderRadius:6,border:"1px solid #E5E7EB",fontSize:11}}/>
                <input value={matNote} onChange={e=>sMatNote(e.target.value)} placeholder="Nota (opcional)" style={{flex:1,minWidth:120,padding:"5px 8px",borderRadius:6,border:"1px solid #E5E7EB",fontSize:11}}/>
              </div>
              <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
                <button onClick={()=>{sMatAction(null);sMatQty("");sMatNote("");}} style={{padding:"4px 10px",borderRadius:6,border:"1px solid #E5E7EB",background:"transparent",fontSize:10,cursor:"pointer",color:T.g5}}>Cancelar</button>
                <button onClick={submitAction} disabled={!matQty||Number(matQty)<=0} style={{padding:"4px 10px",borderRadius:6,border:"none",background:T.nv,color:"#fff",fontSize:10,cursor:"pointer",fontWeight:600,opacity:!matQty||Number(matQty)<=0?0.5:1}}>Enviar</button>
              </div>
            </div>}
          </Card>);
        })}
        {(invTab==="activas"?myDists:myDistsHist).length===0&&<Card style={{textAlign:"center" as const,padding:20,color:T.g4}}><span style={{fontSize:20}}>📭</span><div style={{marginTop:4,fontSize:11}}>{invTab==="activas"?"Sin distribuciones activas":"Sin historial"}</div></Card>}
      </div>
    </div>}

    <div style={{display:"flex",gap:4,marginBottom:14,flexWrap:"wrap" as const}}>
      {[{k:"active",l:"🟡 Activas ("+active.length+")",bg:T.nv,sf:null as string|null},{k:"done",l:"✅ Realizadas ("+done.length+")",bg:T.gn,sf:null as string|null},{k:"active",l:"⏰ Vencidas ("+overdue.length+")",bg:"#DC2626",sf:"venc"},{k:"active",l:"💰 Con Gasto ("+myPeds.filter((p:any)=>p.monto).length+")",bg:T.pr,sf:"gasto"}].map((t,i)=>
        <button key={i} onClick={()=>clk(t.k,t.sf||undefined)} style={{padding:"7px 16px",borderRadius:8,border:"none",background:(tab===t.k&&subFilt===t.sf)?t.bg:"#fff",color:(tab===t.k&&subFilt===t.sf)?"#fff":T.g5,fontSize:12,fontWeight:600,cursor:"pointer"}}>{t.l}</button>
      )}
    </div>
    <div style={{display:"flex",flexDirection:"column" as const,gap:8}}>
      {vis.length===0&&<Card style={{textAlign:"center",padding:28,color:T.g4}}><span style={{fontSize:28}}>🎉</span><div style={{marginTop:6,fontSize:13}}>Sin tareas</div></Card>}
      {vis.map((p:any)=>{const od2=p.st!==ST.OK&&isOD(p.fReq),msgs=(p.log||[]).filter((l:any)=>l.t==="msg").length,nPr=(presu||[]).filter((pr:any)=>pr.task_id===p.id).length;
        return(<Card key={p.id} style={{padding:"14px 16px",cursor:"pointer",borderLeft:"4px solid "+SC[p.st].c,background:od2?"#FEF2F2":"#fff"}} onClick={()=>onSel(p)}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><Badge s={p.st} sm/>{od2&&<span style={{fontSize:9,color:"#DC2626",fontWeight:700}}>⏰</span>}{p.urg==="Urgente"&&<span style={{fontSize:9,color:T.rd,fontWeight:700}}>🔥</span>}<span style={{fontSize:10,color:T.g4}}>#{p.id}</span>{nPr>0&&<span style={{background:T.pr+"20",color:T.pr,padding:"1px 6px",borderRadius:10,fontSize:9,fontWeight:700}}>💰 {nPr}</span>}</div>
          <div style={{fontSize:13,fontWeight:700,color:T.nv}}>{p.tit||p.desc}</div>
          {p.tit&&<div style={{fontSize:10,color:T.g4,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{p.desc.slice(0,60)}</div>}
          <div style={{fontSize:11,color:T.g5,marginTop:3}}>{p.div&&<span>📍 {p.div} · </span>}{p.tipo} · 📅 {p.fReq} · 💬 {msgs}{p.rG&&nPr===0&&<span style={{color:T.pr,fontWeight:600}}> · 💰 Sin presupuesto</span>}</div>
        </Card>);})}
    </div>
  </div>);
}

/* Standalone inventory view for enlace/manager sidebar */
export function EnlaceInventario({user,mob,onUpdDist,onNotifyAdmin,onConfirmReceipt}:any){
  const invDist = useDataStore(s => s.invDist);
  const inventory = useDataStore(s => s.inventory);
  const [invTab,sInvTab]=useState<"activas"|"historial">("activas");
  const [matAction,sMatAction]=useState<{distId:number;type:string}|null>(null);
  const [matQty,sMatQty]=useState("");
  const [matNote,sMatNote]=useState("");
  const [retDistId,sRetDistId]=useState<number|null>(null);
  const [retQty,sRetQty]=useState("");

  const allMyDists=(invDist||[]).filter((d:any)=>d.enlace_id===user.id||(user.div&&d.division===user.div));
  const myDists=allMyDists.filter((d:any)=>d.status==="activa");
  const myDistsHist=allMyDists.filter((d:any)=>d.status!=="activa");
  const getItemName=(invId:number)=>{const it=(inventory||[]).find((i:any)=>i.id===invId);return it?it.name:"Material";};

  const submitReturn=()=>{
    if(!retDistId||!retQty)return;
    const dist=allMyDists.find((d:any)=>d.id===retDistId);
    if(!dist)return;
    const qty=Number(retQty)||0;if(qty<=0)return;
    if(onUpdDist)onUpdDist(dist.id,{qty_returned:(dist.qty_returned||0)+qty});
    if(onNotifyAdmin)onNotifyAdmin("Devolución de material",`${fn(user)} devolvió ${qty} ${getItemName(dist.inventory_id)} de ${dist.division}.`);
    sRetDistId(null);sRetQty("");
  };

  const submitAction=()=>{
    if(!matAction||!matQty)return;
    const dist=allMyDists.find((d:any)=>d.id===matAction.distId);
    if(!dist)return;
    const qty=Number(matQty)||0;if(qty<=0)return;
    const upd:any={};const itemName=getItemName(dist.inventory_id);
    if(matAction.type==="perdida"){upd.qty_lost=(dist.qty_lost||0)+qty;if(onNotifyAdmin)onNotifyAdmin("Pérdida declarada",`${fn(user)} declaró ${qty} ${itemName} perdido(s) en ${dist.division}. ${matNote?"Nota: "+matNote:""}`);}
    else if(matAction.type==="rotura"){upd.qty_broken=(dist.qty_broken||0)+qty;if(onNotifyAdmin)onNotifyAdmin("Rotura reportada",`${fn(user)} reportó ${qty} ${itemName} roto(s) en ${dist.division}. ${matNote?"Nota: "+matNote:""}`);}
    else if(matAction.type==="arreglo"){if(onNotifyAdmin)onNotifyAdmin("Pedido de arreglo",`${fn(user)} solicita arreglo de ${qty} ${itemName} en ${dist.division}. ${matNote?"Nota: "+matNote:""}`);}
    if(Object.keys(upd).length&&onUpdDist)onUpdDist(dist.id,upd);
    sMatAction(null);sMatQty("");sMatNote("");
  };

  const totalGiven=allMyDists.reduce((s:number,d:any)=>s+(d.qty_given||0),0);
  const totalPend=myDists.reduce((s:number,d:any)=>s+Math.max(0,(d.qty_given||0)-(d.qty_returned||0)-(d.qty_lost||0)-(d.qty_broken||0)),0);
  const totalReturned=allMyDists.reduce((s:number,d:any)=>s+(d.qty_returned||0),0);
  const totalLost=allMyDists.reduce((s:number,d:any)=>s+(d.qty_lost||0),0);

  return(<div style={{maxWidth:720}}>
    <h2 style={{margin:"0 0 4px",fontSize:mob?16:19,color:T.nv,fontWeight:800}}>📦 Mi Inventario</h2>
    <p style={{color:T.g5,fontSize:12,margin:"0 0 14px"}}>{fn(user)}{user.div?" · "+user.div:""}</p>

    {/* KPIs */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16}}>
      <Card style={{padding:"8px 10px",borderTop:"3px solid "+T.bl,textAlign:"center" as const}}><div style={{fontSize:16,fontWeight:800,color:T.bl}}>{totalGiven}</div><div style={{fontSize:9,color:T.g4}}>Recibidos</div></Card>
      <Card style={{padding:"8px 10px",borderTop:"3px solid #DC2626",textAlign:"center" as const}}><div style={{fontSize:16,fontWeight:800,color:"#DC2626"}}>{totalPend}</div><div style={{fontSize:9,color:T.g4}}>Pendientes</div></Card>
      <Card style={{padding:"8px 10px",borderTop:"3px solid "+T.gn,textAlign:"center" as const}}><div style={{fontSize:16,fontWeight:800,color:T.gn}}>{totalReturned}</div><div style={{fontSize:9,color:T.g4}}>Devueltos</div></Card>
      <Card style={{padding:"8px 10px",borderTop:"3px solid #F59E0B",textAlign:"center" as const}}><div style={{fontSize:16,fontWeight:800,color:"#F59E0B"}}>{totalLost}</div><div style={{fontSize:9,color:T.g4}}>Perdidos</div></Card>
    </div>

    {/* Tabs */}
    <div style={{display:"flex",gap:4,marginBottom:12}}>
      <button onClick={()=>sInvTab("activas")} style={{padding:"7px 16px",borderRadius:8,border:"none",background:invTab==="activas"?T.nv:"#fff",color:invTab==="activas"?"#fff":T.g5,fontSize:12,fontWeight:600,cursor:"pointer"}}>Activas ({myDists.length})</button>
      <button onClick={()=>sInvTab("historial")} style={{padding:"7px 16px",borderRadius:8,border:"none",background:invTab==="historial"?T.g5:"#fff",color:invTab==="historial"?"#fff":T.g5,fontSize:12,fontWeight:600,cursor:"pointer"}}>Historial ({myDistsHist.length})</button>
    </div>

    {/* Cards */}
    <div style={{display:"flex",flexDirection:"column" as const,gap:8}}>
      {(invTab==="activas"?myDists:myDistsHist).map((d:any)=>{
        const pend=(d.qty_given||0)-(d.qty_returned||0)-(d.qty_lost||0)-(d.qty_broken||0);
        const itemName=getItemName(d.inventory_id);
        return(<Card key={d.id} style={{padding:"12px 14px",borderLeft:"3px solid "+(d.status==="activa"?"#C8102E":"#9CA3AF")}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:4}}>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:T.nv}}>{itemName}</div>
              <div style={{fontSize:10,color:T.g5,marginTop:2}}>📍 {d.division} · Entregadas: {d.qty_given}{d.given_date?" · "+d.given_date:""}</div>
              {d.received?<div style={{fontSize:10,color:T.gn,marginTop:2,fontWeight:600}}>✅ Recibido{d.received_at?" el "+new Date(d.received_at).toLocaleDateString():""}</div>:<div style={{fontSize:10,color:"#D97706",marginTop:2,fontWeight:600}}>⏳ Pendiente de confirmación</div>}
              {d.status==="activa"&&<div style={{fontSize:10,color:T.g5,marginTop:2}}>Pendientes: <strong style={{color:pend>0?"#DC2626":T.gn}}>{pend}</strong>{d.qty_returned>0&&<span style={{color:T.gn}}> · Dev: {d.qty_returned}</span>}{d.qty_lost>0&&<span style={{color:"#DC2626"}}> · Perd: {d.qty_lost}</span>}{d.qty_broken>0&&<span style={{color:"#F59E0B"}}> · Rotas: {d.qty_broken}</span>}</div>}
              {d.status!=="activa"&&<div style={{fontSize:10,color:T.g4,marginTop:2}}>Estado: <span style={{fontWeight:700}}>{d.status}</span> · Entregadas: {d.qty_given} · Dev: {d.qty_returned||0} · Perd: {d.qty_lost||0}</div>}
            </div>
          </div>
          {d.status==="activa"&&!d.received&&onConfirmReceipt&&<button onClick={()=>onConfirmReceipt(d.id)} style={{marginTop:6,padding:"6px 14px",borderRadius:8,border:"1px solid "+T.gn,background:"#DCFCE7",color:"#16A34A",fontSize:11,cursor:"pointer",fontWeight:700}}>✅ Confirmar recepción</button>}
          {d.received&&d.status==="activa"&&<div style={{marginTop:6,padding:8,background:"#F0FDF4",borderRadius:8,border:"1px solid #BBF7D0",fontSize:10,color:T.g5}}>
            <strong>Recibo:</strong> {d.qty_given} {itemName} · {d.division}{d.received_at?" · Confirmado: "+new Date(d.received_at).toLocaleDateString():""}
          </div>}
          {d.status==="activa"&&pend>0&&<div style={{display:"flex",gap:4,marginTop:6,flexWrap:"wrap" as const}}>
            {(()=>{const ma=matAction;const isA=(t:string)=>ma!==null&&ma.distId===d.id&&ma.type===t;return <>
            <button onClick={()=>sMatAction(isA("perdida")?null:{distId:d.id,type:"perdida"})} style={{padding:"4px 10px",borderRadius:6,border:"1px solid #FCA5A5",background:isA("perdida")?"#FEE2E2":"transparent",fontSize:10,cursor:"pointer",color:"#DC2626",fontWeight:600}}>Declarar pérdida</button>
            <button onClick={()=>sMatAction(isA("rotura")?null:{distId:d.id,type:"rotura"})} style={{padding:"4px 10px",borderRadius:6,border:"1px solid #FDE68A",background:isA("rotura")?"#FEF3C7":"transparent",fontSize:10,cursor:"pointer",color:"#F59E0B",fontWeight:600}}>Reportar rotura</button>
            <button onClick={()=>sMatAction(isA("arreglo")?null:{distId:d.id,type:"arreglo"})} style={{padding:"4px 10px",borderRadius:6,border:"1px solid "+T.bl+"66",background:isA("arreglo")?"#DBEAFE":"transparent",fontSize:10,cursor:"pointer",color:T.bl,fontWeight:600}}>Pedir arreglo</button>
            <button onClick={()=>sRetDistId(retDistId===d.id?null:d.id)} style={{padding:"4px 10px",borderRadius:6,border:"1px solid "+T.gn,background:retDistId===d.id?"#DCFCE7":"transparent",fontSize:10,cursor:"pointer",color:T.gn,fontWeight:600}}>Devolver</button>
            </>;})()}
          </div>}
          {retDistId===d.id&&<div style={{marginTop:8,padding:10,background:"#F0FDF4",borderRadius:8,border:"1px solid #BBF7D0"}}>
            <div style={{fontSize:11,fontWeight:600,color:T.gn,marginBottom:6}}>📥 Devolver material (máx {pend})</div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <input type="number" min={1} max={pend} value={retQty} onChange={e=>sRetQty(e.target.value)} placeholder="Cantidad" style={{width:80,padding:"5px 8px",borderRadius:6,border:"1px solid #E5E7EB",fontSize:11}}/>
              <button onClick={()=>{sRetDistId(null);sRetQty("");}} style={{padding:"4px 10px",borderRadius:6,border:"1px solid #E5E7EB",background:"transparent",fontSize:10,cursor:"pointer",color:T.g5}}>Cancelar</button>
              <button onClick={submitReturn} disabled={!retQty||Number(retQty)<=0||Number(retQty)>pend} style={{padding:"4px 10px",borderRadius:6,border:"none",background:T.gn,color:"#fff",fontSize:10,cursor:"pointer",fontWeight:600,opacity:!retQty||Number(retQty)<=0||Number(retQty)>pend?0.5:1}}>Devolver</button>
            </div>
          </div>}
          {matAction&&matAction.distId===d.id&&<div style={{marginTop:8,padding:10,background:"#F9FAFB",borderRadius:8,border:"1px solid #E5E7EB"}}>
            <div style={{fontSize:11,fontWeight:600,color:T.g5,marginBottom:6}}>{matAction.type==="perdida"?"⚠️ Declarar pérdida":matAction.type==="rotura"?"🔧 Reportar rotura":"🛠️ Pedir arreglo"}</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap" as const,marginBottom:6}}>
              <input type="number" min={1} max={pend} value={matQty} onChange={e=>sMatQty(e.target.value)} placeholder="Cantidad" style={{width:80,padding:"5px 8px",borderRadius:6,border:"1px solid #E5E7EB",fontSize:11}}/>
              <input value={matNote} onChange={e=>sMatNote(e.target.value)} placeholder="Nota (opcional)" style={{flex:1,minWidth:120,padding:"5px 8px",borderRadius:6,border:"1px solid #E5E7EB",fontSize:11}}/>
            </div>
            <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
              <button onClick={()=>{sMatAction(null);sMatQty("");sMatNote("");}} style={{padding:"4px 10px",borderRadius:6,border:"1px solid #E5E7EB",background:"transparent",fontSize:10,cursor:"pointer",color:T.g5}}>Cancelar</button>
              <button onClick={submitAction} disabled={!matQty||Number(matQty)<=0} style={{padding:"4px 10px",borderRadius:6,border:"none",background:T.nv,color:"#fff",fontSize:10,cursor:"pointer",fontWeight:600,opacity:!matQty||Number(matQty)<=0?0.5:1}}>Enviar</button>
            </div>
          </div>}
        </Card>);
      })}
      {(invTab==="activas"?myDists:myDistsHist).length===0&&<Card style={{textAlign:"center" as const,padding:24,color:T.g4}}><span style={{fontSize:24}}>📭</span><div style={{marginTop:6,fontSize:12}}>{invTab==="activas"?"Sin distribuciones activas":"Sin historial"}</div></Card>}
    </div>
  </div>);
}
