-- Kho file PDF bài học EA 2025 (TJ 2026-10-04): bucket "ea" trên Supabase Storage.
-- Giữ nguyên cấu trúc thư mục của repo L04-ea-2025: ea/Part I/..., ea/Part II/..., ea/Part III/...
-- Tài liệu tóm tắt từ sách Gleim (có bản quyền) -> để ở bucket này, KHÔNG đưa vào repo WordLoop (public).
-- Chạy 1 lần trong Supabase Dashboard › SQL Editor (hoặc Management API khi có PAT).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ea', 'ea', true, 52428800, array['application/pdf', 'text/html', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

-- đọc + liệt kê file, tải lên + ghi đè (Claude/TJ nạp bài). KHÔNG mở quyền xoá cho anon.
create policy "ea_read"   on storage.objects for select to anon, authenticated using (bucket_id = 'ea');
create policy "ea_upload" on storage.objects for insert to anon, authenticated with check (bucket_id = 'ea');
create policy "ea_update" on storage.objects for update to anon, authenticated using (bucket_id = 'ea') with check (bucket_id = 'ea');
