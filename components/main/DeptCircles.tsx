"use client";
import { ST } from "@/lib/constants";
import { useC } from "@/lib/theme-context";
import { Ring } from "@/components/ui";

export function DeptCircles({area,deptos,pedidos,onDC,mob}:any){
  const{colors,cardBg}=useC();
  const ds=deptos.filter((d:any)=>d.aId===area.id);
  return(<div style={{display:"grid",gridTemplateColumns:mob?"repeat(auto-fit,minmax(140px,1fr))":"repeat(auto-fit,minmax(180px,1fr))",gap:mob?8:14}}>
    {ds.map((d:any)=>{const dp=pedidos.filter((p:any)=>p.dId===d.id),tot=dp.length,ok=dp.filter((p:any)=>p.st===ST.OK).length,pe=dp.filter((p:any)=>p.st===ST.P).length,cu=dp.filter((p:any)=>[ST.C,ST.E,ST.V].indexOf(p.st)>=0).length,pct=tot?Math.round(ok/tot*100):0;
      return(<div key={d.id} onClick={()=>onDC(d.id)} style={{background:cardBg,borderRadius:16,padding:"20px 16px",textAlign:"center" as const,cursor:"pointer",border:"1px solid "+colors.g2}}><Ring pct={pct} color={area.color} size={100} icon="📂"/><div style={{fontSize:14,fontWeight:700,color:colors.nv,marginTop:6}}>{d.name}</div><div style={{display:"flex",justifyContent:"center",gap:8,fontSize:11,marginTop:5}}><span style={{color:colors.rd}}>🔴{pe}</span><span style={{color:colors.yl}}>🟡{cu}</span><span style={{color:colors.gn}}>🟢{ok}</span></div></div>);})}
  </div>);
}
