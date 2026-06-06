import { randomDarkFill } from './DarkFills';
// Companion — 精灵伙伴：表情 + 对话气泡 + 生动动画

import * as Phaser from 'phaser';

type Mood = 'idle' | 'happy' | 'sad' | 'thinking' | 'celebrate';

export class Companion extends Phaser.GameObjects.Container {
  private spriteBody: Phaser.GameObjects.Ellipse;
  private eyes: Phaser.GameObjects.Graphics;
  private mouth: Phaser.GameObjects.Graphics;
  private blush: Phaser.GameObjects.Graphics;
  private wings: Phaser.GameObjects.Graphics;
  private ears: Phaser.GameObjects.Graphics;
  private mood: Mood = 'idle';
  private era: number;
  // Speech bubble
  private bubbleBg: Phaser.GameObjects.Graphics | null = null;
  private bubbleText: Phaser.GameObjects.Text | null = null;
  private bubbleTimer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, era: number = 1) {
    super(scene, x, y);
    this.era = era;
    scene.add.existing(this);

    const sz = 0.6 + era * 0.1;

    // Shadow
    const shadow = scene.add.ellipse(0, 18 * sz, 32 * sz, 10 * sz, 0x000000, 0.06);
    this.add(shadow);

    // Ears (owl-like tufts)
    this.ears = scene.add.graphics();
    this._drawEars();
    this.add(this.ears);

    // Body
    this.spriteBody = scene.add.ellipse(0, 0, 48 * sz, 46 * sz, randomDarkFill(), 0.92);
    this.spriteBody.setStrokeStyle(2.5, era === 1 ? 0x555555 : era === 2 ? 0x555555 : 0x555555, 0.45);
    this.add(this.spriteBody);

    // Belly
    const belly = scene.add.ellipse(0, 6 * sz, 28 * sz, 24 * sz, randomDarkFill(), 0.6);
    this.add(belly);

    // Wings (small decorative)
    this.wings = scene.add.graphics();
    this._drawWings();
    this.add(this.wings);

    // Eyes
    this.eyes = scene.add.graphics();
    this.add(this.eyes);

    // Mouth
    this.mouth = scene.add.graphics();
    this.add(this.mouth);

    // Blush
    this.blush = scene.add.graphics();
    this.add(this.blush);

    this._draw('idle');

    // Idle gentle float
    scene.tweens.add({
      targets: this, y: y - 5, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // Random blink
    scene.time.addEvent({
      delay: Phaser.Math.Between(2000, 5000), loop: true,
      callback: () => {
        if (this.mood === 'idle') {
          this._blink();
        }
      },
    });
  }

  setMood(mood: Mood) {
    if (!this.scene) return;
    this.mood = mood;
    this._draw(mood);
  }

  /** 弹出对话气泡 */
  say(text: string, duration: number = 2500) {
    if (!this.scene) return;
    // Remove old bubble
    if (this.bubbleBg) { this.bubbleBg.destroy(); this.bubbleBg = null; }
    if (this.bubbleText) { this.bubbleText.destroy(); this.bubbleText = null; }
    if (this.bubbleTimer) { this.bubbleTimer.destroy(); this.bubbleTimer = null; }

    const scene = this.scene as Phaser.Scene;

    // Bubble background
    this.bubbleBg = scene.add.graphics();
    const bw = Math.max(120, text.length * 11 + 30);
    const bh = 36;
    this.bubbleBg.fillStyle(0x1a1a1a, 0.94);
    this.bubbleBg.fillRoundedRect(this.x - bw / 2 + 30, this.y - 70, bw, bh, 12);
    this.bubbleBg.lineStyle(1, 0x444444, 0.2);
    this.bubbleBg.strokeRoundedRect(this.x - bw / 2 + 30, this.y - 70, bw, bh, 12);
    // Tail
    this.bubbleBg.fillStyle(0x1a1a1a, 0.94);
    this.bubbleBg.fillTriangle(this.x + 16, this.y - 36, this.x + 24, this.y - 36, this.x + 20, this.y - 28);
    this.bubbleBg.setDepth(20);

    // Bubble text
    this.bubbleText = scene.add.text(this.x + 30, this.y - 64, text, {
      fontSize: '12px', color: '#000000', fontFamily: 'sans-serif', fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(21);

    // Auto-dismiss
    this.bubbleTimer = scene.time.delayedCall(duration, () => {
      if (this.bubbleBg) { this.bubbleBg.destroy(); this.bubbleBg = null; }
      if (this.bubbleText) { this.bubbleText.destroy(); this.bubbleText = null; }
    });
  }

  private _blink() {
    this.eyes.clear();
    this.eyes.fillStyle(0x1e1b18);
    this.eyes.fillRect(-11, -5, 6, 2);
    this.eyes.fillRect(5, -5, 6, 2);
    this.scene.time.delayedCall(100, () => { if (this.mood === 'idle') this._draw('idle'); });
  }

  private _drawEars() {
    this.ears.clear();
    this.ears.fillStyle(0x555555, 0.3);
    this.ears.fillTriangle(-10, -16, -18, -28, -2, -18);
    this.ears.fillTriangle(10, -16, 18, -28, 2, -18);
  }

  private _drawWings() {
    this.wings.clear();
    this.wings.fillStyle(0x555555, 0.12);
    this.wings.fillEllipse(-22, 4, 14, 10);
    this.wings.fillEllipse(22, 4, 14, 10);
  }

  private _draw(mood: Mood) {
    if (!this.scene) return;
    this.eyes.clear();
    this.mouth.clear();
    this.blush.clear();

    switch (mood) {
      case 'idle':
        this.eyes.fillStyle(0x1e1b18);
        this.eyes.fillCircle(-8, -4, 3.2); this.eyes.fillCircle(8, -4, 3.2);
        this.eyes.fillStyle(0x1a1a1a);
        this.eyes.fillCircle(-7, -5.5, 1.2); this.eyes.fillCircle(9, -5.5, 1.2);
        this.mouth.lineStyle(2, 0x1e1b18, 0.5);
        this.mouth.beginPath(); this.mouth.arc(0, 4, 5, 0.1, Math.PI - 0.1, false); this.mouth.strokePath();
        this.wings.setAlpha(0.3);
        break;

      case 'happy':
        this.eyes.fillStyle(0x1e1b18);
        this.eyes.fillEllipse(-7, -5, 5, 7); this.eyes.fillEllipse(9, -5, 5, 7);
        this.eyes.fillStyle(0x1a1a1a);
        this.eyes.fillCircle(-6, -7, 1.5); this.eyes.fillCircle(10, -7, 1.5);
        this.mouth.fillStyle(0x1e1b18);
        this.mouth.fillEllipse(0, 5, 8, 5);
        this.blush.fillStyle(0xef4444, 0.15);
        this.blush.fillCircle(-14, 3, 5); this.blush.fillCircle(14, 3, 5);
        this.wings.setAlpha(0.6);
        // Wiggle
        this.scene.tweens.add({ targets: this, angle: { from: -8, to: 8 }, duration: 200, yoyo: true, repeat: 1 });
        break;

      case 'sad':
        this.eyes.fillStyle(0x1e1b18);
        this.eyes.fillCircle(-8, -1, 3.5); this.eyes.fillCircle(8, -1, 3.5);
        this.eyes.fillStyle(0x555555, 0.35);
        this.eyes.fillCircle(2, 3, 1.8);
        this.mouth.lineStyle(2, 0x1e1b18, 0.5);
        this.mouth.beginPath(); this.mouth.arc(0, 14, 5, Math.PI, 0, false); this.mouth.strokePath();
        this.wings.setAlpha(0.15);
        // Slow droop
        this.scene.tweens.add({ targets: this, y: this.y + 6, duration: 400, yoyo: true });
        break;

      case 'thinking':
        this.eyes.fillStyle(0x1e1b18);
        this.eyes.fillCircle(-6, -5, 2.5); this.eyes.fillCircle(12, -5, 2.5);
        this.eyes.fillStyle(0x1a1a1a);
        this.eyes.fillCircle(-5, -6.5, 1); this.eyes.fillCircle(13, -6.5, 1);
        this.mouth.fillStyle(0x1e1b18, 0.45);
        this.mouth.fillCircle(4, 5, 2.8);
        this.wings.setAlpha(0.35);
        break;

      case 'celebrate':
        this.eyes.fillStyle(0x1e1b18);
        this.eyes.fillCircle(-7, -5, 3); this.eyes.fillCircle(9, -5, 3);
        // Star sparkle dots
        this.eyes.fillStyle(0x555555);
        this.eyes.fillCircle(-7, -9, 2); this.eyes.fillCircle(-10, -5, 1.5);
        this.eyes.fillCircle(-4, -5, 1.5); this.eyes.fillCircle(-7, -1, 1.5);
        this.eyes.fillCircle(9, -9, 2); this.eyes.fillCircle(6, -5, 1.5);
        this.eyes.fillCircle(12, -5, 1.5); this.eyes.fillCircle(9, -1, 1.5);
        this.mouth.fillStyle(0x1e1b18);
        this.mouth.fillEllipse(0, 5, 9, 6);
        this.blush.fillStyle(0xef4444, 0.2);
        this.blush.fillCircle(-14, 3, 5); this.blush.fillCircle(14, 3, 5);
        this.wings.setAlpha(0.7);
        // Jump animation
        this.scene.tweens.add({
          targets: this, y: this.y - 20, duration: 300, yoyo: true, repeat: 2, ease: 'Bounce.easeOut',
        });
        break;
    }
  }

  evolve(era: number) {
    this.era = era;
    this.spriteBody.setStrokeStyle(2.5, era === 1 ? 0x555555 : era === 2 ? 0x555555 : 0x555555, 0.45);
    const sz = 0.6 + era * 0.1;
    this.spriteBody.setSize(48 * sz, 46 * sz);
    this.say(era === 2 ? '新世界解锁！' : '新的力量觉醒了...', 2000);
  }
}
