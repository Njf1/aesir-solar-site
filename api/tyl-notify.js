/**
 * Server-to-server payment notification from Tyl.
 *
 * This, not the browser redirect, is the source of truth for fulfilment —
 * customers close tabs. Both may arrive for the same order, so anything done
 * here must be idempotent.
 *
 * Note: the notification hash format differs between Fiserv's and Tyl's own
 * documentation. We verify against Fiserv's pipe/HMAC form and LOG a mismatch
 * rather than rejecting, so a format difference cannot silently lose an order.
 * To be confirmed with Tyl integration support during test.
 */
import { responseHash, legacyNotificationHash, safeEqual } from '../lib/tyl.js';

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body;
  return Object.fromEntries(new URLSearchParams(String(req.body)));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  const b = parseBody(req);
  const secret = process.env.TYL_SHARED_SECRET;
  const store = process.env.TYL_STORE_ID;

  let verified = false;
  if (secret && b.txndatetime && b.approval_code) {
    const expected = responseHash({
      approval_code: b.approval_code,
      chargetotal: b.chargetotal,
      currency: b.currency,
      txndatetime: b.txndatetime,
      storename: store
    }, secret);
    const legacy = legacyNotificationHash({
      chargetotal: b.chargetotal, currency: b.currency, txndatetime: b.txndatetime,
      storename: store, approval_code: b.approval_code
    }, secret);
    verified = safeEqual(expected, b.notification_hash) ||
               safeEqual(expected, b.response_hash) ||
               safeEqual(legacy, b.notification_hash);
  }

  console.log('tyl notification', {
    oid: b.oid,
    status: b.status,
    approval: String(b.approval_code || '').slice(0, 40),
    total: b.chargetotal,
    verified,
    mpan: b.customParam_mpan,
    inverter: b.customParam_inverter,
    kw: b.customParam_kw
  });

  // Always 200 — a non-200 makes the gateway retry, and we have already
  // recorded the payload.
  return res.status(200).send('OK');
}
