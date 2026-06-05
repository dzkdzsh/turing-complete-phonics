'use client';

import { useEffect, useRef } from 'react';
import { createGameConfig } from '@/game/config';

// 全局单例追踪 —— 用 mountId 区分 SPA 导航 vs Strict Mode 双挂载
let globalGame: Phaser.Game | null = null;
let currentMountId = 0;

export default function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountIdRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 分配 mountId
    mountIdRef.current = ++currentMountId;
    const myMountId = mountIdRef.current;

    // 如果已有旧实例，强制销毁（SPA 导航场景）
    if (globalGame) {
      globalGame.destroy(true);
      globalGame = null;
    }

    // 清理 window 残留
    const win = window as unknown as Record<string, unknown>;
    win.__PHASER_GAME__ = null;

    // 创建新实例
    const config = createGameConfig(container);
    globalGame = new Phaser.Game(config);
    win.__PHASER_GAME__ = globalGame;

    return () => {
      // 只有当前 mount 被卸载时才销毁（防止 Strict Mode 双 render 误杀）
      if (mountIdRef.current === myMountId) {
        globalGame?.destroy(true);
        globalGame = null;
        win.__PHASER_GAME__ = null;
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
