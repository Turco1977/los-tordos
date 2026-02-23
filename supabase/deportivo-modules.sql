-- ═══════════════════════════════════════════════════════════
-- Los Tordos — Deportivo New Modules Migration
-- Tables: seasons, phases, microcycles, tests, test_types, lineups
-- ═══════════════════════════════════════════════════════════

-- ─── DEP_SEASONS ───
CREATE TABLE IF NOT EXISTS dep_seasons (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  division TEXT NOT NULL DEFAULT 'M19',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'activa',
  objectives TEXT DEFAULT '',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE dep_seasons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dep_seasons_select ON dep_seasons;
DROP POLICY IF EXISTS dep_seasons_manage ON dep_seasons;
CREATE POLICY dep_seasons_select ON dep_seasons FOR SELECT USING (true);
CREATE POLICY dep_seasons_manage ON dep_seasons FOR ALL USING (
  is_admin() OR EXISTS (
    SELECT 1 FROM dep_staff WHERE user_id = auth.uid() AND active
  )
);

-- ─── DEP_PHASES ───
CREATE TABLE IF NOT EXISTS dep_phases (
  id SERIAL PRIMARY KEY,
  season_id INT NOT NULL REFERENCES dep_seasons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'pretemporada',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  objectives TEXT DEFAULT '',
  color TEXT DEFAULT '#3B82F6',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE dep_phases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dep_phases_select ON dep_phases;
DROP POLICY IF EXISTS dep_phases_manage ON dep_phases;
CREATE POLICY dep_phases_select ON dep_phases FOR SELECT USING (true);
CREATE POLICY dep_phases_manage ON dep_phases FOR ALL USING (
  is_admin() OR EXISTS (
    SELECT 1 FROM dep_staff WHERE user_id = auth.uid() AND active
  )
);

-- ─── DEP_MICROCYCLES ───
CREATE TABLE IF NOT EXISTS dep_microcycles (
  id SERIAL PRIMARY KEY,
  phase_id INT NOT NULL REFERENCES dep_phases(id) ON DELETE CASCADE,
  week_number INT NOT NULL,
  week_start DATE NOT NULL,
  focus TEXT DEFAULT '',
  intensity INT DEFAULT 5 CHECK (intensity BETWEEN 1 AND 10),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE dep_microcycles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dep_microcycles_select ON dep_microcycles;
DROP POLICY IF EXISTS dep_microcycles_manage ON dep_microcycles;
CREATE POLICY dep_microcycles_select ON dep_microcycles FOR SELECT USING (true);
CREATE POLICY dep_microcycles_manage ON dep_microcycles FOR ALL USING (
  is_admin() OR EXISTS (
    SELECT 1 FROM dep_staff WHERE user_id = auth.uid() AND active
  )
);

-- ─── DEP_TEST_TYPES ───
CREATE TABLE IF NOT EXISTS dep_test_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  description TEXT DEFAULT '',
  benchmark_m19 NUMERIC,
  higher_is_better BOOLEAN DEFAULT true,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE dep_test_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dep_test_types_select ON dep_test_types;
DROP POLICY IF EXISTS dep_test_types_manage ON dep_test_types;
CREATE POLICY dep_test_types_select ON dep_test_types FOR SELECT USING (true);
CREATE POLICY dep_test_types_manage ON dep_test_types FOR ALL USING (
  is_admin() OR EXISTS (
    SELECT 1 FROM dep_staff WHERE user_id = auth.uid() AND active
  )
);

-- Insert default test types for M19 rugby
INSERT INTO dep_test_types (name, unit, description, benchmark_m19, higher_is_better, category) VALUES
  ('Yo-Yo IR1', 'nivel', 'Test de resistencia intermitente nivel 1', 18, true, 'resistencia'),
  ('Sprint 40m', 'seg', 'Sprint lineal 40 metros', 5.2, false, 'velocidad'),
  ('Sprint 20m', 'seg', 'Sprint lineal 20 metros', 2.9, false, 'velocidad'),
  ('Sentadilla 1RM', 'kg', 'Sentadilla trasera repetición máxima', 120, true, 'fuerza'),
  ('Press Banca 1RM', 'kg', 'Press de banca repetición máxima', 80, true, 'fuerza'),
  ('Peso Muerto 1RM', 'kg', 'Peso muerto repetición máxima', 140, true, 'fuerza'),
  ('CMJ', 'cm', 'Counter Movement Jump — salto vertical', 40, true, 'potencia'),
  ('Flexibilidad', 'cm', 'Sit and reach', 30, true, 'flexibilidad'),
  ('Peso', 'kg', 'Peso corporal', NULL, NULL, 'antropometria'),
  ('% Grasa', '%', 'Porcentaje de grasa corporal', 15, false, 'antropometria')
ON CONFLICT DO NOTHING;

-- ─── DEP_TESTS ───
CREATE TABLE IF NOT EXISTS dep_tests (
  id SERIAL PRIMARY KEY,
  athlete_id INT NOT NULL REFERENCES dep_athletes(id) ON DELETE CASCADE,
  test_type_id INT NOT NULL REFERENCES dep_test_types(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  value NUMERIC NOT NULL,
  notes TEXT DEFAULT '',
  recorded_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE dep_tests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dep_tests_select ON dep_tests;
DROP POLICY IF EXISTS dep_tests_manage ON dep_tests;
CREATE POLICY dep_tests_select ON dep_tests FOR SELECT USING (true);
CREATE POLICY dep_tests_manage ON dep_tests FOR ALL USING (
  is_admin() OR EXISTS (
    SELECT 1 FROM dep_staff WHERE user_id = auth.uid() AND active
  )
);

-- ─── DEP_LINEUPS ───
CREATE TABLE IF NOT EXISTS dep_lineups (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  match_name TEXT NOT NULL DEFAULT '',
  division TEXT NOT NULL DEFAULT 'M19',
  formation JSONB NOT NULL DEFAULT '{}',
  notes TEXT DEFAULT '',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE dep_lineups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dep_lineups_select ON dep_lineups;
DROP POLICY IF EXISTS dep_lineups_manage ON dep_lineups;
CREATE POLICY dep_lineups_select ON dep_lineups FOR SELECT USING (true);
CREATE POLICY dep_lineups_manage ON dep_lineups FOR ALL USING (
  is_admin() OR EXISTS (
    SELECT 1 FROM dep_staff WHERE user_id = auth.uid() AND active
  )
);
