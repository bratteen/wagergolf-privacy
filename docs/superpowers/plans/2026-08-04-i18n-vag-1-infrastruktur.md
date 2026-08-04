# Flerspråkig infrastruktur (våg 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bygg all maskininfrastruktur för fyra språk på wagergolf.se utan att
publicera ett enda nytt språk och utan att ändra en enda byte i den svenska
HTML-outputen.

**Architecture:** Varje sida får `lang` och en språkoberoende `key`. Lokaliserade
sökvägssegment ligger i `_data/routes.js`, UI-strängar i `_data/i18n/`, och
hreflang-relationer härleds genom att gruppera `collections.all` på `key`. De
tre delade layouterna byts från hårdkodad svenska till uppslagningar. Så länge
bara svenska är publicerat returnerar alla språkfunktioner tomt, vilket gör
outputen oförändrad och därmed strikt verifierbar.

**Tech Stack:** Eleventy 3.1.6, Nunjucks, Node 24 (`node:test`, `node:assert`,
`Intl`), Cloudflare Pages Functions (ESM).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-04-flersprakig-sajt-design.md`
- Språkkoder (`lang`): `sv`, `nb`, `da`, `en`. **Aldrig `dk` eller `se`** — de är
  landskoder och ogiltiga som hreflang.
- Sökvägsprefix: `` (sv), `/no` (nb), `/dk` (da), `/en` (en).
- `publishedLocales` är `["sv"]` genom hela denna plan. Inget språk publiceras.
- Svensk HTML-output ska vara byte-identisk efter varje task. Verifieras med
  `npm run check:sv`.
- Kommentarer skrivs på svenska och förklarar *varför*, inte *vad* — följ tonen
  i `_data/site.js` och `functions/ladda-ner.js`.
- `_data/**` och `lib/**` är CommonJS (`module.exports`). `scripts/**` och
  `functions/**` är ESM. Blanda inte inom en fil.
- Inga nya npm-beroenden. `node:test` räcker.
- Ingen cookie, ingen `localStorage`, ingen `sessionStorage` utom där denna plan
  uttryckligen anger det (endast språkbannerns avfärdande).

---

### Task 1: Regressionsskyddet, före allt annat

Detta måste vara första task. Baseline måste fångas medan koden fortfarande är
orörd — efter en enda refaktorering är den värdelös.

**Files:**
- Create: `scripts/check-sv-unchanged.mjs`
- Create: `.sv-baseline.json`
- Modify: `package.json:9-17`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `npm run check:sv` — jämför byggd svensk HTML mot baseline, exit 1
  vid skillnad. `npm run baseline:sv` — skriver om baseline medvetet.

- [ ] **Step 1: Skriv skriptet**

Skapa `scripts/check-sv-unchanged.mjs`:

```js
// Låser den svenska HTML-outputen medan flerspråksinfrastrukturen byggs.
//
// Hela våg 1 skriver om de delade layouterna från hårdkodad svenska till
// uppslagningar i _data/i18n och _data/routes. Det är en refaktorering av
// exakt den kod som producerar sajtens mest värdefulla tillgång: den
// befintliga svenska rankingen. Utan ett strikt lås är det omöjligt att veta
// att en av ett femtiotal strängbyten inte tappade ett ord.
//
// Baseline fångas innan första ändringen och tas bort när våg 1 är klar.
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const SITE = '_site';
const BASELINE = '.sv-baseline.json';

// Sökvägar som tillhör ett annat språk än svenska. De ska inte låsas, för de
// är hela poängen med arbetet.
const FOREIGN = /^\/(no|dk|en)\//;

/** Alla .html-filer i _site, som URL-liknande nycklar. */
async function htmlFiles(dir, base = '') {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const rel = `${base}/${entry.name}`;
    if (entry.isDirectory()) out.push(...(await htmlFiles(path.join(dir, entry.name), rel)));
    else if (entry.name.endsWith('.html')) out.push(rel);
  }
  return out.sort();
}

/** Asset-versionerna är innehållshashar. Ändrar vi download-link.js byter
 *  ?v=-strängen i varje sida utan att sidans egen text rört sig. Normalisera
 *  bort dem, annars larmar låset på fel saker. */
function normalise(html) {
  return html.replace(/\?v=[0-9a-f]{8}/g, '?v=HASH');
}

async function fingerprint() {
  const files = (await htmlFiles(SITE)).filter((f) => !FOREIGN.test(f));
  const map = {};
  for (const f of files) {
    const html = normalise(await readFile(path.join(SITE, f), 'utf8'));
    map[f] = createHash('sha256').update(html).digest('hex').slice(0, 16);
  }
  return map;
}

const current = await fingerprint();

if (process.argv.includes('--write')) {
  await writeFile(BASELINE, JSON.stringify(current, null, 2) + '\n');
  console.log(`Baseline skriven: ${Object.keys(current).length} svenska sidor.`);
  process.exit(0);
}

let baseline;
try {
  baseline = JSON.parse(await readFile(BASELINE, 'utf8'));
} catch {
  console.error(`Ingen baseline. Kör: npm run baseline:sv`);
  process.exit(1);
}

const failures = [];
for (const [file, hash] of Object.entries(baseline)) {
  if (!(file in current)) failures.push(`${file}: saknas i bygget`);
  else if (current[file] !== hash) failures.push(`${file}: innehållet har ändrats`);
}
for (const file of Object.keys(current)) {
  if (!(file in baseline)) failures.push(`${file}: ny svensk sida, inte i baseline`);
}

if (failures.length > 0) {
  console.error('Svensk output har ändrats:');
  for (const f of failures) console.error(`- ${f}`);
  console.error('\nOm ändringen är avsiktlig: npm run baseline:sv');
  process.exit(1);
}

console.log(`Svensk output oförändrad (${Object.keys(baseline).length} sidor).`);
```

- [ ] **Step 2: Lägg till npm-scripten**

I `package.json`, i `"scripts"`, efter `"check:legal"`:

```json
    "check:sv": "node scripts/check-sv-unchanged.mjs",
    "baseline:sv": "node scripts/check-sv-unchanged.mjs --write",
    "test": "node --test tests/",
```

Och ändra `"check"` till:

```json
    "check": "npm run build && npm run check:legal && npm run check:sv && npm run validate:html",
```

`npm test` kopplas medvetet **inte** in i `check` här. `node --test` på en
katalog utan testfiler avslutar med fel, och det första testet skapas först i
Task 2. Task 2 kopplar in det.

- [ ] **Step 3: Skapa tests-katalogen**

```bash
mkdir -p tests && printf '' > tests/.gitkeep
```

- [ ] **Step 4: Bygg och fånga baseline**

```bash
npm run build && npm run baseline:sv
```

Förväntat: `Baseline skriven: 29 svenska sidor.` (Exakt antal kan variera;
kontrollera att `_site/index.html`, `_site/om/index.html`,
`_site/spelformer/stableford/index.html` och `_site/404.html` finns i
`.sv-baseline.json`.)

- [ ] **Step 5: Verifiera att låset faktiskt låser**

```bash
npm run check:sv
```
Förväntat: `Svensk output oförändrad (…)`.

Bevisa sedan att det larmar:

```bash
printf '\n<!-- x -->' >> _site/index.html && npm run check:sv; echo "exit=$?"
```
Förväntat: `- /index.html: innehållet har ändrats` och `exit=1`.

Återställ:
```bash
npm run build && npm run check:sv
```

- [ ] **Step 6: Committa**

`.sv-baseline.json` **ska** checkas in — den är temporär men måste delas mellan
tasks och sessioner. Den tas bort i sista task.

```bash
git add scripts/check-sv-unchanged.mjs .sv-baseline.json package.json tests/.gitkeep
git commit -m "test(i18n): lås svensk HTML-output under refaktoreringen

Baseline fångad innan första ändringen. Hela våg 1 skriver om de delade
layouterna, och utan ett strikt lås går det inte att veta att ett av ett
femtiotal strängbyten inte tappade ett ord.

Asset-versionerna normaliseras bort, de är innehållshashar som byter när
download-link.js ändras utan att sidans text rört sig."
```

---

### Task 2: `_data/routes.js`

**Files:**
- Create: `_data/routes.js`
- Create: `tests/routes.test.js`

**Interfaces:**
- Produces: `routes.locales[lang]` med `{ prefix, hreflang, htmlLang, intl, label, formats, glossary, about, download }`.
  `routes.defaultLocale = "sv"`. `routes.publishedLocales = ["sv"]`.
  `routes.pathFor(lang, segment, slug)` → sträng.

- [ ] **Step 1: Skriv det fallerande testet**

Skapa `tests/routes.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const routes = require('../_data/routes.js');

test('svenska ligger i roten utan prefix', () => {
  assert.strictEqual(routes.locales.sv.prefix, '');
});

test('marknadsbaserade prefix, språkbaserad hreflang', () => {
  assert.strictEqual(routes.locales.da.prefix, '/dk');
  assert.strictEqual(routes.locales.da.hreflang, 'da');
  assert.strictEqual(routes.locales.nb.prefix, '/no');
  assert.strictEqual(routes.locales.nb.hreflang, 'nb');
});

test('ingen hreflang är en landskod', () => {
  const forbidden = new Set(['dk', 'se', 'no-NO', 'gb']);
  for (const [lang, cfg] of Object.entries(routes.locales)) {
    assert.ok(!forbidden.has(cfg.hreflang), `${lang} har ogiltig hreflang ${cfg.hreflang}`);
  }
});

test('bara svenska är publicerat i våg 1', () => {
  assert.deepStrictEqual(routes.publishedLocales, ['sv']);
});

test('pathFor bygger lokaliserade sökvägar', () => {
  assert.strictEqual(routes.pathFor('sv', 'formats', 'stableford'), '/spelformer/stableford/');
  assert.strictEqual(routes.pathFor('da', 'formats', 'stableford'), '/dk/spilformer/stableford/');
  assert.strictEqual(routes.pathFor('en', 'formats'), '/en/game-formats/');
  assert.strictEqual(routes.pathFor('sv', 'about'), '/om/');
});
```

- [ ] **Step 2: Kör testet, se det falla**

Run: `node --test tests/routes.test.js`
Förväntat: FAIL, `Cannot find module '../_data/routes.js'`.

- [ ] **Step 3: Skriv implementationen**

Skapa `_data/routes.js`:

```js
// Lokaliserade sökvägssegment per språk. Mallar bygger alla interna länkar
// härifrån i stället för att hårdkoda svenska sökvägar.
//
// Nyckeln är SPRÅKET (da), sökvägen är MARKNADEN (/dk). De två sammanfaller
// för nb och /no bara av en slump: "no" är både språkkod och landskod, medan
// "da" enbart är språkkod och "dk" enbart landskod. Marknadsbaserade sökvägar
// valdes för att /no/ och /dk/ är vad besökarna känner igen från .no och .dk,
// och för att appen säljs per App Store-storefront, som är landsindelad.
//
// hreflang tas ALLTID från hreflang-fältet, aldrig från prefixet. hreflang="dk"
// är ogiltig och ignoreras tyst av Google, utan varning i Search Console.
const LOCALES = {
  sv: {
    prefix: "", hreflang: "sv", htmlLang: "sv", intl: "sv-SE", label: "Svenska",
    formats: "spelformer", glossary: "ordlista", about: "om", download: "ladda-ner",
  },
  nb: {
    prefix: "/no", hreflang: "nb", htmlLang: "nb", intl: "nb-NO", label: "Norsk",
    formats: "spilleformer", glossary: "ordliste", about: "om-oss", download: "last-ned",
  },
  da: {
    prefix: "/dk", hreflang: "da", htmlLang: "da", intl: "da-DK", label: "Dansk",
    formats: "spilformer", glossary: "ordliste", about: "om-os", download: "hent",
  },
  en: {
    prefix: "/en", hreflang: "en", htmlLang: "en", intl: "en-GB", label: "English",
    formats: "game-formats", glossary: "glossary", about: "about", download: "download",
  },
};

