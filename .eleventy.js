module.exports = function (eleventyConfig) {
  // Statiska resurser + de fristående juridiska sidorna kopieras rakt av.
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("privacy");
  eleventyConfig.addPassthroughCopy("terms");
  // Cloudflare Pages-headers (säkerhet + cache) måste ligga i output-roten.
  eleventyConfig.addPassthroughCopy("_headers");
  // _redirects: SPA-rewrite för /i/<handle> → /i/index.html
  eleventyConfig.addPassthroughCopy("_redirects");
  // .well-known: universal links (AASA) + Android App Links (assetlinks.json)
  eleventyConfig.addPassthroughCopy(".well-known");

  // privacy/terms är färdig HTML, ska INTE processas som mallar.
  // docs/ är specar, inte sidor.
  eleventyConfig.ignores.add("privacy/**");
  eleventyConfig.ignores.add("terms/**");
  eleventyConfig.ignores.add("docs/**");
  eleventyConfig.ignores.add("README.md");

  // Datum-helper för sitemap.
  eleventyConfig.addFilter("isoDate", (d) => (d || new Date()).toISOString());

  // Svenskt läsbart datum för by-line ("2026-06-20" -> "20 juni 2026").
  const SV_MONTHS = [
    "januari", "februari", "mars", "april", "maj", "juni",
    "juli", "augusti", "september", "oktober", "november", "december",
  ];
  eleventyConfig.addFilter("svDate", (d) => {
    if (!d) return "";
    const s = String(d).slice(0, 10);
    const [y, m, day] = s.split("-").map(Number);
    if (!y || !m || !day) return s;
    return `${day} ${SV_MONTHS[m - 1]} ${y}`;
  });

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
