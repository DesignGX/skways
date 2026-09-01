-- ============================================================================
-- SK Ways Logistics â€” initial schema (part 1: enums, tables)
-- Run once against a fresh Supabase project.
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin create type public.user_role as enum ('CUSTOMER','DRIVER','ADMIN');
exception when duplicate_object then null; end $$;
do $$ begin create type public.account_status as enum ('ACTIVE','INACTIVE','SUSPENDED');
exception when duplicate_object then null; end $$;
do $$ begin create type public.vehicle_type as enum ('BIKE','AUTO','MINI_TRUCK','LCV','TRUCK','OTHER');
exception when duplicate_object then null; end $$;
do $$ begin create type public.vehicle_ownership as enum ('OWNED','PARTNER');
exception when duplicate_object then null; end $$;
do $$ begin create type public.order_status as enum (
  'REQUESTED','CONFIRMED','DRIVER_ASSIGNED','PICKED_UP','IN_TRANSIT',
  'OUT_FOR_DELIVERY','DELIVERED','CANCELLED','FAILED','RETURNED');
exception when duplicate_object then null; end $$;
do $$ begin create type public.payment_method as enum ('CASH','UPI','BANK_TRANSFER','CARD','OTHER');
exception when duplicate_object then null; end $$;
do $$ begin create type public.payment_status as enum ('PENDING','PAID','PARTIAL','FAILED','REFUNDED');
exception when duplicate_object then null; end $$;
do $$ begin create type public.invoice_status as enum ('DRAFT','ISSUED','PAID','OVERDUE','CANCELLED');
exception when duplicate_object then null; end $$;
do $$ begin create type public.lead_status as enum ('NEW','CONTACTED','QUOTED','CONVERTED','LOST');
exception when duplicate_object then null; end $$;
do $$ begin create type public.otp_type as enum ('PICKUP','DELIVERY');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users (id) on delete cascade,
  role        public.user_role not null default 'CUSTOMER',
  full_name   text not null default '',
  phone       text,
  email       text,
  avatar_url  text,
  status      public.account_status not null default 'ACTIVE',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists profiles_role_idx on public.profiles (role);

