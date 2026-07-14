# Intresseavvägning: pseudonymiserad delad rundhistorik

Datum: 14 juli 2026  
Personuppgiftsansvarig: Gustaf Bratt, Wager Golf  
Rättslig grund: berättigat intresse enligt GDPR artikel 6.1(f)

## Behandlingen

När en användare raderar sitt konto tas profil, kontaktuppgifter och globala
kontoidentifierare bort. Rundor som användaren delat med andra deltagare kan
behållas med etiketten `Raderad spelare`, ett rundlokalt alias, scorer, events,
resultat/uppgörelse samt fryst HCP och kön. En saltad envägshash per runda kan
användas för att mappa sena offline-uppdateringar till samma alias. Hashen kan
inte länka personen mellan olika rundor.

## Berättigat intresse och ändamål

Wager Golf och de kvarvarande deltagarna har ett intresse av att:

- behålla en korrekt gemensam historik över en runda som flera personer äger
  och har agerat utifrån;
- undvika att scorer, resultat och privata uppgörelser ändras i efterhand när
  en deltagare raderar sitt konto;
- kunna hantera sena, legitima offline-uppdateringar utan att återinföra den
  raderade kontoidentiteten;
- upprätthålla dataintegritet vid backupåterläsning och synk.

## Nödvändighet

Att radera hela den delade rundan skulle också radera andra deltagares data och
kunna ändra deras historik, statistik och uppgörelse. Enbart aggregerade totals
är inte tillräckliga eftersom flera spelformer behöver hålscorer och events för
att kunna förklara det historiska resultatet. Ändamålet kan därför inte nås på
ett rimligt, mindre ingripande sätt än att behålla den minimerade rundkontexten.

## Risker för den registrerade

En person i det ursprungliga golfgänget kan ibland förstå vem `Raderad spelare`
var utifrån datum, bana, resultat, HCP eller kön. Uppgifterna är därför
pseudonymiserade, inte anonyma. Risken är främst att en begränsad historisk
koppling finns kvar för redan berörda runddeltagare.

## Skyddsåtgärder och minimering

- namn, handle, avatar, telefonnummer och globalt konto-ID tas bort;
- aliaset är rundlokalt och kan inte användas för global sökning eller
  vänkoppling;
- nya alias slumpas normalt; äldre rundlokala ID:n kan finnas kvar;
- fryst HCP och kön behålls endast som historisk beräkningskontext;
- den per-runda saltade envägshashen kan inte länka personen mellan rundor;
- åtkomst begränsas till de användare som enligt appens åtkomstregler får se
  rundan;
- anti-echo- och enhetsmarkörer nollas när kontot raderas;
- den registrerade kan invända via kontaktadressen i integritetspolicyn, och
  invändningen bedöms individuellt.

## Slutsats och uppföljning

Det gemensamma intresset av korrekt delad historik väger, med ovanstående
minimering och åtkomstbegränsning, tyngre än den begränsade kvarvarande risken.
Behandlingen får bara fortsätta så länge detta ändamål och dessa skyddsåtgärder
består. Bedömningen ska omprövas vid ändrad rundsynlighet, nya identitetsfält,
ändrad retention eller en relevant invändning från en registrerad.
