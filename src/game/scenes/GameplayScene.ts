// GameplayScene —— 核心游玩场景：支持 Era 1 + Era 2 + Era 3 全部机制

import * as Phaser from 'phaser';
import { eventBus } from '../event-bus';
import { SCENES } from '@/lib/constants';
import type { LevelConfig } from '@/types/level';
import { GameEvents } from '@/types/events';
import { createGameObject } from '../objects/GameObjectFactory';
import { DragDropSystem } from '../systems/DragDropSystem';
import { ConnectionSystem } from '../systems/ConnectionSystem';
import { WinConditionSystem } from '../systems/WinConditionSystem';
import { SoundCreature } from '../objects/SoundCreature';
import { Resonator } from '../objects/Resonator';
import { TargetZone } from '../objects/TargetZone';
import { MouthShapeButton } from '../objects/MouthShapeButton';
import { BlenderNode } from '../objects/BlenderNode';
import { AlphabetTile } from '../objects/AlphabetTile';
import { PhonemeLibrary } from '../audio/PhonemeLibrary';
import { AudioManager } from '../audio/AudioManager';

export class GameplayScene extends Phaser.Scene {
  protected levelConfig!: LevelConfig;
  protected dragDropSystem!: DragDropSystem;
  protected connectionSystem!: ConnectionSystem;
  protected winConditionSystem!: WinConditionSystem;
  protected phonemeLibrary!: PhonemeLibrary;
  protected mouthShapeButtons: MouthShapeButton[] = [];
  protected blenderNodes: BlenderNode[] = [];
  protected alphabetTiles: AlphabetTile[] = [];
  protected gameObjects: (SoundCreature | Resonator | TargetZone | MouthShapeButton | BlenderNode | AlphabetTile)[] = [];

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
    this.blenderNodes = [];
    this.alphabetTiles = [];
    this.gameObjects = [];

    this.phonemeLibrary = new PhonemeLibrary();
    this.phonemeLibrary.loadFromConfig(this.levelConfig.audioClips);
    AudioManager.getInstance().setVolume(0.5);

    this.dragDropSystem = new DragDropSystem(this);
    this.connectionSystem = new ConnectionSystem(this);
    this.winConditionSystem = new WinConditionSystem(
      this,
      this.levelConfig,
      this.dragDropSystem,
      this.mouthShapeButtons,
      () => this.connectionSystem.areAllBlendersConnected()
    );

    this.add
      .text(width / 2, 24, this.levelConfig.title, {
        fontSize: '22px',
        color: '#c9a96e',
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);

    this.spawnObjects();

    this.add
      .text(width / 2, height - 30, this.getMechanicHint(), {
        fontSize: '13px',
        color: '#8b7355',
        fontFamily: 'sans-serif',
        align: 'center',
      })
      .setOrigin(0.5);

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
      } else if (obj instanceof BlenderNode) {
        this.blenderNodes.push(obj);
        this.connectionSystem.registerBlender(obj);
      }

      if (obj instanceof SoundCreature || obj instanceof Resonator || obj instanceof TargetZone || obj instanceof AlphabetTile) {
        this.dragDropSystem.register(obj);
      }

      if (obj instanceof SoundCreature) {
        this.connectionSystem.registerSource(obj);
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
      case 'connect_and_blend':
      case 'multi_blend':
        return '点击声音节点的输出端口（小圆点）→ 再点击合成器的输入端口完成连线';
      case 'invent_letter':
        return '将音素水晶拖到空白石板上——揭开对应字母！';
      case 'encoding_board':
        return '将音素水晶拖到正确的编码槽位置';
      case 'mic_validate':
        return '点击一颗水晶 → 对着麦克风发出水晶上标注的音素';
      default:
        return '探索工作台上的装置吧！';
    }
  }

  override update() {
    this.winConditionSystem?.update();
  }
}
