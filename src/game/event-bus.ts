// 共享事件总线单例 —— 所有 React ↔ Phaser 通信的唯一通道
// 延迟初始化，避免服务端渲染时加载 Phaser（Phaser 依赖 window 对象）

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventHandler = (...args: any[]) => void;

interface EventBusLike {
  on: (event: string, fn: EventHandler) => void;
  off: (event: string, fn: EventHandler) => void;
  emit: (event: string, ...args: unknown[]) => void;
}

let _eventBus: EventBusLike | null = null;

function getEventBus(): EventBusLike {
  if (!_eventBus) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Phaser = require('phaser');
    _eventBus = new Phaser.Events.EventEmitter() as unknown as EventBusLike;
  }
  return _eventBus;
}

function createProxy(): EventBusLike {
  return {
    on(event: string, fn: EventHandler) {
      getEventBus().on(event, fn);
    },
    off(event: string, fn: EventHandler) {
      getEventBus().off(event, fn);
    },
    emit(event: string, ...args: unknown[]) {
      getEventBus().emit(event, ...args);
    },
  };
}

export const eventBus: EventBusLike = createProxy();
