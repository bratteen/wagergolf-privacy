const test = require('node:test');
const assert = require('node:assert');
const { guideGraph } = require('../lib/structured-data.js');

const ARGS = {
  base: 'https://wagergolf.se',
  url: 'https://wagergolf.se/spelformer/stableford/',
  lang: 'sv',
  format: 'Stableford',
  h1: 'Stableford (poängbogey) i golf',
  title: 'Stableford | Wager Golf',
  description: 'Poängtabellen och hur poängen räknas.',
  published: '2026-06-14',
  updated: '2026-06-20',
  image: 'https://wagergolf.se/assets/og-image.png',
  faq: [{ q: 'Fråga?', a: 'Svar.' }],
  breadcrumbHome: 'Hem',
  breadcrumbFormats: 'Spelformer',
  formatsUrl: 'https://wagergolf.se/spelformer/',
};

test('inLanguage följer språket', () => {
  const sv = JSON.parse(guideGraph(ARGS));
  const article = sv['@graph'].find((n) => n['@type'] === 'Article');
  assert.strictEqual(article.inLanguage, 'sv-SE');

  const da = JSON.parse(guideGraph({ ...ARGS, lang: 'da' }));
  const daArticle = da['@graph'].find((n) => n['@type'] === 'Article');
  assert.strictEqual(daArticle.inLanguage, 'da-DK');
});

test('breadcrumb använder de skickade namnen', () => {
  const graph = JSON.parse(guideGraph({
    ...ARGS, breadcrumbHome: 'Home', breadcrumbFormats: 'Game formats',
  }));
  const crumbs = graph['@graph'].find((n) => n['@type'] === 'BreadcrumbList');
  assert.deepStrictEqual(crumbs.itemListElement.map((i) => i.name),
    ['Home', 'Game formats', 'Stableford']);
});

test('FAQPage läggs bara till när det finns frågor', () => {
  const utan = JSON.parse(guideGraph({ ...ARGS, faq: [] }));
  assert.ok(!utan['@graph'].some((n) => n['@type'] === 'FAQPage'));

  const med = JSON.parse(guideGraph(ARGS));
  assert.ok(med['@graph'].some((n) => n['@type'] === 'FAQPage'));
});

test('dateModified faller tillbaka på published', () => {
  const graph = JSON.parse(guideGraph({ ...ARGS, updated: null }));
  const article = graph['@graph'].find((n) => n['@type'] === 'Article');
  assert.strictEqual(article.dateModified, '2026-06-14');
});
