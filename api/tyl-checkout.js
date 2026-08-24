/**
 * Builds a signed Tyl (Fiserv IPG Connect) hosted-payment request.
 *
 * Returns the gateway URL and the exact field set the browser must POST.
 * The shared secret never leaves this function — signing in the browser would
 * hand anyone the ability to charge against the store.
 *
 * Environment variables (set in Vercel, never in the repo):
 *   TYL_STORE_ID       required. ~11 digits, emailed by Tyl.
 *   TYL_SHARED_SECRET  required. Emailed separately by Tyl.
 *   TYL_GATEWAY_URL    required for live. Tyl email it at go-live; the regional
 *                      host varies, so it is never hardcoded.
 *                      Test: https://test.ipg-online.com/connect/gateway/processing
 */
import { hashExtended, txnDateTime, orderId } from '../lib/tyl.js';

const NET_PENCE = 25000;
const GROSS = '300.00';        // £250.00 + 20% VAT
const CURRENCY_GBP = '826';    // numeric ISO 4217
const TZ = 'Europe/London';

const clean = (v, n = 96) =>
  v === undefined || v === null ? '' : String(v).replace(/[\r\n|]/g, ' ').trim().slice(0, n);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const store = process.env.TYL_STORE_ID;
  const secret = process.env.TYL_SHARED_SECRET;
  const gateway = process.env.TYL_GATEWAY_URL;

  if (!store || !secret || !gateway) {
    return res.status(503).json({ error: 'tyl_not_configured' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  const email = clean(body.email, 120);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return res.status(400).json({ error: 'invalid_email' });
  }

  const origin = req.headers.origin ||
    (req.headers.host ? `https://${req.headers.host}` : 'https://aesirsolar.co.uk');

  const oid = orderId();
  const txndatetime = txnDateTime(TZ);   // computed ONCE and reused; recomputing breaks the hash

  // We must know the original txndatetime to verify the response hash later, and
  // we have no database — so it travels in our own return URL. An attacker can
  // change it, but then the returned hash simply will not verify.
  const ret = (path) =>
    `${origin}/api/tyl-return?oid=${encodeURIComponent(oid)}` +
    `&ts=${encodeURIComponent(txndatetime)}&r=${path}`;

  // Gateway-specified fields only — these are what get hashed.
  const fields = {
    txntype: 'sale',
    timezone: TZ,
    txndatetime,
    hash_algorithm: 'HMACSHA256',
    storename: store,
    chargetotal: GROSS,
    currency: CURRENCY_GBP,
    checkoutoption: 'combinedpage',
    oid,
    responseSuccessURL: ret('ok'),
    responseFailURL: ret('fail'),
    transactionNotificationURL: `${origin}/api/tyl-notify`,
    // Billing detail materially improves 3-D Secure outcomes. The hosted page
    // does not require it, so omitting it fails silently — send what we have.
    bname: clean(body.contact) || clean(body.company),
    baddr1: clean(body.address),
    bcity: clean(body.city) || clean(body.town),
    bzip: clean(body.postcode, 12),
    bcountry: 'GB',
    phone: clean(body.phone, 24),
    email
  };

  fields.hashExtended = hashExtended(fields, secret);

  // Custom fields ride along and are echoed back, but are NOT hashed — so they
  // must be added after signing.
  const extras = {
    customParam_company: clean(body.company),
    customParam_mpan: clean(body.mpan, 20),
    customParam_inverter: clean(body.inverter),
    customParam_kw: clean(body.kw, 12),
    customParam_phases: clean(body.phases, 4),
    customParam_g100: body.g100 ? 'yes' : 'no',
    customParam_eps: body.eps ? 'yes' : 'no'
  };
  for (const [k, v] of Object.entries(extras)) if (v) fields[k] = v;

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    action: gateway,
    fields,
    orderId: oid,
    amount: GROSS,
    net: (NET_PENCE / 100).toFixed(2)
  });
}
