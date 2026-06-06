import { randomDarkFill } from './DarkFills';
// DragLetter — 可拖拽字母块：从候选区拖到拼写槽位

import * as Phaser from 'phaser';

export class DragLetter extends Phaser.GameObjects.Container {
  public letter: string;
  public originX: number;
  public originY: number;
  private bg: Phaser.GameObjects.Rectangle;
  private text: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, letter: string, size: number) {
    super(scene, x, y);
    this.letter = letter;
    this.originX = x;
    this.originY = y;
    scene.add.existing(this);

    // Shadow
    const sh = scene.add.rectangle(3, 3, size, size, 0x000000, 0.06);
    sh.setDepth(-1);
    this.add(sh);

    // Background
    this.bg = scene.add.rectangle(0, 0, size, size, randomDarkFill(), 0.95);
    this.bg.setStrokeStyle(2.5, 0x444444, 0.4);
    this.add(this.bg);

    // Letter
    this.text = scene.add.text(0, 0, letter.toUpperCase(), {
      fontSize: '32px', color: '#000000', fontFamily: 'Crimson Text, serif', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(this.text);

    this.setSize(size, size);
    this.setInteractive({ draggable: true, useHandCursor: true });

    // Drag events
    this.on('dragstart', () => {
      this.setDepth(10);
      this.setScale(1.1);
      this.bg.setStrokeStyle(2.5, 0x444444, 0.8);
    });

    this.on('drag', (_p: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      this.x = dragX;
      this.y = dragY;
    });

    this.on('dragend', () => {
      this.setDepth(0);
      this.setScale(1);
      this.bg.setStrokeStyle(2.5, 0x444444, 0.4);
    });
  }

  returnToOrigin() {
    this.scene.tweens.add({
      targets: this, x: this.originX, y: this.originY, duration: 300, ease: 'Back.easeOut',
    });
  }

  snapTo(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.originX = x;
    this.originY = y;
  }

  disable() {
    this.disableInteractive();
    this.setAlpha(0.4);
  }

  enable() {
    this.setInteractive({ draggable: true, useHandCursor: true });
    this.setAlpha(1);
  }
}
