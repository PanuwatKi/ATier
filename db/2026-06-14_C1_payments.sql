-- =============================================================
-- ATier-Web · Phase C1 · Payments, enrollment & discounts (DB)
-- PromptPay + slip + admin approval; one-time permanent access.
-- Non-breaking part (no courses column-privilege change here — that
-- ships in C1b together with the updated client).
-- =============================================================

create extension if not exists pgcrypto;

-- ---------------- pricing / discount columns ----------------
alter table public.courses
  add column if not exists price numeric not null default 0,
  add column if not exists is_paid boolean not null default false,
  add column if not exists discount_type text,           -- 'percent' | 'amount' | null
  add column if not exists discount_value numeric not null default 0,
  add column if not exists discount_starts_at timestamptz,
  add column if not exists discount_ends_at timestamptz;

alter table public.exams
  add column if not exists price numeric not null default 0,
  add column if not exists is_paid boolean not null default false,
  add column if not exists discount_type text,
  add column if not exists discount_value numeric not null default 0,
  add column if not exists discount_starts_at timestamptz,
  add column if not exists discount_ends_at timestamptz;

-- read-only helper count so the client never needs the lectures column
alter table public.courses
  add column if not exists lecture_count int
  generated always as (jsonb_array_length(coalesce(lectures, '[]'::jsonb))) stored;

-- ---------------- tables ----------------
create table if not exists public.app_settings (
  id int primary key default 1,
  promptpay_id text default '',
  promptpay_name text default '',
  payment_instructions text default '',
  updated_at timestamptz not null default now(),
  constraint app_settings_singleton check (id = 1)
);
insert into public.app_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  item_type text not null,           -- 'course' | 'exam'
  item_id text not null,
  item_title text,
  amount numeric not null,
  method text not null default 'promptpay',
  slip_url text,                     -- storage path in private bucket payment-slips
  status text not null default 'pending',  -- 'pending' | 'approved' | 'rejected'
  note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);
create index if not exists idx_payments_user on public.payments(user_id);
create index if not exists idx_payments_status on public.payments(status);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  item_type text not null,
  item_id text not null,
  payment_id uuid references public.payments(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, item_type, item_id)
);
create index if not exists idx_enrollments_user on public.enrollments(user_id);

-- ---------------- RLS ----------------
alter table public.app_settings enable row level security;
alter table public.payments     enable row level security;
alter table public.enrollments  enable row level security;

drop policy if exists app_settings_read on public.app_settings;
drop policy if exists app_settings_admin on public.app_settings;
create policy app_settings_read  on public.app_settings for select to public using (true);
create policy app_settings_admin on public.app_settings for all to authenticated
  using (public.is_app_admin()) with check (public.is_app_admin());

-- payments/enrollments: read own or admin; all writes go through RPCs
drop policy if exists payments_read on public.payments;
create policy payments_read on public.payments for select to authenticated
  using (user_id = auth.uid() or public.is_app_admin());

drop policy if exists enrollments_read on public.enrollments;
create policy enrollments_read on public.enrollments for select to authenticated
  using (user_id = auth.uid() or public.is_app_admin());

-- ---------------- private bucket for slips ----------------
insert into storage.buckets (id, name, public)
values ('payment-slips', 'payment-slips', false)
on conflict (id) do nothing;

drop policy if exists slips_insert on storage.objects;
drop policy if exists slips_admin_read on storage.objects;
create policy slips_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'payment-slips');
create policy slips_admin_read on storage.objects for select to authenticated
  using (bucket_id = 'payment-slips' and public.is_app_admin());

-- ---------------- pricing / access helpers ----------------
create or replace function public.effective_price(
  p_price numeric, p_dtype text, p_dval numeric, p_start timestamptz, p_end timestamptz)
returns numeric language sql stable as $$
  select case
    when p_dtype is null or p_dval is null or p_dval <= 0 then p_price
    when p_start is not null and now() < p_start then p_price
    when p_end   is not null and now() > p_end   then p_price
    when p_dtype = 'percent' then greatest(0, round(p_price * (1 - least(p_dval, 100) / 100.0), 2))
    when p_dtype = 'amount'  then greatest(0, p_price - p_dval)
    else p_price
  end;
