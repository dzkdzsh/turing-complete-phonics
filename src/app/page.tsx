'use client';

import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/game-state';
import { useEffect } from 'react';
import { getCurrentUser, getUserProfile } from '@/lib/auth';

export default function Home() {
  const router = useRouter();
  const { setScreen } = useGameStore();

  // 检查是否已登录
  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user) {
        setScreen('era-map');
        router.push('/era-select');
      }
    });
  }, [router, setScreen]);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#1a1814]">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-[#c9a96e] mb-3 tracking-wider">
          图灵拼读
        </h1>
        <p className="text-lg text-[#8b7355]">
          Turing Complete for Phonics
        </p>
        <div className="mt-4 w-32 h-1 bg-[#c9a96e] mx-auto rounded-full" />
      </div>

      <p className="text-[#8b7355] text-center max-w-md mb-10 leading-relaxed">
        一个失落的文明曾掌握了将声音编码为文字的技术。
        <br />
        文明崩塌后，只剩下声音的碎片……
        <br />
        你——语言工程师的学徒——被召唤来
        <br />
        <span className="text-[#c9a96e]">重新发明整个英语发音系统。</span>
      </p>

      <div className="flex gap-4">
        <button
          onClick={() => router.push('/auth/login')}
          className="px-8 py-3 border border-[#c9a96e]/50 text-[#c9a96e]
                     rounded-lg hover:border-[#c9a96e] hover:bg-[#c9a96e]/10
                     transition-all duration-200 font-medium"
        >
          登录
        </button>
        <button
          onClick={() => router.push('/auth/register')}
          className="px-8 py-3 bg-[#c9a96e] text-[#1a1814] font-bold
                     rounded-lg hover:bg-[#e0c78a] active:scale-95
                     transition-all duration-200 shadow-lg shadow-[#c9a96e]/20"
        >
          注册
        </button>
      </div>

      <p className="mt-8 text-xs text-[#555]">
        声音 → 音素 → 字母 → 拼读 → 规则 → 阅读
      </p>
    </div>
  );
}
