const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const routes = require('../_data/routes.js');

const ROOT = path.join(__dirname, '..');
const LANGS = ['fi', 'nl', 'de', 'fr', 'es', 'it', 'pt'];

function contentUnder(relativeDir) {
  const directory = path.join(ROOT, relativeDir);
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) return contentUnder(relative);
    if (!/\.(?:md|njk)$/.test(entry.name)) return [];
    return [{ file: relative, source: fs.readFileSync(path.join(ROOT, relative), 'utf8') }];
  });
}

function localeFiles(lang) {
  return contentUnder(routes.locales[lang].prefix.replace(/^\//, ''));
}

test('alla nya startsidor använder den godkända ära-öppnaren', () => {
  const expected = {
    fi: 'Kyllästynyt pelaamaan vain <span class="accent">kunniasta?</span>',
    nl: 'Genoeg van spelen <span class="accent">voor de eer?</span>',
    de: 'Keine Lust mehr, nur um <span class="accent">die Ehre zu spielen?</span>',
    fr: 'Marre de ne jouer que <span class="accent">pour l’honneur&nbsp;?</span>',
    es: '¿Te cansa jugar solo <span class="accent">por el honor?</span>',
    it: 'Basta giocare solo <span class="accent">per la gloria?</span>',
    pt: 'Chega de jogar só <span class="accent">pela honra?</span>',
  };
  for (const [lang, copy] of Object.entries(expected)) {
    const source = fs.readFileSync(path.join(ROOT, lang, 'index.njk'), 'utf8');
    assert.ok(source.includes(copy), lang);
  }
});

test('de sju eurolokalerna läcker ingen nordisk betalningsleverantör eller valuta', () => {
  const findings = [];
  for (const lang of LANGS) {
    for (const { file, source } of localeFiles(lang)) {
      if (/(?<![\p{L}\p{N}_])(?:Swish|Vipps|MobilePay|SEK|DKK|NOK)(?![\p{L}\p{N}_])/iu.test(source)) {
        findings.push(file);
      }
      if (/(^|[^\p{L}\p{N}_])kr([^\p{L}\p{N}_]|$)/iu.test(source)) findings.push(file);
    }
  }
  assert.deepStrictEqual(findings, []);
});

test('publicerad europeisk copy innehåller inga platshållare eller em dash', () => {
  const findings = [];
  for (const lang of LANGS) {
    for (const { file, source } of localeFiles(lang)) {
      if (/(?:TODO|TRANSLATE)/.test(source) || /Lorem ipsum/i.test(source) || source.includes('—')) {
        findings.push(file);
      }
    }
  }
  assert.deepStrictEqual(findings, []);
});

test('varje ny lokal har 21 fullständiga guideartiklar', () => {
  for (const lang of LANGS) {
    const guides = localeFiles(lang).filter(({ file }) => file.includes(`${path.sep}spelformer${path.sep}guides${path.sep}`));
    assert.strictEqual(guides.length, 21, `${lang}: ${guides.length} guider`);
    for (const { file, source } of guides) {
      const body = source.replace(/^---[\s\S]*?---\s*/m, '');
      assert.ok(body.length >= 1100, `${file} är för tunn (${body.length} tecken)`);
      assert.ok((body.match(/^## /gm) || []).length >= 3, `${file} saknar artikelstruktur`);
    }
  }
});
