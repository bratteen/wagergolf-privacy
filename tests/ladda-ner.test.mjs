import test from 'node:test';
import assert from 'node:assert';
import { createRequire } from 'node:module';
import {
  onRequestGet, marketFor, resolveMarket, playStore, MARKETS, PUBLIC_MARKETS,
  PUBLIC_MARKETS_BY_PLATFORM, TARGET_MARKET_CODES,
} from '../functions/ladda-ner.js';

const require = createRequire(import.meta.url);
const site = require('../_data/site.js');

const req = (url, ua = '', headers = {}) =>
  new Request(url, { headers: { 'user-agent': ua, ...headers } });

const reqWithCf = (url, country, ua = '', headers = {}) => {
  const request = req(url, ua, headers);
  Object.defineProperty(request, 'cf', { value: { country } });
  return request;
};

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8)';
const DESKTOP = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)';

test('svenska iPhone får den svenska storefronten', async () => {
  const res = await onRequestGet({
    request: reqWithCf('https://wagergolf.se/ladda-ner', 'SE', IPHONE),
  });
  assert.strictEqual(res.status, 302);
  assert.match(res.headers.get('Location'), /apps\.apple\.com\/se\//);
  assert.match(res.headers.get('Location'), /ct=webb(&|$)/);
});

test('språk utan verifierad marknad hålls kvar på sin startsida', async () => {
  const res = await onRequestGet({
    request: req('https://wagergolf.se/ladda-ner?l=da', IPHONE),
  });
  assert.strictEqual(res.headers.get('Location'), '/dk/#main-content');
});

test('explicit plattform öppnar rätt svenska butik utan mobil user-agent', async () => {
  const ios = await onRequestGet({
    request: req('https://wagergolf.se/ladda-ner?m=SE&p=ios', DESKTOP),
  });
  assert.match(ios.headers.get('Location'), /apps\.apple\.com\/se\//);

  const android = await onRequestGet({
    request: req('https://wagergolf.se/ladda-ner?m=SE&p=android', DESKTOP),
  });
  const target = new URL(android.headers.get('Location'));
  assert.strictEqual(target.hostname, 'play.google.com');
  assert.strictEqual(target.searchParams.get('id'), 'com.bratteen.wagergolf');
  assert.strictEqual(target.searchParams.get('gl'), 'SE');
  assert.strictEqual(target.searchParams.get('hl'), 'sv');
});

test('Android-UA i Sverige öppnar den svenska Google Play-listningen', async () => {
  const res = await onRequestGet({
    request: reqWithCf('https://wagergolf.se/ladda-ner', 'SE', ANDROID),
  });
  const target = new URL(res.headers.get('Location'));
  assert.strictEqual(target.hostname, 'play.google.com');
  assert.strictEqual(target.searchParams.get('id'), 'com.bratteen.wagergolf');
  assert.strictEqual(target.searchParams.get('gl'), 'SE');
  assert.strictEqual(target.searchParams.get('hl'), 'sv');
  assert.match(decodeURIComponent(target.searchParams.get('referrer')), /utm_campaign=webb/);
});

test('Android öppnar rätt Google Play-listning i alla 13 marknader', async () => {
  for (const code of TARGET_MARKET_CODES) {
    const res = await onRequestGet({
      request: req(`https://wagergolf.se/ladda-ner?m=${code}&p=android`, DESKTOP),
    });
    const target = new URL(res.headers.get('Location'));
    assert.strictEqual(res.status, 302, code);
    assert.strictEqual(target.hostname, 'play.google.com', code);
    assert.strictEqual(target.searchParams.get('id'), 'com.bratteen.wagergolf', code);
    assert.strictEqual(target.searchParams.get('gl'), code, code);
    assert.strictEqual(target.searchParams.get('hl'), MARKETS[code].play, code);
    assert.strictEqual(
      new URLSearchParams(target.searchParams.get('referrer')).get('utm_campaign'),
      MARKETS[code].campaign,
      code,
    );
  }
});

test('iOS öppnar rätt App Store i alla 13 marknader', async () => {
  for (const code of TARGET_MARKET_CODES) {
    const res = await onRequestGet({
      request: req(`https://wagergolf.se/ladda-ner?m=${code}&p=ios`, DESKTOP),
    });
    const target = new URL(res.headers.get('Location'));
    assert.strictEqual(res.status, 302, code);
    assert.strictEqual(target.hostname, 'apps.apple.com', code);
    assert.match(target.pathname, new RegExp(`^/${MARKETS[code].store}/app/id6767638917$`), code);
    assert.strictEqual(target.searchParams.get('ct'), MARKETS[code].campaign, code);
  }
});

test('ogiltig explicit plattform är fail-closed och faller inte tillbaka på UA', async () => {
  const res = await onRequestGet({
    request: reqWithCf('https://wagergolf.se/ladda-ner?p=play', 'SE', IPHONE),
  });
  assert.strictEqual(res.headers.get('Location'), '/#main-content');
});

test('Play använder valt webbspråk utan att byta landsbutik', async () => {
  const cases = [
    ['nl', 'nl'],
    ['fr-BE', 'fr'],
    ['pt-PT', 'pt-PT'],
  ];
  for (const [language, expectedPlayLocale] of cases) {
    const locale = language.toLowerCase().split('-')[0];
    const target = new URL(playStore(MARKETS.BE, '', locale));
    assert.strictEqual(target.searchParams.get('gl'), 'BE', language);
    assert.strictEqual(target.searchParams.get('hl'), expectedPlayLocale, language);
  }
});

test('desktop faller tillbaka på språkets startsida, inte roten', async () => {
  const res = await onRequestGet({
    request: req('https://wagergolf.se/ladda-ner?l=da', DESKTOP),
  });
  assert.strictEqual(res.headers.get('Location'), '/dk/#main-content');
});

test('regionala språkkoder hålls kvar på rätt lokal sida', async () => {
  const cases = [
    ['pt-PT', '/pt/#main-content'],
    ['de-AT', '/de/#main-content'],
    ['no-NO', '/no/#main-content'],
  ];
  for (const [language, expected] of cases) {
    const res = await onRequestGet({
      request: req(`https://wagergolf.se/ladda-ner?l=${language}`, DESKTOP),
    });
    assert.strictEqual(res.headers.get('Location'), expected, language);
  }
});

test('saknad GeoIP håller svensk desktop på sidan utan att öppna butik', async () => {
  const res = await onRequestGet({ request: req('https://wagergolf.se/ladda-ner', DESKTOP) });
  assert.strictEqual(res.headers.get('Location'), '/#main-content');
});

test('GeoIP väljer marknad före språkfallback och öppnar rätt iOS-butik', async () => {
  const res = await onRequestGet({
    request: req('https://wagergolf.se/ladda-ner?l=en&p=ios', DESKTOP, {
      'CF-IPCountry': 'IE',
    }),
  });
  assert.match(res.headers.get('Location'), /^https:\/\/apps\.apple\.com\/ie\/app\/id6767638917\?/);
});

test('Workers request.cf.country fungerar utan Managed Transform-header', async () => {
  const res = await onRequestGet({
    request: reqWithCf('https://wagergolf.se/ladda-ner?l=en&p=ios', 'SE', DESKTOP),
  });
  assert.match(res.headers.get('Location'), /apps\.apple\.com\/se\//);
});

test('explicit marknad har företräde framför GeoIP', async () => {
  const res = await onRequestGet({
    request: req('https://wagergolf.se/ladda-ner?m=SE&p=ios', DESKTOP, {
      'CF-IPCountry': 'IE',
    }),
  });
  assert.match(res.headers.get('Location'), /apps\.apple\.com\/se\//);
});

test('okänd explicit marknad är fail-closed', async () => {
  assert.strictEqual(marketFor('US'), null);
  const res = await onRequestGet({
    request: req('https://wagergolf.se/ladda-ner?l=en&m=US&p=ios', DESKTOP, {
      'CF-IPCountry': 'SE',
    }),
  });
  assert.strictEqual(res.headers.get('Location'), '/en/#main-content');
});

test('GeoIP utanför de 13 marknaderna faller inte vidare till Irland', () => {
  const resolved = resolveMarket(
    new URL('https://wagergolf.se/ladda-ner?l=en&p=ios'),
    new Headers({ 'CF-IPCountry': 'US' }),
  );
  assert.strictEqual(resolved.market, null);
  assert.strictEqual(resolved.invalidExplicitMarket, true);
});

test('kampanj följer med efter marknadsvalet', async () => {
  const res = await onRequestGet({
    request: req('https://wagergolf.se/ladda-ner?m=SE&p=ios&c=Meta%20Launch', DESKTOP),
  });
  assert.strictEqual(new URL(res.headers.get('Location')).searchParams.get('ct'), 'meta-launch');
});

test('funktions- och sajtkonfigurationen innehåller samma marknader och grind', () => {
  assert.deepStrictEqual(TARGET_MARKET_CODES, site.release.targetMarketCodes);
  assert.deepStrictEqual(PUBLIC_MARKETS, site.release.publicMarketCodes);
  assert.deepStrictEqual(PUBLIC_MARKETS_BY_PLATFORM, site.release.publicMarketCodesByPlatform);
  for (const code of TARGET_MARKET_CODES) {
    assert.deepStrictEqual(MARKETS[code], {
      locale: site.markets[code].locale,
      store: site.markets[code].store,
      play: site.markets[code].play,
      gl: site.markets[code].gl,
      campaign: site.markets[code].campaign,
      home: site.markets[code].home,
    });
  }
});

test('svaret får aldrig cachas delat', async () => {
  const res = await onRequestGet({ request: req('https://wagergolf.se/ladda-ner', IPHONE) });
  assert.strictEqual(res.headers.get('Cache-Control'), 'no-store');
  assert.strictEqual(res.headers.get('Vary'), 'User-Agent, CF-IPCountry');
});
