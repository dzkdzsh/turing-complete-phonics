// PreloadScene —— 轮询 window 上的关卡配置，跳转到游玩场景

import * as Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '@/lib/constants';
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
  private waitText!: Phaser.GameObjects.Text;
  private retries = 0;

  constructor() {
    super({ key: SCENES.PRELOAD });
  }

  create() {
    this.waitText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '加载关卡配置...', {
        fontSize: '18px', color: '#8b7355', fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);

    this.tryLoad();
  }

  private tryLoad() {
    const cfg = readConfig();
    if (cfg) {
      this.waitText.setText('加载完成！');
      const targetScene = cfg.config.isBossLevel
        ? SCENES.BOSS_GAMEPLAY
        : SCENES.GAMEPLAY;
      this.time.delayedCall(300, () => {
        this.scene.start(targetScene, { levelConfig: cfg.config });
      });
    } else {
      this.retries++;
      this.waitText.setText('等待关卡数据... (' + this.retries + ')');
      this.time.delayedCall(200, () => this.tryLoad());
    }
  }
}
