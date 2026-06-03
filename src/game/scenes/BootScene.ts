// BootScene —— 启动场景：验证环境、初始化 AudioManager

import * as Phaser from 'phaser';
import { eventBus } from '../event-bus';
import { SCENES } from '@/lib/constants';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.BOOT });
  }

  create() {
    // 验证 WebGL / Canvas 环境
    const renderer = this.sys.game.renderer;
    if (renderer instanceof Phaser.Renderer.Canvas.CanvasRenderer) {
      console.warn('Phaser 运行在 Canvas 模式，性能可能受限');
    }

    // 显示加载文字
    const text = this.add
      .text(
        this.scale.width / 2,
        this.scale.height / 2,
        '正在初始化...\nInitializing...',
        {
          fontSize: '24px',
          color: '#c9a96e',
          fontFamily: 'sans-serif',
          align: 'center',
        }
      )
      .setOrigin(0.5);

    // 短暂延迟后跳转到预加载场景
    this.time.delayedCall(800, () => {
      this.scene.start(SCENES.PRELOAD);
    });
  }
}
