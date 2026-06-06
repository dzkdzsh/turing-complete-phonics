// PhonemeAnalyzer —— 频谱分析音素检测（FFT + 声学特征）
// 针对 /m/ /s/ /a/ 三个孤立音素优化
//  /m/ — 鼻音：低频能量集中在 <400Hz，频谱质心极低，浊音
//  /s/ — 擦音：高频噪声，频谱质心 >3500Hz，非浊音
//  /a/ — 开元音：F1~800 F2~1400，频谱质心 800-2000Hz，浊音

import type { PhonemeMatch } from '@/types/audio';

const TARGET_PHONEMES = ['m', 's', 'a'];
const FFT_SIZE = 2048;
const SAMPLE_RATE = 16000;

// Hamming window
function hammingWindow(n: number): Float32Array {
  const w = new Float32Array(n);
  for (let i = 0; i < n; i++) w[i] = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (n - 1));
  return w;
}
const HAMMING = hammingWindow(FFT_SIZE);

interface SpectralFeatures {
  centroid: number;
  low400Ratio: number;
  low600Ratio: number;
  midRatio: number;
  highRatio: number;
  zeroCrossingRate: number;
  totalFrames: number;
  totalPossibleFrames: number;
}

function computeFFTFrame(samples: Float32Array, offset: number): Float32Array {
  const N = FFT_SIZE;
  const real = new Float32Array(N);
  for (let i = 0; i < N; i++) real[i] = samples[offset + i] * HAMMING[i];

  const magnitudes = new Float32Array(N / 2);
  for (let k = 0; k < N / 2; k++) {
    let re = 0, im = 0;
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N;
      re += real[n] * Math.cos(angle);
      im -= real[n] * Math.sin(angle);
    }
    magnitudes[k] = Math.sqrt(re * re + im * im);
  }
  return magnitudes;
}

function extractFeatures(samples: Float32Array): SpectralFeatures | null {
  if (samples.length < FFT_SIZE) return null;

  const hopSize = 512;
  const binFreq = SAMPLE_RATE / FFT_SIZE; // ~7.81 Hz
  const totalFrames = Math.floor((samples.length - FFT_SIZE) / hopSize);

  if (totalFrames === 0) return null;

  // Compute energy per frame for silence stripping
  const frameEnergies: number[] = [];
  for (let fi = 0; fi < totalFrames; fi++) {
    const offset = fi * hopSize;
    const mags = computeFFTFrame(samples, offset);
    let energy = 0;
    for (let k = 0; k < mags.length; k++) energy += mags[k];
    frameEnergies.push(energy);
  }

  // Threshold: 30th percentile × 1.5 + floor
  const sorted = [...frameEnergies].sort((a, b) => a - b);
  const p30 = sorted[Math.floor(sorted.length * 0.3)];
  const threshold = p30 * 1.5 + 0.05;

  let totalCentroid = 0, totalLow400 = 0, totalLow600 = 0, totalMid = 0, totalHigh = 0;
  let frameCount = 0;

  for (let fi = 0; fi < totalFrames; fi++) {
    if (frameEnergies[fi] < threshold) continue;

    const offset = fi * hopSize;
    const mags = computeFFTFrame(samples, offset);

    let energy = 0, weighted = 0;
    let e400 = 0, e600 = 0, eMid = 0, eHigh = 0;
    for (let k = 0; k < mags.length; k++) {
      const m = mags[k];
      const freq = k * binFreq;
      energy += m;
      weighted += m * freq;
      if (freq < 400) e400 += m;
      if (freq < 600) e600 += m;
      if (freq >= 800 && freq <= 2000) eMid += m;
      if (freq > 3500) eHigh += m;
    }
    if (energy > 0.1) {
      totalCentroid += weighted / energy;
      totalLow400 += e400 / energy;
      totalLow600 += e600 / energy;
      totalMid += eMid / energy;
      totalHigh += eHigh / energy;
      frameCount++;
    }
  }

  if (frameCount === 0) return null;

  // Zero-crossing rate on active regions
  let zcr = 0, zcrCount = 0;
  for (let i = 1; i < samples.length; i++) {
    if (Math.abs(samples[i]) > 0.01) {
      if (samples[i - 1] * samples[i] < 0) zcr++;
      zcrCount++;
    }
  }

  return {
    centroid: totalCentroid / frameCount,
    low400Ratio: totalLow400 / frameCount,
    low600Ratio: totalLow600 / frameCount,
    midRatio: totalMid / frameCount,
    highRatio: totalHigh / frameCount,
    zeroCrossingRate: zcrCount > 0 ? zcr / zcrCount : 0,
    totalFrames: frameCount,
    totalPossibleFrames: totalFrames,
  };
}

