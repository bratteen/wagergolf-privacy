// Sökväg till en appskärmbild i sidans eget språk, med fallback.
//
// Bilderna låg tidigare hårdkodade som /assets/shots/<namn>.webp på ett
// trettiotal ställen. Med fyra språk och fler på väg blir det ohållbart att
// byta dem för hand, och ännu värre att komma ihåg alla ställen.
//
// Uppslagsordningen är sidans språk, sedan reservspråket, sedan den delade
// bilden. Reservspråket är engelska och inte svenska av ett skäl: ser en
// nederländsk besökare ett engelskt gränssnitt är det begripligt, medan ett
// svenskt bara ser fel ut. Finns ingen engelsk heller används den delade.
//
// Att lägga till ett språk kostar därmed ingenting — sidorna byggs och
// fungerar direkt. Släpps riktiga bilder in i assets/shots/<lang>/ senare
// plockas de upp automatiskt, utan att en enda sida behöver röras.
const FALLBACK_LANG = "en";

// De delade bilderna i assets/shots/ ÄR de svenska. Svenskan ska därför aldrig
// gå omvägen via engelska — en sv/-katalog vore bara en dubblett av dem.
const SHARED_LANG = "sv";

/** @param {string} name  Bildens namn utan ändelse, t.ex. "live".
 *  @param {string} lang  Sidans språk.
 *  @param {string[]} available  "<lang>/<namn>" för varje lokaliserad bild. */
function shotPath(name, lang, available) {
  const has = (l) => Array.isArray(available) && available.includes(`${l}/${name}`);
  if (lang && has(lang)) return `/assets/shots/${lang}/${name}.webp`;
  if (lang !== SHARED_LANG && has(FALLBACK_LANG)) {
    return `/assets/shots/${FALLBACK_LANG}/${name}.webp`;
  }
  return `/assets/shots/${name}.webp`;
}

module.exports = { shotPath, FALLBACK_LANG, SHARED_LANG };
