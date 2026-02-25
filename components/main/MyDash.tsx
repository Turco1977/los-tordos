"use client";
import { useState } from "react";
import { T, ST, SC, fn, isOD } from "@/lib/constants";
import { Card, Ring, Badge } from "@/components/ui";
import { useDataStore } from "@/lib/store";

export function MyDash({user,onSel,mob,search,onUpdDist,onNotifyAdmin}:any){
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
  const isEnl=user.role==="enlace"||user.role==="manager";

  /* My distributions (enlace) */
  const myDists=(invDist||[]).filter((d:any)=>d.enlace_id===user.id&&d.status==="activa");
  const getItemName=(invId:number)=>{const it=(inventory||[]).find((i:any)=>i.id===invId);return it?it.name:"Material";};

  const submitAction=()=>{
    if(!matAction||!matQty)return;
    const dist=myDists.find((d:any)=>d.id===matAction.distId);
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

    {/* Mi Material section (only for enlace/manager with active distributions) */}
    {isEnl&&myDists.length>0&&<div style={{marginBottom:20}}>
      <h3 style={{margin:"0 0 10px",fontSize:15,color:T.nv,fontWeight:700}}>📦 Mi Material</h3>
      <div style={{display:"flex",flexDirection:"column" as const,gap:8}}>
        {myDists.map((d:any)=>{
          const pend=(d.qty_given||0)-(d.qty_returned||0)-(d.qty_lost||0)-(d.qty_broken||0);
          const itemName=getItemName(d.inventory_id);
          return(<Card key={d.id} style={{padding:"12px 14px",borderLeft:"3px solid #C8102E"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:4}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.nv}}>{itemName}</div>
                <div style={{fontSize:10,color:T.g5,marginTop:2}}>📍 {d.division} · Entregadas: {d.qty_given} · Pendientes: <strong style={{color:pend>0?"#DC2626":T.gn}}>{pend}</strong></div>
                {(d.qty_lost>0||d.qty_broken>0)&&<div style={{fontSize:10,color:T.g4,marginTop:2}}>
                  {d.qty_lost>0&&<span style={{color:"#DC2626"}}>Perdidas: {d.qty_lost} </span>}
                  {d.qty_broken>0&&<span style={{color:"#F59E0B"}}>Rotas: {d.qty_broken}</span>}
                </div>}
              </div>
            </div>
            {pend>0&&(()=>{const ma=matAction;const isA=(t:string)=>ma!==null&&ma.distId===d.id&&ma.type===t;return <div style={{display:"flex",gap:4,marginTop:6}}>
              <button onClick={()=>sMatAction(isA("perdida")?null:{distId:d.id,type:"perdida"})} style={{padding:"4px 10px",borderRadius:6,border:"1px solid #FCA5A5",background:isA("perdida")?"#FEE2E2":"transparent",fontSize:10,cursor:"pointer",color:"#DC2626",fontWeight:600}}>Declarar pérdida</button>
              <button onClick={()=>sMatAction(isA("rotura")?null:{distId:d.id,type:"rotura"})} style={{padding:"4px 10px",borderRadius:6,border:"1px solid #FDE68A",background:isA("rotura")?"#FEF3C7":"transparent",fontSize:10,cursor:"pointer",color:"#F59E0B",fontWeight:600}}>Reportar rotura</button>
              <button onClick={()=>sMatAction(isA("arreglo")?null:{distId:d.id,type:"arreglo"})} style={{padding:"4px 10px",borderRadius:6,border:"1px solid "+T.bl+"66",background:isA("arreglo")?"#DBEAFE":"transparent",fontSize:10,cursor:"pointer",color:T.bl,fontWeight:600}}>Pedir arreglo</button>
            </div>;})()}
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
