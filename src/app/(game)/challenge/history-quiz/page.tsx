'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const QUESTIONS = [
  { q:'中国历史上第一个统一的封建王朝是？', opts:['秦朝','汉朝','周朝','商朝'], ans:0 },
  { q:'谁统一了六国，建立秦朝？', opts:['刘邦','李世民','嬴政','朱元璋'], ans:2 },
  { q:'造纸术的改进者是谁？', opts:['张衡','蔡伦','毕昇','鲁班'], ans:1 },
  { q:'丝绸之路最早开辟于哪个朝代？', opts:['唐朝','宋朝','汉朝','明朝'], ans:2 },
  { q:'《史记》的作者是谁？', opts:['班固','司马光','陈寿','司马迁'], ans:3 },
  { q:'唐朝的开国皇帝是？', opts:['李世民','李渊','武则天','李隆基'], ans:1 },
  { q:'活字印刷术的发明者是？', opts:['蔡伦','张衡','毕昇','沈括'], ans:2 },
  { q:'"赤壁之战"发生在哪个时期？', opts:['春秋战国','三国','南北朝','五代十国'], ans:1 },
  { q:'万里长城最早由谁下令大规模修建？', opts:['汉武帝','唐太宗','秦始皇','明太祖'], ans:2 },
  { q:'"四大发明"不包括哪个？', opts:['造纸术','指南针','地动仪','火药'], ans:2 },
  { q:'郑和下西洋发生在哪个朝代？', opts:['宋朝','元朝','明朝','清朝'], ans:2 },
  { q:'"贞观之治"是哪位皇帝的年号？', opts:['李渊','李世民','武则天','李治'], ans:1 },
  { q:'鸦片战争发生在哪一年？', opts:['1840','1839','1842','1850'], ans:0 },
  { q:'"辛亥革命"推翻了哪个朝代？', opts:['明朝','元朝','清朝','宋朝'], ans:2 },
  { q:'孔子是哪个时期的思想家？', opts:['春秋','战国','秦朝','汉朝'], ans:0 },
];

export default function HistoryQuizPage() {
  const r = useRouter();
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [active, setActive] = useState(true);
  const [selected, setSelected] = useState<number|null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [questions, setQuestions] = useState(QUESTIONS);

  useEffect(() => {
    setQuestions(QUESTIONS.sort(()=>Math.random()-0.5));
  }, []);

  useEffect(() => {
    if (!active) return;
    setTimeLeft(10); setSelected(null); setShowAnswer(false);
    const t = setInterval(() => setTimeLeft(p => { if (p<=1) { handleTimeout(); return 0; } return p-1; }), 1000);
    return () => clearInterval(t);
  }, [idx, active]);

  const handleTimeout = () => { setShowAnswer(true); setActive(false); setTimeout(()=>{ if(idx+1>=questions.length) setGameOver(true); else setIdx(i=>i+1); setActive(true); }, 2000); };

  const pick = (oi: number) => {
    if (!active || showAnswer) return;
    setSelected(oi); setShowAnswer(true); setActive(false);
    if (oi === questions[idx].ans) { setScore(s=>s+10+(streak>=3?5:0)); setStreak(s=>s+1); }
    else { setStreak(0); }
    setTimeout(() => { if (idx+1 >= questions.length) setGameOver(true); else setIdx(i=>i+1); setActive(true); }, 1500);
  };

  const q = questions[idx];

  return (
    <div className="min-h-screen flex flex-col items-center" style={{background:'#0f0d0a'}}>
      <div className="w-full max-w-2xl px-6 pt-6">
        <button onClick={()=>r.push('/challenge')} className="text-xs text-[#5c554c] hover:text-[#9b8c78] mb-4">← 返回</button>
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-3xl font-bold text-[#e8e0d0]">🏛️ 历史抢答</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#9b8c78]">⭐{score}</span>
            {streak>=3 && <span className="text-xs text-[#f97316]">🔥x{streak}</span>}
            <span className="text-xs text-[#5c554c]">{idx+1}/{questions.length}</span>
          </div>
        </div>
        {/* Timer */}
        <div className="w-full h-2 rounded-full bg-white/5 mb-6 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-1000 ${timeLeft<=3?'bg-[#ef4444]':'bg-[#8b5cf6]'}`} style={{width:`${(timeLeft/10)*100}%`}} />
        </div>
        {!gameOver ? (
          <div className="bg-white/[0.02] rounded-2xl border border-white/[0.04] p-8 text-center">
            <p className="text-[#9b8c78] text-sm mb-6">{timeLeft}秒</p>
            <p className="text-2xl font-bold text-[#e8e0d0] mb-8 leading-relaxed">{q?.q}</p>
            <div className="grid grid-cols-2 gap-3">
              {q?.opts.map((o,i)=>{
                const isCorrect = i===q.ans;
                const isPicked = i===selected;
                let bg = 'bg-white/[0.03] border-white/[0.06]';
                if (showAnswer) { bg = isCorrect ? 'bg-[#10b981]/20 border-[#10b981]/40' : isPicked ? 'bg-[#ef4444]/20 border-[#ef4444]/40' : bg; }
                return (
                  <button key={i} onClick={()=>pick(i)}
                    className={`p-4 rounded-xl border text-lg font-bold text-[#e8e0d0] transition-all ${bg} ${!showAnswer?'hover:border-[#8b5cf6] hover:bg-white/[0.06]':''}`}>
                    {String.fromCharCode(65+i)}. {o}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center animate-in py-12">
            <p className="text-5xl mb-4">🏆</p>
            <p className="text-2xl font-bold text-[#e8e0d0] font-display mb-2">抢答结束!</p>
            <p className="text-[#9b8c78] mb-2">得分 {score} / {questions.length*15}</p>
            <p className="text-sm text-[#5c554c] mb-6">正确率 {Math.round((score/(questions.length*15))*100)}%</p>
            <button onClick={()=>{setIdx(0);setScore(0);setStreak(0);setActive(true);setGameOver(false);setQuestions(QUESTIONS.sort(()=>Math.random()-0.5));}} className="btn-primary px-8 py-3">再来一局</button>
          </div>
        )}
      </div>
    </div>
  );
}
