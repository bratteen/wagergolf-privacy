const test = require('node:test');
const assert = require('node:assert');
const { readdirSync, readFileSync, existsSync } = require('node:fs');
const routes = require('../_data/routes.js');
const fiGuides = require('../_data/fiGuides.js');

// Ett språk får inte stå i publishedLocales förrän varje svensk sida har en
// motsvarighet. Halvöversatta språk i sitemap och hreflang ger tunna sidor i
// indexet och drar ner hela domänen, inte bara sig själva — och en besökare
// som klickar språkväljaren och landar på en 404 kommer inte tillbaka.
//
// Testet gör regeln mekanisk i stället för en notering i README som någon
// ska komma ihåg. Det listar dessutom exakt vad som fattas, så det fungerar
// som checklista under översättningsarbetet.

/** Alla key-värden i en katalog med .njk/.md-sidor, rekursivt. */
function keysUnder(dir) {
  const keys = new Set();
  if (!existsSync(dir)) return keys;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      for (const k of keysUnder(path)) keys.add(k);
    } else if (/\.(njk|md)$/.test(entry.name)) {
      const m = readFileSync(path, 'utf8').match(/^key:\s*(\S+)/m);
      if (m) keys.add(m[1]);
    }
  }
  return keys;
}

function generatedKeys(lang) {
  if (lang === 'fi') return new Set(fiGuides.map((g) => `guide:${g.key}`));
  return new Set();
}

/** Svenskans nycklar: rotens sidor plus guiderna. Guidernas key sätts av
 *  katalogdatan som `guide:<slug>`, inte i frontmatter, så de härleds. */
function swedishKeys() {
  const keys = new Set();
  for (const f of ['index.njk', 'om.njk', 'ordlista.njk', '404.njk', 'i/index.njk']) {
    const m = readFileSync(f, 'utf8').match(/^key:\s*(\S+)/m);
    if (m) keys.add(m[1]);
  }
  for (const f of readdirSync('spelformer').filter((x) => x.endsWith('.njk'))) {
    const m = readFileSync(`spelformer/${f}`, 'utf8').match(/^key:\s*(\S+)/m);
    if (m) keys.add(m[1]);
  }
  for (const f of readdirSync('spelformer/guides').filter((x) => x.endsWith('.md'))) {
    const slug = readFileSync(`spelformer/guides/${f}`, 'utf8').match(/^slug:\s*(\S+)/m)[1];
    keys.add(`guide:${slug}`);
  }
  return keys;
}

const SV = swedishKeys();

for (const lang of routes.publishedLocales) {
  if (lang === routes.defaultLocale) continue;

  test(`${lang} är publicerat och måste därför vara komplett`, () => {
    const dir = routes.locales[lang].prefix.replace(/^\//, '');
    const has = keysUnder(dir);
    for (const key of generatedKeys(lang)) has.add(key);
    const missing = [...SV].filter((k) => !has.has(k)).sort();
    assert.deepStrictEqual(
      missing,
      [],
      `${lang} saknar ${missing.length} av ${SV.size} sidor:\n  ${missing.join('\n  ')}`,
    );
  });
}

test('svenskan har de sidor testet förväntar sig', () => {
  // Skyddar mot att uppräkningen ovan tyst slutar hitta sidor, t.ex. om en
  // katalog döps om. 21 guider + 5 rotsidor + 3 spelformssidor.
  assert.strictEqual(SV.size, 29, `hittade ${SV.size} svenska nycklar, väntade 29`);
});
