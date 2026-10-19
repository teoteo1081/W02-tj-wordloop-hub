# PLAN_HANDOFF_GATE.md — kế hoạch: handoff máy đọc được + cổng kiểm tra xác định

> **Trạng thái: CHỈ LÀ KẾ HOẠCH, đã chỉnh sau audit `6aa52be`.** Chưa có code, chưa sửa `CLAUDE.md`, chưa có hook. Lần post-audit này chỉ sửa kế hoạch.
> Nhánh `handoff/gate`, tách từ `origin/main` `2e4e5d5`; lần fetch khi audit vẫn xác nhận mốc này. Commit trên nhánh theo yêu cầu TJ; không push, không merge.

## 1. Mục tiêu
Mọi phiên agent, trước khi sửa gì, chạy một đoạn mã **chỉ đọc** để biết phiên trước đã làm gì và repo đang ở trạng thái nào. Không dựa vào trí nhớ hay lời kể trong `HANDOFF.md`.

Cách hiểu "machine readonly": bản ghi handoff **máy đọc được (JSON)**, **ghi một lần rồi không sửa**, và **gate chỉ đọc**, không bao giờ sửa repo.

## 2. Hiện trạng (lúc lập kế hoạch)
- Merge dở ở worktree `_work/wt-merge-review-20261019`: nhánh `draft/wordloop-merge-review-20261019` đang merge `test/tich-hop-2` (MERGE_HEAD `153491e`), 4 file xung đột (`css/game.css`, `game-version.json`, `game.html`, `js/game.js`), 15 chỗ `<<<<<<<`; `CLAUDE.md`, `HANDOFF.md`, `README.md` cũng đang bị sửa ở đó. **Kế hoạch này không đụng vào worktree đó.**
- `main` local là bản cũ (`0bf8520`, tụt 137 commit). "Main hiện tại" = `origin/main`.
- `feat/sw-class` local (`2e4e5d5`, theo dõi `origin/main`) trùng tên với `origin/feat/sw-class` (`88046ec`), hai nhánh khác nhau.
- Đã có sẵn: `/start`, `/sync` (verify bằng lệnh thật; `/start` có fetch, `/sync` còn có pull nên không phải cổng chỉ đọc), luật verify trong `HANDOFF.md`, tracker trong `claude-setup`. Lỗ hổng: các luật này chỉ là chữ, agent có thể bỏ qua, và chưa có bản ghi handoff có lược đồ cho máy đọc.

## 3. Thiết kế

### 3.1 Handoff máy đọc được
- Nơi lưu: `<git-common-dir>/handoff/` (chung cho mọi worktree, không đi theo git, không gây xung đột).
- Mỗi checkpoint một file `<UTC>-<session-id>-<sequence>-<id>.json`, tạo bằng `O_EXCL`, đặt thuộc tính chỉ-đọc, không bao giờ sửa. Một phiên có nhiều checkpoint; bản mới nối với bản trước bằng `supersedes`. Thuộc tính chỉ-đọc tránh ghi đè vô ý, không phải cơ chế chống người có quyền sửa filesystem.
- Script tự lấy từ git (agent không tự khai): worktree, nhánh, base/head SHA, file dirty, thao tác dở (merge/rebase/cherry-pick), file unmerged, stash, commit của phiên, `state_hash`.
- Agent tự khai (ít, có cấu trúc): `task_id`, `task`, `status` (`done|partial|blocked|abandoned`), `next_steps`, `claims` (quy định tại 3.6). Script gắn `session_id`, định danh repo/worktree và số thứ tự checkpoint; không suy ra "phiên trước" bằng timestamp mới nhất toàn repo.
- Khi `SessionStart`, ghi checkpoint mở phiên với base/head lấy trực tiếp từ git. Sau mỗi thao tác có thể ghi, ghi checkpoint kết quả ngay cả khi thao tác lỗi; kết thúc bình thường ghi bản cuối. Thiếu bản cuối nghĩa là phiên chưa xác nhận kết thúc, không được suy thành `done`.
- Lược đồ: `tools/handoff/schema.json`, có `schema_version`.
- Chia sẻ giữa máy: `handoff.py export` chép snapshot ra `.handoff/latest.json`, chỉ khi được yêu cầu. `HANDOFF.md` giữ vai bản tóm tắt cho người.

