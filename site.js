/* Supporting-page enhancement only. No requests, telemetry, storage writes,
   URL rewriting, status verification or provider logic belong in this file. */
(function () {
  'use strict';
  var form = document.getElementById('applyForm');
  var slot = document.getElementById('payStatus');
  var query = new URLSearchParams(window.location.search);

  function returnMessage() {
    if (!slot) return;
    var payment = query.get('payment');
    var message = null;
    if (query.get('cancelled') === '1') {
      message = ['Payment was not confirmed',
        'You returned from a cancelled payment step. This page cannot confirm whether a charge or application was recorded. If you are unsure, contact us before trying another payment.'];
    } else if (payment === 'pending') {
      message = ['Payment confirmation is still needed',
        'The return link reports a pending payment. This page cannot verify its final status. Contact us before trying another payment.'];
    } else if (payment === 'declined') {
      message = ['Payment was not confirmed',
        'The return link reports a declined payment. This page cannot verify whether a charge was made or an application was received. If the outcome is unclear, contact us before trying another payment.'];
    } else if (payment === 'unverified') {
      message = ['We could not confirm that payment',
        'This page cannot verify a payment or receipt of your application. Please do not enter your card again while the outcome is uncertain. Contact us with the time you tried and any reference you have.'];
    } else if (payment) {
      message = ['Payment status is unverified',
        'A return-link value does not confirm a payment or an application. Contact us with any reference you have before trying another payment.'];
    }
    // Replace the legacy return copy after app.js runs. Never inject query text.
    slot.replaceChildren();
    slot.hidden = !message;
    if (!message) return;
    var title = document.createElement('strong'); title.textContent = message[0];
    var body = document.createElement('p'); body.textContent = message[1];
    var contact = document.createElement('p');
    var link = document.createElement('a'); link.href = 'mailto:hello@aesirsolar.co.uk'; link.textContent = 'hello@aesirsolar.co.uk';
    contact.append(link); slot.append(title, body, contact);
  }

  if (form) {
    // Font enlargement can leave a wide viewport with narrow paired controls.
    // Observe layout once per change; no animation loop or provider dependency.
    var sizingControl = form.querySelector('input:not([type=checkbox])');
    function formLayout() {
      if (!sizingControl) return;
      var enlarged = parseFloat(getComputedStyle(sizingControl).fontSize) > 22;
      if (document.body.dataset.largeForm !== String(enlarged)) document.body.dataset.largeForm = String(enlarged);
    }
    formLayout();
    if (window.ResizeObserver && sizingControl) {
      var formResize = new ResizeObserver(formLayout); formResize.observe(sizingControl);
      window.addEventListener('pagehide', function (event) { if (!event.persisted) formResize.disconnect(); });
    }
    var button = document.getElementById('submitBtn');
    var controller = document.getElementById('application-controller');
    var availability = document.getElementById('application-availability');
    var ready = false, failed = false;
    // Prevent a native or repeated submission before the existing handler has
    // loaded. Without JS the disabled default submit button also blocks Enter.
    form.addEventListener('submit', function (event) {
      if (!ready || button.disabled) { event.preventDefault(); event.stopImmediatePropagation(); }
    }, true);
    function controllerError(event) {
      if (event.filename && new URL(event.filename, location.href).pathname === '/app.js') failed = true;
    }
    window.addEventListener('error', controllerError);
    function complete(ok) {
      window.removeEventListener('error', controllerError);
      ready = ok && !failed;
      button.disabled = !ready;
      if (availability) {
        availability.hidden = ready;
        if (!ready) {
          var message = availability.querySelector('span');
          if (message) message.textContent = 'Online payment could not be prepared. Your form has not been submitted. Please email us to discuss the application.';
        }
      }
      returnMessage();
    }
    if (controller) {
      controller.addEventListener('load', function () { complete(true); }, {once:true});
      controller.addEventListener('error', function () { complete(false); }, {once:true});
    } else complete(false);
  }

  // Values are offered only as user-supplied references, never as verification.
  var reference = document.getElementById('return-reference');
  if (reference) {
    var value = query.get('order') || query.get('session_id');
    if (value) {
      reference.querySelector('code').textContent = value.slice(0, 256);
      reference.hidden = false;
    }
  }
})();
