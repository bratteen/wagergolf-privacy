const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'assets/js/release-status.js'),
  'utf8',
);

const IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8)';
const DESKTOP = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)';

async function run(state, search = '?m=SE', userAgent = DESKTOP, maxTouchPoints = 0) {
  const open = [{ hidden: true }, { hidden: true }];
  const closed = [{ hidden: false }, { hidden: false }];
  const iosOpen = [{ hidden: true }];
  const iosClosed = [{ hidden: false }];
  const androidOpen = [{ hidden: true }];
  const androidClosed = [{ hidden: false }];
  const attrs = { 'data-release-locale': 'en' };
  const body = {
    getAttribute(name) { return attrs[name] || ''; },
    setAttribute(name, value) { attrs[name] = value; },
  };
  let requested = '';
  const document = {
    body,
    querySelectorAll(selector) {
      if (selector === '[data-release-open]') return open;
      if (selector === '[data-release-closed]') return closed;
      if (selector === '[data-release-ios-open]') return iosOpen;
      if (selector === '[data-release-ios-closed]') return iosClosed;
      if (selector === '[data-release-android-open]') return androidOpen;
      if (selector === '[data-release-android-closed]') return androidClosed;
      return [];
    },
  };
  vm.runInNewContext(source, {
    document,
    location: { search },
    navigator: { userAgent, maxTouchPoints },
    URLSearchParams,
    fetch(url) {
      requested = url;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(state),
      });
    },
  });
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
  return {
    open, closed, iosOpen, iosClosed, androidOpen, androidClosed, attrs, requested,
  };
}

test('iOS i Sverige öppnar allmän CTA och båda butiksbadges', async () => {
  const result = await run({ market: 'SE', public: true, ios: true, android: true }, '?m=SE', IOS);
  assert.ok(result.open.every((node) => node.hidden === false));
  assert.ok(result.closed.every((node) => node.hidden === true));
  assert.ok(result.iosOpen.every((node) => node.hidden === false));
  assert.ok(result.iosClosed.every((node) => node.hidden === true));
  assert.ok(result.androidOpen.every((node) => node.hidden === false));
  assert.ok(result.androidClosed.every((node) => node.hidden === true));
  assert.strictEqual(result.attrs['data-release-market'], 'SE');
  assert.match(result.requested, /m=SE/);
  assert.match(result.requested, /l=en/);
});

test('Android i Sverige öppnar allmän CTA och båda butiksbadges', async () => {
  const result = await run({ market: 'SE', public: true, ios: true, android: true }, '?m=SE', ANDROID);
  assert.ok(result.open.every((node) => node.hidden === false));
  assert.ok(result.closed.every((node) => node.hidden === true));
  assert.ok(result.iosOpen.every((node) => node.hidden === false));
  assert.ok(result.androidOpen.every((node) => node.hidden === false));
  assert.ok(result.androidClosed.every((node) => node.hidden === true));
});

test('desktop visar båda öppna butikerna i Sverige', async () => {
  const result = await run({ market: 'SE', public: true, ios: true, android: true });
  assert.ok(result.open.every((node) => node.hidden === false));
  assert.ok(result.closed.every((node) => node.hidden === true));
  assert.ok(result.iosOpen.every((node) => node.hidden === false));
  assert.ok(result.androidOpen.every((node) => node.hidden === false));
  assert.ok(result.androidClosed.every((node) => node.hidden === true));
});

test('modern iPadOS med Macintosh-identitet behandlas som iOS', async () => {
  const result = await run(
    { market: 'SE', public: true, ios: true, android: true },
    '?m=SE',
    DESKTOP,
    5,
  );
  assert.ok(result.open.every((node) => node.hidden === false));
  assert.ok(result.closed.every((node) => node.hidden === true));
});

test('plattformssplitten håller Android stängt när bara iOS är öppet', async () => {
  const ios = await run(
    { market: 'TEST', public: true, ios: true, android: false },
    '?m=TEST',
    IOS,
  );
  assert.ok(ios.open.every((node) => node.hidden === false));
  assert.ok(ios.closed.every((node) => node.hidden === true));
  assert.ok(ios.iosOpen.every((node) => node.hidden === false));
  assert.ok(ios.androidOpen.every((node) => node.hidden === true));
  assert.ok(ios.androidClosed.every((node) => node.hidden === false));

  const android = await run(
    { market: 'TEST', public: true, ios: true, android: false },
    '?m=TEST',
    ANDROID,
  );
  assert.ok(android.open.every((node) => node.hidden === true));
  assert.ok(android.closed.every((node) => node.hidden === false));
  assert.ok(android.iosOpen.every((node) => node.hidden === false));
  assert.ok(android.androidOpen.every((node) => node.hidden === true));
  assert.ok(android.androidClosed.every((node) => node.hidden === false));
});

test('plattformssplitten öppnar Android och håller iOS stängt', async () => {
  const android = await run(
    { market: 'DK', public: true, ios: false, android: true },
    '?m=DK',
    ANDROID,
  );
  assert.ok(android.open.every((node) => node.hidden === false));
  assert.ok(android.closed.every((node) => node.hidden === true));
  assert.ok(android.iosOpen.every((node) => node.hidden === true));
  assert.ok(android.iosClosed.every((node) => node.hidden === false));
  assert.ok(android.androidOpen.every((node) => node.hidden === false));
  assert.ok(android.androidClosed.every((node) => node.hidden === true));

  const ios = await run(
    { market: 'DK', public: true, ios: false, android: true },
    '?m=DK',
    IOS,
  );
  assert.ok(ios.open.every((node) => node.hidden === true));
  assert.ok(ios.closed.every((node) => node.hidden === false));
  assert.ok(ios.iosOpen.every((node) => node.hidden === true));
  assert.ok(ios.iosClosed.every((node) => node.hidden === false));
  assert.ok(ios.androidOpen.every((node) => node.hidden === false));
  assert.ok(ios.androidClosed.every((node) => node.hidden === true));
});

test('desktop härleder status från plattformarna även om redundant public driver', async () => {
  const result = await run({ market: 'SE', public: true, ios: false, android: false });
  assert.ok(result.open.every((node) => node.hidden === true));
  assert.ok(result.closed.every((node) => node.hidden === false));
});

test('ofullständigt API-svar lämnar allting fail-closed', async () => {
  const result = await run({ market: 'SE', public: true });
  assert.ok(result.open.every((node) => node.hidden === true));
  assert.ok(result.closed.every((node) => node.hidden === false));
  assert.ok(result.iosOpen.every((node) => node.hidden === true));
  assert.ok(result.androidOpen.every((node) => node.hidden === true));
});

test('stängd marknad behåller alla butikskontroller dolda', async () => {
  const result = await run({ market: 'DK', public: false, ios: false, android: false }, '?m=DK');
  assert.ok(result.open.every((node) => node.hidden === true));
  assert.ok(result.closed.every((node) => node.hidden === false));
  assert.ok(result.iosOpen.every((node) => node.hidden === true));
  assert.ok(result.iosClosed.every((node) => node.hidden === false));
  assert.ok(result.androidOpen.every((node) => node.hidden === true));
  assert.ok(result.androidClosed.every((node) => node.hidden === false));
  assert.strictEqual(result.attrs['data-release-market'], 'DK');
});

test('ogiltig explicit marknad skickas vidare och kan inte maskeras av GeoIP', async () => {
  const result = await run({ market: null, public: false, ios: false, android: false }, '?m=DEU');
  assert.match(result.requested, /m=DEU/);
  assert.ok(result.open.every((node) => node.hidden === true));
  assert.ok(result.closed.every((node) => node.hidden === false));
});
