"use client";
import { useState } from "react";

const T={nv:"#0A1628",rd:"#C8102E",g1:"#F7F8FA",g2:"#E8ECF1",g3:"#CBD2DC",g4:"#8B95A5",g5:"#5A6577",gn:"#10B981",yl:"#F59E0B",bl:"#3B82F6",pr:"#8B5CF6"};
let _u=200,_p=100,_a=20,_d=200;

const AREAS=[{id:100,name:"Comisión Directiva",color:"#1E293B",icon:"🏛️"},{id:101,name:"Secretaría Ejecutiva",color:"#991B1B",icon:"⚡"},{id:1,name:"Gobernanza",color:T.bl,icon:"🛡️"},{id:2,name:"Deportiva",color:T.rd,icon:"🏉"},{id:3,name:"Social",color:T.gn,icon:"🤝"},{id:4,name:"Infraestructura",color:T.yl,icon:"🔧"}];

const DEPTOS=[
  {id:50,name:"Mesa Directiva",aId:100},{id:51,name:"Consejo Consultivo",aId:100},
  {id:55,name:"Presidencia SE",aId:101},{id:56,name:"Coordinación General SE",aId:101},
  {id:1,name:"Coordinación General",aId:1},{id:2,name:"Eventos",aId:1},{id:3,name:"Comunicación",aId:1},{id:4,name:"Sponsoreo",aId:1},{id:5,name:"Gastronomía y Recepción",aId:1},{id:6,name:"Administración",aId:1},{id:7,name:"Compras",aId:1},
  {id:8,name:"Intendencia",aId:1},{id:9,name:"Sistemas",aId:1},{id:40,name:"Atención al Socio",aId:1},{id:41,name:"Estandarización de Procesos",aId:1},
  {id:42,name:"Tordos TV",aId:1},{id:43,name:"Diseño",aId:1},{id:44,name:"Redes",aId:1},{id:45,name:"Fotografía",aId:1},{id:46,name:"Filmación",aId:1},{id:47,name:"Edición",aId:1},{id:48,name:"Prensa",aId:1},{id:49,name:"Creatividad",aId:1},{id:60,name:"Asesoría Comunicación",aId:1},
  {id:61,name:"Tesorería",aId:1},{id:62,name:"Finanzas",aId:1},{id:63,name:"Financiamiento",aId:1},{id:64,name:"Movilidad",aId:1},{id:65,name:"Tordos Shop",aId:1},
  {id:10,name:"Academia Tordos",aId:2},{id:11,name:"Soporte Adm. del Deporte",aId:2},{id:12,name:"Mejora Continua",aId:2},
  {id:20,name:"Solidario",aId:3},{id:21,name:"Conecta",aId:3},{id:22,name:"Captación",aId:3},{id:23,name:"Club del Ex",aId:3},
  {id:30,name:"Anexo",aId:4},{id:31,name:"Estacionamiento Cancha 2",aId:4},{id:32,name:"Plan Estratégico",aId:4},{id:33,name:"Luces Cancha 2, 3 y 4",aId:4},{id:34,name:"Cantina: Ampliación y Tribunas",aId:4},{id:35,name:"Vestuarios y Depósito",aId:4},
  {id:70,name:"Dormy's",aId:4},{id:71,name:"Espacio Madre Selva",aId:4},{id:72,name:"Ingreso Urquiza",aId:4},{id:73,name:"Luces Anexo",aId:4},{id:74,name:"Molinetes",aId:4},{id:75,name:"Club del Ex (Infra)",aId:4},
];

const ROLES: Record<string,{l:string;i:string;lv:number}>={superadmin:{l:"Super Admin",i:"👑",lv:5},admin:{l:"Administrador",i:"🛡️",lv:4},coordinador:{l:"Coordinador",i:"⚙️",lv:3},embudo:{l:"Compras/Tesorería",i:"💰",lv:3},usuario:{l:"Usuario",i:"👤",lv:2},enlace:{l:"Enlace",i:"🔗",lv:1},manager:{l:"Manager",i:"📋",lv:1}};
const RK=Object.keys(ROLES);
const DIV=["Plantel Superior","M19","M17","M16","M15","M14","M13","M12","M11","M10","M9","M8","Escuelita"];
const TIPOS=["Logística","Administrativo","Infraestructura","Material deportivo","Comunicación","Otro"];
const ST={P:"pend",C:"curso",E:"emb",V:"valid",OK:"ok"};
const SC: Record<string,{l:string;c:string;bg:string;i:string}>={[ST.P]:{l:"Pendiente",c:T.rd,bg:"#FEE2E2",i:"🔴"},[ST.C]:{l:"En Curso",c:T.yl,bg:"#FEF3C7",i:"🟡"},[ST.E]:{l:"Compras",c:T.pr,bg:"#EDE9FE",i:"💰"},[ST.V]:{l:"Validación",c:T.bl,bg:"#DBEAFE",i:"🔵"},[ST.OK]:{l:"Completada",c:T.gn,bg:"#D1FAE5",i:"🟢"}};
const TODAY="2026-02-12";
const fn=(u:any)=>u.n+" "+u.a;
const isOD=(d:string)=>d<TODAY&&d!=="";
const daysDiff=(a:string,b:string)=>Math.round((new Date(b).getTime()-new Date(a).getTime())/864e5);

