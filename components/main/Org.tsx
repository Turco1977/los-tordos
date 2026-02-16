"use client";
import { useState } from "react";
import { T, ROLES, fn } from "@/lib/constants";
import { Btn, Card, Bread } from "@/components/ui";

function OrgNode({icon,title,sub,color,children,cnt,ex,onTog,mob}:any){return(<div style={{marginBottom:6}}><div onClick={onTog} style={{display:"flex",alignItems:"center",gap:8,padding:mob?"8px 10px":"10px 14px",background:"#fff",borderRadius:10,border:"1px solid "+T.g2,cursor:"pointer",borderLeft:"4px solid "+color}}><span style={{fontSize:18}}>{icon}</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:T.nv}}>{title}</div>{sub&&<div style={{fontSize:10,color:T.g4}}>{sub}</div>}</div>{cnt!==undefined&&<span style={{background:T.g1,borderRadius:12,padding:"1px 8px",fontSize:10,fontWeight:600,color:T.g5}}>{cnt}</span>}<span style={{fontSize:12,color:T.g4,transform:ex?"rotate(90deg)":"none",transition:"transform .2s"}}>▶</span></div>{ex&&<div style={{marginLeft:mob?12:24,marginTop:4,borderLeft:"2px solid "+color+"22",paddingLeft:mob?8:14}}>{children}</div>}</div>);}

