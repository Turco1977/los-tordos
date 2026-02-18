"use client";
import { useState } from "react";
import { T, ST, SC, fn, isOD } from "@/lib/constants";
import { Card, Ring, Badge } from "@/components/ui";
import { useDataStore } from "@/lib/store";

export function MyDash({user,onSel,mob,search}:any){
  const peds = useDataStore(s => s.peds);
  const users = useDataStore(s => s.users);
  const presu = useDataStore(s => s.presu);
  const [tab,sTab]=useState("active");
  const [subFilt,sSubFilt]=useState<string|null>(null);
  const isEnl=user.role==="enlace"||user.role==="manager";
  let myPeds=peds.filter((p:any)=>p.cId===user.id||p.asTo===user.id);
  if(search){const s=search.toLowerCase();myPeds=myPeds.filter((p:any)=>(p.desc+p.cN+p.tipo+p.div+(p.id+"")).toLowerCase().includes(s));}
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
          <div style={{fontSize:13,fontWeight:700,color:T.nv}}>{p.desc}</div>
          <div style={{fontSize:11,color:T.g5,marginTop:3}}>{p.div&&<span>📍 {p.div} · </span>}{p.tipo} · 📅 {p.fReq} · 💬 {msgs}{p.rG&&nPr===0&&<span style={{color:T.pr,fontWeight:600}}> · 💰 Sin presupuesto</span>}</div>
        </Card>);})}
    </div>
  </div>);
}
