-- ============================================================
-- Los Tordos - Row-Level Security (RLS) Policies
-- ============================================================
-- Run this in Supabase Dashboard > SQL Editor.
--
-- This script:
--   1. Enables RLS on every table (idempotent).
--   2. Drops existing policies (by name) so re-runs are safe.
--   3. Creates a complete set of least-privilege policies.
--
-- Roles referenced in profiles.role:
--   superadmin, admin, embudo, coordinador, usuario
--
-- The service_role key bypasses RLS by default in Supabase,
-- so no explicit policy is needed for server-side admin access.
-- ============================================================


-- ============================================================
-- Helper: reusable function to check the caller's role.
-- Returns the role text for the currently authenticated user.
-- ============================================================
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;


-- ============================================================
-- 1. PROFILES
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: any authenticated user can read all profiles
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- INSERT: only superadmin can create profiles manually.
-- (New users are created automatically via the handle_new_user()
-- trigger which runs as SECURITY DEFINER, bypassing RLS.)
DROP POLICY IF EXISTS "profiles_insert_superadmin" ON profiles;
CREATE POLICY "profiles_insert_superadmin" ON profiles
  FOR INSERT
  WITH CHECK (
    current_user_role() = 'superadmin'
  );

-- UPDATE: users can update their own profile
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- UPDATE: superadmin and admin can update any profile
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE
  USING (
    current_user_role() IN ('superadmin', 'admin')
  );

-- DELETE: only superadmin and admin can delete profiles
DROP POLICY IF EXISTS "profiles_delete_admin" ON profiles;
CREATE POLICY "profiles_delete_admin" ON profiles
  FOR DELETE
  USING (
    current_user_role() IN ('superadmin', 'admin')
  );


-- ============================================================
-- 2. TASKS
-- ============================================================
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- SELECT: any authenticated user can read all tasks
DROP POLICY IF EXISTS "tasks_select" ON tasks;
CREATE POLICY "tasks_select" ON tasks
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- INSERT: any authenticated user can create tasks
DROP POLICY IF EXISTS "tasks_insert" ON tasks;
CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: only the creator, the assigned user, or an admin can update
-- (creator_id and assigned_to are stored as text = auth.uid()::text)
DROP POLICY IF EXISTS "tasks_update" ON tasks;
CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE
  USING (
    auth.uid()::text = creator_id
    OR auth.uid()::text = assigned_to
    OR current_user_role() IN ('superadmin', 'admin')
  );

-- DELETE: only superadmin can delete tasks
DROP POLICY IF EXISTS "tasks_delete" ON tasks;
CREATE POLICY "tasks_delete" ON tasks
  FOR DELETE
  USING (
    current_user_role() = 'superadmin'
  );


-- ============================================================
-- 3. TASK_MESSAGES
-- ============================================================
ALTER TABLE task_messages ENABLE ROW LEVEL SECURITY;

-- SELECT: any authenticated user can read messages (they are
-- displayed inside tasks visible to everyone)
DROP POLICY IF EXISTS "task_messages_select" ON task_messages;
CREATE POLICY "task_messages_select" ON task_messages
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- INSERT: any authenticated user can create messages
DROP POLICY IF EXISTS "task_messages_insert" ON task_messages;
CREATE POLICY "task_messages_insert" ON task_messages
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: users can only modify their own messages
DROP POLICY IF EXISTS "task_messages_update_own" ON task_messages;
CREATE POLICY "task_messages_update_own" ON task_messages
  FOR UPDATE
  USING (auth.uid()::text = user_id);

-- DELETE: users can only delete their own messages,
-- or superadmin/admin can delete any
DROP POLICY IF EXISTS "task_messages_delete_own" ON task_messages;
CREATE POLICY "task_messages_delete_own" ON task_messages
  FOR DELETE
  USING (
    auth.uid()::text = user_id
    OR current_user_role() IN ('superadmin', 'admin')
  );


-- ============================================================
-- 4. PRESUPUESTOS (budgets/quotes linked to tasks)
-- ============================================================
ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;

