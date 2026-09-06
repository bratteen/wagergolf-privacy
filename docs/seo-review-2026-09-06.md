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

## Kvar i externa tjänster

1. `https://www.wagergolf.se/` svarade 200 vid granskningen. Sidorna har redan
   canonical till `https://wagergolf.se/`, men en permanent domänomdirigering
   skulle göra adressvalet tydligare. Konfigurera en Cloudflare-regel från
   `www.wagergolf.se` till `https://wagergolf.se`, status 301, med bibehållen
   sökväg och query-sträng. Den anslutna publiceringsbehörigheten ger inte
   skrivåtkomst till dessa domänregler. `_redirects` stöder inte domänregler.
2. Kontrollera indexering och skicka in `https://wagergolf.se/sitemap.xml` i
   Google Search Console. Search Console-data var inte tillgängliga i denna
   genomgång, så ranking, sökvolymer och faktiskt indexerade sidor är inte mätta.
3. Bedöm verkliga laddningstider och Core Web Vitals i Search Console eller
   PageSpeed Insights när fältdata finns. Inget Lighthouse-poängtal har påståtts.

## Källor

- [Google: SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Google: språkversioner](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [Google: robots-metadata och data-nosnippet](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)
- [Cloudflare: www till huvuddomänen](https://developers.cloudflare.com/pages/how-to/www-redirect/)
- [Cloudflare: redirect-regler och begränsningar](https://developers.cloudflare.com/pages/configuration/redirects/)
- [Central New York PGA: Quota](https://cny.pga.com/wp-content/uploads/sites/4/2020/04/Pro-Am-Quota.pdf)
- [Svenska Golfförbundet: spel- och tävlingsformer](https://golf.se/spela-golf/spel--och-tavlingsformer)
