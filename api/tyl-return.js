/**
 * Receives the customer's browser back from Tyl.
 *
 * The gateway sends results as an HTTP POST of hidden form fields — a static
 * page would 405 here, which is the most common way this integration is got
 * wrong. We verify the signature, then 302 to a normal page so a refresh
 * doesn't re-post (POST / Redirect / GET).
 */
import { responseHash, safeEqual } from '../lib/tyl.js';

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body;
  return Object.fromEntries(new URLSearchParams(String(req.body)));
}

export default async function handler(req, res) {
  const secret = process.env.TYL_SHARED_SECRET;
  const store = process.env.TYL_STORE_ID;

  // Tyl POSTs here; a GET means someone wandered in by hand.
  if (req.method !== 'POST') {
    return res.redirect(303, '/apply');
  }

  const b = parseBody(req);
  const ts = String(req.query?.ts || '');
  const wanted = String(req.query?.r || 'ok');

  let verified = false;
  if (secret && ts && b.approval_code) {
    const expected = responseHash({
      approval_code: b.approval_code,
      chargetotal: b.chargetotal,
      currency: b.currency,
      txndatetime: ts,
      storename: store
    }, secret);
    verified = safeEqual(expected, b.response_hash);
  }

  const status = String(b.status || '').toUpperCase();
  const code = String(b.approval_code || '');
  const approved = code.startsWith('Y') && status === 'APPROVED';
  const waiting = code.startsWith('?');

  // Never mark an order paid on an unverified response, and never on '?',
  // which means 3-D Secure initialised but has not finished.
  if (!verified) {
    console.error('tyl return failed verification', { oid: b.oid, status, code });
    return res.redirect(303, '/apply?payment=unverified');
  }
  if (waiting) return res.redirect(303, '/apply?payment=pending');
  if (!approved || wanted === 'fail') {
    return res.redirect(303, `/apply?payment=declined&reason=${encodeURIComponent(String(b.fail_reason || '').slice(0, 80))}`);
  }

  return res.redirect(303, `/success?order=${encodeURIComponent(b.oid || '')}`);
}
