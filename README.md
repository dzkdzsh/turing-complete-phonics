# 图灵拼读 — Turing Complete for Phonics

> 一个沉浸式游戏化自然拼读学习平台，通过关卡式探索让用户理解"声音→组合→字母→词汇→句子"的语言建构过程。

## 项目概述

"图灵拼读"将自然拼读（Phonics）学习设计为 6 个时代的探险旅程，用户从发现基础音素开始，逐步学习声音合成、字母发明、拼词、记忆、造句——通过游戏机制而非传统记忆法来理解语言的结构。项目支持英文拼读+中文语文历史拓展内容。

## 技术框架

| 层面 | 技术选型 |
|------|---------|
| **前端框架** | [Next.js 16](https://nextjs.org/) (React 19 + TypeScript) |
| **游戏引擎** | [Phaser 3.80](https://phaser.io/) (2D 关卡玩法) |
| **3D 渲染** | [Three.js 0.184](https://threejs.org/) (首页 3D 背景) |
| **后端/数据库** | [Supabase](https://supabase.com/) (用户认证 + 进度持久化) |
| **AI/ML** | [@xenova/transformers](https://github.com/xenova/transformers) (wav2vec2 浏览器端发音评估) |
| **样式** | Tailwind CSS + CSS Modules |
| **包管理** | npm |

## 关卡体系

```
Era 1 "声音世界" —— 发现基础音素 (/m/, /s/, /n/, /ɑː/)
  001  奇怪的声音       drag_to_resonate   拖拽声音生物到共振器
  002  嘶嘶的声音       drag_to_resonate   发现第二个音素
  003  鼻音             drag_to_resonate   发现第三个音素
  003  声音匹配         sound_match        点击听音→拖拽影子生物匹配
  004  声音实验室       sound_lab          探索口型与音素的关系
  005  声音大师试炼     mic_validate       Boss关: 对麦克风发出正确音素

Era 2 "声音机器" —— 声音合成与组合
  006  合成 /mɑː/       connect_and_blend  连线连接音素到合成器
  007  合成 /sɑː/       connect_and_blend  巩固合成技能
  008  三个声音的合成   multi_blend        三个音素→一个单词(/kæt/)

Era 3 "发明字母" —— 从声音到符号
  009  发明第一个字母   invent_letter      拖拽音素水晶到石板
  010  建造编码板       encoding_board     音素→编码槽映射

Era 4-6 "拼词·记忆·造句" —— 词汇与句子构建
  011-020  听写/记忆/造句  hear_and_spell / memory_spell / sentence_build

Era 7-8 "中文拓展" —— 语文学科内容
  023-029  古诗·历史·文学  quiz_pick  选择题模式
```

## 核心游戏机制

| 机制 | 说明 |
|------|------|
| **drag_to_resonate** | 拖拽声音物体到共振器触发音素 |
| **sound_match** | 听示范音→选匹配的影子生物 |
| **sound_lab** | 点击口型按钮试听三种声音 |
| **mic_validate** | 麦克风录音→AI 评估发音是否准确 |
| **connect_and_blend** | 用线连接音素节点到合成器输入端口 |
| **multi_blend** | 三输入链式合成器 |
| **invent_letter** | 拖拽音素水晶到空白石板揭示字母 |
| **encoding_board** | 将音素拖到对应编码槽 |
| **hear_and_spell** | 听音→用字母拖拽拼出单词 |
| **memory_spell** | 记忆单词拼写 |
| **sentence_build** | 构建句子 |

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装与运行

```bash
# 1. 安装依赖
npm install

# 2. 开发模式运行
npm run dev

# 3. 浏览器打开
# http://localhost:3000
```

### 生产构建

```bash
npm run build
npm start
```

### 数据库配置（生产环境需要）

本项目使用 Supabase 作为后端。在 [supabase.com](https://supabase.com) 创建项目后，创建 `.env.local` 文件：

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

在 Supabase SQL Editor 中执行根目录的 `supabase_migration.sql` 文件创建 `user_progress` 表。

> 注意：开发模式下无需配置数据库，关卡进度使用内存存储。

### 管理员入口

首页右上角"管理员"按钮可快速跳转到任意关卡。

## 项目结构

```
├── src/
│   ├── app/                      # Next.js 页面路由
│   │   ├── (game)/               # 游戏页面
│   │   │   ├── gameplay/         # 关卡游玩页
│   │   │   ├── level-select/     # 关卡选择页
│   │   │   ├── era-select/       # 时代选择页
│   │   │   ├── boss/             # Boss 关入口
│   │   │   ├── victory/          # 胜利结算页
│   │   │   ├── journal/          # 学习日志页
│   │   │   └── challenge/        # 趣味挑战页
│   │   └── page.tsx              # 首页 (3D 背景)
│   ├── game/                     # Phaser 游戏引擎核心
│   │   ├── scenes/               # 场景类
│   │   │   ├── GameplayScene.ts  # 核心游玩场景
│   │   │   ├── BossGameplayScene.ts  # Boss关卡（麦克风验证）
│   │   │   ├── BootScene.ts      # 启动场景
│   │   │   └── PreloadScene.ts   # 预加载场景
│   │   ├── objects/              # 游戏对象
│   │   │   ├── SoundCreature.ts  # 声音生物节点
│   │   │   ├── Resonator.ts      # 共振器/水晶
│   │   │   ├── BlenderNode.ts    # 声音合成器
│   │   │   ├── MouthShapeButton.ts # 口型按钮
│   │   │   ├── AlphabetTile.ts   # 字母方块
│   │   │   ├── SpellingSlot.ts   # 拼写槽位
│   │   │   ├── DragLetter.ts     # 可拖拽字母
│   │   │   └── TargetZone.ts     # 目标区域
│   │   ├── systems/              # 系统模块
│   │   │   ├── DragDropSystem.ts     # 拖拽系统
│   │   │   ├── ConnectionSystem.ts   # 连线系统
│   │   │   └── WinConditionSystem.ts # 胜利条件判定
│   │   ├── audio/                # 音频管理
│   │   │   ├── AudioManager.ts   # 音频播放/预加载/合成音频
│   │   │   └── PhonemeLibrary.ts # 音素→音频映射
│   │   ├── input/                # 输入处理
│   │   │   ├── MicrophoneInput.ts      # 麦克风采集
│   │   │   ├── PhonemeAnalyzer.ts      # FFT共振峰分析（降级方案）
│   │   │   ├── Wav2vec2Analyzer.ts     # wav2vec2 AI发音评估
│   │   │   ├── Wav2vec2ModelLoader.ts  # ONNX模型加载器
│   │   │   ├── PhonemeTokenMap.ts      # 音素→token映射
│   │   │   └── AudioBufferRecorder.ts  # 音频缓冲录制
│   │   ├── event-bus.ts          # 事件总线
│   │   ├── level-config-store.ts # 关卡配置存储
│   │   └── config.ts             # Phaser.Game 配置工厂
│   ├── data/
│   │   ├── levels/               # 关卡配置 JSON（29 关）
│   │   └── dj-phoneme-map.json   # DJ音素→分段映射 (42音素)
│   ├── types/                    # TypeScript 类型定义
│   │   ├── level.ts              # 关卡配置完整类型
│   │   └── events.ts             # 事件总线类型
│   ├── lib/                      # 工具库
│   │   ├── constants.ts          # 全局常量/枚举
│   │   ├── game-state.ts         # Zustand 全局状态
│   │   └── inventory.ts          # 物品/进度系统
│   ├── components/               # React UI 组件
│   │   ├── layout/               # 布局组件
│   │   └── game/                 # 游戏相关 UI (HUD等)
│   └── hooks/                    # React Hooks
├── public/
│   └── assets/audio/
│       ├── standard/             # 标准音素 MP3（真人录音）
│       ├── dj/                   # DJ 音标示范 MP3（42个音素）
│       ├── phonemes/             # 关卡音素 WAV
│       └── blended/              # 预录合成音频 MP3
├── dist/                         # 生产构建产物
├── supabase_migration.sql        # 数据库初始化 SQL
├── package.json
└── tsconfig.json
```

## 依赖环境说明

### 运行时依赖 (`dependencies`)

| 包名 | 版本 | 用途 |
|------|------|------|
| next | ^16.2.6 | React 全栈框架 |
| react / react-dom | ^19.2.4 | UI 框架 |
| phaser | ^3.80.1 | 2D 游戏引擎 |
| three | ^0.184.0 | 3D 首页渲染 |
| @supabase/supabase-js | ^2.106.2 | 后端数据服务 |
| @supabase/ssr | ^0.10.3 | SSR 认证集成 |
| @xenova/transformers | ^2.17.2 | 浏览器端 wav2vec2 语音分析 |
| tailwind css | — | 样式框架 |

### 开发依赖 (`devDependencies`)

| 包名 | 版本 | 用途 |
|------|------|------|
| typescript | ^5.x | 类型检查 |
| @types/three | — | Three.js 类型定义 |
| eslint | — | 代码质量 |

### 数据库初始化

在 Supabase 创建项目后，执行 `supabase_migration.sql`，该文件创建：

- `user_progress` 表：用户通关进度（含 3 条 RLS 策略 + 2 个索引）
- 字段：`id`, `user_id` (FK→auth.users), `level_id`, `completed`, `stars`(0-3), `completion_data`(JSONB)

## 人员分工

| 角色 | 姓名 | 主要工作 |
|------|------|---------|
| **前端设计** | 张坤雷 | 游戏引擎开发（Phaser 场景/对象/系统）、关卡配置设计、麦克风输入与音素分析算法、wav2vec2 AI 发音评估集成、音频资源制作 |
| **后端设计** | 庄尚翰 | Supabase 数据库架构与用户认证系统、进度持久化 API、Row-Level Security 安全策略、数据库迁移脚本 |
| **网站设计** | 刘宇阳 | Next.js 页面架构与路由、React 组件与 HUD UI 开发、全局状态管理、3D 首页动画、响应式布局设计 |

---

*项目开发于 2026 年 Hackathon*
