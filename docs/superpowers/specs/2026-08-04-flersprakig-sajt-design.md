# Flerspråkig wagergolf.se: bokmål, danska och engelska

Datum: 2026-08-04
Status: godkänd design, ej implementerad

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
språkväljaren, hreflang, sitemap-alternativ. Inga nya språk publiceras.
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
- Butikslänkarna testade per marknad när apputrullningen är klar

## Avgränsningar

- Appens eget språk ligger utanför detta arbete. Apputrullning till fler
  marknader pågår parallellt hos användaren.
- Ingen valutaomräkning eller prisvisning per marknad; sajten visar inga priser.
- Ingen översättning av `docs/`.
