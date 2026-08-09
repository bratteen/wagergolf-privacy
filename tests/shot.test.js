const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { shotPath } = require('../lib/shot.js');

const ROOT = path.join(__dirname, '..');

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.') || entry.name === '_site' || entry.name === 'node_modules') {
      return [];
    }
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(file);
    return /\.(?:md|njk)$/.test(entry.name) ? [file] : [];
  });
}

test('sidans eget språk vinner när bilden finns', () => {
  assert.strictEqual(
    shotPath('live', 'nb', ['nb/live', 'en/live']),
    '/assets/shots/nb/live.webp',
  );
});

test('engelska är reserv före den delade bilden', () => {
  // En nederländsk besökare förstår ett engelskt gränssnitt. Ett svenskt
  // ser bara fel ut.
  assert.strictEqual(
    shotPath('live', 'nl', ['en/live']),
    '/assets/shots/en/live.webp',
  );
});

test('utan lokaliserad bild används den delade', () => {
  assert.strictEqual(shotPath('live', 'da', []), '/assets/shots/live.webp');
  assert.strictEqual(shotPath('live', 'da', ['en/settlement']), '/assets/shots/live.webp');
});

test('varje bild slås upp för sig', () => {
  // Har man hunnit lokalisera en av tre ska de andra två falla tillbaka,
  // inte dras med.
  const har = ['da/live'];
  assert.strictEqual(shotPath('live', 'da', har), '/assets/shots/da/live.webp');
  assert.strictEqual(shotPath('settlement', 'da', har), '/assets/shots/settlement.webp');
});

test('svenska faller till den delade, inte till engelska', () => {
  // De delade bilderna ÄR de svenska. En sv/-katalog vore en onödig dubblett,
  // och att skicka svenska besökare till engelska skärmbilder vore fel väg.
  assert.strictEqual(shotPath('live', 'sv', ['en/live']), '/assets/shots/live.webp');
});

test('saknad eller tom lista kraschar inte bygget', () => {
  assert.strictEqual(shotPath('live', 'nb', undefined), '/assets/shots/live.webp');
  assert.strictEqual(shotPath('live', undefined, ['en/live']), '/assets/shots/en/live.webp');
});

test('varje shortcode har en fysisk delad reservbild', () => {
  const names = new Set();
  const pattern = /{%\s*shot\s+"([^"]+)"\s*%}/g;

  for (const file of sourceFiles(ROOT)) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(pattern)) names.add(match[1]);
  }

  assert.ok(names.size > 0, 'hittade inga shot-shortcodes i innehållet');
  for (const name of names) {
    const fallback = path.join(ROOT, 'assets', 'shots', `${name}.webp`);
    assert.ok(fs.existsSync(fallback), `saknad reservbild: ${fallback}`);
  }
});