$$;

create or replace function public.has_access(p_item_type text, p_item_id text)
returns boolean language plpgsql security definer set search_path = public as $$
declare paid boolean;
begin
  if public.is_app_admin() then return true; end if;
  if p_item_type = 'course' then
    select is_paid into paid from courses where id = p_item_id;
  elsif p_item_type = 'exam' then
    select is_paid into paid from exams where id = p_item_id::uuid;
  else
    return false;
  end if;
  if not coalesce(paid, false) then return true; end if;  -- free item
  if auth.uid() is null then return false; end if;
  return exists (
    select 1 from enrollments
    where user_id = auth.uid() and item_type = p_item_type and item_id = p_item_id
  );
end; $$;

-- ---------------- payment RPCs ----------------
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

  if v_amount <= 0 then  -- 100% discount → grant immediately
    insert into enrollments (user_id, item_type, item_id) values (uid, p_item_type, p_item_id)
      on conflict (user_id, item_type, item_id) do nothing;
    return jsonb_build_object('granted_free', true);
  end if;

  select id into pid from payments
    where user_id = uid and item_type = p_item_type and item_id = p_item_id and status = 'pending'
    order by created_at desc limit 1;
  if pid is null then
    insert into payments (user_id, item_type, item_id, item_title, amount)
    values (uid, p_item_type, p_item_id, v_title, v_amount) returning id into pid;
  else
    update payments set amount = v_amount where id = pid;
  end if;

  return jsonb_build_object('payment_id', pid, 'amount', v_amount, 'item_title', v_title);
end; $$;

create or replace function public.submit_payment_slip(p_payment_id uuid, p_slip_path text)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  update payments set slip_url = p_slip_path, status = 'pending', note = null
   where id = p_payment_id and user_id = uid and status in ('pending', 'rejected');
  if not found then raise exception 'PAYMENT_NOT_FOUND'; end if;
end; $$;

create or replace function public.admin_review_payment(p_payment_id uuid, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); pay payments;
begin
  if not public.is_app_admin() then raise exception 'FORBIDDEN'; end if;
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

create or replace function public.admin_list_payments(p_status text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare result jsonb;
begin
  if not public.is_app_admin() then raise exception 'FORBIDDEN'; end if;
  select coalesce(jsonb_agg(row_to_json(t) order by t.created_at desc), '[]'::jsonb) into result
  from (
    select p.id as payment_id, p.user_id, pr.email as user_email, pr.full_name as user_name,
           p.item_type, p.item_id, p.item_title, p.amount, p.method, p.slip_url,
           p.status, p.note, p.created_at, p.reviewed_at
    from payments p left join profiles pr on pr.id = p.user_id
    where (p_status is null or p.status = p_status)
  ) t;
  return result;
end; $$;

create or replace function public.my_payments()
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); result jsonb;
begin
  if uid is null then return '[]'::jsonb; end if;
  select coalesce(jsonb_agg(row_to_json(t) order by t.created_at desc), '[]'::jsonb) into result
  from (
    select id as payment_id, item_type, item_id, item_title, amount, status, note, created_at
    from payments where user_id = uid
  ) t;
  return result;
end; $$;

create or replace function public.my_enrollments()
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); result jsonb;
begin
  if uid is null then return '[]'::jsonb; end if;
  select coalesce(jsonb_agg(jsonb_build_object('item_type', item_type, 'item_id', item_id)), '[]'::jsonb)
    into result from enrollments where user_id = uid;
  return result;
end; $$;

