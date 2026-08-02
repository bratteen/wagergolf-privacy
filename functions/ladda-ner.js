// /ladda-ner skickar besökaren till rätt butik utifrån enheten: iPhone och
// iPad till App Store, Android till Google Play, allt annat till startsidans
// knappar där båda alternativen syns.
//
// Görs server-side i stället för med klient-JS så länken fungerar även utan
// JavaScript och kan användas rakt i annonser, mejl och QR-koder. En och samma
// URL landar då alltid rätt.
//
// Butikslänkarna är kampanjmärkta så App Store Connect och Play Console kan
// visa hur många som faktiskt laddade ner via sajten, inte bara hur många som
// klickade. Håll värdena i synk med _data/site.js. Cloudflare-funktioner byggs
// separat från Eleventy, så de kan inte dela modul.
const STORE_CAMPAIGN = 'webb';
const APPLE_PROVIDER_TOKEN = '';

const APP_STORE = APPLE_PROVIDER_TOKEN
  ? `https://apps.apple.com/se/app/id6767638917?pt=${APPLE_PROVIDER_TOKEN}&ct=${STORE_CAMPAIGN}&mt=8`
  : 'https://apps.apple.com/se/app/id6767638917';
const PLAY_STORE =
  'https://play.google.com/store/apps/details?id=com.bratteen.wagergolf&referrer=' +
  encodeURIComponent(
    `utm_source=wagergolf.se&utm_medium=referral&utm_campaign=${STORE_CAMPAIGN}`,
  );
const FALLBACK = '/#top';

export function onRequestGet({ request }) {
  const ua = request.headers.get('user-agent') || '';

  // Android testas först: Android-webbläsare kan innehålla "Linux" men aldrig
  // "iPhone", medan vissa inbäddade iOS-vyer nämner både iPhone och Android.
  let target = FALLBACK;
  if (/Android/i.test(ua)) target = PLAY_STORE;
  else if (/iPhone|iPad|iPod/i.test(ua)) target = APP_STORE;

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
