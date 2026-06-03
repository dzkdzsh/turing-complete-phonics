// Phaser 游戏对象的运行时接口（供 src/game/ 使用）

export interface GameObjects {
  id: string;
  phoneme?: string;
  letterSymbol?: string;
  isActive: boolean;
  activate(): void;
  deactivate(): void;
  reset(): void;
}
