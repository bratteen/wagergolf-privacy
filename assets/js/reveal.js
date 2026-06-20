// Progressiv enhancement: scroll-reveal-animationer.
// Laddas med defer + ligger i egen fil så Content-Security-Policy slipper
// 'unsafe-inline' för script-src. Utan JS visas allt innehåll direkt (.js-gate
// i CSS), så sidan fungerar fullt ut även om denna fil inte laddas.
document.documentElement.classList.add('js');
(function () {
  var els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    els.forEach(function (e) { e.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  els.forEach(function (e) { io.observe(e); });
})();
