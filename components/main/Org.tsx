"use client";
import { useState } from "react";
import { T, ROLES, fn } from "@/lib/constants";
import { Btn, Card, Bread } from "@/components/ui";

function OrgNode({icon,title,sub,color,children,cnt,ex,onTog,mob}:any){return(<div style={{marginBottom:6}}><div onClick={onTog} style={{display:"flex",alignItems:"center",gap:8,padding:mob?"8px 10px":"10px 14px",background:"#fff",borderRadius:10,border:"1px solid "+T.g2,cursor:"pointer",borderLeft:"4px solid "+color}}><span style={{fontSize:18}}>{icon}</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:T.nv}}>{title}</div>{sub&&<div style={{fontSize:10,color:T.g4}}>{sub}</div>}</div>{cnt!==undefined&&<span style={{background:T.g1,borderRadius:12,padding:"1px 8px",fontSize:10,fontWeight:600,color:T.g5}}>{cnt}</span>}<span style={{fontSize:12,color:T.g4,transform:ex?"rotate(90deg)":"none",transition:"transform .2s"}}>▶</span></div>{ex&&<div style={{marginLeft:mob?12:24,marginTop:4,borderLeft:"2px solid "+color+"22",paddingLeft:mob?8:14}}>{children}</div>}</div>);}

