// Katalogdata för hela den engelska sajten.
//
// lang ligger som VANLIG data, inte i eleventyComputed: ordningen mellan
// global och katalognivås eleventyComputed är inte garanterad i Eleventy, och
// guidernas katalogdata läser data.lang när den bygger sin permalink. Ett
// beräknat lang kan vara odefinierat där och ge en engelsk guide en svensk
// sökväg utan att bygget larmar.
//
// Filen måste heta som sin katalog (en/en.11tydata.js). Ett annat namn
// ignoreras tyst av Eleventy och varje sida faller tillbaka på svenska.
module.exports = {
  lang: "en",
};
