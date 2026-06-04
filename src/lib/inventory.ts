// 物品系统 —— 维护已获得的音素、字母、机制集合

// 每个关卡解锁的物品定义
interface LevelUnlocks {
  levelId: string;
  phonemes: string[];       // 解锁的音素
  letters: string[];        // 解锁的字母
  mechanics: string[];      // 解锁的机制
}

// 10 个关卡的解锁定义
const LEVEL_UNLOCKS: LevelUnlocks[] = [
  { levelId: '001-discover-m', phonemes: ['m'], letters: [], mechanics: ['drag_to_resonate'] },
  { levelId: '002-discover-s', phonemes: ['s'], letters: [], mechanics: [] },
  { levelId: '003-sound-match', phonemes: [], letters: [], mechanics: ['sound_match'] },
  { levelId: '004-sound-lab', phonemes: ['a'], letters: [], mechanics: ['sound_lab'] },
  { levelId: '005-boss-sounds', phonemes: [], letters: [], mechanics: ['mic_validate'] },
  { levelId: '006-blend-ma', phonemes: ['m', 'a'], letters: [], mechanics: ['connect_and_blend'] },
  { levelId: '007-blend-sa', phonemes: ['s'], letters: [], mechanics: [] },
  { levelId: '008-blend-kat', phonemes: ['k', 'ae', 't'], letters: [], mechanics: ['multi_blend'] },
  { levelId: '009-invent-m', phonemes: [], letters: ['m'], mechanics: ['invent_letter'] },
  { levelId: '010-encoding-board', phonemes: [], letters: ['s', 'a'], mechanics: ['encoding_board'] },
];

// 所有关卡的有序列表
const LEVEL_ORDER = LEVEL_UNLOCKS.map((u) => u.levelId);

/** 获取完成指定关卡后累积解锁的所有物品 */
export function getUnlocksUpTo(levelId: string): {
  phonemes: Set<string>;
  letters: Set<string>;
  mechanics: Set<string>;
} {
  const phonemes = new Set<string>();
  const letters = new Set<string>();
  const mechanics = new Set<string>();

  for (const entry of LEVEL_UNLOCKS) {
    for (const p of entry.phonemes) phonemes.add(p);
    for (const l of entry.letters) letters.add(l);
    for (const m of entry.mechanics) mechanics.add(m);

    if (entry.levelId === levelId) break;
  }

  return { phonemes, letters, mechanics };
}

/** 获取管理员进入指定关卡时所需的全部前置物品 */
export function getAdminInventoryForLevel(levelId: string) {
  const idx = LEVEL_ORDER.indexOf(levelId);
  if (idx <= 0) return getUnlocksUpTo(levelId);

  // 获取前一个关卡的累积物品
  const prevLevelId = LEVEL_ORDER[idx - 1];
  return getUnlocksUpTo(prevLevelId);
}

/** 全部 10 关 */
export { LEVEL_ORDER };
