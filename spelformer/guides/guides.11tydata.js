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
    permalink: (data) => `/spelformer/${data.slug}/`,
    structuredData: (data) => {
      const base = data.site.url;
      const url = `${base}/spelformer/${data.slug}/`;
      const published = data.published || "2026-06-14";
      const modified = data.updated || published;
      const image = data.image
        ? (String(data.image).startsWith("http") ? data.image : base + data.image)
        : data.site.ogImage;
      const graph = [
        {
          "@type": "Organization",
          "@id": base + "/#org",
          name: "Wager Golf",
          url: base,
          logo: {
            "@type": "ImageObject",
            url: base + "/assets/logo.png",
            width: 192,
            height: 192,
          },
        },
        {
          "@type": "Person",
          "@id": base + "/#person",
          name: "Gustaf Bratt",
          url: base + "/om/",
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Hem", item: base + "/" },
            { "@type": "ListItem", position: 2, name: "Spelformer", item: base + "/spelformer/" },
            { "@type": "ListItem", position: 3, name: data.format, item: url },
          ],
        },
        {
          "@type": "Article",
          headline: data.h1 || data.title,
          description: data.description,
          mainEntityOfPage: url,
          inLanguage: "sv-SE",
          datePublished: published,
          dateModified: modified,
          image: image,
          author: { "@id": base + "/#person" },
          publisher: { "@id": base + "/#org" },
        },
      ];
      if (Array.isArray(data.faq) && data.faq.length) {
        graph.push({
          "@type": "FAQPage",
          mainEntity: data.faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        });
      }
      return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
    },
  },
};
