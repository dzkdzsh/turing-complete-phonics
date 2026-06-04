'use client';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/game-state';
import { getUnlocksUpTo, LEVEL_ORDER } from '@/lib/inventory';
import { PHONEME_COLORS } from '@/lib/constants';
import { useState } from 'react';

const PHONEME_INFO: Record<string, { desc: string; example: string; mouth: string }> = {
  m: { desc: '双唇鼻音 — 闭上嘴唇，让声音从鼻子出来', example: 'mom, milk', mouth: '紧闭双唇' },
  s: { desc: '齿龈擦音 — 舌尖靠近上齿龈，气流挤出', example: 'sun, snake', mouth: '舌尖抵齿龈' },
  a: { desc: '开口前元音 — 嘴巴张大的 "啊"', example: 'apple, cat', mouth: '嘴巴张大' },
  k: { desc: '软腭塞音 — 舌根抬起堵住气流，再突然释放', example: 'cat, kite', mouth: '舌根抬起' },
  ae: { desc: '次开前元音 — 比 /a/ 嘴型稍小', example: 'cat, bat', mouth: '嘴角向两边' },
  t: { desc: '齿龈塞音 — 舌尖抵住齿龈再释放', example: 'top, time', mouth: '舌尖弹齿龈' },
};

export default function JournalPage() {
  const r = useRouter();
  const { completedLevels, setScreen } = useGameStore();
  const [selected, setSelected] = useState<string | null>(null);

  // Collect all unlocked phonemes and letters
  const allPhonemes = new Set<string>();
  const allLetters = new Set<string>();
  for (const lvId of completedLevels) {
    const unlocks = getUnlocksUpTo(lvId);
    unlocks.phonemes.forEach(p => allPhonemes.add(p));
    unlocks.letters.forEach(l => allLetters.add(l));
  }
  const phonemeArr = Array.from(allPhonemes);
  const letterArr = Array.from(allLetters);
  const totalDiscovered = phonemeArr.length + letterArr.length;

  const selectedInfo = selected ? PHONEME_INFO[selected] : null;

  return (
    <div className="flex flex-col items-center h-full p-6 overflow-auto" style={{ background: 'linear-gradient(180deg, #fdf8f0 0%, #f5ede0 100%)' }}>
      {/* Header */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-8 animate-in">
        <button onClick={() => { setScreen('era-map'); r.push('/era-select'); }} className="flex items-center gap-1 text-sm text-[#a16207] hover:text-[#92400e] transition-colors font-medium">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>时代地图
        </button>
        <span className="text-xs text-[#a16207]/60 font-medium">{totalDiscovered} 个发现</span>
      </div>

      <h1 className="text-2xl font-serif font-bold text-[#78350f] mb-2 animate-in animate-in-d1">📖 声音图鉴</h1>
      <p className="text-xs text-[#a16207]/60 mb-8 animate-in animate-in-d1">Sound Journal — 已发现的声音碎片</p>

      {phonemeArr.length === 0 && letterArr.length === 0 ? (
        <div className="text-center mt-20 animate-in">
          <span className="text-5xl">📓</span>
          <p className="text-[#a16207]/50 mt-4">还没有任何发现</p>
          <p className="text-xs text-[#a16207]/30">完成关卡来收录音素</p>
        </div>
      ) : (
        <div className="flex gap-8 max-w-2xl w-full flex-wrap justify-center">
          {/* Phoneme cards */}
          <div className="flex-1 min-w-[200px]">
            <h2 className="text-sm font-bold text-[#92400e] mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#f59e0b]"/> 音素 Phonemes
            </h2>
            <div className="flex flex-wrap gap-3">
              {phonemeArr.map(p => (
                <button key={p} onClick={() => setSelected(selected === p ? null : p)}
                  className={`relative px-4 py-3 rounded-xl transition-all duration-200 text-left ${selected === p ? 'bg-white shadow-md scale-105 ring-2 ring-[#f59e0b]/30' : 'bg-white/60 hover:bg-white hover:shadow-sm'}`}>
                  <span className="text-lg font-bold text-[#78350f]">/{p}/</span>
                  <span className="block text-[10px] text-[#a16207]/50 font-medium mt-0.5">
                    {p === 'ae' ? '次开元音' : p === 'm' ? '鼻音' : p === 's' ? '擦音' : p === 'k' ? '塞音' : p === 't' ? '塞音' : '元音'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Letter cards */}
          {letterArr.length > 0 && (
            <div className="flex-1 min-w-[150px]">
              <h2 className="text-sm font-bold text-[#92400e] mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#8b5cf6]"/> 字母 Glyphs
              </h2>
              <div className="flex flex-wrap gap-3">
                {letterArr.map(l => (
                  <div key={l}
                    className="px-5 py-3 rounded-xl bg-white/60 text-center">
                    <span className="text-2xl font-serif font-bold text-[#78350f]">{l}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail panel */}
      {selectedInfo && (
        <div className="mt-6 p-5 rounded-2xl bg-white/90 shadow-md max-w-sm w-full animate-in border border-[#f59e0b]/20">
          <h3 className="text-lg font-bold text-[#78350f] mb-2">/{selected}/</h3>
          <p className="text-sm text-[#6b5e53] leading-relaxed mb-3">{selectedInfo.desc}</p>
          <div className="flex gap-4 text-xs text-[#a16207]/60">
            <span>🗣️ {selectedInfo.mouth}</span>
            <span>📝 {selectedInfo.example}</span>
          </div>
        </div>
      )}
    </div>
  );
}
