'use client';

import { useSearchParams } from 'next/navigation';
import GameLayout from '@/components/layout/GameLayout';
import HUD from '@/components/game/HUD';
import { useEffect, useCallback } from 'react';
import { useGameStore } from '@/lib/game-state';
import { eventBus } from '@/game/event-bus';
import { GameEvents } from '@/types/events';

// 动态加载关卡配置
const levelConfigs: Record<string, unknown> = {};

async function loadLevelConfig(levelId: string) {
  if (levelConfigs[levelId]) return levelConfigs[levelId];
  const mod = await import(`@/data/levels/${levelId}.json`);
  levelConfigs[levelId] = mod.default || mod;
  return levelConfigs[levelId];
}

export default function GameplayPage() {
  const searchParams = useSearchParams();
  const levelId = searchParams.get('level') || '001-discover-m';

  useEffect(() => {
    const startLevel = async () => {
      try {
        const config = await loadLevelConfig(levelId);
        eventBus.emit(GameEvents.START_LEVEL, { levelId, config });
      } catch (err) {
        console.error('关卡配置加载失败:', err);
      }
    };
    startLevel();
  }, [levelId]);

  return (
    <GameLayout>
      <HUD levelId={levelId} />
    </GameLayout>
  );
}
