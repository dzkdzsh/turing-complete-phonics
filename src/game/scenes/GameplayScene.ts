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
    this.cameras.main.setBackgroundColor('#f5f3f0');

    // ---- 背景：羊皮纸纹理 + 声波纹 ----
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
      fontSize: '12px', color: '#444444', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this._updateGuidance('start');

    this.spawnObjects();

    if (this.levelConfig.mechanicType === 'quiz_pick') {
      this._setupQuizMode();
    } else if (this.levelConfig.mechanicType === 'hear_and_spell' || this.levelConfig.mechanicType === 'memory_spell' || this.levelConfig.mechanicType === 'sentence_build') {
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
      steps.push(mt === 'memory_spell' ? '👀 记住闪现的词' : '🔊 听发音');
      steps.push('✋ 拖字母到槽位');
      steps.push('✅ 拼对所有词');
    } else if (mt === 'mic_validate') {
      steps.push('👆 点击一颗水晶');
      steps.push('🎤 对着麦克风发出对应声音');
      steps.push('✨ 激活全部水晶');
    } else {
      // Fallback for quiz_pick and other mechanics
      steps.push('📋 阅读题目');
      steps.push('👆 选择正确答案');
      steps.push('✅ 完成所有题目');
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
    const hint = current < total && steps[current] ? steps[current].replace(/^[^\s]+\s/, '') : '🎉 完成！';
    this._hintText.setText(`💡 ${hint}`);
  }

  private _setupQuizMode() {
    const qs = (this.levelConfig as any).questions as {q:string;opts:string[];ans:string}[] || [];
    this._spellWords = qs.map(q => q.ans);
    this._spellWordIndex = 0; this._spellAttempts = 0;
    this._loadQuizWord();
  }
  private _loadQuizWord() {
    this._spellSlots.forEach(s => s.destroy()); this._spellLetters.forEach(l => l.destroy());
    this._spellSlots = []; this._spellLetters = [];
    const w = this.scale.width, h = this.scale.height;
    const qs = (this.levelConfig as any).questions as {q:string;opts:string[];ans:string}[] || [];
    const qi = qs[this._spellWordIndex];
    if (!qi) { eventBus.emit(GameEvents.WIN_CONDITION_MET, { stars: Math.max(1, 4 - this._spellAttempts), timeSec: 0 }); return; }
    // Question text
    const qt = this.add.text(w/2, h/3-40, qi.q, { fontSize:'22px', color:'#1a1a1a', fontFamily:'sans-serif',fontStyle:'bold' }).setOrigin(0.5).setDepth(10);
    // Option buttons
    const opts = Phaser.Utils.Array.Shuffle([...qi.opts]);
    const btnW = 180, btnH = 50, gap = 14, cols = 2;
    const totalW = cols * btnW + (cols-1) * gap, startX = w/2 - totalW/2 + btnW/2, startY = h/2;
    const btns: Phaser.GameObjects.Container[] = [];
    opts.forEach((opt, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const bx = startX + col * (btnW + gap), by = startY + row * (btnH + gap);
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 0.08); g.fillRoundedRect(bx-btnW/2, by-btnH/2, btnW, btnH, 14);
      g.lineStyle(2, 0xd4912a, 0.3); g.strokeRoundedRect(bx-btnW/2, by-btnH/2, btnW, btnH, 14);
      const tx = this.add.text(bx, by, opt, { fontSize:'16px', color:'#1a1a1a', fontFamily:'sans-serif' }).setOrigin(0.5);
      const zone = this.add.zone(bx, by, btnW, btnH).setInteractive({useHandCursor:true}).setDepth(10);
      const container = this.add.container(0, 0); container.add([g, tx]);
      zone.on('pointerdown', () => {
        const isCorrect = opt === qi.ans;
        g.clear();
        g.fillStyle(isCorrect ? 0x10b981 : 0xef4444, 0.3);
        g.fillRoundedRect(bx-btnW/2, by-btnH/2, btnW, btnH, 14);
        g.lineStyle(2, isCorrect ? 0x10b981 : 0xef4444, 0.6);
        g.strokeRoundedRect(bx-btnW/2, by-btnH/2, btnW, btnH, 14);
        btns.forEach(b => b.list.forEach(c => { if (c.type==='Zone') c.disableInteractive(); }));
        if (isCorrect) {
          eventBus.emit(GameEvents.PHONEME_DETECTED, { phoneme: qi.ans });
          this.companion?.setMood('happy');
          this.time.delayedCall(1200, () => { this._spellWordIndex++; qt.destroy(); btns.forEach(b=>b.destroy()); this._loadQuizWord(); });
        } else {
          this.companion?.setMood('sad');
          this.time.delayedCall(1000, () => { this._spellWordIndex++; qt.destroy(); btns.forEach(b=>b.destroy()); this._loadQuizWord(); });
        }
      });
      container.add(zone);
      container.setDepth(10);
      btns.push(container);
    });
    this.add.text(w/2, h-30, `${this._spellWordIndex+1}/${qs.length}`, { fontSize:'13px', color:'#555555',fontFamily:'monospace' }).setOrigin(0.5).setDepth(10);
  }

  private _setupSpellingMode() {
    if (this.levelConfig.mechanicType === 'sentence_build') {
      this._spellWords = ((this.levelConfig as any).sentences || []).map((s:any) => s.text);
    } else {
      this._spellWords = (this.levelConfig as any).words || ['cat'];
    }
    this._spellWordIndex = 0; this._spellAttempts = 0;
    this._loadSpellWord();
  }
  private _loadSpellWord() {
    this._spellSlots.forEach(s => s.destroy()); this._spellLetters.forEach(l => l.destroy());
    this._spellSlots = []; this._spellLetters = [];
    const w = this.scale.width, h = this.scale.height;
    const word = this._spellWords[this._spellWordIndex];
    if (!word) { eventBus.emit(GameEvents.WIN_CONDITION_MET, { stars: Math.max(1, 4 - this._spellAttempts), timeSec: 0 }); return; }
    const isSentence = this.levelConfig.mechanicType === 'sentence_build';
    const sentences = (this.levelConfig as any).sentences || [];
    const sentData = isSentence ? sentences[this._spellWordIndex] : null;
    const rawLetters = isSentence ? (sentData?.words || word.split(' ')) : word.split('');
    const letters = isSentence ? rawLetters : rawLetters;
    const slotCount = isSentence ? letters.length : word.length;
    const slotSize = isSentence ? Math.min(90, 500 / slotCount) : 60;
    const gap = isSentence ? 8 : 12;
    const totalW = slotCount * slotSize + (slotCount - 1) * gap;
    const slotStartX = w / 2 - totalW / 2 + slotSize / 2, slotY = h / 2 + 30;
    for (let i = 0; i < slotCount; i++) { this._spellSlots.push(new SpellingSlot(this, slotStartX + i * (slotSize + gap), slotY, slotSize, i)); }
    const isChinese = /[一-鿿]/.test(word);
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    const distractors: string[] = [];
    if (!isSentence && !isChinese) {
      while (distractors.length < Math.max(2, 6 - letters.length)) { const r = alphabet[Phaser.Math.Between(0, 25)]; if (!letters.includes(r) && !distractors.includes(r)) distractors.push(r); }
    }
    if (isChinese) {
      const chinesePool = '山水火日月木口人大小天地风云雨雪花草鸟鱼'.split('');
      while (distractors.length < Math.max(2, 4 - letters.length)) { const r = chinesePool[Math.floor(Math.random()*chinesePool.length)]; if (!letters.includes(r) && !distractors.includes(r)) distractors.push(r); }
    }
    const cands = Phaser.Utils.Array.Shuffle([...letters, ...distractors]);
    const ts = isSentence ? Math.min(80, 450 / cands.length) : 54, tg = isSentence ? 6 : 10, ttW = cands.length * ts + (cands.length - 1) * tg;
    const tSX = w / 2 - ttW / 2 + ts / 2, tY = slotY + 95;
    cands.forEach((l, i) => {
      const tile = new DragLetter(this, tSX + i * (ts + tg), tY, l, ts);
      this._spellLetters.push(tile);
      this.input.on('drop', (_p: any, t: DragLetter, s: SpellingSlot) => {
        if (s.filledLetter || t !== tile) { t.returnToOrigin(); return; }
        s.fill(l); t.disable(); t.snapTo(s.x, s.y); this._checkSpellComplete();
      });
    });
    const spY = slotY - 100;
    const spG = this.add.graphics().setDepth(5);
    spG.fillStyle(0xffffff, 0.9); spG.fillCircle(w / 2, spY, 38); spG.lineStyle(3, 0xd4912a, 0.4); spG.strokeCircle(w / 2, spY, 38);
    const spT = this.add.text(w / 2, spY, '🔊', { fontSize: '36px' }).setOrigin(0.5).setDepth(6);
    this.add.zone(w / 2, spY, 80, 80).setInteractive({ useHandCursor: true }).setDepth(7).on('pointerdown', () => { this._speakWord(word); this.tweens.add({ targets: spT, scaleX: 1.3, scaleY: 1.3, duration: 120, yoyo: true, ease: 'Bounce.easeOut' }); });
    this.add.text(w / 2, spY - 50, `${this._spellWordIndex + 1}/${this._spellWords.length}`, { fontSize: '13px', color: '#555555', fontFamily: 'monospace' }).setOrigin(0.5).setDepth(5);
    this.time.delayedCall(500, () => this._speakWord(word));
    if (this.levelConfig.mechanicType === 'memory_spell') {
      const vocab = ((this.levelConfig as any).vocab || []).find((v:any)=>v.w===word);
      const ft = this.add.text(w / 2, spY - 20, word.toUpperCase(), { fontSize: '56px', color: '#f97316', fontFamily: 'Crimson Text, serif', fontStyle: 'bold', stroke: '#fff', strokeThickness: 4 }).setOrigin(0.5).setDepth(20).setAlpha(0);
      if (vocab) {
        const fp = this.add.text(w / 2, spY + 30, vocab.p||'', { fontSize: '18px', color: '#555555', fontFamily: 'sans-serif' }).setOrigin(0.5).setDepth(20).setAlpha(0);
        const fc = this.add.text(w / 2, spY + 55, vocab.c||'', { fontSize: '20px', color: '#d4912a', fontFamily: 'sans-serif', fontStyle: 'bold' }).setOrigin(0.5).setDepth(20).setAlpha(0);
        this.tweens.add({ targets: [ft,fp,fc], alpha: 1, duration: 300 });
        this.time.delayedCall(3500, () => { this.tweens.add({ targets: [ft,fp,fc], alpha: 0, duration: 400, onComplete: () => { ft.destroy(); fp.destroy(); fc.destroy(); } }); });
      } else {
        this.tweens.add({ targets: ft, alpha: 1, duration: 300 });
        this.time.delayedCall(3000, () => { this.tweens.add({ targets: ft, alpha: 0, duration: 400, onComplete: () => ft.destroy() }); });
      }
    }
  }
  private _checkSpellComplete() {
    if (!this._spellSlots.every(s => s.filledLetter !== null)) return;
    const word = this._spellWords[this._spellWordIndex];
    const spelled = this._spellSlots.map(s => s.filledLetter).join(''); this._spellAttempts++;
    if (spelled === word) { eventBus.emit(GameEvents.PHONEME_DETECTED, { phoneme: word }); this.companion?.setMood('happy'); this.companion?.say('拼对了！跟读一遍？', 2000);
      const EMOJI: Record<string,string>={cat:'🐱',dog:'🐶',sit:'💺',bus:'🚌',stop:'🛑',frog:'🐸',desk:'📚',flag:'🚩',ship:'🚢',chat:'💬',thin:'📏',fish:'🐟',cake:'🎂',bike:'🚲',home:'🏠',tune:'🎵',said:'🗣️',they:'👥',come:'🚶',what:'❓'};
      const e = EMOJI[word]; if(e){const et=this.add.text(this.scale.width/2,this.scale.height/2-60,e,{fontSize:'72px'}).setOrigin(0.5).setDepth(30).setScale(0);this.tweens.add({targets:et,scaleX:1,scaleY:1,duration:400,ease:'Back.easeOut'});this.time.delayedCall(1200,()=>{this.tweens.add({targets:et,alpha:0,duration:300,onComplete:()=>et.destroy()})});}
      this.time.delayedCall(1800, () => { this._spellWordIndex++; this._loadSpellWord(); }); }
    else { this.companion?.setMood('sad'); this.time.delayedCall(800, () => { this._spellSlots.forEach(s => s.clear()); this._spellLetters.forEach(l => { l.enable(); l.returnToOrigin(); }); }); }
  }
  private _speakWord(word: string) { try { const u = new SpeechSynthesisUtterance(word); u.lang = 'en-US'; u.rate = 0.6; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {} }

  /** 羊皮纸纹理 + 声波纹 + 浮游音素 */
  private _drawBackground(w: number, h: number) {
    const g = this.add.graphics().setDepth(-10).setAlpha(0.6);

    // --- 羊皮纸底色渐变 ---
    const topR = 254, topG = 249, topB = 240;
    const botR = 250, botG = 243, botB = 230;
    for (let i = 0; i < 24; i++) {
      const t = i / 23;
      g.fillStyle(Phaser.Display.Color.GetColor(
        Math.round(topR + (botR - topR) * t),
        Math.round(topG + (botG - topG) * t),
        Math.round(topB + (botB - topB) * t)));
      g.fillRect(0, i * h / 24, w, h / 24 + 2);
    }

    // --- 淡墨横格线 (笔记本) ---
    g.lineStyle(1, 0x8b7355, 0.04);
    for (let y = 60; y < h - 40; y += 28) {
      g.lineBetween(30, y, w - 30, y);
    }
    // 左竖线
    g.lineStyle(1, 0xef4444, 0.06);
    g.lineBetween(42, 50, 42, h - 50);

    // --- 声波纹弧线 ---
    const cx = w / 2, cy = h / 2 + 30;
    for (let ring = 1; ring <= 4; ring++) {
      g.lineStyle(1, 0x6366f1, 0.04 - ring * 0.01);
      g.beginPath();
      for (let angle = 0; angle <= Math.PI * 2; angle += 0.1) {
        const rx = 120 + ring * 50 + Math.sin(angle * 3) * 8;
        const ry = 80 + ring * 30 + Math.cos(angle * 2) * 5;
        const px = cx + Math.cos(angle) * rx;
        const py = cy + Math.sin(angle) * ry;
        if (angle === 0) g.moveTo(px, py); else g.lineTo(px, py);
      }
      g.strokePath();
    }

    // --- 角落装饰：音素符号 ---
    const symbols = ['/m/', '/s/', '/a/', '/k/', '/t/', '♪', '♫', '~'];
    symbols.forEach((sym, i) => {
      const sx = 40 + Math.random() * (w - 80);
      const sy = 70 + Math.random() * (h - 110);
      const t = this.add.text(sx, sy, sym, {
        fontSize: `${Math.floor(Math.random() * 10 + 10)}px`,
        color: '#d4cfc9', fontFamily: 'serif',
      }).setAlpha(0.12).setDepth(-5);
      this.tweens.add({
        targets: t, y: sy - 15, alpha: 0.04,
        duration: Phaser.Math.Between(4000, 8000), repeat: -1, yoyo: true,
        delay: Phaser.Math.Between(0, 3000),
      });
    });
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
