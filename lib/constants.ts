export const T={nv:"#0A1628",rd:"#C8102E",g1:"#F7F8FA",g2:"#E8ECF1",g3:"#CBD2DC",g4:"#8B95A5",g5:"#5A6577",gn:"#10B981",yl:"#F59E0B",bl:"#3B82F6",pr:"#8B5CF6"};

export const TD={nv:"#E2E8F0",rd:"#F87171",g1:"#0F172A",g2:"#1E293B",g3:"#334155",g4:"#94A3B8",g5:"#CBD5E1",gn:"#34D399",yl:"#FBBF24",bl:"#60A5FA",pr:"#A78BFA"};

export const AREAS=[{id:100,name:"Comisión Directiva",color:"#1E293B",icon:"🏛️"},{id:101,name:"Secretaría Ejecutiva",color:"#991B1B",icon:"⚡"},{id:1,name:"Gobernanza",color:T.bl,icon:"🛡️"},{id:2,name:"Deportiva",color:T.rd,icon:"🏉"},{id:3,name:"Social",color:T.gn,icon:"🤝"},{id:4,name:"Infraestructura",color:T.yl,icon:"🔧"}];

export const DEPTOS=[
  {id:50,name:"Presidente",aId:100},{id:51,name:"Vicepresidente",aId:100},{id:52,name:"Secretario",aId:100},{id:53,name:"Tesorero",aId:100},{id:54,name:"1er Vocal Titular",aId:100},{id:80,name:"2do Vocal Titular",aId:100},{id:81,name:"1er Vocal Suplente",aId:100},{id:82,name:"2do Vocal Suplente",aId:100},
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

export const PST={SOL:"solicitado",REC:"recibido",APR:"aprobado",RECH:"rechazado"};
export const PSC:Record<string,{l:string;c:string;bg:string;i:string}>={
  [PST.SOL]:{l:"Solicitado",c:T.yl,bg:"#FEF3C7",i:"📤"},
  [PST.REC]:{l:"Recibido",c:T.bl,bg:"#DBEAFE",i:"📥"},
  [PST.APR]:{l:"Aprobado",c:T.gn,bg:"#D1FAE5",i:"✅"},
  [PST.RECH]:{l:"Rechazado",c:T.rd,bg:"#FEE2E2",i:"❌"},
};
export const MONEDAS=["ARS","USD"];
export const RUBROS=["Materiales","Servicios","Equipamiento","Indumentaria","Construcción","Catering","Transporte","Otro"];

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
  area:{title:"Área / Departamento",icon:"📂",color:T.bl,per:"Quincenal",dur:"1 hora",secs:[
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

// Deportivo module constants
export const DEP_ROLES: Record<string,{l:string;i:string;lv:number}>={dd:{l:"Director Deportivo",i:"🎯",lv:5},dr:{l:"Director de Rugby",i:"🏉",lv:4},coord_pf:{l:"Coordinador PF",i:"💪",lv:3},entrenador:{l:"Entrenador",i:"📋",lv:2},pf:{l:"Preparador Físico",i:"🏋️",lv:2},kinesiologo:{l:"Kinesiólogo",i:"🩺",lv:2},medico:{l:"Médico",i:"⚕️",lv:2}};
export const DEP_POSITIONS=["Pilar Izq","Hooker","Pilar Der","2da Línea","Ala","8","Medio Scrum","Apertura","Centro Int","Centro Ext","Wing Izq","Wing Der","Fullback"];
export const DEP_INJ_TYPES=["Muscular","Articular","Ósea","Ligamentaria","Tendinosa","Contusión","Otra"];
export const DEP_INJ_ZONES=["Cabeza","Cuello","Hombro","Brazo","Codo","Muñeca","Mano","Espalda","Pecho","Abdomen","Cadera","Muslo","Rodilla","Pierna","Tobillo","Pie"];
export const DEP_INJ_SEV: Record<string,{l:string;c:string;bg:string}>={leve:{l:"Leve",c:"#10B981",bg:"#D1FAE5"},moderada:{l:"Moderada",c:"#F59E0B",bg:"#FEF3C7"},grave:{l:"Grave",c:"#C8102E",bg:"#FEE2E2"}};
export const DEP_WK={sleep:{l:"Sueño",i:"😴",labels:["Muy malo","Malo","Regular","Bueno","Excelente"]},fatigue:{l:"Fatiga",i:"🔋",labels:["Exhausto","Cansado","Normal","Descansado","Muy descansado"]},stress:{l:"Estrés",i:"🧠",labels:["Muy alto","Alto","Normal","Bajo","Muy bajo"]},soreness:{l:"Dolor muscular",i:"💢",labels:["Muy alto","Alto","Normal","Bajo","Ninguno"]},mood:{l:"Ánimo",i:"😊",labels:["Muy malo","Malo","Normal","Bueno","Muy bueno"]}};
export const DEP_SEM={red:{max:2.5,l:"Alerta",c:"#C8102E",bg:"#FEE2E2"},yellow:{max:3.5,l:"Precaución",c:"#F59E0B",bg:"#FEF3C7"},green:{max:5,l:"Óptimo",c:"#10B981",bg:"#D1FAE5"}};
export const DEP_DIV=["Plantel Superior","M19","M17"];

// Tareas Recurrentes constants
export const FREQ: Record<string,{l:string;i:string;days:number}>={
  semanal:{l:"Semanal",i:"📅",days:7},
  quincenal:{l:"Quincenal",i:"📆",days:14},
  mensual:{l:"Mensual",i:"🗓️",days:30},
  trimestral:{l:"Trimestral",i:"📊",days:90}
};
export const FREQ_DAYS:Record<string,string[]>={
  lunes:"Lunes",martes:"Martes",miercoles:"Miércoles",jueves:"Jueves",viernes:"Viernes"
} as any;

// Proyectos module constants
export const PJ_ST: Record<string,{l:string;c:string;bg:string;i:string}>={
  backlog:{l:"Backlog",c:"#6B7280",bg:"#F3F4F6",i:"📋"},
  todo:{l:"To Do",c:"#3B82F6",bg:"#DBEAFE",i:"📌"},
  inprogress:{l:"In Progress",c:"#F59E0B",bg:"#FEF3C7",i:"🔄"},
  review:{l:"Review",c:"#8B5CF6",bg:"#EDE9FE",i:"🔍"},
  done:{l:"Done",c:"#10B981",bg:"#D1FAE5",i:"✅"}
};
export const PJ_PR: Record<string,{l:string;c:string;i:string}>={
  low:{l:"Low",c:"#6B7280",i:"⬇️"},
  medium:{l:"Medium",c:"#3B82F6",i:"➡️"},
  high:{l:"High",c:"#F59E0B",i:"⬆️"},
  critical:{l:"Critical",c:"#DC2626",i:"🔥"}
};

// Inventario constants
export const INV_CAT:Record<string,{l:string;i:string;c:string}>={
  deportivo:{l:"Deportivo",i:"🏉",c:"#C8102E"},
  indumentaria:{l:"Indumentaria",i:"👕",c:"#3B82F6"},
  infraestructura:{l:"Infraestructura",i:"🔧",c:"#F59E0B"},
  tecnologia:{l:"Tecnología",i:"💻",c:"#8B5CF6"},
  mobiliario:{l:"Mobiliario",i:"🪑",c:"#6B7280"},
  otro:{l:"Otro",i:"📦",c:"#10B981"}
};
export const INV_COND:Record<string,{l:string;c:string;bg:string}>={
  nuevo:{l:"Nuevo",c:"#10B981",bg:"#D1FAE5"},
  bueno:{l:"Bueno",c:"#3B82F6",bg:"#DBEAFE"},
  regular:{l:"Regular",c:"#F59E0B",bg:"#FEF3C7"},
  reparar:{l:"A Reparar",c:"#DC2626",bg:"#FEE2E2"},
  baja:{l:"De Baja",c:"#6B7280",bg:"#F3F4F6"}
};

// Reservas constants
export const BOOK_FAC:Record<string,{l:string;i:string;c:string}>={
  cancha1:{l:"Cancha 1",i:"🏟️",c:"#10B981"},
  cancha2:{l:"Cancha 2",i:"🏟️",c:"#3B82F6"},
  cancha3:{l:"Cancha 3",i:"🏟️",c:"#F59E0B"},
  cancha4:{l:"Cancha 4",i:"🏟️",c:"#8B5CF6"},
  cancha5:{l:"Cancha 5",i:"🏟️",c:"#0EA5E9"},
  gimnasio:{l:"Gimnasio",i:"🏋️",c:"#DC2626"},
  salon:{l:"Salón",i:"🏠",c:"#6B7280"},
  cantina:{l:"Cantina",i:"🍽️",c:"#C8102E"},
  pajarera:{l:"Pajarera",i:"🏡",c:"#059669"},
  pergola:{l:"Pérgola",i:"⛱️",c:"#7C3AED"}
};
export const BOOK_ST:Record<string,{l:string;c:string;bg:string;i:string}>={
  pendiente:{l:"Pendiente",c:"#F59E0B",bg:"#FEF3C7",i:"⏳"},
  confirmada:{l:"Confirmada",c:"#10B981",bg:"#D1FAE5",i:"✅"},
  cancelada:{l:"Cancelada",c:"#DC2626",bg:"#FEE2E2",i:"❌"}
};

// Sponsors CRM constants
export const SPON_TIER:Record<string,{l:string;c:string;bg:string;i:string}>={
  oro:{l:"Oro",c:"#D97706",bg:"#FEF3C7",i:"🥇"},
  plata:{l:"Plata",c:"#6B7280",bg:"#F3F4F6",i:"🥈"},
  bronce:{l:"Bronce",c:"#92400E",bg:"#FDE68A",i:"🥉"},
  colaborador:{l:"Colaborador",c:"#3B82F6",bg:"#DBEAFE",i:"🤝"}
};
export const SPON_ST:Record<string,{l:string;c:string;bg:string}>={
  activo:{l:"Activo",c:"#10B981",bg:"#D1FAE5"},
  negociando:{l:"Negociando",c:"#F59E0B",bg:"#FEF3C7"},
  inactivo:{l:"Inactivo",c:"#6B7280",bg:"#F3F4F6"},
  vencido:{l:"Vencido",c:"#DC2626",bg:"#FEE2E2"}
};
