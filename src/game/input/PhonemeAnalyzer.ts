// PhonemeAnalyzer —— FFT 共振峰音素检测

import type { PhonemeProfile, PhonemeMatch, AnalysisResult } from '@/types/audio';

// 针对儿童嗓音调校的音素特征库（F1 比成人高 200-300Hz）
const PHONEME_PROFILES: PhonemeProfile[] = [
  {
    phoneme: 'm',
    f1Range: [350, 550],
    f2Range: [1200, 1600],
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
    f1Range: [800, 1100],
    f2Range: [1400, 1800],
    voiced: true,
    type: 'vowel',
  },
  {
    phoneme: 'ae',
    f1Range: [700, 1000],
    f2Range: [1700, 2200],
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
  private fftSize: number;
  private sampleRate: number;

  constructor(fftSize = 2048, sampleRate = 44100) {
    this.fftSize = fftSize;
    this.sampleRate = sampleRate;
  }

  /** 分析 FFT 数据，返回最匹配的音素 */
  analyze(frequencyData: Uint8Array, timeData: Float32Array): PhonemeMatch | null {
    const analysis = this.extractFeatures(frequencyData, timeData);
    if (!analysis) return null;

    let bestMatch: PhonemeMatch | null = null;

    for (const profile of PHONEME_PROFILES) {
      let confidence = this.matchProfile(analysis, profile);
      if (confidence > (bestMatch?.confidence || 0)) {
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

    if (rmsLevel < 0.008) return null;

    // 频谱质心
    let weightedSum = 0;
    let totalAmp = 0;
    const binFreq = this.sampleRate / this.fftSize;

    for (let i = 0; i < freqData.length; i++) {
      const amp = freqData[i];
      weightedSum += amp * i * binFreq;
      totalAmp += amp;
    }
    const spectralCentroid = totalAmp > 0 ? weightedSum / totalAmp : 0;

    // F1 / F2 估计（简化：在频谱中找到前两个主要峰值）
    const peaks = this.findPeaks(freqData, binFreq);
    const f1 = peaks.length > 0 ? peaks[0] : 0;
    const f2 = peaks.length > 1 ? peaks[1] : 0;

    // 浊音检测：低频能量占比
    let lowFreqEnergy = 0;
    let totalEnergy = 0;
    const lowBinLimit = Math.floor(500 / binFreq);

    for (let i = 0; i < freqData.length; i++) {
      const val = freqData[i];
      totalEnergy += val * val;
      if (i < lowBinLimit) {
        lowFreqEnergy += val * val;
      }
    }
    const isVoiced = totalEnergy > 0 && lowFreqEnergy / totalEnergy > 0.3;

    return { f1, f2, isVoiced, spectralCentroid, rmsLevel };
  }

  private findPeaks(freqData: Uint8Array, binFreq: number): number[] {
    const peaks: number[] = [];
    const minBin = Math.floor(200 / binFreq);
    const maxBin = Math.floor(4000 / binFreq);

    for (let i = minBin + 1; i < maxBin - 1 && peaks.length < 3; i++) {
      if (freqData[i] > freqData[i - 1] && freqData[i] > freqData[i + 1]) {
        if (freqData[i] > 30) {
          peaks.push(i * binFreq);
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
    let checks = 0;

    // 浊音匹配
    checks++;
    if (analysis.isVoiced === profile.voiced) score++;

    // 元音和鼻音：F1/F2 匹配
    if (profile.type === 'vowel' || profile.type === 'nasal') {
      if (analysis.f1 > 0) {
        checks++;
        if (analysis.f1 >= profile.f1Range[0] && analysis.f1 <= profile.f1Range[1]) {
          score += 0.7;
        }
      }
      if (analysis.f2 > 0) {
        checks++;
        if (analysis.f2 >= profile.f2Range[0] && analysis.f2 <= profile.f2Range[1]) {
          score += 0.7;
        }
      }
    }

    // 特殊规则
    if (profile.specialRules === 'high_freq_noise') {
      // /s/: 高频噪声（频谱质心 > 4000Hz），无浊音
      checks++;
      if (analysis.spectralCentroid > 4000 && !analysis.isVoiced) score++;
    }

    if (profile.specialRules === 'spectral_zero') {
      // /m/: 鼻音有低频峰值，且高频较弱
      checks++;
      if (analysis.spectralCentroid < 1500) score++;
    }

    if (profile.specialRules === 'low_freq_peak') {
      // /k/ /t/: 塞音 — 短暂的爆发
      // 简化检测：高 RMS + 无浊音 + 短时特征
      checks++;
      if (!analysis.isVoiced && analysis.rmsLevel > 0.03) score += 0.5;
    }

    return checks > 0 ? score / checks : 0;
  }

  /** 获取所有音素特征 */
  static getProfiles(): PhonemeProfile[] {
    return [...PHONEME_PROFILES];
  }
}
