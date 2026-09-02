// Språk och marknad är separata. En engelsk sida kan visas i Sverige och en
// svensk sida kan öppnas i ett land som ännu granskas. Fråga därför samma
// fail-closed marknadsmodell som /ladda-ner innan butiksknappar visas.
(function () {
  var body = document.body;
  if (!body || typeof fetch !== 'function') return;

  var params = new URLSearchParams(location.search);
  var query = new URLSearchParams();
  var market = params.get('m');
  // Även en ogiltig explicit marknad skickas vidare. Servern stoppar den
  // fail-closed; att kasta bort den här skulle låta GeoIP maskera en trasig
  // annonslänk och möjligen öppna en annan storefront.
  if (params.has('m')) query.set('m', String(market || '').slice(0, 16).toUpperCase());
  var locale = body.getAttribute('data-release-locale');
  if (locale) query.set('l', locale);

  fetch('/market-status?' + query.toString(), {
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  })
    .then(function (response) { return response.ok ? response.json() : null; })
    .then(function (state) {
      if (!state || typeof state.public !== 'boolean'
        || typeof state.ios !== 'boolean' || typeof state.android !== 'boolean') return;
      var ua = typeof navigator === 'object' ? String(navigator.userAgent || '') : '';
      var isAndroid = /Android/i.test(ua);
      var isIos = /iPhone|iPad|iPod/i.test(ua)
        || (/Macintosh/i.test(ua) && Number(navigator.maxTouchPoints || 0) > 1);
      var anyStorePublic = state.ios || state.android;
      var currentDevicePublic = isAndroid ? state.android : (isIos ? state.ios : anyStorePublic);
      var open = document.querySelectorAll('[data-release-open]');
      var closed = document.querySelectorAll('[data-release-closed]');
      var iosOpen = document.querySelectorAll('[data-release-ios-open]');
      var iosClosed = document.querySelectorAll('[data-release-ios-closed]');
      var androidOpen = document.querySelectorAll('[data-release-android-open]');
      var androidClosed = document.querySelectorAll('[data-release-android-closed]');
      var i;
      for (i = 0; i < open.length; i++) open[i].hidden = !currentDevicePublic;
      for (i = 0; i < closed.length; i++) closed[i].hidden = currentDevicePublic;
      for (i = 0; i < iosOpen.length; i++) iosOpen[i].hidden = !state.ios;
      for (i = 0; i < iosClosed.length; i++) iosClosed[i].hidden = state.ios;
      for (i = 0; i < androidOpen.length; i++) androidOpen[i].hidden = !state.android;
      for (i = 0; i < androidClosed.length; i++) androidClosed[i].hidden = state.android;
      if (state.market) body.setAttribute('data-release-market', state.market);
    })
    .catch(function () {
      // Behåll den statiska, konservativa språk-defaulten om nätet är nere.
    });
})();
