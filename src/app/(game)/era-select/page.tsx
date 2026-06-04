'use client';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/game-state';
import { ERAS } from '@/lib/constants';

const REGIONS = [
  { eraNum:1, x:20, y:55, color:'#d4912a', bg:'#fef6e8', icon:'🔊', name:'Sound World', desc:'捕捉纯粹的声音碎片' },
  { eraNum:2, x:50, y:30, color:'#2d8a7b', bg:'#eaf7f4', icon:'🔗', name:'Sound Machine', desc:'将碎片焊合成新单元' },
  { eraNum:3, x:78, y:55, color:'#6b5b8a', bg:'#f2eff7', icon:'🔤', name:'Alphabet Revolution', desc:'为声音赋予文字符号' },
];

export default function EraSelectPage() {
  const r = useRouter(); const { unlockedEras, completedLevels, isAdmin, setScreen } = useGameStore();
  const click = (n:number) => { if(!isAdmin&&!unlockedEras.includes(n))return; setScreen('level-select'); r.push(`/level-select?era=${n}`); };

  return (
    <div className="relative flex flex-col h-full overflow-hidden paper-texture" style={{ background: 'linear-gradient(180deg, #fdf8f0 0%, #f8f1e3 30%, #f3e8d4 70%, #efe0c8 100%)' }}>

      {/* Map terrain — SVG decorative layer */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Mountains */}
        <path d="M0 85 Q8 55 16 85 Q24 60 32 85 Q40 50 48 85 Q56 58 64 85 Q72 48 80 85 Q88 60 96 85 L100 85 L100 100 L0 100Z" fill="#e8dcc8" opacity="0.35"/>
        <path d="M0 90 Q10 65 20 90 Q30 60 40 90 Q50 70 60 90 Q70 55 80 90 Q90 68 100 90 L100 100 L0 100Z" fill="#ddd0b8" opacity="0.25"/>
        {/* Rivers */}
        <path d="M28 0 Q30 28 25 48 Q22 58 26 100" fill="none" stroke="#b5d8d0" strokeWidth="0.5" opacity="0.3"/>
        <path d="M72 0 Q70 30 74 52 Q76 68 72 100" fill="none" stroke="#b5d8d0" strokeWidth="0.4" opacity="0.2"/>
        {/* Path between regions */}
        <path d="M27 60 Q38 48 47 38 Q56 44 65 50 Q72 56 74 60" fill="none" stroke="#d4912a" strokeWidth="0.4" strokeDasharray="1.5,2" opacity="0.3"/>
        {/* Compass */}
        <g transform="translate(92, 10)">
          <circle cx="0" cy="0" r="5" fill="none" stroke="#c4b89a" strokeWidth="0.3"/>
          <circle cx="0" cy="0" r="4" fill="#fdf8f0" opacity="0.5"/>
          <text x="0" y="-5.5" textAnchor="middle" fontSize="2.2" fill="#9b8c78" fontFamily="serif" fontWeight="bold">N</text>
          <line x1="0" y1="-4" x2="0" y2="-2.5" stroke="#9b8c78" strokeWidth="0.5"/>
          <line x1="0" y1="2.5" x2="0" y2="4" stroke="#c4b89a" strokeWidth="0.3"/>
          <line x1="-4" y1="0" x2="-2.5" y2="0" stroke="#c4b89a" strokeWidth="0.3"/>
          <line x1="2.5" y1="0" x2="4" y2="0" stroke="#c4b89a" strokeWidth="0.3"/>
        </g>
        {/* Map label */}
        <text x="50" y="95" textAnchor="middle" fontSize="2" fill="#c4b89a" fontFamily="serif" fontStyle="italic" letterSpacing="0.3">THE PHONIC LANDS · 声音大陆</text>
      </svg>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-display text-base font-bold text-[#2c2416]">管理员</span>
          <span className="text-[10px] bg-[#6b5b8a]/10 text-[#6b5b8a] px-2 py-0.5 rounded-full font-bold">ADMIN</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={()=>{r.push('/journal');}} className="text-xs text-[#5c4f3a]/60 hover:text-[#2c2416] transition-colors font-medium flex items-center gap-1">
            <span>📖</span> 图鉴
          </button>
          <button onClick={()=>{setScreen('splash');r.push('/');}} className="text-xs text-[#5c4f3a]/50 hover:text-[#2c2416] transition-colors">离开</button>
        </div>
      </div>

      {/* Map title */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 text-center">
        <h1 className="font-display text-3xl font-bold text-[#2c2416] tracking-wide">声音大陆</h1>
        <div className="w-10 h-px bg-[#d4912a]/40 mx-auto mt-2 mb-1.5" />
        <p className="text-[11px] text-[#9b8c78] italic">The Phonic Lands</p>
      </div>

      {/* Region markers */}
      {REGIONS.map((reg, i) => {
        const era = ERAS[reg.eraNum as keyof typeof ERAS];
        const unlocked = isAdmin || unlockedEras.includes(reg.eraNum);
        const completed = completedLevels.filter(id => id.startsWith(`00${reg.eraNum}`)).length;
        const pct = Math.round((completed / era.totalLevels) * 100);

        return (
          <button key={reg.eraNum} onClick={() => click(reg.eraNum)} disabled={!unlocked}
            className="absolute z-20 flex flex-col items-center transition-all duration-500 group"
            style={{ left: `${reg.x}%`, top: `${reg.y}%`, transform: 'translate(-50%,-50%)',
              animationDelay: `${0.15 + i * 0.15}s`, filter: unlocked ? 'none' : 'grayscale(0.5) opacity(0.55)' }}>
            {/* Ambient glow */}
            {unlocked && <div className="absolute rounded-full blur-xl animate-pulse" style={{ width:90, height:90, backgroundColor:reg.color, opacity:0.08 }} />}
            {/* Icon circle */}
            <div className={`relative w-[4.5rem] h-[4.5rem] rounded-full flex items-center justify-center border-2 transition-all duration-500 animate-in ${unlocked ? 'group-hover:scale-110 shadow-lg' : ''}`}
              style={{ borderColor: unlocked ? reg.color : '#c4b89a', backgroundColor: unlocked ? reg.bg : '#f5f0e8', boxShadow: unlocked ? `0 4px 20px ${reg.color}15` : 'none', animationDelay: `${0.2+i*0.15}s` }}>
              <span className={`text-2xl transition-all duration-500 ${unlocked ? '' : 'opacity-35'}`}>{reg.icon}</span>
              {/* Completion ring */}
              {unlocked && pct > 0 && (
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 72 72">
                  <circle cx="36" cy="36" r="33" fill="none" stroke={reg.color} strokeWidth="2.5" strokeDasharray={`${pct*2.07} 207`} strokeLinecap="round" opacity="0.5"/>
                </svg>
              )}
              {/* Locked cracks */}
              {!unlocked && (
                <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 72 72">
                  <line x1="20" y1="24" x2="52" y2="36" stroke="#9b8c78" strokeWidth="0.8"/>
                  <line x1="22" y1="48" x2="48" y2="40" stroke="#9b8c78" strokeWidth="0.6"/>
                </svg>
              )}
            </div>
            {/* Label */}
            <div className="mt-2.5 text-center">
              <p className={`font-display text-sm font-bold tracking-wide transition-colors duration-500 ${unlocked ? 'text-[#2c2416]' : 'text-[#9b8c78]'}`}>
                {unlocked ? era.name : '???'}
              </p>
              <p className={`text-[10px] tracking-wider transition-colors duration-500 ${unlocked ? 'text-[#5c4f3a]' : 'text-[#c4b89a]'}`}>
                {reg.desc}
              </p>
              {unlocked ? (
                <span className="inline-block mt-1 text-[10px] font-mono text-[#9b8c78]">{completed}/{era.totalLevels}</span>
              ) : (
                <span className="inline-block mt-1 text-[10px] text-[#c4b89a]">废墟 · 待发掘</span>
              )}
            </div>
          </button>
        );
      })}

      {/* Bottom hint */}
      <div className="absolute bottom-5 left-0 right-0 text-center z-20">
        <p className="text-[10px] text-[#9b8c78]/60 italic">点击探索区域 · 收集声音碎片 · 重建失落文明</p>
      </div>
    </div>
  );
}
