-- CTA CODIS V2 : sauvegarde cloud par utilisateur. Exécuter dans SQL Editor si nécessaire.
create table if not exists public.cta_cloud_saves (
 user_id uuid primary key references auth.users(id) on delete cascade,
 payload jsonb not null,
 updated_at timestamptz not null default now()
);
alter table public.cta_cloud_saves enable row level security;
drop policy if exists cta_cloud_select on public.cta_cloud_saves;
create policy cta_cloud_select on public.cta_cloud_saves for select to authenticated using (user_id=(select auth.uid()));
drop policy if exists cta_cloud_insert on public.cta_cloud_saves;
create policy cta_cloud_insert on public.cta_cloud_saves for insert to authenticated with check (user_id=(select auth.uid()));
drop policy if exists cta_cloud_update on public.cta_cloud_saves;
create policy cta_cloud_update on public.cta_cloud_saves for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
