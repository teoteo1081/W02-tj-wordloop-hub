# Báo cáo Kiểm thử và Chuẩn bị Nạp Word Family vào WordLoop

> **Trạng thái thực thi:** `DRY_RUN_VERIFIED`  
> **Kết luận Thẩm định (Audit Verdict):** `AUDIT_PASS`  
> **Mục tiêu nạp:** Notebook `a Kim Quất_Word Family` (`a2571e0c-d952-41ad-98ca-b12fa173e98a`) › Section `Word Family` (`0f1fd8e3-bce9-4edf-8677-13493e553479`)  
> **Quy tắc an toàn:** Lượt này CHỈ thực hiện GET kiểm tra Supabase, KHÔNG ghi bất kỳ dữ liệu nào. Dữ liệu đã được chuẩn hoá khoá và kiểm tra toàn vẹn 100%.

---

## 1. Thống kê Đối chiếu Nguồn PDF & Cấu trúc

| Chỉ số kiểm tra | Yêu cầu nguồn | Kết quả thực tế | Trạng thái | Ghi chú |
|---|---|---|---|---|
| **Tổng số họ từ (ROOT)** | 811 họ | **811 họ** | `MATCH (100%)` | 610 họ có thanh ROOT teal bar + 201 từ lẻ standalone root |
| **Tổng số dòng từ vựng** | 2082 từ | **2082 từ** | `MATCH (100%)` | Trích xuất đầy đủ qua pdfplumber & PyMuPDF |
| **Đối chiếu mục từ Index** | 886 mục từ | **886 / 886** | `MATCH (100%)` | Mọi từ trong bảng tra Index đều có mặt trong dữ liệu |
| **Ô tiếng Việt rỗng/mất dấu** | 0 lỗi | **0 lỗi** | `PASS` | Không có ô meaning_vi hay quiz_vi nào rỗng; giữ nguyên dấu |
| **Số lượng Page** | Cỡ 150–300 từ/Page | **10 Pages** | `OPTIMAL` | Dao động từ 146 đến 241 từ/Page, cân đối theo bảng chữ cái |
| **Số lượng Batch** | ~50 từ/Batch | **44 Batches** | `OPTIMAL` | Đặt tên theo khoảng root: vd `able – argue` |
| **Số lượng Block** | ~10 từ/Block | **198 Blocks** | `OPTIMAL` | Trung bình 10.5 từ/Block |
| **Nguyên tắc không tách họ** | 0 họ bị chia | **0 họ bị chia** | `PASS` | Họ dài ≥10 từ đứng riêng 1 Block; không họ nào bị xé đôi |
| **Tính liên tục global_index** | 1 .. N liên tục | **1 .. 198** | `PASS` | Không trùng lặp, liên tục trong toàn bộ Notebook |
| **Tổng số Bẫy (word_traps)** | 2–4 bẫy/từ | **4669 bẫy** | `PASS` | Phủ kín 100% từ vựng; trung bình 2.60 bẫy/từ (min=2, max=4) |
| **Trùng nghĩa bẫy (Collision)** | 0 lỗi | **0 lỗi** | `PASS` | quiz_form(trap_vi) khác quiz_form(word_vi) 100% |
| **Lộ đáp án trong bẫy (Leak)** | 0 lỗi | **0 lỗi** | `PASS` | Không chứa ngoặc giải thích hay chữ '(sai)' |
| **Chuẩn hoá khoá PostgREST** | 100% khớp | **Khớp tuyệt đối** | `PASS` | Đầy đủ key chuẩn hoá cho cả 5 bảng khi bulk insert |

---

## 2. Chi tiết Phân bố 10 Pages theo Chữ cái

| STT | Tên Page | Dải chữ cái | Số lượng từ | Số Batch | Số Block | Phạm vi root mở đầu – kết thúc |
|---|---|---|---|---|---|---|
| 1 | `A–B` | ['A', 'B'] | 231 | 5 | 22 | able … alone |
| 2 | `C` | ['C'] | 201 | 4 | 19 | cabin … current |
| 3 | `D–E` | ['D', 'E'] | 203 | 4 | 19 | dad … eyes |
| 4 | `F–G` | ['F', 'G'] | 193 | 4 | 18 | face … guest |
| 5 | `H–I` | ['H', 'I'] | 146 | 3 | 14 | hair … itself |
| 6 | `J–M` | ['J', 'K', 'L', 'M'] | 222 | 5 | 22 | jacket … mystery |
| 7 | `N–P` | ['N', 'O', 'P'] | 241 | 5 | 22 | nature … + phrasal: split into, split up |
| 8 | `Q–R` | ['Q', 'R'] | 168 | 4 | 16 | quarter … run |
| 9 | `S` | ['S'] | 238 | 5 | 23 | sad … suspect |
| 10 | `T–Z` | ['T', 'U', 'V', 'W', 'Y', 'Z'] | 239 | 5 | 23 | take … zero |

