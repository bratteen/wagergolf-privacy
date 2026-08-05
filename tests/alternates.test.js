const test = require('node:test');
const assert = require('node:assert');
const { alternatesFor } = require('../lib/alternates.js');
const routes = require('../_data/routes.js');

// Minimal stand-in för Eleventys collections.all.
const page = (lang, key, url) => ({ url, data: { lang, key } });

const ALL = [
  page('sv', 'guide:stableford', '/spelformer/stableford/'),
  page('da', 'guide:stableford', '/dk/spilformer/stableford/'),
  page('nb', 'guide:stableford', '/no/spilleformer/stableford/'),
  page('sv', 'page:about', '/om/'),
  page('en', 'guide:skins', '/en/game-formats/skins/'),
];

const many = { ...routes, publishedLocales: ['sv', 'nb', 'da', 'en'] };
const onlySv = { ...routes, publishedLocales: ['sv'] };

test('ett publicerat språk ger inga alternativ alls', () => {
  const out = alternatesFor(ALL, 'guide:stableford', onlySv);
  assert.deepStrictEqual(out.links, []);
  assert.strictEqual(out.xDefault, null);
});

test('flera språk ger en länk per publicerad översättning', () => {
  const out = alternatesFor(ALL, 'guide:stableford', many);
  assert.deepStrictEqual(
    out.links.map((l) => [l.hreflang, l.url]),
    [
      ['sv', '/spelformer/stableford/'],
      ['nb', '/no/spilleformer/stableford/'],
      ['da', '/dk/spilformer/stableford/'],
    ],
  );
});

test('x-default pekar på svenskan', () => {
  const out = alternatesFor(ALL, 'guide:stableford', many);
  assert.strictEqual(out.xDefault, '/spelformer/stableford/');
});

test('sida som saknar översättningar ger tomt, inte en ensam självlänk', () => {
  const out = alternatesFor(ALL, 'page:about', many);
  assert.deepStrictEqual(out.links, []);
  assert.strictEqual(out.xDefault, null);
});

test('opublicerat språk utelämnas även om sidan finns', () => {
  const utan_en = { ...routes, publishedLocales: ['sv', 'nb', 'da'] };
  const out = alternatesFor(ALL, 'guide:skins', utan_en);
  assert.deepStrictEqual(out.links, []);
  assert.strictEqual(out.xDefault, null);
});

test('sida utan key ger inga alternativ', () => {
  const out = alternatesFor(ALL, undefined, many);
  assert.deepStrictEqual(out.links, []);
});

test('hreflang tas ur språkkonfigurationen, aldrig ur sökvägen', () => {
  const out = alternatesFor(ALL, 'guide:stableford', many);
  const da = out.links.find((l) => l.url.startsWith('/dk/'));
  assert.strictEqual(da.hreflang, 'da');
});

test('två översättningar räcker för att listan ska skrivas ut', () => {
  const tva = [
    page('sv', 'page:invite', '/i/'),
    page('en', 'page:invite', '/en/invite/'),
  ];
  const out = alternatesFor(tva, 'page:invite', many);
  assert.deepStrictEqual(out.links.map((l) => l.hreflang), ['sv', 'en']);
  assert.strictEqual(out.xDefault, '/i/');
});

test('två sidor på samma språk med samma key fäller bygget', () => {
  // Uppstår när en översatt sida kopieras och key glöms bort i frontmatter.
  // Tyst publicering skulle ge två hreflang-rader för samma språkkod, och
  // Google ignorerar hela uppsättningen när den är motsägelsefull.
  const dubblett = [
    page('sv', 'page:home', '/'),
    page('sv', 'page:home', '/kopia/'),
    page('en', 'page:home', '/en/'),
  ];
  assert.throws(
    () => alternatesFor(dubblett, 'page:home', many),
    /finns två gånger på språket "sv"/,
  );
});
