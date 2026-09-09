/** Solar's direct Tyl / Fiserv Checkout API client. Server-side only.
 * Official Checkout Solution OpenAPI 1.0.7, inspected 2026-09-09.
 * NOT wired to public handlers until durable intake/settlement and Aesir Limited's
 * approved merchant configuration are ready. No AG/WooCommerce dependency.
 */
import {createHmac, randomUUID} from 'node:crypto';

const HOST = 'https://prod.emea.api.fiservapps.com';
const AMOUNT = 30000;
const CURRENCY = 'GBP';
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const identifier = v => typeof v === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(v);
const reference = v => typeof v === 'string' && /^[A-Za-z0-9-]{1,40}$/.test(v);
const fail = (code, uncertain = false) => Object.assign(new Error(code), {code, uncertain});

export function solarPaymentConfig(env = process.env) {
  const deployment = env.VERCEL_ENV || (env.NODE_ENV === 'production' ? 'production' : 'development');
  const mode = env.SOLAR_TYL_MODE;
  if (!['production','preview','development'].includes(deployment)) throw fail('invalid_deployment');
  if (!['live', 'sandbox'].includes(mode)) throw fail('payments_not_configured');
  // No sandbox override can enable test payments in the public production site.
  if (deployment === 'production' && mode !== 'live') throw fail('sandbox_in_production');
  if (deployment !== 'production' && mode === 'live') throw fail('live_outside_production');
  if (typeof env.SOLAR_TYL_API_KEY !== 'string' || !env.SOLAR_TYL_API_KEY ||
      typeof env.SOLAR_TYL_API_SECRET !== 'string' || !env.SOLAR_TYL_API_SECRET ||
      !/^\d{5,20}$/.test(env.SOLAR_TYL_STORE_ID || '')) throw fail('payments_not_configured');
  let origin;
  try { origin = new URL(env.SOLAR_CHECKOUT_ORIGIN); } catch { throw fail('invalid_callback_origin'); }
  if (origin.protocol !== 'https:' || origin.username || origin.password ||
      origin.pathname !== '/' || origin.search || origin.hash) throw fail('invalid_callback_origin');
  return Object.freeze({mode, apiBase:HOST + (mode === 'sandbox' ? '/sandbox' : '') + '/exp/v1',
    apiKey:env.SOLAR_TYL_API_KEY, apiSecret:env.SOLAR_TYL_API_SECRET,
    storeId:env.SOLAR_TYL_STORE_ID, origin:origin.origin});
}

export function commerceSignature(apiKey, secret, requestId, timestamp, body) {
  return createHmac('sha256', secret).update(apiKey + requestId + timestamp + body, 'utf8').digest('base64');
}

function assertAttempt(attempt) {
  if (!object(attempt) || !reference(attempt.merchantTransactionId) ||
      attempt.amountPence !== AMOUNT || attempt.currency !== CURRENCY) throw fail('invalid_expected_attempt');
}

export function buildSolarCheckout(config, attempt) {
  assertAttempt(attempt);
  const ref = encodeURIComponent(attempt.merchantTransactionId);
  return {
    storeId:config.storeId, merchantTransactionId:attempt.merchantTransactionId,
    transactionType:'SALE', transactionOrigin:'ECOM',
    transactionAmount:{currency:CURRENCY, total:300, components:{subtotal:250, vatAmount:50}},
    checkoutSettings:{locale:'en_GB', webHooksUrl:config.origin + '/api/tyl-notify',
      redirectBackUrls:{successUrl:config.origin + '/success.html?ref=' + ref,
        failureUrl:config.origin + '/apply.html?payment=declined&ref=' + ref}}
  };
}

function pennies(value) {
  // Missing/zero/non-numeric values stay distinct. Do not round a wrong amount
  // into a match; allow only an exact decimal GBP value with at most two places.
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const text = String(value);
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
  const [whole, fraction = ''] = text.split('.');
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(result) ? result : null;
}

