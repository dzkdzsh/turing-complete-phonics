import { randomDarkFill } from './DarkFills';
// TargetZone —— 拖拽目标区域，用于 sound_match 等需要放置匹配的机制

import * as Phaser from 'phaser';
import type { GameObjectDef } from '@/types/level';

export class TargetZone extends Phaser.GameObjects.Container {
  public objectId: string;
  public isFilled = false;
  private acceptedIds: string[];
  private zone: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private hintGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, def: GameObjectDef) {
    const x = def.position.x;
    const y = def.position.y;
    super(scene, x, y);

    this.objectId = def.id;
    this.acceptedIds = def.accepts || [];

    // 虚线框
    this.hintGraphics = scene.add.graphics();
    this.hintGraphics.lineStyle(2, 0x444444, 0.4);
    this.hintGraphics.strokeRect(-50, -40, 100, 80);
    this.add(this.hintGraphics);

    // 半透明背景
    this.zone = scene.add.rectangle(0, 0, 96, 76, randomDarkFill(), 0.15);
    this.zone.setStrokeStyle(1, 0x444444, 0.3);
    this.add(this.zone);

    // 标签
    this.label = scene.add.text(0, 55, def.label || '', {
      fontSize: '11px',
      color: '#000000',
      fontFamily: 'sans-serif',
      align: 'center',
    });
    this.label.setOrigin(0.5, 0);
    this.add(this.label);

    this.setSize(100, 80);
    scene.add.existing(this);
  }

  accepts(objectId: string): boolean {
    return this.acceptedIds.includes(objectId);
  }

  highlight() {
    this.scene.tweens.add({
      targets: this.hintGraphics,
      alpha: 0.6,
      duration: 300,
      yoyo: true,
      repeat: 3,
    });
  }
}
