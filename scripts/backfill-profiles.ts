import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const { data: { users } } = await sb.auth.admin.listUsers({ perPage: 100 });
  console.log("Auth users:", users.length);

  const { data: profiles } = await sb.from("profiles").select("id");
  const existingIds = new Set((profiles || []).map((p: any) => p.id));
  console.log("Existing profiles:", existingIds.size);

  let count = 0;
  for (const u of users) {
    if (!existingIds.has(u.id)) {
      const m = u.user_metadata || {};
      const { error } = await sb.from("profiles").insert({
        id: u.id,
        email: u.email || "",
        first_name: m.first_name || "",
        last_name: m.last_name || "",
        role: m.role || "usuario",
        dept_id: m.dept_id || 1,
        division: m.division || "",
        phone: m.phone || "",
      });
      if (error) console.log("  err:", u.email, error.message);
      else { count++; console.log("  [ok]", u.email, "-", m.first_name, m.last_name); }
    }
  }
  console.log("Backfilled", count, "profiles");

  const { data: all } = await sb.from("profiles").select("id");
  console.log("Total profiles now:", all?.length);
}

main().catch(console.error);
