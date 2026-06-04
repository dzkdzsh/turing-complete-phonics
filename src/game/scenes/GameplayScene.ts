// GameplayScene —— 核心游玩场景：支持 Era 1-3 + 快照

import * as Phaser from 'phaser';
import { eventBus } from '../event-bus';
import { SCENES } from '@/lib/constants';
import type { LevelConfig } from '@/types/level';
import { GameEvents } from '@/types/events';
import { createGameObject } from '../objects/GameObjectFactory';
import { DragDropSystem } from '../systems/DragDropSystem';
import { ConnectionSystem } from '../systems/ConnectionSystem';
import { WinConditionSystem } from '../systems/WinConditionSystem';
import { SnapshotSystem } from '../systems/SnapshotSystem';
import { setActiveScene } from '../level-config-store';
import type { LevelSnapshotData } from '../systems/SnapshotSystem';
import { SoundCreature } from '../objects/SoundCreature';
import { Resonator } from '../objects/Resonator';
import { TargetZone } from '../objects/TargetZone';
import { MouthShapeButton } from '../objects/MouthShapeButton';
import { BlenderNode } from '../objects/BlenderNode';
import { AlphabetTile } from '../objects/AlphabetTile';
import { Companion } from '../objects/Companion';
import { PhonemeLibrary } from '../audio/PhonemeLibrary';
import { AudioManager } from '../audio/AudioManager';
import type { GameObj } from '../objects/GameObjectFactory';

export class GameplayScene extends Phaser.Scene {
  protected levelConfig!: LevelConfig;
  protected dragDropSystem!: DragDropSystem;
  protected connectionSystem!: ConnectionSystem;
  protected winConditionSystem!: WinConditionSystem;
  protected phonemeLibrary!: PhonemeLibrary;
  protected mouthShapeButtons: MouthShapeButton[] = [];
  protected blenderNodes: BlenderNode[] = [];
  protected alphabetTiles: AlphabetTile[] = [];
  protected gameObjects: GameObj[] = [];
  protected completedPhonemes: string[] = [];
  private companion!: Companion;
  private _stepIndex = 0;
  private _guidanceCard!: Phaser.GameObjects.Container;
  private _guidanceBg!: Phaser.GameObjects.Graphics;
  private _guidanceText!: Phaser.GameObjects.Text;
  private _hintText!: Phaser.GameObjects.Text;

  constructor(sceneKey: string = SCENES.GAMEPLAY) {
    super({ key: sceneKey });
  }

  init(data: { levelConfig: LevelConfig; snapshot?: LevelSnapshotData | null }) {
    this.levelConfig = data.levelConfig;
    this.pendingSnapshot = data.snapshot || null;
  }

  private pendingSnapshot: LevelSnapshotData | null = null;

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#f5f3f0');

    // ---- 背景：羊皮纸纹理 + 声波纹 ----
    this._drawBackground(width, height);

    this.mouthShapeButtons = [];
    this.blenderNodes = [];
    this.alphabetTiles = [];
    this.gameObjects = [];
    this.completedPhonemes = [];

    this.phonemeLibrary = new PhonemeLibrary();
    this.phonemeLibrary.loadFromConfig(this.levelConfig.audioClips);
    AudioManager.getInstance().setVolume(0.5);

    this.dragDropSystem = new DragDropSystem(this);
    this.connectionSystem = new ConnectionSystem(this);
    this.winConditionSystem = new WinConditionSystem(
      this, this.levelConfig, this.dragDropSystem, this.mouthShapeButtons,
      () => this.connectionSystem.areAllBlendersConnected()
    );

