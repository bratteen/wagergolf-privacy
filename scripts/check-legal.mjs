import { readFile } from 'node:fs/promises';

const paths = {
  privacySource: 'privacy/index.html',
  termsSource: 'terms/index.html',
  privacyBuilt: '_site/privacy/index.html',
  termsBuilt: '_site/terms/index.html',
  homeSv: '_site/index.html',
  homeEn: '_site/en/index.html',
  homeDa: '_site/dk/index.html',
  homeNb: '_site/no/index.html',
  headers: '_site/_headers',
};

const entries = await Promise.all(
  Object.entries(paths).map(async ([name, path]) => [name, await readFile(path, 'utf8')]),
);
const files = Object.fromEntries(entries);
const failures = [];

function requireText(name, text, expected) {
  if (!text.includes(expected)) failures.push(`${name}: missing ${JSON.stringify(expected)}`);
}

function forbidText(name, text, forbidden) {
  if (text.includes(forbidden)) failures.push(`${name}: contains ${JSON.stringify(forbidden)}`);
}

function requireCount(name, text, expected, count) {
  const actual = text.split(expected).length - 1;
  if (actual !== count) {
    failures.push(`${name}: expected ${count} occurrences of ${JSON.stringify(expected)}, got ${actual}`);
  }
}

for (const name of ['privacySource', 'termsSource', 'privacyBuilt', 'termsBuilt']) {
  const text = files[name];
  forbidText(name, text, 'analytics.bratt.se');
  forbidText(name, text, 'static.cloudflareinsights.com');
  forbidText(name, text, '<script');
}

for (const name of ['privacySource', 'privacyBuilt']) {
  const text = files[name];
  requireCount(name, text, 'Version 4.1', 2);
  requireText(name, text, 'Senast uppdaterad: 8 augusti 2026');
  requireText(name, text, 'Last updated: August 8, 2026');
  requireText(name, text, 'Policyn gäller från 8 augusti 2026');
  requireText(name, text, 'This policy applies from August 8, 2026');
  requireText(name, text, 'aktiverades och verifierades i produktion den 17 juli 2026');
  requireText(name, text, 'activated and verified in production on');
  requireText(name, text, 'automatiskt dataminimerad produktanalys');
  requireText(name, text, 'produkt- och användningshändelser styrs av en tillåtelselista');
  requireText(name, text, 'berättigade intresse');
  requireText(name, text, 'automatically uses data-minimised product analytics');
  requireText(name, text, 'product and usage events are controlled by an');
  requireText(name, text, 'legitimate interest');
  requireText(name, text, '<section lang="en">');
  requireText(name, text, 'giltig, aktiv inbjudningslänk');
  requireText(name, text, 'anti-echo-markörer');
  requireText(name, text, 'Hemmarknad (Sverige, Danmark eller Norge)');
  requireText(name, text, 'Home market (Sweden, Denmark or Norway)');
  requireText(name, text, 'netto i rundans valda valuta');
  requireText(name, text, "net amount in the round's selected currency");
  requireText(name, text, 'över 1 000 golfbanor');
  requireText(name, text, 'more than 1,000 golf');
  requireText(name, text, 'Privat uppgörelse och Swish');
  requireText(name, text, 'Private settlement and Swish');
  requireText(name, text, 'Swish-funktionen är');
  requireText(name, text, 'Swish is available only');
  requireText(name, text, 'rundor med Sverige som vald marknad');
  requireText(name, text, 'rounds set to Sweden');
  requireText(name, text, 'I Danmark och Norge gör spelarna');
  requireText(name, text, 'In Denmark and Norway, players currently');
  requireText(name, text, 'Wager Golf behandlar inte själva betalningen');
  requireText(name, text, 'process the actual payment');
  requireText(name, text, 'dataskyddsmyndigheten där du bor eller arbetar');
  requireText(name, text, 'data protection authority where you live or work');
  requireText(name, text, 'href="../terms/#english"');
  requireText(name, text, 'Wager Golf är avsedd för personer som är minst 17 år');
  requireText(name, text, 'Wager Golf is intended for people aged 17 or older');
  requireText(name, text, 'Sentry-projektets konfigurerade lagringstid');
  requireText(name, text, 'Raderad spelare');
  requireText(name, text, 'olänkbart slump-ID');
  requireText(name, text, 'högst cirka 104 dagar');
  requireText(name, text, 'identitetsverifiering kan krävas');
  requireText(name, text, 'AES-256-GCM');
  requireText(name, text, 'appversion 1.5');
  requireText(name, text, 'Google Sign-In-identifierare');
  requireText(name, text, 'daily workflow');
  requireText(name, text, 'fixed expiry');
  requireText(name, text, 'for up to approximately 104');
  requireText(name, text, 'deleting your account does not cancel');
  forbidText(name, text, 'Version 4.0');
  forbidText(name, text, 'PostHog används bara om du själv slår på');
  forbidText(name, text, 'frivillig användningsstatistik');
  forbidText(name, text, 'Samtycket sparas per konto');
  forbidText(name, text, 'Du kan stänga av statistiken igen');
  forbidText(name, text, 'Om du samtyckt till PostHog');
  forbidText(name, text, 'PostHog is used only if you enable');
  forbidText(name, text, 'optional usage analytics');
  forbidText(name, text, 'Consent is stored per account');
  forbidText(name, text, 'You can turn analytics off again');
  forbidText(name, text, 'If you consented to PostHog');
}

