"use client";
import { useState } from "react";
import { T, DEP_SEM, DEP_DIV } from "@/lib/constants";
import type { DepAthlete, DepCheckin } from "@/lib/supabase/types";
import { useC } from "@/lib/theme-context";
import { Card } from "@/components/ui";

/* semáforo score: normaliza (fatigue,stress,soreness invertidos) */
function semScore(c:DepCheckin):{score:number;color:string;bg:string;label:string}{
  const norm=(v:number,inv:boolean)=>inv?6-v:v;
  const avg=(norm(c.sleep,false)+norm(c.fatigue,true)+norm(c.stress,true)+norm(c.soreness,true)+norm(c.mood,false))/5;
  if(avg<=DEP_SEM.red.max) return{score:avg,color:DEP_SEM.red.c,bg:DEP_SEM.red.bg,label:DEP_SEM.red.l};
  if(avg<=DEP_SEM.yellow.max) return{score:avg,color:DEP_SEM.yellow.c,bg:DEP_SEM.yellow.bg,label:DEP_SEM.yellow.l};
  return{score:avg,color:DEP_SEM.green.c,bg:DEP_SEM.green.bg,label:DEP_SEM.green.l};
}

export function DashboardTab({athletes,checkins,injuries,latestCheckin,activeInjuries,mob,onSelectAth}:any){
  const{colors,cardBg}=useC();
  const [semF,sSemF]=useState("all");
  const byDiv:Record<string,DepAthlete[]>={};
  athletes.forEach((a:DepAthlete)=>{if(!byDiv[a.division])byDiv[a.division]=[];byDiv[a.division].push(a);});

  const total=athletes.length;
  const withCheckin=athletes.filter((a:DepAthlete)=>latestCheckin(a.id)).length;
  const injActive=athletes.reduce((acc:number,a:DepAthlete)=>acc+activeInjuries(a.id).length,0);
  const reds=athletes.filter((a:DepAthlete)=>{const lc=latestCheckin(a.id);return lc&&semScore(lc).score<=DEP_SEM.red.max;}).length;
  const yellows=athletes.filter((a:DepAthlete)=>{const lc=latestCheckin(a.id);return lc&&semScore(lc).score>DEP_SEM.red.max&&semScore(lc).score<=DEP_SEM.yellow.max;}).length;

  const filtered=athletes.filter((a:DepAthlete)=>{
    if(semF==="all") return true;
    const lc=latestCheckin(a.id);
    if(!lc) return semF==="none";
    const s=semScore(lc);
    if(semF==="red") return s.score<=DEP_SEM.red.max;
    if(semF==="yellow") return s.score>DEP_SEM.red.max&&s.score<=DEP_SEM.yellow.max;
    if(semF==="green") return s.score>DEP_SEM.yellow.max;
    return true;
  });

  return <div>
    <h2 style={{margin:"0 0 14px",fontSize:18,color:colors.nv}}>📊 Dashboard Deportivo</h2>
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(5,1fr)",gap:10,marginBottom:16}}>
      {[
        {l:"Jugadores",v:total,i:"👥",c:colors.bl},
        {l:"Con check-in",v:withCheckin+"/"+total,i:"💚",c:colors.gn},
        {l:"Lesiones activas",v:injActive,i:"🩹",c:colors.rd},
        {l:"En alerta",v:reds,i:"🔴",c:"#DC2626"},
        {l:"Precaución",v:yellows,i:"🟡",c:colors.yl},
      ].map((s,i)=><Card key={i} style={{textAlign:"center",padding:mob?12:16}}>
        <div style={{fontSize:20}}>{s.i}</div>
        <div style={{fontSize:mob?20:24,fontWeight:800,color:s.c}}>{s.v}</div>
        <div style={{fontSize:10,color:colors.g5}}>{s.l}</div>
      </Card>)}
    </div>

    <div style={{display:"flex",gap:4,marginBottom:14,flexWrap:"wrap" as const}}>
      {[{k:"all",l:"Todos"},{k:"red",l:"🔴 Alerta"},{k:"yellow",l:"🟡 Precaución"},{k:"green",l:"🟢 Óptimo"},{k:"none",l:"⚪ Sin datos"}].map(f=>
        <button key={f.k} onClick={()=>sSemF(f.k)} style={{padding:"5px 12px",borderRadius:16,border:semF===f.k?"2px solid "+colors.nv:"1px solid "+colors.g3,background:semF===f.k?colors.nv+"10":cardBg,color:semF===f.k?colors.nv:colors.g5,fontSize:11,fontWeight:600,cursor:"pointer"}}>{f.l}</button>
      )}
    </div>

    {/* Grid by division */}
    {Object.keys(byDiv).sort().map(div=>{
      const divAthletes=byDiv[div].filter(a=>filtered.includes(a));
      if(divAthletes.length===0) return null;
      return <div key={div} style={{marginBottom:16}}>
        <h3 style={{fontSize:14,color:colors.nv,margin:"0 0 8px",fontWeight:700}}>{div} ({divAthletes.length})</h3>
        <div style={{display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)",gap:8}}>
          {divAthletes.map(a=>{
            const lc=latestCheckin(a.id);const ai=activeInjuries(a.id);
            const sem=lc?semScore(lc):null;
            const daysSince=lc?Math.round((Date.now()-new Date(lc.date).getTime())/864e5):999;
            return <div key={a.id} onClick={()=>onSelectAth(a)} style={{background:cardBg,borderRadius:10,padding:mob?10:12,border:"1px solid "+(sem?sem.color+"40":colors.g3),cursor:"pointer",position:"relative" as const}}>
              {ai.length>0&&<span style={{position:"absolute" as const,top:4,right:6,fontSize:10}}>🩹</span>}
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:14,background:sem?sem.bg:colors.g2,display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid "+(sem?sem.color:colors.g3),flexShrink:0}}>
                  <span style={{fontSize:sem?10:12,fontWeight:800,color:sem?sem.color:colors.g4}}>{sem?sem.score.toFixed(1):"–"}</span>
                </div>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:700,color:colors.nv,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{a.last_name}</div>
                  <div style={{fontSize:10,color:colors.g5}}>{a.position||"–"}</div>
                </div>
              </div>
              {daysSince>2&&lc&&<div style={{fontSize:9,color:colors.yl,marginTop:4,fontWeight:600}}>⚠️ {daysSince}d sin check-in</div>}
              {!lc&&<div style={{fontSize:9,color:colors.g4,marginTop:4}}>Sin datos</div>}
            </div>;
          })}
        </div>
      </div>;
    })}
    {filtered.length===0&&<Card style={{textAlign:"center",padding:32,color:colors.g4}}><div style={{fontSize:32}}>📊</div><div style={{marginTop:8}}>No hay jugadores para mostrar</div></Card>}
  </div>;
}
