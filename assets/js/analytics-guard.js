// Umami får bara sidvisningar och tre nedladdningshändelser från offentliga
// sidor. Bygg alltid en ny payload; kopiera aldrig identifierare eller andra
// fält från anropet. Ladda leverantörens script först när skyddet är på plats
// och sidans uttryckliga godkännande har verifierats. Ingen lokal lagring.
(function () {
  var config = document.currentScript;
  var source = config && config.getAttribute('data-analytics-src');
  var website = config && config.getAttribute('data-website-id');
  var origins = ['https://wagergolf.se', 'https://www.wagergolf.se'];
  var names = ['app-store-klick', 'play-store-klick', 'ladda-ner-klick'];
  var places = [
    'nav', 'artikel', 'guide', 'guide-inline',
    'startsida-hero', 'startsida-avslut', 'startsida-bottom',
  ];
  var languages = ['sv', 'nb', 'da', 'en', 'fi', 'nl', 'de', 'fr', 'es', 'it', 'pt-PT'];

  function privacyRequested(value) {
    return value === true || value === 1
      || (typeof value === 'string' && /^(1|yes|true)$/i.test(value.trim()));
  }

  function externalReferrer() {
    try {
      var referrer = new URL(document.referrer);
      if (referrer.protocol !== 'https:' && referrer.protocol !== 'http:') return '';
      // Även www och HTTP-varianter är interna: skicka aldrig en invite-path.
      if (referrer.hostname === 'wagergolf.se' || referrer.hostname === 'www.wagergolf.se') return '';
      return referrer.origin;
    } catch (e) {
      return '';
    }
  }

  function pageContext() {
    try {
      if (privacyRequested(navigator.globalPrivacyControl)
        || privacyRequested(navigator.doNotTrack)
        || privacyRequested(navigator.msDoNotTrack)
        || privacyRequested(window.doNotTrack)) return null;

      var body = document.body;
      var expectedPath = body && body.getAttribute('data-analytics-path');
      var title = body && body.getAttribute('data-analytics-title');
      // Bara sidmallens uttryckliga kanoniska katalogadress. Avvisa query,
      // procentkodade sökvägar och de privata eller tekniska rotkatalogerna.
      if (!expectedPath || !/^\/(?:[a-z0-9-]+\/)*$/.test(expectedPath)) return null;
      if (/^\/(?:i|invite|privacy|terms|api|go|ladda-ner|market-status)(?:\/|$)/.test(expectedPath)) return null;
      if (typeof title !== 'string' || !title.trim()) return null;

      var current = new URL(window.location.href);
      if (origins.indexOf(current.origin) === -1 || current.pathname !== expectedPath
        || current.username || current.password) return null;

      if (source !== 'https://analytics.bratt.se/script.js'
        || typeof website !== 'string'
        || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(website)) return null;
      return { current: current, path: expectedPath, title: title };
    } catch (e) {
      return null;
    }
  }

  window.wagerGolfBeforeSend = function (type, payload) {
    try {
      if (type !== 'event' || !payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
      var page = pageContext();
      if (!page) return null;
      var current = page.current;
      if (typeof payload.url !== 'string' || !payload.url) return null;
      var requested = new URL(payload.url, current.origin);
      if (requested.origin !== current.origin || requested.pathname !== page.path
        || requested.username || requested.password) return null;
      if (payload.hostname !== current.hostname) return null;
      if (payload.website !== website) return null;

      var hasName = payload.name !== undefined;
      if (hasName && names.indexOf(payload.name) === -1) return null;

      var clean = {
        website: website,
        hostname: current.hostname,
        url: page.path,
        title: page.title,
        referrer: externalReferrer(),
      };
      // Sidans byggda språk räcker; webbläsarspråk och skärmstorlek behövs inte.
      var language = document.documentElement.getAttribute('lang');
      if (languages.indexOf(language) !== -1) clean.language = language;
      if (hasName) {
        clean.name = payload.name;
        var place = payload.data && payload.data.plats;
        if (places.indexOf(place) !== -1) clean.data = { plats: place };
      }
      return clean;
    } catch (e) {
      // En saknad DOM-del eller felaktig payload får aldrig öppna en reservväg.
      return null;
    }
  };

  // Umami skickar utan filtrering om before-send saknas. Därför skapas dess
  // tagg här, efter hooken, aldrig som en fristående tagg i sidmallen.
  if (!pageContext()) return;
  var tracker = document.createElement('script');
  tracker.src = source;
  tracker.defer = true;
  tracker.referrerPolicy = 'no-referrer';
  tracker.setAttribute('data-website-id', website);
  tracker.setAttribute('data-before-send', 'wagerGolfBeforeSend');
  tracker.setAttribute('data-domains', 'wagergolf.se,www.wagergolf.se');
  tracker.setAttribute('data-exclude-search', 'true');
  tracker.setAttribute('data-exclude-hash', 'true');
  tracker.setAttribute('data-do-not-track', 'true');
  tracker.setAttribute('data-performance', 'false');
  tracker.setAttribute('data-fetch-credentials', 'omit');
  document.head.appendChild(tracker);
})();
