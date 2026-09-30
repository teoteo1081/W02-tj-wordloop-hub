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
