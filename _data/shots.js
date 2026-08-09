// Vilka lokaliserade appskärmbilder som faktiskt finns på disk.
//
// Bilderna innehåller appens eget gränssnitt, och det är på svenska. En
// engelsk besökare som ser "Hål 3" och "spelhcp" mitt i det som ska övertyga
// hen att ladda ner får svaret gratis: appen är inte på mitt språk.
//
// Att skjuta nya skärmbilder för varje språk är dyrt och blir dyrare för varje
// marknad. Därför gör mallen valet additivt i stället för blockerande: finns
// ingen lokaliserad bild används den delade, och sajten fungerar. Släpps en
// bild in i assets/shots/<lang>/ plockas den upp automatiskt överallt där
// shot-shortcoden används, utan att en enda sida behöver ändras.
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
