'use client';

import { useEffect, useRef } from 'react';
import { createGameConfig } from '@/game/config';

// 模块级标志：防止 Strict Mode 下的双重初始化
let globalGameInstance: Phaser.Game | null = null;
let destroyScheduled = false;

export default function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (globalGameInstance) return;

    const config = createGameConfig(containerRef.current);
    globalGameInstance = new Phaser.Game(config);
    (window as unknown as Record<string, unknown>).__PHASER_GAME__ = globalGameInstance;

    // Strict Mode 下不清除 —— 游戏实例需跨双挂载存活
    return () => {
      // 只在第二次 cleanup 时销毁（真正的卸载）
      if (destroyScheduled) {
        globalGameInstance?.destroy(true);
        globalGameInstance = null;
        destroyScheduled = false;
        (window as unknown as Record<string, unknown>).__PHASER_GAME__ = null;
      } else {
        destroyScheduled = true;
      }
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