for (const name of ['termsSource', 'termsBuilt']) {
  const text = files[name];
  requireCount(name, text, 'Version 1.2', 2);
  requireText(name, text, 'Senast uppdaterad: 8 augusti 2026');
  requireText(name, text, 'Last updated: August 8, 2026');
  requireText(name, text, '<section lang="en">');
  requireText(name, text, 'alla 21 spelformer');
  requireText(name, text, 'all 21 game formats');
  requireText(name, text, 'avslutar inte prenumerationen');
  requireText(name, text, 'does not cancel the subscription');
  requireText(name, text, 'golfare i Sverige, Danmark och Norge');
  requireText(name, text, 'golfers in Sweden, Denmark and Norway');
  requireText(name, text, 'tvingande regler i landet där du har din vanliga');
  requireText(name, text, 'mandatory rules in the country of your habitual');
  requireText(name, text, 'skatte- och rapporteringsregler');
  requireText(name, text, 'tax and reporting rules');
  requireText(name, text, 'Danmark och Norge visar appen uppgörelsen');
  requireText(name, text, 'Denmark and Norway, the app displays the');
  requireText(name, text, 'håller eller förmedlar inga');
  requireText(name, text, 'hold or transfer stakes');
  requireText(name, text, 'href="../privacy/#english"');
  requireText(name, text, 'Du måste vara minst 17 år gammal');
  requireText(name, text, 'You must be at least 17 years old');
  forbidText(name, text, 'Version 1.1');
  forbidText(name, text, 'alla 25 spelformat');
  forbidText(name, text, 'all 25 game formats');
  forbidText(name, text, '49 kr/månad');
  forbidText(name, text, '299 kr/år');
  forbidText(name, text, '49 SEK/month');
  forbidText(name, text, '299 SEK/year');
  forbidText(name, text, '14 dagars gratis provperiod');
  forbidText(name, text, '14-day free trial');
}

for (const name of ['homeEn', 'homeDa', 'homeNb']) {
  requireText(name, files[name], 'href="/privacy/#english"');
  requireText(name, files[name], 'href="/terms/#english"');
}

requireText('homeSv', files.homeSv, 'href="/privacy/"');
requireText('homeSv', files.homeSv, 'href="/terms/"');
forbidText('homeSv', files.homeSv, 'href="/privacy/#english"');
forbidText('homeSv', files.homeSv, 'href="/terms/#english"');

requireText('headers', files.headers, '/privacy/*\n  Content-Security-Policy: default-src \'self\'; script-src \'none\'');
requireText('headers', files.headers, '/terms/*\n  Content-Security-Policy: default-src \'self\'; script-src \'none\'');

if (failures.length > 0) {
  console.error('Legal-page checks failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Legal-page checks passed.');
