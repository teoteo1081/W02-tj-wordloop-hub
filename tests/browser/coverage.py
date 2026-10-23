"""Phạm vi ID TEST mà cycle trình duyệt này CAM KẾT (PLAN §0.2 / SPEC §1.2), kèm lý do nếu chưa chạy.

Runner so danh sách này với ID của kịch bản PASS; ID chưa có kịch bản đạt vào `coverageGaps` và làm trạng thái
là PARTIAL. KHÔNG xóa ID khỏi đây để 'xanh': chỉ bỏ khi đã có kịch bản đạt, hoặc chuyển sang `DECLARED_OUT`
kèm lý do công khai (thiếu phụ thuộc/quyền). Nhóm theo chặng của PLAN §0.2.
"""
IN_SCOPE = {
    # ── Luồng học chính (Local mode, mã app thật) ──
    "NET-01": "cách ly mạng",
    "FLW-01": "chuyển tab", "FLW-02": "Hiểu rồi → Nghĩa", "FLW-03": "tự chấm / nút Nộp", "FLW-04": "ba thẻ đẩy SRS",
    "FLW-05": "học sớm + nới 1 giờ", "FLW-06": "Dictation thuần túy", "FLW-08": "không UI độ khó",
    "FLW-09": "thành phần đã bỏ không quay lại", "FLW-15": "⭐/❌ nhảy ngay + phạm vi",
    "DB-05": "bookmark qua UI", "DB-06": "markResults qua UI", "DB-07": "Fix lỗi sai dựng lại đúng câu",
    "LS-01": "nhật ký khóa localStorage trong trình duyệt", "SRS-01": "chu kỳ qua UI với đồng hồ giả",
    # ── M0.5 nhật ký backend/storage (Cloud mode, Supabase giả ở ranh giới thư viện) ──
    "CALL-W01": "chưa chạy: cần Cloud mode + supabase giả",
    "CALL-W02": "chưa chạy: cần Cloud mode + supabase giả",
    "CALL-W03": "chưa chạy: cần Cloud mode + supabase giả",
    "CALL-W04": "chưa chạy: cần Cloud mode + supabase giả",
    "FLW-07": "chưa chạy: bộ chọn nguồn bài chỉ hiện cho admin/người có quyền sửa bài → cần Cloud mode",
    # ── M0.7 hai client ──
    "MP-15": "chưa chạy: bảo vệ phòng thật TJ",
    "MP-01": "chưa chạy: tạo/vào phòng ZZ_",
    "MP-02": "chưa chạy: ván điền từ hai client",
    "MP-03": "chưa chạy: host tải lại giữa ván",
    "MP-04": "chưa chạy: người chơi tải lại giữa ván",
    "CALL-G01": "chưa chạy: host tạo phòng → ván → kết thúc",
    "CALL-G02": "chưa chạy: người chơi vào phòng, trả lời",
    # ── M0.6 ảnh chuẩn desktop 1280×800 + mobile 390×844 (hai lượt chạy giống hệt) ──
    "VIS-W02": "chưa chạy", "VIS-W03": "chưa chạy", "VIS-W06": "chưa chạy",
    "VIS-G01": "chưa chạy", "VIS-G02": "chưa chạy",
    "SHOT-STABLE": "chưa chạy: hai lượt độc lập phải cho ảnh giống hệt sau mask có lý do",
}

# Chưa làm và KHÔNG nằm trong cycle này (PLAN §0.2 'Phạm vi'): ghi để báo cáo nói thẳng, không tính vào PARTIAL.
DECLARED_OUT = {
    "M0.8/CI": "phụ thuộc G2 handoff/gate; PLAN §0.2 loại khỏi cycle",
    "BCK-*": "cần backend đã đổi (luồng B); chưa có",
    "MP-18": "hỗn hợp phiên bản baseline+nhánh: chỉ có ý nghĩa khi mã nhánh khác baseline",
    "supabase-js thật": "không có bản supabase-js cục bộ và plan cấm tải gói mới; Cloud mode dùng bản giả ở ranh giới thư viện",
}

