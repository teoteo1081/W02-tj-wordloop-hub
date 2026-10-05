# Bản NHÁP — chưa kiểm toán, chưa nạp vào Supabase

Do nhân viên Biên soạn của đội AI viết ngày 2026-10-04, dừng giữa chừng vì hết hạn mức phiên. **Chưa qua** Kiểm toán độc lập / Tuân thủ (xem `docs/TEAM.md`). Không có trong `data/exams/*.json` nên cổng `gate_items.py` không quét.

| File | Tình trạng |
|---|---|
| `ielts_ws_bank.draft.json` | IELTS Writing + Speaking: 42 đề Writing (12 Task 1 Academic, 6 thư Task 1 General, 24 Task 2), 36 bộ Speaking (12 + 12 + 12), 2 prompt chấm bằng OpenAI, bảng quy đổi band. Kiểm máy móc OK (id không trùng, pie = 100). Chưa kiểm nội dung |
| `dm/` | Digital Marketing "Thám tử Marketing": **102 câu** (P1 36 · P2 36 · P3 12 · P4 8 · P5 10) — `dm_items.json` là kết quả, `build_dm.py` + `p*.py` là nguồn để dựng lại. Qua `gate_items.py`. **Chưa qua kiểm toán/tuân thủ.** Biết trước: 27 đoạn tình huống ngắn hơn 60 từ (mục tiêu 80–160) |

Việc tiếp theo: xem `docs/EXAMS_PLAN.md` mục 0 và 5.
