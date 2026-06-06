// BossGameplayScene —— Boss 关场景（集成麦克风音素验证 + wav2vec2 AI 评分）

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
  private analyzer: PhonemeAnalyzer | null = null;
  private wav2vec2Analyzer: Wav2vec2Analyzer | null = null;
  private modelLoader: Wav2vec2ModelLoader;
  private currentTarget: string | null = null;
  private requiredPhonemes: string[] = [];
  private statusText: Phaser.GameObjects.Text | null = null;
  private crystalLights: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private useAI = false;

  constructor() {
    super(SCENES.BOSS_GAMEPLAY);
    this.modelLoader = Wav2vec2ModelLoader.getInstance();
  }

  init(data: { levelConfig: LevelConfig }) {
    super.init(data);
  }

  create() {
    if (!this.levelConfig) return;
    super.create();

    this.requiredPhonemes = this.levelConfig.winCondition.requiredPhonemes || ['m', 's', 'a'];
    this.mic = new MicrophoneInput();
    this.analyzer = new PhonemeAnalyzer(); // FFT fallback

    const { width, height } = this.scale;
    this.add.text(width / 2, 56, '★ 声音大师试炼 ★', {
      fontSize: '18px', color: '#444444', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this.statusText = this.add.text(width / 2, 82, '正在唤醒语音引擎...', {
      fontSize: '14px', color: '#444444', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this.createCrystalLights();
    this.bindCrystalClicks();

    eventBus.on(GameEvents.MIC_START, () => this.startMicForNext());
    eventBus.on(GameEvents.MIC_STOP, () => this.mic?.stop());

    // 预加载 wav2vec2 模型
    this.preloadModel();
  }

  private async preloadModel() {
    try {
      await this.modelLoader.ensureLoaded((pct: number) => {
        if (this.statusText && pct < 1) {
          this.statusText.setText(`语音引擎加载中... ${Math.round(pct * 100)}%`);
        }
      });
      this.wav2vec2Analyzer = new Wav2vec2Analyzer(this.modelLoader);
      this.useAI = true;
      if (this.statusText) {
        this.statusText.setText('准备好了！点击水晶开始试炼');
      }
    } catch (err) {
      console.warn('[BossGameplay] wav2vec2 model failed to load, using FFT fallback:', err);
      this.useAI = false;
      if (this.statusText) {
        this.statusText.setText('离线模式：点击水晶开始');
      }
    }
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
        obj.on('pointerdown', () => this.onCrystalClick(obj.phoneme, obj.objectId));
      }
    }
  }

  private async onCrystalClick(phoneme: string, _objectId: string) {
    if (this.completedPhonemes.includes(phoneme)) {
      this.showStatus(`/${phoneme}/水晶已激活 ✓ 试试下一颗`, '#0a5c3f');
      return;
    }

    // 模型还在加载中
    if (!this.modelLoader.isLoaded && isDirectMapped(phoneme)) {
      this.showStatus('语音引擎加载中，请稍候...', '#f59e0b');
      return;
    }

    this.currentTarget = phoneme;
    this.showStatus(`🎤 请对着麦克风说 /${phoneme}/ ...`, '#444444');

    try {
      await this.mic!.start();

      if (this.useAI && isDirectMapped(phoneme) && this.wav2vec2Analyzer) {
        // === wav2vec2 AI 模式：缓冲 → 批量分析 ===
        const recorder = new AudioBufferRecorder(1.5, 44100);

        this.mic!.startListening((_freq, timeData) => {
          recorder.append(timeData);
          if (recorder.isFull()) {
            this.mic!.stop();
            this.processAIRecording(recorder.getData(), phoneme);
          }
        });

        // 安全超时：2.5 秒后自动停止
        this.time.delayedCall(2500, () => {
          if (this.mic?.isActive && this.currentTarget === phoneme) {
            this.mic!.stop();
            if (!recorder.isEmpty()) {
              this.processAIRecording(recorder.getData(), phoneme);
            } else {
              this.showStatus('没有检测到声音，请再试试', '#f59e0b');
            }
          }
        });
      } else {
        // === FFT 降级模式 ===
        this.fallbackToFFTAnalysis(phoneme);
      }
    } catch {
      this.showStatus('麦克风启动失败！请允许浏览器使用麦克风权限', '#7a1a1a');
    }
  }

  private async processAIRecording(audio: Float32Array, targetPhoneme: string) {
    if (!this.wav2vec2Analyzer) return;

    const result = await this.wav2vec2Analyzer.analyze(audio, 44100, targetPhoneme);
    if (!result) {
      this.showStatus('分析失败，请重试', '#ef4444');
      return;
    }

    if (result.isSilence) {
      this.showStatus('没有检测到清晰的声音，请再试试', '#f59e0b');
    } else if (result.isCorrect) {
      this.onPhonemeMatched(targetPhoneme);
    } else {
      this.showStatus(
        `听起来像 /${result.bestGuess}/ 而不是 /${targetPhoneme}/，请再试一次`,
        '#ef4444'
      );
    }
  }

  private fallbackToFFTAnalysis(phoneme: string) {
    this.mic!.startListening((_freq, timeData) => {
      const result = this.analyzer!.analyze(new Uint8Array(0), timeData);
      if (result && result.phoneme === this.currentTarget && result.confidence > 0.55) {
        this.onPhonemeMatched(result.phoneme);
      }
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
    if (next) this.onCrystalClick(next, '');
  }

  private showStatus(msg: string, color: string) {
    if (this.statusText) {
      this.statusText.setText(msg);
      this.statusText.setColor(color);
    }
  }
}
