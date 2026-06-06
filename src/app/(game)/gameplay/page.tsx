'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import GameLayout from '@/components/layout/GameLayout';
import HUD from '@/components/game/HUD';
import { storeLevelConfig, clearLevelConfig } from '@/game/level-config-store';
import { useGameStore } from '@/lib/game-state';

import config001 from '@/data/levels/001-discover-m.json';
import config002 from '@/data/levels/002-discover-s.json';
import config003 from '@/data/levels/003-sound-match.json';
import config004 from '@/data/levels/004-sound-lab.json';
import config005 from '@/data/levels/005-boss-sounds.json';
import config006 from '@/data/levels/006-blend-ma.json';
import config007 from '@/data/levels/007-blend-sa.json';
import config008 from '@/data/levels/008-blend-kat.json';
import config009 from '@/data/levels/009-invent-m.json';
import config010 from '@/data/levels/010-encoding-board.json';
import config011 from '@/data/levels/011-spell-cvc.json';
import config012 from '@/data/levels/012-spell-cvcc.json';
import config013 from '@/data/levels/013-spell-digraph.json';
import config014 from '@/data/levels/014-spell-long.json';
import config015 from '@/data/levels/015-spell-boss.json';
import config016 from '@/data/levels/016-memory-cvc.json';
import config017 from '@/data/levels/017-memory-blend.json';
import config018 from '@/data/levels/018-memory-sight.json';
import config019 from '@/data/levels/019-memory-boss.json';
import config020 from '@/data/levels/020-sentence-simple.json';
import config023 from '@/data/levels/023-chinese-pinyin.json';
import config024 from '@/data/levels/024-chinese-radical.json';
import config025 from '@/data/levels/025-chinese-poem.json';
import config026 from '@/data/levels/026-chinese-boss.json';
import config027 from '@/data/levels/027-history-dynasty.json';
import config028 from '@/data/levels/028-history-figures.json';
import config029 from '@/data/levels/029-history-events.json';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const configMap: Record<string, any> = {
  '001-discover-m': config001, '002-discover-s': config002,
  '003-sound-match': config003, '004-sound-lab': config004,
  '005-boss-sounds': config005, '006-blend-ma': config006,
  '007-blend-sa': config007, '008-blend-kat': config008,
  '009-invent-m': config009, '010-encoding-board': config010,
  '011-spell-cvc': config011, '012-spell-cvcc': config012,
  '013-spell-digraph': config013, '014-spell-long': config014,
  '015-spell-boss': config015, '016-memory-cvc': config016,
  '017-memory-blend': config017, '018-memory-sight': config018,
  '019-memory-boss': config019, '020-sentence-simple': config020,
  '023-chinese-pinyin': config023, '024-chinese-radical': config024,
  '025-chinese-poem': config025, '026-chinese-boss': config026,
  '027-history-dynasty': config027, '028-history-figures': config028,
  '029-history-events': config029,
};

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
  const sp = useSearchParams();
  const levelId = sp.get('level') || '001-discover-m';
  const { setScreen } = useGameStore();

  // Synchronously resolve config — no useEffect needed
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

  const isBoss = config.isBossLevel || config.mechanicType === 'mic_validate';
  return (
    <GameLayout levelKey={levelId}>
      <HUD levelId={levelId} isBoss={isBoss} title={config.title} introText={config.introText}
        victoryText={config.victoryText} mechanicHint={mechanicHints[config.mechanicType] || '探索工作台上的装置'} onExit={handleExit} onBackToMap={handleBackToMap} />
    </GameLayout>
  );
}

export default function GameplayPage() {
  return (<Suspense fallback={<div className="flex items-center justify-center h-screen" style={{ background: '#f5f3f0' }}><p className="text-[#8b7355]">加载中...</p></div>}><GameplayPageContent /></Suspense>);
}
