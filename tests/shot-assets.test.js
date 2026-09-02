const test = require('node:test');
const assert = require('node:assert');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SHOTS = path.join(ROOT, 'assets', 'shots');
const manifest = require('../assets/shots/manifest.json');
const routes = require('../_data/routes.js');

function readVp8xMetadata(buffer) {
  assert.strictEqual(buffer.subarray(0, 4).toString('ascii'), 'RIFF');
  assert.strictEqual(buffer.subarray(8, 12).toString('ascii'), 'WEBP');
  assert.strictEqual(buffer.subarray(12, 16).toString('ascii'), 'VP8X');

  const uint24 = (offset) =>
    buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);

  return {
    alpha: Boolean(buffer[20] & 0x10),
    width: uint24(24) + 1,
    height: uint24(27) + 1,
  };
}

test('alla publicerade språk har tre verifierade telefonbilder', () => {
  assert.deepStrictEqual(
    manifest.locales.map(({ language }) => language),
    routes.publishedLocales,
  );

  for (const locale of manifest.locales) {
    assert.deepStrictEqual(Object.keys(locale.assets), ['home', 'live', 'settlement']);

    for (const asset of Object.values(locale.assets)) {
      const file = path.join(SHOTS, asset.file);
      assert.ok(fs.existsSync(file), `saknad appbild: ${asset.file}`);

      const buffer = fs.readFileSync(file);
      const metadata = readVp8xMetadata(buffer);
      assert.deepStrictEqual(metadata, {
        alpha: manifest.output.alpha,
        width: manifest.output.width,
        height: manifest.output.height,
      });
      assert.strictEqual(
        crypto.createHash('sha256').update(buffer).digest('hex'),
        asset.sha256,
        `ändrad appbild utan uppdaterat manifest: ${asset.file}`,
      );
    }
  }
});

test('internationella uppgörelsebilder är egna providerneutrala varianter', () => {
  const settlements = manifest.locales.map((locale) => ({
    language: locale.language,
    settlement: locale.settlement,
    sha256: locale.assets.settlement.sha256,
  }));

  assert.strictEqual(settlements.find(({ language }) => language === 'sv').settlement, 'swish');
  assert.strictEqual(
    manifest.locales.find(({ language }) => language === 'sv').assets.settlement.presentation,
    'per-format-breakdown',
  );
  for (const locale of settlements.filter(({ language }) => language !== 'sv')) {
    assert.strictEqual(locale.settlement, 'manual');
  }
  assert.strictEqual(new Set(settlements.map(({ sha256 }) => sha256)).size, settlements.length);
});