### 3.2 Gate xác định — `tools/handoff/gate.py`
Python stdlib, chạy `py -I`, chỉ gọi git chỉ-đọc (`status --porcelain=v2 -z`, `worktree list --porcelain`, `for-each-ref`, `log`, đọc `MERGE_HEAD`…). Dùng `GIT_OPTIONAL_LOCKS=0`, không fetch, không refresh/ghi index, không chạy shell hay executable tuỳ ý từ claim. Cùng trạng thái và cùng đầu vào đánh giá → cùng kết quả (JSON sắp xếp khoá, không có giờ chạy trong kết luận). Nếu đánh giá tuổi `FETCH_HEAD`, nhận `--as-of <UTC>` rõ ràng; kiểm tra xác định phải dùng cùng giá trị này. Mã thoát CLI: 0 sạch, 10 cảnh báo, 20 chặn, 2 lỗi thu thập/đọc dữ liệu.

| Kiểm tra | Mức |
|---|---|
| Thao tác dở ở worktree này / worktree khác | chặn / cảnh báo |
| File định sửa (`--touch`) trùng file dirty/unmerged ở worktree khác | chặn |
| Bản ghi phiên trước nói `head_sha = X` nhưng thực tế khác (drift) | cảnh báo |
| Claim bắt buộc còn hiệu lực trong đúng task/worktree sai | chặn |
| Claim lịch sử, hết hiệu lực hoặc thuộc task/worktree khác | không replay để chặn; hiện bằng chứng/scope tương ứng |
| Phiên trước có checkpoint mở nhưng chưa có bản kết thúc | cảnh báo; thu thập trạng thái thật trước khi tiếp tục |
| Nhánh có commit/thay đổi chưa commit mà không có bản ghi | cảnh báo |
| `main` local cũ; tên nhánh trùng nhánh remote khác nội dung; `FETCH_HEAD` cũ | cảnh báo |
| Lệch `?v=` / `GAME_VER` / `game-version.json` / `starter*.json` (theo `sync.md`) | cảnh báo |

Gate in `GATE_TOKEN=<state_hash>`. Token là dấu nhận diện snapshot, không tự cấp quyền ghi. Gate không ghi checkpoint/ack; các tác vụ ghi metadata thuộc helper riêng.

#### Đầu vào `state_hash`
- Snapshot có phiên bản định dạng, định danh repo/worktree, HEAD/ref, toàn bộ index (path, stage, mode, object ID), thao tác git dở, refs/stash và trạng thái các worktree liên quan. Chuẩn hoá thứ tự và đường dẫn; xử lý tên file bằng đầu ra NUL, không tách theo dòng.
- Với mỗi worktree: hash SHA-256 byte nội dung mọi file tracked và untracked không bị ignore; ghi nhận file bị xoá, mode và đích symlink (không đi theo symlink ra ngoài). Git status chỉ là thông tin bổ sung, không thay thế hash nội dung. Không dùng mtime/kích thước làm bằng chứng nội dung không đổi.
- File ignored mặc định ngoài phạm vi. Nếu tác vụ định sửa chúng, phải khai báo đường dẫn vào scope để đưa vào snapshot; không được tuyên bố phát hiện thay đổi mọi file ngoài scope. Không xuất nội dung file vào JSON/log, chỉ lưu digest.
- Đưa vào digest cả scope `--touch`, phiên bản policy, các claim còn hiệu lực và mốc `--as-of` nếu có. Loại trừ checkpoint/ack/lock của chính cơ chế để tránh tự làm token lỗi thời. Snapshot không đọc đủ hoặc phát hiện dữ liệu đổi giữa lúc thu thập phải báo lỗi/retry hữu hạn, không phát token hợp lệ từ snapshot dở.

