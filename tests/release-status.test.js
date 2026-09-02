const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'assets/js/release-status.js'),
  'utf8',
);

async function run(publicState, search = '?m=SE') {
  const open = [{ hidden: true }, { hidden: true }];
  const closed = [{ hidden: false }, { hidden: false }];
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
      return [];
    },
  };
  vm.runInNewContext(source, {
    document,
    location: { search },
    URLSearchParams,
    fetch(url) {
      requested = url;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ market: publicState ? 'SE' : 'DK', public: publicState }),
      });
    },
  });
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
  return { open, closed, attrs, requested };
}

test('öppen marknad visar alla riktiga kontroller och döljer statusläget', async () => {
  const result = await run(true);
  assert.ok(result.open.every((node) => node.hidden === false));
  assert.ok(result.closed.every((node) => node.hidden === true));
  assert.strictEqual(result.attrs['data-release-market'], 'SE');
  assert.match(result.requested, /m=SE/);
  assert.match(result.requested, /l=en/);
});

test('stängd marknad behåller alla butikskontroller dolda', async () => {
  const result = await run(false, '?m=DK');
  assert.ok(result.open.every((node) => node.hidden === true));
  assert.ok(result.closed.every((node) => node.hidden === false));
  assert.strictEqual(result.attrs['data-release-market'], 'DK');
});

test('ogiltig explicit marknad skickas vidare och kan inte maskeras av GeoIP', async () => {
  const result = await run(false, '?m=DEU');
  assert.match(result.requested, /m=DEU/);
  assert.ok(result.open.every((node) => node.hidden === true));
  assert.ok(result.closed.every((node) => node.hidden === false));
});
