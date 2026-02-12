import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  // Find both Martín Isola profiles
  const { data: profiles } = await sb.from("profiles").select("id,first_name,last_name,role,email,division");
  const misolaProfiles = (profiles || []).filter(p => p.last_name === "Isola" && p.first_name === "Martín");

  console.log("Martín Isola profiles:");
  for (const p of misolaProfiles) {
    console.log(`  ${p.role} (${p.division || "sin div"}) → profile email: ${p.email}, id: ${p.id}`);

    // Also check auth email
    const { data: { user } } = await sb.auth.admin.getUserById(p.id);
    console.log(`    auth email: ${user?.email}`);
  }

  const superadmin = misolaProfiles.find(p => p.role === "superadmin");
  const enlace = misolaProfiles.find(p => p.role === "enlace");

  if (!superadmin || !enlace) { console.log("Missing profiles"); return; }

  // Fix superadmin: should be misola@lostordos.com.ar
  console.log("\nFixing superadmin...");
  await sb.from("profiles").update({ email: "misola@lostordos.com.ar" }).eq("id", superadmin.id);
  const { error: e1 } = await sb.auth.admin.updateUserById(superadmin.id, { email: "misola@lostordos.com.ar" });
  console.log(e1 ? `  ERR: ${e1.message}` : "  OK → misola@lostordos.com.ar");

  // Fix enlace: should be misola2@lostordos.com.ar
  console.log("Fixing enlace...");
  await sb.from("profiles").update({ email: "misola2@lostordos.com.ar" }).eq("id", enlace.id);
  const { error: e2 } = await sb.auth.admin.updateUserById(enlace.id, { email: "misola2@lostordos.com.ar" });
  console.log(e2 ? `  ERR: ${e2.message}` : "  OK → misola2@lostordos.com.ar");

  // Verify login
  console.log("\nVerificando login...");
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { error: loginErr } = await anon.auth.signInWithPassword({ email: "misola@lostordos.com.ar", password: "lostordos2026" });
  console.log(loginErr ? `  FAIL: ${loginErr.message}` : "  OK - login funciona");
}

main().catch(console.error);
