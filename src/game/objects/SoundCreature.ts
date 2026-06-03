// SoundCreature —— Era 1 可拖拽的声音生物

import * as Phaser from 'phaser';
import type { GameObjectDef } from '@/types/level';
import { PHONEME_COLORS } from '@/lib/constants';

export class SoundCreature extends Phaser.GameObjects.Container {
  public objectId: string;
  public phoneme: string;
  public isDraggable: boolean;

  private creatureBody: Phaser.GameObjects.Ellipse;
  private creatureLabel: Phaser.GameObjects.Text;
  private glowEffect: Phaser.GameObjects.Ellipse;
  private baseColor: number;

  constructor(scene: Phaser.Scene, def: GameObjectDef) {
    const x = def.position.x;
    const y = def.position.y;
    super(scene, x, y);

    this.objectId = def.id;
    this.phoneme = def.phoneme || '';
    this.isDraggable = def.draggable || false;

    this.baseColor = PHONEME_COLORS[this.phoneme] || 0xc9a96e;

    // 发光效果（底层）
    this.glowEffect = scene.add.ellipse(0, 0, 70, 70, this.baseColor, 0.15);
    this.add(this.glowEffect);

    // 生物本体（椭圆）
    this.creatureBody = scene.add.ellipse(0, 0, 50, 44, this.baseColor, 0.8);
    this.creatureBody.setStrokeStyle(2, this.baseColor, 1);
    this.add(this.creatureBody);

    // 标签
    this.creatureLabel = scene.add.text(0, 0, def.label || '', {
      fontSize: '12px',
      color: '#e8e0d0',
      fontFamily: 'sans-serif',
      align: 'center',
    });
    this.creatureLabel.setOrigin(0.5, -2.2);
    this.add(this.creatureLabel);

    // 交互
    this.setSize(60, 60);
    if (this.isDraggable) {
      this.setInteractive({ draggable: true, cursor: 'grab' });
    } else {
      this.setInteractive({ cursor: 'pointer' });
    }

    this.on('pointerover', () => this.showHover());
    this.on('pointerout', () => this.hideHover());
    this.on('pointerdown', () => {
      // 点击播放音素声音
      if (this.phoneme) {
        this.playSound();
      }
    });

    scene.add.existing(this);
  }

  private showHover() {
    this.scene.tweens.add({
      targets: this.glowEffect,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0.35,
      duration: 200,
    });
  }

  private hideHover() {
    this.scene.tweens.add({
      targets: this.glowEffect,
      scaleX: 1,
      scaleY: 1,
      alpha: 0.15,
      duration: 200,
    });
  }

  private playSound() {
    this.scene.tweens.add({
      targets: this.creatureBody,
      scaleX: 1.2,
      scaleY: 1.1,
      yoyo: true,
      duration: 100,
    });
    // AudioManager 播放音素（后续阶段实现真实音频）
    console.log(`[SoundCreature] Playing phoneme: /${this.phoneme}/`);
  }

  /** 拖拽时调用 */
  setDragActive(active: boolean) {
    if (active) {
      this.setAlpha(0.7);
      this.setScale(1.1);
    } else {
      this.setAlpha(1);
      this.setScale(1);
    }
  }
}
