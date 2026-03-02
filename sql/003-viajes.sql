-- 003-viajes.sql  —  Módulo de Viajes
-- Ejecutar manualmente en Supabase SQL Editor

-- ── Tabla principal de viajes ──
create table if not exists viajes (
  id uuid primary key default gen_random_uuid(),
  destino text not null,
  fecha_ida date not null,
  fecha_vuelta date not null,
  motivo text not null check (motivo in ('torneo','amistoso','gira')),
  costo_transporte numeric(12,2) default 0,
  costo_alojamiento numeric(12,2) default 0,
  costo_alimentacion numeric(12,2) default 0,
  costo_otros numeric(12,2) default 0,
  estado text not null default 'borrador' check (estado in ('borrador','pendiente','aprobado','cancelado')),
  notas text,
  creado_por uuid references auth.users(id),
  aprobado_por uuid references auth.users(id),
  aprobado_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── Historial / audit trail ──
create table if not exists viaje_historial (
  id uuid primary key default gen_random_uuid(),
  viaje_id uuid not null references viajes(id) on delete cascade,
  accion text not null,
  detalle text,
  user_id uuid not null references auth.users(id),
  created_at timestamptz default now()
);

-- ── Índices ──
create index if not exists idx_viaje_historial_viaje on viaje_historial(viaje_id);
create index if not exists idx_viajes_estado on viajes(estado);
create index if not exists idx_viajes_fecha_ida on viajes(fecha_ida);

-- ── RLS ──
alter table viajes enable row level security;
alter table viaje_historial enable row level security;

create policy "viajes_all" on viajes for all using (true) with check (true);
create policy "viaje_historial_all" on viaje_historial for all using (true) with check (true);

-- ── updated_at trigger ──
create or replace function update_viajes_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger viajes_updated_at
  before update on viajes
  for each row execute function update_viajes_updated_at();
