const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { articleMetadata } = require("../lib/article-metadata.js");

// En riktig statisk artikel fångar att metadata kan komma ur synk utan att
// Article, FAQ, Organization eller BreadcrumbList slutar vara giltig JSON.
const source = readFileSync(path.join(__dirname, "../ordlista.njk"), "utf8");
const fixture = source.match(/structuredData: \|\n([\s\S]+?)\n---/)[1];
const original = JSON.parse(fixture);
const metadata = {
  updated: "2026-09-06",
  headline: "Aktuell golfordlista",
  description: "Sidans aktuella beskrivning.",
  image: "/assets/og-image-v171.png",
  baseUrl: "https://wagergolf.se",
};

test("statisk Article följer sidans datum, rubrik, beskrivning och bild", () => {
  const result = JSON.parse(articleMetadata(fixture, metadata));
  const before = original["@graph"].find((node) => node["@type"] === "Article");
  const article = result["@graph"].find((node) => node["@type"] === "Article");

  assert.deepEqual(article, {
    ...before,
    dateModified: metadata.updated,
    headline: metadata.headline,
    description: metadata.description,
    image: "https://wagergolf.se/assets/og-image-v171.png",
  });
  assert.deepEqual(
    result["@graph"].filter((node) => node["@type"] !== "Article"),
    original["@graph"].filter((node) => node["@type"] !== "Article"),
  );
});

test("saknade metadata bevarar artikelns ursprungliga värden", () => {
  assert.deepEqual(JSON.parse(articleMetadata(fixture)), original);
  assert.deepEqual(JSON.parse(articleMetadata(fixture, { updated: "2026-02-31" })), original);
});

test("YAML-datum, fristående Article och explicita externa bilder fungerar", () => {
  const result = JSON.parse(articleMetadata(JSON.stringify({
    "@context": "https://schema.org",
    "@type": ["Article", "NewsArticle"],
    datePublished: "2026-06-14",
  }), {
    updated: new Date("2026-09-06T00:00:00.000Z"),
    image: "https://example.com/article.jpg",
  }));

  assert.equal(result.dateModified, "2026-09-06");
  assert.equal(result.datePublished, "2026-06-14");
  assert.equal(result.image, "https://example.com/article.jpg");
});

test("icke-artiklar och appens erbjudanden ändras inte", () => {
  const graph = JSON.stringify({ "@graph": [
    { "@type": "SoftwareApplication", offers: { "@type": "Offer", price: "0" } },
    { "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: "Är appen gratis?" }] },
  ] });
  assert.deepEqual(JSON.parse(articleMetadata(graph, metadata)), JSON.parse(graph));
});

test("text kan inte avsluta JSON-LD-elementet och ogiltig JSON stoppar bygget", () => {
  const headline = "Rubrik med </script> i texten";
  const result = articleMetadata('{"@type":"Article"}', { headline });
  assert.ok(!result.includes("</script>"));
  assert.equal(JSON.parse(result).headline, headline);
  assert.throws(() => articleMetadata("{invalid}"), SyntaxError);
});
