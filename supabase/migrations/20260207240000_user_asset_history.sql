CREATE TABLE IF NOT EXISTS public.user_asset_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    isin text NOT NULL,
    asset_name text,
    last_amount numeric,
    last_fee numeric,
    analyzed_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_asset_history_lookup
ON public.user_asset_history (user_id, isin);
