"use client";
import { useState } from "react";
import { T, DEP_WK, DEP_SEM } from "@/lib/constants";
import type { DepAthlete, DepCheckin } from "@/lib/supabase/types";
import { Btn, Card } from "@/components/ui";

const TODAY = new Date().toISOString().slice(0,10);
const WK_KEYS: (keyof typeof DEP_WK)[] = ["sleep","fatigue","stress","soreness","mood"];
const fmtD = (d:string)=>{if(!d)return"–";const p=d.slice(0,10).split("-");return p[2]+"/"+p[1]+"/"+p[0];};

/* semáforo score: normaliza (fatigue,stress,soreness invertidos) */
function semScore(c:DepCheckin):{score:number;color:string;bg:string;label:string}{
  const norm=(v:number,inv:boolean)=>inv?6-v:v;
  const avg=(norm(c.sleep,false)+norm(c.fatigue,true)+norm(c.stress,true)+norm(c.soreness,true)+norm(c.mood,false))/5;
  if(avg<=DEP_SEM.red.max) return{score:avg,color:DEP_SEM.red.c,bg:DEP_SEM.red.bg,label:DEP_SEM.red.l};
  if(avg<=DEP_SEM.yellow.max) return{score:avg,color:DEP_SEM.yellow.c,bg:DEP_SEM.yellow.bg,label:DEP_SEM.yellow.l};
  return{score:avg,color:DEP_SEM.green.c,bg:DEP_SEM.green.bg,label:DEP_SEM.green.l};
}

