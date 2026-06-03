// Resonator —— Era 1 共振器：接收声音生物后发光并播放声音

import * as Phaser from 'phaser';
import type { GameObjectDef } from '@/types/level';
import { eventBus } from '../event-bus';
import { GameEvents } from '@/types/events';

export class Resonator extends Phaser.GameObjects.Container {
  public objectId: string;
  public isActivated = false;
  private acceptedIds: string[];
  private resonatorBody: Phaser.GameObjects.Rectangle;
  private core: Phaser.GameObjects.Ellipse;
  private lab: Phaser.GameObjects.Text;
  private portIndicator: Phaser.GameObjects.Ellipse;

  constructor(scene: Phaser.Scene, def: GameObjectDef) {
    const x = def.position.x;
    const y = def.position.y;
    super(scene, x, y);

    this.objectId = def.id;
    this.acceptedIds = def.accepts || [];

    // 外层框
    this.resonatorBody = scene.add.rectangle(0, 0, 100, 80, 0x333333, 0.6);
    this.resonatorBody.setStrokeStyle(2, 0xc9a96e, 0.5);
    this.add(this.resonatorBody);

    // 核心（未激活时暗淡）
    this.core = scene.add.ellipse(0, 0, 30, 30, 0x666666, 0.5);
    this.add(this.core);

    // 输入端口指示器
    this.portIndicator = scene.add.ellipse(-50, 0, 12, 12, 0xc9a96e, 0.6);
    this.add(this.portIndicator);

    // 标签
    this.lab = scene.add.text(0, 55, def.label || '共振器', {
      fontSize: '12px',
      color: '#8b7355',
      fontFamily: 'sans-serif',
      align: 'center',
    });
    this.lab.setOrigin(0.5, 0);
    this.add(this.lab);

    // 设置为可放置目标
    this.setSize(120, 100);
    this.setInteractive({ cursor: 'pointer' });

    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
  }

  /** 接收声音生物 */
  activate(phoneme: string) {
    if (this.isActivated) return;

    this.isActivated = true;

    // 核心发光动画
    this.scene.tweens.add({
      targets: this.core,
      fillColor: 0xc9a96e,
      fillAlpha: 0.9,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 500,
      ease: 'Back.easeOut',
    });

    // 边框高亮
    this.resonatorBody.setStrokeStyle(2, 0xc9a96e, 1);

    // 持续脉动
    this.scene.tweens.add({
      targets: this.core,
      alpha: { from: 1, to: 0.7 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // 通知胜利条件系统
    eventBus.emit(GameEvents.PHONEME_DETECTED, {
      phoneme,
      confidence: 1.0,
    });
  }

  /** 检查是否接受某个对象 */
  accepts(objectId: string): boolean {
    return this.acceptedIds.includes(objectId);
  }

  getPortPosition(): { x: number; y: number } {
    return { x: this.x - 50, y: this.y };
  }
}
