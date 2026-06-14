# wagergolf.se för användarförvärv, design

Datum: 2026-06-14
Repo: `wagergolf-privacy` (serverar hela wagergolf.se, inte bara privacy)
Mål: göra landningssidan till en kanal som drar in användare, via SEO och konvertering.

## Bakgrund

wagergolf.se är idag en enda handskriven `index.html` med all CSS inline,
plus `/privacy/` och `/terms/`. Snyggt byggd (golfklubb-estetik: skogsgrön,
mässing, cream, Playfair Display + IBM Plex Mono) men gör lite för att bli
*hittad* eller för att maximera nedladdningar. Deploy sker manuellt via
`wrangler pages deploy .` (ingen git-koppling till Cloudflare).

## Låsta beslut (från brainstorm)

- **Fokus**: SEO (folk hittar sidan) + konvertering (fler laddar ner). Inte Android.
- **Plattform**: iPhone-only. Inga Google Play-knappar, ingen Android-väntelista.
- **Inget falskt socialt bevis**: appen har inga riktiga betyg att visa än, så
  inga stjärnor/recensioner och inget `aggregateRating` i schema.
- **Bygg-sätt**: Eleventy (11ty) statisk site-generator.
- **Konverterings-asset**: en kort skärminspelning av appen (användaren spelar in).
- **Mätning**: Cloudflare Web Analytics (cookielöst, ingen banner).
- **Innehåll**: Claude draftar guide-texterna med marketing-skills (copywriting,
  content-strategy, programmatic-seo, schema-markup, seo) i användarens ton
  (svenska, konkret, inga emojis, inga em-dashes). Användaren granskar.

## Utanför scope

- Android / Google Play.
- Falska eller platshållar-recensioner.
- Bredare blogg utöver spelform-guiderna (pelarsidan täcker det breda behovet nu).
- Per-guide unika OG-bilder (en site-bred märkes-OG-bild först, per-guide senare).
- Att byta deploy till git-integrerad Cloudflare Pages-build (behåller manuell wrangler).

## Arkitektur

11ty bygger om repot utan att röra det som redan fungerar.

```
wagergolf-privacy/
  .eleventy.js              # config: input ".", output "_site", passthrough
  package.json              # @11ty/eleventy som devDependency
  _includes/
    base.njk                # delad <head>, header, footer, hela <style>-blocket
    guide.njk               # layout för en spelform-guide (extends base)
    hub.njk                 # layout för pelarsidan (extends base)
  _data/
    site.js                 # global site-data (url, namn, App Store-länk, OG)
  index.njk                 # startsidan (nuvarande index.html, chrome utlyft till base)
  spelformer/
    index.njk               # pelarsida /spelformer/
    guides/                 # en .md per format (frontmatter + brödtext)
      stableford.md
      nassau.md
      ...
  robots.njk                # genererar robots.txt
  sitemap.njk               # genererar sitemap.xml
  privacy/index.html        # OFÖRÄNDRAD, passthrough-kopierad
  terms/index.html          # OFÖRÄNDRAD, passthrough-kopierad
  assets/                   # OFÖRÄNDRAD, passthrough-kopierad (+ ny OG-bild, video, fonter)
```

- **Passthrough**: `privacy/`, `terms/`, `assets/` kopieras byte-identiskt till `_site/`.
  Privacy-uppdateringsrutinen (editera `privacy/index.html` + bumpa version) är intakt.
- **Startsidan blir visuellt identisk**: chrome (header/footer/CSS/head-meta) lyfts
  till `base.njk`, men renderad HTML matchar dagens utseende.
- **Deploy**: `npx @11ty/eleventy && npx wrangler pages deploy _site`.
  CLAUDE.md/privacy-checklistan uppdateras med det nya kommandot.

## On-page SEO (alla sidor)

- Per-sida `<title>`, `meta description`, `<link rel="canonical">`, Open Graph +
  Twitter Card, drivet av frontmatter via `base.njk`.
- **OG-bild 1200×630** (märkesbild) ersätter dagens og:image som pekar på liten logo.
- **JSON-LD**:
  - Startsidan: `Organization` + `SoftwareApplication` (operatingSystem iOS,
    App Store-URL, pris gratis). Inget `aggregateRating`.
  - Guide-sidor: `Article` + `BreadcrumbList` + `FAQPage` (när guiden har FAQ).
  - Pelarsidan: `BreadcrumbList` + `CollectionPage`.
- **`sitemap.xml`** auto-genererad från alla 11ty-sidor.
- **`robots.txt`** allow-all + pekar på sitemap.
- **Självhostade fonter** (Playfair Display + IBM Plex Mono) istället för Google
  Fonts-CDN: snabbare LCP, ingen tredjepartskoppling. `font-display: swap`.
- Semantiska rubriker, intern korslänkning (guide ↔ guide ↔ pelarsida ↔ start ↔ App Store).

