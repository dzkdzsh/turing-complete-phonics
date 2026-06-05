'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Subject = '语文'|'数学'|'英语'|'科学'|'地理'|'物理';

const TASKS: Record<Subject, string[]> = {
  '语文':['用"春风"造三个不同的句子','背出你最喜欢的一首古诗并解释它的意思','用三个成语描述今天的天气','写一个不超过50字的微型小说，必须包含"月亮"和"窗"'],
  '数学':['不用计算器，手算 128×37','解释什么是"勾股定理"并举一个生活中的例子','一张纸对折30次，厚度会超过珠穆朗玛峰吗？为什么？','设计一个公平的掷骰子游戏规则'],
  '英语':['用英语描述你最喜欢的食物（至少3句话）','用英语介绍你的同桌','说出5个以"un-"开头的英语单词并解释意思','用英语讲一个冷笑话'],
  '科学':['为什么天空是蓝色的？','解释"光合作用"并用一句话总结','如果地球突然停止自转会发生什么？','设计一个实验证明空气有重量'],
  '地理':['说出中国5个省份及它们的省会','解释"为什么会有四季"','如果让你设计一个未来城市，你会怎么规划交通？','画一张简单的世界地图并标注七大洲'],
  '物理':['解释"惯性"并举一个生活中的例子','为什么铁会沉入水中而船不会？','如果摩擦力突然消失，世界会怎样？','设计一个简单的电路让灯泡亮起来'],
};

const COLORS: Record<Subject, string> = {
  '语文':'#ef4444','数学':'#3b82f6','英语':'#10b981','科学':'#f59e0b','地理':'#8b5cf6','物理':'#06b6d4',
};
const ICONS: Record<Subject, string> = {
  '语文':'📝','数学':'🔢','英语':'🌍','科学':'🔬','地理':'🗺️','物理':'⚡',
};
const SUBJECTS: Subject[] = ['语文','数学','英语','科学','地理','物理'];

export default function MysteryBoxPage() {
  const r = useRouter();
  const [selectedSubject, setSelectedSubject] = useState<Subject|null>(null);
  const [task, setTask] = useState<string|null>(null);
  const [boxState, setBoxState] = useState<'idle'|'shaking'|'open'>('idle');
  const [history, setHistory] = useState<{subject:Subject;task:string}[]>([]);

  const openBox = () => {
    if (!selectedSubject || boxState !== 'idle') return;
    setBoxState('shaking');
    const tasks = TASKS[selectedSubject];
    const picked = tasks[Math.floor(Math.random()*tasks.length)];
    setTimeout(() => { setTask(picked); setBoxState('open'); setHistory(h=>[{subject:selectedSubject,task:picked},...h].slice(0,10)); }, 1500);
  };

  const reset = () => { setBoxState('idle'); setTask(null); setSelectedSubject(null); };

  return (
    <div className="min-h-screen flex flex-col items-center" style={{background:'#0f0d0a'}}>
      <div className="w-full max-w-2xl px-6 pt-6">
        <button onClick={()=>r.push('/challenge')} className="text-xs text-[#5c554c] hover:text-[#9b8c78] mb-4">← 返回</button>
        <h1 className="font-display text-3xl font-bold text-[#e8e0d0] mb-2">🎁 盲盒任务</h1>
        <p className="text-sm text-[#9b8c78] mb-8">选一个学科 → 摇一摇盲盒 → 随机抽取任务纸条!</p>

        {!task ? (
          <>
            {/* Subject picker */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {SUBJECTS.map(s => (
                <button key={s} onClick={()=>setSelectedSubject(s)}
                  className={`p-4 rounded-2xl border-2 text-center transition-all ${selectedSubject===s?'shadow-lg':'opacity-60 hover:opacity-80'}`}
                  style={{borderColor:COLORS[s],background:selectedSubject===s?`${COLORS[s]}10`:'transparent'}}>
                  <span className="text-2xl block mb-1">{ICONS[s]}</span>
                  <span className="text-sm font-bold text-[#e8e0d0]">{s}</span>
                </button>
              ))}
            </div>
            {/* Mystery box */}
            <div className="flex flex-col items-center">
              <div className={`cursor-pointer transition-all duration-300 ${boxState==='shaking'?'animate-bounce':boxState==='open'?'scale-110':''}`}
                onClick={openBox} style={{filter: selectedSubject?`drop-shadow(0 0 30px ${COLORS[selectedSubject]}30)`:'none'}}>
                <div className="w-32 h-32 rounded-3xl flex items-center justify-center text-6xl relative"
                  style={{background:`linear-gradient(135deg, ${COLORS[selectedSubject||'语文']}40, ${COLORS[selectedSubject||'语文']}20)`,border:`3px solid ${COLORS[selectedSubject||'语文']}40`}}>
                  <span className={boxState==='shaking'?'animate-spin':''}>🎁</span>
                  {boxState==='open' && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#d4912a] flex items-center justify-center text-xs">✨</div>
                  )}
                </div>
              </div>
              <p className="text-sm text-[#5c554c] mt-4">
                {!selectedSubject?'👆 先选学科':boxState==='idle'?'👆 点击盲盒摇一摇!':boxState==='shaking'?'🫨 摇晃中...':'🎉 打开!'}
              </p>
            </div>
          </>
        ) : (
          /* Task card reveal */
          <div className="animate-in text-center">
            <div className="w-full rounded-2xl p-8 mb-6"
              style={{background:`${COLORS[selectedSubject||'语文']}10`,border:`2px solid ${COLORS[selectedSubject||'语文']}30`}}>
              <span className="text-4xl block mb-4">{ICONS[selectedSubject||'语文']}</span>
              <span className="text-xs font-bold uppercase tracking-wider mb-3 block" style={{color:COLORS[selectedSubject||'语文']}}>{selectedSubject} 任务</span>
              <p className="text-xl font-bold text-[#e8e0d0] leading-relaxed mb-4">📋 {task}</p>
              <div className="flex gap-3 justify-center">
                <button onClick={reset} className="btn-ghost px-6 py-2 text-sm">再抽一个</button>
                <button onClick={()=>{setBoxState('idle');setTask(null);}} className="btn-primary px-6 py-2 text-sm">换学科</button>
              </div>
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="mt-8">
            <p className="text-xs text-[#5c554c] mb-3 uppercase tracking-wider">📜 抽卡记录</p>
            <div className="space-y-2">
              {history.map((h,i)=>(
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-lg">{ICONS[h.subject]}</span>
                  <span className="text-xs font-bold" style={{color:COLORS[h.subject]}}>{h.subject}</span>
                  <span className="text-sm text-[#9b8c78] truncate">{h.task}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
