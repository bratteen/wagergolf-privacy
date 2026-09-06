# USA och Storbritannien: kända men stängda webbmarknader

Datum: 2026-09-06. Status: lokalt förberett; inte pushat eller deployat.
Utgår från `b887932` och bevarar arbetet i
[app-download-improvements-2026-09-06.md](app-download-improvements-2026-09-06.md).

## Beteende och avgränsning

`US` och `GB` finns i en separat `UPCOMING_MARKET_CODES`-lista samt som kända
engelska marknader i både `_data/site.js` och `functions/ladda-ner.js`.
`TARGET_MARKET_CODES`, båda plattformarnas publika listor, version 1.7.1,
3 028 banor och alla publika 13-landsclaims är oförändrade.

- `/ladda-ner?m=US&p=ios` går till `/en/?m=US#main-content`, inte App Store.
  Samma gäller GB och Android. Kampanjparametrar bevaras.
- Även ett US/GB-land från Workers GeoIP eller dess header bevaras som `m`
  på den engelska retursidan, så nästa klick inte tappar den stängda marknaden.
- `/market-status?m=GB` ger `market: GB` men `public`, `ios` och `android`
  är alla false. US fungerar likadant. En ogiltig kod är fortfarande fail-closed.
- `/go` och `/i/<token>` använder English som landfallback för US/GB.
  Ett uttryckligt språkval eller ett känt föredraget webbläsarspråk har fortsatt
  företräde. Inbjudnings-URL och säkerhetsheaders bevaras.
- Irlands English-default är oförändrad: EUR-inriktad befintlig sida,
  `webb-ie` och irländska butikslänkar. Språkval öppnar inte USA eller UK.
- `marketUrls` genereras endast för de befintliga 13 länderna. US/GB får
  alltså inga nya publika storefront-länkobjekt i sajtens data ännu.

`functions/market-status.js`, `assets/js/release-status.js`, butiksmallar och
översättningar behövde ingen produktionsändring. De använder redan den delade
landsgrinden och visar befintligt engelskt “Soon”/otillgänglig-status när
plattformarna är stängda. Ett nytt integrationstest kör verkliga US/GB-svar
genom klientkoden och kontrollerar iPhone, Android och dator.

Ingen ny cookie, analys, session replay, prenumerationshantering eller
persondatabehandling har införts. Privacy och terms har inte redigerats.

## Promotion är ett separat, framtida steg

Att lägga ett land i `UPCOMING_MARKET_CODES` öppnar det inte automatiskt när
appen släpps. Före framtida promotion krävs bekräftad nedladdningsbar kompatibel
build på respektive plattform, färsk serverstatus, korrekta priser och den
gemensamma app-releaseplanens kompatibilitetsgrindar. UK:s äldre GBP-läsarrisk
kan inte lösas av en webbändring.

När dessa villkor faktiskt är uppfyllda, gör en separat granskad ändring:

1. Flytta landet från UPCOMING till TARGET i båda kopiorna.
2. Lägg det i **endast de plattformars** PUBLIC-listor där den aktuella
   versionen verkligen går att installera. Bevara alla redan öppna länder.
3. Verifiera `marketUrls`, kampanjnamn och explicit/GeoIP-routning. Behåll
   Irland som English-default; använd land i stället för språk som releasebevis.
4. Uppdatera webbens versions-/kursclaims och eventuella rättsliga texter i
   samma kontrollerade release, först efter faktagranskning och godkännande.
5. Anpassa kommande-marknadstesterna till den verifierade fasen, kör hela
   `npm run check`, och kontrollera riktiga butikssidor efter separat deploy.

Listorna är avsiktligt duplicerade eftersom Cloudflare Functions och Eleventy
byggs separat. Tester jämför alla kända marknadsfält och båda UPCOMING-listorna.

## Separat mänsklig UK-kontroll före lansering

Detta är en lista för ägare/kvalificerad rådgivare, inte ett juridiskt
godkännande eller ett påstående att alla punkter medför en viss skyldighet.
Ingen juridisk eller automatisk åldersklassificering av appen görs här.

