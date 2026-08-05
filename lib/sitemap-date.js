// Datum för sitemapens <lastmod>.
//
// Tidigare användes Eleventys item.date, som utan explicit datum i frontmatter
// faller tillbaka på filens mtime. En färsk clone — CI, ny maskin, ombyggd
// container — ger alla filer checkout-tidpunkten, så sitemapen påstod att hela
// sajten ändrats idag. lastmod är den signal Google använder för att prioritera
// omcrawling; påstår man att allt ändrats vid varje deploy blir signalen
// värdelös och riskerar att ignoreras för domänen.
//
// Ordningen är därför: explicit updated, sedan published, sedan mtime som sista
// utväg. De två första ligger i frontmatter och överlever en clone.

/** ISO-datum ur ett frontmatter-värde, eller null om det inte går att tolka.
 *  YAML ger antingen en sträng ("2026-06-20") eller ett Date-objekt beroende på
 *  om värdet citerats, så båda måste hanteras. */
function isoFromFrontmatter(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  const s = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const dt = new Date(`${s}T00:00:00.000Z`);
  if (Number.isNaN(dt.getTime())) return null;
  // Rullar datumet över är det orimligt (2026-02-31) och ska inte tyst bli
  // ett annat datum — samma resonemang som i lib/local-date.js.
  return dt.toISOString().slice(0, 10) === s ? dt.toISOString() : null;
}

/** lastmod för en sida. fallback är Eleventys item.date. */
function sitemapDate(updated, published, fallback) {
  return (
    isoFromFrontmatter(updated) ||
    isoFromFrontmatter(published) ||
    (fallback ? new Date(fallback).toISOString() : new Date().toISOString())
  );
}

module.exports = { sitemapDate, isoFromFrontmatter };
