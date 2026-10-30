-- CTA CODIS V2 — envoi sécurisé de renfort, tous rôles.
-- À exécuter une fois dans Supabase SQL Editor.
-- Ne supprime aucune table, politique ou sauvegarde.
begin;
create or replace function public.cta_send_reinforcement(
 p_recipient_id uuid, p_service text, p_vehicle_type text, p_quantity integer
) returns public.reinforcement_requests
language plpgsql security definer set search_path = ''
as $$
declare
 v_sender uuid := auth.uid();
 v_result public.reinforcement_requests;
begin
 if v_sender is null then raise exception 'Connexion requise'; end if;
 if p_recipient_id is null or p_recipient_id = v_sender then
  raise exception 'Destinataire invalide'; end if;
 if p_quantity is null or p_quantity < 1 or p_quantity > 20 then
  raise exception 'Quantité invalide'; end if;
 if p_service is null or p_service not in ('SDIS','Gendarmerie','Police','SMUR','AASC','SNSM') then
  raise exception 'Service invalide'; end if;
 if p_vehicle_type is null or length(btrim(p_vehicle_type)) < 1 or length(p_vehicle_type) > 100 then
  raise exception 'Type de véhicule invalide'; end if;
 if not exists(select 1 from public.profiles where id=v_sender and suspended=false) then
  raise exception 'Expéditeur inactif ou suspendu'; end if;
 if not exists(select 1 from public.profiles where id=p_recipient_id and suspended=false) then
  raise exception 'Destinataire inactif ou suspendu'; end if;
 insert into public.reinforcement_requests(requester_id,recipient_id,service,vehicle_type,quantity)
 values(v_sender,p_recipient_id,p_service,btrim(p_vehicle_type),p_quantity)
 returning * into v_result;
 return v_result;
end;
$$;
revoke all on function public.cta_send_reinforcement(uuid,text,text,integer) from public,anon;
grant execute on function public.cta_send_reinforcement(uuid,text,text,integer) to authenticated;
commit;
