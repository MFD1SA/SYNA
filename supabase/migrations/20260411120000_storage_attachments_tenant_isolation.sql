-- =============================================
-- PHASE 3 SECURITY HARDENING: Storage tenant isolation
-- Replace permissive "any authenticated user" policies on
-- storage.objects (attachments bucket) with tenant-aware policies
-- that verify the user belongs to the tenant owning the file.
-- =============================================

-- Drop the old permissive policies
DROP POLICY IF EXISTS "Authenticated users can upload attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read attachments" ON storage.objects;

-- New INSERT policy: user can only upload to paths prefixed with their tenant_id
-- Expected storage path convention: {tenant_id}/...
CREATE POLICY "Tenant members can upload storage attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'attachments'
    AND auth.role() = 'authenticated'
    AND public.is_tenant_member(
      auth.uid(),
      (storage.foldername(name))[1]::uuid
    )
  );

-- New SELECT policy: user can only read files within their tenant's folder
CREATE POLICY "Tenant members can read storage attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'attachments'
    AND auth.role() = 'authenticated'
    AND (
      public.is_tenant_member(
        auth.uid(),
        (storage.foldername(name))[1]::uuid
      )
      OR public.has_role(auth.uid(), 'admin')
    )
  );

-- New DELETE policy: tenant members (non-viewer) can delete their tenant's files
CREATE POLICY "Tenant members can delete storage attachments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'attachments'
    AND auth.role() = 'authenticated'
    AND (
      public.is_tenant_member(
        auth.uid(),
        (storage.foldername(name))[1]::uuid
      )
      OR public.has_role(auth.uid(), 'admin')
    )
  );
