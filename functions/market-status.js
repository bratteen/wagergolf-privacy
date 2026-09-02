import { PUBLIC_MARKETS_BY_PLATFORM, resolveMarket } from './ladda-ner.js';

const PUBLIC_IOS = new Set(PUBLIC_MARKETS_BY_PLATFORM.ios);
const PUBLIC_ANDROID = new Set(PUBLIC_MARKETS_BY_PLATFORM.android);

// Samma marknadsval som /ladda-ner, men utan någon butikslänk. Klienten
// använder svaret för att visa rätt CTA när sidans språk och besökarens land
// inte är samma, till exempel engelska i Sverige eller svenska i Danmark.
export function onRequestGet({ request }) {
  const url = new URL(request.url);
  const { market } = resolveMarket(url, request.headers, request.cf?.country);
  const code = market ? market.gl : null;
  const ios = Boolean(code && PUBLIC_IOS.has(code));
  const android = Boolean(code && PUBLIC_ANDROID.has(code));
  const body = JSON.stringify({ market: code, public: ios || android, ios, android });

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      Vary: 'CF-IPCountry',
    },
  });
}
