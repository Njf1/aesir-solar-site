/**
 * Tyl by NatWest — Fiserv IPG "Connect" hosted payment page.
 *
 * The signature rule, which is unforgiving:
 *   1. take every non-empty gateway-specified field, excluding hashExtended
 *   2. sort by FIELD NAME, plain ASCII ascending (not localeCompare)
 *   3. join the VALUES ONLY with a pipe
 *   4. HMAC-SHA256 with the shared secret as the KEY (never inside the string)
 *   5. base64 the raw digest
 *
 * hash_algorithm is itself part of the hashed string. Custom fields are not.
 */
import crypto from 'node:crypto';

export function hashExtended(fields, sharedSecret) {
  const names = Object.keys(fields)
    .filter(k => fields[k] !== undefined && fields[k] !== null && String(fields[k]) !== '')
    .filter(k => k !== 'hashExtended')
    .sort(); // code-unit order. localeCompare is case-insensitive and would break this.
  const str = names.map(k => String(fields[k])).join('|');
  return crypto.createHmac('sha256', sharedSecret).update(str, 'utf8').digest('base64');
}

/** Response hash on the browser redirect: approval_code|chargetotal|currency|txndatetime|storename */
export function responseHash({ approval_code, chargetotal, currency, txndatetime, storename }, secret) {
  const str = [approval_code, chargetotal, currency, txndatetime, storename].join('|');
  return crypto.createHmac('sha256', secret).update(str, 'utf8').digest('base64');
}

/** Constant-time compare so we don't leak the secret through timing. */
export function safeEqual(a, b) {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/**
 * txndatetime must be the CURRENT time in the declared timezone.
 * Vercel runs UTC, so during BST a naive timestamp is an hour out and rejected.
 */
export function txnDateTime(tz = 'Europe/London', now = new Date()) {
  const p = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).formatToParts(now).reduce((a, c) => (a[c.type] = c.value, a), {});
  return `${p.year}:${p.month}:${p.day}-${p.hour}:${p.minute}:${p.second}`;
}

/** EMV 3DS restricts the order id to A-Z a-z 0-9 and hyphen. */
export function orderId(prefix = 'AES') {
  const rand = crypto.randomBytes(6).toString('hex').toUpperCase();
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `${prefix}-${stamp}-${rand}`;
}
