const test = require('node:test');
const assert = require('node:assert');
const { existsSync, readdirSync, readFileSync } = require('node:fs');
const { FORMATS, TERMS } = require('../_data/terms.js');
const routes = require('../_data/routes.js');

const LANGS = Object.keys(routes.locales);

/** Guidernas faktiska slug och format ur repot, nycklade på slug. */
function guidesInRepo() {
  const dir = 'spelformer/guides';
  const out = {};
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.md'))) {
    const src = readFileSync(`${dir}/${f}`, 'utf8');
    const slug = src.match(/^slug:\s*(\S+)/m)[1];
    const format = src.match(/^format:\s*(.+)$/m)[1].trim();
    const alt = src.match(/^altName:\s*(.+)$/m);
    out[slug] = { format, altName: alt ? alt[1].trim() : null };
  }
  return out;
}

function scalar(source, key) {
  const match = source.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  if (!match) return null;
  const value = match[1].trim();
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

/** Guide-frontmatter för ett publicerat språk, nycklat med svensk identitet. */
function localizedGuides(lang) {
  const prefix = routes.locales[lang].prefix.replace(/^\//, '');
  const dir = lang === 'sv' ? 'spelformer/guides' : `${prefix}/spelformer/guides`;
  const out = {};

  for (const file of readdirSync(dir).filter((name) => name.endsWith('.md'))) {
    const source = readFileSync(`${dir}/${file}`, 'utf8');
    const slug = scalar(source, 'slug');
    const key = lang === 'sv' ? slug : scalar(source, 'key')?.replace(/^guide:/, '');
    assert.ok(key, `${dir}/${file} saknar språkoberoende guide:key`);
    assert.ok(!out[key], `${lang}: guide:${key} finns i mer än en fil`);
    out[key] = {
      slug,
      name: scalar(source, 'format'),
      altName: scalar(source, 'altName'),
    };
  }

  return out;
}

const REPO = guidesInRepo();

// Den viktigaste kontrollen: ordlistan ska beskriva sajten som den ÄR. Glider
// de isär översätter vi mot en sajt som inte finns.
test('varje guide i repot finns i ordlistan', () => {
  for (const slug of Object.keys(REPO)) {
    assert.ok(FORMATS[slug], `ordlistan saknar guiden "${slug}"`);
  }
});

test('ordlistan hittar inte på guider som inte finns', () => {
  for (const key of Object.keys(FORMATS)) {
    assert.ok(REPO[key], `ordlistan har "${key}" men ingen sådan guide finns`);
  }
});

test('svenskan i ordlistan matchar guidernas frontmatter exakt', () => {
  for (const [slug, guide] of Object.entries(REPO)) {
    const sv = FORMATS[slug].sv;
    assert.strictEqual(sv.slug, slug, `${slug}: slug skiljer sig`);
    assert.strictEqual(sv.name, guide.format, `${slug}: format skiljer sig`);
    assert.strictEqual(
      sv.altName || null,
      guide.altName,
      `${slug}: altName skiljer sig`,
    );
  }
});

test('alla publicerade språkguider matchar ordlistans namn, slug och altName', () => {
  for (const lang of routes.publishedLocales) {
    const guides = localizedGuides(lang);
    assert.deepStrictEqual(
      Object.keys(guides).sort(),
      Object.keys(FORMATS).sort(),
      `${lang}: guideuppsättningen skiljer sig från ordlistan`,
    );

    for (const [key, guide] of Object.entries(guides)) {
      const expected = FORMATS[key][lang];
      assert.deepStrictEqual(
        guide,
        {
          slug: expected.slug,
          name: expected.name,
          altName: expected.altName || null,
        },
        `${lang}: guide:${key} matchar inte ordlistan`,
      );
    }
  }
});

test('varje format har alla elva språken med namn och slug', () => {
  for (const [key, entry] of Object.entries(FORMATS)) {
    for (const lang of LANGS) {
      assert.ok(entry[lang], `${key} saknar ${lang}`);
      assert.ok(entry[lang].name, `${key}.${lang} saknar name`);
      assert.ok(entry[lang].slug, `${key}.${lang} saknar slug`);
    }
  }
});

test('slugs är URL-säkra: gemener, a-z0-9 och bindestreck', () => {
  for (const [key, entry] of Object.entries(FORMATS)) {
    for (const lang of LANGS) {
      const slug = entry[lang].slug;
      assert.match(
        slug,
        /^[a-z0-9]+(-[a-z0-9]+)*$/,
        `${key}.${lang}: "${slug}" är inte URL-säker — diakriter ska skalas bort`,
      );
    }
  }
});

test('inga två format delar slug inom samma språk', () => {
  for (const lang of LANGS) {
    const seen = new Map();
    for (const [key, entry] of Object.entries(FORMATS)) {
      const slug = entry[lang].slug;
      assert.ok(
        !seen.has(slug),
        `${lang}: "${slug}" används av både ${seen.get(slug)} och ${key}`,
      );
      seen.set(slug, key);
    }
  }
});

test('varje term har alla elva språken', () => {
  for (const [key, entry] of Object.entries(TERMS)) {
    for (const lang of LANGS) {
      assert.ok(entry[lang], `termen "${key}" saknar ${lang}`);
    }
  }
});

test('source-fältet finns på varje format, även när det är tomt', () => {
  // Fältet dokumenterar hur den ursprungliga nordiska termen valdes. Saknat
  // fält betyder att någon glömt fundera på saken.
  for (const [key, entry] of Object.entries(FORMATS)) {
    assert.strictEqual(
      typeof entry.source,
      'string',
      `${key} saknar source-fält`,
    );
  }
});

test('nordiska förbundstermer och sluggar är låsta', () => {
  assert.deepStrictEqual(
    FORMATS.bastboll.nb,
    { name: 'Four-Ball', slug: 'four-ball' },
  );
  assert.deepStrictEqual(
    FORMATS.bastboll.da,
    { name: 'Four-Ball', slug: 'four-ball' },
  );
  assert.deepStrictEqual(
    FORMATS.bastboll.en,
    { name: 'Four-Ball', slug: 'best-ball' },
  );
  assert.deepStrictEqual(
    FORMATS['narmast-flaggan'].da,
    { name: 'Nærmest hullet', slug: 'naermest-hullet' },
  );
  assert.strictEqual(FORMATS['split-sixes'].nb.altName, 'Københavner');
  assert.strictEqual(FORMATS['split-sixes'].da.altName, 'Københavner');
  assert.strictEqual(TERMS['stroke-index'].nb, 'Handicap-indeks');
  assert.strictEqual(TERMS['stroke-index'].da, 'Handicapnøgle');
});

test('nordiska guidefiler använder samma säkra sluggar och namn', () => {
  const expected = [
    ['no/spelformer/guides/four-ball.md', 'four-ball', 'Four-Ball'],
    ['dk/spelformer/guides/four-ball.md', 'four-ball', 'Four-Ball'],
    ['dk/spelformer/guides/naermest-hullet.md', 'naermest-hullet', 'Nærmest hullet'],
  ];

  for (const [file, slug, format] of expected) {
    const source = readFileSync(file, 'utf8');
    assert.match(source, new RegExp(`^slug: ${slug}$`, 'm'));
    assert.match(source, new RegExp(`^format: ${format}$`, 'm'));
  }

  assert.ok(!existsSync('no/spelformer/guides/best-ball.md'));
  assert.ok(!existsSync('dk/spelformer/guides/best-ball.md'));
  assert.ok(!existsSync('dk/spelformer/guides/taettest-paa-flaget.md'));
});

test('den publicerade engelska Four-Ball-guiden behåller sin gamla URL', () => {
  const source = readFileSync('en/spelformer/guides/best-ball.md', 'utf8');
  assert.match(source, /^slug: best-ball$/m);
  assert.match(source, /^format: Four-Ball$/m);
  assert.doesNotMatch(source, /^format: Best ball$/m);
});

test('gamla nordiska guideadresser omdirigeras permanent', () => {
  const redirects = readFileSync('_redirects', 'utf8');
  assert.match(
    redirects,
    /^\/no\/spilleformer\/best-ball\/ \/no\/spilleformer\/four-ball\/ 301$/m,
  );
  assert.match(
    redirects,
    /^\/dk\/spilformer\/best-ball\/ \/dk\/spilformer\/four-ball\/ 301$/m,
  );
  assert.match(
    redirects,
    /^\/dk\/spilformer\/taettest-paa-flaget\/ \/dk\/spilformer\/naermest-hullet\/ 301$/m,
  );
});
