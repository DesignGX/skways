-- ============================================================================
-- SK Ways Logistics â€” Row Level Security policies.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Ensure helper functions exist (in case previous migration runs failed mid-way)
-- ---------------------------------------------------------------------------
drop function if exists public.current_role();
create or replace function public.get_current_role()
returns public.user_role language sql stable security definer set search_path = public
as $$ select role from public.profiles where user_id = auth.uid() limit 1; $$;

create or replace function public.current_profile_id()
returns uuid language sql stable security definer set search_path = public
as $$ select id from public.profiles where user_id = auth.uid() limit 1; $$;

-- ---------------------------------------------------------------------------
-- Enable RLS on all tables
-- ---------------------------------------------------------------------------
alter table public.profiles             enable row level security;
alter table public.customers            enable row level security;
alter table public.drivers              enable row level security;
alter table public.vehicles             enable row level security;
alter table public.addresses            enable row level security;
alter table public.orders               enable row level security;
alter table public.order_status_history enable row level security;
alter table public.order_assignments    enable row level security;
alter table public.order_otps           enable row level security;
alter table public.pricing_rules        enable row level security;
alter table public.payments             enable row level security;
alter table public.invoices             enable row level security;
alter table public.leads                enable row level security;
alter table public.notifications        enable row level security;
alter table public.activity_logs        enable row level security;
alter table public.delivery_proofs      enable row level security;
-- ---------------------------------------------------------------------------
-- profiles â€” users manage their own; admins manage all.
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (auth.uid() = user_id or get_current_role()::text = 'ADMIN');

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using (auth.uid() = user_id or get_current_role()::text = 'ADMIN')
  with check (auth.uid() = user_id or get_current_role()::text = 'ADMIN');

-- ---------------------------------------------------------------------------
-- customers â€” admin full access; customers read/update their own record.
-- ---------------------------------------------------------------------------
drop policy if exists "customers_admin_all" on public.customers;
create policy "customers_admin_all"
  on public.customers for all
  using (get_current_role()::text = 'ADMIN')
  with check (get_current_role()::text = 'ADMIN');

drop policy if exists "customers_select_own" on public.customers;
create policy "customers_select_own"
  on public.customers for select
  using (profile_id in (
    select id from public.profiles where user_id = auth.uid()
  ));

