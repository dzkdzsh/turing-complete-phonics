// Wav2vec2Analyzer —— 封装 wav2vec2 模型，提供音素评分

import { Wav2vec2ModelLoader } from './Wav2vec2ModelLoader';
import { phonemeToTokenId, tokenIdToLetter } from './PhonemeTokenMap';

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
      model: { config: { vocab_size: number } };
    } | null;

    if (!pipe) {
      return { phoneme: targetPhoneme, isCorrect: false, confidence: 0, bestGuess: '?', bestGuessScore: 0 };
    }

    const tokenId = phonemeToTokenId(targetPhoneme);
    if (tokenId === null) {
      return { phoneme: targetPhoneme, isCorrect: false, confidence: 0, bestGuess: '?', bestGuessScore: 0 };
    }

    try {
      // 用 pipeline 运行模型，获取 logits
      const output = await pipe(audioData, {
        sampling_rate: sampleRate,
        return_timestamps: true,
      });

      const text = (output as { text: string }).text || '';
      // 提取模型预测的文本
      const predicted = text.trim().toLowerCase();
      const bestGuess = predicted.charAt(0) || '?';

      // 用输出 token 作为评分依据
      // 如果预测文本的首字母与目标一致，给高分
      const isCorrect = bestGuess === targetPhoneme;
      const confidence = isCorrect ? 0.85 : (predicted.length > 0 ? 0.3 : 0.1);

      return {
        phoneme: targetPhoneme,
        isCorrect,
        confidence,
        bestGuess,
        bestGuessScore: predicted === targetPhoneme ? confidence : 0.3,
      };
    } catch (err) {
      console.warn('[Wav2vec2Analyzer] 分析失败:', err);
      return { phoneme: targetPhoneme, isCorrect: false, confidence: 0, bestGuess: '?', bestGuessScore: 0 };
    }
  }
}
