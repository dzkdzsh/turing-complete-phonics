// GameplayScene —— 核心游玩场景

import * as Phaser from 'phaser';
import { eventBus } from '../event-bus';
import { SCENES } from '@/lib/constants';
import type { LevelConfig } from '@/types/level';

export class GameplayScene extends Phaser.Scene {
  protected levelConfig!: LevelConfig;

  constructor() {
    super({ key: SCENES.GAMEPLAY });
  }

  init(data: { levelConfig: LevelConfig }) {
    this.levelConfig = data.levelConfig;
  }

  create() {
    const { width, height } = this.scale;

    // 背景色
    this.cameras.main.setBackgroundColor('#1a1814');

    // 关卡标题
    this.add
      .text(width / 2, 30, this.levelConfig.title, {
        fontSize: '24px',
        color: '#c9a96e',
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);

    // 提示文字
    this.add
      .text(width / 2, height / 2 - 40, this.levelConfig.introText, {
        fontSize: '16px',
        color: '#8b7355',
        fontFamily: 'sans-serif',
        wordWrap: { width: 600 },
        align: 'center',
      })
      .setOrigin(0.5);

    // 占位：显示关卡信息
    this.add
      .text(
        width / 2,
        height / 2 + 40,
        `[机制: ${this.levelConfig.mechanicType}] [时代: Era ${this.levelConfig.era}]`,
        {
          fontSize: '14px',
          color: '#666666',
          fontFamily: 'sans-serif',
        }
      )
      .setOrigin(0.5);

    eventBus.emit('scene:ready', { sceneKey: SCENES.GAMEPLAY });
    eventBus.emit('level:loaded', { levelId: this.levelConfig.levelId });
  }
}
