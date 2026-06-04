// SpellingSlot — 拼写槽位：接收拖入的字母，显示已放置的字母

import * as Phaser from 'phaser';

export class SpellingSlot extends Phaser.GameObjects.Container {
  public slotIndex: number;
  public filledLetter: string | null = null;
  private bg: Phaser.GameObjects.Rectangle;
  private letterText: Phaser.GameObjects.Text;
  private highlight: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, x: number, y: number, size: number, index: number) {
    super(scene, x, y);
    this.slotIndex = index;
    scene.add.existing(this);

    // Highlight ring
    this.highlight = scene.add.rectangle(0, 0, size + 6, size + 6, 0xd4912a, 0);
    this.highlight.setStrokeStyle(2, 0xd4912a, 0);
    this.add(this.highlight);

    // Slot background
    this.bg = scene.add.rectangle(0, 0, size, size, 0xffffff, 0.9);
    this.bg.setStrokeStyle(2, 0xd4912a, 0.3);
    this.add(this.bg);

    // Letter text
    this.letterText = scene.add.text(0, 0, '', {
      fontSize: '36px', color: '#2c2416', fontFamily: 'Crimson Text, serif', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(this.letterText);

    // Dashed bottom line
    const dash = scene.add.graphics();
    dash.lineStyle(2, 0xd4912a, 0.2);
    dash.lineBetween(-size / 2 + 8, size / 2 - 4, size / 2 - 8, size / 2 - 4);
    this.add(dash);

    this.setSize(size, size);
    this.setInteractive({ dropZone: true });
  }

  fill(letter: string) {
    this.filledLetter = letter;
    this.letterText.setText(letter.toUpperCase());
    this.bg.setStrokeStyle(2, 0x4a8c5c, 0.6);
    this.bg.setFillStyle(0xf0faf4);
    this.scene.tweens.add({ targets: this, scaleX: 1.1, scaleY: 1.1, duration: 150, yoyo: true, ease: 'Back.easeOut' });
  }

  clear() {
    this.filledLetter = null;
    this.letterText.setText('');
    this.bg.setStrokeStyle(2, 0xd4912a, 0.3);
    this.bg.setFillStyle(0xffffff, 0.9);
  }

  showHighlight() {
    this.highlight.setStrokeStyle(2, 0xd4912a, 0.5);
    this.highlight.setFillStyle(0xd4912a, 0.05);
  }

  hideHighlight() {
    this.highlight.setStrokeStyle(2, 0xd4912a, 0);
    this.highlight.setFillStyle(0xd4912a, 0);
  }
}
