/* town.js — 🏙 THÀNH PHỐ WORDLOOP (bản mẫu, TJ 2026-11-27: "làm đi, là con người nha. Thế giới đẹp").
   · Thành phố 3D nhỏ trong trình duyệt (three.js từ CDN, không có bước build). Mọi hình đều dựng bằng code
     (không dùng mô hình/hình ảnh của game nào khác) nên không lo bản quyền.
   · Người chơi đi lại (WASD / mũi tên / cần điều khiển trên điện thoại), tới gần người trong phố bấm E (hoặc nút)
     để nói chuyện. Mỗi người có 1 nhiệm vụ 2 câu: nghe câu của họ, rồi NÓI câu trả lời vào micro.
   · Nhận giọng = Web Speech API của trình duyệt (miễn phí, giống cc.js / readalong.js). Không có thì gõ.
   · Chấm điểm = so từng từ (không gọi AI, không tốn tiền). 4 thứ tiếng: en / es / zh / vi.
   · CHƯA nối phòng game nhiều người / Supabase — chỉ là bản cho TJ xem thử, nằm riêng ở nhánh của luồng này. */
import * as THREE from "three";
import { Sky } from "three/addons/objects/Sky.js";

/* ───────────────────────── Nội dung: 4 người, mỗi người 2 câu, 4 thứ tiếng ───────────────────────── */
const LOCALE = { en: "en-US", es: "es-ES", zh: "zh-CN", vi: "vi-VN" };
const NPCS = [
  {
    id: "cafe", icon: "☕", title: "Gọi cà phê ở quán", name: "Linh", role: "chủ quán cà phê",
    pos: [-26.6, -3], face: Math.PI / 2,
    look: { skin: "#f1c7a5", shirt: "#ffffff", pants: "#3a3f5c", hair: "#2b1d16", hairStyle: "bun", apron: "#7a4b2a", skirt: false, female: true },
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
    look: { skin: "#c98e63", shirt: "#2f4f8f", pants: "#1f2433", hair: "#1a1310", hairStyle: "cap", hat: "#2f4f8f", female: false },
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
    look: { skin: "#f3d2b3", shirt: "#e46f5b", pants: "#4a6b3c", hair: "#121212", hairStyle: "long", female: true, skirt: true },
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
    pos: [6.5, 5.5], face: -2.4,
    look: { skin: "#f6d9c4", shirt: "#f2c14e", pants: "#5b7fb5", hair: "#c9893b", hairStyle: "long", female: true, bag: "#8a5a3c" },
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
  for (const zz of [-10, -2]) { /* bàn ghế ngoài trời */
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
    [-38, 30, 9, 9, 6, "#f7d6e0", "#9c4f6b"], [-30, 40, 9, 9, 8, "#c7dbf2", "#4a6e9a"], [-8, 38, 10, 8, 5, "#fff1c1", "#b56f3a"], [8, 38, 10, 8, 9.6, "#d4e7c5", "#56794a"],
    [30, 40, 9, 9, 6.4, "#ffd8b1", "#b3543c"], [38, 30, 9, 9, 7, "#e2d3f5", "#6d58a6"], [-38, -28, 9, 9, 10, "#d9e4ea", "#5b6f7a"], [38, -28, 9, 9, 8, "#f9e0a8", "#9b6b2f"],
    [-52, -6, 10, 14, 13, "#cfd8e3", null], [52, -6, 10, 14, 15, "#efe6da", null], [-31, -38, 10, 8, 12, "#e8d5c4", null], [31, -38, 10, 8, 11, "#d5e3e0", null],
  ];
  for (const [x, z, w, d, h, wall, roof] of houses) {
    building(x, z, w, d, h, wall, roof ? { roof, roofH: 2.4 } : { roofFlat: "#7d756c" });
    const toCenter = Math.abs(x) > Math.abs(z) ? (x > 0 ? -Math.PI / 2 : Math.PI / 2) : (z > 0 ? Math.PI : 0);
    const off = Math.abs(x) > Math.abs(z) ? [x - Math.sign(x) * (w / 2 + 0.06), z] : [x, z - Math.sign(z) * (d / 2 + 0.06)];
    door(off[0], off[1], toCenter);
  }
}

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

/* ───────────────────────── Nhân vật người ───────────────────────── */
function capsule(r, len, m) { return new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 14), m); }
function sph(r, m, ws = 20, hs = 14) { return new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), m); }
function makePerson(o) {
  const s = o.scale || 1;
  const skin = mat(o.skin, { roughness: 0.65 }), shirt = mat(o.shirt, { roughness: 0.8 }), pants = mat(o.pants, { roughness: 0.85 });
  const hairM = mat(o.hair, { roughness: 0.55 }), shoe = mat(o.shoe || "#2a2522", { roughness: 0.5 });
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body); body.scale.setScalar(s);
  const LEG = 0.86;
  const legs = [], arms = [];
  for (const side of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(side * 0.095, LEG, 0); body.add(hip);
    const up = capsule(0.078, 0.3, pants); up.position.y = -0.21; hip.add(up);
    const knee = new THREE.Group(); knee.position.y = -0.43; hip.add(knee);
    const lo = capsule(0.066, 0.3, o.skirt ? skin : pants); lo.position.y = -0.19; knee.add(lo);
    const sh = box(0.12, 0.08, 0.24, shoe); sh.position.set(0, -0.39, 0.045); knee.add(sh);
    legs.push({ hip, knee, side });
  }
  const torso = capsule(0.165, 0.3, shirt); torso.scale.set(1.12, 1, 0.74); torso.position.y = LEG + 0.29; body.add(torso);
  if (o.female) { const hipsW = capsule(0.15, 0.06, pants); hipsW.scale.set(1.15, 1, 0.8); hipsW.position.y = LEG + 0.02; body.add(hipsW); }
  else { const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.12, 18), pants); belt.scale.z = 0.78; belt.position.y = LEG + 0.03; body.add(belt); }
  if (o.skirt) { const sk = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.46, 20, 1, true), mat(o.pants, { side: THREE.DoubleSide })); sk.position.y = LEG - 0.1; body.add(sk); }
  if (o.apron) { const ap = box(0.26, 0.5, 0.02, mat(o.apron)); ap.position.set(0, LEG + 0.12, 0.13); body.add(ap); }
  if (o.bag) { const bg = box(0.2, 0.26, 0.1, mat(o.bag)); bg.position.set(0, LEG + 0.3, -0.16); body.add(bg); }
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.1, 10), skin); neck.position.y = LEG + 0.6; body.add(neck);
  const head = new THREE.Group(); head.position.y = LEG + 0.77; body.add(head);
  const skull = sph(0.135, skin, 28, 20); skull.scale.set(0.95, 1.08, 1); head.add(skull);
  const eyeW = mat("#ffffff", { roughness: 0.3 }), eyeB = mat("#2b2320", { roughness: 0.2 });
  for (const sd of [-1, 1]) {
    const ew = sph(0.024, eyeW, 12, 8); ew.scale.z = 0.5; ew.position.set(sd * 0.048, 0.015, 0.122); head.add(ew);
    const eb = sph(0.014, eyeB, 10, 8); eb.position.set(sd * 0.048, 0.013, 0.134); head.add(eb);
    const brow = box(0.045, 0.009, 0.01, hairM); brow.position.set(sd * 0.05, 0.055, 0.128); brow.rotation.z = -sd * 0.12; head.add(brow);
    const ear = sph(0.028, skin, 10, 8); ear.scale.set(0.5, 1, 0.8); ear.position.set(sd * 0.128, 0.0, 0); head.add(ear);
  }
  const nose = sph(0.018, skin, 10, 8); nose.position.set(0, -0.015, 0.135); head.add(nose);
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.006, 6, 12, Math.PI), mat("#a8524f")); mouth.rotation.z = Math.PI; mouth.position.set(0, -0.055, 0.124); head.add(mouth);
  /* tóc */
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.146, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.52), hairM);
  cap.scale.set(0.98, 1.1, 1.05); cap.rotation.x = -0.32; cap.position.set(0, 0.012, -0.008); head.add(cap);
  if (o.hairStyle === "long") { const lh = capsule(0.12, 0.2, hairM); lh.scale.set(1.15, 1, 0.55); lh.position.set(0, -0.11, -0.07); head.add(lh); }
  if (o.hairStyle === "bun") { const bn = sph(0.07, hairM); bn.position.set(0, 0.1, -0.12); head.add(bn); }
  if (o.hairStyle === "cap") {
    const hc = new THREE.Mesh(new THREE.SphereGeometry(0.152, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.45), mat(o.hat || "#333")); hc.position.y = 0.03; head.add(hc);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.015, 18, 1, false, -Math.PI / 2, Math.PI), mat(o.hat || "#333")); brim.position.set(0, 0.06, 0.1); brim.scale.z = 1.3; head.add(brim);
  }
  for (const side of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(side * 0.215, LEG + 0.47, 0); sh.rotation.z = side * 0.09; body.add(sh);
    const ball = sph(0.07, shirt, 14, 10); sh.add(ball);
    const up = capsule(0.056, 0.22, shirt); up.position.y = -0.15; sh.add(up);
    const el = new THREE.Group(); el.position.y = -0.3; sh.add(el);
    const lo = capsule(0.048, 0.2, o.long ? shirt : skin); lo.position.y = -0.13; el.add(lo);
    const hand = sph(0.052, skin, 12, 10); hand.scale.set(0.8, 1.1, 0.9); hand.position.y = -0.28; el.add(hand);
    arms.push({ sh, el, side });
  }
  root.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  return { root, body, legs, arms, head, torso, phase: R() * 6, blend: 0 };
}
function animatePerson(p, speed, dt, t) {
  const moving = speed > 0.05;
  p.blend += ((moving ? 1 : 0) - p.blend) * Math.min(1, dt * 8);
  p.phase += dt * (2.2 + speed * 2.4);
  const k = p.blend;
  for (let i = 0; i < 2; i++) {
    const L = p.legs[i], ph = p.phase + i * Math.PI, a = Math.sin(ph);
    L.hip.rotation.x = a * 0.55 * k;
    L.knee.rotation.x = Math.max(0, -Math.cos(ph)) * 0.9 * k;
    const A = p.arms[i];
    A.sh.rotation.x = -a * 0.5 * k + Math.sin(t * 1.6 + i) * 0.03 * (1 - k);
    A.el.rotation.x = -0.25 - 0.25 * k;
  }
  p.body.position.y = Math.abs(Math.sin(p.phase)) * 0.045 * k + Math.sin(t * 2) * 0.004 * (1 - k);
  p.torso.rotation.y = Math.sin(p.phase) * 0.08 * k;
}

