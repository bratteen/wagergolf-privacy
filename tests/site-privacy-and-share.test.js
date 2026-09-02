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

test('webbstatistik och session replay är avstängda', () => {
  assert.strictEqual(site.cfBeaconToken, '');
  assert.deepStrictEqual(site.umami, {
    src: '',
    recorderSrc: '',
    replaySampleRate: 0,
    websiteId: '',
  });

  for (const file of ['index.html', ...INVITE_OUTPUTS]) {
    const html = fs.readFileSync(path.join(ROOT, '_site', file), 'utf8');
    assert.ok(!html.includes('analytics.bratt.se'), file);
    assert.ok(!html.includes('replay-sample.js'), file);
  }

  const headers = fs.readFileSync(path.join(ROOT, '_headers'), 'utf8');
  assert.ok(!headers.includes('analytics.bratt.se'));
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
