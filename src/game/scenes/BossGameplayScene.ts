// BossGameplayScene —— Boss 关场景（录音 + 频谱分析音素验证）

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

const MAX_RECORD_SEC = 10;

export class BossGameplayScene extends GameplayScene {
  private mic: MicrophoneInput | null = null;
  private analyzer: PhonemeAnalyzer | null = null;
  private currentTarget: string | null = null;
  private requiredPhonemes: string[] = [];
  private statusText: Phaser.GameObjects.Text | null = null;
  private crystalLights: Map<string, Phaser.GameObjects.Graphics> = new Map();

  // Recording state
  private freqFrames: Uint8Array[] = [];
  private isRecording = false;
  private recordingStartTime = 0;

  // UI elements
  private stopButton: Phaser.GameObjects.Container | null = null;
  private recordTimer: Phaser.GameObjects.Text | null = null;
  private timerEvent: Phaser.Time.TimerEvent | null = null;

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

    this.statusText = this.add.text(width / 2, 82, '准备好了！点击水晶开始录音', {
      fontSize: '14px', color: '#444444', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this.createCrystalLights();
    this.bindCrystalClicks();

    eventBus.on(GameEvents.MIC_START, () => this.startMicForNext());
    eventBus.on(GameEvents.MIC_STOP, () => this.stopRecording());
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

  // ─── Click → start mic → collect frames → user stops → analyze ───

  private async onCrystalClick(phoneme: string) {
    if (this.isRecording) return;
    if (this.completedPhonemes.includes(phoneme)) {
      this.showStatus(`/${phoneme}/ 水晶已激活 ✓`, '#0a5c3f');
      return;
    }

    this.currentTarget = phoneme;
    this.showStatus(`🎤 正在录音... 读完 /${phoneme}/ 后点击停止`, '#d4912a');

    try {
      await this.mic!.start();
      this.isRecording = true;
      this.recordingStartTime = Date.now();
      this.freqFrames = [];

      // Use MicrophoneInput's proven data pipeline
      this.mic!.startListening((freqData) => {
        if (!this.isRecording) return;
        this.freqFrames.push(new Uint8Array(freqData));
      });

      this.showStopButton();
      this.startTimer();
    } catch {
      this.showStatus('麦克风启动失败！请允许浏览器使用麦克风权限', '#7a1a1a');
    }
  }

  private stopRecording() {
    if (!this.isRecording) return;
    this.isRecording = false;
    this.mic?.stop();
    this.hideStopButton();
    this.stopTimer();
    this.time.delayedCall(200, () => this.processRecording());
  }

  private async processRecording() {
    const target = this.currentTarget;
    if (!target) return;

    // Recognition phase
    this.showStatus('🔍 正在识别中...', '#f59e0b');
    this.showRecognizingAnimation();
    await new Promise(r => setTimeout(r, 600));

    const result = this.freqFrames.length >= 5 && this.analyzer
      ? this.analyzer.analyzeFreqFrames(this.freqFrames, 44100, 2048)
      : null;

    this.hideRecognizingAnimation();

    console.log('[Boss] target=/' + target + '/ best=/' + (result?.phoneme || '?') +
      '/ conf=' + ((result?.confidence || 0) * 100).toFixed(0) + '% frames=' + this.freqFrames.length);

    if (!result || result.confidence < 0.15) {
      this.showStatus('❌ 没有检测到清晰的声音，点击水晶重试', '#ef4444');
    } else if (result.phoneme === target && result.confidence > 0.3) {
      this.onPhonemeMatched(target);
    } else if (result.confidence > 0.2) {
      this.showStatus(
        `❌ 听起来像 /${result.phoneme}/ 而不是 /${target}/，点击水晶重试`,
        '#ef4444'
      );
    } else {
      this.showStatus('❌ 不太确定，请再大声/清晰一点', '#f59e0b');
    }

    this.freqFrames = [];
  }

  // ─── Recording UI ───

  private showStopButton() {
    const { width } = this.scale;
    const bg = this.add.graphics();
    bg.fillStyle(0xef4444, 0.9);
    bg.fillRoundedRect(-60, -20, 120, 40, 20);

    const txt = this.add.text(0, 0, '⏹ 停止录音', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this.stopButton = this.add.container(width / 2, 130, [bg, txt]);
    this.stopButton.setSize(120, 40);
    this.stopButton.setInteractive({ cursor: 'pointer' });
    this.stopButton.on('pointerdown', () => this.stopRecording());
    this.stopButton.on('pointerover', () => { bg.clear(); bg.fillStyle(0xdc2626, 0.9); bg.fillRoundedRect(-60, -20, 120, 40, 20); });
    this.stopButton.on('pointerout', () => { bg.clear(); bg.fillStyle(0xef4444, 0.9); bg.fillRoundedRect(-60, -20, 120, 40, 20); });
  }

  private hideStopButton() {
    if (this.stopButton) { this.stopButton.destroy(); this.stopButton = null; }
    if (this.recordTimer) { this.recordTimer.destroy(); this.recordTimer = null; }
  }

  private startTimer() {
    const { width } = this.scale;
    this.recordTimer = this.add.text(width / 2, 160, '00:00', {
      fontSize: '24px', color: '#ef4444', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.timerEvent = this.time.addEvent({
      delay: 200,
      loop: true,
      callback: () => {
        if (!this.isRecording) return;
        const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
        const secs = Math.min(elapsed, MAX_RECORD_SEC);
        const min = Math.floor(secs / 60).toString().padStart(2, '0');
        const sec = (secs % 60).toString().padStart(2, '0');
        if (this.recordTimer) this.recordTimer.setText(min + ':' + sec);
        if (elapsed >= MAX_RECORD_SEC) this.stopRecording();
      },
    });
  }

  private stopTimer() {
    if (this.timerEvent) { this.timerEvent.destroy(); this.timerEvent = null; }
  }

  // ─── Recognition animation ───

  private recognizingDots: Phaser.GameObjects.Text | null = null;
  private recognizingTween: Phaser.Time.TimerEvent | null = null;

  private showRecognizingAnimation() {
    const { width } = this.scale;
    this.recognizingDots = this.add.text(width / 2, 155, '', {
      fontSize: '18px', color: '#d4912a', fontFamily: 'monospace',
    }).setOrigin(0.5);

    let dots = 0;
    this.recognizingTween = this.time.addEvent({
      delay: 250,
      loop: true,
      callback: () => {
        dots = (dots + 1) % 4;
        if (this.recognizingDots) {
          this.recognizingDots.setText('⚙ 分析频谱中' + '.'.repeat(dots));
        }
      },
    });
  }

  private hideRecognizingAnimation() {
    if (this.recognizingTween) { this.recognizingTween.destroy(); this.recognizingTween = null; }
    if (this.recognizingDots) { this.recognizingDots.destroy(); this.recognizingDots = null; }
  }

  // ─── Success logic ───

  private onPhonemeMatched(phoneme: string) {
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
      this.showStatus(`✅ 成功！还剩 ${remaining.length} 颗水晶`, '#0a5c3f');
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
