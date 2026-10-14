/* Interactive effects for the homepage. No dependencies.
   Everything degrades gracefully: without JS the page is plain, readable HTML. */
(function () {
  'use strict';

  var doc = document.documentElement;
  var section = document.querySelector('section');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. tag content so CSS can style it ---------- */
  if (section) {
    var listStyle = {
      'news': 'timeline',
      'experiences': 'timeline',
      'talks': 'timeline',
      'publications': 'cards',
      'awards': 'cards',
      'research-interests': 'bullets',
      'services': 'bullets'
    };
    var current = null;
    Array.prototype.forEach.call(section.children, function (el) {
      if (el.tagName === 'H2') {
        if (!el.id) el.id = el.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        current = listStyle[el.id] || null;
      } else if (el.tagName === 'UL' && current) {
        el.classList.add('l-' + current);
      }
    });

    // [[PDF]] style links become pills, **[Aug. 2026]** becomes a date tag
    Array.prototype.forEach.call(section.querySelectorAll('a'), function (a) {
      var m = a.textContent.trim().match(/^\[(.+)\]$/);
      if (m) { a.textContent = m[1]; a.classList.add('pill'); }
    });
    Array.prototype.forEach.call(section.querySelectorAll('strong'), function (s) {
      var m = s.textContent.trim().match(/^\[(.+)\]$/);
      if (m) { s.textContent = m[1]; s.classList.add('date'); }
    });

    /* ---------- 2. reveal on scroll ---------- */
    var targets = [];
    Array.prototype.forEach.call(section.children, function (el) {
      if (el.tagName === 'UL') {
        Array.prototype.forEach.call(el.children, function (li, i) {
          li.style.setProperty('--d', Math.min(i * 0.07, 0.35) + 's');
          targets.push(li);
        });
      } else if (/^(H2|H3|P)$/.test(el.tagName)) {
        targets.push(el);
      }
    });

    if (!reduce && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var el = e.target;
          el.classList.add('in', 'seen');
          io.unobserve(el);
          // drop the reveal classes afterwards so hover transitions work normally
          setTimeout(function () { el.classList.remove('rv', 'in'); }, 1500);
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
      targets.forEach(function (el) { el.classList.add('rv'); io.observe(el); });
    } else {
      targets.forEach(function (el) { el.classList.add('seen'); });
    }

    /* ---------- 3. card spotlight follows the cursor ---------- */
    section.addEventListener('pointermove', function (e) {
      var li = e.target.closest && e.target.closest('li');
      if (!li) return;
      var r = li.getBoundingClientRect();
      li.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      li.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  }

  /* ---------- 4. scroll progress + nav highlight ---------- */
  var bar = document.getElementById('scroll-progress');
  var links = Array.prototype.slice.call(document.querySelectorAll('.side-nav a'));
  var heads = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var max = doc.scrollHeight - window.innerHeight;
      if (bar) bar.style.setProperty('--p', max > 0 ? Math.min(1, window.scrollY / max) : 0);
      var idx = -1;
      heads.forEach(function (h, i) { if (h && h.getBoundingClientRect().top < window.innerHeight * 0.35) idx = i; });
      links.forEach(function (a, i) { a.classList.toggle('active', i === idx); });
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- 5. typed tagline ---------- */
  var typed = document.getElementById('typed');
  if (typed && !reduce) {
    var phrases = [
      'Mechanistic Interpretability',
      'Circuits & Causal Analysis',
      'AI Safety & Alignment',
      'LLM Personas & Reasoning',
      'Applied AI Systems'
    ];
    var pi = 0, len = phrases[0].length, deleting = true;
    var tick = function () {
      var text = phrases[pi];
      if (deleting) {
        len--;
        typed.textContent = text.slice(0, len);
        if (len <= 0) { deleting = false; pi = (pi + 1) % phrases.length; return setTimeout(tick, 350); }
        return setTimeout(tick, 28);
      }
      len++;
      typed.textContent = text.slice(0, len);
      if (len >= text.length) { deleting = true; return setTimeout(tick, 2000); }
      setTimeout(tick, 55);
    };
    // let the first phrase sit for a moment before cycling
    setTimeout(tick, 2200);
  }

  /* ---------- 6. neural network background ---------- */
  var cv = document.getElementById('neural-bg');
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext('2d');
  var W = 0, H = 0, L = 140;
  var nodes = [], pulses = [];
  var mouse = { x: -9999, y: -9999 };
  var lastSpawn = 0;

  function makeNode() {
    return {
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22,
      r: 1 + Math.random() * 1.4,
      hue: Math.random() < 0.5 ? 190 : 265,
      glow: 0
    };
  }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    L = Math.max(110, Math.min(170, W / 9));
    var n = Math.max(26, Math.min(80, Math.round(W * H / 24000)));
    while (nodes.length < n) nodes.push(makeNode());
    nodes.length = n;
  }

  function neighbors(i) {
    var out = [], a = nodes[i];
    for (var j = 0; j < nodes.length; j++) {
      if (j === i) continue;
      var dx = a.x - nodes[j].x, dy = a.y - nodes[j].y;
      if (dx * dx + dy * dy < L * L) out.push(j);
    }
    return out;
  }

  // a pulse is an "activation" travelling along an edge; on arrival it can keep going, like signal through a circuit
  function firePulse(from, hops) {
    if (pulses.length > 14) return;
    var nb = neighbors(from);
    if (!nb.length) return;
    pulses.push({ a: from, b: nb[(Math.random() * nb.length) | 0], t0: performance.now(), dur: 650 + Math.random() * 350, hops: hops });
  }

  function frame(now) {
    ctx.clearRect(0, 0, W, H);
    var i, j, a, b, dx, dy, d2, d;

    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      a.x += a.vx; a.y += a.vy;
      if (a.x < -20) a.x = W + 20; else if (a.x > W + 20) a.x = -20;
      if (a.y < -20) a.y = H + 20; else if (a.y > H + 20) a.y = -20;
      dx = mouse.x - a.x; dy = mouse.y - a.y; d2 = dx * dx + dy * dy;
      if (d2 < 22500 && d2 > 1) { d = Math.sqrt(d2); a.x += dx / d * (150 - d) * 0.0025; a.y += dy / d * (150 - d) * 0.0025; }
      a.glow *= 0.94;
    }

    ctx.lineWidth = 1;
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      for (j = i + 1; j < nodes.length; j++) {
        b = nodes[j];
        dx = a.x - b.x; dy = a.y - b.y; d2 = dx * dx + dy * dy;
        if (d2 < L * L) {
          ctx.strokeStyle = 'rgba(129,140,248,' + ((1 - Math.sqrt(d2) / L) * 0.3).toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      dx = a.x - mouse.x; dy = a.y - mouse.y; d2 = dx * dx + dy * dy;
      if (d2 < 22500) {
        ctx.strokeStyle = 'rgba(34,211,238,' + ((1 - Math.sqrt(d2) / 150) * 0.55).toFixed(3) + ')';
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
    }

    if (!reduce) {
      if (now - lastSpawn > 750) { lastSpawn = now; firePulse((Math.random() * nodes.length) | 0, 2 + ((Math.random() * 3) | 0)); }
      ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 12;
      for (i = pulses.length - 1; i >= 0; i--) {
        var p = pulses[i], t = (now - p.t0) / p.dur;
        if (t >= 1) {
          nodes[p.b].glow = 1;
          if (p.hops > 0 && Math.random() < 0.75) firePulse(p.b, p.hops - 1);
          pulses.splice(i, 1);
          continue;
        }
        var pa = nodes[p.a], pb = nodes[p.b];
        ctx.fillStyle = 'rgba(165,243,252,0.95)';
        ctx.beginPath(); ctx.arc(pa.x + (pb.x - pa.x) * t, pa.y + (pb.y - pa.y) * t, 2.2, 0, 6.283); ctx.fill();
      }
      ctx.shadowBlur = 0;
    }

    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      ctx.fillStyle = 'hsla(' + a.hue + ',90%,72%,' + (0.5 + a.glow * 0.5).toFixed(2) + ')';
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r + a.glow * 2.5, 0, 6.283); ctx.fill();
    }

    if (!reduce) requestAnimationFrame(frame);
  }

  var resizeTimer;
  window.addEventListener('resize', function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 150); });
  window.addEventListener('pointermove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  document.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });
  window.addEventListener('pointerdown', function (e) {
    if (reduce) return;
    var best = 0, bd = Infinity;
    for (var i = 0; i < nodes.length; i++) {
      var dx = nodes[i].x - e.clientX, dy = nodes[i].y - e.clientY, d2 = dx * dx + dy * dy;
      if (d2 < bd) { bd = d2; best = i; }
    }
    nodes[best].glow = 1;
    for (var k = 0; k < 3; k++) firePulse(best, 3);
  });

  resize();
  requestAnimationFrame(frame);
})();
