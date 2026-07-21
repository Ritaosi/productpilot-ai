
CREATE TABLE public.competitive_scans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  competitors text[] NOT NULL DEFAULT '{}',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_competitive_scans_project ON public.competitive_scans(project_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.competitive_scans TO authenticated;
GRANT ALL ON public.competitive_scans TO service_role;

ALTER TABLE public.competitive_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own competitive scans" ON public.competitive_scans
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