# ID đã có kịch bản đạt nhưng CHỈ phủ MỘT PHẦN yêu cầu của TEST_REGRESSION_RESTRUCTURE.md (QA độc lập 2026-10-22 chỉ ra matrix
# trước đó ghi 'đã phủ' quá tay). Phần chưa phủ được nêu rõ để không suy ra nhiều hơn bằng chứng.
PARTIAL = {
    "DB-05": "CHỈ: bấm ⭐ → bookmarked=true (Local + Cloud upsert). CHƯA: null=chưa bấm, mặc định ⭐ của batch '⭐ Từ đã lưu' (cần có dòng word_progress của chính user), bỏ ⭐ ghi false, người khác không thấy ⭐",
    "DB-06": "CHỈ: sai→wrong_open, câu bỏ trống không sai. CHƯA: thiếu cột → rơi về lưu tạm mà điểm vẫn lưu (UI)",
    "DB-07": "CHỈ: dựng lại đúng câu + 4 đáp án; đúng ở loại KHÁC (điền từ) không gỡ; đúng trong màn Fix thì gỡ. CHƯA: nghĩa↔nghĩa khác ngôn ngữ",
    "FLW-15": "CHỈ: ⭐/❌ nhảy ngay (<1 giây). CHƯA: phạm vi Block/Batch/Page/Section/Notebook/Hub, thoát giữa bài không mất (instantFix)",
    "SRS-01": "CHỈ: bước 1→2, học sớm, nới 1 giờ, review_history, last_reviewed_at. CHƯA: demote (lùi bậc), trạng thái 💎 dài hạn, bước 3–6",
    "LS-01": "CHỈ: tập khóa GHI khi học (tjwl_db_v1, tjwl_daily_log_v1) và các khóa đọc đã biết trong luồng Nghĩa/⭐. CHƯA: 16 file dùng localStorage, khóa game/voice/CC/chat",
    "CALL-G01": "CHỈ: bắt đầu → trả lời → kết thúc → ghi game_matches/game_results/game_answers. CHƯA: host TẠO phòng, chọn chủ đề trong UI (phòng ZZ được seed sẵn), ván đề thi, kệ sách, chia sẻ tệp",
    "CALL-G02": "CHỈ: người chơi vào, trả lời, tải lại. CHƯA: rời phòng (untrack/removeChannel khi pagehide)",
    "MP-01": "CHỈ: presence + hello→state trong phòng seed sẵn. CHƯA: tạo phòng bằng UI",
    "MP-04": "CHỈ: nối lại đúng ván, điểm trước khi tải lại không mất (>= đã trả lời - 1). Chưa phủ: host mất mạng (MP-05) và relay",
    "FLW-07": "CHỈ: nhóm tab theo nguồn, xem trước + chi phí, Dùng bài này lưu. CHƯA: Tạo lại bằng AI, Xoá bài này, không giới hạn số bài, bài mới nối cuối",
}

# Lỗi do QA độc lập cài vào bản chép mà bộ kiểm HIỆN VẪN KHÔNG bắt (còn sống sót) — nói thẳng, không che.
SURVIVING_MUTATIONS = {
    "Q2 js/db.js bmState": "mặc định ⭐ bỏ điều kiện 'user có dòng tiến trình' (liên quan DB-05 chưa phủ)",
    "Q5 js/wordset.js skipFix=false": "quy tắc của màn Fix (gỡ khỏi Fix) ở tầng WordSet chưa được kiểm riêng",
    "Q7 js/game.js host bỏ qua hello": "MP-04 vẫn xanh; CHƯA điều tra nguyên nhân (giả thuyết chưa kiểm: người chơi nhận lại state qua nhịp push của host chứ không qua phản hồi hello)",
    "Q8 js/game.js bỏ khử trùng id câu trả lời": "chưa có ca gửi câu trả lời trùng id",
}
