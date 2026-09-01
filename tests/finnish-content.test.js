const test = require('node:test');
const assert = require('node:assert');
const { readFileSync, readdirSync } = require('node:fs');
const { resolve } = require('node:path');
const routes = require('../_data/routes.js');
const terms = require('../_data/terms.js');
const guides = require('../_data/fiGuides.js');

const expected = [
  'bastboll', 'bingo-bango-bongo', 'birdiepott', 'foursome', 'golfpoker',
  'greensome', 'klubbroulette', 'langst-drive', 'matchspel', 'narmast-flaggan',
  'nassau', 'quota', 'sandie', 'scramble', 'skins', 'slaggolf', 'snake',
  'split-sixes', 'stableford', 'vegas', 'wolf',
].sort();

test('finska har exakt alla 21 pelimuotoa', () => {
  assert.deepStrictEqual(guides.map((g) => g.key).sort(), expected);
  assert.strictEqual(new Set(guides.map((g) => g.slug)).size, 21);
});

test('finska namn och slugit vastaavat termipankkia', () => {
  for (const guide of guides) {
    assert.strictEqual(guide.format, terms.FORMATS[guide.key].fi.name, guide.key);
    assert.strictEqual(guide.slug, terms.FORMATS[guide.key].fi.slug, guide.key);
  }
});

test('jokaisella oppaalla on säännöt, tasoitus, esimerkki ja FAQ', () => {
  for (const guide of guides) {
    assert.ok(guide.rules.length >= 4, `${guide.key}: liian vähän sääntöjä`);
    assert.ok(guide.handicap.length > 20, `${guide.key}: tasoitus puuttuu`);
    assert.ok(guide.example.length > 20, `${guide.key}: esimerkki puuttuu`);
    assert.ok(guide.faq.length >= 3, `${guide.key}: FAQ puuttuu`);
  }
});

test('finska är byggd men spärrad från indexering och publiceringslistor', () => {
  assert.ok(routes.locales.fi);
  assert.ok(!routes.publishedLocales.includes('fi'));
  const base = readFileSync(resolve(__dirname, '..', '_includes/base.njk'), 'utf8');
  assert.match(base, /name="robots" content="noindex"/);
});

test('finska använder engelsk juridik som uttrycklig fallback', () => {
  const base = readFileSync(resolve(__dirname, '..', '_includes/base.njk'), 'utf8');
  const copy = require('../_data/i18n/fi.json');
  assert.match(base, /\/privacy\/#english/);
  assert.match(base, /\/terms\/#english/);
  assert.match(copy.footer.privacy, /englanniksi/);
  assert.match(copy.footer.terms, /englanniksi/);
});

test('finska källsidor saknar uppenbara svenska UI-rester', () => {
  const files = readdirSync(resolve(__dirname, '..', 'fi'), { recursive: true })
    .filter((name) => /\.(?:njk|md)$/.test(name));
  const findings = [];
  const patterns = [
    /\bLadda ner\b/i, /\bSpelformer\b/i, /\bNärmast flaggan\b/i,
    /\bAnvändarvillkor\b/i, /\bIntegritetspolicy\b/i,
  ];
  for (const file of files) {
    const source = readFileSync(resolve(__dirname, '..', 'fi', file), 'utf8');
    for (const pattern of patterns) if (pattern.test(source)) findings.push(`${file}: ${pattern}`);
  }
  assert.deepStrictEqual(findings, []);
});