const initU=[
  {id:"sa1",n:"Martín",a:"Isola",role:"superadmin",dId:1,div:"",mail:"misola@lostordos.com.ar",tel:"261-555-0000"},
  {id:"a1",n:"Admin",a:"SE",role:"admin",dId:55,div:"",mail:"admin@lostordos.com.ar",tel:"261-555-0001"},
  {id:"c1",n:"Federico",a:"Perinetti",role:"coordinador",dId:11,div:"",mail:"fperinetti@lostordos.com.ar",tel:"261-555-0010"},
  {id:"c2",n:"Federico",a:"Mexandeau",role:"coordinador",dId:11,div:"",mail:"fmexandeau@lostordos.com.ar",tel:"261-555-0011"},
  {id:"emb1",n:"Franco",a:"Lazzari",role:"embudo",dId:7,div:"",mail:"flazzari@lostordos.com.ar",tel:"261-555-0020"},
  {id:"u1",n:"Gonzalo",a:"Santo Tomás",role:"usuario",dId:11,div:"",mail:"gst@lostordos.com.ar",tel:"261-555-0030"},
  {id:"u2",n:"Félix",a:"Guiñazú",role:"usuario",dId:11,div:"",mail:"fg@lostordos.com.ar",tel:"261-555-0031"},
  {id:"u3",n:"Marcos",a:"Balzarelli",role:"usuario",dId:64,div:"",mail:"mb@lostordos.com.ar",tel:"261-555-0032"},
  {id:"g1",n:"Bautista",a:"Pontis",role:"coordinador",dId:1,div:"",mail:"bpontis@lt.ar",tel:""},
  {id:"g2",n:"Miguel",a:"Senosian",role:"usuario",dId:9,div:"",mail:"msenosian@lt.ar",tel:""},
  {id:"g3",n:"Daniel",a:"Olguín",role:"usuario",dId:40,div:"",mail:"dolguin@lt.ar",tel:""},
  {id:"g4",n:"Daniel",a:"Pont Lezica",role:"usuario",dId:41,div:"",mail:"dpontlezica@lt.ar",tel:""},
  {id:"u11",n:"Leandro",a:"Sturniolo",role:"coordinador",dId:3,div:"",mail:"lsturniolo@lt.ar",tel:""},
  {id:"g5",n:"Miguel",a:"Senosian",role:"usuario",dId:42,div:"Tordos TV",mail:"msenosian2@lt.ar",tel:""},
  {id:"g6",n:"Alejandrina",a:"Vázquez",role:"usuario",dId:43,div:"",mail:"avazquez@lt.ar",tel:""},
  {id:"g7",n:"Gastón",a:"Aye",role:"usuario",dId:44,div:"",mail:"gaye@lt.ar",tel:""},
  {id:"g8",n:"Marcelo",a:"Carubin",role:"usuario",dId:45,div:"",mail:"mcarubin@lt.ar",tel:""},
  {id:"g9",n:"Diego",a:"Sosa",role:"usuario",dId:46,div:"",mail:"dsosa@lt.ar",tel:""},
  {id:"g10",n:"Marcos",a:"Sosa",role:"usuario",dId:47,div:"",mail:"msosa@lt.ar",tel:""},
  {id:"g11",n:"Juan Pablo",a:"García",role:"usuario",dId:48,div:"",mail:"jpgarcia@lt.ar",tel:""},
  {id:"g12",n:"Valentín",a:"Saá",role:"usuario",dId:49,div:"",mail:"vsaa@lt.ar",tel:""},
  {id:"g13",n:"Marcos",a:"Genoud",role:"usuario",dId:60,div:"",mail:"mgenoud@lt.ar",tel:""},
  {id:"u15",n:"Jesús",a:"Herrera",role:"coordinador",dId:4,div:"",mail:"jherrera@lt.ar",tel:""},
  {id:"u10",n:"Victoria",a:"Brandi",role:"usuario",dId:4,div:"Relac. Sponsors",mail:"vbrandi@lt.ar",tel:""},
  {id:"u19",n:"Juan Martín",a:"Gómez Centurión",role:"usuario",dId:4,div:"Comercial",mail:"jmgc@lt.ar",tel:""},
  {id:"g14",n:"Victoria",a:"Brandi",role:"coordinador",dId:2,div:"Coord. Eventos",mail:"vbrandi2@lt.ar",tel:""},
  {id:"u17",n:"Ignacio",a:"Ricci",role:"usuario",dId:2,div:"Almuerzo Camadas",mail:"iricci@lt.ar",tel:""},
  {id:"u18",n:"Lucía",a:"González",role:"usuario",dId:2,div:"Sunset Tordos",mail:"lgonzalez@lt.ar",tel:""},
  {id:"g15",n:"Jesús",a:"Herrera",role:"usuario",dId:2,div:"Sponsors 65 años",mail:"jherrera2@lt.ar",tel:""},
  {id:"u22",n:"Juan Manuel",a:"Bancalari",role:"usuario",dId:5,div:"",mail:"jmbancalari@lt.ar",tel:""},
  {id:"u13",n:"César",a:"Dalla Torre",role:"usuario",dId:5,div:"",mail:"cdallatorre@lt.ar",tel:""},
  {id:"u14",n:"Joaquín",a:"Bancalari",role:"usuario",dId:5,div:"",mail:"jbancalari@lt.ar",tel:""},
  {id:"g16",n:"Gustavo",a:"Cialone",role:"coordinador",dId:61,div:"",mail:"gcialone@lt.ar",tel:""},
  {id:"g17",n:"Santiago",a:"Pérez Araujo",role:"usuario",dId:62,div:"",mail:"sperezaraujo@lt.ar",tel:""},
  {id:"g18",n:"Ignacio",a:"Barbeira",role:"usuario",dId:63,div:"",mail:"ibarbeira2@lt.ar",tel:""},
  {id:"u16",n:"Victoria",a:"Brandi",role:"coordinador",dId:65,div:"Tordos Shop",mail:"vbrandi3@lt.ar",tel:""},
  {id:"g19",n:"Laura",a:"Piola",role:"usuario",dId:65,div:"Encargada",mail:"lpiola@lt.ar",tel:""},
  {id:"g20",n:"Victoria",a:"Brandi",role:"coordinador",dId:21,div:"Conecta",mail:"vbrandi4@lt.ar",tel:""},
  {id:"g21",n:"Clara",a:"Urrutia",role:"usuario",dId:20,div:"",mail:"currutia@lt.ar",tel:""},
  {id:"g22",n:"Ignacio",a:"Ricci",role:"usuario",dId:23,div:"",mail:"iricci2@lt.ar",tel:""},
  {id:"u20",n:"Fabián",a:"Guzzo",role:"usuario",dId:22,div:"",mail:"fguzzo@lt.ar",tel:""},
  {id:"g23",n:"Álvaro",a:"Villanueva",role:"coordinador",dId:32,div:"",mail:"avillanueva@lt.ar",tel:""},
  {id:"u21",n:"Germán",a:"Luppoli",role:"usuario",dId:2,div:"Torneos",mail:"gluppoli@lt.ar",tel:""},
  {id:"e1",n:"Agustín",a:"Castillo",role:"enlace",dId:11,div:"Plantel Superior",mail:"ac@lt.ar",tel:"261-0001"},
  {id:"e2",n:"Martín",a:"Isola",role:"enlace",dId:11,div:"M19",mail:"misola2@lt.ar",tel:"261-0002"},
  {id:"e3",n:"Juan Pablo",a:"García",role:"enlace",dId:11,div:"M17",mail:"jpg@lt.ar",tel:"261-0003"},
  {id:"e4",n:"Rodolfo",a:"Guerra",role:"enlace",dId:11,div:"M16",mail:"rguerra@lt.ar",tel:"261-0004"},
  {id:"e5",n:"Sebastián",a:"Salas",role:"enlace",dId:11,div:"M15",mail:"ssalas@lt.ar",tel:"261-0005"},
  {id:"e6",n:"Pablo",a:"Galeano",role:"enlace",dId:11,div:"M14",mail:"pg@lt.ar",tel:"261-0006"},
  {id:"e7",n:"Lautaro",a:"Díaz",role:"enlace",dId:11,div:"M13",mail:"ldiaz@lt.ar",tel:"261-0007"},
  {id:"e8",n:"Fabián",a:"Guzzo",role:"enlace",dId:11,div:"M12",mail:"fguzzo2@lt.ar",tel:"261-0008"},
  {id:"e9",n:"Maximiliano",a:"Ortega",role:"enlace",dId:11,div:"M11",mail:"mortega@lt.ar",tel:"261-0009"},
  {id:"e10",n:"Martín",a:"Sánchez",role:"enlace",dId:11,div:"M10",mail:"msanchez@lt.ar",tel:"261-0010"},
  {id:"e11",n:"Ignacio",a:"Barbeira",role:"enlace",dId:11,div:"M9",mail:"ibarbeira@lt.ar",tel:"261-0011"},
  {id:"e12",n:"Pelado",a:"Badano",role:"enlace",dId:11,div:"M8",mail:"pbadano@lt.ar",tel:"261-0012"},
  {id:"e13",n:"Joel",a:"Agüero",role:"enlace",dId:11,div:"Escuelita",mail:"ja@lt.ar",tel:"261-0013"},
];

const initOM=[
  {id:"cd1",t:"cd",cargo:"Presidente",n:"Juan Cruz",a:"Cardoso",mail:"",tel:""},
  {id:"cd2",t:"cd",cargo:"Vicepresidente",n:"Julián",a:"Saá",mail:"",tel:""},
  {id:"cd3",t:"cd",cargo:"Secretario",n:"Martín",a:"Isola",mail:"",tel:""},
  {id:"cd4",t:"cd",cargo:"Tesorero",n:"Gustavo",a:"Cialone",mail:"",tel:""},
  {id:"cd5",t:"cd",cargo:"1er Vocal Titular",n:"Carlos",a:"García",mail:"",tel:""},
  {id:"cd6",t:"cd",cargo:"2do Vocal Titular",n:"Franco",a:"Perinetti",mail:"",tel:""},
  {id:"cd7",t:"cd",cargo:"1er Vocal Suplente",n:"Laura",a:"Chaky",mail:"",tel:""},
  {id:"cd8",t:"cd",cargo:"2do Vocal Suplente",n:"Francisco",a:"Herrera",mail:"",tel:""},
  {id:"se1",t:"se",cargo:"Presidente",n:"Juan Cruz",a:"Cardoso",mail:"",tel:""},
  {id:"se2",t:"se",cargo:"Vicepresidente",n:"Julián",a:"Saá",mail:"",tel:""},
  {id:"se3",t:"se",cargo:"Secretario",n:"Martín",a:"Isola",mail:"",tel:""},
  {id:"se4",t:"se",cargo:"Tesorero",n:"Gustavo",a:"Cialone",mail:"",tel:""},
  {id:"se5",t:"se",cargo:"2do Vocal Titular",n:"Franco",a:"Perinetti",mail:"",tel:""},
];

const initP=[
  {id:1,div:"Plantel Superior",cId:"e1",cN:"Agustín Castillo",dId:11,tipo:"Logística",desc:"Transporte 35 jugadores a San Luis.",fReq:"2026-03-15",urg:"Normal",st:ST.C,asTo:"u3",rG:true,eOk:null as boolean|null,resp:"Cotizando.",cAt:"2026-02-10",monto:null as number|null,log:[{dt:"2026-02-10 09:00",uid:"e1",by:"Agustín Castillo",act:"Creó el pedido",t:"sys"},{dt:"2026-02-10 14:30",uid:"u3",by:"Marcos Balzarelli",act:"Tomó la tarea",t:"sys"},{dt:"2026-02-11 10:00",uid:"u3",by:"Marcos Balzarelli",act:"Estoy cotizando con 3 empresas de transporte.",t:"msg"}]},
  {id:2,div:"M17",cId:"e3",cN:"Juan Pablo García",dId:11,tipo:"Material deportivo",desc:"10 pelotas Gilbert n°5.",fReq:"2026-02-28",urg:"Urgente",st:ST.P,asTo:null as string|null,rG:true,eOk:null as boolean|null,resp:"",cAt:"2026-02-11",monto:null as number|null,log:[{dt:"2026-02-11 08:00",uid:"e3",by:"Juan Pablo García",act:"Creó el pedido",t:"sys"},{dt:"2026-02-11 08:01",uid:"e3",by:"Juan Pablo García",act:"Las necesitamos para el torneo del 28/02. Son urgentes.",t:"msg"}]},
  {id:3,div:"M14",cId:"e6",cN:"Pablo Galeano",dId:11,tipo:"Administrativo",desc:"Fichas médicas 8 jugadores.",fReq:"2026-02-20",urg:"Normal",st:ST.V,asTo:"u1",rG:false,eOk:null as boolean|null,resp:"Fichas cargadas.",cAt:"2026-02-05",monto:null as number|null,log:[{dt:"2026-02-05 11:00",uid:"e6",by:"Pablo Galeano",act:"Creó el pedido",t:"sys"},{dt:"2026-02-06 09:00",uid:"u1",by:"Gonzalo Santo Tomás",act:"Tomó la tarea",t:"sys"},{dt:"2026-02-12 08:01",uid:"u1",by:"Gonzalo Santo Tomás",act:"Envió a validación",t:"sys"}]},
  {id:4,div:"Escuelita",cId:"e13",cN:"Joel Agüero",dId:11,tipo:"Infraestructura",desc:"Arcos sector 3 rotos.",fReq:"2026-02-14",urg:"Urgente",st:ST.OK,asTo:"u2",rG:true,eOk:true,resp:"Arcos reparados.",cAt:"2026-02-03",monto:15000,log:[{dt:"2026-02-03 10:00",uid:"e13",by:"Joel Agüero",act:"Creó el pedido",t:"sys"},{dt:"2026-02-09 10:01",uid:"e13",by:"Joel Agüero",act:"Validó OK ✅",t:"sys"}]},
  {id:5,div:"",cId:"a1",cN:"Admin SE",dId:3,tipo:"Comunicación",desc:"Diseño flyer institucional.",fReq:"2026-03-01",urg:"Normal",st:ST.P,asTo:null as string|null,rG:false,eOk:null as boolean|null,resp:"",cAt:"2026-02-12",monto:null as number|null,log:[{dt:"2026-02-12 09:00",uid:"a1",by:"Admin SE",act:"Creó el pedido",t:"sys"}]},
  {id:6,div:"",cId:"a1",cN:"Admin SE",dId:30,tipo:"Infraestructura",desc:"Reparar cerco perimetral.",fReq:"2026-03-10",urg:"Normal",st:ST.C,asTo:null as string|null,rG:true,eOk:null as boolean|null,resp:"",cAt:"2026-02-11",monto:null as number|null,log:[{dt:"2026-02-11 14:00",uid:"a1",by:"Admin SE",act:"Creó el pedido",t:"sys"}]},
];

