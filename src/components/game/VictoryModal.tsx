'use client';
import { useState, useEffect } from 'react';
interface Props { title: string; victoryText: string; stars: number; onNextLevel: () => void; onBackToMap: () => void; }

export default function VictoryModal({ title, victoryText, stars, onNextLevel, onBackToMap }: Props) {
  const [p, setP] = useState(0);
  useEffect(() => { const t1=setTimeout(()=>setP(1),250); const t2=setTimeout(()=>setP(2),900); return()=>{clearTimeout(t1);clearTimeout(t2);}; }, []);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#2c2416]/15 backdrop-blur-[2px]">
      <div className="bg-[#fdf8f0] rounded-2xl p-9 max-w-md mx-6 text-center shadow-xl border border-[#2c2416]/[0.05] animate-in">
        {/* Mini map glow */}
        <div className="relative w-48 h-28 mx-auto mb-5 rounded-xl overflow-hidden border border-[#2c2416]/[0.04]" style={{background:'linear-gradient(180deg, #fef9ee 0%, #f8edd8 60%, #f0dfc0 100%)'}}>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 192 112">
            {[[36,68],[96,44],[150,68]].map(([mx,my],i)=>(
              <circle key={i} cx={mx} cy={my} r="7" fill={i<2?'#d4912a15':'#d4c9b6'} stroke={i<2?'#d4912a':'#d4c9b6'} strokeWidth="1"/>
            ))}
            <path d="M43 68 Q70 56 89 44 Q108 48 143 68" fill="none" stroke="#d4912a" strokeWidth="0.4" strokeDasharray="2 2" opacity="0.25"/>
            <circle cx="36" cy="68" r="4" fill="#d4912a" opacity="0.7">
              <animate attributeName="opacity" values="0.3;0.9;0.3" dur="2.5s" repeatCount="indefinite"/>
              <animate attributeName="r" values="3;6;3" dur="2.5s" repeatCount="indefinite"/>
            </circle>
          </svg>
          <p className="absolute bottom-1.5 left-0 right-0 text-center text-[7px] text-[#9b8c78]/40 font-serif italic">The Phonic Lands</p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4a8c5c]/[0.06] border border-[#4a8c5c]/20 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4a8c5c]" />
          <span className="text-[10px] font-semibold text-[#4a8c5c] tracking-[0.12em] uppercase">Discovery Complete</span>
        </div>

        <h2 className="font-display text-xl font-bold text-[#2c2416] mb-1">{title}</h2>

        {/* Stars */}
        <div className="flex justify-center gap-3 my-5">
          {[1,2,3].map((s,i)=>(
            <svg key={s} width="36" height="36" viewBox="0 0 24 24"
              className={`transition-all duration-500 ${p>=1?'opacity-100 scale-100':'opacity-0 scale-50'}`}
              style={{transitionDelay:`${i*100}ms`, color:s<=stars?'#d4912a':'#e0d6c4'}}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
            </svg>
          ))}
        </div>

        <p className={`text-[#5c4f3a]/70 text-sm leading-relaxed mb-6 transition-all duration-400 ${p>=1?'opacity-100':'opacity-0'}`}>{victoryText}</p>

        <div className={`flex gap-3 transition-all duration-400 ${p>=2?'opacity-100 translate-y-0':'opacity-0 translate-y-2'}`}>
          <button onClick={onBackToMap} className="btn-ghost flex-1 text-sm">返回地图</button>
          <button onClick={onNextLevel} className="btn-primary flex-1 text-sm">继续探索</button>
        </div>
      </div>
    </div>
  );
}