drop policy if exists "customers_update_own" on public.customers;
create policy "customers_update_own"
  on public.customers for update
  using (profile_id in (
    select id from public.profiles where user_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- drivers â€” admin full access; drivers may read their own record.
-- ---------------------------------------------------------------------------
drop policy if exists "drivers_admin_all" on public.drivers;
create policy "drivers_admin_all"
  on public.drivers for all
  using (get_current_role()::text = 'ADMIN')
  with check (get_current_role()::text = 'ADMIN');

drop policy if exists "drivers_select_own" on public.drivers;
create policy "drivers_select_own"
  on public.drivers for select
  using (profile_id in (
    select id from public.profiles where user_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- vehicles â€” admin full access; drivers see their own vehicle.
-- ---------------------------------------------------------------------------
drop policy if exists "vehicles_admin_all" on public.vehicles;
create policy "vehicles_admin_all"
  on public.vehicles for all
  using (get_current_role()::text = 'ADMIN')
  with check (get_current_role()::text = 'ADMIN');

drop policy if exists "vehicles_select_assigned_driver" on public.vehicles;
create policy "vehicles_select_assigned_driver"
  on public.vehicles for select
  using (driver_id in (
    select d.id from public.drivers d
    join public.profiles p on p.id = d.profile_id
    where p.user_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- addresses â€” admin full access; customers manage their own addresses.
-- ---------------------------------------------------------------------------
drop policy if exists "addresses_admin_all" on public.addresses;
create policy "addresses_admin_all"
  on public.addresses for all
  using (get_current_role()::text = 'ADMIN')
  with check (get_current_role()::text = 'ADMIN');

drop policy if exists "addresses_customer_all" on public.addresses;
create policy "addresses_customer_all"
  on public.addresses for all
  using (exists (
    select 1 from public.profiles p
    where p.id = (select profile_id from public.customers where id = customer_id)
      and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.id = (select profile_id from public.customers where id = customer_id)
      and p.user_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- orders â€” admin full access; customers see their own; drivers see assigned.
-- ---------------------------------------------------------------------------
drop policy if exists "orders_admin_all" on public.orders;
create policy "orders_admin_all"
  on public.orders for all
  using (get_current_role()::text = 'ADMIN')
  with check (get_current_role()::text = 'ADMIN');

drop policy if exists "orders_select_customer" on public.orders;
create policy "orders_select_customer"
  on public.orders for select
  using (exists (
    select 1 from public.customers c
    where c.id = customer_id and c.profile_id in (
      select id from public.profiles where user_id = auth.uid()
    )
  ));

drop policy if exists "orders_select_driver" on public.orders;
create policy "orders_select_driver"
  on public.orders for select
  using (exists (
    select 1 from public.drivers d
    where d.id = driver_id and d.profile_id in (
      select id from public.profiles where user_id = auth.uid()
    )
  ));

-- ---------------------------------------------------------------------------
-- order_status_history â€” admin full access; involved parties can read.
-- ---------------------------------------------------------------------------
drop policy if exists "osh_admin_all" on public.order_status_history;
create policy "osh_admin_all"
  on public.order_status_history for all
  using (get_current_role()::text = 'ADMIN')
  with check (get_current_role()::text = 'ADMIN');

drop policy if exists "osh_select_involved" on public.order_status_history;
create policy "osh_select_involved"
  on public.order_status_history for select
  using (exists (
    select 1 from public.orders o
    where o.id = order_id
    and (
      o.customer_id in (
        select c.id from public.customers c
        join public.profiles p on p.id = c.profile_id
        where p.user_id = auth.uid()
      )
      or o.driver_id in (
        select d.id from public.drivers d
        join public.profiles p on p.id = d.profile_id
        where p.user_id = auth.uid()
      )
    )
  ));

-- ---------------------------------------------------------------------------
-- order_assignments â€” admin full access; involved parties can read.
-- ---------------------------------------------------------------------------
drop policy if exists "oa_admin_all" on public.order_assignments;
create policy "oa_admin_all"
  on public.order_assignments for all
  using (get_current_role()::text = 'ADMIN')
  with check (get_current_role()::text = 'ADMIN');

drop policy if exists "oa_select_involved" on public.order_assignments;
create policy "oa_select_involved"
  on public.order_assignments for select
  using (exists (
    select 1 from public.orders o
    where o.id = order_id
    and (
      o.customer_id in (
        select c.id from public.customers c
        join public.profiles p on p.id = c.profile_id
        where p.user_id = auth.uid()
      )
      or o.driver_id in (
        select d.id from public.drivers d
        join public.profiles p on p.id = d.profile_id
        where p.user_id = auth.uid()
      )
    )
  ));

-- ---------------------------------------------------------------------------
-- order_otps â€” admin full access; service role manages for drivers.
-- ---------------------------------------------------------------------------
drop policy if exists "ootps_admin_all" on public.order_otps;
create policy "ootps_admin_all"
  on public.order_otps for all
  using (get_current_role()::text = 'ADMIN')
  with check (get_current_role()::text = 'ADMIN');

-- ---------------------------------------------------------------------------
-- pricing_rules â€” admin only.
-- ---------------------------------------------------------------------------
drop policy if exists "pricing_rules_admin_all" on public.pricing_rules;
create policy "pricing_rules_admin_all"
  on public.pricing_rules for all
  using (get_current_role()::text = 'ADMIN')
  with check (get_current_role()::text = 'ADMIN');

-- ---------------------------------------------------------------------------
-- payments â€” admin full access; customers read their own.
-- ---------------------------------------------------------------------------
drop policy if exists "payments_admin_all" on public.payments;
create policy "payments_admin_all"
  on public.payments for all
  using (get_current_role()::text = 'ADMIN')
  with check (get_current_role()::text = 'ADMIN');

drop policy if exists "payments_select_customer" on public.payments;
create policy "payments_select_customer"
  on public.payments for select
  using (exists (
    select 1 from public.customers c
    where c.id = customer_id and c.profile_id in (
      select id from public.profiles where user_id = auth.uid()
    )
  ));

-- ---------------------------------------------------------------------------
-- invoices â€” admin full access; customers read their own.
-- ---------------------------------------------------------------------------
drop policy if exists "invoices_admin_all" on public.invoices;
create policy "invoices_admin_all"
  on public.invoices for all
  using (get_current_role()::text = 'ADMIN')
  with check (get_current_role()::text = 'ADMIN');

drop policy if exists "invoices_select_customer" on public.invoices;
create policy "invoices_select_customer"
  on public.invoices for select
  using (exists (
    select 1 from public.customers c
    where c.id = customer_id and c.profile_id in (
      select id from public.profiles where user_id = auth.uid()
    )
  ));

-- ---------------------------------------------------------------------------
-- leads â€” admin only.
-- ---------------------------------------------------------------------------
drop policy if exists "leads_admin_all" on public.leads;
create policy "leads_admin_all"
  on public.leads for all
  using (get_current_role()::text = 'ADMIN')
  with check (get_current_role()::text = 'ADMIN');

-- ---------------------------------------------------------------------------
-- notifications â€” users read/update their own.
-- ---------------------------------------------------------------------------
drop policy if exists "notifications_own_all" on public.notifications;
create policy "notifications_own_all"
  on public.notifications for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- activity_logs â€” admin only.
-- ---------------------------------------------------------------------------
drop policy if exists "activity_logs_admin_all" on public.activity_logs;
create policy "activity_logs_admin_all"
  on public.activity_logs for all
  using (get_current_role()::text = 'ADMIN')
  with check (get_current_role()::text = 'ADMIN');

-- ---------------------------------------------------------------------------
-- delivery_proofs â€” admin read/update; assigned driver may read and insert
-- proof for their own assigned orders.
-- ---------------------------------------------------------------------------
drop policy if exists "proofs_admin_all" on public.delivery_proofs;
create policy "proofs_admin_all"
  on public.delivery_proofs for all
  using (get_current_role()::text = 'ADMIN')
  with check (get_current_role()::text = 'ADMIN');

drop policy if exists "proofs_select_customer" on public.delivery_proofs;
create policy "proofs_select_customer"
  on public.delivery_proofs for select
  using (exists (
    select 1 from public.orders o
    join public.customers c on c.id = o.customer_id
    where o.id = order_id and c.profile_id = current_profile_id()
  ));

drop policy if exists "proofs_driver_read_insert" on public.delivery_proofs;
create policy "proofs_driver_read_insert"
  on public.delivery_proofs for select
  using (exists (
    select 1 from public.orders o
    join public.drivers d on d.id = o.driver_id
    where o.id = order_id and d.profile_id = current_profile_id()
  ));

create policy "proofs_driver_insert"
  on public.delivery_proofs for insert
  with check (exists (
    select 1 from public.orders o
    join public.drivers d on d.id = o.driver_id
    where o.id = order_id and d.profile_id = current_profile_id()
  ));