const HITOS=[
  {id:1,fase:"Fase 0",name:"Diagnóstico y mantenimiento",periodo:"2025",pct:85,color:T.gn},
  {id:2,fase:"Fase 1",name:"Anexo + Acceso Urquiza + Estacionamiento + Pádel",periodo:"2025-2026",pct:30,color:T.bl},
  {id:3,fase:"Fase 2",name:"Cantina ampliada + Club del Ex + Zona comercial",periodo:"2026-2027",pct:5,color:T.yl},
  {id:4,fase:"Fase 3",name:"Vestuarios PS Rugby/Hockey + Dormy's",periodo:"2028-2030",pct:0,color:T.pr},
  {id:5,fase:"Fase 4",name:"Pajarera + Paisajismo + Señalética",periodo:"2030-2032",pct:0,color:T.rd},
];

/* ── UI PRIMITIVES ── */
function Badge({s,sm}:{s:string;sm?:boolean}){const c=SC[s];return <span style={{background:c.bg,color:c.c,padding:sm?"1px 6px":"2px 9px",borderRadius:20,fontSize:sm?9:11,fontWeight:600,whiteSpace:"nowrap"}}>{c.i} {c.l}</span>;}

function Btn({children,onClick,v,s,disabled,style:st}:{children:any;onClick?:any;v?:string;s?:string;disabled?:boolean;style?:any}){
  const vs:any={p:{background:T.nv,color:"#fff"},r:{background:T.rd,color:"#fff"},s:{background:T.gn,color:"#fff"},w:{background:T.yl,color:"#fff"},g:{background:"transparent",color:T.nv,border:"1px solid "+T.g3},pu:{background:T.pr,color:"#fff"}};
  const sz:any={s:{padding:"4px 10px",fontSize:11},m:{padding:"7px 16px",fontSize:13}};
  return <button onClick={onClick} disabled={disabled} style={{border:"none",borderRadius:8,cursor:disabled?"not-allowed":"pointer",fontWeight:600,opacity:disabled?.5:1,...sz[s||"m"],...vs[v||"p"],...(st||{})}}>{children}</button>;
}

function Card({children,style:st,onClick}:{children:any;style?:any;onClick?:any}){return <div onClick={onClick} style={{background:"#fff",borderRadius:14,padding:18,boxShadow:"0 1px 4px rgba(0,0,0,.05)",border:"1px solid "+T.g2,...(st||{})}}>{children}</div>;}
function Ring({pct,color,size,icon}:{pct:number;color:string;size:number;icon?:string}){
  const r=(size/2)-6,ci=2*Math.PI*r,of2=ci-(pct/100)*ci;
  return(<div style={{position:"relative",width:size,height:size}}><svg width={size} height={size} style={{transform:"rotate(-90deg)"}}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.g2} strokeWidth="5"/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5" strokeDasharray={ci} strokeDashoffset={of2} strokeLinecap="round"/></svg><div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>{icon&&<span style={{fontSize:size/4}}>{icon}</span>}<span style={{fontSize:size/6,fontWeight:800,color}}>{pct}%</span></div></div>);
}

