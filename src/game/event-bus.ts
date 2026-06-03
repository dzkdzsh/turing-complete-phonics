// 共享事件总线单例 —— 所有 React ↔ Phaser 通信的唯一通道
// 延迟初始化，避免服务端渲染时加载 Phaser（Phaser 依赖 window 对象）

import type * as PhaserTypes from 'phaser';

let _eventBus: PhaserTypes.Events.EventEmitter | null = null;

function getEventBus(): PhaserTypes.Events.EventEmitter {
  if (!_eventBus) {
    // 动态 require Phaser 仅在浏览器环境中
    const Phaser = require('phaser');
    _eventBus = new Phaser.Events.EventEmitter();
  }
  return _eventBus;
}

export const eventBus = new Proxy({} as PhaserTypes.Events.EventEmitter, {
  get(_target, prop) {
    return (getEventBus() as Record<string | symbol, unknown>)[prop];
  },
});
