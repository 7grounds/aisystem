ALTER TABLE public.agent_templates
ADD COLUMN IF NOT EXISTS category text;

CREATE INDEX IF NOT EXISTS idx_agent_templates_category
ON public.agent_templates (category);
