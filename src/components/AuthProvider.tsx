'use client';

import { createClient } from '@/lib/supabase/client';
import { useGameStore } from '@/lib/game-state';
import { useEffect } from 'react';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, loadProgress: loadStoreProgress } = useGameStore();

  useEffect(() => {
    const initAuth = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('your-project')) {
        console.log('[Auth] Supabase 未配置，使用离线模式');
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error || !data.user) {
          console.error('匿名登录失败:', error?.message);
          return;
        }

        const userId = data.user.id;
        setUser(userId, data.user.is_anonymous ?? true);

        const { data: progress } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', userId);

        if (progress) {
          const completedLevels: string[] = [];
          const levelStars: Record<string, number> = {};
          for (const row of progress) {
            if (row.completed) {
              completedLevels.push(row.level_id);
              levelStars[row.level_id] = row.stars || 0;
            }
          }
          loadStoreProgress({
            completedLevels,
            levelStars,
            unlockedLevels: buildUnlockedList(completedLevels),
            unlockedEras: buildUnlockedEras(completedLevels),
          });
        }
      } catch {
        console.log('[Auth] 无法连接 Supabase，使用离线模式');
      }
    };

    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
