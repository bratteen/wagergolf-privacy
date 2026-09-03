// /ladda-ner väljer både plattform och rätt storefront. Språk, marknad och
// release-status är separata: elva webbspråk täcker 13 marknader och bara en
// marknad som uttryckligen är öppen för rätt plattform får en
// butiksomdirigering.
//
// Prioritet för marknaden:
//   1. explicit ?m=SE (för annonser, QR-koder och test)
//   2. Cloudflares request.cf.country
//   3. CF-IPCountry-headern, om zonens GeoIP-transform är aktiv
// Utan en verifierad marknad öppnas ingen butik. ?l= väljer bara vilken
// språkversion besökaren hålls kvar på.
//
// Funktionen kan inte importera _data/site.js eftersom Pages Functions byggs
// separat. tests/store-urls.test.js jämför därför båda konfigurationerna och
// gör deployen fail-closed om de driver isär.
const APP_ID = 'id6767638917';
const PLAY_ID = 'com.bratteen.wagergolf';
const APPLE_PROVIDER_TOKEN = '128879444';

export const PUBLIC_MARKETS_BY_PLATFORM = {
  ios: ['SE', 'DK', 'NO'],
  android: ['SE', 'DK', 'NO', 'IE', 'FI', 'NL', 'AT', 'PT', 'BE', 'DE', 'FR', 'ES', 'IT'],
};
export const PUBLIC_MARKETS = [
  ...new Set([
    ...PUBLIC_MARKETS_BY_PLATFORM.ios,
    ...PUBLIC_MARKETS_BY_PLATFORM.android,
  ]),
];
export const TARGET_MARKET_CODES = [
  'SE', 'DK', 'NO', 'IE', 'FI', 'NL', 'AT', 'PT', 'BE', 'DE', 'FR', 'ES', 'IT',
];

export const MARKETS = {
  SE: { locale: 'sv', store: 'se', play: 'sv', gl: 'SE', campaign: 'webb', home: '/' },
  DK: { locale: 'da', store: 'dk', play: 'da', gl: 'DK', campaign: 'webb-dk', home: '/dk/' },
  NO: { locale: 'nb', store: 'no', play: 'no', gl: 'NO', campaign: 'webb-no', home: '/no/' },
  IE: { locale: 'en', store: 'ie', play: 'en', gl: 'IE', campaign: 'webb-ie', home: '/en/' },
  FI: { locale: 'fi', store: 'fi', play: 'fi', gl: 'FI', campaign: 'webb-fi', home: '/fi/' },
  NL: { locale: 'nl', store: 'nl', play: 'nl', gl: 'NL', campaign: 'webb-nl', home: '/nl/' },
  AT: { locale: 'de', store: 'at', play: 'de', gl: 'AT', campaign: 'webb-at', home: '/de/' },
  PT: { locale: 'pt', store: 'pt', play: 'pt-PT', gl: 'PT', campaign: 'webb-pt', home: '/pt/' },
  BE: { locale: 'en', store: 'be', play: 'en', gl: 'BE', campaign: 'webb-be', home: '/en/' },
  DE: { locale: 'de', store: 'de', play: 'de', gl: 'DE', campaign: 'webb-de', home: '/de/' },
  FR: { locale: 'fr', store: 'fr', play: 'fr', gl: 'FR', campaign: 'webb-fr', home: '/fr/' },
  ES: { locale: 'es', store: 'es', play: 'es', gl: 'ES', campaign: 'webb-es', home: '/es/' },
  IT: { locale: 'it', store: 'it', play: 'it', gl: 'IT', campaign: 'webb-it', home: '/it/' },
};

const DEFAULT_MARKET_FOR_LOCALE = {
  sv: 'SE', nb: 'NO', da: 'DK', en: 'IE', fi: 'FI', nl: 'NL',
  de: 'DE', fr: 'FR', es: 'ES', it: 'IT', pt: 'PT',
};
const PLAY_LOCALE_FOR_WEB_LOCALE = {
  sv: 'sv', nb: 'no', da: 'da', en: 'en', fi: 'fi', nl: 'nl',
  de: 'de', fr: 'fr', es: 'es', it: 'it', pt: 'pt-PT',
};
const PUBLIC_BY_PLATFORM = {
  ios: new Set(PUBLIC_MARKETS_BY_PLATFORM.ios),
  android: new Set(PUBLIC_MARKETS_BY_PLATFORM.android),
};

