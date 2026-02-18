import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const newUsers = [
  { first_name: "Juan Cruz", last_name: "Cardoso", role: "admin", email: "jcardoso@lostordos.com.ar" },
  { first_name: "Julián", last_name: "Saá", role: "admin", email: "jsaa@lostordos.com.ar" },
  { first_name: "Carlos", last_name: "García", role: "admin", email: "cgarcia@lostordos.com.ar" },
  { first_name: "Franco", last_name: "Perinetti", role: "admin", email: "fperinetti2@lostordos.com.ar" },
  { first_name: "Laura", last_name: "Chaky", role: "admin", email: "lchaky@lostordos.com.ar" },
  { first_name: "Francisco", last_name: "Herrera", role: "admin", email: "fherrera@lostordos.com.ar" },
];

async function main() {
  for (const u of newUsers) {
    // Check if profile already exists
    const { data: existing } = await sb.from("profiles").select("id").eq("first_name", u.first_name).eq("last_name", u.last_name);
    if (existing && existing.length > 0) {
      console.log(`SKIP ${u.first_name} ${u.last_name} - ya tiene perfil`);
      continue;
    }

    const { data, error } = await sb.auth.admin.createUser({
      email: u.email,
      password: "lostordos2026",
      email_confirm: true,
      user_metadata: {
        first_name: u.first_name,
        last_name: u.last_name,
        role: u.role,
        dept_id: 1,
        division: "",
        phone: "",
      },
    });

    if (error) {
      console.log(`ERR ${u.first_name} ${u.last_name}: ${error.message}`);
      continue;
    }

    // Create profile
    const { error: pErr } = await sb.from("profiles").insert({
      id: data.user.id,
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      role: u.role,
      dept_id: 1,
      division: "",
      phone: "",
    });

    if (pErr) console.log(`  profile err: ${pErr.message}`);
    else console.log(`OK ${u.first_name} ${u.last_name} → ${u.email}`);
  }
}

main().catch(console.error);
