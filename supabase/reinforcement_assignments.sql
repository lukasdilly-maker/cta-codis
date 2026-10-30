-- CTA CODIS V2 : affectations de renforts (étape 1).
-- Exécuter dans Supabase SQL Editor après fix_admin_reinforcements.sql.
begin;
create table if not exists public.cta_reinforcement_assignments (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null references public.reinforcement_requests(id) on delete cascade,
 provider_id uuid not null references auth.users(id) on delete cascade,
 vehicle_id bigint not null,
 vehicle_name text not null,
 vehicle_type text not null,
 station_name text not null,
 status text not null default 'assigned' check(status in ('assigned','released')),
 created_at timestamptz not null default now(),
 released_at timestamptz
);
create unique index if not exists cta_reinforcement_active_vehicle
on public.cta_reinforcement_assignments(provider_id,vehicle_id) where status='assigned';
alter table public.cta_reinforcement_assignments enable row level security;
drop policy if exists cta_assignment_read on public.cta_reinforcement_assignments;
create policy cta_assignment_read on public.cta_reinforcement_assignments for select to authenticated
using (
 provider_id=(select auth.uid()) or exists(
 select 1 from public.reinforcement_requests r where r.id=request_id and r.requester_id=(select auth.uid())
 )
);
create or replace function public.cta_assign_reinforcement(
 p_request_id uuid,p_vehicle_id bigint,p_vehicle_name text,p_vehicle_type text,p_station_name text
) returns public.cta_reinforcement_assignments
language plpgsql security definer set search_path='' as $$
declare v_req public.reinforcement_requests; v_row public.cta_reinforcement_assignments; v_count integer;
begin
 select * into v_req from public.reinforcement_requests where id=p_request_id for update;
 if not found or v_req.recipient_id<>auth.uid() or v_req.status<>'accepted' then
  raise exception 'Demande non acceptée ou non autorisée'; end if;
 if not exists(select 1 from public.profiles where id=auth.uid() and suspended=false) then
  raise exception 'Compte inactif'; end if;
 if p_vehicle_id is null or length(btrim(coalesce(p_vehicle_name,''))) not between 1 and 100
 or length(btrim(coalesce(p_vehicle_type,''))) not between 1 and 100
 or length(btrim(coalesce(p_station_name,''))) not between 1 and 100 then
  raise exception 'Véhicule invalide'; end if;
 select count(*) into v_count from public.cta_reinforcement_assignments
 where request_id=p_request_id and status='assigned';
 if v_count>=v_req.quantity then raise exception 'Quantité de renforts atteinte'; end if;
 insert into public.cta_reinforcement_assignments(request_id,provider_id,vehicle_id,vehicle_name,vehicle_type,station_name)
 values(p_request_id,auth.uid(),p_vehicle_id,btrim(p_vehicle_name),btrim(p_vehicle_type),btrim(p_station_name))
 returning * into v_row;
 return v_row;
end $$;
revoke all on function public.cta_assign_reinforcement(uuid,bigint,text,text,text) from public,anon;
grant execute on function public.cta_assign_reinforcement(uuid,bigint,text,text,text) to authenticated;
create or replace function public.cta_release_reinforcement(p_assignment_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 update public.cta_reinforcement_assignments set status='released',released_at=now()
 where id=p_assignment_id and provider_id=auth.uid() and status='assigned';
 if not found then raise exception 'Affectation introuvable ou non autorisée'; end if;
end $$;
revoke all on function public.cta_release_reinforcement(uuid) from public,anon;
grant execute on function public.cta_release_reinforcement(uuid) to authenticated;
commit;
