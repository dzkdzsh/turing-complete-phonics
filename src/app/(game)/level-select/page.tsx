'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useGameStore } from '@/lib/game-state';
import { ERAS } from '@/lib/constants';

// MVP 阶段：10个关卡 —— 更多关卡在后续阶段添加
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

export default function LevelSelectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eraNum = Number(searchParams.get('era')) || 1;

  const {
    unlockedLevels,
    completedLevels,
    levelStars,
    setCurrentLevel,
    setScreen,
  } = useGameStore();

  const era = ERAS[eraNum as keyof typeof ERAS];
  const levels = LEVEL_PREVIEWS[eraNum] || [];

  const handleLevelClick = (levelId: string, isBoss: boolean) => {
    if (!unlockedLevels.includes(levelId)) return;
    setCurrentLevel(levelId);
    setScreen(isBoss ? 'boss' : 'gameplay');
    const route = isBoss ? '/boss' : '/gameplay';
    router.push(`${route}?level=${levelId}`);
  };

  const isCompleted = (id: string) => completedLevels.includes(id);
  const getStars = (id: string) => levelStars[id] || 0;

  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#1a1814] p-8">
      <div
        className="w-3 h-3 rounded-full mb-2"
        style={{ backgroundColor: era?.color || '#c9a96e' }}
      />
      <h2 className="text-2xl font-bold text-[#c9a96e] mb-1">
        {era?.name || `Era ${eraNum}`}
      </h2>
      <p className="text-[#8b7355] text-sm mb-8">{era?.description}</p>

      <div className="flex gap-4 flex-wrap justify-center max-w-2xl">
        {levels.map((level) => {
          const unlocked = unlockedLevels.includes(level.id);
          const completed = isCompleted(level.id);
          const stars = getStars(level.id);

          return (
            <button
              key={level.id}
              onClick={() => handleLevelClick(level.id, level.isBoss)}
              disabled={!unlocked}
              className={`w-44 p-4 rounded-lg border transition-all duration-200 text-center
                ${
                  unlocked
                    ? 'border-[#c9a96e]/30 hover:border-[#c9a96e] hover:scale-105 bg-[#2a2520] cursor-pointer'
                    : 'border-[#333] bg-[#1a1814] opacity-40 cursor-not-allowed'
                }
                ${completed ? 'border-green-700/50' : ''}
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#8b7355]">
                  #{level.id.split('-')[0]}
                </span>
                {level.isBoss && (
                  <span className="text-xs text-[#e64980]">★Boss</span>
                )}
              </div>
              <p className="text-[#e8e0d0] text-sm font-medium">
                {level.title}
              </p>

              {/* 星级显示 */}
              {completed && (
                <div className="flex justify-center gap-1 mt-2">
                  {[1, 2, 3].map((s) => (
                    <span
                      key={s}
                      className={`text-xs ${s <= stars ? 'text-[#c9a96e]' : 'text-[#555]'}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              )}

              {!unlocked && (
                <p className="text-xs text-[#555] mt-2">🔒 未解锁</p>
              )}
            </button>
          );
        })}
      </div>

      {levels.length === 0 && (
        <p className="text-[#8b7355]">该时代暂无可用关卡</p>
      )}

      <button
        onClick={() => {
          setScreen('era-map');
          router.push('/era-select');
        }}
        className="mt-10 px-6 py-2 text-[#8b7355] hover:text-[#c9a96e] transition-colors text-sm"
      >
        ← 返回时代地图
      </button>
    </div>
  );
}