/* Bảng tên + dấu nhiệm vụ trên đầu */
function spriteTex(text, bg, fg, font = 46) {
  const t = labelTex(text, bg, fg, 512, 112, font); return new THREE.SpriteMaterial({ map: t, depthTest: true, transparent: true });
}

/* Người chơi */
const player = makePerson({ skin: "#e8b48f", shirt: "#ff7a59", pants: "#2f3a5c", hair: "#2c1c12", hairStyle: "short", shoe: "#f5f5f5" });
player.root.position.set(0, 0, 15); player.root.rotation.y = Math.PI; scene.add(player.root);

/* Người có nhiệm vụ */
for (const n of NPCS) {
  n.p = makePerson(n.look); n.p.root.position.set(n.pos[0], 0.0, n.pos[1]); n.p.root.rotation.y = n.face; scene.add(n.p.root);
  const tag = new THREE.Sprite(spriteTex(n.name + " · " + n.role, "rgba(29,35,64,.78)", "#fff", 40)); tag.scale.set(2.3, 0.5, 1); tag.position.y = 2.15; n.p.root.add(tag);
  n.mark = new THREE.Sprite(spriteTex("!", "#ff7a59", "#fff", 90)); n.mark.scale.set(0.5, 0.5 * 112 / 512 * 4.6, 1); n.mark.position.y = 2.65; n.p.root.add(n.mark);
  n.markDone = new THREE.Sprite(spriteTex("✓", "#20a86b", "#fff", 90)); n.markDone.scale.copy(n.mark.scale); n.markDone.position.y = 2.65; n.markDone.visible = false; n.p.root.add(n.markDone);
  colliders.push({ circle: true, x: n.pos[0], z: n.pos[1], r: 0.45, npc: n });
}

