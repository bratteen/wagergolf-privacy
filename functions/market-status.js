import { PUBLIC_MARKETS, resolveMarket } from './ladda-ner.js';

const PUBLIC = new Set(PUBLIC_MARKETS);

// Samma marknadsval som /ladda-ner, men utan någon butikslänk. Klienten
// använder svaret för att visa rätt CTA när sidans språk och besökarens land
// inte är samma, till exempel engelska i Sverige eller svenska i Danmark.
export function onRequestGet({ request }) {
  const url = new URL(request.url);
  const { market } = resolveMarket(url, request.headers, request.cf?.country);
  const code = market ? market.gl : null;
  const body = JSON.stringify({ market: code, public: Boolean(code && PUBLIC.has(code)) });

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      Vary: 'CF-IPCountry',
    },
  });
}
