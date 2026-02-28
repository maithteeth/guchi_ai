'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

function EntryContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState('招待トークンを確認しています...');
    const [error, setError] = useState('');

    useEffect(() => {
        const processEntry = async () => {
            const token = searchParams.get('token');
            if (!token) {
                setError('URLにトークンが含まれていません。正しい招待リンクからアクセスしてください。');
                return;
            }

            try {
                setStatus('認証情報を準備しています...');

                // 1. トークンの有効性確認
                const { data: tokenData, error: tokenError } = await supabase
                    .from('invite_tokens')
                    .select('company_id')
                    .eq('token', token)
                    .single();

                if (tokenError || !tokenData) {
                    throw new Error('無効または期限切れの招待リンクです。');
                }

                setStatus('安全な匿名セッションを生成しています...');

                // 2. 匿名サインインを実行
                const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
                if (authError) throw authError;

                if (!authData.user) throw new Error('ユーザーセッションの作成に失敗しました。');

                setStatus('プロフィールを登録しています...');

                // 3. Profilesテーブルに登録（既に存在する場合はスキップ）
                const { data: existingProfile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('id', authData.user.id)
                    .maybeSingle();

                if (!existingProfile) {
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .insert([{
                            id: authData.user.id,
                            company_id: tokenData.company_id,
                            role: 'employee'
                        }]);

                    if (profileError) throw profileError;
                }

                setStatus('準備完了！入力画面へ移動します...');

                // 4. 数ミリ秒待ってから入力画面へリダイレクト（体感のため）
                setTimeout(() => {
                    router.push('/');
                }, 500);

            } catch (err: any) {
                console.error(err);
                setError(err.message || 'システムエラーが発生しました。');
            }
        };

        processEntry();
    }, [router, searchParams]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
                {error ? (
                    <div>
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                            <span className="text-red-600 text-xl font-bold">!</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">アクセスエラー</h2>
                        <p className="text-red-500 text-sm mb-6">{error}</p>
                    </div>
                ) : (
                    <div>
                        <div className="relative mx-auto w-16 h-16 mb-4">
                            <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">自動ログイン処理中</h2>
                        <p className="text-blue-600 text-sm font-medium animate-pulse">{status}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function EntryPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-gray-500 font-medium animate-pulse">読み込み中...</p></div>}>
            <EntryContent />
        </Suspense>
    );
}
