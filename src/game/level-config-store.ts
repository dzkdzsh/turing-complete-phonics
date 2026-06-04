// 关卡配置的共享存储
// 使用 window 避免 Next.js 模块分块导致的多实例问题

import type { LevelConfig } from '@/types/level';

interface PendingConfig {
  levelId: string;
  config: LevelConfig;
}

const KEY = '__PHONICS_LEVEL_CONFIG__';

export function storeLevelConfig(levelId: string, config: LevelConfig) {
  (window as unknown as Record<string, unknown>)[KEY] = { levelId, config };
}

export function consumeLevelConfig(): PendingConfig | null {
  return ((window as unknown as Record<string, unknown>)[KEY] as PendingConfig) ?? null;
}
