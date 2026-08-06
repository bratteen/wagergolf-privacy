// Katalogdata för hela den norska sajten.
//
// lang ligger som VANLIG data, inte i eleventyComputed: ordningen mellan
// global och katalognivås eleventyComputed är inte garanterad i Eleventy, och
// guidernas katalogdata läser data.lang när den bygger sin permalink.
//
// Filen måste heta som sin katalog (no/no.11tydata.js). Ett annat namn
// ignoreras tyst av Eleventy och varje sida faller tillbaka på svenska.
module.exports = {
  lang: "nb",
};
