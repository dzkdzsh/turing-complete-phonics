import { randomDarkFill } from './DarkFills';
// MouthShapeButton —— Era 1 sound_lab：点击口型发出对应声音

import * as Phaser from 'phaser';
import type { GameObjectDef } from '@/types/level';
import { AudioManager } from '../audio/AudioManager';

export class MouthShapeButton extends Phaser.GameObjects.Container {
  public objectId: string;
  public phoneme: string;
  public hasBeenClicked = false;

  private bg: Phaser.GameObjects.Ellipse;
  private icon: Phaser.GameObjects.Text;
  private label: Phaser.GameObjects.Text;
  private audio: AudioManager;

  constructor(scene: Phaser.Scene, def: GameObjectDef) {
    const x = def.position.x;
    const y = def.position.y;
    super(scene, x, y);

    this.objectId = def.id;
    this.phoneme = def.phoneme || '';
    this.audio = AudioManager.getInstance();

    // 圆形按钮背景
    this.bg = scene.add.ellipse(0, 0, 90, 90, randomDarkFill(), 0.9);
    this.bg.setStrokeStyle(2, 0x444444, 0.5);
    this.add(this.bg);

    // 口型图标（用文字模拟）
    const icons: Record<string, string> = { m: '👄', s: '😬', a: '😮' };
    this.icon = scene.add
      .text(0, -12, icons[this.phoneme] || '👄', {
        fontSize: '32px',
      })
      .setOrigin(0.5);
    this.add(this.icon);

    // 标签
    this.label = scene.add
      .text(0, 32, def.label || `/${this.phoneme}/`, {
        fontSize: '12px',
        color: '#444444',
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);
    this.add(this.label);

    // 音素提示
    const phonemeLabel = scene.add
      .text(0, -42, `/${this.phoneme}/`, {
        fontSize: '11px',
        color: '#444444',
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);
    this.add(phonemeLabel);

    // 交互
    this.setSize(100, 100);
    this.setInteractive({ cursor: 'pointer' });

    this.on('pointerdown', () => this.onClick());
    this.on('pointerover', () => {
      this.scene.tweens.add({
        targets: this.bg,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 150,
      });
    });
    this.on('pointerout', () => {
      this.scene.tweens.add({
        targets: this.bg,
        scaleX: 1,
        scaleY: 1,
        duration: 150,
      });
    });

    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
  }

  private onClick() {
    this.hasBeenClicked = true;

    // 播放音素音频
    this.audio.playPhoneme(this.phoneme);

    // 按钮弹跳动画
    this.scene.tweens.add({
      targets: this.bg,
      scaleX: 1.2,
      scaleY: 0.9,
      yoyo: true,
      duration: 100,
    });

    // 波纹效果
    const ripple = this.scene.add.ellipse(this.x, this.y, 90, 90, 0x444444, 0.3);
    this.scene.tweens.add({
      targets: ripple,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 500,
      onComplete: () => ripple.destroy(),
    });

    // 高亮边框
    this.bg.setStrokeStyle(3, 0x10b981, 0.8);
    this.scene.time.delayedCall(600, () => {
      this.bg.setStrokeStyle(2, 0x444444, 0.5);
    });
  }
}