-- SELECT: any authenticated user can read presupuestos
DROP POLICY IF EXISTS "presupuestos_select" ON presupuestos;
CREATE POLICY "presupuestos_select" ON presupuestos
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- INSERT: any authenticated user can create a presupuesto
DROP POLICY IF EXISTS "presupuestos_insert" ON presupuestos;
CREATE POLICY "presupuestos_insert" ON presupuestos
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: only admin, embudo, or superadmin can approve/reject
-- (status transitions happen via UPDATE)
DROP POLICY IF EXISTS "presupuestos_update" ON presupuestos;
CREATE POLICY "presupuestos_update" ON presupuestos
  FOR UPDATE
  USING (
    current_user_role() IN ('superadmin', 'admin', 'embudo')
  );

-- DELETE: only superadmin can delete presupuestos
DROP POLICY IF EXISTS "presupuestos_delete" ON presupuestos;
CREATE POLICY "presupuestos_delete" ON presupuestos
  FOR DELETE
  USING (
    current_user_role() = 'superadmin'
  );


-- ============================================================
-- 5. PROVEEDORES (vendor directory)
-- ============================================================
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;

-- SELECT: any authenticated user can read proveedores
DROP POLICY IF EXISTS "proveedores_select" ON proveedores;
CREATE POLICY "proveedores_select" ON proveedores
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- INSERT: any authenticated user can add a proveedor
DROP POLICY IF EXISTS "proveedores_insert" ON proveedores;
CREATE POLICY "proveedores_insert" ON proveedores
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: only admin, embudo, or superadmin can modify proveedores
DROP POLICY IF EXISTS "proveedores_update" ON proveedores;
CREATE POLICY "proveedores_update" ON proveedores
  FOR UPDATE
  USING (
    current_user_role() IN ('superadmin', 'admin', 'embudo')
  );

-- DELETE: only superadmin can delete proveedores
DROP POLICY IF EXISTS "proveedores_delete" ON proveedores;
CREATE POLICY "proveedores_delete" ON proveedores
  FOR DELETE
  USING (
    current_user_role() = 'superadmin'
  );


-- ============================================================
-- 6. REMINDERS (personal reminders per user)
-- ============================================================
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- SELECT: users can only see reminders they created or that are
-- assigned to them
DROP POLICY IF EXISTS "reminders_select_own" ON reminders;
CREATE POLICY "reminders_select_own" ON reminders
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.uid() = assigned_to
  );

-- INSERT: any authenticated user can create a reminder
DROP POLICY IF EXISTS "reminders_insert" ON reminders;
CREATE POLICY "reminders_insert" ON reminders
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: only the creator can modify their own reminders
DROP POLICY IF EXISTS "reminders_update_own" ON reminders;
CREATE POLICY "reminders_update_own" ON reminders
  FOR UPDATE
  USING (auth.uid() = user_id);

-- DELETE: only the creator can delete their own reminders
DROP POLICY IF EXISTS "reminders_delete_own" ON reminders;
CREATE POLICY "reminders_delete_own" ON reminders
  FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================
-- 7. AGENDAS (meeting agendas)
-- ============================================================
ALTER TABLE agendas ENABLE ROW LEVEL SECURITY;

-- SELECT: any authenticated user can read agendas
DROP POLICY IF EXISTS "agendas_select" ON agendas;
CREATE POLICY "agendas_select" ON agendas
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- INSERT: any authenticated user can create agendas
DROP POLICY IF EXISTS "agendas_insert" ON agendas;
CREATE POLICY "agendas_insert" ON agendas
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: any authenticated user can update agendas
-- (collaborative editing during meetings)
DROP POLICY IF EXISTS "agendas_update" ON agendas;
CREATE POLICY "agendas_update" ON agendas
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- DELETE: only superadmin/admin can delete agendas
DROP POLICY IF EXISTS "agendas_delete" ON agendas;
CREATE POLICY "agendas_delete" ON agendas
  FOR DELETE
  USING (
    current_user_role() IN ('superadmin', 'admin')
  );


