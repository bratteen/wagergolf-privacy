// Termordlista sv -> nb -> da -> en.
//
// Källan för hela översättningsarbetet. Byggs och granskas FÖRE en enda sida
// översätts, eftersom slugs blir dyra att ändra så fort sidorna indexerats —
// en ändrad slug kräver en redirect och tappar den intjänade rankingen.
//
// Två slags poster:
//   FORMATS  spelformerna. Blir både rubriker och SLUGS, alltså den dyra sortens
//            beslut. En post per guide, nycklad på den svenska sluggen — samma
//            nyckel som `key: guide:<slug>` i frontmatter.
//   TERMS    golftermer i brödtext. Fel här kostar trovärdighet hos en golfare
//            men inget i sökmotorn.
//
// `source` säger hur säker raden är. Rader utan källa är min bedömning och bör
// läsas av någon som spelar golf på språket innan de fryses:
//   "NGF"   Norges Golfforbund
//   "DGU"   Dansk Golf Union
//   "namn"  egennamn, oförändrat på alla språk
//   "beslut" ingen etablerad term finns, namnet är valt medvetet
//   ""      obekräftad, behöver granskas
//
// SLUGGKONVENTION: diakriter skalas bort, som i de befintliga svenska sluggarna
// (Bästboll -> bastboll, Längst drive -> langst-drive). Danska å blir aa och æ
// blir ae enligt dansk praxis; norska ø blir o.

const FORMATS = {
  // --- Grundformerna. Verifierade mot förbundens egen terminologi. ---
  slaggolf: {
    sv: { name: "Slaggolf", slug: "slaggolf" },
    nb: { name: "Slagspill", slug: "slagspill" },
    da: { name: "Slagspil", slug: "slagspil" },
    en: { name: "Stroke play", slug: "stroke-play" },
    source: "NGF + DGU",
  },
  matchspel: {
    sv: { name: "Matchspel", slug: "matchspel" },
    nb: { name: "Matchspill", slug: "matchspill" },
    // DGU använder hulspil, inte matchspil. Danskarna har DM Hulspil.
    da: { name: "Hulspil", slug: "hulspil" },
    en: { name: "Match play", slug: "match-play" },
    source: "NGF + DGU",
  },
  stableford: {
    sv: { name: "Stableford", slug: "stableford", altName: "Poängbogey" },
    // Inget alternativnamn på norska eller danska: sökningar ger inga belägg
    // för "poengbogey" eller "pointbogey". Bara svenskan har ett andra namn.
    nb: { name: "Stableford", slug: "stableford", altName: null },
    da: { name: "Stableford", slug: "stableford", altName: null },
    en: { name: "Stableford", slug: "stableford", altName: null },
    source: "NGF",
  },

  // --- Egennamn. Samma på alla språk, ingen översättning. ---
  nassau: { sv: n("Nassau"), nb: n("Nassau"), da: n("Nassau"), en: n("Nassau"), source: "namn" },
  vegas: { sv: n("Vegas"), nb: n("Vegas"), da: n("Vegas"), en: n("Vegas"), source: "namn" },
  wolf: { sv: n("Wolf"), nb: n("Wolf"), da: n("Wolf"), en: n("Wolf"), source: "namn" },
  skins: { sv: n("Skins"), nb: n("Skins"), da: n("Skins"), en: n("Skins"), source: "namn" },
  scramble: { sv: n("Scramble"), nb: n("Scramble"), da: n("Scramble"), en: n("Scramble"), source: "namn" },
  foursome: { sv: n("Foursome"), nb: n("Foursome"), da: n("Foursome"), en: n("Foursome"), source: "namn" },
  greensome: { sv: n("Greensome"), nb: n("Greensome"), da: n("Greensome"), en: n("Greensome"), source: "namn" },
  sandie: { sv: n("Sandie"), nb: n("Sandie"), da: n("Sandie"), en: n("Sandie"), source: "namn" },
  snake: { sv: n("Snake"), nb: n("Snake"), da: n("Snake"), en: n("Snake"), source: "namn" },
  quota: { sv: n("Quota"), nb: n("Quota"), da: n("Quota"), en: n("Quota"), source: "namn" },
  "bingo-bango-bongo": {
    sv: n("Bingo Bango Bongo", "bingo-bango-bongo"),
    nb: n("Bingo Bango Bongo", "bingo-bango-bongo"),
    da: n("Bingo Bango Bongo", "bingo-bango-bongo"),
    en: n("Bingo Bango Bongo", "bingo-bango-bongo"),
    source: "namn",
  },

  // --- Beskrivande namn. Översätts, och behöver granskas. ---
  bastboll: {
    sv: { name: "Bästboll", slug: "bastboll" },
    // NGF och DGU använder Four-Ball för just den 2 mot 2-form som appen
    // implementerar: alla spelar egen boll och lagets lägsta score räknas.
    // "Best-ball" kan också syfta på en annan spelform och används därför
    // inte som synligt namn. Den redan publicerade engelska sluggen behålls
    // så befintliga länkar och sökhistorik fortsätter fungera.
    nb: { name: "Four-Ball", slug: "four-ball" },
    da: { name: "Four-Ball", slug: "four-ball" },
    en: { name: "Four-Ball", slug: "best-ball" },
    source: "NGF + DGU",
  },
  "langst-drive": {
    sv: { name: "Längst drive", slug: "langst-drive" },
    nb: { name: "Lengste drive", slug: "lengste-drive" },
    da: { name: "Længste drive", slug: "laengste-drive" },
    en: { name: "Longest drive", slug: "longest-drive" },
    source: "NGF + DGU",
  },
  "narmast-flaggan": {
    sv: { name: "Närmast flaggan", slug: "narmast-flaggan" },
    nb: { name: "Nærmest flagget", slug: "naermest-flagget" },
    // DGU:s formella namn är "Nærmest hullet".
    da: { name: "Nærmest hullet", slug: "naermest-hullet" },
    // Engelskan har ett etablerat uttryck som folk faktiskt söker på.
    en: { name: "Closest to the pin", slug: "closest-to-the-pin" },
    source: "NGF + DGU",
  },
  // De tre nedan är informella vadslagningsspel utan belägg på norska eller
  // danska — de finns helt enkelt inte i skrift. Namnen är därför beslutade,
  // inte funna. Låg risk: ingen söker på dem, så sluggen har inget
  // sökordsvärde att förlora.
  birdiepott: {
    sv: { name: "Birdiepott", slug: "birdiepott" },
    // Bara ordet "pott" översätts, resten står. Danskan säger pulje, se TERMS.
    nb: { name: "Birdiepott", slug: "birdiepott" },
    da: { name: "Birdiepulje", slug: "birdiepulje" },
    en: { name: "Birdie pot", slug: "birdie-pot" },
    source: "beslut",
  },
  klubbroulette: {
    // Behålls oöversatt på de nordiska språken. Kølleroulett/Kølleroulette var
    // mina påhitt och används inte av någon; en uppfunnen lokal term är sämre
    // än en igenkännbar. Engelskan översätts, eftersom "Klubbroulette" inte
    // säger en engelsktalande någonting.
    sv: { name: "Klubbroulette", slug: "klubbroulette" },
    nb: { name: "Klubbroulette", slug: "klubbroulette" },
    da: { name: "Klubbroulette", slug: "klubbroulette" },
    en: { name: "Club roulette", slug: "club-roulette" },
    source: "beslut",
  },
  golfpoker: {
    // Identiskt på alla tre nordiska språken, inget att välja på.
    sv: { name: "Golfpoker", slug: "golfpoker" },
    nb: { name: "Golfpoker", slug: "golfpoker" },
    da: { name: "Golfpoker", slug: "golfpoker" },
    en: { name: "Golf poker", slug: "golf-poker" },
    source: "beslut",
  },
  "split-sixes": {
    sv: { name: "Split Sixes", slug: "split-sixes", altName: "Köpenhamnare" },
    nb: { name: "Split Sixes", slug: "split-sixes", altName: "Københavner" },
    // Det nordiska alternativnamnet används även på danska och norska.
    da: { name: "Split Sixes", slug: "split-sixes", altName: "Københavner" },
    en: { name: "Split Sixes", slug: "split-sixes", altName: null },
    source: "namn",
  },
};

