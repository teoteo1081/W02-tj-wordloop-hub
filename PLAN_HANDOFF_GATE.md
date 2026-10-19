# PLAN_HANDOFF_GATE.md — kế hoạch: handoff máy đọc được + cổng kiểm tra xác định

> **Trạng thái: CHỈ LÀ KẾ HOẠCH.** Chưa có code, chưa sửa `CLAUDE.md`, chưa có hook. Commit này chỉ thêm file kế hoạch này.
> Nhánh `handoff/gate`, tách từ `origin/main` `2e4e5d5` (theo lần fetch cuối, chưa fetch lại). Chưa push, chưa vào `main`.

## 1. Mục tiêu
Mọi phiên agent, trước khi sửa gì, chạy một đoạn mã **chỉ đọc** để biết phiên trước đã làm gì và repo đang ở trạng thái nào. Không dựa vào trí nhớ hay lời kể trong `HANDOFF.md`.

Cách hiểu "machine readonly": bản ghi handoff **máy đọc được (JSON)**, **ghi một lần rồi không sửa**, và **gate chỉ đọc**, không bao giờ sửa repo.

## 2. Hiện trạng (lúc lập kế hoạch)
- Merge dở ở worktree `_work/wt-merge-review-20261019`: nhánh `draft/wordloop-merge-review-20261019` đang merge `test/tich-hop-2` (MERGE_HEAD `153491e`), 4 file xung đột (`css/game.css`, `game-version.json`, `game.html`, `js/game.js`), 15 chỗ `<<<<<<<`; `CLAUDE.md`, `HANDOFF.md`, `README.md` cũng đang bị sửa ở đó. **Kế hoạch này không đụng vào worktree đó.**
- `main` local là bản cũ (`0bf8520`, tụt 137 commit). "Main hiện tại" = `origin/main`.
- `feat/sw-class` local (`2e4e5d5`, theo dõi `origin/main`) trùng tên với `origin/feat/sw-class` (`88046ec`), hai nhánh khác nhau.
- Đã có sẵn: `/start`, `/sync` (chỉ đọc, verify bằng lệnh thật), luật verify trong `HANDOFF.md`, tracker trong `claude-setup`. Lỗ hổng: các luật này chỉ là chữ, agent có thể bỏ qua, và không có thứ gì máy đọc được.

## 3. Thiết kế

### 3.1 Handoff máy đọc được
- Nơi lưu: `<git-common-dir>/handoff/` (chung cho mọi worktree, không đi theo git, không gây xung đột).
- Mỗi phiên một file `<UTC>-<id>.json`, tạo bằng `O_EXCL`, đặt thuộc tính chỉ-đọc, không bao giờ sửa. Đính chính = bản mới có `supersedes`.
- Script tự lấy từ git (agent không tự khai): worktree, nhánh, base/head SHA, file dirty, thao tác dở (merge/rebase/cherry-pick), file unmerged, stash, commit của phiên, `state_hash`.
- Agent tự khai (ít, có cấu trúc): `task`, `status` (`done|partial|blocked|abandoned`), `next_steps`, `claims` (mỗi claim kèm lệnh kiểm chỉ-đọc + kết quả mong đợi).
- Lược đồ: `tools/handoff/schema.json`, có `schema_version`.
- Chia sẻ giữa máy: `handoff.py export` chép snapshot ra `.handoff/latest.json`, chỉ khi được yêu cầu. `HANDOFF.md` giữ vai bản tóm tắt cho người.

### 3.2 Gate xác định — `tools/handoff/gate.py`
Python stdlib, chạy `py -I`, chỉ gọi git chỉ-đọc (`status --porcelain=v2`, `worktree list --porcelain`, `for-each-ref`, `log`, đọc `MERGE_HEAD`…). Cùng trạng thái → cùng kết quả (JSON sắp xếp khoá, không có giờ trong phần kết luận). Mã thoát: 0 sạch, 10 cảnh báo, 20 chặn, 2 lỗi.

