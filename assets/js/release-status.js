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
      if (!state || typeof state.public !== 'boolean') return;
      var open = document.querySelectorAll('[data-release-open]');
      var closed = document.querySelectorAll('[data-release-closed]');
      var i;
      for (i = 0; i < open.length; i++) open[i].hidden = !state.public;
      for (i = 0; i < closed.length; i++) closed[i].hidden = state.public;
      if (state.market) body.setAttribute('data-release-market', state.market);
    })
    .catch(function () {
      // Behåll den statiska, konservativa språk-defaulten om nätet är nere.
    });
})();
