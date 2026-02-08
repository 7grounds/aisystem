CREATE TABLE IF NOT EXISTS public.user_flows (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    domain text NOT NULL,
    current_step text,
    status text DEFAULT 'active',
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_flows_org_domain
ON public.user_flows (organization_id, domain);
