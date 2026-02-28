-- ==========================================
-- Super Admin 向けのグローバル読み取り権限ポリシー追加
-- これにより、マスターアカウントが全企業のデータをダッシュボードで閲覧できるようになります。
-- ==========================================

-- profiles: 全ユーザー情報を閲覧可能
CREATE POLICY "Super admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.get_my_role() = 'super_admin');

-- grievances: 全ての現場の声を閲覧可能
CREATE POLICY "Super admins can view all grievances"
    ON public.grievances FOR SELECT
    USING (public.get_my_role() = 'super_admin');

-- analyses: 全てのAI解析結果を閲覧可能
CREATE POLICY "Super admins can view all analyses"
    ON public.analyses FOR SELECT
    USING (public.get_my_role() = 'super_admin');

-- subscriptions: 全てのサブスクリプション状態を閲覧可能
CREATE POLICY "Super admins can view all subscriptions"
    ON public.subscriptions FOR SELECT
    USING (public.get_my_role() = 'super_admin');

-- report_purchases: 全ての単発購入履歴を閲覧可能
CREATE POLICY "Super admins can view all report_purchases"
    ON public.report_purchases FOR SELECT
    USING (public.get_my_role() = 'super_admin');
