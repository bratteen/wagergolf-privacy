// Vilka lokaliserade appskärmbilder som faktiskt finns på disk.
//
// Rotbilderna innehåller det svenska appgränssnittet. Alla tio andra språk
// ligger i egna språkkataloger med rätt valuta och betalningsflöde för sin
// exempelmarknad.
//
// Mallen behåller en defensiv engelsk fallback om en enskild bild skulle
// saknas, men manifesttestet kräver tre riktiga bilder för varje publicerat
// språk.
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
