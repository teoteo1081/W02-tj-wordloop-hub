-- Câu hỏi đề thi (TOEIC trước) cho Hub 🎯 Làm bài TEST của phòng game (TJ 2026-10-03).
-- Nội dung đề nằm Ở BẢNG NÀY trên Supabase, KHÔNG trong repo (bản quyền ETS, repo public).
-- Chạy 1 lần trong Supabase › SQL Editor.
create table if not exists public.test_items (
  id          text primary key,            -- vd ets_t1_p5_101
  exam        text not null default 'toeic',
  test        text not null,               -- số đề: '1', '2'…
  part        int  not null,               -- 1–7
  num         int  not null,               -- số câu trong đề: 101…200
  stem        text,                        -- câu hỏi (chỗ trống = _______)
  stem_vi     text,                        -- bản dịch tiếng Việt của CẢ câu (đã điền đáp án)
  opts        jsonb not null,              -- ["(A) …","(B) …","(C) …","(D) …"]
  answer      text,                        -- 'A'..'D'
  tag         text,                        -- chủ điểm: Từ loại, Giới từ, Từ vựng…
  explain     text,                        -- giải thích ngắn (tiếng Việt)
  passage     text,                        -- đoạn văn dùng chung (Part 6/7), null nếu không có
  src         text,                        -- file gốc trong bucket toeic, vd TEST_1_RC.pdf
  answer_src  text,                        -- 'claude' (Claude tự giải) | 'key' (đáp án chính thức)
  created_at  timestamptz default now()
);
create index if not exists test_items_tp on public.test_items (exam, test, part, num);
alter table public.test_items enable row level security;
create policy "test_items_all" on public.test_items for all to anon, authenticated using (true) with check (true);
alter table public.test_items add column if not exists stem_vi text;   -- bảng tạo trước khi có cột dịch
alter table public.test_items add column if not exists i18n jsonb;   -- lời giải đa ngôn ngữ {vi:{tag,explain,stem}, en:{tag,explain}, …} (TJ 2026-10-03)