/* ── LOGIN ── */
function Login({users,deptos,onSel}:{users:any[];deptos:any[];onSel:any}){
  const [rf,sRf]=useState<string|null>(null);
  const fl=rf?users.filter((u:any)=>u.role===rf):[];
  const bg={minHeight:"100vh",background:"linear-gradient(160deg,"+T.nv+","+T.rd+")",display:"flex" as const,alignItems:"center" as const,justifyContent:"center" as const,padding:20};
  const logo=<><img src="/logo.jpg" alt="Los Tordos Rugby Club" style={{width:120,height:120,objectFit:"contain",margin:"0 auto 18px",display:"block"}}/><h1 style={{color:"#fff",fontSize:30,margin:"0 0 4px",fontWeight:800,letterSpacing:1}}>Los Tordos Rugby Club</h1><p style={{color:"rgba(255,255,255,.6)",fontSize:14,margin:"0 0 32px",fontWeight:500}}>Sistema de Gestión</p></>;
  if(!rf) return(<div style={bg}><div style={{maxWidth:480,width:"100%",textAlign:"center" as const}}>{logo}<Card><h2 style={{margin:"0 0 14px",fontSize:16,color:T.nv}}>Ingresá al sistema</h2>{RK.map(k=>{const r=ROLES[k],cnt=users.filter((u:any)=>u.role===k).length;if(!cnt)return null;return(<div key={k} onClick={()=>sRf(k)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",border:"1px solid "+T.g2,borderRadius:10,marginBottom:6,cursor:"pointer",background:"#fff"}}><span style={{fontSize:20}}>{r.i}</span><div style={{flex:1,textAlign:"left" as const}}><div style={{fontWeight:700,color:T.nv,fontSize:13}}>{r.l}</div></div><span style={{background:T.g1,borderRadius:20,padding:"2px 9px",fontSize:11,fontWeight:600,color:T.g5}}>{cnt}</span></div>);})}</Card></div></div>);
  return(<div style={bg}><div style={{maxWidth:480,width:"100%",textAlign:"center" as const}}>{logo}<Card><div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><h2 style={{margin:0,fontSize:15,color:T.nv}}>{ROLES[rf].i} {ROLES[rf].l}</h2><Btn v="g" s="s" onClick={()=>sRf(null)}>← Volver</Btn></div>{fl.map((u:any)=>{const d=deptos.find((x:any)=>x.id===u.dId);return(<div key={u.id} onClick={()=>onSel(u)} style={{display:"flex",justifyContent:"space-between",padding:"10px 12px",border:"1px solid "+T.g2,borderRadius:8,marginBottom:4,cursor:"pointer",background:"#fff"}}><div style={{textAlign:"left" as const}}><div style={{fontWeight:600,color:T.nv,fontSize:13}}>{fn(u)}</div><div style={{color:T.g4,fontSize:11}}>{d?d.name:""}{u.div?" · "+u.div:""}</div></div><span style={{color:T.g4}}>›</span></div>);})}</Card></div></div>);
}

/* ── THREAD ── */
function Thread({log,userId,onSend}:{log:any[];userId:string;onSend:any}){
  const [msg,sMsg]=useState("");
  return(<div style={{display:"flex",flexDirection:"column" as const,height:"100%"}}>
    <div style={{flex:1,overflowY:"auto" as const,padding:"8px 0",display:"flex",flexDirection:"column" as const,gap:6}}>
      {(log||[]).map((l:any,i:number)=>{
        const isMe=l.uid===userId,isSys=l.t==="sys";
        if(isSys) return(<div key={i} style={{textAlign:"center" as const,padding:"4px 0"}}><span style={{background:T.g1,borderRadius:12,padding:"3px 10px",fontSize:10,color:T.g4}}>{l.act} – {l.dt.slice(5,16)}</span></div>);
        return(<div key={i} style={{display:"flex",flexDirection:"column" as const,alignItems:isMe?"flex-end":"flex-start",maxWidth:"85%",alignSelf:isMe?"flex-end":"flex-start"}}>
          <div style={{fontSize:9,color:T.g4,marginBottom:2,paddingLeft:4,paddingRight:4}}>{l.by} · {l.dt.slice(5,16)}</div>
          <div style={{background:isMe?"#DCF8C6":"#fff",border:"1px solid "+(isMe?"#B7E89E":T.g2),borderRadius:isMe?"14px 14px 4px 14px":"14px 14px 14px 4px",padding:"8px 12px",fontSize:12,color:T.nv,lineHeight:1.4}}>{l.act}</div>
        </div>);
      })}
      {(!log||!log.length)&&<div style={{textAlign:"center" as const,color:T.g4,fontSize:12,padding:20}}>Sin mensajes aún</div>}
    </div>
    <div style={{display:"flex",gap:6,paddingTop:8,borderTop:"1px solid "+T.g2}}>
      <input value={msg} onChange={e=>sMsg(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&msg.trim()){onSend(msg.trim());sMsg("");}}} placeholder="Escribí un mensaje..." style={{flex:1,padding:"8px 12px",borderRadius:20,border:"1px solid "+T.g3,fontSize:12,outline:"none"}}/>
      <button onClick={()=>{if(msg.trim()){onSend(msg.trim());sMsg("");}}} disabled={!msg.trim()} style={{width:36,height:36,borderRadius:18,background:msg.trim()?T.nv:T.g2,color:"#fff",border:"none",cursor:msg.trim()?"pointer":"default",fontSize:14}}>➤</button>
    </div>
  </div>);
}

/* ── DETAIL MODAL ── */
function Det({p,user,users,onX,onTk,onAs,onRe,onSE,onEO,onFi,onVa,onMsg,onMonto}:any){
  const [at,sAt]=useState("");const [mt,sMt]=useState(p.monto||"");const [tab,sTab]=useState("chat");const [rp,sRp]=useState(p.resp||"");
  const ag=users.find((u:any)=>u.id===p.asTo),isCo=["coordinador","admin","superadmin"].indexOf(user.role)>=0,isEm=user.role==="embudo",isM=p.asTo===user.id,isCr=p.cId===user.id;
  const canT=["usuario","coordinador","embudo"].indexOf(user.role)>=0&&p.st===ST.P;
  const stf=users.filter((u:any)=>["usuario","coordinador","embudo"].indexOf(u.role)>=0);
  const od=p.st!==ST.OK&&isOD(p.fReq);
  const msgs=(p.log||[]).filter((l:any)=>l.t==="msg").length;

  return(<div style={{position:"fixed" as const,inset:0,background:"rgba(10,22,40,.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:12}} onClick={onX}>
    <div onClick={(e:any)=>e.stopPropagation()} style={{background:"#fff",borderRadius:14,maxWidth:640,width:"100%",height:"85vh",display:"flex",flexDirection:"column" as const,overflow:"hidden"}}>
      <div style={{padding:"16px 20px 12px",borderBottom:"1px solid "+T.g2,flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
          <div><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:10,color:T.g4}}>#{p.id}</span><Badge s={p.st} sm/>{od&&<span style={{fontSize:10,color:"#DC2626",fontWeight:700}}>⏰ VENCIDA</span>}{p.urg==="Urgente"&&<span style={{fontSize:10,color:T.rd,fontWeight:700}}>🔥 URGENTE</span>}</div><h2 style={{margin:"4px 0 0",fontSize:15,color:T.nv,fontWeight:800}}>{p.tipo}: {p.desc.slice(0,60)}</h2></div>
          <button onClick={onX} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:T.g4}}>✕</button>
        </div>
        <div style={{display:"flex",gap:12,marginTop:8,flexWrap:"wrap" as const,fontSize:11,color:T.g5}}>
          <span>📍 {p.div||"General"}</span><span>👤 {p.cN}</span>{ag&&<span>⚙️ {fn(ag)}</span>}<span>📅 {p.fReq}</span>{p.monto&&<span style={{color:T.pr,fontWeight:700}}>💰 ${p.monto.toLocaleString()}</span>}
        </div>
        <div style={{display:"flex",gap:4,marginTop:10}}>
          {[{k:"chat",l:"💬 Chat ("+msgs+")"},{k:"info",l:"📋 Detalle"},{k:"acc",l:"⚡ Acciones"}].map(t=><button key={t.k} onClick={()=>sTab(t.k)} style={{padding:"5px 12px",borderRadius:6,border:"none",background:tab===t.k?T.nv:"transparent",color:tab===t.k?"#fff":T.g5,fontSize:11,fontWeight:600,cursor:"pointer"}}>{t.l}</button>)}
        </div>
      </div>
      <div style={{flex:1,padding:"12px 20px",overflow:"auto",display:"flex",flexDirection:"column" as const}}>
        {tab==="chat"&&<Thread log={p.log} userId={user.id} onSend={(txt:string)=>onMsg(p.id,txt)}/>}
        {tab==="info"&&<div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            {[["DIVISIÓN",p.div||"–"],["SOLICITANTE",p.cN],["TIPO",p.tipo],["URGENCIA",p.urg],["FECHA LÍMITE",p.fReq],["CREADO",p.cAt],["REQUIERE GASTO",p.rG?"Sí 💰":"No"],["MONTO",p.monto?"$"+p.monto.toLocaleString():"–"]].map(([l,v],i)=>
              <div key={i}><div style={{fontSize:9,color:T.g4,fontWeight:700}}>{l}</div><div style={{fontSize:12,color:T.nv}}>{v}</div></div>
            )}
          </div>
          {ag&&<div style={{padding:8,background:T.g1,borderRadius:8,marginBottom:8}}><div style={{fontSize:9,color:T.g4,fontWeight:700}}>ASIGNADO A</div><div style={{fontSize:12,fontWeight:600,color:T.nv}}>👤 {fn(ag)}</div></div>}
          <div style={{fontSize:10,fontWeight:700,color:T.g4,marginTop:8,marginBottom:4}}>HISTORIAL</div>
          {(p.log||[]).slice().reverse().map((l:any,i:number)=>(<div key={i} style={{display:"flex",gap:8,padding:"6px 0",borderBottom:"1px solid "+T.g1}}><div style={{width:6,height:6,borderRadius:3,background:l.t==="sys"?T.bl:T.gn,marginTop:5,flexShrink:0}}/><div><div style={{fontSize:10,color:T.g4}}>{l.dt} · {l.by}</div><div style={{fontSize:11,color:T.nv}}>{l.act}</div></div></div>))}
        </div>}
        {tab==="acc"&&<div style={{display:"flex",flexDirection:"column" as const,gap:8}}>
          {p.st===ST.OK&&<div style={{padding:16,background:"#D1FAE5",borderRadius:10,textAlign:"center" as const}}><span style={{fontSize:24}}>✅</span><div style={{fontSize:14,fontWeight:700,color:"#065F46",marginTop:4}}>Tarea Completada</div></div>}
          {canT&&<Btn v="w" onClick={()=>{onTk(p.id);onX();}}>🙋 Tomar esta tarea</Btn>}
          {isCo&&(p.st===ST.P||p.st===ST.C)&&<div><div style={{fontSize:11,fontWeight:600,color:T.g5,marginBottom:4}}>Asignar a:</div><div style={{display:"flex",gap:4}}><select value={at} onChange={(e:any)=>sAt(e.target.value)} style={{flex:1,padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12}}><option value="">Seleccionar...</option>{stf.map((u:any)=><option key={u.id} value={u.id}>{fn(u)} ({ROLES[u.role]?.l})</option>)}</select><Btn disabled={!at} onClick={()=>{onAs(p.id,at);onX();}}>Asignar</Btn></div></div>}
          {isM&&p.st===ST.C&&<div style={{display:"flex",flexDirection:"column" as const,gap:6}}>
            <textarea value={rp} onChange={(e:any)=>sRp(e.target.value)} rows={2} placeholder="Resolución..." style={{padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,resize:"vertical" as const}}/>
            {p.rG&&!p.eOk&&<div><label style={{fontSize:11,color:T.g5}}>Monto ($)</label><input type="number" value={mt} onChange={(e:any)=>sMt(e.target.value)} style={{width:160,padding:"6px 8px",borderRadius:6,border:"1px solid "+T.g3,fontSize:12,marginLeft:6}}/></div>}
            <div style={{display:"flex",gap:4,flexWrap:"wrap" as const}}>
              <Btn v="g" s="s" onClick={()=>onRe(p.id,rp)}>💾 Guardar</Btn>
              {p.rG&&!p.eOk&&<Btn v="pu" s="s" onClick={()=>{if(mt)onMonto(p.id,Number(mt));onRe(p.id,rp);onSE(p.id);}}>💰 Enviar a Compras</Btn>}
              <Btn v="s" s="s" onClick={()=>{onRe(p.id,rp);onFi(p.id);}} disabled={!rp.trim()||(p.rG&&!p.eOk)}>✅ Terminado</Btn>
            </div>
          </div>}
          {isEm&&p.st===ST.E&&<div style={{background:"#EDE9FE",padding:14,borderRadius:10}}><div style={{fontSize:13,fontWeight:700,color:"#5B21B6",marginBottom:8}}>💰 Aprobación{p.monto&&" – $"+p.monto.toLocaleString()}</div><div style={{display:"flex",gap:8}}><Btn v="s" onClick={()=>onEO(p.id,true)}>✅ Aprobar</Btn><Btn v="r" onClick={()=>onEO(p.id,false)}>❌ Rechazar</Btn></div></div>}
          {isCr&&p.st===ST.V&&<div style={{background:"#F0FDF4",padding:14,borderRadius:10}}><div style={{fontSize:13,fontWeight:700,color:"#166534",marginBottom:8}}>¿Confirmás resolución?</div><div style={{display:"flex",gap:8}}><Btn v="s" onClick={()=>onVa(p.id,true)}>✅ Validar</Btn><Btn v="r" onClick={()=>onVa(p.id,false)}>❌ Rechazar</Btn></div></div>}
          {!(canT||isCo||(isM&&p.st===ST.C)||(isEm&&p.st===ST.E)||(isCr&&p.st===ST.V)||p.st===ST.OK)&&<div style={{padding:16,textAlign:"center" as const,color:T.g4,fontSize:12}}>No hay acciones disponibles.</div>}
        </div>}
      </div>
    </div>
  </div>);
}

/* ── MY DASHBOARD ── */
function MyDash({user,peds,users,onSel}:any){
  const [tab,sTab]=useState("active");
  const isEnl=user.role==="enlace"||user.role==="manager";
  const myPeds=peds.filter((p:any)=>{if(isEnl)return p.cId===user.id;return p.asTo===user.id;});
  const active=myPeds.filter((p:any)=>p.st!==ST.OK),done=myPeds.filter((p:any)=>p.st===ST.OK);
  const total=myPeds.length,okC=done.length,pct=total?Math.round(okC/total*100):0;
  const overdue=active.filter((p:any)=>isOD(p.fReq));
  const vis=tab==="active"?active:done;
  return(<div style={{maxWidth:720}}>
    <div style={{display:"flex",gap:16,alignItems:"center",marginBottom:20}}>
      <Ring pct={pct} color={pct>=80?T.gn:pct>=40?T.yl:T.rd} size={90} icon={isEnl?"🔗":"👤"}/>
      <div style={{flex:1}}><h2 style={{margin:0,fontSize:20,color:T.nv,fontWeight:800}}>{isEnl?"Mis Pedidos":"Mis Tareas"}</h2><div style={{fontSize:12,color:T.g5}}>{fn(user)}{user.div?" · "+user.div:""}</div><div style={{display:"flex",gap:12,marginTop:8,fontSize:12}}><span style={{fontWeight:700,color:T.nv}}>{total} total</span><span style={{fontWeight:700,color:T.gn}}>✅ {okC}</span><span style={{fontWeight:700,color:T.yl}}>🟡 {active.length}</span>{overdue.length>0&&<span style={{fontWeight:700,color:"#DC2626"}}>⏰ {overdue.length}</span>}</div></div>
    </div>
    <div style={{display:"flex",gap:4,marginBottom:14}}>
      {[{k:"active",l:"🟡 Activas ("+active.length+")",bg:T.nv},{k:"done",l:"✅ Realizadas ("+done.length+")",bg:T.gn}].map(t=>
        <button key={t.k} onClick={()=>sTab(t.k)} style={{padding:"7px 16px",borderRadius:8,border:"none",background:tab===t.k?t.bg:"#fff",color:tab===t.k?"#fff":T.g5,fontSize:12,fontWeight:600,cursor:"pointer"}}>{t.l}</button>
      )}
    </div>
    <div style={{display:"flex",flexDirection:"column" as const,gap:8}}>
      {vis.length===0&&<Card style={{textAlign:"center",padding:28,color:T.g4}}><span style={{fontSize:28}}>🎉</span><div style={{marginTop:6,fontSize:13}}>Sin tareas</div></Card>}
      {vis.map((p:any)=>{const od2=p.st!==ST.OK&&isOD(p.fReq),msgs=(p.log||[]).filter((l:any)=>l.t==="msg").length;
        return(<Card key={p.id} style={{padding:"14px 16px",cursor:"pointer",borderLeft:"4px solid "+SC[p.st].c,background:od2?"#FEF2F2":"#fff"}} onClick={()=>onSel(p)}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><Badge s={p.st} sm/>{od2&&<span style={{fontSize:9,color:"#DC2626",fontWeight:700}}>⏰</span>}{p.urg==="Urgente"&&<span style={{fontSize:9,color:T.rd,fontWeight:700}}>🔥</span>}<span style={{fontSize:10,color:T.g4}}>#{p.id}</span></div>
          <div style={{fontSize:13,fontWeight:700,color:T.nv}}>{p.desc}</div>
          <div style={{fontSize:11,color:T.g5,marginTop:3}}>{p.div&&<span>📍 {p.div} · </span>}{p.tipo} · 📅 {p.fReq} · 💬 {msgs}</div>
        </Card>);})}
    </div>
  </div>);
}

/* ── SIDEBAR ── */
function SB({areas,deptos,pedidos,aA,aD,onAC,onDC,col,onCol,isPersonal}:any){
  if(col) return(<div style={{width:48,minWidth:48,background:T.nv,display:"flex",flexDirection:"column" as const,alignItems:"center",paddingTop:10}}><button onClick={onCol} style={{background:"none",border:"none",color:"#fff",fontSize:18,cursor:"pointer",marginBottom:14}}>☰</button><span style={{fontSize:14}}>🏉</span></div>);
  return(
    <div style={{width:250,minWidth:250,background:T.nv,color:"#fff",display:"flex",flexDirection:"column" as const}}>
      <div style={{padding:"14px 12px",borderBottom:"1px solid rgba(255,255,255,.08)",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:16}}>🏉</span><span style={{fontSize:13,fontWeight:800}}>LOS TORDOS</span></div><div style={{fontSize:9,color:T.g4,letterSpacing:1,textTransform:"uppercase" as const,marginTop:2}}>Panel de Control</div></div><button onClick={onCol} style={{background:"none",border:"none",color:T.g4,fontSize:14,cursor:"pointer"}}>◀</button></div>
      <div style={{flex:1,overflowY:"auto" as const,padding:"8px 6px"}}>
        {!isPersonal&&areas.map((ar:any)=>{const ds=deptos.filter((d:any)=>d.aId===ar.id),ids=ds.map((d:any)=>d.id),ap=pedidos.filter((p:any)=>ids.indexOf(p.dId)>=0),pe=ap.filter((p:any)=>p.st===ST.P).length,cu=ap.filter((p:any)=>[ST.C,ST.E,ST.V].indexOf(p.st)>=0).length,ok=ap.filter((p:any)=>p.st===ST.OK).length;
          return(<div key={ar.id} style={{marginBottom:4}}><div onClick={()=>onAC(ar.id)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 8px",borderRadius:7,cursor:"pointer",background:aA===ar.id?"rgba(255,255,255,.1)":"transparent",borderLeft:"3px solid "+ar.color}}><span style={{fontSize:11,fontWeight:600}}>{ar.icon} {ar.name}</span><div style={{display:"flex",gap:4,fontSize:9}}>{pe>0&&<span style={{color:T.rd}}>🔴{pe}</span>}{cu>0&&<span style={{color:T.yl}}>🟡{cu}</span>}{ok>0&&<span style={{color:T.gn}}>🟢{ok}</span>}</div></div>
            {aA===ar.id&&<div style={{marginTop:2}}>{ds.map((d:any)=>{const dc=pedidos.filter((p:any)=>p.dId===d.id).length;return(<div key={d.id} onClick={()=>onDC(d.id)} style={{marginLeft:14,padding:"4px 8px",borderRadius:5,cursor:"pointer",background:aD===d.id?"rgba(255,255,255,.14)":"transparent",fontSize:10,color:aD===d.id?"#fff":"rgba(255,255,255,.45)",fontWeight:aD===d.id?600:400,display:"flex",justifyContent:"space-between"}}><span>📂 {d.name}</span>{dc>0&&<span style={{background:"rgba(255,255,255,.12)",borderRadius:8,padding:"0 5px",fontSize:9}}>{dc}</span>}</div>);})}</div>}
          </div>);
        })}
        <div style={{marginTop:10,padding:8,background:"rgba(255,255,255,.04)",borderRadius:7}}>
          <div style={{fontSize:9,fontWeight:700,color:T.g4,textTransform:"uppercase" as const,marginBottom:4}}>Global</div>
          {Object.keys(SC).map(k=><div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:10,padding:"1px 0"}}><span style={{color:"rgba(255,255,255,.45)"}}>{SC[k].i} {SC[k].l}</span><span style={{fontWeight:700,color:SC[k].c}}>{pedidos.filter((p:any)=>p.st===k).length}</span></div>)}
        </div>
      </div>
    </div>
  );
}

/* ── KPIs ── */
function KPIs({peds}:{peds:any[]}){
  const tot=peds.length,ok=peds.filter(p=>p.st===ST.OK).length,pe=peds.filter(p=>p.st===ST.P).length;
  const active=peds.filter(p=>p.st!==ST.OK),overdue=active.filter(p=>isOD(p.fReq)).length;
  const kpis=[{l:"Completadas",v:ok+"/"+tot,c:T.gn,i:"✅"},{l:"Pendientes",v:pe,c:T.rd,i:"🔴"},{l:"Vencidas",v:overdue,c:"#DC2626",i:"⏰"},{l:"Con Gasto",v:peds.filter(p=>p.monto).length,c:T.pr,i:"💰"}];
  return(<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10,marginBottom:18}}>{kpis.map((k,i)=>(<Card key={i} style={{padding:"10px 12px",borderTop:"3px solid "+k.c}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:16}}>{k.i}</span><span style={{fontSize:17,fontWeight:800,color:k.c}}>{k.v}</span></div><div style={{fontSize:10,color:T.g4,marginTop:3}}>{k.l}</div></Card>))}</div>);
}

/* ── CIRCLES ── */
function Circles({areas,deptos,pedidos,onAC}:any){
  return(<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14}}>
    {areas.map((ar:any)=>{const ids=deptos.filter((d:any)=>d.aId===ar.id).map((d:any)=>d.id),ap=pedidos.filter((p:any)=>ids.indexOf(p.dId)>=0),tot=ap.length,ok=ap.filter((p:any)=>p.st===ST.OK).length,pe=ap.filter((p:any)=>p.st===ST.P).length,cu=ap.filter((p:any)=>[ST.C,ST.E,ST.V].indexOf(p.st)>=0).length,pct=tot?Math.round(ok/tot*100):0;
      return(<div key={ar.id} onClick={()=>onAC(ar.id)} style={{background:"#fff",borderRadius:16,padding:"20px 16px",textAlign:"center" as const,cursor:"pointer",border:"1px solid "+T.g2}}><Ring pct={pct} color={ar.color} size={100} icon={ar.icon}/><div style={{fontSize:14,fontWeight:700,color:T.nv,marginTop:6}}>{ar.name}</div><div style={{display:"flex",justifyContent:"center",gap:8,fontSize:11,marginTop:5}}><span style={{color:T.rd}}>🔴{pe}</span><span style={{color:T.yl}}>🟡{cu}</span><span style={{color:T.gn}}>🟢{ok}</span></div></div>);})}
  </div>);
}

