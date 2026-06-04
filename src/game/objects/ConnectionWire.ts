// ConnectionWire — 图灵完备风格 PCB 走线（贝塞尔曲线 + 数据流动画）

import * as Phaser from 'phaser';

export class ConnectionWire {
  public graphics: Phaser.GameObjects.Graphics;
  public fromPortId: string; public toPortId: string;
  public fromNodeId: string; public toNodeId: string;
  private startX: number; private startY: number;
  private endX: number; private endY: number;
  private flowDots: Phaser.GameObjects.Graphics;
  private flowT: number = 0;

  constructor(scene: Phaser.Scene, fromNodeId: string, fromPortId: string, toNodeId: string, toPortId: string,
    startX: number, startY: number, endX: number, endY: number) {
    this.fromNodeId = fromNodeId; this.fromPortId = fromPortId;
    this.toNodeId = toNodeId; this.toPortId = toPortId;
    this.startX = startX; this.startY = startY;
    this.endX = endX; this.endY = endY;

    // Main trace layer
    this.graphics = scene.add.graphics().setDepth(-1);
    // Flow animation dots layer
    this.flowDots = scene.add.graphics().setDepth(5);
    this.draw();

    // Data flow animation
    scene.tweens.addCounter({
      from: 0, to: 1, duration: 1500, repeat: -1,
      onUpdate: (t) => { this.flowT = t.getValue(); this.drawFlowDot(); },
    });
  }

  private draw() {
    this.graphics.clear();
    // Glow
    this.graphics.lineStyle(4, 0x00e5ff, 0.12);
    const pts = this.getCurvePoints(30);
    for (let i = 0; i < pts.length - 1; i++) this.graphics.lineBetween(pts[i].x, pts[i].y, pts[i+1].x, pts[i+1].y);

    // Main trace
    this.graphics.lineStyle(1.5, 0x00e5ff, 0.65);
    const pts2 = this.getCurvePoints(60);
    for (let i = 0; i < pts2.length - 1; i++) this.graphics.lineBetween(pts2[i].x, pts2[i].y, pts2[i+1].x, pts2[i+1].y);

    // Port dots
    this.graphics.fillStyle(0x00e5ff, 0.9);
    this.graphics.fillCircle(this.startX, this.startY, 4);
    this.graphics.lineStyle(1, 0xffffff, 0.4);
    this.graphics.strokeCircle(this.startX, this.startY, 4);

    this.graphics.fillStyle(0x00e5ff, 0.9);
    this.graphics.fillCircle(this.endX, this.endY, 4);
    this.graphics.lineStyle(1, 0xffffff, 0.4);
    this.graphics.strokeCircle(this.endX, this.endY, 4);
  }

  private drawFlowDot() {
    this.flowDots.clear();
    const pts = this.getCurvePoints(100);
    const idx = Math.floor(this.flowT * (pts.length - 1));
    if (idx < pts.length) {
      this.flowDots.fillStyle(0xffffff, 0.7);
      this.flowDots.fillCircle(pts[idx].x, pts[idx].y, 2.5);
      // Trail
      for (let i = Math.max(0, idx - 5); i < idx; i++) {
        const a = 0.7 * (1 - (idx - i) / 6);
        this.flowDots.fillStyle(0x00e5ff, a);
        this.flowDots.fillCircle(pts[i].x, pts[i].y, 1.5);
      }
    }
  }

  private getCurvePoints(steps: number): {x:number;y:number}[] {
    const cx1 = this.startX + (this.endX - this.startX) * 0.4;
    const cx2 = this.startX + (this.endX - this.startX) * 0.6;
    const pts: {x:number;y:number}[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      pts.push({ x: cubic(this.startX, cx1, cx2, this.endX, t), y: cubic(this.startY, this.startY, this.endY, this.endY, t) });
    }
    return pts;
  }

  destroy() { this.graphics.destroy(); this.flowDots.destroy(); }
}

function cubic(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const u = 1 - t; return u*u*u*p0 + 3*u*u*t*p1 + 3*u*t*t*p2 + t*t*t*p3;
}