/** Kort form för egennamn: samma namn och slug på alla språk. */
function n(name, slug) {
  return { name, slug: slug || name.toLowerCase() };
}

// Golftermer i brödtext. Bara de som faktiskt skiljer sig — par, birdie, eagle,
// bogey, tee, green, fairway, rough, bunker, putt, handicap, slope, scratch och
// WHS är identiska på alla fyra språken och står därför inte här.
const TERMS = {
  dubbelbogey: { sv: "Dubbelbogey", nb: "Dobbeltbogey", da: "Dobbeltbogey", en: "Double bogey" },
  "hole-in-one": { sv: "Hole in one", nb: "Hole in one", da: "Hole in one", en: "Hole-in-one" },
  albatross: { sv: "Albatross", nb: "Albatross", da: "Albatros", en: "Albatross" },
  spelhandicap: { sv: "Spelhandicap", nb: "Spillehandicap", da: "Spillehandicap", en: "Course handicap" },
  "stroke-index": { sv: "Stroke-index", nb: "Handicap-indeks", da: "Handicapnøgle", en: "Stroke index" },
  "course-rating": { sv: "Course rating (banvärde)", nb: "Course rating (banevurdering)", da: "Course rating (banevurdering)", en: "Course rating" },
  brutto: { sv: "Brutto", nb: "Brutto", da: "Brutto", en: "Gross" },
  net: { sv: "Net", nb: "Netto", da: "Netto", en: "Net" },
  utslag: { sv: "Utslag", nb: "Utslag", da: "Udslag", en: "Tee shot" },
  pegga: { sv: "Pegga", nb: "Pegge", da: "Pegge", en: "Tee up" },
  honnor: { sv: "Honnör", nb: "Honnør", da: "Honnør", en: "Honours" },
  greenfee: { sv: "Greenfee", nb: "Greenfee", da: "Greenfee", en: "Green fee" },
  gimme: { sv: "Gimme", nb: "Gimme", da: "Gimme", en: "Gimme" },
  mulligan: { sv: "Mulligan", nb: "Mulligan", da: "Mulligan", en: "Mulligan" },
  sidobet: { sv: "Sidobet", nb: "Sidebet", da: "Sidebet", en: "Side bet" },
  pott: { sv: "Pott", nb: "Pott", da: "Pulje", en: "Pot" },
  insats: { sv: "Insats", nb: "Innsats", da: "Indsats", en: "Stake" },
  hal: { sv: "Hål", nb: "Hull", da: "Hul", en: "Hole" },
  runda: { sv: "Runda", nb: "Runde", da: "Runde", en: "Round" },
  bana: { sv: "Bana", nb: "Bane", da: "Bane", en: "Course" },
  spelform: { sv: "Spelform", nb: "Spilleform", da: "Spilleform", en: "Game format" },
  scorekort: { sv: "Scorekort", nb: "Scorekort", da: "Scorekort", en: "Scorecard" },
  slag: { sv: "Slag", nb: "Slag", da: "Slag", en: "Stroke" },
  poang: { sv: "Poäng", nb: "Poeng", da: "Point", en: "Points" },
};

module.exports = { FORMATS, TERMS };
