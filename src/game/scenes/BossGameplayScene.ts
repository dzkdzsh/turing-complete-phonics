// BossGameplayScene —— Boss 关场景（集成麦克风音素验证）

import * as Phaser from 'phaser';
import { SCENES } from '@/lib/constants';
import { GameplayScene } from './GameplayScene';
import { GameEvents } from '@/types/events';
import type { LevelConfig } from '@/types/level';
import { eventBus } from '../event-bus';
import { MicrophoneInput } from '../input/MicrophoneInput';
import { PhonemeAnalyzer } from '../input/PhonemeAnalyzer';
import { AudioManager } from '../audio/AudioManager';

export class BossGameplayScene extends GameplayScene {
  private mic: MicrophoneInput | null = null;
  private analyzer: PhonemeAnalyzer | null = null;
  private currentTarget: string | null = null;
  private requiredPhonemes: string[] = [];
  private completedPhonemes: Set<string> = new Set();
  private statusText: Phaser.GameObjects.Text | null = null;
  private crystalLights: Map<string, Phaser.GameObjects.Graphics> = new Map();

  constructor() {
    super(SCENES.BOSS_GAMEPLAY);
  }

  init(data: { levelConfig: LevelConfig }) {
    super.init(data);
  }

  create() {
    // 防御：如果 config 未正确传递，不执行
    if (!this.levelConfig) {
      console.error('[BossGameplayScene] levelConfig 未定义');
      return;
    }

    super.create();

    this.requiredPhonemes = this.levelConfig.winCondition.requiredPhonemes || [];
    if (!this.requiredPhonemes.length) {
      this.requiredPhonemes = ['m', 's', 'a'];
    }

    this.mic = new MicrophoneInput();
    this.analyzer = new PhonemeAnalyzer();

    const { width } = this.scale;

    // Boss 关卡标题
    this.add
      .text(width / 2, 60, '★ 声音大师试炼 ★', {
        fontSize: '20px',
        color: '#e64980',
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);

    // 状态指示
    this.statusText = this.add
      .text(width / 2, 90, '点击一颗水晶开始', {
        fontSize: '14px',
        color: '#c9a96e',
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);

    // 为每个水晶创建发光指示器
    this.createCrystalLights();

    // 监听麦克风状态
    eventBus.on(GameEvents.MIC_START, () => this.startMicForNext());
    eventBus.on(GameEvents.MIC_STOP, () => this.mic?.stop());

    // 水晶点击事件（通过 Resonator 的点击）—— 在 spawnObjects 后绑定
    this.time.delayedCall(100, () => this.bindCrystalClicks());
  }

  private createCrystalLights() {
    for (const obj of this.levelConfig.gameObjects) {
      if (obj.type === 'resonator' && obj.phoneme) {
        const gfx = this.add.graphics();
        gfx.fillStyle(0x444444, 0.3);
        gfx.fillCircle(obj.position.x, obj.position.y, 35);
        this.crystalLights.set(obj.phoneme, gfx);
      }
    }
  }

  private bindCrystalClicks() {
    // 找到场景中的 Resonator 对象并绑定点击
    for (const child of this.children.list) {
      if (child instanceof Phaser.GameObjects.Container && 'objectId' in child) {
        const obj = child as unknown as { objectId: string; phoneme?: string };
        if (obj.phoneme && this.requiredPhonemes.includes(obj.phoneme)) {
          child.removeAllListeners('pointerdown');
          child.setInteractive({ cursor: 'pointer' });
          child.on('pointerdown', () => this.onCrystalClick(obj.phoneme!, obj.objectId));
        }
      }
    }
  }

  private onCrystalClick(phoneme: string, objectId: string) {
    if (this.completedPhonemes.has(phoneme)) {
      this.showStatus(`水晶 "${phoneme}" 已激活！试试下一个`, '#10b981');
      return;
    }

    this.currentTarget = phoneme;
    this.showStatus(`请对着麦克风说 /${phoneme}/ ...`, '#e64980');

    this.mic
      ?.start()
      .then(() => {
        this.mic!.startListening((freq, time) => {
          const result = this.analyzer!.analyze(freq, time);
          if (result && result.phoneme === this.currentTarget && result.confidence > 0.55) {
            this.onPhonemeMatched(result.phoneme);
          }
        });
      })
      .catch(() => {
        this.showStatus('麦克风启动失败，请检查权限', '#ef4444');
      });
  }

  private onPhonemeMatched(phoneme: string) {
    this.mic?.stop();
    this.completedPhonemes.add(phoneme);
    this.currentTarget = null;

    // 点亮水晶
    const light = this.crystalLights.get(phoneme);
    if (light) {
      light.clear();
      light.fillStyle(0x10b981, 0.6);
      light.fillCircle(
        this.levelConfig.gameObjects.find((o) => o.phoneme === phoneme)?.position.x || 0,
        this.levelConfig.gameObjects.find((o) => o.phoneme === phoneme)?.position.y || 0,
        35
      );
      this.tweens.add({
        targets: light,
        alpha: { from: 1, to: 0.5 },
        duration: 600,
        yoyo: true,
        repeat: 2,
      });
    }

    AudioManager.getInstance().playSFX('success');

    eventBus.emit(GameEvents.PHONEME_DETECTED, { phoneme, confidence: 0.9 });

    // 检查是否全部完成
    if (this.completedPhonemes.size >= this.requiredPhonemes.length) {
      this.showStatus('全部水晶激活！太棒了！', '#10b981');
      this.time.delayedCall(1200, () => {
        eventBus.emit(GameEvents.WIN_CONDITION_MET, {
          levelId: this.levelConfig.levelId,
          stars: 3,
          timeSec: 0,
        });
      });
    } else {
      const remaining = this.requiredPhonemes.filter((p) => !this.completedPhonemes.has(p));
      this.showStatus(`成功！还剩 ${remaining.length} 颗水晶`, '#10b981');
    }
  }

  private startMicForNext() {
    const next = this.requiredPhonemes.find((p) => !this.completedPhonemes.has(p));
    if (next) {
      this.onCrystalClick(next, '');
    }
  }

  private showStatus(msg: string, color: string) {
    if (this.statusText) {
      this.statusText.setText(msg);
      this.statusText.setColor(color);
    }
  }
}
