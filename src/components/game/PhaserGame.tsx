'use client';

import { useEffect, useRef } from 'react';
import { createGameConfig } from '@/game/config';

export default function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Strict Mode 防护：避免 double-init
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (!containerRef.current) return;

    const config = createGameConfig(containerRef.current);
    gameRef.current = new Phaser.Game(config);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
      initializedRef.current = false;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="game-container"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
