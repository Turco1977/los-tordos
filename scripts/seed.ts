/**
 * Seed script for Los Tordos Supabase database
 * Run with: npx tsx scripts/seed.ts
 *
 * Prerequisites:
 * 1. Run schema.sql in Supabase SQL Editor first
 * 2. Set env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEFAULT_PASSWORD = "lostordos2026";

// All users from initU + initAT
const ALL_USERS = [
  {old_id:"sa1",n:"Martín",a:"Isola",role:"superadmin",dId:1,div:"",mail:"misola@lostordos.com.ar",tel:"261-555-0000"},
  {old_id:"a1",n:"Admin",a:"SE",role:"admin",dId:55,div:"",mail:"admin@lostordos.com.ar",tel:"261-555-0001"},
  {old_id:"c1",n:"Federico",a:"Perinetti",role:"coordinador",dId:11,div:"Coordinador",mail:"fperinetti@lostordos.com.ar",tel:"261-555-0010"},
  {old_id:"c2",n:"Federico",a:"Mexandeau",role:"coordinador",dId:11,div:"Coordinador",mail:"fmexandeau@lostordos.com.ar",tel:"261-555-0011"},
  {old_id:"emb1",n:"Franco",a:"Lazzari",role:"embudo",dId:7,div:"",mail:"flazzari@lostordos.com.ar",tel:"261-555-0020"},
  {old_id:"u1",n:"Gonzalo",a:"Santo Tomás",role:"usuario",dId:11,div:"Responsable de Managers",mail:"gst@lostordos.com.ar",tel:"261-555-0030"},
  {old_id:"u2",n:"Félix",a:"Guiñazú",role:"usuario",dId:11,div:"Coordinador Adm. Deportiva",mail:"fg@lostordos.com.ar",tel:"261-555-0031"},
  {old_id:"u3",n:"Marcos",a:"Balzarelli",role:"usuario",dId:11,div:"Responsable Viajes y Logística",mail:"mb@lostordos.com.ar",tel:"261-555-0032"},
  {old_id:"g1",n:"Bautista",a:"Pontis",role:"coordinador",dId:1,div:"",mail:"bpontis@lt.ar",tel:""},
  {old_id:"g2",n:"Miguel",a:"Senosian",role:"coordinador",dId:9,div:"",mail:"msenosian@lt.ar",tel:""},
  {old_id:"g3",n:"Daniel",a:"Olguín",role:"usuario",dId:40,div:"",mail:"dolguin@lt.ar",tel:""},
  {old_id:"g4",n:"Daniel",a:"Pont Lezica",role:"usuario",dId:41,div:"",mail:"dpontlezica@lt.ar",tel:""},
  {old_id:"u11",n:"Leandro",a:"Sturniolo",role:"coordinador",dId:3,div:"",mail:"lsturniolo@lt.ar",tel:""},
  {old_id:"g5",n:"Miguel",a:"Senosian",role:"usuario",dId:3,div:"Tordos TV",mail:"msenosian2@lt.ar",tel:""},
  {old_id:"g6",n:"Alejandrina",a:"Vázquez",role:"usuario",dId:3,div:"Diseño",mail:"avazquez@lt.ar",tel:""},
  {old_id:"g7",n:"Gastón",a:"Aye",role:"usuario",dId:3,div:"Redes",mail:"gaye@lt.ar",tel:""},
  {old_id:"g8",n:"Marcelo",a:"Carubin",role:"usuario",dId:3,div:"Fotografía",mail:"mcarubin@lt.ar",tel:""},
  {old_id:"g9",n:"Diego",a:"Sosa",role:"usuario",dId:3,div:"Filmación",mail:"dsosa@lt.ar",tel:""},
  {old_id:"g10",n:"Marcos",a:"Sosa",role:"usuario",dId:3,div:"Edición",mail:"msosa@lt.ar",tel:""},
  {old_id:"g11",n:"Juan Pablo",a:"García",role:"usuario",dId:3,div:"Prensa",mail:"jpgarcia@lt.ar",tel:""},
  {old_id:"g12",n:"Valentín",a:"Saá",role:"usuario",dId:3,div:"Creatividad",mail:"vsaa@lt.ar",tel:""},
  {old_id:"g13",n:"Marcos",a:"Genoud",role:"usuario",dId:3,div:"Asesoría Comunicación",mail:"mgenoud@lt.ar",tel:""},
  {old_id:"g24",n:"Lucía",a:"Gil",role:"coordinador",dId:6,div:"",mail:"lgil@lt.ar",tel:""},
  {old_id:"u15",n:"Jesús",a:"Herrera",role:"coordinador",dId:4,div:"",mail:"jherrera@lt.ar",tel:""},
  {old_id:"u10",n:"Victoria",a:"Brandi",role:"usuario",dId:4,div:"Relacionamiento",mail:"vbrandi@lt.ar",tel:""},
  {old_id:"u19",n:"Juan Martín",a:"Gómez Centurión",role:"usuario",dId:4,div:"Comercial",mail:"jmgc@lt.ar",tel:""},
  {old_id:"g14",n:"Victoria",a:"Brandi",role:"coordinador",dId:2,div:"Coord. Eventos",mail:"vbrandi2@lt.ar",tel:""},
  {old_id:"u17",n:"Ignacio",a:"Ricci",role:"usuario",dId:2,div:"Cena de Camadas",mail:"iricci@lt.ar",tel:""},
  {old_id:"u18",n:"Lucía",a:"González",role:"usuario",dId:2,div:"Sunset",mail:"lgonzalez@lt.ar",tel:""},
  {old_id:"g15",n:"Jesús",a:"Herrera",role:"usuario",dId:2,div:"Fiesta 65 años",mail:"jherrera2@lt.ar",tel:""},
  {old_id:"u22",n:"Juan Manuel",a:"Bancalari",role:"coordinador",dId:5,div:"",mail:"jmbancalari@lt.ar",tel:""},
  {old_id:"g16",n:"Gustavo",a:"Cialone",role:"coordinador",dId:61,div:"",mail:"gcialone@lt.ar",tel:""},
  {old_id:"g17",n:"Santiago",a:"Pérez Araujo",role:"usuario",dId:62,div:"",mail:"sperezaraujo@lt.ar",tel:""},
  {old_id:"g18",n:"Ignacio",a:"Barbeira",role:"usuario",dId:63,div:"",mail:"ibarbeira2@lt.ar",tel:""},
  {old_id:"u16",n:"Victoria",a:"Brandi",role:"coordinador",dId:65,div:"Tordos Shop",mail:"vbrandi3@lt.ar",tel:""},
  {old_id:"g19",n:"Laura",a:"Piola",role:"usuario",dId:65,div:"Encargada",mail:"lpiola@lt.ar",tel:""},
  {old_id:"g20",n:"Victoria",a:"Brandi",role:"coordinador",dId:21,div:"Conecta",mail:"vbrandi4@lt.ar",tel:""},
  {old_id:"g21",n:"Clara",a:"Urrutia",role:"usuario",dId:20,div:"",mail:"currutia@lt.ar",tel:""},
  {old_id:"g22",n:"Ignacio",a:"Ricci",role:"usuario",dId:23,div:"",mail:"iricci2@lt.ar",tel:""},
  {old_id:"u20",n:"Fabián",a:"Guzzo",role:"usuario",dId:22,div:"",mail:"fguzzo@lt.ar",tel:""},
  {old_id:"g23",n:"Álvaro",a:"Villanueva",role:"coordinador",dId:32,div:"",mail:"avillanueva@lt.ar",tel:""},
  {old_id:"e1",n:"Agustín",a:"Castillo",role:"enlace",dId:11,div:"Enlace Plantel Superior",mail:"ac@lt.ar",tel:"261-0001"},
  {old_id:"e2",n:"Martín",a:"Isola",role:"enlace",dId:11,div:"Enlace M19",mail:"misola2@lt.ar",tel:"261-0002"},
  {old_id:"e3",n:"Juan Pablo",a:"García",role:"enlace",dId:11,div:"Enlace M17",mail:"jpg@lt.ar",tel:"261-0003"},
  {old_id:"e4",n:"Rodolfo",a:"Guerra",role:"enlace",dId:11,div:"Enlace M16",mail:"rguerra@lt.ar",tel:"261-0004"},
  {old_id:"e5",n:"Sebastián",a:"Salas",role:"enlace",dId:11,div:"Enlace M15",mail:"ssalas@lt.ar",tel:"261-0005"},
  {old_id:"e6",n:"Pablo",a:"Galeano",role:"enlace",dId:11,div:"Enlace M14",mail:"pg@lt.ar",tel:"261-0006"},
  {old_id:"e7",n:"Lautaro",a:"Díaz",role:"enlace",dId:11,div:"Enlace M13",mail:"ldiaz@lt.ar",tel:"261-0007"},
  {old_id:"e8",n:"Fabián",a:"Guzzo",role:"enlace",dId:11,div:"Enlace M12",mail:"fguzzo2@lt.ar",tel:"261-0008"},
  {old_id:"e9",n:"Maximiliano",a:"Ortega",role:"enlace",dId:11,div:"Enlace M11",mail:"mortega@lt.ar",tel:"261-0009"},
  {old_id:"e10",n:"Martín",a:"Sánchez",role:"enlace",dId:11,div:"Enlace M10",mail:"msanchez@lt.ar",tel:"261-0010"},
  {old_id:"e11",n:"Ignacio",a:"Barbeira",role:"enlace",dId:11,div:"Enlace M9",mail:"ibarbeira@lt.ar",tel:"261-0011"},
  {old_id:"e12",n:"Pelado",a:"Badano",role:"enlace",dId:11,div:"Enlace M8",mail:"pbadano@lt.ar",tel:"261-0012"},
  {old_id:"e13",n:"Joel",a:"Agüero",role:"enlace",dId:11,div:"Enlace Escuelita",mail:"ja@lt.ar",tel:"261-0013"},
  {old_id:"s1",n:"César",a:"Dalla Torre",role:"usuario",dId:11,div:"Responsable Giras",mail:"cdallatorre@lt.ar",tel:""},
  {old_id:"s2",n:"Juan Pablo",a:"García",role:"usuario",dId:11,div:"Resp. Torneo Alejo Duberti",mail:"jpgarcia2@lt.ar",tel:""},
  {old_id:"s3",n:"Fabián",a:"Guzzo",role:"usuario",dId:11,div:"Resp. Torneo Julio Cano",mail:"fguzzo3@lt.ar",tel:""},
  {old_id:"s4",n:"Germán",a:"Luppoli",role:"usuario",dId:11,div:"Resp. Torneo Beto Jofre",mail:"gluppoli@lt.ar",tel:""},
  {old_id:"s5",n:"Joaquín",a:"Bancalari",role:"usuario",dId:11,div:"Resp. Hospitalidad y Recepción",mail:"jbancalari@lt.ar",tel:""},
  {old_id:"s6",n:"Federico",a:"Mexandeau",role:"usuario",dId:11,div:"Enlace con la URC",mail:"fmexandeau2@lt.ar",tel:""},
  // Academia Tordos
  {old_id:"at1",n:"Franco",a:"Lucchini",role:"coordinador",dId:10,div:"Director Deportivo",mail:"flucchini@lt.ar",tel:""},
  {old_id:"at2",n:"Fernando",a:"Higgs",role:"usuario",dId:10,div:"Director de Rugby",mail:"fhiggs@lt.ar",tel:""},
  {old_id:"at3",n:"Carlos",a:"Efimenco",role:"usuario",dId:10,div:"Coordinador Infantiles",mail:"cefimenco@lt.ar",tel:""},
  {old_id:"at4",n:"TBD",a:"Director Hockey",role:"usuario",dId:10,div:"Director de Hockey",mail:"hockey@lt.ar",tel:""},
  {old_id:"at5",n:"Matías",a:"Elías",role:"usuario",dId:10,div:"Preparación Física",mail:"melias@lt.ar",tel:""},
  {old_id:"at6",n:"Martín",a:"Azcurra",role:"usuario",dId:10,div:"Kinesiología Rugby",mail:"mazcurra@lt.ar",tel:""},
  {old_id:"at7",n:"Carolina",a:"Armani",role:"usuario",dId:10,div:"Kinesiología Hockey",mail:"carmani@lt.ar",tel:""},
  {old_id:"at8",n:"Matías",a:"Zanni",role:"usuario",dId:10,div:"Nutrición",mail:"mzanni@lt.ar",tel:""},
  {old_id:"at9",n:"Verónica",a:"Gómez",role:"usuario",dId:10,div:"Psicología",mail:"vgomez@lt.ar",tel:""},
];

const ORG_MEMBERS = [
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

const MILESTONES = [
  {phase:"Fase 0",name:"Diagnóstico y mantenimiento",period:"2025",pct:85,color:"#10B981"},
  {phase:"Fase 1",name:"Anexo + Acceso Urquiza + Estacionamiento + Pádel",period:"2025-2026",pct:30,color:"#3B82F6"},
  {phase:"Fase 2",name:"Cantina ampliada + Club del Ex + Zona comercial",period:"2026-2027",pct:5,color:"#F59E0B"},
  {phase:"Fase 3",name:"Vestuarios PS Rugby/Hockey + Dormy's",period:"2028-2030",pct:0,color:"#8B5CF6"},
  {phase:"Fase 4",name:"Pajarera + Paisajismo + Señalética",period:"2030-2032",pct:0,color:"#C8102E"},
];

async function seed() {
  console.log("Starting seed...\n");

  // ── 1. Create auth users and build ID mapping ──
  const idMap: Record<string, string> = {}; // old_id -> UUID

  console.log(`Creating ${ALL_USERS.length} users...`);
  for (const u of ALL_USERS) {
    // Skip users with empty emails
    if (!u.mail) continue;

    const { data, error } = await supabase.auth.admin.createUser({
      email: u.mail,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: {
        first_name: u.n,
        last_name: u.a,
        role: u.role,
        dept_id: u.dId,
        division: u.div,
        phone: u.tel,
      },
    });

    if (error) {
      // User might already exist
      if (error.message?.includes("already been registered")) {
        console.log(`  [skip] ${u.mail} already exists`);
        // Look up existing user
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existing = listData?.users?.find((x: any) => x.email === u.mail);
        if (existing) idMap[u.old_id] = existing.id;
      } else {
        console.error(`  [error] ${u.mail}: ${error.message}`);
      }
    } else if (data.user) {
      idMap[u.old_id] = data.user.id;
      console.log(`  [ok] ${u.n} ${u.a} (${u.role}) -> ${data.user.id.slice(0, 8)}...`);
    }
  }

  console.log(`\nCreated ${Object.keys(idMap).length} users with ID mapping.\n`);

  // ── 2. Insert org_members ──
  console.log("Inserting org_members...");
  const { error: omErr } = await supabase.from("org_members").upsert(
    ORG_MEMBERS.map((m) => ({
      id: m.id,
      type: m.t,
      cargo: m.cargo,
      first_name: m.n,
      last_name: m.a,
      email: m.mail,
      phone: m.tel,
    }))
  );
  if (omErr) console.error("  org_members error:", omErr.message);
  else console.log(`  [ok] ${ORG_MEMBERS.length} org_members inserted`);

  // ── 3. Insert milestones ──
  console.log("Inserting milestones...");
  const { error: msErr } = await supabase.from("milestones").upsert(
    MILESTONES.map((m, i) => ({ id: i + 1, ...m }))
  );
  if (msErr) console.error("  milestones error:", msErr.message);
  else console.log(`  [ok] ${MILESTONES.length} milestones inserted`);

  // ── 4. Insert sample tasks ──
  console.log("Inserting sample tasks...");
  const TASKS = [
    {id:1,division:"Plantel Superior",creator_id:idMap["e1"]||"e1",creator_name:"Agustín Castillo",dept_id:11,tipo:"Logística",description:"Transporte 35 jugadores a San Luis.",due_date:"2026-03-15",urgency:"Normal",status:"curso",assigned_to:idMap["u3"]||"u3",requires_expense:true,expense_ok:null,resolution:"Cotizando.",created_at:"2026-02-10",amount:null},
    {id:2,division:"M17",creator_id:idMap["e3"]||"e3",creator_name:"Juan Pablo García",dept_id:11,tipo:"Material deportivo",description:"10 pelotas Gilbert n°5.",due_date:"2026-02-28",urgency:"Urgente",status:"pend",assigned_to:null,requires_expense:true,expense_ok:null,resolution:"",created_at:"2026-02-11",amount:null},
    {id:3,division:"M14",creator_id:idMap["e6"]||"e6",creator_name:"Pablo Galeano",dept_id:11,tipo:"Administrativo",description:"Fichas médicas 8 jugadores.",due_date:"2026-02-20",urgency:"Normal",status:"valid",assigned_to:idMap["u1"]||"u1",requires_expense:false,expense_ok:null,resolution:"Fichas cargadas.",created_at:"2026-02-05",amount:null},
    {id:4,division:"Escuelita",creator_id:idMap["e13"]||"e13",creator_name:"Joel Agüero",dept_id:11,tipo:"Infraestructura",description:"Arcos sector 3 rotos.",due_date:"2026-02-14",urgency:"Urgente",status:"ok",assigned_to:idMap["u2"]||"u2",requires_expense:true,expense_ok:true,resolution:"Arcos reparados.",created_at:"2026-02-03",amount:15000},
    {id:5,division:"",creator_id:idMap["a1"]||"a1",creator_name:"Admin SE",dept_id:3,tipo:"Comunicación",description:"Diseño flyer institucional.",due_date:"2026-03-01",urgency:"Normal",status:"pend",assigned_to:null,requires_expense:false,expense_ok:null,resolution:"",created_at:"2026-02-12",amount:null},
    {id:6,division:"",creator_id:idMap["a1"]||"a1",creator_name:"Admin SE",dept_id:30,tipo:"Infraestructura",description:"Reparar cerco perimetral.",due_date:"2026-03-10",urgency:"Normal",status:"curso",assigned_to:null,requires_expense:true,expense_ok:null,resolution:"",created_at:"2026-02-11",amount:null},
  ];

  for (const t of TASKS) {
    const { error: tErr } = await supabase.from("tasks").upsert(t);
    if (tErr) console.error(`  task ${t.id} error:`, tErr.message);
  }
  console.log(`  [ok] ${TASKS.length} tasks inserted`);

  // ── 5. Insert task messages ──
  console.log("Inserting task messages...");
  const MESSAGES = [
    {task_id:1,user_id:idMap["e1"]||"e1",user_name:"Agustín Castillo",content:"Creó la tarea",type:"sys"},
    {task_id:1,user_id:idMap["u3"]||"u3",user_name:"Marcos Balzarelli",content:"Tomó la tarea",type:"sys"},
    {task_id:1,user_id:idMap["u3"]||"u3",user_name:"Marcos Balzarelli",content:"Estoy cotizando con 3 empresas de transporte.",type:"msg"},
    {task_id:2,user_id:idMap["e3"]||"e3",user_name:"Juan Pablo García",content:"Creó la tarea",type:"sys"},
    {task_id:2,user_id:idMap["e3"]||"e3",user_name:"Juan Pablo García",content:"Las necesitamos para el torneo del 28/02. Son urgentes.",type:"msg"},
    {task_id:3,user_id:idMap["e6"]||"e6",user_name:"Pablo Galeano",content:"Creó la tarea",type:"sys"},
    {task_id:3,user_id:idMap["u1"]||"u1",user_name:"Gonzalo Santo Tomás",content:"Tomó la tarea",type:"sys"},
    {task_id:3,user_id:idMap["u1"]||"u1",user_name:"Gonzalo Santo Tomás",content:"Envió a validación",type:"sys"},
    {task_id:4,user_id:idMap["e13"]||"e13",user_name:"Joel Agüero",content:"Creó la tarea",type:"sys"},
    {task_id:4,user_id:idMap["e13"]||"e13",user_name:"Joel Agüero",content:"Validó OK ✅",type:"sys"},
    {task_id:5,user_id:idMap["a1"]||"a1",user_name:"Admin SE",content:"Creó la tarea",type:"sys"},
    {task_id:6,user_id:idMap["a1"]||"a1",user_name:"Admin SE",content:"Creó la tarea",type:"sys"},
  ];

  const { error: msgErr } = await supabase.from("task_messages").insert(MESSAGES);
  if (msgErr) console.error("  messages error:", msgErr.message);
  else console.log(`  [ok] ${MESSAGES.length} messages inserted`);

  // ── Print ID mapping for reference ──
  console.log("\n=== ID MAPPING (old -> new UUID) ===");
  for (const [old_id, uuid] of Object.entries(idMap)) {
    const u = ALL_USERS.find((x) => x.old_id === old_id);
    console.log(`  ${old_id.padEnd(6)} -> ${uuid.slice(0, 8)}... (${u?.n} ${u?.a})`);
  }

  console.log("\nSeed complete!");
}

seed().catch(console.error);
