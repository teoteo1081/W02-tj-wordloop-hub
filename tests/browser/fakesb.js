/* fakesb.js — thay `window.supabase` (supabase-js@2.45.4 không có sẵn cục bộ; PLAN cấm tải gói mới).
 * Shim mỏng: dựng MÔ TẢ truy vấn rồi gửi về engine Python (fakebackend.py) qua hàm đã expose; Realtime đi qua broker Python.
 * KHÔNG chứa dữ liệu hay logic nghiệp vụ. Xem phạm vi trung thực ở docstring của fakebackend.py.
 */
(function () {
  "use strict";
  var Q = function (d) { return window.__a0_q(d); };
  var ST = function (d) { return window.__a0_st(d); };
  var RT = function (d) { return window.__a0_rt(d); };
  var registry = {};

  function QB(table) { this.d = { table: table, op: "select", cols: "*", filters: [], order: [], opts: {} }; }
  var P = QB.prototype;
  P.select = function (cols, opts) {
    if (this.d.op === "select") { this.d.cols = cols == null ? "*" : cols; }
    else { this.d.returning = cols == null ? "*" : cols; }
    if (opts) this.d.opts = Object.assign({}, this.d.opts, opts);
    return this;
  };
  P.insert = function (rows, opts) { this.d.op = "insert"; this.d.payload = rows; if (opts) this.d.opts = Object.assign({}, this.d.opts, opts); return this; };
  P.upsert = function (rows, opts) { this.d.op = "upsert"; this.d.payload = rows; if (opts) this.d.opts = Object.assign({}, this.d.opts, opts); return this; };
  P.update = function (obj) { this.d.op = "update"; this.d.payload = obj; return this; };
  P.delete = function () { this.d.op = "delete"; return this; };
  ["eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike", "is", "in", "contains"].forEach(function (op) {
    P[op] = function (c, v) { this.d.filters.push([op, c, v]); return this; };
  });
  P.match = function (o) { var self = this; Object.keys(o).forEach(function (k) { self.d.filters.push(["eq", k, o[k]]); }); return this; };
  P.not = function (c, op, v) { this.d.filters.push(["not", c, [op, v]]); return this; };
  P.or = function (s) { this.d.filters.push(["or", s]); return this; };
  P.filter = function (c, op, v) { this.d.filters.push([op, c, v]); return this; };
  P.order = function (c, o) { this.d.order.push([c, !(o && o.ascending === false), (o && (o.foreignTable || o.referencedTable)) || null]); return this; };
  P.limit = function (n) { this.d.limit = n; return this; };
  P.range = function (a, b) { this.d.range = [a, b]; return this; };
  P.single = function () { this.d.single = "one"; return this; };
  P.maybeSingle = function () { this.d.single = "maybe"; return this; };
  P.then = function (res, rej) {
    var d = JSON.parse(JSON.stringify(this.d));
    return Q(d).then(function (r) { r = r || {}; return { data: r.data === undefined ? null : r.data, error: r.error || null, count: r.count == null ? null : r.count, status: r.status || 200, statusText: "" }; }).then(res, rej);
  };

  function Channel(topic, opts) { this.topic = topic; this.opts = opts || {}; this.handlers = []; this.member = null; this.pstate = {}; this.cb = null; this.closed = false; }
  var C = Channel.prototype;
  C.on = function (type, filter, cb) { this.handlers.push({ type: type, event: filter && filter.event, cb: cb }); return this; };
  C.subscribe = function (cb) {
    var self = this; this.cb = cb || null;
    var cfg = this.opts.config || {};
    RT({ op: "join", topic: this.topic, key: cfg.presence && cfg.presence.key, self: !!(cfg.broadcast && cfg.broadcast.self) }).then(function (r) {
      if (self.closed) return;
      self.member = r.member; registry[r.member] = self;
      if (self.cb) self.cb("SUBSCRIBED");
    });
    return this;
  };
  C.send = function (m) {
    if (this.member == null) return Promise.resolve("error");
    return RT({ op: "send", member: this.member, type: m.type, event: m.event, payload: m.payload }).then(function () { return "ok"; });
  };
  C.track = function (payload) { return RT({ op: "track", member: this.member, payload: payload }).then(function () { return "ok"; }); };
  C.untrack = function () { return RT({ op: "untrack", member: this.member }).then(function () { return "ok"; }); };
  C.presenceState = function () { return this.pstate; };

  window.__a0_deliver = function (batch) {
    batch.forEach(function (m) {
      var ch = registry[m.member]; if (!ch || ch.closed) return;
      if (m.kind === "broadcast") {
        ch.handlers.forEach(function (h) { if (h.type === "broadcast" && h.event === m.event) { try { h.cb({ type: "broadcast", event: m.event, payload: m.payload }); } catch (e) { console.error("[a0 shim] handler", e); } } });
      } else if (m.kind === "presence") {
        ch.pstate = m.state;
        ch.handlers.forEach(function (h) { if (h.type === "presence" && h.event === "sync") { try { h.cb(); } catch (e) { console.error("[a0 shim] presence", e); } } });
      } else if (m.kind === "status") {
        if (ch.cb) ch.cb(m.status);
      }
    });
  };

  function bucket(name) {
    var st = function (op, path, extra) { return ST(Object.assign({ bucket: name, op: op, path: path }, extra || {})); };
    return {
      upload: function (path, file, opts) { return st("upload", path, { opts: opts, size: file && file.size, type: file && file.type }); },
      remove: function (paths) { return st("remove", null, { paths: paths }); },
      list: function (path, opts) { return st("list", path, { opts: opts }); },
      move: function (a, b) { return st("move", a, { to: b }); },
      getPublicUrl: function (path) { return { data: { publicUrl: "https://a0.invalid/storage/v1/object/public/" + name + "/" + path } }; }
    };
  }

  function createClient(url, key) {
    return {
      from: function (t) { return new QB(t); },
      channel: function (t, o) { return new Channel(t, o); },
      removeChannel: function (ch) { ch.closed = true; if (ch.member != null) { delete registry[ch.member]; return RT({ op: "leave", member: ch.member }).then(function () { return "ok"; }); } return Promise.resolve("ok"); },
      storage: { from: bucket },
      auth: {
        getSession: function () { return Promise.resolve({ data: { session: null }, error: null }); },
        onAuthStateChange: function () { return { data: { subscription: { unsubscribe: function () {} } } }; },
        signInWithOtp: function () { return Promise.resolve({ data: null, error: { message: "A0 fake: đăng nhập email không hỗ trợ" } }); },
        signOut: function () { return Promise.resolve({ error: null }); }
      }
    };
  }
  window.supabase = { createClient: createClient };
})();
