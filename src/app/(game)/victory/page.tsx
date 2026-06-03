'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useGameStore } from '@/lib/game-state';

export default function VictoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const levelId = searchParams.get('level') || '';
  const stars = Number(searchParams.get('stars')) || 3;
  const { setScreen } = useGameStore();

  const handleNext = () => {
    setScreen('level-select');
    router.push('/level-select?era=1');
  };

  const handleEraMap = () => {
    setScreen('era-map');
    router.push('/era-select');
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#1a1814] p-8">
      <h2 className="text-3xl font-bold text-[#c9a96e] mb-4">探索完成！</h2>

      {/* 星级 */}
      <div className="flex gap-2 mb-6 text-4xl">
        {[1, 2, 3].map((s) => (
          <span key={s} className={s <= stars ? 'text-[#c9a96e]' : 'text-[#333]'}>
            ★
          </span>
        ))}
      </div>

      <p className="text-[#8b7355] mb-2">
        你在笔记本中记录了新的发现。
      </p>
      <p className="text-xs text-[#555] mb-10">
        关卡: {levelId}
      </p>

      <div className="flex gap-4">
        <button
          onClick={handleNext}
          className="px-8 py-3 bg-[#c9a96e] text-[#1a1814] font-bold
                     rounded-lg hover:bg-[#e0c78a] active:scale-95
                     transition-all duration-200"
        >
          下一关
        </button>
        <button
          onClick={handleEraMap}
          className="px-8 py-3 border border-[#c9a96e]/40 text-[#c9a96e]
                     rounded-lg hover:border-[#c9a96e] transition-colors"
        >
          返回时代地图
        </button>
      </div>
    </div>
  );
}
