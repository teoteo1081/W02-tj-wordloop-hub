/**
 * IELTS Academic Listening Test 1 Data Module
 * ID: ie-ac-ls-01
 * Title: Academic Listening Test 1 — Craft Co-op · Fenland Park · Seaweed Packaging · Dendrochronology
 */

const test1 = {
  id: "ie-ac-ls-01",
  title: "Academic Listening Test 1 — Craft Co-op · Fenland Park · Seaweed Packaging · Dendrochronology",
  fmt: 3,
  module: "academic",
  approxAudioSec: 1680,
  reviewTimeSec: 120,
  totalQuestions: 40,
  sections: [
    {
      id: "ie-ac-ls-01-s1",
      sectionIndex: 1,
      qRange: [1, 10],
      contextType: "social_dialogue",
      title: "Section 1 — Harbourview Craft Cooperative Studio Membership",
      topic: "Community studio booking and weekend pottery kiln safety induction",
      targetBand: "5.0–6.0",
      audioUrl: null,
      preReadPauseMs: 4000,
      postCheckPauseMs: 3000,
      speakers: [
        {
          speakerId: "spk_claire",
          label: "Claire (Coordinator)",
          gender: "female",
          accentPref: ["en-GB", "en-IE"],
          pitch: 1.05,
          rateMultiplier: 1.0
        },
        {
          speakerId: "spk_liam",
          label: "Liam (Applicant)",
          gender: "male",
          accentPref: ["en-AU", "en-NZ"],
          pitch: 0.95,
          rateMultiplier: 1.0
        }
      ],
      turns: [
        {
          turnId: "L1-S1-T01",
          speakerId: "spk_claire",
          text: "Good morning, Harbourview Craft Cooperative. Claire speaking. How can I help you today?",
          pauseAfterMs: 450
        },
        {
          turnId: "L1-S1-T02",
          speakerId: "spk_liam",
          text: "Hello! I'm calling to inquire about applying for a community pottery studio membership and signing up for the kiln safety induction.",
          pauseAfterMs: 450
        },
        {
          turnId: "L1-S1-T03",
          speakerId: "spk_claire",
          text: "Wonderful! I can take down your initial registration details right now over the phone. May I have your full name, please?",
          pauseAfterMs: 450
        },
        {
          turnId: "L1-S1-T04",
          speakerId: "spk_liam",
          text: "Yes, it's Liam Kerrigan. That's spelled K-E-R-R-I-G-A-N.",
          pauseAfterMs: 500
        },
        {
          turnId: "L1-S1-T05",
          speakerId: "spk_claire",
          text: "Thank you, Liam. And what is the best contact telephone number for your file?",
          pauseAfterMs: 450
        },
        {
          turnId: "L1-S1-T06",
          speakerId: "spk_liam",
          text: "My mobile is 555-0148.",
          pauseAfterMs: 500
        },
        {
          turnId: "L1-S1-T07",
          speakerId: "spk_claire",
          text: "555-0148. Perfect. And your current residential address?",
          pauseAfterMs: 450
        },
        {
          turnId: "L1-S1-T08",
          speakerId: "spk_liam",
          text: "I live at 14 Bramble Avenue, in Highfield.",
          pauseAfterMs: 500
        },
        {
          turnId: "L1-S1-T09",
          speakerId: "spk_claire",
          text: "Got it. Bramble Avenue. Now, which membership tier are you looking to join? We have our Standard Associate, or the Unlimited Workshop pass.",
          pauseAfterMs: 450
        },
        {
          turnId: "L1-S1-T10",
          speakerId: "spk_liam",
          text: "I work shifts, so I'll go with the Weekend Studio tier. That covers access on Saturdays and Sundays, right?",
          pauseAfterMs: 500
        },
        {
          turnId: "L1-S1-T11",
          speakerId: "spk_claire",
          text: "That's correct. The Weekend tier is sixty-five pounds per month. In addition, there is a refundable locker deposit of twenty-five pounds if you want a secure space to store your clay and personal tools.",
          pauseAfterMs: 500
        },
        {
          turnId: "L1-S1-T12",
          speakerId: "spk_liam",
          text: "Yes, I will definitely need a locker, please. Twenty-five pounds is very reasonable.",
          pauseAfterMs: 500
        },
        {
          turnId: "L1-S1-T13",
          speakerId: "spk_claire",
          text: "Now, regarding the mandatory kiln safety induction: our next session is scheduled for Saturday the nineteenth of November, starting promptly at ten in the morning.",
          pauseAfterMs: 500
        },
        {
          turnId: "L1-S1-T14",
          speakerId: "spk_liam",
          text: "The nineteenth of November. Yes, that date suits me perfectly.",
          pauseAfterMs: 500
        },
        {
          turnId: "L1-S1-T15",
          speakerId: "spk_claire",
          text: "Splendid. Let me just mention a few required equipment items and studio rules before we finish up. First, for safety reasons in the glazing and wheel areas, all participants must wear leather footwear. Canvas plimsolls or open sandals are strictly prohibited.",
          pauseAfterMs: 550
        },
        {
          turnId: "L1-S1-T16",
          speakerId: "spk_liam",
          text: "Understood, sturdy leather shoes. What about aprons?",
          pauseAfterMs: 450
        },
        {
          turnId: "L1-S1-T17",
          speakerId: "spk_claire",
          text: "We provide communal cotton aprons, but members are strongly encouraged to bring their own heavy denim apron if possible. Also, regarding sculpting supplies: while you can purchase specialty glazes through us, members must provide their own set of wooden modelling tools.",
          pauseAfterMs: 500
        },
        {
          turnId: "L1-S1-T18",
          speakerId: "spk_liam",
          text: "Fine, a wooden toolkit. And how does clay supply work?",
          pauseAfterMs: 450
        },
        {
          turnId: "L1-S1-T19",
          speakerId: "spk_claire",
          text: "To protect our electric kiln heating elements, we only allow members to fire terracotta and stoneware clay that is sourced directly through the cooperative desk.",
          pauseAfterMs: 500
        },
        {
          turnId: "L1-S1-T20",
          speakerId: "spk_liam",
          text: "That makes total sense. Thank you so much, Claire. I'll see you on the nineteenth!",
          pauseAfterMs: 500
        }
      ],
      questionGroups: [
        {
          groupId: "ie-ac-ls-01-g1",
          type: "gap_fill",
          subType: "form_completion",
          wordLimit: "ONE_WORD_OR_NUMBER",
          wordLimitLabel: "ONE WORD AND/OR A NUMBER",
          qRange: [1, 7],
          instructionEn: "Questions 1–7: Complete the form below. Write ONE WORD AND/OR A NUMBER for each answer.",
          instructionVi: "Điền biểu mẫu đăng ký bên dưới. Viết DUY NHẤT MỘT TỪ VÀ/HOẶC MỘT CON SỐ cho mỗi chỗ trống.",
          contextTitle: "HARBOURVIEW CRAFT COOPERATIVE — MEMBERSHIP APPLICATION",
          questions: [
            {
              q: 1,
              type: "gap_fill",
              wordLimit: "ONE_WORD_OR_NUMBER",
              stem: "Applicant surname: {{gap}}",
              answer: "Kerrigan",
              accept: ["Kerrigan", "kerrigan"],
              evidence: {
                ref: "L1-S1-T04",
                quote: "Yes, it's Liam Kerrigan. That's spelled K-E-R-R-I-G-A-N."
              },
              explanationVi: "Liam đánh vần rõ họ của mình là K-E-R-R-I-G-A-N -> đáp án là 'Kerrigan'."
            },
            {
              q: 2,
              type: "gap_fill",
              wordLimit: "ONE_WORD_OR_NUMBER",
              stem: "Contact telephone: {{gap}}",
              answer: "555-0148",
              accept: ["555-0148"],
              evidence: {
                ref: "L1-S1-T06",
                quote: "My mobile is 555-0148."
              },
              explanationVi: "Liam đọc số điện thoại di động là 555-0148 -> đáp án là '555-0148'."
            },
            {
              q: 3,
              type: "gap_fill",
              wordLimit: "ONE_WORD_OR_NUMBER",
              stem: "Street address: 14 {{gap}} Avenue, Highfield",
              answer: "Bramble",
              accept: ["Bramble", "bramble"],
              evidence: {
                ref: "L1-S1-T08",
                quote: "I live at 14 Bramble Avenue, in Highfield."
              },
              explanationVi: "Liam cho biết địa chỉ nhà là 14 Bramble Avenue -> từ cần điền là 'Bramble'."
            },
            {
              q: 4,
              type: "gap_fill",
              wordLimit: "ONE_WORD_OR_NUMBER",
              stem: "Selected membership tier: {{gap}} Studio",
              answer: "Weekend",
              accept: ["Weekend", "weekend"],
              evidence: {
                ref: "L1-S1-T10",
                quote: "I work shifts, so I'll go with the Weekend Studio tier."
              },
              explanationVi: "Liam chọn gói thành viên cuối tuần (Weekend Studio tier) -> đáp án là 'Weekend'."
            },
            {
              q: 5,
              type: "gap_fill",
              wordLimit: "ONE_WORD_OR_NUMBER",
              stem: "Locker refundable deposit: £ {{gap}}",
              answer: "25",
              accept: ["25", "twenty-five"],
              evidence: {
                ref: "L1-S1-T11",
                quote: "In addition, there is a refundable locker deposit of twenty-five pounds if you want a secure space..."
              },
              explanationVi: "Claire nêu khoản tiền đặt cọc tủ khóa có hoàn lại là 25 bảng -> đáp án là '25' (ký hiệu £ đã in sẵn)."
            },
            {
              q: 6,
              type: "gap_fill",
              wordLimit: "ONE_WORD_OR_NUMBER",
              stem: "Induction date: Saturday {{gap}} November",
              answer: "19",
              accept: ["19", "19th", "nineteenth"],
              evidence: {
                ref: "L1-S1-T13",
                quote: "our next session is scheduled for Saturday the nineteenth of November, starting promptly at ten..."
              },
              explanationVi: "Claire cho biết buổi hướng dẫn tiếp theo diễn ra vào thứ Bảy ngày 19 tháng 11 -> đáp án là '19' (hoặc '19th', 'nineteenth')."
            },
            {
              q: 7,
              type: "gap_fill",
              wordLimit: "ONE_WORD_OR_NUMBER",
              stem: "Induction starting time: {{gap}} am",
              answer: "10",
              accept: ["10", "ten", "10:00"],
              evidence: {
                ref: "L1-S1-T13",
                quote: "starting promptly at ten in the morning."
              },
              explanationVi: "Buổi học bắt đầu đúng lúc 10 giờ sáng -> đáp án là '10' (chữ 'am' đã in sẵn)."
            }
          ]
        },
        {
          groupId: "ie-ac-ls-01-g2",
          type: "gap_fill",
          subType: "table_completion",
          wordLimit: "ONE_WORD_ONLY",
          wordLimitLabel: "ONE WORD ONLY",
          qRange: [8, 10],
          instructionEn: "Questions 8–10: Complete the table below. Write ONE WORD ONLY for each answer.",
          instructionVi: "Hoàn thành bảng quy định trang thiết bị studio. Viết DUY NHẤT MỘT TỪ cho mỗi ô trống.",
          contextTitle: "Studio Safety and Equipment Requirements",
          questions: [
            {
              q: 8,
              type: "gap_fill",
              wordLimit: "ONE_WORD_ONLY",
              stem: "Footwear requirement: must be made of {{gap}}",
              answer: "leather",
              accept: ["leather"],
              evidence: {
                ref: "L1-S1-T15",
                quote: "all participants must wear leather footwear. Canvas plimsolls or open sandals are strictly prohibited."
              },
              explanationVi: "Claire yêu cầu mọi người phải đi giày bằng chất liệu da (leather footwear) -> đáp án là 'leather'."
            },
            {
              q: 9,
              type: "gap_fill",
              wordLimit: "ONE_WORD_ONLY",
              stem: "Personal tool set must be {{gap}}",
              answer: "wooden",
              accept: ["wooden"],
              evidence: {
                ref: "L1-S1-T17",
                quote: "members must provide their own set of wooden modelling tools."
              },
              explanationVi: "Claire lưu ý học viên tự mang theo bộ dụng cụ tạo hình bằng gỗ (wooden modelling tools) -> đáp án là 'wooden'."
            },
            {
              q: 10,
              type: "gap_fill",
              wordLimit: "ONE_WORD_ONLY",
              stem: "Approved clay types: terracotta and {{gap}}",
              answer: "stoneware",
              accept: ["stoneware"],
              evidence: {
                ref: "L1-S1-T19",
                quote: "we only allow members to fire terracotta and stoneware clay that is sourced directly through the cooperative desk."
              },
              explanationVi: "Hai loại đất sét được phép nung là đất nung terracotta và đất sét chịu nhiệt stoneware -> từ cần điền là 'stoneware'."
            }
          ]
        }
      ]
    },
    {
      id: "ie-ac-ls-01-s2",
      sectionIndex: 2,
      qRange: [11, 20],
      contextType: "social_monologue",
      title: "Section 2 — Keswick Fenland Park Volunteer Induction",
      topic: "Wetlands reserve orientation, trail safety, and zone map labelling",
      targetBand: "6.0–6.5",
      audioUrl: null,
      preReadPauseMs: 4500,
      postCheckPauseMs: 3000,
      speakers: [
        {
          speakerId: "spk_martin",
          label: "Martin (Senior Ranger)",
          gender: "male",
          accentPref: ["en-GB"],
          pitch: 0.98,
          rateMultiplier: 1.0
        }
      ],
      turns: [
        {
          turnId: "L1-S2-T01",
          speakerId: "spk_martin",
          text: "Welcome to Keswick Fenland Park, everyone! My name is Martin, Senior Reserve Ranger. We're thrilled to welcome our autumn volunteer cohort.",
          pauseAfterMs: 450
        },
        {
          turnId: "L1-S2-T02",
          speakerId: "spk_martin",
          text: "Before we grab waders and divide into work parties, let me share a brief background about this wetland sanctuary. Thirty years ago, this entire four-hundred-hectare basin was commercial peat-mining ground. Following municipal purchase in 1996, the water table was systematically re-established.",
          pauseAfterMs: 500
        },
        {
          turnId: "L1-S2-T03",
          speakerId: "spk_martin",
          text: "Our primary conservation milestone this season is monitoring the return of the bittern, a rare wetland heron whose booming call indicates healthy reedbed ecology. While we initially expected fewer than ten breeding pairs, our acoustic sensors logged over twenty-six active territories last spring.",
          pauseAfterMs: 500
        },
        {
          turnId: "L1-S2-T04",
          speakerId: "spk_martin",
          text: "Regarding volunteer safety: the fen terrain can be deceptively unstable. You must never step off marked boardwalks without checking depth using a wooden measuring pole. Also, if you encounter injured wildlife—especially swans or otters—do not handle them directly. Report the GPS coordinates via the emergency radio on channel 4.",
          pauseAfterMs: 500
        },
        {
          turnId: "L1-S2-T05",
          speakerId: "spk_martin",
          text: "Now, please look at the map of Keswick Fenland Park in your briefing pack. We are currently standing at the North Gate entrance plaza at the very bottom of the map.",
          pauseAfterMs: 500
        },
        {
          turnId: "L1-S2-T06",
          speakerId: "spk_martin",
          text: "Immediately to your right as you enter through the North Gate, the rectangular building labelled A is our Volunteer Tool Shed, where you will collect shovels and gloves.",
          pauseAfterMs: 500
        },
        {
          turnId: "L1-S2-T07",
          speakerId: "spk_martin",
          text: "If you walk straight ahead along the Central Boardwalk from the North Gate, the path splits around the Main Reed Lagoon. Taking the left-hand path that loops around the western shoreline, the circular structure at location C is the Waterfowl Observatory Hide.",
          pauseAfterMs: 500
        },
        {
          turnId: "L1-S2-T08",
          speakerId: "spk_martin",
          text: "Continuing north past the observatory along the Western Dike, you will reach location E across the wooden footbridge. That fenced compound is our Native Flora Nursery, where we propagate aquatic marsh orchids.",
          pauseAfterMs: 500
        },
        {
          turnId: "L1-S2-T09",
          speakerId: "spk_martin",
          text: "Now, if you return to the central split and take the eastern branch of the path heading right, past the willow copse, location G is the Solar Pumping Station that regulates water levels across the marsh.",
          pauseAfterMs: 500
        },
        {
          turnId: "L1-S2-T10",
          speakerId: "spk_martin",
          text: "Further east along the boundary ditch, the small wooden gazebo marked H is the Dragonfly Research Shelter, fitted with weather logging equipment.",
          pauseAfterMs: 500
        },
        {
          turnId: "L1-S2-T11",
          speakerId: "spk_martin",
          text: "Finally, situated right in the center of the Main Lagoon on an artificial island connected by a cable ferry, location D is our Otter Breeding Sanctuary, which remains strictly off-limits to general public visitors.",
          pauseAfterMs: 500
        },
        {
          turnId: "L1-S2-T12",
          speakerId: "spk_martin",
          text: "Alright, let's head over to the tool shed and get geared up!",
          pauseAfterMs: 500
        }
      ],
      questionGroups: [
        {
          groupId: "ie-ac-ls-01-g3",
          type: "mcq_single",
          qRange: [11, 14],
          instructionEn: "Questions 11–14: Choose the correct letter, A, B or C.",
          instructionVi: "Chọn chữ cái đúng nhất A, B hoặc C.",
          questions: [
            {
              q: 11,
              type: "mcq_single",
              stem: "Before municipal purchase in 1996, the reserve land was used for",
              options: [
                { key: "A", text: "intensive sheep grazing." },
                { key: "B", text: "commercial peat mining." },
                { key: "C", text: "timber plantation forestry." }
              ],
              answer: "B",
              accept: ["B"],
              evidence: {
                ref: "L1-S2-T02",
                quote: "Thirty years ago, this entire four-hundred-hectare basin was commercial peat-mining ground."
              },
              explanationVi: "Martin nêu rõ trước năm 1996, toàn bộ khu đất 400 ha này từng là mỏ khai thác than bùn thương mại (commercial peat mining) -> B."
            },
            {
              q: 12,
              type: "mcq_single",
              stem: "Last spring, acoustic sensors recorded over 26 breeding territories of",
              options: [
                { key: "A", text: "bitterns." },
                { key: "B", text: "ospreys." },
                { key: "C", text: "marsh harriers." }
              ],
              answer: "A",
              accept: ["A"],
              evidence: {
                ref: "L1-S2-T03",
                quote: "monitoring the return of the bittern... acoustic sensors logged over twenty-six active territories last spring."
              },
              explanationVi: "Martin cho biết cảm biến ghi nhận hơn 26 vùng lãnh thổ sinh sản của loài chim vạc rạ (bittern) -> A."
            },
            {
              q: 13,
              type: "mcq_single",
              stem: "Volunteers stepping off boardwalks must always check water depth using",
              options: [
                { key: "A", text: "a digital ultrasound sonar probe." },
                { key: "B", text: "a wooden measuring pole." },
                { key: "C", text: "a weighted metal chain." }
              ],
              answer: "B",
              accept: ["B"],
              evidence: {
                ref: "L1-S2-T04",
                quote: "You must never step off marked boardwalks without checking depth using a wooden measuring pole."
              },
              explanationVi: "Martin cảnh báo tình nguyện viên phải luôn dùng cọc đo bằng gỗ (wooden measuring pole) để kiểm tra độ sâu -> B."
            },
            {
              q: 14,
              type: "mcq_single",
              stem: "In the event of finding injured wildlife, volunteers should",
              options: [
                { key: "A", text: "transport the animal to the North Gate immediately." },
                { key: "B", text: "transmit GPS coordinates via two-way radio channel 4." },
                { key: "C", text: "administer emergency first aid using field kits." }
              ],
              answer: "B",
              accept: ["B"],
              evidence: {
                ref: "L1-S2-T04",
                quote: "do not handle them directly. Report the GPS coordinates via the emergency radio on channel 4."
              },
              explanationVi: "Martin yêu cầu không tự ý chạm vào động vật bị thương mà phải báo toạ độ GPS qua kênh radio số 4 -> B."
            }
          ]
        },
        {
          groupId: "ie-ac-ls-01-g4",
          type: "diagram_label",
          inputMode: "select_letter",
          qRange: [15, 20],
          instructionEn: "Questions 15–20: Label the map below. Choose the correct letter, A–I, for each location.",
          instructionVi: "Điền nhãn bản đồ Công viên Đất ngập nước Keswick. Chọn chữ cái đúng (A–I) cho mỗi địa điểm.",
          svgMarkup: `<svg viewBox="0 0 540 320" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;font-family:sans-serif;background:#f0fdf4;border-radius:8px;border:1px solid #86efac;">
            <rect x="10" y="10" width="520" height="300" fill="#f8fafc" stroke="#64748b" stroke-width="1.5"/>
            <rect x="230" y="275" width="80" height="30" fill="#cbd5e1" stroke="#334155" stroke-width="2"/>
            <text x="270" y="295" font-size="12" font-weight="bold" text-anchor="middle" fill="#0f172a">North Gate</text>
            <rect x="340" y="270" width="40" height="30" fill="#fed7aa" stroke="#ea580c"/>
            <text x="360" y="290" font-size="12" font-weight="bold" text-anchor="middle" fill="#c2410c">[A]</text>
            <path d="M 270 275 L 270 210 Q 200 170 170 120 L 170 60" fill="none" stroke="#94a3b8" stroke-width="4" stroke-dasharray="4,2"/>
            <path d="M 270 210 Q 340 170 370 120 L 370 60" fill="none" stroke="#94a3b8" stroke-width="4" stroke-dasharray="4,2"/>
            <ellipse cx="270" cy="140" rx="90" ry="50" fill="#bae6fd" stroke="#0284c7" stroke-width="2"/>
            <text x="270" y="145" font-size="11" text-anchor="middle" fill="#0369a1">Main Reed Lagoon</text>
            <circle cx="270" cy="130" r="14" fill="#86efac" stroke="#16a34a"/>
            <text x="270" y="135" font-size="11" font-weight="bold" text-anchor="middle" fill="#14532d">[D]</text>
            <circle cx="155" cy="140" r="14" fill="#fed7aa" stroke="#ea580c"/>
            <text x="155" y="145" font-size="11" font-weight="bold" text-anchor="middle" fill="#c2410c">[C]</text>
            <rect x="145" y="45" width="45" height="30" fill="#fed7aa" stroke="#ea580c"/>
            <text x="167" y="65" font-size="11" font-weight="bold" text-anchor="middle" fill="#c2410c">[E]</text>
            <rect x="360" y="125" width="40" height="25" fill="#fed7aa" stroke="#ea580c"/>
            <text x="380" y="142" font-size="11" font-weight="bold" text-anchor="middle" fill="#c2410c">[G]</text>
            <circle cx="450" cy="110" r="14" fill="#fed7aa" stroke="#ea580c"/>
            <text x="450" y="115" font-size="11" font-weight="bold" text-anchor="middle" fill="#c2410c">[H]</text>
            <circle cx="90" cy="220" r="12" fill="#e2e8f0" stroke="#94a3b8"/><text x="90" y="225" font-size="10" text-anchor="middle">[B]</text>
            <circle cx="270" cy="35" r="12" fill="#e2e8f0" stroke="#94a3b8"/><text x="270" y="40" font-size="10" text-anchor="middle">[F]</text>
            <circle cx="460" cy="220" r="12" fill="#e2e8f0" stroke="#94a3b8"/><text x="460" y="225" font-size="10" text-anchor="middle">[I]</text>
          </svg>`,
          sharedOptions: [
            { key: "A", text: "Location A" },
            { key: "B", text: "Location B" },
            { key: "C", text: "Location C" },
            { key: "D", text: "Location D" },
            { key: "E", text: "Location E" },
            { key: "F", text: "Location F" },
            { key: "G", text: "Location G" },
            { key: "H", text: "Location H" },
            { key: "I", text: "Location I" }
          ],
          questions: [
            {
              q: 15,
              type: "diagram_label",
              stem: "Volunteer Tool Shed",
              answer: "A",
              accept: ["A"],
              evidence: {
                ref: "L1-S2-T06",
                quote: "Immediately to your right as you enter through the North Gate, the rectangular building labelled A is our Volunteer Tool Shed..."
              },
              explanationVi: "Ngay bên phải lối vào North Gate là Nhà để nông cụ tình nguyện (Volunteer Tool Shed) tại vị trí A -> A."
            },
            {
              q: 16,
              type: "diagram_label",
              stem: "Waterfowl Observatory Hide",
              answer: "C",
              accept: ["C"],
              evidence: {
                ref: "L1-S2-T07",
                quote: "Taking the left-hand path that loops around the western shoreline, the circular structure at location C is the Waterfowl Observatory Hide."
              },
              explanationVi: "Men theo đường bên trái quanh bờ tây hồ, công trình tròn tại vị trí C là Chòi quan sát chim nước -> C."
            },
            {
              q: 17,
              type: "diagram_label",
              stem: "Native Flora Nursery",
              answer: "E",
              accept: ["E"],
              evidence: {
                ref: "L1-S2-T08",
                quote: "Continuing north past the observatory along the Western Dike, you will reach location E across the wooden footbridge. That fenced compound is our Native Flora Nursery..."
              },
              explanationVi: "Tiếp tục đi về phía bắc qua cầu gỗ, khu vực có hàng rào tại E là Vườn ươm thực vật bản địa -> E."
            },
            {
              q: 18,
              type: "diagram_label",
              stem: "Solar Pumping Station",
              answer: "G",
              accept: ["G"],
              evidence: {
                ref: "L1-S2-T09",
                quote: "take the eastern branch of the path heading right, past the willow copse, location G is the Solar Pumping Station..."
              },
              explanationVi: "Rẽ sang nhánh đông bên phải qua rặng liễu, vị trí G là Trạm bơm năng lượng mặt trời -> G."
            },
            {
              q: 19,
              type: "diagram_label",
              stem: "Dragonfly Research Shelter",
              answer: "H",
              accept: ["H"],
              evidence: {
                ref: "L1-S2-T10",
                quote: "Further east along the boundary ditch, the small wooden gazebo marked H is the Dragonfly Research Shelter..."
              },
              explanationVi: "Đi xa hơn về phía đông dọc theo mương ranh giới, chòi gỗ nhỏ H là Trạm nghiên cứu chuồn chuồn -> H."
            },
            {
              q: 20,
              type: "diagram_label",
              stem: "Otter Breeding Sanctuary",
              answer: "D",
              accept: ["D"],
              evidence: {
                ref: "L1-S2-T11",
                quote: "situated right in the center of the Main Lagoon on an artificial island... location D is our Otter Breeding Sanctuary..."
              },
              explanationVi: "Nằm ngay chính giữa hồ đầm lau sậy trên đảo nhân tạo, vị trí D là Khu bảo tồn sinh sản rái cá -> D."
            }
          ]
        }
      ]
    },
    {
      id: "ie-ac-ls-01-s3",
      sectionIndex: 3,
      qRange: [21, 30],
      contextType: "educational_discussion",
      title: "Section 3 — Biodegradable Seaweed Film Packaging Project Review",
      topic: "Food science laboratory progress report and experimental variable allocation",
      targetBand: "6.5–7.5",
      audioUrl: null,
      preReadPauseMs: 4500,
      postCheckPauseMs: 3000,
      speakers: [
        {
          speakerId: "spk_aldridge",
          label: "Dr Evelyn Aldridge (Lecturer)",
          gender: "female",
          accentPref: ["en-AU"],
          pitch: 1.02,
          rateMultiplier: 1.0
        },
        {
          speakerId: "spk_maya",
          label: "Maya Lin (Student)",
          gender: "female",
          accentPref: ["en-US"],
          pitch: 1.05,
          rateMultiplier: 1.0
        },
        {
          speakerId: "spk_toby",
          label: "Toby Ward (Student)",
          gender: "male",
          accentPref: ["en-GB"],
          pitch: 0.95,
          rateMultiplier: 1.0
        }
      ],
      turns: [
        {
          turnId: "L1-S3-T01",
          speakerId: "spk_aldridge",
          text: "Good afternoon Maya, Toby. Let's review the progress on your third-year capstone project investigating sodium alginate films derived from brown kelp for perishable food packaging.",
          pauseAfterMs: 450
        },
        {
          turnId: "L1-S3-T02",
          speakerId: "spk_maya",
          text: "Thanks Dr Aldridge. We've completed our initial three batches of film extrusion, but we hit two unexpected hurdles during refrigerated storage testing.",
          pauseAfterMs: 450
        },
        {
          turnId: "L1-S3-T03",
          speakerId: "spk_toby",
          text: "Yes. Specifically, when temperature dropped below four degrees Celsius, the tensile flexibility degraded dramatically—the biopolymer became extremely brittle along the fold creases.",
          pauseAfterMs: 500
        },
        {
          turnId: "L1-S3-T04",
          speakerId: "spk_maya",
          text: "And our second issue was water vapor transmission. When wrapped around moist cucumber slices, the film swelled and absorbed moisture too rapidly from the food surface.",
          pauseAfterMs: 500
        },
        {
          turnId: "L1-S3-T05",
          speakerId: "spk_aldridge",
          text: "That is typical for un-crosslinked alginates. What modifications do you propose for next week's formulation series?",
          pauseAfterMs: 450
        },
        {
          turnId: "L1-S3-T06",
          speakerId: "spk_toby",
          text: "We want to test calcium chloride immersion baths to increase crosslink density, and incorporate a small percentage of plant-based glycerol as a plasticizer.",
          pauseAfterMs: 500
        },
        {
          turnId: "L1-S3-T07",
          speakerId: "spk_aldridge",
          text: "Sensible. Now let's go over the six experimental parameters in your research protocol to decide how each should be handled before your formal submission.",
          pauseAfterMs: 500
        },
        {
          turnId: "L1-S3-T08",
          speakerId: "spk_aldridge",
          text: "First, the drying chamber temperature of forty-five degrees. Maya?",
          pauseAfterMs: 400
        },
        {
          turnId: "L1-S3-T09",
          speakerId: "spk_maya",
          text: "That parameter produced very uniform film thickness without bubble defects, so we decided to keep it unchanged.",
          pauseAfterMs: 450
        },
        {
          turnId: "L1-S3-T10",
          speakerId: "spk_aldridge",
          text: "Agreed. Second, what about the synthetic plasticizer, triacetin?",
          pauseAfterMs: 400
        },
        {
          turnId: "L1-S3-T11",
          speakerId: "spk_toby",
          text: "We're going to eliminate triacetin completely because it conflicts with our zero-petrochemical sustainability brief.",
          pauseAfterMs: 450
        },
        {
          turnId: "L1-S3-T12",
          speakerId: "spk_aldridge",
          text: "Excellent decision. Third, the immersion duration in the calcium crosslinking bath?",
          pauseAfterMs: 400
        },
        {
          turnId: "L1-S3-T13",
          speakerId: "spk_maya",
          text: "Two minutes was insufficient for full ion diffusion. We plan to double the immersion duration to four minutes.",
          pauseAfterMs: 450
        },
        {
          turnId: "L1-S3-T14",
          speakerId: "spk_aldridge",
          text: "Good. Fourth, the lipid barrier coating using beeswax emulsion?",
          pauseAfterMs: 400
        },
        {
          turnId: "L1-S3-T15",
          speakerId: "spk_toby",
          text: "We will replace beeswax with sunflower wax because it provides higher transparency for retail packaging visibility.",
          pauseAfterMs: 450
        },
        {
          turnId: "L1-S3-T16",
          speakerId: "spk_aldridge",
          text: "Smart. Fifth, antimicrobial testing against Listeria monocytogenes?",
          pauseAfterMs: 400
        },
        {
          turnId: "L1-S3-T17",
          speakerId: "spk_maya",
          text: "Because our undergraduate lab lacks biosafety level 2 certification, we need to outsource the microbiological assays to the Central Pathology Institute.",
          pauseAfterMs: 500
        },
        {
          turnId: "L1-S3-T18",
          speakerId: "spk_aldridge",
          text: "I'll approve the internal funding requisition for that. And finally, parameter six: tensile burst pressure testing?",
          pauseAfterMs: 450
        },
        {
          turnId: "L1-S3-T19",
          speakerId: "spk_toby",
          text: "Our initial sample size of three specimen strips per batch was too small for statistical power, so we are going to increase sample quantity to ten strips per run.",
          pauseAfterMs: 500
        },
        {
          turnId: "L1-S3-T20",
          speakerId: "spk_aldridge",
          text: "Well reasoned, both of you. Update the protocol document by Friday.",
          pauseAfterMs: 500
        }
      ],
      questionGroups: [
        {
          groupId: "ie-ac-ls-01-g5",
          type: "mcq_multi",
          qRange: [21, 22],
          pickCount: 2,
          correctSet: ["B", "E"],
          instructionEn: "Questions 21–22: Choose TWO letters, A–E. Which TWO problems did the students encounter when refrigerating their initial film samples?",
          instructionVi: "Chọn HAI chữ cái A–E chỉ hai vấn đề sinh viên gặp phải khi bảo quản mẫu màng trong tủ lạnh.",
          sharedOptions: [
            { key: "A", text: "The film developed strong chemical odors." },
            { key: "B", text: "The biopolymer material became brittle along fold lines." },
            { key: "C", text: "The seaweed extract turned cloudy and opaque." },
            { key: "D", text: "The packaging dissolved completely within twenty-four hours." },
            { key: "E", text: "Excessive moisture was absorbed from the test food surface." }
          ],
          questions: [
            {
              q: 21,
              type: "mcq_multi",
              stem: "Problem encountered during refrigerated testing (First problem)",
              answer: "B",
              accept: ["B"],
              evidence: {
                ref: "L1-S3-T03",
                quote: "the tensile flexibility degraded dramatically—the biopolymer became extremely brittle along the fold creases."
              },
              explanationVi: "Màng sinh học trở nên cực kỳ giòn dọc theo các nếp gấp khi nhiệt độ dưới 4 độ C -> B."
            },
            {
              q: 22,
              type: "mcq_multi",
              stem: "Problem encountered during refrigerated testing (Second problem)",
              answer: "E",
              accept: ["E"],
              evidence: {
                ref: "L1-S3-T04",
                quote: "the film swelled and absorbed moisture too rapidly from the food surface."
              },
              explanationVi: "Màng hút ẩm quá nhanh từ bề mặt thực phẩm được bọc thử nghiệm -> E."
            }
          ]
        },
        {
          groupId: "ie-ac-ls-01-g6",
          type: "mcq_multi",
          qRange: [23, 24],
          pickCount: 2,
          correctSet: ["A", "C"],
          instructionEn: "Questions 23–24: Choose TWO letters, A–E. Which TWO substances do the students intend to add to their revised biopolymer formulation?",
          instructionVi: "Chọn HAI chữ cái A–E chỉ hai chất sinh viên dự định thêm vào công thức cải tiến.",
          sharedOptions: [
            { key: "A", text: "Calcium chloride" },
            { key: "B", text: "Synthetic polyurethane" },
            { key: "C", text: "Plant-derived glycerol" },
            { key: "D", text: "Sodium bicarbonate" },
            { key: "E", text: "Petroleum paraffin" }
          ],
          questions: [
            {
              q: 23,
              type: "mcq_multi",
              stem: "Additive in revised formulation (First substance)",
              answer: "A",
              accept: ["A"],
              evidence: {
                ref: "L1-S3-T06",
                quote: "We want to test calcium chloride immersion baths to increase crosslink density..."
              },
              explanationVi: "Sinh viên muốn dùng dung dịch canxi clorua (calcium chloride) để tăng mật độ liên kết chéo -> A."
            },
            {
              q: 24,
              type: "mcq_multi",
              stem: "Additive in revised formulation (Second substance)",
              answer: "C",
              accept: ["C"],
              evidence: {
                ref: "L1-S3-T06",
                quote: "and incorporate a small percentage of plant-based glycerol as a plasticizer."
              },
              explanationVi: "Sinh viên kết hợp glycerol chiết xuất thực vật (plant-based glycerol) làm chất hoá dẻo -> C."
            }
          ]
        },
        {
          groupId: "ie-ac-ls-01-g7",
          type: "matching_features",
          qRange: [25, 30],
          instructionEn: "Questions 25–30: What decision was made regarding each experimental parameter? Choose SIX answers from the box and write the correct letter, A–G, next to Questions 25–30.",
          instructionVi: "Ghép quyết định xử lý (A–G) với từng thông số thí nghiệm (25–30).",
          sharedOptions: [
            { key: "A", text: "Keep completely unchanged" },
            { key: "B", text: "Eliminate entirely from protocol" },
            { key: "C", text: "Double the operational duration" },
            { key: "D", text: "Replace with alternative ingredient" },
            { key: "E", text: "Outsource testing to external facility" },
            { key: "F", text: "Increase sample testing quantity" },
            { key: "G", text: "Postpone until graduate study" }
          ],
          questions: [
            {
              q: 25,
              type: "matching_features",
              stem: "Drying chamber temperature",
              answer: "A",
              accept: ["A"],
              evidence: {
                ref: "L1-S3-T09",
                quote: "That parameter produced very uniform film thickness without bubble defects, so we decided to keep it unchanged."
              },
              explanationVi: "Nhiệt độ buồng sấy 45 độ C cho kết quả đồng đều nên giữ nguyên không đổi -> A (Keep completely unchanged)."
            },
            {
              q: 26,
              type: "matching_features",
              stem: "Synthetic plasticizer (triacetin)",
              answer: "B",
              accept: ["B"],
              evidence: {
                ref: "L1-S3-T11",
                quote: "We're going to eliminate triacetin completely because it conflicts with our zero-petrochemical sustainability brief."
              },
              explanationVi: "Chất hoá dẻo tổng hợp triacetin bị loại bỏ hoàn toàn do mâu thuẫn tiêu chí không hoá dầu -> B (Eliminate entirely)."
            },
            {
              q: 27,
              type: "matching_features",
              stem: "Calcium crosslinking bath immersion",
              answer: "C",
              accept: ["C"],
              evidence: {
                ref: "L1-S3-T13",
                quote: "Two minutes was insufficient for full ion diffusion. We plan to double the immersion duration to four minutes."
              },
              explanationVi: "Thời gian ngâm bể liên kết chéo canxi được tăng gấp đôi từ 2 lên 4 phút -> C (Double the operational duration)."
            },
            {
              q: 28,
              type: "matching_features",
              stem: "Lipid barrier coating material",
              answer: "D",
              accept: ["D"],
              evidence: {
                ref: "L1-S3-T15",
                quote: "We will replace beeswax with sunflower wax because it provides higher transparency..."
              },
              explanationVi: "Lớp phủ sáp ong được thay thế bằng sáp hướng dương để tăng độ trong suốt -> D (Replace with alternative ingredient)."
            },
            {
              q: 29,
              type: "matching_features",
              stem: "Antimicrobial microbiological assays",
              answer: "E",
              accept: ["E"],
              evidence: {
                ref: "L1-S3-T17",
                quote: "Because our undergraduate lab lacks biosafety level 2 certification, we need to outsource the microbiological assays..."
              },
              explanationVi: "Thử nghiệm kháng khuẩn cần thuê viện bên ngoài do phòng lab chưa đạt chuẩn an toàn sinh học cấp 2 -> E (Outsource testing)."
            },
            {
              q: 30,
              type: "matching_features",
              stem: "Tensile burst pressure testing",
              answer: "F",
              accept: ["F"],
              evidence: {
                ref: "L1-S3-T19",
                quote: "Our initial sample size of three specimen strips per batch was too small for statistical power, so we are going to increase sample quantity to ten strips per run."
              },
              explanationVi: "Tăng số lượng mẫu dải kiểm tra áp lực từ 3 lên 10 mẫu -> F (Increase sample testing quantity)."
            }
          ]
        }
      ]
    },
    {
      id: "ie-ac-ls-01-s4",
      sectionIndex: 4,
      qRange: [31, 40],
      contextType: "academic_monologue",
      title: "Section 4 — Dendrochronology and Ancient Timber Trade Routes in Northern Europe",
      topic: "Tree-ring cross-dating, medieval shipbuilding provenance, and climate reconstruction",
      targetBand: "7.5–8.5",
      audioUrl: null,
      preReadPauseMs: 5000,
      postCheckPauseMs: 4000,
      speakers: [
        {
          speakerId: "spk_finch",
          label: "Prof. Helen Finch (Lecturer)",
          gender: "female",
          accentPref: ["en-GB"],
          pitch: 1.0,
          rateMultiplier: 1.0
        }
      ],
      turns: [
        {
          turnId: "L1-S4-T01",
          speakerId: "spk_finch",
          text: "Good morning, students. Today we explore dendrochronology—the science of dating historical events and environmental change through the comparative analysis of tree growth rings.",
          pauseAfterMs: 450
        },
        {
          turnId: "L1-S4-T02",
          speakerId: "spk_finch",
          text: "While tree-ring counting is popularly understood as a method for establishing the age of felled logs, in modern environmental archaeology it provides far more: a precise geopositioning tool for tracing medieval timber trade routes across Northern Europe.",
          pauseAfterMs: 500
        },
        {
          turnId: "L1-S4-T03",
          speakerId: "spk_finch",
          text: "The biological foundation rests on annual growth variations. In temperate climates, oak trees—the primary structural material of medieval architecture and maritime shipbuilding—form a distinct ring every twelve months. During favorable spring conditions, wide cells with thin walls form what botanists term earlywood.",
          pauseAfterMs: 550
        },
        {
          turnId: "L1-S4-T04",
          speakerId: "spk_finch",
          text: "As summer progresses and moisture decreases, narrower cells with dense walls produce latewood. Because regional rainfall and summer temperature fluctuations dictate annual ring width simultaneously across an entire geographic province, trees of the same species share a synchronous acoustic and visual growth signature.",
          pauseAfterMs: 550
        },
        {
          turnId: "L1-S4-T05",
          speakerId: "spk_finch",
          text: "By overlapping growth sequences from living old-growth stands, timber beams from cathedral roofs, and subfossil logs retrieved from peat bogs, dendrochronologists have constructed master chronologies for Northern European oak spanning more than four thousand continuous years.",
          pauseAfterMs: 500
        },
        {
          turnId: "L1-S4-T06",
          speakerId: "spk_finch",
          text: "Let us examine how this methodology revolutionized the archaeological analysis of maritime shipwrecks. When maritime archaeologists excavated the fourteenth-century Bremen cog from the Weser estuary, initial historians assumed the vessel had been constructed from local German oak.",
          pauseAfterMs: 550
        },
        {
          turnId: "L1-S4-T07",
          speakerId: "spk_finch",
          text: "However, statistical cross-matching of ring-width sequences against regional reference curves demonstrated that the ship's massive hull planks matched reference chronologies exclusively from the Vistula River basin in modern-day Poland.",
          pauseAfterMs: 550
        },
        {
          turnId: "L1-S4-T08",
          speakerId: "spk_finch",
          text: "Crucially, the outermost ring on several unpeeled sapwood sections contained earlywood vessels formed in the spring of 1378, establishing not only the exact felling year, but proving the trees were chopped down during the spring season before timber rafting.",
          pauseAfterMs: 550
        },
        {
          turnId: "L1-S4-T09",
          speakerId: "spk_finch",
          text: "Beyond dating structural timbers, tree rings serve as invaluable natural archives of paleoclimate. By measuring stable oxygen isotopes preserved in individual cellulose rings, researchers reconstruct historical drought severity.",
          pauseAfterMs: 500
        },
        {
          turnId: "L1-S4-T10",
          speakerId: "spk_finch",
          text: "For instance, tree-ring isotope anomalies documented a catastrophic continental drought in the year 1315, which triggered widespread harvest failure and initiated the Great Famine across Northern Europe.",
          pauseAfterMs: 550
        },
        {
          turnId: "L1-S4-T11",
          speakerId: "spk_finch",
          text: "Nevertheless, the method possesses analytical limitations that every archaeologist must recognize. Dendroprovenancing requires an adequate reference chronology; in regions where historical timber logging was thoroughly unrecorded or forests were cleared early, lack of baseline data creates significant geographical gaps.",
          pauseAfterMs: 550
        },
        {
          turnId: "L1-S4-T12",
          speakerId: "spk_finch",
          text: "Furthermore, the frequent medieval practice of reusing seasoned oak beams from demolished castles and merchant halls in newer ships can mislead researchers into dating a construction decades or even centuries earlier than its true assembly date.",
          pauseAfterMs: 500
        }
      ],
      questionGroups: [
        {
          groupId: "ie-ac-ls-01-g8",
          type: "gap_fill",
          subType: "note_completion",
          wordLimit: "ONE_WORD_ONLY",
          wordLimitLabel: "ONE WORD ONLY",
          qRange: [31, 40],
          instructionEn: "Questions 31–40: Complete the notes below. Write ONE WORD ONLY for each answer.",
          instructionVi: "Hoàn thành các ghi chú bài giảng dưới đây. Viết DUY NHẤT MỘT TỪ cho mỗi chỗ trống.",
          contextTitle: "Dendrochronology and Ancient Maritime Archaeology",
          questions: [
            {
              q: 31,
              type: "gap_fill",
              wordLimit: "ONE_WORD_ONLY",
              stem: "Primary structural timber of medieval Northern Europe: {{gap}}",
              answer: "oak",
              accept: ["oak"],
              evidence: {
                ref: "L1-S4-T03",
                quote: "In temperate climates, oak trees—the primary structural material of medieval architecture and maritime shipbuilding..."
              },
              explanationVi: "Gỗ sồi (oak) là vật liệu kết cấu chính của kiến trúc và đóng tàu thời Trung Cổ -> đáp án là 'oak'."
            },
            {
              q: 32,
              type: "gap_fill",
              wordLimit: "ONE_WORD_ONLY",
              stem: "Thin-walled cells formed during spring are known as {{gap}}",
              answer: "earlywood",
              accept: ["earlywood"],
              evidence: {
                ref: "L1-S4-T03",
                quote: "During favorable spring conditions, wide cells with thin walls form what botanists term earlywood."
              },
              explanationVi: "Tế bào thành mỏng hình thành vào mùa xuân được gọi là gỗ sớm (earlywood) -> đáp án là 'earlywood'."
            },
            {
              q: 33,
              type: "gap_fill",
              wordLimit: "ONE_WORD_ONLY",
              stem: "Decreasing moisture in summer leads to the production of {{gap}}",
              answer: "latewood",
              accept: ["latewood"],
              evidence: {
                ref: "L1-S4-T04",
                quote: "As summer progresses and moisture decreases, narrower cells with dense walls produce latewood."
              },
              explanationVi: "Mùa hè độ ẩm giảm tạo ra gỗ muộn (latewood) -> đáp án là 'latewood'."
            },
            {
              q: 34,
              type: "gap_fill",
              wordLimit: "ONE_WORD_ONLY",
              stem: "Hull planks of the Bremen cog were sourced from the Vistula River {{gap}}",
              answer: "basin",
              accept: ["basin"],
              evidence: {
                ref: "L1-S4-T07",
                quote: "the ship's massive hull planks matched reference chronologies exclusively from the Vistula River basin in modern-day Poland."
              },
              explanationVi: "Các ván thân tàu Bremen cog được xác định xuất xứ từ lưu vực sông Vistula (Vistula River basin) -> từ cần điền là 'basin'."
            },
            {
              q: 35,
              type: "gap_fill",
              wordLimit: "ONE_WORD_ONLY",
              stem: "The exact felling season was identified as {{gap}} based on sapwood vessels.",
              answer: "spring",
              accept: ["spring"],
              evidence: {
                ref: "L1-S4-T08",
                quote: "proving the trees were chopped down during the spring season before timber rafting."
              },
              explanationVi: "Vết mạch gỗ dác cho thấy cây được đốn hạ vào mùa xuân (spring) -> đáp án là 'spring'."
            },
            {
              q: 36,
              type: "gap_fill",
              wordLimit: "ONE_WORD_ONLY",
              stem: "Researchers analyze stable oxygen {{gap}} in wood cellulose to study climate.",
              answer: "isotopes",
              accept: ["isotopes", "isotope"],
              evidence: {
                ref: "L1-S4-T09",
                quote: "By measuring stable oxygen isotopes preserved in individual cellulose rings, researchers reconstruct historical drought severity."
              },
              explanationVi: "Các nhà khoa học phân tích đồng vị oxy bền (oxygen isotopes) trong sợi cellulose -> đáp án là 'isotopes'."
            },
            {
              q: 37,
              type: "gap_fill",
              wordLimit: "ONE_WORD_ONLY",
              stem: "Tree-ring records revealed an extreme continental {{gap}} in 1315.",
              answer: "drought",
              accept: ["drought"],
              evidence: {
                ref: "L1-S4-T10",
                quote: "tree-ring isotope anomalies documented a catastrophic continental drought in the year 1315..."
              },
              explanationVi: "Dữ liệu vòng cây ghi nhận đợt hạn hán quy mô lục địa (continental drought) năm 1315 -> đáp án là 'drought'."
            },
            {
              q: 38,
              type: "gap_fill",
              wordLimit: "ONE_WORD_ONLY",
              stem: "The 1315 drought precipitated the Great {{gap}} across Northern Europe.",
              answer: "Famine",
              accept: ["Famine", "famine"],
              evidence: {
                ref: "L1-S4-T10",
                quote: "which triggered widespread harvest failure and initiated the Great Famine across Northern Europe."
              },
              explanationVi: "Đợt hạn hán đó đã châm ngòi cho Nạn đói lớn (Great Famine) khắp Bắc Âu -> đáp án là 'Famine'."
            },
            {
              q: 39,
              type: "gap_fill",
              wordLimit: "ONE_WORD_ONLY",
              stem: "Unrecorded historical logging creates baseline reference {{gap}}",
              answer: "gaps",
              accept: ["gaps", "gap"],
              evidence: {
                ref: "L1-S4-T11",
                quote: "in regions where historical timber logging was thoroughly unrecorded or forests were cleared early, lack of baseline data creates significant geographical gaps."
              },
              explanationVi: "Việc khai thác gỗ không ghi chép tạo ra các khoảng trống dữ liệu cơ sở (geographical gaps) -> từ cần điền là 'gaps'."
            },
            {
              q: 40,
              type: "gap_fill",
              wordLimit: "ONE_WORD_ONLY",
              stem: "Dating can be skewed due to the medieval custom of {{gap}} structural oak beams.",
              answer: "reusing",
              accept: ["reusing", "re-using"],
              evidence: {
                ref: "L1-S4-T12",
                quote: "Furthermore, the frequent medieval practice of reusing seasoned oak beams from demolished castles and merchant halls in newer ships..."
              },
              explanationVi: "Việc xác định niên đại có thể bị sai lệch do tập quán tái sử dụng (reusing) dầm gỗ sồi cũ -> đáp án là 'reusing'."
            }
          ]
        }
      ]
    }
  ]
};

module.exports = test1;
