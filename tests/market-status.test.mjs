import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestGet } from '../functions/market-status.js';

const request = (query = '', country = '') => new Request(
  `https://wagergolf.se/market-status${query}`,
  { headers: country ? { 'CF-IPCountry': country } : {} },
);

async function state(query, country) {
  const response = onRequestGet({ request: request(query, country) });
  return { response, body: await response.json() };
}

test('explicit marknad använder samma Sverige-only-grind som nedladdningen', async () => {
  assert.deepStrictEqual((await state('?m=SE', 'DK')).body, {
    market: 'SE', public: true, ios: true, android: false,
  });
  assert.deepStrictEqual((await state('?m=DK', 'SE')).body, {
    market: 'DK', public: false, ios: false, android: false,
  });
});

test('GeoIP öppnar Sverige och håller övriga målmarknader stängda', async () => {
  assert.deepStrictEqual((await state('', 'SE')).body, {
    market: 'SE', public: true, ios: true, android: false,
  });
  for (const country of ['DK', 'NO', 'IE', 'FI', 'NL', 'AT', 'PT', 'BE', 'DE', 'FR', 'ES', 'IT']) {
    assert.deepStrictEqual((await state('', country)).body, {
      market: country, public: false, ios: false, android: false,
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
    market: 'SE', public: true, ios: true, android: false,
  });
});
