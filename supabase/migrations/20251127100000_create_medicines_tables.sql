-- Create medicines inventory table
create table if not exists public.medicines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  generic_name text,
  brand text,
  category text not null default 'other',
  dosage text,
  price numeric(10,2) not null default 0,
  stock_quantity integer not null default 0,
  min_stock_level integer default 10,
  description text,
  requires_prescription boolean default false,
  manufacturer text,
  expiry_date date,
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create cart items table for user shopping carts
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  medicine_id uuid references public.medicines(id) on delete cascade,
  quantity integer not null default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, medicine_id)
);

-- Drop and recreate medicine_orders with proper structure
-- First check if we need to migrate
do $$
begin
  -- Add new columns if they don't exist
  if not exists (select 1 from information_schema.columns where table_name = 'medicine_orders' and column_name = 'order_number') then
    alter table public.medicine_orders add column order_number text;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_name = 'medicine_orders' and column_name = 'total_amount') then
    alter table public.medicine_orders add column total_amount numeric(10,2) default 0;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_name = 'medicine_orders' and column_name = 'delivery_address') then
    alter table public.medicine_orders add column delivery_address text;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_name = 'medicine_orders' and column_name = 'delivery_instructions') then
    alter table public.medicine_orders add column delivery_instructions text;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_name = 'medicine_orders' and column_name = 'admin_notes') then
    alter table public.medicine_orders add column admin_notes text;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_name = 'medicine_orders' and column_name = 'ordered_at') then
    alter table public.medicine_orders add column ordered_at timestamptz default now();
  end if;
  
  if not exists (select 1 from information_schema.columns where table_name = 'medicine_orders' and column_name = 'approved_at') then
    alter table public.medicine_orders add column approved_at timestamptz;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_name = 'medicine_orders' and column_name = 'delivered_at') then
    alter table public.medicine_orders add column delivered_at timestamptz;
  end if;
end $$;

-- Update status check constraint to include new statuses
alter table public.medicine_orders drop constraint if exists medicine_orders_status_check;
alter table public.medicine_orders add constraint medicine_orders_status_check 
  check (status in ('pending','approved','processing','ready','delivered','completed','cancelled','placed'));

-- Create order_items table for individual items in an order
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.medicine_orders(id) on delete cascade,
  medicine_id uuid references public.medicines(id) on delete set null,
  quantity integer not null default 1,
  unit_price numeric(10,2) not null,
  total_price numeric(10,2) not null,
  created_at timestamptz default now()
);

-- Enable RLS on new tables
alter table public.medicines enable row level security;
alter table public.cart_items enable row level security;
alter table public.order_items enable row level security;

-- MEDICINES policies (public read, admin write)
drop policy if exists medicines_select_all on public.medicines;
create policy medicines_select_all
  on public.medicines for select
  using (true);  -- Anyone can view medicines

drop policy if exists medicines_insert_admin on public.medicines;
create policy medicines_insert_admin
  on public.medicines for insert
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists medicines_update_admin on public.medicines;
create policy medicines_update_admin
  on public.medicines for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists medicines_delete_admin on public.medicines;
create policy medicines_delete_admin
  on public.medicines for delete
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- CART_ITEMS policies (user can manage their own cart)
drop policy if exists cart_select_own on public.cart_items;
create policy cart_select_own
  on public.cart_items for select
  using (user_id = auth.uid());

drop policy if exists cart_insert_own on public.cart_items;
create policy cart_insert_own
  on public.cart_items for insert
  with check (user_id = auth.uid());

drop policy if exists cart_update_own on public.cart_items;
create policy cart_update_own
  on public.cart_items for update
  using (user_id = auth.uid());

drop policy if exists cart_delete_own on public.cart_items;
create policy cart_delete_own
  on public.cart_items for delete
  using (user_id = auth.uid());

-- ORDER_ITEMS policies (user sees own, admin sees all)
drop policy if exists order_items_select on public.order_items;
create policy order_items_select
  on public.order_items for select
  using (
    exists (
      select 1 from public.medicine_orders mo 
      where mo.id = order_id 
      and (mo.user_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
    )
  );

drop policy if exists order_items_insert on public.order_items;
create policy order_items_insert
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.medicine_orders mo 
      where mo.id = order_id 
      and (mo.user_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
    )
  );

-- Triggers for updated_at
drop trigger if exists set_updated_at_medicines on public.medicines;
create trigger set_updated_at_medicines
before update on public.medicines
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_cart_items on public.cart_items;
create trigger set_updated_at_cart_items
before update on public.cart_items
for each row execute function public.set_updated_at();

-- Enable realtime for medicines and medicine_orders
alter publication supabase_realtime add table public.medicines;
alter publication supabase_realtime add table public.medicine_orders;
