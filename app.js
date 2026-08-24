/* ============================================================
   Aesir Solar
   Everything here is progressive enhancement. The page is fully
   readable and usable with JavaScript disabled — nothing is
   hidden until JS decides to show it.
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- where the paid application lives (existing WooCommerce + Tyl rail) ---- */
  var CHECKOUT_URL = 'https://aesirsolar.co.uk/cart/?add-to-cart=308';

  /* ---- optional: POST the technical details somewhere before payment ----
     Set this to a webhook/endpoint URL and the form will send the answers
     there. Left empty, the details are stored locally and handed to the
     checkout page so nothing is lost. */
  var FORM_ENDPOINT = '';

  /* ============ year ============ */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ============ sticky nav ============ */
  var nav = document.getElementById('nav');
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('stuck', window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ============ photons ============ */
  var host = document.getElementById('photons');
  if (host && !reduced) {
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 16; i++) {
      var p = document.createElement('span');
      p.className = 'photon';
      p.style.left = (30 + Math.random() * 82) + '%';
      p.style.animationDuration = (6 + Math.random() * 6).toFixed(2) + 's';
      p.style.animationDelay = (-Math.random() * 11).toFixed(2) + 's';
      p.style.opacity = (0.25 + Math.random() * 0.5).toFixed(2);
      frag.appendChild(p);
    }
    host.appendChild(frag);
  }

  /* ============ scroll reveal (additive only) ============ */
  if (!reduced && 'IntersectionObserver' in window) {
    var targets = document.querySelectorAll(
      '.sect .eyebrow, .sect .h2, .sect .lede, .flow, .stakes, .quote, .meter, ' +
      '.proof-note, .panel-box, .small-print, .steps, .honest, .price-copy, ' +
      '.price-card, .form'
    );
    Array.prototype.forEach.call(targets, function (el) { el.classList.add('rv'); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

    Array.prototype.forEach.call(targets, function (el) { io.observe(el); });
  }

  /* ============================================================
     THE ELIGIBILITY INSTRUMENT
     Thresholds per ENA EREC G99 Issue 2 (10 March 2025) §6.2.2.1.
     Registered capacity is rated at 230 V, so:
       single phase  A = W / 230
       three phase   A = W / (3 x 230)     (16 A = 11.04 kW, per G98 Issue 2)
     ============================================================ */
  var kw = document.getElementById('kw');
  if (kw) {
    var kwOut = document.getElementById('kwOut'),
        ampOut = document.getElementById('ampOut'),
        needle = document.getElementById('needle'),
        verdict = document.getElementById('verdict'),
        vText = document.getElementById('verdictText'),
        vNote = document.getElementById('verdictNote'),
        vCta = document.getElementById('verdictCta'),
        conv = document.getElementById('conv'),
        scaleImg = document.getElementById('scaleImg'),
        p1 = document.getElementById('p1'),
        p3 = document.getElementById('p3'),
        tt = document.getElementById('tt'),
        g100 = document.getElementById('g100'),
        eps = document.getElementById('eps');

    var phases = 1;
    var SCALE_MAX = 70; /* amps across the full scale */

    function amps() {
      var w = parseFloat(kw.value) * 1000;
      return phases === 1 ? w / 230 : w / (3 * 230);
    }

    function set(state, title, note) {
      verdict.dataset.state = state;
      vText.textContent = title;
      vNote.textContent = note;
    }

    function render() {
      var a = amps(),
          val = parseFloat(kw.value),
          isTT = tt.checked,
          hasG100 = g100.checked,
          isEPS = eps.checked;

      kwOut.textContent = val.toFixed(2);
      ampOut.textContent = a.toFixed(1);
      needle.style.left = Math.max(0, Math.min(100, (a / SCALE_MAX) * 100)) + '%';

      conv.textContent = phases === 1
        ? '16 A = 3.68 kW · 32 A = 7.36 kW · 60 A = 13.8 kW'
        : '16 A = 11.04 kW · 32 A = 22.08 kW · 60 A = 41.4 kW';

      if (scaleImg) {
        scaleImg.setAttribute('aria-label',
          'At ' + a.toFixed(1) + ' amps per phase. ' + vText.textContent);
      }

      /* --- above the fast-track band --- */
      if (a > 60) {
        set('over',
          'Above 60 A — beyond Form A1-2',
          'At ' + a.toFixed(1) + ' A per phase you are outside the Small Generation Installation ' +
          'procedures. This needs Form A1-1 or the full Standard Application Form, and a different ' +
          'timeline. Talk to us before you apply.');
        return;
      }

      /* --- not type tested: A1-2 is unavailable at any size --- */
      if (!isTT && a > 16) {
        set('warn',
          'Not type-tested — Form A1-2 is unavailable',
          'Form A1-2 requires every inverter to be fully type-tested and on the ENA register. ' +
          'Without that this becomes an A1-1 application with compliance evidence attached, ' +
          'at your cost. Worth checking the register before you assume — we can do that.');
        return;
      }

      /* --- at or below 16 A: notification territory --- */
      if (a <= 16) {
        set('under',
          'At or below 16 A — you probably don’t need us',
          'At ' + a.toFixed(1) + ' A per phase this normally falls under G98 or G99 SGI-1, where you ' +
          'connect and notify rather than apply and wait. We’d rather tell you that than take your money.');
        return;
      }

      /* --- island / EPS pushes off the fast track --- */
      if (isEPS) {
        set('warn',
          'Island mode — the fast track may not apply',
          'The ENA’s connection guide says systems designed to run in island mode during an outage fall ' +
          'outside the fast-track process. At ' + a.toFixed(1) + ' A per phase this likely needs the ' +
          'standard G99 route. We’ll confirm it with your DNO before anything is submitted.');
        return;
      }

      /* --- the two bands Form A1-2 covers --- */
      var band = a <= 32 ? 'SGI-2' : 'SGI-3';
      var limit = a <= 32 ? '16 A' : '32 A';

      if (!hasG100) {
        set('warn',
          'G99 ' + band + ' — but a G100 limiter is required',
          'At ' + a.toFixed(1) + ' A per phase this is ' + band + ', which requires a G100 export ' +
          'limitation scheme set to ' + limit + ' before Form A1-2 can be used. Fit one and you’re in ' +
          'scope — we can advise on the evidence the DNO will want.');
        return;
      }

      set('match',
        'G99 ' + band + ' — Form A1-2. This is exactly what we do.',
        'At ' + a.toFixed(1) + ' A per phase you’re in the Form A1-2 band, with a G100 scheme limiting ' +
        'export to ' + limit + '. The DNO must approve this before you connect.');
    }

    kw.addEventListener('input', render);
    tt.addEventListener('change', render);
    g100.addEventListener('change', render);
    eps.addEventListener('change', render);

    p1.addEventListener('click', function () {
      phases = 1;
      p1.setAttribute('aria-pressed', 'true');
      p3.setAttribute('aria-pressed', 'false');
      render();
    });
    p3.addEventListener('click', function () {
      phases = 3;
      p3.setAttribute('aria-pressed', 'true');
      p1.setAttribute('aria-pressed', 'false');
      render();
    });

    render();

    /* carry the instrument's answers into the application form */
    if (vCta) {
      vCta.addEventListener('click', function () {
        var fkw = document.getElementById('fkw'),
            fph = document.getElementById('fph'),
            fg100 = document.getElementById('fg100'),
            feps = document.getElementById('feps');
        if (fkw && !fkw.value) fkw.value = parseFloat(kw.value).toFixed(2);
        if (fph) fph.value = String(phases);
        if (fg100) fg100.checked = g100.checked;
        if (feps) feps.checked = eps.checked;
      });
    }
  }

  /* ============================================================
     APPLICATION FORM → existing checkout
     ============================================================ */
  var form = document.getElementById('applyForm');
  if (form) {
    var note = document.getElementById('formNote');
    var btn = document.getElementById('submitBtn');

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();

      /* validate */
      var invalid = null;
      Array.prototype.forEach.call(form.querySelectorAll('[required]'), function (el) {
        var ok = el.value.trim() !== '' &&
                 (el.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim()));
        el.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (!ok && !invalid) invalid = el;
      });

      if (invalid) {
        note.textContent = 'Please check the highlighted fields — we need those to start the application.';
        note.classList.add('err');
        invalid.focus();
        invalid.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
        return;
      }

      note.classList.remove('err');
      note.textContent = 'Saving your details and opening secure payment…';
      btn.disabled = true;

      /* collect */
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      data.g100 = document.getElementById('fg100').checked;
      data.eps = document.getElementById('feps').checked;
      data.submittedAt = new Date().toISOString();

      try { localStorage.setItem('aesir.application', JSON.stringify(data)); } catch (e) {}

      function go() { window.location.href = CHECKOUT_URL; }

      if (FORM_ENDPOINT) {
        fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }).then(go).catch(go);
      } else {
        setTimeout(go, 350);
      }
    });
  }
})();
