import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const isMissing = (err: any) => err && (err.code === "42P01" || err.code === "PGRST205");

export async function GET() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const missing: { table: string; sql: string }[] = [];

  // Check reminders table
  const { error: e1 } = await admin.from("reminders").select("id").limit(1);
  if (isMissing(e1)) {
    missing.push({
      table: "reminders",
      sql: `CREATE TABLE reminders (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT DEFAULT '',
  color TEXT DEFAULT '#3B82F6',
  recurrence TEXT DEFAULT 'none',
  assigned_to UUID,
  assigned_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY reminders_all ON reminders FOR ALL USING (true) WITH CHECK (true);`,
    });
  }

  // Check notifications table
  const { error: e2 } = await admin.from("notifications").select("id").limit(1);
  if (isMissing(e2)) {
    missing.push({
      table: "notifications",
      sql: `CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT DEFAULT '',
  type TEXT DEFAULT 'info',
  link TEXT DEFAULT '',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notifications_user ON notifications(user_id, read);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_all ON notifications FOR ALL USING (true) WITH CHECK (true);`,
    });
  }

  // Check dep_training_sessions table
  const { error: e3 } = await admin.from("dep_training_sessions").select("id").limit(1);
  if (isMissing(e3)) {
    missing.push({
      table: "dep_training_sessions",
      sql: `CREATE TABLE dep_training_sessions (
  id SERIAL PRIMARY KEY,
  division TEXT NOT NULL,
  date DATE NOT NULL,
  time_start TEXT DEFAULT '',
  time_end TEXT DEFAULT '',
  type TEXT DEFAULT 'Entrenamiento',
  description TEXT DEFAULT '',
  location TEXT DEFAULT '',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE dep_training_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY dep_training_sessions_all ON dep_training_sessions FOR ALL USING (true) WITH CHECK (true);`,
    });
  }

  // Check dep_attendance table
  const { error: e4 } = await admin.from("dep_attendance").select("id").limit(1);
  if (isMissing(e4)) {
    missing.push({
      table: "dep_attendance",
      sql: `CREATE TABLE dep_attendance (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES dep_training_sessions(id) ON DELETE CASCADE,
  athlete_id INTEGER NOT NULL REFERENCES dep_athletes(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'presente',
  notes TEXT DEFAULT '',
  recorded_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, athlete_id)
);
ALTER TABLE dep_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY dep_attendance_all ON dep_attendance FOR ALL USING (true) WITH CHECK (true);`,
    });
  }

  // Check projects table
  const { error: e5 } = await admin.from("projects").select("id").limit(1);
  if (isMissing(e5)) {
    missing.push({
      table: "projects",
      sql: `CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Nuevo Proyecto',
  description TEXT DEFAULT '',
  created_by UUID NOT NULL,
  created_by_name TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY projects_all ON projects FOR ALL USING (true) WITH CHECK (true);`,
    });
  }

  // Check project_tasks table
  const { error: e6 } = await admin.from("project_tasks").select("id").limit(1);
  if (isMissing(e6)) {
    missing.push({
      table: "project_tasks",
      sql: `CREATE TABLE project_tasks (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'backlog',
  priority TEXT DEFAULT 'medium',
  assignee_id UUID,
  assignee_name TEXT DEFAULT '',
  due_date DATE,
  requires_expense BOOLEAN DEFAULT false,
  amount NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY project_tasks_all ON project_tasks FOR ALL USING (true) WITH CHECK (true);`,
    });
  }

  // Check task_templates table
  const { error: e7 } = await admin.from("task_templates").select("id").limit(1);
  if (isMissing(e7)) {
    missing.push({
      table: "task_templates",
      sql: `CREATE TABLE task_templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  tipo TEXT DEFAULT 'Administrativo',
  dept_id INT,
  assigned_to UUID,
  assigned_name TEXT DEFAULT '',
  frequency TEXT DEFAULT 'semanal',
  day_of_week INT DEFAULT 1,
  day_of_month INT DEFAULT 1,
  urgency TEXT DEFAULT 'Normal',
  active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_by_name TEXT DEFAULT '',
  last_generated DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY task_templates_all ON task_templates FOR ALL USING (true) WITH CHECK (true);`,
    });
  }

  // Check inventory table
  const { error: e8 } = await admin.from("inventory").select("id").limit(1);
  if (isMissing(e8)) {
    missing.push({
      table: "inventory",
      sql: `CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'otro',
  location TEXT DEFAULT '',
  quantity INT DEFAULT 1,
  condition TEXT DEFAULT 'bueno',
  responsible_id UUID,
  responsible_name TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY inventory_all ON inventory FOR ALL USING (true) WITH CHECK (true);`,
    });
  }

  // Check bookings table
  const { error: e9 } = await admin.from("bookings").select("id").limit(1);
  if (isMissing(e9)) {
    missing.push({
      table: "bookings",
      sql: `CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  facility TEXT NOT NULL,
  date DATE NOT NULL,
  time_start TEXT DEFAULT '08:00',
  time_end TEXT DEFAULT '10:00',
  title TEXT DEFAULT '',
  description TEXT DEFAULT '',
  booked_by UUID NOT NULL,
  booked_by_name TEXT DEFAULT '',
  status TEXT DEFAULT 'pendiente',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY bookings_all ON bookings FOR ALL USING (true) WITH CHECK (true);`,
    });
  }

  // Check sponsors table
  const { error: e10 } = await admin.from("sponsors").select("id").limit(1);
  if (isMissing(e10)) {
    missing.push({
      table: "sponsors",
      sql: `CREATE TABLE sponsors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT DEFAULT '',
  contact_email TEXT DEFAULT '',
  contact_phone TEXT DEFAULT '',
  tier TEXT DEFAULT 'colaborador',
  amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'ARS',
  status TEXT DEFAULT 'negociando',
  start_date DATE,
  end_date DATE,
  notes TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  created_by UUID,
  created_by_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
CREATE POLICY sponsors_all ON sponsors FOR ALL USING (true) WITH CHECK (true);`,
    });
  }

  if (missing.length > 0) {
    return NextResponse.json({
      status: "missing",
      message: `${missing.length} table(s) missing. Run the SQL below in Supabase SQL Editor:`,
      tables: missing.map((m) => m.table),
      sql: missing.map((m) => `-- Table: ${m.table}\n${m.sql}`).join("\n\n"),
    });
  }

  return NextResponse.json({ status: "ok", message: "All tables exist" });
}
