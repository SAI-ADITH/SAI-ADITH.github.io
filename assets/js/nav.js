/* Highlights the current section in the side menu. The menu links work without this script. */
(function () {
  'use strict';

  var links = Array.prototype.slice.call(document.querySelectorAll('.side-nav a'));
  var items = [];
  links.forEach(function (a) {
    var h = document.getElementById(a.getAttribute('href').slice(1));
    if (h) items.push({ link: a, heading: h });
  });
  if (!items.length) return;

  function update() {
    var line = window.innerHeight * 0.3;
    var current = items[0];
    items.forEach(function (it) {
      if (it.heading.getBoundingClientRect().top <= line) current = it;
    });
    // at the very bottom of the page, the last section is the active one
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      current = items[items.length - 1];
    }
    items.forEach(function (it) {
      var on = it === current;
      it.link.classList.toggle('active', on);
      if (on) it.link.setAttribute('aria-current', 'true'); else it.link.removeAttribute('aria-current');
    });
  }

  var queued = false;
  window.addEventListener('scroll', function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { update(); queued = false; });
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
