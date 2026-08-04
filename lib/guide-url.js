// Länk till en annan guide, i sidans eget språk.
//
// Guidernas brödtext länkar till varandra. Med fyra språk blir hårdkodade
// sökvägar fyra uppsättningar som tyst kan peka på fel språk eller på 404.
// Nyckeln som skickas in är ALLTID den svenska sluggen; den är guidens
// språkoberoende identitet.
//
// Saknas översättningen kastas ett fel som fäller bygget. Alternativet vore en
// tyst 404 i en publicerad guide, och det är sämre.
function guideUrl(guides, key, lang) {
  const hit = (guides || []).find(
    (g) => g.data.key === `guide:${key}` && g.data.lang === lang,
  );
  if (!hit) {
    throw new Error(
      `guideUrl: ingen guide med nyckeln "${key}" på språket "${lang}". ` +
        `Nyckeln är den svenska sluggen, inte den översatta.`,
    );
  }
  return hit.url;
}

module.exports = { guideUrl };
