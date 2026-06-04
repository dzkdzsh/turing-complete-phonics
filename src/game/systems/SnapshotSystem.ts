// SnapshotSystem —— 关卡快照：收集场景状态并序列化

import type { SoundCreature } from '../objects/SoundCreature';
import type { Resonator } from '../objects/Resonator';
import type { TargetZone } from '../objects/TargetZone';
import type { MouthShapeButton } from '../objects/MouthShapeButton';
import type { AlphabetTile } from '../objects/AlphabetTile';
import type { BlenderNode } from '../objects/BlenderNode';
import { ConnectionSystem } from './ConnectionSystem';

export interface ObjectState {
  x?: number;
  y?: number;
  isActivated?: boolean;
  isFilled?: boolean;
  isRevealed?: boolean;
  hasBeenClicked?: boolean;
}

export interface LevelSnapshotData {
  objects: Record<string, ObjectState>;
  connections: { fromNodeId: string; fromPortId: string; toNodeId: string; toPortId: string }[];
  blenderPorts: Record<string, Record<string, { connectedPhoneme: string | null }>>;
  completedPhonemes: string[];
  elapsedSec: number;
  attemptCount: number;
}

export class SnapshotSystem {
  /** 从场景收集快照 */
  static capture(config: {
    gameObjects: unknown[];
    connectionSystem?: ConnectionSystem;
    completedPhonemes?: string[];
    elapsedSec?: number;
    attemptCount?: number;
  }): LevelSnapshotData {
    const objects: Record<string, ObjectState> = {};

    for (const obj of config.gameObjects) {
      const id = (obj as { objectId?: string }).objectId;
      if (!id) continue;

      const state: ObjectState = {};

      // 位置
      if ('x' in (obj as Record<string, unknown>) && 'y' in (obj as Record<string, unknown>)) {
        state.x = (obj as { x: number }).x;
        state.y = (obj as { y: number }).y;
      }

      // 各类型特定状态
      if ('isActivated' in (obj as Record<string, unknown>)) {
        state.isActivated = (obj as Resonator).isActivated;
      }
      if ('isFilled' in (obj as Record<string, unknown>)) {
        state.isFilled = (obj as TargetZone).isFilled;
      }
      if ('isRevealed' in (obj as Record<string, unknown>)) {
        state.isRevealed = (obj as AlphabetTile).isRevealed;
      }
      if ('hasBeenClicked' in (obj as Record<string, unknown>)) {
        state.hasBeenClicked = (obj as MouthShapeButton).hasBeenClicked;
      }

      objects[id] = state;
    }

    // 连线
    const connections: LevelSnapshotData['connections'] = [];
    const blenderPorts: LevelSnapshotData['blenderPorts'] = {};

    if (config.connectionSystem) {
      for (const wire of config.connectionSystem.getWires()) {
        connections.push({
          fromNodeId: wire.fromNodeId,
          fromPortId: wire.fromPortId,
          toNodeId: wire.toNodeId,
          toPortId: wire.toPortId,
        });
      }

      // Blender 端口状态
      for (const obj of config.gameObjects) {
        if ('ports' in (obj as Record<string, unknown>) && 'getConnectedPhonemes' in (obj as Record<string, unknown>)) {
          const blender = obj as BlenderNode;
          const portMap: Record<string, { connectedPhoneme: string | null }> = {};
          for (const port of blender.ports) {
            portMap[port.portId] = { connectedPhoneme: port.connectedPhoneme };
          }
          if (Object.keys(portMap).length > 0) {
            blenderPorts[blender.objectId] = portMap;
          }
        }
      }
    }

    return {
      objects,
      connections,
      blenderPorts,
      completedPhonemes: config.completedPhonemes || [],
      elapsedSec: config.elapsedSec || 0,
      attemptCount: config.attemptCount || 0,
    };
  }
}