---

## 3. Mẫu 3 Block Hoàn chỉnh (Trình TJ Duyệt Trước)

### 📦 Block Mẫu 1: `Block 1` (global_index: `1`)
- **Vị trí cây:** Hub `hub_toeic_hub` › Notebook `a Kim Quất_Word Family` › Section `Word Family` › Page `A–B` › Batch `able – against`
- **ID Block:** `blk_wf_0001`
- **Số lượng từ:** 12 từ

#### Danh sách từ vựng & Bẫy trắc nghiệm trong Block:

**1. able** (`Adjective`)
- *Định nghĩa EN:* having the power or skill to do something
- *Nghĩa tiếng Việt:* có thể, có khả năng (quiz_vi: `có thể`)
- *Đáp án bẫy trắc nghiệm (2 bẫy):*
  - 🪤 `[family]` **ability**: *khả năng, năng lực* — 💡 *Lý do:* Cùng họ từ (able), nhưng ability là noun (khả năng), khác với able là adjective (có thể).
  - 🪤 `[family]` **unable**: *không thể, không có khả năng* — 💡 *Lý do:* Cùng họ từ (able), nhưng unable mang nghĩa 'không thể', khác với able ('có thể').

**2. ability** (`Noun`)
- *Định nghĩa EN:* the power or skill to do something
- *Nghĩa tiếng Việt:* khả năng, năng lực (quiz_vi: `khả năng`)
- *Đáp án bẫy trắc nghiệm (4 bẫy):*
  - 🪤 `[family]` **able**: *có thể, có khả năng* — 💡 *Lý do:* Cùng họ từ (able), nhưng able là adjective (có thể), khác với ability là noun (khả năng).
  - 🪤 `[family]` **unable**: *không thể, không có khả năng* — 💡 *Lý do:* Cùng họ từ (able), nhưng unable là adjective (không thể), khác với ability là noun (khả năng).
  - 🪤 `[look]` **liability**: *trách nhiệm pháp lý* — 💡 *Lý do:* 'Ability' và 'liability' gần âm, nhưng 'liability' không liên quan đến khả năng.
  - 🪤 `[syn]` **skill**: *kỹ năng* — 💡 *Lý do:* 'Skill' không bao hàm khả năng tự nhiên như 'ability'.

**3. unable** (`Adjective`)
- *Định nghĩa EN:* not able to do something
- *Nghĩa tiếng Việt:* không thể, không có khả năng (quiz_vi: `không thể`)
- *Đáp án bẫy trắc nghiệm (2 bẫy):*
  - 🪤 `[family]` **ability**: *khả năng, năng lực* — 💡 *Lý do:* Cùng họ từ (able), nhưng ability là noun (khả năng), khác với unable là adjective (không thể).
  - 🪤 `[family]` **able**: *có thể, có khả năng* — 💡 *Lý do:* Cùng họ từ (able), nhưng able mang nghĩa 'có thể', khác với unable ('không thể').

**4. about** (`Adverb`)
- *Định nghĩa EN:* approximately; nearly
- *Nghĩa tiếng Việt:* khoảng (quiz_vi: `khoảng`)
- *Đáp án bẫy trắc nghiệm (2 bẫy):*
  - 🪤 `[look]` **above**: *Ở trên* — 💡 *Lý do:* Dễ nhầm vì gần âm, nhưng 'above' chỉ vị trí, không phải chủ đề.
  - 🪤 `[syn]` **regarding**: *Liên quan đến* — 💡 *Lý do:* Dễ nhầm vì gần nghĩa, nhưng 'regarding' thường trang trọng hơn 'about'.

**5. accent** (`Noun`)
- *Định nghĩa EN:* the way people from a place pronounce words
- *Nghĩa tiếng Việt:* giọng (phát âm) (quiz_vi: `giọng`)
- *Đáp án bẫy trắc nghiệm (3 bẫy):*
  - 🪤 `[look]` **ascent**: *Sự đi lên, leo lên* — 💡 *Lý do:* 'Accent' và 'ascent' phát âm gần giống nhau, nhưng 'accent' là giọng nói, còn 'ascent' là sự đi lên.
  - 🪤 `[syn]` **dialect**: *Phương ngữ* — 💡 *Lý do:* 'Dialect' là phương ngữ, không phải giọng nói. 'Accent' chỉ cách phát âm, không phải từ vựng hay ngữ pháp.
  - 🪤 `[false]` **tone**: *Âm điệu* — 💡 *Lý do:* Người Việt có thể nhầm 'accent' với 'tone', nhưng 'tone' là âm điệu, không phải giọng nói theo vùng miền.

