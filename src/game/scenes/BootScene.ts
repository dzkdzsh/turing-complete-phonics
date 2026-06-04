// BootScene —— 启动场景：验证环境、预加载音频

import * as Phaser from 'phaser';
import { SCENES } from '@/lib/constants';
import { AudioManager } from '../audio/AudioManager';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.BOOT });
  }

  create() {
    // 预加载音素音频
    AudioManager.getInstance()
      .preloadAll()
      .then(() => {
        // 短暂延迟后跳转到预加载场景
        this.time.delayedCall(300, () => {
          this.scene.start(SCENES.PRELOAD);
        });
      })
      .catch(() => {
        // 音频加载失败也不阻塞游戏
        this.scene.start(SCENES.PRELOAD);
      });
  }
}
