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
const LOAD_TIMEOUT_MS = 12000; // 12s timeout for level config loading

async function loadLevelConfig(levelId: string): Promise<LevelConfig | null> {
  if (configCache[levelId]) return configCache[levelId];
  try {
    const mod = await import(`@/data/levels/${levelId}.json`);
    configCache[levelId] = mod.default || mod;
    return configCache[levelId];
  } catch { return null; }
}

const mechanicHints: Record<string, string> = {
  drag_to_resonate: '拖拽声音生物到共振器上进行分析',
  sound_match: '点击左边生物听声音 → 拖拽右边影子生物到匹配区',
  sound_lab: '点击每个口型按钮，试听所有三种声音',
  mic_validate: '点击水晶 → 对着麦克风发出对应的声音',
  connect_and_blend: '点击输出端口 → 点击输入端口来连线',
  multi_blend: '把三个声音按正确顺序连到链式合成器',
  invent_letter: '拖拽音素水晶到空白石板上',
  encoding_board: '将音素水晶拖到对应的编码槽中',
};

function GameplayPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const levelId = searchParams.get('level') || '001-discover-m';
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
    setScreen('level-select'); router.push('/level-select?era=1');
  }, [setScreen, router]);

  const handleRetry = useCallback(() => {
    retryCount.current++;
    // 多次重试后改用 window.location 做完整刷新
    if (retryCount.current >= 2) {
      window.location.href = window.location.href;
      return;
    }
    load(levelId);
  }, [levelId, load]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen" style={{background:'#1a1814'}}>
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#d4912a] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/60">加载关卡中…</p>
      </div>
    </div>
  );

  if (error || !config) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4" style={{background:'#1a1814'}}>
      <p className="text-white/60">关卡加载失败</p>
      <button onClick={handleRetry} className="rounded-full px-6 py-2.5 text-sm bg-[#d4912a] text-[#0f0d0a] font-bold hover:scale-[1.03] transition-transform">重试</button>
      <button onClick={handleExit} className="text-xs text-white/40 hover:text-white/70">← 返回地图</button>
    </div>
  );

  const isBoss = config.isBossLevel || config.mechanicType === 'mic_validate';
  return (
    <GameLayout levelKey={levelId}>
      <HUD levelId={levelId} isBoss={isBoss} title={config.title} introText={config.introText}
        victoryText={config.victoryText} mechanicHint={mechanicHints[config.mechanicType] || '探索工作台上的装置'} onExit={handleExit} />
    </GameLayout>
  );
}

export default function GameplayPage() {
  return (<Suspense fallback={<div className="flex items-center justify-center h-screen" style={{background:'#1a1814'}}><div className="w-8 h-8 border-2 border-[#d4912a] border-t-transparent rounded-full animate-spin mx-auto" /></div>}><GameplayPageContent /></Suspense>);
}
