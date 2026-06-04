'use client';

import dynamic from 'next/dynamic';

const PhaserGame = dynamic(() => import('@/components/game/PhaserGame'), { ssr: false });
const ThreeBg = dynamic(() => import('@/components/game/ThreeBg'), { ssr: false });

interface GameLayoutProps {
  children?: React.ReactNode;
  levelKey?: string;
}

export default function GameLayout({ children, levelKey }: GameLayoutProps) {
  return (
    <div className="relative w-full h-screen overflow-hidden" style={{background:'#1a1814'}}>
      {/* 3D 背景层 */}
      <ThreeBg />

      {/* Phaser 画布层 — key 确保换关时完全重建 */}
      <div className="absolute inset-0 z-10">
        <PhaserGame key={levelKey || 'game'} />
      </div>

      {/* React UI 叠加层 */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <div className="pointer-events-auto">{children}</div>
      </div>
    </div>
  );
}
