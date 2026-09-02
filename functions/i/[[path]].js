// Servera /i/-landningssidan för alla /i/<handle>-vägar (universal/app link).
// URL:en behålls oförändrad så klient-JS:en kan läsa handle ur location.pathname.
// Cloudflare Pages _redirects 200-proxy var opålitlig för subpath-splat; en
// Pages Function med ASSETS-bindningen är det robusta sättet att serva en sida
// för dynamiska sökvägar.
//
// Inbjudningslänken har EN enda URL — den delas i chattar och fångas av appen
// som universal link, så den kan inte prefixas per språk som resten av sajten.
// Språket väljs därför här, genom att hämta en annan asset bakom samma URL.
//
// PUBLISHED speglar publishedLocales i _data/routes.js. Cloudflare-funktioner
// byggs separat från Eleventy: .eleventy.js passthrough-kopierar functions/ in
// i _site/, och _data/ följer inte med. Läggs ett språk till där måste det
// läggas till här också, annars får språkets besökare svenska.
const PUBLISHED = ['sv', 'nb', 'da', 'en'];
const ENGLISH_FALLBACK_LANGS = new Set(['fi', 'nl', 'de', 'fr', 'es', 'it', 'pt']);
const MARKET_LANG = {
  SE: 'sv', DK: 'da', NO: 'nb', IE: 'en', FI: 'en', NL: 'en', AT: 'en',
  PT: 'en', BE: 'en', DE: 'en', FR: 'en', ES: 'en', IT: 'en',
};

/** Sökvägen till den asset som ska serveras för ett språk. Svenskan ligger i
 *  roten, övriga bakom sitt prefix. */
export const ASSET_FOR = {
  sv: '/i/',
  nb: '/no/i/',
  da: '/dk/i/',
  en: '/en/i/',
};

function acceptedLanguageRanges(header) {
  return String(header || '')
    .split(',')
    .map((entry, index) => {
      const [range, ...parameters] = entry.trim().split(';');
      if (!range) return null;

      let quality = 1;
      let qualitySeen = false;
      for (const parameter of parameters) {
        const match = /^q\s*=\s*(.+)$/i.exec(parameter.trim());
        if (!match) continue;
        if (qualitySeen || !/^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/.test(match[1])) {
          return null;
        }
        qualitySeen = true;
        quality = Number(match[1]);
      }

      return quality > 0 ? { range, quality, index } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.quality - a.quality || a.index - b.index);
}

/** Högst prioriterade webbläsarspråket vi faktiskt har en sida för. */
export function pickLang(header, published = PUBLISHED, country = '') {
  for (const { range } of acceptedLanguageRanges(header)) {
    const base = range.toLowerCase().split('-')[0];
    // "no" och "nb" är samma skriftspråk för vårt syfte.
    const lang = base === 'no'
      ? 'nb'
      : ENGLISH_FALLBACK_LANGS.has(base) ? 'en' : base;
    if (published.includes(lang) && ASSET_FOR[lang]) return lang;
  }
  const geoLang = MARKET_LANG[String(country || '').toUpperCase()];
  if (geoLang && published.includes(geoLang) && ASSET_FOR[geoLang]) return geoLang;
  return 'sv';
}

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const lang = pickLang(
    request.headers.get('accept-language'),
    PUBLISHED,
    request.cf?.country || request.headers.get('CF-IPCountry'),
  );
  url.pathname = ASSET_FOR[lang];

  const res = await env.ASSETS.fetch(new Request(url, request));

  // Svaret varierar med besökarens språk. Utan Vary riskerar en engelsk
  // besökare att få den svenska sidan ur en delad cache, eller tvärtom.
  const headers = new Headers(res.headers);
  headers.set('Vary', 'Accept-Language, CF-IPCountry');
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://api.wagergolf.se; worker-src 'self' blob:; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
  );
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}
