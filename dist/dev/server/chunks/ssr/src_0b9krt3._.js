module.exports = [
"[project]/src/lib/game-state.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useGameStore",
    ()=>useGameStore
]);
// Zustand 游戏状态管理
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-ssr] (ecmascript)");
;
const useGameStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])((set)=>({
        // 管理员身份（开发阶段始终为 true）
        isAdmin: true,
        // 导航
        currentEra: null,
        currentLevelId: null,
        screenState: 'loading',
        setScreen: (screenState)=>set({
                screenState
            }),
        setCurrentEra: (currentEra)=>set({
                currentEra
            }),
        setCurrentLevel: (currentLevelId)=>set({
                currentLevelId
            }),
        // 进度
        completedLevels: [],
        levelStars: {},
        unlockedLevels: [
            '001-discover-m'
        ],
        unlockedEras: [
            1
        ],
        completeLevel: (levelId, stars)=>set((state)=>({
                    completedLevels: state.completedLevels.includes(levelId) ? state.completedLevels : [
                        ...state.completedLevels,
                        levelId
                    ],
                    levelStars: {
                        ...state.levelStars,
                        [levelId]: Math.max(state.levelStars[levelId] || 0, stars)
                    }
                })),
        unlockLevel: (levelId)=>set((state)=>({
                    unlockedLevels: state.unlockedLevels.includes(levelId) ? state.unlockedLevels : [
                        ...state.unlockedLevels,
                        levelId
                    ]
                })),
        unlockEra: (era)=>set((state)=>({
                    unlockedEras: state.unlockedEras.includes(era) ? state.unlockedEras : [
                        ...state.unlockedEras,
                        era
                    ]
                })),
        loadProgress: (data)=>set({
                completedLevels: data.completedLevels,
                levelStars: data.levelStars,
                unlockedLevels: data.unlockedLevels,
                unlockedEras: data.unlockedEras
            }),
        // 游戏临时状态
        isPaused: false,
        isMicActive: false,
        currentHintIndex: 0,
        setPaused: (isPaused)=>set({
                isPaused
            }),
        setMicActive: (isMicActive)=>set({
                isMicActive
            }),
        setCurrentHintIndex: (currentHintIndex)=>set({
                currentHintIndex
            })
    }));
}),
"[project]/src/lib/constants.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// 游戏常量配置
__turbopack_context__.s([
    "ERAS",
    ()=>ERAS,
    "GAME_HEIGHT",
    ()=>GAME_HEIGHT,
    "GAME_WIDTH",
    ()=>GAME_WIDTH,
    "PHONEME_COLORS",
    ()=>PHONEME_COLORS,
    "SCENES",
    ()=>SCENES
]);
const ERAS = {
    1: {
        name: '声音世界',
        nameEn: 'The Sound World',
        description: '发现声音是独立的对象',
        color: '#F59E0B',
        totalLevels: 10
    },
    2: {
        name: '声音机器',
        nameEn: 'The Sound Machine',
        description: '发现声音可以被组合',
        color: '#06B6D4',
        totalLevels: 10
    },
    3: {
        name: '字母革命',
        nameEn: 'The Alphabet Revolution',
        description: '发明符号来表示声音',
        color: '#8B5CF6',
        totalLevels: 10
    },
    4: {
        name: '听写工坊',
        nameEn: 'Dictation Workshop',
        description: '听见单词，拼出字母——逆向编码',
        color: '#e64980',
        totalLevels: 5
    },
    5: {
        name: '记忆宫殿',
        nameEn: 'Memory Palace',
        description: '看词→隐去→默写——真正的记忆挑战',
        color: '#f97316',
        totalLevels: 4
    }
};
const PHONEME_COLORS = {
    m: 0xF59E0B,
    s: 0x06B6D4,
    a: 0x10B981,
    k: 0xD97706,
    ae: 0xEC4899,
    t: 0x8B5CF6
};
const SCENES = {
    BOOT: 'BootScene',
    PRELOAD: 'PreloadScene',
    GAMEPLAY: 'GameplayScene',
    BOSS_GAMEPLAY: 'BossGameplayScene'
};
const GAME_WIDTH = 1024;
const GAME_HEIGHT = 600;
}),
"[project]/src/app/(game)/era-select/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>EraSelectPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$game$2d$state$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/game-state.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/constants.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
const REGIONS = [
    {
        eraNum: 1,
        x: 20,
        y: 50,
        color: '#F59E0B',
        icon: '🔊',
        name: 'Sound World',
        desc: '捕捉声音碎片'
    },
    {
        eraNum: 2,
        x: 52,
        y: 28,
        color: '#06B6D4',
        icon: '🔗',
        name: 'Sound Machine',
        desc: '焊接声音单元'
    },
    {
        eraNum: 3,
        x: 78,
        y: 50,
        color: '#8B5CF6',
        icon: '🔤',
        name: 'Alphabet',
        desc: '揭示字母符号'
    },
    {
        eraNum: 4,
        x: 50,
        y: 72,
        color: '#e64980',
        icon: '✍️',
        name: 'Dictation',
        desc: '听音拼词'
    },
    {
        eraNum: 5,
        x: 22,
        y: 76,
        color: '#f97316',
        icon: '🧠',
        name: 'Memory',
        desc: '闪记默写'
    }
];
function EraSelectPage() {
    const r = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const { unlockedEras, completedLevels, isAdmin, setScreen } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$game$2d$state$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useGameStore"])();
    const click = (n)=>{
        if (!isAdmin && !unlockedEras.includes(n)) return;
        setScreen('level-select');
        r.push(`/level-select?era=${n}`);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative flex flex-col h-full overflow-hidden sky-bg",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-8 left-[10%] w-28 h-16 bg-white/80 rounded-full floaty",
                style: {
                    animationDelay: '0s'
                }
            }, void 0, false, {
                fileName: "[project]/src/app/(game)/era-select/page.tsx",
                lineNumber: 21,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-6 left-[10%] w-16 h-10 bg-white/80 rounded-full",
                style: {
                    marginLeft: 35,
                    marginTop: -12
                }
            }, void 0, false, {
                fileName: "[project]/src/app/(game)/era-select/page.tsx",
                lineNumber: 22,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-6 left-[10%] w-14 h-9 bg-white/80 rounded-full",
                style: {
                    marginLeft: -15,
                    marginTop: -6
                }
            }, void 0, false, {
                fileName: "[project]/src/app/(game)/era-select/page.tsx",
                lineNumber: 23,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-16 right-[15%] w-24 h-14 bg-white/80 rounded-full floaty",
                style: {
                    animationDelay: '1.2s'
                }
            }, void 0, false, {
                fileName: "[project]/src/app/(game)/era-select/page.tsx",
                lineNumber: 24,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-12 right-[15%] w-14 h-9 bg-white/80 rounded-full",
                style: {
                    marginLeft: 28,
                    marginTop: -10
                }
            }, void 0, false, {
                fileName: "[project]/src/app/(game)/era-select/page.tsx",
                lineNumber: 25,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute bottom-0 left-0 right-0 h-32 rounded-t-[40%] opacity-70",
                style: {
                    background: '#7EC850',
                    width: '120%',
                    left: '-10%'
                }
            }, void 0, false, {
                fileName: "[project]/src/app/(game)/era-select/page.tsx",
                lineNumber: 27,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute bottom-0 left-0 right-0 h-20 rounded-t-[40%] opacity-50",
                style: {
                    background: '#5DA83A',
                    width: '110%',
                    left: '-5%'
                }
            }, void 0, false, {
                fileName: "[project]/src/app/(game)/era-select/page.tsx",
                lineNumber: 28,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-0 left-0 right-0 z-30 px-6 py-4 flex items-center justify-between",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "font-display text-lg font-bold text-[#3D2C2C] drop-shadow-sm",
                        children: "🗺️ 冒险地图"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(game)/era-select/page.tsx",
                        lineNumber: 32,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>{
                            r.push('/journal');
                        },
                        className: "px-4 py-1.5 rounded-full bg-white/70 shadow-sm text-sm font-bold text-[#3D2C2C] hover:bg-white transition-all wiggle",
                        children: "📖 图鉴"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(game)/era-select/page.tsx",
                        lineNumber: 33,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(game)/era-select/page.tsx",
                lineNumber: 31,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-16 left-1/2 -translate-x-1/2 z-20 text-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "font-display text-3xl font-extrabold text-[#3D2C2C] drop-shadow-sm",
                        children: "声音大陆"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(game)/era-select/page.tsx",
                        lineNumber: 40,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-[#6B5B4F] font-semibold mt-1",
                        children: "The Phonic Lands"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(game)/era-select/page.tsx",
                        lineNumber: 41,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(game)/era-select/page.tsx",
                lineNumber: 39,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                className: "absolute inset-0 w-full h-full pointer-events-none",
                viewBox: "0 0 100 100",
                preserveAspectRatio: "none",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        d: "M27 54 Q40 40 50 34 Q58 38 68 46 Q74 50 76 54",
                        fill: "none",
                        stroke: "#F59E0B",
                        strokeWidth: "0.6",
                        strokeDasharray: "2,2",
                        opacity: "0.4"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(game)/era-select/page.tsx",
                        lineNumber: 46,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        d: "M50 34 Q40 40 35 48 Q38 58 48 69 Q44 72 30 78",
                        fill: "none",
                        stroke: "#06B6D4",
                        strokeWidth: "0.6",
                        strokeDasharray: "2,2",
                        opacity: "0.4"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(game)/era-select/page.tsx",
                        lineNumber: 47,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        d: "M27 54 Q22 60 24 72",
                        fill: "none",
                        stroke: "#f97316",
                        strokeWidth: "0.6",
                        strokeDasharray: "2,2",
                        opacity: "0.4"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(game)/era-select/page.tsx",
                        lineNumber: 48,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                        x: "92",
                        y: "12",
                        fontSize: "2.5",
                        fill: "#F59E0B",
                        fontFamily: "sans-serif",
                        fontWeight: "bold",
                        children: "N"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(game)/era-select/page.tsx",
                        lineNumber: 49,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(game)/era-select/page.tsx",
                lineNumber: 45,
                columnNumber: 7
            }, this),
            REGIONS.map((reg, i)=>{
                const era = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ERAS"][reg.eraNum];
                const unlocked = isAdmin || unlockedEras.includes(reg.eraNum);
                const completed = completedLevels.filter((id)=>id.startsWith(`0${reg.eraNum > 9 ? '' : ''}${reg.eraNum}`)).length || 0;
                const pct = Math.round(completed / era.totalLevels * 100);
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: ()=>click(reg.eraNum),
                    disabled: !unlocked,
                    className: "absolute z-20 flex flex-col items-center transition-all duration-300 group",
                    style: {
                        left: `${reg.x}%`,
                        top: `${reg.y}%`,
                        transform: 'translate(-50%,-50%)',
                        filter: unlocked ? 'none' : 'grayscale(0.6) opacity(0.5)'
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: `relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${unlocked ? 'group-hover:scale-115 bouncy-pop' : ''}`,
                            style: {
                                background: unlocked ? `radial-gradient(circle, ${reg.color}20, ${reg.color}05)` : '#e5e5e5',
                                boxShadow: unlocked ? `0 4px 16px ${reg.color}30` : 'none'
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-2xl",
                                    children: reg.icon
                                }, void 0, false, {
                                    fileName: "[project]/src/app/(game)/era-select/page.tsx",
                                    lineNumber: 65,
                                    columnNumber: 15
                                }, this),
                                unlocked && pct > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    className: "absolute inset-0 w-full h-full -rotate-90",
                                    viewBox: "0 0 64 64",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                        cx: "32",
                                        cy: "32",
                                        r: "29",
                                        fill: "none",
                                        stroke: reg.color,
                                        strokeWidth: "4",
                                        strokeDasharray: `${pct * 1.82} 182`,
                                        strokeLinecap: "round",
                                        opacity: "0.6"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(game)/era-select/page.tsx",
                                        lineNumber: 68,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/(game)/era-select/page.tsx",
                                    lineNumber: 67,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/(game)/era-select/page.tsx",
                            lineNumber: 63,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-2 text-center",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: `font-display text-xs font-bold ${unlocked ? 'text-[#3D2C2C]' : 'text-gray-400'}`,
                                    children: era.name
                                }, void 0, false, {
                                    fileName: "[project]/src/app/(game)/era-select/page.tsx",
                                    lineNumber: 73,
                                    columnNumber: 15
                                }, this),
                                unlocked && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-[10px] font-bold text-[#FF8C42]",
                                    children: [
                                        completed,
                                        "/",
                                        era.totalLevels
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/(game)/era-select/page.tsx",
                                    lineNumber: 74,
                                    columnNumber: 28
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/(game)/era-select/page.tsx",
                            lineNumber: 72,
                            columnNumber: 13
                        }, this)
                    ]
                }, reg.eraNum, true, {
                    fileName: "[project]/src/app/(game)/era-select/page.tsx",
                    lineNumber: 60,
                    columnNumber: 11
                }, this);
            }),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute bottom-4 left-0 right-0 text-center z-20",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-xs text-[#6B5B4F] font-semibold",
                    children: "点击区域进入探索 ✨"
                }, void 0, false, {
                    fileName: "[project]/src/app/(game)/era-select/page.tsx",
                    lineNumber: 81,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/(game)/era-select/page.tsx",
                lineNumber: 80,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/(game)/era-select/page.tsx",
        lineNumber: 19,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=src_0b9krt3._.js.map