"use client";
import { useMemo } from "react";
import { ST, AREAS, DEPTOS, RENTAL_APPROVERS, TESORERO, BST, AST } from "@/lib/constants";
import { useC } from "@/lib/theme-context";
import { useDataStore } from "@/lib/store";

export function SB({aA,aD,onAC,onDC,col,onCol,isPersonal,mob,sbOpen,onClose,vw,onNav,user}:any){
  const pedidos = useDataStore(s => s.peds);
  const bookings = useDataStore(s => s.bookings);
  const dmMsgs = useDataStore(s => s.dmMsgs);
  const becas = useDataStore(s => s.becas);
  const asCasos = useDataStore(s => s.asCasos);
  const areas = AREAS;
  const deptos = DEPTOS;
  const {colors,isDark,cardBg}=useC();

  /* Permisos: CD/SE pueden ver Becas y Atencion al Socio */
  const userAreaIds=user?.dId?DEPTOS.filter((d:any)=>d.id===user.dId).map((d:any)=>d.aId):[];
  const isCdOrSe=userAreaIds.includes(100)||userAreaIds.includes(101);
  const canSeeBecasAS=user&&!isPersonal&&(user.role==="admin"||user.role==="superadmin"||isCdOrSe||user.dId===40||user.dId===76);

  /* rental badge: count items needing MY action */
  const rentalBadge=(()=>{
    if(!user) return 0;
    const rentals=(bookings||[]).filter((b:any)=>b.is_rental);
    let count=0;
    const isSA=user.role==="superadmin";
    const isAd=user.role==="admin"||user.role==="superadmin"||user.role==="coordinador";
    const isVB=user.n===RENTAL_APPROVERS.friSat.first_name&&user.a===RENTAL_APPROVERS.friSat.last_name;
    const isLG=user.n===RENTAL_APPROVERS.other.first_name&&user.a===RENTAL_APPROVERS.other.last_name;
    const isBP=user.n===RENTAL_APPROVERS.final.first_name&&user.a===RENTAL_APPROVERS.final.last_name;
    for(const r of rentals){
      if(r.rental_status==="solicitado"){
        const dow=new Date(r.date+"T12:00:00").getDay();
        const isFriSat=dow===5||dow===6;
        if(isVB&&isFriSat) count++;
        else if(isLG&&!isFriSat) count++;
        else if(isSA) count++;
      }
      if(r.rental_status==="pendiente_pago"&&(isSA||user.role==="admin")) count++;
      if(r.rental_status==="pago_recibido"&&(isBP||isSA)) count++;
    }
    return count;
  })();
  const dmUnread=(()=>{if(!user||!dmMsgs)return 0;return dmMsgs.filter((m:any)=>m.receiver_id===user.id&&!m.read).length;})();
  const dbNotifs = useDataStore(s => s.dbNotifs);
  const sectionBadges = useMemo(() => { const unread = (dbNotifs||[]).filter((n:any) => !n.read && n.link); const counts: Record<string,number> = {}; for (const n of unread) { const view = n.link.split(":")[0]; counts[view] = (counts[view] || 0) + 1; } return counts; }, [dbNotifs]);
  const tesBadge=(()=>{if(!user||!(user.n===TESORERO.first_name&&user.a===TESORERO.last_name))return 0;return(pedidos||[]).filter((p:any)=>p.rG&&p.st===ST.E&&p.tOk===null).length;})();
  const emBadge=(()=>{if(!user||user.role!=="embudo")return 0;return(pedidos||[]).filter((p:any)=>p.st===ST.E&&!p.eOk).length;})();
  /* Becas/Atencion pending-vote badge: items in deliberación where user can vote and hasn't yet */
  const canVoteBecasAS=(()=>{if(!user||isPersonal)return false;const isSALocal=user.role==="superadmin"||user.role==="admin";return isSALocal||userAreaIds.includes(100)||userAreaIds.includes(101)||user.dId===40||user.dId===76;})();
  const becasPending=canVoteBecasAS?(becas||[]).filter((b:any)=>b.estado===BST.DEL&&!(b.votos||[]).some((v:any)=>v.userId===user.id)).length:0;
  const asPending=canVoteBecasAS?(asCasos||[]).filter((c:any)=>c.estado===AST.DEL&&!(c.votos||[]).some((v:any)=>v.userId===user.id)).length:0;
  const sbContent=(<div style={{flex:1,overflowY:"auto" as const,padding:"8px 6px"}}>
    {!isPersonal&&areas.map((ar:any)=>{const ds=deptos.filter((d:any)=>d.aId===ar.id),ids=ds.map((d:any)=>d.id),ap=pedidos.filter((p:any)=>ids.indexOf(p.dId)>=0),pe=ap.filter((p:any)=>p.st===ST.P).length,cu=ap.filter((p:any)=>[ST.C,ST.E,ST.V].indexOf(p.st)>=0).length,ok=ap.filter((p:any)=>p.st===ST.OK).length;
      return(<div key={ar.id} style={{marginBottom:4}}><div onClick={()=>{onAC(ar.id);if(mob)onClose();}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:mob?"10px 10px":"7px 8px",borderRadius:7,cursor:"pointer",background:aA===ar.id?"rgba(255,255,255,.1)":"transparent",borderLeft:"3px solid "+ar.color,minHeight:mob?44:undefined}}><span style={{fontSize:mob?13:11,fontWeight:600}}>{ar.icon} {ar.name}</span><div style={{display:"flex",gap:4,fontSize:mob?10:9}}>{pe>0&&<span style={{color:colors.rd}}>🔴{pe}</span>}{cu>0&&<span style={{color:colors.yl}}>🟡{cu}</span>}{ok>0&&<span style={{color:colors.gn}}>🟢{ok}</span>}</div></div>
        {aA===ar.id&&<div style={{marginTop:2}}>{ds.filter((d:any)=>!d.pId).map((d:any)=>{const dc=pedidos.filter((p:any)=>p.dId===d.id).length;const children=ds.filter((ch:any)=>ch.pId===d.id);const childIds=children.map((ch:any)=>ch.id);const isExpanded=aD===d.id||childIds.includes(aD);return(<div key={d.id}><div onClick={()=>{onDC(d.id);if(mob)onClose();}} style={{marginLeft:14,padding:mob?"8px 10px":"4px 8px",borderRadius:5,cursor:"pointer",background:aD===d.id||isExpanded?"rgba(255,255,255,.14)":"transparent",fontSize:mob?12:10,color:aD===d.id||isExpanded?"#fff":"rgba(255,255,255,.45)",fontWeight:aD===d.id||isExpanded?600:400,display:"flex",justifyContent:"space-between",minHeight:mob?40:undefined,alignItems:"center"}}><span>{children.length>0?(isExpanded?"▾ ":"▸ "):<span style={{visibility:"hidden"}}>{"▸ "}</span>}📂 {d.name}</span>{dc>0&&<span style={{background:"rgba(255,255,255,.12)",borderRadius:8,padding:"0 5px",fontSize:mob?10:9}}>{dc}</span>}</div>{isExpanded&&children.map((ch:any)=>{const chc=pedidos.filter((p:any)=>p.dId===ch.id).length;return(<div key={ch.id} onClick={()=>{onDC(ch.id);if(mob)onClose();}} style={{marginLeft:28,padding:mob?"8px 10px":"4px 8px",borderRadius:5,cursor:"pointer",background:aD===ch.id?"rgba(255,255,255,.14)":"transparent",fontSize:mob?12:10,color:aD===ch.id?"#fff":"rgba(255,255,255,.35)",fontWeight:aD===ch.id?600:400,display:"flex",justifyContent:"space-between",minHeight:mob?40:undefined,alignItems:"center"}}><span>└ 📂 {ch.name}</span>{chc>0&&<span style={{background:"rgba(255,255,255,.12)",borderRadius:8,padding:"0 5px",fontSize:mob?10:9}}>{chc}</span>}</div>);})}</div>);})}</div>}
      </div>);
    })}
    {/* Navigation links */}
    {onNav&&<div style={{marginTop:10,padding:"4px 2px"}}>
      <div style={{fontSize:9,fontWeight:700,color:colors.g4,textTransform:"uppercase" as const,marginBottom:4,padding:"0 6px",letterSpacing:1}}>Secciones</div>
      {[
        {k:"proy",l:"Plan 2035",icon:"🎯",show:false},
        {k:"recurrentes",l:"Recurrentes",icon:"🔁",show:false},
        {k:"viajes",l:"Viajes",icon:"🚌",show:false},
        {k:"archivos",l:"Archivos",icon:"📂",show:!isPersonal},
        {k:"atencion-socio",l:"Atención al Socio",icon:"🤝",show:!!canSeeBecasAS},
        {k:"becas",l:"Becas",icon:"🎓",show:!!canSeeBecasAS},
        {k:"comm",l:"Comunicar",icon:"📢",show:!isPersonal&&user&&(user.role==="admin"||user.role==="superadmin"||user.role==="coordinador")},
        {k:"reservas",l:"Espacios",icon:"🏟️",show:true},
        {k:"fixtures",l:"Fixtures",icon:"📅",show:!isPersonal&&user&&(user.role==="admin"||user.role==="superadmin"||user.role==="coordinador"||user.role==="enlace")},
        {k:"inventario",l:"Inventario",icon:"📦",show:user&&((!isPersonal&&(user.role==="admin"||user.role==="superadmin"||user.role==="coordinador"))||(user.role==="enlace"||user.role==="manager"))},
        {k:"dm",l:"Mensajes",icon:"💬",show:true},
        {k:"org",l:"Organigrama",icon:"🏛️",show:true},
        {k:"profs",l:"Perfiles",icon:"👤",show:user&&user.role==="superadmin"},
        {k:"presu",l:"Presupuestos",icon:"💰",show:!isPersonal&&user&&(user.role==="admin"||user.role==="superadmin"||user.role==="coordinador"||user.role==="embudo")},
        {k:"proyectos",l:"Proyectos",icon:"📋",show:!isPersonal},
        {k:"reun",l:"Reuniones",icon:"🤝",show:!isPersonal&&user&&(user.role==="admin"||user.role==="superadmin"||user.role==="coordinador")},
        {k:"sponsors",l:"Sponsors",icon:"🥇",show:!isPersonal&&user&&(user.role==="admin"||user.role==="superadmin"||user.role==="coordinador"||user.role==="embudo")},
        {k:"torneos",l:"Torneos",icon:"🏆",show:!isPersonal&&user&&(user.role==="admin"||user.role==="superadmin"||user.role==="coordinador")},
        {k:"manual",l:"Manual",icon:"📖",show:true},
      ].filter(n=>n.show).map(n=><div key={n.k} onClick={()=>{onNav(n.k);if(mob)onClose();}} style={{display:"flex",alignItems:"center",gap:8,padding:mob?"10px 10px":"7px 8px",borderRadius:7,cursor:"pointer",background:vw===n.k?"rgba(255,255,255,.1)":"transparent",fontSize:mob?13:11,fontWeight:vw===n.k?700:500,color:vw===n.k?"#fff":"rgba(255,255,255,.55)",marginBottom:1,minHeight:mob?44:undefined}}><span style={{fontSize:mob?15:13}}>{n.icon}</span>{n.l}{n.k==="reservas"&&rentalBadge>0&&vw!=="reservas"&&<span style={{background:"#DC2626",color:"#fff",fontSize:9,fontWeight:800,borderRadius:10,padding:"1px 6px",minWidth:16,textAlign:"center" as const,marginLeft:"auto",lineHeight:"14px"}}>{rentalBadge}</span>}{n.k==="dm"&&dmUnread>0&&vw!=="dm"&&<span style={{background:"#DC2626",color:"#fff",fontSize:9,fontWeight:800,borderRadius:10,padding:"1px 6px",minWidth:16,textAlign:"center" as const,marginLeft:"auto",lineHeight:"14px"}}>{dmUnread}</span>}{(sectionBadges[n.k]||0)>0&&vw!==n.k&&n.k!=="reservas"&&n.k!=="dm"&&<span style={{background:"#DC2626",color:"#fff",fontSize:9,fontWeight:800,borderRadius:10,padding:"1px 6px",minWidth:16,textAlign:"center" as const,marginLeft:"auto",lineHeight:"14px"}}>{sectionBadges[n.k]}</span>}{n.k==="presu"&&tesBadge>0&&vw!=="presu"&&!(sectionBadges["presu"]>0)&&<span style={{background:"#F59E0B",color:"#fff",fontSize:9,fontWeight:800,borderRadius:10,padding:"1px 6px",minWidth:16,textAlign:"center" as const,marginLeft:"auto",lineHeight:"14px"}}>{tesBadge}</span>}{n.k==="becas"&&becasPending>0&&vw!=="becas"&&!(sectionBadges["becas"]>0)&&<span style={{background:"#F59E0B",color:"#fff",fontSize:9,fontWeight:800,borderRadius:10,padding:"1px 6px",minWidth:16,textAlign:"center" as const,marginLeft:"auto",lineHeight:"14px"}}>{becasPending}</span>}{n.k==="atencion-socio"&&asPending>0&&vw!=="atencion-socio"&&!(sectionBadges["atencion-socio"]>0)&&<span style={{background:"#F59E0B",color:"#fff",fontSize:9,fontWeight:800,borderRadius:10,padding:"1px 6px",minWidth:16,textAlign:"center" as const,marginLeft:"auto",lineHeight:"14px"}}>{asPending}</span>}</div>)}
    </div>}
  </div>);
  if(mob){
    if(!sbOpen) return null;
    return(<><div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:99}}/><nav aria-label="Menu principal" style={{position:"fixed",top:0,left:0,bottom:0,width:260,background:isDark?"#1E293B":colors.nv,color:"#fff",display:"flex",flexDirection:"column" as const,zIndex:100,boxShadow:"4px 0 20px rgba(0,0,0,.3)"}}>
      <div style={{padding:"14px 12px",borderBottom:"1px solid rgba(255,255,255,.08)",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:16}}>🏉</span><span style={{fontSize:13,fontWeight:800}}>LOS TORDOS</span></div><div style={{fontSize:9,color:colors.g4,letterSpacing:1,textTransform:"uppercase" as const,marginTop:2}}>Panel de Control</div></div><button onClick={onClose} style={{background:"none",border:"none",color:"#fff",fontSize:20,cursor:"pointer",minWidth:44,minHeight:44,display:"flex",alignItems:"center",justifyContent:"center"}} title="Cerrar menú" aria-label="Cerrar menú">✕</button></div>
      {sbContent}
    </nav></>);
  }
  if(col) return(<nav aria-label="Menu principal" style={{width:48,minWidth:48,background:isDark?"#1E293B":colors.nv,display:"flex",flexDirection:"column" as const,alignItems:"center",paddingTop:10,borderRight:isDark?"1px solid "+colors.g3:"none"}}><button onClick={onCol} style={{background:"none",border:"none",color:"#fff",fontSize:18,cursor:"pointer",marginBottom:14}} title="Expandir menú" aria-label="Expandir menú">☰</button><span style={{fontSize:14}}>🏉</span></nav>);
  return(
    <nav aria-label="Menu principal" style={{width:250,minWidth:250,background:isDark?"#1E293B":colors.nv,color:"#fff",display:"flex",flexDirection:"column" as const,borderRight:isDark?"1px solid "+colors.g3:"none"}}>
      <div style={{padding:"14px 12px",borderBottom:"1px solid rgba(255,255,255,.08)",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:16}}>🏉</span><span style={{fontSize:13,fontWeight:800}}>LOS TORDOS</span></div><div style={{fontSize:9,color:colors.g4,letterSpacing:1,textTransform:"uppercase" as const,marginTop:2}}>Panel de Control</div></div><button onClick={onCol} style={{background:"none",border:"none",color:colors.g4,fontSize:14,cursor:"pointer"}} title="Colapsar menú" aria-label="Colapsar menú">◀</button></div>
      {sbContent}
    </nav>
  );
}
