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
  /** 0–500Hz 能量占比（浊音/鼻音检测） */
  lowFreqRatio: number;
  /** 800–2200Hz 能量占比（元音共振峰区域） */
  midFreqRatio: number;
  /** >3500Hz 能量占比（擦音检测） */
  highFreqRatio: number;
}
