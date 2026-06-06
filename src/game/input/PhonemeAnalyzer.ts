// PhonemeAnalyzer —— 频谱分析音素检测（测试页已验证的算法）
// 对 /m/ /s/ /a/ 三个孤立音素做 FFT + 声学特征打分

import type { PhonemeMatch } from '@/types/audio';

const FFT_SIZE = 2048;
const HOP_SIZE = 512;
const TARGET_SR = 16000;

// Hamming window (lazy init)
let HAMMING: Float32Array | null = null;
function getHamming(): Float32Array {
  if (!HAMMING) {
    HAMMING = new Float32Array(FFT_SIZE);
    for (let i = 0; i < FFT_SIZE; i++)
      HAMMING[i] = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (FFT_SIZE - 1));
  }
  return HAMMING;
}

// Simple DFT per frame (extract magnitude spectrum)
function dftFrame(samples: Float32Array, offset: number): Float32Array {
  const N = FFT_SIZE;
  const w = getHamming();
  const real = new Float32Array(N);
  for (let i = 0; i < N; i++) real[i] = samples[offset + i] * w[i];
  const mags = new Float32Array(N / 2);
  for (let k = 0; k < N / 2; k++) {
    let re = 0, im = 0;
    const a = (2 * Math.PI * k) / N;
    for (let n = 0; n < N; n++) {
      re += real[n] * Math.cos(a * n);
      im -= real[n] * Math.sin(a * n);
    }
    mags[k] = Math.sqrt(re * re + im * im);
  }
  return mags;
}

// Linear resample
function resample(audio: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return audio;
  const ratio = fromRate / toRate;
  const newLen = Math.round(audio.length / ratio);
  const out = new Float32Array(newLen);
  for (let i = 0; i < newLen; i++) {
    const src = i * ratio;
    const lo = Math.floor(src);
    const hi = Math.min(lo + 1, audio.length - 1);
    out[i] = audio[lo] * (1 - (src - lo)) + audio[hi] * (src - lo);
  }
  return out;
}

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

/** Yield to event loop (non-blocking) */
function yieldTick(): Promise<void> {
  return new Promise(r => setTimeout(r, 0));
}

