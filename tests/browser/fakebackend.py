"""Backend giả cho Cloud mode — nằm trong TIẾN TRÌNH TEST (Python), dùng chung cho mọi client (BrowserContext).

Phạm vi trung thực (ghi rõ trong tests/browser/README.md):
  * Đây KHÔNG phải supabase-js thật và KHÔNG phải PostgREST thật. supabase-js không có sẵn trên máy và PLAN cấm tải gói
    mới, nên trang nạp một shim (fakesb.js) thay `window.supabase`; shim gửi MÔ TẢ truy vấn tới engine này.
    Nhật ký ghi lại đúng điều app YÊU CẦU backend (bảng, thao tác, bộ lọc, khoá payload) — đủ cho I2 ở ranh giới
    thư viện — nhưng không chứng minh URL/header/mã hoá của supabase-js hay hành vi mạng thật.
  * Engine hỗ trợ tập con PostgREST mà app dùng (eq/neq/gt/gte/lt/lte/like/ilike/is/in/contains/not/or/match,
    order/limit/range/single/maybeSingle, count+head, insert/upsert/update/delete). Tính năng chưa hỗ trợ (embed
    quan hệ, toán tử lạ...) trả lỗi RÕ RÀNG và được ghi vào `unsupported` — runner coi là lỗi, không im lặng.
  * Không mô phỏng RLS, kiểu cột, khóa ngoại, độ trễ. Schema thật là mọi cột đã migrate (bản live hiện tại).
"""
import copy, datetime, json, re

NOW_MS = 1792700000000

TABLE_IDS = {   # bảng có cột id sinh sẵn (uuid) khi chèn mà không có id
    "game_rooms", "game_players", "game_matches", "game_answers", "game_results", "game_gap_sentences",
    "vocab_saves", "daily_log", "profiles", "hubs", "notebooks", "sections", "pages", "batches", "blocks", "words",
}
UNIQUE = {   # ràng buộc duy nhất ngoài khóa chính id (dùng cho insert; upsert dùng onConflict do app truyền)
    "game_rooms": [["code"]],
    "word_progress": [["user_id", "word_id"]],
    "block_progress": [["user_id", "block_id"]],
    "site_visits": [["user_id", "date_key"]],
    "notebook_access": [["notebook_id", "user_id"]],
    "game_results": [["match_id", "player_id"]],
    "vocab_saves": [["player_id", "word_id"]],
    "daily_log": [["user_id", "date"]],
    "game_gap_sentences": [["word_id"]],
}
# onConflict hợp lệ cho upsert (lấy từ mã app 2026-10-22: quét `.from(T).upsert(..., {onConflict})`); bảng khác: khóa chính `id`.
# Cột ngoài ràng buộc duy nhất thật → PostgREST trả 42P10; fake trước đây chấp nhận mọi giá trị (QA độc lập).
UPSERT_CONFLICT = {t: ",".join(u[0]) for t, u in UNIQUE.items() if t != "game_rooms"}
REAL_ROOM_CODES = {"TJ"}     # MP-15: không bao giờ được chạm phòng thật
# Quan hệ cho embed kiểu PostgREST (select("*, pages(*, ...)")): (bảng cha, tên quan hệ) -> (hướng, cột khóa ngoại)
ONE_TO_MANY = {("hubs", "notebooks"): "hub_id", ("notebooks", "sections"): "notebook_id", ("sections", "pages"): "section_id",
               ("pages", "batches"): "page_id", ("batches", "blocks"): "batch_id", ("blocks", "words"): "block_id"}
MANY_TO_ONE = {("words", "blocks"): "block_id", ("blocks", "batches"): "batch_id", ("batches", "pages"): "page_id",
               ("pages", "sections"): "section_id", ("sections", "notebooks"): "notebook_id", ("notebooks", "hubs"): "hub_id",
               ("game_results", "game_players"): "player_id", ("game_results", "game_matches"): "match_id",
               ("game_matches", "game_rooms"): "room_id", ("game_answers", "game_players"): "player_id"}


