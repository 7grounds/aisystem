CREATE TABLE IF NOT EXISTS public.billing_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    provider text NOT NULL,
    agent_name text,
    token_count integer NOT NULL,
    cost_usd numeric,
    cost_chf numeric,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_logs_org_created
ON public.billing_logs (organization_id, created_at);
