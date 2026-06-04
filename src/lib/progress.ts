// Supabase 进度持久化

import { createClient } from './supabase/client';

export async function saveProgress(
  levelId: string,
  stars: number,
  completionData: Record<string, unknown> = {}
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('user_progress').upsert(
    {
      user_id: user.id,
      level_id: levelId,
      completed: true,
      stars,
      completion_data: completionData,
      completed_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,level_id' }
  );
}

export async function loadProgress() {
  // DEV BYPASS — return empty progress (local only)
  return { completedLevels: [], levelStars: {} };
}

// 关卡快照读写
export async function saveSnapshot(
  levelId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  snapshotData: any,
  elapsedSec: number
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('level_snapshots').upsert(
    {
      user_id: user.id,
      level_id: levelId,
      snapshot_data: snapshotData,
      elapsed_sec: elapsedSec,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,level_id' }
  );
}

export async function loadSnapshot(levelId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('level_snapshots')
    .select('*')
    .eq('user_id', user.id)
    .eq('level_id', levelId)
    .maybeSingle();

  return data ?? null;
}

export async function deleteSnapshot(levelId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('level_snapshots')
    .delete()
    .eq('user_id', user.id)
    .eq('level_id', levelId);
}
