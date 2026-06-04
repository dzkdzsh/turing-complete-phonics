// 认证相关函数

import { createClient } from './supabase/client';

export async function signUp(email: string, password: string, username: string) {
  const supabase = createClient();

  // 1. Supabase Auth 注册
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });

  if (error) {
    if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
      return { error: '该邮箱已注册，请直接登录' };
    }
    return { error: error.message };
  }

  const user = data.user;
  if (!user) return { error: '注册失败，请重试' };

  // 用户创建成功（即使邮箱未验证，Supabase 也会在 dev 模式下允许登录）
  // 2. 创建用户档案
  const { error: profileError } = await supabase.from('user_profiles').insert({
    id: user.id,
    username,
  });

  if (profileError) {
    return { error: profileError.message?.includes('duplicate') ? '用户名已被使用' : profileError.message };
  }

  return { user };
}

export async function signIn(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

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
    .single();

  return data;
}