**6. accept** (`Verb`)
- *Định nghĩa EN:* to take something that is offered; to say yes
- *Nghĩa tiếng Việt:* chấp nhận (quiz_vi: `chấp nhận`)
- *Đáp án bẫy trắc nghiệm (4 bẫy):*
  - 🪤 `[family]` **acceptance**: *sự chấp nhận* — 💡 *Lý do:* Cùng họ từ (accept), nhưng acceptance là noun (sự chấp nhận), khác với accept là verb (chấp nhận).
  - 🪤 `[family]` **acceptable**: *chấp nhận được* — 💡 *Lý do:* Cùng họ từ (accept), nhưng acceptable là adjective (chấp nhận được), khác với accept là verb (chấp nhận).
  - 🪤 `[family]` **unacceptable**: *không thể chấp nhận* — 💡 *Lý do:* Cùng họ từ (accept), nhưng unacceptable là adjective (không thể chấp nhận), khác với accept là verb (chấp nhận).
  - 🪤 `[look]` **except**: *ngoại trừ* — 💡 *Lý do:* Dễ nhầm do phát âm tương tự (accept = chấp nhận, except = trừ ra).

**7. acceptance** (`Noun`)
- *Định nghĩa EN:* the act of agreeing to take something
- *Nghĩa tiếng Việt:* sự chấp nhận (quiz_vi: `sự chấp nhận`)
- *Đáp án bẫy trắc nghiệm (3 bẫy):*
  - 🪤 `[family]` **accept**: *chấp nhận* — 💡 *Lý do:* Cùng họ từ (accept), nhưng accept là verb (chấp nhận), khác với acceptance là noun (sự chấp nhận).
  - 🪤 `[family]` **acceptable**: *chấp nhận được* — 💡 *Lý do:* Cùng họ từ (accept), nhưng acceptable là adjective (chấp nhận được), khác với acceptance là noun (sự chấp nhận).
  - 🪤 `[family]` **unacceptable**: *không thể chấp nhận* — 💡 *Lý do:* Cùng họ từ (accept), nhưng unacceptable là adjective (không thể chấp nhận), khác với acceptance là noun (sự chấp nhận).

**8. acceptable** (`Adjective`)
- *Định nghĩa EN:* good enough; allowed
- *Nghĩa tiếng Việt:* chấp nhận được (quiz_vi: `chấp nhận được`)
- *Đáp án bẫy trắc nghiệm (3 bẫy):*
  - 🪤 `[family]` **accept**: *chấp nhận* — 💡 *Lý do:* Cùng họ từ (accept), nhưng accept là verb (chấp nhận), khác với acceptable là adjective (chấp nhận được).
  - 🪤 `[family]` **acceptance**: *sự chấp nhận* — 💡 *Lý do:* Cùng họ từ (accept), nhưng acceptance là noun (sự chấp nhận), khác với acceptable là adjective (chấp nhận được).
  - 🪤 `[family]` **unacceptable**: *không thể chấp nhận* — 💡 *Lý do:* Cùng họ từ (accept), nhưng unacceptable mang nghĩa 'không thể chấp nhận', khác với acceptable ('chấp nhận được').

**9. unacceptable** (`Adjective`)
- *Định nghĩa EN:* not good enough; not allowed
- *Nghĩa tiếng Việt:* không thể chấp nhận (quiz_vi: `không thể chấp nhận`)
- *Đáp án bẫy trắc nghiệm (3 bẫy):*
  - 🪤 `[family]` **accept**: *chấp nhận* — 💡 *Lý do:* Cùng họ từ (accept), nhưng accept là verb (chấp nhận), khác với unacceptable là adjective (không thể chấp nhận).
  - 🪤 `[family]` **acceptance**: *sự chấp nhận* — 💡 *Lý do:* Cùng họ từ (accept), nhưng acceptance là noun (sự chấp nhận), khác với unacceptable là adjective (không thể chấp nhận).
  - 🪤 `[family]` **acceptable**: *chấp nhận được* — 💡 *Lý do:* Cùng họ từ (accept), nhưng acceptable mang nghĩa 'chấp nhận được', khác với unacceptable ('không thể chấp nhận').

