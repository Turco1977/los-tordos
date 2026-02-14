"use client";
import { useState } from "react";
import { T, ROLES, fn } from "@/lib/constants";
import { Btn, Card, Bread } from "@/components/ui";

function OrgNode({icon,title,sub,color,children,cnt,ex,onTog,mob}:any){return(<div style={{marginBottom:6}}><div onClick={onTog} style={{display:"flex",alignItems:"center",gap:8,padding:mob?"8px 10px":"10px 14px",background:"#fff",borderRadius:10,border:"1px solid "+T.g2,cursor:"pointer",borderLeft:"4px solid "+color}}><span style={{fontSize:18}}>{icon}</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:T.nv}}>{title}</div>{sub&&<div style={{fontSize:10,color:T.g4}}>{sub}</div>}</div>{cnt!==undefined&&<span style={{background:T.g1,borderRadius:12,padding:"1px 8px",fontSize:10,fontWeight:600,color:T.g5}}>{cnt}</span>}<span style={{fontSize:12,color:T.g4,transform:ex?"rotate(90deg)":"none",transition:"transform .2s"}}>▶</span></div>{ex&&<div style={{marginLeft:mob?12:24,marginTop:4,borderLeft:"2px solid "+color+"22",paddingLeft:mob?8:14}}>{children}</div>}</div>);}

