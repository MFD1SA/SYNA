-- Add actor_role to nda_consents to support both developer and owner NDA
-- Owner NDA rejection is terminal per land — same as developer

-- Add actor_role column
ALTER TABLE public.nda_consents
  ADD COLUMN IF NOT EXISTS actor_role TEXT NOT NULL DEFAULT 'developer'
  CHECK (actor_role IN ('developer', 'owner'));

-- Drop old unique constraint and create new one that includes actor_role
ALTER TABLE public.nda_consents
  DROP CONSTRAINT IF EXISTS unique_nda_per_user_land;

ALTER TABLE public.nda_consents
  ADD CONSTRAINT unique_nda_per_user_land_role UNIQUE (user_id, land_id, actor_role);

-- Owner reads own NDA consents (add policy for owners)
CREATE POLICY "Owner reads own NDA consents"
  ON public.nda_consents FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND actor_role = 'owner');

-- Owner can insert own NDA consent
CREATE POLICY "Owner inserts own NDA consent"
  ON public.nda_consents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND actor_role = 'owner');
