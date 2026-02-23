-- Create storage bucket for developer documents (CR files, identity docs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('developer-docs', 'developer-docs', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: Users can upload their own developer docs
CREATE POLICY "Users can upload own developer docs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'developer-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS: Users can read their own developer docs
CREATE POLICY "Users can read own developer docs"
ON storage.objects FOR SELECT
USING (bucket_id = 'developer-docs' AND (auth.uid()::text = (storage.foldername(name))[1] OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')));

-- RLS: Users can update their own developer docs
CREATE POLICY "Users can update own developer docs"
ON storage.objects FOR UPDATE
USING (bucket_id = 'developer-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
