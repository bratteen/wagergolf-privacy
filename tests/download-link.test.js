const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'assets/js/download-link.js'), 'utf8');

function runPage({
  search = '', ua = 'Mozilla/5.0 (iPhone)', anchorId = '', maxTouchPoints = 0,
  campaign = '', pathname = '/en/', hasNav = true, iosHref = '/ladda-ner?l=en&p=ios',
} = {}) {
  function element(attrs) {
    return {
      attrs,
      getAttribute(name) { return attrs[name] || null; },
      setAttribute(name, value) { attrs[name] = value; },
    };
  }
  const nav = element({
    href: '/ladda-ner?l=en',
    'data-ios-url': '/ladda-ner?l=en&p=ios',
    'data-android-url': '/ladda-ner?l=en&p=android',
  });
  const ios = element({ href: iosHref });
  const android = element({ href: '/ladda-ner?l=en&p=android' });
  const context = {
    URL,
    URLSearchParams,
    navigator: { userAgent: ua, maxTouchPoints },
    location: {
      search,
      href: `https://wagergolf.se${pathname}${search}`,
      origin: 'https://wagergolf.se',
    },
    document: {
      body: element({ 'data-download-campaign': campaign }),
      querySelector(selector) {
        return selector === '[data-download-anchor]' && anchorId
          ? { id: anchorId }
          : null;
      },
      querySelectorAll(selector) {
        if (selector === 'a[data-download-link]') return hasNav ? [nav] : [];
        if (selector === 'a[data-store-link]') return hasNav ? [nav, ios, android] : [ios, android];
        return [];
      },
    },
  };
  vm.runInNewContext(source, context);
  return { nav: nav.attrs.href, ios: ios.attrs.href, android: android.attrs.href, location: context.location };
}

function run(search, ua = 'Mozilla/5.0 (iPhone)', hasAnchor = false, maxTouchPoints = 0) {
  return runPage({ search, ua, anchorId: hasAnchor ? 'main-content' : '', maxTouchPoints }).nav;
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

test('guidens vanliga nedladdningar delar kampanj och behåller badge-plattformarna', () => {
  const page = runPage({ campaign: 'guides', pathname: '/en/guides/skins/', ua: 'Android' });
  assert.strictEqual(page.nav, '/ladda-ner?l=en&p=android&c=guides');
  assert.strictEqual(page.ios, '/ladda-ner?l=en&p=ios&c=guides');
  assert.strictEqual(page.android, '/ladda-ner?l=en&p=android&c=guides');
});

test('guidekampanjen fungerar för butiksknappar även utan nav', () => {
  const page = runPage({ campaign: 'guides', hasNav: false });
  assert.strictEqual(page.ios, '/ladda-ner?l=en&p=ios&c=guides');
  assert.strictEqual(page.android, '/ladda-ner?l=en&p=android&c=guides');
});

test('annonskampanjer har företräde framför guidekampanjen, med c före utm_campaign', () => {
  for (const [search, expected] of [
    ['?utm_campaign=Meta%20Launch', 'meta-launch'],
    ['?c=QR%20Club&utm_campaign=Meta%20Launch', 'qr-club'],
  ]) {
    const page = runPage({ search, campaign: 'guides' });
    for (const key of ['nav', 'ios', 'android']) {
      assert.strictEqual(new URL(page[key], page.location.href).searchParams.get('c'), expected, key);
    }
  }
});

test('guidefallback skriver inte över en enskild knapps uttryckliga kampanj', () => {
  for (const query of ['c=club-partner', 'utm_campaign=club-partner']) {
    const iosHref = '/ladda-ner?l=en&p=ios&' + query;
    const page = runPage({ campaign: 'guides', iosHref });
    assert.strictEqual(page.ios, iosHref);
    assert.match(page.android, /c=guides$/);
  }
});

test('desktopnav scrollar till guidekortet utan att tappa query eller märka om ankaret', () => {
  const search = '?m=FI&utm_campaign=Summer%20Golf&source=search';
  const page = runPage({
    search, campaign: 'guides', pathname: '/en/guides/skins/',
    ua: 'Macintosh', anchorId: 'guide-download',
  });
  assert.strictEqual(page.nav, '#guide-download');
  const anchor = new URL(page.nav, page.location.href);
  assert.strictEqual(anchor.pathname, '/en/guides/skins/');
  assert.strictEqual(anchor.search, search);
  assert.strictEqual(page.ios, '/ladda-ner?l=en&p=ios&c=summer-golf&m=FI');
  assert.strictEqual(page.android, '/ladda-ner?l=en&p=android&c=summer-golf&m=FI');
});

test('allmänna butiksknappar behåller marknadens serverstyrda standardkampanj', () => {
  const page = runPage();
  assert.strictEqual(page.ios, '/ladda-ner?l=en&p=ios');
  assert.strictEqual(page.android, '/ladda-ner?l=en&p=android');
});