// Vilka språk som är live. Både hreflang-härledningen och sitemap filtrerar mot
// den här listan, så ett halvöversatt språk kan byggas och granskas lokalt utan
// att exponeras. Ett språk läggs till i samma commit som dess sista sida.
const PUBLISHED = ["sv"];

/** Bygger en lokaliserad sökväg: pathFor("da", "formats", "stableford")
 *  ger "/dk/spilformer/stableford/". Utan slug ges sektionens indexsida. */
function pathFor(lang, segment, slug) {
  const loc = LOCALES[lang];
  if (!loc) throw new Error(`Okänt språk: ${lang}`);
  const seg = loc[segment];
  if (!seg) throw new Error(`Okänt segment "${segment}" för ${lang}`);
  return slug ? `${loc.prefix}/${seg}/${slug}/` : `${loc.prefix}/${seg}/`;
}

/** Startsidan för ett språk. Svenska ger "/", övriga "/no/" osv. */
function homeFor(lang) {
  return `${LOCALES[lang].prefix}/`;
}

module.exports = {
  locales: LOCALES,
  defaultLocale: "sv",
  publishedLocales: PUBLISHED,
  pathFor,
  homeFor,
};
```

- [ ] **Step 4: Kör testet, se det passera**

Run: `node --test tests/routes.test.js`
Förväntat: PASS, 5 tester.

- [ ] **Step 5: Koppla in testerna i `check`**

Nu finns det första testet, så `npm test` kan bli en del av kedjan. I
`package.json`, ändra `"check"` till:

```json
    "check": "npm run build && npm test && npm run check:legal && npm run check:sv && npm run validate:html",
```

Och ta bort `tests/.gitkeep` — katalogen har riktigt innehåll nu:

```bash
git rm tests/.gitkeep
```

- [ ] **Step 6: Verifiera att svenskan är orörd**

```bash
npm run check
```
Förväntat: allt grönt, inklusive `Svensk output oförändrad`. Ny datafil som
ingen mall läser ännu ska inte kunna påverka något.

- [ ] **Step 7: Committa**

```bash
git add _data/routes.js tests/routes.test.js package.json
git commit -m "feat(i18n): lokaliserade sökvägssegment per språk

Nyckeln är språket (da), sökvägen marknaden (/dk). hreflang tas alltid ur
hreflang-fältet och aldrig ur prefixet, så hreflang=\"dk\" inte kan uppstå."
```

---

### Task 3: UI-strängar och `t`-uppslagning

Endast svenska. Övriga språk skapas i sina egna vågor, efter att termordlistan
granskats — att gissa dem nu vore att gå före den grinden.

**Files:**
- Create: `_data/i18n/sv.json`
- Create: `_data/eleventyComputed.js`
- Create: `tests/i18n.test.js`

**Interfaces:**
- Consumes: `routes` från Task 2.
- Produces: `{{ lang }}` (default `"sv"`) och `{{ t }}` i alla mallar.
  `{{ t.nav.formats }}` osv. Nyckelschemat nedan är kontraktet som
  `nb.json`/`da.json`/`en.json` måste följa i senare vågor.

- [ ] **Step 1: Skriv det fallerande testet**

Skapa `tests/i18n.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const sv = require('../_data/i18n/sv.json');

// Kontraktet varje språkfil måste uppfylla. Senare vågor lägger till
// nb.json, da.json och en.json och kör samma kontroll mot dem.
const REQUIRED = [
  'nav.features', 'nav.formats', 'nav.download',
  'breadcrumb.home',
  'byline.by', 'byline.updated',
  'faq.heading',
  'guide.ctaHeading', 'guide.ctaText', 'guide.related',
  'article.related', 'article.ctaText',
  'footer.formats', 'footer.glossary', 'footer.about',
  'footer.privacy', 'footer.terms', 'footer.contact', 'footer.tagline',
  'store.sub',
  'switcher.label',
  'banner.text', 'banner.close',
];

function get(obj, dotted) {
  return dotted.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}

test('sv.json har alla nycklar i kontraktet', () => {
  for (const key of REQUIRED) {
    const value = get(sv, key);
    assert.ok(typeof value === 'string' && value.length > 0, `saknar ${key}`);
  }
});

test('guide.ctaHeading har platshållaren för spelformens namn', () => {
  assert.ok(sv.guide.ctaHeading.includes('{format}'));
});

test('banner.text har platshållaren för språknamnet', () => {
  assert.ok(sv.banner.text.includes('{language}'));
});
```

- [ ] **Step 2: Kör testet, se det falla**

Run: `node --test tests/i18n.test.js`
Förväntat: FAIL, `Cannot find module '../_data/i18n/sv.json'`.

- [ ] **Step 3: Skriv språkfilen**

Strängarna är kopierade **ordagrant** ur nuvarande mallar. Ändras ett enda
tecken bryts låset i Task 1 och det är avsiktligt.

Skapa `_data/i18n/sv.json`:

```json
{
  "nav": {
    "features": "Funktioner",
    "formats": "Spelformer",
    "download": "Ladda ner"
  },
  "breadcrumb": {
    "home": "Hem"
  },
  "byline": {
    "by": "Av",
    "updated": "Uppdaterad"
  },
  "faq": {
    "heading": "Vanliga frågor"
  },
  "guide": {
    "ctaHeading": "Slipp räkna {format} för hand",
    "ctaText": "Wager Golf scorar rundan automatiskt med rätt WHS-handicap och gör upp med Swish när ni går in.",
    "related": "Fler spelformer"
  },
  "article": {
    "related": "Läs vidare",
    "ctaText": "Wager Golf scorar rundan automatiskt med rätt WHS-handicap och gör upp med Swish när ni går in."
  },
  "footer": {
    "formats": "Spelformer",
    "glossary": "Ordlista",
    "about": "Om",
    "privacy": "Integritetspolicy",
    "terms": "Användarvillkor",
    "contact": "Kontakt",
    "tagline": "Byggd i Sverige, för golfgänget"
  },
  "store": {
    "sub": "LADDA NER PÅ"
  },
  "switcher": {
    "label": "Språk"
  },
  "banner": {
    "text": "Den här sidan finns också på {language}",
    "close": "Stäng"
  }
}
```

- [ ] **Step 4: Skriv uppslagningen som delad modul**

Skapa `lib/i18n.js`:

```js
// Strängar för ett språk.
//
// Ligger i lib/ och inte bara i _data/eleventyComputed.js därför att
// guidernas katalogdatafil också behöver dem, och ordningen mellan
// eleventyComputed på global nivå och på katalognivå är inte garanterad i
// Eleventy. Att båda anropar samma funktion tar bort beroendet helt.
const routes = require("./../_data/routes.js");

/** Strängarna för ett språk. Faller tillbaka på svenska så länge ett språks
 *  fil inte finns än. Alternativet vore att bygget kraschar mitt i en
 *  halvfärdig översättning, och det hjälper ingen. */
function stringsFor(lang) {
  const target = routes.locales[lang] ? lang : routes.defaultLocale;
  try {
    return require(`./../_data/i18n/${target}.json`);
  } catch {
    return require("./../_data/i18n/sv.json");
  }
}

module.exports = { stringsFor };
```

Skapa `_data/eleventyComputed.js`:

```js
// lang och t sätts för varje sida. Katalogdatafilerna (no/no.11tydata.js osv.)
// sätter lang; saknas det är sidan svensk.
const routes = require("./routes.js");
const { stringsFor } = require("../lib/i18n.js");

module.exports = {
  lang: (data) => data.lang || routes.defaultLocale,
  t: (data) => stringsFor(data.lang || routes.defaultLocale),
};
```

- [ ] **Step 5: Kör testet, se det passera**

Run: `node --test tests/i18n.test.js`
Förväntat: PASS, 3 tester.

- [ ] **Step 6: Verifiera att svenskan är orörd**

```bash
npm run build && npm run check:sv
```
Förväntat: `Svensk output oförändrad`. Ingen mall läser `t` ännu.

- [ ] **Step 7: Committa**

```bash
git add _data/i18n/sv.json _data/eleventyComputed.js lib/i18n.js tests/i18n.test.js
git commit -m "feat(i18n): svenska UI-strängar och t-uppslagning

Strängarna är ordagrant kopierade ur mallarna. Testet låser nyckelschemat
som nb, da och en måste följa när de skapas i sina vågor."
```

---

### Task 4: `lib/alternates.js` — hreflang-härledning

**Files:**
- Create: `lib/alternates.js`
- Create: `tests/alternates.test.js`
- Modify: `.eleventy.js` (registrera filtret)

**Interfaces:**
- Consumes: `routes` från Task 2.
- Produces: `alternatesFor(all, key, routes)` → `{ links: [{lang, hreflang, url}], xDefault: string|null }`.
  Registrerat som Nunjucks-filter `alternates`.

- [ ] **Step 1: Skriv det fallerande testet**

Skapa `tests/alternates.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const { alternatesFor } = require('../lib/alternates.js');
const routes = require('../_data/routes.js');

// Minimal stand-in för Eleventys collections.all.
const page = (lang, key, url) => ({ url, data: { lang, key } });

const ALL = [
  page('sv', 'guide:stableford', '/spelformer/stableford/'),
  page('da', 'guide:stableford', '/dk/spilformer/stableford/'),
  page('nb', 'guide:stableford', '/no/spilleformer/stableford/'),
  page('sv', 'page:about', '/om/'),
  page('en', 'guide:skins', '/en/game-formats/skins/'),
];

const many = { ...routes, publishedLocales: ['sv', 'nb', 'da', 'en'] };
const onlySv = { ...routes, publishedLocales: ['sv'] };

test('ett publicerat språk ger inga alternativ alls', () => {
  const out = alternatesFor(ALL, 'guide:stableford', onlySv);
  assert.deepStrictEqual(out.links, []);
  assert.strictEqual(out.xDefault, null);
});

test('flera språk ger en länk per publicerad översättning', () => {
  const out = alternatesFor(ALL, 'guide:stableford', many);
  assert.deepStrictEqual(
    out.links.map((l) => [l.hreflang, l.url]),
    [
      ['sv', '/spelformer/stableford/'],
      ['nb', '/no/spilleformer/stableford/'],
      ['da', '/dk/spilformer/stableford/'],
    ],
  );
});

test('x-default pekar på svenskan', () => {
  const out = alternatesFor(ALL, 'guide:stableford', many);
  assert.strictEqual(out.xDefault, '/spelformer/stableford/');
});

test('sida som saknar översättningar ger tomt, inte en ensam självlänk', () => {
  const out = alternatesFor(ALL, 'page:about', many);
  assert.deepStrictEqual(out.links, []);
  assert.strictEqual(out.xDefault, null);
});

test('två översättningar räcker för att listan ska skrivas ut', () => {
  const tva = [
    page('sv', 'page:invite', '/i/'),
    page('en', 'page:invite', '/en/invite/'),
  ];
  const out = alternatesFor(tva, 'page:invite', many);
  assert.deepStrictEqual(out.links.map((l) => l.hreflang), ['sv', 'en']);
  assert.strictEqual(out.xDefault, '/i/');
});

test('opublicerat språk utelämnas även om sidan finns', () => {
  const utan_en = { ...routes, publishedLocales: ['sv', 'nb', 'da'] };
  const out = alternatesFor(ALL, 'guide:skins', utan_en);
  assert.deepStrictEqual(out.links, []);
  assert.strictEqual(out.xDefault, null);
});

test('sida utan key ger inga alternativ', () => {
  const out = alternatesFor(ALL, undefined, many);
  assert.deepStrictEqual(out.links, []);
});

