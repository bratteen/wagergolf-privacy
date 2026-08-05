// Strängar för ett språk.
//
// Ligger i lib/ och inte bara i _data/eleventyComputed.js därför att
// guidernas katalogdatafil också behöver dem, och ordningen mellan
// eleventyComputed på global nivå och på katalognivå är inte garanterad i
// Eleventy. Att båda anropar samma funktion tar bort beroendet helt.
const routes = require("#data/routes.js");

/** Strängarna för ett språk. Faller tillbaka på svenska så länge ett språks
 *  fil inte finns än. Alternativet vore att bygget kraschar mitt i en
 *  halvfärdig översättning, och det hjälper ingen. */
function stringsFor(lang) {
  const target = routes.locales[lang] ? lang : routes.defaultLocale;
  try {
    return require(`#data/i18n/${target}.json`);
  } catch {
    return require("#data/i18n/sv.json");
  }
}

module.exports = { stringsFor };
