const test = require('node:test');
const assert = require('node:assert');
const { readFileSync } = require('node:fs');
const routes = require('../_data/routes.js');

// publishedLocales finns i tre kopior. Cloudflare-funktioner byggs separat
// från Eleventy: .eleventy.js passthrough-kopierar functions/ in i _site/, och
// _data/ följer inte med, så de kan inte importera routes.js.
//
// Kopiorna har redan glidit isär en gång: /en/ publicerades i _data/routes.js
// men inte i functions/go.js, vilket gjorde att /go?l=en tyst skickade
// engelska besökare till svenska sajten. Inget larmade. Nu gör det det.
const KOPIOR = ['functions/go.js', 'functions/i/[[path]].js'];

function publishedIn(file) {
  const m = readFileSync(file, 'utf8').match(/const PUBLISHED = \[([^\]]*)\]/);
  assert.ok(m, `${file}: hittade ingen PUBLISHED-lista`);
  return m[1]
    .split(',')
    .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

for (const file of KOPIOR) {
  test(`${file} speglar publishedLocales i _data/routes.js`, () => {
    assert.deepStrictEqual(
      publishedIn(file),
      routes.publishedLocales,
      `${file} är ur synk. Läggs ett språk till i _data/routes.js måste det ` +
        `läggas till här också, annars får språkets besökare svenska utan att ` +
        `något larmar.`,
    );
  });
}
