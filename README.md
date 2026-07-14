# wagergolf.se

Marknadssajt + integritetspolicy + användarvillkor för Wager Golf.
Byggs med [Eleventy (11ty)](https://www.11ty.dev/) och hostas på Cloudflare Pages
(projekt `wagergolf`). Ingen git-koppling till Cloudflare, deploy sker manuellt
med wrangler.

## Bygga lokalt

```bash
npm install        # första gången
npm run dev        # 11ty dev-server med live reload på http://localhost:8080
npm run build      # bygger till _site/
```

## Deploya

```bash
npm run deploy     # bygger _site/ och deployar den till Cloudflare Pages
# = eleventy && wrangler pages deploy _site
```

VIKTIGT: deploya `_site/` (den byggda sidan), aldrig repo-roten. Gamla flödet
`wrangler pages deploy .` skulle ladda upp källan (.njk, node_modules) och förstöra
sajten.

## Struktur

```
index.njk              startsidan (mall, ärver _includes/base.njk)
_includes/base.njk     delad <head>, header, footer, scripts
_data/site.js          global data (url, App Store-länk, OG-bild, CF-beacon-token)
spelformer/            innehållsnav: pelarsida + guide per spelform (kommer)
privacy/index.html     integritetspolicyn, fristående HTML, kopieras orörd
terms/index.html       användarvillkor, fristående HTML, kopieras orörd
assets/                bilder, css, self-hosted fonter, OG-bild
sitemap.njk robots.njk genererar /sitemap.xml och /robots.txt
scripts/fetch-fonts.js hämtar woff2 från Google Fonts → assets/fonts/ (kör vid font-byte)
docs/                  specar (byggs inte)
```

## Uppdatera juridiksidorna

1. Editera `privacy/index.html` och/eller `terms/index.html` på både svenska och
   engelska. Uppdatera datum och versionsnummer i båda språkdelarna.
2. Kör `npm run check`. Det bygger sajten och stoppar gamla versioner,
   felaktigt antal spelformer, hårdkodade priser/provperioder och analysscript
   på juridiksidorna.
3. Committa och pusha ändringen så historiken finns på GitHub.
4. Kör `npm run deploy`. Kommandot kör kontrollerna igen och deployar endast
   den byggda `_site/`-mappen.
5. Verifiera båda språkdelarna live i ett privat fönster. Kontrollera även att
   sidkällan och nätverkstrafiken saknar `analytics.bratt.se`,
   `beacon.min.js` och `/cdn-cgi/rum` på `/privacy/` och `/terms/`.

Cloudflare Pages kan injicera Web Analytics från dashboarden. De sökvägsspecifika
CSP-reglerna i `_headers` blockerar script på juridiksidorna, men kontrollera
även dashboardens automatiska Web Analytics-inställning efter deploy.

## Byta typsnitt

Redigera `scripts/fetch-fonts.js` (CSS_URL), kör `node scripts/fetch-fonts.js`,
uppdatera preload-länkarna i `_includes/base.njk` vid behov.
