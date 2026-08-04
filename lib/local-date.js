// Läsbart datum för by-line, per språk.
//
// Ersätter den handskrivna svenska månadsarrayen. Node har datan via Intl, och
// fyra handskrivna månadsarrayer vore fyra tillfällen att stava fel.
//
// UTC används genomgående: datumen i frontmatter är rena datum utan tid, och
// utan explicit tidszon skulle byggmaskinens zon kunna flytta dem ett dygn.
const routes = require("../_data/routes.js");

function localDate(d, lang) {
  if (!d) return "";
  const s = String(d).slice(0, 10);
  const [y, m, day] = s.split("-").map(Number);
  if (!y || !m || !day) return s;

  const dt = new Date(Date.UTC(y, m - 1, day));
  // Intl rullar över orimliga datum: "2026-02-31" blir 3 mars. Den gamla
  // svDate skrev ut "31 februari", alltså synligt fel. Med 84 datumfält efter
  // fyra språk ska ett stavfel synas som stavfelet det är, inte tyst bli ett
  // annat datum. Returnera råsträngen så den fastnar i granskningen.
  if (dt.getUTCDate() !== day || dt.getUTCMonth() !== m - 1) return s;

  const loc = routes.locales[lang] || routes.locales[routes.defaultLocale];
  return new Intl.DateTimeFormat(loc.intl, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, day)));
}

module.exports = { localDate };
