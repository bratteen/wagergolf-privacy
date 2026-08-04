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
