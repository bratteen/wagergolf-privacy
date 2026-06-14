// Katalog-data för alla guide-sidor i spelformer/guides/.
// Sätter layout + collection-tag och beräknar permalink + JSON-LD per guide.
module.exports = {
  layout: "guide.njk",
  tags: "guides",
  eleventyComputed: {
    permalink: (data) => `/spelformer/${data.slug}/`,
    structuredData: (data) => {
      const base = data.site.url;
      const url = `${base}/spelformer/${data.slug}/`;
      const graph = [
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
          author: { "@id": base + "/#org" },
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
