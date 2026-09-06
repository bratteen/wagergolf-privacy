# Från golfguide till appnedladdning — 6 september 2026

## Ändringen

Alla 231 spelformsguider på elva språk har nu ett appblock tidigt i artikeln,
efter de två första avsnitten. Stableford-blocket kommer efter hela
poängtabellen och Greensome-blocket efter spelinstruktionerna. Reglerna går
fortfarande att läsa före erbjudandet.

Blocket visar en lokaliserad skärmbild, konkret appnytta och butiksknappar.
Stableford och Greensome har egna texter; övriga guider beskriver gruppens
scorekort och ställning. Det framgår att en person kan sköta gruppens scorekort.
Den befintliga bilden visar Skins och märks tydligt som ett sådant exempel.
Äldre kopior av samma bild flyttas till appblocket, medan andra bilder behålls.

På dator går navigeringens nedladdningsknapp direkt till appblocket. På mobil
går den fortsatt till rätt butik. Butiksknapparna finns också kvar efter FAQ.

## Mätning

Vanliga butiksklick från guider märks med kampanjen `guides`:

- App Store: befintlig provider-token tillsammans med `ct=guides`.
- Google Play: `utm_campaign=guides` i butikslänkens befintliga referrer.
- Annons-/QR-kampanjer via `c` eller `utm_campaign` har företräde.
- Startsidor och annan webbtrafik behåller befintlig märkning per marknad.
- Kampanj och explicit land följer med om nedladdningsadressen först behöver
  gå tillbaka till en startsida.

Alla guider delar en kampanj för att små volymer inte ska splittras per artikel.
Den identifierar nedladdningsvägen från en guide, inte enbart organisk Google-
trafik. Ingen ny webbanalys, cookie eller lagring i webbläsaren har aktiverats.

Följ kampanjen `guides` i App Store Connect och butikens tillgängliga
förvärvsrapporter. Jämför webbtrafik, butiksbesök och första nedladdningar med
samma datumintervall och land. Ett knappklick är inte en installation.
Apples rapporter har minimitrösklar för små kampanjer; en tom rapport bevisar
inte noll nedladdningar. Faktiska resultat kräver tillgång till butikernas
statistik och har inte kunnat verifieras eftersom App Store Connect kräver
inloggning i den tillgängliga sessionen.

## Kommande marknader

USA och Storbritannien är enligt ägaren nära lansering. Sajten öppnar deras
nedladdningsknappar först när respektive plattforms lansering är bekräftad och
marknadslistorna uppdaterats. Befintliga 13 marknader är oförändrade.

## Verifiering

Alla 275 tester passerade, liksom full HTML-validering och juridikkontroller.
Byggkontrollerna omfattar alla språk, SEO och interna länkar.
Nya kontroller täcker appblockets placering, lokaliserade bilder,
kampanjprioritet, plattformsval samt fortsatt korrekt hantering av stängda och
ogiltiga marknader. Engelska, danska och tyska appblock granskades i
webbläsaren, inklusive 390 och 320 px breda mobilvyer. Tyskans radbrytning
förbättrades efter den smalaste kontrollen. Datornav och befintliga
kampanjparametrar kontrollerades också i den renderade sidan.

## Källa

- [Apple: kampanjlänkar och mätning](https://developer.apple.com/help/app-store-connect-analytics/acquisition/campaign-links/)