### 3.3 Ép bằng máy (hook trong `.claude/settings.json`)
CLAUDE.md chỉ là lời dặn. Khi triển khai phải kiểm lược đồ hook theo phiên bản Claude Code thực cài và thử trên Windows; không phụ thuộc skill `update-config` chưa xác nhận có sẵn.
- `SessionStart`: chạy gate, đưa kết quả vào ngữ cảnh; helper riêng ghi checkpoint mở phiên. Không tự ack cảnh báo thay agent.
- `PreToolUse`: áp dụng cho mọi tool có thể ghi (Edit, Write, NotebookEdit, Bash/PowerShell và tool MCP có quyền ghi nếu được bật). Không chỉ dò chuỗi `commit|merge|push|rebase`.
- Với shell: chỉ cho chạy trực tiếp tập lệnh đọc đã phân tích được bằng allowlist đối số; không coi tên executable là bằng chứng chỉ đọc. Redirection, pipeline/chuỗi lệnh chưa phân tích, `python`, `sed -i`, `tee`, script hay lệnh không rõ tác dụng phải bị chặn hoặc đi qua đường thao tác có kiểm soát với ack và scope tường minh. Chưa triển khai được kiểm soát thì chặn, không cho qua mặc định. Không chạy lệnh ghi trực tiếp trong nhánh allowlist đọc.
- Đường thao tác có kiểm soát chỉ nhận các operation/đối số đã có adapter kiểm phạm vi trước khi ghi, không nhận mã shell/Python tuỳ ý chỉ vì có ack. Hậu kiểm chỉ phát hiện sai phạm, không hoàn tác hay ngăn được lệnh đã ghi ngoài scope. Lệnh chưa chứng minh kiểm soát được phạm vi tiếp tục bị chặn.
- `PostToolUse` và `PostToolUseFailure`: hoàn tất giao thức tại 3.5, ghi checkpoint và tiêu thụ quyền của thao tác vừa chạy. Hook không chạy/timeout/lỗi phải làm quyền không dùng lại được.
- `Stop`: ghi checkpoint khi kết thúc lượt trả lời bình thường; không phải tín hiệu bảo đảm kết thúc phiên. `StopFailure`/`SessionEnd` bổ sung checkpoint khi runtime còn chạy được, không bảo đảm hoạt động khi process bị kill hoặc mất điện.
- Hook adapter phải chuyển mã CLI 20 và 2 thành quyết định từ chối của `PreToolUse` (JSON deny hoặc exit 2 theo lược đồ thực cài); không trả thẳng exit 20 rồi giả định tool bị chặn. Mã 10 yêu cầu ghi nhận cảnh báo theo 3.5. Lỗi adapter/thiếu Python/timeout cũng phải chặn thao tác ghi.

Hook chỉ có tác dụng với Claude Code; AI khác chỉ có phần chữ trong CLAUDE.md / `AGENTS.md`. Đây là cơ chế tránh sai sót trong luồng tool được quản lý, không phải sandbox chống agent cố ý vô hiệu hoá hook hay process ngoài luồng. Tool chưa có adapter ghi phải bị tắt/chặn trong chế độ gate bắt buộc.

### 3.4 Khối thêm vào CLAUDE.md (bản nháp, ~10 dòng, đặt ngay sau tiêu đề để ít xung đột với merge-review cũng sửa file này)
> ## Cổng kiểm tra đầu phiên (bắt buộc, máy chạy)
> Việc ĐẦU TIÊN mỗi phiên: `py -I tools/handoff/gate.py --touch <path> ...` (chỉ đọc). Mã 20 hoặc 2 = DỪNG thao tác ghi, báo TJ. Mã 10 = nêu và ghi nhận cảnh báo trước khi helper cấp ack theo 3.5; mã 0 vẫn cần ack. Token không tự cấp quyền. Không tin `HANDOFF.md` hơn kết quả gate. Cuối phiên: `py -I tools/handoff/handoff.py write --status <done|partial|blocked|abandoned> --next "..."`. Bản ghi trong `<git-common-dir>/handoff/` không bao giờ sửa; bản mới nối bằng `supersedes`.

