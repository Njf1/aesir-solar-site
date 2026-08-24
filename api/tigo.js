/**
 * Live production data for the Premier Composites array.
 *
 * Reads the Tigo "Public View" the system owner deliberately published, and
 * re-serves it as clean JSON so the site can render it in our own design
 * instead of embedding Tigo's.
 *
 * Notes that matter:
 *  - Tigo batches from the logger every ~10 minutes and takes ~10 more to
 *    process, so figures run 10–20 minutes behind. We surface that, rather
 *    than pretending it ticks live.
 *  - All energy is DC measured at the modules. It reads 2–5% above the
 *    inverter's AC output. Say "generated at the panels", never "exported".
 *  - "Reclaimed" is Tigo's modelled estimate of energy recovered by the TS4
 *    optimisers, not a directly measured quantity.
 *  - Personal data on the account (contact name, email, street) is stripped
 *    here and never leaves this function.
 */

const PUBLIC_URL = process.env.TIGO_PUBLIC_URL || 'https://ei.tigoenergy.com/p/N82W9qirW4q4';
const SYSTEM_ID = process.env.TIGO_SYSTEM_ID || '108848';
const BASE = 'https://ei.tigoenergy.com';

/** The public page hands out a short-lived bearer token as the wssJwt cookie. */
async function getToken() {
  const r = await fetch(PUBLIC_URL, { headers: { 'User-Agent': 'aesirsolar.co.uk' } });
  if (!r.ok) throw new Error(`public page ${r.status}`);
  const raw = r.headers.getSetCookie ? r.headers.getSetCookie() : [r.headers.get('set-cookie') || ''];
  for (const c of raw) {
    const m = /(?:^|,\s*)wssJwt=([^;]+)/.exec(c);
    if (m) return m[1];
  }
  throw new Error('no token on public page');
}

async function api(path, token) {
  const r = await fetch(BASE + path, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      Referer: PUBLIC_URL
    }
  });
  if (!r.ok) throw new Error(`${path} → ${r.status}`);
  return r.json();
}

const today = () => new Date().toISOString().slice(0, 10);

export default async function handler(req, res) {
  try {
    const token = await getToken();
    const d = today();

    const [lifetime, day, chart, view] = await Promise.all([
      api(`/api/v4/fleet/system/overview/data-lifetime?sysid=${SYSTEM_ID}&range=lifetime`, token),
      api(`/api/v4/fleet/system/overview/data-lifetime?sysid=${SYSTEM_ID}&range=day`, token),
      api(`/api/v4/data/aggregate?systemId=${SYSTEM_ID}&view=solar&type=bar&agg=hour` +
          `&start=${d}&end=${d}&output=echart&reclaimed=true`, token),
      api(`/api/v4/systems/view/${SYSTEM_ID}?includes=details`, token)
    ]);

    // hourly series, Wh → kWh, nulls dropped
    const total = (chart.series || []).find(s => s.id === 'solar_total');
    const hourly = (total?.data || [])
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([t, v]) => ({ hour: Number(String(t).slice(11, 13)), kwh: +(v / 1000).toFixed(2) }));

    const commissioned = view?.turn_on_date || view?.comissioned || null;
    let years = null, perYear = null;
    if (commissioned) {
      years = (Date.now() - new Date(commissioned).getTime()) / (365.25 * 24 * 3600 * 1000);
      perYear = Math.round((lifetime.energy / 1000) / years);
    }

    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');
    return res.status(200).json({
      site: {
        name: view?.name ?? 'Premier Composites',
        county: view?.state === 'England' ? view?.city : view?.state,
        postcodeArea: (view?.zip || '').split(' ')[0] || null,
        latitude: view?.latitude ?? null,
        longitude: view?.longitude ?? null,
        commissioned,
        yearsRunning: years ? +years.toFixed(2) : null,
        acRatingKw: view?.power_rating ? view.power_rating / 1000 : null,
        modules: 126,
        lastOnline: view?.details?.last_online ?? null
      },
      lifetime: {
        kwh: Math.round(lifetime.energy / 1000),
        reclaimedKwh: Math.round(lifetime.reclaimed / 1000),
        reclaimedPct: +((lifetime.reclaimed / lifetime.energy) * 100).toFixed(2),
        kwhPerYear: perYear
      },
      today: {
        date: d,
        kwh: +(day.energy / 1000).toFixed(2),
        reclaimedKwh: +(day.reclaimed / 1000).toFixed(2),
        peakHourKw: hourly.length ? Math.max(...hourly.map(h => h.kwh)) : null,
        hourly
      },
      meta: {
        source: 'Tigo Energy Intelligence, public view',
        measurement: 'DC at the modules; typically 2–5% above inverter AC output',
        reclaimedBasis: 'Tigo modelled estimate of energy recovered from shading and mismatch',
        latency: 'Tigo batches every ~10 minutes and processes for ~10 more, so figures run 10–20 minutes behind',
        fetchedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('tigo feed failed', err);
    return res.status(503).json({ error: 'tigo_unavailable', detail: String(err.message || err) });
  }
}
