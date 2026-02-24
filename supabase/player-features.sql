-- ═══════════════════════════════════════════════════════════
-- Migration: Player features + RPE + Announcements + Apto Médico
-- ═══════════════════════════════════════════════════════════

-- 1. New columns on dep_athletes
ALTER TABLE dep_athletes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE dep_athletes ADD COLUMN IF NOT EXISTS medical_cert_date DATE;
ALTER TABLE dep_athletes ADD COLUMN IF NOT EXISTS medical_cert_expiry DATE;

-- 2. RPE (Rate of Perceived Exertion) per session per athlete
CREATE TABLE IF NOT EXISTS dep_rpe (
  id SERIAL PRIMARY KEY,
  athlete_id INT NOT NULL REFERENCES dep_athletes(id),
  session_id INT NOT NULL REFERENCES dep_training_sessions(id),
  rpe INT NOT NULL CHECK (rpe BETWEEN 1 AND 10),
  duration_min INT NOT NULL,
  training_load INT GENERATED ALWAYS AS (rpe * duration_min) STORED,
  recorded_by TEXT NOT NULL DEFAULT 'self',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(athlete_id, session_id)
);

-- 3. Announcements (replaces WhatsApp comm)
CREATE TABLE IF NOT EXISTS dep_announcements (
  id SERIAL PRIMARY KEY,
  division TEXT,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT '',
  title TEXT,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'aviso',
  pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ RLS ═══
ALTER TABLE dep_rpe ENABLE ROW LEVEL SECURITY;
ALTER TABLE dep_announcements ENABLE ROW LEVEL SECURITY;

-- RPE: everyone reads, staff + linked players can insert
CREATE POLICY dep_rpe_select ON dep_rpe FOR SELECT USING (true);
CREATE POLICY dep_rpe_staff ON dep_rpe FOR ALL USING (is_admin() OR is_dep_staff());
CREATE POLICY dep_rpe_player ON dep_rpe FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Announcements: everyone reads, staff writes
CREATE POLICY dep_announcements_select ON dep_announcements FOR SELECT USING (true);
CREATE POLICY dep_announcements_manage ON dep_announcements FOR ALL USING (is_admin() OR is_dep_staff());

-- Allow players to insert/update their own attendance
CREATE POLICY dep_attendance_player_write ON dep_attendance
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY dep_attendance_player_update ON dep_attendance
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Allow players to insert/update their own checkins (wellness)
CREATE POLICY dep_checkins_player_write ON dep_checkins
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY dep_checkins_player_update ON dep_checkins
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Allow players to read training sessions
-- (already has dep_training_sessions select policy)

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
