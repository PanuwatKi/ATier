-- =============================================================
-- ATier-Web · Phase C1b · Lock course video content   2026-06-14
-- Hide the `lectures` column from direct table reads so paid-course
-- video IDs / material links are never shipped to non-enrolled users.
-- Content is served only via get_course_lectures() (SECURITY DEFINER,
-- enrollment-checked).
--
-- ⚠️ Apply ONLY after the updated client (which selects explicit
-- columns instead of *) is deployed — otherwise the live site's
-- `select('*')` would hit a permission error on `lectures`.
-- =============================================================

revoke select on public.courses from anon, authenticated;

grant select (
  id, title, description, image_url, category, instructor, is_hidden,
  price, is_paid, discount_type, discount_value, discount_starts_at,
  discount_ends_at, lecture_count, created_at
) on public.courses to anon, authenticated;
