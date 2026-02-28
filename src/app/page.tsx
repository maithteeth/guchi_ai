"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, TrendingUp, HandCoins, Zap, Lock, Unlock, Database, Brain, ArrowRight, Activity, Users, LineChart, Cpu, Coins, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  // Front A Demo State
  const [typedText, setTypedText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [virtuePoints, setVirtuePoints] = useState(0);
  const [meterFill, setMeterFill] = useState(0);
  const [demoPhase, setDemoPhase] = useState(0); // 0: typing, 1: submit, 2: analyzed

  // Front B Demo State
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Typing effect for Front A Demo
  useEffect(() => {
    const fullText = "会議ばかりで実働時間が確保できません。定時後に自分の作業を始めるのがデフォになっています。";
    let currentText = "";
    let i = 0;

    const typeWriter = () => {
      if (i < fullText.length) {
        currentText += fullText.charAt(i);
        setTypedText(currentText);
        i++;
        setTimeout(typeWriter, 50);
      } else {
        setTimeout(() => setDemoPhase(1), 1000); // 1秒待って送信フェーズへ
      }
    };

    typeWriter();
  }, []);

  // Front A Demo Workflow
  useEffect(() => {
    if (demoPhase === 1) {
      setIsAnalyzing(true);
      setTimeout(() => {
        setIsAnalyzing(false);
        setVirtuePoints(150);
        setMeterFill(45);
        setDemoPhase(2);
      }, 1500);

      // ループ処理 (もう一度最初から)
      setTimeout(() => {
        setTypedText("");
        setDemoPhase(0);
        setVirtuePoints(0);
        setMeterFill(0);
        // useEffect自体は再起動しないので簡易的なリセット
      }, 6000);
    }
  }, [demoPhase]);

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-slate-50 font-sans selection:bg-indigo-500/30 overflow-x-hidden">

      {/* 1. Global Navigation */}
      <header className="fixed top-0 w-full z-50 bg-[#0A0F1C]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-indigo-400" />
            <div className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              GUCHI AI
            </div>
          </div>
          <nav className="hidden lg:flex gap-8 text-sm font-medium text-slate-300">
            <a href="#demo" className="hover:text-white transition-colors">機能紹介</a>
            <Link href="/employee" className="hover:text-white transition-colors text-teal-400 font-bold flex items-center gap-1">
              <Zap className="w-4 h-4" /> 従業員入力 (Front A)
            </Link>
            <Link href="https://guchiai-knkx2hpfvcndtpcmxffpjh.streamlit.app/" target="_blank" className="hover:text-white transition-colors text-indigo-400 font-bold flex items-center gap-1">
              <Activity className="w-4 h-4" /> 経営層ダッシュボード (Front B)
            </Link>
            <a href="#core-value" className="hover:text-white transition-colors">組織が変わる理由</a>
            <a href="#roi" className="hover:text-white transition-colors">導入効果・ROI</a>
          </nav>
          <div className="flex gap-4">
            <Link href="/super-admin" className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)] flex items-center gap-2">
              無料でシステムを導入する <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-cyan-600/10 rounded-full blur-[150px]"></div>
      </div>

      <main className="relative z-10 pt-32 p-6">

        {/* HERO & Section 1: Interactive Demo */}
        <section id="demo" className="max-w-7xl mx-auto py-20">
          <div className="text-center mb-16 space-y-6">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
              その「愚痴」、<br />
              <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-teal-300 bg-clip-text text-transparent">
                組織の「資産」に変わる。
              </span>
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
              形骸化したアンケートではなく、日常の生々しい「負の感情」をリアルタイムに集積。<br className="hidden md:block" />
              AIが俯瞰・解析し、経営層が本当に知るべき「組織のボトルネック」を浮き彫りにします。
            </p>
          </div>

          {/* Interactive Mockups */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mt-20">

            {/* Front A Demo (Employee) */}
            <div className="bg-[#131B2F] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-teal-400 to-cyan-500"></div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <span className="p-2 bg-slate-800 rounded-lg"><Zap className="w-5 h-5 text-teal-400" /></span>
                  従業員体験アプリ (Front A)
                </h3>
                <span className="text-xs font-mono text-slate-500 bg-slate-800/50 px-2 py-1 rounded">Live Demo</span>
              </div>

              <div className="space-y-6">
                <div className="bg-[#0A0F1C] rounded-xl p-4 border border-white/5 h-32 relative">
                  <p className="text-slate-300 font-medium">社長への不満、職場の悩み...</p>
                  <p className="text-white mt-2 font-mono text-sm leading-relaxed">
                    {typedText}
                    <motion.span animate={{ opacity: [0, 1] }} transition={{ repeat: Infinity }} className="inline-block w-2 h-4 bg-teal-400 ml-1 translate-y-1"></motion.span>
                  </p>

                  <AnimatePresence>
                    {isAnalyzing && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0A0F1C]/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <div className="flex items-center gap-3 text-cyan-400">
                          <Cpu className="w-5 h-5 animate-spin" />
                          <span className="font-mono text-sm">AI Parsing Context...</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <motion.div
                  className="bg-gradient-to-r from-teal-900/50 to-cyan-900/50 border border-teal-500/30 rounded-xl p-6 relative overflow-hidden"
                  animate={{
                    boxShadow: demoPhase === 2 ? "0 0 30px rgba(45,212,191,0.2)" : "none",
                    borderColor: demoPhase === 2 ? "rgba(45,212,191,0.6)" : "rgba(45,212,191,0.3)"
                  }}
                >
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <p className="text-sm text-teal-200/70 font-medium mb-1">獲得した徳 (ポイント)</p>
                      <div className="text-3xl font-bold text-teal-300 flex items-center gap-2">
                        <Coins className="w-6 h-6" /> +{virtuePoints}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-400 mb-1">チーム報酬(ヤクルト1000)まで</p>
                      <p className="font-mono text-teal-400">{meterFill}%</p>
                    </div>
                  </div>
                  <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-teal-400 to-cyan-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${meterFill}%` }}
                      transition={{ duration: 1, type: "spring" }}
                    ></motion.div>
                  </div>
                </motion.div>

                <p className="text-sm text-slate-400 text-center">
                  ▶ 入力の手間ゼロ。愚痴を吐き出す爽快感を「チームへの貢献」に昇華。
                </p>
              </div>
            </div>

            {/* Front B Demo (Manager) */}
            <div className="bg-[#131B2F] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <span className="p-2 bg-slate-800 rounded-lg"><Activity className="w-5 h-5 text-indigo-400" /></span>
                  経営者ダッシュボード (Front B)
                </h3>
                <span className="text-xs font-mono text-slate-500 bg-slate-800/50 px-2 py-1 rounded">Interactive</span>
              </div>

              <div className="bg-[#0A0F1C] border border-white/5 rounded-xl p-6 relative">
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                  <h4 className="font-bold text-lg">■ 業務量・スケジュール過多分析</h4>
                  {isUnlocked ? <Unlock className="w-5 h-5 text-indigo-400" /> : <Lock className="w-5 h-5 text-slate-500" />}
                </div>

                <div className="relative">
                  <div className={`transition-all duration-1000 ${!isUnlocked ? 'blur-md opacity-50 select-none' : 'blur-0 opacity-100'}`}>
                    <h5 className="text-red-400 font-bold mb-2">【AI警告】隠れたコストの特定</h5>
                    <p className="text-sm text-slate-300 leading-relaxed mb-4">
                      定時後の残業や無駄な定例会議により、開発部門全体で<span className="font-bold text-white bg-red-900/50 px-1">月間約350万円の逸失利益</span>が発生しています。特に「あの人が休むと回らない」属人化リスクが限界に達しています。
                    </p>
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                      <p className="text-xs text-indigo-300 font-mono mb-2">RECOMMENDED ACTION:</p>
                      <ul className="text-sm space-y-2 text-slate-300">
                        <li>・営業-開発間の定例会議の非同期化（Slack報告への移行）</li>
                        <li>・若手向けメンター制度の再構築（評価と連動）</li>
                      </ul>
                    </div>
                  </div>

                  {!isUnlocked && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-[#0A0F1C] via-[#0A0F1C]/80 to-transparent">
                      <button
                        onClick={() => setIsUnlocked(true)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-3 transform hover:scale-105"
                      >
                        <Lock className="w-4 h-4" /> 組織の真実をアンロック (デモ)
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-sm text-slate-400 text-center mt-6">
                ▶ AIが散在する不満を「経営の課題・コスト」に翻訳し、即時の改善アクションを提示。
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Core Value Propositions */}
        <section id="core-value" className="max-w-7xl mx-auto py-24 border-t border-white/5">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">導入がもたらす本質的変化</h2>
            <p className="text-xl text-slate-400">年に一度のアンケートは終わりました。これからは「リアルタイムな組織の知恵」の時代です。</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800/20 border border-white/10 p-8 rounded-3xl hover:bg-slate-800/40 transition-colors">
              <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6">
                <TrendingUp className="w-7 h-7 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold mb-4">逆転の発想で本音を引き出す</h3>
              <p className="text-slate-400 leading-relaxed">
                偽善的な称賛ツールは機能しません。人間の本能である「愚痴を吐き出したい欲求」をシステム稼働の着火剤として利用。最も純度が高く、改善のヒントが詰まったデータが集まります。
              </p>
            </div>
            <div className="bg-slate-800/20 border border-white/10 p-8 rounded-3xl hover:bg-slate-800/40 transition-colors">
              <div className="w-14 h-14 bg-cyan-500/20 rounded-2xl flex items-center justify-center mb-6">
                <HandCoins className="w-7 h-7 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold mb-4">連帯責任型の現物報酬で罪悪感ゼロ</h3>
              <p className="text-slate-400 leading-relaxed">
                「みんなの愚痴で部署にオフィスグリコやソファが届く」チーム報酬設計。愚痴を言う罪悪感を「チームへの貢献（徳を積む）」へ昇華させ、自然なエンゲージメントを生み出します。
              </p>
            </div>
            <div className="bg-slate-800/20 border border-white/10 p-8 rounded-3xl hover:bg-slate-800/40 transition-colors">
              <div className="w-14 h-14 bg-teal-500/20 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-teal-400" />
              </div>
              <h3 className="text-xl font-bold mb-4">完全自動。運用コストゼロ</h3>
              <p className="text-slate-400 leading-relaxed">
                貯まったポイントはベンダーへWebhookで自動連携。総務や人為的な事務作業、社内承認フローを一切発生させず、完全に自律した福利厚生の好循環エコシステムを構築します。
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: System Architecture Flow */}
        <section id="architecture" className="max-w-5xl mx-auto py-24 border-t border-white/5">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">システム構成とデータフロー</h2>
            <p className="text-xl text-slate-400">「現場の声」が「福利厚生」と「経営の武器」に変換されるまで</p>
          </div>

          <div className="relative p-8 md:p-12 bg-[#131B2F] border border-white/10 rounded-3xl shadow-2xl">
            <div className="flex flex-col md:flex-row items-center justify-between relative z-10 gap-8">

              {/* Input */}
              <div className="flex flex-col items-center flex-1 text-center">
                <div className="w-20 h-20 bg-slate-800 border border-white/20 rounded-2xl flex items-center justify-center mb-4 z-10 shadow-lg">
                  <Users className="w-10 h-10 text-slate-300" />
                </div>
                <h4 className="font-bold text-lg mb-2">1. 現場の不満 (Front A)</h4>
                <p className="text-sm text-slate-400">匿名で日常の課題やストレスを投稿。</p>
              </div>

              <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="hidden md:block">
                <ArrowRight className="w-8 h-8 text-indigo-500" />
              </motion.div>

              {/* Core AI */}
              <div className="flex flex-col items-center flex-1 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mb-4 z-10 shadow-[0_0_30px_rgba(99,102,241,0.5)] transform rotate-3 hover:rotate-0 transition-transform">
                  <Brain className="w-12 h-12 text-white" />
                </div>
                <h4 className="font-bold text-lg mb-2">2. 解析コア・スコアリング</h4>
                <p className="text-sm text-indigo-300">LLMが内容を解析しカテゴリ分け。<br />ストレス度から「徳(ポイント)」を算出。</p>
              </div>

              <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="hidden md:flex flex-col gap-12 relative">
                <ArrowRight className="w-8 h-8 text-cyan-500 absolute -top-8 right-0 rotate-[-30deg]" />
                <ArrowRight className="w-8 h-8 text-teal-500 absolute -bottom-8 right-0 rotate-[30deg]" />
              </motion.div>

              {/* Outputs */}
              <div className="flex flex-col flex-1 gap-8 mt-8 md:mt-0">
                <div className="bg-slate-800/50 border border-cyan-500/30 p-6 rounded-2xl relative text-left">
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-3 h-3 bg-cyan-500 rounded-full hidden md:block"></div>
                  <h4 className="font-bold text-cyan-400 flex items-center gap-2 mb-2"><Database className="w-4 h-4" /> 3a. 経営ダッシュボード (Front B)</h4>
                  <p className="text-xs text-slate-400">匿名化されたデータを集約し、経営リスクや隠れたコストを可視化。</p>
                </div>
                <div className="bg-slate-800/50 border border-teal-500/30 p-6 rounded-2xl relative text-left">
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-3 h-3 bg-teal-500 rounded-full hidden md:block"></div>
                  <h4 className="font-bold text-teal-400 flex items-center gap-2 mb-2"><CheckCircle2 className="w-4 h-4" /> 3b. ベンダー連携 (Webhook)</h4>
                  <p className="text-xs text-slate-400">閾値到達で、福利厚生プロバイダーへの商品発注処理を自動実行。</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Section 4: ROI Simulation */}
        <section id="roi" className="max-w-7xl mx-auto py-24 border-t border-white/5">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">導入による圧倒的なROI</h2>
            <p className="text-xl text-slate-400">システムの維持費用（月額3,000円）を遥かに超えるリターンを生み出します。</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Point 1 */}
            <div className="flex gap-6 items-start">
              <div className="bg-red-500/20 p-4 rounded-xl shrink-0">
                <ShieldAlert className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3">離職の未然防止によるコスト削減</h3>
                <p className="text-slate-400 leading-relaxed mb-4">
                  優秀な人材一人の離脱は、採用・教育コストを含め「年収の約1.5倍（約750万円）」の損失と言われます。不満のコンテキストから退職の兆候を早期検知し、ピンポイントなケアを行うことで甚大な損失を防ぎます。
                </p>
              </div>
            </div>

            {/* Point 2 */}
            <div className="flex gap-6 items-start">
              <div className="bg-indigo-500/20 p-4 rounded-xl shrink-0">
                <LineChart className="w-8 h-8 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3">「隠れたコスト」の特定と業務改善</h3>
                <p className="text-slate-400 leading-relaxed mb-4">
                  「使えないSaaSツール」「形骸化した定例会議」「旧型のPC」。現場しか知らない時間の垂れ流しを特定。社員50人の会社で1日30分の無駄を省くだけで、月間約100万円分の労働価値が創出されます。
                </p>
              </div>
            </div>

            {/* Point 3 */}
            <div className="flex gap-6 items-start md:col-span-2 lg:col-span-2 lg:w-2/3 lg:mx-auto">
              <div className="bg-teal-500/20 p-4 rounded-xl shrink-0">
                <Users className="w-8 h-8 text-teal-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3">エンゲージメントの自然発生 (ポジティブループ)</h3>
                <p className="text-slate-400 leading-relaxed mb-4">
                  「自分たちの声（不満）が、実際に職場環境の改善や福利厚生に直結した」という強烈な成功体験が、組織全体に帰属意識をもたらします。次からは単なる愚痴ではなく、より「建設的な意見」が生まれやすい土壌へと進化します。
                </p>
              </div>
            </div>
          </div>

          {/* CTA Bottom */}
          <div className="mt-20 text-center bg-gradient-to-b from-indigo-900/40 to-slate-900 border border-indigo-500/20 rounded-3xl p-12">
            <h2 className="text-3xl font-bold mb-6">さあ、あなたの組織の「真実」を見にいきましょう。</h2>
            <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
              アカウント作成は数十秒で完了します。クレジットカードの登録なしで、<br />
              まずは無料のAI導入ポイント解析をお試しください。
            </p>
            <Link href="/super-admin" className="inline-flex items-center justify-center bg-white text-[#0A0F1C] hover:bg-slate-200 px-8 py-4 rounded-full text-lg font-bold transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
              無料でシステムを導入する <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </section>

      </main>

      <footer className="border-t border-white/10 bg-[#050810] py-12 text-center text-slate-500 text-sm">
        <p>© 2026 GUCHI AI Inc. All rights reserved.</p>
        <div className="mt-4 flex justify-center gap-6">
          <Link href="#" className="hover:text-white transition-colors">利用規約</Link>
          <Link href="#" className="hover:text-white transition-colors">プライバシーポリシー</Link>
          <Link href="#" className="hover:text-white transition-colors">運営会社</Link>
        </div>
      </footer>
    </div>
  );
}
