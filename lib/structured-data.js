// JSON-LD för guidesidorna, delad av alla språk.
//
// Låg tidigare inline i spelformer/guides/guides.11tydata.js. Med fyra
// språkkataloger skulle den koden finnas i fyra kopior som glider isär vid
// första ändringen, därför ligger den här.
const routes = require("#data/routes.js");

/** BCP 47-tagg för schema.orgs inLanguage. Inte samma sak som hreflang:
 *  hreflang vill ha den kortaste entydiga formen, schema.org vill ha
 *  språk-region. */
function inLanguage(lang) {
  return routes.locales[lang] ? routes.locales[lang].intl : "sv-SE";
}

function guideGraph({
  base, url, lang, format, h1, title, description,
  published, updated, image, faq,
  breadcrumbHome, breadcrumbFormats, formatsUrl,
}) {
  const modified = updated || published;
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
      // Per språk: en norsk guide ska inte peka på den svenska om-sidan.
      // pathFor("sv", "about") ger "/om/", så svensk output är oförändrad.
      url: base + routes.pathFor(lang, "about"),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: breadcrumbHome, item: base + routes.homeFor(lang) },
        { "@type": "ListItem", position: 2, name: breadcrumbFormats, item: formatsUrl },
        { "@type": "ListItem", position: 3, name: format, item: url },
      ],
    },
    {
      "@type": "Article",
      headline: h1 || title,
      description: description,
      mainEntityOfPage: url,
      inLanguage: inLanguage(lang),
      datePublished: published,
      dateModified: modified,
      image: image,
      author: { "@id": base + "/#person" },
      publisher: { "@id": base + "/#org" },
    },
  ];

  if (Array.isArray(faq) && faq.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }

  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
}

module.exports = { guideGraph, inLanguage };
