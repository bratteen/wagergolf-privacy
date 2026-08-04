# Flerspråkig wagergolf.se: bokmål, danska och engelska

Datum: 2026-08-04
Status: våg 1 implementerad. Vågorna 2-5 (termordlista och översättningar)
återstår och får en egen plan.

## Mål

Publicera hela wagergolf.se på norsk bokmål, danska och engelska utöver
svenskan, så appen kan marknadsföras i Norge, Danmark och internationellt med
egen sökbarhet per marknad. Svenskan ska komma ur arbetet oförändrad.

## Beslut

| Fråga | Beslut |
|---|---|
| Omfattning | Hela sajten, 27 innehållssidor per språk |
| URL-struktur | Underkataloger på wagergolf.se: `/no/`, `/dk/`, `/en/` |
| Svenska | Ligger kvar i roten, inga redirects, blir `x-default` |
| Slugs | Översätts per språk |
| Norsk skriftform | Bokmål, hreflang `nb` |
| Översättare | Claude, mot en granskad termordlista i repot |
| Juridiksidor | Lämnas på svenska + engelska, översätts inte |
| Regressionsskydd | Bygg-test som låser svenskans output |
| `/i/` och 404 | Lokaliseras båda |

## Varför inte Eleventys i18n-plugin

`EleventyI18nPlugin` (inbyggt i Eleventy 3.1.6) bygger på två antaganden som
båda motsägs av besluten ovan: att varje språk har identisk sökvägsstruktur,
och att språkkoden finns i varje URL. Vi har översatta slugs
(`/spelformer/stableford/` mot `/en/game-formats/stableford/`) och svenska utan
prefix. Pluginets `locale_links` kan inte para ihop de sidorna. Att använda det
skulle innebära att bygga runt det, inte med det.

I stället kopplas språkversioner ihop på en explicit nyckel.

## Arkitektur

Varje sida bär två fält: `lang` (ärvs från katalogens datafil) och `key` (en
språkoberoende identitet, t.ex. `guide:stableford` eller `page:about`). Allt
språkberoende härleds från de två.

### Nya filer

| Fil | Ansvar |
|---|---|
| `_data/routes.js` | Lokaliserade sökvägssegment per språk |
| `_data/i18n/sv.json` m.fl. | UI-strängar per språk |
| `_data/terms.js` | Termordlista sv→nb→da→en för golftermer |
| `lib/structured-data.js` | JSON-LD-byggare, delad av alla språk |
| `lib/alternates.js` | Grupperar sidor på `key` → hreflang-alternativ |
| `functions/go.js` | Universell kampanjlänk: språkval + kampanjmärkning |
| `scripts/check-sv-unchanged.mjs` | Regressionsskydd för svenskans output |
| `no/no.11tydata.js`, `dk/…`, `en/…` | Sätter `lang` per katalog |

### `_data/routes.js`

Central karta över lokaliserade sökvägssegment. Mallar bygger länkar härifrån i
stället för att hårdkoda svenska sökvägar.

```js
{
  sv: { prefix: "",    formats: "spelformer",   glossary: "ordlista", about: "om",     download: "ladda-ner" },
  nb: { prefix: "/no", formats: "spilleformer", glossary: "ordliste", about: "om-oss", download: "last-ned" },
  da: { prefix: "/dk", formats: "spilformer",   glossary: "ordliste", about: "om-os",  download: "hent" },
  en: { prefix: "/en", formats: "game-formats", glossary: "glossary", about: "about",  download: "download" },
}
```

Nyckeln är **språket** (`da`), sökvägen är **marknaden** (`/dk`). De två
sammanfaller för `nb`/`/no` bara av en slump: `no` är både språkkod och
landskod, medan `da` enbart är språkkod och `dk` enbart landskod.

Marknadsbaserade sökvägar valdes för att `/no/` och `/dk/` är vad besökarna
känner igen från `.no` och `.dk`, och för att appen säljs per App
Store-storefront, som är landsindelad.

