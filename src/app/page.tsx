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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // コンポーネントマウント時にログイン状態をチェック
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
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
      // 登録処理 (RLSで自分のデータとしてINSERTされるか検証される)
      const { error } = await supabase
        .from('grievances')
        .insert([
          {
            company_id: userProfile.company_id, // 自分の所属企業ID
            user_id: userProfile.id,           // 自分のUserID
            category,
            details,
            stress_level: stressLevel,         // 1〜10
          },
        ]);

      if (error) {
        throw error;
      }

      setMessage('送信が完了しました！ご意見ありがとうございます。');
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
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">読み込み中...</p>
      </div>
    );
  }

  // 未ログイン時の画面
  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border-t-4 border-red-500">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">認証が必要です</h1>
          <p className="text-gray-600 mb-6">
            このページにアクセスするには、管理者から共有された<br className="hidden sm:block" />
            <strong>「招待リンク」</strong>経由でアクセスしてください。
          </p>
          <div className="text-sm text-gray-400 bg-gray-100 p-3 rounded-lg">
            招待リンク例: http://.../entry?token=xxxxx
          </div>
        </div>
      </div>
    );
  }

  // ログイン済み（入力フォーム表示）
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-12">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white text-center shadow-inner">
          <h1 className="text-2xl font-bold tracking-wide">現場の声 (課題共有)</h1>
          <p className="text-blue-100 text-sm mt-1 opacity-90">あなたの声が職場環境を改善します</p>
        </div>

        <div className="p-8">
          {message && (
            <div className={`p-4 mb-6 rounded-lg text-sm font-medium animate-fade-in-up flex items-start ${message.includes('失敗')
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
              {message.includes('失敗') ? (
                <span className="mr-2 mt-0.5 font-bold">⚠</span>
              ) : (
                <span className="mr-2 mt-0.5 font-bold">✓</span>
              )}
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-7">
            {/* カテゴリ */}
            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">
                1. 課題のカテゴリ
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg shadow-sm p-3.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="" disabled>-- 選択してください --</option>
                <option value="equipment">設備・機材について</option>
                <option value="human_relations">人間関係・コミュニケーション</option>
                <option value="work_environment">職場環境・ルール</option>
                <option value="workload">業務量・スケジュール</option>
                <option value="other">その他</option>
              </select>
            </div>

            {/* 詳細 */}
            <div>
              <label htmlFor="details" className="block text-sm font-semibold text-gray-700 mb-2">
                2. 具体的な状況
              </label>
              <textarea
                id="details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                required
                rows={5}
                placeholder="例: 古いPCの動作が遅く、1日1時間程度業務にロスが発生している。"
                className="w-full border border-gray-300 rounded-lg shadow-sm p-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none leading-relaxed"
              ></textarea>
            </div>

            {/* ストレス度スライダー (1〜10) */}
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
              <label htmlFor="stressLevel" className="flex items-center justify-between text-sm font-semibold text-gray-700 mb-4">
                <span>3. ストレス度・緊迫度</span>
                <span className="flex items-center justify-center text-white bg-blue-600 h-7 w-7 rounded-full font-bold text-sm shadow-sm">
                  {stressLevel}
                </span>
              </label>
              <div className="relative pt-1 px-1">
                <input
                  type="range"
                  id="stressLevel"
                  min="1"
                  max="10"
                  step="1"
                  value={stressLevel}
                  onChange={(e) => setStressLevel(parseInt(e.target.value))}
                  className="w-full h-2.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 transition-all hover:bg-gray-300"
                />
                <div className="flex justify-between text-[11px] text-gray-400 mt-2 font-medium px-0.5">
                  <span className="text-blue-600 font-bold">1(低)</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                  <span>6</span>
                  <span>7</span>
                  <span>8</span>
                  <span>9</span>
                  <span className="text-red-500 font-bold">10(高)</span>
                </div>
              </div>
            </div>

            {/* 送信ボタン */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 px-4 rounded-xl text-white font-bold text-lg transition-all duration-300 ${isSubmitting
                  ? 'bg-blue-400 cursor-wait opacity-90'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] transform hover:-translate-y-0.5'
                }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  送信中...
                </span>
              ) : (
                '課題システムへ送信'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
