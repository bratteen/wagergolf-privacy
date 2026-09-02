import test from 'node:test';
import assert from 'node:assert';
import routes from '../_data/routes.js';
import { ASSET_FOR, pickLang, onRequest } from '../functions/i/[[path]].js';

const allLocales = Object.keys(routes.locales);

test('inbjudningssidan har en asset för varje känt språk', () => {
  for (const lang of allLocales) {
    const prefix = routes.locales[lang].prefix;
    const expected = prefix ? `${prefix}/i/` : '/i/';
    assert.strictEqual(ASSET_FOR[lang], expected, `${lang} saknar rätt invite-asset`);
  }
});

test('inbjudningssidan kan välja alla språk när de publiceras', () => {
  assert.strictEqual(pickLang('sv-SE,sv;q=0.9', allLocales), 'sv');
  assert.strictEqual(pickLang('en-GB,en;q=0.9', allLocales), 'en');
  assert.strictEqual(pickLang('da-DK,da;q=0.9', allLocales), 'da');
  assert.strictEqual(pickLang('nb-NO,nb;q=0.9', allLocales), 'nb');
  assert.strictEqual(pickLang('no-NO,no;q=0.9', allLocales), 'nb');
  assert.strictEqual(pickLang('de-DE,de;q=0.9', allLocales), 'de');
  assert.strictEqual(pickLang('fi-FI,fi;q=0.9', allLocales), 'fi');
  assert.strictEqual(pickLang('fr-BE,fr;q=0.9', allLocales), 'fr');
});

test('inbjudningsspråket respekterar q-värden och väljer aldrig q=0', () => {
  assert.strictEqual(pickLang('de;q=0.2,sv;q=1', allLocales), 'sv');
  assert.strictEqual(pickLang('da;q=0,en;q=0.8', allLocales), 'en');
  assert.strictEqual(pickLang('da;q=oops,nb;q=0.8', allLocales), 'nb');
  assert.strictEqual(pickLang('da;q=0.8,en;q=0.8', allLocales), 'da');
});

test('inbjudningssidan använder marknaden när webbläsarspråket är okänt', () => {
  assert.strictEqual(pickLang('pl-PL', allLocales, 'DK'), 'da');
  assert.strictEqual(pickLang('pl-PL', allLocales, 'NO'), 'nb');
  assert.strictEqual(pickLang('pl-PL', allLocales, 'DE'), 'de');
  assert.strictEqual(pickLang('pl-PL', allLocales, 'US'), 'sv');
});

test('ett uttryckligt invite-språk vinner över webbläsare och land', () => {
  assert.strictEqual(pickLang('sv-SE', allLocales, 'SE', 'nl-NL'), 'nl');
  assert.strictEqual(pickLang('de-DE', allLocales, 'DE', 'pt-PT'), 'pt');
  assert.strictEqual(pickLang('de-DE', allLocales, 'DE', 'no-NO'), 'nb');
});

test('invite-funktionen serverar språket från l-parametern', async () => {
  let fetchedPath = '';
  const request = new Request('https://wagergolf.se/i/Abcd1234?l=fr', {
    headers: { 'accept-language': 'sv-SE', 'CF-IPCountry': 'SE' },
  });
  await onRequest({
    request,
    env: {
      ASSETS: {
        fetch(assetRequest) {
          fetchedPath = new URL(assetRequest.url).pathname;
          return Promise.resolve(new Response('ok'));
        },
      },
    },
  });
  assert.strictEqual(fetchedPath, '/fr/i/');
});

test('tysk invite-trafik serveras från den tyska asseten', async () => {
  let fetchedPath = '';
  const request = new Request('https://wagergolf.se/i/Abcd1234', {
    headers: { 'accept-language': 'de-DE', 'CF-IPCountry': 'DE' },
  });
  const response = await onRequest({
    request,
    env: {
      ASSETS: {
        fetch(assetRequest) {
          fetchedPath = new URL(assetRequest.url).pathname;
          return Promise.resolve(new Response('ok'));
        },
      },
    },
  });
  assert.strictEqual(fetchedPath, '/de/i/');
  assert.strictEqual(response.headers.get('Vary'), 'Accept-Language, CF-IPCountry');
  assert.strictEqual(response.headers.get('Cache-Control'), 'no-store');
  assert.strictEqual(response.headers.get('X-Robots-Tag'), 'noindex, nofollow');
  assert.strictEqual(response.headers.get('X-Frame-Options'), 'DENY');
  assert.strictEqual(response.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.strictEqual(response.headers.get('Referrer-Policy'), 'no-referrer');
  assert.match(response.headers.get('Content-Security-Policy'), /frame-ancestors 'none'/);
});

test('invite använder Workers request.cf.country utan GeoIP-header', async () => {
  let fetchedPath = '';
  const request = new Request('https://wagergolf.se/i/Abcd1234', {
    headers: { 'accept-language': 'pl-PL' },
  });
  Object.defineProperty(request, 'cf', { value: { country: 'DK' } });
  await onRequest({
    request,
    env: {
      ASSETS: {
        fetch(assetRequest) {
          fetchedPath = new URL(assetRequest.url).pathname;
          return Promise.resolve(new Response('ok'));
        },
      },
    },
  });
  assert.strictEqual(fetchedPath, '/dk/i/');
});
