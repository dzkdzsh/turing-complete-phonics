'use client';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/game-state';
import { useEffect, useState } from 'react';

export default function Home() {
  const r = useRouter(); const { setScreen } = useGameStore();
  const [v, setV] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setV(true)); }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden" style={{background:'#0f0d0a'}}>
      {/* Video background */}
      <video autoPlay loop muted playsInline preload="auto"
        className="absolute inset-0 w-full h-full object-cover z-0"
        src="/hero-bg.mp4" />

      {/* Gradient overlay */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-[#0f0d0a]/70 via-transparent to-[#0f0d0a]/90 pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-20 flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <span className="font-display text-3xl tracking-tight text-[#d4912a]">图灵拼读<span className="text-xs align-super text-[#9b8c78]">®</span></span>
        <div className="flex items-center gap-8">
          <button onClick={()=>r.push('/journal')} className="text-sm text-[#9b8c78] hover:text-[#d4912a] transition-colors">图鉴</button>
          <button onClick={()=>{setScreen('era-map');r.push('/era-select');}}
            className="rounded-full px-6 py-2.5 text-sm bg-[#d4912a] text-[#0f0d0a] font-bold hover:scale-[1.03] transition-transform">
            开始探索
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center px-6" style={{paddingTop:'calc(14rem)',paddingBottom:'12rem'}}>
        <h1 className={`font-display text-5xl sm:text-7xl md:text-8xl max-w-4xl font-normal transition-all duration-[1s] ease-out ${v?'opacity-100 translate-y-0':'opacity-0 translate-y-6'}`}
          style={{lineHeight:0.95,letterSpacing:'-2px',color:'#e8e0d0'}}>
          在<span className="italic text-[#9b8c78]">声音的废墟</span>之上，<br/>我们重建<span className="italic text-[#9b8c78]">语言。</span>
        </h1>

        <p className={`text-base sm:text-lg max-w-2xl mt-8 leading-relaxed transition-all duration-[1s] ease-out ${v?'opacity-100 translate-y-0 delay-[200ms]':'opacity-0 translate-y-5'}`}
          style={{color:'#9b8c78'}}>
          从最基础的音素碎片开始，一步步重建整个英语发音系统。<br/>如同考古学家在废墟中复原失落的语言文明。
        </p>

        <div className={`flex gap-4 mt-12 transition-all duration-[1s] ease-out ${v?'opacity-100 translate-y-0 delay-[400ms]':'opacity-0 translate-y-5'}`}>
          <button onClick={()=>{setScreen('era-map');r.push('/era-select');}}
            className="rounded-full px-10 py-5 text-base bg-[#d4912a] text-[#0f0d0a] font-bold hover:scale-[1.03] transition-transform">
            开始探索
          </button>
          <button onClick={()=>r.push('/challenge')}
            className="rounded-full px-10 py-5 text-base bg-white/10 text-[#e8e0d0] font-bold border border-white/15 hover:bg-white/20 hover:scale-[1.03] transition-all">
            ⚡ 课堂挑战
          </button>
        </div>

        <div className="flex items-center gap-3 mt-20 text-[11px] text-[#5c554c] font-medium tracking-widest">
          <span>SOUND</span><span className="text-[#3d3933]">→</span>
          <span>PHONEME</span><span className="text-[#3d3933]">→</span>
          <span>GLYPH</span><span className="text-[#3d3933]">→</span>
          <span>SPELL</span><span className="text-[#3d3933]">→</span>
          <span>MEMORY</span><span className="text-[#3d3933]">→</span>
          <span className="text-[#d4912a]">READ</span>
        </div>
      </div>
    </div>
  );
}
