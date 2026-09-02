const test = require('node:test');
const assert = require('node:assert');
const { readdirSync } = require('node:fs');
const path = require('node:path');
const routes = require('../_data/routes.js');

// Kontraktet varje språkfil måste uppfylla. Ett nytt språk läggs till genom
// att släppa en <lang>.json i _data/i18n/ — testet nedan hittar filen
// automatiskt via readdirSync, den behöver inte nämnas här.
const REQUIRED = [
  'skipLink',
  'nav.features', 'nav.formats', 'nav.download',
  'nav.primaryLabel', 'nav.mobileLabel', 'nav.unavailable', 'nav.soon',
  'breadcrumb.home',
  'byline.by', 'byline.updated',
  'faq.heading',
  'guide.ctaHeading', 'guide.ctaText', 'guide.related',
  'article.related', 'article.ctaText',
  'footer.formats', 'footer.glossary', 'footer.about',
  'footer.privacy', 'footer.terms', 'footer.contact', 'footer.tagline',
  'footer.navigationLabel',
  'store.sub', 'store.unavailable',
  'switcher.label',
  'banner.text', 'banner.close',
];

function get(obj, dotted) {
  return dotted.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}

// Plattar ut ett nästlat objekt till dotted paths: { a: { b: 1 } } -> ['a.b'].
// Används för att hitta ÖVERFLÖDIGA nycklar, som get()/REQUIRED inte fångar.
function flatten(obj, prefix) {
  let out = [];
  for (const k of Object.keys(obj)) {
    const dotted = prefix ? `${prefix}.${k}` : k;
    const v = obj[k];
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      out = out.concat(flatten(v, dotted));
    } else {
      out.push(dotted);
    }
  }
  return out;
}

const i18nDir = path.join(__dirname, '..', '_data', 'i18n');
const files = readdirSync(i18nDir).filter((f) => f.endsWith('.json'));

// README påstår att detta test "låser schemat och stoppar bygget om en
// nyckel saknas eller är överflödig" för VARJE språkfil. Innan den här
// omskrivningen läste testet bara sv.json och kontrollerade aldrig
// överflödiga nycklar — ett påstående som inte stämde för nb/da/en.json.
// En saknad nyckel i en publicerad språkfil renderar tyst tom sträng på en
// riktig sida, utan byggfel, vilket är precis vad detta ska förhindra.
for (const file of files) {
  const data = require(path.join(i18nDir, file));

  test(`${file}: har alla nycklar i kontraktet`, () => {
    for (const key of REQUIRED) {
      const value = get(data, key);
      assert.ok(typeof value === 'string' && value.length > 0, `${file} saknar ${key}`);
    }
  });

  test(`${file}: har inga överflödiga nycklar`, () => {
    const actual = flatten(data).sort();
    const required = [...REQUIRED].sort();
    const extra = actual.filter((k) => !required.includes(k));
    assert.deepStrictEqual(extra, [], `${file} har nycklar som inte finns i kontraktet: ${extra.join(', ')}`);
  });
}

test('minst sv.json finns och testas', () => {
  assert.ok(files.includes('sv.json'));
});

test('varje publicerat språk har en egen språkfil', () => {
  assert.deepStrictEqual(
    routes.publishedLocales.map((lang) => `${lang}.json`).sort(),
    files.sort(),
  );
});

test('guide.ctaHeading har platshållaren för spelformens namn', () => {
  const sv = require(path.join(i18nDir, 'sv.json'));
  assert.ok(sv.guide.ctaHeading.includes('{format}'));
});

test('banner.text har platshållaren för språknamnet', () => {
  const sv = require(path.join(i18nDir, 'sv.json'));
  assert.ok(sv.banner.text.includes('{language}'));
});
