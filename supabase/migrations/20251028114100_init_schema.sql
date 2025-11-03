-- Recreate core schema for CampusCarePlus
-- Safe re-runnable guards
create schema if not exists public;
create extension if not exists pgcrypto;

-- Profiles table (linked 1:1 to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text check (role in ('student','faculty','admin')) default 'student',
  roll_number text,
  course text,
  department text,
  faculty_id text,
  designation text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- In case an older table exists without patient_id, add it
alter table public.appointments
  add column if not exists patient_id uuid;

-- Best-effort foreign key (skip if already present)
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_type = 'FOREIGN KEY'
      and table_name = 'appointments'
      and constraint_name = 'appointments_patient_id_fkey'
  ) then
    alter table public.appointments
      add constraint appointments_patient_id_fkey foreign key (patient_id)
      references public.profiles(id) on delete set null;
  end if;
exception when others then
  -- ignore if permission or existence differs
  null;
end $$;

-- Appointments
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.profiles(id) on delete set null,
  doctor_name text not null,
  specialization text,
  appointment_date date not null,
  appointment_time time not null,
  status text check (status in ('scheduled','completed','cancelled','pending')) default 'scheduled',
  issue_description text,
  symptoms text,
  consultation_notes text,
  prescription text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Counseling bookings
create table if not exists public.counseling_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  is_anonymous boolean default false,
  anonymous_contact text,
  category text,
  mode text check (mode in ('online','in-person')),
  issue_description text,
  session_notes text,
  status text check (status in ('pending','scheduled','completed','cancelled')) default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Wheelchair bookings
create table if not exists public.wheelchair_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  status text check (status in ('requested','approved','in-use','returned','cancelled')) default 'requested',
  requested_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Medicine orders
create table if not exists public.medicine_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  items jsonb default '[]'::jsonb,
  status text check (status in ('placed','processing','ready','completed','cancelled')) default 'placed',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Wellness programs (basic placeholder)
create table if not exists public.wellness_programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  starts_on date,
  ends_on date,
  created_at timestamptz default now()
);

-- Emergency logs
create table if not exists public.emergency_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  message text,
  severity text check (severity in ('low','medium','high','critical')) default 'low',
  created_at timestamptz default now()
);

-- Row Level Security
alter table if exists public.profiles enable row level security;
alter table if exists public.appointments enable row level security;
alter table if exists public.counseling_bookings enable row level security;
alter table if exists public.wheelchair_bookings enable row level security;
alter table if exists public.medicine_orders enable row level security;
alter table if exists public.emergency_logs enable row level security;

-- Helper policy check: admin check via profiles
create or replace view public.current_user_profile as
  select * from public.profiles where id = auth.uid();

-- PROFILES policies
drop policy if exists profiles_select_self_or_admin on public.profiles;
create policy profiles_select_self_or_admin
  on public.profiles for select
  using (
    id = auth.uid() or
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
drop policy if exists profiles_update_self_or_admin on public.profiles;
create policy profiles_update_self_or_admin
  on public.profiles for update
  using (
    id = auth.uid() or
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self
  on public.profiles for insert
  with check (id = auth.uid());

-- APPOINTMENTS policies
drop policy if exists appointments_select_self_or_admin on public.appointments;
create policy appointments_select_self_or_admin
  on public.appointments for select
  using (
    patient_id = auth.uid() or
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
drop policy if exists appointments_modify_self_or_admin on public.appointments;
create policy appointments_modify_self_or_admin
  on public.appointments for all
  using (
    patient_id = auth.uid() or
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    patient_id = auth.uid() or
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- COUNSELING policies
drop policy if exists counseling_select_self_or_admin on public.counseling_bookings;
create policy counseling_select_self_or_admin
  on public.counseling_bookings for select
  using (
    user_id = auth.uid() or
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
drop policy if exists counseling_modify_self_or_admin on public.counseling_bookings;
create policy counseling_modify_self_or_admin
  on public.counseling_bookings for all
  using (
    user_id = auth.uid() or
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    user_id = auth.uid() or
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- WHEELCHAIR policies
drop policy if exists wheelchair_select_self_or_admin on public.wheelchair_bookings;
create policy wheelchair_select_self_or_admin
  on public.wheelchair_bookings for select
  using (
    user_id = auth.uid() or
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
drop policy if exists wheelchair_modify_self_or_admin on public.wheelchair_bookings;
create policy wheelchair_modify_self_or_admin
  on public.wheelchair_bookings for all
  using (
    user_id = auth.uid() or
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    user_id = auth.uid() or
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- MEDICINE policies
drop policy if exists medicine_select_self_or_admin on public.medicine_orders;
create policy medicine_select_self_or_admin
  on public.medicine_orders for select
  using (
    user_id = auth.uid() or
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
drop policy if exists medicine_modify_self_or_admin on public.medicine_orders;
create policy medicine_modify_self_or_admin
  on public.medicine_orders for all
  using (
    user_id = auth.uid() or
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    user_id = auth.uid() or
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- EMERGENCY policies
drop policy if exists emergency_select_self_or_admin on public.emergency_logs;
create policy emergency_select_self_or_admin
  on public.emergency_logs for select
  using (
    user_id = auth.uid() or
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
drop policy if exists emergency_insert_self_or_admin on public.emergency_logs;
create policy emergency_insert_self_or_admin
  on public.emergency_logs for insert
  with check (
    user_id = auth.uid() or
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Triggers to keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at_appointments on public.appointments;
create trigger set_updated_at_appointments
before update on public.appointments
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_counseling on public.counseling_bookings;
create trigger set_updated_at_counseling
before update on public.counseling_bookings
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_wheelchairs on public.wheelchair_bookings;
create trigger set_updated_at_wheelchairs
before update on public.wheelchair_bookings
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_medicine on public.medicine_orders;
create trigger set_updated_at_medicine
before update on public.medicine_orders
for each row execute function public.set_updated_at();

-- Ensure a clean auth -> profiles sync (avoid legacy triggers)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    -- Normalize role and guarantee it matches the CHECK constraint
    insert into public.profiles (id, full_name, phone, role, roll_number, course, department, faculty_id, designation)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'full_name', null),
      coalesce(new.raw_user_meta_data->>'phone', null),
      case lower(coalesce(new.raw_user_meta_data->>'role', 'student'))
        when 'admin' then 'admin'
        when 'faculty' then 'faculty'
        else 'student'
      end,
      coalesce(new.raw_user_meta_data->>'roll_number', null),
      coalesce(new.raw_user_meta_data->>'course', null),
      coalesce(new.raw_user_meta_data->>'department', null),
      coalesce(new.raw_user_meta_data->>'faculty_id', null),
      coalesce(new.raw_user_meta_data->>'designation', null)
    )
    on conflict (id) do update set
      full_name  = excluded.full_name,
      phone      = excluded.phone,
      role       = excluded.role,
      roll_number= excluded.roll_number,
      course     = excluded.course,
      department = excluded.department,
      faculty_id = excluded.faculty_id,
      designation= excluded.designation,
      updated_at = now();
  exception when others then
    -- Do not block signup if profile insert fails for any reason
    raise notice 'handle_new_user warning: %', sqlerrm;
  end;
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