**10. access** (`Noun`)
- *Định nghĩa EN:* the ability to enter or use something
- *Nghĩa tiếng Việt:* quyền truy cập (quiz_vi: `quyền truy cập`)
- *Đáp án bẫy trắc nghiệm (2 bẫy):*
  - 🪤 `[family]` **accessible**: *dễ tiếp cận* — 💡 *Lý do:* Cùng họ từ (access), nhưng accessible là adjective (dễ tiếp cận), khác với access là noun (quyền truy cập).
  - 🪤 `[look]` **excess**: *sự dư thừa* — 💡 *Lý do:* Dễ nhầm do phát âm tương tự (access = tiếp cận, excess = quá mức/dư thừa).

**11. access** (`Verb`)
- *Định nghĩa EN:* to get into or find information
- *Nghĩa tiếng Việt:* truy cập (quiz_vi: `truy cập`)
- *Đáp án bẫy trắc nghiệm (2 bẫy):*
  - 🪤 `[family]` **accessible**: *dễ tiếp cận* — 💡 *Lý do:* Cùng họ từ (access), nhưng accessible là adjective (dễ tiếp cận), khác với access là noun (quyền truy cập).
  - 🪤 `[look]` **excess**: *sự dư thừa* — 💡 *Lý do:* Dễ nhầm do phát âm tương tự (access = tiếp cận, excess = quá mức/dư thừa).

**12. accessible** (`Adjective`)
- *Định nghĩa EN:* easy to reach or use
- *Nghĩa tiếng Việt:* dễ tiếp cận (quiz_vi: `dễ tiếp cận`)
- *Đáp án bẫy trắc nghiệm (2 bẫy):*
  - 🪤 `[family]` **access**: *quyền truy cập* — 💡 *Lý do:* Cùng họ từ (access), nhưng access là noun (quyền truy cập), khác với accessible là adjective (dễ tiếp cận).
  - 🪤 `[look]` **acceptable**: *chấp nhận được* — 💡 *Lý do:* Dễ nhầm do mặt chữ tương tự (acceptable = chấp nhận được, khác với accessible = dễ tiếp cận).

#### Ghi chú Họ từ (Context Passage gắn trên Block):
```text
【ROOT able (adj) → ability (n) → unable (adj)】
• EN: able → ability: -ity makes the noun; un- makes the opposite
• VI: able → ability: thêm -ity thành danh từ; un- tạo nghĩa trái ngược
  [able] (Adjective): She is able to speak three languages.
    ↳ Cô ấy có thể nói ba thứ tiếng.
  [ability] (Noun): He has the ability to learn fast.
    ↳ Anh ấy có khả năng học nhanh.
  [unable] (Adjective): I was unable to come yesterday.
    ↳ Hôm qua tôi không thể đến.

  [about] (Adverb): The trip takes about two hours.
    ↳ Chuyến đi mất khoảng hai tiếng.

  [accent] (Noun): She has a strong French acce
...
```

---

### 📦 Block Mẫu 2: `Block 2` (global_index: `2`)
- **Vị trí cây:** Hub `hub_toeic_hub` › Notebook `a Kim Quất_Word Family` › Section `Word Family` › Page `A–B` › Batch `able – against`
- **ID Block:** `blk_wf_0002`
- **Số lượng từ:** 8 từ

#### Danh sách từ vựng & Bẫy trắc nghiệm trong Block:

**1. accident** (`Noun`)
- *Định nghĩa EN:* something bad that happens by chance
- *Nghĩa tiếng Việt:* tai nạn (quiz_vi: `tai nạn`)
- *Đáp án bẫy trắc nghiệm (2 bẫy):*
  - 🪤 `[family]` **accidental**: *tình cờ, ngẫu nhiên* — 💡 *Lý do:* Cùng họ từ (accident), nhưng accidental là adjective (tình cờ), khác với accident là noun (tai nạn).
  - 🪤 `[family]` **accidentally**: *vô tình* — 💡 *Lý do:* Cùng họ từ (accident), nhưng accidentally là adverb (vô tình), khác với accident là noun (tai nạn).

**2. accidental** (`Adjective`)
- *Định nghĩa EN:* happening by chance, not planned
- *Nghĩa tiếng Việt:* tình cờ, ngẫu nhiên (quiz_vi: `tình cờ`)
- *Đáp án bẫy trắc nghiệm (2 bẫy):*
  - 🪤 `[family]` **accident**: *tai nạn* — 💡 *Lý do:* Cùng họ từ (accident), nhưng accident là noun (tai nạn), khác với accidental là adjective (tình cờ).
  - 🪤 `[family]` **accidentally**: *vô tình* — 💡 *Lý do:* Cùng họ từ (accident), nhưng accidentally là adverb (vô tình), khác với accidental là adjective (tình cờ).

