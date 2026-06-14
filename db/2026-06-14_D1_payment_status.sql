-- =============================================================
-- ATier-Web · Phase D1 · Payment status UX + draft cleanup
-- - users can cancel / report an issue on their own request
-- - account page needs enrollments-with-titles
-- - stale 'draft' payments are auto-removed
-- =============================================================

alter table public.payments add column if not exists user_message text;

-- User cancels their own request (draft/pending/rejected -> cancelled)
create or replace function public.cancel_payment(p_payment_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  update payments set status = 'cancelled'
   where id = p_payment_id and user_id = uid and status in ('draft', 'pending', 'rejected');
  if not found then raise exception 'PAYMENT_NOT_FOUND'; end if;
end; $$;

-- User attaches a message / reports a problem on their own payment
create or replace function public.report_payment_issue(p_payment_id uuid, p_message text)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  update payments set user_message = p_message
   where id = p_payment_id and user_id = uid;
  if not found then raise exception 'PAYMENT_NOT_FOUND'; end if;
end; $$;

-- Enrollments with item titles (for the account page)
create or replace function public.my_enrollments_detailed()
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); result jsonb;
begin
  if uid is null then return '[]'::jsonb; end if;
  select coalesce(jsonb_agg(row_to_json(t) order by t.created_at desc), '[]'::jsonb) into result
  from (
    select e.item_type, e.item_id, e.created_at,
      case when e.item_type = 'course' then (select title from courses where id = e.item_id)
           when e.item_type = 'exam'   then (select title from exams where id = e.item_id::uuid)
      end as title
    from enrollments e where e.user_id = uid
  ) t;
  return result;
end; $$;

-- create_payment: also clears the caller's stale drafts (> 1h) up front
create or replace function public.create_payment(p_item_type text, p_item_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); v_title text; v_paid boolean; v_amount numeric; pid uuid;
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_item_type not in ('course', 'exam') then raise exception 'BAD_ITEM_TYPE'; end if;

  delete from payments where user_id = uid and status = 'draft' and created_at < now() - interval '1 hour';

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

-- admin list: surface user_message
create or replace function public.admin_list_payments(p_status text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare result jsonb;
begin
  if not public.is_super_admin() then raise exception 'FORBIDDEN'; end if;
  select coalesce(jsonb_agg(row_to_json(t) order by t.created_at desc), '[]'::jsonb) into result
  from (
    select p.id as payment_id, p.user_id, pr.email as user_email, pr.full_name as user_name,
           p.item_type, p.item_id, p.item_title, p.amount, p.method, p.slip_url,
           p.status, p.note, p.user_message, p.created_at, p.reviewed_at
    from payments p left join profiles pr on pr.id = p.user_id
    where p.status <> 'draft' and (p_status is null or p.status = p_status)
  ) t;
  return result;
end; $$;

-- user history: include user_message + whether a slip is attached
create or replace function public.my_payments()
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); result jsonb;
begin
  if uid is null then return '[]'::jsonb; end if;
  select coalesce(jsonb_agg(row_to_json(t) order by t.created_at desc), '[]'::jsonb) into result
  from (
    select id as payment_id, item_type, item_id, item_title, amount, status, note,
           user_message, (slip_url is not null) as has_slip, created_at
    from payments where user_id = uid and status <> 'draft'
  ) t;
  return result;
end; $$;

grant execute on function public.cancel_payment(uuid)            to authenticated;
grant execute on function public.report_payment_issue(uuid, text) to authenticated;
grant execute on function public.my_enrollments_detailed()        to authenticated;
