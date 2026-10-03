-- 🎮 Phòng game chơi chung (TJ 2026-09-30) — xem README.md mục "Việc còn dang dở" > PHÒNG GAME.
-- Chạy 1 lần qua Supabase Management API (POST /v1/projects/<ref>/database/query) hoặc SQL Editor.
-- RLS mở cho anon giống các bảng khác của app ("app gia đình, tin tưởng nội bộ" — xem CLAUDE.md).

create table if not exists public.game_players (
  id uuid primary key default gen_random_uuid(),
  name text not null,                 -- tên người chơi gõ
  name_no int not null default 1,     -- trùng tên -> 2, 3… (hiện "Lan #2")
  avatar text,                        -- emoji có sẵn HOẶC URL ảnh tải lên (bucket game-avatars)
  profile_id uuid,                    -- nếu đang đăng nhập hồ sơ WordLoop (vd TJ)
  created_at timestamptz not null default now()
);
create index if not exists game_players_name_idx on public.game_players (lower(name));

create table if not exists public.game_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,          -- mã phòng 5 ký tự
  host_id uuid,                       -- profile WordLoop của host (chỉ admin mở phòng)
  title text,                         -- tên phạm vi (vd "TOEIC › Block 12")
  scope jsonb not null,               -- [{table:"notebooks", id:"…"}, …]
  mode text not null default 'kahoot',   -- 'kahoot' (cùng câu) | 'free' (tự làm)
  team_mode boolean not null default false,
  teams int not null default 0,
  minutes numeric not null default 5,
  q_seconds int not null default 15,
  meaning_lang text not null default 'vi',  -- nghĩa hiện bằng: vi | en (def_en) | es | zh
  qtype text not null default 'meaning',   -- dạng câu: meaning (nghĩa->chọn từ) | gap (điền chỗ trống từ bài đọc) | recall (gõ từ) | mix
  status text not null default 'lobby',  -- lobby | playing | ended
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.game_results (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  player_id uuid not null references public.game_players(id) on delete cascade,
  team int,
  score int not null default 0,
  correct int not null default 0,
  wrong int not null default 0,
  best_streak int not null default 0,
  rank int,
  created_at timestamptz not null default now(),
  unique (room_id, player_id)
);

create table if not exists public.game_answers (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  player_id uuid not null references public.game_players(id) on delete cascade,
  word_id text,                       -- words.id (text) — dùng cho tiến trình "học chung" của TJ
  term text,
  correct boolean not null,
  ms int,                             -- thời gian trả lời (ms)
  at timestamptz not null default now()
);
create index if not exists game_answers_room_idx on public.game_answers (room_id);
create index if not exists game_answers_player_idx on public.game_answers (player_id);

do $$ declare t text; begin
  foreach t in array array['game_players','game_rooms','game_results','game_answers'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists shared_all on public.%I', t);
    execute format('create policy shared_all on public.%I for all to anon, authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- Ảnh đại diện tự tải lên: bucket public, tối đa 300 KB, chỉ ảnh
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('game-avatars', 'game-avatars', true, 307200, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 307200, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists game_avatars_read on storage.objects;
create policy game_avatars_read on storage.objects for select to anon, authenticated using (bucket_id = 'game-avatars');
drop policy if exists game_avatars_insert on storage.objects;
create policy game_avatars_insert on storage.objects for insert to anon, authenticated with check (bucket_id = 'game-avatars');

-- ===== 2026-09-30 (TJ): PHÒNG CỐ ĐỊNH + NHIỀU VÁN =====
-- 1 host = 1 phòng dùng mãi (mã/link không đổi). Chủ đề/dạng câu/đội chọn trong phòng chờ.
-- Mỗi lần bấm Bắt đầu = 1 VÁN (game_matches); kết quả/câu trả lời gắn theo ván.
create table if not exists public.game_matches (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  title text,
  scope jsonb,
  mode text, qtype text, meaning_lang text,
  minutes numeric, q_seconds int, teams int not null default 0,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);
create index if not exists game_matches_room_idx on public.game_matches (room_id);
alter table public.game_results add column if not exists match_id uuid references public.game_matches(id) on delete cascade;
alter table public.game_answers add column if not exists match_id uuid references public.game_matches(id) on delete cascade;
alter table public.game_results drop constraint if exists game_results_room_id_player_id_key;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'game_results_match_player_key') then
    alter table public.game_results add constraint game_results_match_player_key unique (match_id, player_id);
  end if;
end $$;
create index if not exists game_answers_match_idx on public.game_answers (match_id);
alter table public.game_matches enable row level security;
drop policy if exists shared_all on public.game_matches;
create policy shared_all on public.game_matches for all to anon, authenticated using (true) with check (true);

-- 2026-09-30: cách tính điểm mỗi ván: q (theo câu, đúng +100) | speed (theo tốc độ, đúng 100 -> 50)
alter table public.game_matches add column if not exists scoring text not null default 'q';
alter table public.game_rooms add column if not exists scoring text not null default 'q';

-- 2026-10-03 (ĐÃ CHẠY trên Supabase thật qua Management API): 🎯 ngôn ngữ đang học + lưu đáp án đã chọn
alter table public.game_matches add column if not exists target text;   -- en | zh | es | vi (null = en, ván cũ)
alter table public.game_answers add column if not exists target text;   -- như trên, theo từng câu
alter table public.game_answers add column if not exists choice text;   -- đáp án người chơi đã chọn/gõ (xem lại ván cũ)
