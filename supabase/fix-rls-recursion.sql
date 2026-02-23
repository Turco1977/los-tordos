-- ═══════════════════════════════════════════════════════════
-- Fix: infinite recursion in dep_staff RLS policies
-- Solution: SECURITY DEFINER function that bypasses RLS
-- ═══════════════════════════════════════════════════════════

-- Helper function: check if current user is dep_staff (bypasses RLS)
CREATE OR REPLACE FUNCTION is_dep_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM dep_staff WHERE user_id = auth.uid() AND active
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: check if current user is dep director (dd/dr)
CREATE OR REPLACE FUNCTION is_dep_director()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM dep_staff WHERE user_id = auth.uid() AND dep_role IN ('dd', 'dr') AND active
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── Fix dep_staff policies ───
DROP POLICY IF EXISTS dep_staff_select ON dep_staff;
DROP POLICY IF EXISTS dep_staff_manage ON dep_staff;
DROP POLICY IF EXISTS dep_staff_insert ON dep_staff;
DROP POLICY IF EXISTS dep_staff_update ON dep_staff;
DROP POLICY IF EXISTS dep_staff_delete ON dep_staff;

CREATE POLICY dep_staff_select ON dep_staff FOR SELECT USING (true);
CREATE POLICY dep_staff_insert ON dep_staff FOR INSERT WITH CHECK (is_admin() OR is_dep_director());
CREATE POLICY dep_staff_update ON dep_staff FOR UPDATE USING (is_admin() OR is_dep_director());
CREATE POLICY dep_staff_delete ON dep_staff FOR DELETE USING (is_admin() OR is_dep_director());

-- ─── Fix dep_athletes policies ───
DROP POLICY IF EXISTS dep_athletes_select ON dep_athletes;
DROP POLICY IF EXISTS dep_athletes_manage ON dep_athletes;
DROP POLICY IF EXISTS dep_athletes_insert ON dep_athletes;
DROP POLICY IF EXISTS dep_athletes_update ON dep_athletes;
DROP POLICY IF EXISTS dep_athletes_delete ON dep_athletes;

CREATE POLICY dep_athletes_select ON dep_athletes FOR SELECT USING (true);
CREATE POLICY dep_athletes_insert ON dep_athletes FOR INSERT WITH CHECK (is_admin() OR is_dep_staff());
CREATE POLICY dep_athletes_update ON dep_athletes FOR UPDATE USING (is_admin() OR is_dep_staff());
CREATE POLICY dep_athletes_delete ON dep_athletes FOR DELETE USING (is_admin() OR is_dep_staff());

-- ─── Fix dep_injuries policies ───
DROP POLICY IF EXISTS dep_injuries_select ON dep_injuries;
DROP POLICY IF EXISTS dep_injuries_manage ON dep_injuries;

CREATE POLICY dep_injuries_select ON dep_injuries FOR SELECT USING (true);
CREATE POLICY dep_injuries_manage ON dep_injuries FOR ALL USING (is_admin() OR is_dep_staff());

-- ─── Fix dep_checkins policies ───
DROP POLICY IF EXISTS dep_checkins_select ON dep_checkins;
DROP POLICY IF EXISTS dep_checkins_manage ON dep_checkins;

CREATE POLICY dep_checkins_select ON dep_checkins FOR SELECT USING (true);
CREATE POLICY dep_checkins_manage ON dep_checkins FOR ALL USING (is_admin() OR is_dep_staff());

-- ─── Fix dep_attendance policies ───
DROP POLICY IF EXISTS dep_attendance_select ON dep_attendance;
DROP POLICY IF EXISTS dep_attendance_manage ON dep_attendance;

CREATE POLICY dep_attendance_select ON dep_attendance FOR SELECT USING (true);
CREATE POLICY dep_attendance_manage ON dep_attendance FOR ALL USING (is_admin() OR is_dep_staff());

-- ─── Fix new table policies (if they exist) ───
DO $$ BEGIN
  DROP POLICY IF EXISTS dep_seasons_manage ON dep_seasons;
  CREATE POLICY dep_seasons_manage ON dep_seasons FOR ALL USING (is_admin() OR is_dep_staff());
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS dep_phases_manage ON dep_phases;
  CREATE POLICY dep_phases_manage ON dep_phases FOR ALL USING (is_admin() OR is_dep_staff());
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS dep_microcycles_manage ON dep_microcycles;
  CREATE POLICY dep_microcycles_manage ON dep_microcycles FOR ALL USING (is_admin() OR is_dep_staff());
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS dep_test_types_manage ON dep_test_types;
  CREATE POLICY dep_test_types_manage ON dep_test_types FOR ALL USING (is_admin() OR is_dep_staff());
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS dep_tests_manage ON dep_tests;
  CREATE POLICY dep_tests_manage ON dep_tests FOR ALL USING (is_admin() OR is_dep_staff());
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS dep_lineups_manage ON dep_lineups;
  CREATE POLICY dep_lineups_manage ON dep_lineups FOR ALL USING (is_admin() OR is_dep_staff());
EXCEPTION WHEN undefined_table THEN NULL; END $$;
