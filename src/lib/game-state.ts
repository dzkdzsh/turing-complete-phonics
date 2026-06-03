// Zustand 游戏状态管理

import { create } from 'zustand';

export type ScreenState =
  | 'loading'
  | 'splash'
  | 'era-map'
  | 'level-select'
  | 'gameplay'
  | 'boss'
  | 'victory';

interface GameStore {
  // 认证
  userId: string | null;
  isAnonymous: boolean;
  setUser: (userId: string, isAnonymous: boolean) => void;

  // 导航
  currentEra: number | null;
  currentLevelId: string | null;
  screenState: ScreenState;
  setScreen: (state: ScreenState) => void;
  setCurrentEra: (era: number | null) => void;
  setCurrentLevel: (levelId: string | null) => void;

  // 进度
  completedLevels: string[];
  levelStars: Record<string, number>;
  unlockedLevels: string[];
  unlockedEras: number[];
  completeLevel: (levelId: string, stars: number) => void;
  unlockLevel: (levelId: string) => void;
  unlockEra: (era: number) => void;
  loadProgress: (data: {
    completedLevels: string[];
    levelStars: Record<string, number>;
    unlockedLevels: string[];
    unlockedEras: number[];
  }) => void;

  // 游戏临时状态
  isPaused: boolean;
  isMicActive: boolean;
  currentHintIndex: number;
  setPaused: (paused: boolean) => void;
  setMicActive: (active: boolean) => void;
  setCurrentHintIndex: (index: number) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  // 认证
  userId: null,
  isAnonymous: true,
  setUser: (userId, isAnonymous) => set({ userId, isAnonymous }),

  // 导航
  currentEra: null,
  currentLevelId: null,
  screenState: 'loading',
  setScreen: (screenState) => set({ screenState }),
  setCurrentEra: (currentEra) => set({ currentEra }),
  setCurrentLevel: (currentLevelId) => set({ currentLevelId }),

  // 进度
  completedLevels: [],
  levelStars: {},
  unlockedLevels: ['001-discover-m'],
  unlockedEras: [1],
  completeLevel: (levelId, stars) =>
    set((state) => ({
      completedLevels: state.completedLevels.includes(levelId)
        ? state.completedLevels
        : [...state.completedLevels, levelId],
      levelStars: {
        ...state.levelStars,
        [levelId]: Math.max(state.levelStars[levelId] || 0, stars),
      },
    })),
  unlockLevel: (levelId) =>
    set((state) => ({
      unlockedLevels: state.unlockedLevels.includes(levelId)
        ? state.unlockedLevels
        : [...state.unlockedLevels, levelId],
    })),
  unlockEra: (era) =>
    set((state) => ({
      unlockedEras: state.unlockedEras.includes(era)
        ? state.unlockedEras
        : [...state.unlockedEras, era],
    })),
  loadProgress: (data) =>
    set({
      completedLevels: data.completedLevels,
      levelStars: data.levelStars,
      unlockedLevels: data.unlockedLevels,
      unlockedEras: data.unlockedEras,
    }),

  // 游戏临时状态
  isPaused: false,
  isMicActive: false,
  currentHintIndex: 0,
  setPaused: (isPaused) => set({ isPaused }),
  setMicActive: (isMicActive) => set({ isMicActive }),
  setCurrentHintIndex: (currentHintIndex) => set({ currentHintIndex }),
}));
