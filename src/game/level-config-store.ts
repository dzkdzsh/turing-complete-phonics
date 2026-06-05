// 关卡配置的共享存储（React → Phaser）
// 使用 window 避免 Next.js 模块分块导致的多实例问题

import type { LevelConfig } from '@/types/level';

interface PendingConfig {
  levelId: string;
  config: LevelConfig;
}

const KEY = '__PHONICS_LEVEL_CONFIG__';

const win = (): Record<string, unknown> | null => {
  if (typeof window === 'undefined') return null;
  return window as unknown as Record<string, unknown>;
};

export function storeLevelConfig(levelId: string, config: LevelConfig) {
  const w = win();
  if (!w) return;
  w[KEY] = { levelId, config };
}

export function consumeLevelConfig(): PendingConfig | null {
  const w = win();
  if (!w) return null;
  return (w[KEY] as PendingConfig) ?? null;
}

/** 页面切换时清理旧配置 */
export function clearLevelConfig() {
  const w = win();
  if (!w) return;
  delete w[KEY];
}