/* ── TASK LIST ── */
function TList({title,icon,color,peds,users,onSel,search}:any){
  const [f,sF]=useState("all");
  let v=f==="all"?peds:peds.filter((p:any)=>p.st===f);
  if(search){const s=search.toLowerCase();v=v.filter((p:any)=>(p.desc+p.cN+p.tipo+p.div+(p.id+"")).toLowerCase().includes(s));}
  return(<div>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><div style={{width:30,height:30,borderRadius:8,background:color+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>{icon}</div><div><h2 style={{margin:0,fontSize:16,color:T.nv,fontWeight:800}}>{title}</h2><p style={{margin:0,fontSize:11,color:T.g4}}>{v.length} tareas</p></div></div>
    <div style={{display:"flex",gap:4,marginBottom:10,flexWrap:"wrap" as const}}><Btn v={f==="all"?"p":"g"} s="s" onClick={()=>sF("all")}>Todos</Btn>{Object.keys(SC).map(k=><Btn key={k} v={f===k?"p":"g"} s="s" onClick={()=>sF(f===k?"all":k)}>{SC[k].i} {peds.filter((p:any)=>p.st===k).length}</Btn>)}</div>
    <Card style={{padding:0,overflow:"hidden"}}><table style={{width:"100%",borderCollapse:"collapse" as const,fontSize:12}}><thead><tr style={{background:T.g1}}>{["#","Tipo","Solicitante","Fecha","Estado","Asignado"].map((h,i)=><th key={i} style={{padding:"7px 8px",textAlign:"left" as const,fontSize:10,color:T.g4,fontWeight:700}}>{h}</th>)}</tr></thead><tbody>
      {v.length===0&&<tr><td colSpan={6} style={{padding:28,textAlign:"center" as const,color:T.g4}}>Sin tareas</td></tr>}
      {v.map((p:any)=>{const ag=users.find((u:any)=>u.id===p.asTo),od=p.st!==ST.OK&&isOD(p.fReq);return(<tr key={p.id} onClick={()=>onSel(p)} style={{borderBottom:"1px solid "+T.g1,cursor:"pointer",background:od?"#FEF2F2":"transparent"}}><td style={{padding:"7px 8px",fontWeight:600,color:T.nv}}>{p.id}</td><td style={{padding:"7px 8px"}}>{p.tipo}</td><td style={{padding:"7px 8px",fontSize:11}}>{p.cN}</td><td style={{padding:"7px 8px",fontSize:11}}>{p.fReq}{od&&<span style={{marginLeft:4,fontSize:9,color:"#DC2626"}}>⏰</span>}</td><td style={{padding:"7px 8px"}}><Badge s={p.st} sm/></td><td style={{padding:"7px 8px",fontSize:11,color:T.g4}}>{ag?fn(ag):"–"}</td></tr>);})}
    </tbody></table></Card>
  </div>);
}

/* ── ORGANIGRAMA ── */
function OrgNode({icon,title,sub,color,children,cnt,ex,onTog}:any){return(<div style={{marginBottom:6}}><div onClick={onTog} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:"#fff",borderRadius:10,border:"1px solid "+T.g2,cursor:"pointer",borderLeft:"4px solid "+color}}><span style={{fontSize:18}}>{icon}</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:T.nv}}>{title}</div>{sub&&<div style={{fontSize:10,color:T.g4}}>{sub}</div>}</div>{cnt!==undefined&&<span style={{background:T.g1,borderRadius:12,padding:"1px 8px",fontSize:10,fontWeight:600,color:T.g5}}>{cnt}</span>}<span style={{fontSize:12,color:T.g4,transform:ex?"rotate(90deg)":"none",transition:"transform .2s"}}>▶</span></div>{ex&&<div style={{marginLeft:24,marginTop:4,borderLeft:"2px solid "+color+"22",paddingLeft:14}}>{children}</div>}</div>);}

