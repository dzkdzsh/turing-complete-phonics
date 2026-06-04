'use client';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/game-state';
import { ERAS } from '@/lib/constants';

const REGIONS = [
  { eraNum:1, x:20, y:50, color:'#F59E0B', icon:'🔊', name:'Sound World', desc:'捕捉声音碎片' },
  { eraNum:2, x:52, y:28, color:'#06B6D4', icon:'🔗', name:'Sound Machine', desc:'焊接声音单元' },
  { eraNum:3, x:78, y:50, color:'#8B5CF6', icon:'🔤', name:'Alphabet', desc:'揭示字母符号' },
  { eraNum:4, x:50, y:72, color:'#e64980', icon:'✍️', name:'Dictation', desc:'听音拼词' },
  { eraNum:5, x:22, y:76, color:'#f97316', icon:'🧠', name:'Memory', desc:'闪记默写' },
];

export default function EraSelectPage() {
  const r = useRouter(); const { unlockedEras, completedLevels, isAdmin, setScreen } = useGameStore();
  const click = (n:number) => { if(!isAdmin&&!unlockedEras.includes(n))return; setScreen('level-select'); r.push(`/level-select?era=${n}`); };

  return (
    <div className="relative flex flex-col h-full overflow-hidden sky-bg">
      {/* Clouds */}
      <div className="absolute top-8 left-[10%] w-28 h-16 bg-white/80 rounded-full floaty" style={{animationDelay:'0s'}} />
      <div className="absolute top-6 left-[10%] w-16 h-10 bg-white/80 rounded-full" style={{marginLeft:35,marginTop:-12}} />
      <div className="absolute top-6 left-[10%] w-14 h-9 bg-white/80 rounded-full" style={{marginLeft:-15,marginTop:-6}} />
      <div className="absolute top-16 right-[15%] w-24 h-14 bg-white/80 rounded-full floaty" style={{animationDelay:'1.2s'}} />
      <div className="absolute top-12 right-[15%] w-14 h-9 bg-white/80 rounded-full" style={{marginLeft:28,marginTop:-10}} />
      {/* Hills */}
      <div className="absolute bottom-0 left-0 right-0 h-32 rounded-t-[40%] opacity-70" style={{background:'#7EC850',width:'120%',left:'-10%'}} />
      <div className="absolute bottom-0 left-0 right-0 h-20 rounded-t-[40%] opacity-50" style={{background:'#5DA83A',width:'110%',left:'-5%'}} />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 px-6 py-4 flex items-center justify-between">
        <span className="font-display text-lg font-bold text-[#3D2C2C] drop-shadow-sm">🗺️ 冒险地图</span>
        <button onClick={()=>{r.push('/journal');}} className="px-4 py-1.5 rounded-full bg-white/70 shadow-sm text-sm font-bold text-[#3D2C2C] hover:bg-white transition-all wiggle">
          📖 图鉴
        </button>
      </div>

      {/* Map title */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 text-center">
        <h1 className="font-display text-3xl font-extrabold text-[#3D2C2C] drop-shadow-sm">声音大陆</h1>
        <p className="text-sm text-[#6B5B4F] font-semibold mt-1">The Phonic Lands</p>
      </div>

      {/* SVG paths */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M27 54 Q40 40 50 34 Q58 38 68 46 Q74 50 76 54" fill="none" stroke="#F59E0B" strokeWidth="0.6" strokeDasharray="2,2" opacity="0.4"/>
        <path d="M50 34 Q40 40 35 48 Q38 58 48 69 Q44 72 30 78" fill="none" stroke="#06B6D4" strokeWidth="0.6" strokeDasharray="2,2" opacity="0.4"/>
        <path d="M27 54 Q22 60 24 72" fill="none" stroke="#f97316" strokeWidth="0.6" strokeDasharray="2,2" opacity="0.4"/>
        <text x="92" y="12" fontSize="2.5" fill="#F59E0B" fontFamily="sans-serif" fontWeight="bold">N</text>
      </svg>

      {/* Region markers */}
      {REGIONS.map((reg, i) => {
        const era = ERAS[reg.eraNum as keyof typeof ERAS];
        const unlocked = isAdmin || unlockedEras.includes(reg.eraNum);
        const completed = completedLevels.filter(id => id.startsWith(`0${reg.eraNum>9?'':''}${reg.eraNum}`)).length || 0;
        const pct = Math.round((completed / era.totalLevels) * 100);

        return (
          <button key={reg.eraNum} onClick={() => click(reg.eraNum)} disabled={!unlocked}
            className="absolute z-20 flex flex-col items-center transition-all duration-300 group"
            style={{ left: `${reg.x}%`, top: `${reg.y}%`, transform: 'translate(-50%,-50%)', filter: unlocked ? 'none' : 'grayscale(0.6) opacity(0.5)' }}>
            <div className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${unlocked ? 'group-hover:scale-115 bouncy-pop' : ''}`}
              style={{ background: unlocked ? `radial-gradient(circle, ${reg.color}20, ${reg.color}05)` : '#e5e5e5', boxShadow: unlocked ? `0 4px 16px ${reg.color}30` : 'none' }}>
              <span className="text-2xl">{reg.icon}</span>
              {unlocked && pct > 0 && (
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="29" fill="none" stroke={reg.color} strokeWidth="4" strokeDasharray={`${pct*1.82} 182`} strokeLinecap="round" opacity="0.6"/>
                </svg>
              )}
            </div>
            <div className="mt-2 text-center">
              <p className={`font-display text-xs font-bold ${unlocked ? 'text-[#3D2C2C]' : 'text-gray-400'}`}>{era.name}</p>
              {unlocked && <p className="text-[10px] font-bold text-[#FF8C42]">{completed}/{era.totalLevels}</p>}
            </div>
          </button>
        );
      })}

      <div className="absolute bottom-4 left-0 right-0 text-center z-20">
        <p className="text-xs text-[#6B5B4F] font-semibold">点击区域进入探索 ✨</p>
      </div>
    </div>
  );
}
