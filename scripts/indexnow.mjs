// Pingar IndexNow (Bing, Yandex, m.fl.) om nya och ändrade sidor efter deploy.
//
// Varför: en ny domän utan inkommande länkar får vänta länge på att sökmotorer
// upptäcker undersidor av sig själva. IndexNow är en push i stället för att
// vänta på en crawl. Google deltar inte, men Bing matar även Copilot och
// ChatGPTs sökning, så guiderna blir sökbara någonstans medan Google-arbetet
// pågår.
//
// Skickar bara sidor vars innehåll faktiskt ändrats sedan förra körningen.
// Att gång på gång skicka in oförändrade URL:er är vad IndexNow avråder från.
// Tillståndet ligger i .indexnow-state.json (gitignorerad): saknas den skickas
// allt en gång, vilket är precis vad vi vill vid första körningen.
//
// Kör efter deploy, aldrig före: URL:en måste svara när sökmotorn hämtar den.
// Skriptet får aldrig fälla en lyckad deploy, så alla fel loggas och sväljs.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const SITE = JSON.parse(
  JSON.stringify(await import('../_data/site.js').then((m) => m.default)),
);
const OUT = '_site';
const STATE = '.indexnow-state.json';
const ENDPOINT = 'https://api.indexnow.org/indexnow';

const host = new URL(SITE.url).host;
const key = SITE.indexNowKey;

if (!key) {
  console.log('IndexNow: ingen nyckel i _data/site.js, hoppar över.');
  process.exit(0);
}

// URL:erna vi vill ha indexerade är exakt de som ligger i sitemapen.
const sitemap = readFileSync(join(OUT, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

// Sökväg till den byggda filen bakom en URL, för innehållshashen.
function builtFile(url) {
  const path = new URL(url).pathname;
  return join(OUT, path.endsWith('/') ? `${path}index.html` : path);
}

function hashOf(url) {
  const file = builtFile(url);
  if (!existsSync(file)) return null;
  return createHash('sha1').update(readFileSync(file)).digest('hex').slice(0, 12);
}

const previous = existsSync(STATE) ? JSON.parse(readFileSync(STATE, 'utf8')) : {};
const current = {};
const changed = [];

for (const url of urls) {
  const h = hashOf(url);
  if (!h) continue;
  current[url] = h;
  if (previous[url] !== h) changed.push(url);
}

if (changed.length === 0) {
  console.log('IndexNow: inga ändrade sidor, inget att skicka.');
  process.exit(0);
}

const payload = {
  host,
  key,
  keyLocation: `${SITE.url}/${key}.txt`,
  urlList: changed,
};

try {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  // 200 = mottaget, 202 = mottaget men nyckeln valideras fortfarande.
  if (res.ok || res.status === 202) {
    writeFileSync(STATE, `${JSON.stringify(current, null, 2)}\n`);
    console.log(`IndexNow: skickade ${changed.length} URL:er (HTTP ${res.status}).`);
    for (const u of changed) console.log(`  ${u}`);
  } else {
    // Tillståndet uppdateras inte, så nästa körning försöker igen.
    console.warn(`IndexNow: avvisades med HTTP ${res.status}, försöker igen nästa deploy.`);
    console.warn(`  ${(await res.text()).slice(0, 200)}`);
  }
} catch (err) {
  console.warn(`IndexNow: anropet misslyckades (${err.message}), försöker igen nästa deploy.`);
}
