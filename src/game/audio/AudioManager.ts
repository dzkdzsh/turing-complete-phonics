// AudioManager —— 音频管理器单例，封装 Web Audio API

type SFXType = 'click' | 'success' | 'failure' | 'unlock';

// 每个音素的合成参数
interface PhonemeSynthParams {
  type: OscillatorType;
  frequency: number;
  duration: number;
  gain: number;
}

// 预定义的音素合成参数（模拟真实音素特征）
const PHONEME_SYNTH: Record<string, PhonemeSynthParams> = {
  m: { type: 'sine', frequency: 250, duration: 0.5, gain: 0.3 },
  s: { type: 'sawtooth', frequency: 5000, duration: 0.6, gain: 0.08 },
  a: { type: 'triangle', frequency: 800, duration: 0.5, gain: 0.25 },
  k: { type: 'square', frequency: 1500, duration: 0.15, gain: 0.15 },
  ae: { type: 'triangle', frequency: 700, duration: 0.4, gain: 0.25 },
  t: { type: 'square', frequency: 3000, duration: 0.1, gain: 0.12 },
};

// 合成音（两个音素快速连读）
const BLEND_SYNTH: Record<string, PhonemeSynthParams[]> = {
  ma: [
    { type: 'sine', frequency: 250, duration: 0.25, gain: 0.3 },
    { type: 'triangle', frequency: 800, duration: 0.3, gain: 0.25 },
  ],
  sa: [
    { type: 'sawtooth', frequency: 5000, duration: 0.3, gain: 0.08 },
    { type: 'triangle', frequency: 800, duration: 0.3, gain: 0.25 },
  ],
  kat: [
    { type: 'square', frequency: 1500, duration: 0.1, gain: 0.15 },
    { type: 'triangle', frequency: 700, duration: 0.2, gain: 0.25 },
    { type: 'square', frequency: 3000, duration: 0.1, gain: 0.12 },
  ],
};

export class AudioManager {
  private static instance: AudioManager;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private ensureContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /** 播放单个音素 */
  playPhoneme(phoneme: string) {
    const params = PHONEME_SYNTH[phoneme];
    if (!params) {
      console.warn(`[AudioManager] 未知音素: ${phoneme}`);
      return;
    }
    this.playSynth(params);
  }

  /** 播放合成音（如 /ma/、/sa/） */
  playBlend(blendId: string) {
    const sequence = BLEND_SYNTH[blendId];
    if (!sequence) {
      console.warn(`[AudioManager] 未知合成音: ${blendId}`);
      return;
    }
    let delay = 0;
    for (const params of sequence) {
      setTimeout(() => this.playSynth(params), delay * 1000);
      delay += params.duration;
    }
  }

  /** 播放 UI 音效 */
  playSFX(sfx: SFXType) {
    const ctx = this.ensureContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain || ctx.destination);

    const now = ctx.currentTime;

    switch (sfx) {
      case 'click':
        osc.type = 'sine';
        osc.frequency.value = 600;
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        break;

      case 'success':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.12);
        osc.frequency.setValueAtTime(784, now + 0.24);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;

      case 'failure':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.4);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;

      case 'unlock':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(1200, now + 0.6);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc.start(now);
        osc.stop(now + 0.8);
        break;
    }
  }

  private playSynth(params: PhonemeSynthParams) {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = params.type;
    osc.frequency.value = params.frequency;

    // 鼻音 /m/ 需要低通滤波模拟鼻腔共振
    if (params.frequency < 300 && params.type === 'sine') {
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      filter.Q.value = 2;
      osc.connect(filter);
      filter.connect(gain);
    } else {
      osc.connect(gain);
    }

    gain.connect(this.masterGain || ctx.destination);
    gain.gain.setValueAtTime(params.gain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + params.duration);

    osc.start(now);
    osc.stop(now + params.duration);
  }

  /** 获取 AudioContext（供 PhonemeAnalyzer 使用） */
  getContext(): AudioContext | null {
    return this.ctx;
  }

  /** 设置主音量 */
  setVolume(level: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, level));
    }
  }

  /** 销毁 */
  destroy() {
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
      this.masterGain = null;
    }
  }
}
