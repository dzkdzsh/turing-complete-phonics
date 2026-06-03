'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/game-state';
import { eventBus } from '@/game/event-bus';
import { GameEvents } from '@/types/events';
import type { WinConditionMetPayload } from '@/types/events';
import LevelStartModal from './LevelStartModal';
import VictoryModal from './VictoryModal';

interface HUDProps {
  levelId: string;
  isBoss?: boolean;
  title?: string;
  introText?: string;
  victoryText?: string;
  mechanicHint?: string;
}

// 关卡后缀链
const LEVEL_CHAIN: Record<string, string> = {
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

export default function HUD({
  levelId,
  isBoss = false,
  title = '',
  introText = '',
  victoryText = '',
  mechanicHint = '',
}: HUDProps) {
  const router = useRouter();
  const {
    completeLevel,
    unlockLevel,
    setScreen,
  } = useGameStore();

  const [elapsed, setElapsed] = useState(0);
  const [showStartModal, setShowStartModal] = useState(true);
  const [showVictory, setShowVictory] = useState(false);
  const [stars, setStars] = useState(0);
  const [hintVisible, setHintVisible] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // 胜利侦听
  useEffect(() => {
    const handler = (payload: WinConditionMetPayload) => {
      const s = payload.stars || 3;
      setStars(s);
      completeLevel(levelId, s);

      // 解锁下一关
      const suffix = levelId.substring(levelId.indexOf('-') + 1);
      const nextSuffix = LEVEL_CHAIN[suffix];
      if (nextSuffix) {
        const num = parseInt(levelId.split('-')[0]);
        const nextNum = String(num + 1).padStart(3, '0');
        unlockLevel(`${nextNum}-${nextSuffix}`);
      }

      setShowVictory(true);
    };

    eventBus.on(GameEvents.WIN_CONDITION_MET, handler);
    return () => {
      eventBus.off(GameEvents.WIN_CONDITION_MET, handler);
    };
  }, [levelId, completeLevel, unlockLevel]);

  const handleStart = () => setShowStartModal(false);

  const handleNextLevel = () => {
    const suffix = levelId.substring(levelId.indexOf('-') + 1);
    const nextSuffix = LEVEL_CHAIN[suffix];
    if (nextSuffix) {
      const num = parseInt(levelId.split('-')[0]);
      const nextNum = String(num + 1).padStart(3, '0');
      const nextId = `${nextNum}-${nextSuffix}`;
      const isNextBoss = nextSuffix === 'boss-sounds';
      setScreen(isNextBoss ? 'boss' : 'gameplay');
      router.push(`/${isNextBoss ? 'boss' : 'gameplay'}?level=${nextId}`);
    } else {
      handleBackToMap();
    }
  };

  const handleBackToMap = () => {
    setScreen('era-map');
    router.push('/era-select');
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <>
      {/* 关卡开始弹窗 */}
      {showStartModal && (
        <LevelStartModal
          title={title || levelId}
          introText={introText || '准备开始探索...'}
          mechanicHint={mechanicHint || '拖拽声音生物到共振器上'}
          onStart={handleStart}
        />
      )}

      {/* 通关弹窗 */}
      {showVictory && (
        <VictoryModal
          title={title || levelId}
          victoryText={victoryText || '你在笔记本中记录了新的发现。'}
          stars={stars}
          onNextLevel={handleNextLevel}
          onBackToMap={handleBackToMap}
        />
      )}

      {/* 顶部 HUD */}
      {!showStartModal && (
        <div className="absolute top-0 left-0 right-0 h-12 bg-black/50 flex items-center justify-between px-4 z-20">
          <div className="flex items-center gap-4">
            <span className="text-[#c9a96e] text-sm font-bold">{levelId}</span>
            <span className="text-[#8b7355] text-xs">{formatTime(elapsed)}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setHintVisible(!hintVisible)}
              className="w-8 h-8 rounded-full bg-[#c9a96e]/20 text-[#c9a96e] text-sm
                         hover:bg-[#c9a96e]/40 transition-colors flex items-center justify-center"
              title="提示"
            >
              ?
            </button>

            {isBoss && (
              <span className="text-xs text-[#e64980] px-2 py-1 bg-[#e64980]/10 rounded-full">
                Boss
              </span>
            )}
          </div>
        </div>
      )}

      {/* 提示弹窗 */}
      {hintVisible && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-[#2a2520] border border-[#c9a96e]/40
                        rounded-lg p-4 max-w-xs z-30 shadow-xl">
          <p className="text-[#e8e0d0] text-sm">试着拖动声音生物到共振器上吧！不同的口型会发出不同的声音哦！</p>
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
