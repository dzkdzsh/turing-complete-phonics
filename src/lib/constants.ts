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
  4: {
    name: '听写工坊',
    nameEn: 'Dictation Workshop',
    description: '听见单词，拼出字母——逆向编码',
    color: '#e64980', // 玫红
    totalLevels: 5,
  },
  5: {
    name: '记忆宫殿',
    nameEn: 'Memory Palace',
    description: '看词→隐去→默写——真正的记忆挑战',
    color: '#f97316',
    totalLevels: 4,
  },
  6: {
    name: '句子工坊',
    nameEn: 'Sentence Workshop',
    description: '单词到句子——真正的阅读起点',
    color: '#14b8a6',
    totalLevels: 3,
  },
  7: { name: '语文工坊', nameEn: 'Chinese Exam', description: '文言实词·古诗鉴赏·文学常识', color: '#ef4444', totalLevels: 4 },
  8: { name: '历史工坊', nameEn: 'History Exam', description: '古代史·近现代史·综合', color: '#8b5cf6', totalLevels: 3 },
} as const;

// 音素对应颜色
export const PHONEME_COLORS: Record<string, number> = {
  m: 0x555555,   // dark gray
  s: 0x444444,   // dark gray
  a: 0x333333,   // dark gray
  k: 0x444444,   // dark gray
  ae: 0x333333,  // dark gray
  t: 0x555555,   // dark gray
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
