# L04_EA — Khoá IRS Enrolled Agent (SEE) 2026

- **Mục tiêu**: Khoá học độc lập chuẩn hoá theo mẫu `L00_ES-CN` và quyết định D1-D5 của Thảo: ôn thi chứng chỉ SEE và hành nghề đại diện thuế Mỹ.
- **Mã GA4**: `G-6X5S109XKM` với `{site: 'ea'}`.
- **Nội dung**: 24 bài học HTML (Part I: Cá nhân, Part II: Doanh nghiệp, Part III: Đại diện, Part IV: Kiếm tiền & Mở văn phòng hành nghề), 760+ thuật ngữ song ngữ, 660+ câu trắc nghiệm, 15 tình huống khách hàng thực tế.
- **Engine 1 chạm**: `quest-mini.js` tự chạy không phụ thuộc thư mục gốc, vào thẳng bài tập qua hash `#play=vocab|quiz|sprint|case|mock|wrong`.
- **Dữ liệu**: Bộ nạp D5 Local-First khi chạy kiểm thử (đọc `data/`), Cloud-First khi xuất bản (đọc bucket Supabase Storage `ea`).
- **Tự động hoá**: Script `tools/build_site.js` đồng bộ 1 chiều từ `learn/ea/`.