function scorePhonemes(f: SpectralFeatures): Record<string, number> {
  const scores: Record<string, number> = { m: 0, s: 0, a: 0 };

  // /m/ — nasal: dominant low-freq below 400Hz, voiced, weak high-freq
  if (f.low400Ratio > 0.40) scores['m'] += 0.45;
  if (f.low400Ratio > 0.55) scores['m'] += 0.25;
  if (f.low600Ratio > 0.55) scores['m'] += 0.15;
  if (f.centroid < 1500 && f.low400Ratio > 0.30) scores['m'] += 0.15;
  if (f.zeroCrossingRate < 0.10) scores['m'] += 0.10;
  if (f.highRatio < 0.12) scores['m'] += 0.05;

  // /s/ — fricative: high centroid, high high-freq, low low-freq, high ZCR
  if (f.centroid > 3500) scores['s'] += 0.45;
  if (f.centroid > 5000) scores['s'] += 0.20;
  if (f.highRatio > 0.25) scores['s'] += 0.20;
  if (f.low400Ratio < 0.12) scores['s'] += 0.10;
  if (f.zeroCrossingRate > 0.12) scores['s'] += 0.05;

  // /a/ — open vowel: mid centroid, moderate spread, voiced
  if (f.centroid >= 800 && f.centroid <= 2200) scores['a'] += 0.40;
  if (f.midRatio > 0.25) scores['a'] += 0.25;
  if (f.low400Ratio >= 0.10 && f.low400Ratio <= 0.40) scores['a'] += 0.15;
  if (f.highRatio < 0.18) scores['a'] += 0.10;
  if (f.zeroCrossingRate < 0.10) scores['a'] += 0.10;

  // Cross-penalties
  if (f.centroid > 1800 && f.low400Ratio < 0.25) scores['m'] = Math.max(0, scores['m'] - 0.3);
  if (f.low400Ratio > 0.55) scores['a'] = Math.max(0, scores['a'] - 0.3);
  if (f.low400Ratio > 0.25) scores['s'] = Math.max(0, scores['s'] - 0.3);

  return scores;
}

/**
 * 用浏览器 AnalyserNode 提供的频域数据做快速分析
 * freqFrames: 录制期间收集的 Uint8Array 帧数组（来自 analyser.getByteFrequencyData）
 * sampleRate: AudioContext 采样率
 * fftSize: AnalyserNode 的 fftSize
 */
function extractFeaturesFromFreqFrames(
  freqFrames: Uint8Array[],
  sampleRate: number,
  fftSize: number,
): SpectralFeatures | null {
  if (freqFrames.length === 0) return null;

  const binFreq = sampleRate / fftSize;
  const numBins = freqFrames[0].length; // frequencyBinCount = fftSize/2

  // Energy threshold for silence stripping
  const frameEnergies: number[] = freqFrames.map(data => {
    let e = 0; for (let k = 0; k < data.length; k++) e += data[k]; return e;
  });
  const sorted = [...frameEnergies].sort((a, b) => a - b);
  const threshold = sorted[Math.floor(sorted.length * 0.3)] * 1.5 + 2;

  let totalCentroid = 0, totalLow400 = 0, totalLow600 = 0, totalMid = 0, totalHigh = 0;
  let frameCount = 0;

  for (let fi = 0; fi < freqFrames.length; fi++) {
    if (frameEnergies[fi] < threshold) continue;
    const data = freqFrames[fi];
    let energy = 0, weighted = 0, e400 = 0, e600 = 0, eMid = 0, eHigh = 0;
    for (let k = 0; k < data.length; k++) {
      const m = data[k];
      const freq = k * binFreq;
      energy += m;
      weighted += m * freq;
      if (freq < 400) e400 += m;
      if (freq < 600) e600 += m;
      if (freq >= 800 && freq <= 2000) eMid += m;
      if (freq > 3500) eHigh += m;
    }
    if (energy > 1) {
      totalCentroid += weighted / energy;
      totalLow400 += e400 / energy;
      totalLow600 += e600 / energy;
      totalMid += eMid / energy;
      totalHigh += eHigh / energy;
      frameCount++;
    }
  }

  if (frameCount === 0) return null;

  // ZCR approximated from energy variation
  let zcr = 0;
  for (let i = 1; i < frameEnergies.length; i++) {
    if (Math.abs(frameEnergies[i] - frameEnergies[i - 1]) > 5) zcr++;
  }
  const zcrNorm = frameEnergies.length > 0 ? zcr / frameEnergies.length : 0;

  return {
    centroid: totalCentroid / frameCount,
    low400Ratio: totalLow400 / frameCount,
    low600Ratio: totalLow600 / frameCount,
    midRatio: totalMid / frameCount,
    highRatio: totalHigh / frameCount,
    zeroCrossingRate: zcrNorm,
    totalFrames: frameCount,
    totalPossibleFrames: freqFrames.length,
  };
}

