import * as Phaser from 'phaser';
import type { GameObjectDef } from '@/types/level';
import { SoundCreature } from './SoundCreature';
import { Resonator } from './Resonator';
import { TargetZone } from './TargetZone';
import { MouthShapeButton } from './MouthShapeButton';
import { BlenderNode } from './BlenderNode';

export type GameObj = SoundCreature | Resonator | TargetZone | MouthShapeButton | BlenderNode;

export function createGameObject(scene: Phaser.Scene, def: GameObjectDef): GameObj | null {
  switch (def.type) {
    case 'sound_creature':
      return new SoundCreature(scene, def);
    case 'resonator':
      return new Resonator(scene, def);
    case 'target_zone':
    case 'encoding_slot':
      return new TargetZone(scene, def);
    case 'mouth_shape':
      return new MouthShapeButton(scene, def);
    case 'blender':
      return new BlenderNode(scene, def);
    default:
      console.warn(`[GameObjectFactory] 未知对象类型: ${def.type}`);
      return null;
  }
}