Guidernas katalogdatafiler beräknar `permalink` som
`${prefix}/${formats}/${slug}/` i stället för dagens hårdkodade
`/spelformer/${slug}/`.

### `_data/i18n/*.json`

Alla UI-strängar som i dag står hårdkodade i mallarna: navigationen, footern,
breadcrumb ("Hem"), "Vanliga frågor", byline ("Av … Uppdaterad …"), CTA-rubriken
i `guide.njk` ("Slipp räkna {{ format }} för hand") och sidfotens brödtext.

Sidor kommer åt sitt språks strängar via en `eleventyComputed`-egenskap `t` som
slår upp `i18n[lang]`. Mallarna refererar `{{ t.nav.formats }}`.

### Delade mallar

`base.njk`, `guide.njk` och `page-article.njk` förblir **en** uppsättning. Det
enda som skiljer språken åt är data. Fyra kopior av mallarna skulle glida isär
vid första designändringen.

`<html lang="sv">` i `base.njk` blir `<html lang="{{ lang }}">`.

### hreflang

`lib/alternates.js` grupperar `collections.all` på `key` och returnerar, för en
given sida, samtliga språkversioner med samma nyckel. `base.njk` skriver
`<link rel="alternate" hreflang="…">` för varje, inklusive self-reference, plus
`hreflang="x-default"` mot den svenska versionen.

**Värdena är `sv`, `nb`, `da`, `en` — aldrig `dk` eller `se`.** hreflang tar en
ISO 639-1-språkkod, eventuellt följd av en ISO 3166-1-landskod (`da-DK`). Ett
ensamt `dk` är ogiltigt: Google ignorerar taggen tyst, utan varning i Search
Console. Att sökvägen heter `/dk/` gör felet frestande att "rätta" till senare,
därför står det här. `alternates.js` härleder hreflang ur `lang`-nyckeln, aldrig
ur sökvägsprefixet, så felet kan inte uppstå av misstag.

Härledningen är poängen: 27 sidor × 4 språk är 108 sidor som var och en ska peka
på fyra URL:er. Handunderhållet ruttnar. Med nyckelgruppering blir en saknad
översättning ett tomrum i listan i stället för en trasig länk.

Vilka språk som är publicerade styrs av en lista `publishedLocales` i
`_data/routes.js`. Både `alternates.js` och `sitemap.njk` filtrerar mot den, så
ett halvöversatt språk kan byggas och granskas lokalt utan att exponeras. Ett
språk läggs till i listan i samma commit som dess sista sida.

Resultatet valideras med den installerade skillen `claude-seo:seo-hreflang`.

### Interna länkar i brödtexten

Guiderna länkar till varandra med hårdkodade sökvägar, t.ex.
`[slaggolf](/spelformer/slaggolf/)` i `stableford.md`. I översättningarna måste
de peka rätt inom sitt eget språk.

Lösning: en shortcode `{% guideUrl "slaggolf" %}` som slår upp guidens slug i
aktuellt språk via `collections.guides` och `routes`. Nyckeln (`slaggolf`) är
språkoberoende och identisk i alla fyra versionerna av en fil.

Utan den blir 84 översatta länkar fyra separata uppsättningar hårdkodade
sökvägar som tyst kan peka på fel språk eller på 404.

`related`-listorna i frontmatter använder redan språkoberoende nycklar och
fungerar oförändrat, förutsatt att uppslagningen i `guide.njk` filtreras på
`lang`.

### Strukturerad data

JSON-LD-byggaren i `spelformer/guides/guides.11tydata.js` flyttas till
`lib/structured-data.js` och tar `lang` som argument. `inLanguage` sätts från
språket (`sv-SE`, `nb-NO`, `da-DK`, `en`) i stället för hårdkodat `sv-SE`, och
breadcrumb-namnen hämtas från `t`.

Motivet till utflyttningen är att fyra katalogdatafiler annars skulle innehålla
fyra kopior av samma 60 rader.

