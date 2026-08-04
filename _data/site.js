// Rena butikslänkar utan mätparametrar. Strukturerad data ska peka på appens
// kanoniska adress, inte på en spårad variant.
const APP_ID = "id6767638917";
const PLAY_ID = "com.bratteen.wagergolf";
const APP_STORE_URL = `https://apps.apple.com/se/app/${APP_ID}`;
const PLAY_STORE_URL =
  `https://play.google.com/store/apps/details?id=${PLAY_ID}`;

// Provider-token från App Store Connect > Analytics > Acquisition > Campaigns.
// Apple knyter nedladdningen till kontot via den, så utan token lämnas
// App Store-länken omärkt hellre än att se mätt ut utan att vara det.
// Google Play behöver ingen motsvarighet.
const APPLE_PROVIDER_TOKEN = "128879444";

// En storefront och ett kampanjnamn per marknad. Kampanjnamnen är
// marknadsbaserade, precis som sökvägarna, eftersom butikernas
// förvärvsrapporter är indelade per storefront. Utan uppdelningen klumpas all
// webbtrafik ihop och det går inte att se om Danmark fungerar.
const MARKETS = {
  sv: { store: "se", play: "sv", gl: "SE", campaign: "webb" },
  nb: { store: "no", play: "no", gl: "NO", campaign: "webb-no" },
  da: { store: "dk", play: "da", gl: "DK", campaign: "webb-dk" },
  en: { store: "us", play: "en", gl: "US", campaign: "webb-en" },
};

/** App Store-länk med kampanjmärkning. Faller tillbaka på den rena länken så
 *  länge provider-token saknas.
 *
 *  Bygg ALLTID på den landsprefixade adressen. App Store Connects egen
 *  kampanjlänkgenerator ger formen /app/apple-store/id..., men den svarar 404
 *  i vanlig webbläsare och fungerar bara inuti App Store-appen. Parametrarna
 *  pt och ct läses av Apple oavsett sökväg. */
function taggedAppStoreUrl(market) {
  const base = `https://apps.apple.com/${market.store}/app/${APP_ID}`;
  if (!APPLE_PROVIDER_TOKEN) return base;
  const params = new URLSearchParams({
    pt: APPLE_PROVIDER_TOKEN,
    ct: market.campaign,
    mt: "8",
  });
  return `${base}?${params}`;
}

/** Google Play-länk med kampanjmärkning. Play vill ha utm-paren som EN
 *  urlencodad sträng i referrer, inte som separata query-parametrar. */
function taggedPlayStoreUrl(market) {
  const referrer = `utm_source=wagergolf.se&utm_medium=referral&utm_campaign=${market.campaign}`;
  const params = new URLSearchParams({
    id: PLAY_ID,
    hl: market.play,
    gl: market.gl,
    referrer,
  });
  return `https://play.google.com/store/apps/details?${params}`;
}

const storeUrls = Object.fromEntries(
  Object.entries(MARKETS).map(([lang, market]) => [
    lang,
    {
      appStore: taggedAppStoreUrl(market),
      playStore: taggedPlayStoreUrl(market),
      campaign: market.campaign,
    },
  ]),
);

module.exports = {
  name: "Wager Golf",
  url: "https://wagergolf.se",
  // En butikslänk per marknad. Mallarna använder storeUrls[lang].
  storeUrls,
  // Alias för svenskan, så äldre referenser inte går sönder.
  appStoreUrl: storeUrls.sv.appStore,
  playStoreUrl: storeUrls.sv.playStore,
  appStoreUrlCanonical: APP_STORE_URL,
  playStoreUrlCanonical: PLAY_STORE_URL,
  api: "https://api.wagergolf.se",
  email: "bratt.gustaf@gmail.com",
  // Site-bred delningsbild (1200x630). Skapas i Fas 1.
  ogImage: "https://wagergolf.se/assets/og-image.png",
  // Cloudflare Web Analytics-beacon. Lämna tom om du aktiverar automatisk
  // injektion i Cloudflare Pages-dashboarden istället. Fyll i token här för
  // explicit beacon (Web Analytics > sajt > "JS snippet" > token-värdet).
  cfBeaconToken: "",
  // IndexNow: pingar Bing och Yandex om nya och ändrade sidor vid deploy.
  // Nyckeln verifieras genom att samma värde ligger på /<nyckel>.txt, vilket
  // indexnow-key.njk genererar. Byt nyckel = byt här, filen följer med.
  indexNowKey: "9805c5c7f3a5db12b21946ca4bf08f89",
  // Umami: cookielös, self-hosted analytics (egen server). Tom websiteId = av.
  // recorderSrc laddar session replay/heatmap ovanpå script.js (kräver den, läser
  // sessionen från window.umami). Lämna tom för att stänga av inspelningen.
  umami: {
    src: "https://analytics.bratt.se/script.js",
    recorderSrc: "https://analytics.bratt.se/recorder.js",
    // Andel besökare som spelas in (0-1). 0 stänger av inspelningen helt.
    // Inspelaren är 190 kB uppackad, så varje inspelad besökare kostar
    // bandbredd och lite huvudtråd. Höj om du behöver fler inspelningar.
    replaySampleRate: 0.25,
    websiteId: "ae56fbfa-4ce4-480b-af6a-62f20282b414",
  },
};
