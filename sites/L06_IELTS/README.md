# L06 IELTS Academic Master Site (2026)

Trang showcase độc lập cho khoá học **IELTS Academic 4 Kỹ Năng 2026** thuộc hệ thống TJ WordLoop.

## 1. Cấu Trúc Thư Mục
```
sites/L06_IELTS/
├── index.html          # Trang giới thiệu khoá học, 1-tap test entry & bộ ước tính điểm Band
├── course.html         # Redirect an toàn về index.html
├── ielts-app.js        # Controller điều khiển thi thử L/R, Speech Synthesis & tính điểm Band
├── tools/
│   └── build_site.js   # Script build và sync dữ liệu từ learn/ielts/data
└── data/
    ├── listening.js    # 2 đề thi Listening hoàn chỉnh (80 câu hỏi)
    ├── reading.js      # 2 đề thi Reading hoàn chỉnh (80 câu hỏi)
    └── ielts-lr.json   # Dữ liệu gốc kèm bảng quy đổi official anchors
```

## 2. Điểm Nhấn Kiến Trúc
- **Màu sắc thương hiệu**: Đỏ Đô Học Thuật (`#9f1239`) & Chàm Hoàng Gia Anh (`#3730a3`).
- **Google Analytics 4**: Đo lường độc lập với thẻ `{site: 'ielts'}`.
- **Tiêu chuẩn thiết kế**:
  - Tối ưu màn hình mobile 390px (chuyển tab thông minh).
  - Split-pane layout cho màn hình máy tính (`≥1024px`).
  - Web Speech API hỗ trợ đa giọng điệu (Anh, Úc, Mỹ) và chỉnh tốc độ (0.85x - 1.15x).
  - Bộ tính điểm Band Score tức thì từ 0 đến 40 câu theo chuẩn `ielts.org`.
  - Contrast màu tuân thủ WCAG AA (`≥ 4.5:1`), touch target `≥ 44×44px`.

## 3. Đồng Bộ Dữ Liệu
Khi cập nhật đề thi trong `learn/ielts/data/`, chạy:
```bash
node sites/L06_IELTS/tools/build_site.js
```
để tự động đồng bộ sang thư mục `sites/L06_IELTS/data/`.
