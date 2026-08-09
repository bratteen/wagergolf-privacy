const { alternatesFor } = require("./lib/alternates.js");

module.exports = function (eleventyConfig) {
  // Statiska resurser + de fristående juridiska sidorna kopieras rakt av.
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("privacy");
  eleventyConfig.addPassthroughCopy("terms");
  // Cloudflare Pages-headers (säkerhet + cache) måste ligga i output-roten.
  eleventyConfig.addPassthroughCopy("_headers");
  // Permanenta redirects för gamla publika eller delade guideadresser.
  eleventyConfig.addPassthroughCopy("_redirects");
  // Pages Functions (functions/i/[[path]].js servar /i/<handle>-landningssidan).
  eleventyConfig.addPassthroughCopy("functions");
  // .well-known: universal links (AASA) + Android App Links (assetlinks.json)
  eleventyConfig.addPassthroughCopy(".well-known");

  // privacy/terms är färdig HTML, ska INTE processas som mallar.
  // docs/ är specar, inte sidor.
  eleventyConfig.ignores.add("privacy/**");
  eleventyConfig.ignores.add("terms/**");
  eleventyConfig.ignores.add("docs/**");
  eleventyConfig.ignores.add("README.md");
  // .superpowers/ är SDD-arbetsytans processartefakter (planer, briefar,
  // rapporter) — inte sidor. Utan detta blir varje markdown-fil där en egen
  // HTML-sida i _site, och deployen (wrangler pages deploy _site) skickar hela
  // katalogen rakt ut på wagergolf.se.
  eleventyConfig.ignores.add(".superpowers/**");

  // Datum-helper för sitemap.
  eleventyConfig.addFilter("isoDate", (d) => (d || new Date()).toISOString());

  // lastmod för sitemapen: explicit datum ur frontmatter före filens mtime.
  const { sitemapDate } = require("./lib/sitemap-date.js");
  eleventyConfig.addFilter("sitemapDate", sitemapDate);

  // Läsbart datum per språk för by-line ("2026-06-20" -> "20 juni 2026").
  const { localDate } = require("./lib/local-date.js");
  eleventyConfig.addFilter("localDate", localDate);

  // Guider i en given kategori och språk, sorterade på order (för
  // pelarsidan och llms.txt). Se lib/by-category.js för varför lang måste
  // vara med.
  const { byCategory } = require("./lib/by-category.js");
  eleventyConfig.addFilter("byCategory", byCategory);

  // Språkversioner av samma sida, för hreflang och språkväljaren.
  eleventyConfig.addFilter("alternates", (all, key, routes, lang) =>
    alternatesFor(all, key, routes, lang),
  );

  // Appskärmbild i sidans eget språk, med fallback. Se lib/shot.js för
  // varför uppslagningen är additiv i stället för blockerande.
  const { shotPath } = require("./lib/shot.js");
  eleventyConfig.addShortcode("shot", function (name) {
    return shotPath(name, this.ctx.lang || "sv", this.ctx.shots.available);
  });

  // Länk till en annan guide i sidans eget språk. Nyckeln är den svenska
  // sluggen; se lib/guide-url.js.
  const { guideUrl } = require("./lib/guide-url.js");
  eleventyConfig.addShortcode("guideUrl", function (key) {
    return guideUrl(this.ctx.collections.guides, key, this.ctx.lang || "sv");
  });

  return {
    dir: {
      input: ".",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html"],
  };
};