### Datumformatering

`svDate`-filtret i `.eleventy.js` ersätts med `localDate(date, lang)` byggt på
`Intl.DateTimeFormat`. Ingen månadsarray per språk behövs; Node har datan.

### Butikslänkar per marknad

`_data/site.js` får en butikslänk per språk:

- App Store: landsprefix `/se/`, `/no/`, `/dk/`, `/us/` på samma app-id
- Google Play: `&hl=` och `&gl=` per marknad
- Kampanjnamn per marknad: `webb`, `webb-no`, `webb-dk`, `webb-en`
  (marknadsbaserade, som sökvägarna, eftersom butiksrapporterna är indelade
  per storefront)

Kampanjnamn per marknad gör att App Store Connect och Play Console delar
förvärvsrapporten per land i stället för att klumpa ihop all webbtrafik.

`functions/ladda-ner.js` byggs separat från Eleventy och kan inte importera
modulen. Den behåller sin duplicerade konstantuppsättning (som i dag) men
utökas med marknad, härledd från sökvägen (`/no/last-ned`) med
`Accept-Language` som fallback. Kommentaren om att hålla värdena i synk med
`_data/site.js` gäller fortsatt och skärps.

### `/go` — kampanjlänken

`functions/go.js`, en Pages Function som tar emot en universell länk och
skickar besökaren till rätt språkversion med kampanjmärkning.

Avsedd för kanaler där en enda URL måste fungera för alla marknader: QR-koder
på tryck, poddar, radio, kläder, mässor. **Digitala annonser ska inte peka
hit** — de ska peka direkt på `/dk/`, `/no/` eller `/en/`, eftersom en
landningssida på annonsens eget språk ger högre relevansbetyg och därmed lägre
klickpris.

```
/go?c=podd-golfsnack&l=da
   ↓
/dk/?utm_source=podd-golfsnack&utm_medium=offline&utm_campaign=podd-golfsnack
   ↓  besökaren klickar Ladda ner
App Store /dk/ med ct=podd-golfsnack
```

**Parametrar**

- `c` — kanalslug, kort och gemener (`qr-scorekort`, `podd-golfsnack`,
  `troja`). Blir `utm_source`, `utm_campaign` och senare butikens `ct`. Håll
  slugen kort; butikernas kampanjfält är fritext men trivs inte med långa
  värden.
- `l` — tvingar språk (`sv`, `nb`, `da`, `en`). Utan den härleds språket från
  `Accept-Language` med Cloudflares `request.cf.country` som stöd. En dansk
  podd ska landa på danska även när lyssnarens telefon står på engelska,
  därför finns den.

Okänt eller saknat `c` ger en ren omdirigering utan utm-parametrar i stället
för fel. En trasig QR-kod ska landa någonstans vettigt.

**Kampanjen vidare till butiken.** Landningssidan bär kampanjen i query-
strängen. `download-link.js` läser den ur `location.search` och ersätter det
generiska `ct=webb-dk` med kanalslugen. Det gör att App Store Connect kan visa
faktiska nedladdningar per offline-kanal, inte bara klick — en siffra som annars
inte går att få för en tryckt QR-kod.

Uppslagningen sker i ordningen `c`, sedan `utm_campaign`, sedan fallback till
marknadens generiska namn. **`utm_campaign` måste finnas med:** betald trafik
från Meta, Google Ads och nyhetsbrev kommer aldrig via `/go` utan landar direkt
på `/dk/?utm_campaign=…`. Utan det steget faller all annonstrafik tillbaka på
`webb-dk` och kampanjen går inte att skilja ut i App Store Connect.

Värdet saneras innan det används som `ct`: gemener, endast `a–z`, `0–9` och
bindestreck, övrigt ersätts med bindestreck, upprepade bindestreck fälls ihop,
och strängen kortas. Metas `{{campaign.name}}` expanderar till kampanjnamnet så
som det skrevs i annonsverktyget, med mellanslag, versaler och ibland emoji —
det kan inte gå orört in i butikens kampanjfält.

