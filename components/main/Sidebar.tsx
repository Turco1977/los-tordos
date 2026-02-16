"use client";
import { ST, SC } from "@/lib/constants";
import { useC } from "@/lib/theme-context";

export function SB({areas,deptos,pedidos,aA,aD,onAC,onDC,col,onCol,isPersonal,mob,sbOpen,onClose,vw,onNav,user}:any){
  const {colors,isDark,cardBg}=useC();
  const sbContent=(<div style={{flex:1,overflowY:"auto" as const,padding:"8px 6px"}}>
    {!isPersonal&&areas.map((ar:any)=>{const ds=deptos.filter((d:any)=>d.aId===ar.id),ids=ds.map((d:any)=>d.id),ap=pedidos.filter((p:any)=>ids.indexOf(p.dId)>=0),pe=ap.filter((p:any)=>p.st===ST.P).length,cu=ap.filter((p:any)=>[ST.C,ST.E,ST.V].indexOf(p.st)>=0).length,ok=ap.filter((p:any)=>p.st===ST.OK).length;
      return(<div key={ar.id} style={{marginBottom:4}}><div onClick={()=>{onAC(ar.id);if(mob)onClose();}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 8px",borderRadius:7,cursor:"pointer",background:aA===ar.id?"rgba(255,255,255,.1)":"transparent",borderLeft:"3px solid "+ar.color}}><span style={{fontSize:11,fontWeight:600}}>{ar.icon} {ar.name}</span><div style={{display:"flex",gap:4,fontSize:9}}>{pe>0&&<span style={{color:colors.rd}}>🔴{pe}</span>}{cu>0&&<span style={{color:colors.yl}}>🟡{cu}</span>}{ok>0&&<span style={{color:colors.gn}}>🟢{ok}</span>}</div></div>
        {aA===ar.id&&<div style={{marginTop:2}}>{ds.map((d:any)=>{const dc=pedidos.filter((p:any)=>p.dId===d.id).length;return(<div key={d.id} onClick={()=>{onDC(d.id);if(mob)onClose();}} style={{marginLeft:14,padding:"4px 8px",borderRadius:5,cursor:"pointer",background:aD===d.id?"rgba(255,255,255,.14)":"transparent",fontSize:10,color:aD===d.id?"#fff":"rgba(255,255,255,.45)",fontWeight:aD===d.id?600:400,display:"flex",justifyContent:"space-between"}}><span>📂 {d.name}</span>{dc>0&&<span style={{background:"rgba(255,255,255,.12)",borderRadius:8,padding:"0 5px",fontSize:9}}>{dc}</span>}</div>);})}</div>}
      </div>);
    })}
    <div style={{marginTop:10,padding:8,background:"rgba(255,255,255,.04)",borderRadius:7}}>
      <div style={{fontSize:9,fontWeight:700,color:colors.g4,textTransform:"uppercase" as const,marginBottom:4}}>Global</div>
      {Object.keys(SC).map(k=><div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:10,padding:"1px 0"}}><span style={{color:"rgba(255,255,255,.45)"}}>{SC[k].i} {SC[k].l}</span><span style={{fontWeight:700,color:SC[k].c}}>{pedidos.filter((p:any)=>p.st===k).length}</span></div>)}
    </div>
    {/* Navigation links */}
    {onNav&&<div style={{marginTop:10,padding:"4px 2px"}}>
      <div style={{fontSize:9,fontWeight:700,color:colors.g4,textTransform:"uppercase" as const,marginBottom:4,padding:"0 6px",letterSpacing:1}}>Secciones</div>
      {[
        {k:"presu",l:"Presupuestos",icon:"💰",show:!isPersonal&&user&&(user.role==="admin"||user.role==="superadmin"||user.role==="coordinador"||user.role==="embudo")},
        {k:"reun",l:"Reuniones",icon:"🤝",show:!isPersonal&&user&&(user.role==="admin"||user.role==="superadmin"||user.role==="coordinador")},
        {k:"proyectos",l:"Proyectos",icon:"📋",show:true},
        {k:"org",l:"Organigrama",icon:"🏛️",show:true},
        {k:"proy",l:"Plan 2035",icon:"🎯",show:true},
        {k:"profs",l:"Perfiles",icon:"👤",show:true},
        {k:"comm",l:"Comunicar",icon:"📢",show:!isPersonal&&user&&(user.role==="admin"||user.role==="superadmin"||user.role==="coordinador")},
      ].filter(n=>n.show).map(n=><div key={n.k} onClick={()=>{onNav(n.k);if(mob)onClose();}} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 8px",borderRadius:7,cursor:"pointer",background:vw===n.k?"rgba(255,255,255,.1)":"transparent",fontSize:11,fontWeight:vw===n.k?700:500,color:vw===n.k?"#fff":"rgba(255,255,255,.55)",marginBottom:1}}><span style={{fontSize:13}}>{n.icon}</span>{n.l}</div>)}
    </div>}
  </div>);
  if(mob){
    if(!sbOpen) return null;
    return(<><div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:99}}/><div style={{position:"fixed",top:0,left:0,bottom:0,width:260,background:isDark?"#1E293B":colors.nv,color:"#fff",display:"flex",flexDirection:"column" as const,zIndex:100,boxShadow:"4px 0 20px rgba(0,0,0,.3)"}}>
      <div style={{padding:"14px 12px",borderBottom:"1px solid rgba(255,255,255,.08)",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:16}}>🏉</span><span style={{fontSize:13,fontWeight:800}}>LOS TORDOS</span></div><div style={{fontSize:9,color:colors.g4,letterSpacing:1,textTransform:"uppercase" as const,marginTop:2}}>Panel de Control</div></div><button onClick={onClose} style={{background:"none",border:"none",color:"#fff",fontSize:18,cursor:"pointer"}}>✕</button></div>
      {sbContent}
    </div></>);
  }
  if(col) return(<div style={{width:48,minWidth:48,background:isDark?"#1E293B":colors.nv,display:"flex",flexDirection:"column" as const,alignItems:"center",paddingTop:10,borderRight:isDark?"1px solid "+colors.g3:"none"}}><button onClick={onCol} style={{background:"none",border:"none",color:"#fff",fontSize:18,cursor:"pointer",marginBottom:14}}>☰</button><span style={{fontSize:14}}>🏉</span></div>);
  return(
    <div style={{width:250,minWidth:250,background:isDark?"#1E293B":colors.nv,color:"#fff",display:"flex",flexDirection:"column" as const,borderRight:isDark?"1px solid "+colors.g3:"none"}}>
      <div style={{padding:"14px 12px",borderBottom:"1px solid rgba(255,255,255,.08)",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:16}}>🏉</span><span style={{fontSize:13,fontWeight:800}}>LOS TORDOS</span></div><div style={{fontSize:9,color:colors.g4,letterSpacing:1,textTransform:"uppercase" as const,marginTop:2}}>Panel de Control</div></div><button onClick={onCol} style={{background:"none",border:"none",color:colors.g4,fontSize:14,cursor:"pointer"}}>◀</button></div>
      {sbContent}
    </div>
  );
}
