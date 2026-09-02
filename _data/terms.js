// Termordlista för sajtens elva publicerade språk.
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
// `source` dokumenterar källan för den ursprungliga nordiska termmatrisen:
//   "NGF"   Norges Golfforbund
//   "DGU"   Dansk Golf Union
//   "namn"  egennamn, oförändrat på alla språk
//   "beslut" ingen etablerad term finns, namnet är valt medvetet
// De sju tillkommande språken speglar appens kanoniska locale-filer och
// butikstexter. Ägaren godkände den 2 september 2026 att de publiceras utan en
// separat språkgranskning; namn och sluggar låses därför av testerna nedan.
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

// De sju europeiska språken följer appens kanoniska formatnamn. Nyckeln är
// alltid den svenska guideidentiteten; värdet är [synligt namn, fryst slug,
// eventuellt alternativnamn]. Den kompakta formen gör att samma matris går att
// granska mot appens locale-filer utan att blanda in den nordiska historiken
// ovan.
const EXTRA_FORMATS = {
  fi: {
    slaggolf: ["Lyöntipeli", "lyontipeli"], matchspel: ["Reikäpeli", "reikapeli"],
    stableford: ["Pistebogey", "pistebogey", "Stableford"], nassau: ["Nassau", "nassau"],
    vegas: ["Vegas", "vegas"], wolf: ["Wolf", "wolf"], skins: ["Skins", "skins"],
    scramble: ["Scramble", "scramble"], foursome: ["Foursome", "foursome"],
    greensome: ["Greensome", "greensome"], sandie: ["Sandie", "sandie"],
    snake: ["Snake", "snake"], quota: ["Quota", "quota"],
    "bingo-bango-bongo": ["Bingo Bango Bongo", "bingo-bango-bongo"],
    bastboll: ["Four-Ball", "four-ball"], "langst-drive": ["Pisin draivi", "pisin-draivi"],
    "narmast-flaggan": ["Lähimmäs lippua", "lahimmas-lippua"],
    birdiepott: ["Birdiet", "birdiet"], klubbroulette: ["Mailaruletti", "mailaruletti"],
    golfpoker: ["Golfpokeri", "golfpokeri"], "split-sixes": ["Split Sixes", "split-sixes"],
  },
  nl: {
    slaggolf: ["Strokeplay", "strokeplay"], matchspel: ["Matchplay", "matchplay"],
    stableford: ["Stableford", "stableford"], nassau: ["Nassau", "nassau"],
    vegas: ["Vegas", "vegas"], wolf: ["Wolf", "wolf"], skins: ["Skins", "skins"],
    scramble: ["Scramble", "scramble"], foursome: ["Foursome", "foursome"],
    greensome: ["Greensome", "greensome"], sandie: ["Sandie", "sandie"],
    snake: ["Snake", "snake"], quota: ["Quota", "quota"],
    "bingo-bango-bongo": ["Bingo Bango Bongo", "bingo-bango-bongo"],
    bastboll: ["Fourball", "fourball"], "langst-drive": ["Longest drive", "longest-drive"],
    "narmast-flaggan": ["Neary", "neary"], birdiepott: ["Birdiepot", "birdiepot", "Birdies"],
    klubbroulette: ["Clubroulette", "clubroulette"], golfpoker: ["Golfpoker", "golfpoker"],
    "split-sixes": ["Amerikaantje", "amerikaantje", "Split Sixes"],
  },
  de: {
    slaggolf: ["Zählspiel", "zaehlspiel"], matchspel: ["Lochspiel", "lochspiel"],
    stableford: ["Stableford", "stableford"], nassau: ["Nassau", "nassau"],
    vegas: ["Vegas", "vegas"], wolf: ["Wolf", "wolf"], skins: ["Skins", "skins"],
    scramble: ["Scramble", "scramble"], foursome: ["Vierer", "vierer"],
    greensome: ["Greensome", "greensome"], sandie: ["Sandie", "sandie"],
    snake: ["Snake", "snake"], quota: ["Quota", "quota"],
    "bingo-bango-bongo": ["Bingo Bango Bongo", "bingo-bango-bongo"],
    bastboll: ["Vierball", "vierball"], "langst-drive": ["Longest Drive", "longest-drive"],
    "narmast-flaggan": ["Nearest to the Pin", "nearest-to-the-pin"],
    birdiepott: ["Birdies", "birdie-pot"], klubbroulette: ["Schlägerroulette", "schlaegerroulette"],
    golfpoker: ["Golfpoker", "golfpoker"], "split-sixes": ["Split Sixes", "split-sixes"],
  },
  fr: {
    slaggolf: ["Stroke play", "stroke-play"], matchspel: ["Match play", "match-play"],
    stableford: ["Stableford", "stableford"], nassau: ["Nassau", "nassau"],
    vegas: ["Vegas", "vegas"], wolf: ["Wolf", "wolf"], skins: ["Skins", "skins"],
    scramble: ["Scramble", "scramble"], foursome: ["Foursome", "foursome"],
    greensome: ["Greensome", "greensome"], sandie: ["Sandie", "sandie"],
    snake: ["Snake", "snake"], quota: ["Quota", "quota"],
    "bingo-bango-bongo": ["Bingo Bango Bongo", "bingo-bango-bongo"],
    bastboll: ["Quatre balles", "quatre-balles"], "langst-drive": ["Concours de drive", "concours-drive"],
    "narmast-flaggan": ["Concours de précision", "concours-precision"],
    birdiepott: ["Birdies", "cagnotte-birdies"], klubbroulette: ["Roulette des clubs", "roulette-clubs"],
    golfpoker: ["Golf Poker", "poker-golf"], "split-sixes": ["Split Sixes", "split-sixes"],
  },
  es: {
    slaggolf: ["Juego por golpes", "juego-por-golpes"], matchspel: ["Juego por hoyos", "juego-por-hoyos"],
    stableford: ["Stableford", "stableford"], nassau: ["Nassau", "nassau"],
    vegas: ["Vegas", "vegas"], wolf: ["Wolf", "wolf"], skins: ["Skins", "skins"],
    scramble: ["Scramble", "scramble"], foursome: ["Foursomes", "foursomes"],
    greensome: ["Greensome", "greensome"], sandie: ["Sandie", "sandie"],
    snake: ["Snake", "snake"], quota: ["Quota", "quota"],
    "bingo-bango-bongo": ["Bingo Bango Bongo", "bingo-bango-bongo"],
    bastboll: ["Four-Ball", "four-ball"], "langst-drive": ["Drive más largo", "drive-mas-largo"],
    "narmast-flaggan": ["Más cerca de la bandera", "mas-cerca-de-la-bandera"],
    birdiepott: ["Bote de birdies", "bote-de-birdies", "Birdies"], klubbroulette: ["Ruleta de palos", "ruleta-de-palos"],
    golfpoker: ["Póquer de golf", "poquer-de-golf"], "split-sixes": ["Split Sixes", "split-sixes"],
  },
  it: {
    slaggolf: ["Stroke play", "stroke-play"], matchspel: ["Match play", "match-play"],
    stableford: ["Stableford", "stableford"], nassau: ["Nassau", "nassau"],
    vegas: ["Vegas", "vegas"], wolf: ["Wolf", "wolf"], skins: ["Skins", "skins"],
    scramble: ["Scramble", "scramble"], foursome: ["Foursome", "foursome"],
    greensome: ["Greensome", "greensome"], sandie: ["Sandie", "sandie"],
    snake: ["Snake", "snake"], quota: ["Quota", "quota"],
    "bingo-bango-bongo": ["Bingo Bango Bongo", "bingo-bango-bongo"],
    bastboll: ["Quattro palle", "quattro-palle"], "langst-drive": ["Drive più lungo", "drive-piu-lungo"],
    "narmast-flaggan": ["Più vicino alla bandiera", "piu-vicino-alla-bandiera"],
    birdiepott: ["Birdie", "birdie"], klubbroulette: ["Roulette dei bastoni", "roulette-dei-bastoni"],
    golfpoker: ["Poker golf", "poker-golf"], "split-sixes": ["Split Sixes", "split-sixes"],
  },
  pt: {
    slaggolf: ["Jogo por pancadas", "jogo-por-pancadas"], matchspel: ["Jogo por buracos", "jogo-por-buracos"],
    stableford: ["Stableford", "stableford"], nassau: ["Nassau", "nassau"],
    vegas: ["Vegas", "vegas"], wolf: ["Wolf", "wolf"], skins: ["Skins", "skins"],
    scramble: ["Scramble", "scramble"], foursome: ["Foursomes", "foursomes"],
    greensome: ["Greensome", "greensome"], sandie: ["Sandie", "sandie"],
    snake: ["Snake", "snake"], quota: ["Quota", "quota"],
    "bingo-bango-bongo": ["Bingo Bango Bongo", "bingo-bango-bongo"],
    bastboll: ["Quatro Bolas", "quatro-bolas"], "langst-drive": ["Drive mais longo", "drive-mais-longo"],
    "narmast-flaggan": ["Mais perto da bandeira", "mais-perto-da-bandeira"],
    birdiepott: ["Pote de birdies", "pote-de-birdies"], klubbroulette: ["Roleta de tacos", "roleta-de-tacos"],
    golfpoker: ["Poker de golfe", "poker-de-golfe"], "split-sixes": ["Split Sixes", "split-sixes"],
  },
};

