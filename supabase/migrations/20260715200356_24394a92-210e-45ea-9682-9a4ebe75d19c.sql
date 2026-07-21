
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Timestamp helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Projects
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  target_users TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own projects" ON public.projects FOR ALL
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_projects_owner ON public.projects(owner_id, created_at DESC);

-- Research documents
CREATE TYPE public.doc_status AS ENUM ('uploaded','processing','processed','failed');
CREATE TABLE public.research_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  status public.doc_status NOT NULL DEFAULT 'uploaded',
  extracted_text TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.research_documents TO authenticated;
GRANT ALL ON public.research_documents TO service_role;
ALTER TABLE public.research_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own docs" ON public.research_documents FOR ALL
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER docs_updated_at BEFORE UPDATE ON public.research_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_docs_project ON public.research_documents(project_id, created_at DESC);

-- Insights
CREATE TYPE public.insight_kind AS ENUM ('pain_point','user_goal','feature_request','quote');
CREATE TYPE public.insight_status AS ENUM ('pending','approved','rejected');
CREATE TABLE public.insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.research_documents(id) ON DELETE SET NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.insight_kind NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  quote_text TEXT,
  speaker TEXT,
  sentiment TEXT,
  confidence NUMERIC(3,2),
  status public.insight_status NOT NULL DEFAULT 'pending',
  user_edited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.insights TO authenticated;
GRANT ALL ON public.insights TO service_role;
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own insights" ON public.insights FOR ALL
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER insights_updated_at BEFORE UPDATE ON public.insights
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_insights_project ON public.insights(project_id, kind, status);

-- Opportunities
CREATE TABLE public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  problem TEXT,
  target_user TEXT,
  value_prop TEXT,
  source_insight_ids UUID[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'proposed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunities TO authenticated;
GRANT ALL ON public.opportunities TO service_role;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own opportunities" ON public.opportunities FOR ALL
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER opps_updated_at BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_opps_project ON public.opportunities(project_id, created_at DESC);

-- PRDs
CREATE TYPE public.prd_status AS ENUM ('draft','in_review','approved');
CREATE TABLE public.prds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status public.prd_status NOT NULL DEFAULT 'draft',
  sections JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prds TO authenticated;
GRANT ALL ON public.prds TO service_role;
ALTER TABLE public.prds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own prds" ON public.prds FOR ALL
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER prds_updated_at BEFORE UPDATE ON public.prds
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_prds_project ON public.prds(project_id, created_at DESC);

-- Storage policies for research-files bucket. Path format: {user_id}/{project_id}/{file}
CREATE POLICY "Users read own files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'research-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users upload own files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'research-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'research-files' AND auth.uid()::text = (storage.foldername(name))[1]);
