// PreloadScene —— 轮询 window 上的关卡配置，跳转到游玩场景

import * as Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '@/lib/constants';
import type { LevelConfig } from '@/types/level';

interface PendingConfig {
  levelId: string;
  config: LevelConfig;
}

const WIN_KEY = '__PHONICS_LEVEL_CONFIG__';
const MAX_RETRIES = 50; // 50 * 200ms = 10 秒超时

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
    this.retries = 0;
    this.waitText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '加载关卡配置...', {
        fontSize: '18px', color: '#8b7355', fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);

    this.tryLoad();
  }

  private tryLoad() {
    if (!this.scene.isActive()) return;

    const cfg = readConfig();
    if (cfg) {
      this.waitText.setText('加载完成！');
      const targetScene = cfg.config.isBossLevel || cfg.config.mechanicType === 'mic_validate'
        ? SCENES.BOSS_GAMEPLAY
        : SCENES.GAMEPLAY;
      this.time.delayedCall(300, () => {
        this.scene.start(targetScene, { levelConfig: cfg.config });
      });
    } else {
      this.retries++;
      if (this.retries > MAX_RETRIES) {
        this.waitText.setText('关卡加载超时，请返回重试');
        return;
      }
      this.waitText.setText('等待关卡数据... (' + this.retries + ')');
      this.time.delayedCall(200, () => this.tryLoad());
    }
  }
}
