/**
 * Creates a Stripe Checkout Session for one G99 Form A1-2 application.
 *
 * Deliberately dependency-free — it talks to Stripe's REST API with fetch, so
 * there is no build step and nothing to keep patched.
 *
 * Environment variables (set in Vercel, never in the repo):
 *   STRIPE_SECRET_KEY    required.  sk_live_… or sk_test_…
 *   STRIPE_TAX_RATE_ID   optional.  A 20% VAT rate created in the Stripe
 *                                   dashboard. When set, the customer is
 *                                   charged £250.00 + VAT as two lines, so the
 *                                   receipt shows the VAT properly. When unset,
 *                                   we charge a single £300.00 line instead.
 */

const NET_PENCE = 25000;   // £250.00
const GROSS_PENCE = 30000; // £250.00 + 20% VAT

/** Stripe's API is form-encoded, including nested keys like line_items[0][price_data][currency]. */
function toForm(obj, prefix, out) {
  out = out || new URLSearchParams();
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value === undefined || value === null || value === '') continue;
    const name = prefix ? `${prefix}[${key}]` : key;
    if (typeof value === 'object' && !Array.isArray(value)) {
      toForm(value, name, out);
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (typeof item === 'object') toForm(item, `${name}[${i}]`, out);
        else out.append(`${name}[${i}]`, String(item));
      });
    } else {
      out.append(name, String(value));
    }
  }
  return out;
}

/** Stripe caps metadata values at 500 characters. */
const clip = (v, n = 480) =>
  v === undefined || v === null || v === '' ? undefined : String(v).slice(0, n);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    // Not configured yet — tell the client so it can fall back gracefully
    // rather than stranding a customer who is trying to pay us.
    return res.status(503).json({ error: 'stripe_not_configured' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  // The email is the only thing we genuinely cannot proceed without.
  const email = String(body.email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return res.status(400).json({ error: 'invalid_email' });
  }

  const origin =
    req.headers.origin ||
    (req.headers.host ? `https://${req.headers.host}` : 'https://aesirsolar.co.uk');

  const taxRate = process.env.STRIPE_TAX_RATE_ID;

  const lineItem = {
    quantity: 1,
    price_data: {
      currency: 'gbp',
      unit_amount: taxRate ? NET_PENCE : GROSS_PENCE,
      product_data: {
        name: 'G99 Form A1-2 connection application',
        description: taxRate
          ? 'Prepared, submitted to your DNO and chased to a decision.'
          : 'Prepared, submitted to your DNO and chased to a decision. £250.00 + £50.00 VAT.',
      },
    },
  };
  if (taxRate) lineItem.tax_rates = [taxRate];

  const payload = {
    mode: 'payment',
    // Quantity is fixed at one. This is why the old cart could double-charge
    // and this cannot.
    line_items: [lineItem],
    customer_email: email,
    success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/apply?cancelled=1`,
    payment_intent_data: {
      description: `G99 A1-2 — ${clip(body.postcode, 12) || 'site TBC'}`,
    },
    // Everything the application actually needs, travelling with the payment
    // so it lands in the Stripe dashboard against the order.
    metadata: {
      company: clip(body.company),
      contact: clip(body.contact),
      phone: clip(body.phone),
      accreditation: clip(body.accreditation),
      site_address: clip(body.address),
      postcode: clip(body.postcode),
      mpan: clip(body.mpan),
      inverter: clip(body.inverter),
      type_test_ref: clip(body.typetest),
      output_kw: clip(body.kw),
      phases: clip(body.phases),
      storage_kwh: clip(body.storage),
      g100_fitted: body.g100 ? 'yes' : 'no',
      island_mode: body.eps ? 'yes' : 'no',
      target_commissioning: clip(body.target),
      notes: clip(body.notes),
      accepted_terms: body.acceptedTerms ? 'yes' : 'no',
      accepted_privacy: body.acceptedPrivacy ? 'yes' : 'no',
    },
  };

  try {
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Stripe-Version': '2024-06-20',
      },
      body: toForm(payload).toString(),
    });

    const data = await r.json();

    if (!r.ok) {
      console.error('stripe error', data && data.error);
      return res.status(502).json({
        error: 'stripe_rejected',
        detail: (data && data.error && data.error.message) || 'Unknown error',
      });
    }

    return res.status(200).json({ url: data.url, id: data.id });
  } catch (err) {
    console.error('checkout failed', err);
    return res.status(500).json({ error: 'checkout_failed' });
  }
}
