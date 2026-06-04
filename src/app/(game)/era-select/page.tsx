'use client';

import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/game-state';
import { ERAS } from '@/lib/constants';
import { signOut } from '@/lib/auth';

export default function EraSelectPage() {
  const router = useRouter();
  const { unlockedEras, completedLevels, isAdmin, username, setScreen } =
    useGameStore();

  const handleEraClick = (eraNum: number) => {
    if (!isAdmin && !unlockedEras.includes(eraNum)) return;
    setScreen('level-select');
    router.push(`/level-select?era=${eraNum}`);
  };

  const handleLogout = async () => {
    await signOut();
    setScreen('splash');
    router.push('/');
  };

  return (
    <div className="flex flex-col items-center h-full bg-[#1a1814] p-8 overflow-auto">
      {/* 用户栏 */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-[#c9a96e] text-sm">
            {username || '未知用户'}
          </span>
          {isAdmin && (
            <span className="text-xs bg-[#e64980]/20 text-[#e64980] px-2 py-0.5 rounded-full">
              管理员
            </span>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-[#555] hover:text-[#8b7355] transition-colors"
        >
          退出登录
        </button>
      </div>

      <h2 className="text-3xl font-bold text-[#c9a96e] mb-2">时代地图</h2>
      <p className="text-[#8b7355] mb-10">选择一个时代进入探索</p>

      <div className="flex gap-6 flex-wrap justify-center">
        {([1, 2, 3] as const).map((eraNum) => {
          const era = ERAS[eraNum];
          const unlocked = isAdmin || unlockedEras.includes(eraNum);
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
    </div>
  );
}
