const test = require('node:test');
const assert = require('node:assert');
const { sanitizeCampaign, campaignFromSearch, withCampaign } = require('../lib/campaign.js');

test('c vinner över utm_campaign', () => {
  assert.strictEqual(campaignFromSearch('?c=qr&utm_campaign=meta'), 'qr');
});

test('utm_campaign används när c saknas — annonstrafik kommer aldrig via /go', () => {
  assert.strictEqual(campaignFromSearch('?utm_campaign=WG%20DK%20-%20Reels'), 'wg-dk-reels');
});

test('ingen kampanj i URL:en ger tom sträng', () => {
  assert.strictEqual(campaignFromSearch(''), '');
  assert.strictEqual(campaignFromSearch('?foo=bar'), '');
});

test('sanerar likadant som functions/go.js', () => {
  assert.strictEqual(sanitizeCampaign('WG DK - Reels 🏌'), 'wg-dk-reels');
});

test('withCampaign byter ut ct men rör inget annat', () => {
  const url = 'https://apps.apple.com/dk/app/id6767638917?pt=128879444&ct=webb-dk&mt=8';
  const out = withCampaign(url, 'podd-golfsnack');
  assert.ok(out.includes('ct=podd-golfsnack'));
  assert.ok(out.includes('pt=128879444'));
  assert.ok(out.includes('mt=8'));
  assert.ok(!out.includes('ct=webb-dk'));
});

test('tom kampanj lämnar länken orörd', () => {
  const url = 'https://apps.apple.com/dk/app/id6767638917?pt=1&ct=webb-dk';
  assert.strictEqual(withCampaign(url, ''), url);
});

test('Play-länkens referrer får kampanjen', () => {
  const url = 'https://play.google.com/store/apps/details?id=x&referrer=' +
    encodeURIComponent('utm_source=wagergolf.se&utm_medium=referral&utm_campaign=webb-dk');
  const out = withCampaign(url, 'qr-scorekort');
  const referrer = decodeURIComponent(new URL(out).searchParams.get('referrer'));
  assert.ok(referrer.includes('utm_campaign=qr-scorekort'));
  assert.ok(!referrer.includes('utm_campaign=webb-dk'));
});