Apples kampanjrapport i App Store Connect bygger på `pt`/`ct` och är Apples egen
aggregerade förstahandsdata. Den påverkas inte av ATT, till skillnad från
annonsplattformarnas egen attribution.

**Ingen klientlagring.** Kampanjen lever i URL:en, inte i cookie eller
`sessionStorage`. Det håller ihop med att Umami är cookielöst och med vad
integritetspolicyn säger. Konsekvensen är att kampanjen tappas om besökaren
navigerar vidare innan nedladdning; de flesta konverteringar sker på
landningssidan, och det är en bättre avvägning än att börja lagra i webbläsaren.

**Cachning.** Svaret varierar per besökare. `Cache-Control: no-store` och
`Vary: Accept-Language`, samma mönster som `functions/ladda-ner.js` redan
använder för sin enhetsstyrda omdirigering.

**Indexering.** `/go` läggs som `Disallow` i `robots.njk`. De utm-märkta
landningssidorna är redan skyddade: `base.njk` sätter `canonical` till
`{{ site.url }}{{ page.url }}` utan query, så `/dk/?utm_source=…`
konsolideras mot `/dk/`. Ingen ändring behövs där.

**Omdirigerbarhet.** En tryckt QR-kod kan aldrig ändras. Genom att den pekar på
`/go?c=…` i stället för direkt på en landningssida kan destinationen ändras
efteråt genom en redigering i funktionen. Kampanjslugar som en gång tryckts får
därför aldrig återanvändas för något annat.

### Språkväljare

Väljare i header och footer, byggd på samma `alternates`-lista som hreflang, så
den alltid länkar till *motsvarande* sida i det andra språket och inte till
startsidan.

### Språkbanner

En diskret rad högst upp på sidan när besökarens språk inte matchar sidans:
*"Denne side findes også på dansk →"*. Klick går till motsvarande sida via
`alternates`. Raden går att stänga.

Regler:

- **Klientsida.** Ren JS som läser `navigator.languages`. Ingen Pages Function
  på `/`, ingen `Vary: Accept-Language`, ingen cachefragmentering på
  Cloudflares kant.
- **Visas bara om målspråket är publicerat** och sidan har en översättning med
  samma `key`.
- **Valet sparas i `localStorage`.** Stänger besökaren raden, eller byter språk
  via väljaren, visas den inte igen.
- **Ingen omdirigering.** Sidan som begärdes är sidan som visas.
- **Ingen layoutförskjutning.** Raden renderas dold i HTML och får `hidden`
  borttaget av skriptet, med reserverad höjd, så CLS inte påverkas.
- Skriptet är litet och inline i `base.njk`. En extern fil för tjugo rader är
  inte värt en request innan first paint.

**Ingen automatisk omdirigering** på `Accept-Language`. Googlebot kryper från
USA och skulle då bara se den engelska versionen, vilket lämnar tre språk
oindexerade. Google avråder dessutom explicit från det i sin dokumentation för
flerregionala sajter, och det irriterar besökare som medvetet valt ett språk.
Bannern ger nyttan utan den risken.

Direkttrafik är det enda fall bannern löser: organisk söktrafik landar redan
rätt via hreflang, och annonser, App Store-länkar och QR-koder pekar mot rätt
prefix från början.

### Sitemap och robots

`sitemap.njk` itererar redan `collections.all` och fångar nya språk automatiskt.
Den utökas med `xhtml:link`-alternativ per URL, från samma `alternates`-data.

`llms.njk` uppdateras med språkversionerna.

### `/i/` och 404

`i/index.njk` (inbjudningssidan, serverad via `functions/i/[[path]].js`)
lokaliseras. Det är första intrycket för en inbjuden spelare; en norsk spelare
som bjuds in ska mötas på norska. Språk härleds från inbjudningslänken om det
går, annars `Accept-Language`.

