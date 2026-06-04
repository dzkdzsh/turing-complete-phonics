// 本地 localStorage 进度持久化

const PROGRESS_KEY = 'phonics_progress';

interface StoredProgress {
  completedLevels: string[];
  levelStars: Record<string, number>;
}

function readProgress(): StoredProgress {
  if (typeof window === 'undefined') return { completedLevels: [], levelStars: {} };
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : { completedLevels: [], levelStars: {} };
  } catch {
    return { completedLevels: [], levelStars: {} };
  }
}

function writeProgress(data: StoredProgress) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
}

export function saveProgress(
  levelId: string,
  stars: number,
  _completionData: Record<string, unknown> = {}
) {
  const progress = readProgress();
  if (!progress.completedLevels.includes(levelId)) {
    progress.completedLevels.push(levelId);
  }
  progress.levelStars[levelId] = Math.max(progress.levelStars[levelId] || 0, stars);
  writeProgress(progress);
}

export function loadProgress(): StoredProgress {
  return readProgress();
}
