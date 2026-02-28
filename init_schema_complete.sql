-- 必要な拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. ENUMの定義
-- ==========================================
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('employee', 'manager', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'super_admin';

-- ==========================================
-- 2. ベーステーブル構成
-- ==========================================

-- 企業情報テーブル
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ユーザー情報テーブル
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    role public.user_role NOT NULL DEFAULT 'employee',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 現場の声データテーブル
CREATE TABLE IF NOT EXISTS public.grievances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    details TEXT NOT NULL,
    stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- AI分析結果テーブル
CREATE TABLE IF NOT EXISTS public.analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    evaluation_axes JSONB NOT NULL DEFAULT '{}'::jsonb,
    ai_suggestions TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 招待トークンテーブル
CREATE TABLE IF NOT EXISTS public.invite_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 3. インデックス（パフォーマンス最適化）
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_grievances_company_id ON public.grievances(company_id);
CREATE INDEX IF NOT EXISTS idx_grievances_user_id ON public.grievances(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_company_id ON public.analyses(company_id);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_company_id ON public.invite_tokens(company_id);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_token ON public.invite_tokens(token);


-- ==========================================
-- 4. RLS（Row Level Security）の有効化
-- ==========================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grievances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_tokens ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 5. 【セキュリティ関数】
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
    SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ==========================================
-- 6. RLSポリシー設定（既存ポリシーをクリーンナップして再作成）
-- ==========================================
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
    DROP POLICY IF EXISTS "Super admins can insert companies" ON public.companies;
    DROP POLICY IF EXISTS "Super admins can view all companies" ON public.companies;
    
    DROP POLICY IF EXISTS "Users can view profiles in their company" ON public.profiles;
    DROP POLICY IF EXISTS "Anonymous users can insert their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

    DROP POLICY IF EXISTS "Employees can insert grievances" ON public.grievances;
    DROP POLICY IF EXISTS "Managers can view company grievances" ON public.grievances;

    DROP POLICY IF EXISTS "Managers can view company analyses" ON public.analyses;
    DROP POLICY IF EXISTS "Managers can insert company analyses" ON public.analyses;
    DROP POLICY IF EXISTS "Managers can update company analyses" ON public.analyses;

    DROP POLICY IF EXISTS "Super admins can insert invite tokens" ON public.invite_tokens;
    DROP POLICY IF EXISTS "Super admins can view invite tokens" ON public.invite_tokens;
    DROP POLICY IF EXISTS "Anyone can verify specific tokens" ON public.invite_tokens;
END $$;

-- companies のポリシー
CREATE POLICY "Users can view their own company"
    ON public.companies FOR SELECT
    USING (id = public.get_my_company_id());

CREATE POLICY "Super admins can insert companies"
    ON public.companies FOR INSERT
    WITH CHECK (public.get_my_role() = 'super_admin');

CREATE POLICY "Super admins can view all companies"
    ON public.companies FOR SELECT
    USING (public.get_my_role() = 'super_admin');

-- profiles のポリシー
CREATE POLICY "Users can view profiles in their company"
    ON public.profiles FOR SELECT
    USING (company_id = public.get_my_company_id());

CREATE POLICY "Anonymous users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- grievances のポリシー
CREATE POLICY "Employees can insert grievances"
    ON public.grievances FOR INSERT
    WITH CHECK (
        company_id = public.get_my_company_id() 
        AND user_id = auth.uid() 
        AND public.get_my_role() = 'employee'
    );

CREATE POLICY "Managers can view company grievances"
    ON public.grievances FOR SELECT
    USING (
        company_id = public.get_my_company_id() 
        AND public.get_my_role() = 'manager'
    );

-- analyses のポリシー
CREATE POLICY "Managers can view company analyses"
    ON public.analyses FOR SELECT
    USING (
        company_id = public.get_my_company_id() 
        AND public.get_my_role() = 'manager'
    );

CREATE POLICY "Managers can insert company analyses"
    ON public.analyses FOR INSERT
    WITH CHECK (
        company_id = public.get_my_company_id() 
        AND public.get_my_role() = 'manager'
    );

CREATE POLICY "Managers can update company analyses"
    ON public.analyses FOR UPDATE
    USING (
        company_id = public.get_my_company_id() 
        AND public.get_my_role() = 'manager'
    )
    WITH CHECK (
        company_id = public.get_my_company_id() 
        AND public.get_my_role() = 'manager'
    );

-- invite_tokens のポリシー
CREATE POLICY "Super admins can insert invite tokens"
    ON public.invite_tokens FOR INSERT
    WITH CHECK (public.get_my_role() = 'super_admin');

CREATE POLICY "Super admins can view invite tokens"
    ON public.invite_tokens FOR SELECT
    USING (public.get_my_role() = 'super_admin');

CREATE POLICY "Anyone can verify specific tokens"
    ON public.invite_tokens FOR SELECT
    USING (true);
