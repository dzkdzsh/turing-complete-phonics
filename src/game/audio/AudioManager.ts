// AudioManager — 优先标准真人发音 + DJ真人音标示范音频

import djMap from '@/data/dj-phoneme-map.json';

type SFXType = 'click' | 'success' | 'failure' | 'unlock';

// 游戏音素 → 标准MP3文件路径（优先使用）
const standardMap: Record<string, string> = {
  s: '/assets/audio/standard/s.mp3',
  k: '/assets/audio/standard/k.mp3',
  m: '/assets/audio/standard/m.mp3',
  t: '/assets/audio/standard/t.mp3',
  a: '/assets/audio/standard/ae.mp3',   // æ 短元音
  ah: '/assets/audio/standard/aa_long.mp3', // ɑː 长元音
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

  /** 播放合成音 — DJ分段逐个播放 */
  playBlend(blendId: string) {
    const fallback: Record<string, string[]> = {
      ma: ['m', 'a'], sa: ['s', 'a'], kat: ['k', 'a', 't'], sh: ['sh'],
    };
    const seq = fallback[blendId];
    if (seq) {
      seq.forEach((p, i) => { setTimeout(() => this.playPhoneme(p), i * 200); });
    }
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
