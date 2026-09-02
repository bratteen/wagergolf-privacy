const test = require('node:test');
const assert = require('node:assert');
const { localDate } = require('../lib/local-date.js');

// Den gamla svDate-implementationen, som facit. Byter localDate ut den måste
// den ge exakt samma svenska sträng, annars ändras varje guides byline och
// låset i check-sv-unchanged faller.
const SV_MONTHS = ['januari','februari','mars','april','maj','juni',
  'juli','augusti','september','oktober','november','december'];
function svDate(d) {
  const s = String(d).slice(0, 10);
  const [y, m, day] = s.split('-').map(Number);
  return `${day} ${SV_MONTHS[m - 1]} ${y}`;
}

test('svenska matchar den gamla svDate exakt, för alla månader', () => {
  for (let m = 1; m <= 12; m++) {
    const iso = `2026-${String(m).padStart(2, '0')}-20`;
    assert.strictEqual(localDate(iso, 'sv'), svDate(iso), iso);
  }
});

test('dagen är utan inledande nolla, som förut', () => {
  assert.strictEqual(localDate('2026-06-05', 'sv'), '5 juni 2026');
});

test('övriga språk formateras på sitt eget vis', () => {
  assert.strictEqual(localDate('2026-06-20', 'da'), '20. juni 2026');
  assert.strictEqual(localDate('2026-06-20', 'en'), '20 June 2026');
});

test('tomt eller trasigt datum kraschar inte bygget', () => {
  assert.strictEqual(localDate(null, 'sv'), '');
  assert.strictEqual(localDate('', 'sv'), '');
  // Kapad till tio tecken, precis som gamla svDate gjorde. Parvis identiskt
  // beteende är poänten, även för skräpindata.
  assert.strictEqual(localDate('inte-ett-datum', 'sv'), 'inte-ett-d');
});

test('omöjligt datum rullas inte över tyst', () => {
  // Intl gör "2026-02-31" till 3 mars. Med hundratals datumfält över elva språk ska
  // ett stavfel synas som stavfelet det är, inte som ett annat datum.
  assert.strictEqual(localDate('2026-02-31', 'sv'), '2026-02-31');
  assert.strictEqual(localDate('2026-04-31', 'sv'), '2026-04-31');
  // Riktiga skottdagar ska däremot formateras som vanligt.
  assert.strictEqual(localDate('2028-02-29', 'sv'), '29 februari 2028');
});

test('okänt språk faller tillbaka på svenska', () => {
  assert.strictEqual(localDate('2026-06-20', 'xx'), '20 juni 2026');
});
