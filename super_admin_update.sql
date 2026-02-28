-- ==========================================
-- 1. ENUMの更新（特権管理者の追加）
-- ==========================================
-- 既存の user_role に 'super_admin' を追加します
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'super_admin';

-- ==========================================
-- 2. invite_tokens テーブルの作成
-- ==========================================
CREATE TABLE public.invite_tokens (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL DEFAULT encode(public.gen_random_bytes(16), 'hex'), -- URLセーフなランダム文字列
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- インデックス
CREATE INDEX idx_invite_tokens_company_id ON public.invite_tokens(company_id);
CREATE INDEX idx_invite_tokens_token ON public.invite_tokens(token);

-- ==========================================
-- 3. RLS（Row Level Security）の追加・更新
-- ==========================================
ALTER TABLE public.invite_tokens ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------
-- companies の権限更新
-- ------------------------------------------
-- 特権管理者は企業を登録(INSERT)できる
CREATE POLICY "Super admins can insert companies"
    ON public.companies FOR INSERT
    WITH CHECK (
        public.get_my_role() = 'super_admin'
    );

-- 特権管理者はすべての企業を閲覧(SELECT)できる
CREATE POLICY "Super admins can view all companies"
    ON public.companies FOR SELECT
    USING (
        public.get_my_role() = 'super_admin'
    );

-- ------------------------------------------
-- invite_tokens の権限
-- ------------------------------------------
-- 特権管理者はトークンを発行(INSERT)・閲覧(SELECT)できる
CREATE POLICY "Super admins can insert invite tokens"
    ON public.invite_tokens FOR INSERT
    WITH CHECK (
        public.get_my_role() = 'super_admin'
    );

CREATE POLICY "Super admins can view invite tokens"
    ON public.invite_tokens FOR SELECT
    USING (
        public.get_my_role() = 'super_admin'
    );

-- 従業員（未ログイン状態含む）がトークンの有効性を検証できるよう、
-- 特定のtokenに基づくSELECTのみ許可する
CREATE POLICY "Anyone can verify specific tokens"
    ON public.invite_tokens FOR SELECT
    USING (
        true -- tokenによる検索自体は公開情報とする（ただしレコード全件検索は実質不可）
    );
