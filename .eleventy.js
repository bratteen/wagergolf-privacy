module.exports = function (eleventyConfig) {
  // Statiska resurser + de fristående juridiska sidorna kopieras rakt av.
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("privacy");
  eleventyConfig.addPassthroughCopy("terms");

  // privacy/terms är färdig HTML, ska INTE processas som mallar.
  // docs/ är specar, inte sidor.
  eleventyConfig.ignores.add("privacy/**");
  eleventyConfig.ignores.add("terms/**");
  eleventyConfig.ignores.add("docs/**");
  eleventyConfig.ignores.add("README.md");

  // Datum-helper för sitemap.
  eleventyConfig.addFilter("isoDate", (d) => (d || new Date()).toISOString());

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
