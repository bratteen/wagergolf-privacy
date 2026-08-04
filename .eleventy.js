const { alternatesFor } = require("./lib/alternates.js");

module.exports = function (eleventyConfig) {
  // Statiska resurser + de fristående juridiska sidorna kopieras rakt av.
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("privacy");
  eleventyConfig.addPassthroughCopy("terms");
  // Cloudflare Pages-headers (säkerhet + cache) måste ligga i output-roten.
  eleventyConfig.addPassthroughCopy("_headers");
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

  // Läsbart datum per språk för by-line ("2026-06-20" -> "20 juni 2026").
  const { localDate } = require("./lib/local-date.js");
  eleventyConfig.addFilter("localDate", localDate);

  // Guider i en given kategori, sorterade på order (för pelarsidan).
  eleventyConfig.addFilter("byCategory", (guides, cat) =>
    (guides || [])
      .filter((g) => g.data.category === cat)
      .sort((a, b) => (a.data.order || 99) - (b.data.order || 99)),
  );

  // Språkversioner av samma sida, för hreflang och språkväljaren.
  eleventyConfig.addFilter("alternates", (all, key, routes) =>
    alternatesFor(all, key, routes),
  );

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
