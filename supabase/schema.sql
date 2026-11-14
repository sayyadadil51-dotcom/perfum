-- ══════════════════════════════════════════════════════════════════════════
-- ScrapKart — Supabase schema, triggers and Row Level Security
-- ──────────────────────────────────────────────────────────────────────────
-- Run this whole file in the Supabase SQL editor (Dashboard → SQL → New query).
-- It mirrors `src/lib/types.ts` exactly, so swapping the demo backend for
-- Supabase is a matter of replacing the mutation bodies in
-- `src/context/AppStore.tsx` with `supabase.from(...)` calls.
-- ══════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";
create extension if not exists "postgis";  -- optional: distance filters

-- ── enums ────────────────────────────────────────────────────────────────
do $$ begin
  create type user_role        as enum ('seller', 'buyer', 'admin');
  create type listing_status   as enum ('listed', 'accepted', 'scheduled', 'picked_up', 'paid', 'cancelled');
  create type order_status     as enum ('accepted', 'pickup_scheduled', 'picked_up', 'paid', 'cancelled', 'disputed');
  create type offer_status     as enum ('pending', 'accepted', 'rejected', 'withdrawn', 'countered');
  create type scrap_condition  as enum ('clean', 'mixed', 'dirty');
  create type time_slot        as enum ('morning', 'afternoon', 'evening');
  create type payment_mode     as enum ('upi', 'razorpay', 'cash');
  create type payment_status   as enum ('pending', 'success', 'failed', 'refunded');
  create type verification     as enum ('none', 'pending', 'approved', 'rejected');
  create type account_status   as enum ('active', 'suspended');
  create type notification_kind as enum ('offer', 'order', 'pickup', 'payment', 'chat', 'system', 'approval');
  create type dispute_status   as enum ('open', 'resolved', 'rejected');
  create type language_code    as enum ('en', 'hi', 'mr');
exception when duplicate_object then null; end $$;

-- ── 1. profiles (extends auth.users) ─────────────────────────────────────
create table if not exists public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  role                user_role not null default 'seller',
  name                text not null default '',
  phone               text unique,
  email               text,
  avatar_url          text,
  city                text not null default 'Nagpur',
  state               text not null default 'Maharashtra',
  language            language_code not null default 'en',
  -- buyer / dealer fields
  business_name       text,
  gstin               text,
  service_areas       text[] default '{}',
  verification_status verification not null default 'none',
  verification_note   text,
  -- seller stats
  rating              numeric(2,1) default 0,
  rating_count        integer default 0,
  listings_count      integer default 0,
  completed_orders    integer default 0,
  wallet_balance      numeric(12,2) default 0,
  reward_points       integer default 0,
  referral_code       text unique,
  referred_by         text,
  status              account_status not null default 'active',
  suspended_reason    text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_verification_idx on public.profiles(verification_status);

