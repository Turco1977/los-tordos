-- ═══════════════════════════════════════════════════════════
-- Los Tordos RLS Policies
-- Run this in Supabase SQL Editor to secure all tables
-- ═══════════════════════════════════════════════════════════

-- Helper: get current user role from profiles
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if user is admin+
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() IN ('superadmin', 'admin')
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if user is coordinator+
CREATE OR REPLACE FUNCTION is_coordinator_or_above()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() IN ('superadmin', 'admin', 'coordinador', 'embudo')
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── PROFILES ───
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profiles_select ON profiles;
DROP POLICY IF EXISTS profiles_update_own ON profiles;
DROP POLICY IF EXISTS profiles_admin_all ON profiles;

CREATE POLICY profiles_select ON profiles FOR SELECT USING (true);
CREATE POLICY profiles_update_own ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY profiles_admin_all ON profiles FOR ALL USING (is_admin());

-- ─── TASKS ───
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tasks_select ON tasks;
DROP POLICY IF EXISTS tasks_insert ON tasks;
DROP POLICY IF EXISTS tasks_update ON tasks;
DROP POLICY IF EXISTS tasks_delete ON tasks;

-- Everyone can read tasks
CREATE POLICY tasks_select ON tasks FOR SELECT USING (true);
-- Authenticated users can create tasks
CREATE POLICY tasks_insert ON tasks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
-- Assigned user, creator, or coordinator+ can update
CREATE POLICY tasks_update ON tasks FOR UPDATE USING (
  creator_id = auth.uid()
  OR assigned_to = auth.uid()::text
  OR is_coordinator_or_above()
);
-- Only admin+ can delete
CREATE POLICY tasks_delete ON tasks FOR DELETE USING (is_admin());

-- ─── TASK MESSAGES ───
ALTER TABLE task_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS task_messages_select ON task_messages;
DROP POLICY IF EXISTS task_messages_insert ON task_messages;

CREATE POLICY task_messages_select ON task_messages FOR SELECT USING (true);
CREATE POLICY task_messages_insert ON task_messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─── PRESUPUESTOS ───
ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS presupuestos_select ON presupuestos;
DROP POLICY IF EXISTS presupuestos_insert ON presupuestos;
DROP POLICY IF EXISTS presupuestos_update ON presupuestos;
DROP POLICY IF EXISTS presupuestos_delete ON presupuestos;

CREATE POLICY presupuestos_select ON presupuestos FOR SELECT USING (true);
CREATE POLICY presupuestos_insert ON presupuestos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY presupuestos_update ON presupuestos FOR UPDATE USING (is_coordinator_or_above());
CREATE POLICY presupuestos_delete ON presupuestos FOR DELETE USING (is_admin());

-- ─── PROVEEDORES ───
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS proveedores_select ON proveedores;
DROP POLICY IF EXISTS proveedores_manage ON proveedores;

CREATE POLICY proveedores_select ON proveedores FOR SELECT USING (true);
CREATE POLICY proveedores_manage ON proveedores FOR ALL USING (is_coordinator_or_above());

-- ─── AGENDAS ───
ALTER TABLE agendas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS agendas_select ON agendas;
DROP POLICY IF EXISTS agendas_manage ON agendas;

CREATE POLICY agendas_select ON agendas FOR SELECT USING (true);
CREATE POLICY agendas_manage ON agendas FOR ALL USING (is_coordinator_or_above());

-- ─── MINUTAS ───
ALTER TABLE minutas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS minutas_select ON minutas;
DROP POLICY IF EXISTS minutas_manage ON minutas;

CREATE POLICY minutas_select ON minutas FOR SELECT USING (true);
CREATE POLICY minutas_manage ON minutas FOR ALL USING (is_coordinator_or_above());

-- ─── ORG MEMBERS ───
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_members_select ON org_members;
DROP POLICY IF EXISTS org_members_manage ON org_members;

CREATE POLICY org_members_select ON org_members FOR SELECT USING (true);
CREATE POLICY org_members_manage ON org_members FOR ALL USING (is_admin());

-- ─── MILESTONES ───
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS milestones_select ON milestones;
DROP POLICY IF EXISTS milestones_manage ON milestones;

CREATE POLICY milestones_select ON milestones FOR SELECT USING (true);
CREATE POLICY milestones_manage ON milestones FOR ALL USING (is_admin());

