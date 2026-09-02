const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'assets/js/download-link.js'), 'utf8');

function run(search, ua = 'Mozilla/5.0 (iPhone)', hasAnchor = false, maxTouchPoints = 0) {
  const attrs = {
    href: '/ladda-ner?l=en',
    'data-ios-url': '/ladda-ner?l=en&p=ios',
    'data-android-url': '/ladda-ner?l=en&p=android',
  };
  const link = {
    getAttribute(name) { return attrs[name] || null; },
    setAttribute(name, value) { attrs[name] = value; },
  };
  const context = {
    URL,
    URLSearchParams,
    navigator: { userAgent: ua, maxTouchPoints },
    location: {
      search,
      href: `https://wagergolf.se/en/${search}`,
      origin: 'https://wagergolf.se',
    },
    document: {
      querySelector(selector) {
        return selector === '[data-download-anchor]' && hasAnchor
          ? { id: 'main-content' }
          : null;
      },
      querySelectorAll(selector) {
        return selector === 'a[data-download-link]' || selector === 'a[data-store-link]'
          ? [link]
          : [];
      },
    },
  };
  vm.runInNewContext(source, context);
  return attrs.href;
}

test('mobilknappen behåller endpointen och skickar vidare marknad och kampanj', () => {
  const href = run('?m=fi&utm_campaign=Meta%20FI%20Launch');
  assert.strictEqual(href, '/ladda-ner?l=en&p=ios&c=meta-fi-launch&m=FI');
});

test('ogiltig marknadsparameter skickas vidare så servern stoppar den', () => {
  const href = run('?m=USA');
  assert.strictEqual(href, '/ladda-ner?l=en&p=ios&m=USA');
});

test('desktop scrollar till hero bara när sidan har ett nedladdningsankare', () => {
  const desktop = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)';
  assert.strictEqual(run('', desktop, true), '#main-content');
  assert.strictEqual(run('', desktop, false), '/ladda-ner?l=en');
});

test('iPad med Macintosh-identitet går till iOS-endpointen även på invite', () => {
  const modernIPad = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15';
  assert.strictEqual(run('?m=SE', modernIPad, false, 5), '/ladda-ner?l=en&p=ios&m=SE');
});