**3. accidentally** (`Adverb`)
- *Định nghĩa EN:* by chance, not on purpose
- *Nghĩa tiếng Việt:* vô tình (quiz_vi: `vô tình`)
- *Đáp án bẫy trắc nghiệm (2 bẫy):*
  - 🪤 `[family]` **accident**: *tai nạn* — 💡 *Lý do:* Cùng họ từ (accident), nhưng accident là noun (tai nạn), khác với accidentally là adverb (vô tình).
  - 🪤 `[family]` **accidental**: *tình cờ, ngẫu nhiên* — 💡 *Lý do:* Cùng họ từ (accident), nhưng accidental là adjective (tình cờ), khác với accidentally là adverb (vô tình).

**4. account** (`Noun`)
- *Định nghĩa EN:* an arrangement to keep your money in a bank
- *Nghĩa tiếng Việt:* tài khoản (quiz_vi: `tài khoản`)
- *Đáp án bẫy trắc nghiệm (2 bẫy):*
  - 🪤 `[family]` **accountant**: *kế toán* — 💡 *Lý do:* Cùng họ từ (account), nhưng accountant mang nghĩa 'kế toán', khác với account ('tài khoản').
  - 🪤 `[look]` **count**: *đếm* — 💡 *Lý do:* Dễ nhầm do mặt chữ tương tự (count = đếm, khác với account = tài khoản).

**5. accountant** (`Noun`)
- *Định nghĩa EN:* a person whose job is to manage money records
- *Nghĩa tiếng Việt:* kế toán (quiz_vi: `kế toán`)
- *Đáp án bẫy trắc nghiệm (2 bẫy):*
  - 🪤 `[family]` **account**: *tài khoản* — 💡 *Lý do:* Cùng họ từ (account), nhưng account mang nghĩa 'tài khoản', khác với accountant ('kế toán').
  - 🪤 `[look]` **contact**: *liên lạc* — 💡 *Lý do:* Dễ nhầm do mặt chữ tương tự (contact = liên lạc, khác với accountant = kế toán).

**6. achieve** (`Verb`)
- *Định nghĩa EN:* to succeed in doing something
- *Nghĩa tiếng Việt:* đạt được (quiz_vi: `đạt được`)
- *Đáp án bẫy trắc nghiệm (3 bẫy):*
  - 🪤 `[family]` **achievement**: *thành tích, thành tựu* — 💡 *Lý do:* Cùng họ từ (achieve), nhưng achievement là noun (thành tích), khác với achieve là verb (đạt được).
  - 🪤 `[look]` **archive**: *Lưu trữ* — 💡 *Lý do:* 'Archive' và 'achieve' có âm gần giống, nhưng nghĩa khác hoàn toàn.
  - 🪤 `[syn]` **attain**: *Đạt tới* — 💡 *Lý do:* 'Attain' không thể thay thế 'achieve' trong mọi ngữ cảnh, thường dùng cho mục tiêu cụ thể.

**7. achievement** (`Noun`)
- *Định nghĩa EN:* something good you have done with effort
- *Nghĩa tiếng Việt:* thành tích, thành tựu (quiz_vi: `thành tích`)
- *Đáp án bẫy trắc nghiệm (3 bẫy):*
  - 🪤 `[family]` **achieve**: *đạt được* — 💡 *Lý do:* Cùng họ từ (achieve), nhưng achieve là verb (đạt được), khác với achievement là noun (thành tích).
  - 🪤 `[syn]` **success**: *thành công* — 💡 *Lý do:* 'Success' gần nghĩa nhưng không chỉ rõ thành tựu cụ thể.
  - 🪤 `[false]` **performance**: *hiệu suất* — 💡 *Lý do:* Người Việt dễ nhầm 'achievement' với 'performance', nhưng 'performance' là hiệu suất, không phải thành tựu.

**8. across** (`Preposition`)
- *Định nghĩa EN:* from one side to the other
- *Nghĩa tiếng Việt:* băng qua (quiz_vi: `băng qua`)
- *Đáp án bẫy trắc nghiệm (2 bẫy):*
  - 🪤 `[look]` **crossed**: *đã băng qua* — 💡 *Lý do:* Dễ nhầm do mặt chữ tương tự (crossed = đã băng qua, khác với across = băng qua).
  - 🪤 `[look]` **crops**: *cây trồng, mùa màng* — 💡 *Lý do:* Dễ nhầm do mặt chữ tương tự (crops = cây trồng, khác với across = băng qua).

