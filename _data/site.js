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

// Språk och marknad är två skilda saker. Sajten finns på fyra språk, medan
// version 1.7.1 är förberedd för 13 storefronts. Engelska är webb-fallback för
// alla marknader som ännu inte har en egen webböversättning. Butikernas språk
// kan ändå vara lokalt eftersom appens butikstexter redan är lokaliserade.
//
// Releasegrinden har EN source of truth. Lägg till en landskod i PUBLIC_MARKETS
// först när den aktuella versionen faktiskt går att installera i båda butikerna
// och servergrinden är öppen. Då börjar /ladda-ner att skicka dit trafik.
const PUBLIC_MARKETS = new Set(["SE"]);
const TARGET_MARKET_CODES = [
  "SE", "DK", "NO", "IE", "FI", "NL", "AT", "PT", "BE", "DE", "FR", "ES", "IT",
];

const MARKETS = {
  SE: { locale: "sv", store: "se", play: "sv", gl: "SE", campaign: "webb", home: "/" },
  DK: { locale: "da", store: "dk", play: "da", gl: "DK", campaign: "webb-dk", home: "/dk/" },
  NO: { locale: "nb", store: "no", play: "no", gl: "NO", campaign: "webb-no", home: "/no/" },
  IE: { locale: "en", store: "ie", play: "en", gl: "IE", campaign: "webb-ie", home: "/en/" },
  FI: { locale: "en", store: "fi", play: "fi", gl: "FI", campaign: "webb-fi", home: "/en/" },
  NL: { locale: "en", store: "nl", play: "nl", gl: "NL", campaign: "webb-nl", home: "/en/" },
  AT: { locale: "en", store: "at", play: "de", gl: "AT", campaign: "webb-at", home: "/en/" },
  PT: { locale: "en", store: "pt", play: "pt-PT", gl: "PT", campaign: "webb-pt", home: "/en/" },
  BE: { locale: "en", store: "be", play: "en", gl: "BE", campaign: "webb-be", home: "/en/" },
  DE: { locale: "en", store: "de", play: "de", gl: "DE", campaign: "webb-de", home: "/en/" },
  FR: { locale: "en", store: "fr", play: "fr", gl: "FR", campaign: "webb-fr", home: "/en/" },
  ES: { locale: "en", store: "es", play: "es", gl: "ES", campaign: "webb-es", home: "/en/" },
  IT: { locale: "en", store: "it", play: "it", gl: "IT", campaign: "webb-it", home: "/en/" },
};

const DEFAULT_MARKET_FOR_LOCALE = { sv: "SE", nb: "NO", da: "DK", en: "IE" };

for (const code of TARGET_MARKET_CODES) {
  MARKETS[code].code = code;
  MARKETS[code].public = PUBLIC_MARKETS.has(code);
}

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

const marketUrls = Object.fromEntries(
  TARGET_MARKET_CODES.map((code) => {
    const market = MARKETS[code];
    return [code, {
      appStore: taggedAppStoreUrl(market),
      playStore: taggedPlayStoreUrl(market),
      campaign: market.campaign,
      public: market.public,
    }];
  }),
);

const storeUrls = Object.fromEntries(
  Object.entries(DEFAULT_MARKET_FOR_LOCALE).map(([locale, code]) => [locale, marketUrls[code]]),
);

// Sammanfattning per webbspråk för rapporter och tester. Synliga CTA:er styrs
// däremot av besökarens faktiska land via /market-status, eftersom samma
// engelska sida täcker flera marknader som kan öppnas vid olika tidpunkter.
const localeRelease = Object.fromEntries(
  Object.keys(DEFAULT_MARKET_FOR_LOCALE).map((locale) => {
    const codes = TARGET_MARKET_CODES.filter((code) => MARKETS[code].locale === locale);
    return [locale, {
      public: codes.every((code) => PUBLIC_MARKETS.has(code)),
      markets: codes,
      defaultMarket: DEFAULT_MARKET_FOR_LOCALE[locale],
    }];
  }),
);

// Mallarna länkar via Pages Function i stället för direkt till en storefront.
// Då kan samma engelska sida välja IE, FI, NL osv. via explicit ?m= eller
// Cloudflares CF-IPCountry utan att hårdkoda ett enda land i knappen.
const downloadUrls = Object.fromEntries(
  Object.keys(DEFAULT_MARKET_FOR_LOCALE).map((locale) => {
    const language = locale === "sv" ? "" : `l=${locale}&`;
    return [locale, {
      generic: locale === "sv" ? "/ladda-ner" : `/ladda-ner?l=${locale}`,
      ios: `/ladda-ner?${language}p=ios`,
      android: `/ladda-ner?${language}p=android`,
    }];
  }),
);

module.exports = {
  name: "Wager Golf",
  url: "https://wagergolf.se",
  release: {
    version: "1.7.1",
    courseCount: 3028,
    courseClaim: "3 000+",
    targetMarketCodes: TARGET_MARKET_CODES,
    publicMarketCodes: [...PUBLIC_MARKETS],
  },
  markets: MARKETS,
  marketUrls,
  localeRelease,
  downloadUrls,
  // En standardbutik per webbspråk. Engelska går till Irland, aldrig USA.
  // Själva CTA-mallarna använder downloadUrls så GeoIP kan välja rätt land.
  storeUrls,
  // Alias för svenskan, så äldre referenser inte går sönder.
  appStoreUrl: storeUrls.sv.appStore,
  playStoreUrl: storeUrls.sv.playStore,
  appStoreUrlCanonical: APP_STORE_URL,
  playStoreUrlCanonical: PLAY_STORE_URL,
  api: "https://api.wagergolf.se",
  email: "bratt.gustaf@gmail.com",
  // Site-bred, språk- och leverantörsneutral delningsbild (1200x630).
  ogImage: "https://wagergolf.se/assets/og-image-v171.png",
  // Webbstatistik är avstängd även i CSP. Cloudflares automatiska injektion
  // ska också vara avstängd i Pages-dashboarden.
  cfBeaconToken: "",
  // IndexNow: pingar Bing och Yandex om nya och ändrade sidor vid deploy.
  // Nyckeln verifieras genom att samma värde ligger på /<nyckel>.txt, vilket
  // indexnow-key.njk genererar. Byt nyckel = byt här, filen följer med.
  indexNowKey: "9805c5c7f3a5db12b21946ca4bf08f89",
  // Webbstatistik och session replay är avstängda. Återaktivera dem först när
  // besökaren har fått korrekt information och eventuell samtyckeslösning är på
  // plats. Det är särskilt viktigt för /i/<token>, där URL och sidinnehåll kan
  // innehålla en privat inbjudan.
  umami: {
    src: "",
    recorderSrc: "",
    replaySampleRate: 0,
    websiteId: "",
  },
};
