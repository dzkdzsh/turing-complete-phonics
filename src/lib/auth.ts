// 认证相关函数

import { createClient } from './supabase/client';

export async function signUp(email: string, password: string, username: string) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });

  if (error) {
    if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
      return { error: '该邮箱已注册，请直接登录' };
    }
    if (error.message?.includes('Password should be at least 6 characters')) {
      return { error: '密码至少需要6个字符' };
    }
    return { error: error.message };
  }

  const user = data.user;
  if (!user) return { error: '注册失败，请重试' };

  // 等待 session 就绪
  await new Promise((r) => setTimeout(r, 300));

  // 插入用户档案（RLS 策略验证 auth.uid() = id）
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({ id: user.id, username });

  if (profileError) {
    if (profileError.message?.includes('duplicate')) {
      return { error: '用户名已被使用' };
    }
    return { error: '档案创建失败: ' + profileError.message };
  }

  return { user };
}

export async function signIn(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  return { user: data.user };
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getUserProfile(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  return data;
}
