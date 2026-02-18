"use client";
import { useState } from "react";
import { T, DEP_INJ_SEV } from "@/lib/constants";
import type { DepAthlete, DepInjury } from "@/lib/supabase/types";
import { Btn, Card } from "@/components/ui";

const fmtD = (d:string)=>{if(!d)return"–";const p=d.slice(0,10).split("-");return p[2]+"/"+p[1]+"/"+p[0];};

export function InjuriesList({injuries,filteredAthletes,onSelect,onNew,mob,divF}:any){
  const [stF,sStF]=useState("activa");
  const athIds=new Set(filteredAthletes.map((a:DepAthlete)=>a.id));
  const filtered=injuries.filter((i:DepInjury)=>{
    if(divF!=="all"&&!athIds.has(i.athlete_id)) return false;
    if(stF!=="all"&&i.status!==stF) return false;
    return true;
  });
  const activas=injuries.filter((i:DepInjury)=>i.status==="activa"&&(divF==="all"||athIds.has(i.athlete_id))).length;
  const recup=injuries.filter((i:DepInjury)=>i.status==="recuperacion"&&(divF==="all"||athIds.has(i.athlete_id))).length;

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <h2 style={{margin:0,fontSize:18,color:T.nv}}>🩹 Lesiones</h2>
      {onNew&&<Btn v="r" s="s" onClick={onNew}>+ Nueva lesión</Btn>}
    </div>
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(3,1fr)",gap:10,marginBottom:14}}>
      <Card style={{textAlign:"center",padding:12}}><div style={{fontSize:20,fontWeight:800,color:T.rd}}>{activas}</div><div style={{fontSize:10,color:T.g5}}>Activas</div></Card>
      <Card style={{textAlign:"center",padding:12}}><div style={{fontSize:20,fontWeight:800,color:T.yl}}>{recup}</div><div style={{fontSize:10,color:T.g5}}>Recuperación</div></Card>
      {!mob&&<Card style={{textAlign:"center",padding:12}}><div style={{fontSize:20,fontWeight:800,color:T.gn}}>{injuries.filter((i:DepInjury)=>i.status==="alta").length}</div><div style={{fontSize:10,color:T.g5}}>Dadas de alta</div></Card>}
    </div>
    <div style={{display:"flex",gap:4,marginBottom:14}}>
      {[{k:"activa",l:"Activas"},{k:"recuperacion",l:"Recuperación"},{k:"alta",l:"Altas"},{k:"all",l:"Todas"}].map(f=>
        <button key={f.k} onClick={()=>sStF(f.k)} style={{padding:"5px 12px",borderRadius:16,border:stF===f.k?"2px solid "+T.nv:"1px solid "+T.g3,background:stF===f.k?T.nv+"10":"#fff",color:stF===f.k?T.nv:T.g5,fontSize:11,fontWeight:600,cursor:"pointer"}}>{f.l}</button>
      )}
    </div>
    <div style={{display:"flex",flexDirection:"column" as const,gap:8}}>
      {filtered.map((inj:DepInjury)=>{
        const sv=DEP_INJ_SEV[inj.severity];
        return <Card key={inj.id} onClick={()=>onSelect(inj)} style={{cursor:"pointer"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:T.nv}}>{inj.athlete_name}</div>
              <div style={{fontSize:12,color:T.g5}}>{inj.type} - {inj.zone}{inj.muscle?" ("+inj.muscle+")":""}</div>
              <div style={{fontSize:10,color:T.g4,marginTop:2}}>{fmtD(inj.date_injury)}{inj.description?" · "+inj.description.slice(0,50):""}</div>
            </div>
            <div style={{display:"flex",gap:4,alignItems:"center"}}>
              <span style={{background:sv?.bg,color:sv?.c,padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:700}}>{sv?.l}</span>
              <span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:inj.status==="alta"?"#D1FAE5":inj.status==="recuperacion"?"#FEF3C7":"#FEE2E2",color:inj.status==="alta"?T.gn:inj.status==="recuperacion"?T.yl:T.rd,fontWeight:600}}>{inj.status==="alta"?"Alta":inj.status==="recuperacion"?"Recup.":"Activa"}</span>
            </div>
          </div>
        </Card>;
      })}
      {filtered.length===0&&<Card style={{textAlign:"center",padding:24,color:T.g4}}><div style={{fontSize:24}}>🩹</div><div style={{marginTop:6,fontSize:12}}>No hay lesiones con ese filtro</div></Card>}
    </div>
  </div>;
}
