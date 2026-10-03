-- Kho file đề thi TOEIC (TJ 2026-10-03): bucket "toeic" trên Supabase Storage.
-- Cấu trúc thư mục cố định:  toeic/reading/TEST_<n>_RC.pdf · toeic/listening/TEST_<n>_LC.pdf · toeic/listening/TEST_<n>_LC.mp3
-- Đề có bản quyền (sách ETS) -> KHÔNG để trong repo GitHub (public); chỉ để ở bucket này.
-- Chạy 1 lần trong Supabase Dashboard › SQL Editor (hoặc Management API khi có PAT).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('toeic', 'toeic', true, 52428800,
        array['application/pdf', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- đọc + liệt kê file (game cần), tải lên + ghi đè (Claude/TJ nạp đề). KHÔNG mở quyền xoá cho anon.
create policy "toeic_read"   on storage.objects for select to anon, authenticated using (bucket_id = 'toeic');
create policy "toeic_upload" on storage.objects for insert to anon, authenticated with check (bucket_id = 'toeic');
create policy "toeic_update" on storage.objects for update to anon, authenticated using (bucket_id = 'toeic') with check (bucket_id = 'toeic');
