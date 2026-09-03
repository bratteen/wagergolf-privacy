const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const site = require('../_data/site.js');

const TARGETS = ['SE', 'DK', 'NO', 'IE', 'FI', 'NL', 'AT', 'PT', 'BE', 'DE', 'FR', 'ES', 'IT'];

test('releasekonfigurationen innehåller exakt de 13 beslutade marknaderna', () => {
  assert.deepStrictEqual(site.release.targetMarketCodes, TARGETS);
  assert.deepStrictEqual(Object.keys(site.markets), TARGETS);
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
  assert.ok(!JSON.stringify(site.storeUrls).includes('/us/'));
});

test('kampanjnamnen är marknadsbaserade och engelska standarden är Irland', () => {
  assert.strictEqual(site.storeUrls.sv.campaign, 'webb');
  assert.strictEqual(site.storeUrls.nb.campaign, 'webb-no');
  assert.strictEqual(site.storeUrls.da.campaign, 'webb-dk');
  assert.strictEqual(site.storeUrls.en.campaign, 'webb-ie');
});

test('App Store och Google Play är öppna i Sverige', () => {
  assert.deepStrictEqual(site.release.publicMarketCodes, ['SE']);
  assert.deepStrictEqual(site.release.publicMarketCodesByPlatform, {
    ios: ['SE'],
    android: ['SE'],
  });
  assert.strictEqual(site.marketUrls.SE.iosPublic, true);
  assert.strictEqual(site.marketUrls.SE.androidPublic, true);
  assert.strictEqual(site.localeRelease.sv.public, true);
  assert.strictEqual(site.localeRelease.sv.androidPublic, true);
  assert.strictEqual(site.localeRelease.nb.public, false);
  assert.strictEqual(site.localeRelease.da.public, false);
  assert.strictEqual(site.localeRelease.en.public, false);
  for (const lang of ['fi', 'nl', 'de', 'fr', 'es', 'it', 'pt']) {
    assert.strictEqual(site.localeRelease[lang].public, false, lang);
  }
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
