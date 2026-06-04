'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import GameLayout from '@/components/layout/GameLayout';
import HUD from '@/components/game/HUD';
import { storeLevelConfig } from '@/game/level-config-store';
import { useGameStore } from '@/lib/game-state';
import type { LevelConfig } from '@/types/level';

const configCache: Record<string, LevelConfig> = {};

async function loadLevelConfig(levelId: string): Promise<LevelConfig | null> {
  if (configCache[levelId]) return configCache[levelId];
  try {
    const mod = await import(`@/data/levels/${levelId}.json`);
    configCache[levelId] = mod.default || mod;
    return configCache[levelId];
  } catch { return null; }
}

function BossPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const levelId = searchParams.get('level') || '005-boss-sounds';
  const { setScreen } = useGameStore();
  const [config, setConfig] = useState<LevelConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    (async () => {
      const cfg = await loadLevelConfig(levelId);
      if (cfg) { storeLevelConfig(levelId, cfg); }
      setConfig(cfg);
      setLoading(false);
    })();
  }, [levelId]);

  const handleExit = useCallback(() => {
    setScreen('level-select');
    router.push('/level-select?era=1');
  }, [setScreen, router]);

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center h-screen" style={{background:'#f5f3f0'}}>
        <p className="text-[#8b7355]">加载 Boss 关卡中...</p>
      </div>
    );
  }

  return (
    <GameLayout>
      <HUD levelId={levelId} isBoss title={config.title}
        introText={config.introText} victoryText={config.victoryText}
        mechanicHint="点击水晶 → 对着麦克风发出对应的声音" onExit={handleExit} />
    </GameLayout>
  );
}

export default function BossPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen" style={{background:'#f5f3f0'}}><p className="text-[#8b7355]">加载中...</p></div>}>
      <BossPageContent />
    </Suspense>
  );
}
