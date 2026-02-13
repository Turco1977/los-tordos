-- ============================================================
-- Los Tordos - Módulo Presupuestos
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. PROVEEDORES (directorio de proveedores)
create table if not exists proveedores (
  id serial primary key,
  nombre text not null default '',
  contacto text not null default '',
  email text not null default '',
  telefono text not null default '',
  rubro text not null default '',
  notas text not null default '',
  created_at text not null default ''
);

alter table proveedores enable row level security;

create policy "read_prov" on proveedores for select using (true);
create policy "insert_prov" on proveedores for insert with check (auth.uid() is not null);
create policy "update_prov" on proveedores for update using (
  exists (select 1 from profiles where id = auth.uid() and role in ('superadmin','admin','embudo'))
);

-- 2. PRESUPUESTOS (cotizaciones vinculadas a tareas)
create table if not exists presupuestos (
  id serial primary key,
  task_id integer not null references tasks(id) on delete cascade,
  proveedor_id integer references proveedores(id),
  proveedor_nombre text not null default '',
  proveedor_contacto text not null default '',
  descripcion text not null default '',
  monto numeric(12,2) not null default 0,
  moneda text not null default 'ARS',
  archivo_url text not null default '',
  notas text not null default '',
  status text not null default 'solicitado' check (status in ('solicitado','recibido','aprobado','rechazado')),
  solicitado_por text not null default '',
  solicitado_at text not null default '',
  recibido_at text not null default '',
  resuelto_por text not null default '',
  resuelto_at text not null default '',
  created_at timestamptz default now()
);

alter table presupuestos enable row level security;

create policy "read_presu" on presupuestos for select using (true);
create policy "insert_presu" on presupuestos for insert with check (auth.uid() is not null);
create policy "update_presu" on presupuestos for update using (
  exists (select 1 from profiles where id = auth.uid() and role in ('superadmin','admin','embudo','coordinador'))
);
create policy "delete_presu" on presupuestos for delete using (
  exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
);

create index idx_presu_task on presupuestos(task_id);
create index idx_presu_status on presupuestos(status);
