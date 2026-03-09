-- ═══════════════════════════════════════════════════════════════════
-- Los Tordos — Fix ALL Security Advisor Errors
-- Run this ONCE in Supabase SQL Editor → New Query → Run
-- Safe to re-run (idempotent)
-- ═══════════════════════════════════════════════════════════════════

-- ┌─────────────────────────────────────────────────────────────────┐
-- │ STEP 1: Fix helper functions (search_path warning)             │
-- └─────────────────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT public.get_user_role() IN ('superadmin', 'admin')
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';

CREATE OR REPLACE FUNCTION is_coordinator_or_above()
RETURNS BOOLEAN AS $$
  SELECT public.get_user_role() IN ('superadmin', 'admin', 'coordinador', 'embudo')
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';

CREATE OR REPLACE FUNCTION is_dep_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dep_staff WHERE user_id = auth.uid() AND active
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';

CREATE OR REPLACE FUNCTION is_dep_director()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dep_staff WHERE user_id = auth.uid() AND dep_role IN ('dd', 'dr') AND active
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';

-- ┌─────────────────────────────────────────────────────────────────┐
-- │ STEP 2: ENABLE RLS on ALL tables                               │
-- │ This is the main fix — policies exist but RLS was never ON     │
-- └─────────────────────────────────────────────────────────────────┘

-- Core tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE minutas ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Projects & tasks
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

-- Bookings & rentals
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN ALTER TABLE rental_config ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- Inventory
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN ALTER TABLE inventory_maintenance ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE inventory_distributions ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- Sponsors
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN ALTER TABLE sponsor_deliveries ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE sponsor_contracts ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE sponsor_pipeline ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE sponsor_contactos ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE sponsor_propuestas ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE sponsor_propuestas_votos ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE sponsor_propuestas_mensajes ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE sponsor_materiales ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE sponsor_pagos ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE sponsor_messages ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE hospitalidad_invitaciones ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE tarifario ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- Torneos & fixtures
DO $$ BEGIN ALTER TABLE torneos ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE torneo_hitos ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE torneo_clubes ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE fixtures ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- Becas & atención socio
DO $$ BEGIN ALTER TABLE becas ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE becas_mensajes ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE atencion_socio_casos ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE atencion_socio_votos ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- Archivos & DMs
DO $$ BEGIN ALTER TABLE archivos ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE dm_messages ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- Push subscriptions
DO $$ BEGIN ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- Deportivo
DO $$ BEGIN ALTER TABLE dep_staff ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE dep_athletes ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE dep_injuries ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE dep_checkins ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE dep_training_sessions ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE dep_attendance ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE dep_seasons ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE dep_phases ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE dep_microcycles ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE dep_test_types ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE dep_tests ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE dep_lineups ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE dep_cuotas ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE dep_questionnaires ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE dep_questionnaire_responses ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE dep_rpe ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE dep_announcements ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- Viajes
DO $$ BEGIN ALTER TABLE viajes ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE viaje_historial ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ┌─────────────────────────────────────────────────────────────────┐
-- │ STEP 3: Create policies for tables that might be missing them  │
-- │ Using DO blocks to safely skip tables that don't exist         │
-- └─────────────────────────────────────────────────────────────────┘

-- ─── RENTAL CONFIG ───
DO $$ BEGIN
  DROP POLICY IF EXISTS rental_config_select ON rental_config;
  DROP POLICY IF EXISTS rental_config_manage ON rental_config;
  CREATE POLICY rental_config_select ON rental_config FOR SELECT USING (true);
  CREATE POLICY rental_config_manage ON rental_config FOR ALL USING (is_admin());
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ─── DM MESSAGES (users see own conversations) ───
DO $$ BEGIN
  DROP POLICY IF EXISTS dm_messages_select ON dm_messages;
  DROP POLICY IF EXISTS dm_messages_insert ON dm_messages;
  CREATE POLICY dm_messages_select ON dm_messages FOR SELECT USING (
    sender_id = auth.uid() OR receiver_id = auth.uid()
  );
  CREATE POLICY dm_messages_insert ON dm_messages FOR INSERT WITH CHECK (
    sender_id = auth.uid()
  );
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ─── SPONSOR MESSAGES ───
DO $$ BEGIN
  DROP POLICY IF EXISTS sponsor_messages_all ON sponsor_messages;
  CREATE POLICY sponsor_messages_all ON sponsor_messages FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ─── NOTIFICATION PREFERENCES (own only) ───
