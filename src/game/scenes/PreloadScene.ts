// PreloadScene —— 预加载场景：监听命令，加载关卡资源后跳转到游玩场景

import * as Phaser from 'phaser';
import { eventBus } from '../event-bus';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '@/lib/constants';
import type { LevelConfig } from '@/types/level';
import { GameEvents } from '@/types/events';

export class PreloadScene extends Phaser.Scene {
  private levelConfig: LevelConfig | null = null;

  constructor() {
    super({ key: SCENES.PRELOAD });
  }

  create() {
    eventBus.emit(GameEvents.SCENE_READY, { sceneKey: SCENES.PRELOAD });

    // 监听 React 发来的关卡启动命令
    eventBus.on(
      GameEvents.START_LEVEL,
      (payload: { levelId: string; config: LevelConfig }) => {
        this.levelConfig = payload.config;
        // 短暂加载后跳转
        this.time.delayedCall(400, () => {
          const targetScene = this.levelConfig?.isBossLevel
            ? SCENES.BOSS_GAMEPLAY
            : SCENES.GAMEPLAY;
          this.scene.start(targetScene, {
            levelConfig: this.levelConfig,
          });
        });
      }
    );

    // 如果没有收到命令，显示等待文字
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '等待关卡数据...', {
        fontSize: '18px',
        color: '#8b7355',
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);
  }
}
