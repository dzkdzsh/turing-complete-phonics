// WinConditionSystem —— 胜利条件判定

import * as Phaser from 'phaser';
import type { LevelConfig } from '@/types/level';
import { eventBus } from '../event-bus';
import { GameEvents } from '@/types/events';
import type { WinConditionMetPayload } from '@/types/events';
import { DragDropSystem } from './DragDropSystem';
import type { MouthShapeButton } from '../objects/MouthShapeButton';

export class WinConditionSystem {
  private scene: Phaser.Scene;
  private levelConfig: LevelConfig;
  private dragDropSystem: DragDropSystem;
  private mouthShapeButtons: MouthShapeButton[];
  private startTime: number;
  private attemptCount = 0;
  private hasWon = false;
  private hasFailed = false;
  private lastCheck = 0;

  constructor(
    scene: Phaser.Scene,
    levelConfig: LevelConfig,
    dragDropSystem: DragDropSystem,
    mouthShapeButtons: MouthShapeButton[] = []
  ) {
    this.scene = scene;
    this.levelConfig = levelConfig;
    this.dragDropSystem = dragDropSystem;
    this.mouthShapeButtons = mouthShapeButtons;
    this.startTime = Date.now();
  }

  update() {
    if (this.hasWon || this.hasFailed) return;

    // 防抖：每 500ms 检查一次（除了实时检测不了的 sound_lab）
    const now = Date.now();
    if (this.levelConfig.winCondition.type !== 'all_sounds_produced' && now - this.lastCheck < 500) {
      return;
    }
    this.lastCheck = now;

    const cond = this.levelConfig.winCondition;

    if (cond.timeLimitSec) {
      const elapsed = (now - this.startTime) / 1000;
      if (elapsed > cond.timeLimitSec) {
        this.onFail('timeout');
        return;
      }
    }

    let won = false;
    switch (cond.type) {
      case 'all_resonators_active':
        won = this.dragDropSystem.areAllResonatorsActive();
        break;
      case 'all_pairs_matched':
      case 'encoding_board_complete':
        won = this.dragDropSystem.areAllTargetsFilled();
        break;
      case 'all_sounds_produced':
        won = this.areAllSoundsProduced(cond.requiredPhonemes || []);
        break;
      default:
        break;
    }

    if (won) {
      this.onWin();
    }
  }

  private areAllSoundsProduced(required: string[]): boolean {
    if (!required.length || !this.mouthShapeButtons.length) return false;
    const clicked = new Set(
      this.mouthShapeButtons.filter((b) => b.hasBeenClicked).map((b) => b.phoneme)
    );
    return required.every((p) => clicked.has(p));
  }

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
    const estimated = this.levelConfig.estimatedDurationSec;
    let stars = 1;
    if (elapsed < estimated * 0.7) stars = 2;
    if (elapsed < estimated * 0.4 && this.attemptCount <= 2) stars = 3;

    const payload: WinConditionMetPayload = {
      levelId: this.levelConfig.levelId,
      stars,
      timeSec: elapsed,
    };

    this.scene.time.delayedCall(800, () => {
      eventBus.emit(GameEvents.WIN_CONDITION_MET, payload);
    });
  }

  private onFail(reason: string) {
    this.hasFailed = true;
    eventBus.emit(GameEvents.LEVEL_FAILED, {
      levelId: this.levelConfig.levelId,
      failReason: reason,
    });
  }
}
