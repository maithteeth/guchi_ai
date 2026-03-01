'use client';

import { useState } from 'react';

export default function SuperAdminPage() {
    const [companyName, setCompanyName] = useState('');
    const [managerEmail, setManagerEmail] = useState('');
    const [managerPassword, setManagerPassword] = useState('');

    // Reward settings
    const [rewardTargetPoints, setRewardTargetPoints] = useState('500');
    const [rewardSpan, setRewardSpan] = useState('monthly');
    const [rewardItem, setRewardItem] = useState('');

    const [inviteUrl, setInviteUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCreateToken = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setInviteUrl('');

        try {
            const response = await fetch('/api/admin/create-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    companyName,
                    managerEmail,
                    managerPassword,
                    rewardTargetPoints,
                    rewardSpan,
                    rewardItem
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '登録に失敗しました。');
            }

            // URLの作成
            const url = `${window.location.origin}/entry?token=${data.token}`;
            setInviteUrl(url);
            setCompanyName('');
            setManagerEmail('');
            setManagerPassword('');
        } catch (err: any) {
            console.error(err);
            setError(err.message || '登録に失敗しました。');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteUrl);
        alert('URLをコピーしました！従業員へ共有してください。');
    };

    return (
        <div className="min-h-screen bg-[#0A0F1C] text-slate-50 font-sans flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-cyan-600/10 rounded-full blur-[150px]"></div>
            </div>

            <div className="relative z-10 max-w-xl w-full bg-[#131B2F]/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/10">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                <div className="bg-slate-900/40 border-b border-white/5 p-8 text-center">
                    <div className="mx-auto w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-4 border border-white/10 shadow-lg">
                        <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>
                    </div>
                    <h1 className="text-2xl font-extrabold tracking-tight">特権管理者ダッシュボード</h1>
                    <p className="text-indigo-300 text-sm mt-2 opacity-90">クライアント企業の登録と招待URLの発行</p>
                </div>

                <div className="p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-start gap-3">
                            <span className="mt-0.5">⚠</span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleCreateToken} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-300">
                                登録する企業名
                            </label>
                            <input
                                type="text"
                                required
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className="w-full bg-[#0A0F1C] border border-white/10 text-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                                placeholder="例: 株式会社サンプル"
                            />
                        </div>

                        <hr className="my-8 border-white/10" />
                        <h3 className="text-md font-bold text-slate-200 mb-4 flex items-center gap-2">
                            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                            報酬体系の設定 (従業員の投稿モチベーション用)
                        </h3>

                        <div className="space-y-4 bg-slate-800/30 p-5 rounded-2xl border border-white/5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-300">
                                        目標ポイント <span className="text-xs font-normal text-slate-500">(1投稿で約10pt)</span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="10"
                                        value={rewardTargetPoints}
                                        onChange={(e) => setRewardTargetPoints(e.target.value)}
                                        className="w-full bg-[#0A0F1C] border border-white/10 text-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                                        placeholder="例: 500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-300">
                                        スパン (期間)
                                    </label>
                                    <select
                                        required
                                        value={rewardSpan}
                                        onChange={(e) => setRewardSpan(e.target.value)}
                                        className="w-full bg-[#0A0F1C] border border-white/10 text-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                                    >
                                        <option value="weekly">週ごとに集計 (Weekly)</option>
                                        <option value="monthly">月ごとに集計 (Monthly)</option>
                                        <option value="yearly">年ごとに集計 (Yearly)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-300">
                                    到達時の報酬内容
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={rewardItem}
                                    onChange={(e) => setRewardItem(e.target.value)}
                                    className="w-full bg-[#0A0F1C] border border-white/10 text-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors placeholder:text-slate-600"
                                    placeholder="例: Amazonギフト券 500円分"
                                />
                            </div>
                        </div>

                        <hr className="my-8 border-white/10" />
                        <h3 className="text-md font-bold text-slate-200 mb-4 flex items-center gap-2">
                            <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            マネージャー用（ダッシュボード閲覧者）アカウント
                        </h3>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-300">
                                    メールアドレス
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={managerEmail}
                                    onChange={(e) => setManagerEmail(e.target.value)}
                                    className="w-full bg-[#0A0F1C] border border-white/10 text-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                                    placeholder="manager@example.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-300">
                                    パスワード <span className="text-xs font-normal text-slate-500">(6文字以上)</span>
                                </label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={managerPassword}
                                    onChange={(e) => setManagerPassword(e.target.value)}
                                    className="w-full bg-[#0A0F1C] border border-white/10 text-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors placeholder:text-slate-600 tracking-widest"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading || !companyName || !managerEmail || managerPassword.length < 6}
                                className={`w-full py-4 px-6 rounded-full text-white font-bold text-lg transition-all duration-300 shadow-xl flex items-center justify-center gap-2 ${loading || !companyName || !managerEmail || managerPassword.length < 6
                                    ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed border border-white/5'
                                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:-translate-y-1'
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-slate-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        登録中...
                                    </>
                                ) : '企業＆マネージャーを登録して招待URLを発行'}
                            </button>
                        </div>
                    </form>

                    {inviteUrl && (
                        <div className="mt-8 p-6 bg-emerald-900/20 rounded-2xl border border-emerald-500/30">
                            <h3 className="text-emerald-400 font-bold mb-2 flex items-center gap-2"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>発行完了！</h3>
                            <p className="text-sm text-slate-300 mb-6">以下のURLを従業員に共有してください。アクセスすると自動ログインされ入力画面に進みます。</p>

                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={inviteUrl}
                                        className="w-full bg-[#0A0F1C] border border-emerald-500/50 rounded-xl p-3 text-emerald-100 text-sm focus:outline-none"
                                    />
                                    <button
                                        onClick={copyToClipboard}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-xl transition-colors whitespace-nowrap text-sm font-bold shadow-md"
                                    >
                                        コピー
                                    </button>
                                </div>

                                <div className="flex items-center gap-3 pt-6 border-t border-white/5">
                                    <span className="text-sm font-medium text-slate-400">SNS等で共有:</span>
                                    <a
                                        href={`https://line.me/R/msg/text/?${encodeURIComponent('【課題共有システムへの招待】\n以下のURLからアクセスしてください。\n\n' + inviteUrl)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-[#06C755] hover:bg-[#05b34c] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
                                    >
                                        LINEで送る
                                    </a>
                                    <a
                                        href={`mailto:?subject=${encodeURIComponent('課題共有システムへの招待')}&body=${encodeURIComponent('お疲れ様です。\n以下のURLから課題共有システムへアクセスし、現場の声をご投稿ください。\n\n認証URL: ' + inviteUrl)}`}
                                        className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
                                    >
                                        メールで送る
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
