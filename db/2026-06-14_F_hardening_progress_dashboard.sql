-- =============================================================
-- ATier-Web · Phase F · integrity hardening + progress + dashboard
-- F1: server-controlled likes/views/comments (no client-set values)
-- F3: course progress persisted per user
-- F4: admin dashboard stats
-- F2: drop unused is_chronicle_admin()
-- =============================================================

-- ---------------- F1: likes / comments / views ----------------
create table if not exists public.post_likes (
  post_id bigint not null references public.posts(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.post_likes enable row level security;
drop policy if exists post_likes_own on public.post_likes;
create policy post_likes_own on public.post_likes for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- toggle like for current user; posts.likes is recomputed server-side
create or replace function public.toggle_post_like(p_post_id bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); liked boolean; cnt int;
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if exists (select 1 from post_likes where post_id = p_post_id and user_id = uid) then
    delete from post_likes where post_id = p_post_id and user_id = uid;
    liked := false;
  else
    insert into post_likes (post_id, user_id) values (p_post_id, uid) on conflict do nothing;
    liked := true;
  end if;
  select count(*) into cnt from post_likes where post_id = p_post_id;
  update posts set likes = cnt where id = p_post_id;
  return jsonb_build_object('likes', cnt, 'liked', liked);
end; $$;

create or replace function public.my_post_likes()
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); result jsonb;
begin
  if uid is null then return '[]'::jsonb; end if;
  select coalesce(jsonb_agg(post_id), '[]'::jsonb) into result from post_likes where user_id = uid;
  return result;
end; $$;

-- comment is built on the server (author/time can't be spoofed); login required
create or replace function public.add_post_comment(p_post_id bigint, p_text text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); v_author text; v_comments jsonb; v_new jsonb;
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_text is null or length(trim(p_text)) = 0 then raise exception 'EMPTY_COMMENT'; end if;
  select coalesce(full_name, email) into v_author from profiles where id = uid;
  v_author := coalesce(v_author, 'ผู้ใช้');
  v_new := jsonb_build_object(
    'id', 'c-' || (extract(epoch from now()) * 1000)::bigint,
    'author', v_author,
    'text', left(p_text, 1000),
    'date', to_char(now() at time zone 'Asia/Bangkok', 'DD/MM/YYYY HH24:MI')
  );
  update posts set comments = coalesce(comments, '[]'::jsonb) || jsonb_build_array(v_new)
   where id = p_post_id returning comments into v_comments;
  if v_comments is null then raise exception 'POST_NOT_FOUND'; end if;
  return v_comments;
end; $$;

-- view counter: server increments by 1 (client still de-dupes per session)
create or replace function public.increment_post_view(p_post_id bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  update posts set views = coalesce(views, 0) + 1 where id = p_post_id;
end; $$;

-- remove the old client-set-value RPCs (could be abused to set arbitrary values)
drop function if exists public.increment_like_secure(integer, integer);
drop function if exists public.increment_view_secure(integer, integer);
drop function if exists public.add_comment_secure(integer, jsonb);

grant execute on function public.toggle_post_like(bigint)      to authenticated;
grant execute on function public.my_post_likes()               to authenticated;
grant execute on function public.add_post_comment(bigint, text) to authenticated;
grant execute on function public.increment_post_view(bigint)   to anon, authenticated;

-- ---------------- F3: course progress ----------------
create table if not exists public.course_progress (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  course_id text not null,
  completed jsonb not null default '[]',   -- array of completed lecture ids
  last_lecture_id text,
  updated_at timestamptz not null default now(),
  primary key (user_id, course_id)
);
alter table public.course_progress enable row level security;
drop policy if exists course_progress_own on public.course_progress;
create policy course_progress_own on public.course_progress for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.save_course_progress(p_course_id text, p_completed jsonb, p_last_lecture_id text)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  insert into course_progress (user_id, course_id, completed, last_lecture_id, updated_at)
  values (uid, p_course_id, coalesce(p_completed, '[]'::jsonb), p_last_lecture_id, now())
  on conflict (user_id, course_id)
  do update set completed = excluded.completed, last_lecture_id = excluded.last_lecture_id, updated_at = now();
end; $$;

create or replace function public.get_my_progress()
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); result jsonb;
begin
  if uid is null then return '[]'::jsonb; end if;
  select coalesce(jsonb_agg(jsonb_build_object('course_id', course_id, 'completed', completed, 'last_lecture_id', last_lecture_id)), '[]'::jsonb)
    into result from course_progress where user_id = uid;
  return result;
end; $$;

grant execute on function public.save_course_progress(text, jsonb, text) to authenticated;
grant execute on function public.get_my_progress()                       to authenticated;

-- ---------------- F4: admin dashboard ----------------
create or replace function public.admin_dashboard_stats()
returns jsonb language plpgsql security definer set search_path = public as $$
declare result jsonb; rev numeric; pend int; iss int;
begin
  if not public.is_app_admin() then raise exception 'FORBIDDEN'; end if;
  result := jsonb_build_object(
    'users',       (select count(*) from profiles),
    'courses',     (select count(*) from courses),
    'exams',       (select count(*) from exams),
    'posts',       (select count(*) from posts),
    'projects',    (select count(*) from projects),
    'members',     (select count(*) from members),
    'enrollments', (select count(*) from enrollments)
  );
  if public.is_super_admin() then
    select coalesce(sum(amount), 0) into rev from payments where status = 'approved';
    select count(*) into pend from payments where status = 'pending';
    select count(*) into iss from payments where status <> 'draft' and user_message is not null and length(trim(user_message)) > 0;
    result := result || jsonb_build_object('revenue', rev, 'pending_payments', pend, 'reported_issues', iss, 'is_super', true);
  else
    result := result || jsonb_build_object('is_super', false);
  end if;
  return result;
end; $$;
grant execute on function public.admin_dashboard_stats() to authenticated;

-- ---------------- F2: drop dead code ----------------
drop function if exists public.is_chronicle_admin();
