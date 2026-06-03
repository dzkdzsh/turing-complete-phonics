// ConnectionWire —— Era 2 节点间连线（贝塞尔曲线）

import * as Phaser from 'phaser';

export class ConnectionWire {
  public graphics: Phaser.GameObjects.Graphics;
  public fromPortId: string;
  public toPortId: string;
  public fromNodeId: string;
  public toNodeId: string;
  private startX: number;
  private startY: number;
  private endX: number;
  private endY: number;

  constructor(
    scene: Phaser.Scene,
    fromNodeId: string,
    fromPortId: string,
    toNodeId: string,
    toPortId: string,
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ) {
    this.fromNodeId = fromNodeId;
    this.fromPortId = fromPortId;
    this.toNodeId = toNodeId;
    this.toPortId = toPortId;
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;

    this.graphics = scene.add.graphics();
    this.draw();
  }

  private draw() {
    this.graphics.clear();
    this.graphics.lineStyle(2.5, 0x06b6d4, 0.7);

    // 贝塞尔曲线
    const cx1 = this.startX + (this.endX - this.startX) * 0.4;
    const cy1 = this.startY;
    const cx2 = this.startX + (this.endX - this.startX) * 0.6;
    const cy2 = this.endY;

    const steps = 30;
    for (let i = 0; i < steps; i++) {
      const t1 = i / steps;
      const t2 = (i + 1) / steps;

      const x1 = cubicBezier(this.startX, cx1, cx2, this.endX, t1);
      const y1 = cubicBezier(this.startY, cy1, cy2, this.endY, t1);
      const x2 = cubicBezier(this.startX, cx1, cx2, this.endX, t2);
      const y2 = cubicBezier(this.startY, cy1, cy2, this.endY, t2);

      this.graphics.lineBetween(x1, y1, x2, y2);
    }

    // 端口圆点
    this.graphics.fillStyle(0x06b6d4, 0.9);
    this.graphics.fillCircle(this.startX, this.startY, 4);
    this.graphics.fillStyle(0x10b981, 0.9);
    this.graphics.fillCircle(this.endX, this.endY, 4);
  }

  destroy() {
    this.graphics.destroy();
  }
}

function cubicBezier(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}
