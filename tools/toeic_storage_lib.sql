-- 📁 Thư viện tài liệu trên BẢNG của phòng game (TJ 2026-10-04): bucket "toeic", thư mục lib/<môn>/…
-- Chạy 1 lần trong Supabase Dashboard › SQL Editor. Cả 2 phần đều TUỲ CHỌN.

-- (1) Cho tải lên Word / Excel / PowerPoint / văn bản (hiện chỉ nhận PDF, ảnh, âm thanh).
update storage.buckets
set allowed_mime_types = array[
  'application/pdf','audio/mpeg','audio/mp4','audio/x-m4a','image/jpeg','image/png','image/webp',
  'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain','text/csv','application/zip','application/json'
] where id = 'toeic';

-- (2) Cho nút 🗑 XOÁ THẬT file trong lib/ (không có thì 🗑 chuyển file vào thư mục lib/_Trash — vẫn khôi phục được).
-- Lưu ý: anon key nằm công khai trong web, nên ai biết cũng xoá được file trong lib/ (KHÔNG đụng reading/, listening/).
create policy "toeic_lib_delete" on storage.objects for delete to anon, authenticated
  using (bucket_id = 'toeic' and name like 'lib/%');
