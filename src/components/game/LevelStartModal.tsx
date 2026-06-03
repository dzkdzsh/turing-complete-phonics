'use client';

interface LevelStartModalProps {
  title: string;
  introText: string;
  mechanicHint: string;
  onStart: () => void;
}

export default function LevelStartModal({
  title,
  introText,
  mechanicHint,
  onStart,
}: LevelStartModalProps) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70">
      <div className="bg-[#2a2520] border border-[#c9a96e]/40 rounded-xl p-8 max-w-md mx-4 text-center shadow-2xl">
        <h2 className="text-2xl font-bold text-[#c9a96e] mb-2">{title}</h2>
        <div className="w-16 h-0.5 bg-[#c9a96e]/40 mx-auto mb-4" />

        <p className="text-[#e8e0d0] text-sm leading-relaxed mb-4">{introText}</p>

        <div className="bg-[#1a1814] rounded-lg p-3 mb-6">
          <p className="text-xs text-[#8b7355]">操作提示</p>
          <p className="text-sm text-[#c9a96e]">{mechanicHint}</p>
        </div>

        <button
          onClick={onStart}
          className="px-8 py-3 bg-[#c9a96e] text-[#1a1814] font-bold
                     rounded-lg hover:bg-[#e0c78a] active:scale-95
                     transition-all duration-200 w-full"
        >
          开始探索
        </button>
      </div>
    </div>
  );
}