`404.njk` får en version per språkkatalog. Cloudflare Pages letar upp närmaste
`404.html` uppåt i katalogträdet, så `/no/404.html` svarar på `/no/*` och
rotens `/404.html` på allt annat. Svenskan förblir därmed standard utan extra
konfiguration.

## Juridiksidorna

`privacy/index.html` och `terms/index.html` är fristående HTML som kopieras
orörd, med svensk text plus en `<section lang="en">`. Engelskan finns alltså
redan.

De översätts **inte** till norska och danska. Motiv:

- Texten är juridiskt bindande och har versionsnummer som måste hållas i takt
  mellan språkdelarna vid varje ändring. Fyra delar är fyra ställen som kan
  glida isär.
- `scripts/check-legal.mjs` låser ett sextiotal exakta strängar per språkdel.
  Fyra språk fördubblar den ytan.
- Vid tvist måste en version vara styrande. Fler översättningar gör den frågan
  otydligare, inte tydligare.

Norska och danska besökare länkas till den engelska delen. En klausul om att den
svenska versionen är styrande läggs till i båda filerna, i båda språkdelarna.

`check-legal.mjs` utökas endast med kontrollen att den nya klausulen finns.

## Regressionsskydd för svenskan

`scripts/check-sv-unchanged.mjs` jämför den byggda svenska outputen mot en
incheckad referenshash per URL.

Flöde:

1. Före refaktoreringen: bygg och spara referensen (URL → hash av HTML).
2. Efter varje refaktoreringssteg: bygg och jämför. Skillnad stoppar bygget.
3. När refaktoreringen är klar och outputen bevisat identisk tas referensen
   bort eller uppdateras medvetet.

Detta är verifieringen på att omskrivningen av mallarna till `t`- och
`routes`-uppslagningar inte ändrat en enda svensk sida. Den befintliga svenska
rankingen är det mest värdefulla sajten har och får inte offras för
flerspråkigheten.

Skriptet körs i `npm run check` under refaktoreringsfasen.

## Termordlista

`_data/terms.js` är källan för översättningsarbetet och byggs **före** en enda
sida översätts. Den granskas av användaren separat.

Den täcker golftermer där de nordiska språken skiljer sig och där en rak
översättning från svenskan blir fel:

| sv | nb | da | en |
|---|---|---|---|
| slaggolf | slagspill | slagspil | stroke play |
| matchspel | matchspill | hulspil | match play |
| spelform | spilleform | spilleform | game format |
| bästboll | bestball | bedste bold | best ball |
| poängbogey | poengbogey | pointbogey | Stableford |
| brutto / net | brutto / netto | brutto / netto | gross / net |
| spelhandicap | spillehandicap | spillehandicap | course handicap |
| stroke-index | stroke-index | stroke-index | stroke index |
| slope | slope | slope | slope |
| hål | hull | hul | hole |
| runda | runde | runde | round |
| bana | bane | bane | course |
| insats / pott | innsats / pott | indsats / pulje | stake / pot |

Tabellen ovan är ett utkast. Den slutliga listan tas fram och granskas i våg 2.

Ordlistan används också som underlag för slug-valen. Slugs ska väljas efter vad
folk faktiskt söker på i respektive marknad, inte efter en ordboksöversättning.
Exempel att verifiera: `slaggolf` → `slagspill` (nb) / `slagspil` (da) /
`stroke-play` (en); `matchspel` → `matchspill` / `hulspil` / `match-play`;
`narmast-flaggan` → `naermest-flagget` / `taettest-pa-flaget` /
`closest-to-the-pin`. Egennamn som Nassau, Vegas, Wolf, Skins, Scramble och
Stableford behålls oförändrade i alla språk.

## Sidinventering

27 innehållssidor per språk:

- startsidan (`index.njk`)
- `om`
- `ordlista`
- `spelformer/` (pelarsidan)
- `spelformer/valja-spelform`
- `spelformer/stableford-vs-slaggolf`
- 21 guider i `spelformer/guides/`

