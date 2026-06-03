// PhonemeLibrary —— 音素→音频映射表，根据关卡配置构建

import type { AudioClipDef } from '@/types/level';
import { AudioManager } from './AudioManager';

export class PhonemeLibrary {
  private phonemeToClip: Map<string, string> = new Map();
  private blendToClip: Map<string, string> = new Map();
  private audio: AudioManager;

  constructor() {
    this.audio = AudioManager.getInstance();
  }

  /** 根据关卡配置的音效列表加载映射 */
  loadFromConfig(clips: AudioClipDef[]) {
    this.phonemeToClip.clear();
    this.blendToClip.clear();

    for (const clip of clips) {
      if (clip.type === 'phoneme' && clip.phoneme) {
        this.phonemeToClip.set(clip.phoneme, clip.id);
      } else if (clip.type === 'blend') {
        this.blendToClip.set(clip.id, clip.file);
      }
    }
  }

  /** 播放指定音素 */
  play(phoneme: string) {
    this.audio.playPhoneme(phoneme);
  }

  /** 播放合成音 */
  playBlend(blendId: string) {
    this.audio.playBlend(blendId);
  }

  /** 播放 UI 音效 */
  playSFX(sfx: 'click' | 'success' | 'failure' | 'unlock') {
    this.audio.playSFX(sfx);
  }
}