// Accept ONLY a response fetched from the gateway, never an inbound webhook body.
// Uses the documented top-level retrieval model, not the create-checkout wrapper.
export function verifySolarCheckout(data, expected) {
  assertAttempt(expected);
  if (!identifier(expected.checkoutId) || !/^\d{5,20}$/.test(expected.storeId || '') ||
      !['sandbox','live'].includes(expected.mode)) throw fail('invalid_expected_attempt');
  if (!object(data) || data.checkoutId !== expected.checkoutId) throw fail('checkout_mismatch');
  if (data.storeId !== expected.storeId) throw fail('store_mismatch');
  if (data.requestSent?.merchantTransactionId !== expected.merchantTransactionId) throw fail('attempt_mismatch');
  if (data.transactionType !== 'SALE') throw fail('operation_mismatch');
  const base = {checkoutId:expected.checkoutId, merchantTransactionId:expected.merchantTransactionId,
    storeId:expected.storeId, mode:expected.mode};
  const status = data.transactionStatus;
  if (status === 'APPROVED') {
    if (data.approvedAmount?.currency !== CURRENCY || pennies(data.approvedAmount?.total) !== AMOUNT) throw fail('amount_or_currency_mismatch');
    const detail = data.ipgTransactionDetails;
    if (!object(detail) || !identifier(detail.ipgTransactionId) ||
        typeof detail.approvalCode !== 'string' || !detail.approvalCode.startsWith('Y') ||
        (detail.transactionResult !== undefined && detail.transactionResult !== 'APPROVED') ||
        (detail.transactionStatus !== undefined && detail.transactionStatus !== 'APPROVED')) throw fail('inconsistent_approval');
    // This is an approved SALE, not proof of bank settlement. The persistence
    // layer must atomically bind this unique transaction and create one work item.
    return {...base,state:'approved',amountPence:AMOUNT,currency:CURRENCY,transactionId:detail.ipgTransactionId};
  }
  if (['INITIATED','WAITING'].includes(status)) return {...base,state:'pending'};
  if (['FAILED','DECLINED','FRAUD'].includes(status)) return {...base,state:'declined'};
  if (status === 'PARTIAL') return {...base,state:'review'};
  throw fail('unknown_payment_status');
}

async function responseJSON(response) {
  if (Number(response.headers.get('content-length') || 0) > 65536) throw fail('response_too_large');
  const reader = response.body?.getReader();
  if (!reader) throw fail('invalid_provider_response');
  let size = 0;
  const chunks = [];
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 65536) {await reader.cancel();throw fail('response_too_large');}
      chunks.push(value);
    }
    const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!object(data)) throw fail('invalid_provider_response');
    return data;
  } catch (error) {
    if (error.code) throw error;
    throw fail('invalid_provider_response');
  } finally {reader.releaseLock();}
}

function checkoutURL(value, mode) {
  let url;
  try { url = new URL(value); } catch { throw fail('invalid_checkout_url', true); }
  const allowed = mode === 'sandbox' ? ['checkout-lane.com','ci.checkout-lane.com'] : ['checkout-lane.com'];
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !allowed.includes(url.hostname)) throw fail('invalid_checkout_url', true);
  return url.href;
}

export function createSolarPayments(env = process.env, {fetchImpl = globalThis.fetch, requestId = randomUUID, now = Date.now, timeoutMs = 8000} = {}) {
  const config = solarPaymentConfig(env);
  async function call(method, path, payload) {
    const id = requestId(), timestamp = String(now()), body = payload === undefined ? '' : JSON.stringify(payload);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(config.apiBase + path, {
        method, redirect:'error', cache:'no-store', signal:controller.signal,
        headers:{'Content-Type':'application/json','Api-Key':config.apiKey,'Client-Request-Id':id,
          Timestamp:timestamp,'Message-Signature':commerceSignature(config.apiKey,config.apiSecret,id,timestamp,body)},
        ...(method === 'POST' ? {body} : {})
      });
      if (response.status !== (method === 'POST' ? 201 : 200)) {
        await response.body?.cancel();
        throw fail('provider_http_' + response.status, method === 'POST' && ![400,401,403].includes(response.status));
      }
      return {data:await responseJSON(response),requestId:id};
    } catch (error) {
      // An interrupted creation can have succeeded at the bank. Never retry it
      // automatically or release a second checkout against a fresh application.
      if (typeof error.code === 'string') {
        if (method === 'POST' && !['provider_http_400','provider_http_401','provider_http_403'].includes(error.code)) error.uncertain = true;
        throw error;
      }
      throw fail(controller.signal.aborted ? 'provider_timeout' : 'provider_unavailable', method === 'POST');
    } finally {clearTimeout(timer);}
  }
  return Object.freeze({
    async createCheckout(attempt) {
      const {data,requestId:id} = await call('POST','/checkouts',buildSolarCheckout(config,attempt));
      const c = data.checkout;
      if (!object(c) || !identifier(c.checkoutId) || c.storeId !== config.storeId) throw fail('invalid_checkout_response',true);
      return {checkoutId:c.checkoutId, redirectionUrl:checkoutURL(c.redirectionUrl,config.mode), storeId:config.storeId,
        merchantTransactionId:attempt.merchantTransactionId,amountPence:AMOUNT,currency:CURRENCY,mode:config.mode,requestId:id};
    },
    async verifyCheckout(expected) {
      assertAttempt(expected);
      if (!identifier(expected.checkoutId) || expected.storeId !== config.storeId || expected.mode !== config.mode) throw fail('invalid_expected_attempt');
      const {data} = await call('GET','/checkouts/' + encodeURIComponent(expected.checkoutId));
      return verifySolarCheckout(data,expected);
    }
  });
}
