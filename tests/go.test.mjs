import test from 'node:test';
import assert from 'node:assert';
import { onRequestGet, sanitizeCampaign } from '../functions/go.js';

const req = (url, headers = {}) => new Request(url, { headers });

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

test('l med opublicerat språk faller tillbaka på svenska trots avvikande Accept-Language', async () => {
  // publishedLocales är ["sv"] i våg 1. "da" finns i PREFIX-tabellen men är
  // inte publicerat, så forced-parametern ska falla tillbaka på svenska i
  // stället för att läcka igenom till Accept-Language-detekteringen.
  const res = await onRequestGet({ request: req('https://wagergolf.se/go?l=da', {
    'accept-language': 'en-US,en;q=0.9',
  }) });
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.get('Location'), '/');
});

test('utan l följs Accept-Language, men opublicerat språk ger ändå svenska', async () => {
  // "nb" (norska) är inte publicerat än i denna våg, så en norsk besökares
  // Accept-Language ska ändå landa på startsidan i stället för en tom /no/-katalog.
  const res = await onRequestGet({ request: req('https://wagergolf.se/go', {
    'accept-language': 'nb-NO,nb;q=0.9',
  }) });
  assert.strictEqual(res.headers.get('Location'), '/');
});

test('opublicerat språk faller tillbaka på svenska', async () => {
  // publishedLocales är ["sv"] i våg 1, så även l=da ska ge svenska.
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