-- ── 2. categories ────────────────────────────────────────────────────────
create table if not exists public.categories (
  slug        text primary key,          -- 'plastic', 'copper', …
  name        text not null,
  name_hi     text not null,
  name_mr     text not null,
  icon        text not null,
  tint        text not null default '',
  description text default '',
  co2_factor  numeric(6,2) default 0.5,  -- kg CO₂ saved per kg recycled
  unit        text not null default 'kg',
  active      boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ── 3. scrap_rates (daily price per category) ────────────────────────────
create table if not exists public.scrap_rates (
  id          uuid primary key default gen_random_uuid(),
  category    text not null references public.categories(slug) on delete cascade,
  rate_per_kg numeric(10,2) not null check (rate_per_kg > 0),
  change_pct  numeric(6,2) not null default 0,
  effective_on date not null default current_date,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now(),
  unique (category, effective_on)
);
create index if not exists scrap_rates_category_idx on public.scrap_rates(category, effective_on desc);

-- ── 4. listings ──────────────────────────────────────────────────────────
create table if not exists public.listings (
  id               uuid primary key default gen_random_uuid(),
  seller_id        uuid not null references public.profiles(id) on delete cascade,
  category         text not null references public.categories(slug),
  title            text not null check (char_length(title) between 4 and 80),
  description      text default '',
  weight_kg        numeric(10,2) not null check (weight_kg > 0),
  condition        scrap_condition not null default 'mixed',
  pickup_address   text not null,
  pickup_city      text not null,
  pickup_pincode   text not null check (pickup_pincode ~ '^\d{6}$'),
  pickup_lat       double precision not null,
  pickup_lng       double precision not null,
  pickup_point     geography(point, 4326),  -- auto-filled by trigger for distance queries
  preferred_date   date not null,
  preferred_slot   time_slot not null default 'morning',
  asking_price     numeric(10,2) check (asking_price is null or asking_price > 0),
  estimated_price  numeric(12,2) not null default 0,
  status           listing_status not null default 'listed',
  accepted_buyer_id uuid references public.profiles(id),
  views            integer not null default 0,
  offer_count      integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists listings_status_idx on public.listings(status);
create index if not exists listings_seller_idx on public.listings(seller_id);
create index if not exists listings_category_idx on public.listings(category);
create index if not exists listings_point_idx on public.listings using gist (pickup_point);

-- ── 5. listing_images ────────────────────────────────────────────────────
create table if not exists public.listing_images (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  url        text not null,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists listing_images_listing_idx on public.listing_images(listing_id, position);

-- ── 6. offers ────────────────────────────────────────────────────────────
create table if not exists public.offers (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.listings(id) on delete cascade,
  buyer_id    uuid not null references public.profiles(id) on delete cascade,
  seller_id   uuid not null references public.profiles(id) on delete cascade,
  rate_per_kg numeric(10,2) not null check (rate_per_kg > 0),
  amount      numeric(12,2) not null default 0,
  message     text default '',
  pickup_date date not null,
  status      offer_status not null default 'pending',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index if not exists offers_one_pending_per_buyer
  on public.offers(listing_id, buyer_id) where status = 'pending';
create index if not exists offers_listing_idx on public.offers(listing_id);
create index if not exists offers_seller_idx on public.offers(seller_id);

-- ── 7. orders ────────────────────────────────────────────────────────────
create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  code              text unique not null default 'SK-' || lpad((floor(random()*89999)+10000)::text, 5, '0'),
  listing_id        uuid not null references public.listings(id) on delete restrict,
  seller_id         uuid not null references public.profiles(id),
  buyer_id          uuid not null references public.profiles(id),
  category          text not null references public.categories(slug),
  agreed_rate       numeric(10,2) not null check (agreed_rate > 0),
  declared_weight_kg numeric(10,2) not null,
  final_weight_kg   numeric(10,2),
  amount            numeric(12,2) not null default 0,
  status            order_status not null default 'accepted',
  pickup_date       date not null,
  pickup_slot       time_slot not null default 'morning',
  payment_mode      payment_mode,
  payment_id        uuid,
  scheduled_at      timestamptz,
  picked_up_at      timestamptz,
  paid_at           timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists orders_seller_idx on public.orders(seller_id, created_at desc);
create index if not exists orders_buyer_idx on public.orders(buyer_id, created_at desc);
create index if not exists orders_status_idx on public.orders(status);

-- ── 8. payments ──────────────────────────────────────────────────────────
create table if not exists public.payments (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  user_id    uuid not null references public.profiles(id),  -- payee (seller)
  amount     numeric(12,2) not null check (amount > 0),
  mode       payment_mode not null,
  status     payment_status not null default 'pending',
  reference  text not null,
  gateway_id text,          -- razorpay_payment_id
  created_at timestamptz not null default now()
);
create index if not exists payments_user_idx on public.payments(user_id, created_at desc);

-- ── 9. reviews ───────────────────────────────────────────────────────────
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  target_id   uuid not null references public.profiles(id) on delete cascade,
  rating      integer not null check (rating between 1 and 5),
  comment     text not null default '',
  created_at  timestamptz not null default now(),
  unique (order_id, author_id)
);
create index if not exists reviews_target_idx on public.reviews(target_id);

-- ── 10. messages (in-app chat) ───────────────────────────────────────────
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  sender_id  uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 500),
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists messages_thread_idx on public.messages(listing_id, sender_id, recipient_id, created_at);

-- ── 11. notifications ────────────────────────────────────────────────────
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  kind       notification_kind not null default 'system',
  title      text not null,
  body       text not null default '',
  href       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id, read, created_at desc);

-- ── 12. disputes + support tickets ───────────────────────────────────────
create table if not exists public.disputes (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  raised_by  uuid not null references public.profiles(id),
  against    uuid not null references public.profiles(id),
  reason     text not null,
  details    text not null,
  status     dispute_status not null default 'open',
  resolution text,
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete set null,
  name       text not null,
  phone      text not null,
  subject    text not null,
  message    text not null,
  status     text not null default 'open' check (status in ('open','closed')),
  created_at timestamptz not null default now()
);

-- ══════════════════════════════════════════════════════════════════════════
-- Helper functions
-- ══════════════════════════════════════════════════════════════════════════

create or replace function public.current_role_of() returns user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

-- Auto-create a profile row whenever a user signs up.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, phone, email, role, referral_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'phone', new.phone),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'seller'),
    upper(substr(md5(new.id::text), 1, 8))
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep updated_at fresh
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

