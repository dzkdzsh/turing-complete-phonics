'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import GameLayout from '@/components/layout/GameLayout';
import HUD from '@/components/game/HUD';
import { storeLevelConfig, clearLevelConfig } from '@/game/level-config-store';
import { useGameStore } from '@/lib/game-state';

import config005 from '@/data/levels/005-boss-sounds.json';
import config015 from '@/data/levels/015-spell-boss.json';
import config019 from '@/data/levels/019-memory-boss.json';
import config026 from '@/data/levels/026-chinese-boss.json';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const configMap: Record<string, any> = {
  '005-boss-sounds': config005, '015-spell-boss': config015,
  '019-memory-boss': config019, '026-chinese-boss': config026,
};

function BossPageContent() {
  const sp = useSearchParams();
  const levelId = sp.get('level') || '005-boss-sounds';
  const { setScreen } = useGameStore();

  const config = useMemo(() => {
    clearLevelConfig();
    const cfg = configMap[levelId] ?? null;
    if (cfg) storeLevelConfig(levelId, cfg);
    return cfg;
  }, [levelId]);

  const handleExit = useCallback(() => {
    setScreen('level-select');
    clearLevelConfig();
    window.location.href = '/level-select?era=1';
  }, [setScreen]);

  const handleBackToMap = useCallback(() => {
    setScreen('era-map');
    clearLevelConfig();
    window.location.href = '/era-select';
  }, [setScreen]);

  if (!config) return (<div className="flex items-center justify-center h-screen" style={{ background: '#f5f3f0' }}><div className="text-center"><p className="text-[#ef4444] mb-4">关卡 "{levelId}" 不存在</p><button onClick={() => { setScreen('era-map'); window.location.href = '/era-select'; }} className="text-[#d4912a] underline">返回时代地图</button></div></div>);

  return (
    <GameLayout levelKey={levelId}>
      <HUD levelId={levelId} isBoss title={config.title}
        introText={config.introText} victoryText={config.victoryText}
        mechanicHint="点击水晶 → 对着麦克风发出对应的声音" onExit={handleExit} onBackToMap={handleBackToMap} />
    </GameLayout>
  );
}

export default function BossPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen" style={{ background: '#f5f3f0' }}><p className="text-[#8b7355]">加载中...</p></div>}>
      <BossPageContent />
    </Suspense>
  );
}
