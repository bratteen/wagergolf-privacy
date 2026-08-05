const test = require('node:test');
const assert = require('node:assert');
const { sitemapDate, isoFromFrontmatter } = require('../lib/sitemap-date.js');

// Eleventys item.date för en fil som just checkats ut. Poängen med hela
// modulen är att den här inte ska vinna över ett datum ur frontmatter.
const MTIME = new Date('2026-08-05T17:00:00.000Z');

test('updated vinner över published och mtime', () => {
  assert.strictEqual(
    sitemapDate('2026-06-20', '2026-06-14', MTIME),
    '2026-06-20T00:00:00.000Z',
  );
});

test('published används när updated saknas', () => {
  assert.strictEqual(
    sitemapDate(null, '2026-06-14', MTIME),
    '2026-06-14T00:00:00.000Z',
  );
});

test('mtime är sista utväg, inte förstahandsval', () => {
  assert.strictEqual(sitemapDate(null, null, MTIME), MTIME.toISOString());
});

test('YAML-datum utan citattecken blir ett Date-objekt och ska funka ändå', () => {
  assert.strictEqual(
    sitemapDate(new Date('2026-06-20T00:00:00.000Z'), null, MTIME),
    '2026-06-20T00:00:00.000Z',
  );
});

test('skräpvärde faller igenom till nästa källa i stället för att krascha', () => {
  assert.strictEqual(sitemapDate('inte-ett-datum', '2026-06-14', MTIME),
    '2026-06-14T00:00:00.000Z');
  assert.strictEqual(sitemapDate('inte-ett-datum', null, MTIME), MTIME.toISOString());
});

test('omöjligt datum rullas inte över tyst', () => {
  // Intl och Date gör 2026-02-31 till 3 mars. Ett stavfel i frontmatter ska
  // falla igenom till nästa källa, inte tyst bli ett annat datum.
  assert.strictEqual(isoFromFrontmatter('2026-02-31'), null);
  assert.strictEqual(sitemapDate('2026-02-31', '2026-06-14', MTIME),
    '2026-06-14T00:00:00.000Z');
});

test('riktig skottdag accepteras', () => {
  assert.strictEqual(isoFromFrontmatter('2028-02-29'), '2028-02-29T00:00:00.000Z');
});