### 3.5 Vòng đời ack và thao tác ghi
1. Gate lấy snapshot cùng scope định sửa. Helper `ack --token <hash> --task <id> --touch <path> ...` phải tự lấy lại snapshot, từ chối token cũ, mã 20/2 và scope khác. Với mã 10, lưu danh sách mã cảnh báo agent đã ghi nhận; không biến ack thành cách vượt điều kiện chặn. Đây là ghi nhận tiền kiểm, không thay thế quyền TJ cho push/merge hay hành động khác.
2. Ack nằm ngoài tracked files, dưới `<git-common-dir>/handoff-control/<session-id>/`; gắn repo, worktree chuẩn hoá, task, session, policy, scope và hash. Phiên/worktree/task khác không dùng lại được. Metadata điều khiển tách khỏi các checkpoint bất biến.
3. Trước mỗi thao tác ghi, adapter lấy khoá điều phối rồi kiểm lại ack và snapshot dưới khoá, tạo quyền dùng **một lần** gắn với tool call và phạm vi dự kiến. Ghi checkpoint trước thao tác và trạng thái pending/tiêu thụ quyền bền vững trước khi gọi tool; ghi/flush lỗi thì không chạy tool. Giữ khoá đến hết hậu kiểm; pending ngăn thao tác ghi kế tiếp nếu hậu kiểm không xảy ra. Các adapter hợp tác trong cùng repo phải dùng cùng khoá; không tuyên bố khoá này ngăn process ngoài hệ thống. Bản ghi checkpoint ghi dở phải được nhận diện là không hợp lệ, giữ để chẩn đoán và dùng bản hợp lệ trước đó, không tin JSON chưa hoàn tất.
4. Sau tool, dù thành công hay lỗi, thu snapshot mới và ghi checkpoint. Chỉ cấp ack kế tiếp tự động nếu không có điều kiện chặn, thay đổi nằm trong scope/loại thao tác được phép và các worktree/ref ngoài phạm vi không đổi. Với Edit/Write thông thường, HEAD/index/refs phải giữ nguyên. Với thao tác git, phải khai báo trước ref/index/HEAD nào có thể đổi. Thay đổi ngoài phạm vi hoặc cảnh báo mới yêu cầu chạy gate và ghi nhận lại; lỗi/thiếu hậu kiểm giữ trạng thái pending, không tái sử dụng ack cũ.
5. Lần Edit hợp lệ đầu tiên được phép đổi hash; ack mới gắn snapshot sau Edit nên lần Edit thứ hai không bị chặn chỉ vì thay đổi do chính thao tác trước tạo ra. Nếu file đổi thêm bởi bên ngoài giữa hai lần, tiền kiểm lần hai phải từ chối. Thêm đường dẫn vào scope cũng bắt buộc tiền kiểm lại.
6. Khi khởi động lại mà thấy pending/phiên chưa kết thúc, đọc checkpoint trước thao tác, kiểm trạng thái thật và báo chưa biết kết quả cuối; không tự gắn `done`. Nếu process chết trong tool, checkpoint trước thao tác vẫn tồn tại nhưng không hứa giữ được kết quả chưa kịp ghi sau tool.

