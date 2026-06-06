// Phaser.Game 配置工厂

import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/lib/constants';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { GameplayScene } from './scenes/GameplayScene';
import { BossGameplayScene } from './scenes/BossGameplayScene';

export function createGameConfig(
  parent: HTMLDivElement
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent,
    backgroundColor: '#1a1814',
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: true,
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, PreloadScene, GameplayScene, BossGameplayScene],
  };
}
