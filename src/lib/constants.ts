// 游戏常量配置

export const ERAS = {
  1: {
    name: '声音世界',
    nameEn: 'The Sound World',
    description: '发现声音是独立的对象',
    color: '#F59E0B', // 琥珀色
    totalLevels: 10,
  },
  2: {
    name: '声音机器',
    nameEn: 'The Sound Machine',
    description: '发现声音可以被组合',
    color: '#06B6D4', // 青色
    totalLevels: 10,
  },
  3: {
    name: '字母革命',
    nameEn: 'The Alphabet Revolution',
    description: '发明符号来表示声音',
    color: '#8B5CF6', // 紫色
    totalLevels: 10,
  },
} as const;

// 音素对应颜色
export const PHONEME_COLORS: Record<string, number> = {
  m: 0xF59E0B, n: 0xF59E0B,   // 鼻音 - 暖橙
  s: 0x06B6D4,                 // 擦音 - 冷青
  a: 0x10B981,                 // 元音 - 柔绿
  k: 0xD97706, t: 0xD97706, p: 0xD97706,  // 塞音 - 琥珀
  ae: 0xEC4899,                // 次开元音 - 粉
  f: 0x8B5CF6,                 // 擦音 - 紫
  g: 0x06B6D4,                 // 塞音 - 青
  h: 0xEC4899,                 // 声门擦音
  sh: 0xF59E0B, ch: 0x06B6D4, th: 0x8B5CF6,  // 双字母组合
};

// Phaser 场景键名
export const SCENES = {
  BOOT: 'BootScene',
  PRELOAD: 'PreloadScene',
  GAMEPLAY: 'GameplayScene',
  BOSS_GAMEPLAY: 'BossGameplayScene',
} as const;

// 游戏画布尺寸
export const GAME_WIDTH = 1024;
export const GAME_HEIGHT = 600;
