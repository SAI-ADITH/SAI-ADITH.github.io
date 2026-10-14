/* Turns the "name (at) domain.com" addresses in the sidebar into clickable mailto links.
   The address is only assembled here, so it never appears in the page source as a plain email
   (which keeps most spam scrapers out). Without JavaScript the "(at)" text is shown as is. */
(function () {
  'use strict';

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
})();
