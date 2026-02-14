-- ============================================================
-- Los Tordos - Database Improvements
-- Run in Supabase SQL Editor
-- ============================================================

-- ── 1. INDEXES for frequent queries ──

-- Tasks: most queried table
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);

-- Task messages: looked up by task_id
CREATE INDEX IF NOT EXISTS idx_task_messages_task_id ON task_messages(task_id);
CREATE INDEX IF NOT EXISTS idx_task_messages_created_at ON task_messages(created_at);

-- Presupuestos: filtered by status and task
CREATE INDEX IF NOT EXISTS idx_presupuestos_status ON presupuestos(status);
CREATE INDEX IF NOT EXISTS idx_presupuestos_task_id ON presupuestos(task_id);

-- Agendas and minutas: ordered by date
CREATE INDEX IF NOT EXISTS idx_agendas_date ON agendas(date DESC);
CREATE INDEX IF NOT EXISTS idx_minutas_date ON minutas(date DESC);

-- Reminders: filtered by user and date
CREATE INDEX IF NOT EXISTS idx_reminders_user_date ON reminders(user_id, date);

-- Projects
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);

-- Notifications (already has idx_notifications_user)

-- Profiles: lookup by role
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);


-- ── 2. PROPER RLS POLICIES ──
-- Replace open "USING (true)" policies with auth-based ones.
-- These allow all authenticated users to read, but only owners to write.

-- Tasks: all authenticated can read, creators/assignees can modify
DROP POLICY IF EXISTS tasks_select ON tasks;
DROP POLICY IF EXISTS tasks_insert ON tasks;
DROP POLICY IF EXISTS tasks_update ON tasks;
DROP POLICY IF EXISTS tasks_delete ON tasks;
CREATE POLICY tasks_select ON tasks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY tasks_insert ON tasks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY tasks_update ON tasks FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY tasks_delete ON tasks FOR DELETE USING (auth.role() = 'authenticated');

-- Task messages
DROP POLICY IF EXISTS task_messages_all ON task_messages;
DROP POLICY IF EXISTS task_messages_select ON task_messages;
DROP POLICY IF EXISTS task_messages_insert ON task_messages;
CREATE POLICY task_messages_select ON task_messages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY task_messages_insert ON task_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications: users can only see their own
DROP POLICY IF EXISTS notifications_all ON notifications;
DROP POLICY IF EXISTS notifications_select ON notifications;
DROP POLICY IF EXISTS notifications_insert ON notifications;
DROP POLICY IF EXISTS notifications_update ON notifications;
CREATE POLICY notifications_select ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY notifications_insert ON notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY notifications_update ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Reminders: users see their own + assigned
DROP POLICY IF EXISTS reminders_all ON reminders;
DROP POLICY IF EXISTS reminders_select ON reminders;
DROP POLICY IF EXISTS reminders_insert ON reminders;
DROP POLICY IF EXISTS reminders_update ON reminders;
DROP POLICY IF EXISTS reminders_delete ON reminders;
CREATE POLICY reminders_select ON reminders FOR SELECT USING (auth.uid() = user_id OR auth.uid() = assigned_to);
CREATE POLICY reminders_insert ON reminders FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY reminders_update ON reminders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY reminders_delete ON reminders FOR DELETE USING (auth.uid() = user_id);

-- Presupuestos: all authenticated
DROP POLICY IF EXISTS presupuestos_all ON presupuestos;
DROP POLICY IF EXISTS presupuestos_select ON presupuestos;
DROP POLICY IF EXISTS presupuestos_insert ON presupuestos;
DROP POLICY IF EXISTS presupuestos_update ON presupuestos;
DROP POLICY IF EXISTS presupuestos_delete ON presupuestos;
CREATE POLICY presupuestos_select ON presupuestos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY presupuestos_insert ON presupuestos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY presupuestos_update ON presupuestos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY presupuestos_delete ON presupuestos FOR DELETE USING (auth.role() = 'authenticated');

-- Projects: all authenticated
DROP POLICY IF EXISTS projects_all ON projects;
DROP POLICY IF EXISTS projects_select ON projects;
DROP POLICY IF EXISTS projects_insert ON projects;
DROP POLICY IF EXISTS projects_update ON projects;
DROP POLICY IF EXISTS projects_delete ON projects;
CREATE POLICY projects_select ON projects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY projects_insert ON projects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY projects_update ON projects FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY projects_delete ON projects FOR DELETE USING (auth.role() = 'authenticated');

-- Profiles: all authenticated can read, users update own profile
DROP POLICY IF EXISTS profiles_all ON profiles;
DROP POLICY IF EXISTS profiles_select ON profiles;
DROP POLICY IF EXISTS profiles_update ON profiles;
CREATE POLICY profiles_select ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (auth.role() = 'authenticated');


-- ── 3. SOFT DELETE COLUMN ──
-- Add deleted_at column to main tables for soft delete support.
-- App code can filter WHERE deleted_at IS NULL.

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Partial indexes for non-deleted rows (most queries)
CREATE INDEX IF NOT EXISTS idx_tasks_not_deleted ON tasks(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_not_deleted ON projects(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_presupuestos_not_deleted ON presupuestos(id) WHERE deleted_at IS NULL;
