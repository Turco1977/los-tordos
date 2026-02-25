-- ============================================================
-- PHASE 2: Asistencia + Partidos + Calendario
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. ASISTENCIA SESIONES
CREATE TABLE IF NOT EXISTS asistencia_sesiones (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  division TEXT NOT NULL,
  rama TEXT NOT NULL DEFAULT 'femenino',
  tipo_actividad TEXT NOT NULL DEFAULT 'entrenamiento',
  qr_token UUID DEFAULT NULL,
  qr_expires_at TIMESTAMPTZ DEFAULT NULL,
  estado TEXT NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta','cerrada')),
  notas TEXT DEFAULT '',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_asist_sesiones_fecha ON asistencia_sesiones(fecha DESC);
CREATE INDEX idx_asist_sesiones_div ON asistencia_sesiones(division, rama);
CREATE INDEX idx_asist_sesiones_qr ON asistencia_sesiones(qr_token) WHERE qr_token IS NOT NULL;

ALTER TABLE asistencia_sesiones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "asist_sesiones_read" ON asistencia_sesiones FOR SELECT TO authenticated USING (true);
CREATE POLICY "asist_sesiones_write" ON asistencia_sesiones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "asist_sesiones_update" ON asistencia_sesiones FOR UPDATE TO authenticated USING (true);
CREATE POLICY "asist_sesiones_delete" ON asistencia_sesiones FOR DELETE TO authenticated USING (true);

-- 2. ASISTENCIA REGISTROS
CREATE TABLE IF NOT EXISTS asistencia_registros (
  id SERIAL PRIMARY KEY,
  sesion_id INT NOT NULL REFERENCES asistencia_sesiones(id) ON DELETE CASCADE,
  jugadora_id INT NOT NULL REFERENCES dep_athletes(id),
  presente BOOLEAN NOT NULL DEFAULT true,
  metodo TEXT NOT NULL DEFAULT 'manual' CHECK (metodo IN ('manual','qr')),
  hora TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(sesion_id, jugadora_id)
);

CREATE INDEX idx_asist_reg_sesion ON asistencia_registros(sesion_id);
CREATE INDEX idx_asist_reg_jugadora ON asistencia_registros(jugadora_id);

ALTER TABLE asistencia_registros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "asist_reg_read" ON asistencia_registros FOR SELECT TO authenticated USING (true);
CREATE POLICY "asist_reg_write" ON asistencia_registros FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "asist_reg_update" ON asistencia_registros FOR UPDATE TO authenticated USING (true);
CREATE POLICY "asist_reg_delete" ON asistencia_registros FOR DELETE TO authenticated USING (true);
-- QR anonymous insert (public page)
CREATE POLICY "asist_reg_anon_insert" ON asistencia_registros FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "asist_sesiones_anon_read" ON asistencia_sesiones FOR SELECT TO anon USING (qr_token IS NOT NULL);

-- 3. PARTIDOS
CREATE TABLE IF NOT EXISTS partidos (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  hora TIME DEFAULT NULL,
  division TEXT NOT NULL,
  rama TEXT NOT NULL DEFAULT 'femenino',
  rival TEXT NOT NULL,
  sede TEXT NOT NULL DEFAULT 'local' CHECK (sede IN ('local','visitante','neutral')),
  competencia TEXT NOT NULL DEFAULT 'amistoso',
  goles_favor INT DEFAULT 0,
  goles_contra INT DEFAULT 0,
  resultado TEXT GENERATED ALWAYS AS (
    CASE
      WHEN goles_favor > goles_contra THEN 'V'
      WHEN goles_favor < goles_contra THEN 'D'
      ELSE 'E'
    END
  ) STORED,
  notas TEXT DEFAULT '',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_partidos_fecha ON partidos(fecha DESC);
CREATE INDEX idx_partidos_div ON partidos(division, rama);

ALTER TABLE partidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "partidos_read" ON partidos FOR SELECT TO authenticated USING (true);
CREATE POLICY "partidos_write" ON partidos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "partidos_update" ON partidos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "partidos_delete" ON partidos FOR DELETE TO authenticated USING (true);

-- 4. PARTIDO CONVOCADAS
CREATE TABLE IF NOT EXISTS partido_convocadas (
  id SERIAL PRIMARY KEY,
  partido_id INT NOT NULL REFERENCES partidos(id) ON DELETE CASCADE,
  jugadora_id INT NOT NULL REFERENCES dep_athletes(id),
  titular BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(partido_id, jugadora_id)
);

CREATE INDEX idx_conv_partido ON partido_convocadas(partido_id);

ALTER TABLE partido_convocadas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conv_read" ON partido_convocadas FOR SELECT TO authenticated USING (true);
CREATE POLICY "conv_write" ON partido_convocadas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "conv_update" ON partido_convocadas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "conv_delete" ON partido_convocadas FOR DELETE TO authenticated USING (true);

-- 5. PARTIDO EVENTOS (goles, tarjetas)
CREATE TABLE IF NOT EXISTS partido_eventos (
  id SERIAL PRIMARY KEY,
  partido_id INT NOT NULL REFERENCES partidos(id) ON DELETE CASCADE,
  jugadora_id INT NOT NULL REFERENCES dep_athletes(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('gol','amarilla','roja','green_card','penal')),
  minuto INT DEFAULT NULL,
  notas TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_pevt_partido ON partido_eventos(partido_id);
CREATE INDEX idx_pevt_jugadora ON partido_eventos(jugadora_id);

ALTER TABLE partido_eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pevt_read" ON partido_eventos FOR SELECT TO authenticated USING (true);
CREATE POLICY "pevt_write" ON partido_eventos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "pevt_delete" ON partido_eventos FOR DELETE TO authenticated USING (true);

-- 6. CALENDARIO EVENTOS
CREATE TABLE IF NOT EXISTS calendario_eventos (
  id SERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'otro',
  fecha DATE NOT NULL,
  hora TIME DEFAULT NULL,
  duracion_min INT DEFAULT 60,
  division TEXT DEFAULT NULL,
  rama TEXT DEFAULT NULL,
  recurrencia TEXT DEFAULT 'none' CHECK (recurrencia IN ('none','weekly','biweekly','monthly')),
  color TEXT DEFAULT '#3B82F6',
  sesion_id INT DEFAULT NULL REFERENCES asistencia_sesiones(id) ON DELETE SET NULL,
  partido_id INT DEFAULT NULL REFERENCES partidos(id) ON DELETE SET NULL,
  notas TEXT DEFAULT '',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cal_fecha ON calendario_eventos(fecha);
CREATE INDEX idx_cal_tipo ON calendario_eventos(tipo);
CREATE INDEX idx_cal_div ON calendario_eventos(division, rama);

ALTER TABLE calendario_eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cal_read" ON calendario_eventos FOR SELECT TO authenticated USING (true);
CREATE POLICY "cal_write" ON calendario_eventos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "cal_update" ON calendario_eventos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "cal_delete" ON calendario_eventos FOR DELETE TO authenticated USING (true);

-- Enable realtime for all new tables
ALTER PUBLICATION supabase_realtime ADD TABLE asistencia_sesiones;
ALTER PUBLICATION supabase_realtime ADD TABLE asistencia_registros;
ALTER PUBLICATION supabase_realtime ADD TABLE partidos;
ALTER PUBLICATION supabase_realtime ADD TABLE partido_convocadas;
ALTER PUBLICATION supabase_realtime ADD TABLE partido_eventos;
ALTER PUBLICATION supabase_realtime ADD TABLE calendario_eventos;

-- Trigger: auto-close session after 24h
CREATE OR REPLACE FUNCTION auto_close_old_sessions() RETURNS trigger AS $$
BEGIN
  UPDATE asistencia_sesiones SET estado='cerrada' WHERE estado='abierta' AND fecha < CURRENT_DATE - 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_close_sessions
  AFTER INSERT ON asistencia_sesiones
  FOR EACH STATEMENT EXECUTE FUNCTION auto_close_old_sessions();
