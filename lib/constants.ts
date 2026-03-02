export const T={nv:"#0A1628",rd:"#C8102E",g1:"#F7F8FA",g2:"#E8ECF1",g3:"#CBD2DC",g4:"#8B95A5",g5:"#5A6577",gn:"#10B981",yl:"#F59E0B",bl:"#3B82F6",pr:"#8B5CF6"};

export const TD={nv:"#E2E8F0",rd:"#F87171",g1:"#0F172A",g2:"#1E293B",g3:"#334155",g4:"#94A3B8",g5:"#CBD5E1",gn:"#34D399",yl:"#FBBF24",bl:"#60A5FA",pr:"#A78BFA"};

export const AREAS=[{id:100,name:"Comisión Directiva",color:"#1E293B",icon:"🏛️"},{id:101,name:"Secretaría Ejecutiva",color:"#991B1B",icon:"⚡"},{id:1,name:"Gobernanza",color:T.bl,icon:"🛡️"},{id:2,name:"Deportiva",color:T.rd,icon:"🏉"},{id:3,name:"Social",color:T.gn,icon:"🤝"},{id:4,name:"Infraestructura",color:T.yl,icon:"🔧"}];

export const DEPTOS=[
  {id:50,name:"Presidente",aId:100},{id:51,name:"Vicepresidente",aId:100},{id:52,name:"Secretario",aId:100},{id:53,name:"Tesorero",aId:100},{id:54,name:"1er Vocal Titular",aId:100},{id:80,name:"2do Vocal Titular",aId:100},{id:81,name:"1er Vocal Suplente",aId:100},{id:82,name:"2do Vocal Suplente",aId:100},
  {id:55,name:"Presidencia SE",aId:101},{id:56,name:"Coordinación General SE",aId:101},
  {id:1,name:"Coordinación General",aId:1},{id:2,name:"Eventos",aId:1,pId:1},{id:3,name:"Comunicación",aId:1,pId:1},{id:4,name:"Sponsoreo",aId:1},{id:5,name:"Gastronomía y Recepción",aId:1,pId:2},{id:6,name:"Administración",aId:1,pId:1},
  {id:8,name:"Intendencia",aId:1,pId:1},{id:9,name:"Sistemas",aId:1,pId:1},{id:40,name:"Atención al Socio",aId:1,pId:1},{id:41,name:"Estandarización de Procesos",aId:1,pId:1},
  {id:43,name:"Diseño",aId:1,pId:3},{id:42,name:"Tordos TV",aId:1,pId:3},{id:44,name:"Redes",aId:1,pId:3},{id:45,name:"Fotografía",aId:1,pId:3},{id:46,name:"Filmación",aId:1,pId:3},{id:47,name:"Edición",aId:1,pId:3},{id:48,name:"Prensa",aId:1,pId:3},{id:49,name:"Creatividad",aId:1,pId:3},{id:60,name:"Asesoría Comunicación",aId:1,pId:3},
  {id:61,name:"Tesorería",aId:1},{id:7,name:"Compras",aId:1,pId:61},{id:62,name:"Financiación",aId:1,pId:61},{id:63,name:"Financiamiento",aId:1,pId:61},{id:65,name:"Tordos Shop",aId:1,pId:2},
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
export const DEP_ROLES: Record<string,{l:string;i:string;lv:number}>={dd:{l:"Director Deportivo",i:"🎯",lv:5},dr:{l:"Director de Rugby",i:"🏉",lv:4},manager:{l:"Manager",i:"📊",lv:3},coord_pf:{l:"Coordinador PF",i:"💪",lv:3},entrenador:{l:"Entrenador",i:"📋",lv:2},pf:{l:"Preparador Físico",i:"🏋️",lv:2},kinesiologo:{l:"Kinesiólogo",i:"🩺",lv:2},medico:{l:"Médico",i:"⚕️",lv:2}};
export const DEP_POSITIONS=["Pilar Izq","Hooker","Pilar Der","2da Línea","Ala","8","Medio Scrum","Apertura","Centro Int","Centro Ext","Wing Izq","Wing Der","Fullback"];
export const DEP_INJ_TYPES=["Muscular","Articular","Ósea","Ligamentaria","Tendinosa","Contusión","Otra"];
export const DEP_INJ_ZONES=["Cabeza","Cuello","Hombro","Brazo","Codo","Muñeca","Mano","Espalda","Pecho","Abdomen","Cadera","Muslo","Rodilla","Pierna","Tobillo","Pie"];
export const DEP_INJ_SEV: Record<string,{l:string;c:string;bg:string}>={leve:{l:"Leve",c:"#10B981",bg:"#D1FAE5"},moderada:{l:"Moderada",c:"#F59E0B",bg:"#FEF3C7"},grave:{l:"Grave",c:"#C8102E",bg:"#FEE2E2"}};
export const DEP_WK={sleep:{l:"Sueño",i:"😴",labels:["Muy malo","Malo","Regular","Bueno","Excelente"]},fatigue:{l:"Fatiga",i:"🔋",labels:["Exhausto","Cansado","Normal","Descansado","Muy descansado"]},stress:{l:"Estrés",i:"🧠",labels:["Muy alto","Alto","Normal","Bajo","Muy bajo"]},soreness:{l:"Dolor muscular",i:"💢",labels:["Muy alto","Alto","Normal","Bajo","Ninguno"]},mood:{l:"Ánimo",i:"😊",labels:["Muy malo","Malo","Normal","Bueno","Muy bueno"]}};
export const DEP_SEM={red:{max:2.5,l:"Alerta",c:"#C8102E",bg:"#FEE2E2"},yellow:{max:3.5,l:"Precaución",c:"#F59E0B",bg:"#FEF3C7"},green:{max:5,l:"Óptimo",c:"#10B981",bg:"#D1FAE5"}};
export const DEP_DIV=["M19"];
export const DEP_PHASE_TYPES:{[k:string]:{l:string;c:string;bg:string;i:string}}={pretemporada:{l:"Pretemporada",c:"#C8102E",bg:"#FEE2E2",i:"🏋️"},competencia:{l:"Competencia",c:"#3B82F6",bg:"#DBEAFE",i:"🏉"},transicion:{l:"Transición",c:"#6B7280",bg:"#F3F4F6",i:"🔄"}};
export const DEP_LINEUP_POS:{[k:string]:string}={"1":"Pilar Izq","2":"Hooker","3":"Pilar Der","4":"2da Línea","5":"2da Línea","6":"Ala","7":"Ala","8":"8","9":"Medio Scrum","10":"Apertura","11":"Wing Izq","12":"Centro Int","13":"Centro Ext","14":"Wing Der","15":"Fullback"};
export const DEP_TEST_CATS:{[k:string]:{l:string;i:string}}={resistencia:{l:"Resistencia",i:"❤️"},velocidad:{l:"Velocidad",i:"⚡"},fuerza:{l:"Fuerza",i:"💪"},potencia:{l:"Potencia",i:"🚀"},flexibilidad:{l:"Flexibilidad",i:"🧘"},antropometria:{l:"Antropometría",i:"📏"}};

export const DEP_CUERPO_TECNICO:{label:string;icon:string;color:string;members:string[]}[]=[
  {label:"Head Coach",icon:"🏉",color:"#C8102E",members:["Nicolás Ranieri"]},
  {label:"Coord. Forwards",icon:"💪",color:"#F97316",members:["Lucas de Rosas","Fernando Halpern","Francisco Puldain"]},
  {label:"Coord. Backs",icon:"⚡",color:"#3B82F6",members:["Patricio Bruno","Fernando Higgs","Martín Isola","Bautista Mora","Bruno Terrera","Ezequiel Viejobueno","Segundo Viejobueno"]},
  {label:"Preparador Físico",icon:"🏋️",color:"#10B981",members:["Luis Puebla"]},
];

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
  bueno:{l:"Bueno",c:"#10B981",bg:"#D1FAE5"},
  regular:{l:"Regular",c:"#F59E0B",bg:"#FEF3C7"},
  malo:{l:"Malo",c:"#DC2626",bg:"#FEE2E2"},
  reparar:{l:"A Reparar",c:"#DC2626",bg:"#FEE2E2"},
  baja:{l:"De Baja",c:"#6B7280",bg:"#F3F4F6"}
};
export const INV_TYPE:Record<string,{l:string;i:string;c:string}>={activo:{l:"Activo Fijo",i:"🏗️",c:"#F59E0B"},lote:{l:"Material Deportivo",i:"🏉",c:"#C8102E"}};
export const INV_MAINT_TYPE:Record<string,{l:string;i:string;c:string}>={service:{l:"Service",i:"🔧",c:"#3B82F6"},reparacion:{l:"Reparación",i:"🛠️",c:"#F59E0B"},inspeccion:{l:"Inspección",i:"🔍",c:"#10B981"}};
export const INV_MAINT_FREQ:Record<string,{l:string;days:number}>={mensual:{l:"Mensual",days:30},trimestral:{l:"Trimestral",days:90},semestral:{l:"Semestral",days:180},anual:{l:"Anual",days:365}};
export const INV_DIST_ST:Record<string,{l:string;c:string;bg:string}>={activa:{l:"Activa",c:"#3B82F6",bg:"#DBEAFE"},cerrada:{l:"Cerrada",c:"#6B7280",bg:"#F3F4F6"}};

