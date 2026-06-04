'use client';
import { useState, useEffect } from 'react';

interface Props { title: string; introText: string; mechanicHint: string; onStart: () => void; }

export default function LevelStartModal({ title, introText, mechanicHint, onStart }: Props) {
  const [v, setV] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setV(true)); }, []);

  return (
    <div className={`absolute inset-0 z-30 flex items-center justify-center transition-all duration-500 ${v ? 'bg-[#2c2416]/15 backdrop-blur-[2px]' : 'bg-transparent'}`}>
      <div className={`bg-[#fdf8f0] rounded-2xl p-9 max-w-md mx-6 text-center shadow-xl border border-[#2c2416]/[0.05] transition-all duration-500 ${v ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-5'}`}>
        {/* Specimen label */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d4912a]/[0.06] border border-[#d4912a]/20 mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#d4912a]" />
          <span className="text-[10px] font-semibold text-[#d4912a] tracking-[0.12em] uppercase">New Discovery</span>
        </div>

        <h2 className="font-display text-2xl font-bold text-[#2c2416] mb-1">{title}</h2>
        <div className="w-8 h-px bg-[#d4912a]/30 mx-auto my-3" />
        <p className="text-[#5c4f3a]/80 text-sm leading-relaxed mb-5">{introText}</p>

        <div className="mb-7 p-4 rounded-xl bg-[#f5ede0]/60 border border-[#2c2416]/[0.04]">
          <p className="text-[10px] text-[#9b8c78] font-semibold tracking-wider uppercase mb-1.5">操作说明</p>
          <p className="text-sm text-[#2c2416] font-medium">{mechanicHint}</p>
        </div>

        <button onClick={onStart} className="btn-primary w-full text-sm py-3">开始探索</button>
        <p className="text-[10px] text-[#9b8c78]/60 mt-3">点击任意位置或按任意键开始</p>
      </div>
    </div>
  );
}
