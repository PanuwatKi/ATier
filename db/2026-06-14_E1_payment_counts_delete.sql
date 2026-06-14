-- =============================================================
-- ATier-Web · Phase E1 · Payment counts + delete (Super Admin)
-- Counts for the nav badge/tabs, and tools to clear payment records.
-- Deleting a payment does NOT revoke access (enrollments.payment_id is
-- ON DELETE SET NULL). Functions return slip paths so the client can
-- also delete the slip files (real storage savings).
-- =============================================================

create or replace function public.admin_payment_counts()
returns jsonb language plpgsql security definer set search_path = public as $$
declare pend int := 0; iss int := 0;
begin
  if not public.is_super_admin() then return jsonb_build_object('pending', 0, 'issues', 0); end if;
  select count(*) into pend from payments where status = 'pending';
  select count(*) into iss from payments
    where status <> 'draft' and user_message is not null and length(trim(user_message)) > 0;
  return jsonb_build_object('pending', pend, 'issues', iss);
end; $$;

create or replace function public.admin_delete_payment(p_payment_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare s text;
begin
  if not public.is_super_admin() then raise exception 'FORBIDDEN'; end if;
  select slip_url into s from payments where id = p_payment_id;
  delete from payments where id = p_payment_id;
  return s; -- slip storage path (or null) for the client to remove
end; $$;

-- p_scope: 'resolved' = approved/rejected/cancelled (default, safe),
--          'all' = everything including pending (use with care)
create or replace function public.admin_clear_payments(p_scope text default 'resolved')
returns jsonb language plpgsql security definer set search_path = public as $$
declare slips jsonb;
begin
  if not public.is_super_admin() then raise exception 'FORBIDDEN'; end if;
  if p_scope = 'all' then
    select coalesce(jsonb_agg(slip_url) filter (where slip_url is not null), '[]'::jsonb) into slips from payments;
    delete from payments;
  else
    select coalesce(jsonb_agg(slip_url) filter (where slip_url is not null), '[]'::jsonb) into slips
      from payments where status in ('approved', 'rejected', 'cancelled');
    delete from payments where status in ('approved', 'rejected', 'cancelled');
  end if;
  return slips; -- list of slip storage paths to remove
end; $$;

-- allow Super Admin to delete slip files from the private bucket
drop policy if exists slips_admin_delete on storage.objects;
create policy slips_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'payment-slips' and public.is_super_admin());

grant execute on function public.admin_payment_counts()         to authenticated;
grant execute on function public.admin_delete_payment(uuid)     to authenticated;
grant execute on function public.admin_clear_payments(text)     to authenticated;
