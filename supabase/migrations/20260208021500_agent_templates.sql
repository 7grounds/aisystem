CREATE TABLE IF NOT EXISTS public.agent_templates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text NOT NULL,
    system_prompt text NOT NULL,
    created_at timestamptz DEFAULT now()
);
