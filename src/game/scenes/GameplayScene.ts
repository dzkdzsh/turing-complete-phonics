// GameplayScene —— 核心游玩场景：读取配置、生成对象、接入系统

import * as Phaser from 'phaser';
import { eventBus } from '../event-bus';
import { SCENES } from '@/lib/constants';
import type { LevelConfig } from '@/types/level';
import { GameEvents } from '@/types/events';
import { createGameObject } from '../objects/GameObjectFactory';
import { DragDropSystem } from '../systems/DragDropSystem';
import { WinConditionSystem } from '../systems/WinConditionSystem';
import { SoundCreature } from '../objects/SoundCreature';
import { Resonator } from '../objects/Resonator';
import { TargetZone } from '../objects/TargetZone';

export class GameplayScene extends Phaser.Scene {
  protected levelConfig!: LevelConfig;
  protected dragDropSystem!: DragDropSystem;
  protected winConditionSystem!: WinConditionSystem;

  constructor() {
    super({ key: SCENES.GAMEPLAY });
  }

  init(data: { levelConfig: LevelConfig }) {
    this.levelConfig = data.levelConfig;
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#1a1814');

    // 关卡标题
    this.add
      .text(width / 2, 24, this.levelConfig.title, {
        fontSize: '22px',
        color: '#c9a96e',
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);

    // 初始化系统
    this.dragDropSystem = new DragDropSystem(this);
    this.winConditionSystem = new WinConditionSystem(
      this,
      this.levelConfig,
      this.dragDropSystem
    );

    // 根据配置生成所有游戏对象
    this.spawnObjects();

    // 操作提示
    this.add
      .text(width / 2, height - 40, this.getMechanicHint(), {
        fontSize: '14px',
        color: '#8b7355',
        fontFamily: 'sans-serif',
        align: 'center',
      })
      .setOrigin(0.5);

    // 通知 React 层
    eventBus.emit(GameEvents.SCENE_READY, { sceneKey: SCENES.GAMEPLAY });
    eventBus.emit(GameEvents.LEVEL_LOADED, {
      levelId: this.levelConfig.levelId,
    });
  }

  private spawnObjects() {
    for (const def of this.levelConfig.gameObjects) {
      if (def.initialState === 'hidden') continue;

      const obj = createGameObject(this, def);
      if (!obj) continue;

      // 注册到拖拽系统
      if (obj instanceof SoundCreature || obj instanceof Resonator || obj instanceof TargetZone) {
        this.dragDropSystem.register(obj);
      }
    }
  }

  private getMechanicHint(): string {
    switch (this.levelConfig.mechanicType) {
      case 'drag_to_resonate':
        return '将声音生物拖到共振器上';
      case 'sound_match':
        return '拖动右边的影子生物，匹配左边的声音';
      case 'sound_lab':
        return '点击口型来试听不同的声音';
      default:
        return '探索工作台上的装置';
    }
  }

  override update() {
    this.winConditionSystem?.update();
  }
}
