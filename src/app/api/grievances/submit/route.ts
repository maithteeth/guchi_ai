import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// SPAM PREVENTION CONSTANTS
const MIN_DETAILS_LENGTH = 10;
const MAX_SUBMISSIONS_PER_HOUR = 3;

// POINT CALCULATION CONSTANTS
const BASE_POINTS = 10;
const LENGTH_BONUS_50_CHARS = 5;
const LENGTH_BONUS_100_CHARS = 10;

export async function POST(request: Request) {
    try {
        const { category, details, stressLevel } = await request.json();

        if (!category || !details || stressLevel === undefined) {
            return NextResponse.json({ error: '必須項目が入力されていません。' }, { status: 400 });
        }

        // 1. スパムチェック: 文字数
        const trimmedDetails = details.trim();
        if (trimmedDetails.length < MIN_DETAILS_LENGTH) {
            return NextResponse.json({ error: `詳細は${MIN_DETAILS_LENGTH}文字以上で入力してください。` }, { status: 400 });
        }

        // ==========================================
        // 認証チェック (Cookieベースのセッションまたはヘッダー)
        // ここでは、サービスロールキーを使用してセキュアなDB操作を行います。
        // リクエスト送信者の認証情報は header から authorization (Bearer token) を取得します。
        // ==========================================
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: '認証トークンがありません。' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        // ユーザーのAuth確認用クライアント
        const supabaseAuth = createClient(supabaseUrl, anonKey);
        const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);

        if (userError || !user) {
            return NextResponse.json({ error: 'ユーザー認証に失敗しました。再度ログインしてください。' }, { status: 401 });
        }

        // サービスロールクライアント (DB書き込み用)
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

        // 2. ユーザーのプロファイル取得 (company_idが必要)
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('company_id')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: 'プロファイルの取得に失敗しました。' }, { status: 400 });
        }

        // 3. スパムチェック: 連投制限 (過去1時間の投稿数をカウント)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { count, error: countError } = await supabaseAdmin
            .from('grievances')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', oneHourAgo);

        if (countError) {
            console.error('Velocity check error:', countError);
            return NextResponse.json({ error: 'スパムチェックに失敗しました。' }, { status: 500 });
        }

        if (count && count >= MAX_SUBMISSIONS_PER_HOUR) {
            return NextResponse.json({ error: '短時間の連続投稿は制限されています。しばらく時間をおいてから再度お試しください。' }, { status: 429 });
        }

        // 4. ポイント計算
        let pointsEarned = BASE_POINTS;
        if (trimmedDetails.length >= 100) {
            pointsEarned += LENGTH_BONUS_100_CHARS;
        } else if (trimmedDetails.length >= 50) {
            pointsEarned += LENGTH_BONUS_50_CHARS;
        }

        // 5. DB保存 (トランザクション的処理: 課題の投稿とポイント付与)
        // a. 課題データの保存
        const { error: insertGrievanceError } = await supabaseAdmin
            .from('grievances')
            .insert([{
                company_id: profile.company_id,
                user_id: user.id,
                category,
                details: trimmedDetails,
                stress_level: stressLevel
            }]);

        if (insertGrievanceError) {
            console.error('Insert grievance error:', insertGrievanceError);
            throw new Error('データの保存に失敗しました。');
        }

        // b. ポイント履歴の保存
        const { error: insertPointError } = await supabaseAdmin
            .from('point_transactions')
            .insert([{
                company_id: profile.company_id,
                user_id: user.id,
                points: pointsEarned,
                reason: '課題の投稿'
            }]);

        if (insertPointError) {
            // ポイント付与に失敗しても課題自体は保存されているため、ログだけ残す（あるいは必要に応じてロールバックさせる）
            console.error('Insert point transactions error:', insertPointError);
            // ユーザーには成功として返すか、一部失敗を伝えるかは方針次第ですが、今回は成功として進行します
        }

        return NextResponse.json({
            success: true,
            message: '送信が完了しました！',
            pointsEarned: pointsEarned
        });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: error.message || '内部サーバーエラーが発生しました。' },
            { status: 500 }
        );
    }
}
