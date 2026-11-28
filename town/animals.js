/* animals.js — nhân vật THÚ CUTE đi 2 chân (TJ 2026-11-28: "thế con người thành động vật cute hết đi nha").
   Tất cả dựng bằng hình khối trong code (không dùng mô hình / nhân vật của game nào khác).
   makeAnimal(look) -> { root, body, legs, arms, head, torso, phase, blend }; animateAnimal(p, speed, dt, t) cho đi / đứng thở. */
import * as THREE from "three";

export const SPECIES = [
  { id: "cat", icon: "🐱", name: "Mèo", fur: "#f3b46a", fur2: "#fff3e3" },
  { id: "bunny", icon: "🐰", name: "Thỏ", fur: "#ffffff", fur2: "#ffe4ec" },
  { id: "bear", icon: "🐻", name: "Gấu", fur: "#9b6a43", fur2: "#e9cfa9" },
  { id: "fox", icon: "🦊", name: "Cáo", fur: "#e8803a", fur2: "#ffffff" },
  { id: "panda", icon: "🐼", name: "Gấu trúc", fur: "#ffffff", fur2: "#ffffff" },
  { id: "dog", icon: "🐶", name: "Cún", fur: "#d9a96b", fur2: "#fff6e6" },
];
export const FURS = ["#f3b46a", "#ffffff", "#9b6a43", "#e8803a", "#a9abb8", "#3a3434", "#f6c9d6", "#e9d3a8"];
export const SHIRTS = ["#ff7a59", "#ffd23f", "#4f86c6", "#2a9d8f", "#9b5de5", "#ff6b8b", "#ffffff", "#2f3a5c"];
export const PANTS = ["#2f3a5c", "#4a6b3c", "#6b4f3a", "#e9e3d5", "#e46f5b", "#5b7fb5"];
export const ACCS = [
  { id: "none", icon: "🚫", name: "Không" }, { id: "cap", icon: "🧢", name: "Mũ" }, { id: "bow", icon: "🎀", name: "Nơ" },
  { id: "glasses", icon: "👓", name: "Kính" }, { id: "scarf", icon: "🧣", name: "Khăn" }, { id: "bag", icon: "🎒", name: "Balo" },
];

const cache = new Map();
function mat(color, o = {}) {
  const k = color + JSON.stringify(o);
  if (!cache.has(k)) cache.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0, ...o }));
  return cache.get(k);
}
const sph = (r, m, w = 22, h = 16) => new THREE.Mesh(new THREE.SphereGeometry(r, w, h), m);
const cap = (r, l, m) => new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 6, 14), m);
const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);

