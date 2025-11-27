-- Fix RLS policies for medicines table
-- The issue is that profiles.user_id references auth.users.id, not profiles.id

-- Drop existing policies
drop policy if exists medicines_insert_admin on public.medicines;
drop policy if exists medicines_update_admin on public.medicines;
drop policy if exists medicines_delete_admin on public.medicines;
drop policy if exists medicines_select_all on public.medicines;

-- Enable RLS
alter table public.medicines enable row level security;

-- Anyone can view medicines (public read)
create policy medicines_select_all
  on public.medicines for select
  using (true);

-- Admin can insert medicines (fixed to use user_id instead of id)
create policy medicines_insert_admin
  on public.medicines for insert
  with check (
    exists (
      select 1 from public.profiles p 
      where p.user_id = auth.uid() 
      and p.role = 'admin'
    )
  );

-- Admin can update medicines
create policy medicines_update_admin
  on public.medicines for update
  using (
    exists (
      select 1 from public.profiles p 
      where p.user_id = auth.uid() 
      and p.role = 'admin'
    )
  );

-- Admin can delete medicines
create policy medicines_delete_admin
  on public.medicines for delete
  using (
    exists (
      select 1 from public.profiles p 
      where p.user_id = auth.uid() 
      and p.role = 'admin'
    )
  );

-- Also fix medicine_orders policies if needed
drop policy if exists medicine_orders_select on public.medicine_orders;
drop policy if exists medicine_orders_insert on public.medicine_orders;
drop policy if exists medicine_orders_update on public.medicine_orders;
drop policy if exists medicine_orders_delete on public.medicine_orders;

-- Enable RLS
alter table public.medicine_orders enable row level security;

-- Users can see their own orders, admins can see all
create policy medicine_orders_select
  on public.medicine_orders for select
  using (
    user_id = auth.uid() 
    or exists (
      select 1 from public.profiles p 
      where p.user_id = auth.uid() 
      and p.role = 'admin'
    )
  );

-- Users can create their own orders
create policy medicine_orders_insert
  on public.medicine_orders for insert
  with check (user_id = auth.uid());

-- Admin can update any order, users can update their pending orders
create policy medicine_orders_update
  on public.medicine_orders for update
  using (
    exists (
      select 1 from public.profiles p 
      where p.user_id = auth.uid() 
      and p.role = 'admin'
    )
    or (user_id = auth.uid() and status = 'pending')
  );

-- Admin can delete orders
create policy medicine_orders_delete
  on public.medicine_orders for delete
  using (
    exists (
      select 1 from public.profiles p 
      where p.user_id = auth.uid() 
      and p.role = 'admin'
    )
  );

-- Fix order_items policies
drop policy if exists order_items_select on public.order_items;
drop policy if exists order_items_insert on public.order_items;

alter table public.order_items enable row level security;

-- Users can see items from their orders, admins can see all
create policy order_items_select
  on public.order_items for select
  using (
    exists (
      select 1 from public.medicine_orders mo 
      where mo.id = order_id 
      and (
        mo.user_id = auth.uid() 
        or exists (
          select 1 from public.profiles p 
          where p.user_id = auth.uid() 
          and p.role = 'admin'
        )
      )
    )
  );

-- Users can insert items for their orders
create policy order_items_insert
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.medicine_orders mo 
      where mo.id = order_id 
      and mo.user_id = auth.uid()
    )
  );

-- Fix cart_items policies
drop policy if exists cart_select_own on public.cart_items;
drop policy if exists cart_insert_own on public.cart_items;
drop policy if exists cart_update_own on public.cart_items;
drop policy if exists cart_delete_own on public.cart_items;

alter table public.cart_items enable row level security;

create policy cart_select_own
  on public.cart_items for select
  using (user_id = auth.uid());

create policy cart_insert_own
  on public.cart_items for insert
  with check (user_id = auth.uid());

create policy cart_update_own
  on public.cart_items for update
  using (user_id = auth.uid());

create policy cart_delete_own
  on public.cart_items for delete
  using (user_id = auth.uid());
