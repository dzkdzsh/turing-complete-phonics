'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGameStore } from '@/lib/game-state';
import { ERAS } from '@/lib/constants';
import { useEffect, useState } from 'react';
import { loadSnapshot } from '@/lib/progress';

const LEVEL_PREVIEWS: Record<number, { id: string; title: string; isBoss: boolean }[]> = {
  1: [
    { id: '001-discover-m', title: '奇怪的声音', isBoss: false },
    { id: '002-discover-s', title: '嘶嘶的声音', isBoss: false },
    { id: '003-sound-match', title: '声音匹配', isBoss: false },
    { id: '004-sound-lab', title: '声音实验室', isBoss: false },
    { id: '005-boss-sounds', title: '声音大师试炼', isBoss: true },
  ],
  2: [
    { id: '006-blend-ma', title: '合成 /ma/', isBoss: false },
    { id: '007-blend-sa', title: '合成 /sa/', isBoss: false },
    { id: '008-blend-kat', title: '三个声音的合成', isBoss: false },
  ],
  3: [
    { id: '009-invent-m', title: '发明第一个字母', isBoss: false },
    { id: '010-encoding-board', title: '建造编码板', isBoss: false },
  ],
};

function LevelSelectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eraNum = Number(searchParams.get('era')) || 1;

  const { isAdmin, unlockedLevels, completedLevels, levelStars, username, setCurrentLevel, setScreen } = useGameStore();
  const era = ERAS[eraNum as keyof typeof ERAS];
  const levels = LEVEL_PREVIEWS[eraNum] || [];

  const [resumableLevels, setResumableLevels] = useState<Set<string>>(new Set());
  useEffect(() => {
    (async () => {
      const resumable = new Set<string>();
      for (const lvl of levels) {
        try { const snap = await loadSnapshot(lvl.id); if (snap) resumable.add(lvl.id); } catch { /* */ }
      }
      setResumableLevels(resumable);
    })();
  }, [eraNum]);

  const isUnlocked = (id: string) => isAdmin || unlockedLevels.includes(id);
  const isCompleted = (id: string) => completedLevels.includes(id);
  const getStars = (id: string) => levelStars[id] || 0;

  const handleLevelClick = (levelId: string, isBoss: boolean) => {
    setCurrentLevel(levelId);
    setScreen(isBoss ? 'boss' : 'gameplay');
    router.push(`/${isBoss ? 'boss' : 'gameplay'}?level=${levelId}`);
  };

  const handleLogout = async () => {
    const { signOut } = await import('@/lib/auth');
    await signOut(); setScreen('splash'); router.push('/');
  };

  return (
    <div className="flex flex-col items-center h-full bg-[#1a1814] p-8 overflow-auto">
      <div className="w-full max-w-2xl flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[#c9a96e] text-sm">{username || '未知用户'}</span>
          {isAdmin && <span className="text-xs bg-[#e64980]/20 text-[#e64980] px-2 py-0.5 rounded-full">管理员</span>}
        </div>
        <button onClick={handleLogout} className="text-xs text-[#555] hover:text-[#8b7355] transition-colors">退出登录</button>
      </div>

      <div className="w-3 h-3 rounded-full mb-2" style={{ backgroundColor: era?.color || '#c9a96e' }} />
      <h2 className="text-2xl font-bold text-[#c9a96e] mb-1">{era?.name || `Era ${eraNum}`}</h2>
      <p className="text-[#8b7355] text-sm mb-6">{era?.description}</p>

      <div className="flex gap-3 flex-wrap justify-center max-w-2xl">
        {levels.map((level) => {
          const unlocked = isUnlocked(level.id);
          const completed = isCompleted(level.id);
          const stars = getStars(level.id);
          const canResume = resumableLevels.has(level.id);
          return (
            <button key={level.id} onClick={() => handleLevelClick(level.id, level.isBoss)} disabled={!unlocked}
              className={`w-44 p-4 rounded-lg border transition-all duration-200 text-center
                ${unlocked ? 'border-[#c9a96e]/30 hover:border-[#c9a96e] hover:scale-105 bg-[#2a2520] cursor-pointer' : 'border-[#333] bg-[#1a1814] opacity-40 cursor-not-allowed'}
                ${completed ? 'border-green-700/50' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#8b7355]">#{level.id.split('-')[0]}</span>
                <div className="flex items-center gap-1">
                  {canResume && <span className="text-xs text-[#06b6d4]">继续</span>}
                  {level.isBoss && <span className="text-xs text-[#e64980]">★Boss</span>}
                </div>
              </div>
              <p className="text-[#e8e0d0] text-sm font-medium">{level.title}</p>
              {completed && (<div className="flex justify-center gap-1 mt-2">{[1,2,3].map(s=><span key={s} className={`text-xs ${s<=stars?'text-[#c9a96e]':'text-[#555]'}`}>★</span>)}</div>)}
              {!unlocked && <p className="text-xs text-[#555] mt-2">🔒 未解锁</p>}
              {unlocked && completed && <p className="text-xs text-[#10b981] mt-1">✓ 已通关</p>}
            </button>
          );
        })}
      </div>
      {levels.length === 0 && <p className="text-[#8b7355]">该时代暂无可用关卡</p>}
      <button onClick={() => { setScreen('era-map'); router.push('/era-select'); }} className="mt-8 px-6 py-2 text-[#8b7355] hover:text-[#c9a96e] transition-colors text-sm">← 返回时代地图</button>
    </div>
  );
}

export default function LevelSelectPage() {
  return (<Suspense fallback={<div className="flex items-center justify-center h-screen bg-[#1a1814]"><p className="text-[#8b7355]">加载中...</p></div>}><LevelSelectContent /></Suspense>);
}
