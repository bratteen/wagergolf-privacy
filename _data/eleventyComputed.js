// lang och t sätts för varje sida. Katalogdatafilerna (no/no.11tydata.js osv.)
// sätter lang; saknas det är sidan svensk.
const routes = require("./routes.js");
const { stringsFor } = require("../lib/i18n.js");

module.exports = {
  lang: (data) => data.lang || routes.defaultLocale,
  t: (data) => stringsFor(data.lang || routes.defaultLocale),
};
