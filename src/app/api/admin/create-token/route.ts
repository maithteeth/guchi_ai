import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    try {
        const { companyName, managerEmail, managerPassword, rewardTargetPoints, rewardSpan, rewardItem } = await request.json();

        if (!companyName || !managerEmail || !managerPassword) {
            return NextResponse.json({ error: '企業名・メールアドレス・パスワードはすべて必須です。' }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env.local');
            return NextResponse.json(
                { error: 'サーバー設定エラー: SUPABASE_SERVICE_ROLE_KEY が .env.local に設定されていません。' },
                { status: 500 }
            );
        }

        // サービスロールキーを使用して、RLSの制限を無視できる強力なクライアントを作成
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

        // 1. 会社の登録 (報酬設定含む)
        const { data: company, error: companyError } = await supabaseAdmin
            .from('companies')
            .insert([{
                name: companyName,
                reward_target_points: parseInt(rewardTargetPoints) || 0,
                reward_span: rewardSpan || 'monthly',
                reward_item: rewardItem || ''
            }])
            .select()
            .single();

        if (companyError) {
            console.error('Company insert error:', companyError);
            throw new Error('企業の登録に失敗しました。');
        }

        // 2. 招待トークンの生成
        const { data: tokenData, error: tokenError } = await supabaseAdmin
            .from('invite_tokens')
            .insert([{ company_id: company.id }])
            .select()
            .single();

        if (tokenError) {
            console.error('Token insert error:', tokenError);
            throw new Error('トークンの発行に失敗しました。');
        }

        // 3. マネージャー用Authユーザーの作成
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: managerEmail,
            password: managerPassword,
            email_confirm: true // 自動的にメール確認済みにする
        });

        if (authError || !authData.user) {
            console.error('Auth create error:', authError);
            throw new Error(`マネージャーアカウントの作成に失敗しました(${authError?.message})。`);
        }

        // 4. マネージャーのプロフィールテーブルへの紐付け
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert([{
                id: authData.user.id,
                company_id: company.id,
                role: 'manager'
            }]);

        if (profileError) {
            console.error('Profile insert error:', profileError);
            throw new Error('マネージャープロフィールの作成に失敗しました。');
        }

        return NextResponse.json({ token: tokenData.token, companyId: company.id });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: error.message || '内部サーバーエラーが発生しました。' },
            { status: 500 }
        );
    }
}
