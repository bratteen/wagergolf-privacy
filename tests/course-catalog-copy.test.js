const test = require('node:test');
const assert = require('node:assert');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const ROOT = resolve(__dirname, '..');
const MARKET_COPY_FILES = [
  'index.njk',
  'om.njk',
  'llms.njk',
  'en/index.njk',
  'en/about.njk',
  'dk/index.njk',
  'dk/om-os.njk',
  'no/index.njk',
  'no/om-oss.njk',
];

for (const file of MARKET_COPY_FILES) {
  test(`${file}: innehåller ingen gammal Sverige-only-bankopia`, () => {
    const source = readFileSync(resolve(ROOT, file), 'utf8');
    assert.ok(!source.includes('705'), `${file} innehåller fortfarande 705`);
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
  assert.ok(danish.includes('"priceCurrency": "DKK"'));
  assert.ok(norwegian.includes('"priceCurrency": "NOK"'));
});
