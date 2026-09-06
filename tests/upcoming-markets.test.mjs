import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { onRequestGet as download, UPCOMING_MARKET_CODES, PUBLIC_MARKETS_BY_PLATFORM } from '../functions/ladda-ner.js';
import { onRequestGet as marketStatus } from '../functions/market-status.js';
import { onRequestGet as go } from '../functions/go.js';
import { onRequest as invite } from '../functions/i/[[path]].js';

const require = createRequire(import.meta.url);
const site = require('../_data/site.js');
const ORIGIN = 'https://wagergolf.se';
const request = (path, country = '', headers = {}) => {
  const value = new Request(ORIGIN + path, { headers });
  if (country) Object.defineProperty(value, 'cf', { value: { country } });
  return value;
};

test('US och GB är kända men saknar publika länkar och releaseclaims', () => {
  assert.deepEqual(UPCOMING_MARKET_CODES, ['US', 'GB']);
  assert.deepEqual(site.release.upcomingMarketCodes, UPCOMING_MARKET_CODES);
  assert.equal(site.release.version, '1.7.1');
  assert.equal(site.release.courseCount, 3028);
  assert.equal(site.release.courseClaim, '3 000+');
  assert.equal(site.release.targetMarketCodes.length, 13);
  for (const market of UPCOMING_MARKET_CODES) {
    assert.equal(site.markets[market].locale, 'en');
    assert.equal(site.markets[market].home, '/en/');
    assert.equal(site.markets[market].public, false);
    assert.equal(site.markets[market].iosPublic, false);
    assert.equal(site.markets[market].androidPublic, false);
    assert.equal(site.marketUrls[market], undefined);
    assert.equal(site.release.targetMarketCodes.includes(market), false);
    for (const platform of ['ios', 'android']) {
      assert.equal(PUBLIC_MARKETS_BY_PLATFORM[platform].includes(market), false);
    }
  }
  assert.equal(site.localeRelease.en.public, true);
  assert.equal(site.localeRelease.en.defaultMarket, 'IE');
  assert.equal(site.storeUrls.en.campaign, 'webb-ie');
  assert.match(site.storeUrls.en.appStore, /^https:\/\/apps\.apple\.com\/ie\//);
  assert.equal(new URL(site.storeUrls.en.playStore).searchParams.get('gl'), 'IE');
});

for (const market of ['US', 'GB']) {
  test(`${market} förblir stängt via explicit land, Workers GeoIP och header på båda plattformar`, async () => {
    for (const platform of ['ios', 'android']) {
      const cases = [
        request(`/ladda-ner?m=${market}&p=${platform}&c=guides`, 'IE'),
        request(`/ladda-ner?p=${platform}&c=guides`, market),
        request(`/ladda-ner?p=${platform}&c=guides`, '', { 'CF-IPCountry': market }),
      ];
      for (const value of cases) {
        const response = download({ request: value });
        assert.equal(response.status, 302);
        const target = new URL(response.headers.get('Location'), ORIGIN);
        assert.equal(target.origin, ORIGIN);
        assert.equal(target.pathname, '/en/');
        assert.equal(target.searchParams.get('m'), market);
        assert.equal(target.searchParams.get('c'), 'guides');
        const status = await marketStatus({ request: request('/market-status' + target.search, 'IE') }).json();
        assert.deepEqual(status, { market, public: false, ios: false, android: false });
        assert.equal(response.headers.get('Cache-Control'), 'no-store');
      }
    }
  });

  test(`${market} QR-länk väljer English och bevarar stängd marknad utan butikshopp`, () => {
    for (const value of [request(`/go?m=${market}&c=club-qr`, 'IE'), request('/go?c=club-qr', market)]) {
      const target = new URL(go({ request: value }).headers.get('Location'), ORIGIN);
      assert.equal(target.pathname, '/en/');
      assert.equal(target.searchParams.get('m'), market);
      assert.equal(target.searchParams.get('utm_campaign'), 'club-qr');
    }
    const explicitLanguage = go({ request: request(`/go?m=${market}&l=sv`, market) });
    assert.equal(new URL(explicitLanguage.headers.get('Location'), ORIGIN).pathname, '/');
  });

  test(`${market} inbjudningslänk använder engelsk asset utan att röra token eller säkerhetsheaders`, async () => {
    for (const value of [request('/i/ExampleInvite', market), request(`/i/ExampleInvite?m=${market}`, 'SE')]) {
      let fetchedUrl;
      const response = await invite({ request: value, env: { ASSETS: {
        fetch(assetRequest) {
          fetchedUrl = new URL(assetRequest.url);
          return Promise.resolve(new Response('existing English invite page'));
        },
      } } });
      assert.equal(fetchedUrl.pathname, '/en/i/');
      assert.equal(value.url.includes('/i/ExampleInvite'), true);
      assert.equal(response.headers.get('Cache-Control'), 'no-store');
      assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow');
      assert.equal(response.headers.get('Referrer-Policy'), 'no-referrer');
    }
  });
}

test('Irlands plattformslänkar, guidekampanj och gamla språkfallback är oförändrade', async () => {
  for (const platform of ['ios', 'android']) {
    const target = new URL(download({ request: request(`/ladda-ner?l=en&m=IE&p=${platform}&c=guides`) }).headers.get('Location'));
    if (platform === 'ios') {
      assert.equal(target.hostname, 'apps.apple.com');
      assert.equal(target.pathname, '/ie/app/id6767638917');
      assert.equal(target.searchParams.get('ct'), 'guides');
    } else {
      assert.equal(target.hostname, 'play.google.com');
      assert.equal(target.searchParams.get('gl'), 'IE');
      assert.equal(target.searchParams.get('hl'), 'en');
      assert.equal(new URLSearchParams(target.searchParams.get('referrer')).get('utm_campaign'), 'guides');
    }
  }
  const qr = new URL(go({ request: request('/go?m=IE', 'SE') }).headers.get('Location'), ORIGIN);
  assert.equal(qr.pathname, '/');
  let invitePath;
  await invite({ request: request('/i/ExampleInvite?m=IE', 'SE'), env: { ASSETS: {
    fetch(assetRequest) {
      invitePath = new URL(assetRequest.url).pathname;
      return Promise.resolve(new Response('existing Swedish invite page'));
    },
  } } });
  assert.equal(invitePath, '/i/');
});