export function makeAnimal(o) {
  const sp = SPECIES.find((s) => s.id === o.species) || SPECIES[0];
  const panda = sp.id === "panda";
  const furC = panda ? "#ffffff" : (o.fur || sp.fur), fur2C = panda ? "#ffffff" : (o.fur2 || sp.fur2);
  const fur = mat(furC, { roughness: 0.9 }), fur2 = mat(fur2C, { roughness: 0.9 }), dark = mat("#2a2a2e", { roughness: 0.6 });
  const shirt = mat(o.shirt || "#ff7a59"), pants = mat(o.pants || "#2f3a5c");
  const pink = mat("#ffb3c1", { roughness: 0.8 }), black = mat("#1b1b1f", { roughness: 0.25 }), white = mat("#ffffff", { roughness: 0.2 });
  const limb = panda ? dark : fur;
  const s = o.scale || 1;
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body); body.scale.setScalar(s);
  const LEG = 0.42, legs = [], arms = [];

  for (const side of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(side * 0.095, LEG, 0); body.add(hip);
    const up = cap(0.075, 0.1, o.skirt ? limb : pants); up.position.y = -0.1; hip.add(up);
    const knee = new THREE.Group(); knee.position.y = -0.2; hip.add(knee);
    const lo = cap(0.07, 0.08, limb); lo.position.y = -0.08; knee.add(lo);
    const foot = sph(0.085, limb, 16, 12); foot.scale.set(1, 0.62, 1.3); foot.position.set(0, -0.17, 0.03); knee.add(foot);
    legs.push({ hip, knee, side });
  }
  const torso = cap(0.2, 0.16, shirt); torso.scale.set(1.05, 1, 0.9); torso.position.y = LEG + 0.2; body.add(torso);
  const hips = cap(0.19, 0.02, o.skirt ? shirt : pants); hips.scale.set(1.02, 1, 0.88); hips.position.y = LEG + 0.04; body.add(hips);
  if (o.skirt) { const sk = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.3, 22, 1, true), mat(o.pants || "#e46f5b", { side: THREE.DoubleSide })); sk.position.y = LEG - 0.02; body.add(sk); }
  if (o.apron) { const ap = box(0.26, 0.3, 0.02, mat(o.apron)); ap.position.set(0, LEG + 0.12, 0.18); body.add(ap); }

  /* đầu to tròn kiểu chibi */
  const head = new THREE.Group(); head.position.y = LEG + 0.62; body.add(head);
  const skull = sph(0.27, fur, 32, 24); skull.scale.set(1.08, 0.95, 1); head.add(skull);
  const muzzle = sph(0.11, fur2, 20, 14); muzzle.scale.set(1.25, 0.8, 0.8); muzzle.position.set(0, -0.08, 0.21); head.add(muzzle);
  if (sp.id === "fox") { muzzle.scale.set(1.1, 0.75, 1.25); muzzle.position.z = 0.23; }
  const nose = sph(0.032, sp.id === "bunny" || sp.id === "cat" ? pink : black, 12, 10); nose.scale.set(1.3, 0.9, 1); nose.position.set(0, -0.04, sp.id === "fox" ? 0.35 : 0.3); head.add(nose);
  for (const sd of [-1, 1]) {
    if (panda) { const pt = sph(0.075, dark, 16, 12); pt.scale.set(0.9, 1.15, 0.5); pt.position.set(sd * 0.105, 0.02, 0.215); pt.rotation.z = sd * 0.5; head.add(pt); }
    const eye = sph(0.042, black, 16, 12); eye.scale.set(0.9, 1.1, 0.6); eye.position.set(sd * 0.1, 0.025, 0.245); head.add(eye);
    const hl = sph(0.014, white, 8, 6); hl.position.set(sd * 0.1 + 0.012, 0.045, 0.27); head.add(hl);
    const ck = sph(0.045, pink, 12, 8); ck.scale.set(1.2, 0.7, 0.4); ck.position.set(sd * 0.17, -0.07, 0.2); head.add(ck);
    /* tai */
    if (sp.id === "cat" || sp.id === "fox") {
      const e = new THREE.Mesh(new THREE.ConeGeometry(sp.id === "fox" ? 0.1 : 0.09, sp.id === "fox" ? 0.24 : 0.18, 4), fur); e.position.set(sd * 0.15, 0.25, -0.01); e.rotation.set(0, Math.PI / 4, -sd * 0.32); head.add(e);
      const ei = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.12, 4), sp.id === "fox" ? dark : pink); ei.position.set(sd * 0.148, 0.235, 0.025); ei.rotation.set(0, Math.PI / 4, -sd * 0.32); head.add(ei);
    } else if (sp.id === "bunny") {
      const e = cap(0.055, 0.28, fur); e.scale.z = 0.6; e.position.set(sd * 0.09, 0.4, -0.02); e.rotation.z = -sd * 0.14; head.add(e);
      const ei = cap(0.03, 0.22, pink); ei.scale.z = 0.4; ei.position.set(sd * 0.09, 0.4, 0.012); ei.rotation.z = -sd * 0.14; head.add(ei);
    } else if (sp.id === "dog") {
      const e = cap(0.07, 0.14, mat(o.fur2 && o.fur2 !== fur2C ? o.fur2 : shade(furC), { roughness: 0.9 })); e.scale.z = 0.5; e.position.set(sd * 0.25, 0.03, 0); e.rotation.z = sd * 0.35; head.add(e);
    } else {
      const e = sph(0.085, panda ? dark : fur, 16, 12); e.scale.z = 0.6; e.position.set(sd * 0.19, 0.2, -0.02); head.add(e);
      const ei = sph(0.045, panda ? dark : fur2, 12, 8); ei.scale.z = 0.4; ei.position.set(sd * 0.19, 0.2, 0.025); head.add(ei);
    }
  }
  if (sp.id === "cat") for (const sd of [-1, 1]) for (const k of [-1, 1]) { const w = box(0.11, 0.006, 0.006, dark); w.position.set(sd * 0.16, -0.06 + k * 0.018, 0.25); w.rotation.z = sd * k * 0.15; head.add(w); }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.006, 6, 12, Math.PI), dark); mouth.rotation.z = Math.PI; mouth.position.set(0, -0.1, 0.29); head.add(mouth);

  /* phụ kiện */
  const acc = o.acc || "none", accC = mat(o.accColor || o.shirt || "#ff7a59");
  if (acc === "cap") {
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.255, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.42), accC); c.position.y = 0.07; c.scale.set(1.08, 1, 1); head.add(c);
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 20, 1, false, -Math.PI / 2, Math.PI), accC); b.position.set(0, 0.13, 0.17); b.scale.z = 1.2; head.add(b);
  } else if (acc === "bow") {
    const g = new THREE.Group(); const bm = mat(o.accColor || "#ff4f7b");
    for (const sd of [-1, 1]) { const w = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.12, 12), bm); w.rotation.z = sd * Math.PI / 2; w.position.x = sd * 0.06; g.add(w); }
    g.add(sph(0.035, bm, 12, 8)); g.position.set(0.15, 0.2, 0.12); g.rotation.z = -0.4; head.add(g);
  } else if (acc === "glasses") {
    for (const sd of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.01, 8, 20), dark); r.position.set(sd * 0.1, 0.025, 0.27); head.add(r); }
    const br = box(0.06, 0.01, 0.01, dark); br.position.set(0, 0.03, 0.28); head.add(br);
  } else if (acc === "scarf") {
    const sc = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.055, 10, 24), mat(o.accColor || "#e63946")); sc.rotation.x = Math.PI / 2; sc.position.y = LEG + 0.4; body.add(sc);
    const tl = box(0.08, 0.2, 0.04, mat(o.accColor || "#e63946")); tl.position.set(0.08, LEG + 0.3, 0.17); body.add(tl);
  } else if (acc === "bag") {
    const bg = box(0.26, 0.3, 0.12, mat(o.accColor || "#8a5a3c")); bg.position.set(0, LEG + 0.22, -0.22); body.add(bg);
  }

  for (const side of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(side * 0.22, LEG + 0.32, 0); sh.rotation.z = side * 0.25; body.add(sh);
    const up = cap(0.06, 0.08, shirt); up.position.y = -0.08; sh.add(up);
    const el = new THREE.Group(); el.position.y = -0.16; sh.add(el);
    const lo = cap(0.056, 0.06, o.long ? shirt : limb); lo.position.y = -0.06; el.add(lo);
    const paw = sph(0.065, limb, 14, 10); paw.position.y = -0.14; el.add(paw);
    arms.push({ sh, el, side });
  }
  /* đuôi */
  let tail = null;
  if (sp.id === "cat") { tail = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 8, 20, Math.PI * 1.1), fur); tail.position.set(0, LEG + 0.15, -0.3); tail.rotation.set(0, Math.PI / 2, 0.3); }
  else if (sp.id === "fox") { tail = new THREE.Group(); const t1 = cap(0.1, 0.22, fur); t1.rotation.x = -0.9; tail.add(t1); const tip = sph(0.095, fur2, 14, 10); tip.position.set(0, 0.13, -0.17); tail.add(tip); tail.position.set(0, LEG + 0.1, -0.28); }
  else if (sp.id === "dog") { tail = cap(0.04, 0.16, fur); tail.position.set(0, LEG + 0.15, -0.24); tail.rotation.x = -0.7; }
  else { tail = sph(sp.id === "bunny" ? 0.08 : 0.055, panda ? dark : sp.id === "bunny" ? mat("#ffffff") : fur, 14, 10); tail.position.set(0, LEG + 0.06, -0.21); }
  tail.userData.ry0 = tail.rotation.y; body.add(tail);

  root.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  return { root, body, legs, arms, head, torso, tail, phase: Math.random() * 6, blend: 0, height: (LEG + 0.95) * s };
}
function shade(hex) { const c = new THREE.Color(hex); c.multiplyScalar(0.72); return "#" + c.getHexString(); }

export function animateAnimal(p, speed, dt, t) {
  const moving = speed > 0.05;
  p.blend += ((moving ? 1 : 0) - p.blend) * Math.min(1, dt * 8);
  p.phase += dt * (3 + speed * 3.5);
  const k = p.blend;
  for (let i = 0; i < 2; i++) {
    const L = p.legs[i], ph = p.phase + i * Math.PI, a = Math.sin(ph);
    L.hip.rotation.x = a * 0.7 * k;
    L.knee.rotation.x = Math.max(0, -Math.cos(ph)) * 0.8 * k;
    const A = p.arms[i];
    A.sh.rotation.x = -a * 0.7 * k + Math.sin(t * 1.6 + i) * 0.05 * (1 - k);
    A.el.rotation.x = -0.2 - 0.3 * k;
  }
  p.body.position.y = Math.abs(Math.sin(p.phase)) * 0.06 * k + Math.sin(t * 2.2) * 0.006 * (1 - k);
  p.head.rotation.z = Math.sin(p.phase) * 0.06 * k + Math.sin(t * 1.3) * 0.03 * (1 - k);
  if (p.tail) p.tail.rotation.y = p.tail.userData.ry0 + Math.sin(t * 4) * 0.25;
}
