/* town.js — 🏙 THÀNH PHỐ WORDLOOP (bản mẫu, TJ 2026-11-27: "làm đi, là con người nha. Thế giới đẹp").
   · Thành phố 3D nhỏ trong trình duyệt (three.js từ CDN, không có bước build). Mọi hình đều dựng bằng code
     (không dùng mô hình/hình ảnh của game nào khác) nên không lo bản quyền.
   · Người chơi đi lại (WASD / mũi tên / cần điều khiển trên điện thoại), tới gần người trong phố bấm E (hoặc nút)
     để nói chuyện. Mỗi người có 1 nhiệm vụ 2 câu: nghe câu của họ, rồi NÓI câu trả lời vào micro.
   · Nhận giọng = Web Speech API của trình duyệt (miễn phí, giống cc.js / readalong.js). Không có thì gõ.
   · Chấm điểm = so từng từ (không gọi AI, không tốn tiền). 4 thứ tiếng: en / es / zh / vi.
   · 2026-11-28 (TJ): người chơi + người dân đều là THÚ CUTE (animals.js). Vào là màn TẠO NHÂN VẬT (tên, con vật,
     màu lông, áo, quần/váy, phụ kiện — nhớ theo máy). Chọn chơi 1 mình, hoặc tạo/vào PHÒNG (net.js, kênh Supabase
     "town:<mã>", không lưu database). Trong phòng: thấy nhau đi lại, mời nhau NHẬP VAI theo kịch bản của từng người dân.
*/
import * as THREE from "three";
import { Sky } from "three/addons/objects/Sky.js";
import { makeAnimal, animateAnimal, SPECIES, FURS, SHIRTS, PANTS, ACCS } from "./animals.js?v=2";
import { createNet } from "./net.js?v=2";

/* ───────────────────────── Nội dung: 8 người dân, mỗi người 2 lượt hỏi-đáp, 4 thứ tiếng. roles = [vai người dân, vai khách] cho nhập vai cặp đôi ───────────────────────── */
const LOCALE = { en: "en-US", es: "es-ES", zh: "zh-CN", vi: "vi-VN" };
const NPCS = [
  {
    id: "cafe", icon: "☕", title: "Gọi cà phê ở quán", name: "Linh", role: "chủ quán cà phê",
    pos: [-27.2, -6], face: Math.PI / 2,
    look: { species: "cat", fur: "#f3b46a", shirt: "#ffffff", pants: "#3a3f5c", apron: "#7a4b2a", acc: "bow", accColor: "#ff4f7b", female: true },
    roles: ["Chủ quán", "Khách gọi món"],
    steps: [
      { npc: { en: "Hi! What would you like to drink?", es: "¡Hola! ¿Qué te gustaría tomar?", zh: "你好！你想喝点什么？", vi: "Chào bạn! Bạn muốn uống gì?" },
        say: { en: "Can I have an iced coffee, please?", es: "Quiero un café con hielo, por favor.", zh: "请给我一杯冰咖啡。", vi: "Cho tôi một ly cà phê đá nhé." },
        py: "Qǐng gěi wǒ yì bēi bīng kāfēi." },
      { npc: { en: "Sure! Anything else?", es: "¡Claro! ¿Algo más?", zh: "好的！还要别的吗？", vi: "Được ạ! Bạn cần gì thêm không?" },
        say: { en: "No, thank you. How much is it?", es: "No, gracias. ¿Cuánto es?", zh: "不用了，谢谢。多少钱？", vi: "Không, cảm ơn. Bao nhiêu tiền vậy?" },
        py: "Búyòng le, xièxie. Duōshao qián?" },
    ],
    end: { en: "That's three dollars. Enjoy!", es: "Son tres euros. ¡Que lo disfrutes!", zh: "二十块。请慢用！", vi: "Ba mươi nghìn ạ. Chúc bạn ngon miệng!" },
  },
  {
    id: "station", icon: "🚉", title: "Mua vé tàu ở nhà ga", name: "Carlos", role: "nhân viên bán vé",
    pos: [0, -30.2], face: 0,
    look: { species: "dog", fur: "#c48a5a", shirt: "#2f4f8f", pants: "#1f2433", acc: "cap", accColor: "#2f4f8f", female: false },
    roles: ["Nhân viên bán vé", "Hành khách"],
    steps: [
      { npc: { en: "Good morning! Where are you going?", es: "¡Buenos días! ¿Adónde va?", zh: "早上好！你要去哪儿？", vi: "Chào buổi sáng! Bạn đi đâu vậy?" },
        say: { en: "One ticket to the beach, please.", es: "Un billete a la playa, por favor.", zh: "一张去海边的票，谢谢。", vi: "Cho tôi một vé đi biển." },
        py: "Yì zhāng qù hǎibiān de piào, xièxie." },
      { npc: { en: "Single or return?", es: "¿De ida o de ida y vuelta?", zh: "单程还是往返？", vi: "Vé một chiều hay khứ hồi?" },
        say: { en: "Return, please. What time is the next train?", es: "De ida y vuelta. ¿A qué hora sale el próximo tren?", zh: "往返。下一班火车几点？", vi: "Khứ hồi. Mấy giờ có chuyến tàu tiếp theo?" },
        py: "Wǎngfǎn. Xià yì bān huǒchē jǐ diǎn?" },
    ],
    end: { en: "At ten o'clock. Have a nice trip!", es: "A las diez. ¡Buen viaje!", zh: "十点。旅途愉快！", vi: "Lúc mười giờ. Chúc bạn đi vui vẻ!" },
  },
  {
    id: "market", icon: "🍊", title: "Mua trái cây ở chợ", name: "Mei", role: "người bán trái cây",
    pos: [26.4, -6], face: -Math.PI / 2,
    look: { species: "panda", shirt: "#e46f5b", pants: "#4a6b3c", skirt: true, female: true },
    roles: ["Người bán", "Người mua"],
    steps: [
      { npc: { en: "Fresh fruit today! What do you need?", es: "¡Fruta fresca hoy! ¿Qué necesita?", zh: "今天的水果很新鲜！你要什么？", vi: "Trái cây tươi đây! Bạn cần gì?" },
        say: { en: "I would like two mangoes.", es: "Quiero dos mangos.", zh: "我想要两个芒果。", vi: "Tôi muốn mua hai quả xoài." },
        py: "Wǒ xiǎng yào liǎng ge mángguǒ." },
      { npc: { en: "Here you are. Anything else?", es: "Aquí tiene. ¿Algo más?", zh: "给你。还要别的吗？", vi: "Đây ạ. Còn gì nữa không?" },
        say: { en: "How much are these oranges?", es: "¿Cuánto cuestan estas naranjas?", zh: "这些橙子多少钱？", vi: "Mấy quả cam này bao nhiêu tiền?" },
        py: "Zhèxiē chéngzi duōshao qián?" },
    ],
    end: { en: "Five for two dollars!", es: "¡Cinco por dos euros!", zh: "五个十块钱！", vi: "Năm quả hai mươi nghìn!" },
  },
  {
    id: "tourist", icon: "🗺", title: "Chỉ đường cho du khách", name: "Emma", role: "du khách bị lạc",
    pos: [0, 8.2], face: 0,
    look: { species: "bunny", fur: "#ffffff", shirt: "#f2c14e", pants: "#5b7fb5", acc: "bag", accColor: "#8a5a3c", female: true },
    roles: ["Du khách", "Người chỉ đường"],
    steps: [
      { npc: { en: "Excuse me, where is the train station?", es: "Perdone, ¿dónde está la estación de tren?", zh: "请问，火车站在哪儿？", vi: "Xin lỗi, ga tàu ở đâu vậy?" },
        say: { en: "Go straight and turn left.", es: "Siga recto y gire a la izquierda.", zh: "一直走，然后左转。", vi: "Đi thẳng rồi rẽ trái." },
        py: "Yìzhí zǒu, ránhòu zuǒ zhuǎn." },
      { npc: { en: "Thank you! Is it far?", es: "¡Gracias! ¿Está lejos?", zh: "谢谢！远吗？", vi: "Cảm ơn! Có xa không?" },
        say: { en: "No, it is only five minutes on foot.", es: "No, solo está a cinco minutos a pie.", zh: "不远，走路只要五分钟。", vi: "Không, đi bộ chỉ năm phút." },
        py: "Bù yuǎn, zǒulù zhǐ yào wǔ fēnzhōng." },
    ],
    end: { en: "Great, thanks a lot!", es: "¡Genial, muchas gracias!", zh: "太好了，非常感谢！", vi: "Tuyệt quá, cảm ơn nhiều!" },
  },
  {
    id: "food", icon: "🍜", title: "Gọi món ở nhà hàng", name: "Nam", role: "phục vụ nhà hàng",
    pos: [-8, 32.2], face: Math.PI,
    look: { species: "bear", fur: "#9b6a43", shirt: "#1d1d1d", pants: "#1d1d1d", apron: "#ffffff", female: false },
    roles: ["Phục vụ", "Thực khách"],
    steps: [
      { npc: { en: "Welcome! Do you have a reservation?", es: "¡Bienvenido! ¿Tiene una reserva?", zh: "欢迎光临！您有预订吗？", vi: "Chào mừng! Bạn có đặt bàn trước không?" },
        say: { en: "Yes, a table for two at seven.", es: "Sí, una mesa para dos a las siete.", zh: "有，七点，两个人。", vi: "Có, một bàn hai người lúc bảy giờ." },
        py: "Yǒu, qī diǎn, liǎng ge rén." },
      { npc: { en: "Here is the menu. What would you like?", es: "Aquí tiene el menú. ¿Qué le gustaría?", zh: "这是菜单。您想吃什么？", vi: "Thực đơn đây ạ. Bạn muốn dùng gì?" },
        say: { en: "I will have the chicken soup, please.", es: "Para mí, la sopa de pollo, por favor.", zh: "我要一碗鸡汤，谢谢。", vi: "Cho tôi một bát phở gà nhé." },
        py: "Wǒ yào yì wǎn jī tāng, xièxie." },
    ],
    end: { en: "Great choice! It will be ready soon.", es: "¡Buena elección! Enseguida está lista.", zh: "好的！马上就来。", vi: "Ngon lắm! Có ngay ạ." },
  },
  {
    id: "pharmacy", icon: "💊", title: "Mua thuốc ở nhà thuốc", name: "Sofia", role: "dược sĩ",
    pos: [8, 32.2], face: Math.PI,
    look: { species: "fox", fur: "#e8803a", shirt: "#ffffff", pants: "#3a6ea5", acc: "glasses", female: true, long: true },
    roles: ["Dược sĩ", "Người mua thuốc"],
    steps: [
      { npc: { en: "Hello! How can I help you?", es: "¡Hola! ¿En qué puedo ayudarle?", zh: "你好！有什么可以帮你？", vi: "Xin chào! Tôi giúp gì được cho bạn?" },
        say: { en: "I have a headache and a sore throat.", es: "Me duele la cabeza y la garganta.", zh: "我头疼，嗓子也疼。", vi: "Tôi bị đau đầu và đau họng." },
        py: "Wǒ tóu téng, sǎngzi yě téng." },
      { npc: { en: "Take this medicine twice a day.", es: "Tome este medicamento dos veces al día.", zh: "这个药一天吃两次。", vi: "Bạn uống thuốc này ngày hai lần nhé." },
        say: { en: "Should I take it after meals?", es: "¿Lo tomo después de comer?", zh: "饭后吃吗？", vi: "Tôi uống sau bữa ăn phải không?" },
        py: "Fàn hòu chī ma?" },
    ],
    end: { en: "Yes, after meals. Get well soon!", es: "Sí, después de comer. ¡Que se mejore!", zh: "对，饭后吃。早日康复！", vi: "Đúng rồi, sau bữa ăn. Mau khỏe nhé!" },
  },
  {
    id: "hotel", icon: "🏨", title: "Nhận phòng khách sạn", name: "Aiko", role: "lễ tân khách sạn",
    pos: [31.8, 30], face: -Math.PI / 2,
    look: { species: "bunny", fur: "#f6c9d6", shirt: "#6d58a6", pants: "#2b2b3a", skirt: true, acc: "scarf", accColor: "#ffd23f", female: true, long: true },
    roles: ["Lễ tân", "Khách nhận phòng"],
    steps: [
      { npc: { en: "Good evening! Welcome to Sunny Hotel.", es: "¡Buenas noches! Bienvenido al Hotel Sol.", zh: "晚上好！欢迎来到阳光酒店。", vi: "Chào buổi tối! Chào mừng đến khách sạn Nắng." },
        say: { en: "I have a reservation under the name Tran.", es: "Tengo una reserva a nombre de Tran.", zh: "我预订了房间，名字是陈。", vi: "Tôi đã đặt phòng, tên là Trần." },
        py: "Wǒ yùdìng le fángjiān, míngzi shì Chén." },
      { npc: { en: "Here is your key. Your room is on the third floor.", es: "Aquí tiene su llave. Su habitación está en el tercer piso.", zh: "这是您的钥匙。房间在三楼。", vi: "Chìa khóa của bạn đây. Phòng ở tầng ba." },
        say: { en: "What time is breakfast?", es: "¿A qué hora es el desayuno?", zh: "早餐几点开始？", vi: "Mấy giờ có bữa sáng?" },
        py: "Zǎocān jǐ diǎn kāishǐ?" },
    ],
    end: { en: "From six to ten. Enjoy your stay!", es: "De seis a diez. ¡Disfrute su estancia!", zh: "六点到十点。祝您入住愉快！", vi: "Từ sáu đến mười giờ. Chúc bạn nghỉ ngơi vui vẻ!" },
  },
  {
    id: "office", icon: "🏢", title: "Phỏng vấn xin việc", name: "David", role: "người phỏng vấn",
    pos: [-31.8, 30], face: Math.PI / 2,
    look: { species: "dog", fur: "#a9abb8", shirt: "#33415c", pants: "#22283a", acc: "glasses", female: false, long: true },
    roles: ["Người phỏng vấn", "Ứng viên"],
    steps: [
      { npc: { en: "Thank you for coming. Please tell me about yourself.", es: "Gracias por venir. Hábleme de usted.", zh: "谢谢你来。请介绍一下你自己。", vi: "Cảm ơn bạn đã đến. Bạn giới thiệu về bản thân nhé." },
        say: { en: "I have three years of experience in sales.", es: "Tengo tres años de experiencia en ventas.", zh: "我有三年的销售经验。", vi: "Tôi có ba năm kinh nghiệm bán hàng." },
        py: "Wǒ yǒu sān nián de xiāoshòu jīngyàn." },
      { npc: { en: "Why do you want to work here?", es: "¿Por qué quiere trabajar aquí?", zh: "你为什么想在这里工作？", vi: "Tại sao bạn muốn làm việc ở đây?" },
        say: { en: "I want to learn and grow with your team.", es: "Quiero aprender y crecer con su equipo.", zh: "我想和你们的团队一起学习和成长。", vi: "Tôi muốn học hỏi và phát triển cùng đội của anh." },
        py: "Wǒ xiǎng hé nǐmen de tuánduì yìqǐ xuéxí hé chéngzhǎng." },
    ],
    end: { en: "Excellent! We will call you next week.", es: "¡Excelente! Le llamaremos la próxima semana.", zh: "很好！我们下周给你打电话。", vi: "Tuyệt vời! Tuần sau chúng tôi sẽ gọi cho bạn." },
  },
];

