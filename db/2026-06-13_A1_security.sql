-- =============================================================
-- ATier-Web · Phase A1 · Security hardening (RLS)   2026-06-13
-- Goal: writes allowed ONLY for real admins (profiles.role), not
-- merely any logged-in user. Reads stay public (minus hidden rows).
-- =============================================================

-- 1) Canonical admin predicate (profiles-based; SECURITY DEFINER so
--    it bypasses profiles RLS safely and can be reused everywhere).
create or replace function public.is_app_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('Super Admin','Admin')
  );
$$;

-- 2) COURSES ---------------------------------------------------
--    Before: "Allow admin all access" = authenticated + true
--    => ANY logged-in user could delete/edit every course.
drop policy if exists "Allow admin all access"                       on public.courses;
drop policy if exists "Allow public read access"                     on public.courses;
drop policy if exists "Allow_authenticated_users_to_update_courses"  on public.courses;
drop policy if exists "Policy with security definer functions"       on public.courses;

create policy "courses_read"
  on public.courses for select to public
  using (is_hidden = false or public.is_app_admin());

create policy "courses_admin_write"
  on public.courses for all to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

-- 3) POSTS -----------------------------------------------------
--    Before: 9 overlapping policies, incl. update-for-any-authenticated
--    and a weak is_chronicle_admin() (email LIKE '%admin%').
--    like/view/comment use SECURITY DEFINER RPCs, so locking the table
--    to admins does NOT break those features.
drop policy if exists "Allow Super Admin to insert posts"          on public.posts;
drop policy if exists "Allow authenticated users to insert posts"  on public.posts;
drop policy if exists "Allow owners and admins to delete posts"    on public.posts;
drop policy if exists "Allow owners and admins to update posts"    on public.posts;
drop policy if exists "Allow update for authenticated users"       on public.posts;
drop policy if exists "Enable delete for authenticated admins only" on public.posts;
drop policy if exists "Enable insert for authenticated admins only" on public.posts;
drop policy if exists "Enable read access for all users"           on public.posts;
drop policy if exists "Enable update for authenticated admins only" on public.posts;

create policy "posts_read"
  on public.posts for select to public
  using (is_hidden = false or public.is_app_admin());

create policy "posts_admin_insert"
  on public.posts for insert to authenticated
  with check (public.is_app_admin());

create policy "posts_admin_update"
  on public.posts for update to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

create policy "posts_admin_delete"
  on public.posts for delete to authenticated
  using (public.is_app_admin());

-- 4) PROFILES --------------------------------------------------
--    Role-escalation is already blocked by trigger
--    enforce_profile_modification_rules(); just drop the duplicate
--    trigger and stop exposing every user's email/role to the world.
drop trigger if exists on_profile_update_attempt on public.profiles;

drop policy if exists "Allow public read-access to profiles" on public.profiles;
create policy "profiles_self_or_admin_read"
  on public.profiles for select to authenticated
  using (auth.uid() = id or public.is_app_admin());

-- 5) STORAGE objects: clean the tangled policy set → public read,
--    admin-only write. (All uploads in the app are admin actions.)
do $$
declare r record;
begin
  for r in select policyname from pg_policies
           where schemaname = 'storage' and tablename = 'objects'
  loop
    execute format('drop policy if exists %I on storage.objects', r.policyname);
  end loop;
end $$;

create policy "storage_public_read"
  on storage.objects for select to public
  using (bucket_id in ('assets','course-assets','member-avatars','post-assets','project-images','exam-assets'));

create policy "storage_admin_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id in ('assets','course-assets','member-avatars','post-assets','project-images','exam-assets') and public.is_app_admin());

create policy "storage_admin_update"
  on storage.objects for update to authenticated
  using (bucket_id in ('assets','course-assets','member-avatars','post-assets','project-images','exam-assets') and public.is_app_admin())
  with check (bucket_id in ('assets','course-assets','member-avatars','post-assets','project-images','exam-assets') and public.is_app_admin());

create policy "storage_admin_delete"
  on storage.objects for delete to authenticated
  using (bucket_id in ('assets','course-assets','member-avatars','post-assets','project-images','exam-assets') and public.is_app_admin());
