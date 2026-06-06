'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import idiomsData from '@/data/idioms.json';

const IDIOMS: [string,string,string][] = idiomsData as [string,string,string][];

function pickStarter(): string {
  // Pre-compute follow-up counts for each last char
  const charCount: Record<string,number> = {};
  IDIOMS.forEach(i => { const fc = i[0][0]; charCount[fc] = (charCount[fc]||0)+1; });
  // Find idioms with 10+ follow-ups
  const good = IDIOMS.filter(i => (charCount[i[0][i[0].length-1]]||0) >= 10);
  if (good.length === 0) return IDIOMS[Math.floor(Math.random()*IDIOMS.length)][0];
  return good[Math.floor(Math.random()*good.length)][0];
}

export default function IdiomPage() {
  const r = useRouter();
  const [chain, setChain] = useState<string[]>([pickStarter()]);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [active, setActive] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setTimeLeft(p => { if (p<=1) { setActive(false); setGameOver(true); return 0; } return p-1; }), 1000);
    return () => clearInterval(t);
  }, [active]);

  const lastChar = chain[chain.length-1]?.[chain[chain.length-1].length-1] || '';

  const submit = useCallback(() => {
    if (!active) return;
    const trimmed = input.trim();
    if (!trimmed) return;
    if (trimmed[0] !== lastChar) { setFeedback(`必须以"${lastChar}"开头！`); setInput(''); return; }
    if (chain.includes(trimmed)) { setFeedback('这个成语已经用过了！'); setInput(''); return; }
    const found = IDIOMS.find(i => i[0] === trimmed);
    if (!found) { setFeedback('库里没有这个成语，换一个试试！'); setInput(''); return; }
    setChain([...chain, trimmed]); setScore(s => s + 10 + (trimmed.length >= 4 ? 5 : 0)); setFeedback(`✅ ${found[0]} — ${found[2]}`); setInput('');
    setTimeLeft(t => Math.min(t + 5, 90));
  }, [input, active, chain, lastChar]);

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') submit(); };

  return (
    <div className="min-h-screen flex flex-col items-center">
      <div className="w-full max-w-2xl px-6 pt-6">
        <button onClick={()=>r.push('/challenge')} className="text-xs text-[#5c554c] hover:text-[#9b8c78] mb-4">← 返回</button>
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-3xl font-bold text-[#e8e0d0]">🀄 成语接龙</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#9b8c78]">⭐{score}</span>
            <span className={`font-mono text-lg font-bold ${timeLeft<=10?'text-[#ef4444]':'text-[#e8e0d0]'}`}>{timeLeft}s</span>
          </div>
        </div>
        {/* Timer bar */}
        <div className="w-full h-2 rounded-full bg-white/5 mb-6 overflow-hidden">
          <div className={`h-full rounded-full transition-all ${timeLeft<=10?'bg-[#ef4444]':'bg-[#d4912a]'}`} style={{width:`${Math.max(0,(timeLeft/60)*100)}%`}} />
        </div>
        {/* Chain display */}
        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.04] p-6 mb-6 min-h-[200px] max-h-[400px] overflow-auto">
          {chain.map((idiom, i) => {
            const info = IDIOMS.find(x => x[0] === idiom);
            return (
              <div key={i} className={`flex items-center gap-3 py-2 ${i===chain.length-1?'animate-in':''}`}>
                <span className="text-[10px] font-mono text-[#5c554c] w-6">{i+1}</span>
                <span className="text-xl font-bold text-[#e8e0d0] font-display">{idiom}</span>
                <span className="text-xs text-[#9b8c78]">{info?.[1]}</span>
                <span className="text-xs text-[#5c554c]">— {info?.[2]}</span>
                {i < chain.length-1 && <span className="text-[#d4912a] text-lg ml-auto">{idiom[idiom.length-1]}</span>}
              </div>
            );
          })}
        </div>
        {/* Input area */}
        {!gameOver ? (
          <div className="flex gap-3 items-center">
            <div className="flex-1 bg-white/[0.02] rounded-2xl border border-white/[0.06] px-4 py-3 flex items-center gap-3">
              <span className="text-2xl font-bold text-[#d4912a] shrink-0">{lastChar}</span>
              <span className="text-[#5c554c]">→</span>
              <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey}
                placeholder={`输入以"${lastChar}"开头的成语...`}
                className="flex-1 bg-transparent text-[#e8e0d0] text-lg outline-none placeholder:text-[#5c554c]"
                disabled={!active} autoFocus />
            </div>
            <button onClick={submit} className="btn-primary px-6 py-3 text-sm" disabled={!active}>接!</button>
          </div>
        ) : (
          <div className="text-center animate-in">
            <p className="text-3xl mb-2">🏆</p>
            <p className="text-2xl font-bold text-[#e8e0d0] font-display mb-2">时间到!</p>
            <p className="text-[#9b8c78] mb-4">你接了 {chain.length} 个成语，得分 {score}</p>
            <button onClick={()=>{setChain([pickStarter()]);setScore(0);setTimeLeft(60);setActive(true);setGameOver(false);setFeedback('');setInput('');inputRef.current?.focus();}} className="btn-primary px-8 py-3">再来一局</button>
          </div>
        )}
        {feedback && <p className={`text-sm mt-3 text-center ${feedback.startsWith('✅')?'text-[#10b981]':'text-[#ef4444]'}`}>{feedback}</p>}
      </div>
    </div>
  );
}
