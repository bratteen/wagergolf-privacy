# SEO-genomgång 6 september 2026

Genomgången utgår från den publicerade versionens källa, `2d0da5d`,
med elva språk och 299 indexerbara sidor. Den äldre lokala `main`-grenen
bevarades; ändringarna gjordes på `codex/seo-site-improvements`.

## Åtgärdat

- Svenska och engelska startsidan beskriver tydligare golfappen, scorekortet
  och de spelformer besökare söker efter i titel, beskrivning och inledning.
- Artiklar hämtar nu uppdateringsdatum, rubrik, beskrivning och aktuell bild
  från sidans data. Tidigare visade flera artiklar gamla datum och en äldre
  bild i JSON-LD trots uppdaterad synlig text och sidkarta.
- Delningsmetadata anger sajtnamn, språk, alternativa språk, bildmått och
  alternativtext. Indexerbara innehållssidor tillåter stora bildförhandsvisningar.
- Tillfälliga landsspecifika tillgänglighetsmeddelanden har `data-nosnippet`
  så att de inte används som sökutdrag. Landskontrollen fungerar som tidigare.
- Breda tabeller kan rullas inom artikeln och nås med tangentbord. Tidigare
  klipptes högerspalten i Stableford-jämförelsen på en 390 px bred skärm.
  Navigationsstigen kan också radbrytas mellan länkar på små skärmar.
- Quota förklaras konsekvent som poäng mot ett individuellt mål på alla
  elva sidorna för val av spelform, i stället för handicapslag per hål.
- Svensk slaggolf skiljs från vanlig slagtävling enligt Svenska Golfförbundet.

## Verifiering

- `npm run check` omfattar bygget, regressionstester, juridikkontroller och
  HTML-validering av hela sajten.
- Den byggda sajten har 321 HTML-sidor, varav 299 är indexerbara och finns
  exakt en gång i sidkartan. Alla 297 innehållssidor har ömsesidiga
  språkversioner; de två juridiksidorna är fristående.
- Kontroller av interna sidlänkar, ankare och lokala resurser ingår nu
  i testsviten, liksom en huvudrubrik och beskrivning per indexerbar sida.
- Live svarar HTTP-versionen med 301 till HTTPS. En saknad sida ger riktig 404.
- Lokala webbläsarkontroller omfattade svenska och engelska startsidan samt
  jämförelserna på svenska, engelska och tyska vid 320, 390 och 1280 px.
  Tabellregionerna behöll fokus och rullade 40 px vid högerpil. Den tyska
  navigationsstigens radbrytning korrigerades efter denna kontroll.

## Google Search Console — kontrollerat 6 september 2026

Domänegendomen `sc-domain:wagergolf.se` granskades i den inloggade tjänsten.

| Kontroll | Resultat |
| --- | --- |
| Sidindexering, rapport uppdaterad 28 augusti | 107 indexerade och 14 ej indexerade sidor. Rapporten är äldre än dagens publicering och är inte en aktuell inventering av alla 299 sidkarteadresser. |
| Sidkarta | Befintlig sidkarta hade status Success, men var senast läst 24 juni och visade endast 29 upptäckta sidor. Samma adress skickades in igen 6 september; Google bekräftade mottagandet. Ny inläsning av de 299 adresserna inväntas. |
| Omdirigeringsfel | 9 gamla fel, senast genomsökta 28 juli. Samtliga adresser fungerar nu. Googles validering startades 6 september och är ännu inte slutförd. |
| Blockerade av robots.txt | 4 avsiktligt blockerade nedladdningsadresser: `/ladda-ner` samt varianterna `?l=nb`, `?l=da` och `?l=en`. Ingen ändring behövs. |
| Sida med omdirigering | `http://wagergolf.se/` leder korrekt till HTTPS och ska inte indexeras separat. |
| HTTPS, rapport uppdaterad 6 september | 134 HTTPS-adresser, 0 adresser utan HTTPS och inga rapporterade problem under de senaste 90 dagarna. |
| Navigationsstigar, rapport uppdaterad 5 september | 112 giltiga objekt och 0 ogiltiga. |
| Säkerhetsproblem och manuella åtgärder | Inga problem eller manuella åtgärder rapporterade. |
| Core Web Vitals, rapport uppdaterad 5 september | För lite användningsdata under de senaste 90 dagarna för både mobil och dator. Detta är inget godkänt eller underkänt prestandaresultat. |

Svenska startsidan och `/en/` är redan indexerade. Google har valt respektive
korrekt canonical-adress. Senaste registrerade genomsökning var 3 september
för svenska startsidan och 4 september för den engelska. Båda hade tillåten
genomsökning och indexering samt lyckad hämtning. Den engelska sidans äldre
indexeringspost visade även ett tillfälligt bearbetningsfel under Sitemaps;
det hindrade inte sidans indexering. Sidkartan är nu inskickad på nytt.

Googles direkttester den 6 september bekräftade att båda startsidorna är
tillgängliga och kan indexeras. Ny indexering begärdes för båda och Google
bekräftade att adresserna lagts i kön för genomsökning. Begäran innebär inte
att dagens ändringar redan är införda i sökresultaten.

De nio tidigare omdirigeringsfelen gäller adresser utan avslutande snedstreck:
`/ordlista` och `/spelformer/` följt av `foursome`, `skins`, `slaggolf`,
`matchspel`, `bastboll`, `stableford`, `greensome` eller `scramble`.
Alla gav en enda 308-omdirigering till motsvarande adress med snedstreck,
sedan HTTP 200, med korrekt canonical och utan indexeringsblockering.
Kontrollen gjordes med både vanlig webbläsaridentitet och Googlebot-identitet.

## Kvar i externa tjänster

1. `https://www.wagergolf.se/` svarade 200 vid granskningen. Sidorna har redan
   canonical till `https://wagergolf.se/`, men en permanent domänomdirigering
   skulle göra adressvalet tydligare. Konfigurera en Cloudflare-regel från
   `www.wagergolf.se` till `https://wagergolf.se`, status 301, med bibehållen
   sökväg och query-sträng. Den anslutna publiceringsbehörigheten ger inte
   skrivåtkomst till dessa domänregler. `_redirects` stöder inte domänregler.
2. Invänta Googles nya inläsning av sidkartan och validering av de nio äldre
   omdirigeringsfelen. Kontrollera därefter hur indexeringen utvecklas.
   Alla sidkarteadresser behöver inte bli indexerade; Google gör det urvalet.
3. Bedöm Core Web Vitals när tillräckliga fältdata finns. Inget
   Lighthouse-poängtal har påståtts.

## Källor

- [Google: SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Google: språkversioner](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [Google: robots-metadata och data-nosnippet](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)
- [Google: sidindexeringsrapporten](https://support.google.com/webmasters/answer/7440203?hl=en)
- [Google: sidkarterapporten](https://support.google.com/webmasters/answer/7451001?hl=en)
- [Google: URL-granskning och direkttest](https://support.google.com/webmasters/answer/9012289?hl=en)
- [Google: begära ny genomsökning](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl)
- [Cloudflare: www till huvuddomänen](https://developers.cloudflare.com/pages/how-to/www-redirect/)
- [Cloudflare: redirect-regler och begränsningar](https://developers.cloudflare.com/pages/configuration/redirects/)
- [Central New York PGA: Quota](https://cny.pga.com/wp-content/uploads/sites/4/2020/04/Pro-Am-Quota.pdf)
- [Svenska Golfförbundet: spel- och tävlingsformer](https://golf.se/spela-golf/spel--och-tavlingsformer)