-- Course lecture content is served ONLY to enrolled users / admins.
create or replace function public.get_course_lectures(p_course_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_lectures jsonb; v_exists boolean;
begin
  select true, lectures into v_exists, v_lectures from courses where id = p_course_id;
  if v_exists is null then raise exception 'COURSE_NOT_FOUND'; end if;
  if not public.has_access('course', p_course_id) then raise exception 'PAYMENT_REQUIRED'; end if;
  return coalesce(v_lectures, '[]'::jsonb);
end; $$;

-- ---------------- gate paid exams + expose pricing in listing ----------------
create or replace function public.mock_start_attempt(p_exam_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid(); e public.exams; existing public.exam_attempts;
  q_order uuid[]; opt_orders jsonb := '{}'::jsonb; qid uuid; o_ids uuid[]; att public.exam_attempts;
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into e from public.exams where id = p_exam_id;
  if not found then raise exception 'EXAM_NOT_FOUND'; end if;
  if e.is_hidden and not public.is_app_admin() then raise exception 'EXAM_NOT_AVAILABLE'; end if;
  if e.is_paid and not public.has_access('exam', e.id::text) then raise exception 'PAYMENT_REQUIRED'; end if;

  select * into existing from public.exam_attempts
    where exam_id = p_exam_id and user_id = uid and status = 'in_progress'
    order by started_at desc limit 1;
  if found then
    if existing.deadline_at is not null and now() > existing.deadline_at then
      perform public.mock_submit_attempt(existing.id, existing.answers, true);
    else
      return public.mock_get_attempt(existing.id);
    end if;
  end if;

  if e.shuffle_questions then
    select array_agg(id order by random()) into q_order from public.exam_questions where exam_id = p_exam_id;
  else
    select array_agg(id order by order_index, created_at) into q_order from public.exam_questions where exam_id = p_exam_id;
  end if;
  q_order := coalesce(q_order, '{}');

  foreach qid in array q_order loop
    if e.shuffle_options then
      select array_agg(id order by random()) into o_ids from public.exam_options where question_id = qid;
    else
      select array_agg(id order by order_index, created_at) into o_ids from public.exam_options where question_id = qid;
    end if;
    opt_orders := opt_orders || jsonb_build_object(qid::text, to_jsonb(coalesce(o_ids, '{}'::uuid[])));
  end loop;

  insert into public.exam_attempts (exam_id, user_id, status, time_limit_seconds, deadline_at,
                                    question_order, option_orders, answers, total)
  values (p_exam_id, uid, 'in_progress', e.time_limit_seconds,
          case when e.time_limit_seconds > 0 then now() + make_interval(secs => e.time_limit_seconds) else null end,
          to_jsonb(q_order), opt_orders, '{}'::jsonb, coalesce(array_length(q_order, 1), 0))
  returning * into att;

  return public.mock_get_attempt(att.id);
end; $$;

create or replace function public.mock_list_exams()
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); admin boolean := public.is_app_admin(); result jsonb;
begin
  select coalesce(jsonb_agg(row_to_json(t) order by t.created_at desc), '[]'::jsonb) into result
  from (
    select e.id, e.title, e.description, e.time_limit_seconds, e.shuffle_questions,
           e.shuffle_options, e.pass_percent, e.is_hidden, e.created_at,
           e.price, e.is_paid, e.discount_type, e.discount_value, e.discount_starts_at, e.discount_ends_at,
           public.effective_price(e.price, e.discount_type, e.discount_value, e.discount_starts_at, e.discount_ends_at) as effective_price,
           public.has_access('exam', e.id::text) as has_access,
           (select count(*) from public.exam_questions q where q.exam_id = e.id) as question_count,
           (select count(*) from public.exam_attempts a where a.exam_id = e.id and a.user_id = uid and a.status = 'submitted') as my_attempts,
           (select max(a.percent) from public.exam_attempts a where a.exam_id = e.id and a.user_id = uid and a.status = 'submitted') as my_best,
           exists(select 1 from public.exam_attempts a where a.exam_id = e.id and a.user_id = uid and a.status = 'in_progress') as has_active
    from public.exams e
    where (admin or e.is_hidden = false)
  ) t;
  return result;
end; $$;

-- ---------------- grants ----------------
grant execute on function public.effective_price(numeric, text, numeric, timestamptz, timestamptz) to anon, authenticated;
grant execute on function public.has_access(text, text)                  to anon, authenticated;
grant execute on function public.create_payment(text, text)              to authenticated;
grant execute on function public.submit_payment_slip(uuid, text)         to authenticated;
grant execute on function public.admin_review_payment(uuid, boolean, text) to authenticated;
grant execute on function public.admin_list_payments(text)               to authenticated;
grant execute on function public.my_payments()                           to authenticated;
grant execute on function public.my_enrollments()                        to authenticated;
grant execute on function public.get_course_lectures(text)               to anon, authenticated;