/** Async version: processes DFT frames in chunks to avoid blocking the UI */
async function spectralFeaturesAsync(samples: Float32Array): Promise<SpectralFeatures | null> {
  if (samples.length < FFT_SIZE) return null;

  const binFreq = TARGET_SR / FFT_SIZE;
  const totalFrames = Math.floor((samples.length - FFT_SIZE) / HOP_SIZE);
  if (totalFrames === 0) return null;

  // Compute DFT frames in chunks of 8, yielding between chunks
  const CHUNK = 8;
  const allMags: Float32Array[] = [];
  for (let fi = 0; fi < totalFrames; fi++) {
    allMags.push(dftFrame(samples, fi * HOP_SIZE));
    if (fi % CHUNK === CHUNK - 1) await yieldTick();
  }

  // Rest is identical to spectralFeatures
  const frameEnergies = allMags.map(mags => {
    let e = 0; for (let k = 0; k < mags.length; k++) e += mags[k]; return e;
  });
  const sorted = [...frameEnergies].sort((a, b) => a - b);
  const threshold = sorted[Math.floor(sorted.length * 0.3)] * 1.5 + 0.05;

  let totalCentroid = 0, totalLow400 = 0, totalLow600 = 0, totalMid = 0, totalHigh = 0;
  let frameCount = 0;

  for (let fi = 0; fi < totalFrames; fi++) {
    if (frameEnergies[fi] < threshold) continue;
    const mags = allMags[fi];
    let energy = 0, weighted = 0, e400 = 0, e600 = 0, eMid = 0, eHigh = 0;
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
    if (fi % CHUNK === CHUNK - 1) await yieldTick();
  }

  if (frameCount === 0) return null;

  // Zero-crossing rate on active regions (fast, no need to yield)
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

function spectralFeatures(samples: Float32Array): SpectralFeatures | null {
  if (samples.length < FFT_SIZE) return null;

  const binFreq = TARGET_SR / FFT_SIZE;
  const totalFrames = Math.floor((samples.length - FFT_SIZE) / HOP_SIZE);
  if (totalFrames === 0) return null;

  // Compute all frames
  const allMags: Float32Array[] = [];
  for (let fi = 0; fi < totalFrames; fi++) {
    allMags.push(dftFrame(samples, fi * HOP_SIZE));
  }

  // Energy per frame for silence stripping
  const frameEnergies = allMags.map(mags => {
    let e = 0; for (let k = 0; k < mags.length; k++) e += mags[k]; return e;
  });
  const sorted = [...frameEnergies].sort((a, b) => a - b);
  const threshold = sorted[Math.floor(sorted.length * 0.3)] * 1.5 + 0.05;

  let totalCentroid = 0, totalLow400 = 0, totalLow600 = 0, totalMid = 0, totalHigh = 0;
  let frameCount = 0;

  for (let fi = 0; fi < totalFrames; fi++) {
    if (frameEnergies[fi] < threshold) continue;
    const mags = allMags[fi];
    let energy = 0, weighted = 0, e400 = 0, e600 = 0, eMid = 0, eHigh = 0;
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

  // /m/ — nasal: dominant low-freq, low centroid, voiced, weak high-freq
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

export class PhonemeAnalyzer {
  /**
   * 主分析方法：16kHz PCM → DFT（分块异步） → 频谱特征 → 音素打分
   * 与测试页 phoneme-test.html 算法完全一致，但分块计算避免阻塞 UI
   */
  async analyzeBufferAsync(audio16k: Float32Array): Promise<PhonemeMatch | null> {
    const f = await spectralFeaturesAsync(audio16k);
    if (!f) return null;

    console.log('[PhonemeAnalyzer] centroid=' + f.centroid.toFixed(0) + 'Hz low400=' +
      (f.low400Ratio * 100).toFixed(0) + '% low600=' + (f.low600Ratio * 100).toFixed(0) +
      '% mid=' + (f.midRatio * 100).toFixed(0) + '% high=' + (f.highRatio * 100).toFixed(0) +
      '% zcr=' + f.zeroCrossingRate.toFixed(3) + ' frames=' + f.totalFrames + '/' + f.totalPossibleFrames);

    const scores = scorePhonemes(f);
    let bestPhoneme = '';
    let bestScore = 0;
    for (const [ph, score] of Object.entries(scores)) {
      if (score > bestScore) { bestScore = score; bestPhoneme = ph; }
    }

    console.log('[PhonemeAnalyzer] scores: m=' + (scores['m'] * 100).toFixed(0) +
      '% s=' + (scores['s'] * 100).toFixed(0) + '% a=' + (scores['a'] * 100).toFixed(0) +
      '% best=/' + bestPhoneme + '/');

    if (bestScore < 0.15) return null;
    return { phoneme: bestPhoneme, confidence: bestScore };
  }

  /** 同步版本（向后兼容，但会阻塞 UI） */
  analyzeBuffer(audio16k: Float32Array): PhonemeMatch | null {
    const f = spectralFeatures(audio16k);
    if (!f) return null;
    const scores = scorePhonemes(f);
    let bestPhoneme = '';
    let bestScore = 0;
    for (const [ph, score] of Object.entries(scores)) {
      if (score > bestScore) { bestScore = score; bestPhoneme = ph; }
    }
    if (bestScore < 0.15) return null;
    return { phoneme: bestPhoneme, confidence: bestScore };
  }

  /** 异步版：从原始 PCM 分析，不阻塞 UI */
  async analyzeAsync(rawData: Float32Array, sampleRate: number): Promise<PhonemeMatch | null> {
    const audio16k = sampleRate !== TARGET_SR
      ? resample(rawData, sampleRate, TARGET_SR)
      : rawData;
    return this.analyzeBufferAsync(audio16k);
  }

  /**
   * 从原始 PCM 数据（任意采样率）分析（同步，会阻塞）
   */
  analyze(rawData: Float32Array, sampleRate: number): PhonemeMatch | null {
    const audio16k = sampleRate !== TARGET_SR
      ? resample(rawData, sampleRate, TARGET_SR)
      : rawData;
    return this.analyzeBuffer(audio16k);
  }

  /**
   * 兼容旧接口
   */
  analyzeFrame(_freq: Uint8Array, _time: Float32Array): PhonemeMatch | null {
    return null; // use analyze() with full buffer instead
  }
}
