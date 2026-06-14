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

  // Guider i en given kategori, sorterade på order (för pelarsidan).
  eleventyConfig.addFilter("byCategory", (guides, cat) =>
    (guides || [])
      .filter((g) => g.data.category === cat)
      .sort((a, b) => (a.data.order || 99) - (b.data.order || 99)),
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
