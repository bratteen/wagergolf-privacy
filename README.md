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
npm run deploy     # kontrollerar, bygger, deployar production och pingar IndexNow
```

VIKTIGT: deploya `_site/` (den byggda sidan), aldrig repo-roten. Gamla flödet
`wrangler pages deploy .` skulle ladda upp källan (.njk, node_modules) och förstöra
sajten.

`npm run deploy` tvingar Cloudflare-branchen `main` och får därför endast köras
från en ren, uppdaterad checkout av GitHubs `main` efter grön CI. Från en
feature-branch ska en separat preview användas:

```bash
npm run check
npx wrangler pages deploy _site --project-name=wagergolf --branch=<feature-branch>
```

Preview-kommandot ovan publicerar inte production och kör inte IndexNow.
Före varje production-deploy ska Cloudflare Pages-dashboardens automatiska
Web Analytics också vara avstängd; dashboarden kan injicera statistik även när
repo-konfigurationen inte innehåller något analysscript.

## Struktur

```
index.njk              startsidan (mall, ärver _includes/base.njk)
_includes/base.njk     delad <head>, header, footer, scripts
_data/site.js          global data (url, App Store-länk, OG-bild, CF-beacon-token)
_data/routes.js        lokaliserade sökvägssegment per språk (sv, nb, da, en)
_data/i18n/            UI-strängar per språk
lib/                   delad logik: hreflang, JSON-LD, datum, kampanjmärkning
functions/go.js        universell kampanjlänk för QR, poddar och tryck
functions/ladda-ner.js universell nedladdningslänk, väljer butik efter enhet
spelformer/            innehållsnav: pelarsida + guide per spelform (kommer)
privacy/index.html     integritetspolicyn, fristående HTML, kopieras orörd
terms/index.html       användarvillkor, fristående HTML, kopieras orörd
assets/                bilder, css, self-hosted fonter, OG-bild
sitemap.njk robots.njk genererar /sitemap.xml och /robots.txt
scripts/fetch-fonts.js hämtar woff2 från Google Fonts → assets/fonts/ (kör vid font-byte)
docs/                  specar (byggs inte)
```

`functions/go.js` och `functions/ladda-ner.js` speglar värden som annars bor i
`_data/site.js` och `_data/routes.js` (språkprefix, marknader, publicerade
språk). De kan inte importera därifrån: `.eleventy.js` passthrough-kopierar
`functions/` rakt in i `_site/`, och deployen skickar bara `_site/` — `_data/`
följer aldrig med. Ändras något i den ena filen måste motsvarande värde ändras
för hand i den andra. Testerna (`tests/go.test.mjs`, `tests/campaign.test.js`,
`tests/store-urls.test.js`, `tests/ladda-ner.test.mjs`) kontrollerar både varje
sida och den gemensamma marknads-/releasekonfigurationen mot varandra. Synken
är ändå explicit eftersom Pages Functions inte kan importera `_data/` i drift.

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

## Lägga till ett språk

Fyra språk är publicerade via `_data/routes.js` (sv, nb, da, en).
Sökvägarna är marknadsbaserade (`/no/`, `/dk/`,
`/en/`) medan hreflang är språkbaserad (`nb`, `da`, `en`) — de skiljer sig
medvetet, se kommentaren överst i `_data/routes.js`. Ett språk går live
genom att:

1. Skapa `_data/i18n/<lang>.json` med exakt samma nycklar som `sv.json`.
   `tests/i18n.test.js` låser schemat och stoppar bygget om en nyckel saknas
   eller är överflödig.
2. Skapa språkets innehållskatalog (`no/`, `dk/` eller `en/`) med en
   katalogdatafil som sätter `lang` som **vanlig data, inte i
   `eleventyComputed`**.

   Filen måste bära **katalogens eget namn** — det är Eleventys konvention
   för katalogdata, inte en stilfråga: `no/no.11tydata.js`,
   `dk/dk.11tydata.js`, `en/en.11tydata.js`. Ett annat namn, t.ex.
   `no/.11tydata.js` eller `no/index.11tydata.js`, ignoreras **tyst** av
   Eleventy — inget byggfel, filen plockas helt enkelt aldrig upp, och varje
   sida i katalogen faller tillbaka på svenska. Resultatet är
   `<html lang="sv">` på varenda norsk sida, utan att något larmar. Se
   `spelformer/guides/guides.11tydata.js` för hur en katalogdatafil ser ut i
   repot i dag (namngiven efter sin egen katalog, `guides/`), och
   kommentaren överst i `_data/eleventyComputed.js`, som redan påminner om
   samma sak.

   Placera `lang` som vanlig data i den filen, inte under `eleventyComputed`.
   Ordningen mellan global och katalognivås `eleventyComputed` är inte
   garanterad i Eleventy, och guidernas katalogdata läser `data.lang` när den
   bygger sin permalink. Ligger `lang` i `eleventyComputed` kan den vara
   odefinierad när permalinken räknas ut, vilket ger en engelsk guide en
   svensk sökväg utan att bygget larmar.
3. Skapa en motsvarande katalogdatafil för guiderna. Guidesidorna (det som i
   dag ligger under `spelformer/guides/`) har sin egen katalogdatafil,
   `spelformer/guides/guides.11tydata.js`, som sätter `layout`, `tags:
   "guides"` och `ogType`, och beräknar `permalink` och `structuredData`
   utifrån `data.lang`. Ett nytt språks guider behöver samma sak på sin egen
   plats, t.ex. `no/spelformer/guides/guides.11tydata.js` (namngiven efter
   sin katalog av samma skäl som i steg 2). Utan den filen får språkets
   guider varken rätt layout, rätt permalink eller rätt JSON-LD, och hamnar
   inte i `guides`-collectionen som pelarsidan och `guideUrl`-shortcoden
   läser från.

   Filen kan **kopieras rakt av**, oförändrad. Dess `require`-anrop använder
   `#data/...` och `#lib/...` — Nodes subpath-imports, definierade i
   `package.json` under `"imports"` (`#data/*` → `_data/*`, `#lib/*` →
   `lib/*`). De är repo-rotsrelativa, inte relativa till filens egen plats,
   så samma `require("#data/routes.js")` fungerar oavsett om filen ligger på
   `spelformer/guides/` eller `no/spelformer/guides/` eller djupare. Skriv
   inte om dem till `require("../../...")` vid kopieringen — det var precis
   den sortens sökväg som gjorde att en tidigare version av denna instruktion
   krävde manuell uträkning av antal `../` per kopia.

   `published`/`updated` i filen är guidernas ursprungsdatum och behöver
   troligen egna värden per språk, inte en ren kopia av de svenska.
