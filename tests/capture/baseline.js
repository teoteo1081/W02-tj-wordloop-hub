"use strict";
/* Khoá baseline: mọi công cụ thu/kiểm trong tests/capture chỉ được đọc nguồn từ ĐÚNG commit e324beb, sạch, không sửa cục bộ.
   Chỉ các self-test mới được dùng chế độ `unsafe` (thư mục giả đã bị làm hỏng có chủ đích) — và kết quả đó không bao giờ được ghi thành fixture. */
const cp = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const PIN = Object.freeze({
  short: "e324beb",
  commit: "e324beb54b29ddfa055956c756a4ceba2676dfa1",
  tree: "9de0480570b1c95c85912d685626891ba142b825"
});

function git(root, args) {
  return cp.execFileSync("git", ["-C", root].concat(args), { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

/* Trả về { commit, tree, clean, pinned } hoặc ném lỗi nếu không phải đúng baseline sạch. */
function assertPinned(root) {
  let commit, tree, dirty;
  try {
    commit = git(root, ["rev-parse", "HEAD"]);
    tree = git(root, ["rev-parse", "HEAD^{tree}"]);
    dirty = git(root, ["status", "--porcelain"]);
  } catch (e) {
    throw new Error("Không đọc được git của " + root + " (cần là worktree của baseline " + PIN.short + "): " + String(e.message || e).split("\n")[0]);
  }
  if (commit !== PIN.commit) throw new Error("Nguồn không phải baseline " + PIN.short + ": HEAD = " + commit);
  if (tree !== PIN.tree) throw new Error("Cây tệp không khớp baseline " + PIN.short + ": " + tree);
  if (dirty) throw new Error("Baseline có thay đổi cục bộ (git status không sạch):\n" + dirty);
  return { commit: commit, tree: tree, clean: true, pinned: true };
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function defaultRoot() {
  return path.resolve(__dirname, "..", "..", "..", "wt-baseline-e324beb");
}

module.exports = { PIN, assertPinned, sha256File, defaultRoot };
