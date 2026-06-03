'use client';

import { useEffect, useRef } from 'react';
import { createGameConfig } from '@/game/config';

// 模块级标志：防止 Strict Mode 下的双重初始化
let globalGameInstance: Phaser.Game | null = null;

export default function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (globalGameInstance) return;

    const config = createGameConfig(containerRef.current);
    globalGameInstance = new Phaser.Game(config);

    return () => {
      globalGameInstance?.destroy(true);
      globalGameInstance = null;
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