4. Översätta sidorna. Varje sida ska behålla samma `key` som sin svenska
   motsvarighet — det är den nyckeln, inte sökvägen, som hreflang,
   språkväljaren och sitemapen kopplar ihop sidor mellan språk med.

   Samma konvention gäller `related:`-listan i en guides frontmatter (se
   `_includes/guide.njk`): den innehåller alltid den SVENSKA sluggen,
   oöversatt, i alla språkversioner — precis som argumentet till
   `guideUrl`-shortcoden. En översatt guide kopierar alltså sin svenska
   motsvarighets `related:`-lista rakt av, den ska inte översättas.
5. Lägga till språket i `publishedLocales` i `_data/routes.js`, i samma
   commit som språkets sista sida. Innan dess kan språket byggas och
   granskas lokalt utan att synas i hreflang, språkväljaren, bannern eller
   sitemapen — allt filtrerar mot den listan.
6. Spegla samma språk i `PUBLISHED` i både `functions/go.js` och
   `functions/i/[[path]].js`. Listorna är EGNA KOPIOR av `publishedLocales`,
   inte utledda från `_data/routes.js`; Pages Functions deployas utan `_data/`.
   Om bara steg 5 görs kan kampanj- och inbjudningslänkar fortfarande servera
   fel språk. `tests/published-in-sync.test.js` jämför alla tre listorna och
   stoppar bygget om de driver isär, men ändringen ska ändå göras i samma
   commit som steg 5.

