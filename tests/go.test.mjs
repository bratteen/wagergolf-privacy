import test from 'node:test';
import assert from 'node:assert';
import { onRequestGet, sanitizeCampaign, pickLang } from '../functions/go.js';

const req = (url, headers = {}) => new Request(url, { headers });
const reqWithCf = (url, country, headers = {}) => {
  const request = req(url, headers);
  Object.defineProperty(request, 'cf', { value: { country } });
  return request;
};

// Full uppsättning för att testa själva språkvalslogiken oberoende av vilka
// språk som råkar vara publicerade just nu.
const ALLA = ['sv', 'nb', 'da', 'en', 'fi', 'nl', 'de', 'fr', 'es', 'it', 'pt'];

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
  // innehåller alla elva språk, så själva valet ("da" trumfar Accept-Language)
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

test('alla appspråk går till sin egen webbsida', () => {
  const forcedUrl = new URL('https://wagergolf.se/go?l=de-DE');
  const forcedRequest = req(forcedUrl.toString(), { 'accept-language': 'sv-SE' });
  assert.strictEqual(pickLang(forcedUrl, forcedRequest, ALLA), 'de');

  const detectedUrl = new URL('https://wagergolf.se/go');
  const detectedRequest = req(detectedUrl.toString(), { 'accept-language': 'fi-FI,fi;q=0.9' });
  assert.strictEqual(pickLang(detectedUrl, detectedRequest, ALLA), 'fi');
});

test('första stödda språket i Accept-Language vinner', () => {
  const url = new URL('https://wagergolf.se/go');
  const request = req(url.toString(), { 'accept-language': 'pl-PL,de-DE;q=0.9,sv;q=0.8' });
  assert.strictEqual(pickLang(url, request, ALLA), 'de');
});

test('Accept-Language följer q-värden och ignorerar q=0', () => {
  const url = new URL('https://wagergolf.se/go');
  assert.strictEqual(
    pickLang(url, req(url.toString(), { 'accept-language': 'de;q=0.2, sv;q=1' }), ALLA),
    'sv',
  );
  assert.strictEqual(
    pickLang(url, req(url.toString(), { 'accept-language': 'da;q=0, en;q=0.8' }), ALLA),
    'en',
  );
});

test('Accept-Language ignorerar ogiltiga q-värden och behåller ordningen vid lika vikt', () => {
  const url = new URL('https://wagergolf.se/go');
  assert.strictEqual(
    pickLang(url, req(url.toString(), { 'accept-language': 'da;q=oops, nb;q=0.8' }), ALLA),
    'nb',
  );
  assert.strictEqual(
    pickLang(url, req(url.toString(), { 'accept-language': 'da;q=0.8, en;q=0.8' }), ALLA),
    'da',
  );
});

test('GeoIP används när inget webbspråk känns igen', () => {
  const cases = {
    SE: 'sv', DK: 'da', NO: 'nb', IE: 'en', FI: 'fi', NL: 'nl', AT: 'de',
    PT: 'pt', BE: 'en', DE: 'de', FR: 'fr', ES: 'es', IT: 'it', US: 'en',
  };
  for (const [country, expected] of Object.entries(cases)) {
    const url = new URL('https://wagergolf.se/go');
    const request = req(url.toString(), {
      'accept-language': 'pl-PL',
      'CF-IPCountry': country,
    });
    assert.strictEqual(pickLang(url, request, ALLA), expected, country);
  }
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

test('de sju nya språken leder till sina egna startsidor', async () => {
  for (const lang of ['fi', 'nl', 'de', 'fr', 'es', 'it', 'pt']) {
    const res = await onRequestGet({ request: req(`https://wagergolf.se/go?l=${lang}`) });
    assert.strictEqual(res.headers.get('Location'), `/${lang}/`, lang);
  }
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

test('GeoIP-marknaden följer med till landningssidan', async () => {
  const res = await onRequestGet({
    request: req('https://wagergolf.se/go', {
      'accept-language': 'de-DE',
      'CF-IPCountry': 'AT',
    }),
  });
  assert.strictEqual(res.headers.get('Location'), '/de/?m=AT');
});

test('US-GeoIP går till engelska sidan med US kvar för den stängda grinden', async () => {
  const res = await onRequestGet({
    request: req('https://wagergolf.se/go', {
      'accept-language': 'pl-PL',
      'CF-IPCountry': 'US',
    }),
  });
  assert.strictEqual(res.headers.get('Location'), '/en/?m=US');
});

test('Workers request.cf.country styr marknaden utan GeoIP-header', async () => {
  const res = await onRequestGet({
    request: reqWithCf('https://wagergolf.se/go', 'DE', { 'accept-language': 'pl-PL' }),
  });
  assert.strictEqual(res.headers.get('Location'), '/de/?m=DE');
});

test('ogiltig eller tom explicit marknad följer med och kan inte maskeras av GeoIP', async () => {
  const invalid = await onRequestGet({
    request: reqWithCf('https://wagergolf.se/go?m=DEU', 'SE'),
  });
  assert.strictEqual(invalid.headers.get('Location'), '/?m=DEU');

  const empty = await onRequestGet({
    request: reqWithCf('https://wagergolf.se/go?m=', 'SE'),
  });
  assert.strictEqual(empty.headers.get('Location'), '/?m=');
});

test('svaret får aldrig cachas delat', async () => {
  const res = await onRequestGet({ request: req('https://wagergolf.se/go') });
  assert.strictEqual(res.headers.get('Cache-Control'), 'no-store');
  assert.strictEqual(res.headers.get('Vary'), 'Accept-Language, CF-IPCountry');
});

test('en trasig QR-kod landar ändå någonstans vettigt', async () => {
  const res = await onRequestGet({ request: req('https://wagergolf.se/go?l=klingon&c=') });
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.get('Location'), '/');
});
