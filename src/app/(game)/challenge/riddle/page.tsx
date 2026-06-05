'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const RIDDLES = [
  { q:'上边毛，下边毛，中间一颗黑葡萄。（打一器官）', ans:'眼睛', hint:'脸上的' },
  { q:'五个兄弟，住在一起，名字不同，高矮不齐。（打一身体部位）', ans:'手指', hint:'手上的' },
  { q:'白嫩小宝宝，洗澡吹泡泡，洗洗身体小，再洗不见了。（打一物品）', ans:'肥皂', hint:'洗手的' },
  { q:'有面没有口，有脚没有手，虽有四只脚，自己不会走。（打一物品）', ans:'桌子', hint:'家具' },
  { q:'身穿绿衣裳，肚里水汪汪，生的子儿多，个个黑脸膛。（打一水果）', ans:'西瓜', hint:'夏天的' },
  { q:'小小姑娘满身黑，秋去江南春来归，从小立志除害虫，身带剪刀满天飞。（打一动物）', ans:'燕子', hint:'会飞的' },
  { q:'头戴红帽子，身披五彩衣，从来不唱戏，喜欢吊嗓子。（打一动物）', ans:'公鸡', hint:'早上叫的' },
  { q:'像熊不是熊，身穿黑白衣，圆圆胖胖的，最爱吃竹子。（打一动物）', ans:'熊猫', hint:'国宝' },
  { q:'一个小姑娘，坐在水中央，身穿粉红衫，坐在绿船上。（打一植物）', ans:'荷花', hint:'长在水里的' },
  { q:'千条线，万条线，掉到水里看不见。（打一自然现象）', ans:'下雨', hint:'天气' },
  { q:'有时落在山腰，有时挂在树梢，有时像面圆镜，有时像把镰刀。（打一天体）', ans:'月亮', hint:'晚上的' },
  { q:'一座七彩桥，雨后天上挂。（打一自然现象）', ans:'彩虹', hint:'下雨后的' },
  { q:'左一片，右一片，隔座山头不见面。（打一器官）', ans:'耳朵', hint:'头上的' },
  { q:'屋子方方，有门没窗，屋外热烘，屋里冰霜。（打一电器）', ans:'冰箱', hint:'厨房里的' },
  { q:'独木造高楼，没瓦没砖头，人在水下走，水在人上流。（打一物品）', ans:'雨伞', hint:'下雨用的' },
  { q:'弟兄七八个，围着柱子坐，只要一分开，衣服就扯破。（打一食材）', ans:'大蒜', hint:'调味用的' },
  { q:'颜色白如雪，身子硬如铁，一日洗三遍，夜晚柜中歇。（打一餐具）', ans:'碗', hint:'吃饭用的' },
  { q:'一匹马儿真正好，没有尾巴没有脚，不喝水来不吃草，骑上它就满街跑。（打一交通工具）', ans:'自行车', hint:'两个轮子的' },
  { q:'身穿大皮袄，野草吃个饱，过了严冬天，献出一身毛。（打一动物）', ans:'绵羊', hint:'毛很软的' },
  { q:'身披花棉袄，唱歌呱呱叫，田里捉害虫，丰收立功劳。（打一动物）', ans:'青蛙', hint:'会跳的' },
  { q:'长长一条龙，走路轰隆隆，跨河又钻洞，鸣鸣向前冲。（打一交通工具）', ans:'火车', hint:'有铁轨的' },
  { q:'远看山有色，近听水无声，春去花还在，人来鸟不惊。（打一艺术品）', ans:'画', hint:'挂墙上的' },
  { q:'说它是条牛，无法拉车走，说它力气小，却能背屋走。（打一动物）', ans:'蜗牛', hint:'很慢的' },
  { q:'红口袋，绿口袋，有人怕，有人爱。（打一蔬菜）', ans:'辣椒', hint:'很辣的' },
  { q:'有个公公精神好，从早到晚不睡觉，身体虽小力气大，千人万人推不倒。（打一玩具）', ans:'不倒翁', hint:'小孩玩的' },
];

export default function RiddlePage() {
  const r = useRouter();
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [input, setInput] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [riddles, setRiddles] = useState(RIDDLES);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRiddles(RIDDLES.sort(()=>Math.random()-0.5));
  }, []);

  const riddle = riddles[idx];

  const submit = useCallback(() => {
    const v = input.trim();
    if (!v || showAnswer) return;
    if (v === riddle?.ans) {
      setScore(s => s + 10); setFeedback('✅ 猜对了！'); setShowAnswer(true);
      setTimeout(() => {
        if (idx+1 >= riddles.length) setGameOver(true);
        else { setIdx(i=>i+1); setInput(''); setShowHint(false); setShowAnswer(false); setFeedback(''); }
      }, 1500);
    } else {
      setFeedback('❌ 不对哦，再想想！'); setInput('');
    }
  }, [input, showAnswer, riddle, idx, riddles.length]);

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') submit(); };
  const restart = () => { setIdx(0); setScore(0); setInput(''); setShowHint(false); setShowAnswer(false); setFeedback(''); setGameOver(false); setRiddles(RIDDLES.sort(()=>Math.random()-0.5)); inputRef.current?.focus(); };

  return (
    <div className="min-h-screen flex flex-col items-center" style={{background:'#0f0d0a'}}>
      <div className="w-full max-w-2xl px-6 pt-6">
        <button onClick={()=>r.push('/challenge')} className="text-xs text-[#5c554c] hover:text-[#9b8c78] mb-4">← 返回</button>
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-3xl font-bold text-[#e8e0d0]">🧩 猜谜语</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#9b8c78]">⭐{score}</span>
            <span className="text-xs text-[#5c554c]">{idx+1}/{riddles.length}</span>
          </div>
        </div>
        {!gameOver ? (
          <div className="bg-white/[0.02] rounded-2xl border border-white/[0.04] p-8 text-center">
            <p className="text-xs text-[#5c554c] mb-4 uppercase tracking-wider">猜一猜</p>
            <p className="text-xl font-bold text-[#e8e0d0] mb-8 leading-relaxed">{riddle?.q}</p>
            {showHint && <p className="text-sm text-[#d4912a] mb-4">💡 提示：{riddle?.hint}</p>}
            {showAnswer && <p className="text-lg font-bold text-[#10b981] mb-4 animate-in bouncy-pop">🎉 {riddle?.ans}</p>}
            {!showAnswer && (
              <div className="flex gap-3 items-center">
                <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey}
                  placeholder="输入你的答案..."
                  className="flex-1 bg-white/[0.03] rounded-xl border border-white/[0.06] px-4 py-3 text-[#e8e0d0] text-lg outline-none placeholder:text-[#5c554c]"
                  autoFocus />
                <button onClick={submit} className="btn-primary px-6 py-3 text-sm">提交</button>
                <button onClick={()=>setShowHint(true)} className="text-xs text-[#5c554c] hover:text-[#d4912a] px-3 py-3">提示</button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center animate-in py-12">
            <p className="text-5xl mb-4">🧩</p>
            <p className="text-2xl font-bold text-[#e8e0d0] font-display mb-2">全部猜完!</p>
            <p className="text-[#9b8c78] mb-4">答对 {Math.round(score/10)} 题，得分 {score}</p>
            <button onClick={restart} className="btn-primary px-8 py-3">再来一局</button>
          </div>
        )}
        {feedback && <p className={`text-sm mt-3 text-center ${feedback.startsWith('✅')?'text-[#10b981]':'text-[#ef4444]'}`}>{feedback}</p>}
      </div>
    </div>
  );
}