1. **UK GDPR och kontaktvägar.** Bedöm UK GDPR:s tillämplighet när den svenska
   verksamheten erbjuder tjänsten i UK, inklusive om en brittisk representant
   behövs eller om ett snävt undantag faktiskt gäller. Policyns rättighetsdel
   hänvisar idag till EU GDPR, IMY och EDPB. Kontrollera hur UK-rättigheter,
   ICO-klagomål och eventuell representant ska anges. ICO beskriver både
   huvudregeln och undantag för representanter.
   [ICO: UK representative](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/international-transfers/receiving-personal-information-from-the-eea/),
   [ICO: Individual rights](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/),
   [ICO: complaints](https://ico.org.uk/make-a-complaint/).

2. **Dataflöden och överföringar.** Kartlägg faktisk data till Supabase,
   PostHog, AppsFlyer, Meta, Sentry, Apple/Google och övriga leverantörer.
   Kontrollera vilka UK-överföringsregler som gäller, adekvans eller
   erforderliga skydd, och vid behov UK Addendum/IDTA. Anta inte att enbart
   text om EU SCC automatiskt täcker alla UK-flöden.
   [ICO: International transfers](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/international-transfers/),
   [ICO: IDTA and Addendum](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/international-transfers/appropriate-safeguards/what-are-standard-data-protection-clauses-the-uk-idta-and-the-addendum/).

3. **Analys och mätning.** Stäm av faktisk SDK-konfiguration och enhetslagring
   mot information, rättslig grund och eventuellt samtycke enligt tillämpliga
   UK GDPR/PECR-regler. Webbstatistik och session replay förblir avstängda i
   detta arbete. Inför inte mätning bara för att UK läggs i landmodellen.
   [ICO: Storage and access technologies](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/).

4. **17-åriga användare.** Befintliga terms/privacy anger 17+. ICO:s Children's
   Code använder under 18 och kan omfatta tjänster som sannolikt används av
   barn även när de inte specifikt riktar sig till barn. Bedöm målgrupp,
   faktisk åtkomst, profilering och standardinställningar. Byt inte åldersgräns
   eller gör ett undantagslöfte automatiskt.
   [ICO: Services covered by the Children's Code](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/services-covered-by-this-code/).

5. **Konsumentvillkor och Pro.** Granska UK-specifik förhandsinformation,
   auto-förnyelse, uppsägning, återbetalning/ångerrätt och lagval mot faktiskt
   StoreKit/Play-upplägg. Terms bevarar redan tvingande rättigheter men det är
   inte ensamt ett compliancebevis. Kontrollera reglernas faktiska
   ikraftträdande vid lansering: den lästa regeringsresponsen anger planerad
   start våren 2027 för den nya abonnemangsregimen, inte att allt redan gäller
   i september 2026. Inga nya trial- eller prisutfästelser har gjorts här.
   [UK government: Subscription contracts response](https://www.gov.uk/government/consultations/consultation-on-the-implementation-of-the-new-subscription-contracts-regime/outcome/government-response-to-consultation-on-the-implementation-of-the-new-subscription-contracts-regime-web-accessible-version).

### Konkreta faktatexter att stämma av separat

- `privacy/index.html:1067` och `terms/index.html:378` beskriver Google Sign-In
  som Android-only. Nästa iOS-version har även Google-login. Motsvarande
  svenska avsnitt behöver granskas vid en separat policy-/termsuppdatering.
- `privacy/index.html:489`, `:525` och `:1212` beskriver iOS utan AppsFlyer SDK.
  Detta stämmer med granskad 1.8-källkonfiguration: iOS-autolinking exkluderar
  paketet och iOS kör den egna Apple/SKAdNetwork-modulen. Ingen sådan
  avvikelse har konstaterats. Slutlig releaseartifact ska ändå kontrolleras;
  enbart `EXPO_PUBLIC_APPSFLYER_ENABLED=1` bevisar inte iOS SDK-användning.
- Country-listor, gamla kursantal och eventuell skillnad i GBP/USD-flödet ska
  stämmas av när USA/UK verkligen öppnas. Att en kommande webbroute finns är
  inte skäl att ändra dagens publicerade 1.7.1-claims.

Ett separat, opublicerat SV/EN-förslag finns i
[1.8-legal-copy-draft-2026-09-06.md](1.8-legal-copy-draft-2026-09-06.md).
Det innehåller ersättningstext för inloggning och villkorligt 15-landsomfång,
verifierade attributionkällor och avgränsade UK-frågor för mänsklig granskning.

## Verifiering

`npm run check` passerar: Eleventy-build, 284 tester, befintlig legal-page-check
och full HTML-validering. `git diff --check` är ren. “Legal-page-check” är
regressionstest av sidornas text/struktur, inte en juridisk compliancegranskning.

Följande jämfördes med den orörda originalarbetskopian och var identiskt:
`storeUrls`, `marketUrls`, `downloadUrls`, `localeRelease`; publicerade
privacy/terms-källor; tidigare nedladdningsdokument; färdig engelsk startsida
och Skins-guide. Ny visuell layout har inte införts eller påståtts granskad.