### 3.6 Claim có phạm vi và thời hạn
- Mỗi claim có `claim_id`, `kind` (`historical_evidence|required_invariant`), repo/worktree, `task_id`, snapshot/commit gốc, phạm vi áp dụng và điều kiện hết hiệu lực; không chọn claim bằng file JSON mới nhất của toàn repo.
- `historical_evidence` giữ kết quả ở snapshot cũ, không replay trên HEAD mới để chặn. Ví dụ "HEAD là X" ở cuối phiên chỉ chứng minh phiên đó kết thúc tại X; HEAD đổi được xử lý bởi kiểm tra drift.
- Chỉ replay `required_invariant` đang có hiệu lực trong đúng task/worktree, ví dụ hai file version vẫn phải khớp. Invariant sai thì chặn. Claim hết hạn/khác task được hiển thị đúng scope, không chặn tác vụ mới. Tác vụ mới vẫn chịu các kiểm tra repo và policy chung, không dùng task ID mới để bỏ qua chúng.
- Claim bắt buộc không thể tự bị xoá/hạ mức bằng ack. Thay đổi policy hoặc bản đính chính phải có provenance và tiền kiểm lại; claim cũ vẫn giữ làm bằng chứng.
- Verifier dùng loại kiểm tra khai báo và tham số có lược đồ (ví dụ `head_equals`, `versions_equal`), ánh xạ tới hàm đọc trong code. Không lưu chuỗi shell rồi chạy lại; không cho đối số git gọi external diff/textconv, alias hay chương trình ngoài. Lưu kết quả mong đợi, kết quả thực và snapshot áp dụng.
- Nguồn kiểm chứng lifecycle/decision của hook: [Claude Code hooks reference](https://code.claude.com/docs/en/hooks#stop). Đây là căn cứ thiết kế; vẫn phải kiểm phiên bản thực cài khi triển khai.

## 4. Các bước thực hiện (sau khi TJ duyệt kế hoạch)
0. (Xong) Worktree tạm `_work/wt-handoff-gate`, nhánh `handoff/gate`, từ `origin/main`.
1. Viết `schema.json`, `handoff.py`, `gate.py` và adapter điều khiển (stdlib); tách gate chỉ đọc khỏi helper ghi checkpoint/ack.
2. Test trong repo thử ở thư mục tạm.
3. Thêm khối CLAUDE.md + hook.
4. Kiểm chứng (mục 5), phiên độc lập chấm.
5. Commit trên nhánh; **không push, không merge** theo chỉ dẫn TJ. Giữ worktree/nhánh để review; không tự xoá worktree đang dùng. Lần post-audit này chỉ cập nhật plan, không thực hiện các bước triển khai 1–4.

## 5. Tiêu chí đạt / không đạt
Các tiêu chí dưới đây dành cho **triển khai sau này**, chưa đạt chỉ nhờ sửa tài liệu:
- Repo thử: sạch → 0; dirty không có bản ghi → 10; merge dở tại worktree hiện tại → 20; merge dở ở worktree khác → 10, nhưng `--touch` trùng file dirty/unmerged ở đó → 20; drift HEAD → 10; invariant còn hiệu lực sai → 20; lỗi thu thập → 2. Mỗi fixture cô lập và kiểm cả reason code.
- Fixture mô phỏng merge-review và kiểm trên repo thật theo trạng thái lúc chạy; không bắt test phụ thuộc worktree thật phải mãi ở trạng thái merge dở.
- Hai lần chạy với cùng snapshot, policy, scope, claims và `--as-of` → JSON/stdout giống hệt theo byte. Thay mốc đánh giá thời gian là đổi đầu vào có chủ ý.
- So sánh digest nội dung/mode của file, HEAD, index, refs và metadata thao tác git ở mọi worktree trước/sau **gate** → không đổi. Chỉ so `git status` là chưa đủ. Helper ghi checkpoint/ack được kiểm riêng đúng đường dẫn cho phép.
- Khi chưa ack: Edit/Write/NotebookEdit, shell redirection, `python` ghi file, `sed -i`, `tee`, script và tool MCP ghi đều bị chặn. Lệnh đọc hợp lệ vẫn chạy được; lệnh ghép/không phân tích được không lọt allowlist đọc.
- Ack đúng cho phép hai Edit liên tiếp trong scope, tự chuyển hash sau mỗi thao tác; ack của phiên/worktree khác, token cũ, replay quyền một lần, scope mới, thay đổi ngoài luồng hoặc thiếu hậu kiểm đều bị chặn. Tool lỗi có ghi một phần cũng không được giữ ack cũ.
- File đã dirty đổi nội dung lần hai với cùng độ dài (và phục hồi mtime cũ) → hash đổi dù porcelain giống nhau. Kiểm riêng untracked, staged/unstaged, xoá file, tên có dấu/xuống dòng và symlink; ignored ngoài scope được báo rõ giới hạn, ignored trong scope phải được hash.
- Claim lịch sử "HEAD=X" không chặn commit mới hợp lệ; invariant sai trong đúng task vẫn chặn; claim thuộc task/worktree khác không chặn nhầm; task ID mới không vô hiệu policy repo. Chuỗi shell/loại verifier không hợp lệ bị từ chối, không thực thi.
- Ngắt phiên trước tool, sau tool và kill giữa tool: checkpoint trước thao tác còn đọc được; phiên sau phát hiện chưa kết thúc/pending, kiểm trạng thái thật và không suy ra `done`. Không dùng việc `Stop` từng chạy làm bằng chứng chịu được crash.
- Thử adapter thật trên Claude Code/Windows: CLI 20, CLI 2, exception/timeout/thiếu Python đều chặn tool ghi; CLI 10 không cấp ack trước khi ghi nhận cảnh báo. Ghi phiên bản runtime và bằng chứng tool thực sự không chạy.
- Phiên QA độc lập (không phải người viết triển khai) chấm từng tiêu chí và đính kèm lệnh, fixture, kết quả thực, giới hạn chưa chứng minh. Chưa có bằng chứng runtime thì chưa công bố gate hoạt động.

## 6. Việc cần TJ chốt
1. Trước triển khai, kiểm lại remote bằng fetch như bước riêng có ghi rõ tác dụng; gate tự nó không fetch. Audit đã fetch và vẫn thấy `origin/main = 2e4e5d5`.
2. Lưu bản ghi trong `<git-common-dir>/handoff/` (chung worktree, không đi theo git) hay trong repo? Không dùng `.git/handoff/` theo thư mục hiện tại vì `.git` của linked worktree là file.
3. Làm cả hook cứng lẫn CLAUDE.md, hay chỉ CLAUDE.md? (Khuyến nghị cả hai.)
4. Làm song song với merge-review (chỉ thêm file mới, rủi ro thấp) hay đợi merge đó xong?

## 7. Đối chiếu post-audit `6aa52be`
| Phát hiện | Điều chỉnh thiết kế | Bằng chứng phải có khi triển khai |
|---|---|---|
| P1: sửa qua shell lọt hook | 3.3: kiểm mọi tool ghi, allowlist đọc nghiêm ngặt, từ chối đường chưa hỗ trợ | Test shell/script/MCP khi chưa ack |
| P1: ack hết hiệu lực sau Edit đầu | 3.5: quyền một lần, pending, hậu kiểm và cấp ack kế tiếp | Hai Edit hợp lệ; đổi ngoài luồng bị chặn |
| P2: hash thiếu nội dung | 3.2: hash byte nội dung/index/scope, giới hạn ignored rõ ràng | Dirty cùng porcelain nhưng hash khác |
| P2: Stop không bảo đảm checkpoint khi chết | 3.1, 3.3, 3.5: checkpoint trước/sau thao tác, phát hiện pending | Test interrupt/kill và phục hồi phiên |
| P2: claim cũ chặn nhầm | 3.6: lịch sử khác invariant, scope/task/thời hạn/verifier khai báo | Claim HEAD cũ không chặn; invariant sai vẫn chặn |

Post-audit hoàn tất ở mức tài liệu không đồng nghĩa đã kiểm chứng triển khai. Các câu hỏi lựa chọn sản phẩm tại mục 6 vẫn dành cho giai đoạn triển khai; lần này TJ chỉ yêu cầu xử lý plan và commit trên nhánh, không merge.
