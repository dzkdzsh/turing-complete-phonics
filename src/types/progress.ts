// 用户进度相关类型

export interface UserProgress {
  userId: string;
  levelId: string;
  completed: boolean;
  stars: 0 | 1 | 2 | 3;
  score: number;
  completionData: Record<string, unknown> | null;
  completedAt: string | null;
}

export interface EraProgress {
  eraNumber: number;
  completedLevels: number;
  totalLevels: number;
  totalStars: number;
  isUnlocked: boolean;
}
