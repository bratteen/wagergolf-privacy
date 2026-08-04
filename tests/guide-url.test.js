const test = require('node:test');
const assert = require('node:assert');
const { guideUrl } = require('../lib/guide-url.js');

const guides = [
  { url: '/spelformer/slaggolf/', data: { lang: 'sv', slug: 'slaggolf', key: 'guide:slaggolf' } },
  { url: '/dk/spilformer/slagspil/', data: { lang: 'da', slug: 'slagspil', key: 'guide:slaggolf' } },
];

test('hittar guiden i sidans eget språk', () => {
  assert.strictEqual(guideUrl(guides, 'slaggolf', 'sv'), '/spelformer/slaggolf/');
  assert.strictEqual(guideUrl(guides, 'slaggolf', 'da'), '/dk/spilformer/slagspil/');
});

test('nyckeln är språkoberoende, inte det översatta sluggen', () => {
  // "slagspil" är danskans slug, men uppslag sker alltid på svenska nyckeln.
  assert.throws(() => guideUrl(guides, 'slagspil', 'da'), /slagspil/);
});

test('saknad översättning fälls högljutt, inte tyst till 404', () => {
  assert.throws(() => guideUrl(guides, 'slaggolf', 'nb'), /nb/);
});
