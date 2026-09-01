import test from 'node:test';
import assert from 'node:assert';
import { onRequestGet, sanitizeCampaign, pickLang } from '../functions/go.js';

const req = (url, headers = {}) => new Request(url, { headers });

// Full uppsättning för att testa själva språkvalslogiken oberoende av vilka
// språk som råkar vara publicerade just nu.
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
  // går att verifiera direkt mot en uttrycklig lista.
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

test('publicerat danskt språk leder till den danska startsidan', async () => {
  const res = await onRequestGet({ request: req('https://wagergolf.se/go?l=da') });
  assert.strictEqual(res.headers.get('Location'), '/dk/');
});

test('publicerat norskt språk leder till den norska startsidan', async () => {
  const res = await onRequestGet({ request: req('https://wagergolf.se/go?l=nb') });
  assert.strictEqual(res.headers.get('Location'), '/no/');
});

test('m=ie leder till den engelska sidan med irländsk marknad', async () => {
  const res = await onRequestGet({ request: req('https://wagergolf.se/go?m=ie') });
  assert.strictEqual(res.headers.get('Location'), '/en/?market=ie');
});

test('en-IE väljer Irland utan att andra engelska varianter påverkas', async () => {
  const ie = await onRequestGet({
    request: req('https://wagergolf.se/go', { 'accept-language': 'en-IE,en;q=0.9' }),
  });
  assert.strictEqual(ie.headers.get('Location'), '/en/?market=ie');

  const gb = await onRequestGet({
    request: req('https://wagergolf.se/go', { 'accept-language': 'en-GB,en;q=0.9' }),
  });
  assert.strictEqual(gb.headers.get('Location'), '/en/');
});

test('Irland behåller både marknad och kampanj', async () => {
  const res = await onRequestGet({
    request: req('https://wagergolf.se/go?m=ie&c=irish-golf'),
  });
  const location = res.headers.get('Location');
  assert.ok(location.startsWith('/en/?market=ie&'));
  assert.ok(location.includes('utm_campaign=irish-golf'));
});

test('Finland är fortfarande stängt i publiceringsgrinden', async () => {
  const res = await onRequestGet({ request: req('https://wagergolf.se/go?l=fi') });
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