Hreflang, språkväljaren, bannern och sitemap härleds automatiskt ur sidornas
`key` och `publishedLocales` i `_data/routes.js` — inget av det behöver röras
för att lägga till ett språk. `/go` och `/i/*` är undantagen: deras
`PUBLISHED`-listor (steg 6) är egna kopior som måste uppdateras för hand.

Nedladdningslänken (`functions/ladda-ner.js`) är en enda endpoint för alla
13 marknader. Marknad väljs i ordningen explicit `?m=`, Workers verifierade
`request.cf.country` och därefter `CF-IPCountry`-headern. Saknas ett verifierat
land öppnas ingen butik. `?l=` anger endast webbspråk, aldrig storefront.
Bara länder i `PUBLIC_MARKETS` får en butiksomdirigering; övriga hålls kvar på
rätt landningssida tills versionen faktiskt går att installera där.
`_data/site.js` och funktionen speglar samma lista och testerna fäller bygget
om de driver isär.

Använd hreflang-koderna `nb`, `da` och `en` — aldrig `dk` eller `se`. De är
landskoder (samma som ligger i sökvägen och i App Store-storefronten), inte
språkkoder, och ogiltiga som hreflang-värde. Google ignorerar en ogiltig
hreflang tyst, utan varning i Search Console, så felet upptäcks inte av sig
självt. Att sökvägen för danska heter `/dk/` gör misstaget extra frestande —
kontrollera alltid mot `hreflang`-fältet i `_data/routes.js`, aldrig mot
sökvägsprefixet.

### Publicera eller pausa ett språk

Norska och danska är publicerade. De syns i hreflang, språkväxlare och
sitemap, och sidorna är indexerbara. Om ett språk tillfälligt måste pausas
tas det bort från de tre listorna nedan och sajten deployas på nytt.

Att ändra publiceringsstatus kräver samma ändring på tre ställen som måste
följas åt (`tests/published-in-sync.test.js` fäller bygget annars):

1. `_data/routes.js` — lägg till språket i `PUBLISHED`.
2. `functions/go.js` — samma tillägg.
3. `functions/i/[[path]].js` — samma tillägg. Kontrollera också att språket
   finns i `ASSET_FOR`; norska och danska sökvägar är redan förberedda där.

Allt annat följer med automatiskt: hreflang, språkväljaren, bannern, sitemap
och borttagningen av `noindex`. `tests/published-complete.test.js` kontrollerar
samtidigt att varje svensk sida har en motsvarighet, så ett halvfärdigt språk
kan inte gå live av misstag.

Verifierat genom torrkörning: med alla fyra i `PUBLISHED` blir det 110 URL:er
i sitemap, 540 hreflang-alternativ och noll `noindex`.

### Lokaliserade appskärmbilder

Bilderna i roten av `assets/shots/` är svenska. Norska, danska och engelska
versioner finns i respektive språkmapp, med rätt valuta och providerneutral
uppgörelse utanför Sverige. En besökare ska aldrig mötas av ett annat språks
appgränssnitt eller en betalningsleverantör som inte finns i marknaden.

Sidorna refererar bilderna med shortcoden `{% shot "live" %}`, inte med en
hårdkodad sökväg. Uppslagsordningen är sidans språk, sedan engelska, sedan
den delade bilden — och svenskan går direkt till den delade, eftersom de
delade bilderna *är* de svenska.

Det gör hanteringen additiv: ett nytt språk kostar ingenting, sidorna byggs
och fungerar direkt med reservbilden. Vill du lokalisera lägger du filerna i
`assets/shots/<lang>/` med samma namn (`live.webp`, `settlement.webp`,
`home.webp`), och de plockas upp automatiskt överallt — utan att en enda sida
behöver ändras. Varje bild slås upp för sig, så du kan ta en i taget.

Bara `alt`-texten står kvar per sida, och den är redan översatt.