export class PhonemeAnalyzer {
  /**
   * 快速分析：用浏览器 AnalyserNode 频域帧（零 DFT 开销）
   * @param freqFrames 录制期间收集的 Uint8Array[]（来自 getByteFrequencyData）
   * @param sampleRate AudioContext 采样率
   * @param fftSize AnalyserNode 的 fftSize
   */
  analyzeFreqFrames(
    freqFrames: Uint8Array[],
    sampleRate: number,
    fftSize: number,
  ): PhonemeMatch | null {
    const features = extractFeaturesFromFreqFrames(freqFrames, sampleRate, fftSize);
    if (!features) return null;

    const scores = scorePhonemes(features);
    let bestPhoneme = '';
    let bestScore = 0;
    for (const [ph, score] of Object.entries(scores)) {
      if (score > bestScore) { bestScore = score; bestPhoneme = ph; }
    }

    if (bestScore < 0.15) return null;
    return { phoneme: bestPhoneme, confidence: bestScore };
  }

  /**
   * 全量分析：对完整音频 buffer 做频谱分析，返回最匹配音素
   * @param audioData 16kHz Float32Array PCM
   */
  analyzeBuffer(audioData: Float32Array): PhonemeMatch | null {
    const features = extractFeatures(audioData);
    if (!features) return null;

    const scores = scorePhonemes(features);
    let bestPhoneme = '';
    let bestScore = 0;
    for (const [ph, score] of Object.entries(scores)) {
      if (score > bestScore) { bestScore = score; bestPhoneme = ph; }
    }

    if (bestScore < 0.15) return null;
    return { phoneme: bestPhoneme, confidence: bestScore };
  }

  /**
   * 兼容旧接口：逐帧实时分析（精度较低，建议使用 analyzeBuffer）
   */
  analyze(_frequencyData: Uint8Array, timeData: Float32Array): PhonemeMatch | null {
    // Quick check: RMS must be above threshold
    let sum = 0;
    for (let i = 0; i < timeData.length; i++) sum += timeData[i] * timeData[i];
    const rms = Math.sqrt(sum / timeData.length);
    if (rms < 0.008) return null;

    // For per-frame: use simplified heuristics
    // Compute spectral centroid on this frame
    const N = FFT_SIZE;
    if (timeData.length < N) {
      // Too short, pad
      const padded = new Float32Array(N);
      padded.set(timeData);
      return this.analyzeBuffer(padded);
    }

    const mags = computeFFTFrame(timeData, 0);
    const binFreq = SAMPLE_RATE / N;

    let energy = 0, weighted = 0, eLow = 0, eHigh = 0;
    for (let k = 0; k < mags.length; k++) {
      const m = mags[k];
      const freq = k * binFreq;
      energy += m;
      weighted += m * freq;
      if (freq < 400) eLow += m;
      if (freq > 3500) eHigh += m;
    }
    if (energy === 0) return null;

    const centroid = weighted / energy;
    const lowRatio = eLow / energy;
    const highRatio = eHigh / energy;

    // Zero-crossing
    let zcr = 0;
    for (let i = 1; i < timeData.length; i++) {
      if (timeData[i - 1] * timeData[i] < 0) zcr++;
    }
    const zcrNorm = zcr / timeData.length;

    // Simplified scoring
    const scores: Record<string, number> = { m: 0, s: 0, a: 0 };
    scores['m'] = lowRatio > 0.4 ? 0.6 : lowRatio > 0.3 ? 0.4 : 0;
    scores['s'] = centroid > 3500 && highRatio > 0.2 ? 0.7 : centroid > 2500 ? 0.4 : 0;
    scores['a'] = centroid > 800 && centroid < 2200 && lowRatio > 0.1 && lowRatio < 0.5 ? 0.6 : 0;

    let bestPhoneme = '';
    let bestScore = 0;
    for (const [ph, score] of Object.entries(scores)) {
      if (score > bestScore) { bestScore = score; bestPhoneme = ph; }
    }

    if (bestScore < 0.3) return null;
    return { phoneme: bestPhoneme, confidence: bestScore };
  }

  /** 获取音素得分详情（供诊断用） */
  analyzeWithScores(audioData: Float32Array): {
    match: PhonemeMatch | null;
    scores: Record<string, number>;
    features: SpectralFeatures | null;
  } {
    const features = extractFeatures(audioData);
    if (!features) return { match: null, scores: { m: 0, s: 0, a: 0 }, features: null };
    const scores = scorePhonemes(features);
    let bestPhoneme = '';
    let bestScore = 0;
    for (const [ph, score] of Object.entries(scores)) {
      if (score > bestScore) { bestScore = score; bestPhoneme = ph; }
    }
    const match: PhonemeMatch | null = bestScore > 0.15
      ? { phoneme: bestPhoneme, confidence: bestScore }
      : null;
    return { match, scores, features };
  }
}
