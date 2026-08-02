// Rena butikslänkar utan mätparametrar. Strukturerad data ska peka på appens
// kanoniska adress, inte på en spårad variant.
const APP_STORE_URL = "https://apps.apple.com/se/app/id6767638917";
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.bratteen.wagergolf";

// Kampanjnamnet som butikernas rapporter grupperar på. Umami mäter klicket på
// knappen, det här mäter vad som händer sedan: hur många som faktiskt laddade
// ner. Utan den siffran syns inte om tappet ligger på butikssidan eller i appen.
const STORE_CAMPAIGN = "webb";

// Provider-token från App Store Connect > Analytics > Acquisition > Campaigns.
// Apple knyter nedladdningen till kontot via den, så utan token lämnas
// App Store-länken omärkt hellre än att se mätt ut utan att vara det.
// Google Play behöver ingen motsvarighet.
const APPLE_PROVIDER_TOKEN = "128879444";

// Kampanjlänkar använder Apples egen bas-URL, inte den landsprefixade. Det är
// formen App Store Connect själv genererar, och den som attributionen är
// verifierad mot. Butiken väljer ändå land utifrån besökarens konto.
const APP_STORE_CAMPAIGN_BASE =
  "https://apps.apple.com/app/apple-store/id6767638917";

/** App Store-länk med kampanjmärkning. Faller tillbaka på den rena länken så
 *  länge provider-token saknas. */
function taggedAppStoreUrl() {
  if (!APPLE_PROVIDER_TOKEN) return APP_STORE_URL;
  const params = new URLSearchParams({
    pt: APPLE_PROVIDER_TOKEN,
    ct: STORE_CAMPAIGN,
    mt: "8",
  });
  return `${APP_STORE_CAMPAIGN_BASE}?${params}`;
}

/** Google Play-länk med kampanjmärkning. Play vill ha utm-paren som EN
 *  urlencodad sträng i referrer, inte som separata query-parametrar. */
function taggedPlayStoreUrl() {
  const referrer = `utm_source=wagergolf.se&utm_medium=referral&utm_campaign=${STORE_CAMPAIGN}`;
  return `${PLAY_STORE_URL}&referrer=${encodeURIComponent(referrer)}`;
}

module.exports = {
  name: "Wager Golf",
  url: "https://wagergolf.se",
  // Klickbara länkar är kampanjmärkta, de kanoniska används i schema.org.
  appStoreUrl: taggedAppStoreUrl(),
  playStoreUrl: taggedPlayStoreUrl(),
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
