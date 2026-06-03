'use client';

import { useSearchParams } from 'next/navigation';
import GameLayout from '@/components/layout/GameLayout';
import HUD from '@/components/game/HUD';

export default function BossPage() {
  const searchParams = useSearchParams();
  const levelId = searchParams.get('level') || '005-boss-sounds';

  return (
    <GameLayout>
      <HUD levelId={levelId} isBoss />
    </GameLayout>
  );
}