DO $$ BEGIN
  DROP POLICY IF EXISTS notif_prefs_all ON notification_preferences;
  DROP POLICY IF EXISTS notif_prefs_select ON notification_preferences;
  DROP POLICY IF EXISTS notif_prefs_manage ON notification_preferences;
  CREATE POLICY notif_prefs_select ON notification_preferences FOR SELECT USING (user_id = auth.uid());
  CREATE POLICY notif_prefs_manage ON notification_preferences FOR ALL USING (user_id = auth.uid());
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ─── SPONSOR CONTRACTS ───
DO $$ BEGIN
  DROP POLICY IF EXISTS sponsor_contracts_all ON sponsor_contracts;
  CREATE POLICY sponsor_contracts_all ON sponsor_contracts FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ─── SPONSOR PIPELINE ───
DO $$ BEGIN
  DROP POLICY IF EXISTS sponsor_pipeline_all ON sponsor_pipeline;
  CREATE POLICY sponsor_pipeline_all ON sponsor_pipeline FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ─── SPONSOR CONTACTOS ───
DO $$ BEGIN
  DROP POLICY IF EXISTS sponsor_contactos_all ON sponsor_contactos;
  CREATE POLICY sponsor_contactos_all ON sponsor_contactos FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ─── SPONSOR PROPUESTAS ───
DO $$ BEGIN
  DROP POLICY IF EXISTS sponsor_propuestas_all ON sponsor_propuestas;
  CREATE POLICY sponsor_propuestas_all ON sponsor_propuestas FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ─── SPONSOR PROPUESTAS VOTOS ───
DO $$ BEGIN
  DROP POLICY IF EXISTS sponsor_propuestas_votos_all ON sponsor_propuestas_votos;
  CREATE POLICY sponsor_propuestas_votos_all ON sponsor_propuestas_votos FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ─── SPONSOR PROPUESTAS MENSAJES ───
DO $$ BEGIN
  DROP POLICY IF EXISTS sponsor_propuestas_mensajes_all ON sponsor_propuestas_mensajes;
  CREATE POLICY sponsor_propuestas_mensajes_all ON sponsor_propuestas_mensajes FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ─── SPONSOR MATERIALES ───
DO $$ BEGIN
  DROP POLICY IF EXISTS sponsor_materiales_all ON sponsor_materiales;
  CREATE POLICY sponsor_materiales_all ON sponsor_materiales FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ─── SPONSOR PAGOS ───
DO $$ BEGIN
  DROP POLICY IF EXISTS sponsor_pagos_all ON sponsor_pagos;
  CREATE POLICY sponsor_pagos_all ON sponsor_pagos FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ─── HOSPITALIDAD INVITACIONES ───
DO $$ BEGIN
  DROP POLICY IF EXISTS hospitalidad_invitaciones_all ON hospitalidad_invitaciones;
  CREATE POLICY hospitalidad_invitaciones_all ON hospitalidad_invitaciones FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ─── TARIFARIO ───
DO $$ BEGIN
  DROP POLICY IF EXISTS tarifario_all ON tarifario;
  CREATE POLICY tarifario_all ON tarifario FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ─── TORNEOS ───
DO $$ BEGIN
  DROP POLICY IF EXISTS torneos_all ON torneos;
  CREATE POLICY torneos_all ON torneos FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ─── TORNEO HITOS ───
