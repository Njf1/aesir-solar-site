/**
 * Direct Tyl Classic Connect protocol for the checkout migration.
 * Original code, based on Fiserv's response-fields and Tyl HPP documentation.
 * Not connected to the live handlers yet. Never use this without durable
 * expected-attempt records and an atomic settlement/transaction uniqueness check.
 * Account prerequisite: extendedResponseHashSupported enabled by Tyl.
 */
import {createHmac, timingSafeEqual} from 'node:crypto';

export const TYL_ALGORITHM = 'HMACSHA512';
const MAX_FIELDS = 128;
const MAX_BYTES = 32768;
const error = code => Object.assign(new Error(code), {code});

// Preserve original field spelling/values for the provider's ASCII-sorted hash.
// Reject duplicate form keys before turning a URL-encoded callback into an object.
export function parseTylFields(input) {
  let pairs;
  if (typeof input === 'string' || Buffer.isBuffer(input)) {
    const raw = String(input);
    if (Buffer.byteLength(raw) > MAX_BYTES) throw error('response_too_large');
    pairs = [...new URLSearchParams(raw)];
  } else if (input && typeof input === 'object' && !Array.isArray(input)) {
    pairs = Object.entries(input);
  } else throw error('invalid_response');
  if (!pairs.length || pairs.length > MAX_FIELDS) throw error('invalid_response');
  const result = Object.create(null), seen = new Set();
  let size = 0;
  for (const [name, value] of pairs) {
    if (!/^[A-Za-z][A-Za-z0-9_]{0,79}$/.test(name) || typeof value !== 'string') throw error('invalid_field');
    const key = name.toLowerCase();
    if (seen.has(key)) throw error('duplicate_field');
    seen.add(key);
    size += Buffer.byteLength(name) + Buffer.byteLength(value);
    if (size > MAX_BYTES || /[\u0000-\u001f\u007f]/.test(value)) throw error('invalid_field');
    result[name] = value;
  }
  return result;
}

function signedValues(fields, excluded) {
  return Object.keys(fields).filter(name => name !== excluded && fields[name] !== '')
    .sort().map(name => fields[name]).join('|');
}
function sign(text, secret) {
  if (typeof secret !== 'string' || !secret) throw error('not_configured');
  return createHmac('sha512', secret).update(text, 'utf8').digest('base64');
}
function equalHash(expected, supplied) {
  // SHA-512 is 64 bytes; require canonical base64 instead of accepting odd encodings.
  if (typeof supplied !== 'string' || !/^[A-Za-z0-9+/]{86}==$/.test(supplied)) return false;
  const bytes = Buffer.from(supplied, 'base64'), wanted = Buffer.from(expected, 'base64');
  return bytes.length === wanted.length && timingSafeEqual(bytes, wanted);
}

export function signTylRequest(fields, secret) {
  const parsed = parseTylFields(fields);
  if (parsed.hash_algorithm !== TYL_ALGORITHM) throw error('invalid_algorithm');
  if (Object.keys(parsed).some(k => /^customParam_/i.test(k))) throw error('custom_fields_must_be_added_after_signing');
  return sign(signedValues(parsed, 'hashExtended'), secret);
}

// A basic response_hash authenticates amount/currency/time/approval, but not oid,
// status or transaction ID. Never fall back to it to authorize an application.
export function verifyTylResult(input, expected, secret) {
  const raw = parseTylFields(input);
  if (raw.hash_algorithm !== TYL_ALGORITHM) throw error('invalid_algorithm');
  if (!equalHash(sign(signedValues(raw, 'extended_response_hash'), secret), raw.extended_response_hash)) {
    throw error('unverified_response');
  }
  if (!expected || !/^[A-Za-z0-9-]{1,80}$/.test(expected.oid || '') ||
      !/^\d{4}:\d{2}:\d{2}-\d{2}:\d{2}:\d{2}$/.test(expected.txndatetime || '') ||
      expected.amount !== '300.00' || expected.currency !== '826' || !expected.store) throw error('invalid_expected_attempt');
  const b = Object.fromEntries(Object.entries(raw).map(([name, value]) => [name.toLowerCase(), value]));
  if (b.oid !== expected.oid || b.txndatetime !== expected.txndatetime ||
      b.chargetotal !== expected.amount || b.currency !== expected.currency ||
      b.txntype !== 'sale' || (b.storename && b.storename !== expected.store)) throw error('unexpected_transaction');
  const code = b.approval_code || '', status = b.status || '';
  const base = {attemptId: expected.oid, amountPence: 30000, currency: 'GBP'};
  if (status === 'APPROVED' && code.startsWith('Y')) {
    if (!/^[A-Za-z0-9_-]{1,100}$/.test(b.ipgtransactionid || '')) throw error('missing_transaction_id');
    return {...base, state: 'paid', transactionId: b.ipgtransactionid};
  }
  if (status === 'WAITING' && code.startsWith('?')) return {...base, state: 'pending'};
  if (['DECLINED', 'FAILED'].includes(status) && code.startsWith('N')) return {...base, state: 'declined'};
  throw error('inconsistent_result');
}
