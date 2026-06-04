'use client';
import { useRouter } from 'next/navigation'; import { useGameStore } from '@/lib/game-state';
import { useEffect, useState } from 'react';

export default function Home() {
  const r = useRouter(); const { setScreen } = useGameStore(); const [v, setV] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setV(true)); }, []);

  return (
    <div className="flex items-center justify-center h-full sky-bg relative overflow-hidden">
      {/* Cartoon clouds */}
      <div className="absolute top-12 left-[15%] w-24 h-14 bg-white rounded-full opacity-90 floaty shadow-lg" style={{animationDelay:'0s'}} />
      <div className="absolute top-8 left-[15%] w-16 h-10 bg-white rounded-full opacity-90" style={{marginLeft:30,marginTop:-10}} />
      <div className="absolute top-8 left-[15%] w-14 h-9 bg-white rounded-full opacity-90" style={{marginLeft:-20,marginTop:-5}} />
      <div className="absolute top-24 right-[20%] w-20 h-12 bg-white rounded-full opacity-85 floaty shadow-lg" style={{animationDelay:'1.5s'}} />
      <div className="absolute top-20 right-[20%] w-14 h-9 bg-white rounded-full opacity-85" style={{marginLeft:25,marginTop:-8}} />
      {/* Green hills */}
      <div className="absolute bottom-0 left-0 right-0 h-40 rounded-t-[50%] opacity-80" style={{background:'#7EC850',width:'120%',left:'-10%'}} />
      <div className="absolute bottom-0 left-0 right-0 h-28 rounded-t-[50%] opacity-60" style={{background:'#5DA83A',width:'110%',left:'-5%'}} />

      <div className={`relative z-10 text-center px-6 transition-all duration-700 ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/80 shadow-lg mb-8">
          <span className="text-2xl">🔤</span>
          <span className="text-sm font-bold text-[#3D2C2C]">Language Adventure</span>
        </div>
        <h1 className="font-display text-7xl font-extrabold text-[#3D2C2C] mb-2 drop-shadow-sm">图灵拼读</h1>
        <p className="text-xl text-[#FF8C42] font-bold mb-10 drop-shadow-sm">Turing Complete for Phonics</p>
        <p className="text-[#6B5B4F] text-base max-w-md mx-auto leading-relaxed mb-10 bg-white/60 backdrop-blur rounded-2xl py-4 px-6 shadow-sm">
          从声音碎片开始，<span className="font-extrabold text-[#FF6B9D]">搭建</span>你的英语拼读系统！🔊
        </p>
        <button onClick={()=>{setScreen('era-map');r.push('/era-select');}} className="btn-toon text-lg px-10 py-4 wiggle">
          🚀 开始冒险
        </button>
      </div>
    </div>
  );
}
