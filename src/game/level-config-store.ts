// 关卡配置的共享存储

import type { LevelConfig } from '@/types/level';

let _pendingConfig: { levelId: string; config: LevelConfig } | null = null;

export function storeLevelConfig(levelId: string, config: LevelConfig) {
  _pendingConfig = { levelId, config };
}

export function consumeLevelConfig() {
  const c = _pendingConfig;
  _pendingConfig = null;
  return c;
}
