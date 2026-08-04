const test = require('node:test');
const assert = require('node:assert');
const routes = require('../_data/routes.js');

test('svenska ligger i roten utan prefix', () => {
  assert.strictEqual(routes.locales.sv.prefix, '');
});

test('marknadsbaserade prefix, språkbaserad hreflang', () => {
  assert.strictEqual(routes.locales.da.prefix, '/dk');
  assert.strictEqual(routes.locales.da.hreflang, 'da');
  assert.strictEqual(routes.locales.nb.prefix, '/no');
  assert.strictEqual(routes.locales.nb.hreflang, 'nb');
});

test('ingen hreflang är en landskod', () => {
  const forbidden = new Set(['dk', 'se', 'no-NO', 'gb']);
  for (const [lang, cfg] of Object.entries(routes.locales)) {
    assert.ok(!forbidden.has(cfg.hreflang), `${lang} har ogiltig hreflang ${cfg.hreflang}`);
  }
});

test('bara svenska är publicerat i våg 1', () => {
  assert.deepStrictEqual(routes.publishedLocales, ['sv']);
});

test('pathFor bygger lokaliserade sökvägar', () => {
  assert.strictEqual(routes.pathFor('sv', 'formats', 'stableford'), '/spelformer/stableford/');
  assert.strictEqual(routes.pathFor('da', 'formats', 'stableford'), '/dk/spilformer/stableford/');
  assert.strictEqual(routes.pathFor('en', 'formats'), '/en/game-formats/');
  assert.strictEqual(routes.pathFor('sv', 'about'), '/om/');
});

test('downloadPath är en färdig sökväg, inte ett segment', () => {
  assert.strictEqual(routes.locales.sv.downloadPath, '/ladda-ner');
  assert.strictEqual(routes.locales.nb.downloadPath, '/ladda-ner?l=nb');
  assert.strictEqual(routes.locales.da.downloadPath, '/ladda-ner?l=da');
  assert.strictEqual(routes.locales.en.downloadPath, '/ladda-ner?l=en');
});

test('svenskans downloadPath saknar avslutande snedstreck', () => {
  // functions/ladda-ner.js matchar /ladda-ner utan slash. Ett avslutande
  // snedstreck skulle ge 404 på sajtens primära CTA.
  assert.ok(!routes.locales.sv.downloadPath.endsWith('/'));
});

test('segmentfältet download finns inte kvar', () => {
  // Det förledde till pathFor(lang, 'download'), som lägger på ett avslutande
  // snedstreck och därmed bryter knappen. En färdig downloadPath tar bort
  // fotgillret i stället för att dokumentera det.
  for (const [lang, cfg] of Object.entries(routes.locales)) {
    assert.strictEqual(cfg.download, undefined, `${lang} har kvar download`);
  }
});