do $$
declare t text;
begin
  foreach t in array array['profiles','listings','offers','orders'] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I
                    for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- Fill the geography column + estimated price on listings
create or replace function public.sync_listing_point() returns trigger
language plpgsql as $$
begin
  new.pickup_point := st_setsrid(st_makepoint(new.pickup_lng, new.pickup_lat), 4326)::geography;
  if new.estimated_price = 0 then
    new.estimated_price := round(
      new.weight_kg * coalesce(
        new.asking_price,
        (select rate_per_kg from public.scrap_rates r
          where r.category = new.category order by effective_on desc limit 1),
        0
      )
    );
  end if;
  return new;
end $$;

drop trigger if exists listings_point_trigger on public.listings;
create trigger listings_point_trigger
  before insert or update of pickup_lat, pickup_lng on public.listings
  for each row execute function public.sync_listing_point();

-- Recompute order amount when the final weight is recorded
create or replace function public.recalc_order_amount() returns trigger
language plpgsql as $$
begin
  new.amount := round(coalesce(new.final_weight_kg, new.declared_weight_kg) * new.agreed_rate, 2);
  return new;
end $$;

drop trigger if exists orders_amount_trigger on public.orders;
create trigger orders_amount_trigger
  before insert or update of final_weight_kg, agreed_rate on public.orders
  for each row execute function public.recalc_order_amount();

-- When an order is paid: credit the seller wallet, add reward points, notify.
create or replace function public.on_order_paid() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'paid' and (old.status is distinct from 'paid') then
    update public.profiles
       set wallet_balance = wallet_balance + new.amount,
           completed_orders = completed_orders + 1,
           reward_points = reward_points + floor(new.amount / 20)
     where id = new.seller_id;
    update public.profiles
       set completed_orders = completed_orders + 1
     where id = new.buyer_id;
    update public.listings set status = 'paid' where id = new.listing_id;

    insert into public.payments (order_id, user_id, amount, mode, status, reference)
    values (new.id, new.seller_id, new.amount, coalesce(new.payment_mode, 'cash'), 'success',
            'PAY-' || upper(substr(md5(random()::text), 1, 8)));

    insert into public.notifications (user_id, kind, title, body, href)
    values (new.seller_id, 'payment', '₹' || new.amount || ' received',
            'Payment for order ' || new.code || ' has been settled.', '/seller/earnings');
  end if;
  return new;
end $$;

drop trigger if exists orders_paid_trigger on public.orders;
create trigger orders_paid_trigger
  after update of status on public.orders
  for each row execute function public.on_order_paid();

-- Notify the seller whenever a dealer sends an offer
create or replace function public.on_offer_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, kind, title, body, href)
  values (new.seller_id, 'offer', 'New offer received',
          'A dealer offered ₹' || new.rate_per_kg || '/kg.', '/seller/listings/' || new.listing_id);
  update public.listings set offer_count = offer_count + 1 where id = new.listing_id;
  return new;
end $$;

