const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const routes = require('../_data/routes.js');

const ROOT = path.join(__dirname, '..');
const SITE = path.join(ROOT, '_site');
const EXPECTED_LANGS = ['sv', 'nb', 'da', 'en', 'fi', 'nl', 'de', 'fr', 'es', 'it', 'pt'];

function filesUnder(dir, suffix) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? filesUnder(file, suffix) : entry.name.endsWith(suffix) ? [file] : [];
  });
}

function outputForUrl(value) {
  const pathname = new URL(value, 'https://wagergolf.se').pathname;
  return path.join(SITE, pathname.replace(/^\//, ''), pathname.endsWith('/') ? 'index.html' : '');
}

function urlForOutput(file) {
  const relative = path.relative(SITE, file).split(path.sep).join('/');
  if (relative === 'index.html') return '/';
  if (relative.endsWith('/index.html')) return `/${relative.slice(0, -'index.html'.length)}`;
  return `/${relative}`;
}

function alternates(html) {
  return [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)]
    .map((match) => ({ lang: match[1], href: match[2] }));
}

function mainText(html) {
  const match = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  assert.ok(match, 'sidan saknar main');
  return match[1]
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

test('webben publicerar exakt samma elva språk som appen', () => {
  assert.deepStrictEqual(routes.publishedLocales, EXPECTED_LANGS);
  for (const lang of EXPECTED_LANGS) {
    const file = outputForUrl(routes.homeFor(lang));
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, new RegExp(`<html lang="${routes.locales[lang].htmlLang}">`), lang);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://wagergolf.se${routes.homeFor(lang)}">`), lang);
    assert.doesNotMatch(html, /<meta name="robots" content="noindex">/, lang);
  }
});

test('alla 297 innehållssidor har komplett ömsesidig hreflang-graf', () => {
  const expectedHreflangs = [...EXPECTED_LANGS.map((lang) => routes.locales[lang].hreflang), 'x-default'].sort();
  const contentPages = filesUnder(SITE, '.html').filter((file) => {
    const relative = path.relative(SITE, file);
    return relative !== 'privacy/index.html' && relative !== 'terms/index.html' &&
      !relative.endsWith('404.html') && !relative.endsWith(`${path.sep}i${path.sep}index.html`) &&
      relative !== `i${path.sep}index.html`;
  });
  assert.strictEqual(contentPages.length, 297);
  for (const file of contentPages) {
    const html = fs.readFileSync(file, 'utf8');
    const links = alternates(html);
    const expectedCanonical = `https://wagergolf.se${urlForOutput(file)}`;
    const canonical = html.match(/<link rel="canonical" href="([^"]+)">/);
    assert.strictEqual(canonical && canonical[1], expectedCanonical, path.relative(SITE, file));

    const htmlLang = html.match(/<html lang="([^"]+)">/);
    const currentLang = EXPECTED_LANGS.find(
      (candidate) => routes.locales[candidate].htmlLang === (htmlLang && htmlLang[1]),
    );
    assert.ok(currentLang, `${path.relative(SITE, file)} saknar känt html-lang`);
    const selfAlternate = links.find(
      ({ lang: hreflang }) => hreflang === routes.locales[currentLang].hreflang,
    );
    assert.strictEqual(selfAlternate && selfAlternate.href, expectedCanonical, `${currentLang}: self-hreflang`);

    assert.deepStrictEqual(links.map(({ lang }) => lang).sort(), expectedHreflangs, path.relative(SITE, file));
    for (const { href } of links) assert.ok(fs.existsSync(outputForUrl(href)), `${href} från ${file}`);
  }
});

test('de sju nya språken innehåller egen brödtext, inte kopierad engelska', () => {
  const englishPages = filesUnder(path.join(SITE, 'en'), '.html').filter((file) => {
    const relative = path.relative(path.join(SITE, 'en'), file);
    return relative !== '404.html' && relative !== `i${path.sep}index.html`;
  });
  assert.strictEqual(englishPages.length, 27);
  for (const englishFile of englishPages) {
    const englishHtml = fs.readFileSync(englishFile, 'utf8');
    const englishText = mainText(englishHtml);
    const byLang = new Map(alternates(englishHtml).map((entry) => [entry.lang, entry.href]));
    for (const lang of ['fi', 'nl', 'de', 'fr', 'es', 'it', 'pt']) {
      const hreflang = routes.locales[lang].hreflang;
      const localizedFile = outputForUrl(byLang.get(hreflang));
      const localizedText = mainText(fs.readFileSync(localizedFile, 'utf8'));
      assert.notStrictEqual(localizedText, englishText, `${lang}: ${path.relative(SITE, englishFile)}`);
    }
  }
});

test('slutbygget har 321 HTML-filer och 299 sitemap-URL:er', () => {
  assert.strictEqual(filesUnder(SITE, '.html').length, 321);
  const sitemap = fs.readFileSync(path.join(SITE, 'sitemap.xml'), 'utf8');
  assert.strictEqual((sitemap.match(/<url>/g) || []).length, 299);
  assert.strictEqual((sitemap.match(/<xhtml:link /g) || []).length, 3564);
});

test('alla invite-sidor kan byta mellan samtliga elva språk utan att tappa token', () => {
  for (const lang of EXPECTED_LANGS) {
    const inviteUrl = routes.locales[lang].prefix
      ? `${routes.locales[lang].prefix}/i/`
      : '/i/';
    const html = fs.readFileSync(outputForUrl(inviteUrl), 'utf8');
    for (const target of EXPECTED_LANGS.filter((candidate) => candidate !== lang)) {
      assert.match(
        html,
        new RegExp(`href="\\?l=${target}"[^>]*data-lang-link="${target}"`),
        `${lang} → ${target}`,
      );
    }
  }
});

test('alla 404-sidor erbjuder vägen hem på samtliga elva språk', () => {
  for (const lang of EXPECTED_LANGS) {
    const prefix = routes.locales[lang].prefix;
    const file = path.join(SITE, prefix.replace(/^\//, ''), '404.html');
    const html = fs.readFileSync(file, 'utf8');
    for (const target of EXPECTED_LANGS.filter((candidate) => candidate !== lang)) {
      assert.match(
        html,
        new RegExp(`href="${routes.homeFor(target)}"[^>]*data-lang-link="${target}"`),
        `${lang} → ${target}`,
      );
    }
  }
});

test('alla genererade JSON-LD-block är giltig JSON', () => {
  for (const file of filesUnder(SITE, '.html')) {
    const html = fs.readFileSync(file, 'utf8');
    for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      assert.doesNotThrow(() => JSON.parse(match[1]), path.relative(SITE, file));
    }
  }
});
