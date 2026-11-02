/**
 * IELTS Academic Listening Test 2 Data Module
 * ID: ie-ac-ls-02
 * Title: Academic Listening Test 2 — Rail Baggage Claim · Westbridge Civic Hub · Maritime Sleep Cycles · Benthic Bioluminescence
 */

const test2 = {
  id: "ie-ac-ls-02",
  title: "Academic Listening Test 2 — Rail Baggage Claim · Westbridge Civic Hub · Maritime Sleep Cycles · Benthic Bioluminescence",
  fmt: 3,
  module: "academic",
  approxAudioSec: 1720,
  reviewTimeSec: 120,
  totalQuestions: 40,
  sections: [
    {
      id: "ie-ac-ls-02-s1",
      sectionIndex: 1,
      qRange: [1, 10],
      contextType: "social_dialogue",
      title: "Section 1 — Northline Rail Express Baggage Claim",
      topic: "Lost luggage tracing, musical instrument flight case specifications, and delivery coordination",
      targetBand: "5.0–6.0",
      audioUrl: null,
      preReadPauseMs: 4000,
      postCheckPauseMs: 3000,
      speakers: [
        {
          speakerId: "spk_rachel",
          label: "Rachel (Baggage Officer)",
          gender: "female",
          accentPref: ["en-AU", "en-NZ"],
          pitch: 1.04,
          rateMultiplier: 1.0
        },
        {
          speakerId: "spk_marcus",
          label: "Marcus Vance (Passenger)",
          gender: "male",
          accentPref: ["en-US"],
          pitch: 0.96,
          rateMultiplier: 1.0
        }
      ],
      turns: [
        {
          turnId: "L2-S1-T01",
          speakerId: "spk_rachel",
          text: "Northline Rail Express Lost Property, Rachel speaking. How can I help you?",
          pauseAfterMs: 450
        },
        {
          turnId: "L2-S1-T02",
          speakerId: "spk_marcus",
          text: "Hello. I arrived on the overnight express from Edinburgh last night, and my oversized baggage item failed to appear on the luggage carousel.",
          pauseAfterMs: 450
        },
        {
          turnId: "L2-S1-T03",
          speakerId: "spk_rachel",
          text: "I am very sorry to hear that, sir. Let me open a tracking case right now. May I take your full name?",
          pauseAfterMs: 450
        },
        {
          turnId: "L2-S1-T04",
          speakerId: "spk_marcus",
          text: "It is Marcus Vance. That is V-A-N-C-E.",
          pauseAfterMs: 500
        },
        {
          turnId: "L2-S1-T05",
          speakerId: "spk_rachel",
          text: "Thank you, Mr Vance. What was your ticket booking reference code?",
          pauseAfterMs: 450
        },
        {
          turnId: "L2-S1-T06",
          speakerId: "spk_marcus",
          text: "It's NL-8420-X.",
          pauseAfterMs: 500
        },
        {
          turnId: "L2-S1-T07",
          speakerId: "spk_rachel",
          text: "NL-8420-X. And what type of item is missing?",
          pauseAfterMs: 450
        },
        {
          turnId: "L2-S1-T08",
          speakerId: "spk_marcus",
          text: "It is a professional carbon-fiber cello case.",
          pauseAfterMs: 500
        },
        {
          turnId: "L2-S1-T09",
          speakerId: "spk_rachel",
          text: "A cello case. What color is the exterior shell?",
          pauseAfterMs: 450
        },
        {
          turnId: "L2-S1-T10",
          speakerId: "spk_marcus",
          text: "It's metallic silver. However, it has very noticeable identifying features: the primary carrying handle is bright orange, and there is a circular red sticker near the top clasp.",
          pauseAfterMs: 550
        },
        {
          turnId: "L2-S1-T11",
          speakerId: "spk_rachel",
          text: "Metallic silver with an orange handle. That should make identification much easier. Any physical marks?",
          pauseAfterMs: 450
        },
        {
          turnId: "L2-S1-T12",
          speakerId: "spk_marcus",
          text: "Yes, there is a deep scratch along the bottom base rim, about ten centimeters long.",
          pauseAfterMs: 500
        },
        {
          turnId: "L2-S1-T13",
          speakerId: "spk_rachel",
          text: "Noted. Scratch on base rim. And the estimated declared value for transit insurance?",
          pauseAfterMs: 450
        },
        {
          turnId: "L2-S1-T14",
          speakerId: "spk_marcus",
          text: "The instrument and flight case together are insured for 3,500 pounds.",
          pauseAfterMs: 500
        },
        {
          turnId: "L2-S1-T15",
          speakerId: "spk_rachel",
          text: "Three thousand five hundred pounds. Now, where are you currently staying so our express courier can deliver it once recovered?",
          pauseAfterMs: 500
        },
        {
          turnId: "L2-S1-T16",
          speakerId: "spk_marcus",
          text: "I am staying at the Oakwood Hotel, at 42 Meadowbrook Lane. My contact number is 555-0192.",
          pauseAfterMs: 500
        },
        {
          turnId: "L2-S1-T17",
          speakerId: "spk_rachel",
          text: "42 Meadowbrook Lane, 555-0192. Excellent. If located by mid-afternoon, our delivery driver can bring it to your hotel reception by 8 pm tonight.",
          pauseAfterMs: 500
        },
        {
          turnId: "L2-S1-T18",
          speakerId: "spk_marcus",
          text: "That would be wonderful. What documents do I need to present upon delivery?",
          pauseAfterMs: 450
        },
        {
          turnId: "L2-S1-T19",
          speakerId: "spk_rachel",
          text: "You must show your photo identification and sign the freight release voucher.",
          pauseAfterMs: 500
        },
        {
          turnId: "L2-S1-T20",
          speakerId: "spk_marcus",
          text: "Understood, my passport will be ready. Thank you for your assistance, Rachel.",
          pauseAfterMs: 500
        }
      ],
      questionGroups: [
        {
          groupId: "ie-ac-ls-02-g1",
          type: "gap_fill",
          subType: "form_completion",
          wordLimit: "ONE_WORD_OR_NUMBER",
          wordLimitLabel: "ONE WORD AND/OR A NUMBER",
          qRange: [1, 6],
          instructionEn: "Questions 1–6: Complete the form below. Write ONE WORD AND/OR A NUMBER for each answer.",
          instructionVi: "Hoàn thành mẫu khai báo hành lý thất lạc bên dưới. Viết DUY NHẤT MỘT TỪ VÀ/HOẶC MỘT CON SỐ cho mỗi chỗ trống.",
          contextTitle: "NORTHLINE RAIL EXPRESS — LOST BAGGAGE TRACER",
          questions: [
            {
              q: 1,
              type: "gap_fill",
              wordLimit: "ONE_WORD_OR_NUMBER",
              stem: "Booking reference code: {{gap}}",
              answer: "NL-8420-X",
              accept: ["NL-8420-X", "nl-8420-x"],
              evidence: {
                ref: "L2-S1-T06",
                quote: "It's NL-8420-X."
              },
              explanationVi: "Marcus đọc mã đặt vé là NL-8420-X -> đáp án là 'NL-8420-X'."
            },
            {
              q: 2,
              type: "gap_fill",
              wordLimit: "ONE_WORD_OR_NUMBER",
              stem: "Item category: flight case for a {{gap}}",
              answer: "cello",
              accept: ["cello"],
              evidence: {
                ref: "L2-S1-T08",
                quote: "It is a professional carbon-fiber cello case."
              },
              explanationVi: "Marcus cho biết món đồ thất lạc là hộp đàn cello chuyên dụng (cello case) -> đáp án là 'cello'."
            },
            {
              q: 3,
              type: "gap_fill",
              wordLimit: "ONE_WORD_OR_NUMBER",
              stem: "Primary exterior shell color: {{gap}}",
              answer: "silver",
              accept: ["silver"],
              evidence: {
                ref: "L2-S1-T10",
                quote: "It's metallic silver. However, it has very noticeable identifying features..."
              },
              explanationVi: "Màu vỏ ngoài của hộp đàn là màu bạc kim loại (metallic silver) -> từ cần điền là 'silver'."
            },
            {
              q: 4,
              type: "gap_fill",
              wordLimit: "ONE_WORD_OR_NUMBER",
              stem: "Color of carrying handle: {{gap}}",
              answer: "orange",
              accept: ["orange"],
              evidence: {
                ref: "L2-S1-T10",
                quote: "the primary carrying handle is bright orange..."
              },
              explanationVi: "Quai xách chính có màu cam sáng (bright orange) -> đáp án là 'orange'."
            },
            {
              q: 5,
              type: "gap_fill",
              wordLimit: "ONE_WORD_OR_NUMBER",
              stem: "Identifying mark: deep scratch located on the {{gap}} rim",
              answer: "base",
              accept: ["base"],
              evidence: {
                ref: "L2-S1-T12",
                quote: "Yes, there is a deep scratch along the bottom base rim, about ten centimeters long."
              },
              explanationVi: "Vết xước sâu nằm ở phần viền đáy (base rim) -> đáp án là 'base'."
            },
            {
              q: 6,
              type: "gap_fill",
              wordLimit: "ONE_WORD_OR_NUMBER",
              stem: "Declared insurance valuation: £ {{gap}}",
              answer: "3500",
              accept: ["3500", "3,500"],
              evidence: {
                ref: "L2-S1-T14",
                quote: "The instrument and flight case together are insured for 3,500 pounds."
              },
              explanationVi: "Giá trị bảo hiểm khai báo là 3.500 bảng -> đáp án là '3500' hoặc '3,500' (ký hiệu £ đã in sẵn)."
            }
          ]
        },
        {
          groupId: "ie-ac-ls-02-g2",
          type: "gap_fill",
          subType: "sentence_completion",
          wordLimit: "TWO_WORDS_ONLY",
          wordLimitLabel: "NO MORE THAN TWO WORDS",
          qRange: [7, 10],
          instructionEn: "Questions 7–10: Complete the sentences below. Write NO MORE THAN TWO WORDS for each answer.",
          instructionVi: "Hoàn thành các câu dưới đây về giao nhận hành lý. Viết KHÔNG QUÁ HAI TỪ cho mỗi câu trả lời.",
          questions: [
            {
              q: 7,
              type: "gap_fill",
              wordLimit: "TWO_WORDS_ONLY",
              stem: "Marcus is staying at 42 {{gap}} Lane.",
              answer: "Meadowbrook",
              accept: ["Meadowbrook", "meadowbrook"],
              evidence: {
                ref: "L2-S1-T16",
                quote: "I am staying at the Oakwood Hotel, at 42 Meadowbrook Lane."
              },
              explanationVi: "Địa chỉ khách sạn là 42 Meadowbrook Lane -> từ cần điền là 'Meadowbrook'."
            },
            {
              q: 8,
              type: "gap_fill",
              wordLimit: "TWO_WORDS_ONLY",
              stem: "If traced, the baggage will be brought to hotel {{gap}} tonight.",
              answer: "reception",
              accept: ["reception"],
              evidence: {
                ref: "L2-S1-T17",
                quote: "our delivery driver can bring it to your hotel reception by 8 pm tonight."
              },
              explanationVi: "Hành lý sẽ được tài xế giao tới quầy lễ tân khách sạn (hotel reception) -> đáp án là 'reception'."
            },
            {
              q: 9,
              type: "gap_fill",
              wordLimit: "TWO_WORDS_ONLY",
              stem: "To receive the item, Marcus must present official {{gap}}.",
              answer: "photo identification",
              accept: ["photo identification", "identification"],
              evidence: {
                ref: "L2-S1-T19",
                quote: "You must show your photo identification and sign the freight release voucher."
              },
              explanationVi: "Người nhận phải xuất trình giấy tờ tuỳ thân có ảnh (photo identification) -> đáp án là 'photo identification'."
            },
            {
              q: 10,
              type: "gap_fill",
              wordLimit: "TWO_WORDS_ONLY",
              stem: "The recipient must also sign a freight {{gap}} upon delivery.",
              answer: "release voucher",
              accept: ["release voucher", "voucher"],
              evidence: {
                ref: "L2-S1-T19",
                quote: "and sign the freight release voucher."
              },
              explanationVi: "Marcus phải ký vào phiếu bàn giao hàng hóa (freight release voucher) -> đáp án là 'release voucher'."
            }
          ]
        }
      ]
    },
    {
      id: "ie-ac-ls-02-s2",
      sectionIndex: 2,
      qRange: [11, 20],
      contextType: "social_monologue",
      title: "Section 2 — Westbridge Civic Hub Ground Floor Reopening Tour",
      topic: "Community library innovation, maker spaces, and floor plan labelling",
      targetBand: "6.0–6.5",
      audioUrl: null,
      preReadPauseMs: 4500,
      postCheckPauseMs: 3000,
      speakers: [
        {
          speakerId: "spk_gary",
          label: "Gary (Hub Manager)",
          gender: "male",
          accentPref: ["en-AU"],
          pitch: 0.97,
          rateMultiplier: 1.0
        }
      ],
      turns: [
        {
          turnId: "L2-S2-T01",
          speakerId: "spk_gary",
          text: "Good morning and welcome to the preview tour of the newly redesigned Westbridge Civic Hub. My name is Gary, and I oversee community operations here.",
          pauseAfterMs: 450
        },
        {
          turnId: "L2-S2-T02",
          speakerId: "spk_gary",
          text: "Following our sixteen-month refurbishment, our ground floor has transitioned from a traditional book-borrowing depot into an active civic laboratory supporting digital literacy, collaborative enterprise, and hands-on repair.",
          pauseAfterMs: 500
        },
        {
          turnId: "L2-S2-T03",
          speakerId: "spk_gary",
          text: "Please orient your floor plan diagrams. We are currently gathered at the Main Street entrance lobby at the southern base of the layout.",
          pauseAfterMs: 500
        },
        {
          turnId: "L2-S2-T04",
          speakerId: "spk_gary",
          text: "Directly opposite the entrance doors, the curved central counter marked B is the Self-Service Check-in Station, where users can return loans and collect reserved materials using automated RFID scanners.",
          pauseAfterMs: 500
        },
        {
          turnId: "L2-S2-T05",
          speakerId: "spk_gary",
          text: "To the left of the lobby along the western wall, the acoustic-insulated suite labelled A is our Community Podcast Studio, equipped with four broadcast microphones and digital mixing boards.",
          pauseAfterMs: 500
        },
        {
          turnId: "L2-S2-T06",
          speakerId: "spk_gary",
          text: "Moving past the podcast studio into the northwest corner, location E is the 3D Prototyping Workshop, housing six resin printers and a computer-guided laser cutter.",
          pauseAfterMs: 500
        },
        {
          turnId: "L2-S2-T07",
          speakerId: "spk_gary",
          text: "In the central northern corridor right between the restrooms, location F is our Tool Lending Library, where residents can borrow household drills, saws, and gardening implements.",
          pauseAfterMs: 500
        },
        {
          turnId: "L2-S2-T08",
          speakerId: "spk_gary",
          text: "Finally, nestled in the quiet northeast corner at location H, we have preserved our Local History Archive, containing historic city maps, census microfilm, and rare municipal photographs.",
          pauseAfterMs: 550
        },
        {
          turnId: "L2-S2-T09",
          speakerId: "spk_gary",
          text: "Now, let me clarify access conditions and reservation policies for our five specialized community spaces.",
          pauseAfterMs: 450
        },
        {
          turnId: "L2-S2-T10",
          speakerId: "spk_gary",
          text: "For the Podcast Studio, because high demand is anticipated from freelance journalists and school groups, access requires advance online booking at least twenty-four hours ahead.",
          pauseAfterMs: 500
        },
        {
          turnId: "L2-S2-T11",
          speakerId: "spk_gary",
          text: "The 3D Prototyping Workshop, due to heat and chemical risks associated with resin curing, requires completion of a mandatory safety certification workshop before access is granted.",
          pauseAfterMs: 500
        },
        {
          turnId: "L2-S2-T12",
          speakerId: "spk_gary",
          text: "The Tool Lending Library operates on a community trust model: borrowing is free for members, but borrowers must present verified proof of residential address within the municipal boundary.",
          pauseAfterMs: 500
        },
        {
          turnId: "L2-S2-T13",
          speakerId: "spk_gary",
          text: "The Local History Archive contains delicate 19th-century materials; access is available by appointment only under the supervision of our archivist.",
          pauseAfterMs: 500
        },
        {
          turnId: "L2-S2-T14",
          speakerId: "spk_gary",
          text: "Lastly, our Repair Café workspace in the eastern atrium is completely walk-in friendly with no advance booking required—just bring your broken appliances on Saturday mornings!",
          pauseAfterMs: 500
        }
      ],
      questionGroups: [
        {
          groupId: "ie-ac-ls-02-g3",
          type: "diagram_label",
          inputMode: "select_letter",
          qRange: [11, 15],
          instructionEn: "Questions 11–15: Label the plan below. Choose the correct letter, A–H, for each facility.",
          instructionVi: "Điền nhãn mặt bằng Trung tâm Westbridge. Chọn chữ cái đúng (A–H) cho từng khu vực chức năng.",
          svgMarkup: `<svg viewBox="0 0 520 300" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;font-family:sans-serif;background:#fafaf9;border-radius:8px;border:1px solid #d6d3d1;">
            <rect x="10" y="10" width="500" height="280" fill="#f5f5f4" stroke="#44403c" stroke-width="2"/>
            <rect x="210" y="250" width="100" height="40" fill="#e7e5e4" stroke="#78716c"/>
            <text x="260" y="275" font-size="12" font-weight="bold" text-anchor="middle" fill="#1c1917">Main Entrance</text>
            <path d="M 230 190 Q 260 170 290 190" fill="none" stroke="#ea580c" stroke-width="4"/>
            <text x="260" y="210" font-size="12" font-weight="bold" text-anchor="middle" fill="#c2410c">[B]</text>
            <rect x="20" y="160" width="90" height="60" fill="#fed7aa" stroke="#ea580c"/>
            <text x="65" y="195" font-size="12" font-weight="bold" text-anchor="middle" fill="#c2410c">[A]</text>
            <rect x="20" y="20" width="90" height="70" fill="#fed7aa" stroke="#ea580c"/>
            <text x="65" y="60" font-size="12" font-weight="bold" text-anchor="middle" fill="#c2410c">[E]</text>
            <rect x="220" y="20" width="80" height="50" fill="#fed7aa" stroke="#ea580c"/>
            <text x="260" y="50" font-size="12" font-weight="bold" text-anchor="middle" fill="#c2410c">[F]</text>
            <rect x="400" y="20" width="100" height="70" fill="#fed7aa" stroke="#ea580c"/>
            <text x="450" y="60" font-size="12" font-weight="bold" text-anchor="middle" fill="#c2410c">[H]</text>
            <circle cx="150" cy="110" r="14" fill="#e7e5e4" stroke="#78716c"/><text x="150" y="115" font-size="10" text-anchor="middle">[C]</text>
            <circle cx="360" cy="110" r="14" fill="#e7e5e4" stroke="#78716c"/><text x="360" y="115" font-size="10" text-anchor="middle">[D]</text>
            <circle cx="440" cy="180" r="14" fill="#e7e5e4" stroke="#78716c"/><text x="440" y="185" font-size="10" text-anchor="middle">[G]</text>
          </svg>`,
          sharedOptions: [
            { key: "A", text: "Facility A" },
            { key: "B", text: "Facility B" },
            { key: "C", text: "Facility C" },
            { key: "D", text: "Facility D" },
            { key: "E", text: "Facility E" },
            { key: "F", text: "Facility F" },
            { key: "G", text: "Facility G" },
            { key: "H", text: "Facility H" }
          ],
          questions: [
            {
              q: 11,
              type: "diagram_label",
              stem: "Self-Service Check-in Station",
              answer: "B",
              accept: ["B"],
              evidence: {
                ref: "L2-S2-T04",
                quote: "Directly opposite the entrance doors, the curved central counter marked B is the Self-Service Check-in Station..."
              },
              explanationVi: "Đối diện trực tiếp cửa ra vào chính là quầy cong tự phục vụ tại vị trí B -> B."
            },
            {
              q: 12,
              type: "diagram_label",
              stem: "Community Podcast Studio",
              answer: "A",
              accept: ["A"],
              evidence: {
                ref: "L2-S2-T05",
                quote: "To the left of the lobby along the western wall, the acoustic-insulated suite labelled A is our Community Podcast Studio..."
              },
              explanationVi: "Bên trái sảnh dọc theo tường phía tây là phòng thu podcast cách âm tại vị trí A -> A."
            },
            {
              q: 13,
              type: "diagram_label",
              stem: "3D Prototyping Workshop",
              answer: "E",
              accept: ["E"],
              evidence: {
                ref: "L2-S2-T06",
                quote: "Moving past the podcast studio into the northwest corner, location E is the 3D Prototyping Workshop..."
              },
              explanationVi: "Tại góc tây bắc sau phòng podcast là xưởng chế tạo mô hình 3D tại vị trí E -> E."
            },
            {
              q: 14,
              type: "diagram_label",
              stem: "Tool Lending Library",
              answer: "F",
              accept: ["F"],
              evidence: {
                ref: "L2-S2-T07",
                quote: "In the central northern corridor right between the restrooms, location F is our Tool Lending Library..."
              },
              explanationVi: "Tại hành lang phía bắc chính giữa là thư viện mượn dụng cụ tại vị trí F -> F."
            },
            {
              q: 15,
              type: "diagram_label",
              stem: "Local History Archive",
              answer: "H",
              accept: ["H"],
              evidence: {
                ref: "L2-S2-T08",
                quote: "nestled in the quiet northeast corner at location H, we have preserved our Local History Archive..."
              },
              explanationVi: "Tại góc đông bắc yên tĩnh là Kho lưu trữ lịch sử địa phương tại vị trí H -> H."
            }
          ]
        },
        {
          groupId: "ie-ac-ls-02-g4",
          type: "matching_features",
          qRange: [16, 20],
          instructionEn: "Questions 16–20: What condition applies to using each facility? Choose FIVE answers from the box and write the correct letter, A–G, next to Questions 16–20.",
          instructionVi: "Ghép điều kiện sử dụng (A–G) với từng tiện ích cộng đồng (16–20).",
          sharedOptions: [
            { key: "A", text: "Requires advance online booking 24 hours ahead" },
            { key: "B", text: "Requires safety certification workshop completion" },
            { key: "C", text: "Requires verified proof of local residential address" },
            { key: "D", text: "By appointment only under staff supervision" },
            { key: "E", text: "Walk-in access with no booking required" },
            { key: "F", text: "Restricted exclusively to registered commercial businesses" },
            { key: "G", text: "Requires payment of an hourly commercial hire fee" }
          ],
          questions: [
            {
              q: 16,
              type: "matching_features",
              stem: "Podcast Studio",
              answer: "A",
              accept: ["A"],
              evidence: {
                ref: "L2-S2-T10",
                quote: "For the Podcast Studio... access requires advance online booking at least twenty-four hours ahead."
              },
              explanationVi: "Phòng podcast yêu cầu đặt trước trực tuyến tối thiểu 24 giờ -> A."
            },
            {
              q: 17,
              type: "matching_features",
              stem: "3D Prototyping Workshop",
              answer: "B",
              accept: ["B"],
              evidence: {
                ref: "L2-S2-T11",
                quote: "requires completion of a mandatory safety certification workshop before access is granted."
              },
              explanationVi: "Xưởng in 3D yêu cầu hoàn thành khoá học chứng chỉ an toàn -> B."
            },
            {
              q: 18,
              type: "matching_features",
              stem: "Tool Lending Library",
              answer: "C",
              accept: ["C"],
              evidence: {
                ref: "L2-S2-T12",
                quote: "borrowers must present verified proof of residential address within the municipal boundary."
              },
              explanationVi: "Mượn dụng cụ yêu cầu xuất trình giấy tờ xác minh địa chỉ cư trú địa phương -> C."
            },
            {
              q: 19,
              type: "matching_features",
              stem: "Local History Archive",
              answer: "D",
              accept: ["D"],
              evidence: {
                ref: "L2-S2-T13",
                quote: "access is available by appointment only under the supervision of our archivist."
              },
              explanationVi: "Kho lịch sử chỉ mở theo lịch hẹn dưới sự giám sát của cán bộ lưu trữ -> D."
            },
            {
              q: 20,
              type: "matching_features",
              stem: "Repair Café workspace",
              answer: "E",
              accept: ["E"],
              evidence: {
                ref: "L2-S2-T14",
                quote: "our Repair Café workspace in the eastern atrium is completely walk-in friendly with no advance booking required..."
              },
              explanationVi: "Khu vực quán cà phê sửa chữa đồ dùng mở tự do không cần đặt chỗ trước -> E."
            }
          ]
        }
      ]
    },
    {
      id: "ie-ac-ls-02-s3",
      sectionIndex: 3,
      qRange: [21, 30],
      contextType: "educational_discussion",
      title: "Section 3 — Rotating Watch Shift Cycles and Merchant Mariner Sleep Fragmentation",
      topic: "Occupational circadian rhythms, maritime actigraphy data, and research methodology",
      targetBand: "6.5–7.5",
      audioUrl: null,
      preReadPauseMs: 4500,
      postCheckPauseMs: 3000,
      speakers: [
        {
          speakerId: "spk_elena",
          label: "Elena Ramos (Researcher)",
          gender: "female",
          accentPref: ["en-GB"],
          pitch: 1.03,
          rateMultiplier: 1.0
        },
        {
          speakerId: "spk_sam",
          label: "Sam Cooper (Researcher)",
          gender: "male",
          accentPref: ["en-US"],
          pitch: 0.96,
          rateMultiplier: 1.0
        }
      ],
      turns: [
        {
          turnId: "L2-S3-T01",
          speakerId: "spk_elena",
          text: "Sam, let's analyze the raw actigraphy data from our maritime study tracking sleep patterns of navigation bridge officers on container vessels.",
          pauseAfterMs: 450
        },
        {
          turnId: "L2-S3-T02",
          speakerId: "spk_sam",
          text: "Great. Looking at the four-hours-on, eight-hours-off watch schedule, what immediately jumped out was the severity of sleep fragmentation.",
          pauseAfterMs: 450
        },
        {
          turnId: "L2-S3-T03",
          speakerId: "spk_elena",
          text: "Exactly. Although watch officers officially had two four-hour rest intervals every twenty-four hours, their actual consolidated sleep rarely exceeded two and a half hours per window.",
          pauseAfterMs: 500
        },
        {
          turnId: "L2-S3-T04",
          speakerId: "spk_sam",
          text: "What did you conclude regarding cognitive micro-sleeps during the graveyard watch between midnight and 4 am?",
          pauseAfterMs: 450
        },
        {
          turnId: "L2-S3-T05",
          speakerId: "spk_elena",
          text: "Our infrared pupillometry data confirmed that officers experienced brief cognitive dropouts averaging three to six seconds, predominantly occurring during calm, low-traffic sea crossings.",
          pauseAfterMs: 500
        },
        {
          turnId: "L2-S3-T06",
          speakerId: "spk_sam",
          text: "And how did the six-hours-on, six-hours-off cycle compare in our comparative dataset?",
          pauseAfterMs: 450
        },
        {
          turnId: "L2-S3-T07",
          speakerId: "spk_elena",
          text: "Interestingly, the six-and-six rotation resulted in significantly higher cumulative sleep debt by day ten, because daylight interruptions during the daytime off-duty window prevented restorative REM sleep.",
          pauseAfterMs: 500
        },
        {
          turnId: "L2-S3-T08",
          speakerId: "spk_sam",
          text: "What about the limitation of our participant demographic?",
          pauseAfterMs: 400
        },
        {
          turnId: "L2-S3-T09",
          speakerId: "spk_elena",
          text: "Our entire sample consisted of experienced senior captains and first mates over forty-five. We need to acknowledge that younger cadet crew might exhibit different circadian tolerance.",
          pauseAfterMs: 500
        },
        {
          turnId: "L2-S3-T10",
          speakerId: "spk_sam",
          text: "Now, let's review the four-stage flowchart for cleaning the raw wrist actigraphy sensor signals before writing our dissertation methodology chapter.",
          pauseAfterMs: 500
        },
        {
          turnId: "L2-S3-T11",
          speakerId: "spk_sam",
          text: "Stage one: the accelerometer logs raw physical acceleration across three axes at thirty hertz.",
          pauseAfterMs: 450
        },
        {
          turnId: "L2-S3-T12",
          speakerId: "spk_elena",
          text: "Right. Then in stage two, we apply a digital high-pass filter to remove continuous background vibrations caused by the vessel's diesel engine.",
          pauseAfterMs: 500
        },
        {
          turnId: "L2-S3-T13",
          speakerId: "spk_sam",
          text: "Stage three is scoring algorithm classification: our custom script marks each sixty-second epoch as either sleep, wakefulness, or sensor non-wear.",
          pauseAfterMs: 500
        },
        {
          turnId: "L2-S3-T14",
          speakerId: "spk_elena",
          text: "And stage four is cross-referencing: we validate the automated sleep onset scores against the mariners' handwritten logbook entries to eliminate discrepancies.",
          pauseAfterMs: 500
        },
        {
          turnId: "L2-S3-T15",
          speakerId: "spk_sam",
          text: "That four-stage pipeline is rigorous and reproducible. Let's start compiling the figures.",
          pauseAfterMs: 500
        }
      ],
      questionGroups: [
        {
          groupId: "ie-ac-ls-02-g5",
          type: "mcq_single",
          qRange: [21, 26],
          instructionEn: "Questions 21–26: Choose the correct letter, A, B or C.",
          instructionVi: "Chọn chữ cái đúng nhất A, B hoặc C.",
          questions: [
            {
              q: 21,
              type: "mcq_single",
              stem: "Under the standard 4-on, 8-off watch schedule, officers' consolidated sleep per rest window rarely exceeded",
              options: [
                { key: "A", text: "one hour." },
                { key: "B", text: "two and a half hours." },
                { key: "C", text: "three and three-quarter hours." }
              ],
              answer: "B",
              accept: ["B"],
              evidence: {
                ref: "L2-S3-T03",
                quote: "their actual consolidated sleep rarely exceeded two and a half hours per window."
              },
              explanationVi: "Elena chỉ ra giấc ngủ liền mạch thực tế hiếm khi vượt quá 2,5 giờ mỗi đợt nghỉ -> B."
            },
            {
              q: 22,
              type: "mcq_single",
              stem: "Infrared pupillometry demonstrated that micro-sleep dropouts occurred primarily during",
              options: [
                { key: "A", text: "harbour berthing maneuvers." },
                { key: "B", text: "calm, low-traffic sea crossings." },
                { key: "C", text: "rough stormy weather transits." }
              ],
              answer: "B",
              accept: ["B"],
              evidence: {
                ref: "L2-S3-T05",
                quote: "predominantly occurring during calm, low-traffic sea crossings."
              },
              explanationVi: "Hiện tượng chợp mắt vô thức (micro-sleeps) xảy ra chủ yếu khi hải trình êm đềm, ít tàu bè -> B."
            },
            {
              q: 23,
              type: "mcq_single",
              stem: "Why did the 6-on, 6-off rotation cause greater cumulative sleep debt?",
              options: [
                { key: "A", text: "Watch officers skipped meals to sleep longer." },
                { key: "B", text: "Daylight interruptions prevented restorative REM sleep." },
                { key: "C", text: "The emergency alarm sounded at unexpected hours." }
              ],
              answer: "B",
              accept: ["B"],
              evidence: {
                ref: "L2-S3-T07",
                quote: "because daylight interruptions during the daytime off-duty window prevented restorative REM sleep."
              },
              explanationVi: "Ánh sáng ban ngày làm gián đoạn giấc ngủ mắt đảo nhanh (REM sleep) hồi phục thể lực -> B."
            },
            {
              q: 24,
              type: "mcq_single",
              stem: "What limitation in the study's participant demographic did Elena highlight?",
              options: [
                { key: "A", text: "All participants were senior officers aged over forty-five." },
                { key: "B", text: "Officers had no prior experience on commercial container ships." },
                { key: "C", text: "The sample included only coastal ferry personnel." }
              ],
              answer: "A",
              accept: ["A"],
              evidence: {
                ref: "L2-S3-T09",
                quote: "Our entire sample consisted of experienced senior captains and first mates over forty-five."
              },
              explanationVi: "Mẫu nghiên cứu chỉ gồm thuyền trưởng và đại phó dày dạn kinh nghiệm trên 45 tuổi -> A."
            },
            {
              q: 25,
              type: "mcq_single",
              stem: "The high-pass digital filter in stage two was designed to eliminate",
              options: [
                { key: "A", text: "electromagnetic noise from satellite radar." },
                { key: "B", text: "background vibrations from the vessel's diesel engine." },
                { key: "C", text: "sudden motion spikes from sea wave swells." }
              ],
              answer: "B",
              accept: ["B"],
              evidence: {
                ref: "L2-S3-T12",
                quote: "to remove continuous background vibrations caused by the vessel's diesel engine."
              },
              explanationVi: "Bộ lọc thông cao kỹ thuật số loại bỏ rung động nền liên tục do động cơ diesel của tàu gây ra -> B."
            },
            {
              q: 26,
              type: "mcq_single",
              stem: "Automated actigraphy sleep scoring was finally validated by comparing it against",
              options: [
                { key: "A", text: "handwritten mariner logbook entries." },
                { key: "B", text: "bridge closed-circuit video recordings." },
                { key: "C", text: "salivary cortisol hormone swabs." }
              ],
              answer: "A",
              accept: ["A"],
              evidence: {
                ref: "L2-S3-T14",
                quote: "we validate the automated sleep onset scores against the mariners' handwritten logbook entries..."
              },
              explanationVi: "Dữ liệu được đối chiếu thẩm định với nhật ký giấc ngủ viết tay của các thuỷ thủ -> A."
            }
          ]
        },
        {
          groupId: "ie-ac-ls-02-g6",
          type: "gap_fill",
          subType: "flowchart_completion",
          wordLimit: "ONE_WORD_ONLY",
          wordLimitLabel: "ONE WORD ONLY",
          qRange: [27, 30],
          instructionEn: "Questions 27–30: Complete the flowchart below. Write ONE WORD ONLY for each answer.",
          instructionVi: "Hoàn thành lưu đồ quy trình xử lý dữ liệu cảm biến cổ tay bên dưới. Viết DUY NHẤT MỘT TỪ cho mỗi ô trống.",
          contextTitle: "Four-Stage Wrist Actigraphy Signal Pipeline",
          questions: [
            {
              q: 27,
              type: "gap_fill",
              wordLimit: "ONE_WORD_ONLY",
              stem: "Stage 1: Accelerometers record tri-axial {{gap}} at thirty hertz.",
              answer: "acceleration",
              accept: ["acceleration"],
              evidence: {
                ref: "L2-S3-T11",
                quote: "the accelerometer logs raw physical acceleration across three axes at thirty hertz."
              },
              explanationVi: "Cảm biến gia tốc ghi nhận gia tốc vật lý thô (raw physical acceleration) -> đáp án là 'acceleration'."
            },
            {
              q: 28,
              type: "gap_fill",
              wordLimit: "ONE_WORD_ONLY",
              stem: "Stage 2: Application of a digital {{gap}} to strip away ship vibration noise.",
              answer: "filter",
              accept: ["filter"],
              evidence: {
                ref: "L2-S3-T12",
                quote: "we apply a digital high-pass filter to remove continuous background vibrations..."
              },
              explanationVi: "Áp dụng bộ lọc kỹ thuật số (digital filter) để lọc tiếng ồn rung động -> từ cần điền là 'filter'."
            },
            {
              q: 29,
              type: "gap_fill",
              wordLimit: "ONE_WORD_ONLY",
              stem: "Stage 3: Automated algorithm classifies each 60-second {{gap}} into behavioral states.",
              answer: "epoch",
              accept: ["epoch"],
              evidence: {
                ref: "L2-S3-T13",
                quote: "our custom script marks each sixty-second epoch as either sleep, wakefulness, or sensor non-wear."
              },
              explanationVi: "Thuật toán phân loại từng chu kỳ 60 giây (sixty-second epoch) -> đáp án là 'epoch'."
            },
            {
              q: 30,
              type: "gap_fill",
              wordLimit: "ONE_WORD_ONLY",
              stem: "Stage 4: Validation against handwritten logs to resolve any {{gap}}.",
              answer: "discrepancies",
              accept: ["discrepancies", "discrepancy"],
              evidence: {
                ref: "L2-S3-T14",
                quote: "against the mariners' handwritten logbook entries to eliminate discrepancies."
              },
              explanationVi: "Đối chiếu nhật ký để giải quyết triệt để các điểm sai lệch (discrepancies) -> đáp án là 'discrepancies'."
            }
          ]
        }
      ]
    },
    {
      id: "ie-ac-ls-02-s4",
      sectionIndex: 4,
      qRange: [31, 40],
      contextType: "academic_monologue",
      title: "Section 4 — Bioluminescent Signalling and Counter-Illumination in Deep-Sea Benthic Ecosystems",
      topic: "Deep ocean photophores, bacterial symbiosis, optical camouflage, and biosensor technology",
      targetBand: "7.5–9.0",
      audioUrl: null,
      preReadPauseMs: 5000,
      postCheckPauseMs: 4000,
      speakers: [
        {
          speakerId: "spk_torres",
          label: "Dr Karen Torres (Marine Biologist)",
          gender: "female",
          accentPref: ["en-US"],
          pitch: 1.01,
          rateMultiplier: 1.0
        }
      ],
      turns: [
        {
          turnId: "L2-S4-T01",
          speakerId: "spk_torres",
          text: "Welcome to Marine Biology 402. Today our focus turns to the bathypelagic and benthic zones of the deep ocean—environments devoid of solar penetration, where bioluminescence serves as the universal currency of visual communication.",
          pauseAfterMs: 450
        },
        {
          turnId: "L2-S4-T02",
          speakerId: "spk_torres",
          text: "Bioluminescence is fundamentally a biochemical emission of cold light, produced when the enzyme luciferase catalyzes the oxidation of a pigment molecule called luciferin in the presence of adenosine triphosphate.",
          pauseAfterMs: 500
        },
        {
          turnId: "L2-S4-T03",
          speakerId: "spk_torres",
          text: "In deep oceanic waters, over seventy percent of bioluminescent emissions occur within the blue-green spectrum, centering around 470 nanometers. This optical wavelength is optimal because blue light penetrates furthest through clear saltwater while matching the visual sensitivity peaks of most benthic predators.",
          pauseAfterMs: 550
        },
        {
          turnId: "L2-S4-T04",
          speakerId: "spk_torres",
          text: "Organisms produce biological light through two distinct evolutionary mechanisms: intrinsic synthesis within specialized glandular cells, or mutualistic symbiosis with luminous bacteria harboured in dedicated organ chambers called photophores.",
          pauseAfterMs: 500
        },
        {
          turnId: "L2-S4-T05",
          speakerId: "spk_torres",
          text: "Among benthic teleost fishes and cephalopods, the most widespread defensive adaptation is counter-illumination. In the twilight mesopelagic zone, predators hunt by swimming beneath prey, scanning upward for silhouettes cast against downwelling daylight.",
          pauseAfterMs: 550
        },
        {
          turnId: "L2-S4-T06",
          speakerId: "spk_torres",
          text: "To eliminate this telltale shadow, midwater squid and hatchetfish possess dense arrays of ventral photophores. By continually adjusting the intensity and color spectrum of their downward light to match downwelling ambient light, the animal renders its silhouette completely invisible to upward-looking predators below.",
          pauseAfterMs: 550
        },
        {
          turnId: "L2-S4-T07",
          speakerId: "spk_torres",
          text: "A second critical defensive tactic is the release of a luminous decoy cloud. When threatened by anglerfish, deep-sea shrimp of the genus Acanthephyra eject a glowing cloud of blue mucus from their antennal glands, temporarily blinding the predator's sensitive retinal cells and creating a sensory distraction that enables the shrimp to dart away.",
          pauseAfterMs: 550
        },
        {
          turnId: "L2-S4-T08",
          speakerId: "spk_torres",
          text: "Bioluminescent signaling also plays an indispensable role in reproductive synchrony. Benthic brittle stars and polychaete fireworms coordinate mass broadcast spawning through pulsed rhythmic flashes, ensuring gamete fertilization across sparsely populated seafloor plains.",
          pauseAfterMs: 500
        },
        {
          turnId: "L2-S4-T09",
          speakerId: "spk_torres",
          text: "In contemporary biotechnology, the enzymatic machinery of marine bioluminescence has inspired revolutionary analytical tools. Synthetic biologists insert cloned bacterial luciferase genes into aquatic bio-reporter organisms.",
          pauseAfterMs: 500
        },
        {
          turnId: "L2-S4-T10",
          speakerId: "spk_torres",
          text: "When exposed to toxic heavy metals such as cadmium or industrial mercury, these engineered cellular sensors modulate their light output, providing an instantaneous, reagent-free optical monitoring system for municipal water supplies.",
          pauseAfterMs: 550
        },
        {
          turnId: "L2-S4-T11",
          speakerId: "spk_torres",
          text: "In our laboratory practical tomorrow, we will calibrate photon detectors against purified crustacean luciferase. Review chapter 14 beforehand.",
          pauseAfterMs: 500
        }
      ],
      questionGroups: [
        {
          groupId: "ie-ac-ls-02-g7",
          type: "gap_fill",
          subType: "note_completion",
          wordLimit: "ONE_WORD_ONLY",
          wordLimitLabel: "ONE WORD ONLY",
          qRange: [31, 36],
          instructionEn: "Questions 31–36: Complete the notes below. Write ONE WORD ONLY for each answer.",
          instructionVi: "Hoàn thành các ghi chú bài giảng dưới đây. Viết DUY NHẤT MỘT TỪ cho mỗi chỗ trống.",
          contextTitle: "Deep-Sea Bioluminescent Signalling Mechanisms",
          questions: [
            {
              q: 31,
              type: "gap_fill",
              wordLimit: "ONE_WORD_ONLY",
              stem: "Reaction requires luciferase enzyme and oxidation of {{gap}}",
              answer: "luciferin",
              accept: ["luciferin"],
              evidence: {
                ref: "L2-S4-T02",
                quote: "produced when the enzyme luciferase catalyzes the oxidation of a pigment molecule called luciferin..."
              },
              explanationVi: "Phản ứng sinh hoá đòi hỏi enzym luciferase oxy hoá phân tử sắc tố luciferin -> đáp án là 'luciferin'."
            },
            {
              q: 32,
              type: "gap_fill",
              wordLimit: "ONE_WORD_ONLY",
              stem: "Emissions peak in the {{gap}} spectrum around 470 nanometers.",
              answer: "blue-green",
              accept: ["blue-green"],
              evidence: {
                ref: "L2-S4-T03",
                quote: "over seventy percent of bioluminescent emissions occur within the blue-green spectrum, centering around 470 nanometers."
              },
              explanationVi: "Phát xạ tập trung trong dải phổ xanh lam - xanh lục (blue-green) -> từ cần điền là 'blue-green' (tính là 1 từ ghép)."
            },
            {
              q: 33,
              type: "gap_fill",
              wordLimit: "ONE_WORD_ONLY",
              stem: "Luminous bacterial symbionts live in specialized chambers termed {{gap}}",
              answer: "photophores",
              accept: ["photophores", "photophore"],
              evidence: {
                ref: "L2-S4-T04",
                quote: "or mutualistic symbiosis with luminous bacteria harboured in dedicated organ chambers called photophores."
              },
              explanationVi: "Các vi khuẩn phát sáng sống cộng sinh trong cơ quan phát sáng gọi là photophores -> đáp án là 'photophores'."
            },
            {
              q: 34,
              type: "gap_fill",
              wordLimit: "ONE_WORD_ONLY",
              stem: "Counter-illumination conceals the animal's dark {{gap}} from predators below.",
              answer: "silhouette",
              accept: ["silhouette"],
              evidence: {
                ref: "L2-S4-T06",
                quote: "the animal renders its silhouette completely invisible to upward-looking predators below."
              },
              explanationVi: "Cơ chế phát sáng ngược làm biến mất chiếc bóng đen (silhouette) của con mồi -> đáp án là 'silhouette'."
            },
            {
              q: 35,
              type: "gap_fill",
              wordLimit: "ONE_WORD_ONLY",
              stem: "Deep-sea shrimp discharge a glowing cloud of {{gap}} to confuse predators.",
              answer: "mucus",
              accept: ["mucus"],
              evidence: {
                ref: "L2-S4-T07",
                quote: "deep-sea shrimp of the genus Acanthephyra eject a glowing cloud of blue mucus from their antennal glands..."
              },
              explanationVi: "Tôm biển sâu phun ra đám mây chất nhầy (mucus) phát sáng màu xanh để đánh lạc hướng kẻ săn mồi -> đáp án là 'mucus'."
            },
            {
              q: 36,
              type: "gap_fill",
              wordLimit: "ONE_WORD_ONLY",
              stem: "Seafloor worms synchronize mass broadcast {{gap}} through flashing signals.",
              answer: "spawning",
              accept: ["spawning"],
              evidence: {
                ref: "L2-S4-T08",
                quote: "Benthic brittle stars and polychaete fireworms coordinate mass broadcast spawning through pulsed rhythmic flashes..."
              },
              explanationVi: "Động vật đáy biển đồng bộ hoá việc sinh sản đẻ trứng hàng loạt (broadcast spawning) bằng tín hiệu nhấp nháy -> đáp án là 'spawning'."
            }
          ]
        },
        {
          groupId: "ie-ac-ls-02-g8",
          type: "gap_fill",
          subType: "sentence_completion",
          wordLimit: "ONE_WORD_OR_NUMBER",
          wordLimitLabel: "ONE WORD AND/OR A NUMBER",
          qRange: [37, 40],
          instructionEn: "Questions 37–40: Complete the sentences below. Write ONE WORD AND/OR A NUMBER for each answer.",
          instructionVi: "Hoàn thành các câu sau về ứng dụng công nghệ sinh học. Viết DUY NHẤT MỘT TỪ VÀ/HOẶC MỘT CON SỐ cho mỗi câu.",
          questions: [
            {
              q: 37,
              type: "gap_fill",
              wordLimit: "ONE_WORD_OR_NUMBER",
              stem: "Over {{gap}} percent of ocean bioluminescence is blue-green light.",
              answer: "70",
              accept: ["70", "seventy"],
              evidence: {
                ref: "L2-S4-T03",
                quote: "over seventy percent of bioluminescent emissions occur within the blue-green spectrum..."
              },
              explanationVi: "Hơn 70% ánh sáng phát quang sinh học đại dương là ánh sáng xanh lam - xanh lục -> đáp án là '70' (hoặc 'seventy')."
            },
            {
              q: 38,
              type: "gap_fill",
              wordLimit: "ONE_WORD_OR_NUMBER",
              stem: "Counter-illumination photophores are located on the {{gap}} surface of fish.",
              answer: "ventral",
              accept: ["ventral"],
              evidence: {
                ref: "L2-S4-T06",
                quote: "midwater squid and hatchetfish possess dense arrays of ventral photophores."
              },
              explanationVi: "Các cơ quan phát quang chiếu xuống dưới nằm ở phần bụng (ventral photophores) -> đáp án là 'ventral'."
            },
            {
              q: 39,
              type: "gap_fill",
              wordLimit: "ONE_WORD_OR_NUMBER",
              stem: "Bioreporter cells alter light emission when detecting toxic {{gap}} in water.",
              answer: "cadmium",
              accept: ["cadmium"],
              evidence: {
                ref: "L2-S4-T10",
                quote: "When exposed to toxic heavy metals such as cadmium or industrial mercury, these engineered cellular sensors modulate their light output..."
              },
              explanationVi: "Tế bào cảm biến sinh học thay đổi độ phát sáng khi phát hiện kim loại nặng độc hại như cadmi (cadmium) -> đáp án là 'cadmium'."
            },
            {
              q: 40,
              type: "gap_fill",
              wordLimit: "ONE_WORD_OR_NUMBER",
              stem: "Students will calibrate photon detectors against enzymes from a {{gap}} organism.",
              answer: "crustacean",
              accept: ["crustacean"],
              evidence: {
                ref: "L2-S4-T11",
                quote: "we will calibrate photon detectors against purified crustacean luciferase."
              },
              explanationVi: "Sinh viên sẽ hiệu chuẩn máy dò photon với enzym chiết xuất từ loài giáp xác (crustacean luciferase) -> đáp án là 'crustacean'."
            }
          ]
        }
      ]
    }
  ]
};

module.exports = test2;
