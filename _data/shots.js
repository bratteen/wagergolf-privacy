// Vilka lokaliserade appskärmbilder som faktiskt finns på disk.
//
// Rotbilderna innehåller det svenska appgränssnittet. Publicerade norska,
// danska och engelska varianter ligger i egna språkkataloger med rätt valuta
// och betalningsflöde för respektive exempelmarknad.
//
// Mallen gör valet additivt: finns ingen bild i sidans språk används engelska
// före den svenska roten. Släpps en bild in i assets/shots/<lang>/ plockas
// den upp automatiskt överallt där shot-shortcoden används.
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "assets", "shots");

/** Set med "<lang>/<namn>" för varje lokaliserad bild som finns. */
function available() {
  const found = new Set();
  let entries;
  try {
    entries = fs.readdirSync(DIR, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    for (const f of fs.readdirSync(path.join(DIR, e.name))) {
      if (f.endsWith(".webp")) found.add(`${e.name}/${f.slice(0, -5)}`);
    }
  }
  return found;
}

module.exports = { available: [...available()] };