test('hreflang tas ur språkkonfigurationen, aldrig ur sökvägen', () => {
  const out = alternatesFor(ALL, 'guide:stableford', many);
  const da = out.links.find((l) => l.url.startsWith('/dk/'));
  assert.strictEqual(da.hreflang, 'da');
});
```

- [ ] **Step 2: Kör testet, se det falla**

Run: `node --test tests/alternates.test.js`
Förväntat: FAIL, `Cannot find module '../lib/alternates.js'`.

- [ ] **Step 3: Skriv implementationen**

Skapa `lib/alternates.js`:

```js
// Härleder hreflang-relationerna genom att gruppera sidor på deras
// språkoberoende key.
//
// 27 sidor gånger fyra språk är 108 sidor som var och en ska peka på fyra
// URL:er. Handunderhållet av den matrisen ruttnar. Genom att härleda den blir
// en saknad översättning ett tomrum i listan i stället för en trasig länk.
//
// Med bara ett publicerat språk returneras tomt. hreflang med en enda
// språkversion säger ingenting, och tomrumet gör att den svenska outputen är
// oförändrad under hela våg 1.

/** Alla publicerade språkversioner av sidan med given key.
 *  @returns {{links: Array<{lang: string, hreflang: string, url: string}>, xDefault: string|null}} */
function alternatesFor(all, key, routes) {
  const empty = { links: [], xDefault: null };
  if (!key) return empty;

  const published = routes.publishedLocales;
  if (published.length < 2) return empty;

  const links = (all || [])
    .filter((p) => p.data && p.data.key === key && published.includes(p.data.lang))
    // Ordningen följer publishedLocales så outputen är stabil mellan byggen.
    .sort((a, b) => published.indexOf(a.data.lang) - published.indexOf(b.data.lang))
    .map((p) => ({
      lang: p.data.lang,
      // Alltid ur språkkonfigurationen. Att härleda den ur sökvägen skulle ge
      // hreflang="dk" för /dk/, vilket är ogiltigt och tyst ignoreras.
      hreflang: routes.locales[p.data.lang].hreflang,
      url: p.url,
    }));

  // Färre än två faktiska översättningar: samma resonemang som ovan. En ensam
  // självrefererande hreflang beskriver inga alternativ och säger ingenting.
  // Kontraktet konsumeras av fyra ställen — hreflang-blocket, språkväljaren,
  // bannern och sitemapen — och är enklare att lita på när det aldrig ger en
  // lista med exakt ett element.
  if (links.length < 2) return empty;

  const fallback = links.find((l) => l.lang === routes.defaultLocale);
  return { links, xDefault: fallback ? fallback.url : null };
}

module.exports = { alternatesFor };
```

- [ ] **Step 4: Registrera filtret**

I `.eleventy.js`, överst:

```js
const { alternatesFor } = require("./lib/alternates.js");
```

Och bland filtren, efter `byCategory`:

```js
  // Språkversioner av samma sida, för hreflang och språkväljaren.
  eleventyConfig.addFilter("alternates", (all, key, routes) =>
    alternatesFor(all, key, routes),
  );
```

- [ ] **Step 5: Kör testerna, se dem passera**

Run: `node --test tests/alternates.test.js`
Förväntat: PASS, 8 tester.

- [ ] **Step 6: Verifiera att svenskan är orörd**

```bash
npm run build && npm run check:sv
```
Förväntat: `Svensk output oförändrad`.

- [ ] **Step 7: Committa**

```bash
git add lib/alternates.js tests/alternates.test.js .eleventy.js
git commit -m "feat(i18n): härled hreflang genom att gruppera sidor på key

Returnerar tomt vid färre än två publicerade språk. hreflang med en enda
språkversion säger ingenting, och tomrummet håller svensk output oförändrad
under hela våg 1."
```

---

### Task 5: `lib/structured-data.js` — bryt ut JSON-LD-byggaren

**Files:**
- Create: `lib/structured-data.js`
- Modify: `spelformer/guides/guides.11tydata.js:12-74`
- Create: `tests/structured-data.test.js`

**Interfaces:**
- Consumes: `routes` från Task 2.
- Produces: `guideGraph({ base, url, lang, format, h1, title, description, published, updated, image, faq, breadcrumbHome, breadcrumbFormats, formatsUrl })` → JSON-sträng.

Motivet till utflyttningen: fyra katalogdatafiler skulle annars innehålla fyra
kopior av samma sextio rader, och de skulle glida isär vid första ändringen.

- [ ] **Step 1: Skriv det fallerande testet**

Skapa `tests/structured-data.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const { guideGraph } = require('../lib/structured-data.js');

const ARGS = {
  base: 'https://wagergolf.se',
  url: 'https://wagergolf.se/spelformer/stableford/',
  lang: 'sv',
  format: 'Stableford',
  h1: 'Stableford (poängbogey) i golf',
  title: 'Stableford | Wager Golf',
  description: 'Poängtabellen och hur poängen räknas.',
  published: '2026-06-14',
  updated: '2026-06-20',
  image: 'https://wagergolf.se/assets/og-image.png',
  faq: [{ q: 'Fråga?', a: 'Svar.' }],
  breadcrumbHome: 'Hem',
  breadcrumbFormats: 'Spelformer',
  formatsUrl: 'https://wagergolf.se/spelformer/',
};

test('inLanguage följer språket', () => {
  const sv = JSON.parse(guideGraph(ARGS));
  const article = sv['@graph'].find((n) => n['@type'] === 'Article');
  assert.strictEqual(article.inLanguage, 'sv-SE');

  const da = JSON.parse(guideGraph({ ...ARGS, lang: 'da' }));
  const daArticle = da['@graph'].find((n) => n['@type'] === 'Article');
  assert.strictEqual(daArticle.inLanguage, 'da-DK');
});

test('breadcrumb använder de skickade namnen', () => {
  const graph = JSON.parse(guideGraph({
    ...ARGS, breadcrumbHome: 'Home', breadcrumbFormats: 'Game formats',
  }));
  const crumbs = graph['@graph'].find((n) => n['@type'] === 'BreadcrumbList');
  assert.deepStrictEqual(crumbs.itemListElement.map((i) => i.name),
    ['Home', 'Game formats', 'Stableford']);
});

test('FAQPage läggs bara till när det finns frågor', () => {
  const utan = JSON.parse(guideGraph({ ...ARGS, faq: [] }));
  assert.ok(!utan['@graph'].some((n) => n['@type'] === 'FAQPage'));

  const med = JSON.parse(guideGraph(ARGS));
  assert.ok(med['@graph'].some((n) => n['@type'] === 'FAQPage'));
});

test('dateModified faller tillbaka på published', () => {
  const graph = JSON.parse(guideGraph({ ...ARGS, updated: null }));
  const article = graph['@graph'].find((n) => n['@type'] === 'Article');
  assert.strictEqual(article.dateModified, '2026-06-14');
});
```

- [ ] **Step 2: Kör testet, se det falla**

Run: `node --test tests/structured-data.test.js`
Förväntat: FAIL, `Cannot find module '../lib/structured-data.js'`.

- [ ] **Step 3: Skriv implementationen**

Skapa `lib/structured-data.js`:

```js
// JSON-LD för guidesidorna, delad av alla språk.
//
// Låg tidigare inline i spelformer/guides/guides.11tydata.js. Med fyra
// språkkataloger skulle den koden finnas i fyra kopior som glider isär vid
// första ändringen, därför ligger den här.
const routes = require("../_data/routes.js");

/** BCP 47-tagg för schema.orgs inLanguage. Inte samma sak som hreflang:
 *  hreflang vill ha den kortaste entydiga formen, schema.org vill ha
 *  språk-region. */
function inLanguage(lang) {
  return routes.locales[lang] ? routes.locales[lang].intl : "sv-SE";
}

function guideGraph({
  base, url, lang, format, h1, title, description,
  published, updated, image, faq,
  breadcrumbHome, breadcrumbFormats, formatsUrl,
}) {
  const modified = updated || published;
  const graph = [
    {
      "@type": "Organization",
      "@id": base + "/#org",
      name: "Wager Golf",
      url: base,
      logo: {
        "@type": "ImageObject",
        url: base + "/assets/logo.png",
        width: 192,
        height: 192,
      },
    },
    {
      "@type": "Person",
      "@id": base + "/#person",
      name: "Gustaf Bratt",
      url: base + "/om/",
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: breadcrumbHome, item: base + "/" },
        { "@type": "ListItem", position: 2, name: breadcrumbFormats, item: formatsUrl },
        { "@type": "ListItem", position: 3, name: format, item: url },
      ],
    },
    {
      "@type": "Article",
      headline: h1 || title,
      description: description,
      mainEntityOfPage: url,
      inLanguage: inLanguage(lang),
      datePublished: published,
      dateModified: modified,
      image: image,
      author: { "@id": base + "/#person" },
      publisher: { "@id": base + "/#org" },
    },
  ];

  if (Array.isArray(faq) && faq.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }

  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
}

module.exports = { guideGraph, inLanguage };
```

**Varning:** `Person.url` är hårdkodat `base + "/om/"`. Det är medvetet i våg 1
— att ändra det skulle bryta låset. Det pekas om per språk i våg 3, när
`/en/about/` faktiskt finns.

- [ ] **Step 4: Koppla in den i guidernas katalogdata**

Ersätt hela `eleventyComputed`-blocket i `spelformer/guides/guides.11tydata.js`
(rad 12–74) med:

```js
  eleventyComputed: {
    // key är språkoberoende och kopplar ihop översättningarna av samma guide.
    key: (data) => `guide:${data.slug}`,
    permalink: (data) => `${require("../../_data/routes.js").pathFor(data.lang || "sv", "formats", data.slug)}`,
    structuredData: (data) => {
      const routes = require("../../_data/routes.js");
      const { guideGraph } = require("../../lib/structured-data.js");
      const lang = data.lang || "sv";
      const base = data.site.url;
      const image = data.image
        ? (String(data.image).startsWith("http") ? data.image : base + data.image)
        : data.site.ogImage;
      return guideGraph({
        base,
        url: base + routes.pathFor(lang, "formats", data.slug),
        lang,
        format: data.format,
        h1: data.h1,
        title: data.title,
        description: data.description,
        published: data.published || "2026-06-14",
        updated: data.updated,
        image,
        faq: data.faq,
        // stringsFor och inte data.t: ordningen mellan global och katalognivås
        // eleventyComputed är inte garanterad, så data.t kan vara odefinierad här.
        breadcrumbHome: require("../../lib/i18n.js").stringsFor(lang).breadcrumb.home,
        breadcrumbFormats: require("../../lib/i18n.js").stringsFor(lang).nav.formats,
        formatsUrl: base + routes.pathFor(lang, "formats"),
      });
    },
  },
```

- [ ] **Step 5: Kör testerna**

Run: `node --test tests/`
Förväntat: PASS, alla tester från Task 2–5.

- [ ] **Step 6: Verifiera att svenskan är orörd — detta är stegets hela poäng**

```bash
npm run build && npm run check:sv
```
Förväntat: `Svensk output oförändrad`.

Faller det: jämför JSON-LD-blocket i `_site/spelformer/stableford/index.html`
mot `git stash`-versionen. Nyckelordningen i `JSON.stringify` måste vara
identisk — objektens egenskaper serialiseras i insättningsordning, så en
omflyttad rad i `guideGraph` ändrar strängen även om datan är densamma.

- [ ] **Step 7: Committa**

```bash
git add lib/structured-data.js spelformer/guides/guides.11tydata.js tests/structured-data.test.js
git commit -m "refactor(i18n): bryt ut JSON-LD-byggaren ur guidernas katalogdata

