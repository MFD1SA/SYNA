-- Unify admin check across the 2 parallel admin systems (user_roles + admin_permissions).
-- Previously the SEO RLS only consulted admin_permissions, which meant admins
-- who were added via user_roles (the canonical AdminRoute gate) saw 0 rows
-- in every SEO table even though they had /admincp access.
create or replace function public.is_seo_admin() returns boolean as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  ) or exists (
    select 1 from public.admin_permissions ap
    where ap.user_id = auth.uid()
      and (ap.is_super_admin = true or ap.perm_content = true)
  );
$$ language sql security definer stable;
