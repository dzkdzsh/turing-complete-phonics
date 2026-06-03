// 关卡配置的共享存储 —— 解决 React ↔ Phaser 时序竞争
// React 在 Phaser 启动前写入，PreloadScene 在 create() 时读取

import type { LevelConfig } from '@/types/level';

let _pendingConfig: { levelId: string; config: LevelConfig } | null = null;

export function storeLevelConfig(levelId: string, config: LevelConfig) {
  _pendingConfig = { levelId, config };
}

export function consumeLevelConfig(): { levelId: string; config: LevelConfig } | null {
  const c = _pendingConfig;
  _pendingConfig = null;
  return c;
}
