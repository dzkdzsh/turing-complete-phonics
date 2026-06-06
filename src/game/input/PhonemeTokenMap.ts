// PhonemeTokenMap —— 音素 ↔ wav2vec2 token 映射表
// wav2vec2-base-960h 词表共 32 个 token（索引 0-31）：
// a b c d e f g h i j k l m n o p q r s t u v w x y z ' <space> <pad> <s> </s> <unk>

/** 音素 → wav2vec2 token 索引（仅直接映射的 21 个辅音字母+元音字母） */
const PHONEME_TO_TOKEN_ID: Record<string, number> = {
  a: 0,  b: 1,  d: 3,  e: 4,  f: 5,  g: 6,  h: 7,
  i: 8,  k: 10, l: 11, m: 12, n: 13, o: 14, p: 15,
  r: 17, s: 18, t: 19, u: 20, v: 21, w: 22, z: 25,
};

/** 反向映射：token 索引 → 字母 */
const TOKEN_ID_TO_LETTER: Record<number, string> = {};
for (const [ph, id] of Object.entries(PHONEME_TO_TOKEN_ID)) {
  TOKEN_ID_TO_LETTER[id] = ph;
}
// 补充无直接映射的 token
TOKEN_ID_TO_LETTER[2]  = 'c';
TOKEN_ID_TO_LETTER[9]  = 'j';
TOKEN_ID_TO_LETTER[16] = 'q';
TOKEN_ID_TO_LETTER[23] = 'x';
TOKEN_ID_TO_LETTER[24] = 'y';
TOKEN_ID_TO_LETTER[26] = "'";
TOKEN_ID_TO_LETTER[27] = '<space>';
TOKEN_ID_TO_LETTER[28] = '<pad>';
TOKEN_ID_TO_LETTER[29] = '<s>';
TOKEN_ID_TO_LETTER[30] = '</s>';
TOKEN_ID_TO_LETTER[31] = '<unk>';

/** 音素 → token ID，无直接映射时返回 null */
export function phonemeToTokenId(phoneme: string): number | null {
  const normalized = phoneme.toLowerCase().replace(/[^a-z]/g, '');
  return PHONEME_TO_TOKEN_ID[normalized] ?? null;
}

/** token ID → 字母 */
export function tokenIdToLetter(id: number): string {
  return TOKEN_ID_TO_LETTER[id] ?? '?';
}

/** 检查音素是否有直接 wav2vec2 token 映射 */
export function isDirectMapped(phoneme: string): boolean {
  return phonemeToTokenId(phoneme) !== null;
}

/** 所有直接映射的 token ID 集合（用于 GPU 后验提取） */
export const DIRECT_TOKEN_IDS: Set<number> = new Set(Object.values(PHONEME_TO_TOKEN_ID));

/** 直接映射计数 */
export const DIRECT_MAPPED_COUNT = Object.keys(PHONEME_TO_TOKEN_ID).length;
