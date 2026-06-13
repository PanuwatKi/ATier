-- =============================================================
-- ATier-Web · Phase B1 · Mock Exam schema + RLS + RPCs  2026-06-13
-- Security model: correct answers (is_correct) and explanations are
-- NEVER readable by normal users via the tables. Direct SELECT on
-- questions/options is admin-only. Users interact ONLY through the
-- SECURITY DEFINER RPCs below, which serve sanitized data and grade
-- on the server. Scoring = correct/total as %, no negative marking.
-- =============================================================

create extension if not exists pgcrypto;

-- exam-assets bucket for question/option images (storage RLS set in A1)
insert into storage.buckets (id, name, public)
values ('exam-assets', 'exam-assets', true)
on conflict (id) do nothing;

-- ---------------- TABLES ----------------
create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  time_limit_seconds int not null default 3600,   -- 0 = no time limit
  shuffle_questions boolean not null default true,
  shuffle_options boolean not null default true,
  pass_percent int not null default 50,
  is_hidden boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exam_questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  order_index int not null default 0,
  question_text text not null,
  image_url text,
  explanation text,
  explanation_visible boolean not null default true,  -- per-question: reveal detailed explanation to users after submit
  allow_multiple boolean not null default false,      -- single (radio) vs multiple (checkbox) correct
  points numeric not null default 1,
  created_at timestamptz not null default now()
);
create index if not exists idx_exam_questions_exam on public.exam_questions(exam_id);

create table if not exists public.exam_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.exam_questions(id) on delete cascade,
  order_index int not null default 0,
  option_text text not null default '',
  image_url text,
  is_correct boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_exam_options_q on public.exam_options(question_id);

create table if not exists public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  status text not null default 'in_progress',         -- 'in_progress' | 'submitted'
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  time_limit_seconds int not null default 0,
  deadline_at timestamptz,
  question_order jsonb not null default '[]',          -- [question_id, ...] in this attempt's order
  option_orders jsonb not null default '{}',           -- { question_id: [option_id, ...] }
  answers jsonb not null default '{}',                 -- { question_id: [selected_option_id, ...] }
  score numeric,
  total numeric,
  percent numeric,
  auto_submitted boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_exam_attempts_user on public.exam_attempts(user_id);
create index if not exists idx_exam_attempts_exam on public.exam_attempts(exam_id);

-- ---------------- RLS ----------------
alter table public.exams          enable row level security;
alter table public.exam_questions enable row level security;
alter table public.exam_options   enable row level security;
alter table public.exam_attempts  enable row level security;

drop policy if exists exams_read        on public.exams;
drop policy if exists exams_admin_write on public.exams;
create policy exams_read on public.exams for select to public
  using (is_hidden = false or public.is_app_admin());
create policy exams_admin_write on public.exams for all to authenticated
  using (public.is_app_admin()) with check (public.is_app_admin());

-- questions/options: admin-only direct access (users go through RPCs)
drop policy if exists exam_questions_admin on public.exam_questions;
create policy exam_questions_admin on public.exam_questions for all to authenticated
  using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists exam_options_admin on public.exam_options;
create policy exam_options_admin on public.exam_options for all to authenticated
  using (public.is_app_admin()) with check (public.is_app_admin());

-- attempts: a user owns their attempts; admins can read all (stats)
drop policy if exists exam_attempts_rw on public.exam_attempts;
create policy exam_attempts_rw on public.exam_attempts for all to authenticated
  using (user_id = auth.uid() or public.is_app_admin())
  with check (user_id = auth.uid());

-- ---------------- RPCs (SECURITY DEFINER) ----------------