| Kiểm tra | Mức |
|---|---|
| Thao tác dở ở worktree này / worktree khác | chặn / cảnh báo |
| File định sửa (`--touch`) trùng file dirty/unmerged ở worktree khác | chặn |
| Bản ghi phiên trước nói `head_sha = X` nhưng thực tế khác (drift) | cảnh báo |
| Chạy lại `claims` phiên trước (lệnh nằm trong danh sách cho phép, chỉ đọc), có claim sai | chặn |
| Nhánh có commit/thay đổi chưa commit mà không có bản ghi | cảnh báo |
| `main` local cũ; tên nhánh trùng nhánh remote khác nội dung; `FETCH_HEAD` cũ | cảnh báo |
| Lệch `?v=` / `GAME_VER` / `game-version.json` / `starter*.json` (theo `sync.md`) | cảnh báo |

Gate in `GATE_TOKEN=<hash trạng thái>`.

### 3.3 Ép bằng máy (hook trong `.claude/settings.json`)
CLAUDE.md chỉ là lời dặn. Thêm hook (làm bằng skill `update-config`, **kiểm lược đồ hook khi làm — chưa kiểm**):
- `SessionStart`: chạy gate, đưa kết quả vào ngữ cảnh.
- `PreToolUse` (Edit, Write, Bash có `commit|merge|push|rebase`): chặn nếu chưa có ack hợp lệ hoặc `state_hash` đã đổi.
- `Stop`: tự ghi bản ghi tối thiểu từ git, để phiên chết đột ngột vẫn để lại dấu vết.

Hook chỉ có tác dụng với Claude Code; AI khác chỉ có phần chữ trong CLAUDE.md / `AGENTS.md`.

### 3.4 Khối thêm vào CLAUDE.md (bản nháp, ~10 dòng, đặt ngay sau tiêu đề để ít xung đột với merge-review cũng sửa file này)
> ## Cổng kiểm tra đầu phiên (bắt buộc, máy chạy)
> Việc ĐẦU TIÊN mỗi phiên: `py -I tools/handoff/gate.py` (chỉ đọc). Mã thoát 20 = DỪNG, báo TJ, không sửa gì. Mã 10 = nêu cảnh báo trong tin đầu rồi mới làm. Dán `GATE_TOKEN` vào bản ghi phiên. Không tin `HANDOFF.md` hơn kết quả gate. Cuối phiên: `py -I tools/handoff/handoff.py write --status <done|partial|blocked|abandoned> --next "..."`. Bản ghi trong `.git/handoff/` không bao giờ sửa, chỉ ghi bản mới có `supersedes`.

## 4. Các bước thực hiện (sau khi TJ duyệt kế hoạch)
0. (Xong) Worktree tạm `_work/wt-handoff-gate`, nhánh `handoff/gate`, từ `origin/main`.
1. Viết `schema.json`, `handoff.py`, `gate.py` (stdlib).
2. Test trong repo thử ở thư mục tạm.
3. Thêm khối CLAUDE.md + hook.
4. Kiểm chứng (mục 5), phiên độc lập chấm.
5. Commit trên nhánh; **không push, không vào `main`** khi chưa có phép của TJ (luật `AGENTS.md`). Xong việc thì `git worktree remove`.

## 5. Tiêu chí đạt / không đạt
- Repo thử có 5 kịch bản (sạch, dirty, đang merge dở, drift, claim sai) → gate cho đúng mã thoát và đúng lý do.
- Chạy gate trên repo thật báo đúng `wt-merge-review-20261019` đang có thao tác dở.
- Chạy 2 lần liên tiếp → kết quả giống hệt nhau (so byte).
- Băm `git status` của mọi worktree trước/sau khi chạy gate → không đổi.
- `PreToolUse` chặn được Edit khi chưa có ack (thử thật).
- Phiên độc lập (không phải người viết) chấm từng dòng và đính kèm bằng chứng.

## 6. Việc cần TJ chốt
1. Có cho `git fetch origin` trước khi làm không? (Hiện nhánh dựa trên bản fetch cuối `2e4e5d5`.)
2. Lưu bản ghi trong `.git/handoff/` (chung worktree, không đi theo git) hay trong repo?
3. Làm cả hook cứng lẫn CLAUDE.md, hay chỉ CLAUDE.md? (Khuyến nghị cả hai.)
4. Làm song song với merge-review (chỉ thêm file mới, rủi ro thấp) hay đợi merge đó xong?
