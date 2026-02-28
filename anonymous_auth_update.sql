-- ==========================================
-- 1. ENUMの更新（特権管理者の追加）
-- ==========================================
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'super_admin';

-- ==========================================
-- 2. invite_tokens テーブルの作成
-- ==========================================
CREATE TABLE public.invite_tokens (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL DEFAULT encode(public.gen_random_bytes(16), 'hex'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_invite_tokens_company_id ON public.invite_tokens(company_id);
CREATE INDEX idx_invite_tokens_token ON public.invite_tokens(token);

ALTER TABLE public.invite_tokens ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------
-- companies の権限更新
-- ------------------------------------------
CREATE POLICY "Super admins can insert companies"
    ON public.companies FOR INSERT
    WITH CHECK (public.get_my_role() = 'super_admin');

CREATE POLICY "Super admins can view all companies"
    ON public.companies FOR SELECT
    USING (public.get_my_role() = 'super_admin');

-- ------------------------------------------
-- invite_tokens の権限
-- ------------------------------------------
CREATE POLICY "Super admins can insert invite tokens"
    ON public.invite_tokens FOR INSERT
    WITH CHECK (public.get_my_role() = 'super_admin');

CREATE POLICY "Super admins can view invite tokens"
    ON public.invite_tokens FOR SELECT
    USING (public.get_my_role() = 'super_admin');

-- 誰でもトークン自体は検証(SELECT)できる（ログイン前処理のため）
CREATE POLICY "Anyone can verify specific tokens"
    ON public.invite_tokens FOR SELECT
    USING (true);

-- ==========================================
-- 3. profiles テーブルの権限追加（匿名ログイン対応）
-- ==========================================
-- 匿名ログイン(is_anonymous)したユーザーが、自分自身のプロフィールデータをINSERTできるようにする
CREATE POLICY "Anonymous users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (
        id = auth.uid()
    );

-- プロフィールをUPDATEできる権限（後から役職等を変える場合）
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- ==========================================
-- 4. grievances（現場の声）のストレス度制約の緩和（1〜5 → 1〜10）
-- ==========================================
-- 既存の 1~5 の制約を削除し、1~10 の新しい制約を追加する
ALTER TABLE public.grievances DROP CONSTRAINT IF EXISTS grievances_stress_level_check;
ALTER TABLE public.grievances ADD CONSTRAINT grievances_stress_level_check CHECK (stress_level >= 1 AND stress_level <= 10);
