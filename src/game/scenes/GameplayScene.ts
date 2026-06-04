// GameplayScene —— 核心游玩场景：支持 Era 1-3

import * as Phaser from 'phaser';
import { eventBus } from '../event-bus';
import { SCENES } from '@/lib/constants';
import type { LevelConfig } from '@/types/level';
import { GameEvents } from '@/types/events';
import { createGameObject } from '../objects/GameObjectFactory';
import { DragDropSystem } from '../systems/DragDropSystem';
import { ConnectionSystem } from '../systems/ConnectionSystem';
import { WinConditionSystem } from '../systems/WinConditionSystem';
import { SoundCreature } from '../objects/SoundCreature';
import { Resonator } from '../objects/Resonator';
import { TargetZone } from '../objects/TargetZone';
import { MouthShapeButton } from '../objects/MouthShapeButton';
import { BlenderNode } from '../objects/BlenderNode';
import { AlphabetTile } from '../objects/AlphabetTile';
import { Companion } from '../objects/Companion';
import { SpellingSlot } from '../objects/SpellingSlot';
import { DragLetter } from '../objects/DragLetter';
import { PhonemeLibrary } from '../audio/PhonemeLibrary';
import { AudioManager } from '../audio/AudioManager';
import type { GameObj } from '../objects/GameObjectFactory';

export class GameplayScene extends Phaser.Scene {
  protected levelConfig!: LevelConfig;
  protected dragDropSystem!: DragDropSystem;
  protected connectionSystem!: ConnectionSystem;
  protected winConditionSystem!: WinConditionSystem;
  protected phonemeLibrary!: PhonemeLibrary;
  protected mouthShapeButtons: MouthShapeButton[] = [];
  protected blenderNodes: BlenderNode[] = [];
  protected alphabetTiles: AlphabetTile[] = [];
  protected gameObjects: GameObj[] = [];
  protected completedPhonemes: string[] = [];
  private companion!: Companion;
  private _stepIndex = 0;
  private _guidanceCard!: Phaser.GameObjects.Container;
  private _guidanceBg!: Phaser.GameObjects.Graphics;
  private _guidanceText!: Phaser.GameObjects.Text;
  private _hintText!: Phaser.GameObjects.Text;
  // Spelling mode
  private _spellSlots: SpellingSlot[] = [];
  private _spellLetters: DragLetter[] = [];
  private _spellWordIndex = 0;
  private _spellWords: string[] = [];
  private _spellAttempts = 0;

  constructor(sceneKey: string = SCENES.GAMEPLAY) {
    super({ key: sceneKey });
  }

  init(data: { levelConfig: LevelConfig }) {
    this.levelConfig = data.levelConfig;
  }