-- ---------------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------------
create table if not exists public.customers (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid not null unique references public.profiles (id) on delete cascade,
  company_name    text not null,
  contact_person  text,
  phone           text,
  email           text,
  gst_number      text,
  billing_address text,
  status          public.account_status not null default 'ACTIVE',
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists customers_profile_id_idx on public.customers (profile_id);
create index if not exists customers_status_idx on public.customers (status);

-- ---------------------------------------------------------------------------
-- drivers
-- ---------------------------------------------------------------------------
create table if not exists public.drivers (
  id                     uuid primary key default gen_random_uuid(),
  profile_id             uuid not null unique references public.profiles (id) on delete cascade,
  license_number         text,
  license_expiry         date,
  address                text,
  emergency_contact      text,
  emergency_contact_phone text,
  status                 public.account_status not null default 'ACTIVE',
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index if not exists drivers_profile_id_idx on public.drivers (profile_id);
create index if not exists drivers_status_idx on public.drivers (status);

-- ---------------------------------------------------------------------------
-- vehicles
-- ---------------------------------------------------------------------------
create table if not exists public.vehicles (
  id              uuid primary key default gen_random_uuid(),
  vehicle_number  text not null unique,
  vehicle_type    public.vehicle_type not null default 'BIKE',
  make            text,
  model           text,
  capacity_kg     numeric(10,2),
  driver_id       uuid references public.drivers (id) on delete set null,
  ownership       public.vehicle_ownership not null default 'OWNED',
  insurance_expiry date,
  permit_expiry   date,
  fitness_expiry  date,
  status          public.account_status not null default 'ACTIVE',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists vehicles_driver_id_idx on public.vehicles (driver_id);
create index if not exists vehicles_type_idx on public.vehicles (vehicle_type);
create index if not exists vehicles_status_idx on public.vehicles (status);

-- ---------------------------------------------------------------------------
-- addresses
-- ---------------------------------------------------------------------------
create table if not exists public.addresses (
  id             uuid primary key default gen_random_uuid(),
  customer_id    uuid not null references public.customers (id) on delete cascade,
  label          text not null default 'Office',
  contact_name   text,
  phone          text,
  address_line_1 text not null,
  address_line_2 text,
  city           text not null,
  state          text not null,
  postal_code    text,
  latitude       numeric(10,7),
  longitude      numeric(10,7),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists addresses_customer_id_idx on public.addresses (customer_id);

-- ---------------------------------------------------------------------------
-- orders + history + assignments + otps
-- ---------------------------------------------------------------------------
create sequence if not exists public.order_number_seq start with 1;

create table if not exists public.orders (
  id                     uuid primary key default gen_random_uuid(),
  order_number           text not null unique,
  tracking_number        text not null unique,
  customer_id            uuid not null references public.customers (id) on delete restrict,
  driver_id              uuid references public.drivers (id) on delete set null,
  vehicle_id             uuid references public.vehicles (id) on delete set null,
  pickup_address_id      uuid not null references public.addresses (id),
  delivery_address_id    uuid not null references public.addresses (id),
  package_type           text not null default 'Package',
  weight_kg              numeric(10,2),
  number_of_packages     int not null default 1 check (number_of_packages > 0),
  distance_km            numeric(10,2) not null default 0 check (distance_km >= 0),
  price                  numeric(12,2) check (price >= 0),
  status                 public.order_status not null default 'REQUESTED',
  scheduled_pickup_at    timestamptz,
  accepted_at            timestamptz,
  picked_up_at           timestamptz,
  delivered_at           timestamptz,
  special_instructions   text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists orders_customer_id_idx on public.orders (customer_id);
create index if not exists orders_driver_id_idx on public.orders (driver_id);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_tracking_number_idx on public.orders (tracking_number);
create index if not exists orders_order_number_idx on public.orders (order_number);
create index if not exists orders_scheduled_pickup_at_idx on public.orders (scheduled_pickup_at);

create table if not exists public.order_status_history (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders (id) on delete cascade,
  status     public.order_status not null,
  changed_by uuid references public.profiles (id) on delete set null,
  notes      text,
  latitude   numeric(10,7),
  longitude  numeric(10,7),
  created_at timestamptz not null default now()
);
create index if not exists order_status_history_order_id_idx on public.order_status_history (order_id);
create index if not exists order_status_history_created_at_idx on public.order_status_history (created_at);

create table if not exists public.order_assignments (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  driver_id   uuid references public.drivers (id),
  vehicle_id  uuid references public.vehicles (id),
  assigned_by uuid references public.profiles (id) on delete set null,
  action      text not null default 'ASSIGN',
  notes       text,
  assigned_at timestamptz not null default now()
);
create index if not exists order_assignments_order_id_idx on public.order_assignments (order_id);

create table if not exists public.order_otps (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders (id) on delete cascade,
  type       public.otp_type not null,
  otp_hash   text not null,
  expires_at timestamptz not null,
  attempts   int not null default 0,
  used_at    timestamptz,
  created_at timestamptz not null default now(),
  unique (order_id, type)
);
create index if not exists order_otps_order_id_idx on public.order_otps (order_id);

-- ---------------------------------------------------------------------------
-- pricing_rules, payments, invoices, leads
-- ---------------------------------------------------------------------------
create table if not exists public.pricing_rules (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  vehicle_type      public.vehicle_type not null,
  base_fare         numeric(12,2) not null default 0,
  per_km_rate       numeric(12,2) not null default 0,
  per_kg_rate       numeric(12,2) not null default 0,
  waiting_charge    numeric(12,2) not null default 0,
  extra_stop_charge numeric(12,2) not null default 0,
  minimum_fare      numeric(12,2) not null default 0,
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.payments (
  id                    uuid primary key default gen_random_uuid(),
  order_id              uuid not null references public.orders (id) on delete restrict,
  customer_id           uuid not null references public.customers (id) on delete restrict,
  amount                numeric(12,2) not null check (amount >= 0),
  payment_method        public.payment_method not null default 'CASH',
  payment_status        public.payment_status not null default 'PENDING',
  transaction_reference text,
  notes                 text,
  recorded_by           uuid references public.profiles (id) on delete set null,
  paid_at               timestamptz,
  created_at            timestamptz not null default now()
);
create index if not exists payments_customer_id_idx on public.payments (customer_id);
create index if not exists payments_order_id_idx on public.payments (order_id);
create index if not exists payments_payment_status_idx on public.payments (payment_status);

create sequence if not exists public.invoice_number_seq start with 1;

create table if not exists public.invoices (
  id             uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  customer_id    uuid not null references public.customers (id) on delete restrict,
  order_id       uuid not null references public.orders (id) on delete restrict,
  subtotal       numeric(12,2) not null default 0,
  tax            numeric(12,2) not null default 0,
  discount       numeric(12,2) not null default 0,
  total          numeric(12,2) not null default 0,
  status         public.invoice_status not null default 'DRAFT',
  issued_at      timestamptz,
  due_at         timestamptz,
  paid_at        timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists invoices_customer_id_idx on public.invoices (customer_id);
create index if not exists invoices_order_id_idx on public.invoices (order_id);
create index if not exists invoices_status_idx on public.invoices (status);

create sequence if not exists public.quote_request_seq start with 1;

create table if not exists public.leads (
  id                   uuid primary key default gen_random_uuid(),
  quote_request_number text,
  business_name        text not null,
  contact_name         text not null,
  phone                text not null,
  email                text,
  service              text,
  pickup_address       text,
  delivery_address     text,
  pickup_date          text,
  package_type         text,
  weight               text,
  number_of_packages   text,
  message              text,
  status               public.lead_status not null default 'NEW',
  source               text default 'website',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_created_at_idx on public.leads (created_at);

-- ---------------------------------------------------------------------------
-- notifications, activity_logs, delivery_proofs
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text not null,
  body       text,
  type       text not null default 'SYSTEM',
  link       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_id_idx on public.notifications (user_id, read);

create table if not exists public.activity_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users (id) on delete set null,
  action      text not null,
  entity_type text,
  entity_id   uuid,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists activity_logs_entity_idx on public.activity_logs (entity_type, entity_id);
create index if not exists activity_logs_created_at_idx on public.activity_logs (created_at);

create table if not exists public.delivery_proofs (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders (id) on delete cascade,
  driver_id    uuid references public.drivers (id) on delete set null,
  photo_url    text,
  signature_url text,
  notes        text,
  created_at   timestamptz not null default now()
);
create index if not exists delivery_proofs_order_id_idx on public.delivery_proofs (order_id);

-- ---------------------------------------------------------------------------
-- Row-level triggers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql
as $$ begin new.updated_at = now(); return new; end;
$$;

do $$ begin create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger trg_customers_updated_at before update on public.customers
  for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger trg_drivers_updated_at before update on public.drivers
  for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger trg_vehicles_updated_at before update on public.vehicles
  for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger trg_addresses_updated_at before update on public.addresses
  for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger trg_orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Helper functions used by RLS policies and security definer functions.
-- NOW placed AFTER tables so they can reference public.profiles.
-- ---------------------------------------------------------------------------
-- Clean up old function name if it exists from previous migration runs
drop function if exists public.current_role();

create or replace function public.current_profile_id()
returns uuid language sql stable security definer set search_path = public
as $$ select id from public.profiles where user_id = auth.uid() limit 1; $$;

create or replace function public.get_current_role()
returns public.user_role language sql stable security definer set search_path = public
as $$ select role from public.profiles where user_id = auth.uid() limit 1; $$;
