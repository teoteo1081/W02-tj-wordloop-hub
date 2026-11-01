/**
 * IELTS Academic Reading Test 2 Data Module
 * ID: ie-ac-rd-02
 * Title: Academic Reading Test 2 — Mycelium Composite Buoys · Tactile Sign Systems · Scarcity Framing in Commons
 */

const test2 = {
  id: "ie-ac-rd-02",
  title: "Academic Reading Test 2 — Mycelium Composite Buoys · Tactile Sign Systems · Scarcity Framing in Commons",
  fmt: 3,
  module: "academic",
  timeLimitSec: 3600,
  totalQuestions: 40,
  passages: [
    {
      id: "ie-ac-rd-02-p1",
      passageIndex: 1,
      qRange: [1, 13],
      title: "Mycelium Composite Buoys: Biodegradable Infrastructure for Coastal Monitoring",
      subtitle: "Replacing synthetic expanded plastics with agricultural waste inoculated with fungal mycelium for autonomous oceanographic sensing",
      topic: "Materials Science & Marine Ecology",
      targetBand: "5.5–6.5",
      style: "descriptive_technical",
      wordCount: 785,
      paragraphs: [
        {
          id: "A",
          text: "Across the world's shallow coastal waters, estuaries, and shipping channels, thousands of tethered telemetry buoys collect round-the-clock data on water temperature, salinity, tidal flow velocity, dissolved oxygen, and chlorophyll concentrations. Historically, maritime port authorities and oceanographic research consortia have constructed these floating platforms almost exclusively from expanded polystyrene (EPS) foam encased in polyurethane or fiberglass shells. Although buoyant, lightweight, and inexpensive to produce in bulk, petroleum-based marine foams present severe and long-lasting environmental hazards. Storm surges and maritime accidents frequently tear buoys from their seabed anchor moorings, hurling them against rocky headlands and concrete breakwaters where violent wave action pulverizes the brittle cores into billions of persistent microplastic beads. These buoyant fragments absorb organic marine contaminants, such as polychlorinated biphenyls, and are readily ingested by larval fish and zooplankton, entering oceanic food webs with irreversible bioaccumulative consequences."
        },
        {
          id: "B",
          text: "In response to mounting global alarm over marine plastic pollution, biomaterials engineers at the Ardent Coastline Foundation began cultivating maritime flotation hardware using fungal mycelium—the subterranean vegetative network of filamentous hyphae that mushrooms produce. Mycelium acts as nature's ultimate polymer binder: when inoculated into agricultural residues such as chopped hemp stalks, oat hulls, or softwood sawdust, the fungal filaments secrete digestive enzymes that colonise the substrate, weaving loose organic fibers into an interconnected structural matrix over seven to twelve days in dark, temperature-regulated cultivation chambers. The resulting lightweight bio-composite possesses an intricate porous cellular architecture strikingly analogous to commercial expanded foam, but derived entirely from renewable plant waste. Furthermore, the agricultural substrates require zero synthetic chemical fertilizers or excessive irrigation, utilizing materials that would otherwise be incinerated as agricultural field waste."
        },
        {
          id: "C",
          text: "The manufacturing sequence involves two critical stabilization stages before the bio-composite can be deployed into rigorous open marine environments. First, once the mycelium fully permeates the custom buoy-shaped mold, technicians transfer the solidified blocks into high-heat convection ovens at 85 degrees Celsius for four hours. This baking process halts all biological growth and thoroughly desiccates the mycelial network, eliminating the risk of accidental fungal dispersal into native coastal flora. Second, because raw mycelium composite is naturally absorbent and would rapidly waterlog, technicians immerse each core into a hot bath of purified beeswax and carnauba plant wax. This hydrophobic treatment penetrates the outer porous crust by approximately six millimetres, establishing a breathable, water-impermeable barrier capable of withstanding prolonged hydrostatic pressure in wave-washed tidal zones."
        },
        {
          id: "D",
          text: "Engineering trials conducted in sheltered tidal inlets revealed that mycelium composite buoys possess mechanical qualities comparable to commercial expanded polystyrene. The bio-composite exhibits an average density of just 140 kilograms per cubic metre while supporting sensor payloads weighing up to 22 kilograms without exceeding safe waterline draft limits. In impact resistance testing, the natural resilience of the interwoven lignocellulosic fibres enabled the buoys to endure repeated collisions with recreational boat hulls and floating drift logs without experiencing catastrophic structural fracturing. Furthermore, acoustic backscatter analysis confirmed that the composite dampens mooring chain vibration, reducing sensory interference on delicate underwater hydrophones."
        },
        {
          id: "E",
          text: "The definitive ecological distinction between synthetic polymers and mycelium infrastructure emerges at the end of the buoy's operational lifespan. Commercial polystyrene floats degrade over several centuries into toxic microparticles that linger indefinitely in the water column. By contrast, field observations in temperate marine waters demonstrated that once the wax sealant begins to wear away after roughly eighteen to twenty-four months of tidal abrasion, indigenous marine bacteria and wood-boring amphipods gradually colonise the exposed lignocellulose core. Marine microbiologists have isolated several species of Pseudoalteromonas that rapidly metabolize the fungal chitin without producing any biohazardous secondary metabolites or oxygen depletion in benthic boundary layers. Over twelve to fifteen weeks, the entire structural buoy undergoes complete biological decomposition, converting harmlessly into natural marine humus and inert mineral nutrients that enrich benthic microbial communities without releasing microplastics."
        },
        {
          id: "F",
          text: "Despite promising performance indicators, widespread adoption across industrial aquaculture and maritime transport faces several commercial bottlenecks. While agricultural byproducts are cheap and abundant, the two-stage moulding and baking cycle currently restricts manufacturing scalability compared with automated synthetic foam injection. Furthermore, standard port authority procurement contracts typically demand mooring buoys with guaranteed five-year lifespans—a timeline incompatible with organic biodegradable materials that deliberately break down in less than three years. Researchers are currently investigating microscopic cellulose nanocrystal reinforcements to extend operational endurance to thirty-six months while preserving 100 percent compostability in marine sediment."
        }
      ],
      glossary: [
        { term: "hyphae", def: "branching filaments that make up the mycelium of a fungus" },
        { term: "lignocellulosic", def: "plant matter composed primarily of lignin, cellulose, and hemicellulose" }
      ],
      questionGroups: [
        {
          groupId: "ie-ac-rd-02-g1",
          type: "gap_fill",
          subType: "table_completion",
          wordLimit: "ONE_WORD_OR_NUMBER",
          wordLimitLabel: "ONE WORD AND/OR A NUMBER",
          qRange: [1, 5],
          instructionEn: "Questions 1–5: Complete the table below. Choose ONE WORD AND/OR A NUMBER from the passage for each answer.",
          instructionVi: "Hoàn thành bảng tóm tắt quy trình sản xuất phao nấm dưới đây. Chọn DUY NHẤT MỘT TỪ VÀ/HOẶC MỘT CON SỐ từ bài đọc cho mỗi câu.",
          contextTitle: "Production Stages of Mycelium Oceanographic Buoys",
          questions: [
            {
              q: 1,
              type: "gap_fill",
              wordLimit: "ONE_WORD_OR_NUMBER",
              stem: "Fungal hyphae are mixed with agricultural residues such as hemp stalks or softwood {{gap}}.",
              answer: "sawdust",
              accept: ["sawdust"],
              evidence: {
                ref: "B",
                quote: "when inoculated into agricultural residues such as chopped hemp stalks, oat hulls, or softwood sawdust..."
              },
              explanationVi: "Đoạn B liệt kê các phụ phẩm nông nghiệp gồm cuộng cây gai dầu vụn, vỏ yến mạch hoặc mùn cưa gỗ mềm (softwood sawdust) -> đáp án là 'sawdust'."
            },
            {
              q: 2,
              type: "gap_fill",
              wordLimit: "ONE_WORD_OR_NUMBER",
              stem: "Cultivation of the fungal matrix takes between 7 and {{gap}} days in dark chambers.",
              answer: "12",
              accept: ["12", "twelve"],
              evidence: {
                ref: "B",
                quote: "weaving loose organic fibers into an interconnected structural matrix over seven to twelve days in dark, temperature-regulated cultivation chambers."
              },
              explanationVi: "Đoạn B chỉ ra giai đoạn nuôi cấy trong buồng tối kéo dài từ 7 đến 12 ngày -> đáp án là '12' (hoặc 'twelve')."
            },
            {
              q: 3,
              type: "gap_fill",
              wordLimit: "ONE_WORD_OR_NUMBER",
              stem: "Baking in convection ovens occurs at {{gap}} degrees Celsius to prevent accidental spore dispersal.",
              answer: "85",
              accept: ["85"],
              evidence: {
                ref: "C",
                quote: "technicians transfer the blocks into high-heat convection ovens at 85 degrees Celsius for four hours."
              },
              explanationVi: "Đoạn C nói rõ phao được nung trong lò đối lưu nhiệt độ 85 độ C trong 4 giờ -> đáp án là '85'."
            },
            {
              q: 4,
              type: "gap_fill",
              wordLimit: "ONE_WORD_OR_NUMBER",
              stem: "A hydrophobic coating made from carnauba and purified {{gap}} is applied to seal the outer crust.",
              answer: "beeswax",
              accept: ["beeswax"],
              evidence: {
                ref: "C",
                quote: "technicians immerse each core into a hot bath of purified beeswax and carnauba plant wax."
              },
              explanationVi: "Đoạn C nêu lớp sáp chống thấm gồm sáp carnauba thực vật và sáp ong tinh khiết (purified beeswax) -> đáp án là 'beeswax'."
            },
            {
              q: 5,
              type: "gap_fill",
              wordLimit: "ONE_WORD_OR_NUMBER",
              stem: "The maximum weight of sensor payloads supported by the buoy during testing was {{gap}} kilograms.",
              answer: "22",
              accept: ["22", "twenty-two"],
              evidence: {
                ref: "D",
                quote: "supporting sensor payloads weighing up to 22 kilograms without exceeding safe waterline draft limits."
              },
              explanationVi: "Đoạn D xác nhận tải trọng cảm biến tối đa mà phao chịu được là 22 kg -> đáp án là '22' (hoặc 'twenty-two')."
            }
          ]
        },
        {
          groupId: "ie-ac-rd-02-g2",
          type: "tfng",
          qRange: [6, 10],
          instructionEn: "Questions 6–10: Do the following statements agree with the information given in Reading Passage 1? Write TRUE, FALSE or NOT GIVEN.",
          instructionVi: "Chọn TRUE nếu mệnh đề khớp thông tin bài đọc, FALSE nếu mâu thuẫn trực tiếp, hoặc NOT GIVEN nếu không có đủ thông tin.",
          questions: [
            {
              q: 6,
              type: "tfng",
              stem: "Expanded polystyrene buoys are prone to breaking apart when smashed against rocky coastlines.",
              options: [
                { key: "TRUE", text: "TRUE" },
                { key: "FALSE", text: "FALSE" },
                { key: "NOT GIVEN", text: "NOT GIVEN" }
              ],
              answer: "TRUE",
              accept: ["true"],
              evidence: {
                ref: "A",
                quote: "hurling them against rocky headlands and concrete breakwaters where violent wave action pulverizes the brittle cores into billions of persistent microplastic beads."
              },
              explanationVi: "Đoạn A miêu tả sóng bão đập các phao xốp EPS vào mũi đá, nơi sóng biển nghiền nát lõi giòn của chúng thành hàng tỉ hạt vi nhựa -> TRUE."
            },
            {
              q: 7,
              type: "tfng",
              stem: "The high-heat baking stage improves the buoyant density of the mycelium core.",
              options: [
                { key: "TRUE", text: "TRUE" },
                { key: "FALSE", text: "FALSE" },
                { key: "NOT GIVEN", text: "NOT GIVEN" }
              ],
              answer: "NOT GIVEN",
              accept: ["not given"],
              evidence: {
                ref: "C",
                quote: "technicians transfer the blocks into high-heat convection ovens at 85 degrees Celsius for four hours. This baking process halts all biological growth and thoroughly desiccates the mycelial network..."
              },
              explanationVi: "Đoạn C chỉ giải thích bước nung nhiệt nhằm ngăn chặn sự phát triển sinh học và sấy khô mạng lưới sợi nấm, không đề cập liệu bước này có làm tăng mật độ nổi (buoyant density) hay không -> NOT GIVEN."
            },
            {
              q: 8,
              type: "tfng",
              stem: "Collisions with wooden logs caused irreversible cracking in the mycelium buoys during field trials.",
              options: [
                { key: "TRUE", text: "TRUE" },
                { key: "FALSE", text: "FALSE" },
                { key: "NOT GIVEN", text: "NOT GIVEN" }
              ],
              answer: "FALSE",
              accept: ["false"],
              evidence: {
                ref: "D",
                quote: "enabled the buoys to endure repeated collisions with recreational boat hulls and floating drift logs without experiencing catastrophic structural fracturing."
              },
              explanationVi: "Đoạn D khẳng định phao chịu được va chạm lặp đi lặp lại với khúc gỗ trôi dạt mà KHÔNG bị rạn nứt cấu trúc nghiêm trọng (without experiencing catastrophic structural fracturing) -> mâu thuẫn trực tiếp -> FALSE."
            },
            {
              q: 9,
              type: "tfng",
              stem: "Once exposed to sea water, the untreated core converts entirely into harmless marine humus.",
              options: [
                { key: "TRUE", text: "TRUE" },
                { key: "FALSE", text: "FALSE" },
                { key: "NOT GIVEN", text: "NOT GIVEN" }
              ],
              answer: "TRUE",
              accept: ["true"],
              evidence: {
                ref: "E",
                quote: "Over twelve to fifteen weeks, the entire structural buoy undergoes complete biological decomposition, converting harmlessly into natural marine humus and inert mineral nutrients..."
              },
              explanationVi: "Đoạn E khẳng định toàn bộ phao phân huỷ sinh học hoàn toàn thành mùn biển tự nhiên vô hại và khoáng chất trơ trong 12–15 tuần -> TRUE."
            },
            {
              q: 10,
              type: "tfng",
              stem: "Cellulose nanocrystals have already been integrated into all commercial buoy product lines.",
              options: [
                { key: "TRUE", text: "TRUE" },
                { key: "FALSE", text: "FALSE" },
                { key: "NOT GIVEN", text: "NOT GIVEN" }
              ],
              answer: "FALSE",
              accept: ["false"],
              evidence: {
                ref: "F",
                quote: "Researchers are currently investigating microscopic cellulose nanocrystal reinforcements to extend operational endurance to thirty-six months..."
              },
              explanationVi: "Đoạn F cho biết các nhà nghiên cứu hiện đang tìm hiểu/thử nghiệm (currently investigating) việc gia cố bằng tinh thể nano cellulose, chưa hề tích hợp vào mọi dòng sản phẩm thương mại -> FALSE."
            }
          ]
        },
        {
          groupId: "ie-ac-rd-02-g3",
          type: "mcq_single",
          qRange: [11, 11],
          instructionEn: "Question 11: Choose the correct letter, A, B, C or D.",
          instructionVi: "Chọn chữ cái đúng nhất A, B, C hoặc D.",
          questions: [
            {
              q: 11,
              type: "mcq_single",
              stem: "According to Paragraph F, what is a primary commercial barrier to adopting mycelium buoys?",
              options: [
                { key: "A", text: "The excessive toxicity of agricultural processing residues." },
                { key: "B", text: "A mismatch between institutional procurement lifespans and organic biodegradability." },
                { key: "C", text: "A severe shortage of raw organic materials along coastal ports." },
                { key: "D", text: "Strict maritime regulations prohibiting the deployment of organic matter in harbours." }
              ],
              answer: "B",
              accept: ["B"],
              evidence: {
                ref: "F",
                quote: "standard port authority procurement contracts typically demand mooring buoys with guaranteed five-year lifespans—a timeline incompatible with organic biodegradable materials that deliberately break down in less than three years."
              },
              explanationVi: "Hợp đồng mua sắm của các cảng yêu cầu tuổi thọ đảm bảo 5 năm, trong khi vật liệu phân huỷ sinh học hữu cơ được thiết kế để phân rã trong dưới 3 năm -> B."
            }
          ]
        },
        {
          groupId: "ie-ac-rd-02-g4",
          type: "mcq_multi",
          qRange: [12, 13],
          pickCount: 2,
          correctSet: ["B", "E"],
          instructionEn: "Questions 12–13: Choose TWO letters, A–E. Which TWO statements accurately describe the physical advantages of mycelium composite buoys demonstrated in engineering trials?",
          instructionVi: "Chọn HAI chữ cái A–E mô tả các ưu điểm cơ học của phao vật liệu nấm trong thử nghiệm kỹ thuật.",
          sharedOptions: [
            { key: "A", text: "They can carry heavier payloads than traditional reinforced fiberglass hulls." },
            { key: "B", text: "Their low overall density meets commercial marine flotation benchmarks." },
            { key: "C", text: "They eliminate the requirement for any protective surface treatment." },
            { key: "D", text: "They accelerate the accumulation of micro-algae on submerged sensory units." },
            { key: "E", text: "Their fibrous structural network absorbs repeated physical impacts without breaking." }
          ],
          questions: [
            {
              q: 12,
              type: "mcq_multi",
              stem: "Physical advantage of mycelium composite buoys (First point)",
              answer: "B",
              accept: ["B"],
              evidence: {
                ref: "D",
                quote: "The bio-composite exhibits an average density of just 140 kilograms per cubic metre while supporting sensor payloads weighing up to 22 kilograms without exceeding safe waterline draft limits."
              },
              explanationVi: "Phao có mật độ trung bình thấp (140 kg/m3), đạt chuẩn nổi thương mại mà vẫn đỡ được tải trọng 22 kg -> B."
            },
            {
              q: 13,
              type: "mcq_multi",
              stem: "Physical advantage of mycelium composite buoys (Second point)",
              answer: "E",
              accept: ["E"],
              evidence: {
                ref: "D",
                quote: "In impact resistance testing, the natural resilience of the interwoven lignocellulosic fibres enabled the buoys to endure repeated collisions with recreational boat hulls and floating drift logs without experiencing catastrophic structural fracturing."
              },
              explanationVi: "Mạng lưới sợi tự nhiên giúp phao chịu va chạm lặp đi lặp lại với vỏ tàu và thân gỗ trôi dạt mà không bị vỡ nát -> E."
            }
          ]
        }
      ]
    },
    {
      id: "ie-ac-rd-02-p2",
      passageIndex: 2,
      qRange: [14, 26],
      title: "Tactile Sign Systems and Spatial Memory Consolidation in Adult Learners",
      subtitle: "How incorporating kinesthetic and spatial hand-gestural symbols enhances working memory plasticity and conceptual retention",
      topic: "Cognitive Neuroscience & Second Language Acquisition",
      targetBand: "6.5–7.5",
      style: "scientific_evaluative",
      wordCount: 795,
      paragraphs: [
        {
          id: "A",
          text: "In conventional adult language classrooms, vocabulary pedagogy relies heavily on audiolingual drill, passive listening, and visual graphic text. Learners silently review flashcards or repeat isolated phonetic strings, anchoring foreign lexicon predominantly within the auditory cortex and left-hemisphere semantic processing centers. While undeniably effective for short-term rote memorization before examinations, this unimodal sensory pathway often yields rapid decay: within four weeks of unreinforced study, adult students typically forget between forty and sixty percent of newly acquired lexical items. Cognitive neuroscientists attribute this acute vulnerability to shallow memory traces that lack foundational grounding in sensorimotor neural representations, leaving abstract terms vulnerable to retroactive cognitive interference. Moreover, educational psychologists emphasize that isolated visual flashcards foster passive recognition rather than productive lexical fluency, leaving adult learners ill-equipped to spontaneously retrieve grammatical constructions under real-world communicative pressure."
        },
        {
          id: "B",
          text: "To investigate whether multimodal motor encoding can bridge this retention gap, the Cognitive Linguistics Laboratory at Heston University developed an experimental pedagogical framework termed Integrated Tactile Gestural Signaling (ITGS). Rather than learning abstract vocabulary through graphic orthography alone, participants accompany each target word with a distinct, standardized three-dimensional hand gesture executed across defined spatial planes in front of the torso. For example, temporal concepts signifying anterior events require a sharp outward palm rotation, while hierarchical authority terms involve a stepped vertical finger progression. These gestures are not random pantomimes; they are kinesthetic spatial metaphors designed to recruit motor planning networks simultaneously with phonological encoding. Crucially, the gestural signs are standardized to eliminate idiosyncrasies, ensuring that motor memory traces remain uniform across large student cohorts regardless of individual handedness or cultural background."
        },
        {
          id: "C",
          text: "Neuroimaging scans using functional magnetic resonance imaging (fMRI) demonstrated that executing tactile signs during learning fundamentally alters brain activation topography. In control subjects engaged in traditional text-based repetition, neural blood oxygenation remained confined to the left inferior frontal gyrus and superior temporal sulcus. In the ITGS cohort, however, metabolic activity illuminated the bilateral superior parietal lobules and the premotor cortex—regions responsible for spatial body mapping and kinesthetic motor planning. By engaging motor circuits simultaneously with auditory perception, tactile gestures construct cross-modal neural anchors that stabilize vocabulary representations against interference, essentially distributing the memory trace across multiple cortical regions. Electroencephalogram (EEG) recordings corroborated these hemodynamic findings by capturing elevated theta-band coherence between frontal and parietal leads during the encoding window, an established electrophysiological biomarker of deep memory consolidation."
        },
        {
          id: "D",
          text: "The experimental protocol subjected adult learners to a rigorous four-phase trial spanning ninety days. In Phase 1, participants received baseline neurocognitive profiling to calibrate individual working memory capacity. In Phase 2, learners memorized one hundred pseudowords paired with specific real-world semantic concepts; half the cohort used traditional flashcards, while the other half practiced paired tactile gestures. Phase 3 introduced an intensive distraction battery consisting of arithmetic tasks and foreign-language audio interference to test memory robustness under cognitive load. Finally, Phase 4 conducted delayed lexical retrieval evaluations at thirty, sixty, and ninety days without interim practice to assess durable storage."
        },
        {
          id: "E",
          text: "The longitudinal outcomes revealed marked performance disparities. After thirty days, learners in the tactile gestural cohort demonstrated an eighty-two percent accurate retrieval rate, compared with only forty-seven percent among traditional learners. By day ninety, the disparity widened further: ITGS participants retained nearly sixty-eight percent of the target vocabulary, whereas control retention collapsed to twenty-one percent. Strikingly, response latency tests demonstrated that tactile learners retrieved complex abstract verbs nearly 320 milliseconds faster than the control group, suggesting that gestural encoding facilitates direct access to semantic memory without requiring silent intermediate orthographic decoding or phonological translation. Qualitative learner feedback revealed that physical signing also mitigated performance anxiety during speaking examinations, providing students with a discreet kinesthetic anchor that restored confidence when searching for elusive foreign expressions."
        },
        {
          id: "F",
          text: "These findings hold transformative implications beyond foreign language learning. Researchers are already testing modified ITGS protocols in clinical rehabilitation settings to assist stroke survivors recovering from expressive aphasia. When brain trauma damages left-hemisphere speech production networks, the preserved spatial motor pathways of the right hemisphere can be co-opted via physical gestures to re-establish communicative pathways. Furthermore, educational software designers are integrating motion-tracking depth cameras into remote learning interfaces, allowing algorithms to verify student gestural accuracy and deliver real-time kinesthetic feedback during self-directed online study, bridging distance learning with embodied cognition."
        }
      ],
      glossary: [
        { term: "aphasia", def: "loss of ability to understand or express speech, caused by brain damage" },
        { term: "kinesthetic", def: "relating to a person's awareness of the position and movement of the parts of the body" }
      ],
      questionGroups: [
        {
          groupId: "ie-ac-rd-02-g5",
          type: "matching_info",
          qRange: [14, 18],
          reuseAllowed: true,
          instructionEn: "Questions 14–18: Reading Passage 2 has six paragraphs, A–F. Which paragraph contains the following information? NB You may use any letter more than once.",
          instructionVi: "Ghép từng thông tin dưới đây với đoạn văn (A–F) chứa thông tin đó. Chú ý: bạn có thể dùng bất kỳ chữ cái nào nhiều hơn một lần.",
          sharedOptions: [
            { key: "A", text: "Paragraph A" },
            { key: "B", text: "Paragraph B" },
            { key: "C", text: "Paragraph C" },
            { key: "D", text: "Paragraph D" },
            { key: "E", text: "Paragraph E" },
            { key: "F", text: "Paragraph F" }
          ],
          questions: [
            {
              q: 14,
              type: "matching_info",
              stem: "Brain regions outside the traditional speech centers that become active during gestural learning.",
              answer: "C",
              accept: ["C"],
              evidence: {
                ref: "C",
                quote: "metabolic activity illuminated the bilateral superior parietal lobules and the premotor cortex—regions responsible for spatial body mapping and kinesthetic motor planning."
              },
              explanationVi: "Đoạn C nêu rõ các vùng não như thuỳ đỉnh trên hai bên và vỏ não tiền vận động sáng lên khi học có cử chỉ -> C."
            },
            {
              q: 15,
              type: "matching_info",
              stem: "A description of the chronological stages comprising the laboratory testing procedure.",
              answer: "D",
              accept: ["D"],
              evidence: {
                ref: "D",
                quote: "The experimental protocol subjected adult learners to a rigorous four-phase trial spanning ninety days. In Phase 1... In Phase 2... Phase 3... Finally, Phase 4..."
              },
              explanationVi: "Đoạn D mô tả chi tiết 4 giai đoạn theo thứ tự thời gian của quy trình thí nghiệm kéo dài 90 ngày -> D."
            },
            {
              q: 16,
              type: "matching_info",
              stem: "Statistical evidence demonstrating the rapid rate at which conventionally acquired vocabulary is lost.",
              answer: "A",
              accept: ["A"],
              evidence: {
                ref: "A",
                quote: "within four weeks of unreinforced study, adult students typically forget between forty and sixty percent of newly acquired lexical items."
              },
              explanationVi: "Đoạn A đưa ra số liệu thống kê: trong 4 tuần không ôn tập, học viên người lớn quên từ 40% đến 60% từ mới học -> A."
            },
            {
              q: 17,
              type: "matching_info",
              stem: "Potential therapeutic applications of gestural training for individuals recovering from neural trauma.",
              answer: "F",
              accept: ["F"],
              evidence: {
                ref: "F",
                quote: "Researchers are already testing modified ITGS protocols in clinical rehabilitation settings to assist stroke survivors recovering from expressive aphasia."
              },
              explanationVi: "Đoạn F bàn về ứng dụng điều trị lâm sàng hỗ trợ bệnh nhân đột quỵ hồi phục chứng mất ngôn ngữ biểu đạt -> F."
            },
            {
              q: 18,
              type: "matching_info",
              stem: "Examples of specific physical hand movements used to convey particular grammatical or conceptual ideas.",
              answer: "B",
              accept: ["B"],
              evidence: {
                ref: "B",
                quote: "For example, temporal concepts signifying anterior events require a sharp outward palm rotation, while hierarchical authority terms involve a stepped vertical finger progression."
              },
              explanationVi: "Đoạn B mô tả cụ thể cử chỉ xoay lòng bàn tay cho khái niệm thời gian và cử chỉ ngón tay bậc thang cho thuật ngữ quyền lực -> B."
            }
          ]
        },
        {
          groupId: "ie-ac-rd-02-g6",
          type: "gap_fill",
          subType: "flowchart_completion",
          wordLimit: "ONE_WORD_ONLY",
          wordLimitLabel: "ONE WORD ONLY",
          qRange: [19, 22],
          instructionEn: "Questions 19–22: Complete the flowchart below. Choose ONE WORD ONLY from the passage for each answer.",
          instructionVi: "Hoàn thành lưu đồ 4 giai đoạn thử nghiệm dưới đây. Chọn DUY NHẤT MỘT TỪ từ bài đọc cho mỗi câu.",
          contextTitle: "Four Phases of the Heston University Memory Study",
          questions: [
            {
              q: 19,
              type: "gap_fill",
              wordLimit: "ONE_WORD_ONLY",
              stem: "Phase 1: Initial neurocognitive testing to measure each learner's working memory {{gap}}.",
              answer: "capacity",
              accept: ["capacity"],
              evidence: {
                ref: "D",
                quote: "In Phase 1, participants received baseline neurocognitive profiling to calibrate individual working memory capacity."
              },
              explanationVi: "Đoạn D ghi rõ Giai đoạn 1 kiểm tra để hiệu chuẩn dung lượng trí nhớ làm việc (working memory capacity) -> đáp án là 'capacity'."
            },
            {
              q: 20,
              type: "gap_fill",
              wordLimit: "ONE_WORD_ONLY",
              stem: "Phase 2: Learners memorized one hundred {{gap}} using either gestures or flashcards.",
              answer: "pseudowords",
              accept: ["pseudowords"],
              evidence: {
                ref: "D",
                quote: "In Phase 2, learners memorized one hundred pseudowords paired with specific real-world semantic concepts..."
              },
              explanationVi: "Đoạn D cho biết người học phải ghi nhớ 100 từ giả (pseudowords) -> đáp án là 'pseudowords'."
            },
            {
              q: 21,
              type: "gap_fill",
              wordLimit: "ONE_WORD_ONLY",
              stem: "Phase 3: Participants performed mental arithmetic and were exposed to audio {{gap}}.",
              answer: "interference",
              accept: ["interference"],
              evidence: {
                ref: "D",
                quote: "Phase 3 introduced an intensive distraction battery consisting of arithmetic tasks and foreign-language audio interference..."
              },
              explanationVi: "Đoạn D nêu Giai đoạn 3 gây nhiễu bằng bài tập tính toán và nhiễu âm thanh tiếng nước ngoài (audio interference) -> đáp án là 'interference'."
            },
            {
              q: 22,
              type: "gap_fill",
              wordLimit: "ONE_WORD_ONLY",
              stem: "Phase 4: Final evaluations measured both accuracy and retrieval {{gap}} under delayed conditions.",
              answer: "latency",
              accept: ["latency"],
              evidence: {
                ref: "E",
                quote: "Strikingly, response latency tests demonstrated that tactile learners retrieved complex abstract verbs nearly 320 milliseconds faster..."
              },
              explanationVi: "Đoạn E nhắc tới các bài kiểm tra độ trễ phản hồi (response latency tests) khi truy xuất từ vựng -> đáp án là 'latency'."
            }
          ]
        },
        {
          groupId: "ie-ac-rd-02-g7",
          type: "mcq_multi",
          qRange: [23, 24],
          pickCount: 2,
          correctSet: ["A", "D"],
          instructionEn: "Questions 23–24: Choose TWO letters, A–E. Which TWO neurological effects were observed in learners utilizing the ITGS method?",
          instructionVi: "Chọn HAI chữ cái A–E nêu đúng các tác động thần kinh quan sát được ở người học dùng phương pháp ITGS.",
          sharedOptions: [
            { key: "A", text: "Stimulation of parietal regions involved in spatial processing." },
            { key: "B", text: "Permanent suppression of activity in the left inferior frontal gyrus." },
            { key: "C", text: "Complete elimination of cognitive fatigue during mental distraction tasks." },
            { key: "D", text: "Engagement of premotor cortex circuits governing movement coordination." },
            { key: "E", text: "Rapid reorganization of the visual primary cortex in both hemispheres." }
          ],
          questions: [
            {
              q: 23,
              type: "mcq_multi",
              stem: "Neurological effect of gestural learning (First finding)",
              answer: "A",
              accept: ["A"],
              evidence: {
                ref: "C",
                quote: "In the ITGS cohort, however, metabolic activity illuminated the bilateral superior parietal lobules..."
              },
              explanationVi: "Kích thích các vùng đỉnh hai bên não tham gia xử lý không gian (superior parietal lobules) -> A."
            },
            {
              q: 24,
              type: "mcq_multi",
              stem: "Neurological effect of gestural learning (Second finding)",
              answer: "D",
              accept: ["D"],
              evidence: {
                ref: "C",
                quote: "and the premotor cortex—regions responsible for spatial body mapping and kinesthetic motor planning."
              },
              explanationVi: "Kích hoạt các mạch vỏ não tiền vận động quản lý kế hoạch vận động (premotor cortex) -> D."
            }
          ]
        },
        {
          groupId: "ie-ac-rd-02-g8",
          type: "mcq_multi",
          qRange: [25, 26],
          pickCount: 2,
          correctSet: ["B", "C"],
          instructionEn: "Questions 25–26: Choose TWO letters, A–E. Which TWO technological developments are currently underway to expand gestural vocabulary instruction?",
          instructionVi: "Chọn HAI chữ cái A–E chỉ hai hướng phát triển công nghệ đang được triển khai.",
          sharedOptions: [
            { key: "A", text: "Direct neural implants that bypass defective motor planning pathways." },
            { key: "B", text: "Depth-sensing optical cameras to track learner gestures in online environments." },
            { key: "C", text: "Automated software delivering immediate feedback on gestural precision." },
            { key: "D", text: "Voice synthesis algorithms that translate hand motions into audible speech." },
            { key: "E", text: "Virtual reality headsets that simulate classical auditory classrooms." }
          ],
          questions: [
            {
              q: 25,
              type: "mcq_multi",
              stem: "Technological development underway (First development)",
              answer: "B",
              accept: ["B"],
              evidence: {
                ref: "F",
                quote: "educational software designers are integrating motion-tracking depth cameras into remote learning interfaces..."
              },
              explanationVi: "Tích hợp camera cảm biến chiều sâu quang học để theo dõi cử chỉ người học từ xa -> B."
            },
            {
              q: 26,
              type: "mcq_multi",
              stem: "Technological development underway (Second development)",
              answer: "C",
              accept: ["C"],
              evidence: {
                ref: "F",
                quote: "allowing algorithms to verify student gestural accuracy and deliver real-time kinesthetic feedback during self-directed online study."
              },
              explanationVi: "Phần mềm tự động đánh giá độ chính xác của cử chỉ và cung cấp phản hồi tức thời -> C."
            }
          ]
        }
      ]
    },
    {
      id: "ie-ac-rd-02-p3",
      passageIndex: 3,
      qRange: [27, 40],
      title: "Scarcity Framing and Long-Horizon Decision Making in Public Commons",
      subtitle: "Experimental behavioral economics examining the paradoxical consequences of crisis communication in shared resource management",
      topic: "Behavioral Economics & Environmental Policy",
      targetBand: "7.5–9.0",
      style: "academic_discursive",
      wordCount: 880,
      paragraphs: [
        {
          id: "A",
          text: "When municipal water authorities or fisheries commissions attempt to avert resource depletion, their instinctual communications strategy is to issue dire warnings highlighting imminent exhaustion. Billboards proclaim that reservoir reserves have dwindled to perilous thresholds, while news bulletins emphasise that target fish stocks stand on the brink of commercial extinction. The underlying assumption is rooted in classical rational-choice theory: informed resource users, confronted with stark evidence of impending scarcity, will rationally temper their consumption to preserve the common-pool good. Over the past fifteen years, however, experimental behavioral economists have accumulated troubling evidence demonstrating that crisis-centric scarcity framing frequently triggers the exact opposite reaction—accelerating aggressive resource appropriation through a psychological mechanism known as competitive pre-emption."
        },
        {
          id: "B",
          text: "The mechanics of competitive pre-emption stem from asymmetrical trust and profound social alienation. In a shared commons where extraction cannot be seamlessly policed, informing an individual that a vital resource is disappearing does not merely induce conservation anxiety; it signals that one's neighbours will soon extract whatever remains. Under conditions of low social cohesion, restraint ceases to look like stewardship; instead, it appears as unilateral self-harm. A fisher who voluntarily restricts their catch does not save the breeding stock; they merely leave vulnerable biomass for less scrupulous competitors to haul ashore. Consequently, apocalyptic scarcity messaging paradoxically incentivises users to front-load their harvesting, triggering a rational race to the bottom that hastens the very ecological collapse public authorities sought to prevent."
        },
        {
          id: "C",
          text: "To isolate the behavioral dynamics governing this dilemma, Professor Aris Thorne at the Zurich Institute for Collective Decision Science designed a simulated common-pool groundwater experiment. Groups of six anonymous participants managed a digital aquifer endowed with stochastic seasonal replenishment rates. Across forty successive trial rounds, subjects could withdraw varying volumes of water, with unextracted reserves generating compounded collective interest. Each round represented a distinct seasonal agricultural pumping cycle, with anonymous peer decisions revealed only in the aggregate at the conclusion of each trading period. In the baseline control condition, participants received neutral graphical data tracking remaining water levels. In the acute scarcity treatment, by contrast, flashing red warnings continually reminded players that current extraction trajectories would trigger irreversible aquifer collapse within five rounds."
        },
        {
          id: "D",
          text: "The behavioral divergence between treatments was both immediate and profound. While participants in the neutral feedback condition maintained cooperative extraction rates that allowed the aquifer to regenerate indefinitely, groups exposed to high-frequency scarcity alerts collapsed their shared reserves in seventy-eight percent of experimental trials. Post-experiment debriefing interviews revealed a consistent psychological shift: the crisis alerts dissolved normative expectations of community reciprocity. Participants reported feeling overwhelming pressure to maximize immediate payouts before rogue players emptied the reservoir. Fear of being played for a 'sucker' overpowered long-term sustainability calculations, proving that urgency messaging often fractures social capital faster than gradual ecological degradation itself."
        },
        {
          id: "E",
          text: "Intriguingly, Thorne's research team uncovered an alternative communication paradigm that fostered durable resource stewardship without triggering panic extraction. In a third experimental condition termed 'regenerative threshold signaling', players were not bombarded with extinction deadlines. Instead, interfaces displayed clear, positive indicators highlighting proximity to biological renewal milestones—for instance, showing how a modest five percent reduction in collective pumping would allow natural recharge rates to surpass daily extraction within two rounds. Computational tracking revealed that the regenerative visual framing transformed the psychological perception of restraint from an uncompensated individual sacrifice into an active collective investment. When presented with tangible, proximate recovery thresholds, participants shifted their focus from competitive pre-emption toward coordinated stewardship, achieving sustained conservation rates twenty-four percent higher than even the neutral control baseline."
        },
        {
          id: "F",
          text: "Translating these laboratory insights into real-world public policy requires unseating entrenched institutional habits. Environmental ministries and non-governmental advocacy groups remain deeply addicted to alarmist rhetoric, partly because catastrophe narratives generate sensational headlines and drive short-term political donations. However, treating the public as panic-prone consumers rather than capable collective stewards carries immense hidden costs. When regulatory agencies perpetually cry wolf without providing transparent, co-managed recovery frameworks, they cultivate chronic civic cynicism, eroding the foundational social trust required to govern shared aquifers, grazing pastures, and atmosphere commons over generational horizons."
        },
        {
          id: "G",
          text: "Ultimately, sustainable commons governance requires aligning information architecture with human social psychology. Communities do not conserve resources out of abstract fear; they conserve when they believe their sacrifices are reciprocated by their peers and when the path toward tangible ecological restoration is clearly delineated. Public authorities must abandon sensationalist scarcity theatre and invest in institutions that build civic transparency, verifiable peer monitoring, and positive regenerative targets. The question facing twenty-first-century environmental leadership is not whether our shared commons are endangered, but whether our governance narratives will inspire collective solidarity or panic-fuelled competitive exhaustion."
        }
      ],
      glossary: [
        { term: "common-pool resource", def: "a resource that is non-excludable but rival in consumption, like fish stocks or groundwater" },
        { term: "stochastic", def: "having a random probability distribution or pattern that may be analyzed statistically but may not be predicted precisely" }
      ],
      questionGroups: [
        {
          groupId: "ie-ac-rd-02-g9",
          type: "mcq_single",
          qRange: [27, 30],
          instructionEn: "Questions 27–30: Choose the correct letter, A, B, C or D.",
          instructionVi: "Chọn chữ cái đúng nhất A, B, C hoặc D.",
          questions: [
            {
              q: 27,
              type: "mcq_single",
              stem: "In Paragraph A, what assumption underlies traditional crisis communication by resource authorities?",
              options: [
                { key: "A", text: "Consumers are largely indifferent to biological extinction statistics." },
                { key: "B", text: "Informed users will logically reduce consumption when alerted to impending scarcity." },
                { key: "C", text: "Stricter policing is always necessary to prevent illegal poaching." },
                { key: "D", text: "Market mechanisms automatically adjust pricing to prevent resource collapse." }
              ],
              answer: "B",
              accept: ["B"],
              evidence: {
                ref: "A",
                quote: "The underlying assumption is rooted in classical rational-choice theory: informed resource users, confronted with stark evidence of impending scarcity, will rationally temper their consumption..."
              },
              explanationVi: "Đoạn A nêu giả định cốt lõi dựa trên lý thuyết lựa chọn duy lý: người dùng khi được báo tin sắp cạn kiệt tài nguyên sẽ tự giác giảm tiêu thụ để bảo vệ tài sản chung -> B."
            },
            {
              q: 28,
              type: "mcq_single",
              stem: "What is the primary psychological driver of 'competitive pre-emption' described in Paragraph B?",
              options: [
                { key: "A", text: "The desire to maximize speculative profits on black markets." },
                { key: "B", text: "The fear that other users will extract whatever resources remain." },
                { key: "C", text: "A complete lack of awareness regarding environmental regulations." },
                { key: "D", text: "Deep skepticism toward government scientific data." }
              ],
              answer: "B",
              accept: ["B"],
              evidence: {
                ref: "B",
                quote: "informing an individual that a vital resource is disappearing does not merely induce conservation anxiety; it signals that one's neighbours will soon extract whatever remains."
              },
              explanationVi: "Đoạn B chỉ ra động lực chính: cảnh báo cạn kiệt phát tín hiệu rằng những người khác sẽ nhanh tay vơ vét nốt phần còn lại, kích hoạt cuộc chạy đua khai thác trước -> B."
            },
            {
              q: 29,
              type: "mcq_single",
              stem: "What happened during Professor Thorne's groundwater experiment in the acute scarcity condition?",
              options: [
                { key: "A", text: "Players banded together to demand stricter algorithmic regulations." },
                { key: "B", text: "The shared water reserve collapsed in seventy-eight percent of trials." },
                { key: "C", text: "Participants voluntarily donated their interest payouts to a communal reserve." },
                { key: "D", text: "Extraction rates remained stable due to continuous visual warnings." }
              ],
              answer: "B",
              accept: ["B"],
              evidence: {
                ref: "D",
                quote: "while groups exposed to high-frequency scarcity alerts collapsed their shared reserves in seventy-eight percent of experimental trials."
              },
              explanationVi: "Đoạn D xác nhận ở điều kiện cảnh báo cạn kiệt khẩn cấp, các nhóm tham gia đã làm sụp đổ nguồn nước chung trong 78% số lần thử nghiệm -> B."
            },
            {
              q: 30,
              type: "mcq_single",
              stem: "Why did 'regenerative threshold signaling' prove so effective in the third experimental condition?",
              options: [
                { key: "A", text: "It rewarded the most competitive extractors with monetary bonuses." },
                { key: "B", text: "It focused player attention on achievable milestones for collective recovery." },
                { key: "C", text: "It hid real-time data regarding remaining water levels from participants." },
                { key: "D", text: "It penalized players who exceeded their designated daily quota." }
              ],
              answer: "B",
              accept: ["B"],
              evidence: {
                ref: "E",
                quote: "When presented with tangible, proximate recovery thresholds, participants shifted their focus from competitive pre-emption toward coordinated stewardship..."
              },
              explanationVi: "Cách tiếp cận này đưa ra các mốc phục hồi hữu hình, gần gũi, giúp người chơi chuyển sự chú ý sang việc phối hợp bảo tồn thay vì lo sợ bị cướp mất -> B."
            }
          ]
        },
        {
          groupId: "ie-ac-rd-02-g10",
          type: "gap_fill",
          subType: "summary_wordbank",
          qRange: [31, 35],
          instructionEn: "Questions 31–35: Complete the summary below using the list of words, A–H, below.",
          instructionVi: "Hoàn thành đoạn tóm tắt dưới đây bằng cách chọn chữ cái thích hợp từ kho từ vựng A–H.",
          sharedOptions: [
            { key: "A", text: "panic" },
            { key: "B", text: "donations" },
            { key: "C", text: "transparency" },
            { key: "D", text: "cynicism" },
            { key: "E", text: "indifference" },
            { key: "F", text: "stewardship" },
            { key: "G", text: "enforcement" },
            { key: "H", text: "catastrophe" }
          ],
          questions: [
            {
              q: 31,
              type: "gap_fill",
              stem: "Environmental organizations often rely on narratives of imminent {{gap}} because they attract media attention and boost financial support.",
              answer: "H",
              accept: ["H"],
              evidence: {
                ref: "F",
                quote: "Environmental ministries and non-governmental advocacy groups remain deeply addicted to alarmist rhetoric, partly because catastrophe narratives generate sensational headlines..."
              },
              explanationVi: "Các tổ chức môi trường dựa dẫm vào các câu chuyện thảm hoạ (catastrophe narratives) để giật tít truyền thông -> H (catastrophe)."
            },
            {
              q: 32,
              type: "gap_fill",
              stem: "These alarmist campaigns are effective at generating short-term public {{gap}}.",
              answer: "B",
              accept: ["B"],
              evidence: {
                ref: "F",
                quote: "partly because catastrophe narratives generate sensational headlines and drive short-term political donations."
              },
              explanationVi: "Các câu chuyện giật gân thúc đẩy các khoản quyên góp chính trị ngắn hạn (donations) -> B (donations)."
            },
            {
              q: 33,
              type: "gap_fill",
              stem: "However, constantly sounding alarms without offering realistic solutions creates widespread civic {{gap}}.",
              answer: "D",
              accept: ["D"],
              evidence: {
                ref: "F",
                quote: "When regulatory agencies perpetually cry wolf without providing transparent, co-managed recovery frameworks, they cultivate chronic civic cynicism..."
              },
              explanationVi: "Việc liên tục la làng 'sói đến' mà không có giải pháp sẽ nuôi dưỡng tâm lý hoài nghi công dân kinh niên (civic cynicism) -> D (cynicism)."
            },
            {
              q: 34,
              type: "gap_fill",
              stem: "Effective commons governance requires building systems founded on civic {{gap}} and mutual peer monitoring.",
              answer: "C",
              accept: ["C"],
              evidence: {
                ref: "G",
                quote: "Public authorities must abandon sensationalist scarcity theatre and invest in institutions that build civic transparency, verifiable peer monitoring..."
              },
              explanationVi: "Quản trị tài sản chung đòi hỏi xây dựng các thể chế dựa trên sự minh bạch công dân (civic transparency) và giám sát lẫn nhau -> C (transparency)."
            },
            {
              q: 35,
              type: "gap_fill",
              stem: "Communities will only engage in long-term resource {{gap}} when they trust that others are reciprocating their sacrifices.",
              answer: "F",
              accept: ["F"],
              evidence: {
                ref: "G",
                quote: "Communities do not conserve resources out of abstract fear; they conserve when they believe their sacrifices are reciprocated by their peers..."
              },
              explanationVi: "Cộng đồng chỉ duy trì việc quản trị/bảo tồn tài nguyên lâu dài (stewardship) khi tin tưởng rằng người khác cũng chia sẻ sự hy sinh của mình -> F (stewardship)."
            }
          ]
        },
        {
          groupId: "ie-ac-rd-02-g11",
          type: "ynng",
          qRange: [36, 40],
          instructionEn: "Questions 36–40: Do the following statements agree with the views of the writer in Reading Passage 3? Write YES, NO or NOT GIVEN.",
          instructionVi: "Chọn YES nếu nhận định phản ánh đúng quan điểm của tác giả, NO nếu trái ngược quan điểm tác giả, hoặc NOT GIVEN nếu bài không nêu đủ thông tin.",
          questions: [
            {
              q: 36,
              type: "ynng",
              stem: "Alarmist messages cause resource users to harvest remaining assets more rapidly than they otherwise would.",
              options: [
                { key: "YES", text: "YES" },
                { key: "NO", text: "NO" },
                { key: "NOT GIVEN", text: "NOT GIVEN" }
              ],
              answer: "YES",
              accept: ["yes"],
              evidence: {
                ref: "B",
                quote: "apocalyptic scarcity messaging paradoxically incentivises users to front-load their harvesting, triggering a rational race to the bottom..."
              },
              explanationVi: "Tác giả chỉ rõ các thông điệp cạn kiệt tận thế nghịch lý thúc đẩy người dùng vội vã khai thác sớm trước người khác -> YES."
            },
            {
              q: 37,
              type: "ynng",
              stem: "Participants in Professor Thorne's neutral control condition exhausted their groundwater within twenty rounds.",
              options: [
                { key: "YES", text: "YES" },
                { key: "NO", text: "NO" },
                { key: "NOT GIVEN", text: "NOT GIVEN" }
              ],
              answer: "NO",
              accept: ["no"],
              evidence: {
                ref: "D",
                quote: "While participants in the neutral feedback condition maintained cooperative extraction rates that allowed the aquifer to regenerate indefinitely..."
              },
              explanationVi: "Đoạn D nêu người chơi ở điều kiện trung lập duy trì tốc độ khai thác hợp tác cho phép tầng ngậm nước tái tạo vô hạn, không hề bị cạn kiệt trong 20 vòng -> mâu thuẫn -> NO."
            },
            {
              q: 38,
              type: "ynng",
              stem: "Researchers have identified several real-world coastal fisheries that successfully employ regenerative threshold signaling.",
              options: [
                { key: "YES", text: "YES" },
                { key: "NO", text: "NO" },
                { key: "NOT GIVEN", text: "NOT GIVEN" }
              ],
              answer: "NOT GIVEN",
              accept: ["not given"],
              evidence: {
                ref: "E",
                quote: "In a third experimental condition termed 'regenerative threshold signaling', players were not bombarded with extinction deadlines."
              },
              explanationVi: "Bài đọc chỉ nói phương pháp này được nhóm nghiên cứu của Thorne thử nghiệm trong phòng thí nghiệm máy tính, hoàn toàn không nhắc tới việc có ngư trường ven biển thực tế nào đã áp dụng hay chưa -> NOT GIVEN."
            },
            {
              q: 39,
              type: "ynng",
              stem: "Non-governmental organizations should prioritize scientific accuracy over fundraising appeals.",
              options: [
                { key: "YES", text: "YES" },
                { key: "NO", text: "NO" },
                { key: "NOT GIVEN", text: "NOT GIVEN" }
              ],
              answer: "YES",
              accept: ["yes"],
              evidence: {
                ref: "F",
                quote: "Public authorities must abandon sensationalist scarcity theatre and invest in institutions that build civic transparency..."
              },
              explanationVi: "Tác giả phê phán việc các tổ chức nghiện dùng luận điệu báo động giật gân để gây quỹ và yêu cầu từ bỏ thứ 'kịch trường cạn kiệt giật gân' này để hướng tới sự minh bạch -> YES."
            },
            {
              q: 40,
              type: "ynng",
              stem: "Fear of legal penalties is the single most effective motivation for sustainable resource conservation.",
              options: [
                { key: "YES", text: "YES" },
                { key: "NO", text: "NO" },
                { key: "NOT GIVEN", text: "NOT GIVEN" }
              ],
              answer: "NO",
              accept: ["no"],
              evidence: {
                ref: "G",
                quote: "Communities do not conserve resources out of abstract fear; they conserve when they believe their sacrifices are reciprocated by their peers and when the path toward tangible ecological restoration is clearly delineated."
              },
              explanationVi: "Tác giả khẳng định cộng đồng KHÔNG bảo tồn vì nỗi sợ trừu tượng (như sợ bị phạt), mà bảo tồn khi thấy sự hy sinh của mình được chia sẻ và có lộ trình phục hồi rõ ràng -> NO."
            }
          ]
        }
      ]
    }
  ]
};

module.exports = test2;