// Reservas constants
export const BOOK_FAC:Record<string,{l:string;i:string;c:string}>={
  cancha1:{l:"Cancha 1 Rugby",i:"🏈",c:"#10B981"},
  cancha2:{l:"Cancha 2 Rugby",i:"🏈",c:"#3B82F6"},
  cancha3:{l:"Cancha 3 Rugby",i:"🏈",c:"#F59E0B"},
  cancha4:{l:"Cancha 4 Rugby",i:"🏈",c:"#8B5CF6"},
  cancha5:{l:"Cancha 5 Rugby",i:"🏈",c:"#0EA5E9"},
  cancha6:{l:"Cancha 6 Rugby",i:"🏈",c:"#EC4899"},
  hockey1:{l:"Hockey 1",i:"🏑",c:"#6B7280"},
  hockey2:{l:"Hockey 2",i:"🏑",c:"#9CA3AF"},
  pileta:{l:"Pileta",i:"🏊",c:"#0EA5E9"},
  gimnasio:{l:"Gimnasio",i:"🏋️",c:"#DC2626"},
  salon:{l:"Salon Blanco",i:"🏠",c:"#6B7280"},
  cantina:{l:"Cantina",i:"🍽️",c:"#C8102E"},
  pajarera1:{l:"Pajarera 1",i:"🏡",c:"#059669"},
  pajarera2:{l:"Pajarera 2",i:"🏡",c:"#047857"},
  pergola:{l:"Pérgola",i:"⛱️",c:"#7C3AED"}
};
export const RENTABLE_FAC = ["salon", "pergola", "pajarera1", "pajarera2"] as const;

