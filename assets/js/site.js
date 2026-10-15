/* Small page behaviors. Everything here is optional: without JavaScript the page is still
   fully readable, the menu links still work, and the emails show as plain "(at)" text. */
(function () {
  'use strict';

  /* 1. Section menu: highlight the section you are currently in. */
  var links = Array.prototype.slice.call(document.querySelectorAll('.side-nav a'));
  var items = [];
  links.forEach(function (a) {
    var h = document.getElementById(a.getAttribute('href').slice(1));
    if (h) items.push({ link: a, heading: h });
  });

  function updateMenu() {
    if (!items.length) return;
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

  if (items.length) {
    var queued = false;
    window.addEventListener('scroll', function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { updateMenu(); queued = false; });
    }, { passive: true });
    window.addEventListener('resize', updateMenu);
    updateMenu();
  }

  /* 2. Emails: turn "name (at) domain.com" into clickable mailto links. The address is only
     assembled here, so it is not in the page source as a plain email (keeps most spam bots out). */
  Array.prototype.forEach.call(document.querySelectorAll('email'), function (el) {
    Array.prototype.slice.call(el.childNodes).forEach(function (node) {
      if (node.nodeType !== 3) return;
      var m = node.textContent.trim().match(/^(\S+)\s*\(at\)\s*(\S+)$/);
      if (!m) return;
      var address = m[1] + '@' + m[2];
      var link = document.createElement('a');
      link.href = 'mailto:' + address;
      link.textContent = address;
      el.replaceChild(link, node);
    });
  });

  /* 3. Links to other sites (papers, code, profiles) open in a new tab so visitors keep this page. */
  Array.prototype.forEach.call(document.querySelectorAll('a[href^="http"]'), function (a) {
    if (a.hostname && a.hostname !== window.location.hostname) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
  });
})();