/* Người đi đường + xe chạy quanh vòng */
const walkers = [];
const LOOKS = [
  ["#f1c7a5", "#4f86c6", "#2d2d2d", "#3b2415", "short"], ["#8d5a3b", "#f4d35e", "#38404f", "#121212", "short"], ["#f6d9c4", "#9b5de5", "#e9e3d5", "#d9a441", "long"],
  ["#c98e63", "#2a9d8f", "#444", "#222", "bun"], ["#e8b48f", "#e63946", "#1d3557", "#5a3a22", "long"], ["#f3d2b3", "#ffffff", "#4a4e69", "#111", "short"],
  ["#a86a45", "#ffb703", "#264653", "#1b1b1b", "cap"], ["#f1c7a5", "#06d6a0", "#3a3a3a", "#8b5a2b", "short"],
];
LOOKS.forEach((l, i) => {
  const p = makePerson({ skin: l[0], shirt: l[1], pants: l[2], hair: l[3], hairStyle: l[4], hat: l[1], female: l[4] !== "short" && l[4] !== "cap", scale: 0.94 + R() * 0.1 });
  const inner = i % 2 === 0, r = inner ? RING - RW / 2 - 1 : RING + RW / 2 + 1;
  walkers.push({ p, r, u: R() * 4, dir: i % 3 === 0 ? -1 : 1, v: 1.1 + R() * 0.5 });
  scene.add(p.root);
});
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
addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT") { if (e.key === "Enter") $("#dlg-send").click(); return; }
  keys[e.code] = true;
  if (e.code === "KeyE" && near && dlgNpc === null) openDlg(near);
  if (e.code === "Escape") closeDlg();
});
addEventListener("keyup", (e) => { keys[e.code] = false; });
const isTouch = matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
if (isTouch) document.body.classList.add("touch");
let camYaw = 0, camPitch = 0.34, camDist = 8;
{ /* kéo để xoay camera */
  let drag = null;
  const cv = renderer.domElement;
  cv.addEventListener("pointerdown", (e) => { drag = { id: e.pointerId, x: e.clientX, y: e.clientY }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener("pointermove", (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    camYaw -= (e.clientX - drag.x) * 0.006; camPitch = THREE.MathUtils.clamp(camPitch + (e.clientY - drag.y) * 0.004, 0.08, 1.1);
    drag.x = e.clientX; drag.y = e.clientY;
  });
  cv.addEventListener("pointerup", () => { drag = null; });
  cv.addEventListener("wheel", (e) => { camDist = THREE.MathUtils.clamp(camDist + e.deltaY * 0.01, 4, 16); }, { passive: true });
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

/* ───────────────────────── Hội thoại + nhiệm vụ nói ───────────────────────── */
const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
const prog = store.get("tjwl_town_prog_v1", {});
let stars = store.get("tjwl_town_stars_v1", 0);
let learn = store.get("tjwl_town_learn_v1", "en"), mean = store.get("tjwl_town_mean_v1", "vi");
$("#sel-learn").value = learn; $("#sel-mean").value = mean;
const meanLang = () => (mean !== learn ? mean : learn === "en" ? "vi" : "en");
$("#sel-learn").onchange = (e) => { learn = e.target.value; store.set("tjwl_town_learn_v1", learn); if (dlgNpc) showStep(); };
$("#sel-mean").onchange = (e) => { mean = e.target.value; store.set("tjwl_town_mean_v1", mean); if (dlgNpc) showStep(); };
function save() { store.set("tjwl_town_prog_v1", prog); store.set("tjwl_town_stars_v1", stars); }
function paintStars() { $("#stars").textContent = "⭐ " + stars; }

function paintQuests() {
  const pp = player.root.position;
  $("#quests").innerHTML = "<h4>📜 Nhiệm vụ nói</h4><ul>" + NPCS.map((n) => {
    const done = prog[n.id] && prog[n.id].done, d = Math.round(Math.hypot(pp.x - n.pos[0], pp.z - n.pos[1]));
    return `<li class="${done ? "done" : ""}">${done ? "✅" : n.icon}<span>${n.title}</span><em class="dist">${done ? "" : d + " m"}</em></li>`;
  }).join("") + "</ul>";
}

let voices = [];
function loadVoices() { try { voices = speechSynthesis.getVoices(); } catch (e) {} }
if ("speechSynthesis" in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
function speak(text, lang, female) {
  if (!("speechSynthesis" in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = LOCALE[lang]; u.rate = 0.92;
    const pool = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith(lang));
    const pick = pool.find((v) => (female ? /female|samantha|zira|linh|mei|google/i : /male|daniel|david|carlos|google/i).test(v.name)) || pool[0];
    if (pick) u.voice = pick;
    speechSynthesis.speak(u);
  } catch (e) {}
}

/* chấm điểm: so từng từ (tiếng Trung: từng chữ) */
const NUM = { en: ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"], es: ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez"], zh: "零一二三四五六七八九十".split(""), vi: ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín", "mười"] };
function normTok(s, lang) {
  s = s.toLowerCase().replace(/[\p{P}\p{S}]/gu, " ");
  s = s.replace(/\b(10|[0-9])\b/g, (m) => " " + NUM[lang][+m] + " ");
  if (lang === "vi" || lang === "es") s = s.normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d");
  if (lang === "en") s = s.replace(/\bi'?d\b/g, "i would").replace(/\bwhat's\b/g, "what is").replace(/\bit's\b/g, "it is");
  if (lang === "zh") return s.replace(/[0-9]/g, (d) => NUM.zh[+d]).replace(/\s+/g, "").split("").filter(Boolean);
  return s.split(/\s+/).filter(Boolean);
}
function grade(target, said, lang) {
  const want = normTok(target, lang), got = normTok(said, lang);
  const bag = new Map(); got.forEach((w) => bag.set(w, (bag.get(w) || 0) + 1));
  const ok = want.map((w) => { const n = bag.get(w) || 0; if (n) { bag.set(w, n - 1); return true; } return false; });
  const score = want.length ? ok.filter(Boolean).length / want.length : 0;
  /* tô màu theo câu gốc */
  const pieces = lang === "zh" ? [...target] : target.split(/(\s+)/);
  let j = 0; const html = pieces.map((p) => {
    const toks = normTok(p, lang); if (!toks.length) return esc(p);
    const good = toks.every(() => ok[j++]); return `<span class="${good ? "w-ok" : "w-bad"}">${esc(p)}</span>`;
  }).join("");
  return { score, html };
}
function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

let dlgNpc = null, near = null, busy = false;
function cur() { const pr = prog[dlgNpc.id] || (prog[dlgNpc.id] = { step: 0, done: false }); return pr; }
function openDlg(n) { dlgNpc = n; $("#dlg").hidden = false; $("#talk").hidden = true; showStep(); }
function closeDlg() { stopMic(); dlgNpc = null; $("#dlg").hidden = true; try { speechSynthesis.cancel(); } catch (e) {} }
function showStep() {
  const n = dlgNpc, pr = cur(), ml = meanLang();
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
  const st = n.steps[pr.step], g = grade(st.say[learn], said, learn), pct = Math.round(g.score * 100), pass = g.score >= 0.7;
  $("#dlg-res").innerHTML = `<span class="score" style="background:${pass ? "var(--ok)" : "var(--bad)"}">${pct}%</span>` +
    (pass ? "Giỏi quá! 🎉 " : "Gần được rồi, thử lại nhé! ") + `<br>Bạn nói: <i>${esc(said || "…")}</i><br>${g.html}`;
  if (!pass) return;
  busy = true; stars += 1; paintStars();
  setTimeout(() => {
    busy = false; if (dlgNpc !== n) return;
    pr.step++; if (pr.step >= n.steps.length) { pr.done = true; stars += 3; paintStars(); n.mark.visible = false; n.markDone.visible = true; }
    save(); showStep(); paintQuests();
    if (pr.done) $("#dlg-res").innerHTML = '<span class="score" style="background:var(--ok)">+3 ⭐</span> Hoàn thành nhiệm vụ! Đi tìm người tiếp theo nha 🚶';
  }, 1400);
}
$("#dlg-x").onclick = closeDlg;
$("#talk").onclick = () => { if (near) openDlg(near); };
$("#dlg-hear").onclick = () => { const pr = cur(); speak(pr.done ? dlgNpc.end[learn] : dlgNpc.steps[pr.step].npc[learn], learn, dlgNpc.look.female); };
$("#dlg-model").onclick = () => speak(dlgNpc.steps[cur().step].say[learn], learn, false);
$("#dlg-send").onclick = () => { const v = $("#dlg-type").value.trim(); if (v) check(v); };

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null;
if (!SR) { $("#dlg-mic").textContent = "🎤 Máy này chưa nghe được giọng — gõ bên dưới nhé"; $("#dlg-mic").disabled = true; }
function stopMic() { if (rec) { try { rec.abort(); } catch (e) {} rec = null; } $("#dlg-mic").classList.remove("on"); if (SR) $("#dlg-mic").textContent = "🎤 Bấm để nói"; }
$("#dlg-mic").onclick = () => {
  if (!SR) return;
  if (rec) { stopMic(); return; }
  try { speechSynthesis.cancel(); } catch (e) {}
  rec = new SR(); rec.lang = LOCALE[learn]; rec.interimResults = true; rec.maxAlternatives = 3;
  const btn = $("#dlg-mic"); btn.classList.add("on"); btn.textContent = "● Đang nghe… bấm để dừng";
  rec.onresult = (e) => {
    const r = e.results[e.results.length - 1];
    if (!r.isFinal) { $("#dlg-res").innerHTML = "🎧 <i>" + esc(r[0].transcript) + "</i>"; return; }
    let best = r[0].transcript, bs = -1; const st = dlgNpc.steps[cur().step];
    for (let i = 0; i < r.length; i++) { const s = grade(st.say[learn], r[i].transcript, learn).score; if (s > bs) { bs = s; best = r[i].transcript; } }
    stopMic(); check(best);
  };
  rec.onerror = (e) => { stopMic(); if (e.error === "not-allowed") $("#dlg-res").textContent = "🎤 Chưa cho phép dùng micro — bấm biểu tượng ổ khoá trên thanh địa chỉ để bật nhé."; };
  rec.onend = () => { if (rec) stopMic(); };
  try { rec.start(); } catch (e) { stopMic(); }
};

/* ───────────────────────── Vòng lặp ───────────────────────── */
const clock = new THREE.Clock();
const tmp = new THREE.Vector3(), camTarget = new THREE.Vector3(), camPos = new THREE.Vector3();
let qTick = 0, freeCam = null;
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  /* người chơi */
  let f = 0, r = 0;
  if (!dlgNpc) {
    f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - joy.y;
    r = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + joy.x;
  }
  const mag = Math.min(1, Math.hypot(f, r));
  const pp = player.root.position;
  let speed = 0;
  if (mag > 0.05) {
    const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw);
    const dx = (fx * f - fz * r), dz = (fz * f + fx * r), L = Math.hypot(dx, dz) || 1;
    const run = keys.ShiftLeft || keys.ShiftRight || mag > 0.95 ? 5.2 : 3.4;
    speed = run * mag;
    pp.x += dx / L * speed * dt; pp.z += dz / L * speed * dt;
    const want = Math.atan2(dx, dz); let d = want - player.root.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d));
    player.root.rotation.y += d * Math.min(1, dt * 12);
  }
  collide(pp);
  animatePerson(player, speed / 3.4, dt, t);

  /* ai đang ở gần */
  near = null; let nd = 3.2;
  for (const n of NPCS) {
    const d = Math.hypot(pp.x - n.pos[0], pp.z - n.pos[1]);
    if (d < nd) { nd = d; near = n; }
    const lookAt = d < 6 ? Math.atan2(pp.x - n.pos[0], pp.z - n.pos[1]) : n.face;
    let dd = lookAt - n.p.root.rotation.y; dd = Math.atan2(Math.sin(dd), Math.cos(dd)); n.p.root.rotation.y += dd * Math.min(1, dt * 4);
    animatePerson(n.p, 0, dt, t);
    n.mark.position.y = 2.65 + Math.sin(t * 3 + n.pos[0]) * 0.08;
  }
  $("#talk").hidden = !near || !!dlgNpc;
  if (near && !dlgNpc) $("#talk").firstChild.textContent = `💬 Nói chuyện với ${near.name} `;

  /* người đi đường */
  for (const w of walkers) {
    const a = loopPoint(w.r, w.u); w.u += (w.v * w.dir * dt) / (2 * w.r);
    const b = loopPoint(w.r, w.u);
    w.p.root.position.set(b[0], 0.16, b[1]);
    w.p.root.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]);
    animatePerson(w.p, w.v / 3.4, dt, t);
  }
  /* xe: chậm lại khi người chơi đứng trước mũi xe */
  for (const c of cars) {
    const a = loopPoint(RING + 1.7, c.u);
    const ahead = loopPoint(RING + 1.7, c.u + 0.06);
    const blocked = Math.hypot(pp.x - ahead[0], pp.z - ahead[1]) < 3.2;
    c.v += ((blocked ? 0 : 0.09) - c.v) * Math.min(1, dt * 3);
    c.u += c.v * dt * 0.25;
    const b = loopPoint(RING + 1.7, c.u + 0.002);
    c.g.position.set(a[0], 0, a[1]); c.g.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]);
  }
  for (const c of clouds) { c.position.x += dt * 1.5; if (c.position.x > 220) c.position.x = -220; }
  waterJet.scale.y = 1 + Math.sin(t * 6) * 0.08; waterTop.material.opacity = 0.82 + Math.sin(t * 3) * 0.05;

  /* camera bám sau lưng */
  camTarget.set(pp.x, 1.5, pp.z);
  camPos.set(pp.x + Math.sin(camYaw) * Math.cos(camPitch) * camDist, 1.5 + Math.sin(camPitch) * camDist, pp.z + Math.cos(camYaw) * Math.cos(camPitch) * camDist);
  if (freeCam) { camera.position.copy(freeCam.pos); camera.lookAt(freeCam.look); }
  else { camera.position.lerp(camPos, Math.min(1, dt * 6)); camera.lookAt(camTarget); }
  sunLight.position.copy(tmp.copy(sun).multiplyScalar(80).add(camTarget)); sunLight.target.position.copy(camTarget);

  if ((qTick += dt) > 0.5) { qTick = 0; paintQuests(); }
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
for (const n of NPCS) if (prog[n.id] && prog[n.id].done) { n.mark.visible = false; n.markDone.visible = true; }
paintStars(); paintQuests();
camera.position.set(0, 5, 24);
addEventListener("resize", () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
requestAnimationFrame(frame);
setTimeout(() => $("#loading").classList.add("off"), 300);

/* cho kiểm thử / chụp demo */
window.__town = {
  go(x, z, yaw, pitch, dist) { player.root.position.set(x, 0, z); if (yaw != null) camYaw = yaw; if (pitch != null) camPitch = pitch; if (dist != null) camDist = dist; camera.position.set(x + Math.sin(camYaw) * camDist, 4, z + Math.cos(camYaw) * camDist); },
  face(a) { player.root.rotation.y = a; },
  camera, THREE,
  talk(id) { openDlg(NPCS.find((n) => n.id === id)); },
  say(text) { check(text); },
  cam(p, l) { freeCam = p ? { pos: new THREE.Vector3(...p), look: new THREE.Vector3(...l) } : null; },
  lang(a, b) { $("#sel-learn").value = a; $("#sel-learn").onchange({ target: { value: a } }); if (b) { $("#sel-mean").value = b; $("#sel-mean").onchange({ target: { value: b } }); } },
};
