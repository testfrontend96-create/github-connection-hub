DROP POLICY IF EXISTS "Anyone records a view" ON public.page_views;
CREATE POLICY "Anyone records a view" ON public.page_views FOR INSERT TO anon, authenticated
  WITH CHECK (kind IN ('article','episode') AND length(slug) BETWEEN 1 AND 200 AND slug ~ '^[a-z0-9-]+$');
DROP POLICY IF EXISTS "Public reads hub media" ON storage.objects;
CREATE POLICY "Team reads hub media" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'hub-media' AND public.is_staff());