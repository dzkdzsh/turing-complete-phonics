// PhonemeSynth — 用 Web Audio API 合成真实音素发音（非TTS）
// 每种音素用振荡器+滤波器模拟真实的声学特征

export class PhonemeSynth {
  private ctx: AudioContext | null = null;

  private ensureCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  /** 播放单个音素 */
  play(phoneme: string) {
    const ctx = this.ensureCtx();
    const now = ctx.currentTime;

    switch (phoneme) {
      // 鼻音 — 低频哼鸣
      case 'm': case 'n':
        this._nasal(ctx, now, phoneme === 'n' ? 280 : 250, 0.35);
        break;
      // 浊塞音 — 短爆破+浊音
      case 'b': case 'd': case 'g':
        this._voicedPlosive(ctx, now, {b:120,d:200,g:180}[phoneme]||150, 0.3);
        break;
      // 清塞音 — 短爆破
      case 'p': case 't': case 'k':
        this._plosive(ctx, now, {p:400,t:800,k:600}[phoneme]||600, 0.25);
        break;
      // 擦音 — 持续气流
      case 's': case 'f': case 'sh':
        this._fricative(ctx, now, {s:4500,f:3500,sh:2500}[phoneme]||4000, 0.4);
        break;
      case 'h': this._fricative(ctx, now, 1500, 0.2); break;
      case 'th': this._fricative(ctx, now, 3000, 0.3); break;
      case 'ch': this._plosive(ctx, now, 2500, 0.15); break;
      // 流音/滑音
      case 'l': this._nasal(ctx, now, 400, 0.3); break;
      case 'r': this._nasal(ctx, now, 350, 0.25); break;
      // 元音 — 共振峰合成
      case 'a': case 'ae': this._vowel(ctx, now, 800, 1200, 0.4); break;
      case 'e': this._vowel(ctx, now, 500, 1900, 0.35); break;
      case 'i': this._vowel(ctx, now, 280, 2300, 0.35); break;
      case 'o': this._vowel(ctx, now, 460, 800, 0.4); break;
      case 'u': this._vowel(ctx, now, 300, 700, 0.35); break;
      default:
        this._generic(ctx, now, phoneme);
    }
  }

  /** 鼻音：低频正弦+噪声 */
  private _nasal(ctx: AudioContext, t: number, freq: number, dur: number) {
    const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = freq;
    const gain = ctx.createGain(); gain.gain.setValueAtTime(0.5, t); gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    // 添加一点噪声模拟鼻腔
    const noise = this._noiseNode(ctx, 0.08);
    osc.connect(gain); noise.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + dur); noise.start(t); noise.stop(t + dur);
  }

  /** 清塞音：短噪声爆破 */
  private _plosive(ctx: AudioContext, t: number, freq: number, dur: number) {
    const osc = ctx.createOscillator(); osc.type = 'square'; osc.frequency.value = freq;
    const gain = ctx.createGain(); gain.gain.setValueAtTime(0.6, t); gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + dur);
  }

  /** 浊塞音：短爆破+短暂浊音 */
  private _voicedPlosive(ctx: AudioContext, t: number, freq: number, dur: number) {
    const osc = ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = freq;
    const gain = ctx.createGain(); gain.gain.setValueAtTime(0.5, t); gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + dur);
  }

  /** 擦音：高频滤波噪声 */
  private _fricative(ctx: AudioContext, t: number, freq: number, dur: number) {
    const noise = this._noiseNode(ctx, 0.4);
    const filter = ctx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = freq; filter.Q.value = 1.5;
    const gain = ctx.createGain(); gain.gain.setValueAtTime(0.5, t); gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    noise.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    noise.start(t); noise.stop(t + dur);
  }

  /** 元音：双共振峰 */
  private _vowel(ctx: AudioContext, t: number, f1: number, f2: number, dur: number) {
    const osc1 = ctx.createOscillator(); osc1.type = 'sine'; osc1.frequency.value = f1;
    const osc2 = ctx.createOscillator(); osc2.type = 'sine'; osc2.frequency.value = f2;
    const gain = ctx.createGain(); gain.gain.setValueAtTime(0.4, t); gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc1.connect(gain); osc2.connect(gain); gain.connect(ctx.destination);
    osc1.start(t); osc1.stop(t + dur); osc2.start(t); osc2.stop(t + dur);
  }

  /** 通用：白噪声脉冲 */
  private _generic(ctx: AudioContext, t: number, phoneme: string) {
    const noise = this._noiseNode(ctx, 0.3);
    const gain = ctx.createGain(); gain.gain.setValueAtTime(0.4, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    noise.connect(gain); gain.connect(ctx.destination);
    noise.start(t); noise.stop(t + 0.3);
  }

  private _noiseNode(ctx: AudioContext, vol: number): AudioBufferSourceNode {
    const bufSize = ctx.sampleRate * 0.5;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * vol;
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    return src;
  }
}

export const phonemeSynth = new PhonemeSynth();