-- ─── REMINDERS ───
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reminders_select ON reminders;
DROP POLICY IF EXISTS reminders_own ON reminders;

CREATE POLICY reminders_select ON reminders FOR SELECT USING (
  user_id = auth.uid() OR assigned_to = auth.uid()
);
CREATE POLICY reminders_own ON reminders FOR ALL USING (user_id = auth.uid());

-- ─── NOTIFICATIONS ───
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notifications_own ON notifications;

CREATE POLICY notifications_own ON notifications FOR SELECT USING (user_id = auth.uid());
-- Insert/update via service role only (API route)

-- ─── DEP_STAFF ───
ALTER TABLE dep_staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dep_staff_select ON dep_staff;
DROP POLICY IF EXISTS dep_staff_manage ON dep_staff;

CREATE POLICY dep_staff_select ON dep_staff FOR SELECT USING (true);
CREATE POLICY dep_staff_manage ON dep_staff FOR ALL USING (
  is_admin() OR EXISTS (
    SELECT 1 FROM dep_staff WHERE user_id = auth.uid() AND dep_role IN ('dd', 'dr') AND active
  )
);

-- ─── DEP_ATHLETES ───
ALTER TABLE dep_athletes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dep_athletes_select ON dep_athletes;
DROP POLICY IF EXISTS dep_athletes_manage ON dep_athletes;

CREATE POLICY dep_athletes_select ON dep_athletes FOR SELECT USING (true);
CREATE POLICY dep_athletes_manage ON dep_athletes FOR ALL USING (
  is_admin() OR EXISTS (
    SELECT 1 FROM dep_staff WHERE user_id = auth.uid() AND active
  )
);

-- ─── DEP_INJURIES ───
ALTER TABLE dep_injuries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dep_injuries_select ON dep_injuries;
DROP POLICY IF EXISTS dep_injuries_manage ON dep_injuries;

CREATE POLICY dep_injuries_select ON dep_injuries FOR SELECT USING (true);
CREATE POLICY dep_injuries_manage ON dep_injuries FOR ALL USING (
  is_admin() OR EXISTS (
    SELECT 1 FROM dep_staff WHERE user_id = auth.uid() AND active
  )
);

-- ─── DEP_CHECKINS ───
ALTER TABLE dep_checkins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dep_checkins_select ON dep_checkins;
DROP POLICY IF EXISTS dep_checkins_manage ON dep_checkins;

CREATE POLICY dep_checkins_select ON dep_checkins FOR SELECT USING (true);
CREATE POLICY dep_checkins_manage ON dep_checkins FOR ALL USING (
  is_admin() OR EXISTS (
    SELECT 1 FROM dep_staff WHERE user_id = auth.uid() AND active
  )
);

-- ─── DEP_TRAINING_SESSIONS ───
ALTER TABLE dep_training_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dep_training_sessions_select ON dep_training_sessions;
DROP POLICY IF EXISTS dep_training_sessions_manage ON dep_training_sessions;

CREATE POLICY dep_training_sessions_select ON dep_training_sessions FOR SELECT USING (true);
CREATE POLICY dep_training_sessions_manage ON dep_training_sessions FOR ALL USING (
  is_admin() OR EXISTS (
    SELECT 1 FROM dep_staff WHERE user_id = auth.uid() AND active
  )
);

-- ─── DEP_ATTENDANCE ───
ALTER TABLE dep_attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dep_attendance_select ON dep_attendance;
DROP POLICY IF EXISTS dep_attendance_manage ON dep_attendance;

CREATE POLICY dep_attendance_select ON dep_attendance FOR SELECT USING (true);
CREATE POLICY dep_attendance_manage ON dep_attendance FOR ALL USING (
  is_admin() OR EXISTS (
    SELECT 1 FROM dep_staff WHERE user_id = auth.uid() AND active
  )
);

-- ─── STORAGE BUCKET (run separately) ───
-- INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', true);
-- CREATE POLICY storage_attachments_upload ON storage.objects FOR INSERT WITH CHECK (
--   bucket_id = 'attachments' AND auth.uid() IS NOT NULL
-- );
-- CREATE POLICY storage_attachments_read ON storage.objects FOR SELECT USING (
--   bucket_id = 'attachments'
-- );