DO $$ BEGIN
  DROP POLICY IF EXISTS torneo_hitos_all ON torneo_hitos;
  CREATE POLICY torneo_hitos_all ON torneo_hitos FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ─── TORNEO CLUBES ───
DO $$ BEGIN
  DROP POLICY IF EXISTS torneo_clubes_all ON torneo_clubes;
  CREATE POLICY torneo_clubes_all ON torneo_clubes FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ─── FIXTURES ───
DO $$ BEGIN
  DROP POLICY IF EXISTS fixtures_all ON fixtures;
  CREATE POLICY fixtures_all ON fixtures FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ─── BECAS ───
DO $$ BEGIN
  DROP POLICY IF EXISTS becas_all ON becas;
  CREATE POLICY becas_all ON becas FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ─── BECAS MENSAJES ───
DO $$ BEGIN
  DROP POLICY IF EXISTS becas_mensajes_all ON becas_mensajes;
  CREATE POLICY becas_mensajes_all ON becas_mensajes FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ─── ATENCION SOCIO CASOS ───
DO $$ BEGIN
  DROP POLICY IF EXISTS atencion_socio_casos_all ON atencion_socio_casos;
  CREATE POLICY atencion_socio_casos_all ON atencion_socio_casos FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ─── ATENCION SOCIO VOTOS ───
DO $$ BEGIN
  DROP POLICY IF EXISTS atencion_socio_votos_all ON atencion_socio_votos;
  CREATE POLICY atencion_socio_votos_all ON atencion_socio_votos FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ─── ARCHIVOS ───
DO $$ BEGIN
  DROP POLICY IF EXISTS archivos_all ON archivos;
  CREATE POLICY archivos_all ON archivos FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ─── PUSH SUBSCRIPTIONS (own only) ───
