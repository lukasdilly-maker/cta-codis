-- CTA CODIS V2 : migration complémentaire (après setup.sql).
-- Exécuter dans Supabase SQL Editor. Aucun DROP TABLE ni suppression de sauvegardes.
begin;
create or replace function public.cta_list_players()
returns table(id uuid,username text)
language sql stable security definer set search_path = ''
as $$
 select p.id,p.username from public.profiles p
 where p.suspended=false and p.id <> (select auth.uid())
 and (select auth.uid()) is not null
 and exists(select 1 from public.profiles me where me.id=(select auth.uid()) and not me.suspended)
 order by p.username limit 500;
$$;
revoke all on function public.cta_list_players() from public,anon;
grant execute on function public.cta_list_players() to authenticated;

create or replace function public.cta_admin_users()
returns table(id uuid,username text,role text,suspended boolean,created_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
 if not exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='superadmin' and not p.suspended)
 then raise exception 'Accès réservé au Super Administrateur'; end if;
 return query select p.id,p.username,p.role,p.suspended,p.created_at from public.profiles p order by p.created_at desc limit 1000;
end;
$$;
revoke all on function public.cta_admin_users() from public,anon;
grant execute on function public.cta_admin_users() to authenticated;

create or replace function public.cta_admin_suspend(p_target uuid,p_suspend boolean)
returns void language plpgsql security definer set search_path = ''
as $$
begin
 if not exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='superadmin' and not p.suspended)
 then raise exception 'Accès réservé au Super Administrateur'; end if;
 if p_target=(select auth.uid()) then raise exception 'Auto-suspension interdite'; end if;
 if not exists(select 1 from public.profiles where id=p_target and role<>'superadmin')
 then raise exception 'Cible inconnue ou protégée'; end if;
 update public.profiles set suspended=p_suspend where id=p_target;
 insert into public.admin_audit_logs(actor_id,action,target_id,details)
 values((select auth.uid()),case when p_suspend then 'suspend' else 'unsuspend' end,p_target,'{}'::jsonb);
end;
$$;
revoke all on function public.cta_admin_suspend(uuid,boolean) from public,anon;
grant execute on function public.cta_admin_suspend(uuid,boolean) to authenticated;

-- Les utilisateurs suspendus ne peuvent plus lire/mettre à jour leurs sauvegardes.
drop policy if exists saves_read on public.game_saves;
create policy saves_read on public.game_saves for select to authenticated using (
 (user_id=(select auth.uid()) and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and not p.suspended))
 or public.is_cta_admin());
drop policy if exists saves_update on public.game_saves;
create policy saves_update on public.game_saves for update to authenticated
 using (user_id=(select auth.uid()) and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and not p.suspended))
 with check (user_id=(select auth.uid()) and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and not p.suspended));

-- Renforts : refus des actions par comptes suspendus.
create or replace function public.respond_to_reinforcement(p_request_id uuid,p_accept boolean)
returns public.reinforcement_requests
language plpgsql security definer set search_path = '' as $$
declare r public.reinforcement_requests;
begin
 if (select auth.uid()) is null or not exists(
  select 1 from public.profiles p where p.id=(select auth.uid()) and not p.suspended
 ) then raise exception 'Compte non autorisé'; end if;
 update public.reinforcement_requests
 set status=case when p_accept then 'accepted' else 'refused' end,updated_at=now()
 where id=p_request_id and recipient_id=(select auth.uid()) and status='pending'
 returning * into r;
 if not found then raise exception 'Demande introuvable ou non autorisée'; end if;
 return r;
end; $$;
revoke all on function public.respond_to_reinforcement(uuid,boolean) from public,anon;
grant execute on function public.respond_to_reinforcement(uuid,boolean) to authenticated;
commit;
