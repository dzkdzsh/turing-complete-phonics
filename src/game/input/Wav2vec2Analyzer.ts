// Wav2vec2Analyzer —— 封装 wav2vec2 模型，提供音素发音评分
// 核心算法：帧级 softmax 后验概率 → 平均 → GOP 简化打分

import { Wav2vec2ModelLoader } from './Wav2vec2ModelLoader';
import { phonemeToTokenId, tokenIdToLetter, isDirectMapped } from './PhonemeTokenMap';

export interface PhonemeScore {
  phoneme: string;          // 目标音素
  isCorrect: boolean;       // 是否通过阈值
  confidence: number;       // 0–1 后验概率
  bestGuess: string;        // 模型认为读的什么
  bestGuessScore: number;   // bestGuess 得分
  isSilence: boolean;       // 是否判定为静音/噪音
}

export class Wav2vec2Analyzer {
  private modelLoader: Wav2vec2ModelLoader;

  constructor(modelLoader: Wav2vec2ModelLoader) {
    this.modelLoader = modelLoader;
  }

  get isReady(): boolean {
    return this.modelLoader.isLoaded;
  }

  /**
   * 分析音频，返回音素评分
   * @param audioData 原始 PCM Float32Array
   * @param sampleRate 原始采样率（如 44100）
   * @param targetPhoneme 目标音素（如 "m"）
   */
  async analyze(
    audioData: Float32Array,
    sampleRate: number,
    targetPhoneme: string,
  ): Promise<PhonemeScore | null> {
    if (!this.modelLoader.isLoaded || !this.modelLoader.pipeline) {
      return null;
    }

    const targetTokenId = phonemeToTokenId(targetPhoneme);
    if (targetTokenId === null) {
      return null; // 无直接映射，调用方应回退 FFT
    }

    try {
      // pipeline() 直接返回识别文本，但我们需要 logits。
      // @xenova/transformers 的 pipeline 内部有 model._call() 可获取 logits
      // 通过访问内部 API 获取帧级 logits
      const pl = this.modelLoader.pipeline as unknown as {
        model: {
          _call: (inputs: unknown) => Promise<{ logits: { data: Float32Array; dims: number[] } }>;
          config: { id2label: Record<number, string> };
        };
        processor: {
          _call: (audio: Float32Array, sampleRate: number) => Promise<{
            input_values: { data: Float32Array; dims: number[] };
          }>;
        };
        tokenizer: {
          model: { vocab: Record<string, number> };
        };
      };

      // Step 1: 特征提取（processor 重采样至 16kHz + mel spectrogram）
      const processed = await pl.processor._call(audioData, sampleRate);

      // Step 2: 模型推理 → logits [1, T, 32]
      const output = await pl.model._call(processed);

      // Step 3: softmax + 帧级打分
      const logs = output.logits.data;
      const dims = output.logits.dims; // [1, T, 32]
      const T = dims[1];
      const V = dims[2]; // 32

      // 逐帧 softmax（数值稳定）
      const posteriors: Float32Array = new Float32Array(T * V);
      for (let t = 0; t < T; t++) {
        const start = t * V;
        // 找最大值（数值稳定）
        let maxVal = -Infinity;
        for (let v = 0; v < V; v++) {
          if (logs[start + v] > maxVal) maxVal = logs[start + v];
        }
        // exp + sum
        let sum = 0;
        const expVals = new Float32Array(V);
        for (let v = 0; v < V; v++) {
          expVals[v] = Math.exp(logs[start + v] - maxVal);
          sum += expVals[v];
        }
        // normalize
        for (let v = 0; v < V; v++) {
          posteriors[start + v] = expVals[v] / sum;
        }
      }

      // Step 4: 目标音素后验（帧级平均）
      let targetSum = 0;
      for (let t = 0; t < T; t++) {
        targetSum += posteriors[t * V + targetTokenId];
      }
      const targetScore = targetSum / T;

      // Step 5: 逐 token 平均，找 max
      const avgByToken = new Float32Array(V);
      for (let t = 0; t < T; t++) {
        for (let v = 0; v < V; v++) {
          avgByToken[v] += posteriors[t * V + v];
        }
      }
      for (let v = 0; v < V; v++) {
        avgByToken[v] /= T;
      }

      let bestTokenId = 0;
      let bestScore = avgByToken[0];
      for (let v = 1; v < V; v++) {
        if (avgByToken[v] > bestScore) {
          bestScore = avgByToken[v];
          bestTokenId = v;
        }
      }

      const bestGuess = tokenIdToLetter(bestTokenId);
      const isSilence = bestScore < 0.2;

      // 判定逻辑
      let isCorrect = false;
      if (!isSilence) {
        if (bestTokenId === targetTokenId && bestScore > 0.4) {
          isCorrect = true;
        }
      }

      return {
        phoneme: targetPhoneme,
        isCorrect,
        confidence: targetScore,
        bestGuess,
        bestGuessScore: bestScore,
        isSilence,
      };
    } catch (err) {
      console.error('[Wav2vec2Analyzer] analysis error:', err);
      return null;
    }
  }
}
