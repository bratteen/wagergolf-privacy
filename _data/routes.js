// Lokaliserade sökvägssegment per språk. Mallar bygger alla interna länkar
// härifrån i stället för att hårdkoda svenska sökvägar.
//
// Nyckeln är SPRÅKET (da), och sökvägen är ett läsbart lokalt prefix (/dk).
// De två sammanfaller för de flesta nya språk, men inte för norskt bokmål
// (nb → /no), danska (da → /dk) eller portugisiska för Portugal
// (pt-PT → /pt). Marknad och språk hålls separat: tyska används även i
// Österrike och nederländska/franska kan båda användas i Belgien.
//
// hreflang tas ALLTID från hreflang-fältet, aldrig från prefixet. hreflang="dk"
// är ogiltig och ignoreras tyst av Google, utan varning i Search Console.
//
// downloadPath är en färdig sökväg, inte ett segment som de övriga. Två skäl:
// Cloudflare-funktionen svarar på /ladda-ner utan avslutande snedstreck, medan
// pathFor alltid lägger på ett — och en enda endpoint slipper en Pages Function
// per språk. Marknaden går i query-strängen. Endpointen är en omdirigering som
// aldrig indexeras, så en lokaliserad slug hade varit kosmetik utan SEO-värde.
const LOCALES = {
  sv: {
    prefix: "", hreflang: "sv", htmlLang: "sv", intl: "sv-SE", label: "Svenska",
    formats: "spelformer", glossary: "ordlista", about: "om", downloadPath: "/ladda-ner",
  },
  nb: {
    prefix: "/no", hreflang: "nb", htmlLang: "nb", intl: "nb-NO", label: "Norsk",
    formats: "spilleformer", glossary: "ordliste", about: "om-oss", downloadPath: "/ladda-ner?l=nb",
  },
  da: {
    prefix: "/dk", hreflang: "da", htmlLang: "da", intl: "da-DK", label: "Dansk",
    formats: "spilformer", glossary: "ordliste", about: "om-os", downloadPath: "/ladda-ner?l=da",
  },
  en: {
    prefix: "/en", hreflang: "en", htmlLang: "en", intl: "en-GB", label: "English",
    formats: "game-formats", glossary: "glossary", about: "about", downloadPath: "/ladda-ner?l=en",
  },
  fi: {
    prefix: "/fi", hreflang: "fi", htmlLang: "fi", intl: "fi-FI", label: "Suomi",
    formats: "pelimuodot", glossary: "sanasto", about: "tietoa", downloadPath: "/ladda-ner?l=fi",
  },
  nl: {
    prefix: "/nl", hreflang: "nl", htmlLang: "nl", intl: "nl-NL", label: "Nederlands",
    formats: "spelvormen", glossary: "woordenlijst", about: "over-ons", downloadPath: "/ladda-ner?l=nl",
  },
  de: {
    prefix: "/de", hreflang: "de", htmlLang: "de", intl: "de-DE", label: "Deutsch",
    formats: "spielformen", glossary: "glossar", about: "ueber-uns", downloadPath: "/ladda-ner?l=de",
  },
  fr: {
    prefix: "/fr", hreflang: "fr", htmlLang: "fr", intl: "fr-FR", label: "Français",
    formats: "formules-de-jeu", glossary: "glossaire", about: "a-propos", downloadPath: "/ladda-ner?l=fr",
  },
  es: {
    prefix: "/es", hreflang: "es", htmlLang: "es", intl: "es-ES", label: "Español",
    formats: "modalidades-de-juego", glossary: "glosario", about: "acerca-de", downloadPath: "/ladda-ner?l=es",
  },
  it: {
    prefix: "/it", hreflang: "it", htmlLang: "it", intl: "it-IT", label: "Italiano",
    formats: "formule-di-gioco", glossary: "glossario", about: "chi-siamo", downloadPath: "/ladda-ner?l=it",
  },
  pt: {
    prefix: "/pt", hreflang: "pt-PT", htmlLang: "pt-PT", intl: "pt-PT", label: "Português",
    formats: "modalidades-de-jogo", glossary: "glossario", about: "sobre-nos", downloadPath: "/ladda-ner?l=pt",
  },
};

// Vilka språk som är live. Både hreflang-härledningen och sitemap filtrerar mot
// den här listan, så ett halvöversatt språk kan byggas och granskas lokalt utan
// att exponeras. Ett språk läggs till i samma commit som dess sista sida.
const PUBLISHED = ["sv", "nb", "da", "en", "fi", "nl", "de", "fr", "es", "it", "pt"];

/** Bygger en lokaliserad sökväg: pathFor("da", "formats", "stableford")
 *  ger "/dk/spilformer/stableford/". Utan slug ges sektionens indexsida. */
function pathFor(lang, segment, slug) {
  const loc = LOCALES[lang];
  if (!loc) throw new Error(`Okänt språk: ${lang}`);
  // Nyckelkontroll, inte falsy-test: ett segment som någon gång får ett tomt
  // värde ska inte rapporteras som "okänt".
  if (!Object.prototype.hasOwnProperty.call(loc, segment)) {
    throw new Error(`Okänt segment "${segment}" för ${lang}`);
  }
  const seg = loc[segment];
  return slug ? `${loc.prefix}/${seg}/${slug}/` : `${loc.prefix}/${seg}/`;
}

/** Startsidan för ett språk. Svenska ger "/", övriga "/no/" osv. */
function homeFor(lang) {
  return `${LOCALES[lang].prefix}/`;
}

module.exports = {
  locales: LOCALES,
  defaultLocale: "sv",
  publishedLocales: PUBLISHED,
  pathFor,
  homeFor,
};
