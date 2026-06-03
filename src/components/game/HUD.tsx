'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/game-state';
import { eventBus } from '@/game/event-bus';
import { GameEvents } from '@/types/events';
import type { WinConditionMetPayload } from '@/types/events';

interface HUDProps {
  levelId: string;
  isBoss?: boolean;
}

export default function HUD({ levelId, isBoss = false }: HUDProps) {
  const router = useRouter();
  const { setPaused, setMicActive, completeLevel, unlockLevel, setScreen } =
    useGameStore();
  const [elapsed, setElapsed] = useState(0);
  const [hintVisible, setHintVisible] = useState(false);
  const [currentHint, setCurrentHint] = useState('');

  // 计时器
  useEffect(() => {
    const timer = setInterval(() => setElapsed((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // 监听胜利事件
  useEffect(() => {
    const onWin = (payload: WinConditionMetPayload) => {
      const stars = payload.stars || 3;
      completeLevel(levelId, stars);

      // 解锁下一关
      const levelNum = parseInt(levelId.split('-')[0]);
      const nextNum = String(levelNum + 1).padStart(3, '0');
      const suffix = levelId.substring(levelId.indexOf('-'));
      const nextSuffixes = {
        'discover-m': 'discover-s',
        'discover-s': 'sound-match',
        'sound-match': 'sound-lab',
        'sound-lab': 'boss-sounds',
        'boss-sounds': 'blend-ma',
        'blend-ma': 'blend-sa',
        'blend-sa': 'blend-kat',
        'blend-kat': 'invent-m',
        'invent-m': 'encoding-board',
      };
      const currentSuffix = levelId.substring(levelId.indexOf('-') + 1);
      const nextSuffix =
        nextSuffixes[currentSuffix as keyof typeof nextSuffixes];
      if (nextSuffix) {
        const nextId = `${nextNum}-${nextSuffix}`;
        unlockLevel(nextId);
      }

      setScreen('victory');
      setTimeout(() => {
        router.push(`/victory?level=${levelId}&stars=${stars}`);
      }, 800);
    };

    eventBus.on(GameEvents.WIN_CONDITION_MET, onWin);
    return () => {
      eventBus.off(GameEvents.WIN_CONDITION_MET, onWin);
    };
  }, [levelId, router, completeLevel, unlockLevel, setScreen]);

  // 提示按钮
  const handleHint = useCallback(() => {
    setHintVisible(!hintVisible);
    if (!hintVisible) {
      setCurrentHint('试着拖拽声音生物到共振器上吧！');
    }
  }, [hintVisible]);

  // 暂停
  const handlePause = useCallback(() => {
    setPaused(true);
    eventBus.emit(GameEvents.PAUSE_GAME, {});
  }, [setPaused]);

  // 麦克风
  const handleMicToggle = useCallback(() => {
    setMicActive(true);
    eventBus.emit(GameEvents.MIC_START, {});
  }, [setMicActive]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <>
      {/* 顶部 HUD 栏 */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-black/50 flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-4">
          <span className="text-[#c9a96e] text-sm font-bold">{levelId}</span>
          <span className="text-[#8b7355] text-xs">{formatTime(elapsed)}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* 提示按钮 */}
          <button
            onClick={handleHint}
            className="w-8 h-8 rounded-full bg-[#c9a96e]/20 text-[#c9a96e] text-sm
                       hover:bg-[#c9a96e]/40 transition-colors flex items-center justify-center"
            title="提示"
          >
            ?
          </button>

          {/* Boss 关麦克风按钮 */}
          {isBoss && (
            <button
              onClick={handleMicToggle}
              className="w-8 h-8 rounded-full bg-[#e64980]/20 text-[#e64980] text-sm
                         hover:bg-[#e64980]/40 transition-colors flex items-center justify-center"
              title="麦克风"
            >
              🎤
            </button>
          )}

          {/* 暂停按钮 */}
          <button
            onClick={handlePause}
            className="w-8 h-8 rounded-full bg-white/10 text-white text-sm
                       hover:bg-white/20 transition-colors flex items-center justify-center"
            title="暂停"
          >
            II
          </button>
        </div>
      </div>

      {/* 提示弹窗 */}
      {hintVisible && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-[#2a2520] border border-[#c9a96e]/40
                        rounded-lg p-4 max-w-xs z-30 shadow-xl">
          <p className="text-[#e8e0d0] text-sm">{currentHint}</p>
          <button
            onClick={() => setHintVisible(false)}
            className="mt-2 text-xs text-[#8b7355] hover:text-[#c9a96e]"
          >
            关闭
          </button>
        </div>
      )}
    </>
  );
}
