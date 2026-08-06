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
const PUBLISHED = ['sv', 'en'];

/** Sökvägen till den asset som ska serveras för ett språk. Svenskan ligger i
 *  roten, övriga bakom sitt prefix. */
const ASSET_FOR = {
  sv: '/i/',
  en: '/en/i/',
};

/** Första webbläsarspråket vi faktiskt har en inbjudningssida för. */
export function pickLang(header, published = PUBLISHED) {
  for (const part of (header || '').toLowerCase().split(',')) {
    const base = part.split(';')[0].trim().split('-')[0];
    // "no" och "nb" är samma skriftspråk för vårt syfte.
    const lang = base === 'no' ? 'nb' : base;
    if (published.includes(lang) && ASSET_FOR[lang]) return lang;
  }
  return 'sv';
}

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const lang = pickLang(request.headers.get('accept-language'));
  url.pathname = ASSET_FOR[lang];

  const res = await env.ASSETS.fetch(new Request(url, request));

  // Svaret varierar med besökarens språk. Utan Vary riskerar en engelsk
  // besökare att få den svenska sidan ur en delad cache, eller tvärtom.
  const headers = new Headers(res.headers);
  headers.set('Vary', 'Accept-Language');
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}
