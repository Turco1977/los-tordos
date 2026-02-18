"use client";
import { ST, PST, isOD } from "@/lib/constants";
import { useC } from "@/lib/theme-context";
import { Card } from "@/components/ui";
import { useDataStore } from "@/lib/store";

export function KPIs({peds,mob,onFilter}:{peds:any[];mob?:boolean;onFilter?:(key:string)=>void}){
  const presu = useDataStore(s => s.presu);
  const{colors}=useC();
  const tot=peds.length,ok=peds.filter(p=>p.st===ST.OK).length,pe=peds.filter(p=>p.st===ST.P).length;
  const active=peds.filter(p=>p.st!==ST.OK),overdue=active.filter(p=>isOD(p.fReq)).length;
  const kpis:{l:string;v:any;c:string;i:string;fk:string}[]=[{l:"Completadas",v:ok+"/"+tot,c:colors.gn,i:"✅",fk:"ok"},{l:"Pendientes",v:pe,c:colors.rd,i:"🔴",fk:"pend"},{l:"Vencidas",v:overdue,c:"#DC2626",i:"⏰",fk:"venc"},{l:"Con Gasto",v:peds.filter(p=>p.monto).length,c:colors.pr,i:"💰",fk:"gasto"}];
  if(presu&&presu.length>0){const apr=presu.filter((pr:any)=>pr.status===PST.APR).reduce((s:number,pr:any)=>s+Number(pr.monto),0);const pend=presu.filter((pr:any)=>pr.status===PST.SOL||pr.status===PST.REC).length;kpis.push({l:"$ Aprobado",v:"$"+apr.toLocaleString(),c:colors.gn,i:"💵",fk:""},{l:"Pres. Pendientes",v:pend,c:colors.yl,i:"📤",fk:""});}
  return(<div style={{display:"grid",gridTemplateColumns:mob?"repeat(auto-fit,minmax(80px,1fr))":"repeat(auto-fit,minmax(120px,1fr))",gap:mob?6:10,marginBottom:mob?12:18}}>{kpis.map((k,i)=>(<Card key={i} onClick={k.fk&&onFilter?()=>onFilter(k.fk):undefined} style={{padding:mob?"8px 8px":"10px 12px",borderTop:"3px solid "+k.c,cursor:k.fk&&onFilter?"pointer":"default"}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:mob?14:16}}>{k.i}</span><span style={{fontSize:mob?14:17,fontWeight:800,color:k.c}}>{k.v}</span></div><div style={{fontSize:mob?9:10,color:colors.g4,marginTop:3}}>{k.l}</div></Card>))}</div>);
}
