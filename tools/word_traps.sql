-- 🪤 Đáp án BẪY cho game từ vựng (TJ duyệt 2026-10-05). Chạy 1 lần trong Supabase › SQL Editor.
-- word_term = từ gốc viết thường, gộp khoảng trắng (khớp norm() trong js/game.js).
create table if not exists public.word_traps (
  id         uuid primary key default gen_random_uuid(),
  word_term  text not null,
  kind       text not null check (kind in ('look','family','syn','false')),   -- 🔤 giống mặt chữ · 👪 cùng họ từ · 🔀 gần nghĩa · ⚠️ bạn giả
  trap_term  text not null,
  trap_en    text, trap_vi text, trap_zh text, trap_es text,
  why        text,                                                            -- vì sao dễ nhầm (tiếng Việt)
  risk       text default 'safe',                                             -- safe | check (AI báo có thể là đáp án đúng thứ hai)
  status     text not null default 'pending' check (status in ('pending','approved','rejected')),
  source     text default 'gpt-4o',
  created_at timestamptz default now(),
  unique (word_term, trap_term)
);
create index if not exists word_traps_word_idx on public.word_traps (word_term) where status = 'approved';
alter table public.word_traps enable row level security;
drop policy if exists shared_all on public.word_traps;
create policy shared_all on public.word_traps for all to anon, authenticated using (true) with check (true);   -- giống các bảng khác của app (tin tưởng nội bộ)
