// Nav-knappen "Ladda ner" pekar på /ladda-ner, som avgör butik server-side och
// därför fungerar utan JavaScript. Finns JS skrivs länken om direkt:
//
//   mobil   -> butikens URL, så besökaren slipper ett omdirigeringshopp
//   desktop -> #top, så sidan mjukscrollar till knapparna i heron i stället
//              för att laddas om
//
// Här går det också att fånga iPad, som sedan iPadOS 13 uppger sig vara en Mac
// och därför inte kan kännas igen server-side.
(function () {
  var links = document.querySelectorAll('a[data-download-link]');
  if (!links.length) return;

  var ua = navigator.userAgent || '';
  var i;

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
})();