DO $$ BEGIN
  DROP POLICY IF EXISTS push_subs_select ON push_subscriptions;
  DROP POLICY IF EXISTS push_subs_insert ON push_subscriptions;
  DROP POLICY IF EXISTS push_subs_delete ON push_subscriptions;
  DROP POLICY IF EXISTS push_subscriptions_all ON push_subscriptions;
  CREATE POLICY push_subs_select ON push_subscriptions FOR SELECT USING (user_id = auth.uid());
  CREATE POLICY push_subs_insert ON push_subscriptions FOR INSERT WITH CHECK (user_id = auth.uid());
  CREATE POLICY push_subs_delete ON push_subscriptions FOR DELETE USING (user_id = auth.uid());
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ─── DEPORTIVO: dep_seasons, dep_phases, dep_microcycles, dep_test_types, dep_tests, dep_lineups ───
DO $$ BEGIN
  DROP POLICY IF EXISTS dep_seasons_select ON dep_seasons;
  DROP POLICY IF EXISTS dep_seasons_manage ON dep_seasons;
  CREATE POLICY dep_seasons_select ON dep_seasons FOR SELECT USING (true);
  CREATE POLICY dep_seasons_manage ON dep_seasons FOR ALL USING (is_admin() OR is_dep_staff());
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS dep_phases_select ON dep_phases;
  DROP POLICY IF EXISTS dep_phases_manage ON dep_phases;
  CREATE POLICY dep_phases_select ON dep_phases FOR SELECT USING (true);
  CREATE POLICY dep_phases_manage ON dep_phases FOR ALL USING (is_admin() OR is_dep_staff());
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS dep_microcycles_select ON dep_microcycles;
  DROP POLICY IF EXISTS dep_microcycles_manage ON dep_microcycles;
  CREATE POLICY dep_microcycles_select ON dep_microcycles FOR SELECT USING (true);
  CREATE POLICY dep_microcycles_manage ON dep_microcycles FOR ALL USING (is_admin() OR is_dep_staff());
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS dep_test_types_select ON dep_test_types;
  DROP POLICY IF EXISTS dep_test_types_manage ON dep_test_types;
  CREATE POLICY dep_test_types_select ON dep_test_types FOR SELECT USING (true);
  CREATE POLICY dep_test_types_manage ON dep_test_types FOR ALL USING (is_admin() OR is_dep_staff());
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS dep_tests_select ON dep_tests;
  DROP POLICY IF EXISTS dep_tests_manage ON dep_tests;
  CREATE POLICY dep_tests_select ON dep_tests FOR SELECT USING (true);
  CREATE POLICY dep_tests_manage ON dep_tests FOR ALL USING (is_admin() OR is_dep_staff());
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS dep_lineups_select ON dep_lineups;
  DROP POLICY IF EXISTS dep_lineups_manage ON dep_lineups;
  CREATE POLICY dep_lineups_select ON dep_lineups FOR SELECT USING (true);
  CREATE POLICY dep_lineups_manage ON dep_lineups FOR ALL USING (is_admin() OR is_dep_staff());
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS dep_cuotas_select ON dep_cuotas;
  DROP POLICY IF EXISTS dep_cuotas_manage ON dep_cuotas;
  DROP POLICY IF EXISTS dep_cuotas_all ON dep_cuotas;
  DROP POLICY IF EXISTS dep_cuotas_insert ON dep_cuotas;
  DROP POLICY IF EXISTS dep_cuotas_update ON dep_cuotas;
  DROP POLICY IF EXISTS dep_cuotas_delete ON dep_cuotas;
  CREATE POLICY dep_cuotas_select ON dep_cuotas FOR SELECT USING (true);
  CREATE POLICY dep_cuotas_manage ON dep_cuotas FOR ALL USING (is_admin() OR is_dep_staff());
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS dep_questionnaires_select ON dep_questionnaires;
  DROP POLICY IF EXISTS dep_questionnaires_manage ON dep_questionnaires;
  CREATE POLICY dep_questionnaires_select ON dep_questionnaires FOR SELECT USING (true);
  CREATE POLICY dep_questionnaires_manage ON dep_questionnaires FOR ALL USING (is_admin() OR is_dep_staff());
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS dep_questionnaire_responses_select ON dep_questionnaire_responses;
  DROP POLICY IF EXISTS dep_questionnaire_responses_manage ON dep_questionnaire_responses;
  CREATE POLICY dep_questionnaire_responses_select ON dep_questionnaire_responses FOR SELECT USING (true);
  CREATE POLICY dep_questionnaire_responses_manage ON dep_questionnaire_responses FOR ALL USING (is_admin() OR is_dep_staff());
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS dep_rpe_select ON dep_rpe;
  DROP POLICY IF EXISTS dep_rpe_manage ON dep_rpe;
  CREATE POLICY dep_rpe_select ON dep_rpe FOR SELECT USING (true);
  CREATE POLICY dep_rpe_manage ON dep_rpe FOR ALL USING (is_admin() OR is_dep_staff());
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS dep_announcements_select ON dep_announcements;
  DROP POLICY IF EXISTS dep_announcements_manage ON dep_announcements;
  CREATE POLICY dep_announcements_select ON dep_announcements FOR SELECT USING (true);
  CREATE POLICY dep_announcements_manage ON dep_announcements FOR ALL USING (is_admin() OR is_dep_staff());
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ─── VIAJES ───
DO $$ BEGIN
  DROP POLICY IF EXISTS viajes_all ON viajes;
  DROP POLICY IF EXISTS viajes_select ON viajes;
  DROP POLICY IF EXISTS viajes_manage ON viajes;
  CREATE POLICY viajes_select ON viajes FOR SELECT USING (auth.uid() IS NOT NULL);
  CREATE POLICY viajes_manage ON viajes FOR ALL USING (is_coordinator_or_above());
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS viaje_historial_all ON viaje_historial;
  DROP POLICY IF EXISTS viaje_historial_select ON viaje_historial;
  CREATE POLICY viaje_historial_select ON viaje_historial FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ═══════════════════════════════════════════════════════════════════
-- DONE! Refresh Security Advisor to verify 0 errors
-- ═══════════════════════════════════════════════════════════════════
