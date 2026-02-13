// Run once: npx tsx scripts/create-reminders-table.ts
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Parse .env.local manually
const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Check if table already exists
  const { error: checkErr } = await supabase.from("reminders").select("id").limit(1);

  if (checkErr && checkErr.code === "42P01") {
    console.log("\n⚠️  La tabla 'reminders' no existe.");
    console.log("Ejecutá este SQL en el Supabase SQL Editor:\n");
    console.log(`
CREATE TABLE reminders (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT DEFAULT '',
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY reminders_all ON reminders FOR ALL USING (true) WITH CHECK (true);
    `);
  } else if (checkErr) {
    console.error("Error:", checkErr.message);
  } else {
    console.log("✅ La tabla 'reminders' ya existe.");
  }
}

main();
