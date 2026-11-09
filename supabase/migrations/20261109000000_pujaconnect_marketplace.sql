create extension if not exists btree_gist with schema extensions;
set search_path = public, extensions;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pandit_profiles (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  display_name text not null check (length(trim(display_name)) between 1 and 120),
  bio text,
  experience_years integer not null default 0 check (experience_years between 0 and 80),
  languages text[] not null default '{}',
  city text not null check (length(trim(city)) between 1 and 120),
  service_areas text[] not null default '{}',
  verification_status text not null default 'pending' check (verification_status in ('pending', 'verified', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.puja_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) between 1 and 120),
  description text,
  image_url text,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.puja_services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.puja_categories(id) on delete restrict,
  name text not null check (length(trim(name)) between 1 and 160),
  description text not null,
  purpose text,
  duration_minutes integer not null check (duration_minutes between 1 and 1440),
  base_price numeric(10, 2) not null check (base_price >= 0),
  samagri_price numeric(10, 2) not null default 0 check (samagri_price >= 0),
  languages text[] not null default '{}',
  included text[] not null default '{}',
  excluded text[] not null default '{}',
  cancellation_policy text,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, name)
);

create table public.pandit_services (
  id uuid primary key default gen_random_uuid(),
  pandit_user_id uuid not null references public.pandit_profiles(user_id) on delete cascade,
  service_id uuid not null references public.puja_services(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (pandit_user_id, service_id)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(user_id) on delete restrict,
  pandit_user_id uuid references public.pandit_profiles(user_id) on delete set null,
  service_id uuid not null references public.puja_services(id) on delete restrict,
  scheduled_at timestamptz not null,
  duration_minutes integer not null check (duration_minutes between 1 and 1440),
  address text not null check (length(trim(address)) between 3 and 600),
  city text not null check (length(trim(city)) between 1 and 120),
  postal_code text not null check (length(trim(postal_code)) between 3 and 20),
  preferred_language text not null default 'Not specified' check (length(trim(preferred_language)) between 1 and 80),
  notes text check (notes is null or length(notes) <= 2000),
  samagri_included boolean not null default false,
  service_price numeric(10, 2) not null check (service_price >= 0),
  samagri_price numeric(10, 2) not null check (samagri_price >= 0),
  total_price numeric(10, 2) not null check (total_price = service_price + samagri_price),
  status text not null default 'requested' check (status in ('requested', 'accepted', 'declined', 'cancelled', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (scheduled_at > created_at),
  check ((status <> 'accepted') or pandit_user_id is not null),
  exclude using gist (
    pandit_user_id with =,
    tstzrange(scheduled_at, scheduled_at + duration_minutes * interval '1 minute', '[)') with &&
  ) where (status = 'accepted' and pandit_user_id is not null)
);

create index pandit_profiles_verified_city_idx on public.pandit_profiles (city, user_id) where verification_status = 'verified';
create index puja_services_active_category_idx on public.puja_services (category_id, name) where active;
create index pandit_services_service_idx on public.pandit_services (service_id, pandit_user_id);
create index bookings_customer_schedule_idx on public.bookings (customer_id, scheduled_at desc);
create index bookings_pandit_schedule_idx on public.bookings (pandit_user_id, scheduled_at) where pandit_user_id is not null;
create index bookings_status_idx on public.bookings (status, scheduled_at);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger pandit_profiles_set_updated_at before update on public.pandit_profiles for each row execute function public.set_updated_at();
create trigger puja_categories_set_updated_at before update on public.puja_categories for each row execute function public.set_updated_at();
create trigger puja_services_set_updated_at before update on public.puja_services for each row execute function public.set_updated_at();
create trigger bookings_set_updated_at before update on public.bookings for each row execute function public.set_updated_at();

create function public.sync_auth_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, full_name, phone)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    new.phone
  )
  on conflict (user_id) do update
  set full_name = coalesce(excluded.full_name, public.profiles.full_name),
      phone = excluded.phone,
      updated_at = now();
  return new;
end;
$$;

create trigger on_auth_user_profile_sync
after insert or update on auth.users
for each row execute function public.sync_auth_profile();

alter table public.profiles enable row level security;
alter table public.pandit_profiles enable row level security;
alter table public.puja_categories enable row level security;
alter table public.puja_services enable row level security;
alter table public.pandit_services enable row level security;
alter table public.bookings enable row level security;

revoke all on table public.profiles, public.pandit_profiles, public.puja_categories, public.puja_services, public.pandit_services, public.bookings from anon, authenticated;
grant select, update (full_name, avatar_url) on public.profiles to authenticated;
grant select on public.pandit_profiles to anon, authenticated;
grant insert (user_id, display_name, bio, experience_years, languages, city, service_areas), update (display_name, bio, experience_years, languages, city, service_areas) on public.pandit_profiles to authenticated;
grant select on public.puja_categories, public.puja_services, public.pandit_services to anon, authenticated;
grant select on public.bookings to authenticated;

create policy profiles_read_self on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy profiles_update_self on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy pandit_profiles_read_verified on public.pandit_profiles for select to anon, authenticated using (verification_status = 'verified');
create policy pandit_profiles_read_self on public.pandit_profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy pandit_profiles_insert_pending_self on public.pandit_profiles for insert to authenticated with check ((select auth.uid()) = user_id and verification_status = 'pending');
create policy pandit_profiles_update_self on public.pandit_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy puja_categories_read_active on public.puja_categories for select to anon, authenticated using (active);
create policy puja_services_read_active on public.puja_services for select to anon, authenticated using (active and exists (select 1 from public.puja_categories c where c.id = category_id and c.active));
create policy pandit_services_read_public_verified on public.pandit_services for select to anon, authenticated using (
  exists (select 1 from public.pandit_profiles p where p.user_id = pandit_user_id and p.verification_status = 'verified')
  and exists (select 1 from public.puja_services s where s.id = service_id and s.active)
);

create policy bookings_read_customer_or_assigned_pandit on public.bookings for select to authenticated using (
  customer_id = (select auth.uid())
  or pandit_user_id = (select auth.uid())
  or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

create function public.create_booking(
  p_service_id uuid,
  p_scheduled_at timestamptz,
  p_address text,
  p_city text,
  p_postal_code text,
  p_notes text default null,
  p_samagri_included boolean default false,
  p_pandit_user_id uuid default null,
  p_preferred_language text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid := auth.uid();
  v_service public.puja_services%rowtype;
  v_booking public.bookings%rowtype;
begin
  if v_customer_id is null then raise exception 'Sign in before requesting a booking'; end if;
  if p_scheduled_at <= now() then raise exception 'Choose a future date and time'; end if;
  if length(trim(coalesce(p_address, ''))) < 3 or length(trim(coalesce(p_city, ''))) < 1 or length(trim(coalesce(p_postal_code, ''))) < 3 then
    raise exception 'Address, city and postal code are required';
  end if;

  select s.* into v_service
  from public.puja_services s
  join public.puja_categories c on c.id = s.category_id and c.active
  where s.id = p_service_id and s.active
  for share of s;
  if not found then raise exception 'This puja service is unavailable'; end if;

  if p_pandit_user_id is not null and not exists (
    select 1 from public.pandit_profiles pp
    join public.pandit_services ps on ps.pandit_user_id = pp.user_id
    where pp.user_id = p_pandit_user_id
      and pp.verification_status = 'verified'
      and ps.service_id = v_service.id
  ) then
    raise exception 'The selected pandit is not verified for this service';
  end if;

  insert into public.bookings (
    customer_id, pandit_user_id, service_id, scheduled_at, duration_minutes,
    address, city, postal_code, preferred_language, notes, samagri_included, service_price,
    samagri_price, total_price, status
  ) values (
    v_customer_id, p_pandit_user_id, v_service.id, p_scheduled_at, v_service.duration_minutes,
    trim(p_address), trim(p_city), trim(p_postal_code), coalesce(nullif(trim(coalesce(p_preferred_language, '')), ''), 'Not specified'), nullif(trim(coalesce(p_notes, '')), ''),
    coalesce(p_samagri_included, false), v_service.base_price,
    case when coalesce(p_samagri_included, false) then v_service.samagri_price else 0 end,
    v_service.base_price + case when coalesce(p_samagri_included, false) then v_service.samagri_price else 0 end,
    'requested'
  ) returning * into v_booking;
  return v_booking;
end;
$$;

create function public.accept_booking(p_booking_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_booking public.bookings%rowtype;
begin
  if v_user_id is null then raise exception 'Sign in to accept a booking'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));
  select * into v_booking from public.bookings where id = p_booking_id and pandit_user_id = v_user_id for update;
  if not found or v_booking.status <> 'requested' then raise exception 'This request is no longer available'; end if;
  if not exists (select 1 from public.pandit_profiles where user_id = v_user_id and verification_status = 'verified') then
    raise exception 'Only verified pandits can accept bookings';
  end if;
  if exists (
    select 1 from public.bookings b
    where b.pandit_user_id = v_user_id and b.status = 'accepted' and b.id <> v_booking.id
      and tstzrange(b.scheduled_at, b.scheduled_at + b.duration_minutes * interval '1 minute', '[)')
      && tstzrange(v_booking.scheduled_at, v_booking.scheduled_at + v_booking.duration_minutes * interval '1 minute', '[)')
  ) then raise exception 'This time overlaps another accepted booking'; end if;
  update public.bookings set status = 'accepted' where id = v_booking.id returning * into v_booking;
  return v_booking;
end;
$$;

create function public.decline_booking(p_booking_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings%rowtype;
begin
  update public.bookings set status = 'declined'
  where id = p_booking_id and pandit_user_id = auth.uid() and status = 'requested'
  returning * into v_booking;
  if not found then raise exception 'This request cannot be declined'; end if;
  return v_booking;
end;
$$;

create function public.cancel_booking(p_booking_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings%rowtype;
begin
  update public.bookings set status = 'cancelled'
  where id = p_booking_id and customer_id = auth.uid()
    and status in ('requested', 'accepted') and scheduled_at > now()
  returning * into v_booking;
  if not found then raise exception 'This booking cannot be cancelled'; end if;
  return v_booking;
end;
$$;

create function public.complete_booking(p_booking_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings%rowtype;
begin
  update public.bookings set status = 'completed'
  where id = p_booking_id and pandit_user_id = auth.uid()
    and status = 'accepted' and scheduled_at + duration_minutes * interval '1 minute' <= now()
  returning * into v_booking;
  if not found then raise exception 'This booking is not eligible for completion'; end if;
  return v_booking;
end;
$$;

create function public.assign_booking(p_booking_id uuid, p_pandit_user_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings%rowtype;
begin
  if (select auth.jwt() -> 'app_metadata' ->> 'role') is distinct from 'admin' then raise exception 'Administrator access required'; end if;
  update public.bookings b set pandit_user_id = p_pandit_user_id
  where b.id = p_booking_id and b.status = 'requested' and b.pandit_user_id is null
    and exists (
      select 1 from public.pandit_profiles pp
      join public.pandit_services ps on ps.pandit_user_id = pp.user_id
      where pp.user_id = p_pandit_user_id and pp.verification_status = 'verified' and ps.service_id = b.service_id
    )
  returning * into v_booking;
  if not found then raise exception 'Booking or verified pandit assignment is invalid'; end if;
  return v_booking;
end;
$$;

create function public.set_pandit_verification(p_pandit_user_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.jwt() -> 'app_metadata' ->> 'role') is distinct from 'admin' then raise exception 'Administrator access required'; end if;
  if p_status not in ('pending', 'verified', 'rejected') then raise exception 'Invalid verification status'; end if;
  update public.pandit_profiles set verification_status = p_status where user_id = p_pandit_user_id;
  if not found then raise exception 'Pandit profile not found'; end if;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.sync_auth_profile() from public, anon, authenticated;
revoke all on function public.create_booking(uuid, timestamptz, text, text, text, text, boolean, uuid, text) from public, anon, authenticated;
revoke all on function public.accept_booking(uuid) from public, anon, authenticated;
revoke all on function public.decline_booking(uuid) from public, anon, authenticated;
revoke all on function public.cancel_booking(uuid) from public, anon, authenticated;
revoke all on function public.complete_booking(uuid) from public, anon, authenticated;
revoke all on function public.assign_booking(uuid, uuid) from public, anon, authenticated;
revoke all on function public.set_pandit_verification(uuid, text) from public, anon, authenticated;
grant execute on function public.create_booking(uuid, timestamptz, text, text, text, text, boolean, uuid, text) to authenticated;
grant execute on function public.accept_booking(uuid) to authenticated;
grant execute on function public.decline_booking(uuid) to authenticated;
grant execute on function public.cancel_booking(uuid) to authenticated;
grant execute on function public.complete_booking(uuid) to authenticated;
grant execute on function public.assign_booking(uuid, uuid) to authenticated;
grant execute on function public.set_pandit_verification(uuid, text) to authenticated;
