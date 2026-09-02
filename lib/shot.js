// Sökväg till en appskärmbild i sidans eget språk, med fallback.
//
// Rotbilderna är svenska; norska, danska och engelska bilder ligger i varsin
// språkmapp. Shortcoden håller sökvägsvalet samlat på ett ställe.
//
// Uppslagsordningen är sidans språk, sedan reservspråket, sedan den delade
// bilden. Reservspråket är engelska och inte svenska av ett skäl: ser en
// nederländsk besökare ett engelskt gränssnitt är det begripligt, medan ett
// svenskt bara ser fel ut. Finns ingen engelsk heller används den delade.
//
// Nya webbspråk fungerar direkt med engelsk reservbild tills en egen
// verifierad bildserie läggs i assets/shots/<lang>/.
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
