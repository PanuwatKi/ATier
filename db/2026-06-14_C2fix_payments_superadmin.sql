-- =============================================================
-- ATier-Web · Phase C fix · 2026-06-14
-- (2) Payments only reach admin AFTER a slip is attached: new rows
--     start as 'draft' and are hidden until submit_payment_slip().
-- (4) Payment System is Super Admin only (review + settings).
-- =============================================================

create or replace function public.is_super_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'Super Admin');
$$;
grant execute on function public.is_super_admin() to anon, authenticated;

-- payment settings: write restricted to Super Admin
drop policy if exists app_settings_admin on public.app_settings;
create policy app_settings_admin on public.app_settings for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

-- create payment as DRAFT (hidden) until a slip is submitted
create or replace function public.create_payment(p_item_type text, p_item_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); v_title text; v_paid boolean; v_amount numeric; pid uuid;
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_item_type not in ('course', 'exam') then raise exception 'BAD_ITEM_TYPE'; end if;
  if p_item_type = 'course' then
    select title, is_paid, public.effective_price(price, discount_type, discount_value, discount_starts_at, discount_ends_at)
      into v_title, v_paid, v_amount from courses where id = p_item_id;
  else
    select title, is_paid, public.effective_price(price, discount_type, discount_value, discount_starts_at, discount_ends_at)
      into v_title, v_paid, v_amount from exams where id = p_item_id::uuid;
  end if;
  if v_title is null then raise exception 'ITEM_NOT_FOUND'; end if;
  if not coalesce(v_paid, false) then raise exception 'ITEM_IS_FREE'; end if;
  if exists (select 1 from enrollments where user_id = uid and item_type = p_item_type and item_id = p_item_id) then
    return jsonb_build_object('already_enrolled', true);
  end if;
  if v_amount <= 0 then
    insert into enrollments (user_id, item_type, item_id) values (uid, p_item_type, p_item_id)
      on conflict (user_id, item_type, item_id) do nothing;
    return jsonb_build_object('granted_free', true);
  end if;
  select id into pid from payments
    where user_id = uid and item_type = p_item_type and item_id = p_item_id and status in ('draft', 'pending')
    order by created_at desc limit 1;
  if pid is null then
    insert into payments (user_id, item_type, item_id, item_title, amount, status)
    values (uid, p_item_type, p_item_id, v_title, v_amount, 'draft') returning id into pid;
  else
    update payments set amount = v_amount where id = pid;
  end if;
  return jsonb_build_object('payment_id', pid, 'amount', v_amount, 'item_title', v_title);
end; $$;

-- attaching a slip is what actually submits the request (draft -> pending)
create or replace function public.submit_payment_slip(p_payment_id uuid, p_slip_path text)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_slip_path is null or length(trim(p_slip_path)) = 0 then raise exception 'SLIP_REQUIRED'; end if;
  update payments set slip_url = p_slip_path, status = 'pending', note = null
   where id = p_payment_id and user_id = uid and status in ('draft', 'pending', 'rejected');
  if not found then raise exception 'PAYMENT_NOT_FOUND'; end if;
end; $$;

-- review = Super Admin only
create or replace function public.admin_review_payment(p_payment_id uuid, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); pay payments;
begin
  if not public.is_super_admin() then raise exception 'FORBIDDEN'; end if;
  select * into pay from payments where id = p_payment_id;
  if not found then raise exception 'PAYMENT_NOT_FOUND'; end if;
  if p_approve then
    update payments set status = 'approved', note = p_note, reviewed_at = now(), reviewed_by = uid where id = p_payment_id;
    insert into enrollments (user_id, item_type, item_id, payment_id)
    values (pay.user_id, pay.item_type, pay.item_id, pay.id)
    on conflict (user_id, item_type, item_id) do nothing;
  else
    update payments set status = 'rejected', note = p_note, reviewed_at = now(), reviewed_by = uid where id = p_payment_id;
  end if;
end; $$;

-- listing = Super Admin only; drafts (no slip yet) never shown
create or replace function public.admin_list_payments(p_status text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare result jsonb;
begin
  if not public.is_super_admin() then raise exception 'FORBIDDEN'; end if;
  select coalesce(jsonb_agg(row_to_json(t) order by t.created_at desc), '[]'::jsonb) into result
  from (
    select p.id as payment_id, p.user_id, pr.email as user_email, pr.full_name as user_name,
           p.item_type, p.item_id, p.item_title, p.amount, p.method, p.slip_url,
           p.status, p.note, p.created_at, p.reviewed_at
    from payments p left join profiles pr on pr.id = p.user_id
    where p.status <> 'draft' and (p_status is null or p.status = p_status)
  ) t;
  return result;
end; $$;

-- user history: hide incomplete drafts
create or replace function public.my_payments()
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); result jsonb;
begin
  if uid is null then return '[]'::jsonb; end if;
  select coalesce(jsonb_agg(row_to_json(t) order by t.created_at desc), '[]'::jsonb) into result
  from (
    select id as payment_id, item_type, item_id, item_title, amount, status, note, created_at
    from payments where user_id = uid and status <> 'draft'
  ) t;
  return result;
end; $$;
