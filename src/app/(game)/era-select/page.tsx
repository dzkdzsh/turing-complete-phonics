'use client';

import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/game-state';
import { ERAS } from '@/lib/constants';

export default function EraSelectPage() {
  const router = useRouter();
  const { unlockedEras, completedLevels, setCurrentEra, setScreen } =
    useGameStore();

  const handleEraClick = (eraNum: number) => {
    if (!unlockedEras.includes(eraNum)) return;
    setCurrentEra(eraNum);
    setScreen('level-select');
    router.push(`/level-select?era=${eraNum}`);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#1a1814] p-8">
      <h2 className="text-3xl font-bold text-[#c9a96e] mb-2">时代地图</h2>
      <p className="text-[#8b7355] mb-10">选择一个时代进入探索</p>

      <div className="flex gap-6 flex-wrap justify-center">
        {([1, 2, 3] as const).map((eraNum) => {
          const era = ERAS[eraNum];
          const unlocked = unlockedEras.includes(eraNum);
          const completed = completedLevels.filter((id) =>
            id.startsWith(`00${eraNum}`)
          ).length;

          return (
            <button
              key={eraNum}
              onClick={() => handleEraClick(eraNum)}
              disabled={!unlocked}
              className={`w-56 p-6 rounded-xl border-2 transition-all duration-300 text-left
                ${
                  unlocked
                    ? 'border-[#c9a96e]/40 hover:border-[#c9a96e] hover:scale-105 bg-[#2a2520] cursor-pointer'
                    : 'border-[#333] bg-[#1a1814] opacity-40 cursor-not-allowed'
                }`}
            >
              <div
                className="w-3 h-3 rounded-full mb-3"
                style={{ backgroundColor: era.color }}
              />
              <h3 className="text-xl font-bold text-[#e8e0d0] mb-1">
                {unlocked ? era.name : '？？？'}
              </h3>
              <p className="text-xs text-[#8b7355] mb-2">{era.nameEn}</p>
              <p className="text-sm text-[#8b7355]">{era.description}</p>
              {unlocked && (
                <p className="text-xs text-[#c9a96e] mt-3">
                  完成 {completed}/{era.totalLevels} 关
                </p>
              )}
              {!unlocked && (
                <p className="text-xs text-[#555] mt-3">尚未解锁</p>
              )}
            </button>
          );
        })}
      </div>

      {/* 返回按钮 */}
      <button
        onClick={() => {
          setScreen('splash');
          router.push('/');
        }}
        className="mt-10 px-6 py-2 text-[#8b7355] hover:text-[#c9a96e] transition-colors text-sm"
      >
        ← 返回首页
      </button>
    </div>
  );
}