def parse_cols(s):
    """'*, pages(*, batches(id))' -> [('*',), ('pages', [('*',), ('batches', [('id',)])])]  (tên cột = ('col',), quan hệ = (name, sub))"""
    items = []
    for part in _split_top(s):
        part = part.strip()
        if not part:
            continue
        m = re.match(r"^([A-Za-z_][A-Za-z0-9_]*)\((.*)\)$", part, re.S)
        items.append((m.group(1), parse_cols(m.group(2))) if m else (part,))
    return items


class Unsupported(Exception):
    pass


class RealRoomTouched(Exception):
    pass


def iso(ms):
    return datetime.datetime.fromtimestamp(ms / 1000.0, datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.") + \
        "%03dZ" % (int(ms) % 1000)


def _split_top(s):
    out, depth, cur = [], 0, ""
    for ch in s:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        if ch == "," and depth == 0:
            out.append(cur); cur = ""
        else:
            cur += ch
    if cur:
        out.append(cur)
    return out


def _cmp_key(v):
    return (v is None, v if not isinstance(v, (dict, list)) else json.dumps(v, sort_keys=True))


class Backend:
    def __init__(self, tables, label="backend"):
        self.label = label
        self.tables = {k: copy.deepcopy(v) for k, v in tables.items()}
        self.storage = {}          # (bucket, path) -> {size, type}
        self.clock = NOW_MS        # đồng hồ máy chủ giả: tăng 1 ms mỗi lần ghi
        self.seq = 0
        self.uuid_n = 0
        self.log = []              # nhật ký lời gọi chuẩn (mọi client)
        self.unsupported = []
        self.violations = []       # MP-15 và các vi phạm an toàn
        self.fail_next = {}        # (table, op) -> số lần còn phải trả lỗi mạng (điều khiển lỗi)
        self._ids = {}             # chuẩn hóa chỗ giữ chỗ trong nhật ký, theo kịch bản

    # ───────────────────── tiện ích ─────────────────────
    def now(self):
        self.clock += 1
        return self.clock

    def new_uuid(self):
        self.uuid_n += 1
        return "00000000-0000-4000-9000-%012d" % self.uuid_n

    def reset_trace(self):
        self.log = []
        self._ids = {}

    def _norm_value(self, v):
        if isinstance(v, bool) or v is None:
            return v
        if isinstance(v, (int, float)):
            return "<now>" if abs(v) > 1e11 else v
        if isinstance(v, str):
            if re.match(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}", v):
                return "<ts>"
            if re.match(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", v) and v.startswith("00000000-0000-4000-9"):
                return self._ph("uuid", v)
            if re.match(r"^(us|bt|bl|w|nb|sec|pg|hub|gp|gr|gm|cand)_[0-9a-z]{5,}$", v) and "_syn_" not in v and not v.startswith("bl_onr") \
                    and not v.startswith("nb_onr") and not v.startswith("hub_onr") and not v.startswith("sec_onr") \
                    and not v.startswith("pg_onr") and not v.startswith("bt_onr"):
                return self._ph("id", v)
            return v
        if isinstance(v, list):
            return [self._norm_value(x) for x in v]
        if isinstance(v, dict):
            return {k: self._norm_value(x) for k, x in sorted(v.items())}
        return v

    def _ph(self, kind, v):
        k = (kind, v)
        if k not in self._ids:
            self._ids[k] = "<%s#%d>" % (kind, 1 + sum(1 for kk in self._ids if kk[0] == kind))
        return self._ids[k]

    def record(self, client, entry):
        self.seq += 1
        e = {"n": self.seq, "client": client}
        e.update(entry)
        self.log.append(e)
        return e

    # ───────────────────── REST ─────────────────────
    def query(self, client, d):
        t = d["table"]
        op = d.get("op", "select")
        for f in d.get("filters", []):
            if t == "game_rooms" and f[1] == "code" and str(f[2]).upper() in REAL_ROOM_CODES:
                self.violations.append({"rule": "MP-15", "client": client, "detail": "truy vấn game_rooms.code=%s" % f[2]})
        pl = d.get("payload")
        rows_in = pl if isinstance(pl, list) else ([pl] if isinstance(pl, dict) else [])
        for r in rows_in:
            if t == "game_rooms" and str(r.get("code", "")).upper() in REAL_ROOM_CODES:
                self.violations.append({"rule": "MP-15", "client": client, "detail": "ghi game_rooms.code=%s" % r.get("code")})
        entry = {"ch": "rest", "obj": t, "op": op,
                 "cols": d.get("cols") if op == "select" else None,
                 "filters": [[f[0], f[1], self._norm_value(f[2])] if len(f) > 2 else list(f) for f in d.get("filters", [])],
                 "order": d.get("order") or None, "limit": d.get("limit"), "range": d.get("range"),
                 "single": d.get("single"), "head": bool((d.get("opts") or {}).get("head")),
                 "count": (d.get("opts") or {}).get("count")}
        if op in ("insert", "upsert", "update"):
            keys = sorted({k for r in rows_in for k in r})
            entry["payloadKeys"] = keys
            entry["payloadRows"] = len(rows_in)
            entry["payloadShape"] = {k: self._shape(rows_in[0].get(k)) for k in keys} if rows_in else {}
            if op == "upsert":
                entry["onConflict"] = (d.get("opts") or {}).get("onConflict")
                entry["ignoreDuplicates"] = bool((d.get("opts") or {}).get("ignoreDuplicates"))
        if op in ("insert", "upsert", "update", "delete"):
            entry["returning"] = d.get("returning")
        entry = {k: v for k, v in entry.items() if v not in (None, [], False) or k in ("filters",)}
        rec = self.record(client, entry)
        # lỗi điều khiển (mất mạng giả)
        fk = (t, op)
        if self.fail_next.get(fk):
            self.fail_next[fk] -= 1
            rec["result"] = "error:network"
            return {"data": None, "error": {"message": "TypeError: Failed to fetch (A0 injected)", "code": ""}, "status": 0}
        try:
            res = self._run(t, op, d)
        except Unsupported as e:
            self.unsupported.append({"client": client, "table": t, "op": op, "why": str(e)})
            rec["result"] = "error:unsupported"
            return {"data": None, "error": {"message": "A0 fake: " + str(e), "code": "A0UNSUP"}, "status": 400}
        rec["result"] = "error:%s" % res["error"]["code"] if res.get("error") else "ok"
        rec["nrows"] = len(res["data"]) if isinstance(res.get("data"), list) else (0 if res.get("data") is None else 1)
        return res

    @staticmethod
    def _shape(v):
        if v is None:
            return "null"
        if isinstance(v, bool):
            return "boolean"
        if isinstance(v, (int, float)):
            return "number"
        if isinstance(v, str):
            return "string"
        if isinstance(v, list):
            return "array"
        return "object"

    def _match(self, row, f):
        op, col = f[0], f[1]
        val = f[2] if len(f) > 2 else None
        cur = row.get(col)
        if op == "eq":
            return cur == val
        if op == "neq":
            return cur != val
        if op in ("gt", "gte", "lt", "lte"):
            if cur is None or val is None:
                return False
            return {"gt": cur > val, "gte": cur >= val, "lt": cur < val, "lte": cur <= val}[op]
        if op in ("like", "ilike"):
            rx = "^" + re.escape(str(val)).replace("%", ".*").replace("_", ".") + "$"
            return cur is not None and re.match(rx, str(cur), re.I if op == "ilike" else 0) is not None
        if op == "is":
            return (cur is None) if val is None else (cur is bool(val) if isinstance(val, bool) else cur == val)
        if op == "in":
            return cur in (val or [])
        if op == "contains":
            if isinstance(cur, list) and isinstance(val, list):
                return all(x in cur for x in val)
            if isinstance(cur, dict) and isinstance(val, dict):
                return all(cur.get(k) == v for k, v in val.items())
            return False
        if op == "not":
            return not self._match(row, [val[0], col, val[1]])
        if op == "or":
            ors = []
            for part in _split_top(f[1]):
                m = re.match(r"^([a-z_]+)\.([a-z]+)\.(.*)$", part)
                if not m:
                    raise Unsupported("or(...) không hiểu: " + part)
                c, o, v = m.groups()
                if o == "in":
                    v = [x for x in v.strip("()").split(",")]
                elif o == "is":
                    v = None if v == "null" else v == "true"
                ors.append([o, c, v])
            return any(self._match(row, x) for x in ors)
        raise Unsupported("toán tử lọc chưa hỗ trợ: " + op)

    def _project(self, row, cols, table=None, path="", orders=None):
        if cols in (None, "", "*"):
            return copy.deepcopy(row)
        items = parse_cols(cols) if isinstance(cols, str) else cols
        out = {}
        for it in items:
            if len(it) == 1:
                if it[0] == "*":
                    out.update(copy.deepcopy(row))
                else:
                    out[it[0]] = copy.deepcopy(row.get(it[0]))
                continue
            rel, sub = it
            sub_path = (path + "." if path else "") + rel
            if (table, rel) in ONE_TO_MANY:
                fk = ONE_TO_MANY[(table, rel)]
                kids = [r for r in self.tables.get(rel, []) if r.get(fk) == row.get("id")]
                for col, asc, foreign in reversed([o for o in (orders or []) if len(o) > 2 and o[2] == sub_path]):
                    kids.sort(key=lambda r: _cmp_key(r.get(col)), reverse=not asc)
                out[rel] = [self._project(k, sub, rel, sub_path, orders) for k in kids]
            elif (table, rel) in MANY_TO_ONE:
                fk = MANY_TO_ONE[(table, rel)]
                par = next((r for r in self.tables.get(rel, []) if r.get("id") == row.get(fk)), None)
                out[rel] = self._project(par, sub, rel, sub_path, orders) if par is not None else None
            else:
                raise Unsupported("quan hệ embed chưa khai báo: %s -> %s" % (table, rel))
        return out

    def _err(self, code, msg, status=400):
        return {"data": None, "error": {"message": msg, "code": code}, "status": status}

    def _run(self, t, op, d):
        tab = self.tables.setdefault(t, [])
        filters = d.get("filters", [])
        opts = d.get("opts") or {}
        returning = d.get("returning")
        if op == "select":
            rows = [r for r in tab if all(self._match(r, f) for f in filters)]
            for o in reversed([o for o in (d.get("order") or []) if len(o) < 3 or not o[2]]):
                rows.sort(key=lambda r: _cmp_key(r.get(o[0])), reverse=not o[1])
            total = len(rows)
            if d.get("range"):
                a, b = d["range"]; rows = rows[a:b + 1]
            if d.get("limit") is not None:
                rows = rows[: d["limit"]]
            if opts.get("head"):
                return {"data": None, "error": None, "count": total if opts.get("count") else None, "status": 200}
            data = [self._project(r, d.get("cols"), t, "", d.get("order")) for r in rows]
            return self._single(d, data, total if opts.get("count") else None)
        if op in ("insert", "upsert"):
            pl = d.get("payload")
            rows_in = pl if isinstance(pl, list) else [pl]
            keysets = {tuple(sorted(r)) for r in rows_in}
            if len(keysets) > 1:   # CLAUDE.md "Lỗi đã sửa": PGRST102 khi bộ khóa các object khác nhau
                return self._err("PGRST102", "All object keys must match")
            conflict = [c for c in (opts.get("onConflict") or "").split(",") if c] if op == "upsert" else []
            if op == "upsert" and conflict and ",".join(conflict) != UPSERT_CONFLICT.get(t, "id"):
                return self._err("42P10", "there is no unique or exclusion constraint matching the ON CONFLICT specification (A0: %s onConflict=%s)" % (t, ",".join(conflict)), 400)
            out = []
            for r in rows_in:
                r = copy.deepcopy(r)
                if t in TABLE_IDS and "id" not in r:
                    r["id"] = self.new_uuid()
                if t in ("game_rooms", "game_players", "game_matches", "vocab_saves", "game_answers", "daily_log") and "created_at" not in r:
                    r["created_at"] = iso(self.now())
                hit = None
                if op == "upsert":
                    ckeys = conflict or (["id"] if "id" in r else [])
                    if ckeys:
                        hit = next((x for x in tab if all(x.get(c) == r.get(c) for c in ckeys)), None)
                else:
                    if "id" in r and any(x.get("id") == r["id"] for x in tab):
                        return self._err("23505", 'duplicate key value violates unique constraint "%s_pkey"' % t, 409)
                    for u in UNIQUE.get(t, []):
                        if any(all(x.get(c) == r.get(c) for c in u) for x in tab):
                            return self._err("23505", 'duplicate key value violates unique constraint "%s_%s_key"' % (t, "_".join(u)), 409)
                if hit is not None:
                    if not opts.get("ignoreDuplicates"):
                        hit.update(r); out.append(hit)
                else:
                    tab.append(r); out.append(r)
            data = [self._project(r, returning if returning not in (None, True) else "*") for r in out] if returning else None
            return self._single(d, data, None, status=201) if returning else {"data": None, "error": None, "status": 201}
        if op == "update":
            rows = [r for r in tab if all(self._match(r, f) for f in filters)]
            for r in rows:
                r.update(copy.deepcopy(d.get("payload") or {}))
            data = [self._project(r, returning if returning not in (None, True) else "*") for r in rows] if returning else None
            return self._single(d, data, None) if returning else {"data": None, "error": None, "status": 204}
        if op == "delete":
            keep, gone = [], []
            for r in tab:
                (gone if all(self._match(r, f) for f in filters) else keep).append(r)
            self.tables[t] = keep
            data = [self._project(r, returning if returning not in (None, True) else "*") for r in gone] if returning else None
            return self._single(d, data, None) if returning else {"data": None, "error": None, "status": 204}
        raise Unsupported("op " + op)

    def _single(self, d, data, count, status=200):
        s = d.get("single")
        if s and data is not None:
            if len(data) == 1:
                return {"data": data[0], "error": None, "count": count, "status": status}
            if s == "maybe" and len(data) == 0:
                return {"data": None, "error": None, "count": count, "status": status}
            return self._err("PGRST116", "JSON object requested, multiple (or no) rows returned", 406)
        return {"data": data, "error": None, "count": count, "status": status}

    # ───────────────────── Storage ─────────────────────
    def storage_op(self, client, d):
        bucket, op, path = d["bucket"], d["op"], d.get("path")
        entry = {"ch": "storage", "obj": bucket, "op": op}
        if op in ("upload",):
            entry.update({"path": self._norm_path(path), "upsert": bool((d.get("opts") or {}).get("upsert")),
                          "contentType": (d.get("opts") or {}).get("contentType"), "sizeBucket": self._size_bucket(d.get("size"))})
            self._room_path_check(client, path)
            self.storage[(bucket, path)] = {"size": d.get("size") or 0, "type": d.get("type")}
            res = {"data": {"path": path}, "error": None}
        elif op == "remove":
            paths = d.get("paths") or []
            entry["paths"] = [self._norm_path(p) for p in paths]
            for p in paths:
                self._room_path_check(client, p)
            gone = [{"name": p} for p in paths if self.storage.pop((bucket, p), None) is not None]
            res = {"data": gone, "error": None}
        elif op == "list":
            entry.update({"path": self._norm_path(path), "opts": d.get("opts")})
            prefix = (path or "").rstrip("/") + "/"
            names = sorted({p[len(prefix):].split("/")[0] for (b, p) in self.storage if b == bucket and p.startswith(prefix)})
            res = {"data": [{"name": n} for n in names], "error": None}
        elif op == "move":
            entry["path"] = self._norm_path(path); entry["to"] = self._norm_path(d.get("to"))
            v = self.storage.pop((bucket, path), None)
            if v is not None:
                self.storage[(bucket, d["to"])] = v
            res = {"data": {"message": "Successfully moved"}, "error": None}
        else:
            raise Unsupported("storage op " + op)
        self.record(client, entry)
        return res

    def _room_path_check(self, client, path):
        m = re.match(r"^lib/_tmp/([^/]+)/", path or "")
        if m and m.group(1).upper() in REAL_ROOM_CODES:
            self.violations.append({"rule": "MP-15", "client": client, "detail": "storage " + path})

    @staticmethod
    def _size_bucket(n):
        n = n or 0
        return "0" if n == 0 else ("<1KB" if n < 1024 else ("<1MB" if n < 1 << 20 else ">=1MB"))

    def _norm_path(self, p):
        if p is None:
            return None
        return re.sub(r"/(\d{4,}|[0-9a-z]{7,}_)", lambda m: "/<ts>" + ("_" if m.group(1).endswith("_") else ""), p)