    // Title — clean, minimal
    this.add.text(width / 2, 20, this.levelConfig.title, {
      fontSize: '18px', color: '#1e1b18', fontFamily: 'sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5);

    // ---- 剧情式步骤指引 ----
    this._stepIndex = 0;
    this._guidanceCard = this.add.container(width - 20, 55);
    this._guidanceBg = this.add.graphics();
    this._guidanceText = this.add.text(0, 0, '', { fontSize: '11px', color: '#2c2416', fontFamily: 'sans-serif', wordWrap: { width: 170 } });
    this._guidanceCard.add([this._guidanceBg, this._guidanceText]);

    // Hint bar (must exist before _updateGuidance)
    this._hintText = this.add.text(width / 2, height - 20, '', {
      fontSize: '12px', color: '#5c4f3a', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this._updateGuidance('start');

    this.spawnObjects();

    // ---- Companion ----
    this.companion = new Companion(this, 60, height - 80, 1);
    this.companion.setMood('thinking');
    this.time.delayedCall(800, () => this.companion.say('让我听听…这是什么声音？', 3000));

    // Phoneme detected → happy + bubble
    eventBus.on(GameEvents.PHONEME_DETECTED, () => {
      this.companion.setMood('happy');
      this._updateGuidance('halfway');
      const msgs = ['就是这个！', '找到了！', '好听！', '没错！'];
      this.companion.say(msgs[Phaser.Math.Between(0, msgs.length - 1)], 1800);
      this.time.delayedCall(2000, () => this.companion.setMood('idle'));
    });
    // Win → celebrate + bubble
    eventBus.on(GameEvents.WIN_CONDITION_MET, () => {
      this.companion.setMood('celebrate');
      this._updateGuidance('complete');
      this.companion.say('太厉害了！你做到了！🎉', 3000);
    });

    eventBus.emit(GameEvents.SCENE_READY, { sceneKey: SCENES.GAMEPLAY });
    eventBus.emit(GameEvents.LEVEL_LOADED, { levelId: this.levelConfig.levelId });

    // 注册场景引用（供 React 层调用 captureSnapshot / restoreSnapshot）
    setActiveScene(this);

    // 从快照恢复游戏状态
    if (this.pendingSnapshot) {
      this.time.delayedCall(100, () => {
        this.restoreSnapshot(this.pendingSnapshot!);
      });
    }
  }

  /** 场景销毁时清理引用 */
  shutdown() {
    setActiveScene(null);
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

  /** 捕获当前状态快照 */
  captureSnapshot(elapsedSec = 0): LevelSnapshotData {
    return SnapshotSystem.capture({
      gameObjects: this.gameObjects,
      connectionSystem: this.connectionSystem,
      completedPhonemes: this.completedPhonemes,
      elapsedSec,
      attemptCount: 0,
    });
  }

  /** 从快照恢复游戏状态 */
  restoreSnapshot(data: LevelSnapshotData) {
    if (!data?.objects) return;

    for (const obj of this.gameObjects) {
      const state = data.objects[obj.objectId];
      if (!state) continue;

      // 恢复位置
      if (state.x !== undefined && 'x' in obj) {
        (obj as Phaser.GameObjects.Container).x = state.x;
      }
      if (state.y !== undefined && 'y' in obj) {
        (obj as Phaser.GameObjects.Container).y = state.y;
      }

      // 恢复特定状态
      if (state.isActivated && obj instanceof Resonator && !obj.isActivated) {
        obj.activate(obj.phoneme);
      }
      if (state.isFilled && obj instanceof TargetZone && !obj.isFilled) {
        obj.isFilled = true;
        obj.highlight();
      }
      if (state.isRevealed && obj instanceof AlphabetTile && !obj.isRevealed) {
        obj.reveal(obj.phoneme || '');
      }
      if (state.hasBeenClicked && obj instanceof MouthShapeButton && !obj.hasBeenClicked) {
        obj.hasBeenClicked = true;
      }
    }

    // 恢复连线
    if (data.connections?.length > 0) {
      for (const conn of data.connections) {
        const source = this.gameObjects.find((o) => o.objectId === conn.fromNodeId) as SoundCreature | undefined;
        const blender = this.gameObjects.find((o) => o.objectId === conn.toNodeId) as BlenderNode | undefined;
        if (source && blender) {
          blender.connectPhoneme(conn.toPortId, source.phoneme);
        }
      }
    }

    // 恢复 Boss 关音素
    if (data.completedPhonemes) {
      this.completedPhonemes = data.completedPhonemes;
    }

    console.log('[GameplayScene] 快照恢复完成');
  }

  /** 剧情式步骤指引 — 根据关卡机制生成分步引导 */
  private _updateGuidance(stage: 'start' | 'progress' | 'halfway' | 'complete') {
    if (!this.scene?.isActive() || !this._guidanceText?.active || !this._hintText?.active) return;
    const steps: string[] = [];
    const mt = this.levelConfig.mechanicType;

    if (mt === 'drag_to_resonate') {
      steps.push('🔍 观察工作台上的装置');
      steps.push('👆 点击发出声音的生物');
      steps.push('✋ 拖拽它到共振器上');
    } else if (mt === 'sound_match') {
      steps.push('👆 点击左侧生物听声音');
      steps.push('🔊 记住它的发音');
      steps.push('✋ 拖拽右侧匹配的影子');
    } else if (mt === 'connect_and_blend' || mt === 'multi_blend') {
      steps.push('🔌 点击声音节点的输出端口');
      steps.push('🎯 再点击合成器的输入端口');
      steps.push('✅ 所有端口都连上即完成');
    } else if (mt === 'invent_letter') {
      steps.push('💎 点击音素水晶');
      steps.push('✋ 拖到空白石板上');
      steps.push('🔤 揭示对应的字母');
    }

    // Determine current step
    const total = steps.length;
    let current = stage === 'start' ? 0 : stage === 'halfway' ? 1 : stage === 'complete' ? total : this._stepIndex + 1;
    if (current >= total) current = total - 1;
    this._stepIndex = current;

    // Build guidance card (top-right) — plain text, no HTML
    this._guidanceBg.clear();
    this._guidanceBg.fillStyle(0xfdf8f0, 0.9);
    this._guidanceBg.fillRoundedRect(-180, 0, 180, 76, 10);
    this._guidanceBg.lineStyle(1, 0xd4912a, 0.2);
    this._guidanceBg.strokeRoundedRect(-180, 0, 180, 76, 10);
    let body = `📋 ${current + 1}/${total}\n`;
    for (let i = 0; i < total; i++) {
      const marker = i < current ? '✓' : i === current ? '▸' : '  ';
      body += `${marker} ${steps[i]}\n`;
    }
    this._guidanceText.setText(body);
    this._guidanceText.setY(6);
    this._guidanceText.setX(-172);

    // Bottom hint
    const hint = current < total ? steps[current].replace(/^[^\s]+\s/, '') : '🎉 完成！';
    this._hintText.setText(`💡 ${hint}`);
  }

  /** 羊皮纸纹理 + 声波纹 + 浮游音素 */
  private _drawBackground(w: number, h: number) {
    const g = this.add.graphics().setDepth(-10);

    // --- 羊皮纸底色渐变 ---
    const topR = 254, topG = 249, topB = 240;
    const botR = 250, botG = 243, botB = 230;
    for (let i = 0; i < 24; i++) {
      const t = i / 23;
      g.fillStyle(Phaser.Display.Color.GetColor(
        Math.round(topR + (botR - topR) * t),
        Math.round(topG + (botG - topG) * t),
        Math.round(topB + (botB - topB) * t)));
      g.fillRect(0, i * h / 24, w, h / 24 + 2);
    }

    // --- 淡墨横格线 (笔记本) ---
    g.lineStyle(1, 0x8b7355, 0.04);
    for (let y = 60; y < h - 40; y += 28) {
      g.lineBetween(30, y, w - 30, y);
    }
    // 左竖线
    g.lineStyle(1, 0xef4444, 0.06);
    g.lineBetween(42, 50, 42, h - 50);

    // --- 声波纹弧线 ---
    const cx = w / 2, cy = h / 2 + 30;
    for (let ring = 1; ring <= 4; ring++) {
      g.lineStyle(1, 0x6366f1, 0.04 - ring * 0.01);
      g.beginPath();
      for (let angle = 0; angle <= Math.PI * 2; angle += 0.1) {
        const rx = 120 + ring * 50 + Math.sin(angle * 3) * 8;
        const ry = 80 + ring * 30 + Math.cos(angle * 2) * 5;
        const px = cx + Math.cos(angle) * rx;
        const py = cy + Math.sin(angle) * ry;
        if (angle === 0) g.moveTo(px, py); else g.lineTo(px, py);
      }
      g.strokePath();
    }

    // --- 角落装饰：音素符号 ---
    const symbols = ['/m/', '/s/', '/a/', '/k/', '/t/', '♪', '♫', '~'];
    symbols.forEach((sym, i) => {
      const sx = 40 + Math.random() * (w - 80);
      const sy = 70 + Math.random() * (h - 110);
      const t = this.add.text(sx, sy, sym, {
        fontSize: `${Math.floor(Math.random() * 10 + 10)}px`,
        color: '#d4cfc9', fontFamily: 'serif',
      }).setAlpha(0.12).setDepth(-5);
      this.tweens.add({
        targets: t, y: sy - 15, alpha: 0.04,
        duration: Phaser.Math.Between(4000, 8000), repeat: -1, yoyo: true,
        delay: Phaser.Math.Between(0, 3000),
      });
    });
  }

  private getMechanicHint(): string {
    switch (this.levelConfig.mechanicType) {
      case 'drag_to_resonate':
        return '拖拽声音生物到共振器上进行分析';
      case 'sound_match':
        return '点击左边生物听声音 → 拖拽右边影子生物到匹配区';
      case 'sound_lab':
        return '点击每个口型按钮，试听所有的声音——全部试一遍！';
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
