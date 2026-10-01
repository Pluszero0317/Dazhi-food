/* 依 index.html 內容產生版本碼，寫進 index.html 的 APP_VERSION 與 version.json，並同步「最後更新」時間（台北時間）。
   網站靠 version.json 判斷有沒有新版本（commit 時由 .git/hooks/pre-commit 自動執行；沒有 hook 時手動跑 `node stamp.js`）。
   內容沒有變動時不會改版本碼與時間。 */
const fs = require("fs");
const crypto = require("crypto");
let s = fs.readFileSync("index.html", "utf8");
const reV = /const APP_VERSION="[^"]*";/, reT = /const LAST_UPDATED="[^"]*";/;
if (!reV.test(s) || !reT.test(s)) { console.error("找不到 APP_VERSION 或 LAST_UPDATED"); process.exit(1); }
const norm = s.replace(reV, 'const APP_VERSION="";').replace(reT, 'const LAST_UPDATED="";').replace(/\r\n/g, "\n");
const v = crypto.createHash("sha1").update(norm).digest("hex").slice(0, 10);
let prev = "";
try { prev = JSON.parse(fs.readFileSync("version.json", "utf8")).v; } catch (e) {}
if (v !== prev || !s.includes(`const APP_VERSION="${v}";`)) {
  const d = new Date(Date.now() + 8 * 3600 * 1000), p = n => String(n).padStart(2, "0");
  const t = `${d.getUTCFullYear()}/${p(d.getUTCMonth() + 1)}/${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
  s = s.replace(reV, `const APP_VERSION="${v}";`).replace(reT, `const LAST_UPDATED="${t}";`);
  fs.writeFileSync("index.html", s);
  fs.writeFileSync("version.json", JSON.stringify({ v }) + "\n");
  console.log("version", v, "updated", t);
} else console.log("unchanged", v);
