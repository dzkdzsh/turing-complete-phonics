'use client';

interface VictoryModalProps {
  title: string;
  victoryText: string;
  stars: number;
  onNextLevel: () => void;
  onBackToMap: () => void;
}

export default function VictoryModal({
  title,
  victoryText,
  stars,
  onNextLevel,
  onBackToMap,
}: VictoryModalProps) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70">
      <div className="bg-[#2a2520] border border-[#c9a96e]/50 rounded-xl p-8 max-w-md mx-4 text-center shadow-2xl">
        <h2 className="text-xl font-bold text-[#c9a96e] mb-2">探索完成！</h2>
        <p className="text-sm text-[#8b7355] mb-4">{title}</p>

        {/* 星级 */}
        <div className="flex justify-center gap-2 mb-4 text-4xl">
          {[1, 2, 3].map((s) => (
            <span
              key={s}
              className={`transition-all duration-300 ${
                s <= stars ? 'text-[#c9a96e] scale-110' : 'text-[#333]'
              }`}
            >
              ★
            </span>
          ))}
        </div>

        <p className="text-[#e8e0d0] text-sm leading-relaxed mb-6">
          {victoryText}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onBackToMap}
            className="flex-1 px-4 py-2 border border-[#c9a96e]/40 text-[#c9a96e]
                       rounded-lg hover:border-[#c9a96e] transition-colors text-sm"
          >
            时代地图
          </button>
          <button
            onClick={onNextLevel}
            className="flex-1 px-4 py-2 bg-[#c9a96e] text-[#1a1814] font-bold
                       rounded-lg hover:bg-[#e0c78a] active:scale-95
                       transition-all duration-200 text-sm"
          >
            下一关
          </button>
        </div>
      </div>
    </div>
  );
}
