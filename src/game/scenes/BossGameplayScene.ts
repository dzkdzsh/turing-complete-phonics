// BossGameplayScene —— Boss 关场景（集成麦克风音素验证 + 快照恢复）

import * as Phaser from 'phaser';
import { SCENES } from '@/lib/constants';
import { GameplayScene } from './GameplayScene';
import { GameEvents } from '@/types/events';
import type { LevelConfig } from '@/types/level';
import { eventBus } from '../event-bus';
import { MicrophoneInput } from '../input/MicrophoneInput';
import { PhonemeAnalyzer } from '../input/PhonemeAnalyzer';
import { AudioManager } from '../audio/AudioManager';
import { Resonator } from '../objects/Resonator';

export class BossGameplayScene extends GameplayScene {
  private mic: MicrophoneInput | null = null;
  private analyzer: PhonemeAnalyzer | null = null;
  private currentTarget: string | null = null;
  private requiredPhonemes: string[] = [];
  private statusText: Phaser.GameObjects.Text | null = null;
  private crystalLights: Map<string, Phaser.GameObjects.Graphics> = new Map();

  constructor() {
    super(SCENES.BOSS_GAMEPLAY);
  }

  init(data: { levelConfig: LevelConfig }) {
    super.init(data);
  }

  create() {
    if (!this.levelConfig) return;
    super.create();

    this.requiredPhonemes = this.levelConfig.winCondition.requiredPhonemes || ['m', 's', 'a'];
    this.mic = new MicrophoneInput();
    this.analyzer = new PhonemeAnalyzer();

    const { width } = this.scale;
    this.add.text(width / 2, 56, '★ 声音大师试炼 ★', {
      fontSize: '18px', color: '#e64980', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this.statusText = this.add.text(width / 2, 82, '点击一颗水晶开始', {
      fontSize: '14px', color: '#c9a96e', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this.createCrystalLights();
    this.bindCrystalClicks();

    eventBus.on(GameEvents.MIC_START, () => this.startMicForNext());
    eventBus.on(GameEvents.MIC_STOP, () => this.mic?.stop());

    // 恢复 Boss 关快照
    if (this.completedPhonemes.length > 0) {
      for (const p of this.completedPhonemes) this.lightCrystal(p);
      this.showStatus(`已恢复 ${this.completedPhonemes.length}/${this.requiredPhonemes.length} 颗水晶`, '#10b981');
    }
  }

  private createCrystalLights() {
    for (const obj of this.gameObjects) {
      if (obj instanceof Resonator && obj.isCrystal && obj.phoneme) {
        const gfx = this.add.graphics();
        gfx.fillStyle(0x444466, 0.2);
        gfx.fillCircle(obj.x, obj.y, 40);
        this.crystalLights.set(obj.phoneme, gfx);
      }
    }
  }

  private bindCrystalClicks() {
    for (const obj of this.gameObjects) {
      if (obj instanceof Resonator && obj.isCrystal && obj.phoneme) {
        obj.removeAllListeners('pointerdown');
        obj.setInteractive({ cursor: 'pointer' });
        obj.on('pointerdown', () => this.onCrystalClick(obj.phoneme, obj.objectId));
      }
    }
  }

  private onCrystalClick(phoneme: string, objectId: string) {
    if (this.completedPhonemes.includes(phoneme)) {
      this.showStatus(`/"${phoneme}"/水晶已激活 ✓ 试试下一颗`, '#10b981');
      return;
    }
    this.currentTarget = phoneme;
    this.showStatus(`🎤 请对着麦克风说 /${phoneme}/ ...`, '#e64980');
    this.mic?.start().then(() => {
      this.mic!.startListening((freq, time) => {
        const result = this.analyzer!.analyze(freq, time);
        if (result && result.phoneme === this.currentTarget && result.confidence > 0.55) {
          this.onPhonemeMatched(result.phoneme);
        }
      });
    }).catch(() => {
      this.showStatus('麦克风启动失败！请允许浏览器使用麦克风权限', '#ef4444');
    });
  }

  private onPhonemeMatched(phoneme: string) {
    this.mic?.stop();
    if (!this.completedPhonemes.includes(phoneme)) {
      this.completedPhonemes.push(phoneme);
    }
    this.currentTarget = null;

    const resonator = this.gameObjects.find(
      (o) => o instanceof Resonator && o.phoneme === phoneme
    ) as Resonator | undefined;
    if (resonator) resonator.activate(phoneme);

    this.lightCrystal(phoneme);
    AudioManager.getInstance().playSFX('success');
    eventBus.emit(GameEvents.PHONEME_DETECTED, { phoneme, confidence: 0.9 });

    if (this.completedPhonemes.length >= this.requiredPhonemes.length) {
      this.showStatus('✨ 全部水晶激活！你是真正的音素大师！', '#10b981');
      this.time.delayedCall(1500, () => {
        eventBus.emit(GameEvents.WIN_CONDITION_MET, {
          levelId: this.levelConfig.levelId, stars: 3, timeSec: 0,
        });
      });
    } else {
      const remaining = this.requiredPhonemes.filter((p) => !this.completedPhonemes.includes(p));
      this.showStatus(`成功！还剩 ${remaining.length} 颗水晶`, '#10b981');
    }
  }

  private lightCrystal(phoneme: string) {
    const light = this.crystalLights.get(phoneme);
    if (light) {
      light.clear();
      light.fillStyle(0x10b981, 0.5);
      const resonator = this.gameObjects.find(
        (o) => o instanceof Resonator && o.phoneme === phoneme
      ) as Resonator | undefined;
      light.fillCircle(resonator?.x || 0, resonator?.y || 0, 40);
    }
  }

  private startMicForNext() {
    const next = this.requiredPhonemes.find((p) => !this.completedPhonemes.includes(p));
    if (next) this.onCrystalClick(next, '');
  }

  private showStatus(msg: string, color: string) {
    if (this.statusText) {
      this.statusText.setText(msg);
      this.statusText.setColor(color);
    }
  }
}
