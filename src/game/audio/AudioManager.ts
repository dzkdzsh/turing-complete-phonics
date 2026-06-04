// AudioManager —— 使用 Web Speech API 发出真实的音素声音

type SFXType = 'click' | 'success' | 'failure' | 'unlock';

// 每个音素对应的 TTS 发音文本
const PHONEME_SPEECH: Record<string, string> = {
  m: 'mmm',
  s: 'sss',
  a: 'ah',
  k: 'k',
  ae: 'aah',
  t: 't',
};

// 合成音
const BLEND_SPEECH: Record<string, string[]> = {
  ma: ['m', 'ah'],
  sa: ['s', 'ah'],
  kat: ['k', 'aah', 't'],
};

export class AudioManager {
  private static instance: AudioManager;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private synth: SpeechSynthesis | null = null;
  private voicesLoaded = false;

  private constructor() {
    // 预加载 TTS 语音列表
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.synth = window.speechSynthesis;
      // 触发语音加载
      this.synth.getVoices();
      this.synth.onvoiceschanged = () => {
        this.voicesLoaded = true;
      };
      // 部分浏览器不触发 onvoiceschanged，直接标记
      setTimeout(() => { this.voicesLoaded = true; }, 500);
    }
  }

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

  private getSynth(): SpeechSynthesis {
    if (!this.synth) {
      this.synth = window.speechSynthesis;
    }
    return this.synth;
  }

  /** 播放单个音素 —— 用 TTS 发出真实人声 */
  playPhoneme(phoneme: string) {
    const text = PHONEME_SPEECH[phoneme];
    if (!text) {
      console.warn(`[AudioManager] 未知音素: ${phoneme}`);
      return;
    }
    this.speak(text);
  }

  /** 播放合成音（两个音素连续 TTS） */
  playBlend(blendId: string) {
    const sequence = BLEND_SPEECH[blendId];
    if (!sequence) {
      // 回退：直接说这个词
      this.speak(blendId.replace('ae', 'a').replace('kat', 'cat'));
      return;
    }
    let delay = 0;
    for (const phoneme of sequence) {
      const text = PHONEME_SPEECH[phoneme] || phoneme;
      setTimeout(() => this.speak(text), delay);
      delay += 350;
    }
  }

  private speak(text: string) {
    const synth = this.getSynth();
    synth.cancel(); // 取消之前的语音

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    utter.rate = 0.4;   // 很慢，让孩子听清楚
    utter.pitch = 1.0;
    utter.volume = 0.8;

    // 选一个适合儿童的女声（优先英文母语）
    const voices = synth.getVoices();
    const preferred = voices.find(
      (v) => v.lang === 'en-US' && v.name.includes('Female')
    ) || voices.find(
      (v) => v.lang === 'en-US'
    ) || voices.find(
      (v) => v.lang.startsWith('en')
    );

    if (preferred) utter.voice = preferred;

    synth.speak(utter);
  }

  /** 播放 UI 音效（仍用 Web Audio API 振荡器——不需要人声） */
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
        osc.frequency.value = 800;
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
        break;
      case 'success':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.1);
        osc.frequency.setValueAtTime(784, now + 0.2);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
        break;
      case 'failure':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.35);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
        break;
      case 'unlock':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(1200, now + 0.5);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc.start(now);
        osc.stop(now + 0.7);
        break;
    }
  }

  getContext(): AudioContext | null {
    return this.ctx;
  }

  setVolume(level: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, level));
    }
  }

  destroy() {
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
      this.masterGain = null;
    }
    this.synth?.cancel();
  }
}
