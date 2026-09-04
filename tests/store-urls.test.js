const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const site = require('../_data/site.js');

const PUBLIC = ['SE', 'DK', 'NO', 'IE', 'FI', 'NL', 'AT', 'PT', 'BE', 'DE', 'FR', 'ES', 'IT'];
const TARGETS = [...PUBLIC, 'US'];

test('releasekonfigurationen innehåller exakt de 14 beslutade målmarknaderna', () => {
  assert.deepStrictEqual(site.release.targetMarketCodes, TARGETS);
  assert.deepStrictEqual(Object.keys(site.markets), TARGETS);
  assert.strictEqual(site.release.version, '1.8.0');
  assert.strictEqual(site.release.courseCount, 21864);
  assert.strictEqual(site.release.courseClaim, '20 000+');
});

test('varje webbspråk har en säker standard-storefront', () => {
  assert.ok(site.storeUrls.sv.appStore.includes('/se/'));
  assert.ok(site.storeUrls.nb.appStore.includes('/no/'));
  assert.ok(site.storeUrls.da.appStore.includes('/dk/'));
  assert.ok(site.storeUrls.en.appStore.includes('/ie/'));
  assert.ok(site.storeUrls.fi.appStore.includes('/fi/'));
  assert.ok(site.storeUrls.nl.appStore.includes('/nl/'));
  assert.ok(site.storeUrls.de.appStore.includes('/de/'));
  assert.ok(site.storeUrls.fr.appStore.includes('/fr/'));
  assert.ok(site.storeUrls.es.appStore.includes('/es/'));
  assert.ok(site.storeUrls.it.appStore.includes('/it/'));
  assert.ok(site.storeUrls.pt.appStore.includes('/pt/'));
  // Engelska sidans standard förblir IE; USA väljs bara av ?m=US eller GeoIP.
  assert.ok(!JSON.stringify(site.storeUrls).includes('/us/'));
});

test('kampanjnamnen är marknadsbaserade och engelska standarden är Irland', () => {
  assert.strictEqual(site.storeUrls.sv.campaign, 'webb');
  assert.strictEqual(site.storeUrls.nb.campaign, 'webb-no');
  assert.strictEqual(site.storeUrls.da.campaign, 'webb-dk');
  assert.strictEqual(site.storeUrls.en.campaign, 'webb-ie');
  assert.strictEqual(site.marketUrls.US.campaign, 'webb-us');
});

test('US använder en-US-marknaden på den gemensamma engelska sidan', () => {
  assert.strictEqual(site.markets.US.locale, 'en');
  assert.strictEqual(site.markets.US.home, '/en/');
  assert.strictEqual(site.markets.US.store, 'us');
  assert.strictEqual(site.markets.US.play, 'en');
  assert.strictEqual(site.markets.US.gl, 'US');
});

test('de 13 live-marknaderna är öppna och US är stängt per plattform', () => {
  assert.deepStrictEqual(site.release.publicMarketCodes, PUBLIC);
  assert.deepStrictEqual(site.release.publicMarketCodesByPlatform, {
    ios: PUBLIC,
    android: PUBLIC,
  });
  for (const code of PUBLIC) {
    assert.strictEqual(site.marketUrls[code].public, true, `${code}: public`);
    assert.strictEqual(site.marketUrls[code].iosPublic, true, `${code}: iOS`);
    assert.strictEqual(site.marketUrls[code].androidPublic, true, `${code}: Android`);
  }
  assert.deepStrictEqual(site.marketUrls.US, {
    appStore: 'https://apps.apple.com/us/app/id6767638917?pt=128879444&ct=webb-us&mt=8',
    playStore: 'https://play.google.com/store/apps/details?id=com.bratteen.wagergolf&hl=en&gl=US&referrer=utm_source%3Dwagergolf.se%26utm_medium%3Dreferral%26utm_campaign%3Dwebb-us',
    campaign: 'webb-us',
    public: false,
    iosPublic: false,
    androidPublic: false,
  });
  for (const lang of ['sv', 'nb', 'da', 'fi', 'nl', 'de', 'fr', 'es', 'it', 'pt']) {
    assert.strictEqual(site.localeRelease[lang].public, true, `${lang}: public`);
    assert.strictEqual(site.localeRelease[lang].iosPublic, true, `${lang}: iOS`);
    assert.strictEqual(site.localeRelease[lang].androidPublic, true, `${lang}: Android`);
  }
  assert.deepStrictEqual(site.localeRelease.en, {
    public: false,
    iosPublic: false,
    androidPublic: false,
    markets: ['IE', 'BE', 'US'],
    defaultMarket: 'IE',
  });
});

