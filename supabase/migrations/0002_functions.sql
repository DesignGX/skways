-- ============================================================================
-- SK Ways Logistics — business-logic functions, triggers and workflow guards.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Idempotent: drop existing triggers/functions before recreating
-- ---------------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists trg_orders_assign_numbers on public.orders;
drop trigger if exists trg_invoices_assign_number on public.invoices;
drop trigger if exists trg_leads_assign_quote_number on public.leads;
drop trigger if exists trg_orders_guard_status_change on public.orders;

-- ===========================================================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- ===========================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role       public.user_role;
  v_profile_id uuid;
  v_name       text;
  v_phone      text;
  v_company    text;
begin
  v_role := coalesce((nullif(new.raw_user_meta_data ->> 'role', ''))::public.user_role, 'CUSTOMER');
  v_name := coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1));
  v_phone := coalesce(new.raw_user_meta_data ->> 'phone', null);
  v_company := coalesce(nullif(new.raw_user_meta_data ->> 'company_name', ''), v_name);

  insert into public.profiles (user_id, role, full_name, phone, email, status)
  values (new.id, v_role, v_name, nullif(v_phone, ''), new.email, 'ACTIVE')
  returning id into v_profile_id;

  if v_role = 'CUSTOMER' then
    insert into public.customers (profile_id, company_name, contact_person, phone, email, status)
    values (v_profile_id, v_company, v_name, nullif(v_phone, ''), new.email, 'ACTIVE');
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===========================================================================
-- ORDER NUMBER ASSIGNMENT (SKW-000123)
-- ===========================================================================

create or replace function public.assign_order_numbers()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_num bigint;
begin
  if new.order_number is null or new.tracking_number is null then
    v_num := nextval('public.order_number_seq');
    new.order_number   := 'SKW-' || lpad(v_num::text, 6, '0');
    new.tracking_number := 'SKW-' || to_char(now(), 'YYYY') || '-' || lpad(v_num::text, 6, '0');
  end if;
  return new;
end;
$$;

create trigger trg_orders_assign_numbers
  before insert on public.orders
  for each row execute function public.assign_order_numbers();

-- ===========================================================================
-- INVOICE NUMBER ASSIGNMENT (INV-2026-000001)
-- ===========================================================================

create or replace function public.assign_invoice_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_num bigint;
begin
  if new.invoice_number is null then
    v_num := nextval('public.invoice_number_seq');
    new.invoice_number := 'INV-' || to_char(now(), 'YYYY') || '-' || lpad(v_num::text, 6, '0');
  end if;
  return new;
end;
$$;

create trigger trg_invoices_assign_number
  before insert on public.invoices
  for each row execute function public.assign_invoice_number();

-- ===========================================================================
-- QUOTE REQUEST NUMBER ASSIGNMENT (Q-2026-000001)
-- ===========================================================================

create or replace function public.assign_quote_request_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_num bigint;
begin
  if new.quote_request_number is null then
    v_num := nextval('public.quote_request_seq');
    new.quote_request_number := 'Q-' || to_char(now(), 'YYYY') || '-' || lpad(v_num::text, 6, '0');
  end if;
  return new;
end;
$$;

create trigger trg_leads_assign_quote_number
  before insert on public.leads
  for each row execute function public.assign_quote_request_number();
-- ===========================================================================
-- OTP FUNCTIONS (PICKUP + DELIVERY)
-- ===========================================================================

create or replace function public.hash_otp(p_otp text)
returns text
language sql
immutable
strict
as $$ select md5(p_otp || current_setting('app.otp_secret', true)); $$;

