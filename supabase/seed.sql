-- ══════════════════════════════════════════════════════════════════════════
-- ScrapKart — seed data for Supabase
-- Run AFTER schema.sql. Mirrors `src/data/seed.ts` so the live app looks
-- exactly like the demo.
-- ══════════════════════════════════════════════════════════════════════════

-- ── categories ───────────────────────────────────────────────────────────
insert into public.categories (slug, name, name_hi, name_mr, icon, tint, description, co2_factor, sort_order)
values
  ('plastic',   'Plastic',    'प्लास्टिक',    'प्लास्टिक',      'bottle',    'bg-sky-100 text-sky-700',        'PET bottles, HDPE containers, caps, buckets, pipes', 2.5, 1),
  ('paper',     'Paper',      'कागज़',        'कागद',           'newspaper', 'bg-amber-100 text-amber-700',    'Newspapers, notebooks, magazines, office paper',     1.1, 2),
  ('cardboard', 'Cardboard',  'गत्ता',        'पुठ्ठा',          'package',   'bg-orange-100 text-orange-700',  'Cartons, shipping boxes, brown board, kraft rolls',  0.9, 3),
  ('steel',     'Steel',      'स्टील',        'स्टील',           'anvil',     'bg-slate-100 text-slate-700',    'Steel rods, sheets, utensils, industrial offcuts',   1.9, 4),
  ('iron',      'Iron',       'लोहा',        'लोखंड',          'wrench',    'bg-zinc-100 text-zinc-700',      'Scrap iron, old machinery, gates, grills, pipes',    1.5, 5),
  ('aluminium', 'Aluminium',  'एल्युमिनियम',  'अ‍ॅल्युमिनियम',   'layers',    'bg-gray-100 text-gray-700',      'Cans, foil, window frames, profiles, utensils',      9.2, 6),
  ('copper',    'Copper',     'तांबा',        'तांबे',            'nut',       'bg-rose-100 text-rose-700',      'Copper wire, pipes, motors, brass fittings',         3.8, 7),
  ('ewaste',    'E-waste',    'ई-कचरा',       'ई-कचरा',          'cpu',       'bg-violet-100 text-violet-700',  'Phones, laptops, TVs, PCBs, batteries, cables',      6.1, 8),
  ('glass',     'Glass',      'कांच',         'काच',             'wine',      'bg-teal-100 text-teal-700',      'Bottles, jars, window panes, broken glassware',      0.6, 9),
  ('other',     'Other',      'अन्य',         'इतर',             'recycle',   'bg-lime-100 text-lime-700',      'Rubber, textiles, mixed scrap, anything else',       0.5, 10)
on conflict (slug) do update
  set name = excluded.name,
      name_hi = excluded.name_hi,
      name_mr = excluded.name_mr,
      description = excluded.description,
      co2_factor = excluded.co2_factor;

-- ── today's rates ────────────────────────────────────────────────────────
insert into public.scrap_rates (category, rate_per_kg, change_pct)
values
  ('plastic', 28, 2.4), ('paper', 12, -1.2), ('cardboard', 9, 0.8),
  ('steel', 34, 1.6), ('iron', 26, -0.6), ('aluminium', 132, 3.1),
  ('copper', 545, 4.2), ('ewaste', 48, -2.1), ('glass', 5, 0),
  ('other', 8, 0.5)
on conflict (category, effective_on) do update set rate_per_kg = excluded.rate_per_kg;

-- ── historical rates (last 7 days) for the trend sparkline ───────────────
insert into public.scrap_rates (category, rate_per_kg, effective_on)
select c.slug,
       round((r.rate * (0.95 + random() * 0.1))::numeric, 2),
       current_date - d
from public.categories c
join (values ('plastic',28),('paper',12),('cardboard',9),('steel',34),('iron',26),
             ('aluminium',132),('copper',545),('ewaste',48),('glass',5),('other',8))
     as r(slug, rate) on r.slug = c.slug
cross join generate_series(1, 7) as d
on conflict (category, effective_on) do nothing;

-- ══════════════════════════════════════════════════════════════════════════
-- Demo accounts
-- Create these users first in Authentication → Users, or run the helper
-- below (it inserts into auth.users directly — dev/demo environments only).
--
--   seller   9876543210  ananya@scrapkart.demo  password: scrap1234
--   buyer    9812345678  rakesh@verma-recyclers.demo
--   admin    9000000001  admin@scrapkart.demo
-- ══════════════════════════════════════════════════════════════════════════

