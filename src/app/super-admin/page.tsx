'use client';

import { useState } from 'react';

export default function SuperAdminPage() {
    const [companyName, setCompanyName] = useState('');
    const [managerEmail, setManagerEmail] = useState('');
    const [managerPassword, setManagerPassword] = useState('');
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
                body: JSON.stringify({ companyName, managerEmail, managerPassword }),
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
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-700 to-indigo-800 p-6 text-white">
                    <h1 className="text-2xl font-bold">特権管理者ダッシュボード</h1>
                    <p className="text-purple-100 mt-1">クライアント企業の登録と招待URLの発行</p>
                </div>

                <div className="p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleCreateToken} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                登録する企業名
                            </label>
                            <input
                                type="text"
                                required
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="例: 株式会社サンプル"
                            />
                        </div>

                        <hr className="my-4 border-gray-200" />
                        <h3 className="text-md font-bold text-gray-700 mb-2">マネージャー（ダッシュボード閲覧者）アカウントの発行</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                メールアドレス
                            </label>
                            <input
                                type="email"
                                required
                                value={managerEmail}
                                onChange={(e) => setManagerEmail(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="manager@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                パスワード (6文字以上)
                            </label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={managerPassword}
                                onChange={(e) => setManagerPassword(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !companyName || !managerEmail || managerPassword.length < 6}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors mt-6 disabled:bg-gray-400"
                        >
                            {loading ? '登録中...' : '企業＆マネージャーを登録して招待URLを発行'}
                        </button>
                    </form>

                    {inviteUrl && (
                        <div className="mt-8 p-6 bg-green-50 rounded-xl border border-green-200 animate-fade-in-up">
                            <h3 className="text-green-800 font-bold mb-2">発行完了！</h3>
                            <p className="text-sm text-green-700 mb-4">以下のURLを従業員に共有してください。アクセスすると自動ログインされ入力画面に進みます。</p>

                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={inviteUrl}
                                        className="w-full bg-white border border-green-300 rounded p-2 text-gray-600 text-sm focus:outline-none"
                                    />
                                    <button
                                        onClick={copyToClipboard}
                                        className="bg-green-600 hover:bg-green-700 text-white p-2 rounded transition-colors whitespace-nowrap text-sm font-medium shadow-sm"
                                    >
                                        コピー
                                    </button>
                                </div>

                                <div className="flex items-center gap-3 pt-2 border-t border-green-200">
                                    <span className="text-sm font-semibold text-green-800">SNS等で共有:</span>
                                    <a
                                        href={`https://line.me/R/msg/text/?${encodeURIComponent('【課題共有システムへの招待】\n以下のURLからアクセスしてください。\n\n' + inviteUrl)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-[#06C755] hover:bg-[#05b34c] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors shadow-sm"
                                    >
                                        LINEで送る
                                    </a>
                                    <a
                                        href={`mailto:?subject=${encodeURIComponent('課題共有システムへの招待')}&body=${encodeURIComponent('お疲れ様です。\n以下のURLから課題共有システムへアクセスし、現場の声をご投稿ください。\n\n認証URL: ' + inviteUrl)}`}
                                        className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors shadow-sm"
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