export const RENTAL_ST: Record<string,{l:string;c:string;bg:string;i:string}>={
  solicitado:       {l:"Solicitado",      c:T.yl, bg:"#FEF3C7", i:"📩"},
  disponible:       {l:"Disponible",      c:"#3B82F6", bg:"#DBEAFE", i:"👍"},
  no_disponible:    {l:"No disponible",   c:T.rd, bg:"#FEE2E2", i:"❌"},
  pendiente_pago:   {l:"Pendiente Pago",  c:"#8B5CF6", bg:"#EDE9FE", i:"💰"},
  pago_recibido:    {l:"Pago Recibido",   c:"#F59E0B", bg:"#FEF3C7", i:"🧾"},
  aprobado:         {l:"Aprobado",        c:T.gn, bg:"#D1FAE5", i:"✅"},
  rechazado:        {l:"Rechazado",       c:T.rd, bg:"#FEE2E2", i:"❌"},
  condicion_ok:     {l:"Condición OK",    c:T.gn, bg:"#D1FAE5", i:"👌"},
  condicion_problema:{l:"Problema",       c:T.rd, bg:"#FEE2E2", i:"⚠️"},
};

export const RENTAL_APPROVERS = {
  friSat: { first_name: "Victoria", last_name: "Brandi" },
  other:  { first_name: "Lucía", last_name: "Gil" },
  final:  { first_name: "Bautista", last_name: "Pontis" },
};

export const RENTAL_PAYMENT = { alias: "LTRC.SUPER", phone: "2613028410" };

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
  active:{l:"Activo",c:"#10B981",bg:"#D1FAE5"},
  negotiating:{l:"Negociando",c:"#F59E0B",bg:"#FEF3C7"},
  inactive:{l:"Inactivo",c:"#6B7280",bg:"#F3F4F6"},
  expired:{l:"Vencido",c:"#DC2626",bg:"#FEE2E2"}
};
export const SPON_PAY_TYPES=["pago mensual","pago trimestral","pago anual","canje","cheques","transferencia","efectivo","otro"];
export const DOLAR_REF=1250;

/* ── Viajes ── */
export const VIAJE_ST={BORR:"borrador",PEND:"pendiente",APR:"aprobado",CANC:"cancelado"} as const;
export const VIAJE_SC:Record<string,{l:string;c:string;bg:string;i:string}>={
  [VIAJE_ST.BORR]:{l:"Borrador",c:T.g5,bg:"#F3F4F6",i:"📝"},
  [VIAJE_ST.PEND]:{l:"Pendiente",c:T.yl,bg:"#FEF3C7",i:"🟡"},
  [VIAJE_ST.APR]:{l:"Aprobado",c:T.gn,bg:"#D1FAE5",i:"✅"},
  [VIAJE_ST.CANC]:{l:"Cancelado",c:T.rd,bg:"#FEE2E2",i:"❌"},
};
export const VIAJE_MOTIVOS=[
  {k:"torneo",l:"Torneo",i:"🏆"},
  {k:"amistoso",l:"Amistoso",i:"🤝"},
  {k:"gira",l:"Gira",i:"🌍"},
] as const;

