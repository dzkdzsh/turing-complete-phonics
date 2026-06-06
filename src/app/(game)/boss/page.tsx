'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/layout/GameLayout';
import HUD from '@/components/game/HUD';
import { storeLevelConfig } from '@/game/level-config-store';
import { useGameStore } from '@/lib/game-state';
import type { LevelConfig } from '@/types/level';

const configCache: Record<string, LevelConfig> = {};

function getLevelId(): string {
  if (typeof window === 'undefined') return '005-boss-sounds';
  return new URLSearchParams(window.location.search).get('level') || '005-boss-sounds';
}

async function loadLevelConfig(levelId: string): Promise<LevelConfig | null> {
  if (configCache[levelId]) return configCache[levelId];
  try {
    const res = await fetch(`/data/levels/${levelId}.json`);
    if (!res.ok) return null;
    const cfg = await res.json();
    configCache[levelId] = cfg;
    return cfg;
  } catch { return null; }
}

export default function BossPage() {
  const router = useRouter();
  const { setScreen } = useGameStore();
  const [levelId] = useState(getLevelId);
  const [config, setConfig] = useState<LevelConfig | null>(null);
  const [error, setError] = useState(false);
  const retryCount = useRef(0);

  const load = useCallback(async (id: string) => {
    setError(false);
    try {
      const cfg = await loadLevelConfig(id);
      if (cfg) {
        storeLevelConfig(id, cfg);
        setConfig(cfg);
      } else {
        setError(true);
      }
    } catch { setError(true); }
  }, []);

  useEffect(() => { load(levelId); }, [levelId, load]);

  useEffect(() => {
    if (config) {
      import('@/game/event-bus').then(m => {
        m.eventBus.emit('cmd:start-level', { levelId, config });
      });
    }
  }, [config, levelId]);

  const handleExit = useCallback(() => {
    setScreen('level-select'); router.push('/level-select?era=1');
  }, [setScreen, router]);

  const handleRetry = useCallback(() => {
    retryCount.current++;
    if (retryCount.current >= 2) {
      window.location.href = window.location.href;
      return;
    }
    load(levelId);
  }, [levelId, load]);

  return (
    <GameLayout levelKey={levelId}>
      {config ? (
        <HUD levelId={levelId} isBoss title={config.title}
          introText={config.introText} victoryText={config.victoryText}
          mechanicHint="点击水晶 → 对着麦克风发出对应的声音" onExit={handleExit} />
      ) : error ? (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2 rounded-xl bg-[#ef4444]/20 border border-[#ef4444]/30">
          <span className="text-sm text-white/80">Boss 关卡加载失败</span>
          <button onClick={handleRetry} className="text-xs text-white font-bold bg-white/20 rounded-full px-3 py-1 hover:bg-white/30">重试</button>
          <button onClick={handleExit} className="text-xs text-white/50 hover:text-white">← 返回</button>
        </div>
      ) : null}
    </GameLayout>
  );
}