Fyra språkkataloger skulle annars ha fyra kopior av samma sextio rader.
inLanguage och breadcrumb-namnen kommer nu från språket, och guidernas
permalink byggs via routes.pathFor."
```

---

### Task 6: `localDate` ersätter `svDate`

**Files:**
- Modify: `.eleventy.js:23-34`
- Modify: `_includes/guide.njk:12`
- Modify: `_includes/page-article.njk:15`
- Create: `tests/local-date.test.js`

**Interfaces:**
- Produces: Nunjucks-filter `localDate(date, lang)`.

- [ ] **Step 1: Skriv det fallerande testet**

Skapa `tests/local-date.test.js`:

```js
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
  // beteende är poängen, även för skräpindata.
  assert.strictEqual(localDate('inte-ett-datum', 'sv'), 'inte-ett-d');
});

test('omöjligt datum rullas inte över tyst', () => {
  // Intl gör "2026-02-31" till 3 mars. Med 84 datumfält efter fyra språk ska
  // ett stavfel synas som stavfelet det är, inte som ett annat datum.
  assert.strictEqual(localDate('2026-02-31', 'sv'), '2026-02-31');
  assert.strictEqual(localDate('2026-04-31', 'sv'), '2026-04-31');
  // Riktiga skottdagar ska däremot formateras som vanligt.
  assert.strictEqual(localDate('2028-02-29', 'sv'), '29 februari 2028');
});

test('okänt språk faller tillbaka på svenska', () => {
  assert.strictEqual(localDate('2026-06-20', 'xx'), '20 juni 2026');
});
```

- [ ] **Step 2: Kör testet, se det falla**

Run: `node --test tests/local-date.test.js`
Förväntat: FAIL, `Cannot find module '../lib/local-date.js'`.

- [ ] **Step 3: Skriv implementationen**

Skapa `lib/local-date.js`:

```js
// Läsbart datum för by-line, per språk.
//
// Ersätter den handskrivna svenska månadsarrayen. Node har datan via Intl, och
// fyra handskrivna månadsarrayer vore fyra tillfällen att stava fel.
//
// UTC används genomgående: datumen i frontmatter är rena datum utan tid, och
// utan explicit tidszon skulle byggmaskinens zon kunna flytta dem ett dygn.
const routes = require("../_data/routes.js");

function localDate(d, lang) {
  if (!d) return "";
  const s = String(d).slice(0, 10);
  const [y, m, day] = s.split("-").map(Number);
  if (!y || !m || !day) return s;

  const dt = new Date(Date.UTC(y, m - 1, day));
  // Intl rullar över orimliga datum: "2026-02-31" blir 3 mars. Den gamla
  // svDate skrev ut "31 februari", alltså synligt fel. Med 84 datumfält efter
  // fyra språk ska ett stavfel synas som stavfelet det är, inte tyst bli ett
  // annat datum. Returnera råsträngen så den fastnar i granskningen.
  if (dt.getUTCDate() !== day || dt.getUTCMonth() !== m - 1) return s;

  const loc = routes.locales[lang] || routes.locales[routes.defaultLocale];
  return new Intl.DateTimeFormat(loc.intl, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, day)));
}

module.exports = { localDate };
```

- [ ] **Step 4: Kör testet, se det passera**

Run: `node --test tests/local-date.test.js`
Förväntat: PASS, 6 tester.

Pariteten mellan `Intl` med `sv-SE` och den handskrivna månadsarrayen är
verifierad för samtliga giltiga datum innan planen skrevs. Faller det första
testet ändå på någon månad: rapportera det i stället för att ändra testet —
låset i Task 1 skulle ändå falla, och då är hela premissen fel.

- [ ] **Step 5: Byt ut filtret i `.eleventy.js`**

Ersätt hela `svDate`-blocket (rad 23–34) med:

```js
  // Läsbart datum per språk för by-line ("2026-06-20" -> "20 juni 2026").
  const { localDate } = require("./lib/local-date.js");
  eleventyConfig.addFilter("localDate", localDate);
```

- [ ] **Step 6: Byt anropen i mallarna**

I `_includes/guide.njk` rad 12, byt `{{ updated | svDate }}` mot
`{{ updated | localDate(lang) }}`.

I `_includes/page-article.njk` rad 15, samma byte.

- [ ] **Step 7: Verifiera att svenskan är orörd**

```bash
npm run build && npm run check:sv
```
Förväntat: `Svensk output oförändrad`. Faller det på en guidesida är
datumsträngen inte identisk — jämför byline i
`_site/spelformer/stableford/index.html` med `git show HEAD:`-versionen.

- [ ] **Step 8: Committa**

```bash
git add lib/local-date.js tests/local-date.test.js .eleventy.js _includes/guide.njk _includes/page-article.njk
git commit -m "refactor(i18n): localDate via Intl ersätter handskriven svDate

Fyra handskrivna månadsarrayer vore fyra tillfällen att stava fel. Testet
jämför svenskan mot den gamla implementationen för samtliga tolv månader."
```

---

### Task 7: `key` på alla svenska sidor

Frontmatter-fält som inte renderas. Låset ska förbli grönt genom hela denna
task — faller det har en mall råkat skriva ut nyckeln.

**Files:**
- Modify: `index.njk` (frontmatter), `om.njk`, `ordlista.njk`,
  `spelformer/index.njk`, `spelformer/valja-spelform.njk`,
  `spelformer/stableford-vs-slaggolf.njk`, `404.njk`, `i/index.njk`
- Create: `tests/keys.test.js`

**Interfaces:**
- Produces: varje indexerbar sida har ett unikt `key`. Guiderna får sitt
  automatiskt via Task 5 (`guide:<slug>`).

- [ ] **Step 1: Skriv det fallerande testet**

Skapa `tests/keys.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const { readFileSync, readdirSync } = require('node:fs');

// Sidor som ska ha en key. Guiderna får sin via guides.11tydata.js och
// kontrolleras inte här. robots, sitemap, llms och indexnow-key är inte
// sidor och ska inte ha någon.
const PAGES = [
  'index.njk', 'om.njk', 'ordlista.njk',
  'spelformer/index.njk',
  'spelformer/valja-spelform.njk',
  'spelformer/stableford-vs-slaggolf.njk',
  '404.njk', 'i/index.njk',
];

test('varje sida har en key i frontmatter', () => {
  for (const file of PAGES) {
    const src = readFileSync(file, 'utf8');
    assert.match(src, /^key:\s*\S+/m, `${file} saknar key`);
  }
});

test('ingen key är använd två gånger', () => {
  const seen = new Map();
  for (const file of PAGES) {
    const key = readFileSync(file, 'utf8').match(/^key:\s*(\S+)/m)[1];
    assert.ok(!seen.has(key), `${key} används av både ${seen.get(key)} och ${file}`);
    seen.set(key, file);
  }
});

test('varje guide har ett unikt slug, som blir dess key', () => {
  const dir = 'spelformer/guides';
  const slugs = readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => readFileSync(`${dir}/${f}`, 'utf8').match(/^slug:\s*(\S+)/m)[1]);
  assert.strictEqual(new Set(slugs).size, slugs.length, 'dubblett bland guidernas slug');
  assert.strictEqual(slugs.length, 21);
});
```

- [ ] **Step 2: Kör testet, se det falla**

Run: `node --test tests/keys.test.js`
Förväntat: FAIL, `index.njk saknar key`.

- [ ] **Step 3: Lägg till nycklarna**

Lägg en rad i varje fils frontmatter, direkt efter `layout:`:

| Fil | Rad att lägga till |
|---|---|
| `index.njk` | `key: page:home` |
| `om.njk` | `key: page:about` |
| `ordlista.njk` | `key: page:glossary` |
| `spelformer/index.njk` | `key: page:formats` |
| `spelformer/valja-spelform.njk` | `key: page:choose-format` |
| `spelformer/stableford-vs-slaggolf.njk` | `key: page:stableford-vs-strokeplay` |
| `404.njk` | `key: page:404` |
| `i/index.njk` | `key: page:invite` |

- [ ] **Step 4: Kör testet, se det passera**

Run: `node --test tests/keys.test.js`
Förväntat: PASS, 3 tester.

- [ ] **Step 5: Verifiera att svenskan är orörd**

```bash
npm run build && npm run check:sv
```
Förväntat: `Svensk output oförändrad`. Frontmatter som ingen mall skriver ut
får inte synas i HTML.

- [ ] **Step 6: Committa**

```bash
git add index.njk om.njk ordlista.njk spelformer/ 404.njk i/index.njk tests/keys.test.js
git commit -m "feat(i18n): key på varje sida

Språkoberoende identitet som kopplar ihop översättningarna. Testet låser
att de är unika och att alla 21 guider har ett eget slug."
```

---

### Task 8: `base.njk` — språk, hreflang, nav och footer

Den känsligaste task i planen. Varje sida på sajten går genom den här filen.

**Files:**
- Modify: `_includes/base.njk`

**Interfaces:**
- Consumes: `lang`, `t`, `routes`, `key`, filtret `alternates`.

- [ ] **Step 1: Sätt språket på html-elementet**

Rad 2, byt `<html lang="sv">` mot:

```njk
<html lang="{{ routes.locales[lang].htmlLang }}">
```

- [ ] **Step 2: Lägg in hreflang efter canonical**

Efter rad 9 (`<link rel="canonical" …>`):

```njk
{%- set alts = collections.all | alternates(key, routes) %}
{%- for a in alts.links %}
  <link rel="alternate" hreflang="{{ a.hreflang }}" href="{{ site.url }}{{ a.url }}">
{%- endfor %}
{%- if alts.xDefault %}
  <link rel="alternate" hreflang="x-default" href="{{ site.url }}{{ alts.xDefault }}">
{%- endif %}
```

Med `publishedLocales: ["sv"]` ger `alts.links` en tom lista och blocket skriver
ingenting. Det är avsiktligt — se `lib/alternates.js`.

- [ ] **Step 3: Byt navigationen mot uppslagningar**

Rad 43–47, ersätt `<nav class="nav-links">`-blocket med:

```njk
      <nav class="nav-links">
        <a href="{{ routes.homeFor(lang) }}#funktioner">{{ t.nav.features }}</a>
        <a class="nav-keep" href="{{ routes.pathFor(lang, 'formats') }}">{{ t.nav.formats }}</a>
        <a class="nav-cta" href="{{ routes.locales[lang].prefix }}/{{ routes.locales[lang].download }}" data-download-link data-ios-url="{{ site.appStoreUrl }}" data-android-url="{{ site.playStoreUrl }}" data-umami-event="ladda-ner-klick" data-umami-event-plats="nav">{{ t.nav.download }}</a>
      </nav>
```

Även brandmark-länken på rad 39: `href="/"` blir `href="{{ routes.homeFor(lang) }}"`.

- [ ] **Step 4: Byt footern mot uppslagningar**

Rad 60–67, ersätt `<nav class="foot-links">`-blocket med:

```njk
        <nav class="foot-links">
          <a href="{{ routes.pathFor(lang, 'formats') }}">{{ t.footer.formats }}</a>
          <a href="{{ routes.pathFor(lang, 'glossary') }}">{{ t.footer.glossary }}</a>
          <a href="{{ routes.pathFor(lang, 'about') }}">{{ t.footer.about }}</a>
          <a href="/privacy/">{{ t.footer.privacy }}</a>
          <a href="/terms/">{{ t.footer.terms }}</a>
          <a href="mailto:{{ site.email }}">{{ t.footer.contact }}</a>
        </nav>
