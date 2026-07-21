ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS reach numeric,
  ADD COLUMN IF NOT EXISTS impact numeric,
  ADD COLUMN IF NOT EXISTS confidence numeric,
  ADD COLUMN IF NOT EXISTS effort numeric,
  ADD COLUMN IF NOT EXISTS moscow text;