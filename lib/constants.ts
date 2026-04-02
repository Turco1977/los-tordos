export const T={nv:"#0A1628",rd:"#C8102E",g1:"#F7F8FA",g2:"#E8ECF1",g3:"#CBD2DC",g4:"#8B95A5",g5:"#5A6577",gn:"#10B981",yl:"#F59E0B",bl:"#3B82F6",pr:"#8B5CF6"};

export const TD={nv:"#E2E8F0",rd:"#F87171",g1:"#0F172A",g2:"#1E293B",g3:"#334155",g4:"#94A3B8",g5:"#CBD5E1",gn:"#34D399",yl:"#FBBF24",bl:"#60A5FA",pr:"#A78BFA"};

export const AREAS=[{id:100,name:"Comisión Directiva",color:"#1E293B",icon:"🏛️"},{id:101,name:"Secretaría Ejecutiva",color:"#991B1B",icon:"⚡"},{id:1,name:"Gobernanza",color:T.bl,icon:"🛡️"},{id:2,name:"Deportiva",color:T.rd,icon:"🏉"},{id:3,name:"Social",color:T.gn,icon:"🤝"},{id:4,name:"Infraestructura",color:T.yl,icon:"🔧"}];

export const DEPTOS=[
  {id:50,name:"Presidente",aId:100},{id:51,name:"Vicepresidente",aId:100},{id:52,name:"Secretario",aId:100},{id:53,name:"Tesorero",aId:100},{id:54,name:"1er Vocal Titular",aId:100},{id:80,name:"2do Vocal Titular",aId:100},{id:81,name:"1er Vocal Suplente",aId:100},{id:82,name:"2do Vocal Suplente",aId:100},
  {id:55,name:"Presidente",aId:101},{id:56,name:"Vicepresidente",aId:101},{id:83,name:"Secretario",aId:101},{id:84,name:"Tesorero",aId:101},{id:85,name:"2do Vocal Titular",aId:101},
  {id:1,name:"Coordinación General",aId:1},{id:2,name:"Eventos",aId:1,pId:1},{id:3,name:"Comunicación",aId:1},{id:4,name:"Sponsoreo",aId:1},{id:66,name:"Comercial",aId:1,pId:4},{id:67,name:"Relacionamiento con Sponsors",aId:1,pId:4},{id:5,name:"Gastronomía y Recepción",aId:1,pId:2},{id:6,name:"Administración",aId:1,pId:1},
  {id:8,name:"Intendencia",aId:1,pId:1},{id:9,name:"Sistemas",aId:1,pId:1},{id:40,name:"Atención al Socio",aId:1,pId:1},{id:41,name:"Estandarización de Procesos",aId:1,pId:1},
  {id:43,name:"Diseño",aId:1,pId:3},{id:42,name:"Tordos TV",aId:1,pId:3},{id:44,name:"Redes",aId:1,pId:3},{id:45,name:"Fotografía",aId:1,pId:3},{id:46,name:"Filmación",aId:1,pId:3},{id:47,name:"Edición",aId:1,pId:3},{id:48,name:"Prensa",aId:1,pId:3},{id:49,name:"Creatividad",aId:1,pId:3},{id:60,name:"Asesoría Comunicación",aId:1,pId:3},
  {id:61,name:"Tesorería",aId:1},{id:7,name:"Compras",aId:1,pId:61},{id:62,name:"Financiación",aId:1,pId:61},{id:63,name:"Financiamiento",aId:1,pId:61},{id:65,name:"Tordos Shop",aId:1,pId:2},{id:76,name:"Becas",aId:1},
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

export const PST={SOL:"solicitado",REC:"recibido",APR:"aprobado",RECH:"rechazado",PEN_SE:"pendiente_se"};
export const PSC:Record<string,{l:string;c:string;bg:string;i:string}>={
  [PST.SOL]:{l:"Solicitado",c:T.yl,bg:"#FEF3C7",i:"📤"},
  [PST.REC]:{l:"Recibido",c:T.bl,bg:"#DBEAFE",i:"📥"},
  [PST.APR]:{l:"Aprobado",c:T.gn,bg:"#D1FAE5",i:"✅"},
  [PST.RECH]:{l:"Rechazado",c:T.rd,bg:"#FEE2E2",i:"❌"},
  [PST.PEN_SE]:{l:"Pendiente SE",c:"#EA580C",bg:"#FFF7ED",i:"⏳"},
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

export const TESORERO = { first_name: "Gustavo", last_name: "Cialone" };

/* ── Becas ── */
export const BST={NUE:"nueva",EVA:"evaluando",PROP:"propuesta",DEL:"deliberacion",APR:"aprobada",RECH:"rechazada"};
export const BSC:Record<string,{l:string;c:string;bg:string;i:string}>={
  [BST.NUE]:{l:"Nueva Solicitud",c:"#8B5CF6",bg:"#EDE9FE",i:"🟣"},
  [BST.EVA]:{l:"En Evaluación",c:T.yl,bg:"#FEF3C7",i:"🟡"},
  [BST.PROP]:{l:"Propuesta a CD",c:T.bl,bg:"#DBEAFE",i:"🔵"},
  [BST.DEL]:{l:"En Deliberación",c:"#F97316",bg:"#FFF7ED",i:"🟠"},
  [BST.APR]:{l:"Aprobada",c:T.gn,bg:"#D1FAE5",i:"🟢"},
  [BST.RECH]:{l:"Rechazada",c:T.rd,bg:"#FEE2E2",i:"🔴"},
};

/* ── Atención al Socio ── */
export const AST={NUE:"nuevo",ANA:"analisis",PROP:"propuesta_se",DEL:"deliberacion_se",APR:"aprobada_se",RECH:"rechazada_se",EJE:"ejecutada"};
export const ASC:Record<string,{l:string;c:string;bg:string;i:string}>={
  [AST.NUE]:{l:"Caso Nuevo",c:"#8B5CF6",bg:"#EDE9FE",i:"🟣"},
  [AST.ANA]:{l:"En Análisis",c:T.yl,bg:"#FEF3C7",i:"🟡"},
  [AST.PROP]:{l:"Propuesta a SE",c:T.bl,bg:"#DBEAFE",i:"🔵"},
  [AST.DEL]:{l:"En Deliberación",c:"#F97316",bg:"#FFF7ED",i:"🟠"},
  [AST.APR]:{l:"Aprobada",c:T.gn,bg:"#D1FAE5",i:"🟢"},
  [AST.RECH]:{l:"Rechazada",c:T.rd,bg:"#FEE2E2",i:"🔴"},
  [AST.EJE]:{l:"Ejecutada",c:"#047857",bg:"#D1FAE5",i:"✅"},
};

export const RENTAL_PAYMENT = { alias: "LTRC.SUPER", phone: "2613028410" };

export const BOOK_ST:Record<string,{l:string;c:string;bg:string;i:string}>={
  pendiente:{l:"Pendiente",c:"#F59E0B",bg:"#FEF3C7",i:"⏳"},
  confirmada:{l:"Confirmada",c:"#10B981",bg:"#D1FAE5",i:"✅"},
  cancelada:{l:"Cancelada",c:"#DC2626",bg:"#FEE2E2",i:"❌"}
};

// Sponsors CRM constants
export const SPON_TIER:Record<string,{l:string;c:string;bg:string;i:string}>={
  black:{l:"Black",c:"#0A1628",bg:"#E2E8F0",i:"⬛"},
  blue:{l:"Blue",c:"#3B82F6",bg:"#DBEAFE",i:"🔵"},
  red:{l:"Red",c:"#C8102E",bg:"#FEE2E2",i:"🔴"},
  white:{l:"White",c:"#6B7280",bg:"#F3F4F6",i:"⚪"},
};
export const SPON_ST:Record<string,{l:string;c:string;bg:string}>={
  active:{l:"Activo",c:"#10B981",bg:"#D1FAE5"},
  negotiating:{l:"Negociando",c:"#F59E0B",bg:"#FEF3C7"},
  inactive:{l:"Inactivo",c:"#6B7280",bg:"#F3F4F6"},
  expired:{l:"Vencido",c:"#DC2626",bg:"#FEE2E2"}
};
export const SPON_PAY_TYPES=["pago mensual","pago trimestral","pago anual","canje","cheques","transferencia","efectivo","otro"];
export const DOLAR_REF=1250;

/* ── Tarifario ── */
export const TAR_CATS:Record<string,{l:string;i:string;c:string}>={
  indumentaria_rugby:{l:"Indumentaria Rugby",i:"🏉",c:"#C8102E"},
  hockey:{l:"Hockey",i:"🏑",c:"#EC4899"},
  espacio:{l:"Espacio Físico",i:"📍",c:"#F59E0B"},
  digital:{l:"Digital",i:"💻",c:"#3B82F6"},
};
export const TAR_VIS:Record<string,{l:string;c:string;bg:string}>={
  alta:{l:"Alta",c:"#10B981",bg:"#D1FAE5"},
  media:{l:"Media",c:"#F59E0B",bg:"#FEF3C7"},
  baja:{l:"Baja",c:"#6B7280",bg:"#F3F4F6"},
};
export const TAR_UBICACIONES:Record<string,string[]>={
  indumentaria_rugby:[
    "Camiseta titular - pecho","Camiseta titular - espalda",
    "Camiseta titular - manga izq","Camiseta titular - manga der",
    "Camiseta titular - hombro izq","Camiseta titular - hombro der",
    "Camiseta titular - cuello",
    "Camiseta suplente - pecho","Camiseta suplente - espalda",
    "Short - pierna izq","Short - pierna der",
    "Medias","Campera de concentracion",
    "Remera de entrenamiento","Pantalon de entrenamiento",
  ],
  hockey:[
    "Camiseta titular - pecho","Camiseta titular - espalda",
    "Camiseta titular - manga","Camiseta suplente - pecho",
    "Pollera","Medias",
  ],
  espacio:[
    "Cartel cancha 1 - lateral","Cartel cancha 1 - cabecera",
    "Cartel cancha 2","Banner cantina","Bandera ingreso",
    "Naming salon","Naming cancha","Cartel estacionamiento",
    "Stand dia de partido","Backing conferencia",
  ],
  digital:[
    "Redes sociales - post mensual","Streaming - logo en pantalla",
    "Web - banner principal","Newsletter - logo",
  ],
};

/* Pipeline stages */
export const PIPE_ST={PROSP:"prospecto",CONT:"contacto",PROP:"propuesta",NEG:"negociacion",CIERRE:"cierre",PERD:"perdido"};
export const PIPE_SC:Record<string,{l:string;c:string;bg:string;i:string}>={
  [PIPE_ST.PROSP]:{l:"Prospecto",c:"#6B7280",bg:"#F3F4F6",i:"🔍"},
  [PIPE_ST.CONT]:{l:"Contacto",c:"#3B82F6",bg:"#DBEAFE",i:"📞"},
  [PIPE_ST.PROP]:{l:"Propuesta",c:"#8B5CF6",bg:"#EDE9FE",i:"📄"},
  [PIPE_ST.NEG]:{l:"Negociación",c:"#F59E0B",bg:"#FEF3C7",i:"🤝"},
  [PIPE_ST.CIERRE]:{l:"Cierre",c:"#10B981",bg:"#D1FAE5",i:"✅"},
  [PIPE_ST.PERD]:{l:"Perdido",c:"#DC2626",bg:"#FEE2E2",i:"❌"},
};

/* Proposal states */
export const PROP_ST={BOR:"borrador",NEG:"negociando",PROP_SE:"propuesta_se",DEL:"deliberacion",APR:"aprobada",RECH:"rechazada",FORM:"formalizada"};
export const PROP_SC:Record<string,{l:string;c:string;bg:string;i:string}>={
  [PROP_ST.BOR]:{l:"Borrador",c:"#6B7280",bg:"#F3F4F6",i:"📝"},
  [PROP_ST.NEG]:{l:"En Negociación",c:"#F59E0B",bg:"#FEF3C7",i:"🤝"},
  [PROP_ST.PROP_SE]:{l:"Propuesta a SE",c:"#3B82F6",bg:"#DBEAFE",i:"📤"},
  [PROP_ST.DEL]:{l:"En Deliberación",c:"#F97316",bg:"#FFF7ED",i:"🟠"},
  [PROP_ST.APR]:{l:"Aprobada",c:"#10B981",bg:"#D1FAE5",i:"✅"},
  [PROP_ST.RECH]:{l:"Rechazada",c:"#DC2626",bg:"#FEE2E2",i:"❌"},
  [PROP_ST.FORM]:{l:"Formalizada",c:"#047857",bg:"#D1FAE5",i:"📜"},
};

/* Contact roles */
export const CONTACT_ROLES:Record<string,{l:string;i:string;c:string;bg:string}>={
  champion:{l:"Champion",i:"⭐",c:"#F59E0B",bg:"#FEF3C7"},comercial:{l:"Resp. Comercial",i:"💼",c:"#3B82F6",bg:"#DBEAFE"},canje:{l:"Resp. Canje",i:"🔄",c:"#8B5CF6",bg:"#EDE9FE"},operativo:{l:"Operativo",i:"🔧",c:"#6B7280",bg:"#F3F4F6"},
};

/* Ejes estratégicos */
export const SPON_EJES:Record<string,{l:string;i:string}>={
  rugby_hockey:{l:"Rugby & Hockey",i:"🏉"},salud:{l:"Salud",i:"🏥"},infraestructura:{l:"Infraestructura",i:"🏗️"},logistica:{l:"Logística",i:"🚛"},social:{l:"Social",i:"🤝"},
};

/* Hospitality states */
export const HOSP_ST:Record<string,{l:string;c:string;bg:string;i:string}>={
  pendiente:{l:"Pendiente",c:"#F59E0B",bg:"#FEF3C7",i:"⏳"},
  enviada:{l:"Enviada",c:"#3B82F6",bg:"#DBEAFE",i:"📨"},
  confirmada:{l:"Confirmada",c:"#10B981",bg:"#D1FAE5",i:"✅"},
  rechazada:{l:"Rechazada",c:"#DC2626",bg:"#FEE2E2",i:"❌"},
};

/* Material categories */
export const MAT_CATS:Record<string,{l:string;i:string}>={
  brochure:{l:"Brochure Institucional",i:"📄"},propuesta_tipo:{l:"Propuesta Tipo",i:"📝"},kit:{l:"Kit Bienvenida",i:"🎁"},tarifario:{l:"Tarifario",i:"💰"},fotos:{l:"Fotos Institucionales",i:"📸"},contrato:{l:"Plantilla Contrato",i:"📜"},informe:{l:"Informe Impacto",i:"📊"},activacion:{l:"Activación / Galería",i:"🖼️"},general:{l:"General",i:"📁"},
};

/* Contract status */
export const CONTR_ST={VIG:"vigente",PROX:"por_vencer",VENC:"vencido",REN:"renovado"};
export const CONTR_SC:Record<string,{l:string;c:string;bg:string;i:string}>={
  [CONTR_ST.VIG]:{l:"Vigente",c:"#10B981",bg:"#D1FAE5",i:"✅"},
  [CONTR_ST.PROX]:{l:"Por Vencer",c:"#F59E0B",bg:"#FEF3C7",i:"⚠️"},
  [CONTR_ST.VENC]:{l:"Vencido",c:"#DC2626",bg:"#FEE2E2",i:"🔴"},
  [CONTR_ST.REN]:{l:"Renovado",c:"#3B82F6",bg:"#DBEAFE",i:"🔄"},
};

/* ── Fixtures ── */
export const FIX_LOCAL = ["LOS TORDOS", "LOS TORDOS RC", "LTRC", "LOCAL"];
export const FIX_CANCHA_MAP: Record<string, string> = {
  "CANCHA 1": "cancha1", "CANCHA 2": "cancha2", "CANCHA 3": "cancha3",
  "CANCHA 4": "cancha4", "CANCHA 5": "cancha5", "CANCHA 6": "cancha6",
};
export const FIX_ST: Record<string,{l:string;c:string;bg:string;i:string}>={
  pendiente:{l:"Pendiente",c:"#F59E0B",bg:"#FEF3C7",i:"⏳"},
  confirmada:{l:"Confirmada",c:"#10B981",bg:"#D1FAE5",i:"✅"},
  cancelada:{l:"Cancelada",c:"#DC2626",bg:"#FEE2E2",i:"❌"}
};

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

/* ── Torneos Institucionales ── */
export const TN_ST: Record<string,{l:string;c:string;bg:string;i:string}>={
  planificacion:{l:"Planificación",c:"#6B7280",bg:"#F3F4F6",i:"📋"},
  inscripcion:{l:"Inscripción",c:"#3B82F6",bg:"#DBEAFE",i:"✍️"},
  enmarcha:{l:"En Marcha",c:"#F59E0B",bg:"#FEF3C7",i:"🏟️"},
  finalizado:{l:"Finalizado",c:"#10B981",bg:"#D1FAE5",i:"🏆"},
};

export const TN_HITOS_TEMPLATE=[
  {code:"D-120",desc:"Definición fecha, categoría y formato deportivo",resp:"Resp. Torneo"},
  {code:"D-90",desc:"Presupuesto base aprobado por SE",resp:"Resp. Torneo + SE"},
  {code:"D-90b",desc:"Invitaciones oficiales enviadas a clubes",resp:"Resp. Torneo + Coord. Adm."},
  {code:"D-75",desc:"Sponsor principal confirmado",resp:"Sponsoreo"},
  {code:"D-60",desc:"Confirmación de clubes participantes (corte)",resp:"Resp. Torneo"},
  {code:"D-60b",desc:"Reglamento del torneo redactado y aprobado",resp:"Resp. Torneo + URC"},
  {code:"D-45",desc:"Fixture armado y comunicado a clubes",resp:"Resp. Torneo"},
  {code:"D-45b",desc:"Alojamiento confirmado",resp:"Hospitalidad"},
  {code:"D-30",desc:"Validación operativa completa (reunión con SE)",resp:"Resp. Torneo + Tesorería"},
  {code:"D-30b",desc:"Carpeta del torneo enviada a clubes",resp:"Resp. Torneo"},
  {code:"D-21",desc:"Coordinadores por delegación asignados",resp:"Resp. Torneo"},
  {code:"D-15",desc:"Plan de comunicación y cobertura activado",resp:"Comunicación"},
  {code:"D-7",desc:"Checklist final completo",resp:"Resp. Torneo"},
  {code:"D-1",desc:"Arribo delegaciones y acreditaciones",resp:"Hospitalidad"},
  {code:"D0",desc:"Ejecución del torneo",resp:"Director del Torneo"},
  {code:"D+15",desc:"Informe económico + organizativo a SE",resp:"Resp. Torneo"},
  {code:"D+30",desc:"Actualización del PRD con lecciones aprendidas",resp:"Resp. Torneo"},
];

export const TN_CHECKLIST=[
  {title:"Área deportiva",emoji:"🏉",items:[
    "Fixture definitivo publicado y enviado a clubes",
    "Reglamento aprobado y distribuido",
    "Lista de 30 jugadores por equipo recibida",
    "Canchas demarcadas y en condiciones (3 mínimo)",
    "Pelotas oficiales (mínimo 3 por cancha + reserva)",
    "Banderines de corner y postes verificados",
    "Botiquines completos por cancha",
    "Ambulancia contratada y confirmada",
    "Protocolo de premiación definido (copas, placas, premios)",
    "Árbitros confirmados con cronograma de partidos",
    "Mesa de control preparada (planillas, cronómetros, tarjetas)",
  ]},
  {title:"Hospitalidad y logística",emoji:"🏨",items:[
    "Alojamiento confirmado para todas las delegaciones",
    "Menú y turnos de comidas coordinados",
    "Hidratación por equipo asegurada (2 fardos agua/día + hielo)",
    "Vestuarios asignados con horarios de ingreso/egreso",
    "Transporte delegaciones coordinado",
    "Coordinador por delegación asignado y comunicado",
    "Estacionamiento organizado y señalizado",
    "Cena de camaradería coordinada",
    "Tercer tiempo final organizado",
  ]},
  {title:"Comunicación y sponsoreo",emoji:"📣",items:[
    "Cartelería y señalética del torneo lista",
    "Sponsors activados (banners, stands, presencia)",
    "Equipo audiovisual coordinado (fotos, video, streaming)",
    "Plan de redes sociales activo",
    "Merchandising y remeras del torneo listas",
    "Presentes institucionales para clubes preparados",
  ]},
  {title:"Institucional",emoji:"🏛️",items:[
    "Invitaciones a autoridades enviadas (URC, Municipalidad)",
    "Video homenaje / proyección institucional preparada",
    "Placa conmemorativa anual lista",
    "Carpeta del torneo impresa/enviada digitalmente",
    "Voluntarios M14-M19 convocados y con roles asignados",
  ]},
];

export const TN_BUDGET_RUBROS=[
  "Alojamiento","Alimentación","Canchas y materiales","Arbitraje",
  "Médico / ambulancia","Comunicación y branding","Premiación",
  "Eventos sociales","Logística","Merchandising","Imprevistos (10%)",
];

export const TN_INCOME_RUBROS=[
  "Inscripción clubes","Sponsors / Auspicios","Venta de entradas","Merchandising","Gastronomía / Bar","Otros ingresos",
];

export const TN_AREAS_TEMPLATE=[
  {title:"Invitaciones",emoji:"🎫",responsable_id:"",responsable:"",tareas:[
    {text:"Armar flyer del encuentro",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Soporte delegaciones antes, durante y post torneo (teléfono 24/7)",done:false,responsable_id:"",responsable:"",notas:""},
  ]},
  {title:"Juego",emoji:"🏉",responsable_id:"",responsable:"",tareas:[
    {text:"Consensuar equipos para sábado y domingo",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Inscripción de equipos",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Fixture armado y publicado",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Planilleros confirmados",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Armado de canchas",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Cancheros asignados",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Árbitros confirmados",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Pelotas oficiales (mín 3/cancha + reserva)",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Agua / fruta para árbitros",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Silbatos y tarjetas",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Remeras para árbitros",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Designar canchas, espacios y horarios según cantidad de jugadores",done:false,responsable_id:"",responsable:"",notas:""},
  ]},
  {title:"Sponsors y Stands",emoji:"🤝",responsable_id:"",responsable:"",tareas:[
    {text:"Conseguir fruta",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Conseguir descartables",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Conseguir bebidas",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Gestionar meriendas",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Conseguir stand de juegos para niños",done:false,responsable_id:"",responsable:"",notas:""},
  ]},
  {title:"Amenities",emoji:"🎁",responsable_id:"",responsable:"",tareas:[
    {text:"Brigada de la fruta",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Invitados especiales coordinados",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"DJ confirmado",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Tordos Shop preparado",done:false,responsable_id:"",responsable:"",notas:""},
  ]},
  {title:"Tercer Tiempo",emoji:"🍻",responsable_id:"",responsable:"",tareas:[
    {text:"Colación organizada",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Tercer tiempo sábado",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Tercer tiempo domingo",done:false,responsable_id:"",responsable:"",notas:""},
  ]},
  {title:"Hospitality y Recepciones",emoji:"🏨",responsable_id:"",responsable:"",tareas:[
    {text:"Recepción viernes",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Almuerzo sábado",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Cena sábado",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Almuerzo domingo",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Responsables de delegaciones asignados",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Gestión de compra y regalo de presentes institucionales",done:false,responsable_id:"",responsable:"",notas:""},
  ]},
  {title:"Institucional",emoji:"🏛️",responsable_id:"",responsable:"",tareas:[
    {text:"Solicitar ambulancias",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Coordinar agentes municipales",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Invitar al Intendente, Secretario de Deporte y Gobernador",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Homenajes definidos",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Prensa y difusión del encuentro",done:false,responsable_id:"",responsable:"",notas:""},
  ]},
  {title:"Acción Solidaria",emoji:"❤️",responsable_id:"",responsable:"",tareas:[
    {text:"Donación de sangre organizada",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Donación de ropa coordinada",done:false,responsable_id:"",responsable:"",notas:""},
  ]},
  {title:"Administrativo",emoji:"📋",responsable_id:"",responsable:"",tareas:[
    {text:"Generar medios/link de pagos",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Inscripción administrativa lista",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Médicos confirmados",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Área protegida delimitada",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Baños verificados",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Designar lugares de derivación médica y referenciar en flyer",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Chequear médicos de guardia en hospitales principales",done:false,responsable_id:"",responsable:"",notas:""},
  ]},
  {title:"Voluntarios",emoji:"👥",responsable_id:"",responsable:"",tareas:[
    {text:"Limpieza: equipo asignado",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Playa de estacionamiento: equipo asignado",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Cancheros: equipo asignado",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Mozos viernes: equipo asignado",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Mozos sábado: equipo asignado",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Mozos domingo: equipo asignado",done:false,responsable_id:"",responsable:"",notas:""},
    {text:"Agasajo post-torneo a voluntarios",done:false,responsable_id:"",responsable:"",notas:""},
  ]},
];

/* Budget item helpers for hierarchical structure */
export const newBudgetItem=(nombre:string)=>({nombre,estimado:0,real:0,notas:"",subs:[] as string[]});
export const newBudgetRubro=(rubro:string)=>({rubro,estimado:0,real:0,notas:"",items:[] as any[]});

/* ── Fichas de Puesto por Departamento ── */
export const DEPT_DESC:Record<number,{titulo:string;proposito:string;responsable:string;estructura:{area:string;items:string[]}[];funciones:string[];kpis:string[];relaciones:{area:string;desc:string}[];obligaciones:string[]}>={
  1:{
    titulo:"Coordinación General",
    proposito:"Garantizar la operación diaria del club, articulando las áreas de Intendencia, Logística, Administración y Gestión de Espacios para que todas las actividades se ejecuten de manera ordenada, eficiente y con trazabilidad completa.",
    responsable:"Coordinador General",
    estructura:[
      {area:"Intendencia",items:["Mantenimiento de instalaciones","Limpieza y orden","Seguridad y control de acceso","Gestión de servicios (agua, luz, gas)"]},
      {area:"Logística",items:["Coordinación de eventos deportivos y sociales","Gestión de proveedores","Transporte y traslados","Equipamiento e insumos"]},
      {area:"Administración",items:["Gestión documental","Atención al socio","Cobros y pagos operativos","Correspondencia institucional"]},
      {area:"Gestión de Espacios",items:["Reservas de instalaciones","Alquileres a terceros","Coordinación de uso de canchas","Mantenimiento de espacios verdes"]},
    ],
    funciones:[
      "Supervisar y coordinar las operaciones diarias del club",
      "Gestionar el personal de intendencia y mantenimiento",
      "Coordinar la logística de eventos deportivos y sociales",
      "Administrar las reservas y uso de instalaciones",
      "Controlar presupuesto operativo y gastos corrientes",
      "Articular con todas las áreas del club para resolver necesidades operativas",
      "Reportar avances y stoppers a la Secretaría Ejecutiva",
      "Asegurar el cumplimiento de normas de seguridad e higiene",
    ],
    kpis:[
      "% de tareas completadas en plazo",
      "Tiempo promedio de resolución de pedidos",
      "Satisfacción de socios (encuestas)",
      "Cumplimiento de presupuesto operativo",
      "Disponibilidad de instalaciones (% sin problemas)",
      "Tasa de ocupación de espacios alquilables",
    ],
    relaciones:[
      {area:"Secretaría Ejecutiva",desc:"Reporte directo, escalamiento de decisiones"},
      {area:"Deportiva",desc:"Coordinación de canchas, logística de partidos y entrenamientos"},
      {area:"Social",desc:"Apoyo logístico para eventos sociales y actividades comunitarias"},
      {area:"Infraestructura",desc:"Coordinación de obras, mantenimiento mayor y proyectos edilicios"},
      {area:"Tesorería",desc:"Gestión de pagos a proveedores, control de gastos operativos"},
      {area:"Comunicación",desc:"Difusión de novedades operativas, señalética, cartelería"},
    ],
    obligaciones:[
      "Registrar y gestionar todas las tareas, pedidos y seguimientos a través de la app de gestión del club (los-tordos.vercel.app). El uso de la plataforma es obligatorio y no opcional — toda actividad debe quedar documentada en la app para garantizar trazabilidad y visibilidad del trabajo.",
      "Mantener actualizados los estados de tareas en la plataforma de forma diaria",
      "Documentar toda comunicación relevante con proveedores y terceros",
      "Reportar semanalmente el avance de tareas y KPIs al superior directo",
    ],
  },
};

