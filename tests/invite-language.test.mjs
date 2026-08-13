import test from 'node:test';
import assert from 'node:assert';
import routes from '../_data/routes.js';
import { ASSET_FOR, pickLang } from '../functions/i/[[path]].js';

const allLocales = Object.keys(routes.locales);

test('inbjudningssidan har en asset för varje känt språk', () => {
  for (const lang of allLocales) {
    const prefix = routes.locales[lang].prefix;
    const expected = prefix ? `${prefix}/i/` : '/i/';
    assert.strictEqual(ASSET_FOR[lang], expected, `${lang} saknar rätt invite-asset`);
  }
});

test('inbjudningssidan kan välja alla språk när de publiceras', () => {
  assert.strictEqual(pickLang('sv-SE,sv;q=0.9', allLocales), 'sv');
  assert.strictEqual(pickLang('en-GB,en;q=0.9', allLocales), 'en');
  assert.strictEqual(pickLang('da-DK,da;q=0.9', allLocales), 'da');
  assert.strictEqual(pickLang('nb-NO,nb;q=0.9', allLocales), 'nb');
  assert.strictEqual(pickLang('no-NO,no;q=0.9', allLocales), 'nb');
  assert.strictEqual(pickLang('fi-FI,fi;q=0.9', allLocales), 'fi');
});