```

`/privacy/` och `/terms/` är avsiktligt oförändrade. Juridiksidorna översätts
inte, se specens avsnitt "Juridiksidorna".

Rad 71, byt `Byggd i Sverige, för golfgänget` mot `{{ t.footer.tagline }}`.

- [ ] **Step 5: Verifiera att svenskan är orörd**

```bash
npm run build && npm run check:sv
```
Förväntat: `Svensk output oförändrad`.

Detta är det steg som mest sannolikt faller. Vanliga orsaker:
- `routes.pathFor(lang, 'formats')` ger `/spelformer/` — kontrollera att det
  inte blev dubbla snedstreck.
- Nunjucks `{%- -%}`-trimning ändrar blanksteg. Jämför med
  `diff <(git show HEAD:_site/index.html) _site/index.html` om `_site` vore
  incheckat; annars `git stash && npm run build && cp _site/index.html /tmp/före.html && git stash pop && npm run build && diff /tmp/före.html _site/index.html`.

- [ ] **Step 6: Committa**

```bash
git add _includes/base.njk
git commit -m "feat(i18n): base.njk läser språk, strängar och sökvägar ur data

html lang, nav och footer kommer nu från lang, t och routes. hreflang-blocket
skriver ingenting så länge bara ett språk är publicerat, så svensk output är
oförändrad."
```

---

### Task 9: `guide.njk`, `page-article.njk` och `store-badges.njk`

**Files:**
- Modify: `_includes/guide.njk`
- Modify: `_includes/page-article.njk`
- Modify: `_includes/store-badges.njk`

- [ ] **Step 1: `guide.njk` — breadcrumb, byline, rubriker**

Rad 8, breadcrumb:

```njk
        <a href="{{ routes.homeFor(lang) }}">{{ t.breadcrumb.home }}</a><span class="sep">/</span><a href="{{ routes.pathFor(lang, 'formats') }}">{{ t.nav.formats }}</a><span class="sep">/</span><span>{{ format }}</span>
```

Rad 12, byline:

```njk
      <p class="guide-byline">{{ t.byline.by }} <a href="{{ routes.pathFor(lang, 'about') }}">Gustaf Bratt</a>{% if updated %} · {{ t.byline.updated }} {{ updated | localDate(lang) }}{% endif %}</p>
```

Rad 28, FAQ-rubriken: `<h2>{{ t.faq.heading }}</h2>`

Rad 39–40, CTA:

```njk
    <h2>{{ t.guide.ctaHeading | replace("{format}", format) }}</h2>
    <p>{{ t.guide.ctaText }}</p>
```

Rad 47, relaterat: `<h2>{{ t.guide.related }}</h2>`

Rad 49, filtrera relaterade guider på språk så en svensk guide aldrig länkar
till en dansk:

```njk
      {%- for slug in related %}{%- for g in collections.guides %}{%- if g.data.slug == slug and g.data.lang == lang %}<a href="{{ g.url }}">{{ g.data.format }}</a>{%- endif %}{%- endfor %}{%- endfor %}
```

- [ ] **Step 2: `page-article.njk` — samma behandling**

Rad 9: `<a href="{{ routes.homeFor(lang) }}">{{ t.breadcrumb.home }}</a>`

Rad 15:

```njk
      {% if byline %}<p class="guide-byline">{{ t.byline.by }} <a href="{{ routes.pathFor(lang, 'about') }}">Gustaf Bratt</a>{% if updated %} · {{ t.byline.updated }} {{ updated | localDate(lang) }}{% endif %}</p>{% endif %}
```

Rad 27: `<h2>{{ t.faq.heading }}</h2>`

Rad 40: `<p>{{ ctaText or t.article.ctaText }}</p>`

Rad 48: `<h2>{{ t.article.related }}</h2>`

- [ ] **Step 3: `store-badges.njk` — texten över butiksnamnet**

Rad 5 och 12, byt `<span class="b-sub">LADDA NER PÅ</span>` mot:

```njk
      <span class="b-sub">{{ t.store.sub }}</span>
```

- [ ] **Step 4: Verifiera att svenskan är orörd**

```bash
npm run build && npm run check:sv
```
Förväntat: `Svensk output oförändrad`.

Faller det på CTA-rubriken: `replace("{format}", format)` måste ge exakt
`Slipp räkna Stableford för hand`. Kontrollera i
`_site/spelformer/stableford/index.html`.

- [ ] **Step 5: Committa**

```bash
git add _includes/guide.njk _includes/page-article.njk _includes/store-badges.njk
git commit -m "feat(i18n): guide-, artikel- och butiksmallarna läser strängar ur t

