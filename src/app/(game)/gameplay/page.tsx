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

async function loadLevelConfig(levelId: string): Promise<LevelConfig | null> {
  if (configCache[levelId]) return configCache[levelId];
  try { const mod = await import(`@/data/levels/${levelId}.json`); configCache[levelId] = mod.default || mod; return configCache[levelId]; }
  catch { return null; }
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

  useEffect(() => {
    setLoading(true);
    (async () => {
      const cfg = await loadLevelConfig(levelId);
      if (cfg) storeLevelConfig(levelId, cfg);
      setConfig(cfg); setLoading(false);
    })();
  }, [levelId]);

  // 配置就绪后通知 Phaser PreloadScene 开始
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

  if (loading || !config) return (<div className="flex items-center justify-center h-screen" style={{background:'#f5f3f0'}}><p className="text-[#8b7355]">加载关卡中...</p></div>);

  const isBoss = config.isBossLevel || config.mechanicType === 'mic_validate';
  return (
    <GameLayout>
      <HUD levelId={levelId} isBoss={isBoss} title={config.title} introText={config.introText}
        victoryText={config.victoryText} mechanicHint={mechanicHints[config.mechanicType] || '探索工作台上的装置'} onExit={handleExit} />
    </GameLayout>
  );
}

export default function GameplayPage() {
  return (<Suspense fallback={<div className="flex items-center justify-center h-screen" style={{background:'#f5f3f0'}}><p className="text-[#8b7355]">加载中...</p></div>}><GameplayPageContent /></Suspense>);
}
