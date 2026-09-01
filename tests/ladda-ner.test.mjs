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

test('m=ie väljer irländska butiker trots att innehållet är engelskt', async () => {
  const ios = await onRequestGet({
    request: req('https://wagergolf.se/ladda-ner?l=en&m=ie', IPHONE),
  });
  assert.match(ios.headers.get('Location'), /apps\.apple\.com\/ie\//);
  assert.match(ios.headers.get('Location'), /ct=webb-ie(&|$)/);

  const android = await onRequestGet({
    request: req('https://wagergolf.se/ladda-ner?m=ie', ANDROID),
  });
  const play = new URL(android.headers.get('Location'));
  assert.strictEqual(play.searchParams.get('hl'), 'en');
  assert.strictEqual(play.searchParams.get('gl'), 'IE');
});

test('irländsk desktop går till engelskan med bevarad marknad', async () => {
  const res = await onRequestGet({
    request: req('https://wagergolf.se/ladda-ner?m=ie', DESKTOP),
  });
  assert.strictEqual(res.headers.get('Location'), '/en/?market=ie#top');
});

test('finska sidan använder finska storefronts', async () => {
  const ios = await onRequestGet({
    request: req('https://wagergolf.se/ladda-ner?l=fi', IPHONE),
  });
  assert.match(ios.headers.get('Location'), /apps\.apple\.com\/fi\//);

  const android = await onRequestGet({
    request: req('https://wagergolf.se/ladda-ner?l=fi', ANDROID),
  });
  const play = new URL(android.headers.get('Location'));
  assert.strictEqual(play.searchParams.get('hl'), 'fi');
  assert.strictEqual(play.searchParams.get('gl'), 'FI');
});

test('svensk desktop behåller dagens fallback exakt', async () => {
  const res = await onRequestGet({ request: req('https://wagergolf.se/ladda-ner', DESKTOP) });
  assert.strictEqual(res.headers.get('Location'), '/#top');
});

test('okänd marknad faller tillbaka på svenska', () => {
  assert.strictEqual(marketFor('klingon').campaign, 'webb');
  assert.strictEqual(marketFor(null).campaign, 'webb');
});

test('m trumfar l eftersom språk och marknad inte är samma sak', () => {
  assert.strictEqual(marketFor('en', 'ie').campaign, 'webb-ie');
  assert.strictEqual(marketFor('fi', null).campaign, 'webb-fi');
});

test('svaret får aldrig cachas delat', async () => {
  const res = await onRequestGet({ request: req('https://wagergolf.se/ladda-ner', IPHONE) });
  assert.strictEqual(res.headers.get('Cache-Control'), 'no-store');
  assert.strictEqual(res.headers.get('Vary'), 'User-Agent');
});
