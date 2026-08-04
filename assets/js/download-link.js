// Nav-knappen "Ladda ner" pekar på /ladda-ner, som avgör butik server-side och
// därför fungerar utan JavaScript. Finns JS skrivs länken om direkt:
//
//   mobil   -> butikens URL, så besökaren slipper ett omdirigeringshopp
//   desktop -> #top, så sidan mjukscrollar till knapparna i heron i stället
//              för att laddas om
//
// Här går det också att fånga iPad, som sedan iPadOS 13 uppger sig vara en Mac
// och därför inte kan kännas igen server-side.
//
// Nav-knappen bär BÅDE data-download-link och data-store-link. Ordningen
// nedan är därför inte valfri: loopen som skriver om href till butikens URL
// måste köra FÖRE kampanjblocket som byter ct-parametern, annars finns ingen
// butiks-URL med ct att byta ut på mobil (href är fortfarande /ladda-ner, en
// egen sökväg utan ct). De två stegen ligger redan i den ordningen i filen.
//
// Kampanjblocket är INTE villkorat på att data-download-link-element finns —
// store-badges.njk:s knappar bär bara data-store-link, inte
// data-download-link, och ska märkas även på en sida utan nav (skulle någon
// sådan tillkomma).
(function () {
  var links = document.querySelectorAll('a[data-download-link]');
  var ua = navigator.userAgent || '';
  var i;

  if (links.length) {
    for (i = 0; i < links.length; i++) {
      var el = links[i];
      var ios = el.getAttribute('data-ios-url');
      var android = el.getAttribute('data-android-url');
      var target = null;

      if (/Android/i.test(ua)) target = android;
      else if (/iPhone|iPad|iPod/i.test(ua)) target = ios;
      else if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) target = ios;

      // Ingen igenkänd mobil: låt knappen scrolla till heron i stället för att
      // ta omvägen via omdirigeringen och ladda om sidan.
      el.setAttribute('href', target || '#top');
    }
  }

  // Kampanjen från /go eller från en annonslänks utm_campaign skrivs in i
  // butikens ct-parameter. Utan detta rapporterar App Store Connect all
  // annonstrafik som generiskt "webb-<marknad>".
  //
  // Ingen cookie och ingen sessionStorage: kampanjen lever i URL:en. Det håller
  // ihop med att Umami är cookielöst och med vad integritetspolicyn säger.
  // Priset är att kampanjen tappas om besökaren navigerar vidare innan
  // nedladdning, och det är en bättre avvägning än att lagra i webbläsaren.
  //
  // Saneringen här är en tredje kopia av samma logik som finns i
  // functions/go.js och lib/campaign.js. Filen körs utan bundler, så den kan
  // inte importera lib/campaign.js. Ändras saneringen på ett ställe måste den
  // ändras på alla tre.
  var params = new URLSearchParams(location.search);
  var raw = params.get('c') || params.get('utm_campaign');
  var campaign = raw
    ? String(raw).toLowerCase().replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+/, '').slice(0, 40).replace(/-+$/, '')
    : '';

  if (campaign) {
    var stores = document.querySelectorAll('a[data-store-link]');
    for (i = 0; i < stores.length; i++) {
      var href = stores[i].getAttribute('href');
      try {
        var u = new URL(href);
        if (u.searchParams.has('ct')) u.searchParams.set('ct', campaign);
        var ref = u.searchParams.get('referrer');
        if (ref) {
          var inner = new URLSearchParams(ref);
          inner.set('utm_campaign', campaign);
          u.searchParams.set('referrer', inner.toString());
        }
        stores[i].setAttribute('href', u.toString());
      } catch (e) {
        // Trasig URL ska inte fälla knappen. Lämna den som den är.
      }
    }
  }
})();
