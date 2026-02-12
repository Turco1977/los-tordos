export const T={nv:"#0A1628",rd:"#C8102E",g1:"#F7F8FA",g2:"#E8ECF1",g3:"#CBD2DC",g4:"#8B95A5",g5:"#5A6577",gn:"#10B981",yl:"#F59E0B",bl:"#3B82F6",pr:"#8B5CF6"};

export const AREAS=[{id:100,name:"Comisión Directiva",color:"#1E293B",icon:"🏛️"},{id:101,name:"Secretaría Ejecutiva",color:"#991B1B",icon:"⚡"},{id:1,name:"Gobernanza",color:T.bl,icon:"🛡️"},{id:2,name:"Deportiva",color:T.rd,icon:"🏉"},{id:3,name:"Social",color:T.gn,icon:"🤝"},{id:4,name:"Infraestructura",color:T.yl,icon:"🔧"}];

export const DEPTOS=[
  {id:50,name:"Mesa Directiva",aId:100},{id:51,name:"Consejo Consultivo",aId:100},
  {id:55,name:"Presidencia SE",aId:101},{id:56,name:"Coordinación General SE",aId:101},
  {id:1,name:"Coordinación General",aId:1},{id:2,name:"Eventos",aId:1},{id:3,name:"Comunicación",aId:1},{id:4,name:"Sponsoreo",aId:1},{id:5,name:"Gastronomía y Recepción",aId:1},{id:6,name:"Administración",aId:1},{id:7,name:"Compras",aId:1},
  {id:8,name:"Intendencia",aId:1},{id:9,name:"Sistemas",aId:1},{id:40,name:"Atención al Socio",aId:1},{id:41,name:"Estandarización de Procesos",aId:1},
  {id:42,name:"Tordos TV",aId:1},{id:43,name:"Diseño",aId:1},{id:44,name:"Redes",aId:1},{id:45,name:"Fotografía",aId:1},{id:46,name:"Filmación",aId:1},{id:47,name:"Edición",aId:1},{id:48,name:"Prensa",aId:1},{id:49,name:"Creatividad",aId:1},{id:60,name:"Asesoría Comunicación",aId:1},
  {id:61,name:"Tesorería",aId:1},{id:62,name:"Finanzas",aId:1},{id:63,name:"Financiamiento",aId:1},{id:65,name:"Tordos Shop",aId:1},
  {id:10,name:"Academia Tordos",aId:2},{id:11,name:"Soporte Adm. del Deporte",aId:2},{id:12,name:"Mejora Continua",aId:2},
  {id:20,name:"Solidario",aId:3},{id:21,name:"Conecta",aId:3},{id:22,name:"Captación",aId:3},{id:23,name:"Club del Ex",aId:3},
  {id:30,name:"Anexo",aId:4},{id:31,name:"Estacionamiento Cancha 2",aId:4},{id:32,name:"Plan Estratégico",aId:4},{id:33,name:"Luces Cancha 2, 3 y 4",aId:4},{id:34,name:"Cantina: Ampliación y Tribunas",aId:4},{id:35,name:"Vestuarios y Depósito",aId:4},
  {id:70,name:"Dormy's",aId:4},{id:71,name:"Espacio Madre Selva",aId:4},{id:72,name:"Ingreso Urquiza",aId:4},{id:73,name:"Luces Anexo",aId:4},{id:74,name:"Molinetes",aId:4},{id:75,name:"Club del Ex (Infra)",aId:4},
];

export const ROLES: Record<string,{l:string;i:string;lv:number}>={superadmin:{l:"Super Admin",i:"👑",lv:5},admin:{l:"Administrador",i:"🛡️",lv:4},coordinador:{l:"Coordinador",i:"⚙️",lv:3},embudo:{l:"Compras/Tesorería",i:"💰",lv:3},usuario:{l:"Usuario",i:"👤",lv:2},enlace:{l:"Enlace",i:"🔗",lv:1},manager:{l:"Manager",i:"📋",lv:1}};
export const RK=Object.keys(ROLES);
export const DIV=["Plantel Superior","M19","M17","M16","M15","M14","M13","M12","M11","M10","M9","M8","Escuelita"];
export const TIPOS=["Logística","Administrativo","Infraestructura","Material deportivo","Comunicación","Otro"];
export const ST={P:"pend",C:"curso",E:"emb",V:"valid",OK:"ok"};
export const SC: Record<string,{l:string;c:string;bg:string;i:string}>={[ST.P]:{l:"Pendiente",c:T.rd,bg:"#FEE2E2",i:"🔴"},[ST.C]:{l:"En Curso",c:T.yl,bg:"#FEF3C7",i:"🟡"},[ST.E]:{l:"Compras",c:T.pr,bg:"#EDE9FE",i:"💰"},[ST.V]:{l:"Validación",c:T.bl,bg:"#DBEAFE",i:"🔵"},[ST.OK]:{l:"Completada",c:T.gn,bg:"#D1FAE5",i:"🟢"}};

export const fn=(u:any)=>(u.first_name||u.n||"")+" "+(u.last_name||u.a||"");
export const isOD=(d:string)=>{const today=new Date().toISOString().slice(0,10);return d<today&&d!=="";};
export const daysDiff=(a:string,b:string)=>Math.round((new Date(b).getTime()-new Date(a).getTime())/864e5);

export const AGT:Record<string,{title:string;icon:string;color:string;per:string;dur:string;secs:{t:string;sub:string[]}[]}> = {
  cd:{title:"Comisión Directiva",icon:"🏛️",color:"#1E293B",per:"Mensual",dur:"2 horas",secs:[
    {t:"Apertura",sub:["Verificación de quórum","Aprobación del orden del día"]},
    {t:"Informe de Secretaría Ejecutiva",sub:["Avances generales","Resoluciones tomadas"]},
    {t:"Informe de Tesorería",sub:["Estado financiero","Presupuesto vs ejecución"]},
    {t:"Informe de Áreas Estratégicas",sub:["Institucional","Deportivo","Social","Infraestructura"]},
    {t:"Proyectos Especiales",sub:["Estado, hitos y decisiones requeridas"]},
    {t:"Mociones y temas a resolver",sub:["Votaciones si corresponde"]},
    {t:"Cierre",sub:["Síntesis de resoluciones","Próxima fecha"]}]},
  se:{title:"Secretaría Ejecutiva",icon:"⚡",color:"#991B1B",per:"Quincenal",dur:"1h30",secs:[
    {t:"Repaso breve de pendientes",sub:[]},
    {t:"Informe de Áreas",sub:[]},
    {t:"Resoluciones rápidas operativas",sub:[]},
    {t:"Agenda próxima quincena",sub:[]},
    {t:"Definición de temas a elevar a CD",sub:[]}]},
  area:{title:"Subcomisiones / Áreas",icon:"📂",color:T.bl,per:"Quincenal",dur:"1 hora",secs:[
    {t:"Qué hicimos",sub:[]},
    {t:"Qué estamos haciendo",sub:[]},
    {t:"Stoppers",sub:[]},
    {t:"Próximos hitos",sub:[]},
    {t:"Necesidades a elevar a SE",sub:[]}]}
};

export const MINSECS:Record<string,string[]>={
  cd:["Temas tratados","Resoluciones tomadas","Temas pendientes próxima reunión"],
  se:["Avances","Decisiones operativas","Escalamientos a CD","Próximos pasos"],
  area:["Qué hice","Qué hago","Stoppers","Necesita aprobación de SE/CD"]
};
