-- FleetPilot AI — Supabase Storage setup
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)
-- after creating your project. It provisions the public bucket the app uploads
-- vehicle photos to, and the access policies it needs.
--
-- The bucket name must match SUPABASE_VEHICLE_IMAGES_BUCKET (default: vehicle-images).

-- 1. Create the bucket (public so <img> tags can load photos on the booking site).
insert into storage.buckets (id, name, public)
values ('vehicle-images', 'vehicle-images', true)
on conflict (id) do update set public = true;

-- 2. Anyone may read images (public booking pages render them).
drop policy if exists "Public read vehicle images" on storage.objects;
create policy "Public read vehicle images"
  on storage.objects for select
  using ( bucket_id = 'vehicle-images' );

-- 3. Authenticated dashboard users may upload / replace / delete images.
--    Uploads from the app use the service-role key (SUPABASE_SERVICE_ROLE_KEY),
--    which bypasses RLS, but these policies also allow signed-in users directly.
drop policy if exists "Authenticated write vehicle images" on storage.objects;
create policy "Authenticated write vehicle images"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'vehicle-images' );

drop policy if exists "Authenticated update vehicle images" on storage.objects;
create policy "Authenticated update vehicle images"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'vehicle-images' );

drop policy if exists "Authenticated delete vehicle images" on storage.objects;
create policy "Authenticated delete vehicle images"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'vehicle-images' );
