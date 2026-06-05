// PhonemeAnalyzer —— FFT 共振峰音素检测

import type { PhonemeProfile, PhonemeMatch, AnalysisResult } from '@/types/audio';

const F0_MAX = 400;  // 基频上限，此频率以下跳过
const FFT_SIZE = 2048;
const SAMPLE_RATE = 44100;
const BIN_HZ = SAMPLE_RATE / FFT_SIZE;  // ~21.5 Hz/bin

// 针对儿童嗓音调校的音素特征库
const PHONEME_PROFILES: PhonemeProfile[] = [
  {
    phoneme: 'm',
    f1Range: [350, 650],
    f2Range: [1000, 1700],
    voiced: true,
    type: 'nasal',
    specialRules: 'spectral_zero',
  },
  {
    phoneme: 's',
    f1Range: [0, 0],
    f2Range: [0, 0],
    voiced: false,
    type: 'fricative',
    specialRules: 'high_freq_noise',
  },
  {
    phoneme: 'a',
    f1Range: [650, 1050],
    f2Range: [1200, 1900],
    voiced: true,
    type: 'vowel',
  },
  {
    phoneme: 'ae',
    f1Range: [600, 950],
    f2Range: [1500, 2300],
    voiced: true,
    type: 'vowel',
  },
  {
    phoneme: 'k',
    f1Range: [0, 0],
    f2Range: [0, 0],
    voiced: false,
    type: 'stop',
    specialRules: 'low_freq_peak',
  },
  {
    phoneme: 't',
    f1Range: [0, 0],
    f2Range: [0, 0],
    voiced: false,
    type: 'stop',
    specialRules: 'low_freq_peak',
  },
];

export class PhonemeAnalyzer {
  /** 分析 FFT 数据，返回最匹配的音素 */
  analyze(frequencyData: Uint8Array, timeData: Float32Array): PhonemeMatch | null {
    const analysis = this.extractFeatures(frequencyData, timeData);
    if (!analysis) return null;

    let bestMatch: PhonemeMatch | null = null;

    for (const profile of PHONEME_PROFILES) {
      const confidence = this.matchProfile(analysis, profile);
      if (confidence > (bestMatch?.confidence ?? -1)) {
        bestMatch = { phoneme: profile.phoneme, confidence };
      }
    }

    if (bestMatch && bestMatch.confidence > 0.5) {
      return bestMatch;
    }
    return null;
  }

  private extractFeatures(
    freqData: Uint8Array,
    timeData: Float32Array
  ): AnalysisResult | null {
    // RMS
    let sum = 0;
    for (let i = 0; i < timeData.length; i++) {
      sum += timeData[i] * timeData[i];
    }
    const rmsLevel = Math.sqrt(sum / timeData.length);
    if (rmsLevel < 0.006) return null;

    // 频谱质心
    let weightedSum = 0;
    let totalAmp = 0;
    for (let i = 0; i < freqData.length; i++) {
      const amp = freqData[i];
      weightedSum += amp * i * BIN_HZ;
      totalAmp += amp;
    }
    const spectralCentroid = totalAmp > 0 ? weightedSum / totalAmp : 0;

    // 频段能量比
    const bin500 = Math.floor(500 / BIN_HZ);
    const bin800 = Math.floor(800 / BIN_HZ);
    const bin2200 = Math.floor(2200 / BIN_HZ);
    const bin3500 = Math.floor(3500 / BIN_HZ);
    let lowEnergy = 0, midEnergy = 0, highEnergy = 0, totalEnergy = 0;
    for (let i = 0; i < freqData.length; i++) {
      const v = freqData[i] * freqData[i];
      totalEnergy += v;
      if (i < bin500) lowEnergy += v;
      else if (i >= bin800 && i < bin2200) midEnergy += v;
      if (i > bin3500) highEnergy += v;
    }
    const lowFreqRatio = totalEnergy > 0 ? lowEnergy / totalEnergy : 0;
    const midFreqRatio = totalEnergy > 0 ? midEnergy / totalEnergy : 0;
    const highFreqRatio = totalEnergy > 0 ? highEnergy / totalEnergy : 0;

    // 浊音检测：低频能量占比 > 25%
    const isVoiced = totalEnergy > 0 && lowFreqRatio > 0.25;

    // 共振峰峰值查找（从 F0_MAX 以上开始，跳过基频）
    const peaks = this.findPeaks(freqData);
    const f1 = peaks.length > 0 ? peaks[0] : 0;
    const f2 = peaks.length > 1 ? peaks[1] : 0;

    return { f1, f2, isVoiced, spectralCentroid, rmsLevel, lowFreqRatio, midFreqRatio, highFreqRatio };
  }

