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
  // First, drop the trigger temporarily via rpc if possible
  // If not, create user with minimal metadata (no dept_id to avoid int cast issue)
  for (const u of newUsers) {
    console.log("Creating " + u.first_name + " " + u.last_name + "...");

    const { data, error } = await sb.auth.admin.createUser({
      email: u.email,
      password: "lostordos2026",
      email_confirm: true,
      user_metadata: {
        first_name: u.first_name,
        last_name: u.last_name,
        role: u.role,
        dept_id: "1",
        division: "",
        phone: "",
      },
    });

    if (error) {
      console.log("  ERR: " + error.message + " (status: " + error.status + ")");

      // Try without any metadata
      console.log("  Retrying without metadata...");
      const { data: d2, error: e2 } = await sb.auth.admin.createUser({
        email: u.email,
        password: "lostordos2026",
        email_confirm: true,
      });

      if (e2) {
        console.log("  Still failed: " + e2.message);
        continue;
      }

      // Manually update metadata
      await sb.auth.admin.updateUserById(d2.user.id, {
        user_metadata: { first_name: u.first_name, last_name: u.last_name, role: u.role, dept_id: "1", division: "", phone: "" }
      });

      // Check if trigger created profile
      const { data: prof } = await sb.from("profiles").select("id").eq("id", d2.user.id).single();
      if (!prof) {
        const { error: pErr } = await sb.from("profiles").insert({
          id: d2.user.id, email: u.email, first_name: u.first_name, last_name: u.last_name,
          role: u.role, dept_id: 1, division: "", phone: "",
        });
        if (pErr) console.log("  Profile err: " + pErr.message);
        else console.log("  OK (manual profile)");
      } else {
        console.log("  OK (trigger created profile)");
      }
      continue;
    }

    console.log("  OK → " + data.user.id);
  }
}

main().catch(console.error);
