'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import idiomsData from '@/data/idioms.json';
const IDIOMS = idiomsData as [string,string,string][];

// Common feihua characters
const CHARS = '春花秋月风雨雪山水云天人梦心酒歌离别愁思念爱情恨笑泪';

function pickChar(): string { return CHARS[Math.floor(Math.random()*CHARS.length)]; }

export default function FeihuaPage() {
  const r = useRouter();
  const [target, setTarget] = useState(pickChar());
  const [answers, setAnswers] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [active, setActive] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setTimeLeft(p => { if (p<=1) { setActive(false); setGameOver(true); return 0; } return p-1; }), 1000);
    return () => clearInterval(t);
  }, [active]);

  const submit = useCallback(() => {
    if (!active) return;
    const v = input.trim();
    if (!v) return;
    if (!v.includes(target)) { setFeedback(`必须包含"${target}"字！`); setInput(''); return; }
    if (answers.includes(v)) { setFeedback('已经说过了！'); setInput(''); return; }
    const found = IDIOMS.find(i => i[0] === v);
    if (!found) { setFeedback('库里没有这个词句，换一个！'); setInput(''); return; }
    setAnswers([...answers, v]); setScore(s => s + 10 + (v.length >= 4 ? 5 : 0) + (streak >= 3 ? 5 : 0));
    setStreak(s => s + 1); setFeedback(`✅ ${found[0]} — ${found[2]}`); setInput('');
    setTimeLeft(t => Math.min(t + 5, 90));
  }, [input, active, answers, target, streak]);

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') submit(); };
  const restart = () => { setTarget(pickChar()); setAnswers([]); setScore(0); setStreak(0); setTimeLeft(90); setActive(true); setGameOver(false); setFeedback(''); setInput(''); inputRef.current?.focus(); };

  return (
    <div className="min-h-screen flex flex-col items-center" style={{background:'#0f0d0a'}}>
      <div className="w-full max-w-2xl px-6 pt-6">
        <button onClick={()=>r.push('/challenge')} className="text-xs text-[#5c554c] hover:text-[#9b8c78] mb-4">← 返回</button>
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-3xl font-bold text-[#e8e0d0]">🏵️ 飞花令</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#9b8c78]">⭐{score}</span>
            {streak>=3 && <span className="text-xs text-[#f97316]">🔥x{streak}</span>}
            <span className={`font-mono text-lg font-bold ${timeLeft<=10?'text-[#ef4444]':'text-[#e8e0d0]'}`}>{timeLeft}s</span>
          </div>
        </div>
        {/* Target character */}
        <div className="text-center mb-6">
          <p className="text-xs text-[#5c554c] mb-2 uppercase tracking-wider">飞花令 · 含以下字的词句</p>
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-[#d4912a]/10 border-2 border-[#d4912a]/30">
            <span className="text-5xl font-bold text-[#d4912a] font-display">{target}</span>
          </div>
        </div>
        {/* Timer bar */}
        <div className="w-full h-2 rounded-full bg-white/5 mb-6 overflow-hidden">
          <div className={`h-full rounded-full transition-all ${timeLeft<=10?'bg-[#ef4444]':'bg-[#d4912a]'}`} style={{width:`${Math.max(0,(timeLeft/90)*100)}%`}} />
        </div>
        {/* Answers */}
        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.04] p-6 mb-6 min-h-[150px] max-h-[350px] overflow-auto">
          {answers.length === 0 && <p className="text-[#5c554c] text-sm text-center">说出含"<b className="text-[#d4912a]">{target}</b>"的成语或诗句...</p>}
          {answers.map((a,i)=>{
            const info = IDIOMS.find(x=>x[0]===a);
            return (
              <div key={i} className="flex items-center gap-3 py-2 animate-in">
                <span className="text-[10px] font-mono text-[#5c554c] w-6">{i+1}</span>
                <span className="text-lg font-bold text-[#e8e0d0] font-display">{a}</span>
                <span className="text-xs text-[#9b8c78]">{info?.[1]}</span>
                <span className="text-xs text-[#5c554c] truncate">— {info?.[2]}</span>
              </div>
            );
          })}
        </div>
        {/* Input */}
        {!gameOver ? (
          <div className="flex gap-3">
            <div className="flex-1 bg-white/[0.02] rounded-2xl border border-white/[0.06] px-4 py-3 flex items-center gap-3">
              <span className="text-xl font-bold text-[#d4912a]">含"{target}"</span>
              <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey}
                placeholder={`输入含"${target}"的成语或诗句...`}
                className="flex-1 bg-transparent text-[#e8e0d0] text-lg outline-none placeholder:text-[#5c554c]"
                disabled={!active} autoFocus />
            </div>
            <button onClick={submit} className="btn-primary px-6 py-3 text-sm" disabled={!active}>飞!</button>
          </div>
        ) : (
          <div className="text-center animate-in">
            <p className="text-3xl mb-2">🏆</p>
            <p className="text-xl font-bold text-[#e8e0d0] font-display mb-2">时间到!</p>
            <p className="text-[#9b8c78] mb-4">飞花令"<b className="text-[#d4912a]">{target}</b>" — {answers.length}句，得分{score}</p>
            <button onClick={restart} className="btn-primary px-8 py-3">再来一局</button>
          </div>
        )}
        {feedback && <p className={`text-sm mt-3 text-center ${feedback.startsWith('✅')?'text-[#10b981]':'text-[#ef4444]'}`}>{feedback}</p>}
      </div>
    </div>
  );
}