/* ───────────────────────── Dựng cảnh ───────────────────────── */
const $ = (s) => document.querySelector(s);
const view = $("#view");
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.62;
view.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog("#d8d4cc", 70, 260);
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 6000);

/* Trời chiều vàng + mặt trời */
const sun = new THREE.Vector3();
const SUN_ELEV = 22, SUN_AZ = 215;
sun.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - SUN_ELEV), THREE.MathUtils.degToRad(SUN_AZ));
function makeSky(scale) {
  const s = new Sky(); s.scale.setScalar(scale);
  const u = s.material.uniforms;
  u.turbidity.value = 5.5; u.rayleigh.value = 1.4; u.mieCoefficient.value = 0.004; u.mieDirectionalG.value = 0.82;
  u.sunPosition.value.copy(sun);
  return s;
}
scene.add(makeSky(4500));
{ /* ánh phản chiếu của trời lên mặt kính / nước */
  const pm = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene(); envScene.add(makeSky(50));
  scene.environment = pm.fromScene(envScene, 0, 0.1, 100).texture;
}
scene.add(new THREE.HemisphereLight("#cfe4ff", "#7d9a5a", 0.9));
const sunLight = new THREE.DirectionalLight("#ffe0b5", 3.2);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
Object.assign(sunLight.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 200 });
sunLight.shadow.bias = -0.0004; sunLight.shadow.normalBias = 0.03;
scene.add(sunLight, sunLight.target);

