import test from 'node:test';
import assert from 'node:assert';
import { onRequestGet, sanitizeCampaign, pickLang } from '../functions/go.js';

const req = (url, headers = {}) => new Request(url, { headers });

// Full uppsättning för att testa själva språkvalslogiken oberoende av vilka
// språk som råkar vara publicerade just nu (våg 1: bara sv). Utan detta skulle
// t.ex. no/nb-hanteringen förbli otestad tills den aktiveras i en senare våg.
const ALLA = ['sv', 'nb', 'da', 'en'];

test('sanerar Metas kampanjnamn till något butiken accepterar', () => {
  assert.strictEqual(sanitizeCampaign('WG DK - Reels 🏌'), 'wg-dk-reels');
  assert.strictEqual(sanitizeCampaign('qr-scorekort'), 'qr-scorekort');
  assert.strictEqual(sanitizeCampaign('  Höst__2026  '), 'h-st-2026');
  assert.strictEqual(sanitizeCampaign(''), '');
  assert.strictEqual(sanitizeCampaign(null), '');
});

test('sanerad sträng kortas och slutar aldrig på bindestreck', () => {
  const out = sanitizeCampaign('a'.repeat(60) + ' slut');
  assert.ok(out.length <= 40);
  assert.ok(!out.endsWith('-'));
});

test('l tvingar språk oavsett Accept-Language', () => {
  // pickLang testas här direkt med en injicerad publicerad-lista som
  // innehåller alla fyra språk, så själva valet ("da" trumfar Accept-Language)
  // går att verifiera redan nu, innan da faktiskt är publicerat i våg 1.
  const url = new URL('https://wagergolf.se/go?l=da');
  const request = req('https://wagergolf.se/go?l=da', { 'accept-language': 'en-US,en;q=0.9' });
  assert.strictEqual(pickLang(url, request, ALLA), 'da');
});

test('utan l följs Accept-Language', () => {
  const url = new URL('https://wagergolf.se/go');
  const request = req('https://wagergolf.se/go', { 'accept-language': 'nb-NO,nb;q=0.9' });
  assert.strictEqual(pickLang(url, request, ALLA), 'nb');
});

test('no och nb är samma skriftspråk för vårt syfte', () => {
  const url = new URL('https://wagergolf.se/go');
  const request = req('https://wagergolf.se/go', { 'accept-language': 'no' });
  assert.strictEqual(pickLang(url, request, ALLA), 'nb');
});

test('okänt språk i l faller tillbaka på svenska även när allt är publicerat', () => {
  const url = new URL('https://wagergolf.se/go?l=klingon');
  const request = req('https://wagergolf.se/go?l=klingon');
  assert.strictEqual(pickLang(url, request, ALLA), 'sv');
});

test('opublicerat språk faller tillbaka på svenska (våg 1: bara sv är live)', async () => {
  // publishedLocales är ["sv"] i våg 1, så även l=da ska ge svenska. Detta är
  // regressionslåset för produktionens faktiska PUBLISHED-lista (default-
  // parametern i pickLang), till skillnad från testerna ovan som injicerar
  // en egen lista för att pröva valmekaniken oberoende av vilken våg vi är i.
  const res = await onRequestGet({ request: req('https://wagergolf.se/go?l=da') });
  assert.strictEqual(res.headers.get('Location'), '/');
});

test('c ger utm-parametrar på landningssidan', async () => {
  const res = await onRequestGet({
    request: req('https://wagergolf.se/go?c=podd-golfsnack'),
  });
  const loc = res.headers.get('Location');
  assert.ok(loc.includes('utm_source=podd-golfsnack'));
  assert.ok(loc.includes('utm_medium=offline'));
  assert.ok(loc.includes('utm_campaign=podd-golfsnack'));
});

test('utan c ges en ren URL utan utm', async () => {
  const res = await onRequestGet({ request: req('https://wagergolf.se/go') });
  assert.strictEqual(res.headers.get('Location'), '/');
});

test('svaret får aldrig cachas delat', async () => {
  const res = await onRequestGet({ request: req('https://wagergolf.se/go') });
  assert.strictEqual(res.headers.get('Cache-Control'), 'no-store');
  assert.strictEqual(res.headers.get('Vary'), 'Accept-Language');
});

test('en trasig QR-kod landar ändå någonstans vettigt', async () => {
  const res = await onRequestGet({ request: req('https://wagergolf.se/go?l=klingon&c=') });
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.get('Location'), '/');
});
