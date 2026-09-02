const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');

function runLanguageBanner(languages, current = 'sv') {
  const source = fs.readFileSync(path.join(ROOT, 'assets/js/lang-banner.js'), 'utf8');
  const targets = [
    ['sv', '/', 'Svenska'],
    ['nb', '/no/', 'Norsk'],
    ['da', '/dk/', 'Dansk'],
    ['en', '/en/', 'English'],
  ].map(([lang, url, label]) => ({
    getAttribute(name) {
      return { 'data-lang': lang, 'data-url': url, 'data-label': label, 'data-text': '{language}' }[name] || '';
    },
  }));
  const banner = {
    hidden: true,
    getAttribute(name) { return name === 'data-current-lang' ? current : ''; },
  };
  const text = {
    textContent: 'old',
    child: null,
    appendChild(child) { this.child = child; },
  };
  const close = { addEventListener() {} };
  const template = { content: { querySelectorAll() { return targets; } } };
  const document = {
    getElementById(id) {
      return { 'lang-banner': banner, 'lang-banner-alts': template, 'lang-banner-text': text, 'lang-banner-close': close }[id];
    },
    createElement() {
      return {
        attrs: {},
        textContent: '',
        setAttribute(name, value) { this.attrs[name] = value; },
      };
    },
  };
  vm.runInNewContext(source, {
    document,
    navigator: { languages },
    localStorage: { getItem() { return null; }, setItem() {} },
  });
  return { banner, link: text.child };
}

test('expansionsspråk erbjuds den engelska webb-fallbacken', () => {
  for (const language of ['fi-FI', 'nl-NL', 'de-DE', 'fr-FR', 'es-ES', 'it-IT', 'pt-PT']) {
    const { banner, link } = runLanguageBanner([language]);
    assert.strictEqual(banner.hidden, false, language);
    assert.strictEqual(link.attrs.href, '/en/', language);
    assert.strictEqual(link.attrs['data-lang-link'], 'en', language);
  }
});

test('norska går till bokmål och okänt språk får inget felaktigt förslag', () => {
  assert.strictEqual(runLanguageBanner(['no-NO']).link.attrs.href, '/no/');
  assert.strictEqual(runLanguageBanner(['pl-PL']).banner.hidden, true);
});

async function personalizedInvite(lang, displayName) {
  const source = fs.readFileSync(path.join(ROOT, 'assets/js/invite.js'), 'utf8');
  const title = { textContent: '' };
  const currentScript = {
    getAttribute(name) {
      return { 'data-api': 'https://api.wagergolf.se', 'data-lang': lang }[name] || '';
    },
  };
  const document = {
    currentScript,
    getElementById(id) {
      if (id === 'invite-title') return title;
      if (id === 'dl') return { addEventListener() {} };
      return null;
    },
  };
  vm.runInNewContext(source, {
    document,
    window: { location: { pathname: '/i/Abcd1234' } },
    fetch() {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ display_name: displayName }) });
    },
  });
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
  return title.textContent;
}

test('personaliserad inbjudningsrubrik följer sidans språk', async () => {
  const suffixes = {
    sv: 'Mira har bjudit in dig till Wager Golf',
    nb: 'Mira har invitert deg til Wager Golf',
    da: 'Mira har inviteret dig til Wager Golf',
    en: 'Mira has invited you to Wager Golf',
  };
  for (const [lang, expected] of Object.entries(suffixes)) {
    assert.strictEqual(await personalizedInvite(lang, 'Mira'), expected);
  }
  assert.strictEqual(
    await personalizedInvite('en', '<img src=x onerror=alert(1)>'),
    '<img src=x onerror=alert(1)> has invited you to Wager Golf',
  );
});

test('alla invite-mallar följer samma landsstyrda och fail-closed releasegrind', () => {
  for (const file of ['i/index.njk', 'no/i.njk', 'dk/i.njk', 'en/i.njk']) {
    const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
    assert.ok(source.includes('data-release-open hidden'), file);
    assert.ok(source.includes('data-release-closed'), file);
    assert.ok(source.includes('site.downloadUrls[lang].generic'), file);
    assert.ok(source.includes('data-download-link'), file);
    assert.ok(source.includes('data-ios-url="{{ site.downloadUrls[lang].ios }}"'), file);
    assert.ok(source.includes('data-android-url="{{ site.downloadUrls[lang].android }}"'), file);
    assert.ok(source.includes('data-lang="{{ lang }}"'), file);
    assert.ok(source.includes('noindex, nofollow'), file);
    assert.strictEqual((source.match(/id="dl"/g) || []).length, 1, file);
  }
});
