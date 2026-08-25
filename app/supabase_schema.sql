-- ============================================================
-- 考研备考管家 · Supabase 云端同步 建表脚本
-- 使用方法：登录 Supabase 后台 → SQL Editor → 粘贴执行
-- ============================================================

-- 1) 通用数据表（所有小功能存成 item 行）
create table if not exists public.items (
  id          text     primary key,
  user_id     uuid     not null,
  type        text     not null,
  data        jsonb    not null default '{}'::jsonb,
  created_at  bigint,
  updated_at  bigint,
  deleted     boolean  default false
);

-- 2) 行级安全：只能访问自己的数据
alter table public.items enable row level security;

drop policy if exists "items_owner_all" on public.items;
create policy "items_owner_all"
  on public.items
  for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

-- 3) 可选索引（加速按用户/类型查询）
create index if not exists items_user_idx on public.items (user_id);
create index if not exists items_type_idx on public.items (type);

-- ============================================================
-- 说明
--   - 每条本地记录对应一行 item：id=本地主键, type=业务类型(如 tasks/mistakes/notes)
--     data=该记录的具体字段(jsonb)
--   - 登录后离线期间的数据会暂存在浏览器，联网登录即自动上传
--   - 拉取云端时按 updated_at 较新者优先（后写覆盖）
--   - 关闭 "Confirm email" 可让注册后直接登录；开启则需先验证邮箱
-- ============================================================
