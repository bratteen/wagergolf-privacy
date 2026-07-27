// /ladda-ner skickar besökaren till rätt butik utifrån enheten: iPhone och
// iPad till App Store, Android till Google Play, allt annat till startsidans
// knappar där båda alternativen syns.
//
// Görs server-side i stället för med klient-JS så länken fungerar även utan
// JavaScript och kan användas rakt i annonser, mejl och QR-koder. En och samma
// URL landar då alltid rätt.
const APP_STORE = 'https://apps.apple.com/se/app/id6767638917';
const PLAY_STORE = 'https://play.google.com/store/apps/details?id=com.bratteen.wagergolf';
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
