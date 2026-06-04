'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/game-state';
import { eventBus } from '@/game/event-bus';
import { GameEvents } from '@/types/events';
import type { WinConditionMetPayload } from '@/types/events';
import { saveProgress, saveSnapshot } from '@/lib/progress';
import LevelStartModal from './LevelStartModal';
import VictoryModal from './VictoryModal';

interface HUDProps {
  levelId: string;
  isBoss?: boolean;
  title?: string;
  introText?: string;
  victoryText?: string;
  mechanicHint?: string;
  onExit?: () => void;
}

const LEVEL_CHAIN: Record<string, string> = {
  'discover-m': 'discover-s', 'discover-s': 'sound-match',
  'sound-match': 'sound-lab', 'sound-lab': 'boss-sounds',
  'boss-sounds': 'blend-ma', 'blend-ma': 'blend-sa',
  'blend-sa': 'blend-kat', 'blend-kat': 'invent-m',
  'invent-m': 'encoding-board',
};

export default function HUD({
  levelId, isBoss = false, title = '', introText = '',
  victoryText = '', mechanicHint = '', onExit,
}: HUDProps) {
  const router = useRouter();
  const { completeLevel, unlockLevel, setScreen } = useGameStore();
  const [elapsed, setElapsed] = useState(0);
  const [showStartModal, setShowStartModal] = useState(true);
  const [showVictory, setShowVictory] = useState(false);
  const [stars, setStars] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handler = (payload: WinConditionMetPayload) => {
      setStars(payload.stars || 3);
      completeLevel(levelId, payload.stars || 3);
      const suffix = levelId.substring(levelId.indexOf('-') + 1);
      const nextSuffix = LEVEL_CHAIN[suffix];
      if (nextSuffix) {
        const num = parseInt(levelId.split('-')[0]);
        const nextNum = String(num + 1).padStart(3, '0');
        unlockLevel(`${nextNum}-${nextSuffix}`);
      }
      // 持久化到 Supabase
      saveProgress(levelId, payload.stars || 3, { timeSec: payload.timeSec });
      // 通关后删除快照
      import('@/lib/progress').then((m) => m.deleteSnapshot(levelId));
      setShowVictory(true);
    };

    eventBus.on(GameEvents.WIN_CONDITION_MET, handler);
    return () => { eventBus.off(GameEvents.WIN_CONDITION_MET, handler); };
  }, [levelId, completeLevel, unlockLevel]);

  // 退出：保存快照并导航
  const handleExit = useCallback(() => {
    eventBus.emit(GameEvents.PAUSE_GAME, {});
    // 通知父组件保存快照
    if (onExit) {
      onExit();
    } else {
      setScreen('level-select');
      router.push('/level-select?era=1');
    }
  }, [onExit, setScreen, router]);

  const handleStart = () => setShowStartModal(false);
  const handleNextLevel = () => {
    const suffix = levelId.substring(levelId.indexOf('-') + 1);
    const nextSuffix = LEVEL_CHAIN[suffix];
    if (nextSuffix) {
      const num = parseInt(levelId.split('-')[0]);
      const nextId = `${String(num + 1).padStart(3, '0')}-${nextSuffix}`;
      setScreen(nextSuffix === 'boss-sounds' ? 'boss' : 'gameplay');
      router.push(`/${nextSuffix === 'boss-sounds' ? 'boss' : 'gameplay'}?level=${nextId}`);
    } else handleBackToMap();
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
      {showStartModal && (
        <LevelStartModal
          title={title || levelId}
          introText={introText || '准备开始探索...'}
          mechanicHint={mechanicHint || '拖拽声音生物到共振器上'}
          onStart={handleStart}
        />
      )}
      {showVictory && (
        <VictoryModal
          title={title || levelId}
          victoryText={victoryText || '你在笔记本中记录了新的发现。'}
          stars={stars}
          onNextLevel={handleNextLevel}
          onBackToMap={handleBackToMap}
        />
      )}
      {!showStartModal && (
        <div className="absolute top-0 left-0 right-0 h-12 bg-black/50 flex items-center justify-between px-4 z-20">
          <div className="flex items-center gap-4">
            <span className="text-[#c9a96e] text-sm font-bold">{levelId}</span>
            <span className="text-[#8b7355] text-xs">{formatTime(elapsed)}</span>
          </div>
          <div className="flex items-center gap-3">
            {isBoss && (
              <span className="text-xs text-[#e64980] px-2 py-1 bg-[#e64980]/10 rounded-full">Boss</span>
            )}
            <button
              onClick={handleExit}
              className="w-8 h-8 rounded-full bg-red-500/15 text-red-400 text-sm
                         hover:bg-red-500/30 transition-colors flex items-center justify-center"
              title="退出关卡"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
