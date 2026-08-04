const test = require('node:test');
const assert = require('node:assert');
const { byCategory } = require('../lib/by-category.js');

const guide = (lang, cat, slug, order) => ({ data: { lang, category: cat, slug, order } });

const guides = [
  guide('sv', 'Klassiker', 'slaggolf', 1),
  guide('sv', 'Klassiker', 'stableford', 2),
  guide('nb', 'Klassiker', 'slagspill', 1),
  guide('sv', 'Hålspel', 'matchspel', 1),
];

test('filtrerar på både kategori och språk', () => {
  const out = byCategory(guides, 'Klassiker', 'sv');
  assert.deepStrictEqual(out.map((g) => g.data.slug), ['slaggolf', 'stableford']);
});

test('en guide på ett annat språk läcker inte in i en annan språkversions pelarsida', () => {
  const out = byCategory(guides, 'Klassiker', 'sv');
  assert.ok(!out.some((g) => g.data.lang === 'nb'));
});

test('samma kategori på ett annat språk ger bara det språkets guider', () => {
  const out = byCategory(guides, 'Klassiker', 'nb');
  assert.deepStrictEqual(out.map((g) => g.data.slug), ['slagspill']);
});

test('sorterar på order', () => {
  const out = byCategory([guide('sv', 'X', 'b', 2), guide('sv', 'X', 'a', 1)], 'X', 'sv');
  assert.deepStrictEqual(out.map((g) => g.data.slug), ['a', 'b']);
});

test('saknad order faller tillbaka sist (99)', () => {
  const out = byCategory([guide('sv', 'X', 'utan-order', undefined), guide('sv', 'X', 'har-order', 1)], 'X', 'sv');
  assert.deepStrictEqual(out.map((g) => g.data.slug), ['har-order', 'utan-order']);
});