drop trigger if exists offers_created_trigger on public.offers;
create trigger offers_created_trigger
  after insert on public.offers
  for each row execute function public.on_offer_created();

-- ══════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ══════════════════════════════════════════════════════════════════════════
alter table public.profiles        enable row level security;
alter table public.categories      enable row level security;
alter table public.scrap_rates     enable row level security;
alter table public.listings        enable row level security;
alter table public.listing_images  enable row level security;
alter table public.offers          enable row level security;
alter table public.orders          enable row level security;
alter table public.payments        enable row level security;
alter table public.reviews         enable row level security;
alter table public.messages        enable row level security;
alter table public.notifications   enable row level security;
alter table public.disputes        enable row level security;
alter table public.support_tickets enable row level security;

-- profiles: everyone can read the minimal public part; only the owner (or an
-- admin) can update. Phone numbers are exposed by a dedicated view instead.
drop policy if exists "profiles read own or admin" on public.profiles;
create policy "profiles read own or admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles
  for insert with check (auth.uid() = id);

-- categories & rates: public read, admin write
drop policy if exists "categories public read" on public.categories;
create policy "categories public read" on public.categories for select using (true);
drop policy if exists "categories admin write" on public.categories;
create policy "categories admin write" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "rates public read" on public.scrap_rates;
create policy "rates public read" on public.scrap_rates for select using (true);
drop policy if exists "rates admin write" on public.scrap_rates;
create policy "rates admin write" on public.scrap_rates
  for all using (public.is_admin()) with check (public.is_admin());

-- listings: sellers manage their own; verified dealers can read 'listed' ones.
drop policy if exists "listings owner write" on public.listings;
create policy "listings owner write" on public.listings
  for all using (auth.uid() = seller_id or public.is_admin())
  with check (auth.uid() = seller_id or public.is_admin());

drop policy if exists "listings dealers read open" on public.listings;
create policy "listings dealers read open" on public.listings
  for select using (
    status = 'listed'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'buyer' and p.verification_status = 'approved'
    )
  );

drop policy if exists "listings buyer read accepted" on public.listings;
create policy "listings buyer read accepted" on public.listings
  for select using (auth.uid() = accepted_buyer_id);

-- listing images follow the listing
drop policy if exists "listing images readable" on public.listing_images;
create policy "listing images readable" on public.listing_images
  for select using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id
        and (l.seller_id = auth.uid() or l.status = 'listed' or l.accepted_buyer_id = auth.uid() or public.is_admin())
    )
  );
drop policy if exists "listing images owner write" on public.listing_images;
create policy "listing images owner write" on public.listing_images
  for all using (
    exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid())
  ) with check (
    exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid())
  );

-- offers: buyer who made it + the seller of that listing
drop policy if exists "offers parties read" on public.offers;
create policy "offers parties read" on public.offers
  for select using (auth.uid() in (buyer_id, seller_id) or public.is_admin());

drop policy if exists "offers buyer insert" on public.offers;
create policy "offers buyer insert" on public.offers
  for insert with check (
    auth.uid() = buyer_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'buyer' and p.verification_status = 'approved'
    )
    and exists (select 1 from public.listings l where l.id = listing_id and l.status = 'listed')
  );

drop policy if exists "offers parties update" on public.offers;
create policy "offers parties update" on public.offers
  for update using (auth.uid() in (buyer_id, seller_id) or public.is_admin())
  with check (auth.uid() in (buyer_id, seller_id) or public.is_admin());

-- orders: only the two parties (+ admin)
drop policy if exists "orders parties read" on public.orders;
create policy "orders parties read" on public.orders
  for select using (auth.uid() in (seller_id, buyer_id) or public.is_admin());

drop policy if exists "orders insert seller or buyer" on public.orders;
create policy "orders insert seller or buyer" on public.orders
  for insert with check (auth.uid() in (seller_id, buyer_id));

drop policy if exists "orders parties update" on public.orders;
create policy "orders parties update" on public.orders
  for update using (auth.uid() in (seller_id, buyer_id) or public.is_admin())
  with check (auth.uid() in (seller_id, buyer_id) or public.is_admin());

