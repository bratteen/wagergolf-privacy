const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const site = require('../_data/site.js');
const routes = require('../_data/routes.js');

const OUTPUT = path.resolve(__dirname, '../_site');
const decode = (value) => value.replace(/&(amp|lt|gt|quot|apos|#x[\da-f]+|#\d+);/gi, (_, entity) => {
  if (entity.startsWith('#')) return String.fromCodePoint(parseInt(entity.slice(entity[1].toLowerCase() === 'x' ? 2 : 1), entity[1].toLowerCase() === 'x' ? 16 : 10));
  return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[entity.toLowerCase()];
});

function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? htmlFiles(file) : file.endsWith('.html') ? [file] : [];
  });
}

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)]
    .map((match) => [match[1], decode(match[3])]));
}

const pages = htmlFiles(OUTPUT).map((file) => {
  const html = fs.readFileSync(file, 'utf8');
  const relative = path.relative(OUTPUT, file).split(path.sep).join('/');
  const url = new URL(`/${relative.replace(/index\.html$/, '')}`, site.url);
  const meta = [...html.matchAll(/<meta\b[^>]*>/g)].map(([tag]) => attributes(tag));
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => decode(match[1])));
  return { file, html, url, meta, ids, indexable: !meta.some((m) => m.name === 'robots' && /\bnoindex\b/.test(m.content)) };
});
const pagesByFile = new Map(pages.map((page) => [page.file, page]));
const indexable = pages.filter((page) => page.indexable);
const sitemap = fs.readFileSync(path.join(OUTPUT, 'sitemap.xml'), 'utf8');

test('sitemap contains exactly the indexable canonical pages', () => {
  const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => decode(match[1]));
  assert.equal(new Set(locations).size, locations.length, 'duplicate sitemap URL');
  assert.deepEqual(locations.sort(), indexable.map((page) => page.url.href).sort());
  for (const page of indexable) {
    const canonicals = [...page.html.matchAll(/<link\b[^>]*>/g)]
      .map(([tag]) => attributes(tag)).filter((a) => a.rel === 'canonical');
    assert.equal(canonicals.length, 1, page.url.pathname);
    assert.equal(canonicals[0].href, page.url.href, page.url.pathname);
  }
});

test('indexable pages have a descriptive title, description and one main heading', () => {
  const seen = new Set();
  for (const page of indexable) {
    const titles = [...page.html.matchAll(/<title>(.*?)<\/title>/gs)];
    assert.equal(titles.length, 1, page.url.pathname);
    assert.ok(titles[0][1].trim().length > 10, page.url.pathname);
    const descriptions = page.meta.filter((meta) => meta.name === 'description');
    assert.equal(descriptions.length, 1, page.url.pathname);
    assert.ok(descriptions[0].content.trim().length > 30, page.url.pathname);
    assert.equal([...page.html.matchAll(/<h1\b/g)].length, 1, page.url.pathname);
    const lang = page.html.match(/<html lang="([^"]+)"/)[1];
    // Norwegian and Danish can legitimately share the same wording.
    const key = `${lang}:${titles[0][1]}`;
    assert.ok(!seen.has(key), `duplicate title in ${lang}: ${titles[0][1]}`);
    seen.add(key);
  }
});

test('internal links, fragments and local image/script/style resources resolve', () => {
  const failures = [];
  const endpoints = new Set(['/go', '/ladda-ner', '/market-status']);
  for (const page of pages) {
    for (const [tag] of page.html.matchAll(/<(?:a|img|script|link)\b[^>]*>/g)) {
      const attrs = attributes(tag);
      const target = attrs.href || attrs.src;
      if (!target) continue;
      const url = new URL(target, page.url);
      if (url.origin !== site.url || endpoints.has(url.pathname)) continue;
      let file = path.join(OUTPUT, decodeURIComponent(url.pathname));
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      if (!fs.existsSync(file)) failures.push(`${page.url.pathname} → ${target}`);
      else if (url.hash && pagesByFile.has(file) && !pagesByFile.get(file).ids.has(decodeURIComponent(url.hash.slice(1)))) {
        failures.push(`${page.url.pathname} → ${target} (missing fragment)`);
      }
    }
  }
  assert.deepEqual(failures, []);
});

test('localized sharing metadata and large image previews are present', () => {
  for (const page of indexable.filter((page) => !['/privacy/', '/terms/'].includes(page.url.pathname))) {
    const get = (property) => page.meta.find((meta) => (meta.property || meta.name) === property)?.content;
    const htmlLang = page.html.match(/<html lang="([^"]+)"/)[1];
    const locale = Object.values(routes.locales).find((loc) => loc.htmlLang === htmlLang);
    assert.equal(get('og:site_name'), site.name, page.url.pathname);
    assert.equal(get('og:locale'), locale.intl.replace('-', '_'), page.url.pathname);
    assert.equal(get('og:url'), page.url.href, page.url.pathname);
    assert.ok(get('og:image:alt'), page.url.pathname);
    assert.equal(get('twitter:image:alt'), get('og:image:alt'), page.url.pathname);
    if (get('og:image') === site.ogImage) {
      assert.equal(get('og:image:width'), '1200', page.url.pathname);
      assert.equal(get('og:image:height'), '630', page.url.pathname);
    }
    assert.equal(get('robots'), 'max-image-preview:large', page.url.pathname);
  }
});

test('temporary country availability messages are excluded from search snippets', () => {
  for (const page of indexable) {
    for (const [tag] of page.html.matchAll(/<[^>]+\bdata-release(?:-ios|-android)?-closed\b[^>]*>/g)) {
      assert.match(tag, /^<(?:span|div|section)\b/, page.url.pathname);
      assert.match(tag, /\bdata-nosnippet\b/, page.url.pathname);
    }
  }
});

test('article dates, headline, description and image match visible page metadata', () => {
  const lastmodByUrl = new Map([...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)]
    .map((match) => [match[1].match(/<loc>(.*?)<\/loc>/)[1], match[1].match(/<lastmod>(.*?)<\/lastmod>/)?.[1]?.slice(0, 10)]));
  for (const page of indexable) {
    for (const match of page.html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      const data = JSON.parse(match[1]);
      for (const article of data['@graph'] || [data]) {
        if (article['@type'] !== 'Article') continue;
        assert.equal(article.dateModified, lastmodByUrl.get(page.url.href), page.url.pathname);
        assert.equal(article.description, page.meta.find((meta) => meta.name === 'description').content, page.url.pathname);
        assert.equal(article.image, page.meta.find((meta) => meta.property === 'og:image').content, page.url.pathname);
        const h1 = decode(page.html.match(/<h1\b[^>]*>(.*?)<\/h1>/s)[1].replace(/<[^>]+>/g, '')).trim();
        assert.equal(article.headline, h1, page.url.pathname);
      }
    }
  }
});
