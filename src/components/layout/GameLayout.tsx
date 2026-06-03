'use client';

import dynamic from 'next/dynamic';

const PhaserGame = dynamic(
  () => import('@/components/game/PhaserGame'),
  { ssr: false }
);

interface GameLayoutProps {
  children?: React.ReactNode;
}

export default function GameLayout({ children }: GameLayoutProps) {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#1a1814]">
      {/* Phaser 画布层 */}
      <div className="absolute inset-0 z-0">
        <PhaserGame />
      </div>

      {/* React UI 叠加层 */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="pointer-events-auto">{children}</div>
      </div>
    </div>
  );
}