-- ============================================================
-- 8. MINUTAS (meeting minutes)
-- ============================================================
ALTER TABLE minutas ENABLE ROW LEVEL SECURITY;

-- SELECT: any authenticated user can read minutas
DROP POLICY IF EXISTS "minutas_select" ON minutas;
CREATE POLICY "minutas_select" ON minutas
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- INSERT: any authenticated user can create minutas
DROP POLICY IF EXISTS "minutas_insert" ON minutas;
CREATE POLICY "minutas_insert" ON minutas
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: any authenticated user can update minutas
DROP POLICY IF EXISTS "minutas_update" ON minutas;
CREATE POLICY "minutas_update" ON minutas
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- DELETE: only superadmin/admin can delete minutas
DROP POLICY IF EXISTS "minutas_delete" ON minutas;
CREATE POLICY "minutas_delete" ON minutas
  FOR DELETE
  USING (
    current_user_role() IN ('superadmin', 'admin')
  );


-- ============================================================
-- 9. ORG_MEMBERS (Comision Directiva & Secretaria Ejecutiva)
-- ============================================================
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

-- SELECT: any authenticated user can read org_members
DROP POLICY IF EXISTS "org_members_select" ON org_members;
CREATE POLICY "org_members_select" ON org_members
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- INSERT: only superadmin can add org members
DROP POLICY IF EXISTS "org_members_insert" ON org_members;
CREATE POLICY "org_members_insert" ON org_members
  FOR INSERT
  WITH CHECK (
    current_user_role() = 'superadmin'
  );

-- UPDATE: only superadmin can update org members
DROP POLICY IF EXISTS "org_members_update" ON org_members;
CREATE POLICY "org_members_update" ON org_members
  FOR UPDATE
  USING (
    current_user_role() = 'superadmin'
  );

-- DELETE: only superadmin can delete org members
DROP POLICY IF EXISTS "org_members_delete" ON org_members;
CREATE POLICY "org_members_delete" ON org_members
  FOR DELETE
  USING (
    current_user_role() = 'superadmin'
  );


-- ============================================================
-- 10. MILESTONES (project milestones / hitos)
-- ============================================================
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- SELECT: any authenticated user can read milestones
DROP POLICY IF EXISTS "milestones_select" ON milestones;
CREATE POLICY "milestones_select" ON milestones
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- INSERT: only admin/superadmin can create milestones
DROP POLICY IF EXISTS "milestones_insert" ON milestones;
CREATE POLICY "milestones_insert" ON milestones
  FOR INSERT
  WITH CHECK (
    current_user_role() IN ('superadmin', 'admin')
  );

-- UPDATE: only admin/superadmin can update milestones
DROP POLICY IF EXISTS "milestones_update" ON milestones;
CREATE POLICY "milestones_update" ON milestones
  FOR UPDATE
  USING (
    current_user_role() IN ('superadmin', 'admin')
  );

-- DELETE: only superadmin can delete milestones
DROP POLICY IF EXISTS "milestones_delete" ON milestones;
CREATE POLICY "milestones_delete" ON milestones
  FOR DELETE
  USING (
    current_user_role() = 'superadmin'
  );


-- ============================================================
-- 11. NOTIFICATIONS (per-user notifications)
-- ============================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- SELECT: users can only see their own notifications
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: any authenticated user can create notifications
-- (the app creates them server-side via service_role, but
-- this allows client-side creation too if needed)
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: users can only update their own notifications
-- (primarily for marking as read)
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- DELETE: users can delete their own notifications
DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own" ON notifications
  FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================
-- DONE
-- ============================================================
-- Notes:
--   - The service_role key always bypasses RLS, so all server-side
--     operations (API routes, triggers, functions using SECURITY
--     DEFINER) are unaffected by these policies.
--   - The current_user_role() helper is marked SECURITY DEFINER
--     so it can read profiles even during policy evaluation.
--   - All DROP POLICY IF EXISTS + CREATE POLICY pairs make this
--     script safe to re-run (idempotent).
-- ============================================================
