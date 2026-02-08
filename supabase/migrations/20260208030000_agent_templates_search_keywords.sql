ALTER TABLE public.agent_templates
ADD COLUMN IF NOT EXISTS search_keywords text[];

CREATE INDEX IF NOT EXISTS idx_agent_templates_search_keywords
ON public.agent_templates USING GIN (search_keywords);
