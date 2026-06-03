// WinConditionSystem —— 胜利条件判定

import * as Phaser from 'phaser';
import type { LevelConfig, WinCondition } from '@/types/level';
import { eventBus } from '../event-bus';
import { GameEvents } from '@/types/events';
import type { WinConditionMetPayload } from '@/types/events';
import { DragDropSystem } from './DragDropSystem';

export class WinConditionSystem {
  private scene: Phaser.Scene;
  private levelConfig: LevelConfig;
  private dragDropSystem: DragDropSystem;
  private startTime: number;
  private attemptCount = 0;
  private hasWon = false;
  private hasFailed = false;

  constructor(
    scene: Phaser.Scene,
    levelConfig: LevelConfig,
    dragDropSystem: DragDropSystem
  ) {
    this.scene = scene;
    this.levelConfig = levelConfig;
    this.dragDropSystem = dragDropSystem;
    this.startTime = Date.now();
  }

  /** 每帧检测 */
  update() {
    if (this.hasWon || this.hasFailed) return;

    const cond = this.levelConfig.winCondition;

    // 检查时间限制
    if (cond.timeLimitSec) {
      const elapsed = (Date.now() - this.startTime) / 1000;
      if (elapsed > cond.timeLimitSec) {
        this.onFail('timeout');
        return;
      }
    }

    // 根据不同的胜利条件类型判定
    let won = false;
    switch (cond.type) {
      case 'all_resonators_active':
        won = this.dragDropSystem.areAllResonatorsActive();
        break;
      case 'all_pairs_matched':
      case 'encoding_board_complete':
        won = this.dragDropSystem.areAllTargetsFilled();
        break;
      default:
        // 其他类型在有对应系统之前暂不判定
        break;
    }

    if (won) {
      this.onWin();
    }
  }

  /** 增加尝试次数 */
  recordAttempt() {
    this.attemptCount++;
    const max = this.levelConfig.winCondition.maxAttempts;
    if (max && this.attemptCount >= max) {
      this.onFail('too_many_attempts');
    }
  }

  private onWin() {
    this.hasWon = true;
    const elapsed = Math.round((Date.now() - this.startTime) / 1000);

    // 计算星级：1星=通关，2星=快速，3星=完美
    const estimated = this.levelConfig.estimatedDurationSec;
    let stars = 1;
    if (elapsed < estimated * 0.7) stars = 2;
    if (elapsed < estimated * 0.4 && this.attemptCount <= 2) stars = 3;

    const payload: WinConditionMetPayload = {
      levelId: this.levelConfig.levelId,
      stars,
      timeSec: elapsed,
    };

    console.log(
      `[WinConditionSystem] WIN! Level=${payload.levelId} Stars=${stars} Time=${elapsed}s`
    );

    // 短暂延迟后触发胜利事件（让动画先播放）
    this.scene.time.delayedCall(800, () => {
      eventBus.emit(GameEvents.WIN_CONDITION_MET, payload);
    });
  }

  private onFail(reason: string) {
    this.hasFailed = true;
    console.log(`[WinConditionSystem] FAIL: ${reason}`);
    eventBus.emit(GameEvents.LEVEL_FAILED, {
      levelId: this.levelConfig.levelId,
      failReason: reason,
    });
  }
}