create or replace function public.generate_order_otp(
  p_order_id uuid,
  p_type public.otp_type,
  p_ttl_minutes int default 30
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_otp      text;
  v_hash     text;
  v_expires  timestamptz;
begin
  v_otp := lpad((floor(100000 + random() * 900000))::text, 6, '0');
  perform set_config('app.otp_secret', 'skways-otp-key', true);
  v_hash := public.hash_otp(v_otp);
  v_expires := now() + (p_ttl_minutes || ' minutes')::interval;

  insert into public.order_otps (order_id, type, otp_hash, expires_at, attempts)
  values (p_order_id, p_type, v_hash, v_expires, 0)
  on conflict (order_id, type)
  do update set otp_hash = excluded.otp_hash, expires_at = excluded.expires_at, attempts = 0, used_at = null;

  return v_otp;
end;
$$;

create or replace function public.verify_order_otp(
  p_order_id uuid,
  p_type public.otp_type,
  p_otp text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash     text;
  v_record   public.order_otps%rowtype;
  v_valid    boolean := false;
begin
  perform set_config('app.otp_secret', 'skways-otp-key', true);

  select * into v_record
  from public.order_otps
  where order_id = p_order_id and type = p_type
  order by created_at desc
  limit 1;

  if v_record.id is null then
    return false;
  end if;

  if v_record.used_at is not null then
    return false;
  end if;

  if v_record.expires_at < now() then
    return false;
  end if;

  if v_record.attempts >= 5 then
    return false;
  end if;

  v_hash := public.hash_otp(p_otp);
  v_valid := (v_hash = v_record.otp_hash);

  if v_valid then
    update public.order_otps
    set used_at = now()
    where id = v_record.id;
  else
    update public.order_otps
    set attempts = attempts + 1
    where id = v_record.id;
  end if;

  return v_valid;
end;
$$;

-- ===========================================================================
-- NOTIFICATIONS HELPERS
-- ===========================================================================

create or replace function public.create_notification(
  p_user_id uuid,
  p_title text,
  p_body text default null,
  p_type text default 'SYSTEM',
  p_link text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, title, body, type, link)
  values (p_user_id, p_title, p_body, p_type, p_link);
end;
$$;

-- ===========================================================================
-- ACTIVITY LOGGING HELPER
-- ===========================================================================

create or replace function public.log_activity(
  p_user_id uuid,
  p_action text,
  p_entity_type text default null,
  p_entity_id uuid default null,
  p_metadata jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.activity_logs (user_id, action, entity_type, entity_id, metadata)
  values (p_user_id, p_action, p_entity_type, p_entity_id, p_metadata);
end;
$$;
-- ===========================================================================
-- ORDER STATE MACHINE WORKFLOW FUNCTIONS
-- ===========================================================================

-- Customer cancels an order (only from REQUESTED or CONFIRMED states)
create or replace function public.cancel_order(
  p_order_id uuid,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order     public.orders%rowtype;
  v_profile   uuid;
  v_cust_uid  uuid;
begin
  select * into v_order from public.orders where id = p_order_id;
  if v_order.id is null then raise exception 'Order not found.'; end if;

  if v_order.status not in ('REQUESTED', 'CONFIRMED') then
    raise exception 'Order cannot be cancelled from status %', v_order.status;
  end if;

  v_profile := public.current_profile_id();
  if v_profile is null then raise exception 'Profile not found.'; end if;

  perform set_config('app.allow_status_change', 'true', true);

  update public.orders
  set status = 'CANCELLED',
      updated_at = now()
  where id = p_order_id;

  insert into public.order_status_history
    (order_id, status, changed_by, notes)
  values
    (p_order_id, 'CANCELLED', v_profile, p_notes);

  select p.user_id into v_cust_uid
  from public.orders o
  join public.customers c on c.id = o.customer_id
  join public.profiles p  on p.id = c.profile_id
  where o.id = p_order_id;

  perform public.create_notification(v_cust_uid,
    'Order cancelled',
    'Your order has been cancelled by SK Ways.',
    'ORDER', '/customer/orders/' || p_order_id);

  perform public.log_activity(v_profile, 'ORDER_CANCELLED', 'orders', p_order_id,
    jsonb_build_object('from', v_order.status, 'to', 'CANCELLED'));
end;
$$;

-- Admin assigns a driver to an order
create or replace function public.assign_driver_to_order(
  p_order_id uuid,
  p_driver_id uuid,
  p_vehicle_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order     public.orders%rowtype;
  v_profile   uuid;
  v_cust_uid  uuid;
begin
  select * into v_order from public.orders where id = p_order_id;
  if v_order.id is null then raise exception 'Order not found.'; end if;

  if v_order.status not in ('REQUESTED', 'CONFIRMED') then
    raise exception 'Cannot assign driver to order in status %', v_order.status;
  end if;

  v_profile := public.current_profile_id();
  if v_profile is null then raise exception 'Profile not found.'; end if;

  perform set_config('app.allow_status_change', 'true', true);

  update public.orders
  set driver_id = p_driver_id,
      vehicle_id = p_vehicle_id,
      status = 'DRIVER_ASSIGNED',
      accepted_at = now(),
      updated_at = now()
  where id = p_order_id;

  insert into public.order_status_history
    (order_id, status, changed_by, notes)
  values
    (p_order_id, 'DRIVER_ASSIGNED', v_profile,
     format('Driver %s assigned', p_driver_id::text));

  insert into public.order_assignments
    (order_id, driver_id, vehicle_id, assigned_by, action)
  values
    (p_order_id, p_driver_id, p_vehicle_id, v_profile, 'ASSIGN');

  select p.user_id into v_cust_uid
  from public.orders o
  join public.customers c on c.id = o.customer_id
  join public.profiles p  on p.id = c.profile_id
  where o.id = p_order_id;

  perform public.create_notification(v_cust_uid,
    'Driver assigned',
    'A driver has been assigned to your order. Track it live.',
    'ORDER', '/customer/track');

  perform public.log_activity(v_profile, 'DRIVER_ASSIGNED', 'orders', p_order_id,
    jsonb_build_object('driver_id', p_driver_id, 'vehicle_id', p_vehicle_id));
end;
$$;

-- Driver confirms pickup (requires OTP)
create or replace function public.driver_confirm_pickup(
  p_order_id uuid,
  p_otp text,
  p_notes text default null,
  p_latitude numeric default null,
  p_longitude numeric default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order     public.orders%rowtype;
  v_profile   uuid;
  v_driver_id uuid;
  v_verified  boolean;
begin
  select * into v_order from public.orders where id = p_order_id;
  if v_order.id is null then raise exception 'Order not found.'; end if;

  v_profile := public.current_profile_id();
  if v_profile is null then raise exception 'Profile not found.'; end if;

  select id into v_driver_id from public.drivers where profile_id = v_profile;
  if v_driver_id is null then raise exception 'Profile is not a driver.'; end if;

  if v_order.driver_id is distinct from v_driver_id then
    raise exception 'That order is not assigned to you.';
  end if;

  if v_order.status != 'DRIVER_ASSIGNED' then
    raise exception 'Order is not in DRIVER_ASSIGNED status (current: %)', v_order.status;
  end if;

  v_verified := public.verify_order_otp(p_order_id, 'PICKUP', p_otp);
  if not v_verified then raise exception 'Invalid or expired pickup OTP.'; end if;

  perform set_config('app.allow_status_change', 'true', true);

  update public.orders
  set status = 'PICKED_UP',
      picked_up_at = now(),
      updated_at = now()
  where id = p_order_id;

  insert into public.order_status_history
    (order_id, status, changed_by, notes, latitude, longitude)
  values
    (p_order_id, 'PICKED_UP', v_profile, p_notes, p_latitude, p_longitude);

  perform public.log_activity(v_profile, 'ORDER_PICKED_UP', 'orders', p_order_id,
    jsonb_build_object('latitude', p_latitude, 'longitude', p_longitude));
end;
$$;

-- Driver confirms delivery (requires OTP)
create or replace function public.driver_confirm_delivery(
  p_order_id uuid,
  p_otp text,
  p_notes text default null,
  p_latitude numeric default null,
  p_longitude numeric default null,
  p_otp_type public.otp_type default 'DELIVERY'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order     public.orders%rowtype;
  v_profile   uuid;
  v_driver_id uuid;
  v_verified  boolean;
begin
  select * into v_order from public.orders where id = p_order_id;
  if v_order.id is null then raise exception 'Order not found.'; end if;

  v_profile := public.current_profile_id();
  if v_profile is null then raise exception 'Profile not found.'; end if;

  select id into v_driver_id from public.drivers where profile_id = v_profile;
  if v_driver_id is null then raise exception 'Profile is not a driver.'; end if;

  if v_order.driver_id is distinct from v_driver_id then
    raise exception 'That order is not assigned to you.';
  end if;

  if v_order.status != 'OUT_FOR_DELIVERY' then
    raise exception 'Order is not in OUT_FOR_DELIVERY status (current: %)', v_order.status;
  end if;

  v_verified := public.verify_order_otp(p_order_id, p_otp_type, p_otp);
  if not v_verified then raise exception 'Invalid or expired delivery OTP.'; end if;

  perform set_config('app.allow_status_change', 'true', true);

  update public.orders
  set status = 'DELIVERED',
      delivered_at = now(),
      updated_at = now()
  where id = p_order_id;

  insert into public.order_status_history
    (order_id, status, changed_by, notes, latitude, longitude)
  values
    (p_order_id, 'DELIVERED', v_profile, p_notes, p_latitude, p_longitude);

  perform public.log_activity(v_profile, 'ORDER_DELIVERED', 'orders', p_order_id,
    jsonb_build_object('latitude', p_latitude, 'longitude', p_longitude));
end;
$$;

-- Driver reports IN_TRANSIT
create or replace function public.driver_update_transit(
  p_order_id uuid,
  p_notes text default null,
  p_latitude numeric default null,
  p_longitude numeric default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order     public.orders%rowtype;
  v_profile   uuid;
  v_driver_id uuid;
begin
  select * into v_order from public.orders where id = p_order_id;
  if v_order.id is null then raise exception 'Order not found.'; end if;

  v_profile := public.current_profile_id();
  if v_profile is null then raise exception 'Profile not found.'; end if;

  select id into v_driver_id from public.drivers where profile_id = v_profile;
  if v_driver_id is null then raise exception 'Profile is not a driver.'; end if;

  if v_order.driver_id is distinct from v_driver_id then
    raise exception 'That order is not assigned to you.';
  end if;

  if v_order.status not in ('PICKED_UP', 'IN_TRANSIT') then
    raise exception 'Order cannot transition to IN_TRANSIT from status %', v_order.status;
  end if;

  perform set_config('app.allow_status_change', 'true', true);

  update public.orders
  set status = 'IN_TRANSIT',
      updated_at = now()
  where id = p_order_id;

  insert into public.order_status_history
    (order_id, status, changed_by, notes, latitude, longitude)
  values
    (p_order_id, 'IN_TRANSIT', v_profile, p_notes, p_latitude, p_longitude);

  perform public.log_activity(v_profile, 'ORDER_IN_TRANSIT', 'orders', p_order_id,
    jsonb_build_object('latitude', p_latitude, 'longitude', p_longitude));
end;
$$;

-- Driver reports OUT_FOR_DELIVERY
create or replace function public.driver_update_out_for_delivery(
  p_order_id uuid,
  p_notes text default null,
  p_latitude numeric default null,
  p_longitude numeric default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order     public.orders%rowtype;
  v_profile   uuid;
  v_driver_id uuid;
begin
  select * into v_order from public.orders where id = p_order_id;
  if v_order.id is null then raise exception 'Order not found.'; end if;

  v_profile := public.current_profile_id();
  if v_profile is null then raise exception 'Profile not found.'; end if;

  select id into v_driver_id from public.drivers where profile_id = v_profile;
  if v_driver_id is null then raise exception 'Profile is not a driver.'; end if;

  if v_order.driver_id is distinct from v_driver_id then
    raise exception 'That order is not assigned to you.';
  end if;

  if v_order.status != 'IN_TRANSIT' then
    raise exception 'Order cannot transition to OUT_FOR_DELIVERY from status %', v_order.status;
  end if;

  perform set_config('app.allow_status_change', 'true', true);

  update public.orders
  set status = 'OUT_FOR_DELIVERY',
      updated_at = now()
  where id = p_order_id;

  insert into public.order_status_history
    (order_id, status, changed_by, notes, latitude, longitude)
  values
    (p_order_id, 'OUT_FOR_DELIVERY', v_profile, p_notes, p_latitude, p_longitude);

  perform public.log_activity(v_profile, 'ORDER_OUT_FOR_DELIVERY', 'orders', p_order_id,
    jsonb_build_object('latitude', p_latitude, 'longitude', p_longitude));
end;
$$;
-- ===========================================================================
-- HARD GUARD TRIGGER: prevents direct status changes
-- ===========================================================================

create or replace function public.guard_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status
     and coalesce(current_setting('app.allow_status_change', true), '') <> 'true' then
    raise exception 'Direct order status changes are not allowed. Use the order workflow functions.';
  end if;
  return new;
end;
$$;

create trigger trg_orders_guard_status_change
  before update on public.orders
  for each row execute function public.guard_order_status_change();