function OrgMember({m,isSA,onEdit}:any){const ok=m.n&&m.a;return(<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 10px",background:ok?"#fff":T.g1,borderRadius:7,border:"1px solid "+T.g2,marginBottom:3}}><div><div style={{fontSize:10,fontWeight:600,color:T.g4}}>{m.cargo}</div>{ok?<div style={{fontSize:12,fontWeight:600,color:T.nv}}>{m.n} {m.a}</div>:<div style={{fontSize:11,color:T.g3,fontStyle:"italic"}}>Sin asignar</div>}</div>{isSA&&<Btn v="g" s="s" onClick={()=>onEdit(m)}>✏️</Btn>}</div>);}

function Org({areas,deptos,users,om,onEditSave,isSA}:any){
  const [ex,sEx]=useState<any>({});const [ed,sEd]=useState<any>(null);const [ef,sEf]=useState({n:"",a:"",mail:"",tel:""});
  const tog=(k:string)=>sEx((p:any)=>({...p,[k]:!p[k]}));
  return(<div style={{maxWidth:680}}><h2 style={{margin:"0 0 4px",fontSize:19,color:T.nv,fontWeight:800}}>Organigrama</h2><p style={{color:T.g4,fontSize:12,margin:"0 0 18px"}}>Estructura institucional Los Tordos Rugby Club</p>
    {ed&&<Card style={{marginBottom:12,maxWidth:400,background:"#FFFBEB",border:"1px solid #FDE68A"}}><div style={{fontSize:11,fontWeight:600,color:T.g5,marginBottom:6}}>Editando: {ed.cargo}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:4}}><input value={ef.n} onChange={e=>sEf(p=>({...p,n:e.target.value}))} placeholder="Nombre" style={{padding:"6px 8px",borderRadius:6,border:"1px solid "+T.g3,fontSize:12}}/><input value={ef.a} onChange={e=>sEf(p=>({...p,a:e.target.value}))} placeholder="Apellido" style={{padding:"6px 8px",borderRadius:6,border:"1px solid "+T.g3,fontSize:12}}/></div><div style={{display:"flex",gap:4}}><Btn s="s" onClick={()=>{onEditSave(ed.id,ef);sEd(null);}}>Guardar</Btn><Btn v="g" s="s" onClick={()=>sEd(null)}>✕</Btn></div></Card>}
    <OrgNode icon="🏛️" title="Comisión Directiva" color={T.nv} ex={!!ex.cd} onTog={()=>tog("cd")} cnt={om.filter((m:any)=>m.t==="cd"&&m.n).length+"/8"}>{om.filter((m:any)=>m.t==="cd").map((m:any)=><OrgMember key={m.id} m={m} isSA={isSA} onEdit={(mm:any)=>{sEd(mm);sEf({n:mm.n,a:mm.a,mail:mm.mail,tel:mm.tel});}}/>)}</OrgNode>
    <div style={{marginLeft:24,borderLeft:"2px solid "+T.nv+"22",paddingLeft:14}}>
      <OrgNode icon="⚡" title="Secretaría Ejecutiva" sub="Depende de CD" color={T.rd} ex={!!ex.se} onTog={()=>tog("se")} cnt={om.filter((m:any)=>m.t==="se"&&m.n).length+"/5"}>{om.filter((m:any)=>m.t==="se").map((m:any)=><OrgMember key={m.id} m={m} isSA={isSA} onEdit={(mm:any)=>{sEd(mm);sEf({n:mm.n,a:mm.a,mail:mm.mail,tel:mm.tel});}}/>)}</OrgNode>
      <div style={{marginLeft:24,borderLeft:"2px solid "+T.rd+"22",paddingLeft:14}}>
        {areas.filter((ar:any)=>ar.id!==100&&ar.id!==101).map((ar:any)=>{const ds=deptos.filter((d:any)=>d.aId===ar.id);return(<OrgNode key={ar.id} icon={ar.icon} title={ar.name} sub={ds.length+" deptos"} color={ar.color} ex={!!ex["ar"+ar.id]} onTog={()=>tog("ar"+ar.id)} cnt={ds.length}>{ds.map((d:any)=>{const pp=users.filter((u:any)=>u.dId===d.id);const resp=pp.find((u:any)=>u.role==="coordinador")||pp.find((u:any)=>u.role==="admin")||pp[0];return(<div key={d.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"#fff",borderRadius:8,border:"1px solid "+T.g2,marginBottom:4,borderLeft:"3px solid "+ar.color}}><span style={{fontSize:14}}>📂</span><div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:T.nv}}>{d.name}</div>{resp?<div style={{fontSize:10,color:T.g5,marginTop:1}}>👤 {fn(resp)}{pp.length>1?" · "+pp.length+" personas":""}</div>:<div style={{fontSize:10,color:T.g3,fontStyle:"italic"}}>Sin responsable</div>}</div></div>);})}</OrgNode>);})}
      </div>
    </div>
  </div>);
}

