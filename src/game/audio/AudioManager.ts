// AudioManager —— 加载并播放真实的音素 WAV 音频文件

type SFXType = 'click' | 'success' | 'failure' | 'unlock';

// 音素 → WAV 文件路径
const PHONEME_FILES: Record<string, string> = {
  m: '/assets/audio/phonemes/m.wav',
  s: '/assets/audio/phonemes/s.wav',
  a: '/assets/audio/phonemes/a.wav',
  k: '/assets/audio/phonemes/k.wav',
  ae: '/assets/audio/phonemes/ae.wav',
  t: '/assets/audio/phonemes/t.wav',
};

// 合成音 → WAV 文件路径
const BLEND_FILES: Record<string, string> = {
  ma: '/assets/audio/blended/ma.wav',
  sa: '/assets/audio/blended/sa.wav',
  kat: '/assets/audio/blended/kat.wav',
};

export class AudioManager {
  private static instance: AudioManager;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private buffers: Map<string, AudioBuffer> = new Map();
  private loaded = false;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) AudioManager.instance = new AudioManager();
    return AudioManager.instance;
  }

  private ensureCtx(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.7;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  /** 预加载所有音素音频文件 */
  async preloadAll() {
    if (this.loaded) return;
    const ctx = this.ensureCtx();

    const allFiles = { ...PHONEME_FILES, ...BLEND_FILES };
    const entries = Object.entries(allFiles);

    await Promise.all(
      entries.map(async ([key, url]) => {
        try {
          const resp = await fetch(url);
          const arrayBuf = await resp.arrayBuffer();
          const audioBuf = await ctx.decodeAudioData(arrayBuf);
          this.buffers.set(key, audioBuf);
        } catch {
          console.warn(`[AudioManager] 无法加载音频: ${url}`);
        }
      })
    );

    this.loaded = true;
  }

  /** 播放单个音素 */
  playPhoneme(phoneme: string) {
    const buf = this.buffers.get(phoneme);
    if (!buf) {
      console.warn(`[AudioManager] 音素未加载: ${phoneme}`);
      return;
    }
    this.playBuffer(buf);
  }

  /** 播放合成音 */
  playBlend(blendId: string) {
    const buf = this.buffers.get(blendId);
    if (!buf) {
      // 回退：逐个播放音素
      const fallback: Record<string, string[]> = {
        ma: ['m', 'a'], sa: ['s', 'a'], kat: ['k', 'ae', 't'],
      };
      const seq = fallback[blendId];
      if (seq) {
        seq.forEach((p, i) => {
          setTimeout(() => this.playPhoneme(p), i * 300);
        });
      }
      return;
    }
    this.playBuffer(buf);
  }

  private playBuffer(buf: AudioBuffer) {
    const ctx = this.ensureCtx();
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(this.masterGain || ctx.destination);
    src.start(ctx.currentTime);
  }

  /** UI 音效 */
  playSFX(sfx: SFXType) {
    const ctx = this.ensureCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain || ctx.destination);
    const t = ctx.currentTime;

    switch (sfx) {
      case 'click':
        osc.type = 'sine'; osc.frequency.value = 800;
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        osc.start(t); osc.stop(t + 0.06);
        break;
      case 'success':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, t); osc.frequency.setValueAtTime(659, t + 0.1);
        osc.frequency.setValueAtTime(784, t + 0.2);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        osc.start(t); osc.stop(t + 0.45);
        break;
      case 'failure':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.linearRampToValueAtTime(100, t + 0.35);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.start(t); osc.stop(t + 0.35);
        break;
      case 'unlock':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.linearRampToValueAtTime(1200, t + 0.5);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
        osc.start(t); osc.stop(t + 0.7);
        break;
    }
  }

  getContext(): AudioContext | null { return this.ctx; }
  setVolume(level: number) {
    if (this.masterGain) this.masterGain.gain.value = Math.max(0, Math.min(1, level));
  }
  destroy() {
    this.ctx?.close();
    this.ctx = null;
    this.masterGain = null;
    this.buffers.clear();
    this.loaded = false;
  }
}
