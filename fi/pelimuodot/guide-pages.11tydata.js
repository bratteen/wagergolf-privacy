const routes = require("#data/routes.js");
const { guideGraph } = require("#lib/structured-data.js");
const { stringsFor } = require("#lib/i18n.js");

module.exports = {
  layout: "guide.njk",
  tags: "guides",
  ogType: "article",
  lang: "fi",
  published: "2026-08-13",
  updated: "2026-08-13",
  pagination: {
    data: "fiGuides",
    size: 1,
    alias: "guide",
    addAllPagesToCollections: true,
  },
  eleventyComputed: {
    key: (data) => `guide:${data.guide.key}`,
    slug: (data) => data.guide.slug,
    format: (data) => data.guide.format,
    category: (data) => data.guide.category,
    players: (data) => data.guide.players,
    order: (data) => data.guide.order,
    title: (data) => data.guide.title,
    description: (data) => data.guide.description,
    h1: (data) => data.guide.h1,
    lede: (data) => data.guide.lede,
    faq: (data) => data.guide.faq,
    related: (data) => data.guide.related,
    permalink: (data) => routes.pathFor("fi", "formats", data.guide.slug),
    structuredData: (data) => guideGraph({
      base: data.site.url,
      url: data.site.url + routes.pathFor("fi", "formats", data.guide.slug),
      lang: "fi",
      format: data.guide.format,
      h1: data.guide.h1,
      title: data.guide.title,
      description: data.guide.description,
      published: "2026-08-13",
      updated: "2026-08-13",
      image: data.site.ogImage,
      faq: data.guide.faq,
      breadcrumbHome: stringsFor("fi").breadcrumb.home,
      breadcrumbFormats: stringsFor("fi").nav.formats,
      formatsUrl: data.site.url + routes.pathFor("fi", "formats"),
    }),
  },
};
