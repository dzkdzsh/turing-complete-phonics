// Phoneme DFT Worker — runs heavy FFT computation off main thread
const FFT_SIZE = 2048;
const HOP_SIZE = 512;
const TARGET_SR = 16000;

// Hamming window
const HAMMING = new Float32Array(FFT_SIZE);
for (let i = 0; i < FFT_SIZE; i++)
  HAMMING[i] = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (FFT_SIZE - 1));

function dftFrame(samples, offset) {
  const N = FFT_SIZE;
  const real = new Float32Array(N);
  for (let i = 0; i < N; i++) real[i] = samples[offset + i] * HAMMING[i];
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

function resample(audio, fromRate, toRate) {
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

function scorePhonemes(f) {
  const scores = { m: 0, s: 0, a: 0 };
  if (f.low400Ratio > 0.40) scores.m += 0.45;
  if (f.low400Ratio > 0.55) scores.m += 0.25;
  if (f.low600Ratio > 0.55) scores.m += 0.15;
  if (f.centroid < 1500 && f.low400Ratio > 0.30) scores.m += 0.15;
  if (f.zcr < 0.10) scores.m += 0.10;
  if (f.highRatio < 0.12) scores.m += 0.05;
  if (f.centroid > 3500) scores.s += 0.45;
  if (f.centroid > 5000) scores.s += 0.20;
  if (f.highRatio > 0.25) scores.s += 0.20;
  if (f.low400Ratio < 0.12) scores.s += 0.10;
  if (f.zcr > 0.12) scores.s += 0.05;
  if (f.centroid >= 800 && f.centroid <= 2200) scores.a += 0.40;
  if (f.midRatio > 0.25) scores.a += 0.25;
  if (f.low400Ratio >= 0.10 && f.low400Ratio <= 0.40) scores.a += 0.15;
  if (f.highRatio < 0.18) scores.a += 0.10;
  if (f.zcr < 0.10) scores.a += 0.10;
  if (f.centroid > 1800 && f.low400Ratio < 0.25) scores.m = Math.max(0, scores.m - 0.3);
  if (f.low400Ratio > 0.55) scores.a = Math.max(0, scores.a - 0.3);
  if (f.low400Ratio > 0.25) scores.s = Math.max(0, scores.s - 0.3);
  return scores;
}

self.onmessage = function (e) {
  const { audio, sampleRate } = e.data;

  // Resample to 16kHz
  const audio16k = resample(audio, sampleRate, TARGET_SR);

  if (audio16k.length < FFT_SIZE) {
    self.postMessage({ error: 'too_short' });
    return;
  }

  const binFreq = TARGET_SR / FFT_SIZE;
  const totalFrames = Math.floor((audio16k.length - FFT_SIZE) / HOP_SIZE);
  if (totalFrames === 0) {
    self.postMessage({ error: 'no_frames' });
    return;
  }

  // Compute all DFT frames
  const allMags = [];
  for (let fi = 0; fi < totalFrames; fi++) {
    allMags.push(dftFrame(audio16k, fi * HOP_SIZE));
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

  if (frameCount === 0) {
    self.postMessage({ error: 'silence' });
    return;
  }

  // ZCR
  let zcr = 0, zcrCount = 0;
  for (let i = 1; i < audio16k.length; i++) {
    if (Math.abs(audio16k[i]) > 0.01) {
      if (audio16k[i - 1] * audio16k[i] < 0) zcr++;
      zcrCount++;
    }
  }

  const features = {
    centroid: totalCentroid / frameCount,
    low400Ratio: totalLow400 / frameCount,
    low600Ratio: totalLow600 / frameCount,
    midRatio: totalMid / frameCount,
    highRatio: totalHigh / frameCount,
    zcr: zcrCount > 0 ? zcr / zcrCount : 0,
    totalFrames: frameCount,
    totalPossibleFrames: totalFrames,
  };

  const scores = scorePhonemes(features);
  let bestPhoneme = '';
  let bestScore = 0;
  for (const [ph, score] of Object.entries(scores)) {
    if (score > bestScore) { bestScore = score; bestPhoneme = ph; }
  }

  self.postMessage({
    features,
    scores,
    bestPhoneme,
    bestScore,
  });
};
