// PhonemeTokenMap —— 音素 ↔ wav2vec2 token ID 映射表
// wav2vec2-base-960h 词表 (32 tokens): a b c d e f g h i j k l m n o p q r s t u v w x y z ' <space> <pad> <s> </s> <unk>

const PHONEME_TO_TOKEN_ID: Record<string, number> = {
  a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7, i: 8,
  j: 9, k: 10, l: 11, m: 12, n: 13, o: 14, p: 15, q: 16,
  r: 17, s: 18, t: 19, u: 20, v: 21, w: 22, x: 23, y: 24, z: 25,
};

const TOKEN_ID_TO_LETTER: Record<number, string> = Object.fromEntries(
  Object.entries(PHONEME_TO_TOKEN_ID).map(([k, v]) => [v, k])
);

export function phonemeToTokenId(phoneme: string): number | null {
  const normalized = phoneme.toLowerCase().replace(/[\/\s]/g, '');
  return PHONEME_TO_TOKEN_ID[normalized] ?? null;
}

export function tokenIdToLetter(id: number): string {
  return TOKEN_ID_TO_LETTER[id] || '?';
}

export function isDirectMapped(phoneme: string): boolean {
  return phonemeToTokenId(phoneme) !== null;
}
