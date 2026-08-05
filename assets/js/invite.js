// Inbjudningssidans personalisering: hämtar vem som bjudit in och skriver in
// namnet i rubriken.
//
// Ligger i egen fil, inte inline, eftersom CSP:n saknar 'unsafe-inline' — samma
// skäl som replay-sample.js. Låg tidigare inline och kördes därför aldrig i
// produktion: sidan renderade, men rubriken förblev generisk, spårningen tyst,
// och nedladdningsknappen pekade på App Store även för Android-användare.
// Enhetsvalet sköts numera av download-link.js via data-attributen på knappen,
// så den här filen ansvarar bara för namnet och mätpunkterna.
//
// Utan JS eller vid API-fel står den generiska rubriken kvar och knappen går
// via /ladda-ner, som avgör butik server-side. Sidan fungerar alltså ändå.
(function () {
  var el = document.currentScript;
  if (!el) return;

  var api = el.getAttribute('data-api');
  if (!api) return;

  // Handle:t ligger i sökvägen, inte i en query-parameter: /i/<handle> är en
  // universal link som appen fångar, och Pages-funktionen servar den här sidan
  // med sökvägen orörd just för att den ska gå att läsa här.
  var m = window.location.pathname.match(/\/i\/([A-Za-z0-9_-]{8})/);
  var token = m ? m[1] : null;
  if (!token) return;

  function track(name) {
    if (!window.umami) return;
    try {
      umami.track(name);
    } catch (e) {
      // Mätningen får aldrig fälla inbjudningsflödet.
    }
  }

  var dl = document.getElementById('dl');
  if (dl) {
    dl.addEventListener('click', function () {
      track('invite_landing_download');
    });
  }

  track('invite_landing_viewed');

  fetch(api + '/api/invite/' + token)
    .then(function (r) {
      return r.ok ? r.json() : null;
    })
    .then(function (p) {
      if (!p) return;
      var name = (p.display_name && p.display_name.trim()) || 'En golfkompis';
      var title = document.getElementById('invite-title');
      // textContent, inte innerHTML: display_name kommer från en annan
      // användare och får aldrig tolkas som markup.
      if (title) title.textContent = name + ' har bjudit in dig till Wager Golf';
    })
    .catch(function () {
      // Nere API eller offline: den generiska rubriken duger.
    });
})();
