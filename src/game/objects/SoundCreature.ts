// SoundCreature —— Era 1 可拖拽的声音生物

import * as Phaser from 'phaser';
import type { GameObjectDef } from '@/types/level';
import { PHONEME_COLORS } from '@/lib/constants';
import { AudioManager } from '../audio/AudioManager';

export class SoundCreature extends Phaser.GameObjects.Container {
  public objectId: string;
  public phoneme: string;
  public isDraggable: boolean;

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
    this.glowEffect = scene.add.ellipse(0, 0, 68, 68, this.baseColor, 0.12);
    this.add(this.glowEffect);
    scene.tweens.add({ targets: this.glowEffect, alpha: 0.2, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // 节点主体 — 浅色电路元件
    const bodyG = scene.add.graphics();
    bodyG.fillStyle(0xffffff, 0.95);
    bodyG.fillRoundedRect(-28, -24, 56, 48, 10);
    bodyG.lineStyle(2, this.baseColor, 0.8);
    bodyG.strokeRoundedRect(-28, -24, 56, 48, 10);
    // Inner fill
    bodyG.fillStyle(this.baseColor, 0.08);
    bodyG.fillRoundedRect(-24, -20, 48, 40, 8);
    this.add(bodyG);

    // 顶部标签
    this.creatureLabel = scene.add.text(0, -32, def.label || '', {
      fontSize: '10px', color: '#6b5e53', fontFamily: 'sans-serif',
    }).setOrigin(0.5);
    this.add(this.creatureLabel);

    // 音素标识 (底部居中)
    const phonemeText = scene.add.text(0, 30, `/${this.phoneme}/`, {
      fontSize: '11px', color: '#c9a96e', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(phonemeText);

    // 输出端口 (右侧)
    const outPort = scene.add.ellipse(28, 0, 8, 8, this.baseColor, 0.8);
    outPort.setStrokeStyle(1, 0xffffff, 0.5);
    this.add(outPort);
    scene.tweens.add({ targets: outPort, alpha: 0.4, duration: 800, yoyo: true, repeat: -1 });

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
    this.scene.tweens.add({ targets: this, scaleX: 1.15, scaleY: 1.15, yoyo: true, duration: 100 });
    AudioManager.getInstance().playPhoneme(this.phoneme);
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