-- payments: payee and payer (derived from the order)
drop policy if exists "payments parties read" on public.payments;
create policy "payments parties read" on public.payments
  for select using (
    auth.uid() = user_id
    or public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_id and auth.uid() in (o.seller_id, o.buyer_id)
    )
  );

drop policy if exists "payments insert via order" on public.payments;
create policy "payments insert via order" on public.payments
  for insert with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and auth.uid() in (o.seller_id, o.buyer_id)
    )
  );

-- reviews: readable by all, written once per order by a party
drop policy if exists "reviews public read" on public.reviews;
create policy "reviews public read" on public.reviews for select using (true);
drop policy if exists "reviews author insert" on public.reviews;
create policy "reviews author insert" on public.reviews
  for insert with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.orders o
      where o.id = order_id and auth.uid() in (o.seller_id, o.buyer_id)
    )
  );

-- messages: participants only, sender must be the author
drop policy if exists "messages parties read" on public.messages;
create policy "messages parties read" on public.messages
  for select using (auth.uid() in (sender_id, recipient_id) or public.is_admin());

drop policy if exists "messages send" on public.messages;
create policy "messages send" on public.messages
  for insert with check (auth.uid() = sender_id);

drop policy if exists "messages mark read" on public.messages;
create policy "messages mark read" on public.messages
  for update using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

-- notifications: recipient only
drop policy if exists "notifications own read" on public.notifications;
create policy "notifications own read" on public.notifications
  for select using (auth.uid() = user_id);
drop policy if exists "notifications own update" on public.notifications;
create policy "notifications own update" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "notifications system insert" on public.notifications;
create policy "notifications system insert" on public.notifications
  for insert with check (true);  -- server-side functions insert on behalf of users

-- disputes
drop policy if exists "disputes parties read" on public.disputes;
create policy "disputes parties read" on public.disputes
  for select using (auth.uid() in (raised_by, against) or public.is_admin());
drop policy if exists "disputes raise" on public.disputes;
create policy "disputes raise" on public.disputes
  for insert with check (auth.uid() = raised_by);
drop policy if exists "disputes admin resolve" on public.disputes;
create policy "disputes admin resolve" on public.disputes
  for update using (public.is_admin()) with check (public.is_admin());

-- support tickets: anyone can create; admins read all, users read their own
drop policy if exists "tickets insert anyone" on public.support_tickets;
create policy "tickets insert anyone" on public.support_tickets
  for insert with check (true);
drop policy if exists "tickets read own or admin" on public.support_tickets;
create policy "tickets read own or admin" on public.support_tickets
  for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "tickets admin update" on public.support_tickets;
create policy "tickets admin update" on public.support_tickets
  for update using (public.is_admin()) with check (public.is_admin());

-- ══════════════════════════════════════════════════════════════════════════
-- Public views (never expose phone numbers of un-involved users)
-- ══════════════════════════════════════════════════════════════════════════
create or replace view public.public_profiles as
  select id, role, name, city, state, business_name, avatar_url,
         rating, rating_count, completed_orders, verification_status, created_at
  from public.profiles
  where status = 'active';

create or replace view public.current_rates as
  select distinct on (category) category, rate_per_kg, change_pct, effective_on
  from public.scrap_rates
  order by category, effective_on desc;

-- ══════════════════════════════════════════════════════════════════════════
-- Storage buckets
-- ══════════════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

drop policy if exists "listing images public read" on storage.objects;
create policy "listing images public read" on storage.objects
  for select using (bucket_id = 'listing-images');

drop policy if exists "listing images owner write" on storage.objects;
create policy "listing images owner write" on storage.objects
  for insert with check (bucket_id = 'listing-images' and auth.uid() is not null);

-- ══════════════════════════════════════════════════════════════════════════
-- Realtime
-- ══════════════════════════════════════════════════════════════════════════
do $$
begin
  begin alter publication supabase_realtime add table public.messages;      exception when others then null; end;
  begin alter publication supabase_realtime add table public.notifications; exception when others then null; end;
  begin alter publication supabase_realtime add table public.offers;        exception when others then null; end;
  begin alter publication supabase_realtime add table public.orders;        exception when others then null; end;
end $$;
