// Native <details> ger en robust meny utan JavaScript. När en länk leder till
// ett ankare på samma sida behöver panelen däremot stängas uttryckligen, annars
// ligger den kvar ovanpå målet under den sticky headern.
(function () {
  var menus = document.querySelectorAll('.mobile-menu');
  for (var i = 0; i < menus.length; i++) {
    (function (menu) {
      var links = menu.querySelectorAll('a');
      for (var j = 0; j < links.length; j++) {
        links[j].addEventListener('click', function () {
          menu.open = false;
        });
      }
    })(menus[i]);
  }
})();
