// PreloadScene —— 从共享存储读取关卡配置+快照，跳转到游玩场景

import * as Phaser from 'phaser';
import { eventBus } from '../event-bus';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '@/lib/constants';
import { GameEvents } from '@/types/events';
import { consumeLevelConfig, consumePendingSnapshot } from '../level-config-store';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.PRELOAD });
  }

  create() {
    eventBus.emit(GameEvents.SCENE_READY, { sceneKey: SCENES.PRELOAD });

    const payload = consumeLevelConfig();
    const snapshot = consumePendingSnapshot();

    if (payload) {
      const targetScene = payload.config.isBossLevel
        ? SCENES.BOSS_GAMEPLAY
        : SCENES.GAMEPLAY;

      this.time.delayedCall(400, () => {
        this.scene.start(targetScene, { levelConfig: payload.config, snapshot });
      });
    } else {
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '等待关卡数据...', {
          fontSize: '18px', color: '#8b7355', fontFamily: 'sans-serif',
        })
        .setOrigin(0.5);

      let snap: unknown = null;
      eventBus.on(
        GameEvents.START_LEVEL,
        (p: { levelId: string; config: unknown }) => {
          const targetScene = (p.config as { isBossLevel?: boolean }).isBossLevel
            ? SCENES.BOSS_GAMEPLAY
            : SCENES.GAMEPLAY;
          this.scene.start(targetScene, { levelConfig: p.config, snapshot: snap });
        }
      );
    }
  }
}
