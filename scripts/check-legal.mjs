import { readFile } from 'node:fs/promises';

const paths = {
  privacySource: 'privacy/index.html',
  termsSource: 'terms/index.html',
  privacyBuilt: '_site/privacy/index.html',
  termsBuilt: '_site/terms/index.html',
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

for (const [name, text] of Object.entries(files)) {
  if (name === 'headers') continue;
  forbidText(name, text, 'analytics.bratt.se');
  forbidText(name, text, 'static.cloudflareinsights.com');
  forbidText(name, text, '<script');
}

for (const name of ['privacySource', 'privacyBuilt']) {
  const text = files[name];
  requireCount(name, text, 'Version 4.0', 2);
  requireText(name, text, 'Senast uppdaterad: 25 juli 2026');
  requireText(name, text, 'Last updated: July 25, 2026');
  requireText(name, text, 'Policyn gäller från 25 juli 2026');
  requireText(name, text, 'This policy applies from July 25, 2026');
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
  requireText(name, text, 'netto i kronor');
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
  forbidText(name, text, 'Version 3.9');
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
  requireCount(name, text, 'Version 1.1', 2);
  requireText(name, text, 'Senast uppdaterad: 14 juli 2026');
  requireText(name, text, 'Last updated: July 14, 2026');
  requireText(name, text, '<section lang="en">');
  requireText(name, text, 'alla 21 spelformer');
  requireText(name, text, 'all 21 game formats');
  requireText(name, text, 'avslutar inte prenumerationen');
  requireText(name, text, 'does not cancel the subscription');
  forbidText(name, text, 'alla 25 spelformat');
  forbidText(name, text, 'all 25 game formats');
  forbidText(name, text, '49 kr/månad');
  forbidText(name, text, '299 kr/år');
  forbidText(name, text, '49 SEK/month');
  forbidText(name, text, '299 SEK/year');
  forbidText(name, text, '14 dagars gratis provperiod');
  forbidText(name, text, '14-day free trial');
}

requireText('headers', files.headers, '/privacy/*\n  Content-Security-Policy: default-src \'self\'; script-src \'none\'');
requireText('headers', files.headers, '/terms/*\n  Content-Security-Policy: default-src \'self\'; script-src \'none\'');

if (failures.length > 0) {
  console.error('Legal-page checks failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Legal-page checks passed.');
