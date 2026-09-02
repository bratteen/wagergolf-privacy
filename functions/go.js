// /go är den universella kampanjlänken: en URL som fungerar för alla
// marknader, för QR-koder på tryck, poddar, radio, kläder och mässor.
//
// DIGITALA ANNONSER SKA INTE PEKA HIT. De ska peka direkt på målspråkets
// landningssida, till exempel /dk/, /de/ eller /fr/. En landningssida på
// annonsens eget språk ger högre relevansbetyg och
// därmed lägre klickpris, och /go lägger bara till ett omdirigeringshopp.
//
// Att den ligger på en egen sökväg i stället för på / är hela poängen:
// Googlebot indexerar aldrig /go (den är Disallow i robots.txt), så ingen av
// indexeringsriskerna med en språkredirect på roten uppstår. Alla elva
// språkversionerna förblir fullt synliga för sökmotorerna.
//
// DUPLIKAT MED AVSIKT. Listan nedan och sanitizeCampaign finns också i
// _data/routes.js respektive lib/campaign.js. Anledningen är deploykedjan:
// .eleventy.js passthrough-kopierar functions/ in i _site/, och deployen
// skickar bara _site. lib/ följer inte med, så en import härifrån skulle
// resolva till ingenting i produktion. Att passthrough-kopiera lib/ vore
// värre — då låg den publikt på /lib/.
// Ändras något här måste motsvarande ändring göras i _data/routes.js och
// lib/campaign.js. Tester kontrollerar både beteendet och att PUBLISHED-listan
// speglar _data/routes.js, men synken i källan är fortfarande explicit.
//
// PUBLISHED SPEGLAR publishedLocales I _data/routes.js MEN UPPDATERAS INTE
// AUTOMATISKT MED DEN. README:s checklista "Lägga till ett språk" har ett
// eget steg för att uppdatera PUBLISHED — glöms det bort svarar /go?l=nb
// (varje tryckt QR-kod och poddlänk för den marknaden) fortfarande med
// svenska startsidan, tyst, eftersom pickLang faller tillbaka på
// DEFAULT_LANG för alla språk som inte står i listan nedan.
const PREFIX = {
  sv: '', nb: '/no', da: '/dk', en: '/en', fi: '/fi', nl: '/nl',
  de: '/de', fr: '/fr', es: '/es', it: '/it', pt: '/pt',
};
const PUBLISHED = ['sv', 'nb', 'da', 'en', 'fi', 'nl', 'de', 'fr', 'es', 'it', 'pt'];
const DEFAULT_LANG = 'sv';
const MARKET_LANG = {
  SE: 'sv', DK: 'da', NO: 'nb', IE: 'en', FI: 'fi', NL: 'nl', AT: 'de',
  PT: 'pt', BE: 'en', DE: 'de', FR: 'fr', ES: 'es', IT: 'it',
};

function requestCountry(request) {
  return String(request.cf?.country || request.headers.get('CF-IPCountry') || '').toUpperCase();
}

function normalizeLang(value) {
  const base = String(value || '').toLowerCase().split('-')[0];
  if (base === 'no') return 'nb';
  return base;
}

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

/** Butikernas kampanjfält är fritext men trivs inte med mellanslag, versaler
 *  eller emoji. Metas {{campaign.name}} expanderar till kampanjnamnet precis
 *  som det skrevs i annonsverktyget, så värdet måste saneras. */
export function sanitizeCampaign(raw) {
  if (!raw) return '';
  return String(raw)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .slice(0, 40)
    .replace(/-+$/, '');
}

/** Språk från ?l=, annars Accept-Language. Opublicerade språk faller tillbaka
 *  på svenska, så en kampanjlänk kan tryckas innan översättningen är klar utan
 *  att leda till en tom katalog.
 *
 *  `published` tar default från PUBLISHED, men går att
 *  skicka in explicit i tester. Utan den möjligheten skulle själva
 *  språkvalslogiken — att ?l=da väljer danska, att Accept-Language: nb-NO
 *  väljer bokmål, att "no" och "nb" räknas som samma skriftspråk — förbli
 *  otestad tills den aktiveras i en senare våg, och ett fel i den skulle
 *  då först upptäckas i produktion. */
export function pickLang(url, request, published = PUBLISHED) {
  const forced = url.searchParams.get('l');
  const forcedLang = normalizeLang(forced);
  if (forced && published.includes(forcedLang)) return forcedLang;
  if (forced) return DEFAULT_LANG;

  const header = request.headers.get('accept-language') || '';
  for (const { range } of acceptedLanguageRanges(header)) {
    const lang = normalizeLang(range);
    if (published.includes(lang)) return lang;
  }
  const geoLang = MARKET_LANG[requestCountry(request)];
  if (geoLang && published.includes(geoLang)) return geoLang;
  return DEFAULT_LANG;
}

function pickMarket(url, request) {
  if (url.searchParams.has('m')) {
    // Även en ogiltig explicit kod måste följa med till landningssidan så
    // /market-status kan stoppa den. Om den tappas här kan GeoIP maskera en
    // trasig QR-/kampanjlänk och öppna en annan storefront.
    return String(url.searchParams.get('m') || '').slice(0, 16).toUpperCase();
  }
  const geo = requestCountry(request);
  return MARKET_LANG[geo] ? geo : '';
}

export function onRequestGet({ request }) {
  const url = new URL(request.url);
  const lang = pickLang(url, request);
  const campaign = sanitizeCampaign(url.searchParams.get('c'));
  const market = pickMarket(url, request);
  const hasMarket = url.searchParams.has('m') || Boolean(market);

  let target = `${PREFIX[lang]}/`;
  if (campaign || hasMarket) {
    const params = new URLSearchParams();
    if (campaign) {
      params.set('utm_source', campaign);
      params.set('utm_medium', 'offline');
      params.set('utm_campaign', campaign);
    }
    if (hasMarket) params.set('m', market);
    target += `?${params}`;
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: target,
      // Svaret varierar med besökarens språk och får aldrig cachas delat.
      'Cache-Control': 'no-store',
      Vary: 'Accept-Language, CF-IPCountry',
    },
  });
}
