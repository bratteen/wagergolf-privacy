const routes = require("#data/routes.js");
const { guideGraph } = require("#lib/structured-data.js");
const { stringsFor } = require("#lib/i18n.js");

module.exports = {
  layout: "guide.njk",
  tags: "guides",
  ogType: "article",
  published: "2026-09-02",
  updated: "2026-09-02",
  eleventyComputed: {
    // A chave conserva o identificador sueco comum a todas as traduções.
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
        published: data.published || "2026-09-02",
        updated: data.updated,
        image,
        faq: data.faq,
        breadcrumbHome: stringsFor(lang).breadcrumb.home,
        breadcrumbFormats: stringsFor(lang).nav.formats,
        formatsUrl: base + routes.pathFor(lang, "formats"),
      });
    },
  },
};
