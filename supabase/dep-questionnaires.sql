-- ═══════════════════════════════════════════════════════════
-- Migration: Cuestionarios personalizados (Staff → Jugadores)
-- ═══════════════════════════════════════════════════════════

-- 1. Questionnaires (created by staff)
CREATE TABLE IF NOT EXISTS dep_questionnaires (
  id SERIAL PRIMARY KEY,
  division TEXT,                          -- NULL = todas las divisiones
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  questions JSONB NOT NULL DEFAULT '[]',  -- [{id, text, type, options?}]
  status TEXT NOT NULL DEFAULT 'activo',  -- 'activo' | 'cerrado'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Responses (one per athlete per questionnaire)
CREATE TABLE IF NOT EXISTS dep_questionnaire_responses (
  id SERIAL PRIMARY KEY,
  questionnaire_id INT NOT NULL REFERENCES dep_questionnaires(id) ON DELETE CASCADE,
  athlete_id INT NOT NULL REFERENCES dep_athletes(id),
  answers JSONB NOT NULL DEFAULT '{}',    -- {q1: val, q2: val, ...}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(questionnaire_id, athlete_id)
);

-- ═══ RLS ═══
ALTER TABLE dep_questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE dep_questionnaire_responses ENABLE ROW LEVEL SECURITY;

-- Questionnaires: everyone reads
CREATE POLICY "dep_questionnaires_select" ON dep_questionnaires FOR SELECT USING (true);
-- Staff inserts/updates/deletes
CREATE POLICY "dep_questionnaires_insert" ON dep_questionnaires FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "dep_questionnaires_update" ON dep_questionnaires FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "dep_questionnaires_delete" ON dep_questionnaires FOR DELETE USING (auth.uid() IS NOT NULL);

-- Responses: everyone reads
CREATE POLICY "dep_qr_select" ON dep_questionnaire_responses FOR SELECT USING (true);
-- Any authenticated user can insert/update their response
CREATE POLICY "dep_qr_insert" ON dep_questionnaire_responses FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "dep_qr_update" ON dep_questionnaire_responses FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ═══ Indices ═══
CREATE INDEX IF NOT EXISTS idx_dep_qr_questionnaire ON dep_questionnaire_responses(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_dep_qr_athlete ON dep_questionnaire_responses(athlete_id);
CREATE INDEX IF NOT EXISTS idx_dep_questionnaires_status ON dep_questionnaires(status);

-- Notify PostgREST to pick up schema changes
NOTIFY pgrst, 'reload schema';
