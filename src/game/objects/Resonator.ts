import { randomDarkFill } from './DarkFills';
// Resonator —— Era 1 共振器 / Boss 关水晶

import * as Phaser from 'phaser';
import type { GameObjectDef } from '@/types/level';
import { eventBus } from '../event-bus';
import { GameEvents } from '@/types/events';

export class Resonator extends Phaser.GameObjects.Container {
  public objectId: string;
  public phoneme: string;
  public isActivated = false;
  public isCrystal: boolean;

  private acceptedIds: string[];
  private resonatorBody!: Phaser.GameObjects.Rectangle;
  private core!: Phaser.GameObjects.Ellipse;
  private crystalGlow!: Phaser.GameObjects.Ellipse;
  private lab!: Phaser.GameObjects.Text;
  private portIndicator!: Phaser.GameObjects.Ellipse;

  constructor(scene: Phaser.Scene, def: GameObjectDef) {
    const x = def.position.x;
    const y = def.position.y;
    super(scene, x, y);

    this.objectId = def.id;
    this.phoneme = def.phoneme || '';
    this.acceptedIds = def.accepts || [];
    this.isCrystal = def.initialState === 'locked';

    if (this.isCrystal) {
      this.buildCrystal(scene, def);
    } else {
      this.buildResonator(scene, def);
    }

    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
  }

  /** Boss 关：圆形发光水晶 */
  private buildCrystal(scene: Phaser.Scene, def: GameObjectDef) {
    // 外层光晕
    this.crystalGlow = scene.add.ellipse(0, 0, 70, 70, 0x1a1a1a, 0.25);
    this.add(this.crystalGlow);

    // 水晶核心
    this.core = scene.add.ellipse(0, 0, 44, 44, 0x1a1a1a, 0.7);
    this.core.setStrokeStyle(2, 0x444444, 0.6);
    this.add(this.core);

    // 音素标识
    const phonemeText = scene.add.text(0, -4, this.phoneme ? `/${this.phoneme}/` : '?', {
      fontSize: '18px',
      color: '#444444',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });
    phonemeText.setOrigin(0.5);
    this.add(phonemeText);

    // 标签
    this.lab = scene.add.text(0, 35, def.label || '水晶', {
      fontSize: '11px',
      color: '#444444',
      fontFamily: 'sans-serif',
      align: 'center',
    });
    this.lab.setOrigin(0.5, 0);
    this.add(this.lab);

    this.setSize(80, 80);
    this.setInteractive({ cursor: 'pointer' });

    // 悬停时水晶发光增强
    this.on('pointerover', () => {
      if (this.isActivated) return;
      scene.tweens.add({ targets: this.crystalGlow, scaleX: 1.25, scaleY: 1.25, alpha: 0.45, duration: 200 });
    });
    this.on('pointerout', () => {
      if (this.isActivated) return;
      scene.tweens.add({ targets: this.crystalGlow, scaleX: 1, scaleY: 1, alpha: 0.25, duration: 200 });
    });
  }

  /** Era 1：矩形共振器 */
  private buildResonator(scene: Phaser.Scene, def: GameObjectDef) {
    // Glow behind
    const glow = scene.add.ellipse(0, 0, 110, 90, 0x444444, 0.08);
    this.add(glow);
    scene.tweens.add({ targets: glow, alpha: 0.15, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.resonatorBody = scene.add.rectangle(0, 0, 100, 80, randomDarkFill(), 0.9);
    this.resonatorBody.setStrokeStyle(2, 0x444444, 0.4);
    this.add(this.resonatorBody);

    this.core = scene.add.ellipse(0, 0, 30, 30, 0x444444, 0.1);
    this.core.setStrokeStyle(1, 0x444444, 0.4);
    this.add(this.core);

    this.portIndicator = scene.add.ellipse(-50, 0, 10, 10, 0x444444, 0.5);
    scene.tweens.add({ targets: this.portIndicator, alpha: 0.3, duration: 1000, yoyo: true, repeat: -1 });
    this.add(this.portIndicator);

    this.lab = scene.add.text(0, 55, def.label || '共振器', {
      fontSize: '11px', color: '#000000', fontFamily: 'sans-serif',
    });
    this.lab.setOrigin(0.5, 0);
    this.add(this.lab);

    this.setSize(120, 100);
    this.setInteractive({ cursor: 'pointer' });
  }

  /** 激活 */
  activate(phoneme: string) {
    if (this.isActivated) return;
    this.isActivated = true;

    this.scene.tweens.add({
      targets: this.core,
      fillColor: this.isCrystal ? 0x10b981 : 0x444444,
      fillAlpha: 0.9,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 500,
      ease: 'Back.easeOut',
    });

    if (this.resonatorBody) {
      this.resonatorBody.setStrokeStyle(2, 0x10b981, 1);
    }
    if (this.crystalGlow) {
      this.scene.tweens.add({
        targets: this.crystalGlow,
        fillColor: 0x10b981,
        fillAlpha: 0.6,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: 500,
      });
    }
    if (this.core) {
      this.core.setStrokeStyle(2, 0x10b981, 0.9);
    }

    // 持续脉动
    this.scene.tweens.add({
      targets: this.core,
      alpha: { from: 1, to: 0.5 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    eventBus.emit(GameEvents.PHONEME_DETECTED, { phoneme, confidence: 1.0 });
  }

  accepts(objectId: string): boolean {
    return this.acceptedIds.includes(objectId);
  }

  getPortPosition(): { x: number; y: number } {
    return { x: this.x - 50, y: this.y };
  }
}
