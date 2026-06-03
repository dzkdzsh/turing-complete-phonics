// 事件总线事件名常量

export const GameEvents = {
  // Phaser → React
  SCENE_READY: 'scene:ready',
  LEVEL_LOADED: 'level:loaded',
  WIN_CONDITION_MET: 'win:condition-met',
  LEVEL_FAILED: 'level:failed',
  HINT_REQUESTED: 'hint:requested',
  MIC_STATUS_CHANGED: 'mic:status-changed',
  PHONEME_DETECTED: 'phoneme:detected',
  AUDIO_PLAYING: 'audio:playing',

  // React → Phaser
  START_LEVEL: 'cmd:start-level',
  RESET_LEVEL: 'cmd:reset-level',
  SHOW_HINT: 'cmd:show-hint',
  PLAY_PHONEME: 'cmd:play-phoneme',
  PAUSE_GAME: 'cmd:pause',
  RESUME_GAME: 'cmd:resume',
  MIC_START: 'cmd:mic-start',
  MIC_STOP: 'cmd:mic-stop',
} as const;

export interface WinConditionMetPayload {
  levelId: string;
  stars: number;
  timeSec: number;
}

export interface LevelFailedPayload {
  levelId: string;
  failReason: string;
}

export interface PhonemeDetectedPayload {
  phoneme: string;
  confidence: number;
}

export interface MicStatusPayload {
  status: 'idle' | 'listening' | 'detected' | 'error';
}
