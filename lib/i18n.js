// Strängar för ett språk.
//
// Ligger i lib/ och inte bara i _data/eleventyComputed.js därför att
// guidernas katalogdatafil också behöver dem, och ordningen mellan
// eleventyComputed på global nivå och på katalognivå är inte garanterad i
// Eleventy. Att båda anropar samma funktion tar bort beroendet helt.
const routes = require("#data/routes.js");

/** Strängarna för ett språk. Okända språk faller tillbaka på svenska, men ett
 *  känt/publicerat språk måste ha en egen fil. En saknad språkfil ska fälla
 *  bygget i stället för att tyst publicera svenskt gränssnitt på en annan URL. */
function stringsFor(lang) {
  const target = routes.locales[lang] ? lang : routes.defaultLocale;
  return require(`#data/i18n/${target}.json`);
}

module.exports = { stringsFor };