Relaterade guider filtreras nu på språk, så en svensk guide aldrig kan länka
till sin danska motsvarighet."
```

---

### Task 10: Språkväljare

**Files:**
- Create: `_includes/language-switcher.njk`
- Modify: `_includes/base.njk` (inkludera i header och footer)
- Modify: `assets/css/site.css`

- [ ] **Step 1: Skriv komponenten**

Skapa `_includes/language-switcher.njk`:

```njk
{#- Språkväljare. Bygger på samma alternates-lista som hreflang, så den alltid
    länkar till MOTSVARANDE sida i det andra språket och aldrig till startsidan.
    Att kasta besökaren till startsidan när hen står på en guide är det
    vanligaste felet i flerspråkiga sajter.

    Skriver ingenting när det bara finns ett publicerat språk. -#}
{%- set alts = collections.all | alternates(key, routes) %}
{%- if alts.links.length > 1 %}
<nav class="lang-switch" aria-label="{{ t.switcher.label }}">
  {%- for a in alts.links %}
  {%- if a.lang == lang %}
  <span class="lang-current" aria-current="true">{{ routes.locales[a.lang].label }}</span>
  {%- else %}
  <a href="{{ a.url }}" hreflang="{{ a.hreflang }}" data-lang-link="{{ a.lang }}">{{ routes.locales[a.lang].label }}</a>
  {%- endif %}
  {%- endfor %}
</nav>
{%- endif %}
```

- [ ] **Step 2: Inkludera i base.njk**

I `<nav class="nav-links">`, sist före `</nav>`:

```njk
        {% include "language-switcher.njk" %}
```

Och i footern, efter `</nav>` i `foot-links`:

```njk
        {% include "language-switcher.njk" %}
```

- [ ] **Step 3: Lägg stilen**

Sist i `assets/css/site.css`:

```css
/* Språkväljare. Renderas inte alls när bara ett språk är publicerat, så
   reglerna är verkningslösa tills första översättningen går live. */
.lang-switch {
  display: inline-flex;
  gap: 10px;
  align-items: center;
  font-size: 13px;
}
.lang-switch a {
  color: inherit;
  opacity: 0.7;
  text-decoration: none;
}
.lang-switch a:hover,
.lang-switch a:focus-visible {
  opacity: 1;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.lang-switch .lang-current {
  font-weight: 600;
}
```

- [ ] **Step 4: Verifiera att svenskan är orörd**

```bash
npm run build && npm run check:sv
```
Förväntat: `Svensk output oförändrad`. Väljaren renderar inget vid ett språk.

CSS-ändringen byter `assets.css`-hashen, men `check-sv-unchanged.mjs`
normaliserar bort `?v=`-strängar — se `normalise()` i Task 1.

- [ ] **Step 5: Bevisa att väljaren faktiskt renderar**

Tillfälligt, utan att committa:

```bash
sed -i '' 's/const PUBLISHED = \["sv"\];/const PUBLISHED = ["sv", "en"];/' _data/routes.js
npm run build
grep -c 'lang-switch' _site/index.html
```
Förväntat: `0` — det finns ännu ingen engelsk sida med samma `key`, så
`alts.links` har bara ett element och väljaren skriver inget. Det är korrekt
beteende och bevisar att `links.length > 1`-villkoret håller.

Återställ:
```bash
git checkout _data/routes.js && npm run build && npm run check:sv
```

- [ ] **Step 6: Committa**

```bash
git add _includes/language-switcher.njk _includes/base.njk assets/css/site.css
git commit -m "feat(i18n): språkväljare i header och footer

Bygger på alternates, så den länkar till motsvarande sida och inte till
startsidan. Renderas inte alls vid ett enda publicerat språk."
```

---

### Task 11: Språkbanner

**Files:**
- Create: `_includes/language-banner.njk`
- Modify: `_includes/base.njk`
- Modify: `assets/css/site.css`

- [ ] **Step 1: Skriv komponenten**

Skapa `_includes/language-banner.njk`:

```njk
{#- Föreslår besökarens eget språk vid direkttrafik. Ingen omdirigering:
    Googlebot kryper från USA och skulle vid en redirect bara någonsin se den
    engelska versionen, vilket lämnar tre språk oindexerade. Google avråder
    dessutom explicit från automatisk omdirigering.

    Löser bara direkttrafik. Organisk söktrafik landar redan rätt via hreflang,
    och annonser pekar mot rätt prefix från början.

    Renderas dold med reserverad höjd så att visningen inte förskjuter layouten. -#}
{%- set alts = collections.all | alternates(key, routes) %}
{%- if alts.links.length > 1 %}
<div id="lang-banner" class="lang-banner" hidden>
  <span id="lang-banner-text"></span>
  <button type="button" id="lang-banner-close" aria-label="{{ t.banner.close }}">&times;</button>
</div>
<script>
  (function () {
    var el = document.getElementById('lang-banner');
    if (!el) return;

    // Kandidater från alternates, i publiceringsordning.
    var alts = {{ alts.links | dump | safe }};
    var current = {{ lang | dump | safe }};
    var labels = {{ routes.locales | dump | safe }};
    var template = {{ t.banner.text | dump | safe }};

    // Har besökaren stängt raden eller själv valt språk visas den aldrig igen.
    try {
      if (localStorage.getItem('wg-lang-dismissed')) return;
    } catch (e) { return; }

    // Första webbläsarspråket som vi faktiskt har en översättning för.
    var prefs = navigator.languages || [navigator.language || ''];
    var match = null;
    for (var i = 0; i < prefs.length && !match; i++) {
      var base = String(prefs[i]).toLowerCase().split('-')[0];
      for (var j = 0; j < alts.length; j++) {
        // nb och no är samma skriftspråk för vårt syfte.
        var altBase = alts[j].lang === 'nb' ? 'no' : alts[j].lang;
        if (base === altBase || base === alts[j].lang) { match = alts[j]; break; }
      }
    }

    if (!match || match.lang === current) return;

    var name = labels[match.lang].label;
    document.getElementById('lang-banner-text').innerHTML =
      '<a href="' + match.url + '" data-lang-link="' + match.lang + '">' +
      template.replace('{language}', name) + ' &rarr;</a>';
    el.hidden = false;

    document.getElementById('lang-banner-close').addEventListener('click', function () {
      el.hidden = true;
      try { localStorage.setItem('wg-lang-dismissed', '1'); } catch (e) {}
    });
  })();
</script>
{%- endif %}
```

- [ ] **Step 2: Inkludera högst upp i body**

I `_includes/base.njk`, direkt efter `<body …>` och före `<header>`:

```njk
  {% include "language-banner.njk" %}
```

- [ ] **Step 3: Lägg stilen**

Sist i `assets/css/site.css`:

```css
/* Språkbanner. Höjden är reserverad via min-height så att visningen inte
   förskjuter innehållet under och därmed inte påverkar CLS. */
.lang-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 40px;
  padding: 8px 16px;
  background: var(--green-700, #0a2e21);
  color: #fff;
  font-size: 14px;
  text-align: center;
}
.lang-banner[hidden] {
  display: none;
}
.lang-banner a {
  color: #fff;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.lang-banner button {
  background: none;
  border: 0;
  color: inherit;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  padding: 0 4px;
}
```

- [ ] **Step 4: Verifiera att svenskan är orörd**

```bash
npm run build && npm run check:sv
```
Förväntat: `Svensk output oförändrad`. Bannern renderas inte vid ett språk, och
därmed inte heller dess inline-script.

- [ ] **Step 5: Committa**

```bash
git add _includes/language-banner.njk _includes/base.njk assets/css/site.css
git commit -m "feat(i18n): språkbanner utan omdirigering

Klientsida, localStorage för avfärdandet, reserverad höjd så CLS inte
påverkas. Ingen redirect: Googlebot kryper från USA och skulle då bara se
den engelska versionen."
```

---

### Task 12: `guideUrl`-shortcode

För översatta guider i senare vågor. Byggs nu så att våg 3 kan använda den
direkt.

**Files:**
- Create: `lib/guide-url.js`
- Modify: `.eleventy.js`
- Create: `tests/guide-url.test.js`

**Interfaces:**
- Produces: `{% guideUrl "slaggolf" %}` → sökvägen till den guiden i sidans språk.

- [ ] **Step 1: Skriv det fallerande testet**

Skapa `tests/guide-url.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const { guideUrl } = require('../lib/guide-url.js');

const guides = [
  { url: '/spelformer/slaggolf/', data: { lang: 'sv', slug: 'slaggolf', key: 'guide:slaggolf' } },
  { url: '/dk/spilformer/slagspil/', data: { lang: 'da', slug: 'slagspil', key: 'guide:slaggolf' } },
];

test('hittar guiden i sidans eget språk', () => {
  assert.strictEqual(guideUrl(guides, 'slaggolf', 'sv'), '/spelformer/slaggolf/');
  assert.strictEqual(guideUrl(guides, 'slaggolf', 'da'), '/dk/spilformer/slagspil/');
});

test('nyckeln är språkoberoende, inte det översatta sluggen', () => {
  // "slagspil" är danskans slug, men uppslag sker alltid på svenska nyckeln.
  assert.throws(() => guideUrl(guides, 'slagspil', 'da'), /slagspil/);
});

test('saknad översättning fälls högljutt, inte tyst till 404', () => {
  assert.throws(() => guideUrl(guides, 'slaggolf', 'nb'), /nb/);
});
```

- [ ] **Step 2: Kör testet, se det falla**

Run: `node --test tests/guide-url.test.js`
Förväntat: FAIL, `Cannot find module '../lib/guide-url.js'`.

- [ ] **Step 3: Skriv implementationen**

Skapa `lib/guide-url.js`:

```js
// Länk till en annan guide, i sidans eget språk.
//
// Guidernas brödtext länkar till varandra. Med fyra språk blir hårdkodade
// sökvägar fyra uppsättningar som tyst kan peka på fel språk eller på 404.
// Nyckeln som skickas in är ALLTID den svenska sluggen; den är guidens
// språkoberoende identitet.
//
// Saknas översättningen kastas ett fel som fäller bygget. Alternativet vore en
// tyst 404 i en publicerad guide, och det är sämre.
function guideUrl(guides, key, lang) {
  const hit = (guides || []).find(
    (g) => g.data.key === `guide:${key}` && g.data.lang === lang,
  );
  if (!hit) {
    throw new Error(
      `guideUrl: ingen guide med nyckeln "${key}" på språket "${lang}". ` +
        `Nyckeln är den svenska sluggen, inte den översatta.`,
    );
  }
  return hit.url;
}

module.exports = { guideUrl };
```

- [ ] **Step 4: Registrera shortcoden**

I `.eleventy.js`, bland filtren:

```js
  // Länk till en annan guide i sidans eget språk. Nyckeln är den svenska
  // sluggen; se lib/guide-url.js.
  const { guideUrl } = require("./lib/guide-url.js");
  eleventyConfig.addShortcode("guideUrl", function (key) {
    return guideUrl(this.ctx.collections.guides, key, this.ctx.lang || "sv");
  });
```

- [ ] **Step 5: Kör testerna, se dem passera**

Run: `node --test tests/guide-url.test.js`
Förväntat: PASS, 3 tester.

- [ ] **Step 6: Verifiera att svenskan är orörd**

```bash
npm run build && npm run check:sv
```
Förväntat: `Svensk output oförändrad`. Ingen svensk sida använder shortcoden —
de behåller sina hårdkodade sökvägar, som är korrekta för svenska.

- [ ] **Step 7: Committa**

```bash
git add lib/guide-url.js tests/guide-url.test.js .eleventy.js
git commit -m "feat(i18n): guideUrl-shortcode för korsreferenser mellan guider

Nyckeln är den svenska sluggen. Saknad översättning fäller bygget i stället
för att ge en tyst 404 i en publicerad guide."
```

---

### Task 13: `functions/go.js` — den universella kampanjlänken

**Files:**
- Create: `functions/go.js`
- Create: `tests/go.test.mjs`
- Modify: `robots.njk`

**Interfaces:**
- Produces: `onRequestGet({ request })` samt de exporterade hjälparna
  `sanitizeCampaign(raw)` och `pickLang(url, request)` för testning.

- [ ] **Step 1: Skriv det fallerande testet**

Skapa `tests/go.test.mjs`:

```js
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

test('l tvingar språk oavsett Accept-Language', async () => {
  const res = await onRequestGet({ request: req('https://wagergolf.se/go?l=da', {
    'accept-language': 'en-US,en;q=0.9',
  }) });
  assert.strictEqual(res.status, 302);
  assert.ok(res.headers.get('Location').startsWith('/dk/'));
});

test('utan l följs Accept-Language', async () => {
  const res = await onRequestGet({ request: req('https://wagergolf.se/go', {
    'accept-language': 'nb-NO,nb;q=0.9',
  }) });
  assert.ok(res.headers.get('Location').startsWith('/no/'));
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
```

- [ ] **Step 2: Kör testet, se det falla**

Run: `node --test tests/go.test.mjs`
Förväntat: FAIL, `Cannot find module '../functions/go.js'`.

- [ ] **Step 3: Skriv implementationen**

Skapa `functions/go.js`:

```js
// /go är den universella kampanjlänken: en URL som fungerar för alla
// marknader, för QR-koder på tryck, poddar, radio, kläder och mässor.
//
// DIGITALA ANNONSER SKA INTE PEKA HIT. De ska peka direkt på /dk/, /no/ eller
// /en/. En landningssida på annonsens eget språk ger högre relevansbetyg och
// därmed lägre klickpris, och /go lägger bara till ett omdirigeringshopp.
//
// Att den ligger på en egen sökväg i stället för på / är hela poängen:
// Googlebot indexerar aldrig /go (den är Disallow i robots.txt), så ingen av
// indexeringsriskerna med en språkredirect på roten uppstår. Alla fyra
// språkversionerna förblir fullt synliga för sökmotorerna.
//
// DUPLIKAT MED AVSIKT. Listan nedan och sanitizeCampaign finns också i
// _data/routes.js respektive lib/campaign.js. Anledningen är deploykedjan:
// .eleventy.js passthrough-kopierar functions/ in i _site/, och deployen
// skickar bara _site. lib/ följer inte med, så en import härifrån skulle
// resolva till ingenting i produktion. Att passthrough-kopiera lib/ vore
// värre — då låg den publikt på /lib/.
// Ändras något här måste motsvarande ändring göras i _data/routes.js och
// lib/campaign.js. Testerna i tests/go.test.mjs och tests/campaign.test.js
// kontrollerar samma värden från båda hållen.
const PREFIX = { sv: '', nb: '/no', da: '/dk', en: '/en' };
const PUBLISHED = ['sv'];
const DEFAULT_LANG = 'sv';

/** Butikernas kampanjfält är fritext men trivs inte med mellanslag, versaler
 *  eller emoji. Metas {{campaign.name}} expanderar till kampanjnamnet precis
 *  som det skrevs i annonsverktyget, så värdet måste saneras. */
export function sanitizeCampaign(raw) {
  if (!raw) return '';
  return String(raw)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .slice(0, 40)
    .replace(/-+$/, '');
}

/** Språk från ?l=, annars Accept-Language. Opublicerade språk faller tillbaka
 *  på svenska, så en kampanjlänk kan tryckas innan översättningen är klar utan
 *  att leda till en tom katalog. */
export function pickLang(url, request) {
  const forced = url.searchParams.get('l');
  if (forced && PUBLISHED.includes(forced)) return forced;
  if (forced) return DEFAULT_LANG;

  const header = (request.headers.get('accept-language') || '').toLowerCase();
  for (const part of header.split(',')) {
    const base = part.split(';')[0].trim().split('-')[0];
    // "no" och "nb" är samma skriftspråk för vårt syfte.
    const lang = base === 'no' ? 'nb' : base;
    if (PUBLISHED.includes(lang)) return lang;
  }
  return DEFAULT_LANG;
}

export function onRequestGet({ request }) {
  const url = new URL(request.url);
  const lang = pickLang(url, request);
  const campaign = sanitizeCampaign(url.searchParams.get('c'));

  let target = `${PREFIX[lang]}/`;
  if (campaign) {
    const params = new URLSearchParams({
      utm_source: campaign,
      utm_medium: 'offline',
      utm_campaign: campaign,
    });
    target += `?${params}`;
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: target,
      // Svaret varierar med besökarens språk och får aldrig cachas delat.
      'Cache-Control': 'no-store',
      Vary: 'Accept-Language',
    },
  });
}
```

- [ ] **Step 4: Kör testerna, se dem passera**

Run: `node --test tests/go.test.mjs`
Förväntat: PASS, 9 tester.

- [ ] **Step 5: Blockera `/go` för sökmotorer**

I `robots.njk`, efter `Allow: /` på rad 6:

```
# /go är en kampanjomdirigering, inte en sida. Den ska aldrig indexeras.
Disallow: /go
```

- [ ] **Step 6: Verifiera**

```bash
npm run build && npm run check:sv
```
Förväntat: `Svensk output oförändrad`. `robots.txt` är inte HTML och ingår inte
i låset.

```bash
grep -A1 'kampanjomdirigering' _site/robots.txt
```
Förväntat: `Disallow: /go`.

- [ ] **Step 7: Committa**

```bash
git add functions/go.js tests/go.test.mjs robots.njk
git commit -m "feat(i18n): /go som universell kampanjlänk

För QR, poddar och tryck där en enda URL måste räcka. Digitala annonser ska
peka direkt på /dk/ och /no/ i stället, för relevansbetygets skull.

Egen sökväg och Disallow i robots.txt, så ingen av indexeringsriskerna med
en språkredirect på roten uppstår."
```

---

### Task 14: Butikslänkar per marknad

Appen rullas ut till fler storefronts parallellt med detta arbete. Länkarna
byggs nu så de fungerar så fort utrullningen är klar.

**Files:**
- Modify: `_data/site.js`
- Modify: `_includes/store-badges.njk`
- Modify: `_includes/base.njk` (nav-knappens data-attribut)
- Create: `tests/store-urls.test.js`

**Interfaces:**
- Produces: `site.storeUrls[lang]` → `{ appStore, playStore, campaign }`.
  `site.appStoreUrl` och `site.playStoreUrl` behålls som alias för svenskan, så
  ingen befintlig referens går sönder.

- [ ] **Step 1: Skriv det fallerande testet**

Skapa `tests/store-urls.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const site = require('../_data/site.js');

test('varje språk har en egen storefront', () => {
  assert.ok(site.storeUrls.sv.appStore.includes('/se/'));
  assert.ok(site.storeUrls.nb.appStore.includes('/no/'));
  assert.ok(site.storeUrls.da.appStore.includes('/dk/'));
  assert.ok(site.storeUrls.en.appStore.includes('/us/'));
});

test('kampanjnamnen är marknadsbaserade', () => {
  assert.strictEqual(site.storeUrls.sv.campaign, 'webb');
  assert.strictEqual(site.storeUrls.nb.campaign, 'webb-no');
  assert.strictEqual(site.storeUrls.da.campaign, 'webb-dk');
  assert.strictEqual(site.storeUrls.en.campaign, 'webb-en');
});

test('kampanjen ligger i ct på App Store-länken', () => {
  const url = new URL(site.storeUrls.da.appStore);
  assert.strictEqual(url.searchParams.get('ct'), 'webb-dk');
  assert.strictEqual(url.searchParams.get('pt'), '128879444');
});

test('Play-länkens kampanj ligger i referrer, inte som egen parameter', () => {
  const url = new URL(site.storeUrls.nb.playStore);
  assert.strictEqual(url.searchParams.get('utm_campaign'), null);
  const referrer = decodeURIComponent(url.searchParams.get('referrer'));
  assert.ok(referrer.includes('utm_campaign=webb-no'));
});

test('gamla aliasen pekar fortfarande på svenskan', () => {
  assert.strictEqual(site.appStoreUrl, site.storeUrls.sv.appStore);
  assert.strictEqual(site.playStoreUrl, site.storeUrls.sv.playStore);
});

test('de kanoniska länkarna är omärkta, för schema.org', () => {
  assert.ok(!site.appStoreUrlCanonical.includes('?'));
  assert.ok(!site.playStoreUrlCanonical.includes('referrer'));
});
```

- [ ] **Step 2: Kör testet, se det falla**

Run: `node --test tests/store-urls.test.js`
Förväntat: FAIL, `Cannot read properties of undefined (reading 'sv')`.

- [ ] **Step 3: Bygg om `_data/site.js`**

Ersätt raderna 1–49 (allt före `api:`) med:

```js
// Rena butikslänkar utan mätparametrar. Strukturerad data ska peka på appens
// kanoniska adress, inte på en spårad variant.
const APP_ID = "id6767638917";
const PLAY_ID = "com.bratteen.wagergolf";
const APP_STORE_URL = `https://apps.apple.com/se/app/${APP_ID}`;
const PLAY_STORE_URL =
  `https://play.google.com/store/apps/details?id=${PLAY_ID}`;

// Provider-token från App Store Connect > Analytics > Acquisition > Campaigns.
// Apple knyter nedladdningen till kontot via den, så utan token lämnas
// App Store-länken omärkt hellre än att se mätt ut utan att vara det.
// Google Play behöver ingen motsvarighet.
const APPLE_PROVIDER_TOKEN = "128879444";

// En storefront och ett kampanjnamn per marknad. Kampanjnamnen är
// marknadsbaserade, precis som sökvägarna, eftersom butikernas
// förvärvsrapporter är indelade per storefront. Utan uppdelningen klumpas all
// webbtrafik ihop och det går inte att se om Danmark fungerar.
const MARKETS = {
  sv: { store: "se", play: "sv", gl: "SE", campaign: "webb" },
  nb: { store: "no", play: "no", gl: "NO", campaign: "webb-no" },
  da: { store: "dk", play: "da", gl: "DK", campaign: "webb-dk" },
  en: { store: "us", play: "en", gl: "US", campaign: "webb-en" },
};

/** App Store-länk med kampanjmärkning. Faller tillbaka på den rena länken så
 *  länge provider-token saknas.
 *
 *  Bygg ALLTID på den landsprefixade adressen. App Store Connects egen
 *  kampanjlänkgenerator ger formen /app/apple-store/id..., men den svarar 404
 *  i vanlig webbläsare och fungerar bara inuti App Store-appen. Parametrarna
 *  pt och ct läses av Apple oavsett sökväg. */
function taggedAppStoreUrl(market) {
  const base = `https://apps.apple.com/${market.store}/app/${APP_ID}`;
  if (!APPLE_PROVIDER_TOKEN) return base;
  const params = new URLSearchParams({
    pt: APPLE_PROVIDER_TOKEN,
    ct: market.campaign,
    mt: "8",
  });
  return `${base}?${params}`;
}

/** Google Play-länk med kampanjmärkning. Play vill ha utm-paren som EN
 *  urlencodad sträng i referrer, inte som separata query-parametrar. */
function taggedPlayStoreUrl(market) {
  const referrer = `utm_source=wagergolf.se&utm_medium=referral&utm_campaign=${market.campaign}`;
  const params = new URLSearchParams({
    id: PLAY_ID,
    hl: market.play,
    gl: market.gl,
    referrer,
  });
  return `https://play.google.com/store/apps/details?${params}`;
}

const storeUrls = Object.fromEntries(
  Object.entries(MARKETS).map(([lang, market]) => [
    lang,
    {
      appStore: taggedAppStoreUrl(market),
      playStore: taggedPlayStoreUrl(market),
      campaign: market.campaign,
    },
  ]),
);

module.exports = {
  name: "Wager Golf",
  url: "https://wagergolf.se",
  // En butikslänk per marknad. Mallarna använder storeUrls[lang].
  storeUrls,
  // Alias för svenskan, så äldre referenser inte går sönder.
  appStoreUrl: storeUrls.sv.appStore,
  playStoreUrl: storeUrls.sv.playStore,
  appStoreUrlCanonical: APP_STORE_URL,
  playStoreUrlCanonical: PLAY_STORE_URL,
```

Resten av filen (från `api:` och nedåt) lämnas orörd.

- [ ] **Step 4: Kör testet, se det passera**

Run: `node --test tests/store-urls.test.js`
Förväntat: PASS, 6 tester.

- [ ] **Step 5: Låt mallarna välja marknad efter språk**

I `_includes/store-badges.njk`, byt `{{ site.appStoreUrl }}` mot
`{{ site.storeUrls[lang].appStore }}` och `{{ site.playStoreUrl }}` mot
`{{ site.storeUrls[lang].playStore }}`.

I `_includes/base.njk`, nav-knappen: byt `data-ios-url="{{ site.appStoreUrl }}"`
mot `data-ios-url="{{ site.storeUrls[lang].appStore }}"` och
`data-android-url="{{ site.playStoreUrl }}"` mot
`data-android-url="{{ site.storeUrls[lang].playStore }}"`.

- [ ] **Step 6: Verifiera**

```bash
npm run build && npm run check:sv
```

Låset **kommer att falla**: Play-länken har nu `hl=sv&gl=SE` och
parameterordningen är en annan. Bekräfta att App Store-länken är oförändrad och
att Play-länken bara har fått de nya parametrarna:

```bash
grep -o 'https://play.google.com/store/apps/details?[^"]*' _site/index.html | head -1
```
Förväntat: innehåller `id=com.bratteen.wagergolf`, `hl=sv`, `gl=SE` och en
`referrer` med `utm_campaign=webb`.

```bash
grep -o 'https://apps.apple.com/[^"]*' _site/index.html | head -1
```
Förväntat: `https://apps.apple.com/se/app/id6767638917?pt=128879444&ct=webb&mt=8`
— exakt som förut.

Skriv om baseline medvetet:

```bash
npm run baseline:sv && npm run check:sv
```

- [ ] **Step 7: Committa**

```bash
git add _data/site.js _includes/store-badges.njk _includes/base.njk tests/store-urls.test.js .sv-baseline.json
git commit -m "feat(i18n): en butikslänk och ett kampanjnamn per marknad

Butikernas förvärvsrapporter är indelade per storefront. Utan uppdelningen
klumpas all webbtrafik ihop och det går inte att se om Danmark fungerar.

Baseline omskriven: Play-länken har fått hl och gl. App Store-länken är
oförändrad för svenskan."
```

---

### Task 15: `download-link.js` — kampanjen vidare till butiken

**Files:**
- Create: `lib/campaign.js`
- Modify: `assets/js/download-link.js`
- Modify: `_includes/store-badges.njk`
- Create: `tests/campaign.test.js`

**Interfaces:**
- Consumes: `sanitizeCampaign`-logiken från Task 13, här som delad modul.
- Produces: butikslänkar vars `ct`-parameter bär kampanjen från `c` eller
  `utm_campaign`.

- [ ] **Step 1: Skriv det fallerande testet**

Skapa `tests/campaign.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const { sanitizeCampaign, campaignFromSearch, withCampaign } = require('../lib/campaign.js');

test('c vinner över utm_campaign', () => {
  assert.strictEqual(campaignFromSearch('?c=qr&utm_campaign=meta'), 'qr');
});

test('utm_campaign används när c saknas — annonstrafik kommer aldrig via /go', () => {
  assert.strictEqual(campaignFromSearch('?utm_campaign=WG%20DK%20-%20Reels'), 'wg-dk-reels');
});

test('ingen kampanj i URL:en ger tom sträng', () => {
  assert.strictEqual(campaignFromSearch(''), '');
  assert.strictEqual(campaignFromSearch('?foo=bar'), '');
});

test('sanerar likadant som functions/go.js', () => {
  assert.strictEqual(sanitizeCampaign('WG DK - Reels 🏌'), 'wg-dk-reels');
});

test('withCampaign byter ut ct men rör inget annat', () => {
  const url = 'https://apps.apple.com/dk/app/id6767638917?pt=128879444&ct=webb-dk&mt=8';
  const out = withCampaign(url, 'podd-golfsnack');
  assert.ok(out.includes('ct=podd-golfsnack'));
  assert.ok(out.includes('pt=128879444'));
  assert.ok(out.includes('mt=8'));
  assert.ok(!out.includes('ct=webb-dk'));
});

test('tom kampanj lämnar länken orörd', () => {
  const url = 'https://apps.apple.com/dk/app/id6767638917?pt=1&ct=webb-dk';
  assert.strictEqual(withCampaign(url, ''), url);
});

test('Play-länkens referrer får kampanjen', () => {
  const url = 'https://play.google.com/store/apps/details?id=x&referrer=' +
    encodeURIComponent('utm_source=wagergolf.se&utm_medium=referral&utm_campaign=webb-dk');
  const out = withCampaign(url, 'qr-scorekort');
  const referrer = decodeURIComponent(new URL(out).searchParams.get('referrer'));
  assert.ok(referrer.includes('utm_campaign=qr-scorekort'));
  assert.ok(!referrer.includes('utm_campaign=webb-dk'));
});
```

- [ ] **Step 2: Kör testet, se det falla**

Run: `node --test tests/campaign.test.js`
Förväntat: FAIL, `Cannot find module '../lib/campaign.js'`.

- [ ] **Step 3: Skriv modulen**

Skapa `lib/campaign.js`:

```js
// Kampanjmärkning av butikslänkarna.
//
// Uppslagsordningen är c, sedan utm_campaign, sedan marknadens generiska namn.
// utm_campaign MÅSTE finnas med: betald trafik från Meta och Google Ads landar
// direkt på /dk/?utm_campaign=... och passerar aldrig /go. Utan det steget
// faller all annonstrafik tillbaka på webb-dk och går inte att skilja ut i
// App Store Connect.
//
// Apples kampanjrapport bygger på pt/ct och är Apples egen aggregerade
// förstahandsdata. Den påverkas inte av ATT, till skillnad från
// annonsplattformarnas egen attribution.

/** Samma sanering som functions/go.js. Hålls i synk manuellt: Cloudflare-
 *  funktioner byggs separat och kan inte importera den här modulen. */
function sanitizeCampaign(raw) {
  if (!raw) return "";
  return String(raw)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .slice(0, 40)
    .replace(/-+$/, "");
}

/** Kampanjen ur en query-sträng, saneringen inkluderad. */
function campaignFromSearch(search) {
  const params = new URLSearchParams(search || "");
  return sanitizeCampaign(params.get("c") || params.get("utm_campaign"));
}

/** Byter ut kampanjen i en butikslänk. App Store bär den i ct, Google Play
 *  inuti den urlencodade referrer-strängen. */
function withCampaign(storeUrl, campaign) {
  if (!campaign) return storeUrl;
  const url = new URL(storeUrl);

  if (url.searchParams.has("ct")) {
    url.searchParams.set("ct", campaign);
  }

  const referrer = url.searchParams.get("referrer");
  if (referrer) {
    const inner = new URLSearchParams(referrer);
    inner.set("utm_campaign", campaign);
    url.searchParams.set("referrer", inner.toString());
  }

  return url.toString();
}

module.exports = { sanitizeCampaign, campaignFromSearch, withCampaign };
```

- [ ] **Step 4: Kör testerna, se dem passera**

Run: `node --test tests/campaign.test.js`
Förväntat: PASS, 8 tester.

- [ ] **Step 5: Använd logiken i webbläsaren**

Lägg till sist i `assets/js/download-link.js`, innanför den befintliga IIFE:n,
efter `for`-loopen:

```js
  // Kampanjen från /go eller från en annonslänks utm_campaign skrivs in i
  // butikens ct-parameter. Utan detta rapporterar App Store Connect all
  // annonstrafik som generiskt "webb-<marknad>".
  //
  // Ingen cookie och ingen sessionStorage: kampanjen lever i URL:en. Det håller
  // ihop med att Umami är cookielöst och med vad integritetspolicyn säger.
  // Priset är att kampanjen tappas om besökaren navigerar vidare innan
  // nedladdning, och det är en bättre avvägning än att lagra i webbläsaren.
  var params = new URLSearchParams(location.search);
  var raw = params.get('c') || params.get('utm_campaign');
  var campaign = raw
    ? String(raw).toLowerCase().replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+/, '').slice(0, 40).replace(/-+$/, '')
    : '';

  if (campaign) {
    var stores = document.querySelectorAll('a[data-store-link]');
    for (i = 0; i < stores.length; i++) {
      var href = stores[i].getAttribute('href');
      try {
        var u = new URL(href);
        if (u.searchParams.has('ct')) u.searchParams.set('ct', campaign);
        var ref = u.searchParams.get('referrer');
        if (ref) {
          var inner = new URLSearchParams(ref);
          inner.set('utm_campaign', campaign);
          u.searchParams.set('referrer', inner.toString());
        }
        stores[i].setAttribute('href', u.toString());
      } catch (e) {
        // Trasig URL ska inte fälla knappen. Lämna den som den är.
      }
    }
  }
```

- [ ] **Step 6: Märk butiksknapparna så skriptet hittar dem**

I `_includes/store-badges.njk`, lägg `data-store-link` på båda `<a class="btn-store">`:

Rad 2: `<a class="btn-store" data-store-link href="{{ site.storeUrls[lang].appStore }}" …>`
Rad 9: `<a class="btn-store" data-store-link href="{{ site.storeUrls[lang].playStore }}" …>`

(Länkarna själva sattes om i Task 14; här läggs bara `data-store-link` till.)

- [ ] **Step 7: Verifiera**

```bash
npm run build && npm run check:sv
```

Låset **kommer att falla** här, och det är korrekt: `data-store-link` är ny
markup i HTML. Bekräfta att det är den enda skillnaden:

```bash
npm run check:sv 2>&1 | head -20
```
Förväntat: sidor med butiksknappar listas som ändrade — startsidan, guiderna,
ordlistan, om.

Granska en sida manuellt och kontrollera att `data-store-link` är den enda
ändringen. Skriv sedan om baseline medvetet:

```bash
npm run baseline:sv && npm run check:sv
```
Förväntat: `Svensk output oförändrad`.

- [ ] **Step 8: Committa**

```bash
git add lib/campaign.js tests/campaign.test.js assets/js/download-link.js _includes/store-badges.njk .sv-baseline.json
git commit -m "feat(i18n): kampanjen från utm_campaign vidare till butikens ct

Meta och Google Ads landar direkt på /dk/ med utm_campaign och passerar
aldrig /go. Utan uppslagningen rapporteras all annonstrafik som generiskt
webb-<marknad> i App Store Connect.

Baseline omskriven: data-store-link är ny markup och den enda skillnaden."
```

---

### Task 16: Sitemap med hreflang-alternativ

**Files:**
- Modify: `sitemap.njk`

- [ ] **Step 1: Skriv om sitemapen**

Ersätt hela `sitemap.njk` med:

```njk
---
permalink: /sitemap.xml
eleventyExcludeFromCollections: true
---
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
{%- for item in collections.all %}
{%- if routes.publishedLocales.includes(item.data.lang or "sv") %}
  <url>
    <loc>{{ site.url }}{{ item.url }}</loc>
    <lastmod>{{ item.date | isoDate }}</lastmod>
{%- set alts = collections.all | alternates(item.data.key, routes) %}
{%- for a in alts.links %}
    <xhtml:link rel="alternate" hreflang="{{ a.hreflang }}" href="{{ site.url }}{{ a.url }}"/>
{%- endfor %}
{%- if alts.xDefault %}
    <xhtml:link rel="alternate" hreflang="x-default" href="{{ site.url }}{{ alts.xDefault }}"/>
{%- endif %}
  </url>
{%- endif %}
{%- endfor %}
  <url>
    <loc>{{ site.url }}/privacy/</loc>
  </url>
  <url>
    <loc>{{ site.url }}/terms/</loc>
  </url>
</urlset>
```

Filtret på `publishedLocales` är det som håller ett halvöversatt språk utanför
indexet. Tunna, halvfärdiga sidor i sitemap drar ner hela domänen.

- [ ] **Step 2: Verifiera**

```bash
npm run build && npm run check:sv
```
Förväntat: `Svensk output oförändrad`. Sitemapen är XML och ingår inte i låset.

```bash
grep -c '<loc>' _site/sitemap.xml
grep -c 'xhtml:link' _site/sitemap.xml
```
Förväntat: samma antal `<loc>` som före ändringen, och `0` stycken
`xhtml:link` — det finns bara ett publicerat språk.

Jämför mot föregående version för säkerhets skull:

```bash
git stash && npm run build && cp _site/sitemap.xml /tmp/sitemap-före.xml && git stash pop && npm run build && diff /tmp/sitemap-före.xml _site/sitemap.xml
```
Förväntat: enda skillnaden är `xmlns:xhtml`-attributet på `<urlset>`.

- [ ] **Step 3: Committa**

```bash
git add sitemap.njk
git commit -m "feat(i18n): hreflang-alternativ i sitemap, filtrerad på publicerade språk

Filtret är det som håller ett halvöversatt språk utanför indexet."
```

---

### Task 17: Slutverifiering och städning

**Files:**
- Modify: `README.md`
- Delete: `.sv-baseline.json`
- Modify: `package.json`
- Modify: `docs/superpowers/specs/2026-08-04-flersprakig-sajt-design.md`

- [ ] **Step 1: Kör hela kontrollkedjan**

```bash
npm run check
```
Förväntat: alla tester passerar, juridikkontrollerna passerar, svensk output
oförändrad, HTML-validering passerar.

- [ ] **Step 2: Validera hreflang med den installerade skillen**

Kör skillen `claude-seo:seo-hreflang` mot den byggda sajten.

Förväntat resultat: inga hreflang-taggar hittade, vilket är korrekt vid ett
publicerat språk. Rapporterar den saknade taggar som ett fel — notera det men
åtgärda inte; det blir riktigt först i våg 3.

- [ ] **Step 3: Räkna sidorna, som sista kontroll på att inget tappats**

```bash
find _site -name '*.html' | wc -l
```
Förväntat: samma antal som antalet nycklar i `.sv-baseline.json`.

- [ ] **Step 4: Dokumentera strukturen i README**

I `README.md`, i `## Struktur`-blocket, efter raden om `_data/site.js`:

```
_data/routes.js        lokaliserade sökvägssegment per språk (sv, nb, da, en)
_data/i18n/            UI-strängar per språk
lib/                   delad logik: hreflang, JSON-LD, datum, kampanjmärkning
functions/go.js        universell kampanjlänk för QR, poddar och tryck
```

Och lägg ett nytt avsnitt sist:

```markdown
## Lägga till ett språk

Språken är förberedda i `_data/routes.js` men bara svenska är publicerat.
Ett språk går live genom att:

1. Skapa `_data/i18n/<lang>.json` med samma nycklar som `sv.json`.
   `tests/i18n.test.js` låser schemat.
2. Skapa språkets katalog (`no/`, `dk/`, `en/`) med en `.11tydata.js` som
   sätter `lang` som **vanlig data, inte i `eleventyComputed`**. Ordningen
   mellan global och katalognivås `eleventyComputed` är inte garanterad i
   Eleventy, och guidernas katalogdata läser `data.lang` när den bygger
   permalink. Ett beräknat `lang` kan därför vara odefinierat där och ge
   svenska sökvägar åt en engelsk guide.
3. Översätta sidorna. Varje sida behåller samma `key` som sin svenska
   motsvarighet — det är så hreflang kopplas ihop.
4. Lägga till språket i `publishedLocales` i `_data/routes.js`, i samma commit
   som språkets sista sida.

Hreflang, språkväljaren, bannern och sitemap följer med automatiskt. Inget av
det behöver röras.

Använd `hreflang`-koderna `nb`, `da` och `en`. Aldrig `dk` eller `se` — de är
landskoder, ogiltiga som hreflang, och Google ignorerar dem tyst.
```

- [ ] **Step 5: Ta bort låset**

Refaktoreringen är klar och bevisad. Baseline har inget syfte längre, och att
låta den ligga kvar skulle blockera våg 3 vid varje ny sida.

```bash
git rm .sv-baseline.json
```

I `package.json`, ta bort `"check:sv"` och `"baseline:sv"` ur `"scripts"`, och
ändra `"check"` till:

```json
    "check": "npm run build && npm test && npm run check:legal && npm run validate:html",
```

Behåll `scripts/check-sv-unchanged.mjs` i repot. Den är användbar igen vid
nästa större refaktorering av layouterna, och `--write` gör den självförsörjande.

- [ ] **Step 6: Markera specen som implementerad**

I specens header, byt `Status: godkänd design, ej implementerad` mot:

```
Status: våg 1 implementerad. Vågorna 2-5 (termordlista och översättningar)
återstår och får en egen plan.
```

- [ ] **Step 7: Kör den slutliga kontrollen**

```bash
npm run check
```
Förväntat: allt grönt utan `check:sv`.

- [ ] **Step 8: Committa**

```bash
git add README.md package.json docs/superpowers/specs/2026-08-04-flersprakig-sajt-design.md
git commit -m "docs(i18n): våg 1 klar, dokumentera hur ett språk läggs till

Baseline borttagen. Refaktoreringen är bevisad och låset skulle annars
blockera varje ny sida i våg 3. Skriptet ligger kvar för nästa gång
layouterna byggs om."
```

---

## Vad som INTE ingår

- Översättning av innehåll. Vågorna 2–5 får en egen plan när termordlistan
  är granskad.
- `_data/i18n/nb.json`, `da.json`, `en.json`. Skapas i sina respektive vågor,
  efter termordlistans grind.
- Språkkatalogerna `no/`, `dk/`, `en/`. Samma sak.
- Lokalisering av `/i/` och 404 till andra språk. Maskineriet finns efter denna
  plan; sidorna skapas i språkvågorna.
- Meta-SDK, SKAdNetwork och RevenueCats Meta Ads-integration. Appjobb, hör
  hemma i appens repo. Se specens avgränsningar.
- Uppdatering av `llms.njk` med språkversionerna. Det finns inga att lista än;
  görs i våg 3 när `/en/` går live.
- Klausulen om styrande språkversion i `privacy/index.html` och
  `terms/index.html`. Den refererar till norska och danska besökare som ännu
  inte har någonstans att komma från. **Måste ligga på plats innan våg 4
  publiceras** — norska och danska besökare länkas till den engelska delen, och
  utan klausulen är det oklart vilken version som gäller vid tvist. Kräver nytt
  versionsnummer och nytt datum i båda språkdelarna, samt en `requireText` i
  `scripts/check-legal.mjs`.

## Kända avvikelser i låset

Två tasks skriver medvetet om `.sv-baseline.json`. Ingen annan får göra det —
faller låset i någon annan task är det en bugg, inte en förväntad ändring.

| Task | Vad som ändras i HTML | Varför |
|---|---|---|
| 14 | Play-länken får `hl` och `gl` | Marknadsanpassade butikslänkar |
| 15 | `data-store-link` på butiksknapparna | Kroken kampanjskriptet behöver |
