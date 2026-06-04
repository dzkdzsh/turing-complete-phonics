'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/game-state';
import { getCurrentUser, getUserProfile } from '@/lib/auth';
import { loadProgress } from '@/lib/progress';

// 不需要登录即可访问的路由
const PUBLIC_ROUTES = ['/', '/auth/login', '/auth/register'];

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    userId,
    setUser,
    setIsAdmin,
    setUsername,
    loadProgress: loadStoreProgress,
  } = useGameStore();

  useEffect(() => {
    const checkAuth = async () => {
      const isPublic = PUBLIC_ROUTES.includes(pathname);
      const user = await getCurrentUser();

      if (!user) {
        // 未登录时，只允许访问公开路由
        if (!isPublic) {
          router.replace('/auth/login');
        }
        return;
      }

      // 已登录，更新 store
      setUser(user.id);

      // 读取用户档案（管理员检测）
      const profile = await getUserProfile(user.id);
      if (profile) {
        setIsAdmin(profile.is_admin ?? false);
        setUsername(profile.username ?? '');
      }

      // 加载云端进度
      try {
        const progress = await loadProgress();
        if (progress) {
          loadStoreProgress({
            completedLevels: progress.completedLevels,
            levelStars: progress.levelStars,
            unlockedLevels: buildUnlockedList(progress.completedLevels),
            unlockedEras: buildUnlockedEras(progress.completedLevels),
          });
        }
      } catch {
        // 加载失败不影响使用
      }

      // 如果已登录但访问公开路由，跳转时代地图
      if (isPublic) {
        router.replace('/era-select');
      }
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return <>{children}</>;
}

function buildUnlockedList(completed: string[]): string[] {
  const allUnlocked = ['001-discover-m'];
  const chain = [
    '001-discover-m', '002-discover-s', '003-sound-match',
    '004-sound-lab', '005-boss-sounds', '006-blend-ma',
    '007-blend-sa', '008-blend-kat', '009-invent-m',
    '010-encoding-board',
  ];
  for (let i = 0; i < chain.length - 1; i++) {
    if (completed.includes(chain[i])) allUnlocked.push(chain[i + 1]);
  }
  return allUnlocked;
}

function buildUnlockedEras(completed: string[]): number[] {
  const eras: number[] = [1];
  if (completed.includes('005-boss-sounds')) eras.push(2);
  if (completed.includes('008-blend-kat')) eras.push(3);
  return eras;
}
