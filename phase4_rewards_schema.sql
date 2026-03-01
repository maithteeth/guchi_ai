-- ==============================================================
-- Phase 4: Points, Rewards, and Anti-Spam Schema Updates
-- ==============================================================

-- 1. Extend `companies` table to store reward configuration
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS reward_target_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reward_span TEXT DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS reward_item TEXT DEFAULT '';

-- 2. Create `point_transactions` table
CREATE TABLE IF NOT EXISTS public.point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Setup Row Level Security (RLS) for `point_transactions`
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Employees can read their own point transactions
CREATE POLICY "Users can view their own point transactions."
    ON public.point_transactions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Managers and Admins can view transactions of their company
CREATE POLICY "Super admins and managers can view company point transactions."
    ON public.point_transactions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
              AND (p.role = 'super_admin' OR (p.role = 'manager' AND p.company_id = point_transactions.company_id))
        )
    );

-- Note: Insertions to point_transactions will be done securely from the Next.js API route 
-- using the Supabase Service Role Key to prevent frontend manipulation. Thus, no INSERT policy is needed for public/authenticated roles.
