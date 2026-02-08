ALTER TABLE public.agent_templates
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_agent_templates_org
ON public.agent_templates (organization_id);
