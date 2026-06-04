'use client';
import { useRouter } from 'next/navigation'; import { useGameStore } from '@/lib/game-state';
import { useEffect, useState } from 'react';

const STEPS = ['声音 Sound','音素 Phoneme','字母 Glyph','拼读 Blend','规则 Rule','阅读 Read'];

export default function Home() {
  const r = useRouter(); const { setScreen } = useGameStore(); const [v, setV] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setV(true)); }, []);

  return (
    <div className="flex items-center justify-center h-full paper-texture" style={{ background: 'linear-gradient(165deg, #fdf8f0 0%, #f5ede0 40%, #efe5d2 100%)' }}>
      <div className={`text-center px-6 transition-all duration-800 ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        style={{ transitionDuration: '800ms', transitionTimingFunction: 'cubic-bezier(0.4,0,0.2,1)' }}>

        {/* Brand mark */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/70 border border-[#2c2416]/[0.04] shadow-sm mb-10">
          <div className="w-2 h-2 rounded-full bg-[#d4912a] pulse-ring" />
          <span className="text-[10px] font-semibold text-[#5c4f3a] tracking-[0.15em] uppercase">Language Reconstruction Project</span>
        </div>

        <h1 className="font-display text-7xl font-bold text-[#2c2416] mb-3 tracking-tight">图灵拼读</h1>
        <p className="text-base text-[#d4912a] font-semibold tracking-[0.3em] uppercase mb-12">Turing Complete for Phonics</p>

        <p className="text-[#5c4f3a]/80 text-sm max-w-md mx-auto leading-relaxed mb-12">
          从最基础的<span className="font-semibold text-[#2c2416]">音素元件</span>开始，
          一步步<span className="font-semibold text-[#2c2416]">重建整个英语发音系统</span>。
          如同考古学家在废墟中复原失落的语言文明。
        </p>

        <div className="flex gap-4 justify-center mb-16">
          <button onClick={()=>{setScreen('era-map');r.push('/era-select');}} className="btn-primary">开始探索</button>
        </div>

        {/* Progress chain */}
        <div className="flex items-center gap-2 justify-center flex-wrap">
          {STEPS.map((s,i) => (
            <span key={s} className="flex items-center gap-2">
              <span className="text-[11px] text-[#9b8c78] font-medium tracking-wide">{s}</span>
              {i < 5 && <svg width="10" height="10" viewBox="0 0 10 10" className="text-[#d4c9b6]"><path d="M3 2L7 5L3 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
