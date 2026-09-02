// Nav-knappen "Ladda ner" pekar på /ladda-ner, som avgör butik server-side och
// därför fungerar utan JavaScript. Finns JS anpassas länken efter enheten:
//
//   mobil   -> /ladda-ner med explicit plattform; endpointen väljer sedan rätt
//              land och butik utan att en stängd storefront kan läcka
//   desktop -> sidans hero om den finns; på undersidor behålls /ladda-ner,
//              som skickar vidare till rätt språkstartsida
//
// Här går det också att fånga iPad, som sedan iPadOS 13 uppger sig vara en Mac
// och därför inte kan kännas igen server-side.
//
// Nav-knappen bär BÅDE data-download-link och data-store-link. Ordningen
// nedan är därför inte valfri: plattformsvalet måste ske FÖRE kampanjblocket,
// så att kampanj och explicit marknad läggs på den slutliga /ladda-ner-länken.
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

      // Ingen igenkänd mobil: scrolla bara inom sidan om den faktiskt har en
      // hero med butiksknappar. På guider, Om och andra undersidor behålls den
      // serverstyrda /ladda-ner-länken så knappen aldrig blir en no-op.
      var anchor = document.querySelector('[data-download-anchor]');
      if (target) el.setAttribute('href', target);
      else if (anchor && anchor.id) el.setAttribute('href', '#' + anchor.id);
    }
  }

  // Kampanjen från /go eller från en annonslänks utm_campaign följer med till
  // /ladda-ner som ?c=. Den serverfunktionen väljer först därefter storefront
  // via explicit ?m= eller Cloudflares GeoIP och skriver rätt ct/referrer.
  // Äldre absoluta butikslänkar stöds fortfarande under migreringen.
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
  var rawMarket = params.get('m');
  var hasMarket = params.has('m');
  // Vidarebefordra även en ogiltig explicit kod så servern kan stoppa den.
  // Om den slängs bort här kan GeoIP annars välja en annan storefront.
  var market = hasMarket ? String(rawMarket || '').slice(0, 16).toUpperCase() : '';
  var campaign = raw
    ? String(raw).toLowerCase().replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+/, '').slice(0, 40).replace(/-+$/, '')
    : '';

  if (campaign || hasMarket) {
    var stores = document.querySelectorAll('a[data-store-link]');
    for (i = 0; i < stores.length; i++) {
      var href = stores[i].getAttribute('href');
      try {
        var u = new URL(href, location.href);
        if (u.pathname === '/ladda-ner') {
          if (campaign) u.searchParams.set('c', campaign);
          if (hasMarket) u.searchParams.set('m', market);
        } else if (campaign && u.searchParams.has('ct')) {
          u.searchParams.set('ct', campaign);
        }
        var ref = u.searchParams.get('referrer');
        if (campaign && ref) {
          var inner = new URLSearchParams(ref);
          inner.set('utm_campaign', campaign);
          u.searchParams.set('referrer', inner.toString());
        }
        var next = u.origin === location.origin
          ? u.pathname + u.search + u.hash
          : u.toString();
        stores[i].setAttribute('href', next);
      } catch (e) {
        // Trasig URL ska inte fälla knappen. Lämna den som den är.
      }
    }
  }
})();
