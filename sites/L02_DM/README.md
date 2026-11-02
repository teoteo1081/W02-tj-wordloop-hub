# L02_DM — Khoá Digital Marketing Thực Chiến 2026

- **Mục tiêu**: Khoá học độc lập chuẩn hoá theo mẫu `L00_ES-CN` và quyết định D1-D5 của Thảo: Digital Marketing đa kênh, AI và kiếm tiền mở Agency.
- **Mã GA4**: `G-6X5S109XKM` với `{site: 'dm'}`.
- **Nội dung**: 16 bài học HTML tự đủ (Part I: Nền tảng m01–m04, Part II: Quảng cáo m05–m07, Part III: Organic m08–m10, Part IV: Kiếm tiền m11–m16), 245 thuật ngữ, 148 câu trắc nghiệm, 12 tình huống tư vấn chủ shop, 56 câu hỏi tra cứu phản xạ nhanh.
- **Engine 1 chạm**: `quest-mini.js` tự chạy không phụ thuộc thư mục gốc, vào thẳng bài tập qua hash `#play=vocab|quiz|sprint|case|mock|wrong`.
- **Dữ liệu**: Bộ nạp D5 Local-First khi chạy kiểm thử (đọc `data/`), Cloud-First khi xuất bản (đọc bucket Supabase Storage `dm`).
- **Tự động hoá**: Script `tools/build_site.js` đồng bộ 1 chiều từ `learn/dm/`.
