// Wav2vec2Analyzer —— 封装 wav2vec2 模型，提供音素评分

import { Wav2vec2ModelLoader } from './Wav2vec2ModelLoader';
import { phonemeToTokenId, isDirectMapped } from './PhonemeTokenMap';

export interface PhonemeScore {
  phoneme: string;
  isCorrect: boolean;
  confidence: number;
  bestGuess: string;
  bestGuessScore: number;
}

export class Wav2vec2Analyzer {
  private loader: Wav2vec2ModelLoader;

  constructor(loader: Wav2vec2ModelLoader) {
    this.loader = loader;
  }

  get isReady(): boolean {
    return this.loader.isLoaded;
  }

  async analyze(
    audioData: Float32Array,
    sampleRate: number,
    targetPhoneme: string
  ): Promise<PhonemeScore> {
    const pipe = this.loader.pipeline as {
      (audio: Float32Array, options?: Record<string, unknown>): Promise<{ text: string }>;
    } | null;

    if (!pipe) {
      return { phoneme: targetPhoneme, isCorrect: false, confidence: 0, bestGuess: '?', bestGuessScore: 0 };
    }

    if (!isDirectMapped(targetPhoneme)) {
      return { phoneme: targetPhoneme, isCorrect: false, confidence: 0, bestGuess: '?', bestGuessScore: 0 };
    }

    try {
      const output = await pipe(audioData, { sampling_rate: sampleRate });
      const text = (output?.text || '').trim().toLowerCase();
      const targetNorm = targetPhoneme.toLowerCase();

      if (!text) {
        return { phoneme: targetPhoneme, isCorrect: false, confidence: 0.05, bestGuess: '?', bestGuessScore: 0 };
      }

      // wav2vec2-base-960h 输出字母（a-z），取首字母比对
      const firstChar = text.charAt(0);
      const isCorrect = firstChar === targetNorm || text.includes(targetNorm);
      const confidence = isCorrect ? 0.85 : 0.25;

      return {
        phoneme: targetPhoneme,
        isCorrect,
        confidence,
        bestGuess: firstChar || '?',
        bestGuessScore: firstChar === targetNorm ? confidence : 0.25,
      };
    } catch (err) {
      console.warn('[Wav2vec2Analyzer] 分析失败:', err);
      return { phoneme: targetPhoneme, isCorrect: false, confidence: 0, bestGuess: '?', bestGuessScore: 0 };
    }
  }
}
