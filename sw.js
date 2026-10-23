/* sw.js — Service Worker
   Chiến lược: MẠNG TRƯỚC, cache chỉ để dự phòng khi mất mạng.
   Cố ý chọn kiểu này để bạn sửa code xong, F5 là thấy ngay bản mới
   (nếu cache-first thì rất hay bị "sửa mãi mà không thấy đổi"). */
var CACHE = "tjwl-v2";
var ASSETS = [
  "./", "./index.html", "./css/app.css",
  "./js/config.js", "./js/util.js", "./js/srs.js", "./js/context.js",
  "./js/speech.js", "./js/db.js", "./js/auth.js", "./js/i18n.js",
  "./js/reader.js", "./js/detail.js", "./js/export.js",
  "./js/journey.js", "./js/home.js", "./js/wordset.js", "./js/app.js",
  "./js/gamelayer.js", "./js/hubpage.js",
  "./game.html", "./css/game.css",
  "./js/toeic_tips.js", "./js/board.js", "./js/turn.js",
  "./js/readalong.js", "./js/shadow.js", "./js/cc.js",
  "./js/voice.js", "./js/chat.js", "./js/swclass.js",
  "./js/game.js", "./js/learn.js",
  "./icon.svg", "./manifest.webmanifest"
];

self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS).catch(function () {}); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
                             .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  if (req.url.indexOf("supabase") >= 0) return;   // dữ liệu luôn lấy trực tiếp

  e.respondWith(
    fetch(req).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copy).catch(function () {}); });
      return res;
    }).catch(function () { return caches.match(req, { ignoreSearch: true }); })
  );
});
