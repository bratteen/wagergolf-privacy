const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const site = require('../_data/site.js');
const routes = require('../_data/routes.js');

const ROOT = path.join(__dirname, '..');

const INVITE_OUTPUTS = routes.publishedLocales.map((lang) => {
  const prefix = routes.locales[lang].prefix.replace(/^\//, '');
  return prefix ? `${prefix}/i/index.html` : 'i/index.html';
});

test('publika sidor laddar endast integritetsfiltret; replay och Cloudflare är avstängda', () => {
  assert.strictEqual(site.cfBeaconToken, '');
  assert.deepStrictEqual(site.umami, {
    src: 'https://analytics.bratt.se/script.js',
    recorderSrc: '',
    replaySampleRate: 0,
    websiteId: 'ae56fbfa-4ce4-480b-af6a-62f20282b414',
  });

  const notices = require('../_data/analyticsNotice.js');
  for (const lang of routes.publishedLocales) {
    const pathname = routes.homeFor(lang);
    const html = fs.readFileSync(path.join(ROOT, '_site', pathname, 'index.html'), 'utf8');
    assert.match(html, /<script defer src="\/assets\/js\/analytics-guard\.js\?v=[a-f0-9]+"/);
    assert.ok(html.includes(`data-analytics-path="${pathname}"`), lang);
    assert.ok(html.includes('data-analytics-title="'), lang);
    assert.ok(html.includes(`data-website-id="${site.umami.websiteId}"`), lang);
    assert.ok(html.includes(`data-analytics-src="${site.umami.src}"`), lang);
    assert.ok(html.includes(notices[lang].title), lang);
    assert.match(html, /<div data-nosnippet>\s*<details class="analytics-notice">/);
    assert.doesNotMatch(html, /<script[^>]+\ssrc="https:\/\/analytics\.bratt\.se/);
    assert.doesNotMatch(html, /replay-sample\.js|recorder\.js|cloudflareinsights\.com/);
  }
});

test('privata inbjudningar, juridiksidor och 404 har ingen mätkod eller sidkonfiguration', () => {
  for (const file of ['404.html', 'privacy/index.html', 'terms/index.html', ...INVITE_OUTPUTS]) {
    const html = fs.readFileSync(path.join(ROOT, '_site', file), 'utf8');
    assert.doesNotMatch(html, /analytics\.bratt\.se|analytics-guard\.js|data-analytics-path|data-analytics-title|replay-sample\.js|cloudflareinsights\.com/, file);
  }
});

test('CSP tillåter Umami på marknadssidor och bevarar strikta juridiksidor', () => {
  const headers = fs.readFileSync(path.join(ROOT, '_headers'), 'utf8');
  const [global, privacy, terms] = headers.split(/\n\n/);
  assert.match(global, /script-src 'self' https:\/\/analytics\.bratt\.se;/);
  assert.match(global, /connect-src 'self' https:\/\/api\.wagergolf\.se https:\/\/analytics\.bratt\.se;/);
  for (const protectedHeaders of [privacy, terms]) {
    assert.doesNotMatch(protectedHeaders, /analytics\.bratt\.se/);
    assert.match(protectedHeaders, /script-src 'none';/);
    assert.match(protectedHeaders, /connect-src 'none';/);
  }
  assert.ok(!headers.includes('cloudflareinsights.com'));
  assert.ok(!headers.includes('static.cloudflareinsights.com'));
});

test('inbjudningssidor märks noindex och får hämtas för att direktivet ska läsas', () => {
  for (const file of INVITE_OUTPUTS) {
    const html = fs.readFileSync(path.join(ROOT, '_site', file), 'utf8');
    assert.match(html, /<meta name="robots" content="noindex, nofollow">/, file);
  }
  const robots = fs.readFileSync(path.join(ROOT, '_site', 'robots.txt'), 'utf8');
  assert.doesNotMatch(robots, /^Disallow: \/i\/$/m);
});

test('den lokala landsgrinden laddas tidigt i head och exakt en gång', () => {
  const template = fs.readFileSync(path.join(ROOT, '_includes', 'base.njk'), 'utf8');
  const gate = 'src="/assets/js/release-status.js';
  assert.strictEqual(template.split(gate).length - 1, 1);
  assert.ok(template.indexOf(gate) < template.indexOf('</head>'));
  assert.ok(template.indexOf(gate) < template.indexOf('site.umami.websiteId'));
});

test('delningsbilden är neutral, opak och ändras inte obemärkt', () => {
  const image = fs.readFileSync(path.join(ROOT, 'assets', 'og-image-v171.png'));
  assert.strictEqual(image.subarray(1, 4).toString('ascii'), 'PNG');
  assert.strictEqual(image.readUInt32BE(16), 1200);
  assert.strictEqual(image.readUInt32BE(20), 630);
  assert.strictEqual(image[25], 2, 'OG-bilden ska vara RGB utan alfakanal');
  assert.strictEqual(
    crypto.createHash('sha256').update(image).digest('hex'),
    '0faf69af6a5a0f3382acf6309df7e12c5d2c9418f698ea57274424143c445331',
  );
});
