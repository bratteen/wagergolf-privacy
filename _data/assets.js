const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Innehållshash per statisk stilmall, används för cache-busting i base.njk.
//
// Varför: Cloudflare servar /assets/css/* med max-age=14400 (4 h) och
// /assets/fonts/* som immutable i ett år. Länkas filerna utan version får
// återvändande besökare gammal CSS ihop med ny HTML, vilket ger trasig
// layout tills cachen löper ut. Hashen byter URL när innehållet ändras,
// så en deploy slår igenom direkt utan att vi tappar cache-nyttan.
function hash(relPath) {
  try {
    const buf = fs.readFileSync(path.join(__dirname, "..", relPath));
    return crypto.createHash("md5").update(buf).digest("hex").slice(0, 8);
  } catch {
    // Saknad fil ska inte fälla bygget, då länkar vi utan version.
    return "";
  }
}

module.exports = {
  css: hash("assets/css/site.css"),
  fonts: hash("assets/fonts/fonts.css"),
  replay: hash("assets/js/replay-sample.js"),
  releaseStatus: hash("assets/js/release-status.js"),
  mobileMenu: hash("assets/js/mobile-menu.js"),
  download: hash("assets/js/download-link.js"),
  langBanner: hash("assets/js/lang-banner.js"),
  invite: hash("assets/js/invite.js"),
};
