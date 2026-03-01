'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function EmployeeInputPage() {
  const [category, setCategory] = useState('');
  const [details, setDetails] = useState('');
  // 1〜10段階のストレス度を初期値5に設定
  const [stressLevel, setStressLevel] = useState<number>(5);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // 認証関連ステート
  const [userProfile, setUserProfile] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 報酬・ポイント関連ステート
  const [currentPoints, setCurrentPoints] = useState(0);
  const [rewardConfig, setRewardConfig] = useState({ target: 500, item: '報酬', span: 'monthly' });

  useEffect(() => {
    // コンポーネントマウント時にログイン状態をチェック
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;

        if (!user) {
          setLoading(false);
          return;
        }

        // profilesテーブルからcompany_idなどを取得
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id, role')
          .eq('id', user.id)
          .single();

        if (profile) {
          setUserProfile({ ...profile, id: user.id });
          setSession(session);

          // 報酬設定の取得
          const { data: company } = await supabase
            .from('companies')
            .select('reward_target_points, reward_item, reward_span')
            .eq('id', profile.company_id)
            .single();

          if (company) {
            setRewardConfig({
              target: company.reward_target_points || 500,
              item: company.reward_item || '特別ボーナス',
              span: company.reward_span || 'monthly'
            });
          }

          // 現在のポイント取得
          const { data: pointsData } = await supabase
            .from('point_transactions')
            .select('points')
            .eq('user_id', user.id);

          if (pointsData) {
            const total = pointsData.reduce((acc, curr) => acc + curr.points, 0);
            setCurrentPoints(total);
          }
        }
      } catch (err) {
        console.error('Session error:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    setIsSubmitting(true);
    setMessage('');

    try {
      // カスタムAPIエンドポイントを使用して安全に送信 (スパム判定 & ポイント計算用)
      const response = await fetch('/api/grievances/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          category,
          details,
          stressLevel
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '送信に失敗しました。');
      }

      // 送信成功時のUI更新
      setCurrentPoints(prev => prev + data.pointsEarned);
      setMessage(`送信が完了しました！ (+${data.pointsEarned} pt 獲得✨)`);
      setCategory('');
      setDetails('');
      setStressLevel(5);
    } catch (error: any) {
      console.error('Error submitting grievance:', error);
      setMessage(`送信に失敗しました: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 読み込み中画面
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-medium">認証情報を確認中...</p>
      </div>
    );
  }

  // 未ログイン時の画面
  if (!userProfile) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center p-4">
        {/* Background Effects */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="relative z-10 max-w-md w-full bg-[#131B2F] border border-white/10 rounded-3xl shadow-2xl p-8 text-center overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-500/20 mb-6 border border-red-500/30">
            <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mb-4 tracking-tight">認証が必要です</h1>
          <p className="text-slate-400 mb-6 leading-relaxed">
            このページにアクセスするには、管理者から共有された<br className="hidden sm:block" />
            <span className="text-indigo-400 font-bold">「招待リンク」</span>経由でアクセスしてください。
          </p>
          <div className="text-xs text-slate-500 bg-[#0A0F1C] border border-white/5 p-4 rounded-xl font-mono">
            招待リンク例: http://.../entry?token=xxxxx
          </div>
        </div>
      </div>
    );
  }

  // ログイン済み（入力フォーム表示）
  return (
    <div className="min-h-screen bg-[#0A0F1C] text-slate-50 font-sans selection:bg-teal-500/30 flex items-center justify-center p-4 py-12 relative overflow-hidden">

      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-cyan-600/10 rounded-full blur-[150px]"></div>
      </div>

      <div className="relative z-10 max-w-xl w-full bg-[#131B2F]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden transform transition-all">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-teal-400 to-cyan-500"></div>
        <div className="p-8 md:p-10 border-b border-white/5 bg-slate-900/40 text-center relative">
          <div className="mx-auto w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-4 border border-white/10 shadow-lg">
            <svg className="w-6 h-6 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">現場の声 (課題共有)</h1>
          <p className="text-slate-400 text-sm mb-6">あなたの声が職場環境を改善し、チームの「徳」になります</p>

          {/* Reward Progress UI */}
          <div className="bg-[#0A0F1C]/80 border border-white/10 rounded-2xl p-4 mt-2">
            <div className="flex justify-between items-end mb-2">
              <div className="text-left">
                <p className="text-xs text-slate-400 font-bold tracking-wider uppercase mb-1">{rewardConfig.span === 'weekly' ? '今週の目標' : '今月の目標'}: {rewardConfig.item}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-teal-400">{currentPoints}</span>
                  <span className="text-sm font-bold text-slate-500">/ {rewardConfig.target} pt</span>
                </div>
              </div>
              {currentPoints >= rewardConfig.target && (
                <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                  目標達成！🎉
                </div>
              )}
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-1000 ease-out relative"
                style={{ width: `${Math.min(100, (currentPoints / rewardConfig.target) * 100)}%` }}
              >
                <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/30 truncate"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 md:p-10">
          {message && (
            <div className={`p-4 mb-8 rounded-xl text-sm font-medium flex items-center gap-3 border ${message.includes('失敗')
              ? 'bg-red-900/20 text-red-400 border-red-500/30'
              : 'bg-teal-900/20 text-teal-400 border-teal-500/30'
              }`}>
              {message.includes('失敗') ? (
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              ) : (
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              )}
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* カテゴリ */}
            <div className="space-y-3">
              <label htmlFor="category" className="block text-sm font-bold text-slate-300">
                1. 課題のカテゴリ
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full bg-[#0A0F1C] border border-white/10 text-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-colors cursor-pointer appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 1rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
              >
                <option value="" disabled className="text-slate-500">-- 選択してください --</option>
                <option value="equipment">設備・機材について</option>
                <option value="human_relations">人間関係・コミュニケーション</option>
                <option value="work_environment">職場環境・ルール</option>
                <option value="workload">業務量・スケジュール</option>
                <option value="other">その他</option>
              </select>
            </div>

            {/* 詳細 */}
            <div className="space-y-3">
              <label htmlFor="details" className="block text-sm font-bold text-slate-300">
                2. 具体的な状況
              </label>
              <textarea
                id="details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                required
                rows={5}
                placeholder="例: 古いPCの動作が遅く、1日1時間程度業務にロスが発生している。"
                className="w-full bg-[#0A0F1C] border border-white/10 text-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-colors resize-none leading-relaxed placeholder:text-slate-600"
              ></textarea>
            </div>

            {/* ストレス度スライダー (1〜10) */}
            <div className="bg-[#0A0F1C] p-6 rounded-2xl border border-white/5 space-y-4">
              <label htmlFor="stressLevel" className="flex items-center justify-between text-sm font-bold text-slate-300">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  3. ストレス度・緊迫度
                </span>
                <span className="flex items-center justify-center text-[#0A0F1C] bg-gradient-to-br from-teal-400 to-cyan-400 h-8 w-8 rounded-full font-extrabold text-sm shadow-[0_0_15px_rgba(45,212,191,0.5)]">
                  {stressLevel}
                </span>
              </label>
              <div className="relative pt-2 px-1">
                <input
                  type="range"
                  id="stressLevel"
                  min="1"
                  max="10"
                  step="1"
                  value={stressLevel}
                  onChange={(e) => setStressLevel(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  style={{
                    background: `linear-gradient(to right, #2dd4bf ${(stressLevel - 1) * 11.11}%, #1e293b ${(stressLevel - 1) * 11.11}%)`
                  }}
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-3 font-medium px-0.5">
                  <span className="text-teal-400 font-bold">1(低)</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                  <span>6</span>
                  <span>7</span>
                  <span>8</span>
                  <span>9</span>
                  <span className="text-red-400 font-bold">10(高)</span>
                </div>
              </div>
            </div>

            {/* 送信ボタン */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 px-6 rounded-full text-white font-bold text-lg transition-all duration-300 shadow-xl flex items-center justify-center gap-2 ${isSubmitting
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:shadow-[0_0_30px_rgba(45,212,191,0.5)] hover:-translate-y-1'
                  }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    送信中...
                  </>
                ) : (
                  <>
                    課題システムへ送信 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
