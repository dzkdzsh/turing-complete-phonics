// BossGameplayScene —— Boss 关场景（wav2vec2 AI 音素验证 + FFT 降级）

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
import { Wav2vec2ModelLoader } from '../input/Wav2vec2ModelLoader';
import { Wav2vec2Analyzer } from '../input/Wav2vec2Analyzer';
import { AudioBufferRecorder } from '../input/AudioBufferRecorder';
import { isDirectMapped } from '../input/PhonemeTokenMap';

export class BossGameplayScene extends GameplayScene {
  private mic: MicrophoneInput | null = null;
  private fftAnalyzer: PhonemeAnalyzer | null = null;
  private w2vAnalyzer: Wav2vec2Analyzer | null = null;
  private currentTarget: string | null = null;
  private requiredPhonemes: string[] = [];
  private statusText: Phaser.GameObjects.Text | null = null;
  private crystalLights: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private modelReady = false;

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
    this.fftAnalyzer = new PhonemeAnalyzer();

    const { width } = this.scale;
    this.add.text(width / 2, 56, '★ 声音大师试炼 ★', {
      fontSize: '18px', color: '#e64980', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this.statusText = this.add.text(width / 2, 82, '', {
      fontSize: '14px', color: '#c9a96e', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this.createCrystalLights();
    this.bindCrystalClicks();

    eventBus.on(GameEvents.MIC_START, () => this.startMicForNext());
    eventBus.on(GameEvents.MIC_STOP, () => this.mic?.stop());

    // 预加载 wav2vec2 模型
    this.statusText.setText('正在唤醒语音引擎...');
    Wav2vec2ModelLoader.getInstance().ensureLoaded((pct: number) => {
      if (this.statusText) {
        this.statusText.setText(`语音引擎加载中... ${Math.round(pct * 100)}%`);
      }
    }).then(() => {
      this.w2vAnalyzer = new Wav2vec2Analyzer(Wav2vec2ModelLoader.getInstance());
      this.modelReady = true;
      if (this.statusText) {
        this.statusText.setText('准备好了！点击水晶开始试炼');
      }
    }).catch(() => {
      this.w2vAnalyzer = null;
      this.modelReady = false;
      if (this.statusText) {
        this.statusText.setText('离线模式：点击水晶开始');
      }
    });
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

  private async onCrystalClick(phoneme: string, objectId: string) {
    if (this.completedPhonemes.includes(phoneme)) {
      this.showStatus(`/${phoneme}/水晶已激活 ✓ 试试下一颗`, '#10b981');
      return;
    }

    // 模型已就绪且该音素有直接 token 映射 → 走 wav2vec2 路径
    if (this.w2vAnalyzer?.isReady && isDirectMapped(phoneme)) {
      this.currentTarget = phoneme;
      this.showStatus(`🎤 请对着麦克风说 /${phoneme}/ ...`, '#e64980');

      try {
        await this.mic!.start();
        const recorder = new AudioBufferRecorder(1.5, 44100);

        this.mic!.startListening((_freq, timeData) => {
          recorder.append(timeData);
          if (recorder.isFull()) {
            this.mic!.stop();
            this.processRecording(recorder.getData(), phoneme);
          }
        });
      } catch {
        this.showStatus('麦克风启动失败！请允许浏览器使用麦克风权限', '#ef4444');
      }
    } else {
      // 回退到 FFT 模式
      this.fallbackToFFTAnalysis(phoneme);
    }
  }

  /** wav2vec2 分析路径 */
  private async processRecording(audio: Float32Array, targetPhoneme: string) {
    if (!this.w2vAnalyzer) { this.fallbackToFFTAnalysis(targetPhoneme); return; }

    const result = await this.w2vAnalyzer.analyze(audio, 44100, targetPhoneme);

    if (result.isCorrect && result.confidence > 0.4) {
      this.onPhonemeMatched(targetPhoneme);
    } else if (result.confidence < 0.2) {
      this.showStatus('没有检测到清晰的声音，请再试试', '#f59e0b');
      this.delayedResetCrystal();
    } else {
      this.showStatus(
        `听起来像 /${result.bestGuess}/ 而不是 /${targetPhoneme}/，请再试一次`,
        '#ef4444'
      );
      this.delayedResetCrystal();
    }
  }

  /** FFT 降级路径（原有逻辑） */
  private fallbackToFFTAnalysis(phoneme: string) {
    if (this.completedPhonemes.includes(phoneme)) {
      this.showStatus(`/${phoneme}/水晶已激活 ✓ 试试下一颗`, '#10b981');
      return;
    }
    this.currentTarget = phoneme;
    this.showStatus(`🎤 请对着麦克风说 /${phoneme}/ ...`, '#e64980');
    this.mic?.start().then(() => {
      this.mic!.startListening((freq, time) => {
        const result = this.fftAnalyzer!.analyze(freq, time);
        if (result && result.phoneme === this.currentTarget && result.confidence > 0.55) {
          this.onPhonemeMatched(result.phoneme);
        }
      });
    }).catch(() => {
      this.showStatus('麦克风启动失败！请允许浏览器使用麦克风权限', '#ef4444');
    });
  }

  private delayedResetCrystal() {
    this.time.delayedCall(2000, () => {
      this.currentTarget = null;
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
