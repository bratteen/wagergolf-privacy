import test from 'node:test';
import assert from 'node:assert';
import { onRequestGet, marketFor } from '../functions/ladda-ner.js';

const req = (url, ua = '', headers = {}) =>
  new Request(url, { headers: { 'user-agent': ua, ...headers } });

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8)';
const DESKTOP = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)';

test('svenska iPhone får den svenska storefronten', async () => {
  const res = await onRequestGet({ request: req('https://wagergolf.se/ladda-ner', IPHONE) });
  assert.strictEqual(res.status, 302);
  assert.match(res.headers.get('Location'), /apps\.apple\.com\/se\//);
  assert.match(res.headers.get('Location'), /ct=webb(&|$)/);
});

test('l väljer marknad för både butik och kampanj', async () => {
  const res = await onRequestGet({
    request: req('https://wagergolf.se/ladda-ner?l=da', IPHONE),
  });
  assert.match(res.headers.get('Location'), /apps\.apple\.com\/dk\//);
  assert.match(res.headers.get('Location'), /ct=webb-dk(&|$)/);
});

test('Android får Play med rätt marknad i referrer', async () => {
  const res = await onRequestGet({
    request: req('https://wagergolf.se/ladda-ner?l=nb', ANDROID),
  });
  const loc = res.headers.get('Location');
  assert.match(loc, /play\.google\.com/);
  assert.ok(decodeURIComponent(loc).includes('utm_campaign=webb-no'));
});

test('desktop faller tillbaka på språkets startsida, inte roten', async () => {
  const res = await onRequestGet({
    request: req('https://wagergolf.se/ladda-ner?l=da', DESKTOP),
  });
  assert.strictEqual(res.headers.get('Location'), '/dk/#top');
});

test('svensk desktop behåller dagens fallback exakt', async () => {
  const res = await onRequestGet({ request: req('https://wagergolf.se/ladda-ner', DESKTOP) });
  assert.strictEqual(res.headers.get('Location'), '/#top');
});

test('okänd marknad faller tillbaka på svenska', () => {
  assert.strictEqual(marketFor('klingon').campaign, 'webb');
  assert.strictEqual(marketFor(null).campaign, 'webb');
});

test('svaret får aldrig cachas delat', async () => {
  const res = await onRequestGet({ request: req('https://wagergolf.se/ladda-ner', IPHONE) });
  assert.strictEqual(res.headers.get('Cache-Control'), 'no-store');
  assert.strictEqual(res.headers.get('Vary'), 'User-Agent');
});
