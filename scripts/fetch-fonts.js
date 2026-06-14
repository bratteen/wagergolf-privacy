// Hämtar woff2-filer från Google Fonts och genererar assets/fonts/fonts.css
// med lokala @font-face (latin-subset, täcker svenska å ä ö). Kör om vid
// font-byte: `node scripts/fetch-fonts.js`.
const fs = require("fs");
const path = require("path");
const https = require("https");

const CSS_URL =
  "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;0,800;1,500&family=IBM+Plex+Mono:wght@400;500;600&display=swap";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const OUT_DIR = path.join(__dirname, "..", "assets", "fonts");

function get(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return resolve(get(res.headers.location, headers));
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", reject);
  });
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const css = (await get(CSS_URL, { "User-Agent": UA })).toString("utf8");
  const blocks = css.split("@font-face").slice(1);
  let out = "/* Self-hosted fonts, genererad av scripts/fetch-fonts.js */\n";
  let n = 0;
  for (const b of blocks) {
    if (!/unicode-range:[^;]*U\+0000-00FF/.test(b)) continue; // bara latin
    const fam = (b.match(/font-family:\s*'([^']+)'/) || [])[1];
    const weight = (b.match(/font-weight:\s*(\d+)/) || [])[1];
    const style = (b.match(/font-style:\s*(\w+)/) || [])[1] || "normal";
    const urlm = b.match(/url\((https:[^)]+\.woff2)\)/);
    if (!fam || !weight || !urlm) continue;
    const slug =
      fam.toLowerCase().replace(/\s+/g, "-") + "-" + weight + (style === "italic" ? "-italic" : "");
    const fname = slug + ".woff2";
    fs.writeFileSync(path.join(OUT_DIR, fname), await get(urlm[1]));
    out += `@font-face{font-family:'${fam}';font-style:${style};font-weight:${weight};font-display:swap;src:url('/assets/fonts/${fname}') format('woff2');}\n`;
    n++;
  }
  fs.writeFileSync(path.join(OUT_DIR, "fonts.css"), out);
  console.log("wrote", n, "font files +", "fonts.css");
})();
