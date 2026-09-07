# Återställning av Umami

Den 7 september rapporterades att statistiken saknade data efter 1 september.
Läsning via `ssh brattserver` bekräftade 4 222 sparade events och senaste event
2026-09-01 08:09:26 UTC (10:09 svensk tid). Webbplatsen var inte återställd eller
borttagen i Umami. Både `umami` (3.2.0) och `umami-db` var igång utan omstarter
sedan deras start 2 september. Inga databasskrivningar eller containerändringar
behövdes.

Commit `48cdb19` från 2 september hade tömt sajtens Umami-konfiguration och
tagit bort leverantören från sajtens CSP. Den tidigare historiken finns kvar;
besök som inte samlades in under avbrottet kan inte återskapas ur Umami.

## Återställningen

- Samma Umami-server och website-id används för de 297 publika marknadssidorna.
- Lokal guard installerar filtret innan leverantörens script får laddas.
  Utan fungerande guard sker ingen insamling.
- Bara statisk sidtitel/sökväg/språk och kända nedladdningshändelser med känd
  placering skickas. Queries, fragment, identitetsfält och interna referrers
  rensas. Externa referrers begränsas till origin.
- Inbjudningar, juridiksidor och 404 saknar mätkod. DNT/GPC stoppar mätningen.
  Sessionsinspelning och Cloudflare-beacon återaktiveras inte.
- Information om behandlingen visas i sidfoten på alla elva språk, separat
  från appens befintliga integritetspolicy.
- Egen klicklyssnare ersätter Umamis automatiska navigeringshantering, så
  statistikserverns svarstid inte kan fördröja nedladdningsknappen.

Första publiceringen (`6d1fc30`, `abd369c4.wagergolf.pages.dev`) följdes av ett
riktigt webbläsarbesök. Databasen registrerade nya sidvisningar den 7 september;
detta verifierades genom en summerande läsfråga, utan att exponera besöksdata.

## Kontroller

Automatiska tester täcker både skyddsfiltret och uteblivna/långsamma nätverkssvar.
Den riktiga Umami-trackern har också körts med guarden i en isolerad VM där
nätverksanrop fångas, för att kontrollera kompatibilitet och rensade payloads.
Desktop- och mobilvisning av sidfotens information har granskats visuellt.
Databasens befintliga historik och serverinställningar har lämnats orörda.
