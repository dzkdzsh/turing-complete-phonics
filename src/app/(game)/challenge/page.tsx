'use client';
import { useRouter } from 'next/navigation';
import { useCloudTransition } from '@/components/CloudProvider';
import { useState, useEffect } from 'react';

const GAMES = [
  {icon:'⚡',title:'英语挑战',desc:'辨音·拼写·记忆',color:'#d4912a',href:'/challenge/english'},
  {icon:'🀄',title:'成语接龙',desc:'尾字接龙·30000词库',color:'#ef4444',href:'/challenge/idiom'},
  {icon:'🏛️',title:'历史抢答',desc:'15题限时·计分连击',color:'#8b5cf6',href:'/challenge/history-quiz'},
  {icon:'🎁',title:'盲盒任务',desc:'6学科随机任务',color:'#f59e0b',href:'/challenge/mystery-box'},
  {icon:'🏵️',title:'飞花令',desc:'指定字·诗句成语',color:'#ec4899',href:'/challenge/feihua'},
  {icon:'🧩',title:'猜谜语',desc:'25道经典谜语',color:'#10b981',href:'/challenge/riddle'},
];

interface Particle { w:number; h:number; l:number; t:number; dur:number; del:number; }

export default function ChallengePage() {
  const r=useRouter();const cloudNav=useCloudTransition();
  const [particles, setParticles] = useState<Particle[]>([]);
  useEffect(() => {
    setParticles(Array.from({length:30}, () => ({
      w: Math.random()*4+2, h: Math.random()*4+2,
      l: Math.random()*100, t: Math.random()*100,
      dur: Math.random()*5+3, del: Math.random()*3,
    })));
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center relative overflow-hidden">
      {/* Animated particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p, i) => (
          <div key={i} className="absolute rounded-full opacity-10"
            style={{width:p.w+'px',height:p.h+'px',background:'#d4912a',
              left:p.l+'%',top:p.t+'%',
              animation:`float ${p.dur}s ease-in-out ${p.del}s infinite`}} />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center flex-1 px-6 py-14 max-w-4xl w-full">
        <div className="text-center mb-12 animate-in">
          <h1 className="font-display text-4xl font-bold text-white/95 mb-2">⚡ 课堂游戏中心</h1>
          <p className="text-white/60 text-sm">选择一个游戏开始</p>
        </div>

        {/* Game grid — big cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 w-full stagger-reveal">
          {GAMES.map((g,i)=>(
            <button key={g.title} onClick={()=>cloudNav(()=>r.push(g.href))}
              className="group relative p-6 sm:p-8 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 hover:border-[#d4912a]/40 hover:shadow-lg text-center transition-all duration-300 hover:-translate-y-2"
              style={{transitionDelay:`${i*0.06}s`}}>
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{background:`radial-gradient(circle at center, ${g.color}30 0%, transparent 70%)`}}/>
              <span className="text-4xl sm:text-5xl block mb-3 relative z-10">{g.icon}</span>
              <span className="text-base sm:text-lg font-bold text-white/90 block relative z-10 group-hover:text-[#d4912a] transition-colors">{g.title}</span>
              <span className="text-[11px] sm:text-xs text-white/50 block mt-1.5 relative z-10">{g.desc}</span>
            </button>
          ))}
        </div>

        <button onClick={()=>cloudNav(()=>r.push('/era-select'))} className="mt-12 text-xs text-white/40 hover:text-white/70">← 返回地图</button>
      </div>
    </div>
  );
}
