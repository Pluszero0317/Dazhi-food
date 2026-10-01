/* 依 index.html 內容產生版本碼，寫進 index.html 的 APP_VERSION 與 version.json。
   網站靠 version.json 判斷有沒有新版本（commit 時由 .git/hooks/pre-commit 自動執行；沒有 hook 時手動跑 `node stamp.js`）。 */
const fs = require("fs");
const crypto = require("crypto");
const s = fs.readFileSync("index.html", "utf8");
const re = /const APP_VERSION="[^"]*";/;
if (!re.test(s)) { console.error("找不到 APP_VERSION"); process.exit(1); }
const v = crypto.createHash("sha1").update(s.replace(re, 'const APP_VERSION="";').replace(/\r\n/g, "\n")).digest("hex").slice(0, 10);
const out = s.replace(re, `const APP_VERSION="${v}";`);
if (out !== s) fs.writeFileSync("index.html", out);
fs.writeFileSync("version.json", JSON.stringify({ v }) + "\n");
console.log("version", v);
