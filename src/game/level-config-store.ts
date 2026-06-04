// 关卡配置 + 场景引用的共享存储

import type { LevelConfig } from '@/types/level';
import type { LevelSnapshotData } from '@/game/systems/SnapshotSystem';

let _pendingConfig: { levelId: string; config: LevelConfig } | null = null;
let _pendingSnapshot: LevelSnapshotData | null = null;
let _activeScene: { captureSnapshot(elapsedSec: number): LevelSnapshotData; restoreSnapshot(data: LevelSnapshotData): void } | null = null;

export function storeLevelConfig(levelId: string, config: LevelConfig) {
  _pendingConfig = { levelId, config };
}

export function consumeLevelConfig() {
  const c = _pendingConfig;
  _pendingConfig = null;
  return c;
}

export function storePendingSnapshot(data: LevelSnapshotData | null) {
  _pendingSnapshot = data;
}

export function consumePendingSnapshot() {
  const s = _pendingSnapshot;
  _pendingSnapshot = null;
  return s;
}

export function setActiveScene(scene: { captureSnapshot(elapsedSec: number): LevelSnapshotData; restoreSnapshot(data: LevelSnapshotData): void } | null) {
  _activeScene = scene;
}

export function getActiveScene() {
  return _activeScene;
}
