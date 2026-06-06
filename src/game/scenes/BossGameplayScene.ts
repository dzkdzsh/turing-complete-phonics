// BossGameplayScene —— Boss 关场景（频谱分析音素验证）

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

const RECORD_DURATION_MS = 1500;

export class BossGameplayScene extends GameplayScene {
  private mic: MicrophoneInput | null = null;
  private analyzer: PhonemeAnalyzer | null = null;
  private currentTarget: string | null = null;
  private requiredPhonemes: string[] = [];
  private statusText: Phaser.GameObjects.Text | null = null;
  private crystalLights: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private isRecording = false;

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
      fontSize: '18px', color: '#444444', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this.statusText = this.add.text(width / 2, 82, '准备好了！点击水晶开始试炼', {
      fontSize: '14px', color: '#444444', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this.createCrystalLights();
    this.bindCrystalClicks();

    eventBus.on(GameEvents.MIC_START, () => this.startMicForNext());
    eventBus.on(GameEvents.MIC_STOP, () => this.mic?.stop());
  }

  private createCrystalLights() {
    for (const obj of this.gameObjects) {
      if (obj instanceof Resonator && obj.isCrystal && obj.phoneme) {
        const gfx = this.add.graphics();
        gfx.fillStyle(0x1a1a1a, 0.2);
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
        obj.on('pointerdown', () => this.onCrystalClick(obj.phoneme));
      }
    }
  }

  private async onCrystalClick(phoneme: string) {
    if (this.isRecording) return;
    if (this.completedPhonemes.includes(phoneme)) {
      this.showStatus(`/${phoneme}/ 水晶已激活 ✓`, '#0a5c3f');
      return;
    }

    this.currentTarget = phoneme;
    this.showStatus(`🎤 请对着麦克风读 /${phoneme}/ ...`, '#444444');

    try {
      await this.mic!.start();
      this.isRecording = true;

      // Collect frequency frames from browser-native AnalyserNode (fast!)
      const freqFrames: Uint8Array[] = [];
      this.mic!.startListening((freqData) => {
        freqFrames.push(new Uint8Array(freqData));
      });

      // Stop after recording duration
      this.time.delayedCall(RECORD_DURATION_MS, () => {
        if (this.isRecording && this.currentTarget === phoneme) {
          this.mic!.stop();
          this.processFreqFrames(freqFrames, phoneme);
        }
      });
    } catch {
      this.showStatus('麦克风启动失败！请允许浏览器使用麦克风权限', '#7a1a1a');
      this.isRecording = false;
    }
  }

  private processFreqFrames(freqFrames: Uint8Array[], targetPhoneme: string) {
    this.isRecording = false;
    if (!this.analyzer) return;

    if (freqFrames.length < 5) {
      this.showStatus('录音太短，请再试一次', '#f59e0b');
      return;
    }

    // Fast analysis using browser-native FFT data (no custom DFT!)
    const result = this.analyzer.analyzeFreqFrames(freqFrames, 44100, 2048);
    console.log('[Boss] target=/' + targetPhoneme + '/ best=/' + (result?.phoneme || '?') +
      '/ conf=' + ((result?.confidence || 0) * 100).toFixed(0) + '% frames=' + freqFrames.length);

    if (!result || result.confidence < 0.15) {
      this.showStatus('没有检测到清晰的声音，请再试试', '#f59e0b');
      return;
    }

    if (result.phoneme === targetPhoneme && result.confidence > 0.3) {
      this.onPhonemeMatched(targetPhoneme);
    } else if (result.confidence > 0.2) {
      this.showStatus(
        `听起来像 /${result.phoneme}/ 而不是 /${targetPhoneme}/，请重试`,
        '#ef4444'
      );
    } else {
      this.showStatus('不太确定，请再大声/清晰一点', '#f59e0b');
    }
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

    if (this.completedPhonemes.length >= this.requiredPhonemes.length) {
      this.showStatus('✨ 全部水晶激活！你是真正的音素大师！', '#0a5c3f');
      this.time.delayedCall(1500, () => {
        eventBus.emit(GameEvents.WIN_CONDITION_MET, {
          levelId: this.levelConfig.levelId, stars: 3, timeSec: 0,
        });
      });
    } else {
      const remaining = this.requiredPhonemes.filter((p) => !this.completedPhonemes.includes(p));
      this.showStatus(`成功！还剩 ${remaining.length} 颗水晶`, '#0a5c3f');
    }
  }

  private lightCrystal(phoneme: string) {
    const light = this.crystalLights.get(phoneme);
    if (light) {
      light.clear();
      light.fillStyle(0x0a5c3f, 0.6);
      const resonator = this.gameObjects.find(
        (o) => o instanceof Resonator && o.phoneme === phoneme
      ) as Resonator | undefined;
      light.fillCircle(resonator?.x || 0, resonator?.y || 0, 40);
    }
  }

  private startMicForNext() {
    const next = this.requiredPhonemes.find((p) => !this.completedPhonemes.includes(p));
    if (next) this.onCrystalClick(next);
  }

  private showStatus(msg: string, color: string) {
    if (this.statusText) {
      this.statusText.setText(msg);
      this.statusText.setColor(color);
    }
  }
}
