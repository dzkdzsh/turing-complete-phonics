// 关卡配置的完整类型定义

export type MechanicType =
  | 'drag_to_resonate'
  | 'sound_match'
  | 'sound_lab'
  | 'mic_validate'
  | 'connect_and_blend'
  | 'multi_blend'
  | 'invent_letter'
  | 'hear_and_spell'
  | 'memory_spell'
  | 'encoding_board';

export type InputType = 'mouse' | 'mic' | 'mouse_and_mic';

export type WinConditionType =
  | 'all_resonators_active'
  | 'all_pairs_matched'
  | 'all_sounds_produced'
  | 'all_blenders_filled'
  | 'target_blend_achieved'
  | 'all_tiles_mapped'
  | 'encoding_board_complete';

export interface WinCondition {
  type: WinConditionType;
  targets?: BlendTarget[];
  maxAttempts?: number;
  timeLimitSec?: number;
  requiredPhonemes?: string[];
  micConfidenceThreshold?: number;
}

export interface BlendTarget {
  inputPhonemes: string[];
  expectedOutput: string;
}

export interface FailureMode {
  description: string;
  descriptionEn: string;
  triggerCondition: string;
  hintIndex: number;
}

export interface GameSceneConfig {
  background: string;
  ambientSound?: string;
  camera?: { x: number; y: number; width: number; height: number };
}

export interface ConnectorPortDef {
  id: string;
  direction: 'input' | 'output';
  position: { x: number; y: number };
  acceptedPhonemes?: string[];
}

export interface GameObjectDef {
  id: string;
  type:
    | 'sound_creature'
    | 'resonator'
    | 'blender'
    | 'blank_tile'
    | 'letter_tile'
    | 'connection_port'
    | 'encoding_slot'
    | 'target_zone'
    | 'mouth_shape';
  position: { x: number; y: number };
  draggable?: boolean;
  droppable?: boolean;
  accepts?: string[];
  phoneme?: string;
  letterSymbol?: string;
  initialState?: 'hidden' | 'locked' | 'active' | 'disabled';
  spriteKey?: string;
  label?: string;
  labelEn?: string;
  tooltip?: string;
  onInteractAnimation?: 'pulse' | 'shake' | 'glow' | 'expand';
  onInteractSound?: string;
  ports?: ConnectorPortDef[];
}

export interface AudioClipDef {
  id: string;
  file: string;
  type: 'phoneme' | 'blend' | 'sfx' | 'ambient';
  phoneme?: string;
}

export interface HintDef {
  hintIndex: number;
  text: string;
  textEn: string;
  highlightObjectIds?: string[];
  autoShowAfterSec?: number;
  autoShowAfterAttempts?: number;
}

export interface LevelConfig {
  levelId: string;
  levelNumber: number;
  era: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  titleEn: string;
  subtitle: string;
  learningGoal: string;
  learningGoalEn: string;
  unlocks: string;
  unlocksMechanic?: MechanicType;
  mechanicType: MechanicType;
  inputType: InputType;
  winCondition: WinCondition;
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimatedDurationSec: number;
  isBossLevel: boolean;
  requiresMic: boolean;
  gameScene: GameSceneConfig;
  gameObjects: GameObjectDef[];
  words?: string[];
  audioClips: AudioClipDef[];
  hints: HintDef[];
  failureModes: FailureMode[];
  introText: string;
  introTextEn: string;
  victoryText: string;
  victoryTextEn: string;
  prerequisiteLevels: string[];
  requiredStarsToUnlock: number;
}
