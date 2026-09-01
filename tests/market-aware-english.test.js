const test = require('node:test');
const assert = require('node:assert');
const { readFileSync } = require('node:fs');

test('engelska sidor kan växla till Irlands storefront utan lagring', () => {
  const base = readFileSync('_includes/base.njk', 'utf8');
  const badges = readFileSync('_includes/store-badges.njk', 'utf8');
  const script = readFileSync('assets/js/download-link.js', 'utf8');

  assert.match(base, /data-ios-market-ie/);
  assert.match(base, /data-android-market-ie/);
  assert.match(badges, /data-ios-market-ie/);
  assert.match(badges, /data-android-market-ie/);
  assert.match(script, /params\.get\('market'\)/);
  assert.match(script, /searchParams\.set\('market', 'ie'\)/);
  const executable = script.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!executable.includes('sessionStorage'));
  assert.ok(!executable.includes('localStorage'));
  assert.ok(!executable.includes('document.cookie'));
});