#### Ghi chú Họ từ (Context Passage gắn trên Block):
```text
【ROOT accident (n) → accidental (adj) → accidentally (adv)】
• EN: accident → accidental: add -al; accidental → accidentally: add -ly
• VI: accident → accidental: thêm -al; accidental → accidentally: thêm -ly
  [accident] (Noun): He had an accident on his bike.
    ↳ Anh ấy bị tai nạn khi đi xe đạp.
  [accidental] (Adjective): The meeting was accidental.
    ↳ Cuộc gặp đó là tình cờ.
  [accidentally] (Adverb): I accidentally broke the cup.
    ↳ Tôi vô tình làm vỡ cái cốc.

【ROOT account (n) → accountant (n)】
• EN: account → accountant: add -ant for the person
• VI: account → accountant: thêm -
...
```

---

### 📦 Block Mẫu 3: `Block 3` (global_index: `3`)
- **Vị trí cây:** Hub `hub_toeic_hub` › Notebook `a Kim Quất_Word Family` › Section `Word Family` › Page `A–B` › Batch `able – against`
- **ID Block:** `blk_wf_0003`
- **Số lượng từ:** 10 từ

#### Danh sách từ vựng & Bẫy trắc nghiệm trong Block:

**1. act** (`Verb`)
- *Định nghĩa EN:* to do something or behave in a way
- *Nghĩa tiếng Việt:* hành động, đóng vai (quiz_vi: `hành động`)
- *Đáp án bẫy trắc nghiệm (4 bẫy):*
  - 🪤 `[family]` **actor**: *diễn viên* — 💡 *Lý do:* Cùng họ từ (act), nhưng actor là noun (diễn viên), khác với act là verb (hành động).
  - 🪤 `[family]` **acting**: *diễn xuất* — 💡 *Lý do:* Cùng họ từ (act), nhưng acting là noun (diễn xuất), khác với act là verb (hành động).
  - 🪤 `[family]` **active**: *năng động, tích cực* — 💡 *Lý do:* Cùng họ từ (act), nhưng active là adjective (năng động), khác với act là verb (hành động).
  - 🪤 `[family]` **activity**: *hoạt động* — 💡 *Lý do:* Cùng họ từ (act), nhưng activity là noun (hoạt động), khác với act là verb (hành động).

**2. actor** (`Noun`)
- *Định nghĩa EN:* a person who plays a part in films or plays
- *Nghĩa tiếng Việt:* diễn viên (quiz_vi: `diễn viên`)
- *Đáp án bẫy trắc nghiệm (4 bẫy):*
  - 🪤 `[family]` **act**: *hành động, đóng vai* — 💡 *Lý do:* Cùng họ từ (act), nhưng act là verb (hành động), khác với actor là noun (diễn viên).
  - 🪤 `[family]` **activate**: *kích hoạt* — 💡 *Lý do:* Cùng họ từ (act), nhưng activate là verb (kích hoạt), khác với actor là noun (diễn viên).
  - 🪤 `[family]` **activated**: *được kích hoạt* — 💡 *Lý do:* Cùng họ từ (act), nhưng activated là verb (được kích hoạt), khác với actor là noun (diễn viên).
  - 🪤 `[family]` **active**: *năng động, tích cực* — 💡 *Lý do:* Cùng họ từ (act), nhưng active là adjective (năng động), khác với actor là noun (diễn viên).

**3. acting** (`Noun`)
- *Định nghĩa EN:* the job or skill of playing a part in films or plays
- *Nghĩa tiếng Việt:* diễn xuất (quiz_vi: `diễn xuất`)
- *Đáp án bẫy trắc nghiệm (4 bẫy):*
  - 🪤 `[family]` **act**: *hành động, đóng vai* — 💡 *Lý do:* Cùng họ từ (act), nhưng act là verb (hành động), khác với acting là noun (diễn xuất).
  - 🪤 `[family]` **activate**: *kích hoạt* — 💡 *Lý do:* Cùng họ từ (act), nhưng activate là verb (kích hoạt), khác với acting là noun (diễn xuất).
  - 🪤 `[family]` **activated**: *được kích hoạt* — 💡 *Lý do:* Cùng họ từ (act), nhưng activated là verb (được kích hoạt), khác với acting là noun (diễn xuất).
  - 🪤 `[family]` **active**: *năng động, tích cực* — 💡 *Lý do:* Cùng họ từ (act), nhưng active là adjective (năng động), khác với acting là noun (diễn xuất).

