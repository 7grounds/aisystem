CREATE TABLE IF NOT EXISTS public.search_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    query text NOT NULL,
    results_found boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_logs_org_query
ON public.search_logs (organization_id, query);