/* Vật liệu + kết cấu vẽ bằng canvas */
const matCache = new Map();
function mat(color, o = {}) {
  const k = color + JSON.stringify(o);
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...o }));
  return matCache.get(k);
}
function canvasTex(w, h, draw, rep) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  return t;
}
function rnd(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const R = rnd(20261127);

const grassTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = "#7db356"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { const l = 30 + R() * 25; g.fillStyle = `hsl(${88 + R() * 22},${42 + R() * 18}%,${l}%)`; g.fillRect(R() * w, R() * h, 2, 2 + R() * 3); }
}, [140, 140]);
const paveTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = "#e3d6c0"; g.fillRect(0, 0, w, h);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    g.fillStyle = `hsl(${32 + R() * 8},${22 + R() * 10}%,${78 + R() * 8}%)`;
    g.fillRect(x * 32 + (y % 2) * 16 + 1, y * 32 + 1, 30, 30);
  }
}, [10, 10]);
const roadTex = canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = "#454a53"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${R() > .5 ? 255 : 0},${R() > .5 ? 255 : 0},255,${R() * .05})`; g.fillRect(R() * w, R() * h, 2, 2); }
}, [1, 30]);
function windowTex(wall, trim, seed) {
  const r = rnd(seed);
  return (rw, rh) => canvasTex(128, 128, (g) => {
    g.fillStyle = wall; g.fillRect(0, 0, 128, 128);
    g.fillStyle = "rgba(0,0,0,.05)"; for (let i = 0; i < 6; i++) g.fillRect(0, i * 22, 128, 1);
    g.fillStyle = trim; g.fillRect(30, 26, 68, 80);
    const grd = g.createLinearGradient(34, 30, 94, 102);
    const lit = r() < 0.25;
    grd.addColorStop(0, lit ? "#ffe6a8" : "#9fc4e6"); grd.addColorStop(0.55, lit ? "#f4c46b" : "#4f7aa6"); grd.addColorStop(1, lit ? "#d99a3e" : "#2e4f73");
    g.fillStyle = grd; g.fillRect(35, 31, 58, 70);
    g.fillStyle = trim; g.fillRect(62, 31, 4, 70); g.fillRect(35, 62, 58, 4);
    g.fillStyle = "rgba(255,255,255,.35)"; g.beginPath(); g.moveTo(38, 34); g.lineTo(52, 34); g.lineTo(38, 54); g.fill();
    g.fillStyle = "rgba(0,0,0,.18)"; g.fillRect(26, 106, 76, 6);
  }, [rw, rh]);
}
function labelTex(text, bg, fg, w = 512, h = 128, font = 64) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = bg; const r = 26; g.beginPath(); g.roundRect(4, 4, w - 8, h - 8, r); g.fill();
    g.fillStyle = fg; g.font = `800 ${font}px system-ui, sans-serif`;
    while (font > 16 && g.measureText(text).width > w - 48) { font -= 2; g.font = `800 ${font}px system-ui, sans-serif`; } g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, w / 2, h / 2 + 4);
  });
}
function stripeTex(a, b, n = 8) {
  return canvasTex(256, 64, (g) => { for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(i * 256 / n, 0, 256 / n, 64); } });
}

const colliders = []; /* hộp chặn đường đi: {x0,x1,z0,z1} */
function block(x0, x1, z0, z1) { colliders.push({ x0, x1, z0, z1 }); }
function add(mesh, x, y, z, cast = true, recv = true) {
  mesh.position.set(x, y, z); mesh.castShadow = cast; mesh.receiveShadow = recv; scene.add(mesh); return mesh;
}
function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }

/* Mặt đất, đồi xa */
{
  const g = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 }));
  g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + R() * 0.3, d = 190 + R() * 60, s = 40 + R() * 45;
    const hill = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), mat(`hsl(${95 + R() * 25},35%,${36 + R() * 10}%)`, { roughness: 1 }));
    hill.scale.set(s * 1.6, s * (0.35 + R() * 0.3), s); hill.position.set(Math.cos(a) * d, -2, Math.sin(a) * d); scene.add(hill);
  }
}

/* Đường vòng quanh quảng trường + vỉa hè */
const RING = 20, RW = 7;
{
  const roadM = new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.92 });
  const walkM = mat("#d8d1c4", { roughness: 0.95 });
  const lineM = mat("#f4f1e6", { roughness: 0.7 });
  const L = 150, ZL = 99, ZC = 25.5; /* đường dọc chỉ chạy từ trước nhà ga (z=-24) về phía nam */
  for (const s of [-1, 1]) {
    const rx = new THREE.Mesh(new THREE.PlaneGeometry(L, RW), roadM); rx.rotation.x = -Math.PI / 2; add(rx, 0, 0.02, s * RING, false);
    const rz = new THREE.Mesh(new THREE.PlaneGeometry(RW, ZL), roadM); rz.rotation.x = -Math.PI / 2; add(rz, s * RING, 0.021, ZC, false);
    const gap = (v) => Math.abs(Math.abs(v) - RING) < RW / 2 + 1.2;
    for (let i = -L / 2; i < L / 2; i += 4) if (!gap(i + 1)) add(box(2, 0.01, 0.15, lineM), i + 1, 0.03, s * RING, false);
    for (let i = ZC - ZL / 2; i < ZC + ZL / 2; i += 4) if (!gap(i + 1)) add(box(0.15, 0.01, 2, lineM), s * RING, 0.03, i + 1, false);
    for (const o of [RING - RW / 2 - 1, RING + RW / 2 + 1]) {
      add(box(L, 0.16, 2, walkM), 0, 0.08, s * o, false);
      add(box(2, 0.16, ZL, walkM), s * o, 0.081, ZC, false);
    }
    /* vạch qua đường */
    for (let k = -2.4; k <= 2.4; k += 0.8) {
      add(box(0.45, 0.012, 2.6, lineM), k, 0.032, s * RING, false);
      add(box(2.6, 0.012, 0.45, lineM), s * RING, 0.032, k, false);
    }
  }
}

/* Quảng trường + đài phun nước */
let waterJet, waterTop;
{
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(13, 64), new THREE.MeshStandardMaterial({ map: paveTex, roughness: 0.9 }));
  plaza.rotation.x = -Math.PI / 2; add(plaza, 0, 0.04, 0, false);
  const ring = new THREE.Mesh(new THREE.RingGeometry(12.6, 13.2, 64), mat("#b9a68a")); ring.rotation.x = -Math.PI / 2; add(ring, 0, 0.05, 0, false);
  const stone = mat("#e9e2d6", { roughness: 0.6 });
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.8, 0.7, 48, 1, true), stone); add(basin, 0, 0.35, 0);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(3.65, 0.16, 12, 64), stone); rim.rotation.x = Math.PI / 2; add(rim, 0, 0.72, 0);
  const waterM = new THREE.MeshStandardMaterial({ color: "#4fb3e0", roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.88 });
  const water = new THREE.Mesh(new THREE.CircleGeometry(3.55, 48), waterM); water.rotation.x = -Math.PI / 2; add(water, 0, 0.58, 0, false);
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 1.8, 24), stone), 0, 1.2, 0);
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(1.2, 32, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), stone); add(bowl, 0, 2.3, 0);
  waterTop = new THREE.Mesh(new THREE.CircleGeometry(1.1, 32), waterM); waterTop.rotation.x = -Math.PI / 2; add(waterTop, 0, 2.25, 0, false);
  waterJet = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.14, 1.4, 12), new THREE.MeshStandardMaterial({ color: "#bfe8ff", transparent: true, opacity: 0.7, roughness: 0.1 }));
  add(waterJet, 0, 2.95, 0, false);
  colliders.push({ circle: true, x: 0, z: 0, r: 4.2 });
}

/* Cây, đèn, ghế, hoa */
function tree(x, z, s = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14 * s, 0.22 * s, 1.8 * s, 8), mat("#7a5434")); trunk.position.y = 0.9 * s; trunk.castShadow = true; g.add(trunk);
  const hue = 95 + R() * 30;
  for (let i = 0; i < 4; i++) {
    const f = new THREE.Mesh(new THREE.IcosahedronGeometry((0.9 + R() * 0.5) * s, 1), mat(`hsl(${hue + R() * 12},${32 + R() * 14}%,${28 + R() * 12}%)`, { roughness: 0.9, flatShading: true }));
    f.position.set((R() - .5) * 1.1 * s, (2.1 + R() * 0.9) * s, (R() - .5) * 1.1 * s); f.castShadow = true; f.receiveShadow = true; g.add(f);
  }
  g.position.set(x, 0, z); g.rotation.y = R() * 6; scene.add(g);
  colliders.push({ circle: true, x, z, r: 0.45 * s });
}
const lampHeads = [];
function lamp(x, z) {
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 3.6, 8), mat("#2c3038", { metalness: 0.6, roughness: 0.4 })), x, 1.8, z);
  const h = add(new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 12), new THREE.MeshStandardMaterial({ color: "#fff3d1", emissive: "#ffcf7a", emissiveIntensity: 0.9 })), x, 3.7, z, false);
  lampHeads.push(h);
  colliders.push({ circle: true, x, z, r: 0.25 });
}
function bench(x, z, ry) {
  const g = new THREE.Group(); const wood = mat("#a8703f"), iron = mat("#33363d", { metalness: 0.5 });
  const seat = box(1.8, 0.08, 0.5, wood); seat.position.y = 0.48; g.add(seat);
  const back = box(1.8, 0.45, 0.07, wood); back.position.set(0, 0.78, -0.24); g.add(back);
  for (const s of [-0.8, 0.8]) { const l = box(0.08, 0.48, 0.5, iron); l.position.set(s, 0.24, 0); g.add(l); }
  g.traverse((m) => { m.castShadow = m.receiveShadow = true; });
  g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
}
{
  /* hàng cây + đèn quanh quảng trường */
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.26;
    if (i % 3 === 1) lamp(Math.cos(a) * 11.6, Math.sin(a) * 11.6); else tree(Math.cos(a) * 11.8, Math.sin(a) * 11.8, 1.1 + R() * 0.3);
  }
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; bench(Math.cos(a) * 8.4, Math.sin(a) * 8.4, -a - Math.PI / 2); }
  /* vườn hoa (vẽ hàng loạt cho nhẹ máy) */
  const flowerCols = ["#ff6b8b", "#ffd24d", "#ffffff", "#b27cff", "#ff8c42"];
  const fg = new THREE.SphereGeometry(0.09, 8, 6);
  for (const col of flowerCols) {
    const im = new THREE.InstancedMesh(fg, mat(col, { roughness: 0.6 }), 160); const m4 = new THREE.Matrix4();
    for (let i = 0; i < 160; i++) {
      const a = R() * Math.PI * 2, d = 5 + R() * 1.6, bed = Math.floor(R() * 4) * Math.PI / 2 + Math.PI / 4;
      const aa = bed + (R() - .5) * 0.5;
      m4.makeTranslation(Math.cos(aa) * d, 0.18 + R() * 0.12, Math.sin(aa) * d); im.setMatrixAt(i, m4);
    }
    im.castShadow = true; scene.add(im);
  }
  const bedM = mat("#5d8f3b");
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; const b = new THREE.Mesh(new THREE.RingGeometry(4.9, 6.7, 24, 1, a - 0.28, 0.56), bedM); b.rotation.x = -Math.PI / 2; add(b, 0, 0.06, 0, false); }
  for (const [x, z] of [[-24.6, 12], [24.6, 12], [-24.6, -14], [24.6, -15], [-12, 24.6], [12, 24.6], [-10, -24.6], [10, -24.6]]) lamp(x, z);
}

/* Nhà cửa */
function building(x, z, w, d, h, wall, opt = {}) {
  const mk = windowTex(wall, opt.trim || "#f5efe4", Math.floor(R() * 1e9));
  const fl = Math.max(1, Math.round(h / 3.2));
  const front = new THREE.MeshStandardMaterial({ map: mk(Math.max(1, Math.round(w / 3)), fl), roughness: 0.85 });
  const side = new THREE.MeshStandardMaterial({ map: mk(Math.max(1, Math.round(d / 3)), fl), roughness: 0.85 });
  const top = mat(opt.roofFlat || "#8d8378");
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side, side, top, top, front, front]);
  add(b, x, h / 2, z);
  /* gờ mái */
  add(box(w + 0.4, 0.35, d + 0.4, mat(opt.trim || "#f5efe4")), x, h + 0.17, z);
  if (opt.roof) {
    const shape = new THREE.Shape(); shape.moveTo(-w / 2 - 0.5, 0); shape.lineTo(w / 2 + 0.5, 0); shape.lineTo(0, opt.roofH || 2.6); shape.closePath();
    const rg = new THREE.ExtrudeGeometry(shape, { depth: d + 0.8, bevelEnabled: false });
    const roof = new THREE.Mesh(rg, mat(opt.roof, { roughness: 0.75 })); roof.position.set(x, h + 0.3, z - d / 2 - 0.4);
    roof.castShadow = roof.receiveShadow = true; scene.add(roof);
  }
  block(x - w / 2 - 0.3, x + w / 2 + 0.3, z - d / 2 - 0.3, z + d / 2 + 0.3);
  return b;
}
function signPlane(text, bg, fg, w, h, x, y, z, ry = 0) {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: labelTex(text, bg, fg), roughness: 0.6 }));
  p.position.set(x, y, z); p.rotation.y = ry; scene.add(p); return p;
}
function awning(x, y, z, w, ry, a, b) {
  const m = new THREE.MeshStandardMaterial({ map: stripeTex(a, b, 10), roughness: 0.8, side: THREE.DoubleSide });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, 1.8), m);
  p.position.set(x, y, z); p.rotation.order = "YXZ"; p.rotation.y = ry; p.rotation.x = -1.0; p.castShadow = true; scene.add(p);
}
function door(x, z, ry, col = "#6b4428") {
  const d = box(1.4, 2.3, 0.12, mat(col)); d.position.set(x, 1.15, z); d.rotation.y = ry; d.castShadow = true; scene.add(d);
}
{
  /* ☕ Quán cà phê (tây) */
  building(-34, -6, 11, 12, 6.4, "#f2a65a", { trim: "#fff4e0", roof: "#b34a3c", roofH: 2.2 });
  door(-28.45, -6, Math.PI / 2);
  awning(-27.9, 3.2, -6, 10, Math.PI / 2, "#ffffff", "#2f7d5b");
  signPlane("☕ Café Linh", "#2f7d5b", "#fff", 5, 1.25, -28.42, 4.9, -6, Math.PI / 2);
  for (const zz of [-10.8, -1.2]) { /* bàn ghế ngoài trời */
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 20), mat("#ffffff")), -26, 0.78, zz);
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.78, 8), mat("#333")), -26, 0.39, zz);
    const um = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.6, 8), new THREE.MeshStandardMaterial({ map: stripeTex("#ffffff", "#e55a4e", 8), roughness: 0.8 }));
    add(um, -26, 2.5, zz); add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.3, 6), mat("#ddd")), -26, 1.15, zz);
    colliders.push({ circle: true, x: -26, z: zz, r: 0.7 });
  }
  /* 🚉 Nhà ga (bắc) */
  building(0, -38, 22, 10, 7, "#e9e1d3", { trim: "#8f2f2f", roofFlat: "#6d6560" });
  const arch = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 10.4, 32, 1, false, 0, Math.PI), mat("#7f9bb3", { metalness: 0.3, roughness: 0.45 }));
  arch.rotation.z = Math.PI / 2; arch.rotation.y = Math.PI / 2; add(arch, 0, 7.2, -38);
  signPlane("🚉 STATION · 火车站", "#8f2f2f", "#fff", 8, 1.6, 0, 5.6, -32.94);
  for (const xx of [-6, 6]) door(xx, -32.95, 0, "#3d4f66");
  /* quầy vé */
  add(box(2.6, 1.1, 1, mat("#8f2f2f")), 0, 0.55, -29.2); add(box(2.8, 0.08, 1.2, mat("#f5efe4")), 0, 1.14, -29.2);
  block(-1.4, 1.4, -29.8, -28.6);
  /* sân ga + tàu */
  add(box(70, 0.9, 5, mat("#bdb5a8")), 0, 0.45, -46);
  const railM = mat("#5d5f66", { metalness: 0.7, roughness: 0.4 });
  for (const zz of [-49.3, -50.7]) add(box(120, 0.12, 0.12, railM), 0, 0.1, zz, false);
  const car = new THREE.MeshStandardMaterial({ map: windowTex("#e8edf2", "#c0392b", 7)(6, 1), roughness: 0.45, metalness: 0.15 });
  for (let i = 0; i < 4; i++) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(13, 3.2, 3), [mat("#d9dee4"), mat("#d9dee4"), mat("#c0392b"), mat("#333"), car, car]);
    add(c, -21 + i * 14, 2, -50);
    add(box(13, 0.3, 3.05, mat("#c0392b")), -21 + i * 14, 0.6, -50);
  }
  block(-36, 36, -53, -43.4);
  /* 🍊 Chợ trái cây (đông) */
  const fruitCols = ["#ff9f1c", "#ffd23f", "#e63946", "#7ac74f", "#ff9f1c"];
  for (let i = 0; i < 3; i++) {
    const zz = -12 + i * 6;
    add(box(2, 0.9, 4.4, mat("#a8703f")), 29.2, 0.45, zz);
    const can = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.12, 5.2), new THREE.MeshStandardMaterial({ map: stripeTex(["#ffffff", "#ffd23f", "#ffffff"][i], ["#e63946", "#2a9d8f", "#3d5a80"][i], 10), roughness: 0.8 }));
    add(can, 29.4, 2.8, zz);
    for (const [px, pz] of [[28, zz - 2.4], [28, zz + 2.4], [30.6, zz - 2.4], [30.6, zz + 2.4]]) add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.8, 6), mat("#ddd")), px, 1.4, pz);
    const fgm = new THREE.SphereGeometry(0.15, 10, 8);
    for (let k = 0; k < 4; k++) {
      const im = new THREE.InstancedMesh(fgm, mat(fruitCols[(i + k) % 5], { roughness: 0.5 }), 14); const m4 = new THREE.Matrix4();
      for (let j = 0; j < 14; j++) { m4.makeTranslation(28.6 + R() * 1.2, 1.02 + R() * 0.12, zz - 1.9 + k * 1.05 + R() * 0.6); im.setMatrixAt(j, m4); }
      im.castShadow = true; scene.add(im);
    }
    block(28.1, 30.3, zz - 2.3, zz + 2.3);
  }
  building(38, -6, 8, 18, 5, "#9fd3c7", { trim: "#ffffff", roof: "#3d7c75", roofH: 2 });
  signPlane("🍊 Chợ Mei · Market", "#e63946", "#fff", 6, 1.3, 33.95, 3.6, -6, -Math.PI / 2);
  /* nhà ở xung quanh */
  const houses = [
    [-38, 30, 9, 9, 9.6, "#cfd9e6", "#33415c"], [-30, 40, 9, 9, 8, "#c7dbf2", "#4a6e9a"], [-8, 38, 10, 8, 6.4, "#fff1c1", "#b56f3a"], [8, 38, 10, 8, 6.4, "#e3f3e6", "#2f8f5b"],
    [30, 40, 9, 9, 6.4, "#ffd8b1", "#b3543c"], [38, 30, 9, 9, 12.8, "#e2d3f5", "#6d58a6"], [-38, -28, 9, 9, 10, "#d9e4ea", "#5b6f7a"], [38, -28, 9, 9, 8, "#f9e0a8", "#9b6b2f"],
    [-52, -6, 10, 14, 13, "#cfd8e3", null], [52, -6, 10, 14, 15, "#efe6da", null], [-31, -38, 10, 8, 12, "#e8d5c4", null], [31, -38, 10, 8, 11, "#d5e3e0", null],
  ];
  for (const [x, z, w, d, h, wall, roof] of houses) {
    building(x, z, w, d, h, wall, roof ? { roof, roofH: 2.4 } : { roofFlat: "#7d756c" });
    const toCenter = Math.abs(x) > Math.abs(z) ? (x > 0 ? -Math.PI / 2 : Math.PI / 2) : (z > 0 ? Math.PI : 0);
    const off = Math.abs(x) > Math.abs(z) ? [x - Math.sign(x) * (w / 2 + 0.06), z] : [x, z - Math.sign(z) * (d / 2 + 0.06)];
    door(off[0], off[1], toCenter);
  }
}

/* biển hiệu 4 nơi mới (nhà hàng, nhà thuốc, khách sạn, văn phòng) */
signPlane("🍜 Nhà hàng Nam · Restaurant", "#b56f3a", "#fff", 6, 1.3, -8, 4.3, 33.9, Math.PI);
awning(-8, 2.9, 33.4, 8, Math.PI, "#ffffff", "#c0392b");
signPlane("💊 Pharmacy · 药店", "#2f8f5b", "#fff", 5.4, 1.2, 8, 3.4, 33.9, Math.PI);
signPlane("🏨 Sunny Hotel", "#6d58a6", "#fff", 5.4, 1.3, 33.45, 4.2, 30, -Math.PI / 2);
signPlane("🏢 Office · Phỏng vấn", "#33415c", "#fff", 5.6, 1.2, -33.45, 4.2, 30, Math.PI / 2);

/* cây ven đường (ngoài vòng) — trồng SAU khi có nhà, bỏ chỗ trùng nhà / đường ray */
{
  const free = (x, z) => z > -24 && !colliders.some((c) => !c.circle && x > c.x0 - 1 && x < c.x1 + 1 && z > c.z0 - 1 && z < c.z1 + 1);
  for (let k = -60; k <= 60; k += 12) {
    for (const s of [-1, 1]) {
      if (Math.abs(k) < 30) continue;
      if (free(k, s * (RING + 6.2))) tree(k, s * (RING + 6.2), 0.9 + R() * 0.3);
      if (free(s * (RING + 6.2), k)) tree(s * (RING + 6.2), k, 0.9 + R() * 0.3);
    }
  }
}

/* Mây trôi */
const clouds = [];
{
  const cm = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 1, emissive: "#ffeedd", emissiveIntensity: 0.15 });
  for (let i = 0; i < 14; i++) {
    const g = new THREE.Group();
    for (let k = 0; k < 5; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(4 + R() * 4, 12, 8), cm); s.position.set(k * 5 - 10 + R() * 3, R() * 2, R() * 4); s.scale.y = 0.6; g.add(s); }
    g.position.set((R() - .5) * 400, 60 + R() * 30, (R() - .5) * 400); scene.add(g); clouds.push(g);
  }
}

/* ───────────────────────── Nhân vật: thú cute (animals.js) ───────────────────────── */
const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
function spriteTex(text, bg, fg, font = 46) {
  const t = labelTex(text, bg, fg, 512, 112, font); return new THREE.SpriteMaterial({ map: t, depthTest: true, transparent: true });
}
function nameTag(text, bg = "rgba(29,35,64,.78)") { const s = new THREE.Sprite(spriteTex(text, bg, "#fff", 40)); s.scale.set(2.1, 0.46, 1); return s; }

/* hồ sơ nhân vật của máy này (chỉ lưu trong trình duyệt) */
const me = Object.assign({ name: "", species: "cat", fur: SPECIES[0].fur, shirt: SHIRTS[0], pants: PANTS[0], skirt: false, acc: "none" }, store.get("tjwl_town_me_v1", {}));
function lookOf(o) { return { species: o.species, fur: o.fur, shirt: o.shirt, pants: o.pants, skirt: !!o.skirt, acc: o.acc, accColor: o.shirt === "#ffffff" ? "#ff7a59" : undefined }; }
const lookKey = (l) => JSON.stringify(l);

let player = makeAnimal(lookOf(me));
player.root.position.set(0, 0, 15); player.root.rotation.y = Math.PI; scene.add(player.root);
function rebuildPlayer() {
  const old = player; player = makeAnimal(lookOf(me));
  player.root.position.copy(old.root.position); player.root.rotation.copy(old.root.rotation);
  scene.remove(old.root); scene.add(player.root);
}

/* người dân có nhiệm vụ */
for (const n of NPCS) {
  n.p = makeAnimal(n.look); n.p.root.position.set(n.pos[0], 0, n.pos[1]); n.p.root.rotation.y = n.face; scene.add(n.p.root);
  const tag = nameTag(n.name + " · " + n.role); tag.position.y = 1.72; n.p.root.add(tag);
  n.mark = new THREE.Sprite(spriteTex("!", "#ff7a59", "#fff", 90)); n.mark.scale.set(0.5, 0.5 * 112 / 512 * 4.6, 1); n.mark.position.y = 2.2; n.p.root.add(n.mark);
  n.markDone = new THREE.Sprite(spriteTex("✓", "#20a86b", "#fff", 90)); n.markDone.scale.copy(n.mark.scale); n.markDone.position.y = 2.2; n.markDone.visible = false; n.p.root.add(n.markDone);
  colliders.push({ circle: true, x: n.pos[0], z: n.pos[1], r: 0.45, npc: n });
}

/* thú đi dạo + xe chạy quanh vòng */
const walkers = [];
for (let i = 0; i < 10; i++) {
  const sp = SPECIES[i % SPECIES.length];
  const p = makeAnimal({ species: sp.id, fur: i > 5 ? FURS[(i * 3) % FURS.length] : sp.fur, shirt: SHIRTS[(i * 5 + 1) % SHIRTS.length], pants: PANTS[i % PANTS.length], skirt: i % 4 === 1, acc: ACCS[(i * 7) % ACCS.length].id, scale: 0.92 + R() * 0.14 });
  const inner = i % 2 === 0, r = inner ? RING - RW / 2 - 1 : RING + RW / 2 + 1;
  walkers.push({ p, r, u: R() * 4, dir: i % 3 === 0 ? -1 : 1, v: 1.1 + R() * 0.5 });
  scene.add(p.root);
}
function loopPoint(r, u) { /* u: 0..4 quanh hình vuông bán kính r */
  u = ((u % 4) + 4) % 4; const s = Math.floor(u), f = u - s, a = -r + 2 * r * f;
  return [[a, -r], [r, a], [-a, r], [-r, -a]][s];
}
const cars = [];
function makeCar(col) {
  const g = new THREE.Group();
  const paint = mat(col, { roughness: 0.25, metalness: 0.45 });
  const b = box(1.9, 0.7, 4.2, paint); b.position.y = 0.6; g.add(b);
  const c = box(1.6, 0.6, 2.2, mat("#1d2b3a", { roughness: 0.1, metalness: 0.6 })); c.position.set(0, 1.2, -0.2); g.add(c);
  const tp = box(1.62, 0.06, 2.0, paint); tp.position.set(0, 1.52, -0.2); g.add(tp);
  for (const [x, z] of [[-0.9, 1.3], [0.9, 1.3], [-0.9, -1.3], [0.9, -1.3]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.25, 16), mat("#1a1a1a")); w.rotation.z = Math.PI / 2; w.position.set(x, 0.34, z); g.add(w); }
  for (const x of [-0.6, 0.6]) { const l = box(0.35, 0.15, 0.05, new THREE.MeshStandardMaterial({ color: "#fff", emissive: "#fff6cc", emissiveIntensity: 0.6 })); l.position.set(x, 0.7, 2.11); g.add(l); }
  g.traverse((m) => { if (m.isMesh) m.castShadow = m.receiveShadow = true; });
  scene.add(g); return g;
}
["#e63946", "#3d5a80", "#f4d35e", "#ffffff"].forEach((col, i) => cars.push({ g: makeCar(col), u: i, v: 0.09 }));

/* ───────────────────────── Điều khiển ───────────────────────── */
const keys = {};
let phase = "menu";   /* menu | play */
addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT") {
    if (e.key === "Enter") { if (e.target.id === "dlg-type") $("#dlg-send").click(); else if (e.target.id === "rp-type") $("#rp-send").click(); else if (e.target.id === "m-code") $("#m-join").click(); else if (e.target.id === "c-name") $("#c-next").click(); }
    return;
  }
  keys[e.code] = true;
  if (phase === "play" && e.code === "KeyE" && near && !dlgNpc && !rp) openDlg(near);
  if (e.code === "Escape") { closeDlg(); }
});
addEventListener("keyup", (e) => { keys[e.code] = false; });
const isTouch = matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
if (isTouch) document.body.classList.add("touch");
let camYaw = 0, camPitch = 0.3, camDist = 6.5;
{ /* kéo để xoay camera */
  let drag = null;
  const cv = renderer.domElement;
  cv.addEventListener("pointerdown", (e) => { drag = { id: e.pointerId, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t0: performance.now() }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener("pointermove", (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    if (phase === "menu") { player.root.rotation.y += (e.clientX - drag.x) * 0.012; drag.x = e.clientX; return; }
    camYaw -= (e.clientX - drag.x) * 0.006; camPitch = THREE.MathUtils.clamp(camPitch + (e.clientY - drag.y) * 0.004, 0.08, 1.1);
    drag.x = e.clientX; drag.y = e.clientY;
  });
  cv.addEventListener("pointerup", (e) => {
    /* bấm nhanh, không kéo = BẤM CHỌN chỗ đi tới (TJ 2026-11-28: "sử dụng chuột ko đi vào được nơi cần đi") */
    if (drag && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 7 && performance.now() - drag.t0 < 700) clickWorld(e.clientX, e.clientY);
    drag = null;
  });
  cv.addEventListener("wheel", (e) => { camDist = THREE.MathUtils.clamp(camDist + e.deltaY * 0.01, 3.5, 14); }, { passive: true });
}
const joy = { x: 0, y: 0 };
{
  const el = $("#joy"), knob = el.querySelector("i"); let id = null;
  const set = (e) => {
    const r = el.getBoundingClientRect(); let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const L = Math.hypot(dx, dy), M = r.width / 2 - 10; if (L > M) { dx *= M / L; dy *= M / L; }
    knob.style.transform = `translate(${dx}px,${dy}px)`; joy.x = dx / M; joy.y = dy / M;
  };
  el.addEventListener("pointerdown", (e) => { id = e.pointerId; el.setPointerCapture(id); set(e); });
  el.addEventListener("pointermove", (e) => { if (e.pointerId === id) set(e); });
  const end = () => { id = null; joy.x = joy.y = 0; knob.style.transform = ""; };
  el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end);
}
function collide(pos) {
  for (const c of colliders) {
    if (c.circle) {
      const dx = pos.x - c.x, dz = pos.z - c.z, d = Math.hypot(dx, dz), m = c.r + 0.35;
      if (d < m && d > 1e-4) { pos.x = c.x + dx / d * m; pos.z = c.z + dz / d * m; }
    } else if (pos.x > c.x0 - 0.35 && pos.x < c.x1 + 0.35 && pos.z > c.z0 - 0.35 && pos.z < c.z1 + 0.35) {
      const pushes = [pos.x - (c.x0 - 0.35), (c.x1 + 0.35) - pos.x, pos.z - (c.z0 - 0.35), (c.z1 + 0.35) - pos.z];
      const i = pushes.indexOf(Math.min(...pushes));
      if (i === 0) pos.x = c.x0 - 0.35; else if (i === 1) pos.x = c.x1 + 0.35; else if (i === 2) pos.z = c.z0 - 0.35; else pos.z = c.z1 + 0.35;
    }
  }
  pos.x = THREE.MathUtils.clamp(pos.x, -70, 70); pos.z = THREE.MathUtils.clamp(pos.z, -42, 70);
}

/* ───────────────────────── Đi bằng chuột + nhảy tới địa điểm ───────────────────────── */
let goTo = null;   /* { x, z, npc, best, stuckT } — đang tự đi tới chỗ đã bấm */
const ray = new THREE.Raycaster(), groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hitV = new THREE.Vector3();
const goMark = new THREE.Mesh(new THREE.RingGeometry(0.32, 0.5, 28), new THREE.MeshBasicMaterial({ color: 0xff7a59, transparent: true, opacity: 0.9, depthWrite: false }));
goMark.rotation.x = -Math.PI / 2; goMark.position.y = 0.06; goMark.visible = false; scene.add(goMark);
function setGoTo(x, z, npc) {
  goTo = { x, z, npc: npc || null, best: Infinity, stuckT: 0 };
  goMark.position.set(x, 0.06, z); goMark.visible = !npc;
}
function clickWorld(cx, cy) {
  if (phase !== "play" || dlgNpc || rp) return;
  ray.setFromCamera({ x: (cx / innerWidth) * 2 - 1, y: -(cy / innerHeight) * 2 + 1 }, camera);
  /* bấm trúng người dân -> đi tới rồi tự mở nói chuyện */
  const hits = ray.intersectObjects(NPCS.map((n) => n.p.root), true);
  if (hits.length) {
    let o = hits[0].object; const n = NPCS.find((m) => { let q = o; while (q) { if (q === m.p.root) return true; q = q.parent; } return false; });
    if (n) { setGoTo(n.pos[0] + Math.sin(n.face) * 1.8, n.pos[1] + Math.cos(n.face) * 1.8, n); return; }
  }
  if (ray.ray.intersectPlane(groundPlane, hitV)) setGoTo(hitV.x, hitV.z, null);
}
/* nhảy thẳng tới trước mặt người dân và mở nói chuyện (bấm tên trong danh sách nhiệm vụ / bấm bản đồ nhỏ) */
function jumpTo(n) {
  if (phase !== "play" || rp) return;
  if (dlgNpc) closeDlg();
  const pp = player.root.position;
  pp.set(n.pos[0] + Math.sin(n.face) * 1.9, 0, n.pos[1] + Math.cos(n.face) * 1.9); collide(pp);
  player.root.rotation.y = n.face + Math.PI; camYaw = n.face; camPitch = 0.42;
  camera.position.set(pp.x + Math.sin(camYaw) * camDist, 3.5, pp.z + Math.cos(camYaw) * camDist);
  goTo = null; goMark.visible = false;
  openDlg(n);
}
$("#quests").addEventListener("pointerdown", (e) => { const li = e.target.closest("[data-npc]"); if (li) jumpTo(NPCS.find((n) => n.id === li.dataset.npc)); });
$("#mini").addEventListener("click", (e) => {
  if (phase !== "play" || rp) return;
  const r = mini.getBoundingClientRect(), mx = (e.clientX - r.left) / r.width * MS, my = (e.clientY - r.top) / r.height * MS;
  const x = (mx - MS / 2) / (MS / 2) * MW, z = (my - MS / 2) / (MS / 2) * MW;
  let best = null, bd = 9;
  for (const n of NPCS) { const d = Math.hypot(n.pos[0] - x, n.pos[1] - z); if (d < bd) { bd = d; best = n; } }
  if (best) { jumpTo(best); return; }
  if (dlgNpc) closeDlg();
  const pp = player.root.position; pp.set(x, 0, z); collide(pp); goTo = null; goMark.visible = false;
});

/* ───────────────────────── Tiếng, sao, giọng đọc, chấm điểm ───────────────────────── */
const prog = store.get("tjwl_town_prog_v1", {});
let stars = store.get("tjwl_town_stars_v1", 0);
let learn = store.get("tjwl_town_learn_v1", "en"), mean = store.get("tjwl_town_mean_v1", "vi");
$("#sel-learn").value = learn; $("#sel-mean").value = mean;
const meanOf = (l) => (mean !== l ? mean : l === "en" ? "vi" : "en");
$("#sel-learn").onchange = (e) => { learn = e.target.value; store.set("tjwl_town_learn_v1", learn); if (dlgNpc) showStep(); };
$("#sel-mean").onchange = (e) => { mean = e.target.value; store.set("tjwl_town_mean_v1", mean); if (dlgNpc) showStep(); if (rp) paintRp(); };
function save() { store.set("tjwl_town_prog_v1", prog); store.set("tjwl_town_stars_v1", stars); }
function paintStars() { $("#stars").textContent = "⭐ " + stars; }
function markNpcDone(n) { const pr = prog[n.id] || (prog[n.id] = { step: 0 }); pr.done = true; n.mark.visible = false; n.markDone.visible = true; }

function paintQuests() {
  const pp = player.root.position;
  const html = "<h4>📜 Nhiệm vụ nói <small>· bấm để tới</small></h4><ul>" + NPCS.map((n) => {
    const done = prog[n.id] && prog[n.id].done, d = Math.round(Math.hypot(pp.x - n.pos[0], pp.z - n.pos[1]));
    return `<li data-npc="${n.id}" title="Bấm để tới chỗ ${n.name}" class="${done ? "done" : ""}">${done ? "✅" : n.icon}<span>${n.title}</span><em class="dist">${done ? "" : d + " m"}</em></li>`;
  }).join("") + "</ul>";
  if (html !== lastQuestHtml) { lastQuestHtml = html; $("#quests").innerHTML = html; }   /* không vẽ lại khi không đổi -> bấm không bị mất */
}
let lastQuestHtml = "";

let voices = [];
function loadVoices() { try { voices = speechSynthesis.getVoices(); } catch (e) {} }
if ("speechSynthesis" in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
function speak(text, lang, female) {
  if (!("speechSynthesis" in window) || !text) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = LOCALE[lang]; u.rate = 0.92; u.pitch = 1.15;
    const pool = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith(lang));
    const pick = pool.find((v) => (female ? /female|samantha|zira|linh|mei|google/i : /male|daniel|david|carlos|google/i).test(v.name)) || pool[0];
    if (pick) u.voice = pick;
    speechSynthesis.speak(u);
  } catch (e) {}
}
const NUM = { en: ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"], es: ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez"], zh: "零一二三四五六七八九十".split(""), vi: ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín", "mười"] };
function normTok(s, lang) {
  s = s.toLowerCase().replace(/[\p{P}\p{S}]/gu, " ");
  s = s.replace(/\b(10|[0-9])\b/g, (m) => " " + NUM[lang][+m] + " ");
  if (lang === "vi" || lang === "es") s = s.normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d");
  if (lang === "en") s = s.replace(/\bi'?d\b/g, "i would").replace(/\bwhat's\b/g, "what is").replace(/\bit's\b/g, "it is").replace(/\bthat's\b/g, "that is");
  if (lang === "zh") return s.replace(/[0-9]/g, (d) => NUM.zh[+d]).replace(/\s+/g, "").split("").filter(Boolean);
  return s.split(/\s+/).filter(Boolean);
}
function grade(target, said, lang) {
  const want = normTok(target, lang), got = normTok(said, lang);
  const bag = new Map(); got.forEach((w) => bag.set(w, (bag.get(w) || 0) + 1));
  const ok = want.map((w) => { const n = bag.get(w) || 0; if (n) { bag.set(w, n - 1); return true; } return false; });
  const score = want.length ? ok.filter(Boolean).length / want.length : 0;
  const pieces = lang === "zh" ? [...target] : target.split(/(\s+)/);
  let j = 0; const html = pieces.map((p) => {
    const toks = normTok(p, lang); if (!toks.length) return esc(p);
    const good = toks.every(() => ok[j++]); return `<span class="${good ? "w-ok" : "w-bad"}">${esc(p)}</span>`;
  }).join("");
  return { score, html };
}
function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
function resultHtml(g, said, pass) {
  return `<span class="score" style="background:${pass ? "var(--ok)" : "var(--bad)"}">${Math.round(g.score * 100)}%</span>` +
    (pass ? "Giỏi quá! 🎉 " : "Gần được rồi, thử lại nhé! ") + `<br>Bạn nói: <i>${esc(said || "…")}</i><br>${g.html}`;
}

/* micro dùng chung cho nói 1 mình và nhập vai */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null, recBtn = null;
function stopMic() { if (rec) { try { rec.abort(); } catch (e) {} rec = null; } for (const b of ["#dlg-mic", "#rp-mic"]) { $(b).classList.remove("on"); if (SR) $(b).textContent = "🎤 Bấm để nói"; } }
function startMic(btn, lang, target, resEl, onFinal) {
  if (!SR) return;
  if (rec) { stopMic(); return; }
  try { speechSynthesis.cancel(); } catch (e) {}
  rec = new SR(); rec.lang = LOCALE[lang]; rec.interimResults = true; rec.maxAlternatives = 3;
  btn.classList.add("on"); btn.textContent = "● Đang nghe… bấm để dừng";
  rec.onresult = (e) => {
    const r = e.results[e.results.length - 1];
    if (!r.isFinal) { resEl.innerHTML = "🎧 <i>" + esc(r[0].transcript) + "</i>"; return; }
    let best = r[0].transcript, bs = -1;
    for (let i = 0; i < r.length; i++) { const s = grade(target(), r[i].transcript, lang).score; if (s > bs) { bs = s; best = r[i].transcript; } }
    stopMic(); onFinal(best);
  };
  rec.onerror = (e) => { stopMic(); if (e.error === "not-allowed") resEl.textContent = "🎤 Chưa cho phép dùng micro — bấm biểu tượng ổ khoá trên thanh địa chỉ để bật nhé."; };
  rec.onend = () => { if (rec) stopMic(); };
  try { rec.start(); } catch (e) { stopMic(); }
}
if (!SR) for (const b of ["#dlg-mic", "#rp-mic"]) { $(b).textContent = "🎤 Máy này chưa nghe được giọng — gõ bên dưới nhé"; $(b).disabled = true; }

/* ───────────────────────── Nói chuyện một mình với người dân ───────────────────────── */
let dlgNpc = null, near = null, busy = false;
function cur() { return prog[dlgNpc.id] || (prog[dlgNpc.id] = { step: 0, done: false }); }
function openDlg(n) { dlgNpc = n; document.body.classList.add("talking"); $("#dlg").hidden = false; $("#talk").hidden = true; showStep(); paintPair(); }
function closeDlg() { stopMic(); dlgNpc = null; document.body.classList.remove("talking"); $("#dlg").hidden = true; try { speechSynthesis.cancel(); } catch (e) {} }
function showStep() {
  const n = dlgNpc, pr = cur(), ml = meanOf(learn);
  $("#dlg-name").textContent = n.icon + " " + n.name; $("#dlg-role").textContent = n.role;
  $("#dlg-res").innerHTML = ""; $("#dlg-type").value = "";
  if (pr.done) {
    $("#dlg-npc").textContent = n.end[learn]; $("#dlg-npc-m").textContent = n.end[ml];
    $("#dlg-task").hidden = true; speak(n.end[learn], learn, n.look.female); return;
  }
  const st = n.steps[pr.step];
  $("#dlg-task").hidden = false;
  $("#dlg-npc").textContent = st.npc[learn]; $("#dlg-npc-m").textContent = st.npc[ml];
  $("#dlg-target").textContent = st.say[learn]; $("#dlg-target-m").textContent = st.say[ml];
  $("#dlg-py").textContent = learn === "zh" ? st.py : "";
  $("#dlg-task .ask").textContent = `🎯 Nhiệm vụ ${pr.step + 1}/${n.steps.length}: nói câu này`;
  speak(st.npc[learn], learn, n.look.female);
}
function check(said) {
  if (!dlgNpc || busy) return;
  const n = dlgNpc, pr = cur(); if (pr.done) return;
  const st = n.steps[pr.step], g = grade(st.say[learn], said, learn), pass = g.score >= 0.7;
  $("#dlg-res").innerHTML = resultHtml(g, said, pass);
  if (!pass) return;
  busy = true; stars += 1; paintStars(); bubbleMe(st.say[learn]);
  setTimeout(() => {
    busy = false; if (dlgNpc !== n) return;
    pr.step++; if (pr.step >= n.steps.length) { markNpcDone(n); stars += 3; paintStars(); }
    save(); showStep(); paintQuests();
    if (pr.done) $("#dlg-res").innerHTML = '<span class="score" style="background:var(--ok)">+3 ⭐</span> Hoàn thành nhiệm vụ! Đi tìm người tiếp theo nha 🚶';
  }, 2200);
}
$("#dlg-x").onclick = closeDlg;
$("#talk").onclick = () => { if (near) openDlg(near); };
$("#dlg-hear").onclick = () => { const pr = cur(); speak(pr.done ? dlgNpc.end[learn] : dlgNpc.steps[pr.step].npc[learn], learn, dlgNpc.look.female); };
$("#dlg-model").onclick = () => speak(dlgNpc.steps[cur().step].say[learn], learn, false);
$("#dlg-send").onclick = () => { const v = $("#dlg-type").value.trim(); if (v) check(v); };
$("#dlg-mic").onclick = () => startMic($("#dlg-mic"), learn, () => dlgNpc.steps[cur().step].say[learn], $("#dlg-res"), check);

/* ───────────────────────── Phòng chơi chung ───────────────────────── */
let net = null, roomCode = "", started = false;
const peers = new Map();   /* id -> { name, look, key, p, tag, x, z, ry, mv, seen, bub, bubT } */
const ROOM_CH = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const newCode = () => Array.from({ length: 4 }, () => ROOM_CH[Math.floor(Math.random() * ROOM_CH.length)]).join("");
const spIcon = (sp) => (SPECIES.find((s) => s.id === sp) || SPECIES[0]).icon;
function myHi() { const p = player.root.position; return { name: me.name, look: lookOf(me), x: p.x, z: p.z, ry: player.root.rotation.y, st: phase === "play" ? 1 : 0 }; }
function joinRoom(code) {
  roomCode = code.toUpperCase();
  net = createNet(roomCode, onNet);
  net.send("hi", Object.assign(myHi(), { hello: 1 }));
  showScreen("wait"); paintWait();
  try { history.replaceState(null, "", location.pathname + "?room=" + roomCode + (/[?&]net=local\b/.test(location.search) ? "&net=local" : "")); } catch (e) {}
}
function leaveRoom() {
  if (net) net.leave(); net = null; roomCode = "";
  for (const id of [...peers.keys()]) dropPeer(id);
  try { history.replaceState(null, "", location.pathname); } catch (e) {}
}
function onNet(m) {
  let pr = peers.get(m.from);
  if (m.t === "bye") { dropPeer(m.from); return; }
  if (!pr && m.t !== "hi") { if (net) net.send("hi", Object.assign(myHi(), { hello: 1 })); return; }
  if (m.t === "hi") {
    const isNew = !pr;
    if (!pr) { pr = { x: m.x, z: m.z, ry: m.ry || 0 }; peers.set(m.from, pr); }
    pr.name = m.name || "Bạn"; pr.st = m.st; const k = lookKey(m.look);
    if (pr.key !== k) {
      if (pr.p) scene.remove(pr.p.root);
      pr.key = k; pr.look = m.look; pr.p = makeAnimal(m.look); pr.p.root.position.set(pr.x, 0, pr.z); scene.add(pr.p.root);
      pr.tag = nameTag(spIcon(m.look.species) + " " + pr.name, "rgba(81,96,168,.85)"); pr.tag.position.y = 1.72; pr.p.root.add(pr.tag);
    }
    if (m.x != null && !pr.mv) { pr.x = m.x; pr.z = m.z; pr.ry = m.ry; }
    if (isNew || m.hello) { net.send("hi", myHi()); if (phase === "play") toast(`${spIcon(m.look.species)} <b>${esc(pr.name)}</b> vừa vào phòng!`, 3500); }
    if (m.st && phase === "menu" && curScreen === "wait") enterGame();   /* phòng đã chơi rồi -> vào chung luôn */
  }
  if (pr) pr.seen = performance.now();
  if (m.t === "pos") { pr.x = m.x; pr.z = m.z; pr.ry = m.ry; pr.mv = m.mv; }
  if (m.t === "start" && phase === "menu" && curScreen === "wait") enterGame();
  if (m.t === "bub") bubble(pr, m.text);
  if (m.t.startsWith("rp-")) onRpMsg(m, pr);
  if (curScreen === "wait") paintWait();
  paintRoomChip();
}
function dropPeer(id) {
  const pr = peers.get(id); if (!pr) return;
  if (pr.p) scene.remove(pr.p.root); peers.delete(id);
  if (rp && rp.partner === id) { $("#rp-turn").textContent = `😢 ${pr.name} đã rời phòng.`; $("#rp-task").hidden = true; $("#rp-end").hidden = false; }
  if (curScreen === "wait") paintWait(); paintRoomChip();
}
function paintWait() {
  $("#w-code").textContent = roomCode;
  $("#w-link").value = location.origin + location.pathname + "?room=" + roomCode;
  const rows = [`<li><span class="e">${spIcon(me.species)}</span>${esc(me.name)} <em>bạn</em></li>`];
  for (const pr of peers.values()) rows.push(`<li><span class="e">${spIcon(pr.look.species)}</span>${esc(pr.name)} <em>${pr.st ? "đang chơi" : "đang chờ"}</em></li>`);
  $("#w-list").innerHTML = rows.join(""); $("#w-count").textContent = rows.length;
  $("#w-hint").textContent = peers.size ? "Đủ người rồi thì bấm Bắt đầu nha. Ai vào sau vẫn chơi chung được." : "Đang đợi bạn vào… Bạn cũng có thể bắt đầu luôn, ai vào sau vẫn chơi chung được.";
}
function paintRoomChip() {
  const c = $("#roomchip");
  if (!net) { c.hidden = true; return; }
  c.hidden = false; c.textContent = `👫 ${roomCode} · ${peers.size + 1} bạn`;
}
$("#roomchip").onclick = () => { try { navigator.clipboard.writeText(location.origin + location.pathname + "?room=" + roomCode); toast("📋 Đã chép link phòng, gửi cho bạn nha!", 2500); } catch (e) {} };

/* bong bóng chữ trên đầu */
function bubble(pr, text) {
  if (!pr || !pr.p) return;
  if (pr.bub) pr.p.root.remove(pr.bub);
  const short = String(text).slice(0, 42);
  pr.bub = new THREE.Sprite(spriteTex("💬 " + short, "rgba(255,255,255,.95)", "#1d2340", 34)); pr.bub.scale.set(2.8, 0.6, 1); pr.bub.position.y = 2.25;
  pr.p.root.add(pr.bub); pr.bubT = performance.now() + 4500;
}
const meBub = { p: null };
function bubbleMe(text) { meBub.p = player; bubble(meBub, text); if (net) net.send("bub", { text }); }

/* ───────────────────────── Nhập vai cặp đôi theo kịch bản từng nhân vật ───────────────────────── */
let rp = null;   /* { sid, npc, lang, myRole, partner, partnerName, i, lines } */
function scriptOf(n, lang) {
  const L = [];
  n.steps.forEach((st) => { L.push({ r: 0, text: st.npc[lang], m: st.npc }); L.push({ r: 1, text: st.say[lang], m: st.say, py: lang === "zh" ? st.py : "" }); });
  L.push({ r: 0, text: n.end[lang], m: n.end });
  return L;
}
function nearPeers() {
  const pp = player.root.position, out = [];
  for (const [id, pr] of peers) if (pr.p && pr.st && Math.hypot(pr.x - pp.x, pr.z - pp.z) < 9) out.push([id, pr]);
  return out;
}
let pendingInv = null;
function paintPair() {
  const box = $("#dlg-pair"); if (!dlgNpc) return;
  if (!net) { box.innerHTML = ""; return; }
  if (pendingInv) { box.innerHTML = `<p class="sub">⏳ Đang mời ${esc(pendingInv.name)} nhập vai…</p>`; return; }
  const list = nearPeers();
  box.innerHTML = list.length ? list.map(([id, pr]) => `<button type="button" data-inv="${id}">👫 Nhập vai cùng ${esc(pr.name)} · bạn đóng ${dlgNpc.roles[1]}, ${esc(pr.name)} đóng ${dlgNpc.roles[0]}</button>`).join("")
    : `<p class="sub">👫 Rủ bạn trong phòng đứng gần đây để nhập vai cùng nhau (một người đóng ${dlgNpc.roles[0]}, một người đóng ${dlgNpc.roles[1]}).</p>`;
}
$("#dlg-pair").onclick = (e) => {
  const b = e.target.closest("[data-inv]"); if (!b || !dlgNpc) return;
  const id = b.dataset.inv, pr = peers.get(id); if (!pr) return;
  const sid = net.id + "-" + Date.now().toString(36);
  pendingInv = { sid, to: id, name: pr.name, npc: dlgNpc.id, lang: learn, myRole: 1 };
  net.send("rp-inv", { sid, to: id, npc: dlgNpc.id, lang: learn, toRole: 0 }); paintPair();
  setTimeout(() => { if (pendingInv && pendingInv.sid === sid) { pendingInv = null; paintPair(); } }, 25000);
};
function onRpMsg(m, pr) {
  if (m.to && m.to !== net.id) return;
  if (m.t === "rp-inv") {
    const n = NPCS.find((x) => x.id === m.npc); if (!n || rp) return;
    toast(`${spIcon(pr.look.species)} <b>${esc(pr.name)}</b> mời bạn nhập vai ở ${n.icon} <b>${n.title}</b>: bạn đóng <b>${n.roles[m.toRole]}</b>.
      <div class="row"><button type="button" class="yes" data-rpok>Đồng ý</button><button type="button" class="no" data-rpno>Để sau</button></div>`, 20000,
      (ok) => { net.send(ok ? "rp-ok" : "rp-no", { sid: m.sid, to: m.from }); if (ok) startRp({ sid: m.sid, npc: n, lang: m.lang, myRole: m.toRole, partner: m.from }); });
  } else if (m.t === "rp-ok" && pendingInv && pendingInv.sid === m.sid) {
    const n = NPCS.find((x) => x.id === pendingInv.npc); const p = pendingInv; pendingInv = null;
    closeDlg(); startRp({ sid: p.sid, npc: n, lang: p.lang, myRole: p.myRole, partner: m.from });
  } else if (m.t === "rp-no" && pendingInv && pendingInv.sid === m.sid) {
    $("#dlg-pair").innerHTML = `<p class="sub">${esc(pendingInv.name)} để sau nha. Thử lại sau cũng được 😊</p>`; pendingInv = null;
  } else if (rp && m.sid === rp.sid) {
    if (m.t === "rp-adv" && m.i >= rp.i && m.i < rp.lines.length) {   /* >= : không mất lượt nếu tin tới sớm */
      const ln = rp.lines[m.i]; speak(ln.text, rp.lang, rp.npc.look.female); bubble(pr, ln.text);
      rp.i = m.i + 1; if (!busy) paintRp();
    } else if (m.t === "rp-swap") { startRp({ sid: m.nsid, npc: rp.npc, lang: rp.lang, myRole: 1 - rp.myRole, partner: rp.partner }); }
    else if (m.t === "rp-quit") { $("#rp-turn").textContent = `${rp.partnerName} đã thoát nhập vai.`; $("#rp-task").hidden = true; $("#rp-end").hidden = false; $("#rp-swap").hidden = true; }
  }
}
function startRp(o) {
  closeDlg(); stopMic();
  const pr = peers.get(o.partner);
  rp = Object.assign(o, { i: 0, lines: scriptOf(o.npc, o.lang), partnerName: pr ? pr.name : "Bạn", rewarded: false });
  document.body.classList.add("talking"); $("#rp").hidden = false; $("#talk").hidden = true; $("#rp-swap").hidden = false;
  paintRp();
}
function paintRp() {
  if (!rp) return;
  const n = rp.npc, ml = meanOf(rp.lang), roleName = (r) => n.roles[r] + (r === rp.myRole ? " (bạn)" : ` (${rp.partnerName})`);
  $("#rp-title").textContent = n.icon + " " + n.title; $("#rp-roles").textContent = `Bạn đóng ${n.roles[rp.myRole]}`;
  $("#rp-lines").innerHTML = rp.lines.map((ln, k) => `<li class="r${ln.r === rp.myRole ? 1 : 0}${k === rp.i ? " cur" : k < rp.i ? " done" : ""}"><span class="who">${roleName(ln.r)}${k < rp.i ? " ✓" : ""}</span>${esc(ln.text)}${ln.py ? `<span class="py">${esc(ln.py)}</span>` : ""}<span class="m">${esc(ln.m[ml])}</span></li>`).join("");
  const curLi = $("#rp-lines .cur"); if (curLi) curLi.scrollIntoView({ block: "nearest" });
  $("#rp-res").innerHTML = ""; $("#rp-type").value = "";
  if (rp.i >= rp.lines.length) {
    $("#rp-task").hidden = true; $("#rp-end").hidden = false;
    $("#rp-turn").textContent = "🎉 Hai bạn diễn xong cả kịch bản! +3 ⭐";
    if (!rp.rewarded) { rp.rewarded = true; stars += 3; markNpcDone(n); save(); paintStars(); paintQuests(); }
    return;
  }
  $("#rp-end").hidden = true;
  const mine = rp.lines[rp.i].r === rp.myRole;
  $("#rp-task").hidden = !mine;
  $("#rp-turn").textContent = mine ? `🎤 Tới lượt bạn (${n.roles[rp.myRole]}): nói câu đang sáng` : `⏳ Đang chờ ${rp.partnerName} (${n.roles[1 - rp.myRole]}) nói…`;
}
function rpCheck(said) {
  if (!rp || busy) return;
  const ln = rp.lines[rp.i]; if (!ln || ln.r !== rp.myRole) return;
  const g = grade(ln.text, said, rp.lang), pass = g.score >= 0.7;
  $("#rp-res").innerHTML = resultHtml(g, said, pass);
  if (!pass) return;
  busy = true; stars += 1; paintStars(); bubbleMe(ln.text);
  net.send("rp-adv", { sid: rp.sid, to: rp.partner, i: rp.i, pct: Math.round(g.score * 100) });
  const sid = rp.sid; rp.i++;   /* tăng NGAY để tin của bạn tới trong lúc chờ không bị bỏ qua; chỉ vẽ lại sau 1,5 giây */
  setTimeout(() => { busy = false; if (!rp || rp.sid !== sid) return; save(); paintRp(); }, 1500);
}
$("#rp-send").onclick = () => { const v = $("#rp-type").value.trim(); if (v) rpCheck(v); };
$("#rp-mic").onclick = () => startMic($("#rp-mic"), rp.lang, () => rp.lines[rp.i].text, $("#rp-res"), rpCheck);
$("#rp-model").onclick = () => { if (rp && rp.lines[rp.i]) speak(rp.lines[rp.i].text, rp.lang, me.species === "bunny" || me.species === "cat"); };
function endRp(tell) { if (rp && tell && net) net.send("rp-quit", { sid: rp.sid, to: rp.partner }); rp = null; stopMic(); $("#rp").hidden = true; document.body.classList.remove("talking"); }
$("#rp-x").onclick = () => endRp(rp && rp.i < rp.lines.length);
$("#rp-done").onclick = () => endRp(false);
$("#rp-swap").onclick = () => {
  if (!rp || !peers.has(rp.partner)) return;
  const nsid = net.id + "-" + Date.now().toString(36);
  net.send("rp-swap", { sid: rp.sid, to: rp.partner, nsid });
  startRp({ sid: nsid, npc: rp.npc, lang: rp.lang, myRole: 1 - rp.myRole, partner: rp.partner });
};

/* thông báo nổi */
let toastT = 0, toastCb = null;
function toast(html, ms, cb) {
  const t = $("#toast"); t.innerHTML = html; t.hidden = false; toastCb = cb || null;
  clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; if (toastCb) { toastCb(false); toastCb = null; } }, ms || 3000);
}
$("#toast").onclick = (e) => {
  const ok = e.target.closest("[data-rpok]"), no = e.target.closest("[data-rpno]");
  if (!ok && !no) return;
  const cb = toastCb; toastCb = null; $("#toast").hidden = true; clearTimeout(toastT); if (cb) cb(!!ok);
};

/* ───────────────────────── Màn bắt đầu: tạo nhân vật → chọn cách chơi → phòng chờ ───────────────────────── */
let curScreen = "create";
function showScreen(id) { curScreen = id; for (const s of ["create", "mode", "wait"]) $("#scr-" + s).hidden = s !== id; }
function paintCreator() {
  const opt = (arr, sel, f) => arr.map((x) => f(x, sel)).join("");
  $("#c-name").value = me.name;
  $("#c-species").innerHTML = opt(SPECIES, me.species, (s, v) => `<button type="button" data-k="species" data-v="${s.id}" class="${s.id === v ? "on" : ""}"><span class="e">${s.icon}</span>${s.name}</button>`);
  $("#c-fur").innerHTML = opt(FURS, me.fur, (c, v) => `<button type="button" data-k="fur" data-v="${c}" class="${c === v ? "on" : ""}" style="background:${c}" aria-label="màu lông ${c}"></button>`);
  $("#c-fur").style.opacity = me.species === "panda" ? 0.35 : 1;
  $("#c-shirt").innerHTML = opt(SHIRTS, me.shirt, (c, v) => `<button type="button" data-k="shirt" data-v="${c}" class="${c === v ? "on" : ""}" style="background:${c}" aria-label="màu áo ${c}"></button>`);
  $("#c-pants").innerHTML = opt(PANTS, me.pants, (c, v) => `<button type="button" data-k="pants" data-v="${c}" class="${c === v ? "on" : ""}" style="background:${c}" aria-label="màu quần ${c}"></button>`);
  $("#c-bottom").innerHTML = `<button type="button" data-k="skirt" data-v="0" class="${!me.skirt ? "on" : ""}">👖 Quần</button><button type="button" data-k="skirt" data-v="1" class="${me.skirt ? "on" : ""}">👗 Váy</button>`;
  $("#c-acc").innerHTML = opt(ACCS, me.acc, (a, v) => `<button type="button" data-k="acc" data-v="${a.id}" class="${a.id === v ? "on" : ""}"><span class="e">${a.icon}</span>${a.name}</button>`);
}
$("#scr-create").addEventListener("click", (e) => {
  const b = e.target.closest("[data-k]"); if (!b) return;
  const k = b.dataset.k; let v = b.dataset.v;
  if (k === "skirt") v = v === "1";
  if (k === "species") { const sp = SPECIES.find((s) => s.id === v); if (sp && !FURS.includes(me.fur)) me.fur = sp.fur; if (sp && me.species !== v) me.fur = sp.fur; }
  me[k] = v; store.set("tjwl_town_me_v1", me); rebuildPlayer(); paintCreator();
});
$("#c-name").addEventListener("input", (e) => { me.name = e.target.value.trim().slice(0, 16); store.set("tjwl_town_me_v1", me); });
$("#c-next").onclick = () => {
  if (!me.name) { $("#c-err").textContent = "Đặt tên cho nhân vật trước nha 😊"; $("#c-name").focus(); return; }
  $("#c-err").textContent = "";
  const q = new URLSearchParams(location.search).get("room");
  if (q && /^[A-Za-z0-9]{3,6}$/.test(q) && !net) joinRoom(q); else showScreen(net ? "wait" : "mode");
};
$("#m-back").onclick = () => showScreen("create");
$("#m-solo").onclick = () => { leaveRoom(); enterGame(); };
$("#m-new").onclick = () => joinRoom(newCode());
$("#m-join").onclick = () => {
  const c = $("#m-code").value.trim().toUpperCase();
  if (!/^[A-Z0-9]{3,6}$/.test(c)) { $("#m-err").textContent = "Mã phòng gồm 3–6 chữ hoặc số nha."; return; }
  $("#m-err").textContent = ""; joinRoom(c);
};
$("#w-copy").onclick = () => { try { navigator.clipboard.writeText($("#w-link").value); $("#w-copy").textContent = "✓ Đã chép"; } catch (e) { $("#w-link").select(); } };
$("#w-start").onclick = () => { if (net) net.send("start", {}); enterGame(); };
$("#w-back").onclick = () => { leaveRoom(); showScreen("mode"); };
function enterGame() {
  if (phase === "play") return;
  phase = "play"; document.body.classList.remove("menu");
  player.root.position.set((Math.random() - 0.5) * 4, 0, 15 + Math.random() * 2); player.root.rotation.y = Math.PI; camYaw = 0;
  camera.position.set(player.root.position.x, 4, player.root.position.z + 7);
  paintRoomChip(); paintQuests();
  if (net) net.send("hi", myHi());
}

/* ───────────────────────── Bản đồ nhỏ (góc phải) ───────────────────────── */
const mini = $("#mini"), mg = mini.getContext("2d"), MS = 320, MW = 62;
const m2 = (x, z) => [MS / 2 + (x / MW) * (MS / 2), MS / 2 + (z / MW) * (MS / 2)];
function drawMini() {
  const pp = player.root.position;
  mg.fillStyle = "#8cc06a"; mg.fillRect(0, 0, MS, MS);
  mg.fillStyle = "#575c66";
  for (const s of [-1, 1]) {
    let [x0, z0] = m2(-75, s * RING - RW / 2), [x1, z1] = m2(75, s * RING + RW / 2); mg.fillRect(x0, z0, x1 - x0, z1 - z0);
    [x0, z0] = m2(s * RING - RW / 2, -24); [x1, z1] = m2(s * RING + RW / 2, 75); mg.fillRect(x0, z0, x1 - x0, z1 - z0);
  }
  mg.fillStyle = "#e3d6c0"; mg.beginPath(); const [cx, cz] = m2(0, 0); mg.arc(cx, cz, 13 / MW * MS / 2, 0, 7); mg.fill();
  mg.fillStyle = "#4fb3e0"; mg.beginPath(); mg.arc(cx, cz, 3.6 / MW * MS / 2, 0, 7); mg.fill();
  mg.fillStyle = "rgba(255,255,255,.75)";
  for (const c of colliders) if (!c.circle) { const [a, b] = m2(c.x0, c.z0), [d, e] = m2(c.x1, c.z1); mg.fillRect(a, b, d - a, e - b); }
  mg.font = "26px system-ui, sans-serif"; mg.textAlign = "center"; mg.textBaseline = "middle";
  for (const n of NPCS) {
    const [x, z] = m2(n.pos[0], n.pos[1]), done = prog[n.id] && prog[n.id].done;
    mg.fillStyle = done ? "#20a86b" : "#ff7a59"; mg.beginPath(); mg.arc(x, z, 17, 0, 7); mg.fill();
    mg.fillText(done ? "✅" : n.icon, x, z + 1);
  }
  for (const pr of peers.values()) { if (!pr.st) continue; const [x, z] = m2(pr.x, pr.z); mg.fillStyle = "#5160a8"; mg.strokeStyle = "#fff"; mg.lineWidth = 4; mg.beginPath(); mg.arc(x, z, 10, 0, 7); mg.stroke(); mg.fill(); }
  const [px, pz] = m2(pp.x, pp.z); const a = player.root.rotation.y;
  mg.save(); mg.translate(px, pz); mg.rotate(-a); mg.fillStyle = "#1d2340"; mg.strokeStyle = "#fff"; mg.lineWidth = 4;
  mg.beginPath(); mg.moveTo(0, 16); mg.lineTo(11, -10); mg.lineTo(0, -4); mg.lineTo(-11, -10); mg.closePath(); mg.stroke(); mg.fill(); mg.restore();
}

/* ───────────────────────── Vòng lặp ───────────────────────── */
const clock = new THREE.Clock();
const tmp = new THREE.Vector3(), camTarget = new THREE.Vector3(), camPos = new THREE.Vector3();
/* "hi" đều đặn bằng hẹn giờ (không theo khung hình: tab ẩn / máy yếu vẽ chậm vẫn gửi được) */
setInterval(() => { if (net) net.send("hi", myHi()); }, 2000);
document.addEventListener("visibilitychange", () => { if (net && !document.hidden) net.send("hi", myHi()); });
let qTick = 0, netTick = 0, freeCam = null, lastSent = "";
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime, now = performance.now();
  const pp = player.root.position;
  let speed = 0;
  if (phase === "menu") {
    if (!freeCam) player.root.rotation.y += dt * 0.5;
  } else {
    let f = 0, r = 0;
    if (!dlgNpc && !rp) {
      f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - joy.y;
      r = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + joy.x;
    }
    let mag = Math.min(1, Math.hypot(f, r));
    if (mag > 0.05 || dlgNpc || rp) { if (goTo) { goTo = null; goMark.visible = false; } }   /* tự bấm phím = thôi tự đi */
    if (goTo && mag <= 0.05) {
      const gx = goTo.x - pp.x, gz = goTo.z - pp.z, gd = Math.hypot(gx, gz);
      if (gd < 0.35) {
        const n = goTo.npc; goTo = null; goMark.visible = false;
        if (n) { player.root.rotation.y = Math.atan2(n.pos[0] - pp.x, n.pos[1] - pp.z); openDlg(n); }
      } else {
        /* kẹt (vướng nhà/cây) quá 1 giây -> dừng */
        if (gd < goTo.best - 0.05) { goTo.best = gd; goTo.stuckT = 0; } else if ((goTo.stuckT += dt) > 1) { const n = goTo.npc; goTo = null; goMark.visible = false; if (n && Math.hypot(n.pos[0] - pp.x, n.pos[1] - pp.z) < 3) openDlg(n); }
        if (goTo) {
          const run = gd > 4 ? 5 : 3.2; speed = run;
          const st = Math.min(gd, run * dt); pp.x += gx / gd * st; pp.z += gz / gd * st;
          const want = Math.atan2(gx, gz); let d = want - player.root.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d));
          player.root.rotation.y += d * Math.min(1, dt * 12);
        }
      }
    }
    if (mag > 0.05) {
      const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw);
      const dx = (fx * f - fz * r), dz = (fz * f + fx * r), L = Math.hypot(dx, dz) || 1;
      const run = keys.ShiftLeft || keys.ShiftRight || mag > 0.95 ? 5 : 3.2;
      speed = run * mag;
      pp.x += dx / L * speed * dt; pp.z += dz / L * speed * dt;
      const want = Math.atan2(dx, dz); let d = want - player.root.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d));
      player.root.rotation.y += d * Math.min(1, dt * 12);
    }
    collide(pp);
  }
  animateAnimal(player, speed / 3.2, dt, t);
  if (meBub.bub && now > meBub.bubT) { player.root.remove(meBub.bub); meBub.bub = null; }

  /* gửi vị trí cho bạn cùng phòng */
  if (net && phase === "play") {
    netTick += dt;
    const key = pp.x.toFixed(2) + "," + pp.z.toFixed(2) + "," + player.root.rotation.y.toFixed(2);
    if (netTick > 0.15 && key !== lastSent) { netTick = 0; lastSent = key; net.send("pos", { x: +pp.x.toFixed(2), z: +pp.z.toFixed(2), ry: +player.root.rotation.y.toFixed(2), mv: speed > 0.05 ? 1 : 0 }); }
    else if (netTick > 0.6 && speed === 0) { netTick = 0; }
  }
  /* bạn cùng phòng: đi mượt tới vị trí mới */
  for (const [id, pr] of peers) {
    if (!pr.p) continue;
    if (now - (pr.seen || now) > 15000) { dropPeer(id); continue; }
    pr.p.root.visible = phase === "play" && !!pr.st;   /* bạn còn ở màn chờ / mình còn ở màn chờ -> chưa hiện trong phố */
    const R0 = pr.p.root.position, dx = pr.x - R0.x, dz = pr.z - R0.z, d = Math.hypot(dx, dz);
    if (d > 8) R0.set(pr.x, 0, pr.z); else { const k = Math.min(1, dt * 8); R0.x += dx * k; R0.z += dz * k; }
    let dr = (pr.ry || 0) - pr.p.root.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); pr.p.root.rotation.y += dr * Math.min(1, dt * 10);
    animateAnimal(pr.p, d > 0.05 || pr.mv ? Math.min(1.5, d * 4 + 0.6) : 0, dt, t);
    if (pr.bub && now > pr.bubT) { pr.p.root.remove(pr.bub); pr.bub = null; }
  }

  /* người dân ở gần */
  near = null; let nd = 3;
  for (const n of NPCS) {
    const d = Math.hypot(pp.x - n.pos[0], pp.z - n.pos[1]);
    if (phase === "play" && d < nd) { nd = d; near = n; }
    const lookAt = d < 6 && phase === "play" ? Math.atan2(pp.x - n.pos[0], pp.z - n.pos[1]) : n.face;
    let dd = lookAt - n.p.root.rotation.y; dd = Math.atan2(Math.sin(dd), Math.cos(dd)); n.p.root.rotation.y += dd * Math.min(1, dt * 4);
    animateAnimal(n.p, 0, dt, t);
    n.mark.position.y = 2.2 + Math.sin(t * 3 + n.pos[0]) * 0.08;
  }
  $("#talk").hidden = !near || !!dlgNpc || !!rp;
  if (near && !dlgNpc) $("#talk").firstChild.textContent = `💬 Nói chuyện với ${near.name} `;

  for (const w of walkers) {
    const a = loopPoint(w.r, w.u); w.u += (w.v * w.dir * dt) / (2 * w.r);
    const b = loopPoint(w.r, w.u);
    w.p.root.position.set(b[0], 0.16, b[1]);
    w.p.root.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]);
    animateAnimal(w.p, w.v / 3.2, dt, t);
  }
  for (const c of cars) {
    const a = loopPoint(RING + 1.7, c.u), ahead = loopPoint(RING + 1.7, c.u + 0.06);
    let blocked = Math.hypot(pp.x - ahead[0], pp.z - ahead[1]) < 3.2;
    for (const pr of peers.values()) if (Math.hypot(pr.x - ahead[0], pr.z - ahead[1]) < 3.2) blocked = true;
    c.v += ((blocked ? 0 : 0.09) - c.v) * Math.min(1, dt * 3);
    c.u += c.v * dt * 0.25;
    const b = loopPoint(RING + 1.7, c.u + 0.002);
    c.g.position.set(a[0], 0, a[1]); c.g.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]);
  }
  for (const c of clouds) { c.position.x += dt * 1.5; if (c.position.x > 220) c.position.x = -220; }
  waterJet.scale.y = 1 + Math.sin(t * 6) * 0.08; waterTop.material.opacity = 0.82 + Math.sin(t * 3) * 0.05;

  /* camera */
  if (freeCam) { camera.position.copy(freeCam.pos); camera.lookAt(freeCam.look); camTarget.copy(freeCam.look); }
  else if (phase === "menu") {
    const narrow = innerWidth < 640;
    camTarget.set(pp.x + (narrow ? 0 : 0.85), narrow ? -0.35 : 0.65, pp.z);
    camera.position.lerp(tmp.set(pp.x + (narrow ? 0 : 0.85), narrow ? 1.25 : 1.15, pp.z + (narrow ? 3.6 : 3.3)), Math.min(1, dt * 5)); camera.lookAt(camTarget);
  } else {
    camTarget.set(pp.x, 1.0, pp.z);
    camPos.set(pp.x + Math.sin(camYaw) * Math.cos(camPitch) * camDist, 1.0 + Math.sin(camPitch) * camDist, pp.z + Math.cos(camYaw) * Math.cos(camPitch) * camDist);
    camera.position.lerp(camPos, Math.min(1, dt * 6)); camera.lookAt(camTarget);
  }
  sunLight.position.copy(tmp.copy(sun).multiplyScalar(80).add(camTarget)); sunLight.target.position.copy(camTarget);

  if ((qTick += dt) > 0.25) { qTick = 0; if (phase === "play") { paintQuests(); drawMini(); if (dlgNpc && !pendingInv) paintPair(); } }
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
for (const n of NPCS) if (prog[n.id] && prog[n.id].done) { n.mark.visible = false; n.markDone.visible = true; }
paintStars(); paintCreator(); showScreen("create");
{ const q = new URLSearchParams(location.search).get("room"); if (q) $("#m-code").value = q.toUpperCase(); }
camera.position.set(0, 1.2, 18.3);
addEventListener("resize", () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
requestAnimationFrame(frame);
setTimeout(() => $("#loading").classList.add("off"), 300);

/* cho kiểm thử / chụp demo */
window.__town = {
  go(x, z, yaw, pitch, dist) { player.root.position.set(x, 0, z); if (yaw != null) camYaw = yaw; if (pitch != null) camPitch = pitch; if (dist != null) camDist = dist; camera.position.set(x + Math.sin(camYaw) * camDist, 3, z + Math.cos(camYaw) * camDist); },
  face(a) { player.root.rotation.y = a; },
  camera, THREE,
  talk(id) { openDlg(NPCS.find((n) => n.id === id)); },
  say(text) { if (rp) rpCheck(text); else check(text); },
  cam(p, l) { freeCam = p ? { pos: new THREE.Vector3(...p), look: new THREE.Vector3(...l) } : null; },
  lang(a, b) { $("#sel-learn").value = a; $("#sel-learn").onchange({ target: { value: a } }); if (b) { $("#sel-mean").value = b; $("#sel-mean").onchange({ target: { value: b } }); } },
  play() { if (!me.name) me.name = "Test"; enterGame(); },
  state() { const P = player.root.position; return { pos: [+P.x.toFixed(1), +P.z.toFixed(1)], goTo: goTo && [+goTo.x.toFixed(1), +goTo.z.toFixed(1)], phase, room: roomCode, peers: [...peers.values()].map((p) => p.name), rp: rp && { i: rp.i, myRole: rp.myRole, n: rp.lines.length }, net: net && net.mode }; },
};
