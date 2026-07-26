// Sampling + lat laddning av Umamis session replay.
//
// Varför filen finns: recorder.js är 190 kB uppackad och konkurrerade om
// bandbredden med hero-bilden, vilket kostade cirka 450 ms LCP på strypt
// mobilnät. Här görs två saker i stället:
//
//   1. Sampling. Bara en andel av besökarna spelas in (data-sample-rate).
//      Beslutet sparas per flik-session så en och samma besökare inte
//      växlar mellan sidvisningar och ger halva inspelningar.
//   2. Lat laddning. Inspelaren hämtas först när sidan är färdigladdad och
//      huvudtråden är ledig, så den aldrig tävlar med LCP.
//
// Ligger i egen fil, inte inline, eftersom CSP:n saknar 'unsafe-inline'.
// Utan JS eller vid fel laddas ingen inspelare alls, sidan påverkas inte.
(function () {
  var el = document.currentScript;
  if (!el) return;

  var src = el.getAttribute('data-recorder-src');
  var siteId = el.getAttribute('data-website-id');
  var rate = parseFloat(el.getAttribute('data-sample-rate'));

  if (!src || !siteId) return;
  if (!(rate > 0)) return;

  var KEY = 'wg-replay-sample';
  var pick = function () { return Math.random() < rate ? '1' : '0'; };
  var decision;

  try {
    decision = sessionStorage.getItem(KEY);
    if (decision === null) {
      decision = pick();
      sessionStorage.setItem(KEY, decision);
    }
  } catch (e) {
    // Privat läge eller blockerad storage: ta ett engångsbeslut i minnet.
    decision = pick();
  }

  if (decision !== '1') return;

  function load() {
    var s = document.createElement('script');
    s.src = src;
    s.defer = true;
    s.setAttribute('data-website-id', siteId);
    document.head.appendChild(s);
  }

  function schedule() {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(load, { timeout: 3000 });
    } else {
      setTimeout(load, 1500);
    }
  }

  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
})();