test('alla marknader har landsspecifika butikslänkar', () => {
  for (const code of TARGETS) {
    assert.ok(site.marketUrls[code].appStore.includes(`/${code.toLowerCase()}/`));
    assert.strictEqual(new URL(site.marketUrls[code].playStore).searchParams.get('gl'), code);
  }
});

test('kampanjen ligger i ct på App Store-länken', () => {
  const url = new URL(site.storeUrls.da.appStore);
  assert.strictEqual(url.searchParams.get('ct'), 'webb-dk');
  assert.strictEqual(url.searchParams.get('pt'), '128879444');
});

test('Play-länkens kampanj ligger i referrer, inte som egen parameter', () => {
  const url = new URL(site.storeUrls.nb.playStore);
  assert.strictEqual(url.searchParams.get('utm_campaign'), null);
  const referrer = decodeURIComponent(url.searchParams.get('referrer'));
  assert.ok(referrer.includes('utm_campaign=webb-no'));
});

test('gamla aliasen pekar fortfarande på svenskan', () => {
  assert.strictEqual(site.appStoreUrl, site.storeUrls.sv.appStore);
  assert.strictEqual(site.playStoreUrl, site.storeUrls.sv.playStore);
});

test('mallarnas butiksknappar går via den marknadsmedvetna endpointen', () => {
  assert.strictEqual(site.downloadUrls.sv.ios, '/ladda-ner?p=ios');
  assert.strictEqual(site.downloadUrls.en.ios, '/ladda-ner?l=en&p=ios');
  assert.strictEqual(site.downloadUrls.en.android, '/ladda-ner?l=en&p=android');
});

test('både desktop- och mobilnav följer releasegrinden', () => {
  const base = fs.readFileSync(path.join(__dirname, '..', '_includes/base.njk'), 'utf8');
  assert.strictEqual((base.match(/data-release-open hidden/g) || []).length, 2);
  assert.strictEqual((base.match(/data-release-closed/g) || []).length, 2);
  assert.ok(base.includes('release-status.js'));
  assert.ok(!base.includes('site.storeUrls[lang]'));
  assert.strictEqual((base.match(/site\.downloadUrls\[lang\]\.generic/g) || []).length, 2);
});

test('butiksknappar är fail-closed tills besökarens land har verifierats', () => {
  const badges = fs.readFileSync(path.join(__dirname, '..', '_includes/store-badges.njk'), 'utf8');
  assert.match(badges, /data-release-ios-open hidden/);
  assert.match(badges, /data-release-ios-closed/);
  assert.match(badges, /data-release-android-open hidden/);
  assert.match(badges, /data-release-android-closed/);
  assert.strictEqual((badges.match(/data-release-ios-open hidden/g) || []).length, 1);
  assert.strictEqual((badges.match(/data-release-android-open hidden/g) || []).length, 1);
  assert.strictEqual((badges.match(/site\.downloadUrls\[lang\]\.ios/g) || []).length, 1);
  assert.strictEqual((badges.match(/site\.downloadUrls\[lang\]\.android/g) || []).length, 1);
  assert.ok(!badges.includes('site.localeRelease[lang].public'));
});

test('de kanoniska länkarna är omärkta, för schema.org', () => {
  assert.ok(!site.appStoreUrlCanonical.includes('?'));
  assert.ok(!site.playStoreUrlCanonical.includes('referrer'));
});
