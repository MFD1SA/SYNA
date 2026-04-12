-- Fix: Postgres doesn't support CREATE POLICY IF NOT EXISTS in this environment

CREATE TABLE IF NOT EXISTS public.deal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  document_url text NOT NULL,
  document_source text NOT NULL DEFAULT 'google_drive',
  verified boolean NOT NULL DEFAULT false,
  verified_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deal_documents_deal_id_idx ON public.deal_documents(deal_id);
CREATE INDEX IF NOT EXISTS deal_documents_created_by_idx ON public.deal_documents(created_by);

ALTER TABLE public.deal_documents ENABLE ROW LEVEL SECURITY;

-- Recreate policies idempotently
DROP POLICY IF EXISTS "Deal parties can read deal documents" ON public.deal_documents;
DROP POLICY IF EXISTS "Developers can attach deal documents" ON public.deal_documents;
DROP POLICY IF EXISTS "Creators can update deal documents" ON public.deal_documents;
DROP POLICY IF EXISTS "Creators can delete deal documents" ON public.deal_documents;

CREATE POLICY "Deal parties can read deal documents"
ON public.deal_documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.deals d
    WHERE d.id = deal_documents.deal_id
      AND (
        d.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.developers dev
          WHERE dev.id = d.developer_id
            AND dev.user_id = auth.uid()
        )
      )
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Developers can attach deal documents"
ON public.deal_documents
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1
      FROM public.deals d
      JOIN public.developers dev ON dev.id = d.developer_id
      WHERE d.id = deal_documents.deal_id
        AND dev.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Creators can update deal documents"
ON public.deal_documents
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.deals d
      JOIN public.developers dev ON dev.id = d.developer_id
      WHERE d.id = deal_documents.deal_id
        AND dev.user_id = auth.uid()
    )
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.deals d
      JOIN public.developers dev ON dev.id = d.developer_id
      WHERE d.id = deal_documents.deal_id
        AND dev.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Creators can delete deal documents"
ON public.deal_documents
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.deals d
      JOIN public.developers dev ON dev.id = d.developer_id
      WHERE d.id = deal_documents.deal_id
        AND dev.user_id = auth.uid()
    )
  )
);

-- updated_at automation
DROP TRIGGER IF EXISTS update_deal_documents_updated_at ON public.deal_documents;
CREATE TRIGGER update_deal_documents_updated_at
BEFORE UPDATE ON public.deal_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
