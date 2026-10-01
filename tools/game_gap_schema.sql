-- Câu TRẮC NGHIỆM điền chỗ trống NGẮN (8-14 từ) do OpenAI soạn sẵn cho từng từ vựng WordLoop, dùng cho game.
-- Soạn bằng tools/gen_gap_sentences.py (gpt-4o-mini qua openai-proxy + 1 lượt AI kiểm "chỉ 1 từ hợp").
-- sentence là câu ĐẦY ĐỦ có chứa term; game tự thay term bằng chỗ trống, 3 đáp án nhiễu lấy từ cùng Block.
create table if not exists public.game_gap_sentences (
  word_id    text primary key,                 -- words.id
  block_id   text,                             -- words.block_id lúc soạn (đáp án nhiễu cùng Block)
  term       text not null,
  sentence   text not null,
  checked    boolean not null default false,   -- đã qua lượt AI kiểm
  model      text,
  created_at timestamptz not null default now()
);
create index if not exists game_gap_sentences_block_idx on public.game_gap_sentences (block_id);
alter table public.game_gap_sentences enable row level security;
drop policy if exists shared_all on public.game_gap_sentences;
create policy shared_all on public.game_gap_sentences for all to anon, authenticated using (true) with check (true);
