// Guider i en given kategori OCH ett givet språk, sorterade på order.
// Används av pelarsidan (spelformer/index.njk) och llms.txt (llms.njk).
//
// Filtret saknade tidigare lang-filtrering. Osynligt så länge bara svenska
// var publicerat, eftersom collections.guides då bara innehöll svenska
// guider. Verifierat med en enda norsk guide: den svenska pelarsidan fick 22
// kort i stället för 21, ett av dem länkande till /no/spilleformer/..., och
// /llms.txt listade den norska guiden med svensk brödtext runt omkring. Med
// 21 översatta guider hade pelarsidan blivit 42 kort på två språk om om.
//
// _includes/guide.njk filtrerar redan sin "related"-lista på lang — det var
// den inkonsekvensen som gjorde att just det här stället missades.
function byCategory(guides, cat, lang) {
  return (guides || [])
    .filter((g) => g.data.category === cat && g.data.lang === lang)
    .sort((a, b) => (a.data.order || 99) - (b.data.order || 99));
}

module.exports = { byCategory };