/** Strikt uppslagning. En okänd explicit landkod får aldrig falla tillbaka på
 * Sverige och råka skicka gated trafik till en öppen storefront. */
export function marketFor(value) {
  if (!value) return null;
  const code = String(value).trim().toUpperCase();
  return MARKETS[code] || null;
}

function localeFor(value) {
  if (!value) return null;
  let locale = String(value).trim().toLowerCase().split('-')[0];
  if (locale === 'no') locale = 'nb';
  return Object.prototype.hasOwnProperty.call(DEFAULT_MARKET_FOR_LOCALE, locale)
    ? locale
    : null;
}

export function resolveMarket(url, headers, cfCountry = '') {
  if (url.searchParams.has('m')) {
    const explicit = marketFor(url.searchParams.get('m'));
    return { market: explicit, invalidExplicitMarket: !explicit };
  }

  // request.cf.country är den kanoniska Workers-signalen. Headern finns bara
  // när IP Geolocation/Managed Transform är aktiv och är därför fallback.
  const geoCode = cfCountry || headers.get('CF-IPCountry');
  if (geoCode) {
    const geo = marketFor(geoCode);
    // Cloudflare känner ibland igen en besökare utanför de 13 marknaderna.
    // En sådan träff får aldrig falla vidare till engelska standardmarknaden
    // Irland och därmed skapa en butikslänk utanför lanseringsområdet.
    return { market: geo, invalidExplicitMarket: !geo };
  }

  // Språk avgör bara vilken sida vi håller besökaren på. Utan uttrycklig
  // marknad eller verifierad GeoIP öppnas ingen storefront.
  return { market: null, invalidExplicitMarket: false };
}

function appStore(market, campaign) {
  const base = `https://apps.apple.com/${market.store}/app/${APP_ID}`;
  if (!APPLE_PROVIDER_TOKEN) return base;
  const params = new URLSearchParams({
    pt: APPLE_PROVIDER_TOKEN,
    ct: campaign || market.campaign,
    mt: '8',
  });
  return `${base}?${params}`;
}

export function playStore(market, campaign, locale) {
  const referrer = new URLSearchParams({
    utm_source: 'wagergolf.se',
    utm_medium: 'referral',
    utm_campaign: campaign || market.campaign,
  });
  const params = new URLSearchParams({
    id: PLAY_ID,
    // gl väljer rätt landsbutik och l/hl väljer texten i den. De måste hållas
    // isär för flerspråkiga marknader, framför allt nederländska/franska i BE.
    hl: locale ? PLAY_LOCALE_FOR_WEB_LOCALE[locale] : market.play,
    gl: market.gl,
    referrer: referrer.toString(),
  });
  return `https://play.google.com/store/apps/details?${params}`;
}

function cleanCampaign(raw) {
  return raw
    ? String(raw).toLowerCase().replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+/, '').slice(0, 40).replace(/-+$/, '')
    : '';
}

function requestedPlatform(url, ua) {
  const explicit = url.searchParams.get('p');
  if (url.searchParams.has('p')) {
    return explicit === 'ios' || explicit === 'android' ? explicit : null;
  }
  if (/Android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  return null;
}

function homeFor(url, market) {
  const locale = localeFor(url.searchParams.get('l'));
  if (locale) return MARKETS[DEFAULT_MARKET_FOR_LOCALE[locale]].home;
  return market ? market.home : '/';
}

export function onRequestGet({ request }) {
  const url = new URL(request.url);
  const { market } = resolveMarket(url, request.headers, request.cf?.country);
  const locale = localeFor(url.searchParams.get('l'));
  const ua = request.headers.get('user-agent') || '';
  const platform = requestedPlatform(url, ua);
  const campaign = cleanCampaign(url.searchParams.get('c') || url.searchParams.get('utm_campaign'));

  // Marknad saknas, är okänd eller är fortfarande under granskning: håll kvar
  // besökaren på rätt språkversion. Ingen gated storefront får läcka ut här.
  let target = `${homeFor(url, market)}#main-content`;
  if (market && platform && PUBLIC_BY_PLATFORM[platform].has(market.gl)) {
    if (platform === 'android') target = playStore(market, campaign, locale);
    else if (platform === 'ios') target = appStore(market, campaign);
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: target,
      'Cache-Control': 'no-store',
      Vary: 'User-Agent, CF-IPCountry',
    },
  });
}