export function WellnessTab({athletes,checkins,onAdd,mob}:any){
  const [mode,sMode]=useState<"view"|"input">("view");
  const [dateF,sDateF]=useState(TODAY);
  const [curAth,sCurAth]=useState(0);
  const [vals,sVals]=useState({sleep:3,fatigue:3,stress:3,soreness:3,mood:3,notes:""});

  const dayCheckins=checkins.filter((c:DepCheckin)=>c.date===dateF);
  const checkedIds=new Set(dayCheckins.map((c:DepCheckin)=>c.athlete_id));
  const unchecked=athletes.filter((a:DepAthlete)=>!checkedIds.has(a.id));

  const startInput=(athId:number)=>{
    const existing=dayCheckins.find((c:DepCheckin)=>c.athlete_id===athId);
    if(existing) sVals({sleep:existing.sleep,fatigue:existing.fatigue,stress:existing.stress,soreness:existing.soreness,mood:existing.mood,notes:existing.notes});
    else sVals({sleep:3,fatigue:3,stress:3,soreness:3,mood:3,notes:""});
    sCurAth(athId);sMode("input");
  };

  const saveAndNext=()=>{
    if(!onAdd) return;
    onAdd({athlete_id:curAth,date:dateF,...vals});
    // Auto next unchecked
    const nextIdx=unchecked.findIndex((a:DepAthlete)=>a.id===curAth);
    const next=unchecked[nextIdx+1];
    if(next){sCurAth(next.id);sVals({sleep:3,fatigue:3,stress:3,soreness:3,mood:3,notes:""});}
    else sMode("view");
  };

  if(mode==="input"){
    const ath=athletes.find((a:DepAthlete)=>a.id===curAth);
    return <div>
      <Btn v="g" s="s" onClick={()=>sMode("view")} style={{marginBottom:12}}>← Volver</Btn>
      <Card>
        <h3 style={{margin:"0 0 4px",fontSize:14,color:T.nv}}>Check-in: {ath?.first_name} {ath?.last_name}</h3>
        <div style={{fontSize:11,color:T.g5,marginBottom:14}}>{ath?.division} · {fmtD(dateF)}</div>
        {WK_KEYS.map(k=>{
          const cfg=DEP_WK[k];const v=(vals as any)[k];
          return <div key={k} style={{marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <span style={{fontSize:12,fontWeight:600,color:T.nv}}>{cfg.i} {cfg.l}</span>
              <span style={{fontSize:12,fontWeight:700,color:v>=4?T.gn:v>=3?T.yl:T.rd}}>{v} - {cfg.labels[v-1]}</span>
            </div>
            <div style={{display:"flex",gap:6}}>
              {[1,2,3,4,5].map(n=><button key={n} onClick={()=>sVals(prev=>({...prev,[k]:n}))} style={{flex:1,padding:"10px 0",borderRadius:8,border:(vals as any)[k]===n?"2px solid "+T.nv:"1px solid "+T.g3,background:(vals as any)[k]===n?T.nv:"#fff",color:(vals as any)[k]===n?"#fff":T.g5,fontSize:14,fontWeight:700,cursor:"pointer"}}>{n}</button>)}
            </div>
          </div>;
        })}
        <div style={{marginBottom:10}}><label style={{fontSize:11,fontWeight:600,color:T.g5}}>Notas</label><textarea value={vals.notes} onChange={e=>sVals(prev=>({...prev,notes:e.target.value}))} rows={2} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,resize:"vertical" as const,boxSizing:"border-box" as const,marginTop:3}}/></div>
        <div style={{display:"flex",gap:8}}>
          <Btn v="s" onClick={saveAndNext}>💾 Guardar{unchecked.length>1?" y siguiente":""}</Btn>
          <Btn v="g" onClick={()=>sMode("view")}>Cancelar</Btn>
        </div>
      </Card>
    </div>;
  }

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <h2 style={{margin:0,fontSize:18,color:T.nv}}>💚 Wellness</h2>
      <input type="date" value={dateF} onChange={e=>sDateF(e.target.value)} style={{padding:"6px 10px",borderRadius:8,border:"1px solid "+T.g3,fontSize:12}}/>
    </div>

    {/* Summary */}
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(3,1fr)",gap:10,marginBottom:14}}>
      <Card style={{textAlign:"center",padding:12}}><div style={{fontSize:20,fontWeight:800,color:T.gn}}>{dayCheckins.length}</div><div style={{fontSize:10,color:T.g5}}>Registrados</div></Card>
      <Card style={{textAlign:"center",padding:12}}><div style={{fontSize:20,fontWeight:800,color:T.yl}}>{unchecked.length}</div><div style={{fontSize:10,color:T.g5}}>Pendientes</div></Card>
      {!mob&&<Card style={{textAlign:"center",padding:12}}><div style={{fontSize:20,fontWeight:800,color:T.bl}}>{athletes.length}</div><div style={{fontSize:10,color:T.g5}}>Total plantel</div></Card>}
    </div>

    {/* Batch start */}
    {onAdd&&unchecked.length>0&&<Card style={{marginBottom:14,background:"#F0FDF4",border:"1px solid #BBF7D0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontSize:13,fontWeight:700,color:"#166534"}}>{unchecked.length} jugador{unchecked.length>1?"es":""} sin check-in</div><div style={{fontSize:11,color:"#15803D"}}>Completá los registros del día</div></div>
        <Btn v="s" onClick={()=>startInput(unchecked[0].id)}>▶ Iniciar</Btn>
      </div>
    </Card>}

    {/* Day grid */}
    {dayCheckins.length>0&&<Card>
      <h3 style={{margin:"0 0 10px",fontSize:13,color:T.nv}}>Registros del {fmtD(dateF)}</h3>
      <div style={{overflowX:"auto" as const}}>
        <table style={{width:"100%",borderCollapse:"collapse" as const,fontSize:11}}>
          <thead><tr style={{borderBottom:"2px solid "+T.g2}}>
            <th style={{textAlign:"left" as const,padding:"6px 8px",color:T.g5,fontWeight:700}}>Jugador</th>
            {WK_KEYS.map(k=><th key={k} style={{textAlign:"center" as const,padding:"6px 4px",color:T.g5,fontWeight:700}}>{DEP_WK[k].i}</th>)}
            <th style={{textAlign:"center" as const,padding:"6px 4px",color:T.g5,fontWeight:700}}>Score</th>
          </tr></thead>
          <tbody>{dayCheckins.map((c:DepCheckin)=>{
            const sem=semScore(c);
            return <tr key={c.id} onClick={()=>{if(onAdd) startInput(c.athlete_id);}} style={{borderBottom:"1px solid "+T.g1,cursor:onAdd?"pointer":"default"}}>
              <td style={{padding:"6px 8px",fontWeight:600,color:T.nv}}>{c.athlete_name}</td>
              {WK_KEYS.map(k=>{const v=(c as any)[k];return<td key={k} style={{textAlign:"center" as const,padding:"6px 4px",fontWeight:700,color:v>=4?T.gn:v>=3?T.yl:T.rd}}>{v}</td>;})}
              <td style={{textAlign:"center" as const,padding:"6px 4px"}}><span style={{background:sem.bg,color:sem.color,padding:"2px 8px",borderRadius:10,fontWeight:700}}>{sem.score.toFixed(1)}</span></td>
            </tr>;
          })}</tbody>
        </table>
      </div>
    </Card>}

    {/* Unchecked list */}
    {unchecked.length>0&&onAdd&&<div style={{marginTop:14}}>
      <h3 style={{fontSize:13,color:T.g5,margin:"0 0 8px"}}>Pendientes de check-in</h3>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:6}}>
        {unchecked.map((a:DepAthlete)=><div key={a.id} onClick={()=>startInput(a.id)} style={{padding:"8px 12px",background:"#fff",borderRadius:8,border:"1px solid "+T.g3,cursor:"pointer",fontSize:12,fontWeight:600,color:T.nv}}>{a.last_name}, {a.first_name} <span style={{color:T.g4,fontWeight:400}}>({a.division})</span></div>)}
      </div>
    </div>}

    {dayCheckins.length===0&&unchecked.length===0&&<Card style={{textAlign:"center",padding:24,color:T.g4}}><div style={{fontSize:24}}>💚</div><div style={{marginTop:6,fontSize:12}}>No hay jugadores para mostrar</div></Card>}
  </div>;
}
