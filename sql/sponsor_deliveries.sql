-- Sponsor Deliveries: tracks physical deliveries from sponsors
CREATE TABLE sponsor_deliveries (
  id SERIAL PRIMARY KEY,
  sponsor_id INTEGER NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_value NUMERIC DEFAULT 0,
  total_value NUMERIC DEFAULT 0,
  destination TEXT NOT NULL CHECK (destination IN ('division','consumo','venta')),
  division TEXT,
  person_id TEXT,
  person_name TEXT,
  inventory_id INTEGER REFERENCES inventory(id),
  qty_sold INTEGER DEFAULT 0,
  revenue NUMERIC DEFAULT 0,
  received_by TEXT NOT NULL,
  received_by_name TEXT DEFAULT '',
  received_date DATE DEFAULT CURRENT_DATE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spon_del_sponsor ON sponsor_deliveries(sponsor_id);
ALTER TABLE sponsor_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY spon_del_all ON sponsor_deliveries FOR ALL USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE sponsor_deliveries;
