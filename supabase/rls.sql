alter table organizations enable row level security;
alter table memberships enable row level security;
alter table vehicles enable row level security;
alter table customers enable row level security;
alter table reservations enable row level security;
alter table reservation_payments enable row level security;
alter table maintenance enable row level security;
alter table damage_reports enable row level security;
alter table gps_devices enable row level security;
alter table vehicle_locations enable row level security;
alter table website_settings enable row level security;
alter table activity_logs enable row level security;
alter table audit_logs enable row level security;

create or replace function app.current_org_ids()
returns setof uuid
language sql
stable
security definer
as $$
  select organization_id
  from memberships
  where user_id = auth.uid()::text
$$;

create or replace function app.has_org_role(org_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1
    from memberships
    where organization_id = org_id
      and user_id = auth.uid()::text
      and role::text = any(allowed_roles)
  )
$$;

create policy "members can read own organizations"
on organizations for select
using (id in (select app.current_org_ids()));

create policy "owners can update organization"
on organizations for update
using (app.has_org_role(id, array['OWNER', 'SUPER_ADMIN']));

create policy "members read memberships"
on memberships for select
using (organization_id in (select app.current_org_ids()));

create policy "owners manage memberships"
on memberships for all
using (app.has_org_role(organization_id, array['OWNER', 'SUPER_ADMIN']))
with check (app.has_org_role(organization_id, array['OWNER', 'SUPER_ADMIN']));

create policy "tenant select vehicles"
on vehicles for select
using (organization_id in (select app.current_org_ids()));

create policy "fleet managers write vehicles"
on vehicles for all
using (app.has_org_role(organization_id, array['OWNER', 'MANAGER', 'SUPER_ADMIN']))
with check (app.has_org_role(organization_id, array['OWNER', 'MANAGER', 'SUPER_ADMIN']));

create policy "tenant select customers"
on customers for select
using (organization_id in (select app.current_org_ids()));

create policy "staff write customers"
on customers for all
using (app.has_org_role(organization_id, array['OWNER', 'MANAGER', 'EMPLOYEE', 'SUPER_ADMIN']))
with check (app.has_org_role(organization_id, array['OWNER', 'MANAGER', 'EMPLOYEE', 'SUPER_ADMIN']));

create policy "tenant select reservations"
on reservations for select
using (organization_id in (select app.current_org_ids()));

create policy "staff write reservations"
on reservations for all
using (app.has_org_role(organization_id, array['OWNER', 'MANAGER', 'EMPLOYEE', 'SUPER_ADMIN']))
with check (app.has_org_role(organization_id, array['OWNER', 'MANAGER', 'EMPLOYEE', 'SUPER_ADMIN']));

create policy "tenant select payments"
on reservation_payments for select
using (
  exists (
    select 1 from reservations
    where reservations.id = reservation_payments.reservation_id
      and reservations.organization_id in (select app.current_org_ids())
  )
);

create policy "owner payment writes"
on reservation_payments for all
using (
  exists (
    select 1 from reservations
    where reservations.id = reservation_payments.reservation_id
      and app.has_org_role(reservations.organization_id, array['OWNER', 'MANAGER', 'SUPER_ADMIN'])
  )
);

create policy "tenant scoped maintenance"
on maintenance for all
using (organization_id in (select app.current_org_ids()))
with check (organization_id in (select app.current_org_ids()));

create policy "tenant scoped damage reports"
on damage_reports for all
using (organization_id in (select app.current_org_ids()))
with check (organization_id in (select app.current_org_ids()));

create policy "tenant scoped gps devices"
on gps_devices for all
using (organization_id in (select app.current_org_ids()))
with check (organization_id in (select app.current_org_ids()));

create policy "tenant location reads"
on vehicle_locations for select
using (
  exists (
    select 1 from vehicles
    where vehicles.id = vehicle_locations.vehicle_id
      and vehicles.organization_id in (select app.current_org_ids())
  )
);

create policy "tenant website settings"
on website_settings for all
using (organization_id in (select app.current_org_ids()))
with check (organization_id in (select app.current_org_ids()));

create policy "tenant activity logs read"
on activity_logs for select
using (organization_id in (select app.current_org_ids()));

create policy "tenant audit logs read"
on audit_logs for select
using (app.has_org_role(organization_id, array['OWNER', 'SUPER_ADMIN']));
