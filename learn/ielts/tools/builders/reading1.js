/**
 * IELTS Academic Reading Test 1 Data Module
 * ID: ie-ac-rd-01
 * Title: Academic Reading Test 1 — Passive Arid Architecture · Avian Soundscapes · Archive Algorithms
 */

const test1 = {
  id: "ie-ac-rd-01",
  title: "Academic Reading Test 1 — Passive Arid Architecture · Avian Soundscapes · Archive Algorithms",
  fmt: 3,
  module: "academic",
  timeLimitSec: 3600,
  totalQuestions: 40,
  passages: [
    {
      id: "ie-ac-rd-01-p1",
      passageIndex: 1,
      qRange: [1, 13],
      title: "Subterranean Dew Condensers and Passive Water Harvesting in Arid Architecture",
      subtitle: "How vernacular stone structures and modern thermal modelling capture atmospheric moisture without external power",
      topic: "Architecture & Environmental Engineering",
      targetBand: "5.5–6.5",
      style: "descriptive_analytical",
      wordCount: 712,
      paragraphs: [
        {
          id: "A",
          text: "Long before mechanical refrigeration allowed engineers to chill air below its saturation point, builders in semi-arid coastal basins experimented with stone chambers designed to coax drinkable moisture from seemingly dry night skies. Across parts of the Mediterranean and the volcanic islands of the eastern Atlantic, farmers piled dark basalt cobbles into conical mounds or sunken pits around the roots of fruit trees. Early twentieth-century travellers who encountered such structures occasionally claimed that monumental stone condensers had once supplied entire towns with thousands of litres of water every morning. Subsequent field measurements proved that particular claim to be a romantic exaggeration: massive above-ground stone piles retain too much daytime solar heat in their cores, preventing their interior surfaces from cooling rapidly enough after sunset to sustain heavy condensation."
        },
        {
          id: "B",
          text: "Yet the failure of oversized stone cairns did not invalidate the underlying physics of passive radiative cooling. At smaller scales, thin, well-ventilated layers of crushed rock or porous limestone lose thermal energy swiftly to a clear night sky through long-wave infrared radiation. When humid maritime breezes pass slowly through shaded subterranean channels lined with pre-cooled stone, water vapour condenses into fine droplets along mineral edges before trickling into lined collection troughs below. Crucially, the chamber must remain thermally isolated from the sun-baked topsoil above while still admitting a controlled flow of nocturnal air; too strong a draught warms the stone prematurely, whereas stagnant air starves the surface of fresh moisture."
        },
        {
          id: "C",
          text: "Contemporary interest in passive moisture harvesting revived during the late 2010s, driven not by archaeological nostalgia but by the practical vulnerability of off-grid ecological monitoring stations and dryland tree nurseries. Solar-powered electric dehumidifiers can extract substantial volumes of water in warm, humid climates, yet their compressors, fans and dust filters fail frequently when exposed to abrasive desert grit without routine maintenance. Seeking an alternative with zero moving parts, an interdisciplinary team at the Castellon Institute of Arid Building Physics constructed a series of sunken test vaults insulated beneath reflective lime-plaster roofs. Over an eighteen-month trial, vaults fitted with stepped basalt fins consistently yielded between 0.4 and 0.9 litres of water per square metre of condensing surface per night—modest by municipal standards, yet entirely sufficient to irrigate newly planted native saplings through their critical first dry season."
        },
        {
          id: "D",
          text: "Material geometry turned out to matter just as much as thermal mass. Smooth stone slabs held condensed moisture as a continuous film, which insulated the cold rock from incoming vapour and slowed subsequent droplet formation. By contrast, stones etched with narrow vertical micro-grooves encouraged tiny droplets to coalesce and slide downward under gravity, continually exposing bare mineral surfaces to the humid airflow. Researchers also observed that coating the upper rim of each groove with a thin mineral silicate layer accelerated droplet shedding by nearly 28 percent compared with untreated basalt, without leaching any synthetic chemicals into the collected water."
        },
        {
          id: "E",
          text: "Field longevity assessments further highlighted operational advantages that conventional cost-per-litre calculations often overlook. Because subterranean vaults contain neither chemical refrigerants nor lithium storage batteries, upkeep consists primarily of brushing wind-blown silt from the intake louvres twice a year before the dry season peaks. At remote botanical outposts where daytime air temperatures regularly exceed 44 degrees Celsius, the cool masonry chambers also serve a secondary architectural function, housing delicate soil-moisture data loggers that would otherwise overheat inside standard metal enclosures. In addition, the thick subterranean walls buffer acoustic vibrations from coastal gales, allowing bioacoustic microphones mounted beside the nursery beds to record nocturnal insect and bird activity with minimal background distortion. Such multi-functional durability explains why field ecologists increasingly favour passive stone infrastructure over compact mechanical units despite its lower peak water output per square metre."
        },
        {
          id: "F",
          text: "Architects are cautious, however, about presenting subterranean condensers as a universal remedy for water-stressed cities. Passive dew chambers depend on a specific climatic window: clear night skies that permit radiative heat loss, diurnal temperature swings of at least 11 degrees Celsius, and relative humidity rising above 75 percent before dawn. In continental interiors where night air remains parched, even the most intricately grooved vault stays bone-dry. Rather than competing with desalination plants or municipal reservoirs, passive subterranean condensers occupy a distinct ecological niche—providing dependable, low-maintenance micro-irrigation where power lines, spare parts and service technicians rarely reach."
        }
      ],
      glossary: [
        { term: "basalt", def: "a dark, dense volcanic rock with fine grain" },
        { term: "radiative cooling", def: "the process by which a body loses heat by emitting thermal radiation" }
      ],
      questionGroups: [
        {
          groupId: "ie-ac-rd-01-g1",
          type: "tfng",
          qRange: [1, 6],
          instructionEn: "Questions 1–6: Do the following statements agree with the information given in Reading Passage 1? Write TRUE, FALSE or NOT GIVEN.",
          instructionVi: "Chọn TRUE nếu mệnh đề khớp thông tin trong bài, FALSE nếu mâu thuẫn trực tiếp, hoặc NOT GIVEN nếu bài không nêu đủ thông tin.",
          questions: [
            {
              q: 1,
              type: "tfng",
              stem: "Twentieth-century field measurements confirmed that giant above-ground stone mounds could provide enough daily water for whole towns.",
              options: [
                { key: "TRUE", text: "TRUE" },
                { key: "FALSE", text: "FALSE" },
                { key: "NOT GIVEN", text: "NOT GIVEN" }
              ],
              answer: "FALSE",
              accept: ["false"],
              evidence: {
                ref: "A",
                quote: "Subsequent field measurements proved that particular claim to be a romantic exaggeration: massive above-ground stone piles retain too much daytime solar heat in their cores..."
              },
              explanationVi: "Đoạn A khẳng định các phép đo thực địa đã chứng minh tuyên bố cấp nước cho cả thị trấn chỉ là sự phóng đại lãng mạn vì các khối đá lớn giữ quá nhiều nhiệt. Nhận định 'confirmed' (xác nhận là đúng) mâu thuẫn trực tiếp với bài -> FALSE."
            },
            {
              q: 2,
              type: "tfng",
              stem: "Porous limestone loses heat more rapidly at night than crushed basalt of the same thickness.",
              options: [
                { key: "TRUE", text: "TRUE" },
                { key: "FALSE", text: "FALSE" },
                { key: "NOT GIVEN", text: "NOT GIVEN" }
              ],
              answer: "NOT GIVEN",
              accept: ["not given"],
              evidence: {
                ref: "B",
                quote: "At smaller scales, thin, well-ventilated layers of crushed rock or porous limestone lose thermal energy swiftly to a clear night sky through long-wave infrared radiation."
              },
              explanationVi: "Đoạn B chỉ nêu cả đá nghiền và đá vôi xốp đều mất nhiệt nhanh vào ban đêm khi xếp lớp mỏng, hoàn toàn không so sánh loại nào mất nhiệt nhanh hơn. Đây là bẫy so sánh không có cơ sở -> NOT GIVEN."
            },
            {
              q: 3,
              type: "tfng",
              stem: "Subterranean condensing chambers require an uninterrupted, high-velocity airflow throughout the entire night.",
              options: [
                { key: "TRUE", text: "TRUE" },
                { key: "FALSE", text: "FALSE" },
                { key: "NOT GIVEN", text: "NOT GIVEN" }
              ],
              answer: "FALSE",
              accept: ["false"],
              evidence: {
                ref: "B",
                quote: "too strong a draught warms the stone prematurely, whereas stagnant air starves the surface of fresh moisture."
              },
              explanationVi: "Đoạn B nêu rõ luồng gió quá mạnh (too strong a draught) sẽ làm đá bị ấm lên quá sớm; buồng cần luồng khí kiểm soát chậm (controlled flow, pass slowly). Mệnh đề đòi hỏi gió tốc độ cao liên tục mâu thuẫn trực tiếp -> FALSE."
            },
            {
              q: 4,
              type: "tfng",
              stem: "The test vaults built by the Castellon Institute were intended to supply drinking water to surrounding human settlements.",
              options: [
                { key: "TRUE", text: "TRUE" },
                { key: "FALSE", text: "FALSE" },
                { key: "NOT GIVEN", text: "NOT GIVEN" }
              ],
              answer: "FALSE",
              accept: ["false"],
              evidence: {
                ref: "C",
                quote: "Over an eighteen-month trial, vaults fitted with stepped basalt fins consistently yielded between 0.4 and 0.9 litres... entirely sufficient to irrigate newly planted native saplings through their critical first dry season."
              },
              explanationVi: "Đoạn C nói rõ sản lượng khiêm tốn này phục vụ tưới cây non bản địa (irrigate newly planted native saplings), không phải cung cấp nước uống cho khu dân cư xung quanh -> FALSE."
            },
            {
              q: 5,
              type: "tfng",
              stem: "Vertical micro-grooves prevented water droplets from forming a barrier on the stone surface.",
              options: [
                { key: "TRUE", text: "TRUE" },
                { key: "FALSE", text: "FALSE" },
                { key: "NOT GIVEN", text: "NOT GIVEN" }
              ],
              answer: "TRUE",
              accept: ["true"],
              evidence: {
                ref: "D",
                quote: "By contrast, stones etched with narrow vertical micro-grooves encouraged tiny droplets to coalesce and slide downward under gravity, continually exposing bare mineral surfaces to the humid airflow."
              },
              explanationVi: "Đoạn D chỉ ra các rãnh vi mô thẳng đứng giúp giọt nước trượt xuống theo trọng lực, liên tục để lộ bề mặt khoáng trần (tránh tình trạng bị lớp màng nước cách nhiệt ngăn cản) -> TRUE."
            },
            {
              q: 6,
              type: "tfng",
              stem: "Solar-powered dehumidifiers tested in desert outposts were more expensive to purchase than stone vaults.",
              options: [
                { key: "TRUE", text: "TRUE" },
                { key: "FALSE", text: "FALSE" },
                { key: "NOT GIVEN", text: "NOT GIVEN" }
              ],
              answer: "NOT GIVEN",
              accept: ["not given"],
              evidence: {
                ref: "C",
                quote: "Solar-powered electric dehumidifiers can extract substantial volumes of water in warm, humid climates, yet their compressors, fans and dust filters fail frequently when exposed to abrasive desert grit without routine maintenance."
              },
              explanationVi: "Đoạn C chỉ đề cập máy hút ẩm điện mặt trời hay hỏng hóc do cát sa mạc mài mòn, không đề cập hay so sánh chi phí mua ban đầu (purchase price) giữa hai hệ thống -> NOT GIVEN."
            }
          ]
        },
        {
          groupId: "ie-ac-rd-01-g2",
          type: "diagram_label",
          inputMode: "gap_fill",
          wordLimit: "ONE_WORD_ONLY",
          wordLimitLabel: "ONE WORD ONLY",
          qRange: [7, 10],
          instructionEn: "Questions 7–10: Label the diagram below. Choose ONE WORD ONLY from the passage for each answer.",
          instructionVi: "Điền nhãn sơ đồ mặt cắt buồng ngưng tụ ngầm. Chọn DUY NHẤT MỘT TỪ từ bài đọc cho mỗi câu trả lời.",
          svgMarkup: `<svg viewBox="0 0 520 260" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;font-family:sans-serif;background:#f8fafc;border-radius:8px;border:1px solid #cbd5e1;">
            <rect x="10" y="10" width="500" height="240" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1"/>
            <rect x="80" y="40" width="360" height="25" fill="#e2e8f0" stroke="#475569" stroke-width="2"/>
            <text x="260" y="57" font-size="12" text-anchor="middle" font-weight="bold" fill="#1e293b">[7] Reflective ________ roof</text>
            <path d="M 40 40 L 80 40 L 80 100 L 40 100 Z" fill="#cbd5e1" stroke="#64748b"/>
            <text x="60" y="75" font-size="11" text-anchor="middle" fill="#0f172a">[8] Air ________</text>
            <rect x="120" y="85" width="280" height="90" fill="#cbd5e1" stroke="#334155" stroke-dasharray="3,3"/>
            <line x1="160" y1="95" x2="160" y2="165" stroke="#0f172a" stroke-width="3"/>
            <line x1="210" y1="95" x2="210" y2="165" stroke="#0f172a" stroke-width="3"/>
            <line x1="260" y1="95" x2="260" y2="165" stroke="#0f172a" stroke-width="3"/>
            <line x1="310" y1="95" x2="310" y2="165" stroke="#0f172a" stroke-width="3"/>
            <line x1="360" y1="95" x2="360" y2="165" stroke="#0f172a" stroke-width="3"/>
            <text x="260" y="135" font-size="12" text-anchor="middle" font-weight="bold" fill="#0369a1">[9] Stepped basalt ________</text>
            <rect x="110" y="195" width="300" height="20" fill="#bae6fd" stroke="#0284c7" stroke-width="1.5"/>
            <text x="260" y="210" font-size="12" text-anchor="middle" font-weight="bold" fill="#0369a1">[10] Collection ________ at base</text>
          </svg>`,
          questions: [
            {
              q: 7,
              type: "diagram_label",
              wordLimit: "ONE_WORD_ONLY",
              stem: "Reflective {{gap}} roof to minimize daytime solar heating",
              answer: "plaster",
              accept: ["plaster", "lime-plaster"],
              evidence: {
                ref: "C",
                quote: "constructed a series of sunken test vaults insulated beneath reflective lime-plaster roofs."
              },
              explanationVi: "Đoạn C nêu rõ các hầm ngầm được cách nhiệt bên dưới mái trát vôi phản xạ (reflective lime-plaster roofs). Danh từ cần điền là 'plaster' (hoặc 'lime-plaster')."
            },
            {
              q: 8,
              type: "diagram_label",
              wordLimit: "ONE_WORD_ONLY",
              stem: "Air intake {{gap}} that require silt cleaning twice a year",
              answer: "louvres",
              accept: ["louvres", "louvers"],
              evidence: {
                ref: "E",
                quote: "upkeep consists primarily of brushing wind-blown silt from the intake louvres twice a year before the dry season peaks."
              },
              explanationVi: "Đoạn E chỉ ra việc bảo trì chủ yếu là quét bụi phù sa bám trên các nan đón khí (intake louvres) mỗi năm hai lần -> từ cần điền là 'louvres' (chấp nhận cách viết Mỹ 'louvers')."
            },
            {
              q: 9,
              type: "diagram_label",
              wordLimit: "ONE_WORD_ONLY",
              stem: "Stepped basalt {{gap}} providing condensing surface area",
              answer: "fins",
              accept: ["fins"],
              evidence: {
                ref: "C",
                quote: "vaults fitted with stepped basalt fins consistently yielded between 0.4 and 0.9 litres of water per square metre"
              },
              explanationVi: "Đoạn C mô tả các hầm ngầm được gắn các cánh tản nhiệt bằng đá bazan dạng bậc thang (stepped basalt fins) -> từ cần điền là 'fins'."
            },
            {
              q: 10,
              type: "diagram_label",
              wordLimit: "ONE_WORD_ONLY",
              stem: "Lined collection {{gap}} beneath the condensing panels",
              answer: "troughs",
              accept: ["troughs", "trough"],
              evidence: {
                ref: "B",
                quote: "water vapour condenses into fine droplets along mineral edges before trickling into lined collection troughs below."
              },
              explanationVi: "Đoạn B mô tả giọt nước ngưng tụ chảy vào các rãnh/máng thu nước có lót ở bên dưới (collection troughs) -> từ cần điền là 'troughs' (hoặc 'trough')."
            }
          ]
        },
        {
          groupId: "ie-ac-rd-01-g3",
          type: "gap_fill",
          subType: "short_answer",
          wordLimit: "ONE_WORD_OR_NUMBER",
          wordLimitLabel: "ONE WORD AND/OR A NUMBER",
          qRange: [11, 13],
          instructionEn: "Questions 11–13: Answer the questions below. Choose ONE WORD AND/OR A NUMBER from the passage for each answer.",
          instructionVi: "Trả lời các câu hỏi sau. Chọn DUY NHẤT MỘT TỪ VÀ/HOẶC MỘT CON SỐ từ bài đọc cho mỗi câu trả lời.",
          questions: [
            {
              q: 11,
              type: "gap_fill",
              wordLimit: "ONE_WORD_OR_NUMBER",
              stem: "How many months did the experimental trial at the Castellon Institute last? {{gap}}",
              answer: "18",
              accept: ["18", "eighteen"],
              evidence: {
                ref: "C",
                quote: "Over an eighteen-month trial, vaults fitted with stepped basalt fins consistently yielded between 0.4 and 0.9 litres of water..."
              },
              explanationVi: "Đoạn C ghi rõ thử nghiệm diễn ra trong vòng 18 tháng (an eighteen-month trial). Đáp án là '18' hoặc chữ 'eighteen'."
            },
            {
              q: 12,
              type: "gap_fill",
              wordLimit: "ONE_WORD_OR_NUMBER",
              stem: "What type of mineral layer was applied to the rim of the stone grooves to improve water drainage? {{gap}}",
              answer: "silicate",
              accept: ["silicate"],
              evidence: {
                ref: "D",
                quote: "coating the upper rim of each groove with a thin mineral silicate layer accelerated droplet shedding by nearly 28 percent..."
              },
              explanationVi: "Đoạn D nêu các nhà nghiên cứu phủ một lớp khoáng silicat mỏng (mineral silicate layer) để tăng tốc độ thoát giọt nước -> đáp án là 'silicate'."
            },
            {
              q: 13,
              type: "gap_fill",
              wordLimit: "ONE_WORD_OR_NUMBER",
              stem: "What wind-blown substance must caretakers clear from the vents before peak dry season? {{gap}}",
              answer: "silt",
              accept: ["silt"],
              evidence: {
                ref: "E",
                quote: "upkeep consists primarily of brushing wind-blown silt from the intake louvres twice a year before the dry season peaks."
              },
              explanationVi: "Đoạn E nêu công việc bảo trì chính là quét bụi phù sa bị gió cuốn (wind-blown silt) khỏi các nan lấy gió -> đáp án là 'silt'."
            }
          ]
        }
      ]
    },
    {
      id: "ie-ac-rd-01-p2",
      passageIndex: 2,
      qRange: [14, 26],
      title: "Acoustic Refuges: Rethinking Urban Soundscapes for Avian Navigation",
      subtitle: "How anthropogenic low-frequency rumble interferes with navigational cues and how biological buffer corridors restore ecological acoustic connectivity",
      topic: "Urban Ecology & Bioacoustics",
      targetBand: "6.5–7.5",
      style: "analytical_evaluative",
      wordCount: 825,
      paragraphs: [
        {
          id: "A",
          text: "In the dawn twilight above expanding metropolitan corridors, thousands of migrating songbirds navigate by listening to complex auditory landscapes that human ears seldom register. Subtle environmental soundscapes—such as the rhythmic wash of surf against coastlines, the nocturnal rustle of temperate reedbeds, and the collective contact calls of resident flocks—provide critical spatial waypoints for nocturnal migrants crossing unfamiliar terrain across continents. Over the past three decades, however, the rapid acoustic footprint of urbanisation has transformed this sensory environment. Heavy vehicular transport, industrial ventilation systems, and subterranean rail networks emit a continuous, high-amplitude acoustic blanket dominated by frequencies below 1.5 kilohertz, directly overlapping the acoustic spectrum where small passerines orient, communicate, and detect subtle territorial signals during seasonal passage. Biologists monitoring migration flyways note that when ambient background levels exceed fifty decibels across entire metropolitan valleys, juvenile birds become disoriented, frequently colliding with illuminated glass facades or descending prematurely into suboptimal commercial parks."
        },
        {
          id: "B",
          text: "The physiological toll of this pervasive rumble extends well beyond simple auditory disturbance or occasional sleep disruption. Field bioacoustician Dr Elena Ramos recorded European robins and blackcaps foraging along major metropolitan beltways, demonstrating that ambient traffic noise triggers an acute state of chronic vigilance. In quiet woodland habitats, birds allocate roughly twelve percent of their morning feeding bouts to scanning for aerial predators. In highway margins exceeding 68 decibels, this surveillance investment surges to more than thirty-five percent. Forced to interrupt their caloric intake every few seconds to visually survey their surroundings, juveniles fail to accumulate the essential subcutaneous fat reserves required for long-distance desert or maritime crossings, dramatically lowering their survival rates during migration journeys. Metabolic rate assessments further reveal that elevated physiological stress hormones deplete vital glycogen stored in avian flight muscles, impairing flight endurance during subsequent nocturnal journeys."
        },
        {
          id: "C",
          text: "Beyond individual nutritional deficits and heightened predation anxiety, acoustic masking systematically fractures territorial advertisement and mate selection across temperate breeding seasons. Professor Marcus Chen observed that several songbird species attempt to counter anthropogenic masking by shifting their vocal signatures toward higher frequencies. Great tits in metropolitan parks, for instance, sing at peak frequencies nearly 450 hertz higher than their rural counterparts. While this acoustic adaptation allows their notes to penetrate background traffic noise, it introduces an unexpected reproductive penalty. Higher-pitched trills demand rapid muscular contractions that smaller individuals struggle to sustain, resulting in shorter, less varied strophes that female birds routinely perceive as indicators of diminished vigour and poor genetic fitness."
        },
        {
          id: "D",
          text: "Faced with compounding behavioral distortions and alarming population declines, landscape architects and conservation biologists have begun collaborating on the design of urban acoustic refuges. Rather than relying on traditional concrete acoustic barriers, which merely deflect sound waves upward and create localized turbulence, modern bioacoustic corridors employ multi-layered vegetative embankments. Dense evergreen understories composed of species with thick, wax-coated foliage absorb high frequencies through microscopic surface scattering, while compacted earth berms dissipate low-frequency vibrations through internal friction. In addition, planting native shrubs with varied leaf angles prevents uniform resonant amplification, ensuring sound waves scatter omnidirectionally through the canopy foliage. Measurements conducted by Dr Soren Lindqvist across Scandinavian greenways confirmed that combining a three-metre stepped earthen berm with staggered juniper and hornbeam plantings attenuates ground-level traffic noise by up to 14 decibels within a forty-metre corridor."
        },
        {
          id: "E",
          text: "Crucially, the ecological success of an acoustic sanctuary depends on spatial connectivity rather than isolated park size. A vast municipal park surrounded by four-lane perimeter thoroughfares functions as an acoustic island: nocturnal migrants descending into its canopy find temporary respite, but they encounter severe acoustic dis-orientation when attempting to depart before sunrise. Dr Fiona Gallagher established that linear vegetative fingers—even those narrower than thirty metres—that link urban parks to river valleys enable migrating warblers to navigate across metropolitan barriers without losing their acoustic bearings. These vegetated conduits maintain continuous acoustic gradients that guide avian flocks through silent flight paths toward open countryside, preserving navigational fidelity across dense urban districts."
        },
        {
          id: "F",
          text: "Implementing bioacoustic planning on a municipal scale requires a fundamental shift in how urban noise is regulated by local authorities. Current environmental noise ordinances focus almost exclusively on human annoyance thresholds, measuring sound pressure across an A-weighted decibel curve that discounts low-frequency rumbles below 500 hertz. Conservationists argue that city councils must adopt multi-species acoustic zoning standards that explicitly protect wildlife flight paths. By mandating acoustic impact assessments for new transport links near designated flyways and incentivising quiet porous road surfaces, cities can transition from impenetrable sensory barriers into permeable transit landscapes where migratory wildlife and human commerce coexist sustainably without ecological collapse."
        }
      ],
      glossary: [
        { term: "passerine", def: "a perching bird of the order Passeriformes, which includes more than half of all bird species" },
        { term: "acoustic masking", def: "the process by which the threshold of audibility for one sound is raised by the presence of another" }
      ],
      questionGroups: [
        {
          groupId: "ie-ac-rd-01-g4",
          type: "matching_headings",
          qRange: [14, 19],
          reuseAllowed: false,
          instructionEn: "Questions 14–19: Reading Passage 2 has six paragraphs, A–F. Choose the correct heading for each paragraph from the list of headings below.",
          instructionVi: "Ghép từng đoạn văn A–F với tiêu đề thích hợp nhất từ danh sách i–viii.",
          sharedOptions: [
            { key: "i", text: "The physiological cost of continuous visual vigilance" },
            { key: "ii", text: "How vegetative design absorbs multi-frequency disturbance" },
            { key: "iii", text: "The failure of conventional acoustic ordinances to protect birds" },
            { key: "iv", text: "Loss of natural waypoints beneath an urban acoustic blanket" },
            { key: "v", text: "Why acoustic connectivity outweighs park area" },
            { key: "vi", text: "Unintended reproductive penalties of pitch adaptation" },
            { key: "vii", text: "Technological methods for monitoring nocturnal desert crossings" },
            { key: "viii", text: "Artificial lighting as a secondary navigational hazard" }
          ],
          questions: [
            {
              q: 14,
              type: "matching_headings",
              targetParagraph: "A",
              stem: "Paragraph A",
              answer: "iv",
              accept: ["iv"],
              evidence: {
                ref: "A",
                quote: "Subtle environmental soundscapes... provide critical spatial waypoints for nocturnal migrants... Over the past three decades, however, the rapid acoustic footprint of urbanisation has transformed this sensory environment."
              },
              explanationVi: "Đoạn A mô tả các điểm mốc âm thanh tự nhiên (spatial waypoints) bị che khuất bởi tấm màn âm thanh đô thị tần số thấp dưới 1.5 kHz -> tiêu đề iv."
            },
            {
              q: 15,
              type: "matching_headings",
              targetParagraph: "B",
              stem: "Paragraph B",
              answer: "i",
              accept: ["i"],
              evidence: {
                ref: "B",
                quote: "demonstrating that ambient traffic noise triggers an acute state of chronic vigilance... surveillance investment surges to more than thirty-five percent. Forced to interrupt their caloric intake..."
              },
              explanationVi: "Đoạn B phân tích việc chim phải dành hơn 35% thời gian để quan sát cảnh giác thay vì kiếm ăn, dẫn đến thiếu hụt mỡ dự trữ sinh học -> tiêu đề i."
            },
            {
              q: 16,
              type: "matching_headings",
              targetParagraph: "C",
              stem: "Paragraph C",
              answer: "vi",
              accept: ["vi"],
              evidence: {
                ref: "C",
                quote: "Great tits in metropolitan parks, for instance, sing at peak frequencies nearly 450 hertz higher... it introduces an unexpected reproductive penalty."
              },
              explanationVi: "Đoạn C giải thích việc nâng cao cao độ tiếng hót để át tiếng ồn khiến chim mái đánh giá thấp thể lực con trống, dẫn đến bất lợi về mặt sinh sản -> tiêu đề vi."
            },
            {
              q: 17,
              type: "matching_headings",
              targetParagraph: "D",
              stem: "Paragraph D",
              answer: "ii",
              accept: ["ii"],
              evidence: {
                ref: "D",
                quote: "modern bioacoustic corridors employ multi-layered vegetative embankments... absorb high frequencies through microscopic surface scattering, while compacted earth berms dissipate low-frequency vibrations..."
              },
              explanationVi: "Đoạn D mô tả thiết kế đê đất kết hợp tầng cây rậm rạp giúp hấp thụ cả tần số cao lẫn rung chấn tần số thấp -> tiêu đề ii."
            },
            {
              q: 18,
              type: "matching_headings",
              targetParagraph: "E",
              stem: "Paragraph E",
              answer: "v",
              accept: ["v"],
              evidence: {
                ref: "E",
                quote: "Crucially, the ecological success of an acoustic sanctuary depends on spatial connectivity rather than isolated park size."
              },
              explanationVi: "Đoạn E khẳng định tính kết nối không gian giữa các dải cây xanh quan trọng hơn diện tích công viên riêng lẻ biệt lập -> tiêu đề v."
            },
            {
              q: 19,
              type: "matching_headings",
              targetParagraph: "F",
              stem: "Paragraph F",
              answer: "iii",
              accept: ["iii"],
              evidence: {
                ref: "F",
                quote: "Current environmental noise ordinances focus almost exclusively on human annoyance thresholds, measuring sound pressure across an A-weighted decibel curve that discounts low-frequency rumbles below 500 hertz."
              },
              explanationVi: "Đoạn F chỉ trích các quy định tiếng ồn hiện nay chỉ xét theo mức chịu đựng của con người và bỏ qua dải tần số thấp ảnh hưởng tới động vật -> tiêu đề iii."
            }
          ]
        },
        {
          groupId: "ie-ac-rd-01-g5",
          type: "matching_features",
          qRange: [20, 23],
          instructionEn: "Questions 20–23: Look at the following research findings and the list of researchers below. Match each finding with the correct researcher, A–D.",
          instructionVi: "Ghép các phát hiện nghiên cứu sau với đúng tên nhà nghiên cứu tương ứng (A–D).",
          sharedOptions: [
            { key: "A", text: "Dr Elena Ramos" },
            { key: "B", text: "Professor Marcus Chen" },
            { key: "C", text: "Dr Soren Lindqvist" },
            { key: "D", text: "Dr Fiona Gallagher" }
          ],
          questions: [
            {
              q: 20,
              type: "matching_features",
              stem: "Narrow vegetated pathways enable birds to traverse urban environments without disorientation.",
              answer: "D",
              accept: ["D"],
              evidence: {
                ref: "E",
                quote: "Dr Fiona Gallagher established that linear vegetative fingers—even those narrower than thirty metres—that link urban parks to river valleys enable migrating warblers to navigate across metropolitan barriers..."
              },
              explanationVi: "Nghiên cứu của Tiến sĩ Fiona Gallagher (D) chứng minh các dải cây xanh hẹp dưới 30 mét nối công viên với thung lũng sông giúp chim định hướng vượt qua đô thị -> D."
            },
            {
              q: 21,
              type: "matching_features",
              stem: "Heavy traffic noise causes birds to spend substantially more time on predator surveillance.",
              answer: "A",
              accept: ["A"],
              evidence: {
                ref: "B",
                quote: "Field bioacoustician Dr Elena Ramos recorded European robins and blackcaps... In highway margins exceeding 68 decibels, this surveillance investment surges to more than thirty-five percent."
              },
              explanationVi: "Tiến sĩ Elena Ramos (A) ghi nhận tiếng ồn đường cao tốc khiến chim tăng thời gian cảnh giác kẻ săn mồi từ 12% lên hơn 35% -> A."
            },
            {
              q: 22,
              type: "matching_features",
              stem: "A combination of soil berms and staggered bushes significantly decreases roadside noise levels.",
              answer: "C",
              accept: ["C"],
              evidence: {
                ref: "D",
                quote: "Measurements conducted by Dr Soren Lindqvist across Scandinavian greenways confirmed that combining a three-metre stepped earthen berm with staggered juniper and hornbeam plantings attenuates ground-level traffic noise by up to 14 decibels..."
              },
              explanationVi: "Tiến sĩ Soren Lindqvist (C) đo đạc thực tế chứng minh bờ đê đất cao 3m kết hợp trồng cây bách và trăn xen kẽ giúp giảm tiếng ồn tới 14 dB -> C."
            },
            {
              q: 23,
              type: "matching_features",
              stem: "Altering song pitch can negatively influence how potential mates evaluate male fitness.",
              answer: "B",
              accept: ["B"],
              evidence: {
                ref: "C",
                quote: "Professor Marcus Chen observed that several songbird species attempt to counter anthropogenic masking by shifting their vocal signatures... female birds routinely perceive as indicators of diminished vigour and poor genetic fitness."
              },
              explanationVi: "Giáo sư Marcus Chen (B) quan sát thấy việc nâng cao độ tiếng hót làm giảm độ dài và phong phú của giai điệu, khiến chim mái đánh giá thấp thể lực con trống -> B."
            }
          ]
        },
        {
          groupId: "ie-ac-rd-01-g6",
          type: "gap_fill",
          subType: "summary_text",
          wordLimit: "TWO_WORDS_ONLY",
          wordLimitLabel: "NO MORE THAN TWO WORDS",
          qRange: [24, 26],
          instructionEn: "Questions 24–26: Complete the summary below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
          instructionVi: "Hoàn thành đoạn tóm tắt dưới đây. Chọn KHÔNG QUÁ HAI TỪ từ bài đọc cho mỗi câu trả lời.",
          contextTitle: "Urban Sound Barriers and Vegetative Mitigation",
          questions: [
            {
              q: 24,
              type: "gap_fill",
              wordLimit: "TWO_WORDS_ONLY",
              stem: "Traditional concrete barriers tend to direct noise towards the sky and produce localized {{gap}}.",
              answer: "turbulence",
              accept: ["turbulence"],
              evidence: {
                ref: "D",
                quote: "Rather than relying on traditional concrete acoustic barriers, which merely deflect sound waves upward and create localized turbulence..."
              },
              explanationVi: "Đoạn D chỉ ra các tường chắn bê tông truyền thống chỉ hắt sóng âm lên trên và tạo ra hiện tượng nhiễu động cục bộ (localized turbulence) -> từ cần điền là 'turbulence'."
            },
            {
              q: 25,
              type: "gap_fill",
              wordLimit: "TWO_WORDS_ONLY",
              stem: "High-frequency acoustic energy is scattered by plants that have thick, {{gap}} leaves.",
              answer: "wax-coated",
              accept: ["wax-coated"],
              evidence: {
                ref: "D",
                quote: "Dense evergreen understories composed of species with thick, wax-coated foliage absorb high frequencies through microscopic surface scattering..."
              },
              explanationVi: "Đoạn D nêu các loài thực vật có tán lá dày phủ sáp (thick, wax-coated foliage) giúp tán xạ và hấp thụ sóng âm tần số cao -> từ cần điền là 'wax-coated' (tính là 1 từ ghép)."
            },
            {
              q: 26,
              type: "gap_fill",
              wordLimit: "TWO_WORDS_ONLY",
              stem: "Standard noise regulations rely on an A-weighted decibel system that fails to account for low-frequency {{gap}}.",
              answer: "rumbles",
              accept: ["rumbles"],
              evidence: {
                ref: "F",
                quote: "measuring sound pressure across an A-weighted decibel curve that discounts low-frequency rumbles below 500 hertz."
              },
              explanationVi: "Đoạn F cho biết thang đo decibel loại A hiện tại bỏ qua các tiếng ầm rì rầm tần số thấp dưới 500 Hz (low-frequency rumbles) -> từ cần điền là 'rumbles'."
            }
          ]
        }
      ]
    },
    {
      id: "ie-ac-rd-01-p3",
      passageIndex: 3,
      qRange: [27, 40],
      title: "The Illusion of Algorithmic Neutrality in Historical Archive Curation",
      subtitle: "Critical examination of computational classification models applied to fragile pre-modern manuscripts and the persistent necessity of human hermeneutic context",
      topic: "Historiography & Computational Humanities",
      targetBand: "7.5–9.0",
      style: "academic_discursive",
      wordCount: 865,
      paragraphs: [
        {
          id: "A",
          text: "In the climate-controlled repositories of major research libraries, the physical ledger has increasingly yielded ground to the probabilistic matrix. Propelled by advances in optical character recognition and neural text processing, national institutions have digitised millions of folios, deeds, and court rolls, transforming previously inaccessible parchment collections into searchable digital corpora. Advocates of computational historiography celebrate this transformation as a democratising triumph: algorithmically indexed archives allow scholars to uncover cross-continental trade patterns or subtle vernacular shifts that would elude decades of manual transcription. Yet within this narrative of frictionless technological access lies a foundational fallacy—the belief that automated extraction models act as impartial mirrors of the historical record."
        },
        {
          id: "B",
          text: "Machine-learning classifiers do not interact with history in the abstract; they process structured training data that reflect contemporary curation priorities and technological convenience. Digitisation initiatives inevitably favour manuscripts that exhibit high contrast, uniform orthography, and resilient physical condition. Pristine monastic chronicles written on bleached vellum are digitised, calibrated, and fed into neural network pipelines with minimal friction. Conversely, weathered court petitions scrawled on recycled rag paper in heavily cursive regional hands are either omitted from digitisation pipelines or transcribed with severe character error rates. When modern algorithmic tools parse digital archives, they inherit and magnify these uneven preservation patterns, rendering already marginalized historical voices invisible behind high confidence scores."
        },
        {
          id: "C",
          text: "Beyond sample bias, the process of computational transcription flattens the multidimensional physical rhetoric of ancient documents. An experienced codicologist knows that a medieval treaty cannot be understood through its linguistic syntax alone. The physical texture of the support, the chemical composition of gall-nut ink, the erasure marks where a notary scraped away parchment to amend a clause, and the relative size of marginal annotations all convey crucial socio-political subtexts. Natural language models reduce this physical materiality to a linear sequence of Unicode tokens. In stripping away the spatial arrangement and material vulnerability of the manuscript, automated pipelines divorce textual statements from the physical negotiations that brought them into being."
        },
        {
          id: "D",
          text: "The classification ontologies underpinning archival search engines present an equally profound interpretive challenge. Automated clustering algorithms group documents based on semantic co-occurrence vectors derived from contemporary language models. However, pre-modern concepts of property ownership, sovereign legitimacy, and criminal culpability rarely correspond to modern semantic categories. When an algorithm automatically tags an eleventh-century ecclesiastical grant as an 'agricultural real-estate lease', it imposes anachronistic market assumptions onto a feudal patronage relationship that was primarily spiritual and reciprocal rather than transactional. Far from being value-free, the algorithm quietly re-authors the archive in the image of twenty-first-century administrative logic."
        },
        {
          id: "E",
          text: "This epistemic distortions become particularly treacherous when computational outputs are presented to researchers as objective discovery metrics. Novice researchers frequently treat digital search rankings as comprehensive inventories, failing to perceive the algorithmic exclusions that shaped their query results. Dr Jeremy Vance observed that doctoral dissertations in early modern legal history increasingly concentrate on a narrow cluster of repeatedly digitised court records, while adjacent un-scanned archival series languish in archival obscurity. The illusion of algorithmic completeness risks creating a closed interpretive loop, where historiographical inquiry is dictated not by intellectual curiosity or historical significance, but by the convenience of machine-readable corpora."
        },
        {
          id: "F",
          text: "Critics of computational reductionism do not advocate abandoning algorithmic tools; rather, they demand a rigorous ethos of digital provenance and interpretive transparency. Every automated index should be accompanied by detailed metadata documenting model architecture, training corpora limitations, and optical confidence distribution curves. Rather than obscuring ambiguities behind a single 'canonical' machine reading, archival platforms should expose alternative transcriptional hypotheses and visually highlight regions where handwriting deterioration rendered character recognition speculative. A truly scholarly digital architecture embraces uncertainty, inviting researchers to scrutinize the seams between the physical artefact and its digital surrogate."
        },
        {
          id: "G",
          text: "Ultimately, the preservation of historical depth requires recognizing that archival curation is an intrinsically interpretive act. Algorithms excel at detecting statistical regularities across vast textual corpora, but they possess no capacity to comprehend the silences, suppressions, and deliberate contradictions that characterize human historical archives. The archival scholar must remain more than a passive consumer of algorithmic search outputs; they must function as an investigative critic who interrogates how computational mediation reframes the past. The goal of the digital humanities is not to replace the human archivist with an unthinking calculation, but to enrich our historical encounter while retaining a keen awareness of the machine's blind spots."
        }
      ],
      glossary: [
        { term: "codicologist", def: "a scholar who studies handwritten books (manuscripts) as physical material objects" },
        { term: "epistemic", def: "relating to knowledge, its validation and the conditions of knowing" }
      ],
      questionGroups: [
        {
          groupId: "ie-ac-rd-01-g7",
          type: "ynng",
          qRange: [27, 31],
          instructionEn: "Questions 27–31: Do the following statements agree with the claims of the writer in Reading Passage 3? Write YES, NO or NOT GIVEN.",
          instructionVi: "Chọn YES nếu nhận định phản ánh đúng quan điểm của tác giả, NO nếu trái ngược quan điểm tác giả, hoặc NOT GIVEN nếu không thể kết luận từ bài đọc.",
          questions: [
            {
              q: 27,
              type: "ynng",
              stem: "Automated classification systems provide completely objective representations of historical collections.",
              options: [
                { key: "YES", text: "YES" },
                { key: "NO", text: "NO" },
                { key: "NOT GIVEN", text: "NOT GIVEN" }
              ],
              answer: "NO",
              accept: ["no"],
              evidence: {
                ref: "A",
                quote: "Yet within this narrative of frictionless technological access lies a foundational fallacy—the belief that automated extraction models act as impartial mirrors of the historical record."
              },
              explanationVi: "Tác giả khẳng định niềm tin rằng mô hình tự động đóng vai trò là tấm gương khách quan phản chiếu lịch sử là 'một ngụy biện căn bản' (foundational fallacy). Nhận định nói hệ thống mang tính khách quan hoàn toàn mâu thuẫn trực tiếp với tác giả -> NO."
            },
            {
              q: 28,
              type: "ynng",
              stem: "Manuscripts selected for early digitisation trials were typically chosen because of their historical importance.",
              options: [
                { key: "YES", text: "YES" },
                { key: "NO", text: "NO" },
                { key: "NOT GIVEN", text: "NOT GIVEN" }
              ],
              answer: "NO",
              accept: ["no"],
              evidence: {
                ref: "B",
                quote: "Digitisation initiatives inevitably favour manuscripts that exhibit high contrast, uniform orthography, and resilient physical condition... Pristine monastic chronicles written on bleached vellum are digitised... with minimal friction."
              },
              explanationVi: "Đoạn B chỉ ra các tài liệu được ưu tiên số hóa dựa trên độ tương phản cao, chữ viết đồng đều và độ bền vật lý (thuận tiện kỹ thuật), chứ không phải vì tầm quan trọng lịch sử -> NO."
            },
            {
              q: 29,
              type: "ynng",
              stem: "Modern natural language algorithms adequately capture the physical context of manuscript annotations.",
              options: [
                { key: "YES", text: "YES" },
                { key: "NO", text: "NO" },
                { key: "NOT GIVEN", text: "NOT GIVEN" }
              ],
              answer: "NO",
              accept: ["no"],
              evidence: {
                ref: "C",
                quote: "Natural language models reduce this physical materiality to a linear sequence of Unicode tokens. In stripping away the spatial arrangement and material vulnerability... automated pipelines divorce textual statements from the physical negotiations..."
              },
              explanationVi: "Đoạn C lập luận rằng mô hình ngôn ngữ làm phẳng tính vật lý đa chiều thành chuỗi ký tự tuyến tính và tước bỏ đi sự sắp xếp không gian của chú giải -> NO."
            },
            {
              q: 30,
              type: "ynng",
              stem: "Most early modern court records will eventually be transcribed into machine-readable digital archives.",
              options: [
                { key: "YES", text: "YES" },
                { key: "NO", text: "NO" },
                { key: "NOT GIVEN", text: "NOT GIVEN" }
              ],
              answer: "NOT GIVEN",
              accept: ["not given"],
              evidence: {
                ref: "E",
                quote: "doctoral dissertations in early modern legal history increasingly concentrate on a narrow cluster of repeatedly digitised court records, while adjacent un-scanned archival series languish in archival obscurity."
              },
              explanationVi: "Tác giả chỉ nói các hồ sơ tòa án chưa số hóa bị chìm vào quên lãng trong khi học giả tập trung vào phần đã số hóa, không dự đoán hay đề cập liệu phần lớn có được số hóa trong tương lai hay không -> NOT GIVEN."
            },
            {
              q: 31,
              type: "ynng",
              stem: "Digital archival platforms should display places where algorithmic readings are uncertain.",
              options: [
                { key: "YES", text: "YES" },
                { key: "NO", text: "NO" },
                { key: "NOT GIVEN", text: "NOT GIVEN" }
              ],
              answer: "YES",
              accept: ["yes"],
              evidence: {
                ref: "F",
                quote: "archival platforms should expose alternative transcriptional hypotheses and visually highlight regions where handwriting deterioration rendered character recognition speculative."
              },
              explanationVi: "Tác giả ủng hộ rõ ràng việc nền tảng số hóa nên nêu các giả thuyết phiên âm thay thế và đánh dấu trực quan những vùng chữ bị mờ suy đoán -> YES."
            }
          ]
        },
        {
          groupId: "ie-ac-rd-01-g8",
          type: "mcq_single",
          qRange: [32, 36],
          instructionEn: "Questions 32–36: Choose the correct letter, A, B, C or D.",
          instructionVi: "Chọn chữ cái đúng nhất A, B, C hoặc D.",
          questions: [
            {
              q: 32,
              type: "mcq_single",
              stem: "In Paragraph B, what is the writer's primary concern regarding the digitisation process?",
              options: [
                { key: "A", text: "The excessive financial cost of maintaining digital server infrastructure." },
                { key: "B", text: "The damage caused to delicate parchment manuscripts during high-intensity scanning." },
                { key: "C", text: "The reinforcement of existing historical inequalities due to technical selection criteria." },
                { key: "D", text: "The inability of optical character recognition software to read Latin abbreviations." }
              ],
              answer: "C",
              accept: ["C"],
              evidence: {
                ref: "B",
                quote: "When modern algorithmic tools parse digital archives, they inherit and magnify these uneven preservation patterns, rendering already marginalized historical voices invisible..."
              },
              explanationVi: "Đoạn B tập trung vào việc tiêu chuẩn số hóa thiên lệch khiến các giọng nói vốn đã bị lề mề trong lịch sử tiếp tục bị tàng hình, làm trầm trọng thêm sự bất bình đẳng bảo tồn lịch sử -> C."
            },
            {
              q: 33,
              type: "mcq_single",
              stem: "Why does the writer mention the 'erasure marks' in Paragraph C?",
              options: [
                { key: "A", text: "To show that physical alterations offer meaningful historical clues that digital text ignores." },
                { key: "B", text: "To highlight the poor drafting skills of medieval ecclesiastical scribes." },
                { key: "C", text: "To prove that ancient legal agreements were frequently fraudulent." },
                { key: "D", text: "To demonstrate how chemical degradation can render manuscripts illegible." }
              ],
              answer: "A",
              accept: ["A"],
              evidence: {
                ref: "C",
                quote: "the erasure marks where a notary scraped away parchment to amend a clause... all convey crucial socio-political subtexts. Natural language models reduce this physical materiality to a linear sequence..."
              },
              explanationVi: "Dấu vết cạo xóa trên văn bản vật lý chứa đựng ngữ cảnh chính trị - xã hội quan trọng mà việc chuyển thành văn bản số tuyến tính bỏ qua -> A."
            },
            {
              q: 34,
              type: "mcq_single",
              stem: "What risk is highlighted when algorithms classify an eleventh-century grant as an 'agricultural real-estate lease'?",
              options: [
                { key: "A", text: "Tax obligations from medieval periods might be misapplied to modern farms." },
                { key: "B", text: "Contemporary commercial frameworks are inappropriately imposed on medieval relationships." },
                { key: "C", text: "Legal historians may misinterpret the geographic boundaries of ancient estates." },
                { key: "D", text: "Church properties could be erroneously claimed by municipal councils." }
              ],
              answer: "B",
              accept: ["B"],
              evidence: {
                ref: "D",
                quote: "it imposes anachronistic market assumptions onto a feudal patronage relationship that was primarily spiritual and reciprocal rather than transactional."
              },
              explanationVi: "Đoạn D giải thích việc này áp đặt các giả định thị trường hiện đại sai lệch thời đại (anachronistic market assumptions) lên mối quan hệ bảo trợ phong kiến vốn mang tính tâm linh và tương hỗ -> B."
            },
            {
              q: 35,
              type: "mcq_single",
              stem: "What does Dr Jeremy Vance observe about recent doctoral dissertations?",
              options: [
                { key: "A", text: "They rely heavily on unreliable translations of foreign judicial proceedings." },
                { key: "B", text: "They focus predominantly on a restricted selection of readily available digital files." },
                { key: "C", text: "They show a decreasing interest in pre-modern economic and social history." },
                { key: "D", text: "They fail to acknowledge the contributions of professional archival staff." }
              ],
              answer: "B",
              accept: ["B"],
              evidence: {
                ref: "E",
                quote: "doctoral dissertations in early modern legal history increasingly concentrate on a narrow cluster of repeatedly digitised court records, while adjacent un-scanned archival series languish..."
              },
              explanationVi: "Tiến sĩ Jeremy Vance nhận thấy các luận án tiến sĩ tập trung quá mức vào một nhóm hẹp các hồ sơ tòa án đã được số hóa sẵn, bỏ qua các tài liệu chưa quét -> B."
            },
            {
              q: 36,
              type: "mcq_single",
              stem: "What is the writer's conclusion regarding the role of scholars in the digital age?",
              options: [
                { key: "A", text: "They should cease using algorithmic indices until neural models become completely transparent." },
                { key: "B", text: "They should specialize in software engineering to program custom archival crawlers." },
                { key: "C", text: "They must actively question how technological mediation alters the interpretation of history." },
                { key: "D", text: "They should leave the management of digital repositories entirely to library scientists." }
              ],
              answer: "C",
              accept: ["C"],
              evidence: {
                ref: "G",
                quote: "The archival scholar must remain more than a passive consumer of algorithmic search outputs; they must function as an investigative critic who interrogates how computational mediation reframes the past."
              },
              explanationVi: "Đoạn G kết luận học giả không được thụ động dùng thuật toán mà phải trở thành nhà phê bình điều tra, luôn chất vấn sự can thiệp của công nghệ tái định hình quá khứ như thế nào -> C."
            }
          ]
        },
        {
          groupId: "ie-ac-rd-01-g9",
          type: "matching_endings",
          qRange: [37, 40],
          instructionEn: "Questions 37–40: Complete each sentence with the correct ending, A–F, below.",
          instructionVi: "Ghép nửa đầu câu (37–40) với vế kết thúc phù hợp nhất (A–F) bên dưới.",
          sharedOptions: [
            { key: "A", text: "fails to capture the physical and spatial nuances of the original parchment." },
            { key: "B", text: "reflects the subjective criteria and priorities of contemporary software design." },
            { key: "C", text: "encourages researchers to examine the technical limitations of digital representations." },
            { key: "D", text: "will automatically replace the need for specialized human archival interpretation." },
            { key: "E", text: "proves that ancient scribes rarely corrected political documents after drafting." },
            { key: "F", text: "restricts historical investigation to a limited group of well-preserved records." }
          ],
          questions: [
            {
              q: 37,
              type: "matching_endings",
              stem: "The automated transcription of fragile historical documents {{gap}}",
              answer: "A",
              accept: ["A"],
              evidence: {
                ref: "C",
                quote: "In stripping away the spatial arrangement and material vulnerability of the manuscript, automated pipelines divorce textual statements from the physical negotiations..."
              },
              explanationVi: "Phiên âm tự động làm mất đi tính đa chiều và các sắc thái vật lý, không gian của bản thảo gốc -> A."
            },
            {
              q: 38,
              type: "matching_endings",
              stem: "The semantic classification implemented by modern algorithms {{gap}}",
              answer: "B",
              accept: ["B"],
              evidence: {
                ref: "D",
                quote: "Far from being value-free, the algorithm quietly re-authors the archive in the image of twenty-first-century administrative logic."
              },
              explanationVi: "Phân loại ngữ nghĩa áp đặt giả định quản trị hiện đại lên văn bản phong kiến -> B."
            },
            {
              q: 39,
              type: "matching_endings",
              stem: "The uneven digitisation of manuscript collections {{gap}}",
              answer: "F",
              accept: ["F"],
              evidence: {
                ref: "B",
                quote: "When modern algorithmic tools parse digital archives, they inherit and magnify these uneven preservation patterns, rendering already marginalized historical voices invisible..."
              },
              explanationVi: "Số hóa không đồng đều làm giới hạn việc nghiên cứu vào một nhóm hẹp tài liệu còn nguyên vẹn, gạt bỏ tài liệu rách nát -> F."
            },
            {
              q: 40,
              type: "matching_endings",
              stem: "A scholarly digital repository that exposes transcriptional uncertainty {{gap}}",
              answer: "C",
              accept: ["C"],
              evidence: {
                ref: "F",
                quote: "A truly scholarly digital architecture embraces uncertainty, inviting researchers to scrutinize the seams between the physical artefact and its digital surrogate."
              },
              explanationVi: "Một kho lưu trữ số học thuật bộc lộ độ bất định sẽ khuyến khích học giả soi xét giới hạn kỹ thuật giữa hiện vật thật và bản số hóa -> C."
            }
          ]
        }
      ]
    }
  ]
};

module.exports = test1;
