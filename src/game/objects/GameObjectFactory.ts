// GameObjectFactory —— 根据关卡配置创建游戏对象

import * as Phaser from 'phaser';
import type { GameObjectDef } from '@/types/level';
import { SoundCreature } from './SoundCreature';
import { Resonator } from './Resonator';
import { TargetZone } from './TargetZone';

export function createGameObject(
  scene: Phaser.Scene,
  def: GameObjectDef
): SoundCreature | Resonator | TargetZone | null {
  switch (def.type) {
    case 'sound_creature':
      return new SoundCreature(scene, def);

    case 'resonator':
      return new Resonator(scene, def);

    case 'target_zone':
    case 'encoding_slot':
      return new TargetZone(scene, def);

    default:
      console.warn(`[GameObjectFactory] 未知对象类型: ${def.type}`);
      return null;
  }
}
