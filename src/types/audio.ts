// 音频相关类型

export interface AudioClipDef {
  id: string;
  file: string;
  type: 'phoneme' | 'blend' | 'sfx' | 'ambient';
  phoneme?: string;
}

export interface PhonemeProfile {
  phoneme: string;
  f1Range: [number, number];
  f2Range: [number, number];
  voiced: boolean;
  type: 'vowel' | 'nasal' | 'fricative' | 'stop' | 'approximant';
  specialRules?: 'high_freq_noise' | 'low_freq_peak' | 'spectral_zero';
}

export interface PhonemeMatch {
  phoneme: string;
  confidence: number;
}

export interface AnalysisResult {
  f1: number;
  f2: number;
  isVoiced: boolean;
  spectralCentroid: number;
  rmsLevel: number;
}
