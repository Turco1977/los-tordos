-- Tarifario: tabla de ubicaciones con precios para sponsors
CREATE TABLE tarifario (
  id SERIAL PRIMARY KEY,
  categoria TEXT NOT NULL,
  ubicacion TEXT NOT NULL,
  descripcion TEXT DEFAULT '',
  visibilidad TEXT DEFAULT 'media',
  precio_min_usd NUMERIC DEFAULT 0,
  precio_max_usd NUMERIC DEFAULT 0,
  sponsor_asignado_id INTEGER REFERENCES sponsors(id) ON DELETE SET NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tarifario ENABLE ROW LEVEL SECURITY;
CREATE POLICY tarifario_all ON tarifario FOR ALL USING (true) WITH CHECK (true);

-- Seed: 22 ubicaciones reales
INSERT INTO tarifario (categoria, ubicacion, descripcion, visibilidad, precio_min_usd, precio_max_usd) VALUES
-- Indumentaria Rugby (10)
('indumentaria_rugby', 'Camiseta titular - pecho', 'Logo principal en pecho de camiseta titular', 'alta', 15000, 18000),
('indumentaria_rugby', 'Camiseta titular - espalda', 'Logo en espalda de camiseta titular', 'alta', 10000, 14000),
('indumentaria_rugby', 'Camiseta titular - manga', 'Logo en manga de camiseta titular', 'alta', 8000, 12000),
('indumentaria_rugby', 'Camiseta suplente - pecho', 'Logo principal en pecho de camiseta suplente', 'media', 8000, 10000),
('indumentaria_rugby', 'Camiseta suplente - espalda', 'Logo en espalda de camiseta suplente', 'media', 5000, 8000),
('indumentaria_rugby', 'Short', 'Logo en short oficial', 'media', 4000, 6000),
('indumentaria_rugby', 'Medias', 'Logo en medias oficiales', 'baja', 2000, 4000),
('indumentaria_rugby', 'Campera de concentracion', 'Logo en campera de concentracion', 'media', 5000, 8000),
('indumentaria_rugby', 'Remera de entrenamiento', 'Logo en remera de entrenamiento', 'media', 4000, 6000),
('indumentaria_rugby', 'Pantalon de entrenamiento', 'Logo en pantalon de entrenamiento', 'baja', 3000, 5000),
-- Espacios (10)
('espacio', 'Cartel cancha 1 - lateral', 'Cartel publicitario lateral cancha 1 (principal)', 'alta', 8000, 12000),
('espacio', 'Cartel cancha 1 - cabecera', 'Cartel publicitario cabecera cancha 1', 'alta', 6000, 10000),
('espacio', 'Cartel cancha 2', 'Cartel publicitario cancha 2', 'media', 4000, 6000),
('espacio', 'Banner cantina', 'Banner publicitario en cantina del club', 'media', 3000, 5000),
('espacio', 'Bandera ingreso', 'Bandera con logo en ingreso principal', 'alta', 5000, 8000),
('espacio', 'Naming salon', 'Naming rights del salon de eventos', 'alta', 10000, 15000),
('espacio', 'Naming cancha', 'Naming rights de cancha', 'alta', 12000, 18000),
('espacio', 'Cartel estacionamiento', 'Cartel publicitario en estacionamiento', 'baja', 2000, 4000),
('espacio', 'Stand dia de partido', 'Stand comercial en dias de partido local', 'media', 3000, 5000),
('espacio', 'Backing conferencia', 'Backing publicitario en conferencias de prensa', 'media', 4000, 7000),
-- Digital (2)
('digital', 'Redes sociales - post mensual', 'Post mensual en redes sociales del club', 'media', 1000, 3000),
('digital', 'Streaming - logo en pantalla', 'Logo en transmisiones en vivo', 'alta', 3000, 6000);
