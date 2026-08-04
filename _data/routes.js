// Lokaliserade sökvägssegment per språk. Mallar bygger alla interna länkar
// härifrån i stället för att hårdkoda svenska sökvägar.
//
// Nyckeln är SPRÅKET (da), sökvägen är MARKNADEN (/dk). De två sammanfaller
// för nb och /no bara av en slump: "no" är både språkkod och landskod, medan
// "da" enbart är språkkod och "dk" enbart landskod. Marknadsbaserade sökvägar
// valdes för att /no/ och /dk/ är vad besökarna känner igen från .no och .dk,
// och för att appen säljs per App Store-storefront, som är landsindelad.
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
};

// Vilka språk som är live. Både hreflang-härledningen och sitemap filtrerar mot
// den här listan, så ett halvöversatt språk kan byggas och granskas lokalt utan
// att exponeras. Ett språk läggs till i samma commit som dess sista sida.
const PUBLISHED = ["sv"];

/** Bygger en lokaliserad sökväg: pathFor("da", "formats", "stableford")
 *  ger "/dk/spilformer/stableford/". Utan slug ges sektionens indexsida. */
function pathFor(lang, segment, slug) {
  const loc = LOCALES[lang];
  if (!loc) throw new Error(`Okänt språk: ${lang}`);
  const seg = loc[segment];
  if (!seg) throw new Error(`Okänt segment "${segment}" för ${lang}`);
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
