// /go är den universella kampanjlänken: en URL som fungerar för alla
// marknader, för QR-koder på tryck, poddar, radio, kläder och mässor.
//
// DIGITALA ANNONSER SKA INTE PEKA HIT. De ska peka direkt på /dk/, /no/ eller
// /en/. En landningssida på annonsens eget språk ger högre relevansbetyg och
// därmed lägre klickpris, och /go lägger bara till ett omdirigeringshopp.
//
// Att den ligger på en egen sökväg i stället för på / är hela poängen:
// Googlebot indexerar aldrig /go (den är Disallow i robots.txt), så ingen av
// indexeringsriskerna med en språkredirect på roten uppstår. Alla fyra
// språkversionerna förblir fullt synliga för sökmotorerna.
//
// DUPLIKAT MED AVSIKT. Listan nedan och sanitizeCampaign finns också i
// _data/routes.js respektive lib/campaign.js. Anledningen är deploykedjan:
// .eleventy.js passthrough-kopierar functions/ in i _site/, och deployen
// skickar bara _site. lib/ följer inte med, så en import härifrån skulle
// resolva till ingenting i produktion. Att passthrough-kopiera lib/ vore
// värre — då låg den publikt på /lib/.
// Ändras något här måste motsvarande ändring göras i _data/routes.js och
// lib/campaign.js. Testerna i tests/go.test.mjs och tests/campaign.test.js
// kontrollerar samma värden från båda hållen, men INTE mot varandra —
// synken är manuell.
//
// PUBLISHED SPEGLAR publishedLocales I _data/routes.js MEN UPPDATERAS INTE
// AUTOMATISKT MED DEN. README:s checklista "Lägga till ett språk" har ett
// eget steg för att uppdatera PUBLISHED — glöms det bort svarar /go?l=nb
// (varje tryckt QR-kod och poddlänk för den marknaden) fortfarande med
// svenska startsidan, tyst, eftersom pickLang faller tillbaka på
// DEFAULT_LANG för alla språk som inte står i listan nedan.
const PREFIX = { sv: '', nb: '/no', da: '/dk', en: '/en' };
const PUBLISHED = ['sv'];
const DEFAULT_LANG = 'sv';

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
 *  `published` tar default från PUBLISHED (våg 1: bara sv), men går att
 *  skicka in explicit i tester. Utan den möjligheten skulle själva
 *  språkvalslogiken — att ?l=da väljer danska, att Accept-Language: nb-NO
 *  väljer bokmål, att "no" och "nb" räknas som samma skriftspråk — förbli
 *  otestad tills den aktiveras i en senare våg, och ett fel i den skulle
 *  då först upptäckas i produktion. */
export function pickLang(url, request, published = PUBLISHED) {
  const forced = url.searchParams.get('l');
  if (forced && published.includes(forced)) return forced;
  if (forced) return DEFAULT_LANG;

  const header = (request.headers.get('accept-language') || '').toLowerCase();
  for (const part of header.split(',')) {
    const base = part.split(';')[0].trim().split('-')[0];
    // "no" och "nb" är samma skriftspråk för vårt syfte.
    const lang = base === 'no' ? 'nb' : base;
    if (published.includes(lang)) return lang;
  }
  return DEFAULT_LANG;
}

export function onRequestGet({ request }) {
  const url = new URL(request.url);
  const lang = pickLang(url, request);
  const campaign = sanitizeCampaign(url.searchParams.get('c'));

  let target = `${PREFIX[lang]}/`;
  if (campaign) {
    const params = new URLSearchParams({
      utm_source: campaign,
      utm_medium: 'offline',
      utm_campaign: campaign,
    });
    target += `?${params}`;
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: target,
      // Svaret varierar med besökarens språk och får aldrig cachas delat.
      'Cache-Control': 'no-store',
      Vary: 'Accept-Language',
    },
  });
}
