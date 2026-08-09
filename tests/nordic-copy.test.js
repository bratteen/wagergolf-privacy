const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

function contentUnder(relativeDir) {
  const dir = path.join(ROOT, relativeDir);
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return contentUnder(path.relative(ROOT, file));
    if (!/\.(?:json|md|njk)$/.test(entry.name)) return [];
    return [{ file: path.relative(ROOT, file), source: fs.readFileSync(file, 'utf8') }];
  });
}

function contentFile(relativeFile) {
  return {
    file: relativeFile,
    source: fs.readFileSync(path.join(ROOT, relativeFile), 'utf8'),
  };
}

function assertNoPatterns(files, patterns) {
  const findings = [];
  for (const { file, source } of files) {
    for (const [label, pattern] of patterns) {
      if (pattern.test(source)) findings.push(`${file}: ${label}`);
    }
  }
  assert.deepStrictEqual(findings, []);
}

test('danska texter innehåller inte kända direktöversättningar', () => {
  assertNoPatterns([...contentUnder('dk'), contentFile('_data/i18n/da.json')], [
    ['når I går ind', /når I går ind/i],
    ['spilfirma', /\bspilfirma\b/i],
    ['singlespiller', /\bsinglespiller\b/i],
    ['handicappen', /\bhandicappen\b/i],
    ['den laveste handicap', /\bden laveste handicap\b/i],
    ['Wager Golf scorekort', /Wager Golf scorekort/i],
    ['Wager Golf live-scorekort', /Wager Golf live-scorekort/i],
    ['Wager Golf opgørelse', /Wager Golf opgørelse/i],
    ['Wager Golf sæsonsaldo', /Wager Golf sæsonsaldo/i],
    ['stroke-index', /stroke-index/i],
    ['Best-ball', /best-ball/i],
  ]);
});

test('norska texter innehåller inte kända direktöversättningar', () => {
  assertNoPatterns([...contentUnder('no'), contentFile('_data/i18n/nb.json')], [
    ['når dere går inn', /når dere går inn/i],
    ['singelspiller', /\bsingelspiller\b/i],
    ['uttregning', /\buttregning\b/i],
    ['nettoet', /\bnettoet\b/i],
    ['handicapen', /\bhandicapen\b/i],
    ['lag-handicap', /\blag-handicap(?:en)?\b/i],
    ['substantivisk ligge', /\b(?:beste ligge|beste ligget|partnerens ligge|spiller ligget|fra hvert ligge|fra det ligget|fritt ligge|velg ligge)\b/i],
    ['Wager Golf scorekort', /Wager Golf scorekort/i],
    ['Wager Golf live-scorekort', /Wager Golf live-scorekort/i],
    ['Wager Golf oppgjør', /Wager Golf oppgjør/i],
    ['Wager Golf sesongsaldo', /Wager Golf sesongsaldo/i],
    ['Sesongsaldo med topplisten', /Sesongsaldo(?:,| og) topplisten/i],
    ['stroke-index', /stroke-index/i],
    ['Best-ball', /best-ball/i],
  ]);
});
