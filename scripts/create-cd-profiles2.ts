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
    // Create auth user WITHOUT trigger (trigger might fail)
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
      app_metadata: {},
    });

    if (error) {
      console.log("AUTH ERR " + u.first_name + " " + u.last_name + ": " + JSON.stringify(error));
      // Maybe user already exists in auth? Try to find them
      const { data: { users } } = await sb.auth.admin.listUsers({ perPage: 200 });
      const existing = users.find((au: any) => au.email === u.email);
      if (existing) {
        console.log("  Found existing auth user: " + existing.id);
        // Just create profile
        const { error: pErr } = await sb.from("profiles").upsert({
          id: existing.id,
          email: u.email,
          first_name: u.first_name,
          last_name: u.last_name,
          role: u.role,
          dept_id: 1,
          division: "",
          phone: "",
        });
        if (pErr) console.log("  profile err: " + pErr.message);
        else console.log("  OK profile created for existing user");
      }
      continue;
    }

    console.log("AUTH OK " + u.first_name + " " + u.last_name + " → " + data.user.id);

    // Check if profile was created by trigger
    const { data: profile } = await sb.from("profiles").select("id").eq("id", data.user.id).single();
    if (profile) {
      console.log("  Profile already exists (trigger worked)");
    } else {
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
      if (pErr) console.log("  profile insert err: " + pErr.message);
      else console.log("  Profile created manually");
    }
  }
}

main().catch(console.error);