do $$
declare
  seller_id uuid := '11111111-1111-4111-8111-111111111111';
  buyer_id  uuid := '22222222-2222-4222-8222-222222222222';
  admin_id  uuid := '33333333-3333-4333-8333-333333333333';
  listing1  uuid := 'aaaaaaaa-0000-4000-8000-000000000001';
  listing2  uuid := 'aaaaaaaa-0000-4000-8000-000000000002';
  order1    uuid := 'bbbbbbbb-0000-4000-8000-000000000001';
begin
  -- auth.users rows (skip if they already exist)
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
  values
    (seller_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ananya@scrapkart.demo', crypt('scrap1234', gen_salt('bf')), now(), '{"name":"Ananya Deshmukh","role":"seller","phone":"9876543210"}', now(), now()),
    (buyer_id,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rakesh@verma-recyclers.demo', crypt('scrap1234', gen_salt('bf')), now(), '{"name":"Rakesh Verma","role":"buyer","phone":"9812345678"}', now(), now()),
    (admin_id,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@scrapkart.demo', crypt('scrap1234', gen_salt('bf')), now(), '{"name":"ScrapKart Admin","role":"admin","phone":"9000000001"}', now(), now())
  on conflict (id) do nothing;

  -- profiles (in case the trigger did not fire for pre-existing users)
  insert into public.profiles (id, role, name, phone, email, city, state, business_name, gstin,
                               service_areas, verification_status, rating, rating_count, referral_code)
  values
    (seller_id, 'seller', 'Ananya Deshmukh', '9876543210', 'ananya@scrapkart.demo', 'Nagpur', 'Maharashtra', null, null, '{}', 'approved', 4.8, 21, 'ANANYA25'),
    (buyer_id, 'buyer', 'Rakesh Verma', '9812345678', 'rakesh@verma-recyclers.demo', 'Nagpur', 'Maharashtra',
     'Verma Scrap & Recycling Co.', '27AABCV1234M1Z5', '{Nagpur,Kamptee,Wadi}', 'approved', 4.7, 64, 'VERMA10'),
    (admin_id, 'admin', 'ScrapKart Admin', '9000000001', 'admin@scrapkart.demo', 'Nagpur', 'Maharashtra', null, null, '{}', 'approved', 0, 0, 'ADMIN01')
  on conflict (id) do update
    set verification_status = excluded.verification_status,
        business_name = excluded.business_name,
        service_areas = excluded.service_areas;

  -- sample listings
  insert into public.listings (id, seller_id, category, title, description, weight_kg, condition,
                              pickup_address, pickup_city, pickup_pincode, pickup_lat, pickup_lng,
                              preferred_date, preferred_slot, status)
  values
    (listing1, seller_id, 'plastic', '24 kg PET bottles & HDPE containers',
     'Monthly household collection — water bottles, milk jugs and shampoo bottles. All rinsed and caps removed.',
     24, 'clean', 'Flat 402, Shivaji Nagar, Near SBI Bank', 'Nagpur', '440010', 21.1458, 79.0882,
     current_date + 2, 'morning', 'listed'),
    (listing2, seller_id, 'cardboard', '85 kg flattened corrugated cartons',
     'Shop clearance stock. Boxes flattened and bundled, dry storage, no plastic tape.',
     85, 'clean', 'Shop 12, Khamla Road, Pande Layout', 'Nagpur', '440025', 21.1245, 79.0023,
     current_date + 3, 'morning', 'listed')
  on conflict (id) do nothing;

  -- sample offer
  insert into public.offers (listing_id, buyer_id, seller_id, rate_per_kg, amount, message, pickup_date)
  select listing1, buyer_id, seller_id, 30, 720, 'Can pick up tomorrow morning.', current_date + 1
  where not exists (select 1 from public.offers where listing_id = listing1 and buyer_id = buyer_id);

  -- sample completed order + payment
  insert into public.orders (id, listing_id, seller_id, buyer_id, category, agreed_rate,
                            declared_weight_kg, final_weight_kg, pickup_date, payment_mode, status, picked_up_at, paid_at)
  values (order1, listing2, seller_id, buyer_id, 'cardboard', 10.5, 85, 83, current_date - 5, 'upi', 'picked_up',
          now() - interval '5 days', null)
  on conflict (id) do nothing;
end $$;

-- ── make the first admin ─────────────────────────────────────────────────
-- update public.profiles set role = 'admin' where email = 'you@example.com';
