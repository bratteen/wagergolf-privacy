// Inbjudningssidans personalisering: hämtar vem som bjudit in och skriver in
// namnet i rubriken.
//
// Ligger i egen fil, inte inline, eftersom CSP:n saknar 'unsafe-inline' — samma
// skäl som replay-sample.js. Låg tidigare inline och kördes därför aldrig i
// produktion: sidan renderade, men rubriken förblev generisk, spårningen tyst,
// och nedladdningsknappen pekade på App Store även för Android-användare.
// Knappen behåller /ladda-ner som server-side fallback. Med JavaScript lägger
// data-download-link till explicit plattform, inklusive iPad som identifierar
// sig som Macintosh. Invite-sidan saknar download-anchor, så desktop behåller
// endpointen och kan aldrig skrivas om till en meningslös #top-länk.
//
// Utan JS eller vid API-fel står den generiska rubriken kvar. Butiksknappen är
// konservativt dold tills release-status.js har bekräftat en öppen marknad.
(function () {
  var el = document.currentScript;
  if (!el) return;

  var api = el.getAttribute('data-api');
  if (!api) return;
  var lang = el.getAttribute('data-lang') || 'sv';
  var copy = {
    sv: { fallbackName: 'En golfkompis', title: ' har bjudit in dig till Wager Golf' },
    nb: { fallbackName: 'En golfkompis', title: ' har invitert deg til Wager Golf' },
    da: { fallbackName: 'En golfmakker', title: ' har inviteret dig til Wager Golf' },
    en: { fallbackName: 'A golf mate', title: ' has invited you to Wager Golf' },
  }[lang] || { fallbackName: 'A golf mate', title: ' has invited you to Wager Golf' };

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
      var name = (p.display_name && p.display_name.trim()) || copy.fallbackName;
      var title = document.getElementById('invite-title');
      // textContent, inte innerHTML: display_name kommer från en annan
      // användare och får aldrig tolkas som markup.
      if (title) title.textContent = name + copy.title;
    })
    .catch(function () {
      // Nere API eller offline: den generiska rubriken duger.
    });
})();
