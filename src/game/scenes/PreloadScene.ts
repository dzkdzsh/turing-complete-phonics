// PreloadScene —— 轮询 window 上的关卡配置，静默跳转到游玩场景

import * as Phaser from 'phaser';
import { SCENES } from '@/lib/constants';
import type { LevelConfig } from '@/types/level';

interface PendingConfig {
  levelId: string;
  config: LevelConfig;
}

const WIN_KEY = '__PHONICS_LEVEL_CONFIG__';

function readConfig(): PendingConfig | null {
  try {
    return ((window as unknown as Record<string, unknown>)[WIN_KEY] as PendingConfig) ?? null;
  } catch {
    return null;
  }
}

export class PreloadScene extends Phaser.Scene {
  private retries = 0;

  constructor() {
    super({ key: SCENES.PRELOAD });
  }

  create() {
    // 直接跳转到游玩场景，配置由 GameplayScene 自行等待
    this.tryLoad();
  }

  private tryLoad() {
    const cfg = readConfig();
    if (cfg) {
      const targetScene = cfg.config.isBossLevel
        ? SCENES.BOSS_GAMEPLAY
        : SCENES.GAMEPLAY;
      this.scene.start(targetScene, { levelConfig: cfg.config });
    } else {
      this.retries++;
      if (this.retries > 50) {
        // 5秒后仍无配置，显示提示
        this.add.text(512, 300, '正在进入关卡…', { fontSize: '14px', color: '#666666', fontFamily: 'sans-serif' }).setOrigin(0.5);
      }
      this.time.delayedCall(100, () => this.tryLoad());
    }
  }
}
