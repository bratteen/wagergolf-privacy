const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { insertGuidePromotion } = require('../lib/guide-promotion.js');
const promotion = require('../_data/guidePromotion.js');
const routes = require('../_data/routes.js');

test('app offer follows the complete rules section without splitting the points table', () => {
  const explanation = '<h2>What is it?</h2><p>Explanation.</p>';
  const rules = '<h2>Points</h2><div><table><tbody><tr><td>2</td></tr></tbody></table></div><p>Rare scores.</p>';
  const rest = '<h2>Handicap</h2><p>More detail.</p>';
  assert.equal(insertGuidePromotion(explanation + rules + rest, '<aside>App</aside>'),
    explanation + rules + '<aside>App</aside>' + rest);
  assert.equal(insertGuidePromotion(explanation, '<aside>App</aside>'), explanation + '<aside>App</aside>');
});

test('moves the matching old screenshot but retains different figures', () => {
  const image = '/assets/shots/en/live.webp';
  const duplicate = `<figure class="guide-figure"><img src="${image}"><figcaption>Old caption</figcaption></figure>`;
  const other = '<figure class="guide-figure"><img src="/assets/shots/en/home.webp"></figure>';
  const illustration = `<figure class="diagram"><img src="${image}"></figure>`;
  const html = `<h2>Rules</h2><p>Content</p>${duplicate}${other}${illustration}`;
  const result = insertGuidePromotion(html, '<aside>App</aside>', image);
  assert.ok(!result.includes('Old caption'));
  assert.ok(result.includes(other));
  assert.ok(result.includes(illustration));
});

test('every published language has complete, truthful screenshot labeling', () => {
  assert.deepEqual(Object.keys(promotion).sort(), [...routes.publishedLocales].sort());
  for (const lang of routes.publishedLocales) {
    for (const variant of ['default', 'stableford', 'greensome']) {
      const data = promotion[lang][variant];
      for (const field of ['title', 'body', 'image', 'imageAlt', 'imageCaption', 'reassurance']) {
        assert.ok(data[field]?.trim(), `${lang}/${variant}: ${field}`);
      }
      assert.ok(fs.existsSync(path.join(__dirname, '..', data.image)), data.image);
      assert.match(data.imageAlt, /Skins/);
      assert.match(data.imageCaption, /Skins/);
      assert.equal(data.image, `/assets/shots/${lang === 'sv' ? '' : `${lang}/`}live.webp`);
    }
  }
});

function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? htmlFiles(file) : file.endsWith('.html') ? [file] : [];
  });
}

test('rendered guides expose one early offer, localized copy, and a download anchor', () => {
  let guides = 0;
  for (const file of htmlFiles(path.join(__dirname, '../_site'))) {
    const html = fs.readFileSync(file, 'utf8');
    if (!html.includes('class="guide-meta-row"')) {
      assert.ok(!html.includes('data-download-campaign="guides"'), file);
      continue;
    }
    guides++;
    assert.ok(/<body[^>]*data-download-campaign="guides"/.test(html), file);
    assert.equal([...html.matchAll(/id="download-app"/g)].length, 1, file);
    const card = html.match(/<aside class="guide-promo"[^>]*>[\s\S]*?<\/aside>/)?.[0];
    assert.ok(card, file);
    assert.match(card, /aria-labelledby="guide-promo-title" data-download-anchor tabindex="-1"/);
    assert.ok(html.indexOf(card) < html.indexOf('class="faq"'), file);
    const source = card.match(/<img src="([^"]*)"/)?.[1];
    assert.equal([...html.matchAll(/<img\b[^>]*src="([^"]*)"/g)].filter((m) => m[1] === source).length, 1, file);
    const before = html.slice(html.indexOf('<article'), html.indexOf(card));
    assert.equal([...before.matchAll(/<h2\b/g)].length, 2, file);
    assert.match(card, /data-release-ios-open hidden data-store-link/);
    assert.match(card, /data-release-android-open hidden data-store-link/);
  }
  assert.ok(guides >= 220, `Expected all localized guides, found ${guides}`);
});
