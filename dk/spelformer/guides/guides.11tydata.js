// Katalog-data för alla guide-sidor i spelformer/guides/.
// Sätter layout + collection-tag, defaultdatum + og:type, och beräknar
// permalink + JSON-LD per guide. Per-fil-frontmatter vinner över dessa default.
//
// Kraven på require: den här filen kopieras oförändrad till en guide-katalog
// per språk (t.ex. no/spelformer/guides/guides.11tydata.js), och hamnar då
// på samma djup under repo-roten som originalet — men en framtida
// katalogstruktur kan lägga den djupare. Relativa sökvägar (../../_data/...)
// skulle behöva räknas om för varje kopia och tyst peka fel om det missas.
// #data/ och #lib/ är Nodes subpath-imports (se "imports" i package.json),
// repo-rotsrelativa oavsett filens eget djup, så samma require fungerar
// överallt utan ändring.
const routes = require("#data/routes.js");
const { guideGraph } = require("#lib/structured-data.js");
const { stringsFor } = require("#lib/i18n.js");

module.exports = {
  layout: "guide.njk",
  tags: "guides",
  ogType: "article",
  // Guidernas ursprungliga publicering. Override med `published:` i en guide
  // om den skapas senare. `updated:` sätts per guide när innehållet ändras.
  published: "2026-06-14",
  updated: "2026-09-02",
  eleventyComputed: {
    // key är språkoberoende och kopplar ihop översättningarna av samma guide.
    // data.key vinner om den finns: specen översätter sluggen
    // (slaggolf -> slagspill/slagspil/stroke-play), så en svensk `slug` duger
    // inte som default för en översatt guide. Den sätter därför `key`
    // explicit i sin frontmatter till den SVENSKA sluggen
    // (t.ex. `key: guide:slaggolf` i en norsk `slagspill.md`), så att
    // hreflang, språkväljaren, bannern och sitemap-alternativen fortfarande
    // grupperar ihop översättningarna. Utan detta skriver eleventyComputed
    // ovillkorligt över frontmatter-värdet, och varje översatt guide får en
    // egen, unik key som aldrig matchar originalet.
    // Defaulten (`guide:${data.slug}`) gäller bara svenska guider, som inte
    // sätter key själva.
    key: (data) => data.key || `guide:${data.slug}`,
    permalink: (data) => routes.pathFor(data.lang || "sv", "formats", data.slug),
    structuredData: (data) => {
      const lang = data.lang || "sv";
      const base = data.site.url;
      const image = data.image
        ? (String(data.image).startsWith("http") ? data.image : base + data.image)
        : data.site.ogImage;
      return guideGraph({
        base,
        url: base + routes.pathFor(lang, "formats", data.slug),
        lang,
        format: data.format,
        h1: data.h1,
        title: data.title,
        description: data.description,
        published: data.published || "2026-06-14",
        updated: data.updated,
        image,
        faq: data.faq,
        // stringsFor och inte data.t: ordningen mellan global och katalognivås
        // eleventyComputed är inte garanterad, så data.t kan vara odefinierad här.
        breadcrumbHome: stringsFor(lang).breadcrumb.home,
        breadcrumbFormats: stringsFor(lang).nav.formats,
        formatsUrl: base + routes.pathFor(lang, "formats"),
      });
    },
  },
};
