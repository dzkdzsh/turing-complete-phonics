// AudioManager — 优先标准真人发音 + DJ真人音标示范音频 + WORLD协同发音合成

import djMap from '@/data/dj-phoneme-map.json';

type SFXType = 'click' | 'success' | 'failure' | 'unlock';

// 游戏音素 → 标准MP3文件路径（优先使用）
const standardMap: Record<string, string> = {
  s: '/assets/audio/standard/s.mp3',
  k: '/assets/audio/standard/k.mp3',
  m: '/assets/audio/standard/m.mp3',
  t: '/assets/audio/standard/t.mp3',
  a: '/assets/audio/standard/ae.mp3',   // æ 短元音
  ae: '/assets/audio/standard/ae.mp3',  // æ alias
  ah: '/assets/audio/standard/aa_long.mp3', // ɑː 长元音
};

// WORLD 声码器协同发音合成 → 预计算 blend WAV（优于运行时交叉淡入淡出）
const BLEND_FILES: Record<string, string> = {
  ma: '/assets/audio/blended/ma.wav',
  sa: '/assets/audio/blended/sa.wav',
  kat: '/assets/audio/blended/kat.wav',
};

// 游戏音素 → DJ分段文件路径（回退）
function djPath(phoneme: string): string | null {
  const seg = (djMap as Record<string,number>)[phoneme];
  if (seg) return `/assets/audio/dj/phoneme_${String(seg).padStart(3,'0')}.mp3`;
  return null;
}

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

  /** 预加载标准+DJ音标音频 */
  async preloadAll() {
    if (this.loaded) return;
    const ctx = this.ensureCtx();

    // 1. 优先加载标准真人发音
    const stdUrls = [...new Set(Object.values(standardMap))];
    await Promise.all(stdUrls.map(async (url) => {
      try {
        const resp = await fetch(url);
        if (!resp.ok) return;
        const buf = await resp.arrayBuffer();
        const audioBuf = await ctx.decodeAudioData(buf);
        this.buffers.set(`std_${url}`, audioBuf);
      } catch { /* skip */ }
    }));

    // 2. 回退加载DJ分段
    const segs = Object.values(djMap as Record<string,number>);
    const unique = [...new Set(segs)];
    await Promise.all(unique.map(async (seg) => {
      const url = `/assets/audio/dj/phoneme_${String(seg).padStart(3,'0')}.mp3`;
      try {
        const resp = await fetch(url);
        const buf = await resp.arrayBuffer();
        const audioBuf = await ctx.decodeAudioData(buf);
        this.buffers.set(`dj_${seg}`, audioBuf);
      } catch { /* skip */ }
    }));
    // 3. 预加载 WORLD 声码器协同发音合成 blend WAV
    await Promise.all(Object.entries(BLEND_FILES).map(async ([key, url]) => {
      try {
        const resp = await fetch(url);
        if (!resp.ok) return;
        const buf = await resp.arrayBuffer();
        const audioBuf = await ctx.decodeAudioData(buf);
        this.buffers.set(`blend_${key}`, audioBuf);
      } catch { /* skip — 运行时回退到交叉淡入淡出 */ }
    }));
    this.loaded = true;
  }

  /** 播放单个音素 — 标准真人发音优先 */
  playPhoneme(phoneme: string) {
    // 1. 优先标准真人发音
    const stdUrl = standardMap[phoneme];
    if (stdUrl) {
      const buf = this.buffers.get(`std_${stdUrl}`);
      if (buf) { this.playBuffer(buf); return; }
    }
    // 2. DJ真人发音回退
    const seg = (djMap as Record<string,number>)[phoneme];
    if (seg) {
      const buf = this.buffers.get(`dj_${seg}`);
      if (buf) { this.playBuffer(buf); return; }
    }
    // 3. 声学合成兜底
    import('./PhonemeSynth').then(m => m.phonemeSynth.play(phoneme)).catch(() => {});
  }

  /** 裁剪音频首尾静音 */
  private trimSilence(buf: AudioBuffer, threshold = 0.008): Float32Array {
    const data = buf.getChannelData(0);

    // Use RMS in 10ms windows for more robust silence detection
    const winSamples = Math.ceil(0.01 * buf.sampleRate); // 10ms window
    let start = 0;
    let end = Math.floor(data.length / winSamples) - 1;

    // Find first non-silent window
    for (let w = 0; w < end; w++) {
      let rms = 0;
      const off = w * winSamples;
      for (let i = 0; i < winSamples && off + i < data.length; i++) {
        rms += data[off + i] * data[off + i];
      }
      rms = Math.sqrt(rms / winSamples);
      if (rms > threshold) { start = w; break; }
    }

    // Find last non-silent window
    for (let w = end; w > start; w--) {
      let rms = 0;
      const off = w * winSamples;
      for (let i = 0; i < winSamples && off + i < data.length; i++) {
        rms += data[off + i] * data[off + i];
      }
      rms = Math.sqrt(rms / winSamples);
      if (rms > threshold) { end = w; break; }
    }

    const startSample = Math.max(0, start * winSamples);
    const endSample = Math.min(data.length - 1, (end + 1) * winSamples);

    if (endSample <= startSample) return data;
    return data.subarray(startSample, endSample + 1);
  }

  /** 合成音素：优先 WORLD 协同发音预计算 blend，回退到运行时交叉淡入淡出 */
  blendPhonemes(phonemes: string[]): AudioBuffer | null {
    // 优先：WORLD 声码器协同发音预计算 blend
    const blendKey = phonemes.join('');
    const preBlend = this.buffers.get(`blend_${blendKey}`);
    if (preBlend) return preBlend;

    // 回退：运行时波形交叉淡入淡出
    return this.blendPhonemesRuntime(phonemes);
  }

  /** 运行时波形交叉淡入淡出（降级方案） */
  private blendPhonemesRuntime(phonemes: string[]): AudioBuffer | null {
    const ctx = this.ensureCtx();
    const rawBufs: { data: Float32Array; sampleRate: number }[] = [];

    for (const p of phonemes) {
      const stdUrl = standardMap[p];
      let buf: AudioBuffer | undefined;
      if (stdUrl) buf = this.buffers.get(`std_${stdUrl}`);
      if (!buf) {
        const seg = (djMap as Record<string, number>)[p];
        if (seg !== undefined) buf = this.buffers.get(`dj_${seg}`);
      }
      if (buf) {
        const trimmed = this.trimSilence(buf);
        rawBufs.push({ data: trimmed, sampleRate: buf.sampleRate });
      }
    }

    if (rawBufs.length === 0) return null;
    if (rawBufs.length === 1) {
      const out = ctx.createBuffer(1, rawBufs[0].data.length, rawBufs[0].sampleRate);
      out.getChannelData(0).set(rawBufs[0].data);
      return out;
    }

    // Resample all to output sample rate
    const outSampleRate = ctx.sampleRate;
    const resampled: Float32Array[] = [];
    for (const raw of rawBufs) {
      let data: Float32Array;
      if (raw.sampleRate !== outSampleRate) {
        const ratio = raw.sampleRate / outSampleRate;
        const newLen = Math.round(raw.data.length / ratio);
        data = new Float32Array(newLen);
        for (let i = 0; i < newLen; i++) {
          const src = i * ratio;
          const lo = Math.floor(src);
          const hi = Math.min(lo + 1, raw.data.length - 1);
          data[i] = raw.data[lo] * (1 - (src - lo)) + raw.data[hi] * (src - lo);
        }
      } else {
        data = raw.data;
      }
      resampled.push(data);
    }

    if (resampled.length === 1) {
      const out = ctx.createBuffer(1, resampled[0].length, outSampleRate);
      out.getChannelData(0).set(resampled[0]);
      return out;
    }

    // Truncate each phoneme to a tight core, then overlap 100%
    const MAX_PHONEME_MS = 0.20; // keep only 200ms of each phoneme
    const maxSamples = Math.ceil(MAX_PHONEME_MS * outSampleRate);

    // Truncate to core
    const cores = resampled.map(d => d.subarray(0, Math.min(d.length, maxSamples)));

    // Output = longest core (since 100% overlap)
    const outLen = cores[0].length; // all same length (200ms)
    const outBuffer = ctx.createBuffer(1, outLen, outSampleRate);
    const outData = outBuffer.getChannelData(0);

    // First phoneme: write at full volume then fade out
    for (let s = 0; s < cores[0].length; s++) {
      const fadeOut = 1.0 - (s / cores[0].length); // linear fade out over full duration
      outData[s] = cores[0][s] * fadeOut;
    }

    // Subsequent phonemes: fade in while previous fades out
    for (let i = 1; i < cores.length; i++) {
      const src = cores[i];
      const srcLen = src.length;

      // Phoneme starts from the beginning with fade-in,
      // reaching full volume when previous fades out
      const segmentStart = Math.floor((i - 1) * outLen * 0.3); // stagger by 30% for multiple

      for (let s = 0; s < srcLen; s++) {
        const idx = segmentStart + s;
        if (idx >= outLen) break;

        // Ease-in-out fade for this segment
        const progress = s / srcLen;
        const fadeIn = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        outData[idx] = outData[idx] * (1 - fadeIn * 0.7) + src[s] * fadeIn;
      }
    }

    return outBuffer;
  }

  /** 播放合成音 — 优先 WORLD 预计算 blend → blendPhonemes() → 逐个播放 */
  playBlend(blendId: string) {
    const fallback: Record<string, string[]> = {
      ma: ['m', 'a'], sa: ['s', 'a'], kat: ['k', 'ae', 't'],
    };

    // 优先 WORLD 预计算 blend
    const preBlend = this.buffers.get(`blend_${blendId}`);
    if (preBlend) { this.playBuffer(preBlend); return; }

    // 回退到运行时合成
    const phonemes = fallback[blendId];
    if (!phonemes) return;
    const blended = this.blendPhonemesRuntime(phonemes);
    if (blended) {
      this.playBuffer(blended);
    } else {
      phonemes.forEach((p, i) => { setTimeout(() => this.playPhoneme(p), i * 200); });
    }
  }

  playBuffer(buf: AudioBuffer) {
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
