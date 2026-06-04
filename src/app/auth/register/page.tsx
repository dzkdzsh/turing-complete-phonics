'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp, getUserProfile } from '@/lib/auth';
import { useGameStore } from '@/lib/game-state';

export default function RegisterPage() {
  const router = useRouter();
  const { setUser, setIsAdmin, setUsername, setScreen } = useGameStore();
  const [uname, setUname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (uname.length < 2) { setError('用户名至少2个字符'); return; }
    if (password.length < 6) { setError('密码至少6个字符'); return; }

    setLoading(true);
    const result = await signUp(email, password, uname);
    if (result.error || !result.user) {
      if (result.error?.includes('duplicate')) setError('用户名已被使用');
      else if (result.error?.includes('already registered')) setError('该邮箱已注册');
      else setError(result.error || '注册失败');
      setLoading(false);
      return;
    }

    setUser(result.user.id);
    const profile = await getUserProfile(result.user.id);
    if (profile) {
      setIsAdmin(profile.is_admin ?? false);
      setUsername(profile.username ?? uname);
    }

    setScreen('era-map');
    router.push('/era-select');
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#1a1814] p-8">
      <h1 className="text-3xl font-bold text-[#c9a96e] mb-2">图灵拼读</h1>
      <p className="text-[#8b7355] text-sm mb-8">创建新账户</p>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div><label className="block text-sm text-[#8b7355] mb-1">用户名</label>
          <input type="text" value={uname} onChange={(e) => setUname(e.target.value)}
            placeholder="你的昵称" required
            className="w-full px-4 py-2.5 bg-[#2a2520] border border-[#c9a96e]/30 rounded-lg
                       text-[#e8e0d0] placeholder-[#555] focus:border-[#c9a96e] outline-none" />
        </div>
        <div><label className="block text-sm text-[#8b7355] mb-1">邮箱</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com" required
            className="w-full px-4 py-2.5 bg-[#2a2520] border border-[#c9a96e]/30 rounded-lg
                       text-[#e8e0d0] placeholder-[#555] focus:border-[#c9a96e] outline-none" />
        </div>
        <div><label className="block text-sm text-[#8b7355] mb-1">密码</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="至少6个字符" required
            className="w-full px-4 py-2.5 bg-[#2a2520] border border-[#c9a96e]/30 rounded-lg
                       text-[#e8e0d0] placeholder-[#555] focus:border-[#c9a96e] outline-none" />
        </div>
        {error && <p className="text-[#ef4444] text-sm text-center">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full py-3 bg-[#c9a96e] text-[#1a1814] font-bold rounded-lg
                     hover:bg-[#e0c78a] active:scale-95 transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? '注册中...' : '注册'}
        </button>
      </form>
      <p className="mt-6 text-sm text-[#8b7355]">
        已有账户？{' '}<Link href="/auth/login" className="text-[#c9a96e] hover:underline">登录</Link>
      </p>
      <button onClick={() => router.push('/')}
        className="mt-4 text-xs text-[#555] hover:text-[#8b7355] transition-colors">
        ← 返回首页
      </button>
    </div>
  );
}