-- Sanitized payload for taking/resuming an attempt (NO is_correct / explanation)
create or replace function public.mock_get_attempt(p_attempt_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  att public.exam_attempts;
  e public.exams;
  questions jsonb := '[]'::jsonb;
  qid_text text; qid uuid; q public.exam_questions;
  opts jsonb; remaining int;
begin
  select * into att from public.exam_attempts where id = p_attempt_id;
  if not found then raise exception 'ATTEMPT_NOT_FOUND'; end if;
  if att.user_id <> uid and not public.is_app_admin() then raise exception 'FORBIDDEN'; end if;
  select * into e from public.exams where id = att.exam_id;

  for qid_text in select jsonb_array_elements_text(att.question_order) loop
    qid := qid_text::uuid;
    select * into q from public.exam_questions where id = qid;
    if not found then continue; end if;
    select coalesce(jsonb_agg(jsonb_build_object(
             'id', o.id, 'option_text', o.option_text, 'image_url', o.image_url
           ) order by ord.idx), '[]'::jsonb)
      into opts
    from jsonb_array_elements_text(att.option_orders -> qid_text) with ordinality as ord(oid, idx)
    join public.exam_options o on o.id = ord.oid::uuid;
    questions := questions || jsonb_build_array(jsonb_build_object(
      'id', q.id, 'question_text', q.question_text, 'image_url', q.image_url,
      'allow_multiple', q.allow_multiple, 'options', coalesce(opts, '[]'::jsonb)
    ));
  end loop;

  remaining := case when att.deadline_at is not null
                    then greatest(0, floor(extract(epoch from (att.deadline_at - now()))))::int
                    else null end;

  return jsonb_build_object(
    'attempt_id', att.id, 'exam_id', att.exam_id,
    'title', e.title, 'description', e.description,
    'status', att.status, 'time_limit_seconds', att.time_limit_seconds,
    'remaining_seconds', remaining, 'deadline_at', att.deadline_at,
    'answers', att.answers, 'total', att.total, 'questions', questions
  );
end; $$;

-- Full results AFTER submission (reveals correct ids + explanation if visible)
create or replace function public.mock_get_results(p_attempt_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  att public.exam_attempts; e public.exams;
  questions jsonb := '[]'::jsonb;
  qid_text text; qid uuid; q public.exam_questions;
  opts jsonb; correct_ids jsonb; selected jsonb;
begin
  select * into att from public.exam_attempts where id = p_attempt_id;
  if not found then raise exception 'ATTEMPT_NOT_FOUND'; end if;
  if att.user_id <> uid and not public.is_app_admin() then raise exception 'FORBIDDEN'; end if;
  select * into e from public.exams where id = att.exam_id;

  for qid_text in select jsonb_array_elements_text(att.question_order) loop
    qid := qid_text::uuid;
    select * into q from public.exam_questions where id = qid;
    if not found then continue; end if;
    select coalesce(jsonb_agg(jsonb_build_object(
             'id', o.id, 'option_text', o.option_text, 'image_url', o.image_url, 'is_correct', o.is_correct
           ) order by ord.idx), '[]'::jsonb)
      into opts
    from jsonb_array_elements_text(att.option_orders -> qid_text) with ordinality as ord(oid, idx)
    join public.exam_options o on o.id = ord.oid::uuid;
    select coalesce(jsonb_agg(o.id), '[]'::jsonb) into correct_ids
      from public.exam_options o where o.question_id = qid and o.is_correct;
    selected := coalesce(att.answers -> qid_text, '[]'::jsonb);
    questions := questions || jsonb_build_array(jsonb_build_object(
      'id', q.id, 'question_text', q.question_text, 'image_url', q.image_url,
      'allow_multiple', q.allow_multiple, 'options', coalesce(opts, '[]'::jsonb),
      'selected', selected, 'correct_ids', correct_ids,
      'explanation', case when q.explanation_visible then q.explanation else null end,
      'explanation_visible', q.explanation_visible
    ));
  end loop;

  return jsonb_build_object(
    'attempt_id', att.id, 'exam_id', att.exam_id, 'title', e.title,
    'status', att.status, 'score', att.score, 'total', att.total, 'percent', att.percent,
    'pass_percent', e.pass_percent, 'auto_submitted', att.auto_submitted,
    'submitted_at', att.submitted_at, 'questions', questions
  );
end; $$;

-- Submit + grade on the server (exact-set match per question)
create or replace function public.mock_submit_attempt(p_attempt_id uuid, p_answers jsonb default null, p_auto boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  att public.exam_attempts; ans jsonb;
  qid_text text; qid uuid;
  correct_ids uuid[]; selected_ids uuid[];
  is_q_correct boolean; correct_count int := 0; total_count int := 0; expired boolean := false;
begin
  select * into att from public.exam_attempts where id = p_attempt_id;
  if not found then raise exception 'ATTEMPT_NOT_FOUND'; end if;
  if att.user_id <> uid and not public.is_app_admin() then raise exception 'FORBIDDEN'; end if;
  if att.status = 'submitted' then return public.mock_get_results(p_attempt_id); end if;

  ans := coalesce(p_answers, att.answers, '{}'::jsonb);
  if att.deadline_at is not null and now() > att.deadline_at then expired := true; end if;

  for qid_text in select jsonb_array_elements_text(att.question_order) loop
    qid := qid_text::uuid;
    total_count := total_count + 1;
    select coalesce(array_agg(id), '{}') into correct_ids
      from public.exam_options where question_id = qid and is_correct;
    select coalesce(array_agg(value::uuid), '{}') into selected_ids
      from jsonb_array_elements_text(coalesce(ans -> qid_text, '[]'::jsonb)) as value;
    is_q_correct := (
      array_length(correct_ids, 1) is not null
      and (select count(*) from (select unnest(correct_ids) except select unnest(selected_ids)) z) = 0
      and (select count(*) from (select unnest(selected_ids) except select unnest(correct_ids)) z) = 0
    );
    if is_q_correct then correct_count := correct_count + 1; end if;
  end loop;

  update public.exam_attempts set
    status = 'submitted', submitted_at = now(), answers = ans,
    score = correct_count, total = total_count,
    percent = case when total_count > 0 then round((correct_count::numeric / total_count) * 100, 2) else 0 end,
    auto_submitted = (p_auto or expired)
  where id = p_attempt_id;

  return public.mock_get_results(p_attempt_id);
end; $$;

-- Save in-progress answers (for resume); rejected once submitted
create or replace function public.mock_save_progress(p_attempt_id uuid, p_answers jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); att public.exam_attempts;
begin
  select * into att from public.exam_attempts where id = p_attempt_id;
  if not found then raise exception 'ATTEMPT_NOT_FOUND'; end if;
  if att.user_id <> uid then raise exception 'FORBIDDEN'; end if;
  if att.status <> 'in_progress' then raise exception 'ALREADY_SUBMITTED'; end if;
  update public.exam_attempts set answers = coalesce(p_answers, '{}'::jsonb) where id = p_attempt_id;
end; $$;

-- List exams for the catalogue (+ this user's stats). Callable by anyone.
create or replace function public.mock_list_exams()
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); admin boolean := public.is_app_admin(); result jsonb;
begin
  select coalesce(jsonb_agg(row_to_json(t) order by t.created_at desc), '[]'::jsonb) into result
  from (
    select e.id, e.title, e.description, e.time_limit_seconds, e.shuffle_questions,
           e.shuffle_options, e.pass_percent, e.is_hidden, e.created_at,
           (select count(*) from public.exam_questions q where q.exam_id = e.id) as question_count,
           (select count(*) from public.exam_attempts a where a.exam_id = e.id and a.user_id = uid and a.status = 'submitted') as my_attempts,
           (select max(a.percent) from public.exam_attempts a where a.exam_id = e.id and a.user_id = uid and a.status = 'submitted') as my_best,
           exists(select 1 from public.exam_attempts a where a.exam_id = e.id and a.user_id = uid and a.status = 'in_progress') as has_active
    from public.exams e
    where (admin or e.is_hidden = false)
  ) t;
  return result;
end; $$;

-- This user's attempt history for one exam (stats per round)
create or replace function public.mock_my_attempts(p_exam_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); result jsonb;
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  select coalesce(jsonb_agg(row_to_json(t) order by t.started_at desc), '[]'::jsonb) into result
  from (
    select id as attempt_id, status, started_at, submitted_at, score, total, percent, auto_submitted
    from public.exam_attempts where exam_id = p_exam_id and user_id = uid
  ) t;
  return result;
end; $$;

-- Start (or resume) an attempt. Requires login. Builds shuffled orders.
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

  -- resume an active attempt if one is still valid
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

-- ---------------- GRANTS ----------------
grant execute on function public.mock_list_exams()                         to anon, authenticated;
grant execute on function public.mock_start_attempt(uuid)                  to authenticated;
grant execute on function public.mock_get_attempt(uuid)                    to authenticated;
grant execute on function public.mock_save_progress(uuid, jsonb)           to authenticated;
grant execute on function public.mock_submit_attempt(uuid, jsonb, boolean) to authenticated;
grant execute on function public.mock_get_results(uuid)                    to authenticated;
grant execute on function public.mock_my_attempts(uuid)                    to authenticated;
