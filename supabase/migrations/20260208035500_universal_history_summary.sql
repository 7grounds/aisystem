ALTER TABLE public.universal_history
ADD COLUMN IF NOT EXISTS summary_payload jsonb;
