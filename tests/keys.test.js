const test = require('node:test');
const assert = require('node:assert');
const { readFileSync, readdirSync } = require('node:fs');

// Sidor som ska ha en key. Guiderna får sin via guides.11tydata.js och
// kontrolleras inte här. robots, sitemap, llms och indexnow-key är inte
// sidor och ska inte ha någon.
const PAGES = [
  'index.njk', 'om.njk', 'ordlista.njk',
  'spelformer/index.njk',
  'spelformer/valja-spelform.njk',
  'spelformer/stableford-vs-slaggolf.njk',
  '404.njk', 'i/index.njk',
];

test('varje sida har en key i frontmatter', () => {
  for (const file of PAGES) {
    const src = readFileSync(file, 'utf8');
    assert.match(src, /^key:\s*\S+/m, `${file} saknar key`);
  }
});

test('ingen key är använd två gånger', () => {
  const seen = new Map();
  for (const file of PAGES) {
    const key = readFileSync(file, 'utf8').match(/^key:\s*(\S+)/m)[1];
    assert.ok(!seen.has(key), `${key} används av både ${seen.get(key)} och ${file}`);
    seen.set(key, file);
  }
});

test('varje guide har ett unikt slug, som blir dess key', () => {
  const dir = 'spelformer/guides';
  const slugs = readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => readFileSync(`${dir}/${f}`, 'utf8').match(/^slug:\s*(\S+)/m)[1]);
  assert.strictEqual(new Set(slugs).size, slugs.length, 'dubblett bland guidernas slug');
  assert.strictEqual(slugs.length, 21);
});
