-- ==========================================
-- 1. 新規データ型の定義
-- ==========================================
DO $$ BEGIN
    CREATE TYPE public.subscription_status AS ENUM ('active', 'canceled', 'past_due');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==========================================
-- 2. サブスクリプション状態管理テーブル
-- ==========================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    paypal_subscription_id TEXT UNIQUE,
    status public.subscription_status NOT NULL DEFAULT 'active',
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 3. 単発購入履歴テーブル
-- ==========================================
CREATE TABLE IF NOT EXISTS public.report_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    manager_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL,          -- どのレポート（不満解析）を購入したか (例: 'human_relations_analysis')
    paypal_transaction_id TEXT UNIQUE,  -- 決済ID
    amount NUMERIC,                     -- 購入金額
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 4. インデックスの追加
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_company_id ON public.subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_report_purchases_company_id ON public.report_purchases(company_id);

-- ==========================================
-- 5. RLS（Row Level Security）の有効化とポリシー
-- ==========================================
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_purchases ENABLE ROW LEVEL SECURITY;

-- Managerは自社のサブスクリプション状況を閲覧可能
CREATE POLICY "Managers can view their company subscriptions"
    ON public.subscriptions FOR SELECT
    USING (company_id = public.get_my_company_id() AND public.get_my_role() = 'manager');

-- Managerは自社の単発購入履歴を閲覧可能
CREATE POLICY "Managers can view their company purchases"
    ON public.report_purchases FOR SELECT
    USING (company_id = public.get_my_company_id() AND public.get_my_role() = 'manager');

-- ※INSERTやUPDATE等の更新権限を持つポリシーは付与しません。
-- PayPal Webhookを受けたSupabase Edge Function側が、強力な Service Role Key を用いて強制書き込みを行うアーキテクチャとします（エンドユーザーによる不正な支払ステータス改ざん防止のため）。