**4. action** (`Noun`)
- *Định nghĩa EN:* the act of doing something
- *Nghĩa tiếng Việt:* hành động (quiz_vi: `hành động`)
- *Đáp án bẫy trắc nghiệm (4 bẫy):*
  - 🪤 `[family]` **activate**: *kích hoạt* — 💡 *Lý do:* Cùng họ từ (act), nhưng activate là verb (kích hoạt), khác với action là noun (hành động).
  - 🪤 `[family]` **activated**: *được kích hoạt* — 💡 *Lý do:* Cùng họ từ (act), nhưng activated là verb (được kích hoạt), khác với action là noun (hành động).
  - 🪤 `[family]` **active**: *năng động, tích cực* — 💡 *Lý do:* Cùng họ từ (act), nhưng active là adjective (năng động), khác với action là noun (hành động).
  - 🪤 `[family]` **actor**: *diễn viên* — 💡 *Lý do:* Cùng họ từ (act), nhưng actor mang nghĩa 'diễn viên', khác với action ('hành động').

**5. activate** (`Verb`)
- *Định nghĩa EN:* to make something start working
- *Nghĩa tiếng Việt:* kích hoạt (quiz_vi: `kích hoạt`)
- *Đáp án bẫy trắc nghiệm (4 bẫy):*
  - 🪤 `[family]` **actor**: *diễn viên* — 💡 *Lý do:* Cùng họ từ (act), nhưng actor là noun (diễn viên), khác với activate là verb (kích hoạt).
  - 🪤 `[family]` **acting**: *diễn xuất* — 💡 *Lý do:* Cùng họ từ (act), nhưng acting là noun (diễn xuất), khác với activate là verb (kích hoạt).
  - 🪤 `[family]` **action**: *hành động* — 💡 *Lý do:* Cùng họ từ (act), nhưng action là noun (hành động), khác với activate là verb (kích hoạt).
  - 🪤 `[family]` **active**: *năng động, tích cực* — 💡 *Lý do:* Cùng họ từ (act), nhưng active là adjective (năng động), khác với activate là verb (kích hoạt).

**6. activated** (`Verb`)
- *Định nghĩa EN:* made to start working
- *Nghĩa tiếng Việt:* được kích hoạt (quiz_vi: `được kích hoạt`)
- *Đáp án bẫy trắc nghiệm (4 bẫy):*
  - 🪤 `[family]` **actor**: *diễn viên* — 💡 *Lý do:* Cùng họ từ (act), nhưng actor là noun (diễn viên), khác với activated là verb (được kích hoạt).
  - 🪤 `[family]` **acting**: *diễn xuất* — 💡 *Lý do:* Cùng họ từ (act), nhưng acting là noun (diễn xuất), khác với activated là verb (được kích hoạt).
  - 🪤 `[family]` **action**: *hành động* — 💡 *Lý do:* Cùng họ từ (act), nhưng action là noun (hành động), khác với activated là verb (được kích hoạt).
  - 🪤 `[family]` **active**: *năng động, tích cực* — 💡 *Lý do:* Cùng họ từ (act), nhưng active là adjective (năng động), khác với activated là verb (được kích hoạt).

**7. active** (`Adjective`)
- *Định nghĩa EN:* busy and full of energy
- *Nghĩa tiếng Việt:* năng động, tích cực (quiz_vi: `năng động`)
- *Đáp án bẫy trắc nghiệm (4 bẫy):*
  - 🪤 `[family]` **act**: *hành động, đóng vai* — 💡 *Lý do:* Cùng họ từ (act), nhưng act là verb (hành động), khác với active là adjective (năng động).
  - 🪤 `[family]` **actor**: *diễn viên* — 💡 *Lý do:* Cùng họ từ (act), nhưng actor là noun (diễn viên), khác với active là adjective (năng động).
  - 🪤 `[family]` **acting**: *diễn xuất* — 💡 *Lý do:* Cùng họ từ (act), nhưng acting là noun (diễn xuất), khác với active là adjective (năng động).
  - 🪤 `[family]` **action**: *hành động* — 💡 *Lý do:* Cùng họ từ (act), nhưng action là noun (hành động), khác với active là adjective (năng động).

**8. activity** (`Noun`)
- *Định nghĩa EN:* something you do for fun or work
- *Nghĩa tiếng Việt:* hoạt động (quiz_vi: `hoạt động`)
- *Đáp án bẫy trắc nghiệm (4 bẫy):*
  - 🪤 `[family]` **act**: *hành động, đóng vai* — 💡 *Lý do:* Cùng họ từ (act), nhưng act là verb (hành động), khác với activity là noun (hoạt động).
  - 🪤 `[family]` **activate**: *kích hoạt* — 💡 *Lý do:* Cùng họ từ (act), nhưng activate là verb (kích hoạt), khác với activity là noun (hoạt động).
  - 🪤 `[family]` **activated**: *được kích hoạt* — 💡 *Lý do:* Cùng họ từ (act), nhưng activated là verb (được kích hoạt), khác với activity là noun (hoạt động).
  - 🪤 `[family]` **active**: *năng động, tích cực* — 💡 *Lý do:* Cùng họ từ (act), nhưng active là adjective (năng động), khác với activity là noun (hoạt động).

