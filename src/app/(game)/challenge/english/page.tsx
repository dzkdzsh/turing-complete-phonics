'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

const POOL_PHONICS=['m','s','a','t','p','n','k','e','i','o','b','d','f','g','h'];
const POOL_SPELL=['cat','dog','sit','bus','stop','frog','ship','chat','cake','bike','fish','thin','flag','desk','home','tune'];
const POOL_MEMORY=['cat','dog','sit','bus','said','they','come','what','stop','ship','cake','home'];
type QType='phonics'|'spell'|'memory';
type Question={type:QType;word:string;options?:string[];answer:string};
function shuffle<T>(a:T[]):T[]{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

export default function EnglishPage(){
  const r=useRouter();
  const[phase,setPhase]=useState<'setup'|'playing'|'result'>('setup');
  const[questions,setQuestions]=useState<Question[]>([]);const[qIndex,setQIndex]=useState(0);
  const[score,setScore]=useState(0);const[streak,setStreak]=useState(0);
  const[timeLeft,setTimeLeft]=useState(90);const[timerActive,setTimerActive]=useState(false);
  const[qCount,setQCount]=useState(8);const[totalTime,setTotalTime]=useState(90);
  const[enabledTypes,setEnabledTypes]=useState<QType[]>(['phonics','spell','memory']);
  const[userAnswer,setUserAnswer]=useState('');const[slots,setSlots]=useState<string[]>([]);
  const[showFeedback,setShowFeedback]=useState<'correct'|'wrong'|null>(null);
  const[flashWord,setFlashWord]=useState<string|null>(null);
  const fbTimer=useRef<NodeJS.Timeout|null>(null);

  useEffect(()=>{if(!timerActive||timeLeft<=0)return;const t=setInterval(()=>setTimeLeft(p=>{if(p<=1){setTimerActive(false);setPhase('result');return 0;}return p-1}),1000);return()=>clearInterval(t);},[timerActive,timeLeft]);
  useEffect(()=>{if(phase!=='playing'||!questions[qIndex]||questions[qIndex].type!=='memory'){setFlashWord(null);return;}setFlashWord(questions[qIndex].word);const t=setTimeout(()=>setFlashWord(null),2000);return()=>clearTimeout(t);},[qIndex,phase]);

  const start=()=>{
    const qs:Question[]=[];
    for(let i=0;i<qCount;i++){const type=enabledTypes[Math.floor(Math.random()*enabledTypes.length)];const pool=type==='phonics'?POOL_PHONICS:type==='spell'?POOL_SPELL:POOL_MEMORY;const word=pool[Math.floor(Math.random()*pool.length)];if(type==='phonics'){const o=shuffle([word,...POOL_PHONICS.filter(p=>p!==word).slice(0,3)]);qs.push({type,word,options:o,answer:word});}else qs.push({type,word,answer:word});}
    setQuestions(qs);setQIndex(0);setScore(0);setStreak(0);setTimeLeft(totalTime);setPhase('playing');setTimerActive(true);setShowFeedback(null);
  };
  const speak=(t:string)=>{try{const u=new SpeechSynthesisUtterance(t);u.lang='en-US';u.rate=0.7;speechSynthesis.cancel();speechSynthesis.speak(u);}catch(e){}}
  const check=useCallback((ans:string)=>{if(showFeedback)return;const q=questions[qIndex];const ok=ans===q.answer;if(ok){setScore(s=>s+10+(streak>=2?5:0));setStreak(s=>s+1);setShowFeedback('correct');}else{setStreak(0);setShowFeedback('wrong');}fbTimer.current=setTimeout(()=>{setShowFeedback(null);setUserAnswer('');setSlots([]);if(qIndex+1>=questions.length){setPhase('result');setTimerActive(false);}else setQIndex(i=>i+1);},ok?600:1000);},[qIndex,questions.length,streak,showFeedback]);
  useEffect(()=>{return()=>{if(fbTimer.current)clearTimeout(fbTimer.current);}},[]);
  const q=questions[qIndex];

  return (
    <div className="min-h-screen flex flex-col items-center" style={{background:'linear-gradient(135deg, #fdf8f0 0%, #f5ede0 50%, #efe5d2 100%)'}}>
      <div className="w-full max-w-2xl px-6 pt-6">
        <button onClick={()=>r.push('/challenge')} className="text-xs text-[#9b8c78] hover:text-[#d4912a] mb-4">← 返回</button>
        {phase==='setup'&&(
          <div className="flex flex-col items-center gap-8 animate-in">
            <h1 className="font-display text-3xl font-bold text-[#2c2416]">⚡ 英语挑战</h1>
            <div className="w-full space-y-5">
              <div><p className="text-xs text-[#9b8c78] mb-2 uppercase tracking-wider">题目数量</p><div className="flex gap-2">{[4,8,12,16].map(n=><button key={n} onClick={()=>setQCount(n)} className={`px-4 py-2 rounded-xl text-sm font-bold ${qCount===n?'bg-[#d4912a] text-[#0f0d0a]':'bg-white/5 text-[#9b8c78]'}`}>{n}题</button>)}</div></div>
              <div><p className="text-xs text-[#9b8c78] mb-2 uppercase tracking-wider">总时间</p><div className="flex gap-2">{[{v:60,l:'60秒'},{v:90,l:'90秒'},{v:120,l:'2分钟'}].map(o=><button key={o.v} onClick={()=>setTotalTime(o.v)} className={`px-4 py-2 rounded-xl text-sm font-bold ${totalTime===o.v?'bg-[#d4912a] text-[#0f0d0a]':'bg-white/5 text-[#9b8c78]'}`}>{o.l}</button>)}</div></div>
              <div><p className="text-xs text-[#9b8c78] mb-2 uppercase tracking-wider">题型</p><div className="flex gap-2">{(['phonics','spell','memory']as QType[]).map(t=>{const l:Record<QType,string>={phonics:'🔊辨音',spell:'✍️拼写',memory:'🧠记忆'};return <button key={t} onClick={()=>setEnabledTypes(p=>p.includes(t)?p.filter(x=>x!==t):[...p,t])} className={`px-4 py-2 rounded-xl text-sm font-bold ${enabledTypes.includes(t)?'bg-[#d4912a] text-[#0f0d0a]':'bg-white/5 text-[#9b8c78]'}`}>{l[t]}</button>;})}</div></div>
            </div>
            <button onClick={start} className="btn-primary text-lg px-10 py-4 w-full" disabled={enabledTypes.length===0}>开始挑战!</button>
          </div>
        )}
        {phase==='playing'&&q&&(
          <div className="flex flex-col items-center flex-1 w-full">
            <div className="w-full flex items-center justify-between mb-4"><div className="flex items-center gap-4"><span className="text-[#d4912a] font-mono text-lg font-bold">{qIndex+1}/{questions.length}</span><span className="text-sm text-[#9b8c78]">⭐{score}</span>{streak>=3&&<span className="text-xs text-[#f97316]">🔥x{streak}</span>}</div><div className={`font-mono text-lg font-bold ${timeLeft<=10?'text-[#ef4444]':'text-[#2c2416]'}`}>{timeLeft}s</div></div>
            <div className="w-full h-2 rounded-full bg-white/5 mb-8 overflow-hidden"><div className={`h-full rounded-full transition-all ${timeLeft<=10?'bg-[#ef4444]':'bg-[#d4912a]'}`} style={{width:`${(timeLeft/totalTime)*100}%`}}/></div>
            <div className={`flex-1 flex flex-col items-center justify-center w-full rounded-3xl transition-all min-h-[300px] ${showFeedback==='correct'?'bg-[#10b981]/10 border-2 border-[#10b981]/30':showFeedback==='wrong'?'bg-[#ef4444]/10 border-2 border-[#ef4444]/30':'bg-white/[0.02] border-2 border-transparent'}`}>
              {q.type==='phonics'?(
                <div className="flex flex-col items-center gap-6"><button onClick={()=>speak(`/${q.word}/`)} className="w-20 h-20 rounded-full bg-[#d4912a]/10 border-2 border-[#d4912a]/30 flex items-center justify-center text-3xl hover:scale-110 transition-transform">🔊</button><p className="text-[#9b8c78] text-sm">听到的是哪个音素？</p><div className="flex gap-4">{q.options?.map(o=><button key={o} onClick={()=>check(o)} className="w-16 h-16 rounded-2xl bg-white/5 border-2 border-white/10 text-2xl font-bold text-[#2c2416] hover:border-[#d4912a] transition-all">{o}</button>)}</div></div>
              ):(
                <div className="flex flex-col items-center gap-6">{flashWord&&<p className="text-5xl font-extrabold text-[#f97316] font-display bouncy-pop">{flashWord.toUpperCase()}</p>}{!flashWord&&<button onClick={()=>speak(q.word)} className="w-16 h-16 rounded-full bg-[#d4912a]/10 border-2 border-[#d4912a]/30 flex items-center justify-center text-2xl hover:scale-110 transition-transform">🔊</button>}<p className="text-[#9b8c78] text-xs">{q.type==='memory'?'记住然后拼出来':'听发音拼出来'}</p><div className="flex gap-2">{Array.from({length:q.word.length}).map((_,i)=><button key={i} onClick={()=>setSlots(s=>s.filter((_,j)=>j!==i))} className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center text-xl font-bold ${slots[i]?'bg-[#d4912a]/10 border-[#d4912a]/30 text-[#d4912a]':'bg-white/5 border-white/10'}`}>{slots[i]?.toUpperCase()||''}</button>)}</div><div className="flex gap-2 flex-wrap justify-center max-w-sm">{shuffle([...q.word.split(''),...'abcdefghijklmnopqrstuvwxyz'.split('').filter(l=>!q.word.includes(l)).slice(0,Math.max(0,8-q.word.length))]).map((l,i)=><button key={i} onClick={()=>{if(slots.length>=q.word.length)return;const ns=[...slots,l];setSlots(ns);if(ns.length===q.word.length)check(ns.join(''));}} disabled={slots.filter(x=>x===l).length>=q.word.split('').filter(x=>x===l).length} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-[#2c2416] hover:border-[#d4912a] transition-all disabled:opacity-20">{l.toUpperCase()}</button>)}</div></div>
              )}
            </div>
            {showFeedback&&<div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"><p className={`text-6xl font-extrabold bouncy-pop ${showFeedback==='correct'?'text-[#10b981]':'text-[#ef4444]'}`}>{showFeedback==='correct'?'✓':'✗'}</p></div>}
          </div>
        )}
        {phase==='result'&&(
          <div className="flex flex-col items-center justify-center gap-6 py-12 animate-in">
            <div className="w-20 h-20 rounded-full bg-[#d4912a]/10 border-2 border-[#d4912a]/30 flex items-center justify-center text-3xl">🏆</div><h1 className="font-display text-3xl font-bold text-[#2c2416]">挑战完成!</h1>
            <div className="flex gap-8 text-center"><div><p className="text-3xl font-bold text-[#d4912a]">{score}</p><p className="text-xs text-[#9b8c78]">得分</p></div><div><p className="text-3xl font-bold text-[#2c2416]">{questions.length}</p><p className="text-xs text-[#9b8c78]">题数</p></div><div><p className="text-3xl font-bold text-[#10b981]">{streak}</p><p className="text-xs text-[#9b8c78]">连击</p></div></div>
            <div className="flex gap-4 mt-4"><button onClick={()=>setPhase('setup')} className="btn-primary px-8 py-3">再来一轮</button><button onClick={()=>r.push('/challenge')} className="btn-ghost px-8 py-3">返回</button></div>
          </div>
        )}
      </div>
    </div>
  );
}