function OrgMember({m,isSA,onEdit,onDel,onAssign,onUp,onDown,isFirst,isLast}:any){const ok=m.n&&m.a;return(<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 10px",background:ok?"#FAFAFA":T.g1,borderRadius:7,border:"1px solid "+T.g2,marginBottom:3}}><div><div style={{fontSize:9,fontWeight:700,color:T.rd,textTransform:"uppercase" as const}}>{m.cargo}</div>{ok?<div style={{fontSize:12,fontWeight:700,color:T.nv}}>{m.n} {m.a}</div>:<div style={{fontSize:11,color:T.g3,fontStyle:"italic"}}>Sin asignar</div>}</div><div style={{display:"flex",gap:3,alignItems:"center"}}>{isSA&&onUp&&!isFirst&&<Btn v="g" s="s" onClick={()=>onUp(m.id)}>▲</Btn>}{isSA&&onDown&&!isLast&&<Btn v="g" s="s" onClick={()=>onDown(m.id)}>▼</Btn>}{ok&&onAssign&&<span title="Asignar tarea"><Btn v="g" s="s" onClick={()=>onAssign(m)}>📋</Btn></span>}{isSA&&<Btn v="g" s="s" onClick={()=>onEdit(m)}>✏️</Btn>}{isSA&&<Btn v="g" s="s" onClick={()=>onDel&&onDel(m.id)} style={{color:T.rd}}>🗑️</Btn>}</div></div>);}

/* ── Academia data ── */
function AcPerson({cargo,name,div,color,mob}:{cargo:string;name:string;div?:string;color:string;mob?:boolean}){
  const vacant=!name;
  return(<div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",background:vacant?T.g1:"#FAFAFA",borderRadius:7,border:"1px solid "+T.g2,marginBottom:3}}>
    <span style={{fontSize:10}}>{vacant?"⬜":"👤"}</span>
    <div style={{flex:1}}>
      <div style={{fontSize:9,fontWeight:700,color:color,textTransform:"uppercase" as const}}>{cargo}{div?" · "+div:""}</div>
      {vacant?<div style={{fontSize:11,color:T.g3,fontStyle:"italic"}}>Vacante</div>
      :<div style={{fontSize:12,fontWeight:700,color:T.nv}}>{name}</div>}
    </div>
  </div>);
}

function AcademiaOrg({mob,ex,tog}:any){
  const C={dir:"#1E3A5F",rugby:"#DC2626",hockey:"#EC4899",pf:"#F59E0B",med:"#10B981"};
  return(<div>
    {/* Director Deportivo */}
    <OrgNode mob={mob} icon="🎯" title="Director Deportivo" color={C.dir} ex={!!ex.acDD} onTog={()=>tog("acDD")} cnt="1">
      <AcPerson cargo="Director Deportivo" name="Franco Lucchini" color={C.dir} mob={mob}/>
    </OrgNode>

    <div style={{marginLeft:mob?12:24,borderLeft:"2px solid "+C.dir+"22",paddingLeft:mob?8:14}}>
      {/* Director de Rugby */}
      <OrgNode mob={mob} icon="🏉" title="Director de Rugby" sub="Fernando Higgs" color={C.rugby} ex={!!ex.acDR} onTog={()=>tog("acDR")} cnt="18">
        <AcPerson cargo="Director de Rugby" name="Fernando Higgs" color={C.rugby} mob={mob}/>

        <OrgNode mob={mob} icon="📋" title="Coordinadores" color={C.rugby} ex={!!ex.acCoord} onTog={()=>tog("acCoord")} cnt="4">
          <AcPerson cargo="Coordinador Infantiles" name="Carlos Efimenco" color={C.rugby} mob={mob}/>
          <AcPerson cargo="Coordinador Ataque" name="Ricardo Donna" color={C.rugby} mob={mob}/>
          <AcPerson cargo="Coordinador LINE" name="Juan Ignacio Castillo" color={C.rugby} mob={mob}/>
          <AcPerson cargo="Coordinador SCRUM" name="Martin Silva" color={C.rugby} mob={mob}/>
        </OrgNode>

        <OrgNode mob={mob} icon="🎽" title="Entrenadores" color={C.rugby} ex={!!ex.acEnt} onTog={()=>tog("acEnt")} cnt="13">
          <AcPerson cargo="Entrenador" name="Pedro Garcia" div="Plantel Superior" color={"#DC2626"} mob={mob}/>
          <AcPerson cargo="Entrenador" name="Nicolas Ranieri" div="M19" color={"#F59E0B"} mob={mob}/>
          <AcPerson cargo="Entrenador" name="Gonzalo Intzes" div="M17" color={"#F59E0B"} mob={mob}/>
          <AcPerson cargo="Entrenador" name="Rodolfo Guerra" div="M16" color={"#F59E0B"} mob={mob}/>
          <AcPerson cargo="Entrenador" name="Sebastian Salas" div="M15" color={"#F59E0B"} mob={mob}/>
          <AcPerson cargo="Entrenador" name="Enrique Arroyo" div="M14" color={"#3B82F6"} mob={mob}/>
          <AcPerson cargo="Entrenador" name="Ramiro Pontis Day" div="M13" color={"#3B82F6"} mob={mob}/>
          <AcPerson cargo="Entrenador" name="Fabian Guzzo" div="M12" color={"#10B981"} mob={mob}/>
          <AcPerson cargo="Entrenador" name="Maximiliano Ortega" div="M11" color={"#10B981"} mob={mob}/>
          <AcPerson cargo="Entrenador" name="Martin Sanchez" div="M10" color={"#10B981"} mob={mob}/>
          <AcPerson cargo="Entrenador" name="Daniel Pont Lezica" div="M9" color={"#10B981"} mob={mob}/>
          <AcPerson cargo="Entrenador" name="Javier Badano" div="M8" color={"#10B981"} mob={mob}/>
          <AcPerson cargo="Entrenador" name="Joel Aguero" div="Escuelita" color={"#10B981"} mob={mob}/>
        </OrgNode>
      </OrgNode>

      {/* Director Hockey */}
      <OrgNode mob={mob} icon="🏑" title="Director Hockey" sub="Florencia Marquez" color={C.hockey} ex={!!ex.acDH} onTog={()=>tog("acDH")} cnt="1">
        <AcPerson cargo="Director Hockey" name="Florencia Marquez" color={C.hockey} mob={mob}/>
        <AcPerson cargo="Coordinador" name="" color={C.hockey} mob={mob}/>
        <div style={{fontSize:10,color:T.g4,fontStyle:"italic",padding:4}}>Entrenadores por definir</div>
      </OrgNode>

      {/* Coordinador PF */}
      <OrgNode mob={mob} icon="💪" title="Preparación Física" sub="Matias Elias" color={C.pf} ex={!!ex.acPF} onTog={()=>tog("acPF")} cnt="16">
        <AcPerson cargo="Coordinador PF" name="Matias Elias" color={C.pf} mob={mob}/>

        <OrgNode mob={mob} icon="🏉" title="PF Rugby" color={C.pf} ex={!!ex.acPFR} onTog={()=>tog("acPFR")} cnt="14">
          <AcPerson cargo="PF" name="Julieta Miranda" div="Plantel Superior" color={"#DC2626"} mob={mob}/>
          <AcPerson cargo="PF" name="David Boullaude" div="Plantel Superior" color={"#DC2626"} mob={mob}/>
          <AcPerson cargo="PF" name="Rodrigo Verger" div="Plantel Superior · M11" color={"#DC2626"} mob={mob}/>
          <AcPerson cargo="PF" name="Luis Puebla" div="M19" color={"#F59E0B"} mob={mob}/>
          <AcPerson cargo="PF" name="Nicolas Hernandez" div="M17" color={"#F59E0B"} mob={mob}/>
          <AcPerson cargo="PF" name="" div="M16" color={"#F59E0B"} mob={mob}/>
          <AcPerson cargo="PF" name="" div="M15" color={"#F59E0B"} mob={mob}/>
          <AcPerson cargo="PF" name="Nicolas Gaido" div="M14" color={"#3B82F6"} mob={mob}/>
          <AcPerson cargo="PF" name="Franco Gomez" div="M13" color={"#3B82F6"} mob={mob}/>
          <AcPerson cargo="PF" name="Matias Boero" div="M12" color={"#10B981"} mob={mob}/>
          <AcPerson cargo="PF" name="Karen Carrion" div="M10" color={"#10B981"} mob={mob}/>
          <AcPerson cargo="PF" name="Enzo Correa" div="M9" color={"#10B981"} mob={mob}/>
          <AcPerson cargo="PF" name="Javier Badano" div="M8" color={"#10B981"} mob={mob}/>
          <AcPerson cargo="PF" name="Joel Aguero · Federica Castilla" div="Escuelita" color={"#10B981"} mob={mob}/>
        </OrgNode>

        <OrgNode mob={mob} icon="🏑" title="PF Hockey" color={C.hockey} ex={!!ex.acPFH} onTog={()=>tog("acPFH")} cnt="0">
          <div style={{fontSize:10,color:T.g4,fontStyle:"italic",padding:4}}>Por definir</div>
        </OrgNode>
      </OrgNode>

      {/* Médico */}
      <OrgNode mob={mob} icon="🩺" title="Área Médica" color={C.med} ex={!!ex.acMed} onTog={()=>tog("acMed")} cnt="4">
        <AcPerson cargo="Médico" name="" color={C.med} mob={mob}/>
        <AcPerson cargo="Kinesiólogo Rugby" name="Martin Azcurra" color={C.med} mob={mob}/>
        <AcPerson cargo="Kinesiólogo Hockey" name="Carolina Armani" color={C.med} mob={mob}/>
        <AcPerson cargo="Nutricionista" name="Matias Zanni" color={C.med} mob={mob}/>
        <AcPerson cargo="Psicóloga" name="Veronica Gomez" color={C.med} mob={mob}/>
      </OrgNode>
    </div>
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
    <h2 style={{margin:"0 0 4px",fontSize:mob?16:19,color:T.nv,fontWeight:800}}>Organigrama</h2><p style={{color:T.g4,fontSize:12,margin:"0 0 12px"}}>Estructura institucional Los Tordos Rugby Club</p>
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
