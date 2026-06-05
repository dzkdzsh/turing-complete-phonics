'use client';
import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '@/lib/game-state'; import { eventBus } from '@/game/event-bus';
import { GameEvents } from '@/types/events'; import type { WinConditionMetPayload } from '@/types/events';
import LevelStartModal from './LevelStartModal'; import VictoryModal from './VictoryModal';

interface HUDProps { levelId: string; isBoss?: boolean; title?: string; introText?: string; victoryText?: string; mechanicHint?: string; onExit?: () => void; onBackToMap?: () => void; }

const CHAIN: Record<string,string>={'discover-m':'discover-s','discover-s':'sound-match','sound-match':'sound-lab','sound-lab':'boss-sounds','boss-sounds':'blend-ma','blend-ma':'blend-sa','blend-sa':'blend-kat','blend-kat':'invent-m','invent-m':'encoding-board','encoding-board':'spell-cvc','spell-cvc':'spell-cvcc','spell-cvcc':'spell-digraph','spell-digraph':'spell-long','spell-long':'spell-boss','spell-boss':'memory-cvc','memory-cvc':'memory-blend','memory-blend':'memory-sight','memory-sight':'memory-boss','memory-boss':'sentence-simple','sentence-simple':'chinese-pinyin','chinese-pinyin':'chinese-radical','chinese-radical':'chinese-poem','chinese-poem':'chinese-boss','chinese-boss':'history-dynasty','history-dynasty':'history-figures','history-figures':'history-events'};

export default function HUD({ levelId, isBoss=false, title='', introText='', victoryText='', mechanicHint='', onExit, onBackToMap }: HUDProps) {
  const { completeLevel, unlockLevel, setScreen } = useGameStore();
  const [elapsed, setElapsed] = useState(0); const [showStart, setShowStart] = useState(true);
  const [showVictory, setShowVictory] = useState(false); const [stars, setStars] = useState(0);

  useEffect(()=>{const t=setInterval(()=>setElapsed(e=>e+1),1000);return()=>clearInterval(t);},[]);

  useEffect(()=>{
    const h=(p:WinConditionMetPayload)=>{setStars(p.stars||3);completeLevel(levelId,p.stars||3);
      const s=levelId.substring(levelId.indexOf('-')+1);const n=CHAIN[s];
      if(n){const num=parseInt(levelId.split('-')[0]);unlockLevel(`${String(num+1).padStart(3,'0')}-${n}`);}
      setShowVictory(true);};
    eventBus.on(GameEvents.WIN_CONDITION_MET,h);return()=>{eventBus.off(GameEvents.WIN_CONDITION_MET,h);};
  },[levelId,completeLevel,unlockLevel]);

  const handleExit=useCallback(()=>{eventBus.emit(GameEvents.PAUSE_GAME,{});if(onExit)onExit();else{setScreen('level-select');window.location.href='/level-select?era=1';}},[onExit,setScreen]);
  const handleBackToMap=useCallback(()=>{eventBus.emit(GameEvents.PAUSE_GAME,{});if(onBackToMap)onBackToMap();else{setScreen('era-map');window.location.href='/era-select';}},[onBackToMap,setScreen]);

  const handleNext=()=>{const s=levelId.substring(levelId.indexOf('-')+1);const n=CHAIN[s];if(n){const num=parseInt(levelId.split('-')[0]);const nid=`${String(num+1).padStart(3,'0')}-${n}`;const path=n==='boss-sounds'?'boss':'gameplay';window.location.href=`/${path}?level=${nid}`;}else{setScreen('era-map');window.location.href='/era-select';}};

  const fmt=(s:number)=>{const m=Math.floor(s/60),sec=s%60;return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;};
  const lvNum=levelId.split('-')[1]||'';

  return (<>
    {showStart&&<LevelStartModal title={title||levelId} introText={introText||'准备开始探索...'} mechanicHint={mechanicHint||'拖拽声音生物到共振器上'} onStart={()=>setShowStart(false)} />}
    {showVictory&&<VictoryModal title={title||levelId} victoryText={victoryText||'你在笔记本中记录了新的发现。'} stars={stars} onNextLevel={handleNext} onBackToMap={()=>{setScreen('era-map');window.location.href='/era-select';}} />}
    {!showStart&&(
      <div className="absolute top-0 left-0 right-0 z-20">
        <div className="mx-4 mt-3 px-4 py-2 rounded-xl bg-[#fdf8f0]/90 backdrop-blur-md border border-[#2c2416]/[0.04] shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={handleBackToMap} className="w-8 h-8 rounded-full bg-[#2c2416]/[0.03] hover:bg-[#2c2416]/[0.08] flex items-center justify-center transition-colors" title="返回地图">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8L10 12" stroke="#5c4f3a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <span className="text-[10px] text-[#d4912a] font-mono font-bold">{String(lvNum).padStart(2,'0')}</span>
            <span className="w-px h-3 bg-[#2c2416]/[0.06]" />
            <span className="text-xs text-[#2c2416] font-semibold font-display">{title}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-[#9b8c78] font-mono">{fmt(elapsed)}</span>
            {isBoss&&<span className="tag tag-amber" style={{fontSize:'0.5rem'}}>BOSS</span>}
          </div>
        </div>
      </div>
    )}
  </>);
}
