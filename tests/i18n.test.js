const test = require('node:test');
const assert = require('node:assert');
const sv = require('../_data/i18n/sv.json');

// Kontraktet varje språkfil måste uppfylla. Senare vågor lägger till
// nb.json, da.json och en.json och kör samma kontroll mot dem.
const REQUIRED = [
  'nav.features', 'nav.formats', 'nav.download',
  'breadcrumb.home',
  'byline.by', 'byline.updated',
  'faq.heading',
  'guide.ctaHeading', 'guide.ctaText', 'guide.related',
  'article.related', 'article.ctaText',
  'footer.formats', 'footer.glossary', 'footer.about',
  'footer.privacy', 'footer.terms', 'footer.contact', 'footer.tagline',
  'store.sub',
  'switcher.label',
  'banner.text', 'banner.close',
];

function get(obj, dotted) {
  return dotted.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}

test('sv.json har alla nycklar i kontraktet', () => {
  for (const key of REQUIRED) {
    const value = get(sv, key);
    assert.ok(typeof value === 'string' && value.length > 0, `saknar ${key}`);
  }
});

test('guide.ctaHeading har platshållaren för spelformens namn', () => {
  assert.ok(sv.guide.ctaHeading.includes('{format}'));
});

test('banner.text har platshållaren för språknamnet', () => {
  assert.ok(sv.banner.text.includes('{language}'));
});
