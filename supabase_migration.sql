-- Turing Complete for Phonics - 数据库迁移
-- 在 Supabase SQL Editor 中执行此文件

-- 1. 用户进度表
CREATE TABLE IF NOT EXISTS user_progress (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  level_id TEXT NOT NULL CHECK (length(level_id) > 0),
  completed BOOLEAN DEFAULT false,
  stars SMALLINT DEFAULT 0 CHECK (stars BETWEEN 0 AND 3),
  completion_data JSONB DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, level_id)
);

-- 2. 启用 RLS
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- 3. RLS 策略：用户只能读写自己的进度
CREATE POLICY "users_can_read_own_progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_can_insert_own_progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. 索引优化
CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_user_progress_level ON user_progress(level_id);
