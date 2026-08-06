// Föreslår besökarens webbläsarspråk om det skiljer sig från sidans, och
// länkar till motsvarande sida på det språket. Ingen omdirigering, se
// kommentaren i _includes/language-banner.njk för varför.
//
// Extern fil, inte inline: CSP:n i _headers saknar 'unsafe-inline' i
// script-src (med avsikt, se _headers), och ett nonce/hash måste räknas om
// för hand vid varje ändring av scriptet och glöms lätt bort. En extern fil
// matchar också hur replay-sample.js och download-link.js redan löser samma
// problem.
//
// Datan skickas via data-attribut, inte interpolerad JSON, i samma stil som
// replay-sample.js. Kandidatspråken ligger i ett <template>, vars innehåll
// webbläsaren aldrig renderar oavsett CSS, så listan kan aldrig råka synas
// eller påverka layouten innan scriptet kört.
(function () {
  var el = document.getElementById('lang-banner');
  if (!el) return;

  var tpl = document.getElementById('lang-banner-alts');
  if (!tpl) return;

  // Har besökaren stängt raden eller själv valt språk visas den aldrig igen.
  try {
    if (localStorage.getItem('wg-lang-dismissed')) return;
  } catch (e) { return; }

  var current = el.getAttribute('data-current-lang');

  var nodes = tpl.content.querySelectorAll('[data-lang]');
  var alts = [];
  var i;
  for (i = 0; i < nodes.length; i++) {
    alts.push({
      lang: nodes[i].getAttribute('data-lang'),
      url: nodes[i].getAttribute('data-url'),
      label: nodes[i].getAttribute('data-label'),
      text: nodes[i].getAttribute('data-text') || '',
    });
  }

  // Första webbläsarspråket som vi faktiskt har en översättning för.
  var prefs = navigator.languages || [navigator.language || ''];
  var match = null;
  var j;
  for (i = 0; i < prefs.length && !match; i++) {
    var base = String(prefs[i]).toLowerCase().split('-')[0];
    for (j = 0; j < alts.length; j++) {
      // nb och no är samma skriftspråk för vårt syfte.
      var altBase = alts[j].lang === 'nb' ? 'no' : alts[j].lang;
      if (base === altBase || base === alts[j].lang) { match = alts[j]; break; }
    }
  }

  if (!match || match.lang === current) return;

  // textContent + createElement, inte innerHTML: ett framtida
  // översättningsvärde med "<" eller ">" i banner.text ska aldrig kunna
  // hamna okontrollerat i DOM.
  var link = document.createElement('a');
  link.setAttribute('href', match.url);
  link.setAttribute('data-lang-link', match.lang);
  // match.text är målspråkets sträng, se kommentaren i komponenten.
  link.textContent = match.text.replace('{language}', match.label) + ' →';

  var textEl = document.getElementById('lang-banner-text');
  textEl.textContent = '';
  textEl.appendChild(link);
  el.hidden = false;

  document.getElementById('lang-banner-close').addEventListener('click', function () {
    el.hidden = true;
    try { localStorage.setItem('wg-lang-dismissed', '1'); } catch (e) {}
  });
})();
