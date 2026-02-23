-- ═══════════════════════════════════════════════════════════
-- Los Tordos — Dep Athletes: new fields migration
-- Adds: sexo, categoria, obra_social, peso, estatura,
--       celular, tel_emergencia, ult_fichaje
-- ═══════════════════════════════════════════════════════════

ALTER TABLE dep_athletes ADD COLUMN IF NOT EXISTS sexo TEXT DEFAULT '';
ALTER TABLE dep_athletes ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT '';
ALTER TABLE dep_athletes ADD COLUMN IF NOT EXISTS obra_social TEXT DEFAULT '';
ALTER TABLE dep_athletes ADD COLUMN IF NOT EXISTS peso NUMERIC;
ALTER TABLE dep_athletes ADD COLUMN IF NOT EXISTS estatura NUMERIC;
ALTER TABLE dep_athletes ADD COLUMN IF NOT EXISTS celular TEXT DEFAULT '';
ALTER TABLE dep_athletes ADD COLUMN IF NOT EXISTS tel_emergencia TEXT DEFAULT '';
ALTER TABLE dep_athletes ADD COLUMN IF NOT EXISTS ult_fichaje DATE;
