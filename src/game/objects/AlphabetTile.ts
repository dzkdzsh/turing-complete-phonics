// AlphabetTile —— Era 3 字母块：初始空白，音素水晶拖入后显示对应字母

import * as Phaser from 'phaser';
import type { GameObjectDef } from '@/types/level';
import { AudioManager } from '../audio/AudioManager';

export class AlphabetTile extends Phaser.GameObjects.Container {
  public objectId: string;
  public targetPhoneme: string | null = null;
  public letterSymbol: string;
  public isRevealed = false;

  private bg: Phaser.GameObjects.Rectangle;
  private letterText: Phaser.GameObjects.Text;
  private shimmer: Phaser.GameObjects.Graphics;
  private acceptedIds: string[];

  constructor(scene: Phaser.Scene, def: GameObjectDef) {
    const x = def.position.x;
    const y = def.position.y;
    super(scene, x, y);

    this.objectId = def.id;
    this.letterSymbol = def.letterSymbol || '?';
    this.acceptedIds = def.accepts || [];

    // 如果有 phoneme 字段，说明是 invent_letter 类型（音素→字母映射）
    if (def.phoneme) {
      this.targetPhoneme = def.phoneme;
    }

    // 微光效果
    this.shimmer = scene.add.graphics();
    this.shimmer.lineStyle(1, 0x8b5cf6, 0.3);
    this.shimmer.strokeRect(-40, -35, 80, 70);
    this.add(this.shimmer);

    // 石板背景
    this.bg = scene.add.rectangle(0, 0, 70, 60, 0x2a2520, 0.9);
    this.bg.setStrokeStyle(2, 0x8b5cf6, 0.4);
    this.add(this.bg);

    // 字母（初始隐藏）
    this.letterText = scene.add.text(0, 0, '?', {
      fontSize: '28px',
      color: '#8b5cf6',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });
    this.letterText.setOrigin(0.5);
    this.letterText.setAlpha(0.3);
    this.add(this.letterText);

    // 标签
    const label = scene.add.text(0, 42, def.label || '', {
      fontSize: '10px',
      color: '#8b7355',
      fontFamily: 'sans-serif',
      align: 'center',
    });
    label.setOrigin(0.5, 0);
    this.add(label);

    this.setSize(80, 70);
    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
  }

  /** 接收音素水晶，揭示字母 */
  reveal(phoneme: string): boolean {
    if (this.targetPhoneme && this.targetPhoneme !== phoneme) return false;
    if (this.isRevealed) return true;

    this.isRevealed = true;

    // 揭示动画：闪烁 + 放大
    this.scene.tweens.add({
      targets: this.letterText,
      alpha: 1,
      scaleX: { from: 2, to: 1 },
      scaleY: { from: 2, to: 1 },
      duration: 500,
      ease: 'Back.easeOut',
      onStart: () => {
        this.letterText.setText(this.letterSymbol);
      },
    });

    // 石板发光
    this.bg.setStrokeStyle(2, 0x10b981, 0.8);
    this.scene.tweens.add({
      targets: this.shimmer,
      alpha: { from: 1, to: 0.4 },
      duration: 600,
      yoyo: true,
      repeat: 2,
    });

    // 播放成功音效
    AudioManager.getInstance().playSFX('unlock');

    return true;
  }

  /** 检查是否接受指定对象 */
  accepts(objectId: string): boolean {
    return this.acceptedIds.includes(objectId);
  }
}
