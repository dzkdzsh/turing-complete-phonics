import { randomDarkFill } from './DarkFills';
// BlenderNode —— Era 2 声音合成器：多个输入端口，接收连线后合成声音

import * as Phaser from 'phaser';
import type { GameObjectDef, ConnectorPortDef } from '@/types/level';
import { AudioManager } from '../audio/AudioManager';

export interface BlenderPort {
  portId: string;
  direction: 'input' | 'output';
  relativeX: number;
  relativeY: number;
  acceptedPhonemes: string[];
  connectedPhoneme: string | null;
  graphic: Phaser.GameObjects.Ellipse;
}

export class BlenderNode extends Phaser.GameObjects.Container {
  public objectId: string;
  public phoneme = '';
  public ports: BlenderPort[] = [];

  private bgRect: Phaser.GameObjects.Rectangle;
  private core: Phaser.GameObjects.Ellipse;
  private label: Phaser.GameObjects.Text;
  private outputLabel: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, def: GameObjectDef) {
    const x = def.position.x;
    const y = def.position.y;
    super(scene, x, y);

    this.objectId = def.id;

    // 外层框
    this.bgRect = scene.add.rectangle(0, 0, 120, 100, randomDarkFill(), 0.8);
    this.bgRect.setStrokeStyle(2, 0x555555, 0.4);
    this.add(this.bgRect);

    // 核心
    this.core = scene.add.ellipse(0, 0, 40, 40, 0x555555, 0.3);
    this.core.setStrokeStyle(1, 0x555555, 0.6);
    this.add(this.core);

    // 标签
    this.label = scene.add.text(0, -55, def.label || '合成器', {
      fontSize: '12px',
      color: '#555555',
      fontFamily: 'sans-serif',
      align: 'center',
    });
    this.label.setOrigin(0.5, 0);
    this.add(this.label);

    // 输出文字
    this.outputLabel = scene.add.text(0, 55, '输出', {
      fontSize: '10px',
      color: '#555',
      fontFamily: 'sans-serif',
    });
    this.outputLabel.setOrigin(0.5, 0);
    this.add(this.outputLabel);

    // 创建端口
    this.createPorts(scene, def);
    this.setSize(140, 120);
    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
  }

  private createPorts(scene: Phaser.Scene, def: GameObjectDef) {
    if (!def.ports) return;

    for (const portDef of def.ports) {
      const port: BlenderPort = {
        portId: portDef.id,
        direction: portDef.direction,
        relativeX: portDef.position.x,
        relativeY: portDef.position.y,
        acceptedPhonemes: portDef.acceptedPhonemes || [],
        connectedPhoneme: null,
        graphic: scene.add.ellipse(
          this.x + portDef.position.x,
          this.y + portDef.position.y,
          14,
          14,
          portDef.direction === 'input' ? 0x555555 : 0x10b981,
          0.7
        ),
      };

      if (portDef.direction === 'input') {
        port.graphic.setInteractive({ cursor: 'pointer' });
      }
      this.ports.push(port);
    }
  }

  /** 获取端口的世界坐标 */
  getPortWorldPos(portId: string): { x: number; y: number } | null {
    const port = this.ports.find((p) => p.portId === portId);
    if (!port) return null;
    return {
      x: this.x + port.relativeX,
      y: this.y + port.relativeY,
    };
  }

  /** 查找指定屏幕位置上的输入端口 */
  findInputPortAt(worldX: number, worldY: number): BlenderPort | null {
    for (const port of this.ports) {
      if (port.direction !== 'input') continue;
      const px = this.x + port.relativeX;
      const py = this.y + port.relativeY;
      const dist = Math.sqrt((worldX - px) ** 2 + (worldY - py) ** 2);
      if (dist < 20) return port;
    }
    return null;
  }

  /** 连接音素到指定端口 */
  connectPhoneme(portId: string, phoneme: string): boolean {
    const port = this.ports.find((p) => p.portId === portId);
    if (!port) return false;

    if (port.acceptedPhonemes.length > 0 && !port.acceptedPhonemes.includes(phoneme)) {
      return false;
    }

    port.connectedPhoneme = phoneme;
    port.graphic.setFillStyle(0x10b981, 0.9);

    // 脉冲动画
    this.scene.tweens.add({
      targets: port.graphic,
      scaleX: 1.6,
      scaleY: 1.6,
      yoyo: true,
      duration: 200,
    });

    // 检查是否所有输入都已连接
    this.checkAllConnected();
    return true;
  }

  private checkAllConnected() {
    const inputPorts = this.ports.filter((p) => p.direction === 'input');
    const allConnected = inputPorts.every((p) => p.connectedPhoneme !== null);

    if (allConnected) {
      // 激活合成器
      this.scene.tweens.add({
        targets: this.core,
        fillAlpha: 0.7,
        scaleX: 1.4,
        scaleY: 1.4,
        duration: 400,
        ease: 'Back.easeOut',
      });
      this.bgRect.setStrokeStyle(2, 0x10b981, 0.8);

      // 播放合成音
      const phonemes = inputPorts.map((p) => p.connectedPhoneme!).join('');
      const blendId = phonemes;

      // 如果存在对应的合成音频（如 ma、sa、kat），播放它
      const knownBlends = ['ma', 'sa', 'kat'];
      if (knownBlends.includes(blendId)) {
        AudioManager.getInstance().playBlend(blendId);
      } else {
        // 否则顺序播放每个音素
        for (let i = 0; i < inputPorts.length; i++) {
          setTimeout(() => {
            AudioManager.getInstance().playPhoneme(inputPorts[i].connectedPhoneme!);
          }, i * 300);
        }
      }

      // 显示合成结果
      this.outputLabel.setText(blendId);
      this.outputLabel.setColor('#10b981');
    }
  }

  /** 是否所有输入端口已连接 */
  isFullyConnected(): boolean {
    const inputPorts = this.ports.filter((p) => p.direction === 'input');
    return inputPorts.length > 0 && inputPorts.every((p) => p.connectedPhoneme !== null);
  }

  /** 获取已连接的音素列表（按端口顺序） */
  getConnectedPhonemes(): string[] {
    return this.ports
      .filter((p) => p.direction === 'input')
      .map((p) => p.connectedPhoneme)
      .filter((p): p is string => p !== null);
  }
}
