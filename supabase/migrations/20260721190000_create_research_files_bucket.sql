-- The 20260715200356 migration adds RLS policies for the research-files
-- bucket but never creates the bucket itself (it was provisioned outside
-- SQL on the original project). Create it here so a fresh project works.
INSERT INTO storage.buckets (id, name, public)
VALUES ('research-files', 'research-files', false)
ON CONFLICT (id) DO NOTHING;