/* ── NUEVO PEDIDO ── */
function NP({user,users,deptos,areas,onSub,onX}:any){
  const isE=["enlace","manager","usuario","embudo"].indexOf(user.role)>=0;
  const isHigh=["superadmin","admin","coordinador"].indexOf(user.role)>=0;
  const [f,sF]=useState({aId:"",dId:isE?String(user.dId):"",div:isE?user.div:"",asTo:"",tipo:"",desc:"",fReq:"",urg:"Normal",rG:false});
  const up=(k:string,v:any)=>sF((p:any)=>({...p,[k]:v}));
  const selArea=f.aId?areas.find((a:any)=>a.id===Number(f.aId)):null;
  const ok=f.tipo&&f.desc&&f.fReq;
  return(<Card style={{maxWidth:560}}>
    <h2 style={{margin:"0 0 14px",fontSize:17,color:T.nv,fontWeight:800}}>🏉 Nuevo Pedido</h2>
    {isE&&<div style={{padding:"8px 12px",background:T.g1,borderRadius:8,fontSize:12,marginBottom:12}}>{fn(user)}{user.div?" · "+user.div:""}</div>}
    {isHigh&&<><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}><div><label style={{fontSize:12,fontWeight:600,color:T.g5}}>Área</label><select value={f.aId} onChange={(e:any)=>{sF((p:any)=>({...p,aId:e.target.value,dId:""}));}} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,marginTop:3}}><option value="">Todas</option>{areas.map((a:any)=><option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}</select></div><div><label style={{fontSize:12,fontWeight:600,color:T.g5}}>Departamento</label><select value={f.dId} onChange={(e:any)=>up("dId",e.target.value)} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,marginTop:3}}><option value="">General</option>{(selArea?deptos.filter((d:any)=>d.aId===selArea.id):deptos).map((d:any)=><option key={d.id} value={d.id}>{d.name}</option>)}</select></div></div><div style={{marginBottom:10}}><label style={{fontSize:12,fontWeight:600,color:T.g5}}>División</label><select value={f.div} onChange={(e:any)=>up("div",e.target.value)} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,marginTop:3}}><option value="">General</option>{DIV.map(d=><option key={d} value={d}>{d}</option>)}</select></div></>}
    <div style={{marginBottom:10}}><label style={{fontSize:12,fontWeight:600,color:T.g5}}>Tipo *</label><div style={{display:"flex",flexWrap:"wrap" as const,gap:4,marginTop:4}}>{TIPOS.map(t=><button key={t} onClick={()=>up("tipo",t)} style={{padding:"4px 12px",borderRadius:18,fontSize:11,border:f.tipo===t?"2px solid "+T.nv:"1px solid "+T.g3,background:f.tipo===t?T.nv:"#fff",color:f.tipo===t?"#fff":T.g5,cursor:"pointer"}}>{t}</button>)}</div></div>
    <div style={{marginBottom:10}}><label style={{fontSize:12,fontWeight:600,color:T.g5}}>Descripción *</label><textarea value={f.desc} onChange={(e:any)=>up("desc",e.target.value)} rows={3} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:12,resize:"vertical" as const,boxSizing:"border-box" as const,marginTop:3}}/></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}><div><label style={{fontSize:12,fontWeight:600,color:T.g5}}>Fecha límite *</label><input type="date" value={f.fReq} onChange={(e:any)=>up("fReq",e.target.value)} style={{width:"100%",padding:8,borderRadius:8,border:"1px solid "+T.g3,fontSize:13,boxSizing:"border-box" as const,marginTop:3}}/></div><div><label style={{fontSize:12,fontWeight:600,color:T.g5}}>Urgencia</label><div style={{display:"flex",gap:4,marginTop:3}}>{["Normal","Urgente"].map(u=><button key={u} onClick={()=>up("urg",u)} style={{flex:1,padding:6,borderRadius:8,fontSize:11,fontWeight:600,border:f.urg===u?"2px solid "+T.nv:"1px solid "+T.g3,background:f.urg===u?T.nv+"15":"#fff",color:f.urg===u?T.nv:T.g4,cursor:"pointer"}}>{u}</button>)}</div></div></div>
    <div style={{marginBottom:12}}><label style={{display:"flex",alignItems:"center",gap:6,fontSize:12,cursor:"pointer"}}><input type="checkbox" checked={f.rG} onChange={(e:any)=>up("rG",e.target.checked)}/><span style={{fontWeight:600,color:T.g5}}>Requiere gasto 💰</span></label></div>
    <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn v="g" onClick={onX}>Cancelar</Btn><Btn v="r" disabled={!ok} onClick={()=>{const dId=Number(f.dId)||user.dId;onSub({id:_p++,div:f.div||user.div||"",cId:user.id,cN:fn(user),dId,tipo:f.tipo,desc:f.desc,fReq:f.fReq,urg:f.urg,st:ST.P,asTo:null,rG:f.rG,eOk:null,resp:"",cAt:TODAY,monto:null,log:[{dt:TODAY+" "+new Date().toTimeString().slice(0,5),uid:user.id,by:fn(user),act:"Creó el pedido",t:"sys"}]});}}>📨 Enviar</Btn></div>
  </Card>);
}

/* ── PROYECTO ── */
function Proyecto({hitos,setHitos,isAd}:any){return(<div style={{maxWidth:700}}><h2 style={{margin:"0 0 4px",fontSize:19,color:T.nv,fontWeight:800}}>📋 Plan Maestro 2035</h2><p style={{color:T.g4,fontSize:12,margin:"0 0 18px"}}>Hitos de infraestructura</p>{hitos.map((h:any)=>(<Card key={h.id} style={{marginBottom:10,borderLeft:"4px solid "+h.color,display:"flex",gap:16,alignItems:"center"}}><Ring pct={h.pct} color={h.color} size={70}/><div style={{flex:1}}><div style={{fontSize:10,fontWeight:700,color:h.color,textTransform:"uppercase" as const}}>{h.fase} · {h.periodo}</div><div style={{fontSize:14,fontWeight:700,color:T.nv,margin:"3px 0"}}>{h.name}</div><div style={{height:4,background:T.g2,borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:h.pct+"%",background:h.color,borderRadius:4}}/></div></div>{isAd&&<div style={{display:"flex",gap:3}}><Btn v="g" s="s" onClick={()=>setHitos((p:any)=>p.map((x:any)=>x.id===h.id?{...x,pct:Math.max(0,x.pct-5)}:x))}>−</Btn><Btn v="g" s="s" onClick={()=>setHitos((p:any)=>p.map((x:any)=>x.id===h.id?{...x,pct:Math.min(100,x.pct+5)}:x))}>+</Btn></div>}</Card>))}</div>);}

/* ── PERFILES ── */
function Profs({users,deptos,areas,onDel}:any){return(<div><h2 style={{margin:"0 0 14px",fontSize:19,color:T.nv,fontWeight:800}}>👥 Perfiles</h2>{RK.map(k=>{const l=users.filter((u:any)=>u.role===k);if(!l.length)return null;return(<div key={k} style={{marginBottom:14}}><div style={{fontSize:13,fontWeight:700,color:T.nv,marginBottom:6}}>{ROLES[k].i} {ROLES[k].l} ({l.length})</div>{l.map((u:any)=>{const d=deptos.find((x:any)=>x.id===u.dId),a=d?areas.find((x:any)=>x.id===d.aId):null;return(<Card key={u.id} style={{padding:"9px 12px",marginBottom:4,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:13,fontWeight:600,color:T.nv}}>{fn(u)}</div><div style={{fontSize:10,color:T.g4}}>{a?a.name:""} → {d?d.name:""}{u.div?" · "+u.div:""}</div></div>{["superadmin","admin"].indexOf(u.role)<0&&<Btn v="g" s="s" onClick={()=>onDel(u.id)} style={{color:T.rd,fontSize:9}}>Eliminar</Btn>}</Card>);})}</div>);})}</div>);}

