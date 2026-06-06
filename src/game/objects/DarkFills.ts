// Bright fill palette for game object interiors
const FILLS = [
  0xfef6e8, // warm cream
  0xeaf7f4, // mint white
  0xf2eff7, // lavender white
  0xfdf2f5, // rose white
  0xfff7ed, // peach cream
  0xf0fdfa, // aqua white
  0xfef2f2, // red tint
  0xf5f3ff, // violet tint
  0xfdf8f0, // paper
  0xf5ede0, // warm sand
  0xefe5d2, // golden sand
  0xe8f5e9, // sage white
];

export function randomDarkFill(): number {
  return FILLS[Math.floor(Math.random() * FILLS.length)];
}
