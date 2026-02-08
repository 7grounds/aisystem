CREATE TABLE IF NOT EXISTS public.agent_definitions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    system_prompt text NOT NULL,
    icon text,
    status text DEFAULT 'active',
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_definitions_status
ON public.agent_definitions (status);
