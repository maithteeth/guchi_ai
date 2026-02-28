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
                    router.push('/employee');
                }, 500);

            } catch (err: any) {
                console.error(err);
                setError(err.message || 'システムエラーが発生しました。');
            }
        };

        processEntry();
    }, [router, searchParams]);

    return (
        <div className="min-h-screen bg-[#0A0F1C] flex flex-col items-center justify-center p-4 relative overflow-hidden text-slate-50 font-sans">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-teal-600/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="relative z-10 max-w-md w-full bg-[#131B2F]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 text-center">
                {error ? (
                    <div>
                        <div className="mx-auto flex items-center justify-center h-16 w-16 border border-red-500/30 rounded-2xl bg-red-900/20 mb-6 shadow-[-0_0_15px_rgba(239,68,68,0.2)]">
                            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-100 mb-4 tracking-tight">アクセスエラー</h2>
                        <p className="text-red-400 text-sm mb-2 font-medium bg-red-900/10 p-3 rounded-lg border border-red-500/20">{error}</p>
                    </div>
                ) : (
                    <div>
                        <div className="relative mx-auto w-16 h-16 mb-6">
                            <div className="absolute inset-0 rounded-full border-4 border-white/5 shadow-inner"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <svg className="w-6 h-6 text-indigo-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-100 mb-3 tracking-tight">自動ログイン処理中</h2>
                        <div className="inline-block bg-indigo-900/30 border border-indigo-500/20 px-4 py-2 rounded-full">
                            <p className="text-indigo-400 text-sm font-bold animate-pulse">{status}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function EntryPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center"><p className="text-slate-500 font-medium animate-pulse">読み込み中...</p></div>}>
            <EntryContent />
        </Suspense>
    );
}
