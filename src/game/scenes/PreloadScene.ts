// PreloadScene —— 预加载场景：加载通用素材，显示进度条

import * as Phaser from 'phaser';
import { eventBus } from '../event-bus';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '@/lib/constants';

export class PreloadScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: SCENES.PRELOAD });
  }

  preload() {
    // 绘制进度条背景
    const barWidth = 400;
    const barHeight = 20;
    const barX = (GAME_WIDTH - barWidth) / 2;
    const barY = GAME_HEIGHT / 2 + 50;

    this.progressBar = this.add.graphics();
    this.progressText = this.add
      .text(GAME_WIDTH / 2, barY - 30, '加载中... 0%', {
        fontSize: '18px',
        color: '#c9a96e',
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);

    // 加载事件
    this.load.on('progress', (value: number) => {
      this.progressBar.clear();
      // 背景
      this.progressBar.fillStyle(0x333333, 0.8);
      this.progressBar.fillRect(barX, barY, barWidth, barHeight);
      // 进度
      this.progressBar.fillStyle(0xc9a96e, 1);
      this.progressBar.fillRect(barX + 4, barY + 4, (barWidth - 8) * value, barHeight - 8);

      this.progressText.setText(`加载中... ${Math.round(value * 100)}%`);
    });

    this.load.on('complete', () => {
      this.progressBar.destroy();
      this.progressText.destroy();
    });
  }

  create() {
    eventBus.emit('scene:ready', { sceneKey: SCENES.PRELOAD });
  }

  /** 外部调用：加载关卡资源后跳转到游玩场景 */
  loadLevelAssets(levelConfig: unknown) {
    // 后续阶段实现真正的资源加载
    this.time.delayedCall(300, () => {
      this.scene.start(SCENES.GAMEPLAY, { levelConfig });
    });
  }
}
