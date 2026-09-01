// /ladda-ner skickar besökaren till rätt butik utifrån enheten: iPhone och
// iPad till App Store, Android till Google Play, allt annat till startsidans
// knappar där båda alternativen syns.
//
// Görs server-side i stället för med klient-JS så länken fungerar även utan
// JavaScript och kan användas rakt i annonser, mejl och QR-koder. En och samma
// URL landar då alltid rätt.
//
// EN endpoint för alla språk, marknaden i query-strängen (?l=da). Specen
// tänkte sig lokaliserade sökvägar (/dk/hent), men det kräver en Pages
// Function per språk, och endpointen är en omdirigering som aldrig indexeras
// (se Disallow: /ladda-ner i robots.njk) — en lokaliserad slug hade varit
// kosmetik utan SEO-värde.
//
// Butikslänkarna är kampanjmärkta så App Store Connect och Play Console kan
// visa hur många som faktiskt laddade ner via sajten, inte bara hur många som
// klickade.
//
// Speglar MARKETS i _data/site.js. Cloudflare-funktioner byggs separat och kan
// inte importera den filen: .eleventy.js passthrough-kopierar functions/ in i
// _site/, och deployen skickar bara _site. Ändras något där måste det ändras
// här också — tests/store-urls.test.js och tests/ladda-ner.test.mjs
// kontrollerar samma marknadsvärden var för sig, inte mot varandra, så synken
// är manuell.
const APP_ID = 'id6767638917';
const PLAY_ID = 'com.bratteen.wagergolf';
const APPLE_PROVIDER_TOKEN = '128879444';

const MARKETS = {
  sv: { store: 'se', play: 'sv', gl: 'SE', campaign: 'webb', home: '/' },
  nb: { store: 'no', play: 'no', gl: 'NO', campaign: 'webb-no', home: '/no/' },
  da: { store: 'dk', play: 'da', gl: 'DK', campaign: 'webb-dk', home: '/dk/' },
  en: { store: 'us', play: 'en', gl: 'US', campaign: 'webb-en', home: '/en/' },
  ie: { store: 'ie', play: 'en', gl: 'IE', campaign: 'webb-ie', home: '/en/?market=ie' },
  fi: { store: 'fi', play: 'fi', gl: 'FI', campaign: 'webb-fi', home: '/fi/' },
};

/** Marknad från ?m=, med språkets standardmarknad från ?l= som reserv.
 *  Irland och engelska delar språk men inte storefront, därför kan marknad
 *  inte längre härledas entydigt enbart från `l=en`.
 *  Okänt eller saknat värde faller tillbaka på svenska, så
 *  en trasig eller föråldrad länk aldrig ger en tom eller trasig omdirigering. */
export function marketFor(lang, market) {
  return MARKETS[market] || MARKETS[lang] || MARKETS.sv;
}

// Bygg alltid på den landsprefixade adressen. App Store Connects egen
// kampanjlänkgenerator ger formen /app/apple-store/id..., men den svarar 404 i
// vanlig webbläsare. pt och ct läses av Apple oavsett sökväg.
function appStore(market) {
  const base = `https://apps.apple.com/${market.store}/app/${APP_ID}`;
  if (!APPLE_PROVIDER_TOKEN) return base;
  return `${base}?pt=${APPLE_PROVIDER_TOKEN}&ct=${market.campaign}&mt=8`;
}

function playStore(market) {
  const referrer = `utm_source=wagergolf.se&utm_medium=referral&utm_campaign=${market.campaign}`;
  const params = new URLSearchParams({
    id: PLAY_ID, hl: market.play, gl: market.gl, referrer,
  });
  return `https://play.google.com/store/apps/details?${params}`;
}

export function onRequestGet({ request }) {
  const url = new URL(request.url);
  const market = marketFor(url.searchParams.get('l'), url.searchParams.get('m'));
  const ua = request.headers.get('user-agent') || '';

  // Android testas först: Android-webbläsare kan innehålla "Linux" men aldrig
  // "iPhone", medan vissa inbäddade iOS-vyer nämner både iPhone och Android.
  //
  // Ingen igenkänd mobil: skicka till språkets egen startsida, där båda
  // knapparna syns. Att skicka en dansk besökare till den svenska roten vore
  // en språkbyte mitt i ett klick.
  let target = `${market.home}#top`;
  if (/Android/i.test(ua)) target = playStore(market);
  else if (/iPhone|iPad|iPod/i.test(ua)) target = appStore(market);

  return new Response(null, {
    status: 302,
    headers: {
      Location: target,
      // Svaret varierar med enheten, så det får aldrig cachas delat. Utan detta
      // riskerar en Android-användare att få iOS-omdirigeringen ur cachen.
      'Cache-Control': 'no-store',
      Vary: 'User-Agent',
    },
  });
}
