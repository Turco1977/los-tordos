import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const roles: Record<string, string> = {
  superadmin: "Super Admin",
  admin: "Administrador",
  coordinador: "Coordinador",
  embudo: "Compras/Tesorería",
  usuario: "Usuario",
  enlace: "Enlace",
  manager: "Manager",
};

async function main() {
  const { data } = await sb
    .from("profiles")
    .select("first_name,last_name,role,email,division")
    .order("role")
    .order("last_name");

  let cur = "";
  for (const p of data || []) {
    if (p.role !== cur) {
      cur = p.role;
      console.log("\n" + (roles[cur] || cur).toUpperCase());
      console.log("─".repeat(50));
    }
    const div = p.division ? ` (${p.division})` : "";
    console.log(`${p.first_name} ${p.last_name}${div}`);
    console.log(`  Email: ${p.email}`);
    console.log(`  Clave: lostordos2026`);
  }
}

main().catch(console.error);
