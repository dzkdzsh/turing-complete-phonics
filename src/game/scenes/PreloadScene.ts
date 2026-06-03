// PreloadScene —— 预加载场景：从共享存储读取关卡配置，加载后跳转到游玩场景

import * as Phaser from 'phaser';
import { eventBus } from '../event-bus';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '@/lib/constants';
import { GameEvents } from '@/types/events';
import { consumeLevelConfig } from '../level-config-store';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.PRELOAD });
  }

  create() {
    eventBus.emit(GameEvents.SCENE_READY, { sceneKey: SCENES.PRELOAD });

    // 从共享存储读取关卡配置（React 在 Phaser 启动前已写入）
    const payload = consumeLevelConfig();

    if (payload) {
      const targetScene = payload.config.isBossLevel
        ? SCENES.BOSS_GAMEPLAY
        : SCENES.GAMEPLAY;

      this.time.delayedCall(400, () => {
        this.scene.start(targetScene, { levelConfig: payload.config });
      });
    } else {
      // Fallback：监听 React 发来的事件（仅在直接访问 URL 等边缘情况）
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '等待关卡数据...', {
          fontSize: '18px',
          color: '#8b7355',
          fontFamily: 'sans-serif',
        })
        .setOrigin(0.5);

      eventBus.on(
        GameEvents.START_LEVEL,
        (p: { levelId: string; config: unknown }) => {
          const targetScene = (p.config as { isBossLevel?: boolean }).isBossLevel
            ? SCENES.BOSS_GAMEPLAY
            : SCENES.GAMEPLAY;
          this.scene.start(targetScene, { levelConfig: p.config });
        }
      );
    }
  }
}