function OrgMember({m,isSA,onEdit,onDel,onAssign}:any){const ok=m.n&&m.a;return(<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 10px",background:ok?"#FAFAFA":T.g1,borderRadius:7,border:"1px solid "+T.g2,marginBottom:3}}><div><div style={{fontSize:9,fontWeight:700,color:T.rd,textTransform:"uppercase" as const}}>{m.cargo}</div>{ok?<div style={{fontSize:12,fontWeight:700,color:T.nv}}>{m.n} {m.a}</div>:<div style={{fontSize:11,color:T.g3,fontStyle:"italic"}}>Sin asignar</div>}</div><div style={{display:"flex",gap:3}}>{ok&&onAssign&&<span title="Asignar tarea"><Btn v="g" s="s" onClick={()=>onAssign(m)}>📋</Btn></span>}{isSA&&<Btn v="g" s="s" onClick={()=>onEdit(m)}>✏️</Btn>}{isSA&&<Btn v="g" s="s" onClick={()=>onDel&&onDel(m.id)} style={{color:T.rd}}>🗑️</Btn>}</div></div>);}

export function Org({areas,deptos,users,om,onEditSave,onDelOm,onDelUser,onEditUser,isSA,onAssignTask,mob,pedidos,onSel,KPIs,Circles,DeptCircles,TList}:any){
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
      {[{k:"struct",l:"👥 Estructura"},{k:"tasks",l:"📋 Departamentos"}].map(t=><button key={t.k} onClick={()=>{sTab(t.k);sTa(null);sTd(null);}} style={{padding:"7px 16px",borderRadius:8,border:"none",background:tab===t.k?T.nv:"#fff",color:tab===t.k?"#fff":T.g5,fontSize:12,fontWeight:600,cursor:"pointer"}}>{t.l}</button>)}
    </div>
    {tab==="struct"&&<div style={{maxWidth:mob?undefined:680}}>
    {ed&&<Card style={{marginBottom:12,maxWidth:mob?undefined:400,background:"#FFFBEB",border:"1px solid #FDE68A"}}><div style={{fontSize:11,fontWeight:600,color:T.g5,marginBottom:6}}>Editando: {ed.cargo}</div><div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:4,marginBottom:4}}><input value={ef.n} onChange={e=>sEf(p=>({...p,n:e.target.value}))} placeholder="Nombre" style={{padding:"6px 8px",borderRadius:6,border:"1px solid "+T.g3,fontSize:12}}/><input value={ef.a} onChange={e=>sEf(p=>({...p,a:e.target.value}))} placeholder="Apellido" style={{padding:"6px 8px",borderRadius:6,border:"1px solid "+T.g3,fontSize:12}}/></div><div style={{display:"flex",gap:4}}><Btn s="s" onClick={()=>{onEditSave(ed.id,ef);sEd(null);}}>Guardar</Btn><Btn v="g" s="s" onClick={()=>sEd(null)}>✕</Btn></div></Card>}
    <OrgNode mob={mob} icon="🏛️" title="Comisión Directiva" color={T.nv} ex={!!ex.cd} onTog={()=>tog("cd")} cnt={om.filter((m:any)=>m.t==="cd"&&m.n).length+"/8"}>{om.filter((m:any)=>m.t==="cd").map((m:any)=><OrgMember key={m.id} m={m} isSA={isSA} onEdit={(mm:any)=>{sEd(mm);sEf({n:mm.n,a:mm.a,mail:mm.mail,tel:mm.tel});}} onDel={(id:string)=>onDelOm(id)} onAssign={(mm:any)=>{const u=findUser(mm);if(u)onAssignTask(u);}}/>)}</OrgNode>
    <OrgNode mob={mob} icon="⚡" title="Secretaría Ejecutiva" sub="Depende de CD" color={T.rd} ex={!!ex.se} onTog={()=>tog("se")} cnt={om.filter((m:any)=>m.t==="se"&&m.n).length+"/5"}>{om.filter((m:any)=>m.t==="se").map((m:any)=><OrgMember key={m.id} m={m} isSA={isSA} onEdit={(mm:any)=>{sEd(mm);sEf({n:mm.n,a:mm.a,mail:mm.mail,tel:mm.tel});}} onDel={(id:string)=>onDelOm(id)} onAssign={(mm:any)=>{const u=findUser(mm);if(u)onAssignTask(u);}}/>)}</OrgNode>
    <div style={{marginLeft:mob?12:24,borderLeft:"2px solid "+T.rd+"22",paddingLeft:mob?8:14}}>
      {areas.filter((ar:any)=>ar.id!==100&&ar.id!==101).map((ar:any)=>{const ds=deptos.filter((d:any)=>d.aId===ar.id);const dsWithPeople=ds.filter((d:any)=>users.some((u:any)=>u.dId===d.id));return(<OrgNode mob={mob} key={ar.id} icon={ar.icon} title={ar.name} sub={dsWithPeople.length+" deptos"} color={ar.color} ex={!!ex["ar"+ar.id]} onTog={()=>tog("ar"+ar.id)} cnt={dsWithPeople.length}>{dsWithPeople.map((d:any)=>{const pp=users.filter((u:any)=>u.dId===d.id);const resp=pp.find((u:any)=>u.role==="coordinador")||pp.find((u:any)=>u.role==="admin")||pp[0];const others=pp.filter((u:any)=>u.id!==(resp?resp.id:""));return(<OrgNode mob={mob} key={d.id} icon="📂" title={d.name} color={ar.color} ex={!!ex["d"+d.id]} onTog={()=>tog("d"+d.id)} cnt={pp.length}>
            {resp&&<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:6,padding:"6px 10px",background:"#FEE2E2",borderRadius:7,border:"1px solid #FECACA",marginBottom:4}}><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:10}}>⭐</span><div><div style={{fontSize:9,fontWeight:700,color:T.rd,textTransform:"uppercase" as const}}>Responsable</div><div style={{fontSize:12,fontWeight:700,color:T.nv}}>{fn(resp)}</div></div></div>{isSA&&<div style={{display:"flex",gap:3}}><Btn v="g" s="s" onClick={()=>onEditUser(resp)}>✏️</Btn><Btn v="g" s="s" onClick={()=>onDelUser(resp.id)} style={{color:T.rd}}>🗑️</Btn></div>}</div>}
            {others.map((u:any)=>(<div key={u.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:6,padding:"6px 10px",background:"#FAFAFA",borderRadius:7,border:"1px solid "+T.g2,marginBottom:3}}><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:10}}>👤</span><div><div style={{fontSize:9,fontWeight:700,color:T.rd,textTransform:"uppercase" as const}}>{u.div||ROLES[u.role]?.l||""}</div><div style={{fontSize:12,fontWeight:700,color:T.nv}}>{fn(u)}</div></div></div>{isSA&&<div style={{display:"flex",gap:3}}><Btn v="g" s="s" onClick={()=>onEditUser(u)}>✏️</Btn><Btn v="g" s="s" onClick={()=>onDelUser(u.id)} style={{color:T.rd}}>🗑️</Btn></div>}</div>))}
            {others.length===0&&!resp&&<div style={{fontSize:10,color:T.g4,fontStyle:"italic",padding:4}}>Sin integrantes</div>}
          </OrgNode>);})}</OrgNode>);})}
    </div>
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
