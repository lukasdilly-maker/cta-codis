-- CTA CODIS V2 | Cooperation V1 | migration proposal (NOT applied to Supabase)
-- Requires auth.uid() identities. Verify existing profiles/game_saves before applying.
create extension if not exists pgcrypto;

create table if not exists public.coop_requests (
 id uuid primary key default gen_random_uuid(),
 requester_id uuid not null references auth.users(id),
 provider_id uuid not null references auth.users(id),
 requester_incident_id text not null,
 requested_service text not null,
 requested_vehicle_type text not null,
 note text not null default '',
 status text not null default 'pending' check(status in ('pending','accepted','refused','cancelled','completed')),
 selected_vehicle_id text,
 created_at timestamptz not null default now(),
 decided_at timestamptz,
 completed_at timestamptz,
 check (requester_id <> provider_id),
 check (status not in ('accepted','completed') or selected_vehicle_id is not null)
);
create index if not exists coop_requests_requester_idx on public.coop_requests(requester_id,created_at desc);
create index if not exists coop_requests_provider_idx on public.coop_requests(provider_id,status,created_at desc);

-- One active external mission per provider-owned vehicle.
create unique index if not exists coop_one_active_mission_per_vehicle
 on public.coop_requests(provider_id,selected_vehicle_id)
 where status = 'accepted';

create table if not exists public.coop_radio_events (
 id bigint generated always as identity primary key,
 request_id uuid not null references public.coop_requests(id) on delete cascade,
 actor_id uuid not null references auth.users(id),
 event_type text not null check(event_type in ('accepted','departed','enroute','onscene','transport','hospital','returning','available','note')),
 radio_status text,
 details text not null default '',
 created_at timestamptz not null default now()
);
create index if not exists coop_radio_events_request_idx on public.coop_radio_events(request_id,id);

alter table public.coop_requests enable row level security;
alter table public.coop_radio_events enable row level security;

-- Participants may read their own requests; only requester may create a pending request.
create policy "coop requests participants read" on public.coop_requests
 for select to authenticated using(auth.uid() = requester_id or auth.uid() = provider_id);
create policy "coop requests requester insert" on public.coop_requests
 for insert to authenticated with check(auth.uid() = requester_id and status = 'pending'
 and selected_vehicle_id is null and decided_at is null and completed_at is null);
-- No direct UPDATE/DELETE policy. Transitions must go through SECURITY DEFINER RPCs.

create policy "coop events participants read" on public.coop_radio_events
 for select to authenticated using(exists(
 select 1 from public.coop_requests r where r.id = request_id
 and (r.requester_id = auth.uid() or r.provider_id = auth.uid())
));
-- No direct INSERT/UPDATE/DELETE policy for events; use validated RPCs.

-- Atomic accept: owner selects one of their vehicles, and active vehicle uniqueness is enforced.
-- IMPORTANT: this RPC verifies identity and request state, but cannot prove vehicle ownership
-- or availability until integrated with the authoritative game-save schema.
-- Keep it REVOKED until server-side vehicle validation is implemented.
create or replace function public.coop_accept_request(p_request_id uuid,p_vehicle_id text)
returns public.coop_requests
language plpgsql security definer set search_path = public, pg_temp
as $$
declare r public.coop_requests;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if nullif(btrim(p_vehicle_id),'') is null then raise exception 'Vehicle required'; end if;
 update public.coop_requests
 set status='accepted',selected_vehicle_id=p_vehicle_id,decided_at=now()
 where id=p_request_id and provider_id=auth.uid() and status='pending'
 returning * into r;
 if not found then raise exception 'Request unavailable or unauthorized'; end if;
 insert into public.coop_radio_events(request_id,actor_id,event_type,radio_status)
 values(r.id,auth.uid(),'accepted','planning');
 return r;
end;
$$;
revoke all on function public.coop_accept_request(uuid,text) from public,anon,authenticated;

create or replace function public.coop_refuse_request(p_request_id uuid)
returns public.coop_requests
language plpgsql security definer set search_path = public, pg_temp
as $$
declare r public.coop_requests;
begin
 update public.coop_requests set status='refused',decided_at=now()
 where id=p_request_id and provider_id=auth.uid() and status='pending'
 returning * into r;
 if not found then raise exception 'Request unavailable or unauthorized'; end if;
 return r;
end;
$$;
revoke all on function public.coop_refuse_request(uuid) from public,anon;
grant execute on function public.coop_refuse_request(uuid) to authenticated;

create or replace function public.coop_cancel_request(p_request_id uuid)
returns public.coop_requests
language plpgsql security definer set search_path = public, pg_temp
as $$
declare r public.coop_requests;
begin
 update public.coop_requests set status='cancelled'
 where id=p_request_id and requester_id=auth.uid() and status='pending'
 returning * into r;
 if not found then raise exception 'Request unavailable or unauthorized'; end if;
 return r;
end;
$$;
revoke all on function public.coop_cancel_request(uuid) from public,anon;
grant execute on function public.coop_cancel_request(uuid) to authenticated;

-- Follow-up: implement server-validated coop_complete_request and coop_record_radio_event
-- once vehicle ownership and canonical status storage are confirmed.
