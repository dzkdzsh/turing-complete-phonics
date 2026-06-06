'use client';

import dynamic from 'next/dynamic';

const PhaserGame = dynamic(() => import('@/components/game/PhaserGame'), { ssr: false });

interface GameLayoutProps {
  children?: React.ReactNode;
  levelKey?: string;
}

export default function GameLayout({ children, levelKey }: GameLayoutProps) {
  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: '#1a1814' }}>
      {/* Phaser canvas — video rendered inside the scene */}
      <div className="absolute inset-0 z-10">
        <PhaserGame key={levelKey || 'game'} />
      </div>

      {/* React UI overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <div className="pointer-events-auto">{children}</div>
      </div>
    </div>
  );
}