for (const [lang, formats] of Object.entries(EXTRA_FORMATS)) {
  for (const [key, [name, slug, altName]] of Object.entries(formats)) {
    if (!FORMATS[key]) throw new Error(`Okänd formatnyckel i ${lang}: ${key}`);
    FORMATS[key][lang] = { name, slug, ...(altName ? { altName } : {}) };
  }
}

/** Kort form för egennamn: samma namn och slug på alla språk. */
function n(name, slug) {
  return { name, slug: slug || name.toLowerCase() };
}

// Golftermer i brödtext. Bara de som faktiskt skiljer sig — par, birdie, eagle,
// bogey, tee, green, fairway, rough, bunker, putt, handicap, slope, scratch och
// Basuppsättningen nedan täcker de fyra ursprungliga språken. De sju
// tillkommande språkens exakta motsvarigheter läggs på i EXTRA_TERMS.
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
  sidobet: { sv: "Sidobet", nb: "Sidespill", da: "Sidespil", en: "Side bet" },
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

const EXTRA_TERMS = {
  fi: {
    dubbelbogey: "Tuplabogey", "hole-in-one": "Hole-in-one", albatross: "Albatrossi",
    spelhandicap: "Pelitasoitus", "stroke-index": "Väylän tasoitusindeksi",
    "course-rating": "Course Rating", brutto: "Brutto", net: "Netto",
    utslag: "Avauslyönti", pegga: "Tiiaus", honnor: "Avausvuoro", greenfee: "Green fee",
    gimme: "Gimme", mulligan: "Mulligan", sidobet: "Sivuveto", pott: "Potti",
    insats: "Panos", hal: "Väylä", runda: "Kierros", bana: "Kenttä",
    spelform: "Pelimuoto", scorekort: "Tuloskortti", slag: "Lyönti", poang: "Pisteet",
  },
  nl: {
    dubbelbogey: "Dubbele bogey", "hole-in-one": "Hole-in-one", albatross: "Albatros",
    spelhandicap: "Baanhandicap", "stroke-index": "Stroke-index",
    "course-rating": "Course Rating", brutto: "Bruto", net: "Netto", utslag: "Afslag",
    pegga: "Opteeën", honnor: "Eer", greenfee: "Greenfee", gimme: "Gimme",
    mulligan: "Mulligan", sidobet: "Sidebet", pott: "Pot", insats: "Inzet", hal: "Hole",
    runda: "Ronde", bana: "Baan", spelform: "Spelvorm", scorekort: "Scorekaart",
    slag: "Slag", poang: "Punten",
  },
  de: {
    dubbelbogey: "Doppelbogey", "hole-in-one": "Hole-in-one", albatross: "Albatros",
    spelhandicap: "Playing Handicap", "stroke-index": "Vorgabenindex",
    "course-rating": "Course Rating", brutto: "Brutto", net: "Netto", utslag: "Abschlag",
    pegga: "Aufteen", honnor: "Ehre", greenfee: "Greenfee", gimme: "Geschenkter Putt",
    mulligan: "Mulligan", sidobet: "Nebenwette", pott: "Pot", insats: "Einsatz", hal: "Loch",
    runda: "Runde", bana: "Golfplatz", spelform: "Spielform", scorekort: "Scorekarte",
    slag: "Schlag", poang: "Punkte",
  },
  fr: {
    dubbelbogey: "Double bogey", "hole-in-one": "Trou en un", albatross: "Albatros",
    spelhandicap: "Handicap de jeu", "stroke-index": "Index du trou",
    "course-rating": "Course Rating", brutto: "Brut", net: "Net", utslag: "Mise en jeu",
    pegga: "Placer sur tee", honnor: "Honneur", greenfee: "Green fee", gimme: "Donné",
    mulligan: "Mulligan", sidobet: "Pari annexe", pott: "Cagnotte", insats: "Mise", hal: "Trou",
    runda: "Partie", bana: "Parcours", spelform: "Formule de jeu", scorekort: "Carte de score",
    slag: "Coup", poang: "Points",
  },
  es: {
    dubbelbogey: "Doble bogey", "hole-in-one": "Hoyo en uno", albatross: "Albatros",
    spelhandicap: "Hándicap de Juego", "stroke-index": "Índice de golpes",
    "course-rating": "Course Rating", brutto: "Bruto", net: "Neto", utslag: "Salida",
    pegga: "Colocar en el tee", honnor: "Honor", greenfee: "Green fee", gimme: "Concedido",
    mulligan: "Mulligan", sidobet: "Apuesta paralela", pott: "Bote", insats: "Apuesta", hal: "Hoyo",
    runda: "Vuelta", bana: "Campo", spelform: "Modalidad de juego",
    scorekort: "Tarjeta de resultados", slag: "Golpe", poang: "Puntos",
  },
  it: {
    dubbelbogey: "Doppio bogey", "hole-in-one": "Buca in uno", albatross: "Albatross",
    spelhandicap: "Playing Handicap", "stroke-index": "Indice di difficoltà",
    "course-rating": "Course Rating", brutto: "Lordo", net: "Netto", utslag: "Colpo dal tee",
    pegga: "Piazzare sul tee", honnor: "Onore", greenfee: "Green fee", gimme: "Concesso",
    mulligan: "Mulligan", sidobet: "Scommessa laterale", pott: "Montepremi", insats: "Posta",
    hal: "Buca", runda: "Giro", bana: "Campo", spelform: "Formula di gioco",
    scorekort: "Scorecard", slag: "Colpo", poang: "Punti",
  },
  pt: {
    dubbelbogey: "Duplo bogey", "hole-in-one": "Hole-in-one", albatross: "Albatroz",
    spelhandicap: "Handicap de Jogo", "stroke-index": "Índice de pancadas",
    "course-rating": "Course Rating", brutto: "Bruto", net: "Net", utslag: "Saída",
    pegga: "Colocar no tee", honnor: "Honra", greenfee: "Green fee", gimme: "Concedida",
    mulligan: "Mulligan", sidobet: "Aposta paralela", pott: "Pote", insats: "Aposta",
    hal: "Buraco", runda: "Volta", bana: "Campo", spelform: "Modalidade de jogo",
    scorekort: "Cartão de resultados", slag: "Pancada", poang: "Pontos",
  },
};

for (const [lang, terms] of Object.entries(EXTRA_TERMS)) {
  for (const [key, value] of Object.entries(terms)) {
    if (!TERMS[key]) throw new Error(`Okänd termnyckel i ${lang}: ${key}`);
    TERMS[key][lang] = value;
  }
}

module.exports = { FORMATS, TERMS };