  create() {
    const { width, height } = this.scale;
    // 半透明背景，让3D层透出
    this._drawBackground(width, height);
    this._drawBackground(width, height);

    this.mouthShapeButtons = [];
    this.blenderNodes = [];
    this.alphabetTiles = [];
    this.gameObjects = [];
    this.completedPhonemes = [];

    this.phonemeLibrary = new PhonemeLibrary();
    this.phonemeLibrary.loadFromConfig(this.levelConfig.audioClips);
    AudioManager.getInstance().setVolume(0.5);

    this.dragDropSystem = new DragDropSystem(this);
    this.connectionSystem = new ConnectionSystem(this);
    this.winConditionSystem = new WinConditionSystem(
      this, this.levelConfig, this.dragDropSystem, this.mouthShapeButtons,
      () => this.connectionSystem.areAllBlendersConnected()
    );

    // Title — clean, minimal
    this.add.text(width / 2, 20, this.levelConfig.title, {
      fontSize: '18px', color: '#1e1b18', fontFamily: 'sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5);

    // ---- 剧情式步骤指引 ----
    this._stepIndex = 0;
    this._guidanceCard = this.add.container(width - 20, 55);
    this._guidanceBg = this.add.graphics();
    this._guidanceText = this.add.text(0, 0, '', { fontSize: '11px', color: '#2c2416', fontFamily: 'sans-serif', wordWrap: { width: 170 } });
    this._guidanceCard.add([this._guidanceBg, this._guidanceText]);

    // Hint bar (must exist before _updateGuidance)
    this._hintText = this.add.text(width / 2, height - 20, '', {
      fontSize: '12px', color: '#5c4f3a', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this._updateGuidance('start');

    this.spawnObjects();

    // ---- 拼写工坊模式 ----
    if (this.levelConfig.mechanicType === 'hear_and_spell' || this.levelConfig.mechanicType === 'memory_spell') {
      this._setupSpellingMode();
    }

    // ---- Companion ----
    this.companion = new Companion(this, 60, height - 80, 1);
    this.companion.setMood('thinking');
    this.time.delayedCall(800, () => this.companion.say('让我听听…这是什么声音？', 3000));

    // Phoneme detected → happy + bubble
    eventBus.on(GameEvents.PHONEME_DETECTED, () => {
      this.companion.setMood('happy');
      this._updateGuidance('halfway');
      const msgs = ['就是这个！', '找到了！', '好听！', '没错！'];
      this.companion.say(msgs[Phaser.Math.Between(0, msgs.length - 1)], 1800);
      this.time.delayedCall(2000, () => this.companion.setMood('idle'));
    });
    // Win → celebrate + bubble
    eventBus.on(GameEvents.WIN_CONDITION_MET, () => {
      this.companion.setMood('celebrate');
      this._updateGuidance('complete');
      this.companion.say('太厉害了！你做到了！🎉', 3000);
    });

    eventBus.emit(GameEvents.SCENE_READY, { sceneKey: SCENES.GAMEPLAY });
    eventBus.emit(GameEvents.LEVEL_LOADED, { levelId: this.levelConfig.levelId });
  }

  protected spawnObjects() {
    for (const def of this.levelConfig.gameObjects) {
      if (def.initialState === 'hidden') continue;

      const obj = createGameObject(this, def);
      if (!obj) continue;

      this.gameObjects.push(obj);

      if (obj instanceof MouthShapeButton) {
        this.mouthShapeButtons.push(obj);
      } else if (obj instanceof BlenderNode) {
        this.blenderNodes.push(obj);
        this.connectionSystem.registerBlender(obj);
      }

      if (obj instanceof SoundCreature || obj instanceof Resonator || obj instanceof TargetZone || obj instanceof AlphabetTile) {
        this.dragDropSystem.register(obj);
      }

      if (obj instanceof SoundCreature) {
        this.connectionSystem.registerSource(obj);
      }
    }
  }

  /** 剧情式步骤指引 — 根据关卡机制生成分步引导 */
  private _updateGuidance(stage: 'start' | 'progress' | 'halfway' | 'complete') {
    if (!this.scene?.isActive() || !this._guidanceText?.active || !this._hintText?.active) return;
    const steps: string[] = [];
    const mt = this.levelConfig.mechanicType;

    if (mt === 'drag_to_resonate') {
      steps.push('🔍 观察工作台上的装置');
      steps.push('👆 点击发出声音的生物');
      steps.push('✋ 拖拽它到共振器上');
    } else if (mt === 'sound_match') {
      steps.push('👆 点击左侧生物听声音');
      steps.push('🔊 记住它的发音');
      steps.push('✋ 拖拽右侧匹配的影子');
    } else if (mt === 'connect_and_blend' || mt === 'multi_blend') {
      steps.push('🔌 点击声音节点的输出端口');
      steps.push('🎯 再点击合成器的输入端口');
      steps.push('✅ 所有端口都连上即完成');
    } else if (mt === 'invent_letter') {
      steps.push('💎 点击音素水晶');
      steps.push('✋ 拖到空白石板上');
      steps.push('🔤 揭示对应的字母');
    } else if (mt === 'hear_and_spell' || mt === 'memory_spell') {
      steps.push(mt === 'memory_spell' ? '👀 记住出现的单词 (3秒后消失)' : '🔊 点击喇叭听单词发音');
      steps.push('✋ 把字母拖到对应槽位');
      steps.push('✅ 拼对所有单词即过关');
    }

    // Determine current step
    const total = steps.length;
    let current = stage === 'start' ? 0 : stage === 'halfway' ? 1 : stage === 'complete' ? total : this._stepIndex + 1;
    if (current >= total) current = total - 1;
    this._stepIndex = current;

    // Build guidance card (top-right)
    this._guidanceBg.clear();
    this._guidanceBg.fillStyle(0xfdf8f0, 0.9);
    this._guidanceBg.fillRoundedRect(-180, 0, 180, 76, 10);
    this._guidanceBg.lineStyle(1, 0xd4912a, 0.2);
    this._guidanceBg.strokeRoundedRect(-180, 0, 180, 76, 10);
    let body = `📋 ${current + 1}/${total}\n`;
    for (let i = 0; i < total; i++) {
      const marker = i < current ? '✓' : i === current ? '▸' : '  ';
      body += `${marker} ${steps[i]}\n`;
    }
    this._guidanceText.setText(body);
    this._guidanceText.setY(6);
    this._guidanceText.setX(-172);

    // Bottom hint
    const hint = current < total ? steps[current].replace(/^[^\s]+\s/, '') : '🎉 完成！';
    this._hintText.setText(`💡 ${hint}`);
  }

  /** 拼写工坊模式设置 */
  private _setupSpellingMode() {
    const w = this.scale.width, h = this.scale.height;
    this._spellWords = (this.levelConfig as any).words || ['cat'];
    this._spellWordIndex = 0;
    this._spellAttempts = 0;
    this._loadSpellWord();
  }

  private _loadSpellWord() {
    // Clean up previous
    this._spellSlots.forEach(s => s.destroy());
    this._spellLetters.forEach(l => l.destroy());
    this._spellSlots = [];
    this._spellLetters = [];

    const w = this.scale.width, h = this.scale.height;
    const word = this._spellWords[this._spellWordIndex];
    if (!word) {
      eventBus.emit(GameEvents.WIN_CONDITION_MET, { stars: Math.max(1, 4 - this._spellAttempts), timeSec: 0 });
      return;
    }

    const slotSize = 64, gap = 12, totalW = word.length * slotSize + (word.length - 1) * gap;
    const slotStartX = w / 2 - totalW / 2 + slotSize / 2;
    const slotY = h / 2 + 40;

    // Create slots
    for (let i = 0; i < word.length; i++) {
      const sx = slotStartX + i * (slotSize + gap);
      const slot = new SpellingSlot(this, sx, slotY, slotSize, i);
      this._spellSlots.push(slot);
    }

    // Create letter tiles (shuffled, with distractors)
    const letters = word.split('');
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    const distractors: string[] = [];
    while (distractors.length < Math.max(2, 6 - letters.length)) {
      const r = alphabet[Phaser.Math.Between(0, 25)];
      if (!letters.includes(r) && !distractors.includes(r)) distractors.push(r);
    }
    const candidates = Phaser.Utils.Array.Shuffle([...letters, ...distractors]);
    const tileSize = 56, tileGap = 10;
    const tileTotalW = candidates.length * tileSize + (candidates.length - 1) * tileGap;
    const tileStartX = w / 2 - tileTotalW / 2 + tileSize / 2;
    const tileY = slotY + 100;

    candidates.forEach((l, i) => {
      const tx = tileStartX + i * (tileSize + tileGap);
      const tile = new DragLetter(this, tx, tileY, l, tileSize);
      this._spellLetters.push(tile);

      // Drop on slot
      this.input.on('drop', (_p: Phaser.Input.Pointer, tileObj: DragLetter, slot: SpellingSlot) => {
        if (slot.filledLetter) { tileObj.returnToOrigin(); return; }
        if (tileObj !== tile) return;
        slot.fill(l);
        tileObj.disable();
        tileObj.snapTo(slot.x, slot.y);
        this._checkSpellComplete();
      });
    });

    // Speaker button
    const spY = slotY - 110;
    const spG = this.add.graphics().setDepth(5);
    spG.fillStyle(0xffffff, 0.9);
    spG.fillCircle(w / 2, spY, 42);
    spG.lineStyle(3, 0xd4912a, 0.4);
    spG.strokeCircle(w / 2, spY, 42);
    const spTxt = this.add.text(w / 2, spY, '🔊', { fontSize: '40px' }).setOrigin(0.5).setDepth(6);
    const spZone = this.add.zone(w / 2, spY, 90, 90).setInteractive({ useHandCursor: true }).setDepth(7);
    spZone.on('pointerdown', () => {
      this._speakWord(word);
      this.tweens.add({ targets: spTxt, scaleX: 1.3, scaleY: 1.3, duration: 120, yoyo: true, ease: 'Bounce.easeOut' });
    });

    // Word progress indicator
    const progressText = this.add.text(w / 2, spY - 55, `${this._spellWordIndex + 1} / ${this._spellWords.length}`, {
      fontSize: '13px', color: '#9b8c78', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(5);

    // Auto-speak
    this.time.delayedCall(500, () => this._speakWord(word));

    // --- Memory mode: flash word then hide ---
    if (this.levelConfig.mechanicType === 'memory_spell') {
      const flashText = this.add.text(w / 2, spY, word.toUpperCase(), {
        fontSize: '56px', color: '#f97316', fontFamily: 'Crimson Text, serif', fontStyle: 'bold',
        stroke: '#fff', strokeThickness: 4,
      }).setOrigin(0.5).setDepth(20).setAlpha(0);
      this.tweens.add({ targets: flashText, alpha: 1, duration: 300, ease: 'Cubic.easeOut' });
      this.time.delayedCall(3000, () => {
        this.tweens.add({ targets: flashText, alpha: 0, duration: 400, onComplete: () => flashText.destroy() });
      });
    }

    // Store for cleanup
    (this as any)._spellCleanup = { spG, spTxt, spZone, progressText };
  }

  private _checkSpellComplete() {
    const allFilled = this._spellSlots.every(s => s.filledLetter !== null);
    if (!allFilled) return;

    const word = this._spellWords[this._spellWordIndex];
    const spelled = this._spellSlots.map(s => s.filledLetter).join('');
    this._spellAttempts++;

    if (spelled === word) {
      eventBus.emit(GameEvents.PHONEME_DETECTED, { phoneme: word });
      this.companion?.setMood('happy');
      this.companion?.say('拼对了！🎉', 1500);
      this.time.delayedCall(1200, () => {
        this._spellWordIndex++;
        this._loadSpellWord();
      });
    } else {
      this.companion?.setMood('sad');
      this.companion?.say('再试试！', 1200);
      this.time.delayedCall(800, () => {
        this._spellSlots.forEach(s => s.clear());
        this._spellLetters.forEach(l => { l.enable(); l.returnToOrigin(); });
      });
    }
  }

  private _speakWord(word: string) {
    try {
      const u = new SpeechSynthesisUtterance(word);
      u.lang = 'en-US'; u.rate = 0.6; u.pitch = 1.1;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch (e) { /* unavailable */ }
  }

  /** 羊皮纸纹理 + 声波纹 + 浮游音素 */
  private _drawBackground(w: number, h: number) {
    const g = this.add.graphics().setDepth(-10).setAlpha(0.3);
    // Cartoon sky gradient
    const topR=91,topG=164,topB=230,botR=184,botG=228,botB=240;
    for (let i=0;i<20;i++){const t=i/19;g.fillStyle(Phaser.Display.Color.GetColor(Math.round(topR+(botR-topR)*t),Math.round(topG+(botG-topG)*t),Math.round(topB+(botB-topB)*t)));g.fillRect(0,i*h/20,w,h/20+2);}
    // Green hills
    g.fillStyle(0x7EC850,0.25);g.fillEllipse(100,h+10,600,120);
    g.fillStyle(0x5DA83A,0.2);g.fillEllipse(700,h+10,500,100);
    // Clouds
    for(let i=0;i<3;i++){const cx=Phaser.Math.Between(50,w-50),cy=Phaser.Math.Between(30,100);g.fillStyle(0xffffff,0.4);g.fillCircle(cx,cy,22);g.fillCircle(cx+18,cy-6,16);g.fillCircle(cx+30,cy,18);}
  }

  private getMechanicHint(): string {
    switch (this.levelConfig.mechanicType) {
      case 'drag_to_resonate':
        return '拖拽声音生物到共振器上进行分析';
      case 'sound_match':
        return '点击左边生物听声音 → 拖拽右边影子生物到匹配区';
      case 'sound_lab':
        return '点击每个口型按钮，试听所有的声音——全部试一遍！';
      case 'connect_and_blend':
      case 'multi_blend':
        return '点击声音节点的输出端口（小圆点）→ 再点击合成器的输入端口完成连线';
      case 'invent_letter':
        return '将音素水晶拖到空白石板上——揭开对应字母！';
      case 'encoding_board':
        return '将音素水晶拖到正确的编码槽位置';
      case 'hear_and_spell':
        return '🔊 听发音 → 拖字母到槽位拼单词';
      case 'memory_spell':
        return '👀 记住闪现的词 → 隐去后拼出来';
      case 'mic_validate':
        return '点击一颗水晶 → 对着麦克风发出水晶上标注的音素';
      default:
        return '探索工作台上的装置吧！';
    }
  }

  override update() {
    this.winConditionSystem?.update();
  }
}
