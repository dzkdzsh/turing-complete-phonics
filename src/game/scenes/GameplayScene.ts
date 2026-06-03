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
import { MouthShapeButton } from '../objects/MouthShapeButton';
import { PhonemeLibrary } from '../audio/PhonemeLibrary';
import { AudioManager } from '../audio/AudioManager';

export class GameplayScene extends Phaser.Scene {
  protected levelConfig!: LevelConfig;
  protected dragDropSystem!: DragDropSystem;
  protected winConditionSystem!: WinConditionSystem;
  protected phonemeLibrary!: PhonemeLibrary;
  protected mouthShapeButtons: MouthShapeButton[] = [];
  protected gameObjects: (SoundCreature | Resonator | TargetZone | MouthShapeButton)[] = [];

  constructor(sceneKey: string = SCENES.GAMEPLAY) {
    super({ key: sceneKey });
  }

  init(data: { levelConfig: LevelConfig }) {
    this.levelConfig = data.levelConfig;
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#1a1814');

    this.mouthShapeButtons = [];

    // 初始化音频
    this.phonemeLibrary = new PhonemeLibrary();
    this.phonemeLibrary.loadFromConfig(this.levelConfig.audioClips);
    AudioManager.getInstance().setVolume(0.5);

    // 初始化系统
    this.dragDropSystem = new DragDropSystem(this);
    this.winConditionSystem = new WinConditionSystem(
      this,
      this.levelConfig,
      this.dragDropSystem,
      this.mouthShapeButtons
    );

    // 标题
    this.add
      .text(width / 2, 24, this.levelConfig.title, {
        fontSize: '22px',
        color: '#c9a96e',
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);

    // 生成对象
    this.spawnObjects();

    // 底部提示
    this.add
      .text(width / 2, height - 30, this.getMechanicHint(), {
        fontSize: '13px',
        color: '#8b7355',
        fontFamily: 'sans-serif',
        align: 'center',
      })
      .setOrigin(0.5);

    // 通知 React
    eventBus.emit(GameEvents.SCENE_READY, { sceneKey: SCENES.GAMEPLAY });
    eventBus.emit(GameEvents.LEVEL_LOADED, { levelId: this.levelConfig.levelId });
  }

  protected spawnObjects() {
    for (const def of this.levelConfig.gameObjects) {
      if (def.initialState === 'hidden') continue;

      const obj = createGameObject(this, def);
      if (!obj) continue;

      this.gameObjects.push(obj);

      if (obj instanceof MouthShapeButton) {
        this.mouthShapeButtons.push(obj);
      }

      if (obj instanceof SoundCreature || obj instanceof Resonator || obj instanceof TargetZone) {
        this.dragDropSystem.register(obj);
      }
    }
  }

  private getMechanicHint(): string {
    switch (this.levelConfig.mechanicType) {
      case 'drag_to_resonate':
        return '拖拽声音生物到共振器上进行分析';
      case 'sound_match':
        return '点击左边生物听声音 → 拖拽右边影子生物到匹配区';
      case 'sound_lab':
        return '点击每个口型按钮，试听不同的声音——全部试一遍！';
      default:
        return '探索工作台上的装置吧！';
    }
  }

  override update() {
    this.winConditionSystem?.update();
  }
}