**9. actual** (`Adjective`)
- *Định nghĩa EN:* real, not guessed
- *Nghĩa tiếng Việt:* thực tế, có thật (quiz_vi: `thực tế`)
- *Đáp án bẫy trắc nghiệm (2 bẫy):*
  - 🪤 `[family]` **actually**: *thật ra* — 💡 *Lý do:* Cùng họ từ (actual), nhưng actually là adverb (thật ra), khác với actual là adjective (thực tế).
  - 🪤 `[look]` **natural**: *tự nhiên* — 💡 *Lý do:* Dễ nhầm do mặt chữ tương tự (natural = tự nhiên, khác với actual = thực tế).

**10. actually** (`Adverb`)
- *Định nghĩa EN:* in fact
- *Nghĩa tiếng Việt:* thật ra (quiz_vi: `thật ra`)
- *Đáp án bẫy trắc nghiệm (2 bẫy):*
  - 🪤 `[family]` **actual**: *thực tế, có thật* — 💡 *Lý do:* Cùng họ từ (actual), nhưng actual là adjective (thực tế), khác với actually là adverb (thật ra).
  - 🪤 `[look]` **naturally**: *một cách tự nhiên; dĩ nhiên* — 💡 *Lý do:* Dễ nhầm do mặt chữ tương tự (naturally = một cách tự nhiên, khác với actually = thật ra).

#### Ghi chú Họ từ (Context Passage gắn trên Block):
```text
【ROOT act (v) → actor (n) → acting (n) → action (n) → activate (v) → activated (v) → active (adj) → activity (n)】
• EN: act → action/activity/active: endings change; act → actor: add -or for a person
• VI: act → action/activity/active: đổi đuôi; act → actor: thêm -or chỉ người
  [act] (Verb): Stop acting like a child.
    ↳ Đừng cư xử như một đứa trẻ nữa.
  [actor] (Noun): My uncle is a famous actor.
    ↳ Chú tôi là một diễn viên nổi tiếng.
  [acting] (Noun): Her acting in the film was wonderful.
    ↳ Diễn xuất của cô ấy trong phim rất tuyệt.
  [action] (Noun): We must take action now.
    ↳
...
```

---

## 4. Các Điểm Kỹ thuật & Báo cáo Lựa chọn cho TJ

1. **Vị trí lưu Ví dụ (Example EN / Câu ví dụ VI):**
   - Schema bảng `words` hiện tại không có cột riêng cho `example_en` hay `example_vi`.
   - Toàn bộ ghi chú họ từ (teal banner) và các câu ví dụ song ngữ EN–VI của từng từ đã được đóng gói khoa học vào cột `blocks.context_passage` của từng Block. Nhờ đó, khi người học mở màn hình học và đọc ngữ cảnh, toàn bộ ghi chú biến đổi họ từ và ví dụ thực tế đều hiển thị rõ ràng ngay tại tab bài đọc.
   - Nếu TJ muốn sau này có cột riêng trên bảng `words`, chúng ta có thể bổ sung cột `examples jsonb` trong một đợt migration.

2. **Cột meaning_zh / meaning_es / ipa / level:**
   - Tuân thủ nghiêm ngặt nguyên tắc của CLAUDE.md: **Tuyệt đối không bịa nội dung**.
   - Các cột này để chuỗi rỗng `''` / `null` ở lượt nạp dữ liệu gốc từ PDF.
   - Sau khi TJ duyệt nạp, các script có sẵn (`tools/backfill_meaning_zh.py`, `tools/backfill_meaning_es.py`) sẽ được chạy để AI Gemini dịch nghĩa tiếng Trung và Tây Ban Nha theo ngữ cảnh nghĩa tiếng Việt.

3. **Cơ chế an toàn & Khả năng Hoàn tác (Rollback):**
   - Script nạp `tools/wf_import/import_db.py` mặc định chạy ở chế độ **dry-run**.
   - Khi chạy `--apply`, toàn bộ ID của Page, Batch, Block, Word và Trap được sinh sẽ tự động ghi vào `data/word_family/created_ids.json` để có thể truy vết và rollback bất cứ lúc nào.