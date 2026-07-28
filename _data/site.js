module.exports = {
  name: "Wager Golf",
  url: "https://wagergolf.se",
  appStoreUrl: "https://apps.apple.com/se/app/id6767638917",
  playStoreUrl: "https://play.google.com/store/apps/details?id=com.bratteen.wagergolf",
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
