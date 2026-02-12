import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/\s+/g, "")
    .replace(/[^a-z]/g, "");
}

function makeEmail(first: string, last: string): string {
  const f = normalize(first);
  const l = normalize(last);
  if (!f || !l) return "";
  return f[0] + l + "@lostordos.com.ar";
}

async function main() {
  const { data: profiles } = await sb.from("profiles").select("id,first_name,last_name,email").order("last_name");
  if (!profiles) { console.log("No profiles found"); return; }

  // Track used emails to handle duplicates
  const used = new Set<string>();
  let updated = 0;
  let skipped = 0;

  for (const p of profiles) {
    let newEmail = makeEmail(p.first_name, p.last_name);
    if (!newEmail) { console.log(`  SKIP (no name): ${p.first_name} ${p.last_name}`); skipped++; continue; }

    // Handle duplicates by adding a number
    if (used.has(newEmail)) {
      let n = 2;
      const base = newEmail.split("@")[0];
      while (used.has(base + n + "@lostordos.com.ar")) n++;
      newEmail = base + n + "@lostordos.com.ar";
    }
    used.add(newEmail);

    if (p.email === newEmail) {
      console.log(`  OK   ${p.first_name} ${p.last_name} → ${newEmail} (ya correcto)`);
      continue;
    }

    // Update profiles table
    const { error: pErr } = await sb.from("profiles").update({ email: newEmail }).eq("id", p.id);
    if (pErr) { console.log(`  ERR profile ${p.first_name} ${p.last_name}: ${pErr.message}`); continue; }

    // Update auth.users email
    const { error: aErr } = await sb.auth.admin.updateUserById(p.id, { email: newEmail });
    if (aErr) { console.log(`  ERR auth ${p.first_name} ${p.last_name}: ${aErr.message}`); continue; }

    console.log(`  UPD  ${p.first_name} ${p.last_name}: ${p.email} → ${newEmail}`);
    updated++;
  }

  console.log(`\nDone: ${updated} updated, ${skipped} skipped`);
}

main().catch(console.error);
