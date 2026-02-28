-- ==========================================
-- テストデータ注入スクリプト（UI確認用）
-- ==========================================

DO $$
DECLARE
    new_company_id UUID;
    employee_id UUID;
    v_token TEXT;
BEGIN
    -- 1. テスト企業を作成
    INSERT INTO public.companies (name) 
    VALUES ('UIテスト用株式会社') 
    RETURNING id INTO new_company_id;

    -- 2. トークンも適当に作っておく（不要ですが整合性のため）
    INSERT INTO public.invite_tokens (company_id) 
    VALUES (new_company_id)
    RETURNING token INTO v_token;

    -- 3. ダミーの従業員をAuthとProfileに紐付ける
    -- 愚痴（grievances）を入れるためにはuser_id（profileのid）が必要ですが、
    -- profile.idはauth.users(id)の外部キー制約があるため、先にauth.users側にもダミーを作り込む必要があります。
    employee_id := gen_random_uuid();
    
    -- Supabaseの内部機構をハックして強引にauth.usersへデータを入れる (テスト用のみの荒技)
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at
    ) VALUES (
        employee_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dummy_user@test.ui', '', now(), now(), now()
    );
    
    INSERT INTO public.profiles (id, company_id, role) 
    VALUES (employee_id, new_company_id, 'employee');

    -- 4. 現場の声を10個ほど適当に生成（様々なカテゴリーやストレスレベルで）
    INSERT INTO public.grievances (company_id, user_id, category, details, stress_level) VALUES
    (new_company_id, employee_id, '給与・待遇', '残業代が固定残業を超えても支払われないのが不満です。業務量は増えるばかりなのに手取りが変わりません。', 8),
    (new_company_id, employee_id, '職場の人間関係', '部署間の連携が悪く、いつも仕事の押し付け合いが発生しています。特に営業と開発の仲が最悪です。', 6),
    (new_company_id, employee_id, '業務内容・量', '会議ばかりで実働時間が確保できません。定時後に自分の作業を始めるのがデフォになっています。', 9),
    (new_company_id, employee_id, '経営・方針', '社長の思いつきでコロコロ方針が変わるので、現場は振り回されています。事前の相談が欲しいです。', 7),
    (new_company_id, employee_id, '評価制度', 'どれだけ頑張っても年功序列で評価されるため、若手のモチベーションが軒並み下がっています。', 8),
    (new_company_id, employee_id, '労働環境・設備', 'オフィスの空調が古くて夏は暑く、冬は寒いです。パソコンも5年前のスペックでフリーズが多いです。', 4),
    (new_company_id, employee_id, '給与・待遇', 'ボーナスの支給基準が不透明です。評価面談で良い評価だと言われたのに、減額されていました。', 10),
    (new_company_id, employee_id, 'キャリア・教育', '入社後の研修がほぼなく、いきなり現場に放り込まれます。メンター制度も名前だけで機能していません。', 5),
    (new_company_id, employee_id, '業務内容・量', '属人化している業務が多すぎます。あの人が休むと仕事が回らない仕組みは早く改善すべきです。', 7),
    (new_company_id, employee_id, '職場の人間関係', '上司のパワハラ・モラハラ気味な発言（「昔は徹夜が普通だった」等）にストレスを感じます。', 9);

END $$;