/* ── DEPARTAMENTOS ── */
function Depts({areas,deptos,pedidos,users,onSel}:any){
  const [selA,sSelA]=useState<number|null>(null);
  const [selD,sSelD]=useState<number|null>(null);
  const fDeptos=selA?deptos.filter((d:any)=>d.aId===selA):deptos;
  const selDepto=selD?deptos.find((d:any)=>d.id===selD):null;
  const selArea=selDepto?areas.find((a:any)=>a.id===selDepto.aId):null;
  const dPeds=selD?pedidos.filter((p:any)=>p.dId===selD):[];
  if(selD&&selDepto){
    return(<div style={{maxWidth:720}}>
      <Btn v="g" s="s" onClick={()=>sSelD(null)} style={{marginBottom:12}}>← Volver a Departamentos</Btn>
      <TList title={selDepto.name} icon="📂" color={selArea?selArea.color:T.nv} peds={dPeds} users={users} onSel={onSel} search=""/>
    </div>);
  }
  return(<div style={{maxWidth:720}}>
    <h2 style={{margin:"0 0 4px",fontSize:19,color:T.nv,fontWeight:800}}>📂 Departamentos</h2>
    <p style={{color:T.g4,fontSize:12,margin:"0 0 14px"}}>Tareas por departamento</p>
    <div style={{display:"flex",gap:4,marginBottom:14,flexWrap:"wrap" as const}}>
      <Btn v={selA===null?"p":"g"} s="s" onClick={()=>sSelA(null)}>Todas las áreas</Btn>
      {areas.filter((a:any)=>a.id!==100&&a.id!==101).map((a:any)=><Btn key={a.id} v={selA===a.id?"p":"g"} s="s" onClick={()=>sSelA(selA===a.id?null:a.id)}>{a.icon} {a.name}</Btn>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
      {fDeptos.map((d:any)=>{const ar=areas.find((a:any)=>a.id===d.aId);const dp=pedidos.filter((p:any)=>p.dId===d.id);const pe=dp.filter((p:any)=>p.st===ST.P).length,cu=dp.filter((p:any)=>[ST.C,ST.E,ST.V].indexOf(p.st)>=0).length,ok=dp.filter((p:any)=>p.st===ST.OK).length;
        return(<Card key={d.id} onClick={()=>sSelD(d.id)} style={{padding:"14px 16px",cursor:"pointer",borderLeft:"4px solid "+(ar?ar.color:T.nv)}}>
          <div style={{fontSize:13,fontWeight:700,color:T.nv}}>{d.name}</div>
          <div style={{fontSize:10,color:T.g4,marginTop:2}}>{ar?ar.icon+" "+ar.name:""}</div>
          <div style={{display:"flex",gap:8,marginTop:8,fontSize:11}}>
            {pe>0&&<span style={{color:T.rd}}>🔴 {pe}</span>}
            {cu>0&&<span style={{color:T.yl}}>🟡 {cu}</span>}
            {ok>0&&<span style={{color:T.gn}}>🟢 {ok}</span>}
            {dp.length===0&&<span style={{color:T.g4}}>Sin tareas</span>}
          </div>
        </Card>);})}
    </div>
  </div>);
}

/* ── NOTIFS ── */
function notifs(user:any,peds:any[]){const n:any[]=[];if(["coordinador","admin","superadmin"].indexOf(user.role)>=0){const pp=peds.filter(p=>p.st===ST.P);if(pp.length)n.push({t:"🔴 "+pp.length+" pendientes",c:T.rd});}if(user.role==="embudo"){const ee=peds.filter(p=>p.st===ST.E);if(ee.length)n.push({t:"💰 "+ee.length+" esperando aprobación",c:T.pr});}const myV=peds.filter(p=>p.st===ST.V&&p.cId===user.id);if(myV.length)n.push({t:"🔵 "+myV.length+" esperando validación",c:T.bl});const od=peds.filter(p=>p.st!==ST.OK&&isOD(p.fReq));if(od.length)n.push({t:"⏰ "+od.length+" vencidas",c:"#DC2626"});return n;}

/* ── MAIN APP ── */
export default function App(){
  const [areas]=useState(AREAS);const [deptos]=useState(DEPTOS);const [users,sUs]=useState(initU);const [om,sOm]=useState(initOM);const [peds,sPd]=useState(initP);const [hitos,sHi]=useState(HITOS);
  const [user,sU]=useState<any>(null);const [vw,sVw]=useState("dash");const [sel,sSl]=useState<any>(null);const [aA,sAA]=useState<number|null>(null);const [aD,sAD]=useState<number|null>(null);const [sbCol,sSbCol]=useState(false);const [search,sSr]=useState("");const [shNot,sShNot]=useState(false);

  const out=()=>{sU(null);sVw("dash");sSl(null);sAA(null);sAD(null);sSr("");};
  const isAd=user&&(user.role==="admin"||user.role==="superadmin");
  const isSA=user&&user.role==="superadmin";
  const isPersonal=user&&(user.role==="enlace"||user.role==="manager"||user.role==="usuario");

  if(!user) return <Login users={users} deptos={deptos} onSel={sU}/>;

  const nts=notifs(user,peds);
  const hAC=(id:number)=>{sAA(aA===id?null:id);sAD(null);sVw("dash");};
  const hDC=(id:number)=>sAD(aD===id?null:id);

  let vT="",vI="",vC=T.nv,vP=peds;
  if(aD){const dd=deptos.find(x=>x.id===aD),aar=dd?areas.find(x=>x.id===dd.aId):null;vT=dd?dd.name:"";vI="📂";vC=aar?aar.color:T.nv;vP=peds.filter(p=>p.dId===aD);}
  else if(aA){const aar2=areas.find(x=>x.id===aA),ids2=deptos.filter(d=>d.aId===aA).map(d=>d.id);vT=aar2?aar2.name:"";vI=aar2?aar2.icon:"";vC=aar2?aar2.color:T.nv;vP=peds.filter(p=>ids2.indexOf(p.dId)>=0);}

  let nav:any[]=[];
  if(isPersonal){nav=[{k:"my",l:user.role==="usuario"?"Mis Tareas":"Mis Pedidos",sh:true},{k:"new",l:"+ Pedido",sh:true},{k:"org",l:"Organigrama",sh:true},{k:"proy",l:"Plan 2035",sh:true}];}
  else{nav=[{k:"dash",l:"Dashboard",sh:true},{k:"org",l:"Organigrama",sh:true},{k:"dept",l:"Departamentos",sh:true},{k:"proy",l:"Plan 2035",sh:true},{k:"profs",l:"Perfiles",sh:isAd},{k:"new",l:"+ Pedido",sh:true}];}

  const addLog=(id:number,uid:string,by:string,act:string,t?:string)=>sPd(p=>p.map(x=>x.id===id?{...x,log:[...(x.log||[]),{dt:TODAY+" "+new Date().toTimeString().slice(0,5),uid,by,act,t:t||"sys"}]}:x));

  if(isPersonal&&vw==="dash") { setTimeout(()=>sVw("my"),0); return null; }

  return(
    <div style={{display:"flex",minHeight:"100vh",background:T.g1,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <SB areas={areas} deptos={deptos} pedidos={peds} aA={aA} aD={aD} onAC={hAC} onDC={hDC} col={sbCol} onCol={()=>sSbCol(!sbCol)} isPersonal={isPersonal}/>
      <div style={{flex:1,display:"flex",flexDirection:"column" as const,minWidth:0}}>
        <div style={{background:"#fff",borderBottom:"1px solid "+T.g2,padding:"0 14px",display:"flex",justifyContent:"space-between",alignItems:"center",height:48}}>
          <div style={{display:"flex",gap:1,overflowX:"auto" as const,alignItems:"center"}}>{nav.filter(n=>n.sh).map(n=><button key={n.k} onClick={()=>{sVw(n.k);if(n.k==="dash"||n.k==="my"){sAA(null);sAD(null);}}} style={{padding:"6px 11px",border:"none",borderRadius:7,background:vw===n.k?T.nv:"transparent",color:vw===n.k?"#fff":T.g5,fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap" as const}}>{n.l}</button>)}</div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
            <div style={{position:"relative" as const}}><input value={search} onChange={e=>sSr(e.target.value)} placeholder="🔍 Buscar..." style={{padding:"5px 10px",borderRadius:8,border:"1px solid "+T.g3,fontSize:11,width:130}}/></div>
            <div style={{position:"relative" as const}}><button onClick={()=>sShNot(!shNot)} style={{background:"none",border:"none",fontSize:16,cursor:"pointer",position:"relative" as const}}>🔔{nts.length>0&&<span style={{position:"absolute" as const,top:-4,right:-4,width:14,height:14,borderRadius:7,background:T.rd,color:"#fff",fontSize:8,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{nts.length}</span>}</button>{shNot&&<div style={{position:"absolute" as const,right:0,top:32,background:"#fff",borderRadius:10,boxShadow:"0 4px 16px rgba(0,0,0,.12)",border:"1px solid "+T.g2,width:260,zIndex:100,padding:8}}><div style={{fontSize:11,fontWeight:700,color:T.nv,marginBottom:6}}>Notificaciones</div>{nts.length===0&&<div style={{fontSize:11,color:T.g4,padding:8}}>Todo al día ✅</div>}{nts.map((n,i)=><div key={i} style={{padding:"6px 8px",borderRadius:6,background:n.c+"10",marginBottom:3,fontSize:11,color:n.c,fontWeight:600}}>{n.t}</div>)}</div>}</div>
            <div style={{textAlign:"right" as const}}><div style={{fontSize:11,fontWeight:700,color:T.nv}}>{fn(user)}</div><div style={{fontSize:9,color:T.g4}}>{ROLES[user.role]?.i} {ROLES[user.role]?.l}{user.div?" · "+user.div:""}</div></div>
            <button onClick={out} style={{width:28,height:28,borderRadius:7,border:"1px solid "+T.g2,background:"#fff",cursor:"pointer",fontSize:12}}>↩</button>
          </div>
        </div>
        <div style={{flex:1,padding:"20px 16px",overflowY:"auto" as const,marginTop:4}}>
          {vw==="my"&&isPersonal&&<MyDash user={user} peds={peds} users={users} onSel={(p:any)=>sSl(p)}/>}
          {vw==="org"&&<Org areas={areas} deptos={deptos} users={users} om={om} onEditSave={(id:string,d:any)=>sOm(p=>p.map(m=>m.id===id?{...m,...d}:m))} isSA={isSA}/>}
          {vw==="dept"&&<Depts areas={areas} deptos={deptos} pedidos={peds} users={users} onSel={(p:any)=>sSl(p)}/>}
          {vw==="profs"&&isAd&&<Profs users={users} deptos={deptos} areas={areas} onDel={(id:string)=>sUs(p=>p.filter(u=>u.id!==id))}/>}
          {vw==="new"&&<NP user={user} users={users} deptos={deptos} areas={areas} onSub={(p:any)=>{sPd(ps=>[p,...ps]);sVw(isPersonal?"my":"dash");sAA(null);sAD(null);}} onX={()=>sVw(isPersonal?"my":"dash")}/>}
          {vw==="proy"&&<Proyecto hitos={hitos} setHitos={sHi} isAd={isAd}/>}
          {vw==="dash"&&!isPersonal&&!aA&&!aD&&<><h2 style={{margin:"0 0 4px",fontSize:19,color:T.nv,fontWeight:800}}>Dashboard</h2><p style={{color:T.g4,fontSize:12,margin:"0 0 16px"}}>KPIs institucionales · Manual Operativo 2035</p><KPIs peds={peds}/><Circles areas={areas} deptos={deptos} pedidos={peds} onAC={hAC}/></>}
          {vw==="dash"&&!isPersonal&&(aA||aD)&&<div><Btn v="g" s="s" onClick={()=>{if(aD)sAD(null);else sAA(null);}} style={{marginBottom:12}}>← {aD?"Volver al área":"Dashboard"}</Btn><TList title={vT} icon={vI} color={vC} peds={vP} users={users} onSel={(p:any)=>sSl(p)} search={search}/></div>}
        </div>
      </div>
      {sel&&<Det p={peds.find(x=>x.id===sel.id)||sel} user={user} users={users} onX={()=>sSl(null)}
        onTk={(id:number)=>{sPd(p=>p.map(x=>x.id===id?{...x,asTo:user.id,st:ST.C}:x));addLog(id,user.id,fn(user),"Tomó la tarea","sys");}}
        onAs={(id:number,uid:string)=>{const ag=users.find(u=>u.id===uid);sPd(p=>p.map(x=>x.id===id?{...x,asTo:uid,st:x.st===ST.P?ST.C:x.st}:x));addLog(id,user.id,fn(user),"Asignó a "+(ag?fn(ag):""),"sys");}}
        onRe={(id:number,r:string)=>sPd(p=>p.map(x=>x.id===id?{...x,resp:r}:x))}
        onSE={(id:number)=>{sPd(p=>p.map(x=>x.id===id?{...x,st:ST.E}:x));addLog(id,user.id,fn(user),"Envió a Compras","sys");sSl(null);}}
        onEO={(id:number,ok:boolean)=>{sPd(p=>p.map(x=>x.id===id?{...x,st:ST.C,eOk:ok}:x));addLog(id,user.id,fn(user),ok?"Compras aprobó":"Compras rechazó","sys");sSl(null);}}
        onFi={(id:number)=>{sPd(p=>p.map(x=>x.id===id?{...x,st:ST.V}:x));addLog(id,user.id,fn(user),"Envió a validación","sys");sSl(null);}}
        onVa={(id:number,ok:boolean)=>{sPd(p=>p.map(x=>x.id===id?{...x,st:ok?ST.OK:ST.C}:x));addLog(id,user.id,fn(user),ok?"Validó OK ✅":"Rechazó","sys");sSl(null);}}
        onMsg={(id:number,txt:string)=>addLog(id,user.id,fn(user),txt,"msg")}
        onMonto={(id:number,m:number)=>sPd(p=>p.map(x=>x.id===id?{...x,monto:m}:x))}
      />}
    </div>
  );
}