Plus `/i/` och 404 per språk. Totalt 81 nya innehållssidor.

Ej översatta: `privacy`, `terms`, `robots.njk`, `sitemap.njk`,
`indexnow-key.njk`.

## Utrullning i vågor

Varje våg är ett eget arbetspaket som deployas för sig.

**Våg 1 — infrastruktur.** Alla nya filer ovan, mallarna omskrivna,
språkväljaren, bannern, `/go`, hreflang, sitemap-alternativ. Inga nya språk
publiceras. `/go` respekterar `publishedLocales` och faller tillbaka på svenska
för språk som ännu inte rullats ut, så en kampanjlänk kan tryckas innan
översättningen är klar utan att leda till en tom katalog.
Acceptanskriterium: `check-sv-unchanged.mjs` visar byte-identisk svensk output.

**Våg 2 — termordlista.** `_data/terms.js` byggs och granskas av användaren.
Slug-valen per språk fastställs här. Inget innehåll översätts före godkännande.

**Våg 3 — engelska.** 27 sidor + `/i/` + 404. Störst marknad och den där tonen
är lättast att verifiera. `/en/` läggs in i sitemap och hreflang när den är
komplett.

**Våg 4 — bokmål.** Samma omfattning, `/no/`.

**Våg 5 — danska.** Samma omfattning, `/dk/`.

Ett språk exponeras i sitemap och hreflang först när dess våg är komplett.
Halvöversatta språk i sitemap ger tunna sidor i indexet och drar ner hela
domänen.

Efter varje språkvåg körs `npm run indexnow` som vanligt, så Bing och Yandex
informeras om de nya sidorna.

## Verifiering

- `check-sv-unchanged.mjs` — svenskans output oförändrad under våg 1
- `npm run check` — befintliga juridikkontroller plus HTML-validering
- `claude-seo:seo-hreflang` — hreflang-taggarna validerade efter varje våg
- Manuell kontroll att språkväljaren länkar till *motsvarande* sida, inte till
  startsidan, från en djup guide i varje språk
- Bannern testad med `navigator.languages` satt till danska på en svensk sida:
  ska visas en gång, sedan aldrig efter att den stängts
- Bannern får inte visas för ett opublicerat språk
- `/go?l=da` landar på `/dk/`, `/go?l=nb` på `/no/`, `/go` utan parametrar
  följer `Accept-Language`
- `/go?c=test` ger utm-parametrar på landningssidan och `ct=test` i
  butikslänken; `/go` utan `c` ger en ren URL utan utm
- `/dk/?utm_campaign=WG%20DK%20-%20Reels%20%F0%9F%8F%8C` ger
  `ct=wg-dk-reels` i butikslänken — saneringen testas med ett verkligt
  Meta-kampanjnamn, inte med en redan ren sträng
- `/go` med okänd `c` omdirigerar ändå, felar inte
- `/go` blockerad i `robots.txt`, och `/dk/?utm_source=x` har `canonical`
  mot `/dk/`
- Butikslänkarna testade per marknad när apputrullningen är klar

## Avgränsningar

- Appens eget språk ligger utanför detta arbete. Apputrullning till fler
  marknader pågår parallellt hos användaren.
- **Ingen Meta-pixel och ingen annan spårningspixel på sajten.** Den skulle
  kräva samtyckesbanner, ändrad CSP och omskriven integritetspolicy, och den
  kan ändå inte se en appinstallation — bara knappklicket innan. För att mäta
  och optimera mot nedladdningar krävs Meta-SDK i appen plus RevenueCats
  Meta Ads-integration, och sådana kampanjer länkar direkt till butiken utan
  att passera sajten. Det arbetet hör hemma i appens repo.
  Sajtens roll i annonsmixen är organisk sökning, `/go`-kanalerna och kalla
  målgrupper som behöver övertygas först.
- Ingen valutaomräkning eller prisvisning per marknad; sajten visar inga priser.
- Ingen översättning av `docs/`.
