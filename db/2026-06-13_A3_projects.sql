-- =============================================================
-- ATier-Web · Phase A3 · Projects fix                2026-06-13
-- Root cause of the "delete does nothing" bug: projects had only
-- INSERT + SELECT policies — no UPDATE/DELETE — so admin deletes
-- were silently blocked by RLS (0 rows, no error). Also no hidden
-- flag existed, so hide/publish was impossible.
-- =============================================================

-- Draft/publish flag (publish = make visible to the public)
alter table public.projects
  add column if not exists is_hidden boolean not null default false;

-- Rebuild policies: public read (minus hidden), admin-only write
drop policy if exists "Allow public read access on projects"  on public.projects;
drop policy if exists "Allow authenticated insert on projects" on public.projects;

create policy "projects_read"
  on public.projects for select to public
  using (is_hidden = false or public.is_app_admin());

create policy "projects_admin_insert"
  on public.projects for insert to authenticated
  with check (public.is_app_admin());

create policy "projects_admin_update"
  on public.projects for update to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

create policy "projects_admin_delete"
  on public.projects for delete to authenticated
  using (public.is_app_admin());
