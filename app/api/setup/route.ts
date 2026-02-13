import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Try to select from reminders to see if it exists
  const { error } = await admin.from("reminders").select("id").limit(1);

  if (error && error.code === "42P01") {
    // Table doesn't exist — we can't create it via PostgREST.
    // Return the SQL to run manually.
    return NextResponse.json({
      status: "missing",
      message: "Table 'reminders' does not exist. Run this SQL in Supabase SQL Editor:",
      sql: `CREATE TABLE reminders (
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
CREATE POLICY reminders_all ON reminders FOR ALL USING (true) WITH CHECK (true);`
    });
  }

  if (error) {
    return NextResponse.json({ status: "error", message: error.message });
  }

  return NextResponse.json({ status: "ok", message: "Table 'reminders' exists" });
}
