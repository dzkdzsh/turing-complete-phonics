// ConnectionSystem —— Era 2 节点连线系统

import * as Phaser from 'phaser';
import { ConnectionWire } from '../objects/ConnectionWire';
import { BlenderNode, BlenderPort } from '../objects/BlenderNode';
import { SoundCreature } from '../objects/SoundCreature';
import { eventBus } from '../event-bus';
import { GameEvents } from '@/types/events';

export class ConnectionSystem {
  private scene: Phaser.Scene;
  private wires: ConnectionWire[] = [];
  private sourceNodes: Map<string, SoundCreature> = new Map();
  private blenderNodes: Map<string, BlenderNode> = new Map();
  private tempLine: Phaser.GameObjects.Graphics | null = null;
  private isConnecting = false;
  private connectStart: { x: number; y: number; nodeId: string; portId: string } | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupInput();
  }

  registerSource(node: SoundCreature) {
    this.sourceNodes.set(node.objectId, node);
  }

  registerBlender(node: BlenderNode) {
    this.blenderNodes.set(node.objectId, node);
  }

  private setupInput() {
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // 检查是否点击了某个 blender 的输入端口
      for (const [, blender] of this.blenderNodes) {
        const port = blender.findInputPortAt(pointer.worldX, pointer.worldY);
        if (port) {
          this.startConnection(blender.objectId, port.portId, pointer.worldX, pointer.worldY);
          return;
        }
      }

      // 检查是否点击了某个 sound creature 的输出端口
      for (const [, node] of this.sourceNodes) {
        const dist = Math.sqrt(
          (pointer.worldX - (node.x + 30)) ** 2 + (pointer.worldY - node.y) ** 2
        );
        if (dist < 15) {
          const outPortId = `${node.objectId}_out`;
          this.startConnection(node.objectId, outPortId, node.x + 30, node.y);
          return;
        }
      }
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isConnecting && this.tempLine) {
        this.tempLine.clear();
        this.tempLine.lineStyle(2, 0x06b6d4, 0.5);
        this.tempLine.lineBetween(
          this.connectStart!.x,
          this.connectStart!.y,
          pointer.worldX,
          pointer.worldY
        );
      }
    });

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.isConnecting) return;

      // 检查是否松在某个 blender 的输入端口上
      for (const [, blender] of this.blenderNodes) {
        const port = blender.findInputPortAt(pointer.worldX, pointer.worldY);
        if (port) {
          this.completeConnection(blender.objectId, port.portId);
          return;
        }
      }

      this.cancelConnection();
    });
  }

  private startConnection(nodeId: string, portId: string, x: number, y: number) {
    this.isConnecting = true;
    this.connectStart = { x, y, nodeId, portId };
    this.tempLine = this.scene.add.graphics();
  }

  private completeConnection(targetNodeId: string, targetPortId: string) {
    if (!this.connectStart) return;

    // 查找源节点
    const sourceNode = this.sourceNodes.get(this.connectStart.nodeId);
    if (!sourceNode) return;

    // 查找目标 blender
    const blender = this.blenderNodes.get(targetNodeId);
    if (!blender) return;

    // 连接音素到端口
    const success = blender.connectPhoneme(targetPortId, (sourceNode as SoundCreature).phoneme);
    if (!success) {
      this.cancelConnection();
      return;
    }

    // 获取目标端口位置
    const targetPos = blender.getPortWorldPos(targetPortId);
    if (!targetPos) return;

    // 创建连线
    const wire = new ConnectionWire(
      this.scene,
      this.connectStart.nodeId,
      this.connectStart.portId,
      targetNodeId,
      targetPortId,
      sourceNode.x + 30,
      sourceNode.y,
      targetPos.x,
      targetPos.y
    );
    this.wires.push(wire);

    // 清理
    this.tempLine?.destroy();
    this.tempLine = null;
    this.isConnecting = false;
    this.connectStart = null;

    // 检查是否所有 blender 都已完成连接
    this.checkWinCondition();
  }

  private cancelConnection() {
    this.tempLine?.destroy();
    this.tempLine = null;
    this.isConnecting = false;
    this.connectStart = null;
  }

  private checkWinCondition() {
    let allDone = true;
    for (const [, blender] of this.blenderNodes) {
      if (!blender.isFullyConnected()) {
        allDone = false;
        break;
      }
    }

    if (allDone && this.blenderNodes.size > 0) {
      // 如果配置中指定了 target_blend_achieved，这里简单处理：全部填满即胜利
      // 更细的匹配由 WinConditionSystem 处理
      this.scene.time.delayedCall(800, () => {
        eventBus.emit(GameEvents.PHONEME_DETECTED, {
          phoneme: Array.from(this.blenderNodes.values())[0].getConnectedPhonemes().join(''),
          confidence: 1.0,
        });
      });
    }
  }

  areAllBlendersConnected(): boolean {
    if (this.blenderNodes.size === 0) return false;
    for (const [, blender] of this.blenderNodes) {
      if (!blender.isFullyConnected()) return false;
    }
    return this.wires.length > 0;
  }

  getWires(): ConnectionWire[] {
    return this.wires;
  }
}
