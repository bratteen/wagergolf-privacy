const test = require('node:test');
const assert = require('node:assert');
const { readFileSync, readdirSync } = require('node:fs');
const { resolve } = require('node:path');
const routes = require('../_data/routes.js');

const ROOT = resolve(__dirname, '..');

function localeRoot(lang) {
  return routes.locales[lang].prefix.replace(/^\//, '') || '.';
}

function sourcePage(lang, key) {
  const root = localeRoot(lang);
  for (const file of readdirSync(resolve(ROOT, root)).filter((name) => name.endsWith('.njk'))) {
    const relative = root === '.' ? file : `${root}/${file}`;
    const source = readFileSync(resolve(ROOT, relative), 'utf8');
    if (source.includes(`key: ${key}`)) return { file: relative, source };
  }
  throw new Error(`${lang} saknar ${key}`);
}

const HOMES = Object.fromEntries(
  routes.publishedLocales.map((lang) => [lang, sourcePage(lang, 'page:home')]),
);
const MARKET_COPY_FILES = [
  ...routes.publishedLocales.flatMap((lang) => [HOMES[lang], sourcePage(lang, 'page:about')]),
  { file: 'llms.njk', source: readFileSync(resolve(ROOT, 'llms.njk'), 'utf8') },
];

for (const { file, source } of MARKET_COPY_FILES) {
  test(`${file}: innehåller ingen gammal Sverige-only-bankopia`, () => {
    assert.ok(!source.includes('705'), `${file} innehåller fortfarande 705`);
    assert.ok(!source.includes('1.5.3'), `${file} innehåller fortfarande 1.5.3`);
    assert.ok(
      !source.includes('Courses outside Sweden are not in the app'),
      `${file} säger fortfarande att banor utanför Sverige saknas`,
    );
    assert.ok(
      !source.includes('Baner uden for Sverige er ikke i appen'),
      `${file} säger fortfarande att banor utanför Sverige saknas`,
    );
    assert.ok(
      !source.includes('Baner utenfor Sverige er ikke i appen'),
      `${file} säger fortfarande att banor utanför Sverige saknas`,
    );
  });
}

test('lokala gratistilbud använder respektive marknads valuta', () => {
  const danish = readFileSync(resolve(ROOT, 'dk/index.njk'), 'utf8');
  const norwegian = readFileSync(resolve(ROOT, 'no/index.njk'), 'utf8');
  const english = readFileSync(resolve(ROOT, 'en/index.njk'), 'utf8');
  assert.ok(danish.includes('"priceCurrency": "DKK"'));
  assert.ok(norwegian.includes('"priceCurrency": "NOK"'));
  assert.ok(english.includes('"priceCurrency": "EUR"'));
});

test('version 1.7.1-kopian anger 3 028 banor men lovar inte en öppen internationell release', () => {
  for (const { source } of Object.values(HOMES)) {
    assert.match(source, /3[ ,.\u00a0]028/);
    assert.match(source, /1\.7\.1/);
    assert.ok(!/Now on the App Store|Nå på App Store|Nu i App Store/.test(source));
  }
});

test('gratisnivån, Pro och åldersgränsen beskrivs på alla startsidor', () => {
  const freeTier = {
    sv: /fem huvudspelformer/i,
    nb: /fem hovedspill/i,
    da: /fem hovedspil/i,
    en: /five main game formats/i,
    fi: /viisi pääpelimuotoa/i,
    nl: /vijf hoofdspelvormen/i,
    de: /fünf Hauptspielformen/i,
    fr: /cinq formules principales/i,
    es: /cinco modalidades principales/i,
    it: /cinque formule principali/i,
    pt: /cinco modalidades principais/i,
  };
  for (const [lang, { source }] of Object.entries(HOMES)) {
    assert.match(source, freeTier[lang], `${lang}: gratisnivå`);
    assert.match(source, /14/, `${lang}: provperiod`);
    assert.match(source, /17/, `${lang}: åldersgräns`);
    assert.match(source, /Pro/i, `${lang}: Pro`);
  }
});

test('alla eurolokaler visar samma belopp med lokalt decimalformat', () => {
  for (const lang of ['en', 'fi', 'nl', 'de', 'fr', 'es', 'it', 'pt']) {
    const decimal = lang === 'en' ? '\\.' : ',';
    assert.match(HOMES[lang].source, new RegExp(`4${decimal}99`), `${lang}: månadspris`);
    assert.match(HOMES[lang].source, new RegExp(`29${decimal}99`), `${lang}: årspris`);
  }
});
