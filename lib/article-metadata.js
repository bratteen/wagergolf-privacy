const { isoFromFrontmatter } = require("./sitemap-date.js");

// Även handskrivna Article-grafer använder sidans aktuella metadata. Annars
// kan byline och sitemap visa ett nytt datum medan JSON-LD behåller det gamla.
// Övriga noder, publiceringsdatum och artikelspecifika fakta lämnas intakta.
function articleMetadata(value, { updated, headline, description, image, baseUrl } = {}) {
  const document = JSON.parse(value);
  const nodes = Array.isArray(document["@graph"]) ? document["@graph"] : [document];
  const modified = isoFromFrontmatter(updated);

  for (const node of nodes) {
    const types = Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]];
    if (!types.includes("Article")) continue;

    if (modified) node.dateModified = modified.slice(0, 10);
    if (headline) node.headline = headline;
    if (description) node.description = description;
    if (image) node.image = new URL(image, baseUrl).href;
  }

  // JSON-LD ligger i ett script-element: ett eventuellt </script> i vanlig
  // text får inte avsluta elementet innan hela JSON-dokumentet har lästs.
  return JSON.stringify(document).replace(/</g, "\\u003c");
}

module.exports = { articleMetadata };
