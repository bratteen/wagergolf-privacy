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

  // Färre än två faktiska översättningar: samma resonemang som ovan. En ensam
  // självrefererande hreflang beskriver inga alternativ och säger ingenting.
  if (links.length < 2) return empty;

  const fallback = links.find((l) => l.lang === routes.defaultLocale);
  return { links, xDefault: fallback ? fallback.url : null };
}

module.exports = { alternatesFor };
