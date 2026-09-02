const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'assets/js/mobile-menu.js'), 'utf8');

test('mobilmenyn stängs när en länk väljs', () => {
  const callbacks = [];
  const menu = {
    open: true,
    querySelectorAll(selector) {
      assert.strictEqual(selector, 'a');
      return [
        { addEventListener(type, callback) { assert.strictEqual(type, 'click'); callbacks.push(callback); } },
        { addEventListener(type, callback) { assert.strictEqual(type, 'click'); callbacks.push(callback); } },
      ];
    },
  };
  vm.runInNewContext(source, {
    document: {
      querySelectorAll(selector) {
        assert.strictEqual(selector, '.mobile-menu');
        return [menu];
      },
    },
  });
  assert.strictEqual(callbacks.length, 2);
  callbacks[0]();
  assert.strictEqual(menu.open, false);
});
