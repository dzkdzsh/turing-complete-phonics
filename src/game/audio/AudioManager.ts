// AudioManager —— Web Audio API 真实音素合成

type SFXType = 'click' | 'success' | 'failure' | 'unlock';

export class AudioManager {
  private static instance: AudioManager;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) AudioManager.instance = new AudioManager();
    return AudioManager.instance;
  }

  private ensureCtx(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.6;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  private now(): number { return this.ensureCtx().currentTime; }

  /** 播放单个音素 */
  playPhoneme(phoneme: string) {
    const fn = (this as Record<string, unknown>)[`synth_${phoneme}`] as ((t: number) => void) | undefined;
    if (fn) {
      fn.call(this, this.now());
    } else {
      console.warn(`[AudioManager] 未知音素: ${phoneme}`);
    }
  }

  /** 播放合成音 */
  playBlend(blendId: string) {
    const t = this.now();
    switch (blendId) {
      case 'ma': this.synth_m(t); this.synth_a(t + 0.35); break;
      case 'sa': this.synth_s(t); this.synth_a(t + 0.5); break;
      case 'kat': this.synth_k(t); this.synth_ae(t + 0.18); this.synth_t(t + 0.55); break;
      default: console.warn(`[AudioManager] 未知合成音: ${blendId}`);
    }
  }

  // ==============================
  // 音素合成器
  // ==============================

  /** /m/ 鼻音 —— 低频哼鸣，通过低通滤波产生鼻腔共振感 */
  private synth_m(t: number) {
    const ctx = this.ensureCtx();
    const dur = 0.55;

    // 基频 + 谐波（模拟声带振动）
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = 130;

    const osc2 = ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.value = 260;

    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 350;
    lpf.Q.value = 1.5;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.22, t + 0.08);
    gain.gain.setValueAtTime(0.22, t + dur - 0.08);
    gain.gain.linearRampToValueAtTime(0, t + dur);

    osc1.connect(lpf);
    osc2.connect(lpf);
    lpf.connect(gain);
    gain.connect(this.masterGain || ctx.destination);

    osc1.start(t); osc1.stop(t + dur);
    osc2.start(t); osc2.stop(t + dur);
  }

  /** /s/ 擦音 —— 高频白噪声（气流摩擦声），不是字母 "ess" */
  private synth_s(t: number) {
    const ctx = this.ensureCtx();
    const dur = 0.65;

    // 创建噪声缓冲
    const bufSize = ctx.sampleRate * dur;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.6;

    const noise = ctx.createBufferSource();
    noise.buffer = buf;

    // 高通 + 带通，只留 3-8kHz 的高频嘶嘶声
    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 3000;

    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 5500;
    bpf.Q.value = 1;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.06);
    gain.gain.setValueAtTime(0.1, t + dur - 0.06);
    gain.gain.linearRampToValueAtTime(0, t + dur);

    noise.connect(hpf);
    hpf.connect(bpf);
    bpf.connect(gain);
    gain.connect(this.masterGain || ctx.destination);

    noise.start(t);
    noise.stop(t + dur);
  }

  /** /a/ 开口前元音 —— 双共振峰模拟口腔共鸣 */
  private synth_a(t: number) {
    const ctx = this.ensureCtx();
    const dur = 0.5;

    // F1 ~750Hz, F2 ~1300Hz (儿童偏高)
    const f1 = ctx.createOscillator();
    f1.type = 'sine';
    f1.frequency.value = 750;

    const f2 = ctx.createOscillator();
    f2.type = 'sine';
    f2.frequency.value = 1300;

    const f3 = ctx.createOscillator();
    f3.type = 'sine';
    f3.frequency.value = 2500;

    const g1 = ctx.createGain();
    g1.gain.value = 0.25;
    const g2 = ctx.createGain();
    g2.gain.value = 0.12;
    const g3 = ctx.createGain();
    g3.gain.value = 0.04;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0, t);
    master.gain.linearRampToValueAtTime(0.22, t + 0.06);
    master.gain.setValueAtTime(0.22, t + dur - 0.06);
    master.gain.linearRampToValueAtTime(0, t + dur);

    f1.connect(g1);
    f2.connect(g2);
    f3.connect(g3);
    g1.connect(master);
    g2.connect(master);
    g3.connect(master);
    master.connect(this.masterGain || ctx.destination);

    f1.start(t); f1.stop(t + dur);
    f2.start(t); f2.stop(t + dur);
    f3.start(t); f3.stop(t + dur);
  }

  /** /ae/ 前元音 —— F1 略低，F2 较高 */
  private synth_ae(t: number) {
    const ctx = this.ensureCtx();
    const dur = 0.45;

    const f1 = ctx.createOscillator();
    f1.type = 'sine';
    f1.frequency.value = 660;

    const f2 = ctx.createOscillator();
    f2.type = 'sine';
    f2.frequency.value = 1750;

    const g1 = ctx.createGain();
    g1.gain.value = 0.25;
    const g2 = ctx.createGain();
    g2.gain.value = 0.12;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0, t);
    master.gain.linearRampToValueAtTime(0.22, t + 0.05);
    master.gain.setValueAtTime(0.22, t + dur - 0.05);
    master.gain.linearRampToValueAtTime(0, t + dur);

    f1.connect(g1);
    f2.connect(g2);
    g1.connect(master);
    g2.connect(master);
    master.connect(this.masterGain || ctx.destination);

    f1.start(t); f1.stop(t + dur);
    f2.start(t); f2.stop(t + dur);
  }

  /** /k/ 软腭塞音 —— 短暂的爆破噪声 */
  private synth_k(t: number) {
    const ctx = this.ensureCtx();
    const dur = 0.1;

    const bufSize = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      // 噪声包络：快速爆发→衰减
      const env = Math.exp(-i / (bufSize * 0.15));
      data[i] = (Math.random() * 2 - 1) * env * 0.5;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buf;

    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 1800;
    bpf.Q.value = 0.8;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(bpf);
    bpf.connect(gain);
    gain.connect(this.masterGain || ctx.destination);

    noise.start(t);
    noise.stop(t + dur);
  }

  /** /t/ 齿龈塞音 —— 短暂的高频爆破 */
  private synth_t(t: number) {
    const ctx = this.ensureCtx();
    const dur = 0.08;

    const bufSize = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const env = Math.exp(-i / (bufSize * 0.12));
      data[i] = (Math.random() * 2 - 1) * env * 0.5;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buf;

    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 3500;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(hpf);
    hpf.connect(gain);
    gain.connect(this.masterGain || ctx.destination);

    noise.start(t);
    noise.stop(t + dur);
  }

  // ==============================
  // UI 音效（不影响游戏性）
  // ==============================

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
        osc.frequency.setValueAtTime(523, t); osc.frequency.setValueAtTime(659, t + 0.1); osc.frequency.setValueAtTime(784, t + 0.2);
        gain.gain.setValueAtTime(0.18, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        osc.start(t); osc.stop(t + 0.45);
        break;
      case 'failure':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, t); osc.frequency.linearRampToValueAtTime(100, t + 0.35);
        gain.gain.setValueAtTime(0.1, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.start(t); osc.stop(t + 0.35);
        break;
      case 'unlock':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, t); osc.frequency.linearRampToValueAtTime(1200, t + 0.5);
        gain.gain.setValueAtTime(0.18, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
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
  }
}