  /** 在频谱中找峰值，跳过基频区域（< F0_MAX） */
  private findPeaks(freqData: Uint8Array): number[] {
    const peaks: number[] = [];
    const minBin = Math.floor(F0_MAX / BIN_HZ);
    const maxBin = Math.floor(4000 / BIN_HZ);

    for (let i = minBin + 1; i < maxBin - 1 && peaks.length < 4; i++) {
      if (freqData[i] > freqData[i - 1] && freqData[i] > freqData[i + 1]) {
        // 峰值必须显著（比周围高）
        if (freqData[i] > 25 && freqData[i] > freqData[i - 2] && freqData[i] > freqData[i + 2]) {
          peaks.push(i * BIN_HZ);
        }
      }
    }
    return peaks;
  }

  private matchProfile(
    analysis: AnalysisResult,
    profile: PhonemeProfile
  ): number {
    let score = 0;
    let weight = 0;

    // 1. 浊音/清音匹配（基础权重 1.0）
    weight += 1.0;
    if (analysis.isVoiced === profile.voiced) score += 1.0;

    // 2. 类型专属特征（权重较高）
    if (profile.type === 'vowel') {
      // 元音：中频能量集中 + 浊音 + 谐波结构
      weight += 1.2;
      if (analysis.midFreqRatio > 0.2 && analysis.isVoiced) score += 0.9;
      // 频谱质心在元音范围 (600–2500 Hz)
      if (analysis.spectralCentroid > 500 && analysis.spectralCentroid < 2800) score += 0.3;

      // F1/F2 辅助校验（如果找到了峰值）
      if (analysis.f1 > 0) {
        weight += 0.4;
        if (analysis.f1 >= profile.f1Range[0] && analysis.f1 <= profile.f1Range[1]) score += 0.4;
      }
      if (analysis.f2 > 0) {
        weight += 0.4;
        if (analysis.f2 >= profile.f2Range[0] && analysis.f2 <= profile.f2Range[1]) score += 0.4;
      }
    } else if (profile.type === 'nasal') {
      // 鼻音：极低频谱质心 + 低频能量主导 + 浊音
      weight += 1.2;
      if (analysis.spectralCentroid < 2000) score += 0.9;
      if (analysis.lowFreqRatio > 0.35) score += 0.3;

      // F1 在校验范围内
      if (analysis.f1 > 0) {
        weight += 0.3;
        if (analysis.f1 >= profile.f1Range[0] && analysis.f1 <= profile.f1Range[1]) score += 0.3;
      }
    } else if (profile.type === 'fricative') {
      // 擦音：高频能量主导 + 清音 + 高频谱质心
      weight += 1.5;
      // 必须满足：高频能量占比高
      if (analysis.highFreqRatio > 0.35 && !analysis.isVoiced) score += 1.0;
      // 频谱质心必须很高
      if (analysis.spectralCentroid > 3500) score += 0.5;
      // 不能有太多低频能量
      if (analysis.lowFreqRatio < 0.2) score += 0.3;
    } else if (profile.type === 'stop') {
      // 塞音：短暂爆发 + 清音
      weight += 1.0;
      if (!analysis.isVoiced && analysis.rmsLevel > 0.03) score += 0.7;
      if (analysis.rmsLevel > 0.06) score += 0.3;
    }

    return weight > 0 ? score / weight : 0;
  }

  static getProfiles(): PhonemeProfile[] {
    return [...PHONEME_PROFILES];
  }
}
