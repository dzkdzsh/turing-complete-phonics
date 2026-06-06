'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/layout/GameLayout';
import HUD from '@/components/game/HUD';
import { storeLevelConfig } from '@/game/level-config-store';
import { useGameStore } from '@/lib/game-state';
import type { LevelConfig } from '@/types/level';

const configCache: Record<string, LevelConfig> = {};
const LOAD_TIMEOUT_MS = 8000;

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

function BossPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const levelId = searchParams.get('level') || '005-boss-sounds';
  const { setScreen } = useGameStore();
  const [config, setConfig] = useState<LevelConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const retryCount = useRef(0);

  const load = useCallback(async (id: string) => {
    setLoading(true); setError(false);
    const timeout = new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), LOAD_TIMEOUT_MS));
    try {
      const cfg = await Promise.race([loadLevelConfig(id), timeout]);
      if (cfg) { storeLevelConfig(id, cfg); setConfig(cfg); }
      else { setError(true); }
    } catch { setError(true); }
    setLoading(false);
  }, []);

  useEffect(() => { retryCount.current = 0; load(levelId); }, [levelId, load]);

  // 配置就绪后通知 Phaser PreloadScene
  useEffect(() => {
    if (config) {
      import('@/game/event-bus').then(m => {
        m.eventBus.emit('cmd:start-level', { levelId, config });
      });
    }
  }, [config, levelId]);

  const handleExit = useCallback(() => {
    setScreen('level-select');
    router.push('/level-select?era=1');
  }, [setScreen, router]);

  const handleRetry = useCallback(() => {
    retryCount.current++;
    if (retryCount.current >= 2) {
      window.location.href = window.location.href;
      return;
    }
    load(levelId);
  }, [levelId, load]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen" style={{background:'#1a1814'}}>
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#f59e0b] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/60">加载 Boss 关卡中…</p>
      </div>
    </div>
  );

  if (error || !config) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4" style={{background:'#1a1814'}}>
      <p className="text-white/60">Boss 关卡加载失败</p>
      <button onClick={handleRetry} className="rounded-full px-6 py-2.5 text-sm bg-[#f59e0b] text-[#0f0d0a] font-bold hover:scale-[1.03] transition-transform">重试</button>
      <button onClick={handleExit} className="text-xs text-white/40 hover:text-white/70">← 返回地图</button>
    </div>
  );

  return (
    <GameLayout levelKey={levelId}>
      <HUD levelId={levelId} isBoss title={config.title}
        introText={config.introText} victoryText={config.victoryText}
        mechanicHint="点击水晶 → 对着麦克风发出对应的声音" onExit={handleExit} />
    </GameLayout>
  );
}

export default function BossPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen" style={{background:'#1a1814'}}><div className="w-8 h-8 border-2 border-[#f59e0b] border-t-transparent rounded-full animate-spin mx-auto" /></div>}>
      <BossPageContent />
    </Suspense>
  );
}
