'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import GameLayout from '@/components/layout/GameLayout';
import HUD from '@/components/game/HUD';
import { storeLevelConfig } from '@/game/level-config-store';
import type { LevelConfig } from '@/types/level';

const configCache: Record<string, LevelConfig> = {};

async function loadLevelConfig(levelId: string): Promise<LevelConfig | null> {
  if (configCache[levelId]) return configCache[levelId];
  try {
    const mod = await import(`@/data/levels/${levelId}.json`);
    configCache[levelId] = mod.default || mod;
    return configCache[levelId];
  } catch {
    return null;
  }
}

export default function BossPage() {
  const searchParams = useSearchParams();
  const levelId = searchParams.get('level') || '005-boss-sounds';
  const [config, setConfig] = useState<LevelConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    loadLevelConfig(levelId).then((cfg) => {
      if (cfg) {
        storeLevelConfig(levelId, cfg);
      }
      setConfig(cfg);
      setLoading(false);
    });
  }, [levelId]);

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#1a1814]">
        <p className="text-[#8b7355]">加载 Boss 关卡中...</p>
      </div>
    );
  }

  return (
    <GameLayout>
      <HUD
        levelId={levelId}
        isBoss
        title={config.title}
        introText={config.introText}
        victoryText={config.victoryText}
        mechanicHint="点击水晶 → 对着麦克风发出对应的声音"
      />
    </GameLayout>
  );
}
