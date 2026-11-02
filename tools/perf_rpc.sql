-- Hàm đếm phía Supabase cho tốc độ khởi động (PLAN_PERF_BOOT, 2026-11-02). CHỈ THÊM hàm, không đổi bảng/dữ liệu/RLS.
-- Gỡ: drop function public.wl_block_stats(); drop function public.wl_word_stats(uuid);
-- Chạy bằng quyền invoker => RLS của words/word_progress áp dụng y như app đọc trực tiếp.

-- Số từ + tổng độ khó mỗi Block (trọng số giống LEVEL_WEIGHT trong js/app.js): thay cho tải cả bảng words chỉ để cộng.
create or replace function public.wl_block_stats()
returns table(block_id text, n bigint, wsum bigint)
language sql stable
as $$
  select w.block_id, count(*)::bigint,
         sum(case upper(coalesce(w.level, ''))
               when 'A1' then 1 when 'A2' then 1 when 'B1' then 2
               when 'B2' then 3 when 'C1' then 5 when 'C2' then 8 else 1 end)::bigint
  from public.words w
  group by w.block_id
$$;

-- Tổng từ KHÁC NHAU + số từ khác nhau đã thuộc của 1 user. Chuẩn hoá chữ y như w.normalizeAnswer (js/util.js):
-- lower -> trim -> bỏ . , ! ? ; : " ' ` ( ) [ ] -> gộp khoảng trắng; chuỗi rỗng không đếm.
create or replace function public.wl_word_stats(p_user uuid default null)
returns table(total_distinct bigint, mastered_distinct bigint)
language sql stable
as $$
  with n as (
    select w.id,
           regexp_replace(regexp_replace(lower(btrim(coalesce(w.term, ''))), '[.,!?;:"''`()\[\]]', '', 'g'), '\s+', ' ', 'g') as k
    from public.words w
  )
  select (select count(distinct k) from n where k <> '')::bigint,
         (select count(distinct n.k) from public.word_progress wp join n on n.id = wp.word_id
           where wp.user_id = p_user and wp.mastered and n.k <> '')::bigint
$$;

grant execute on function public.wl_block_stats() to anon, authenticated;
grant execute on function public.wl_word_stats(uuid) to anon, authenticated;
