const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { responsiveTables } = require('../lib/responsive-tables.js');

test('breda tabeller får varsin fokuserbar rullyta namngiven av sin caption', () => {
  const html = responsiveTables('<h2 id="article-table-caption-1">Skillnader</h2>'
    + '<table><caption>Stableford &amp; slaggolf</caption><tr><th scope="col">Spelform</th></tr></table>'
    + '<table><caption>Poäng per hål</caption><tr><td>2</td></tr></table>');

  assert.match(html, /<div class="table-scroll" tabindex="0" role="region" aria-labelledby="article-table-caption-2"><table><caption id="article-table-caption-2">Stableford &amp; slaggolf<\/caption>/);
  assert.match(html, /aria-labelledby="article-table-caption-3"><table><caption id="article-table-caption-3">Poäng per hål<\/caption>/);
  assert.match(html, /<th scope="col">Spelform<\/th>/);
  assert.equal((html.match(/<\/table><\/div>/g) || []).length, 2);
});

test('befintliga caption-id:n och innehåll bevaras', () => {
  const table = '<table class="comparison"><caption id="comparison">A <em>och</em> B</caption><tr><td>10</td></tr></table>';
  const html = responsiveTables(table);
  assert.match(html, /aria-labelledby="comparison"/);
  assert.ok(html.includes(table));
  assert.equal(responsiveTables('<p>En artikel utan tabell.</p>'), '<p>En artikel utan tabell.</p>');
});

test('byggda Stableford-jämförelsen behåller båda tabellerna med tillgänglig rullning', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', '_site', 'spelformer', 'stableford-vs-slaggolf', 'index.html'), 'utf8');
  const regions = [...html.matchAll(/<div class="table-scroll" tabindex="0" role="region" aria-labelledby="([^"]+)">(<table\b[\s\S]*?<\/table>)<\/div>/g)];
  assert.equal(regions.length, 2);
  for (const [, captionId, table] of regions) {
    assert.ok(table.includes(`<caption id="${captionId}">`));
    assert.match(table, /<thead>/);
    assert.match(table, /<tbody>/);
  }
});
