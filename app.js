/* ============================================================
   Aesir Solar
   Everything here is progressive enhancement. The page is fully
   readable and usable with JavaScript disabled — nothing is
   hidden until JS decides to show it.
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- where the paid application lives (existing WooCommerce + Tyl rail) ----
     WooCommerce increments quantity on every ?add-to-cart hit, so a customer who
     goes back and resubmits would be billed twice. We only add once per 30-minute
     window and otherwise send them to the existing cart.
     The permanent fix is "Sold individually" on product 308 in WooCommerce. */
  var CART_URL   = 'https://aesirsolar.co.uk/cart/';
  var ADD_TO_CART = CART_URL + '?add-to-cart=308';
  var ADD_TTL_MS = 30 * 60 * 1000;

  function checkoutUrl() {
    try {
      var last = parseInt(localStorage.getItem('aesir.addedAt') || '0', 10);
      if (last && (Date.now() - last) < ADD_TTL_MS) return CART_URL;
      localStorage.setItem('aesir.addedAt', String(Date.now()));
    } catch (e) {}
    return ADD_TO_CART;
  }

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


  /* ============ mobile menu ============ */
  (function menu() {
    var btn = document.getElementById('navToggle');
    var links = document.getElementById('navLinks');
    var header = document.querySelector('.nav');
    if (!btn || !links) return;

    function setHeight() {
      if (header) {
        document.documentElement.style.setProperty(
          '--navh', header.getBoundingClientRect().height + 'px');
      }
    }
    setHeight();
    window.addEventListener('resize', setHeight);

    function close() {
      links.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Open menu');
      document.body.classList.remove('nav-open');
    }
    function open() {
      setHeight();
      links.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      btn.setAttribute('aria-label', 'Close menu');
      document.body.classList.add('nav-open');
    }

    btn.addEventListener('click', function () {
      links.classList.contains('open') ? close() : open();
    });
    /* tapping a link, pressing escape, or growing past the breakpoint all close it */
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && links.classList.contains('open')) { close(); btn.focus(); }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) close();
    });
  })();

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

  /* ============ scroll reveal ============
     Decorative only. Nothing interactive is ever hidden, and a failsafe
     reveals everything after 1.2s no matter what the observer does — a
     visitor must never meet an invisible page. */
  if (!reduced && 'IntersectionObserver' in window) {
    var targets = document.querySelectorAll(
      '.sect .eyebrow, .sect .h2, .sect .lede, .flow, .stakes, .quote, ' +
      '.meter, .proof-note, .small-print, .steps, .honest, .price-copy'
    );
    var revealAll = function () {
      Array.prototype.forEach.call(targets, function (el) { el.classList.add('in'); });
    };

    Array.prototype.forEach.call(targets, function (el) { el.classList.add('rv'); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });

    Array.prototype.forEach.call(targets, function (el) { io.observe(el); });

    /* failsafe + anyone arriving on a deep link */
    setTimeout(revealAll, 1200);
    if (location.hash) revealAll();
    window.addEventListener('hashchange', revealAll);
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

    /* carry the instrument's answers across to the application page */
    if (vCta) {
      vCta.addEventListener('click', function () {
        try {
          localStorage.setItem('aesir.prefill', JSON.stringify({
            kw: parseFloat(kw.value).toFixed(2),
            phases: phases,
            g100: g100.checked,
            eps: eps.checked
          }));
        } catch (e) {}
      });
    }
  }

  /* ---- receive those answers on the application page ---- */
  (function prefill() {
    var fkw = document.getElementById('fkw');
    if (!fkw) return;
    var raw;
    try { raw = localStorage.getItem('aesir.prefill'); } catch (e) { return; }
    if (!raw) return;
    try {
      var d = JSON.parse(raw);
      var fph = document.getElementById('fph'),
          fg = document.getElementById('fg100'),
          fe = document.getElementById('feps');
      if (d.kw && !fkw.value) fkw.value = d.kw;
      if (fph && d.phases) fph.value = String(d.phases);
      if (fg) fg.checked = !!d.g100;
      if (fe) fe.checked = !!d.eps;
    } catch (e) {}
  })();

  /* ============================================================
     APPLICATION FORM → existing checkout
     ============================================================ */
  var form = document.getElementById('applyForm');
  if (form) {
    var note = document.getElementById('formNote');
    var btn = document.getElementById('submitBtn');

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();

      /* validate — checkboxes are checked, everything else has a value */
      var invalid = null;
      Array.prototype.forEach.call(form.querySelectorAll('[required]'), function (el) {
        var ok;
        if (el.type === 'checkbox') {
          ok = el.checked;
        } else if (el.type === 'email') {
          ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim());
        } else {
          ok = el.value.trim() !== '';
        }
        el.setAttribute('aria-invalid', ok ? 'false' : 'true');
        var row = el.closest('.chk');
        if (row) row.classList.toggle('invalid', !ok);
        if (!ok && !invalid) invalid = el;
      });

      if (invalid) {
        note.textContent = invalid.type === 'checkbox'
          ? 'Please tick both boxes to confirm you accept the terms and understand the privacy policy.'
          : 'Please check the highlighted fields — we need those to start the application.';
        note.classList.add('err');
        invalid.focus();
        (invalid.closest('.chk') || invalid)
          .scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
        return;
      }

      note.classList.remove('err');
      note.textContent = 'Saving your details and opening secure payment…';
      btn.disabled = true;

      /* collect */
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      data.g100 = !!(document.getElementById('fg100') || {}).checked;
      data.eps = !!(document.getElementById('feps') || {}).checked;
      data.acceptedTerms = !!(document.getElementById('agree') || {}).checked;
      data.acceptedPrivacy = !!(document.getElementById('privacy') || {}).checked;
      data.submittedAt = new Date().toISOString();
      data.amountGBP = '300.00';

      try { localStorage.setItem('aesir.application', JSON.stringify(data)); } catch (e) {}

      /* Payment routes, in order of preference:
           1. Tyl by NatWest  — settles direct to the company account
           2. Stripe          — built and dormant, ready if Tyl stalls
           3. the old checkout — so nobody trying to pay is ever stranded  */
      function fallbackCheckout() { window.location.href = checkoutUrl(); }

      function postForm(action, fields) {
        var f = document.createElement('form');
        f.method = 'POST';
        f.action = action;
        f.style.display = 'none';
        Object.keys(fields).forEach(function (k) {
          var i = document.createElement('input');
          i.type = 'hidden'; i.name = k; i.value = fields[k];
          f.appendChild(i);
        });
        document.body.appendChild(f);
        f.submit();
      }

      function payFailed() {
        note.textContent =
          'We couldn\u2019t open the payment page. Please try again, or email ' +
          'hello@aesirsolar.co.uk and we\u2019ll take it from there.';
        note.classList.add('err');
        btn.disabled = false;
      }

      function tryStripe() {
        return fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
          .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
          .then(function (r) {
            if (r.ok && r.body && r.body.url) { window.location.href = r.body.url; return; }
            if (r.body && r.body.error === 'stripe_not_configured') { fallbackCheckout(); return; }
            payFailed();
          })
          .catch(fallbackCheckout);
      }

      fetch('/api/tyl-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
        .then(function (r) {
          if (r.ok && r.body && r.body.action && r.body.fields) {
            try { localStorage.setItem('aesir.orderId', r.body.orderId); } catch (e) {}
            postForm(r.body.action, r.body.fields);
            return;
          }
          return tryStripe();
        })
        .catch(function () { return tryStripe(); });
    });
  }
})();

