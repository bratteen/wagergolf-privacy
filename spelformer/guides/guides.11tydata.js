// Katalog-data för alla guide-sidor i spelformer/guides/.
// Sätter layout + collection-tag, defaultdatum + og:type, och beräknar
// permalink + JSON-LD per guide. Per-fil-frontmatter vinner över dessa default.
module.exports = {
  layout: "guide.njk",
  tags: "guides",
  ogType: "article",
  // Guidernas ursprungliga publicering. Override med `published:` i en guide
  // om den skapas senare. `updated:` sätts per guide när innehållet ändras.
  published: "2026-06-14",
  updated: "2026-06-20",
  eleventyComputed: {
    // key är språkoberoende och kopplar ihop översättningarna av samma guide.
    key: (data) => `guide:${data.slug}`,
    permalink: (data) => `${require("../../_data/routes.js").pathFor(data.lang || "sv", "formats", data.slug)}`,
    structuredData: (data) => {
      const routes = require("../../_data/routes.js");
      const { guideGraph } = require("../../lib/structured-data.js");
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
        breadcrumbHome: require("../../lib/i18n.js").stringsFor(lang).breadcrumb.home,
        breadcrumbFormats: require("../../lib/i18n.js").stringsFor(lang).nav.formats,
        formatsUrl: base + routes.pathFor(lang, "formats"),
      });
    },
  },
};