function OrgMember({m,isSA,onEdit,onDel,onAssign,onUp,onDown,isFirst,isLast}:any){const ok=m.n&&m.a;return(<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 10px",background:ok?"#FAFAFA":T.g1,borderRadius:7,border:"1px solid "+T.g2,marginBottom:3}}><div><div style={{fontSize:9,fontWeight:700,color:T.rd,textTransform:"uppercase" as const}}>{m.cargo}</div>{ok?<div style={{fontSize:12,fontWeight:700,color:T.nv}}>{m.n} {m.a}</div>:<div style={{fontSize:11,color:T.g3,fontStyle:"italic"}}>Sin asignar</div>}</div><div style={{display:"flex",gap:3,alignItems:"center"}}>{isSA&&onUp&&!isFirst&&<Btn v="g" s="s" onClick={()=>onUp(m.id)}>▲</Btn>}{isSA&&onDown&&!isLast&&<Btn v="g" s="s" onClick={()=>onDown(m.id)}>▼</Btn>}{ok&&onAssign&&<span title="Asignar tarea"><Btn v="g" s="s" onClick={()=>onAssign(m)}>📋</Btn></span>}{isSA&&<Btn v="g" s="s" onClick={()=>onEdit(m)}>✏️</Btn>}{isSA&&<Btn v="g" s="s" onClick={()=>onDel&&onDel(m.id)} style={{color:T.rd}}>🗑️</Btn>}</div></div>);}

/* ── Academia ── */
const AC_C={dir:"#1E3A5F",rugby:"#DC2626",hockey:"#EC4899",pf:"#F59E0B",med:"#10B981",sup:"#DC2626",juv:"#F59E0B",inf:"#3B82F6",esc:"#10B981"};
function P({cargo,name,color,star}:{cargo:string;name:string;color:string;star?:boolean}){
  const v=!name;return(<div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",background:v?T.g1:star?"#FEE2E2":"#FAFAFA",borderRadius:7,border:"1px solid "+(star?"#FECACA":T.g2),marginBottom:3}}>
  <span style={{fontSize:10}}>{v?"⬜":star?"⭐":"👤"}</span><div><div style={{fontSize:9,fontWeight:700,color,textTransform:"uppercase" as const}}>{cargo}</div>{v?<div style={{fontSize:11,color:T.g3,fontStyle:"italic"}}>Vacante</div>:<div style={{fontSize:12,fontWeight:700,color:T.nv}}>{name}</div>}</div></div>);
}
/* Each division node groups its entrenador + PF together */
function DivNode({div,ent,pf,color,mob,ex,tog,k}:any){
  const staff=[ent&&{cargo:"Entrenador",name:ent},pf&&{cargo:"Prep. Física",name:pf}].filter(Boolean);
  return(<OrgNode mob={mob} icon="🏉" title={div} color={color} ex={!!ex[k]} onTog={()=>tog(k)} cnt={staff.filter((s:any)=>s.name).length+"/"+staff.length}>
    {staff.map((s:any,i:number)=><P key={i} cargo={s.cargo} name={s.name||""} color={color}/>)}
  </OrgNode>);
}

function AcademiaOrg({mob,ex,tog}:any){
  return(<div>
    {/* Director Deportivo = nodo raíz, de él se desprenden las 4 ramas */}
    <OrgNode mob={mob} icon="🎯" title="Director Deportivo" sub="Franco Lucchini" color={AC_C.dir} ex={!!ex.acDD} onTog={()=>tog("acDD")}>
      <P cargo="Director Deportivo" name="Franco Lucchini" color={AC_C.dir} star/>

      {/* ── 1. DIRECTOR DE RUGBY ── */}
      <OrgNode mob={mob} icon="🏉" title="Director de Rugby" sub="Fernando Higgs" color={AC_C.rugby} ex={!!ex.acDR} onTog={()=>tog("acDR")} cnt="18">
        <P cargo="Director de Rugby" name="Fernando Higgs" color={AC_C.rugby} star/>

        <OrgNode mob={mob} icon="📋" title="Coordinadores de Especialidad" color={AC_C.rugby} ex={!!ex.acCo} onTog={()=>tog("acCo")} cnt="4">
          <P cargo="Coord. Infantiles" name="Carlos Efimenco" color={AC_C.rugby}/>
          <P cargo="Coord. Ataque" name="Ricardo Donna" color={AC_C.rugby}/>
          <P cargo="Coord. LINE" name="Juan Ignacio Castillo" color={AC_C.rugby}/>
          <P cargo="Coord. SCRUM" name="Martin Silva" color={AC_C.rugby}/>
        </OrgNode>

        <OrgNode mob={mob} icon="🎽" title="Entrenadores" color={AC_C.rugby} ex={!!ex.acEnt} onTog={()=>tog("acEnt")} cnt="13">
          <OrgNode mob={mob} icon="🔴" title="Plantel Superior" color={AC_C.sup} ex={!!ex.acPS} onTog={()=>tog("acPS")} cnt="1">
            <P cargo="Entrenador" name="Pedro Garcia" color={AC_C.sup}/>
          </OrgNode>
          <OrgNode mob={mob} icon="🟡" title="M19" color={AC_C.juv} ex={!!ex.acM19} onTog={()=>tog("acM19")} cnt="1">
            <P cargo="Entrenador" name="Nicolas Ranieri" color={AC_C.juv}/>
          </OrgNode>
          <OrgNode mob={mob} icon="🟡" title="M17" color={AC_C.juv} ex={!!ex.acM17} onTog={()=>tog("acM17")} cnt="1">
            <P cargo="Entrenador" name="Gonzalo Intzes" color={AC_C.juv}/>
          </OrgNode>
          <OrgNode mob={mob} icon="🟡" title="M16" color={AC_C.juv} ex={!!ex.acM16} onTog={()=>tog("acM16")} cnt="1">
            <P cargo="Entrenador" name="Rodolfo Guerra" color={AC_C.juv}/>
          </OrgNode>
          <OrgNode mob={mob} icon="🟡" title="M15" color={AC_C.juv} ex={!!ex.acM15} onTog={()=>tog("acM15")} cnt="1">
            <P cargo="Entrenador" name="Sebastian Salas" color={AC_C.juv}/>
          </OrgNode>
          <OrgNode mob={mob} icon="🔵" title="M14" color={AC_C.inf} ex={!!ex.acM14} onTog={()=>tog("acM14")} cnt="1">
            <P cargo="Entrenador" name="Enrique Arroyo" color={AC_C.inf}/>
          </OrgNode>
          <OrgNode mob={mob} icon="🔵" title="M13" color={AC_C.inf} ex={!!ex.acM13} onTog={()=>tog("acM13")} cnt="1">
            <P cargo="Entrenador" name="Ramiro Pontis Day" color={AC_C.inf}/>
          </OrgNode>
          <OrgNode mob={mob} icon="🔵" title="M12" color={AC_C.inf} ex={!!ex.acM12} onTog={()=>tog("acM12")} cnt="1">
            <P cargo="Entrenador" name="Fabian Guzzo" color={AC_C.inf}/>
          </OrgNode>
          <OrgNode mob={mob} icon="🔵" title="M11" color={AC_C.inf} ex={!!ex.acM11} onTog={()=>tog("acM11")} cnt="1">
            <P cargo="Entrenador" name="Maximiliano Ortega" color={AC_C.inf}/>
          </OrgNode>
          <OrgNode mob={mob} icon="🔵" title="M10" color={AC_C.inf} ex={!!ex.acM10} onTog={()=>tog("acM10")} cnt="1">
            <P cargo="Entrenador" name="Martin Sanchez" color={AC_C.inf}/>
          </OrgNode>
          <OrgNode mob={mob} icon="🟢" title="M9" color={AC_C.esc} ex={!!ex.acM9} onTog={()=>tog("acM9")} cnt="1">
            <P cargo="Entrenador" name="Daniel Pont Lezica" color={AC_C.esc}/>
          </OrgNode>
          <OrgNode mob={mob} icon="🟢" title="M8" color={AC_C.esc} ex={!!ex.acM8} onTog={()=>tog("acM8")} cnt="1">
            <P cargo="Entrenador" name="Javier Badano" color={AC_C.esc}/>
          </OrgNode>
          <OrgNode mob={mob} icon="🟢" title="Escuelita" color={AC_C.esc} ex={!!ex.acEsc} onTog={()=>tog("acEsc")} cnt="1">
            <P cargo="Entrenador" name="Joel Aguero" color={AC_C.esc}/>
          </OrgNode>
        </OrgNode>
      </OrgNode>

      {/* ── 2. DIRECTOR DE HOCKEY ── */}
      <OrgNode mob={mob} icon="🏑" title="Director de Hockey" sub="Florencia Marquez" color={AC_C.hockey} ex={!!ex.acDH} onTog={()=>tog("acDH")} cnt="1">
        <P cargo="Director Hockey" name="Florencia Marquez" color={AC_C.hockey} star/>
        <P cargo="Coordinador" name="" color={AC_C.hockey}/>
        <div style={{fontSize:10,color:T.g4,fontStyle:"italic",padding:4}}>Entrenadores por definir</div>
      </OrgNode>

      {/* ── 3. COORDINADOR PREP. FÍSICA ── */}
      <OrgNode mob={mob} icon="💪" title="Coordinador Preparación Física" sub="Matias Elias" color={AC_C.pf} ex={!!ex.acPF} onTog={()=>tog("acPF")}>
        <P cargo="Coordinador PF" name="Matias Elias" color={AC_C.pf} star/>
        <div style={{fontSize:10,color:T.g4,padding:"4px 0"}}>Los PFs están asignados a cada división dentro de Director de Rugby</div>
      </OrgNode>

      {/* ── 4. EQUIPO MÉDICO ── */}
      <OrgNode mob={mob} icon="🩺" title="Equipo Médico" color={AC_C.med} ex={!!ex.acMed} onTog={()=>tog("acMed")} cnt="5">
        <P cargo="Médico" name="" color={AC_C.med}/>
        <P cargo="Kinesiólogo Rugby" name="Martin Azcurra" color={AC_C.med}/>
        <P cargo="Kinesiólogo Hockey" name="Carolina Armani" color={AC_C.med}/>
        <P cargo="Nutricionista" name="Matias Zanni" color={AC_C.med}/>
        <P cargo="Psicóloga" name="Veronica Gomez" color={AC_C.med}/>
      </OrgNode>
    </OrgNode>
  </div>);
}

export function Org({areas,deptos,users,om,onEditSave,onDelOm,onDelUser,onEditUser,isSA,onAssignTask,mob,pedidos,onSel,KPIs,Circles,DeptCircles,TList,onReorderOm,onReorderUser}:any){
  const [ex,sEx]=useState<any>({});const [ed,sEd]=useState<any>(null);const [ef,sEf]=useState({n:"",a:"",mail:"",tel:""});
  const [tab,sTab]=useState("struct");const [tA,sTa]=useState<number|null>(null);const [tD,sTd]=useState<number|null>(null);
  const tog=(k:string)=>sEx((p:any)=>({...p,[k]:!p[k]}));
  const findUser=(m:any)=>users.find((u:any)=>u.mail&&m.mail&&u.mail===m.mail)||users.find((u:any)=>u.n===m.n&&u.a===m.a);
  /* Depts sub-view */
  const tArea=tA?areas.find((a:any)=>a.id===tA):null;
  const tDepto=tD?deptos.find((d:any)=>d.id===tD):null;
  const tDeptoArea=tDepto?areas.find((a:any)=>a.id===tDepto.aId):null;
  const tPeds=tD?(pedidos||[]).filter((p:any)=>p.dId===tD):[];
  const tAreaIds=tA?deptos.filter((d:any)=>d.aId===tA).map((d:any)=>d.id):[];
  const tAreaPeds=tA?(pedidos||[]).filter((p:any)=>tAreaIds.indexOf(p.dId)>=0):[];
  return(<div style={{maxWidth:mob?undefined:720}}>
    <h2 style={{margin:"0 0 4px",fontSize:mob?16:19,color:T.nv,fontWeight:800}}>{tab==="academia"?"Academia Tordos":"Organigrama"}</h2><p style={{color:T.g4,fontSize:12,margin:"0 0 12px"}}>{tab==="academia"?"Estructura deportiva — Staff técnico y médico":"Estructura institucional Los Tordos Rugby Club"}</p>
    <div style={{display:"flex",gap:4,marginBottom:14}}>
      {[{k:"struct",l:"👥 Estructura"},{k:"academia",l:"🏉 Academia"},{k:"tasks",l:"📋 Departamentos"}].map(t=><button key={t.k} onClick={()=>{sTab(t.k);sTa(null);sTd(null);}} style={{padding:"7px 16px",borderRadius:8,border:"none",background:tab===t.k?T.nv:"#fff",color:tab===t.k?"#fff":T.g5,fontSize:12,fontWeight:600,cursor:"pointer"}}>{t.l}</button>)}
    </div>
    {tab==="struct"&&<div style={{maxWidth:mob?undefined:680}}>
    {ed&&<Card style={{marginBottom:12,maxWidth:mob?undefined:400,background:"#FFFBEB",border:"1px solid #FDE68A"}}><div style={{fontSize:11,fontWeight:600,color:T.g5,marginBottom:6}}>Editando: {ed.cargo}</div><div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:4,marginBottom:4}}><input value={ef.n} onChange={e=>sEf(p=>({...p,n:e.target.value}))} placeholder="Nombre" style={{padding:"6px 8px",borderRadius:6,border:"1px solid "+T.g3,fontSize:12}}/><input value={ef.a} onChange={e=>sEf(p=>({...p,a:e.target.value}))} placeholder="Apellido" style={{padding:"6px 8px",borderRadius:6,border:"1px solid "+T.g3,fontSize:12}}/></div><div style={{display:"flex",gap:4}}><Btn s="s" onClick={()=>{onEditSave(ed.id,ef);sEd(null);}}>Guardar</Btn><Btn v="g" s="s" onClick={()=>sEd(null)}>✕</Btn></div></Card>}
    <OrgNode mob={mob} icon="🏛️" title="Comisión Directiva" color={T.nv} ex={!!ex.cd} onTog={()=>tog("cd")} cnt={om.filter((m:any)=>m.t==="cd"&&m.n).length+"/8"}>{om.filter((m:any)=>m.t==="cd").sort((a:any,b:any)=>(a.so||0)-(b.so||0)).map((m:any,i:number,arr:any[])=><OrgMember key={m.id} m={m} isSA={isSA} isFirst={i===0} isLast={i===arr.length-1} onUp={onReorderOm?(id:string)=>onReorderOm(id,"up","cd"):undefined} onDown={onReorderOm?(id:string)=>onReorderOm(id,"down","cd"):undefined} onEdit={(mm:any)=>{sEd(mm);sEf({n:mm.n,a:mm.a,mail:mm.mail,tel:mm.tel});}} onDel={(id:string)=>onDelOm(id)} onAssign={(mm:any)=>{const u=findUser(mm);if(u)onAssignTask(u);}}/>)}</OrgNode>
    <OrgNode mob={mob} icon="⚡" title="Secretaría Ejecutiva" sub="Depende de CD" color={T.rd} ex={!!ex.se} onTog={()=>tog("se")} cnt={om.filter((m:any)=>m.t==="se"&&m.n).length+"/5"}>{om.filter((m:any)=>m.t==="se").sort((a:any,b:any)=>(a.so||0)-(b.so||0)).map((m:any,i:number,arr:any[])=><OrgMember key={m.id} m={m} isSA={isSA} isFirst={i===0} isLast={i===arr.length-1} onUp={onReorderOm?(id:string)=>onReorderOm(id,"up","se"):undefined} onDown={onReorderOm?(id:string)=>onReorderOm(id,"down","se"):undefined} onEdit={(mm:any)=>{sEd(mm);sEf({n:mm.n,a:mm.a,mail:mm.mail,tel:mm.tel});}} onDel={(id:string)=>onDelOm(id)} onAssign={(mm:any)=>{const u=findUser(mm);if(u)onAssignTask(u);}}/>)}</OrgNode>
    <div style={{marginLeft:mob?12:24,borderLeft:"2px solid "+T.rd+"22",paddingLeft:mob?8:14}}>
      {areas.filter((ar:any)=>ar.id!==100&&ar.id!==101).map((ar:any)=>{const ds=deptos.filter((d:any)=>d.aId===ar.id);const dsWithPeople=ds.filter((d:any)=>users.some((u:any)=>u.dId===d.id));return(<OrgNode mob={mob} key={ar.id} icon={ar.icon} title={ar.name} sub={dsWithPeople.length+" deptos"} color={ar.color} ex={!!ex["ar"+ar.id]} onTog={()=>tog("ar"+ar.id)} cnt={dsWithPeople.length}>{dsWithPeople.map((d:any)=>{const pp=users.filter((u:any)=>u.dId===d.id).sort((a:any,b:any)=>(a.so||0)-(b.so||0));const resp=pp.find((u:any)=>u.role==="coordinador")||pp.find((u:any)=>u.role==="admin")||pp[0];const others=pp.filter((u:any)=>u.id!==(resp?resp.id:""));return(<OrgNode mob={mob} key={d.id} icon="📂" title={d.name} color={ar.color} ex={!!ex["d"+d.id]} onTog={()=>tog("d"+d.id)} cnt={pp.length}>
            {resp&&<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:6,padding:"6px 10px",background:"#FEE2E2",borderRadius:7,border:"1px solid #FECACA",marginBottom:4}}><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:10}}>⭐</span><div><div style={{fontSize:9,fontWeight:700,color:T.rd,textTransform:"uppercase" as const}}>Responsable</div><div style={{fontSize:12,fontWeight:700,color:T.nv}}>{fn(resp)}</div></div></div><div style={{display:"flex",gap:3,alignItems:"center"}}>{isSA&&onReorderUser&&pp.indexOf(resp)>0&&<Btn v="g" s="s" onClick={()=>onReorderUser(resp.id,"up",d.id)}>▲</Btn>}{isSA&&onReorderUser&&pp.indexOf(resp)<pp.length-1&&<Btn v="g" s="s" onClick={()=>onReorderUser(resp.id,"down",d.id)}>▼</Btn>}{isSA&&<Btn v="g" s="s" onClick={()=>onEditUser(resp)}>✏️</Btn>}{isSA&&<Btn v="g" s="s" onClick={()=>onDelUser(resp.id)} style={{color:T.rd}}>🗑️</Btn>}</div></div>}
            {others.map((u:any,ui:number)=>{const uIdx=pp.indexOf(u);return(<div key={u.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:6,padding:"6px 10px",background:"#FAFAFA",borderRadius:7,border:"1px solid "+T.g2,marginBottom:3}}><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:10}}>👤</span><div><div style={{fontSize:9,fontWeight:700,color:T.rd,textTransform:"uppercase" as const}}>{u.div||ROLES[u.role]?.l||""}</div><div style={{fontSize:12,fontWeight:700,color:T.nv}}>{fn(u)}</div></div></div><div style={{display:"flex",gap:3,alignItems:"center"}}>{isSA&&onReorderUser&&uIdx>0&&<Btn v="g" s="s" onClick={()=>onReorderUser(u.id,"up",d.id)}>▲</Btn>}{isSA&&onReorderUser&&uIdx<pp.length-1&&<Btn v="g" s="s" onClick={()=>onReorderUser(u.id,"down",d.id)}>▼</Btn>}{isSA&&<Btn v="g" s="s" onClick={()=>onEditUser(u)}>✏️</Btn>}{isSA&&<Btn v="g" s="s" onClick={()=>onDelUser(u.id)} style={{color:T.rd}}>🗑️</Btn>}</div></div>);})}
            {others.length===0&&!resp&&<div style={{fontSize:10,color:T.g4,fontStyle:"italic",padding:4}}>Sin integrantes</div>}
          </OrgNode>);})}</OrgNode>);})}
    </div>
    </div>}
    {tab==="academia"&&<div style={{maxWidth:mob?undefined:680}}>
      <AcademiaOrg mob={mob} ex={ex} tog={tog}/>
    </div>}
    {tab==="tasks"&&!tA&&!tD&&<div>
      {KPIs&&<KPIs peds={pedidos||[]} mob={mob}/>}
      {Circles&&<Circles areas={areas} deptos={deptos} pedidos={pedidos||[]} onAC={(id:number)=>{sTa(id);sTd(null);}} mob={mob}/>}
    </div>}
    {tab==="tasks"&&tA&&!tD&&<div>
      <Bread parts={[{label:"Áreas",onClick:()=>{sTa(null);sTd(null);}},{label:tArea?.name||""}]} mob={mob}/>
      <h2 style={{margin:"0 0 4px",fontSize:mob?16:19,color:T.nv,fontWeight:800}}>{tArea?.icon} {tArea?.name}</h2>
      <p style={{color:T.g4,fontSize:12,margin:"0 0 14px"}}>{deptos.filter((d:any)=>d.aId===tA).length} departamentos · {tAreaPeds.length} tareas</p>
      {KPIs&&<KPIs peds={tAreaPeds} mob={mob}/>}
      {DeptCircles&&<DeptCircles area={tArea} deptos={deptos} pedidos={pedidos||[]} onDC={(id:number)=>sTd(id)} mob={mob}/>}
    </div>}
    {tab==="tasks"&&tD&&tDepto&&<div>
      <Bread parts={[{label:"Áreas",onClick:()=>{sTa(null);sTd(null);}},{label:tDeptoArea?.name||"",onClick:()=>sTd(null)},{label:tDepto.name}]} mob={mob}/>
      {TList&&<TList title={tDepto.name} icon="📂" color={tDeptoArea?tDeptoArea.color:T.nv} peds={tPeds} users={users} onSel={onSel} search="" mob={mob}/>}
    </div>}
  </div>);
}