/* ---------------------------------------------------------------
   Live production figures on the homepage.
   Enhancement only — sensible values are already in the markup.
   --------------------------------------------------------------- */
(function realRoof() {
  var life = document.getElementById('rrLife');
  if (!life) return;
  fetch('/api/tigo')
    .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(function (d) {
      var n = function (v) { return v.toLocaleString('en-GB'); };
      life.innerHTML = n(d.lifetime.kwh) + '<small>kWh</small>';
      document.getElementById('rrSub').textContent =
        'about ' + n(d.lifetime.kwhPerYear) + ' kWh a year, from one roof';
      document.getElementById('rrToday').innerHTML = d.today.kwh.toFixed(1) + '<small>kWh</small>';
      document.getElementById('rrRec').innerHTML = n(d.lifetime.reclaimedKwh) + '<small>kWh</small>';
    })
    .catch(function () {
      document.getElementById('rrToday').innerHTML = '206.4<small>kWh</small>';
      document.getElementById('rrRec').innerHTML = '2,561<small>kWh</small>';
    });
})();

/* ---------------------------------------------------------------
   Payment outcome, when the gateway sends the customer back.
   --------------------------------------------------------------- */
(function payStatus() {
  var slot = document.getElementById('payStatus');
  if (!slot) return;
  var q = new URLSearchParams(location.search);
  var p = q.get('payment');
  if (!p) return;

  var msgs = {
    declined: ['bad', 'That payment didn\u2019t go through',
      'Your card was declined and you have not been charged. Check the details and try again, ' +
      'or email hello@aesirsolar.co.uk and we\u2019ll sort it out with you.'],
    pending: ['', 'Your bank is still checking that payment',
      'It hasn\u2019t completed yet. Give it a minute and check your email before trying again \u2014 ' +
      'we don\u2019t want to take it twice.'],
    unverified: ['bad', 'We couldn\u2019t confirm that payment',
      'For your protection we haven\u2019t treated it as complete. Please don\u2019t re-enter your card. ' +
      'Email hello@aesirsolar.co.uk with the time you tried and we\u2019ll check it against our records.']
  };
  var m = msgs[p];
  if (!m) return;
  var reason = q.get('reason');
  slot.innerHTML = '<div class="pay-msg ' + m[0] + '"><b>' + m[1] + '</b>' + m[2] +
    (reason ? ' <span style="color:var(--muted-2)">(' + reason.replace(/[<>]/g, '') + ')</span>' : '') + '</div>';
  slot.scrollIntoView({ block: 'center', behavior: 'smooth' });
})();
