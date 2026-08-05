// Härleder hreflang-relationerna genom att gruppera sidor på deras
// språkoberoende key.
//
// 27 sidor gånger fyra språk är 108 sidor som var och en ska peka på fyra
// URL:er. Handunderhållet av den matrisen ruttnar. Genom att härleda den blir
// en saknad översättning ett tomrum i listan i stället för en trasig länk.
//
// Med bara ett publicerat språk returneras tomt. hreflang med en enda
// språkversion säger ingenting, och tomrumet gör att den svenska outputen är
// oförändrad under hela våg 1.

/** Alla publicerade språkversioner av sidan med given key.
 *  @returns {{links: Array<{lang: string, hreflang: string, url: string}>, xDefault: string|null}} */
function alternatesFor(all, key, routes) {
  const empty = { links: [], xDefault: null };
  if (!key) return empty;

  const published = routes.publishedLocales;
  if (published.length < 2) return empty;

  const links = (all || [])
    .filter((p) => p.data && p.data.key === key && published.includes(p.data.lang))
    // Ordningen följer publishedLocales så outputen är stabil mellan byggen.
    .sort((a, b) => published.indexOf(a.data.lang) - published.indexOf(b.data.lang))
    .map((p) => ({
      lang: p.data.lang,
      // Alltid ur språkkonfigurationen. Att härleda den ur sökvägen skulle ge
      // hreflang="dk" för /dk/, vilket är ogiltigt och tyst ignoreras.
      hreflang: routes.locales[p.data.lang].hreflang,
      url: p.url,
    }));

  // Två sidor på samma språk med samma key är ett datafel: hreflang skulle få
  // två rader för samma språkkod, och Google ignorerar hela uppsättningen när
  // den är motsägelsefull. Fäll bygget hellre än att publicera det tyst — samma
  // konvention som guideUrl. Uppstår typiskt när en översatt sida kopieras och
  // key glöms bort i frontmatter.
  const perLang = new Map();
  for (const l of links) {
    if (perLang.has(l.lang)) {
      throw new Error(
        `alternates: "${key}" finns två gånger på språket "${l.lang}" ` +
          `(${perLang.get(l.lang)} och ${l.url}). En key får bara användas ` +
          `en gång per språk.`,
      );
    }
    perLang.set(l.lang, l.url);
  }

  // Färre än två faktiska översättningar: samma resonemang som ovan. En ensam
  // självrefererande hreflang beskriver inga alternativ och säger ingenting.
  if (links.length < 2) return empty;

  const fallback = links.find((l) => l.lang === routes.defaultLocale);
  return { links, xDefault: fallback ? fallback.url : null };
}

module.exports = { alternatesFor };
