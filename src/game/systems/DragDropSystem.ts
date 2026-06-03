// DragDropSystem —— 统一拖拽系统（Era 1-3 全覆盖）

import * as Phaser from 'phaser';
import { SoundCreature } from '../objects/SoundCreature';
import { Resonator } from '../objects/Resonator';
import { TargetZone } from '../objects/TargetZone';
import { AlphabetTile } from '../objects/AlphabetTile';

type RegisteredObject = SoundCreature | Resonator | TargetZone | AlphabetTile;

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
      (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject, dragX: number, dragY: number) => {
        if (this.isDragging && gameObject === this.dragObject) {
          (gameObject as Phaser.GameObjects.Container).x = dragX;
          (gameObject as Phaser.GameObjects.Container).y = dragY;
        }
      }
    );

    this.scene.input.on(
      'dragend',
      (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
        if (gameObject !== this.dragObject) return;

        this.isDragging = false;
        this.dragObject?.setDragActive(false);

        const dropped = this.checkDropTargets(gameObject as SoundCreature);
        if (!dropped && this.dragObject) {
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
    const dragBounds = new Phaser.Geom.Rectangle(dragged.x - 30, dragged.y - 30, 60, 60);

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
            this.scene.tweens.add({
              targets: dragged,
              x: target.object.getPortPosition().x,
              y: target.object.getPortPosition().y,
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
        } else if (target.object instanceof AlphabetTile) {
          if (target.object.accepts(dragged.objectId)) {
            this.scene.tweens.add({
              targets: dragged,
              x: target.object.x,
              y: target.object.y,
              duration: 200,
            });
            target.object.reveal(dragged.phoneme);
            return true;
          }
        }
      }
    }

    return false;
  }

  areAllResonatorsActive(): boolean {
    let total = 0, active = 0;
    for (const [, t] of this.dragTargets) {
      if (t.object instanceof Resonator) { total++; if (t.object.isActivated) active++; }
    }
    return total > 0 && total === active;
  }

  areAllTargetsFilled(): boolean {
    let total = 0, filled = 0;
    for (const [, t] of this.dragTargets) {
      if (t.object instanceof TargetZone) { total++; if (t.object.isFilled) filled++; }
    }
    return total > 0 && total === filled;
  }

  areAllTilesRevealed(): boolean {
    let total = 0, revealed = 0;
    for (const [, t] of this.dragTargets) {
      if (t.object instanceof AlphabetTile) { total++; if (t.object.isRevealed) revealed++; }
    }
    return total > 0 && total === revealed;
  }
}
