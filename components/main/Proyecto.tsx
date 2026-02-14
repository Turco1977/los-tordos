"use client";
import { useState } from "react";
import { useC } from "@/lib/theme-context";
import { Btn, Card, Ring } from "@/components/ui";

export function Proyecto({hitos,setHitos,isAd,mob}:any){
  const{colors,isDark,cardBg}=useC();
  const [subTab,sSubTab]=useState("list");
  /* Gantt: parse periodo strings like "2024-2026" into start/end years */
  const parseRange=(per:string)=>{const m=per.match(/(\d{4})/g);if(m&&m.length>=2)return{s:Number(m[0]),e:Number(m[m.length-1])};if(m&&m.length===1)return{s:Number(m[0]),e:Number(m[0])+1};return{s:2024,e:2035};};
  const minY=Math.min(...hitos.map((h:any)=>parseRange(h.periodo).s),2024);
  const maxY=Math.max(...hitos.map((h:any)=>parseRange(h.periodo).e),2035);
  const totalYears=maxY-minY+1;
  return(<div style={{maxWidth:mob?undefined:900}}><h2 style={{margin:"0 0 4px",fontSize:19,color:colors.nv,fontWeight:800}}>Plan Maestro 2035</h2><p style={{color:colors.g4,fontSize:12,margin:"0 0 12px"}}>Hitos de infraestructura</p>
    <div style={{display:"flex",gap:4,marginBottom:14}}>{[{k:"list",l:"📋 Lista"},{k:"gantt",l:"📊 Gantt"}].map(t=><button key={t.k} onClick={()=>sSubTab(t.k)} style={{padding:"6px 14px",borderRadius:8,border:"none",background:subTab===t.k?colors.nv:"#fff",color:subTab===t.k?(isDark?"#0F172A":"#fff"):colors.g5,fontSize:12,fontWeight:600,cursor:"pointer"}}>{t.l}</button>)}</div>
    {subTab==="list"&&hitos.map((h:any)=>(<Card key={h.id} style={{marginBottom:10,borderLeft:"4px solid "+h.color,display:"flex",gap:16,alignItems:"center"}}><Ring pct={h.pct} color={h.color} size={70}/><div style={{flex:1}}><div style={{fontSize:10,fontWeight:700,color:h.color,textTransform:"uppercase" as const}}>{h.fase} · {h.periodo}</div><div style={{fontSize:14,fontWeight:700,color:colors.nv,margin:"3px 0"}}>{h.name}</div><div style={{height:4,background:colors.g2,borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:h.pct+"%",background:h.color,borderRadius:4}}/></div></div>{isAd&&<div style={{display:"flex",gap:3}}><Btn v="g" s="s" onClick={()=>setHitos((p:any)=>p.map((x:any)=>x.id===h.id?{...x,pct:Math.max(0,x.pct-5)}:x))}>−</Btn><Btn v="g" s="s" onClick={()=>setHitos((p:any)=>p.map((x:any)=>x.id===h.id?{...x,pct:Math.min(100,x.pct+5)}:x))}>+</Btn></div>}</Card>))}
    {subTab==="gantt"&&<Card style={{padding:16,overflowX:"auto" as const}}>
      <div style={{minWidth:600}}>
        {/* Header: year labels */}
        <div style={{display:"flex",marginBottom:8,marginLeft:mob?120:200}}>
          {Array.from({length:totalYears},(_,i)=>minY+i).map(y=><div key={y} style={{flex:1,fontSize:9,fontWeight:700,color:colors.g4,textAlign:"center" as const,borderLeft:"1px solid "+colors.g2}}>{y}</div>)}
        </div>
        {/* Rows */}
        {hitos.map((h:any)=>{const r=parseRange(h.periodo);const leftPct=((r.s-minY)/totalYears)*100;const widthPct=((r.e-r.s+1)/totalYears)*100;
          return(<div key={h.id} style={{display:"flex",alignItems:"center",marginBottom:6}}>
            <div style={{width:mob?120:200,flexShrink:0,paddingRight:8}}>
              <div style={{fontSize:11,fontWeight:700,color:colors.nv,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{h.name}</div>
              <div style={{fontSize:9,color:colors.g4}}>{h.fase} · {h.pct}%</div>
            </div>
            <div style={{flex:1,position:"relative" as const,height:24,background:colors.g1,borderRadius:4}}>
              <div style={{position:"absolute" as const,left:leftPct+"%",width:widthPct+"%",height:"100%",background:h.color+"30",borderRadius:4,overflow:"hidden"}}>
                <div style={{height:"100%",width:h.pct+"%",background:h.color,borderRadius:4}}/>
              </div>
            </div>
          </div>);})}
      </div>
    </Card>}
  </div>);
}
