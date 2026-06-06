'use client';
import { Suspense } from 'react'; import { useRouter, useSearchParams } from 'next/navigation';
import { useGameStore } from '@/lib/game-state'; import { ERAS } from '@/lib/constants';
import { useCloudTransition } from '@/components/CloudProvider';

const L:Record<number,{id:string;title:string;boss:boolean}[]>={
  1:[{id:'001-discover-m',title:'发现 /m/',boss:false},{id:'002-discover-s',title:'发现 /s/',boss:false},{id:'003-sound-match',title:'回声匹配',boss:false},{id:'004-sound-lab',title:'声音实验室',boss:false},{id:'005-boss-sounds',title:'共振试炼',boss:true}],
  2:[{id:'006-blend-ma',title:'合成 /ma/',boss:false},{id:'007-blend-sa',title:'合成 /sa/',boss:false},{id:'008-blend-kat',title:'三重合成',boss:false}],
  3:[{id:'009-invent-m',title:'发明字母 M',boss:false},{id:'010-encoding-board',title:'编码矩阵',boss:false}],
  4:[{id:'011-spell-cvc',title:'CVC 听写',boss:false},{id:'012-spell-cvcc',title:'混合辅音听写',boss:false},{id:'013-spell-digraph',title:'双字母听写',boss:false},{id:'014-spell-long',title:'长元音听写',boss:false},{id:'015-spell-boss',title:'听写大师',boss:true}],
  5:[{id:'016-memory-cvc',title:'闪记 CVC',boss:false},{id:'017-memory-blend',title:'闪记混合',boss:false},{id:'018-memory-sight',title:'视觉词闪记',boss:false},{id:'019-memory-boss',title:'记忆大师',boss:true}],
  6:[{id:'020-sentence-simple',title:'简单句子',boss:false},{id:'021-sentence-quest',title:'问句',boss:false},{id:'022-sentence-story',title:'小故事',boss:true}],
  7:[{id:'023-chinese-pinyin',title:'文言实词',boss:false},{id:'024-chinese-radical',title:'古诗鉴赏',boss:false},{id:'025-chinese-poem',title:'文学常识',boss:false},{id:'026-chinese-boss',title:'语文综合',boss:true}],
  8:[{id:'027-history-dynasty',title:'古代史',boss:false},{id:'028-history-figures',title:'近现代史',boss:false},{id:'029-history-events',title:'历史综合',boss:false}],
};

function C(){
  const r=useRouter();const sp=useSearchParams();const n=Number(sp.get('era'))||1;const cloudNav=useCloudTransition();
  const{isAdmin,unlockedLevels,completedLevels,levelStars,setCurrentLevel,setScreen}=useGameStore();
  const era=ERAS[n as keyof typeof ERAS];const lvs=L[n]||[];

  const unl=(id:string)=>isAdmin||unlockedLevels.includes(id);
  const comp=(id:string)=>completedLevels.includes(id);
  const st=(id:string)=>levelStars[id]||0;
  const go=(id:string,boss:boolean)=>{if(!unl(id))return;setCurrentLevel(id);setScreen(boss?'boss':'gameplay');window.location.href=`/${boss?'boss':'gameplay'}?level=${id}`;};
  const color = n===1?'#d4912a':n===2?'#2d8a7b':'#6b5b8a';

  return (
    <div className="flex flex-col items-center min-h-full p-6 overflow-auto relative">
      {/* Top bar */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-8 animate-in relative z-10">
        <button onClick={()=>cloudNav(()=>{setScreen('era-map');r.push('/era-select');})} className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors font-medium">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          返回地图
        </button>
        <span className="text-xs text-white/50 font-medium">管理员</span>
      </div>

      {/* Era header */}
      <div className="text-center mb-10 animate-in anim-d1 relative z-10">
        <div className="w-3 h-3 rounded-full mx-auto mb-4" style={{ backgroundColor:color, boxShadow:`0 0 14px ${color}30` }} />
        <h2 className="font-display text-2xl font-bold text-white/95 mb-1.5">{era?.name}</h2>
        <p className="text-sm text-white/60 max-w-sm leading-relaxed">{era?.description}</p>
      </div>

      {/* Level cards — specimen collection grid */}
      <div className="flex gap-4 flex-wrap justify-center max-w-2xl relative z-10">
        {lvs.map((lv,i)=>(
          <button key={lv.id} onClick={()=>go(lv.id,lv.boss)} disabled={!unl(lv.id)}
            className={`relative w-[11rem] p-5 rounded-2xl text-left transition-all duration-300 animate-in ${unl(lv.id)?'bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/20 cursor-pointer':'bg-white/5 opacity-40 cursor-not-allowed rounded-2xl'}`}
            style={{animationDelay:`${0.1+i*0.06}s`}}>
            {/* Pin / number */}
            <div className="flex items-start justify-between mb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold ${comp(lv.id)?'bg-[#4a8c5c]/20 text-[#4a8c5c]':unl(lv.id)?'text-white/80 bg-white/10':'text-white/30 bg-white/5'}`}>
                {String(i+1).padStart(2,'0')}
              </div>
              <div className="flex items-center gap-1">
                {lv.boss && <span className="tag tag-amber" style={{fontSize:'0.55rem'}}>BOSS</span>}
              </div>
            </div>

            {/* Title */}
            <p className={`text-sm font-semibold leading-snug mb-3 ${unl(lv.id)?'text-white/90':'text-white/40'}`}>{lv.title}</p>

            {/* Status */}
            {comp(lv.id) ? (
              <div className="flex gap-1.5">
                {[1,2,3].map(s=>(
                  <svg key={s} width="14" height="14" viewBox="0 0 16 16" className={s<=st(lv.id)?'text-[#d4912a]':'text-white/15'}>
                    <path d="M8 1l2 4.5L15 6l-3.5 3L12.5 15 8 12.5 3.5 15 5 9 1.5 6 6 5.5z" fill="currentColor"/>
                  </svg>
                ))}
              </div>
            ) : unl(lv.id) ? (
              <span className="text-[10px] text-[#2d8a7b] font-medium tracking-wide">▸ 进入</span>
            ) : (
              <span className="text-[10px] text-white/20">🔒</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function P(){return(<Suspense fallback={<div className="flex items-center justify-center h-screen" style={{background:'#fdf8f0'}}><div className="shimmer w-24 h-2 rounded-full"/></div>}><C/></Suspense>);}
