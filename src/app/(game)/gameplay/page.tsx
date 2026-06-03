'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import GameLayout from '@/components/layout/GameLayout';
import HUD from '@/components/game/HUD';
import { eventBus } from '@/game/event-bus';
import { GameEvents } from '@/types/events';
import { SCENES } from '@/lib/constants';
import type { LevelConfig } from '@/types/level';

const configCache: Record<string, LevelConfig> = {};

async function loadLevelConfig(levelId: string): Promise<LevelConfig | null> {
  if (configCache[levelId]) return configCache[levelId];
  try {
    const mod = await import(`@/data/levels/${levelId}.json`);
    configCache[levelId] = mod.default || mod;
    return configCache[levelId];
  } catch {
    console.error(`无法加载关卡配置: ${levelId}`);
    return null;
  }
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

export default function GameplayPage() {
  const searchParams = useSearchParams();
  const levelId = searchParams.get('level') || '001-discover-m';
  const [config, setConfig] = useState<LevelConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const sentRef = useRef(false);

  // 第一阶段：加载关卡配置
  useEffect(() => {
    setLoading(true);
    setConfig(null);
    sentRef.current = false;
    loadLevelConfig(levelId).then(setConfig).finally(() => setLoading(false));
  }, [levelId]);

  // 第二阶段：等 PreloadScene 就绪后发送关卡启动命令
  useEffect(() => {
    if (!config || sentRef.current) return;

    const onSceneReady = (payload: { sceneKey: string }) => {
      if (payload.sceneKey === SCENES.PRELOAD) {
        sentRef.current = true;
        eventBus.emit(GameEvents.START_LEVEL, { levelId, config });
      }
    };

    eventBus.on(GameEvents.SCENE_READY, onSceneReady);
    return () => {
      eventBus.off(GameEvents.SCENE_READY, onSceneReady);
    };
  }, [config, levelId]);

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#1a1814]">
        <p className="text-[#8b7355]">加载关卡中...</p>
      </div>
    );
  }

  const isBoss = config.isBossLevel || config.mechanicType === 'mic_validate';

  return (
    <GameLayout>
      <HUD
        levelId={levelId}
        isBoss={isBoss}
        title={config.title}
        introText={config.introText}
        victoryText={config.victoryText}
        mechanicHint={mechanicHints[config.mechanicType] || '探索工作台上的装置'}
      />
    </GameLayout>
  );
}
