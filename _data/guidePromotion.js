const { shotPath } = require("../lib/shot.js");
const shots = require("./shots.js");

// The existing live screenshots show a Skins round in every language. Keep
// that explicit in the visible caption even when the surrounding guide is
// about another format. Format-specific copy describes the app, not the image.
// The default makes no claim about a particular format's scoring rules.
const copy = {
  sv: {
    imageAlt: "Exempel på ett Skins-scorekort i Wager Golf",
    imageCaption: "Exempel från appen: en Skins-runda.",
    reassurance: "En person kan föra scorekortet för hela gänget.",
    default: {
      title: "Håll koll på hela golfgänget",
      body: "Samla scorerna hål för hål i Wager Golf, följ ställningen och se vem som är skyldig vem efter rundan.",
    },
    stableford: {
      title: "Låt appen räkna Stableford-poängen",
      body: "Mata in slagen hål för hål. Wager Golf räknar poängen med handicap och visar ställningen i gänget.",
    },
    greensome: {
      title: "Följ lagmatchen i Greensome",
      body: "Samla lagens scorer i Wager Golf. Appen räknar laghandicapen och håller koll på ställningen i matchen.",
    },
  },
  nb: {
    imageAlt: "Eksempel på et Skins-scorekort i Wager Golf",
    imageCaption: "Eksempel fra appen: en Skins-runde.",
    reassurance: "Én person kan føre scorekortet for hele gjengen.",
    default: {
      title: "Hold oversikt over hele golfgjengen",
      body: "Samle scorene hull for hull i Wager Golf, følg stillingen og se hvem som skylder hvem etter runden.",
    },
    stableford: {
      title: "La appen telle Stableford-poengene",
      body: "Legg inn slagene hull for hull. Wager Golf beregner poengene med handicap og viser stillingen i gjengen.",
    },
    greensome: {
      title: "Følg lagmatchen i Greensome",
      body: "Samle lagenes scorer i Wager Golf. Appen beregner laghandicapet og holder oversikt over stillingen i matchen.",
    },
  },
  da: {
    imageAlt: "Eksempel på et Skins-scorekort i Wager Golf",
    imageCaption: "Eksempel fra appen: en Skins-runde.",
    reassurance: "Én person kan føre scorekortet for hele gruppen.",
    default: {
      title: "Hold styr på hele golfgruppen",
      body: "Saml scorerne hul for hul i Wager Golf, følg stillingen, og se, hvem der skylder hvem efter runden.",
    },
    stableford: {
      title: "Lad appen tælle Stableford-pointene",
      body: "Indtast slagene hul for hul. Wager Golf beregner pointene med handicap og viser gruppens stilling.",
    },
    greensome: {
      title: "Følg holdmatchen i Greensome",
      body: "Saml holdenes scorer i Wager Golf. Appen beregner holdhandicappet og holder styr på stillingen i matchen.",
    },
  },
  en: {
    imageAlt: "Example of a Skins scorecard in Wager Golf",
    imageCaption: "App example: a Skins round.",
    reassurance: "One person can keep the scorecard for the whole group.",
    default: {
      title: "Keep your whole group's scores together",
      body: "Enter scores hole by hole in Wager Golf, follow the standings and see who owes whom after the round.",
    },
    stableford: {
      title: "Let the app count your Stableford points",
      body: "Enter your strokes hole by hole. Wager Golf works out the points with handicap and keeps your group's standings up to date.",
    },
    greensome: {
      title: "Keep track of your Greensome match",
      body: "Keep the teams' scores together in Wager Golf. The app works out team handicaps and keeps track of the match standings.",
    },
  },
  fi: {
    imageAlt: "Esimerkki Skins-tuloskortista Wager Golfissa",
    imageCaption: "Esimerkki sovelluksesta: Skins-kierros.",
    reassurance: "Yksi henkilö voi kirjata koko ryhmän tulokset.",
    default: {
      title: "Koko ryhmän tulokset yhdessä paikassa",
      body: "Kirjaa tulokset reikä reiältä Wager Golfiin, seuraa tilannetta ja katso kierroksen jälkeen, kuka on velkaa kenelle.",
    },
    stableford: {
      title: "Pistebogey: anna sovelluksen laskea",
      body: "Kirjaa lyönnit reikä reiältä. Wager Golf laskee pisteet tasoituksen mukaan ja näyttää ryhmän tilanteen.",
    },
    greensome: {
      title: "Seuraa Greensome-ottelun tilannetta",
      body: "Kirjaa joukkueiden tulokset Wager Golfiin. Sovellus laskee joukkuetasoitukset ja pitää ottelun tilanteen ajan tasalla.",
    },
  },
  nl: {
    imageAlt: "Voorbeeld van een Skins-scorekaart in Wager Golf",
    imageCaption: "Voorbeeld uit de app: een ronde Skins.",
    reassurance: "Eén persoon kan de scorekaart voor de hele groep bijhouden.",
    default: {
      title: "Alle scores van je groep bij elkaar",
      body: "Voer de scores per hole in Wager Golf in, volg de stand en zie na de ronde wie nog aan wie moet betalen.",
    },
    stableford: {
      title: "Stableford: laat de app tellen",
      body: "Voer je slagen per hole in. Wager Golf berekent de punten met handicap en houdt de stand van je groep bij.",
    },
    greensome: {
      title: "Houd je Greensomewedstrijd bij",
      body: "Verzamel de teamscores in Wager Golf. De app berekent de teamhandicaps en houdt de wedstrijdstand bij.",
    },
  },
  de: {
    imageAlt: "Beispiel einer Skins-Scorekarte in Wager Golf",
    imageCaption: "Beispiel aus der App: eine Skins-Runde.",
    reassurance: "Eine Person kann die Scorekarte für die ganze Gruppe führen.",
    default: {
      title: "Alle Ergebnisse eurer Gruppe im Blick",
      body: "Tragt die Ergebnisse Loch für Loch in Wager Golf ein, verfolgt den Spielstand und seht nach der Runde, wer wem wie viel schuldet.",
    },
    stableford: {
      title: "Lasst die App eure Stableford-Punkte zählen",
      body: "Tragt eure Schläge Loch für Loch ein. Wager Golf berechnet die Punkte mit Handicap und zeigt den Spielstand eurer Gruppe.",
    },
    greensome: {
      title: "Euer Greensome-Match im Blick",
      body: "Sammelt die Teamergebnisse in Wager Golf. Die App berechnet die Teamhandicaps und hält den Spielstand aktuell.",
    },
  },
  fr: {
    imageAlt: "Exemple de carte de score Skins dans Wager Golf",
    imageCaption: "Exemple dans l’app : une partie de Skins.",
    reassurance: "Une seule personne peut tenir la carte de score de tout le groupe.",
    default: {
      title: "Les scores de tout le groupe au même endroit",
      body: "Saisissez les scores trou par trou dans Wager Golf, suivez le classement et voyez qui doit combien à qui après la partie.",
    },
    stableford: {
      title: "Laissez l’app compter vos points Stableford",
      body: "Saisissez vos coups trou par trou. Wager Golf calcule les points avec handicap et affiche le classement du groupe.",
    },
    greensome: {
      title: "Suivez votre match en Greensome",
      body: "Regroupez les scores des équipes dans Wager Golf. L’app calcule les handicaps d’équipe et tient le score du match à jour.",
    },
  },
  es: {
    imageAlt: "Ejemplo de una tarjeta de Skins en Wager Golf",
    imageCaption: "Ejemplo de la app: una vuelta de Skins.",
    reassurance: "Una persona puede llevar la tarjeta de todo el grupo.",
    default: {
      title: "Los resultados de todo el grupo, juntos",
      body: "Anotad los resultados hoyo a hoyo en Wager Golf, seguid la clasificación y ved quién debe cuánto a quién al terminar la vuelta.",
    },
    stableford: {
      title: "Dejad que la app cuente los puntos Stableford",
      body: "Anotad los golpes hoyo a hoyo. Wager Golf calcula los puntos con hándicap y muestra la clasificación del grupo.",
    },
    greensome: {
      title: "Seguid vuestro partido de Greensome",
      body: "Reunid los resultados de los equipos en Wager Golf. La app calcula los hándicaps de equipo y mantiene al día el marcador del partido.",
    },
  },
  it: {
    imageAlt: "Esempio di uno score di Skins in Wager Golf",
    imageCaption: "Esempio dall’app: un giro di Skins.",
    reassurance: "Una persona può segnare i risultati per tutto il gruppo.",
    default: {
      title: "I risultati di tutto il gruppo, insieme",
      body: "Inserite i risultati buca per buca in Wager Golf, seguite la classifica e scoprite chi deve quanto a chi alla fine del giro.",
    },
    stableford: {
      title: "Lasciate che l’app conti i punti Stableford",
      body: "Inserite i colpi buca per buca. Wager Golf calcola i punti con handicap e mostra la classifica del gruppo.",
    },
    greensome: {
      title: "Seguite il vostro match di Greensome",
      body: "Raccogliete i risultati delle squadre in Wager Golf. L’app calcola gli handicap di squadra e tiene aggiornato il punteggio del match.",
    },
  },
  pt: {
    imageAlt: "Exemplo de um cartão de resultados de Skins no Wager Golf",
    imageCaption: "Exemplo da app: uma volta de Skins.",
    reassurance: "Uma pessoa pode registar os resultados de todo o grupo.",
    default: {
      title: "Os resultados de todo o grupo, juntos",
      body: "Registem os resultados buraco a buraco no Wager Golf, acompanhem a classificação e vejam quem deve quanto a quem no fim da volta.",
    },
    stableford: {
      title: "Deixem a app contar os pontos Stableford",
      body: "Registem as pancadas buraco a buraco. O Wager Golf calcula os pontos com handicap e mostra a classificação do grupo.",
    },
    greensome: {
      title: "Acompanhem o vosso jogo de Greensome",
      body: "Juntem os resultados das equipas no Wager Golf. A app calcula os handicaps de equipa e mantém o resultado do jogo atualizado.",
    },
  },
};

module.exports = Object.fromEntries(Object.entries(copy).map(([lang, text]) => [
  lang,
  Object.fromEntries(["default", "stableford", "greensome"].map((variant) => [
    variant,
    {
      ...text[variant],
      image: shotPath("live", lang, shots.available),
      imageAlt: text.imageAlt,
      imageCaption: text.imageCaption,
      reassurance: text.reassurance,
    },
  ])),
]));
