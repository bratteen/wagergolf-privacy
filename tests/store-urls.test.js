const test = require('node:test');
const assert = require('node:assert');
const site = require('../_data/site.js');

test('varje språk har en egen storefront', () => {
  assert.ok(site.storeUrls.sv.appStore.includes('/se/'));
  assert.ok(site.storeUrls.nb.appStore.includes('/no/'));
  assert.ok(site.storeUrls.da.appStore.includes('/dk/'));
  assert.ok(site.storeUrls.en.appStore.includes('/us/'));
  assert.ok(site.storeUrls.ie.appStore.includes('/ie/'));
  assert.ok(site.storeUrls.fi.appStore.includes('/fi/'));
});

test('kampanjnamnen är marknadsbaserade', () => {
  assert.strictEqual(site.storeUrls.sv.campaign, 'webb');
  assert.strictEqual(site.storeUrls.nb.campaign, 'webb-no');
  assert.strictEqual(site.storeUrls.da.campaign, 'webb-dk');
  assert.strictEqual(site.storeUrls.en.campaign, 'webb-en');
  assert.strictEqual(site.storeUrls.ie.campaign, 'webb-ie');
  assert.strictEqual(site.storeUrls.fi.campaign, 'webb-fi');
});

test('Irland återanvänder engelska men har irländsk Play-storefront', () => {
  const url = new URL(site.storeUrls.ie.playStore);
  assert.strictEqual(url.searchParams.get('hl'), 'en');
  assert.strictEqual(url.searchParams.get('gl'), 'IE');
});

test('Finland har finsk Play-storefront', () => {
  const url = new URL(site.storeUrls.fi.playStore);
  assert.strictEqual(url.searchParams.get('hl'), 'fi');
  assert.strictEqual(url.searchParams.get('gl'), 'FI');
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

test('de kanoniska länkarna är omärkta, för schema.org', () => {
  assert.ok(!site.appStoreUrlCanonical.includes('?'));
  assert.ok(!site.playStoreUrlCanonical.includes('referrer'));
});
