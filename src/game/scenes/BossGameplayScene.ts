// BossGameplayScene —— Boss 关场景（集成麦克风验证）

import { SCENES } from '@/lib/constants';
import { GameplayScene } from './GameplayScene';

export class BossGameplayScene extends GameplayScene {
  constructor() {
    super();
    // 覆写场景键名
    Object.assign(this, { scene: { key: SCENES.BOSS_GAMEPLAY } });
  }

  create() {
    super.create();

    // Boss 关特有的麦克风 UI 提示
    const { width } = this.scale;
    this.add
      .text(width / 2, 80, '[麦克风试炼] 请用你的声音来证明！', {
        fontSize: '16px',
        color: '#e64980',
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);
  }
}
