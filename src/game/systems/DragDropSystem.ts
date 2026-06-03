// DragDropSystem —— 统一拖拽系统

import * as Phaser from 'phaser';
import { SoundCreature } from '../objects/SoundCreature';
import { Resonator } from '../objects/Resonator';
import { TargetZone } from '../objects/TargetZone';

type RegisteredObject = SoundCreature | Resonator | TargetZone;

interface DragTarget {
  id: string;
  x: number;
  y: number;
  object: RegisteredObject;
}

export class DragDropSystem {
  private scene: Phaser.Scene;
  private dragTargets: Map<string, DragTarget> = new Map();
  private isDragging = false;
  private dragObject: SoundCreature | null = null;
  private dragStartX = 0;
  private dragStartY = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupInput();
  }

  /** 注册一个可拖拽或可放置的对象 */
  register(object: RegisteredObject) {
    this.dragTargets.set(object.objectId, {
      id: object.objectId,
      x: object.x,
      y: object.y,
      object,
    });
  }

  private setupInput() {
    this.scene.input.on(
      'dragstart',
      (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
        if (gameObject instanceof SoundCreature && gameObject.isDraggable) {
          this.dragObject = gameObject;
          this.dragStartX = gameObject.x;
          this.dragStartY = gameObject.y;
          this.isDragging = true;
          this.dragObject.setDragActive(true);
        }
      }
    );

    this.scene.input.on(
      'drag',
      (
        _pointer: Phaser.Input.Pointer,
        gameObject: Phaser.GameObjects.GameObject,
        dragX: number,
        dragY: number
      ) => {
        if (this.isDragging && gameObject === this.dragObject) {
          (gameObject as Phaser.GameObjects.Container).x = dragX;
          (gameObject as Phaser.GameObjects.Container).y = dragY;
        }
      }
    );

    this.scene.input.on(
      'dragend',
      (
        _pointer: Phaser.Input.Pointer,
        gameObject: Phaser.GameObjects.GameObject,
      ) => {
        if (gameObject !== this.dragObject) return;

        this.isDragging = false;
        this.dragObject?.setDragActive(false);

        // 检测是否落在某个 resonator 或 target zone 上
        const target = this.checkDropTargets(gameObject as SoundCreature);
        if (!target && this.dragObject) {
          // 返回原位
          this.scene.tweens.add({
            targets: this.dragObject,
            x: this.dragStartX,
            y: this.dragStartY,
            duration: 300,
            ease: 'Back.easeOut',
          });
        }
      }
    );
  }

  private checkDropTargets(dragged: SoundCreature): boolean {
    const dragBounds = new Phaser.Geom.Rectangle(
      dragged.x - 30,
      dragged.y - 30,
      60,
      60
    );

    for (const [, target] of this.dragTargets) {
      if (target.object === dragged) continue;

      const targetBounds = new Phaser.Geom.Rectangle(
        target.object.x - 60,
        target.object.y - 50,
        120,
        100
      );

      if (Phaser.Geom.Rectangle.Overlaps(dragBounds, targetBounds)) {
        if (target.object instanceof Resonator) {
          if (target.object.accepts(dragged.objectId)) {
            const portPos = target.object.getPortPosition();
            this.scene.tweens.add({
              targets: dragged,
              x: portPos.x,
              y: portPos.y,
              duration: 200,
            });
            target.object.activate(dragged.phoneme);
            return true;
          }
        } else if (target.object instanceof TargetZone) {
          if (target.object.accepts(dragged.objectId)) {
            this.scene.tweens.add({
              targets: dragged,
              x: target.object.x,
              y: target.object.y,
              duration: 200,
            });
            target.object.isFilled = true;
            target.object.highlight();
            return true;
          }
        }
      }
    }

    return false;
  }

  areAllResonatorsActive(): boolean {
    let total = 0;
    let active = 0;
    for (const [, target] of this.dragTargets) {
      if (target.object instanceof Resonator) {
        total++;
        if (target.object.isActivated) active++;
      }
    }
    return total > 0 && total === active;
  }

  areAllTargetsFilled(): boolean {
    let total = 0;
    let filled = 0;
    for (const [, target] of this.dragTargets) {
      if (target.object instanceof TargetZone) {
        total++;
        if (target.object.isFilled) filled++;
      }
    }
    return total > 0 && total === filled;
  }
}
