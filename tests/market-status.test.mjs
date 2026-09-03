import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestGet } from '../functions/market-status.js';
import { TARGET_MARKET_CODES } from '../functions/ladda-ner.js';

const request = (query = '', country = '') => new Request(
  `https://wagergolf.se/market-status${query}`,
  { headers: country ? { 'CF-IPCountry': country } : {} },
);

async function state(query, country) {
  const response = onRequestGet({ request: request(query, country) });
  return { response, body: await response.json() };
}

test('explicit marknad använder samma plattformssplit som nedladdningen', async () => {
  assert.deepStrictEqual((await state('?m=SE', 'DK')).body, {
    market: 'SE', public: true, ios: true, android: true,
  });
  assert.deepStrictEqual((await state('?m=DK', 'SE')).body, {
    market: 'DK', public: true, ios: true, android: true,
  });
});

test('GeoIP öppnar båda plattformarna i alla 13 marknader', async () => {
  for (const country of TARGET_MARKET_CODES) {
    assert.deepStrictEqual((await state('', country)).body, {
      market: country, public: true, ios: true, android: true,
    }, country);
  }
});

test('okänt land är fail-closed och svaret får inte delas mellan länder', async () => {
  const { response, body } = await state('?m=US', 'SE');
  assert.deepStrictEqual(body, { market: null, public: false, ios: false, android: false });
  assert.strictEqual(response.headers.get('Cache-Control'), 'no-store');
  assert.strictEqual(response.headers.get('Vary'), 'CF-IPCountry');
});

test('språk utan verifierad marknad öppnar aldrig en storefront', async () => {
  assert.deepStrictEqual((await state('?l=sv')).body, {
    market: null, public: false, ios: false, android: false,
  });
  assert.deepStrictEqual((await state('?l=en')).body, {
    market: null, public: false, ios: false, android: false,
  });
});

test('market-status använder Workers request.cf.country utan GeoIP-header', async () => {
  const req = request();
  Object.defineProperty(req, 'cf', { value: { country: 'SE' } });
  const response = onRequestGet({ request: req });
  assert.deepStrictEqual(await response.json(), {
    market: 'SE', public: true, ios: true, android: true,
  });
});
