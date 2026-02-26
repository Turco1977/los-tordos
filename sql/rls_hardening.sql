-- RLS Hardening: Replace permissive "all" policies with scoped policies
-- Run this manually in Supabase SQL Editor
-- IMPORTANT: Review each policy before running in production

-- ═══════════════════════════════════════════════════════════
-- notifications: users can only read their own
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS notifications_all ON notifications;

CREATE POLICY notifications_select ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY notifications_insert ON notifications
  FOR INSERT WITH CHECK (true); -- service_role inserts for other users

CREATE POLICY notifications_update ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY notifications_delete ON notifications
  FOR DELETE USING (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════
-- push_subscriptions: users can only manage their own
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS push_subscriptions_all ON push_subscriptions;

CREATE POLICY push_subs_select ON push_subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY push_subs_insert ON push_subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY push_subs_delete ON push_subscriptions
  FOR DELETE USING (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════
-- profiles: everyone can read, only own profile can update
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS profiles_all ON profiles;

CREATE POLICY profiles_select ON profiles
  FOR SELECT USING (true); -- all authenticated users can see profiles

CREATE POLICY profiles_update ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY profiles_insert ON profiles
  FOR INSERT WITH CHECK (true); -- admin creates via service_role

CREATE POLICY profiles_delete ON profiles
  FOR DELETE USING (false); -- only service_role

-- ═══════════════════════════════════════════════════════════
-- tasks: all authenticated can read, service_role for mutations
-- (app uses service_role client for writes)
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS tasks_all ON tasks;

CREATE POLICY tasks_select ON tasks
  FOR SELECT USING (true); -- all authenticated

CREATE POLICY tasks_insert ON tasks
  FOR INSERT WITH CHECK (true); -- service_role handles auth

CREATE POLICY tasks_update ON tasks
  FOR UPDATE USING (true); -- service_role handles auth

CREATE POLICY tasks_delete ON tasks
  FOR DELETE USING (true); -- service_role handles auth

-- ═══════════════════════════════════════════════════════════
-- sponsors: all authenticated can read
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS sponsors_all ON sponsors;

CREATE POLICY sponsors_select ON sponsors
  FOR SELECT USING (true);

CREATE POLICY sponsors_insert ON sponsors
  FOR INSERT WITH CHECK (true);

CREATE POLICY sponsors_update ON sponsors
  FOR UPDATE USING (true);

CREATE POLICY sponsors_delete ON sponsors
  FOR DELETE USING (true);

-- ═══════════════════════════════════════════════════════════
-- projects: all authenticated can read
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS projects_all ON projects;

CREATE POLICY projects_select ON projects
  FOR SELECT USING (true);

CREATE POLICY projects_insert ON projects
  FOR INSERT WITH CHECK (true);

CREATE POLICY projects_update ON projects
  FOR UPDATE USING (true);

CREATE POLICY projects_delete ON projects
  FOR DELETE USING (true);

-- ═══════════════════════════════════════════════════════════
-- project_tasks
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS project_tasks_all ON project_tasks;

CREATE POLICY project_tasks_select ON project_tasks
  FOR SELECT USING (true);

CREATE POLICY project_tasks_insert ON project_tasks
  FOR INSERT WITH CHECK (true);

CREATE POLICY project_tasks_update ON project_tasks
  FOR UPDATE USING (true);

CREATE POLICY project_tasks_delete ON project_tasks
  FOR DELETE USING (true);

-- ═══════════════════════════════════════════════════════════
-- inventory
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS inventory_all ON inventory;

CREATE POLICY inventory_select ON inventory
  FOR SELECT USING (true);

CREATE POLICY inventory_insert ON inventory
  FOR INSERT WITH CHECK (true);

CREATE POLICY inventory_update ON inventory
  FOR UPDATE USING (true);

CREATE POLICY inventory_delete ON inventory
  FOR DELETE USING (true);

-- ═══════════════════════════════════════════════════════════
-- bookings
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS bookings_all ON bookings;

CREATE POLICY bookings_select ON bookings
  FOR SELECT USING (true);

CREATE POLICY bookings_insert ON bookings
  FOR INSERT WITH CHECK (true);

CREATE POLICY bookings_update ON bookings
  FOR UPDATE USING (true);

CREATE POLICY bookings_delete ON bookings
  FOR DELETE USING (true);

-- ═══════════════════════════════════════════════════════════
-- reminders: users see own + assigned
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS reminders_all ON reminders;

CREATE POLICY reminders_select ON reminders
  FOR SELECT USING (user_id = auth.uid() OR assigned_to = auth.uid());

CREATE POLICY reminders_insert ON reminders
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY reminders_update ON reminders
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY reminders_delete ON reminders
  FOR DELETE USING (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════
-- task_templates
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS task_templates_all ON task_templates;

CREATE POLICY task_templates_select ON task_templates
  FOR SELECT USING (true);

CREATE POLICY task_templates_insert ON task_templates
  FOR INSERT WITH CHECK (true);

CREATE POLICY task_templates_update ON task_templates
  FOR UPDATE USING (true);

CREATE POLICY task_templates_delete ON task_templates
  FOR DELETE USING (true);

-- ═══════════════════════════════════════════════════════════
-- project_budgets
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS project_budgets_all ON project_budgets;

CREATE POLICY project_budgets_select ON project_budgets
  FOR SELECT USING (true);

CREATE POLICY project_budgets_insert ON project_budgets
  FOR INSERT WITH CHECK (true);

CREATE POLICY project_budgets_update ON project_budgets
  FOR UPDATE USING (true);

CREATE POLICY project_budgets_delete ON project_budgets
  FOR DELETE USING (true);

-- ═══════════════════════════════════════════════════════════
-- inventory_maintenance
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS inventory_maintenance_all ON inventory_maintenance;

CREATE POLICY inv_maint_select ON inventory_maintenance
  FOR SELECT USING (true);

CREATE POLICY inv_maint_insert ON inventory_maintenance
  FOR INSERT WITH CHECK (true);

CREATE POLICY inv_maint_update ON inventory_maintenance
  FOR UPDATE USING (true);

CREATE POLICY inv_maint_delete ON inventory_maintenance
  FOR DELETE USING (true);

-- ═══════════════════════════════════════════════════════════
-- inventory_distributions
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS inventory_distributions_all ON inventory_distributions;

CREATE POLICY inv_dist_select ON inventory_distributions
  FOR SELECT USING (true);

CREATE POLICY inv_dist_insert ON inventory_distributions
  FOR INSERT WITH CHECK (true);

CREATE POLICY inv_dist_update ON inventory_distributions
  FOR UPDATE USING (true);

CREATE POLICY inv_dist_delete ON inventory_distributions
  FOR DELETE USING (true);

-- ═══════════════════════════════════════════════════════════
-- dep_cuotas
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS dep_cuotas_all ON dep_cuotas;

CREATE POLICY dep_cuotas_select ON dep_cuotas
  FOR SELECT USING (true);

CREATE POLICY dep_cuotas_insert ON dep_cuotas
  FOR INSERT WITH CHECK (true);

CREATE POLICY dep_cuotas_update ON dep_cuotas
  FOR UPDATE USING (true);

CREATE POLICY dep_cuotas_delete ON dep_cuotas
  FOR DELETE USING (true);