## Konvertering på startsidan

- **Demo-video-sektion "Se appen i aktion"** placerad direkt under hero (inte i
  hero, för att inte sänka hero-LCP). `<video autoplay muted loop playsinline
  preload="metadata" poster=...>` med MP4 + WebM-källa. Användaren spelar in;
  spec:en levererar exakta ffmpeg-kommandon för komprimering till liten webb-MP4/WebM
  + poster-extrahering.
- **"Så funkar det" i 3 steg**: Lägg till gänget → Scora rundan → Gör upp med Swish.
  Kort band som tar bort tveksamhet före nedladdning.
- Befintliga CTA:er, stats, feature-sektioner och spelform-grid behålls.
  Spelform-grid:ens listpunkter länkas till respektive guide när de finns.

## Innehållsnav (SEO-motorn)

### Pelarsida `/spelformer/`
Listar alla guider grupperade som dagens grid (Klassiker / Hålspel / Lag / Sidobet).
Riktar breda termer (golfspel om pengar, golfvad, golfspel regler). Egen intro-text
+ korta kort per format som länkar till guiderna.

### Guide per format `/spelformer/<slug>/`
Slugs (21 totalt):
- Klassiker: `skins`, `matchspel`, `nassau`, `stableford`, `quota`, `slaggolf`
- Hålspel: `wolf`, `bingo-bango-bongo`, `split-sixes`, `klubbroulette`
- Lag: `scramble`, `foursome`, `greensome`, `bastboll`, `vegas`
- Sidobet: `birdiepott`, `snake`, `sandie`, `narmast-flaggan`, `langst-drive`, `golfpoker`

Varje guide är genuint användbar fristående (inte tunt SEO-bete):
- H1 + intro (vad formatet är, för vilka, antal spelare).
- "Så spelar du" (regler steg för steg).
- "Så räknas det" (den riktiga poäng-/avräkningslogiken, t.ex. Wolf-units 1/2/3,
  Stableford-poäng, Nassau tre segment, pairwise för Split Sixes/BBB/Birdies).
  Källa: appens format-libs + CLAUDE.md.
- "Variationer" där det finns (t.ex. Greensome Irish, Birdies pott vs per-birdie).
- **FAQ** (3-5 frågor) med `FAQPage`-schema.
- CTA-block: "Slipp räkna för hand, Wager Golf gör det åt dig" → App Store.
- Per-guide title/meta/canonical/OG, `Article` + `BreadcrumbList`-schema,
  korslänkning till relaterade guider + pelarsida.

Guide-data ligger i frontmatter (title, metaDescription, primaryKeyword, category,
players, faq[]) + brödtext i markdown. Mallen `guide.njk` renderar enhetligt.

### Innehållsproduktion
Claude draftar med marketing-skills. Första batchen prioriteras efter faktisk svensk
söktrafik (valideras före skrivning). Sannolika kandidater: `stableford`, `nassau`,
`skins`, `wolf`, `matchspel`, `scramble`, `foursome`, `greensome`, `bastboll`.
Resterande guider fylls på efterhand med samma mall.

## Mätning

Cloudflare Web Analytics-snippet i `base.njk` (alla sidor). Cookielöst, ingen PII,
ingen cookie-banner. Minimal privacy-policy-påverkan (noteras, ev. en rad i policyn).

## Faser

1. **11ty-skelett + startsidan migrerad** (visuellt identisk) + on-page SEO-grund
   (title/meta/canonical/OG/JSON-LD) + `sitemap.xml` + `robots.txt` + självhostade
   fonter + Cloudflare Web Analytics. Verifierbart: sidan ser likadan ut, bygget
   funkar, privacy/terms orörda.
2. **Konverteringsband**: demo-video-sektion (med ffmpeg-instruktioner) +
   "så funkar det"-steg.
3. **Innehållsnav**: pelarsida + `guide.njk`-mall + första batchen validerade
   guider. Korslänkning + spelform-grid på startsidan länkad till guiderna.

## Framgångskriterier

- Bygget producerar `_site/` med startsida + pelarsida + guider, och privacy/terms/assets
  oförändrade.
- Lighthouse SEO + Best Practices ~100 på start- och guide-sidor.
- Giltig strukturerad data (Rich Results-test passerar för SoftwareApplication + FAQ).
- `sitemap.xml` och `robots.txt` serveras korrekt.
- Demo-video laddar snabbt (liten MP4/WebM, poster, ingen LCP-regression).
- Cloudflare Web Analytics rapporterar besök + utgående App Store-klick.
- Guiderna är fristående användbara och korslänkade, redo att indexeras.

## Öppna punkter

- Exakt OG-bild-design (märke + tagline) tas fram i implementationen.
- Sökvolym-validering avgör exakt vilka guider som ingår i batch 1.
- Behov av rad i privacy-policyn för Cloudflare Web Analytics bekräftas.
