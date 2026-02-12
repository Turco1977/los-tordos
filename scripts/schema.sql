-- ============================================================
-- Los Tordos - Supabase Schema
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. PROFILES (extends auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  first_name text not null default '',
  last_name text not null default '',
  role text not null default 'usuario',
  dept_id integer not null default 1,
  division text not null default '',
  email text not null default '',
  phone text not null default '',
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Anyone can read profiles" on profiles for select using (true);
create policy "Superadmin/admin can update any profile" on profiles for update using (
  exists (select 1 from profiles where id = auth.uid() and role in ('superadmin','admin'))
);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Superadmin can insert profiles" on profiles for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
);
create policy "Service role can insert profiles" on profiles for insert with check (true);

-- 2. ORG_MEMBERS (Comisión Directiva + Secretaría Ejecutiva)
create table if not exists org_members (
  id text primary key,
  type text not null check (type in ('cd','se')),
  cargo text not null default '',
  first_name text not null default '',
  last_name text not null default '',
  email text not null default '',
  phone text not null default ''
);

alter table org_members enable row level security;

create policy "Anyone can read org_members" on org_members for select using (true);
create policy "Superadmin can modify org_members" on org_members for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
);

-- 3. TASKS
create table if not exists tasks (
  id serial primary key,
  division text not null default '',
  creator_id text not null,
  creator_name text not null default '',
  dept_id integer not null default 1,
  tipo text not null default '',
  description text not null default '',
  due_date text not null default '',
  urgency text not null default 'Normal',
  status text not null default 'pend',
  assigned_to text,
  requires_expense boolean not null default false,
  expense_ok boolean,
  resolution text not null default '',
  created_at text not null default '',
  amount integer
);

alter table tasks enable row level security;

create policy "Anyone can read tasks" on tasks for select using (true);
create policy "Anyone authenticated can insert tasks" on tasks for insert with check (auth.uid() is not null);
create policy "Assigned/creator/admin can update tasks" on tasks for update using (
  auth.uid() is not null
);
create policy "Superadmin can delete tasks" on tasks for delete using (
  exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
);

-- 4. TASK_MESSAGES (normalized chat/activity log)
create table if not exists task_messages (
  id serial primary key,
  task_id integer not null references tasks(id) on delete cascade,
  user_id text not null,
  user_name text not null default '',
  content text not null default '',
  type text not null default 'sys' check (type in ('sys','msg')),
  created_at timestamptz default now()
);

alter table task_messages enable row level security;

create policy "Anyone can read task_messages" on task_messages for select using (true);
create policy "Authenticated can insert task_messages" on task_messages for insert with check (auth.uid() is not null);

-- Index for fast lookup by task
create index if not exists idx_task_messages_task_id on task_messages(task_id);

-- 5. MILESTONES
create table if not exists milestones (
  id serial primary key,
  phase text not null default '',
  name text not null default '',
  period text not null default '',
  pct integer not null default 0,
  color text not null default ''
);

alter table milestones enable row level security;

create policy "Anyone can read milestones" on milestones for select using (true);
create policy "Admin can modify milestones" on milestones for update using (
  exists (select 1 from profiles where id = auth.uid() and role in ('superadmin','admin'))
);

-- 6. AGENDAS
create table if not exists agendas (
  id serial primary key,
  type text not null default '',
  area_name text,
  date text not null default '',
  sections jsonb not null default '[]'::jsonb,
  status text not null default 'borrador',
  created_at text not null default ''
);

alter table agendas enable row level security;

create policy "Anyone can read agendas" on agendas for select using (true);
create policy "Authenticated can insert agendas" on agendas for insert with check (auth.uid() is not null);
create policy "Authenticated can update agendas" on agendas for update using (auth.uid() is not null);

-- 7. MINUTAS
create table if not exists minutas (
  id serial primary key,
  type text not null default '',
  area_name text,
  agenda_id integer references agendas(id),
  date text not null default '',
  hora_inicio text,
  hora_cierre text,
  lugar text,
  presentes jsonb not null default '[]'::jsonb,
  ausentes jsonb not null default '[]'::jsonb,
  sections jsonb not null default '[]'::jsonb,
  tareas jsonb not null default '[]'::jsonb,
  status text not null default 'borrador',
  created_at text not null default ''
);

alter table minutas enable row level security;

create policy "Anyone can read minutas" on minutas for select using (true);
create policy "Authenticated can insert minutas" on minutas for insert with check (auth.uid() is not null);
create policy "Authenticated can update minutas" on minutas for update using (auth.uid() is not null);

-- ============================================================
-- Function: auto-create profile on user signup
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, first_name, last_name, role, dept_id, division, phone)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'usuario'),
    coalesce((new.raw_user_meta_data->>'dept_id')::integer, 1),
    coalesce(new.raw_user_meta_data->>'division', ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger on auth.users insert
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
