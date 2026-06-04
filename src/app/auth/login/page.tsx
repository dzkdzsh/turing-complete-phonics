'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/auth';
import { useGameStore } from '@/lib/game-state';

export default function LoginPage() {
  const router = useRouter();
  const setScreen = useGameStore((s) => s.setScreen);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error === 'Invalid login credentials'
        ? '邮箱或密码错误'
        : result.error);
      setLoading(false);
      return;
    }

    setScreen('era-map');
    router.push('/era-select');
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#1a1814] p-8">
      <h1 className="text-3xl font-bold text-[#c9a96e] mb-2">图灵拼读</h1>
      <p className="text-[#8b7355] text-sm mb-8">登录你的账户</p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div>
          <label className="block text-sm text-[#8b7355] mb-1">邮箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full px-4 py-2.5 bg-[#2a2520] border border-[#c9a96e]/30 rounded-lg
                       text-[#e8e0d0] placeholder-[#555] focus:border-[#c9a96e] outline-none"
          />
        </div>

        <div>
          <label className="block text-sm text-[#8b7355] mb-1">密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="输入密码"
            required
            className="w-full px-4 py-2.5 bg-[#2a2520] border border-[#c9a96e]/30 rounded-lg
                       text-[#e8e0d0] placeholder-[#555] focus:border-[#c9a96e] outline-none"
          />
        </div>

        {error && (
          <p className="text-[#ef4444] text-sm text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#c9a96e] text-[#1a1814] font-bold rounded-lg
                     hover:bg-[#e0c78a] active:scale-95 transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '登录中...' : '登录'}
        </button>
      </form>

      <p className="mt-6 text-sm text-[#8b7355]">
        还没有账户？{' '}
        <Link href="/auth/register" className="text-[#c9a96e] hover:underline">
          注册
        </Link>
      </p>

      <button
        onClick={() => router.push('/')}
        className="mt-4 text-xs text-[#555] hover:text-[#8b7355] transition-colors"
      >
        ← 返回首页
      </button>
    </div>
  );
}
