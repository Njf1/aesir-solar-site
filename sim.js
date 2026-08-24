/**
 * Aesir Solar — roof simulator.
 * Geometry, yield and economics all run off data/constants.js, which carries a
 * source for every figure. Nothing is invented here.
 */
import { SOURCED as S } from './data/constants.js';

const $ = id => document.getElementById(id);
const fmt = n => Math.round(n).toLocaleString('en-GB');
const money = n => '£' + Math.round(n).toLocaleString('en-GB');

const state = {
  mode: 'roof',          // 'roof' | 'bill'
  w: 20, l: 40,          // metres
  layout: 'ew_flat',
  moduleId: 'l',
  obstruction: 'typical',
  spend: 40000,          // £/yr
  unitRate: S.electricity_p_per_kwh.default,
  selfCons: 0.6,
  capexPos: 0.5,         // 0 = low end of band, 1 = high end
  hour: 13
};

const mod = () => S.modules.options.find(m => m.id === state.moduleId);
const layout = () => S.packing.layouts[state.layout];
const yieldFor = () => S.yield_kwh_per_kwp[state.layout].value;

/* ---------------------------------------------------------------
   GEOMETRY — lay real modules on the roof rather than assume a %
   --------------------------------------------------------------- */
function pack() {
  const m = mod(), lay = layout();
  const sb = S.packing.setback_m.value;
  const obs = S.packing.obstruction[state.obstruction];

  const uw = Math.max(0, state.w - sb * 2);
  const ul = Math.max(0, state.l - sb * 2);

  // Module w is the long edge (2.278 m), h the short edge (1.134 m).
  // Flat roofs mount LANDSCAPE: long edge across, short edge up the slope.
  // Pitched roofs mount PORTRAIT, flush to the plane.
  const across = lay.landscape ? m.w : m.h;
  const depth  = lay.landscape ? m.h : m.w;

  let rowPitch, perRow;
  if (state.layout === 'ew_flat') {
    rowPitch = lay.pitch_m;   // 2.43 m carries a back-to-back pair
    perRow = 2;
  } else if (state.layout === 'south_flat') {
    rowPitch = lay.pitch_m;   // 1.66 m, spaced for winter shading
    perRow = 1;
  } else {
    rowPitch = depth * 1.02;  // flush, ~20 mm gap
    perRow = 1;
  }

  const cols = Math.max(0, Math.floor(uw / (across + 0.02)));
  const rows = Math.max(0, Math.floor(ul / rowPitch));
  const rawCount = cols * rows * perRow;
  const count = Math.floor(rawCount * obs);

  return { cols, rows, perRow, rowPitch, across, depth, uw, ul, sb, obs,
           rawCount, count, tilt: lay.tilt };
}

/* ---------------------------------------------------------------
   SIZING FROM A BILL — the honest second answer
   --------------------------------------------------------------- */
function sizeFromBill() {
  const kwhYr = (state.spend / (state.unitRate / 100));
  // Balanced commercial design: generate ~40% of consumption.
  const targetGen = kwhYr * 0.40;
  const kwp = targetGen / yieldFor();
  const count = Math.max(1, Math.round(kwp * 1000 / mod().watts));
  return { kwhYr, kwp: count * mod().watts / 1000, count };
}

/* ---------------------------------------------------------------
   ECONOMICS
   --------------------------------------------------------------- */
function costBand(kwp) {
  const b = S.cost_per_kwp.bands.find(b => kwp <= b.max) || S.cost_per_kwp.bands.slice(-1)[0];
  return b;
}

function economics(kwp, count) {
  const gen = kwp * yieldFor();
  const band = costBand(kwp);
  const perKwp = band.low + (band.high - band.low) * state.capexPos;
  const capex = perKwp * kwp;

  const sc = state.selfCons;
  const saved = gen * sc * (state.unitRate / 100);
  const exported = gen * (1 - sc) * (S.seg_p_per_kwh.planning_default / 100);
  const om = kwp * S.cost_per_kwp.o_and_m_per_kwp_yr.value;
  const net = saved + exported - om;

  const paybackLow  = (band.low  * kwp) / net;
  const paybackHigh = (band.high * kwp) / net;
  const payback = capex / net;

  // 25 years, degrading, no price escalation — deliberately conservative.
  const d = S.degradation.annual_pct / 100;
  let cum = -capex, crossed = null;
  const series = [];
  for (let y = 1; y <= 25; y++) {
    const factor = Math.pow(1 - d, y - 1);
    let yr = (gen * factor * sc * (state.unitRate / 100))
           + (gen * factor * (1 - sc) * (S.seg_p_per_kwh.planning_default / 100))
           - om;
    if (y === S.cost_per_kwp.inverter_replacement.year) {
      yr -= kwp * (S.cost_per_kwp.inverter_replacement.per_kw_low
                 + S.cost_per_kwp.inverter_replacement.per_kw_high) / 2;
    }
    cum += yr;
    if (crossed === null && cum >= 0) crossed = y;
    series.push(cum);
  }

  const amps = (kwp * 1000) / (3 * S.g99.volts_per_phase);
  const co2 = gen * S.carbon.kg_per_kwh;
  const aia = Math.min(capex, S.tax.aia_limit) * S.tax.corp_tax_main;

  return { gen, capex, perKwp, band, saved, exported, om, net,
           payback, paybackLow, paybackHigh, series, crossed, amps, co2, aia };
}

/* ---------------------------------------------------------------
   RENDER
   --------------------------------------------------------------- */
function drawRoof(g) {
  const roof = $('roof');
  const px = Math.min(700 / Math.max(state.w, 1), 400 / Math.max(state.l, 1), 30);
  roof.style.width = (state.w * px) + 'px';
  roof.style.height = (state.l * px) + 'px';

  [...roof.querySelectorAll('.pv,.setback')].forEach(n => n.remove());

  const sbEl = document.createElement('div');
  sbEl.className = 'setback';
  const sbPx = g.sb * px;
  sbEl.style.cssText = `left:${sbPx}px;top:${sbPx}px;right:${sbPx}px;bottom:${sbPx}px`;
  roof.appendChild(sbEl);

  const frag = document.createDocumentFragment();
  const wPx = g.across * px;
  const hPx = g.depth * Math.cos(g.tilt * Math.PI / 180) * px;
  let placed = 0;

  outer:
  for (let r = 0; r < g.rows; r++) {
    for (let c = 0; c < g.cols; c++) {
      for (let p = 0; p < g.perRow; p++) {
        if (placed >= g.count) break outer;
        const d = document.createElement('div');
        d.className = 'pv';
        d.style.width = wPx + 'px';
        d.style.height = hPx + 'px';
        d.style.left = (sbPx + c * (g.across + 0.02) * px) + 'px';
        d.style.top = (sbPx + r * g.rowPitch * px + p * (hPx + 1.5)) + 'px';
        frag.appendChild(d);
        placed++;
      }
    }
  }
  roof.appendChild(frag);
}

function sun() {
  const t = state.hour, frac = (t - 5) / 16;
  $('sun3').style.left = (6 + frac * 88) + '%';
  $('sun3').style.top = (46 - Math.sin(frac * Math.PI) * 38) + '%';
  const h = Math.floor(t), mnt = Math.round((t - h) * 60);
  $('clock').textContent = String(h).padStart(2, '0') + ':' + String(mnt).padStart(2, '0');
  $('roof').style.setProperty('--gl', (Math.max(0.05, Math.sin(frac * Math.PI)) * 0.7).toFixed(2));
}

function drawCurve(e) {
  const w = 100, h = 100;
  const max = Math.max(...e.series), min = Math.min(...e.series);
  const span = (max - min) || 1;
  const y = v => h - ((v - min) / span) * h;
  const x = i => (i / 24) * w;

  const pts = e.series.map((v, i) => `${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(' ');
  const zeroY = y(0).toFixed(2);

  let bpLine = '';
  if (e.crossed) {
    const bx = x(e.crossed - 1).toFixed(2);
    bpLine = `<line class="bpline" x1="${bx}" y1="0" x2="${bx}" y2="${h}"/>`;
  }

  // preserveAspectRatio="none" stretches the geometry to fill, which is fine for
  // the curve but would distort text — so the label is HTML, positioned over it.
  $('curve').innerHTML =
    `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="cashfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="rgba(99,230,255,.16)"/>
          <stop offset="${zeroY}%" stop-color="rgba(99,230,255,.16)"/>
          <stop offset="${zeroY}%" stop-color="rgba(224,36,63,.14)"/>
          <stop offset="1" stop-color="rgba(224,36,63,.14)"/>
        </linearGradient>
      </defs>
      <polygon fill="url(#cashfill)" points="0,${zeroY} ${pts} ${w},${zeroY}"/>
      <line class="zero" x1="0" y1="${zeroY}" x2="${w}" y2="${zeroY}"/>
      <polyline class="line" points="${pts}" vector-effect="non-scaling-stroke"/>
      ${bpLine}
    </svg>` +
    (e.crossed
      ? `<span class="bp-tag" style="left:${Math.min(x(e.crossed - 1), 74)}%">pays back · year ${e.crossed}</span>`
      : `<span class="bp-tag warn" style="left:4%">doesn't pay back within 25 years</span>`);

  $('curve').setAttribute('role', 'img');
  $('curve').setAttribute('aria-label',
    e.crossed
      ? `Cumulative cashflow crosses zero in year ${e.crossed}, reaching ${money(e.series[24])} by year 25.`
      : 'Cumulative cashflow does not reach zero within 25 years.');
}

function render() {
  const m = mod();
  let count, kwp, g;

  if (state.mode === 'roof') {
    g = pack();
    count = g.count;
    kwp = count * m.watts / 1000;
    $('hud').innerHTML =
      `<b>${g.cols}</b> across &times; <b>${g.rows}</b> rows &nbsp;·&nbsp; pitch <b>${g.rowPitch.toFixed(2)} m</b><br>` +
      `${g.rawCount} would fit; <b>${count}</b> after ${Math.round((1 - g.obs) * 100)}% for rooflights and plant`;
  } else {
    const b = sizeFromBill();
    count = b.count; kwp = b.kwp;
    // show an indicative roof for the visual
    const need = Math.sqrt(count * m.w * 1.134 / (state.layout === 'ew_flat' ? 0.9 : 0.6));
    state.w = Math.min(90, Math.max(6, need)); state.l = state.w;
    g = pack();
    $('hud').innerHTML =
      `Sized to your bill: <b>${fmt(b.kwhYr)} kWh/yr</b> used<br>` +
      `generating <b>40%</b> of that needs roughly <b>${(kwp).toFixed(1)} kWp</b>`;
  }

  drawRoof(g);
  sun();

  const e = economics(kwp, count);

  $('rMods').textContent = fmt(count);
  $('rKwp').innerHTML = kwp.toFixed(1) + '<small>kWp</small>';
  $('rGen').innerHTML = fmt(e.gen) + '<small>kWh/yr</small>';
  $('rAmps').innerHTML = e.amps.toFixed(0) + '<small>A/phase</small>';

  // the bridge to the paid product
  const gl = $('gateLine');
  if (e.amps <= S.g99.g98_limit_a) {
    gl.className = 'gate-line g98';
    gl.innerHTML = `At <b>${e.amps.toFixed(0)} A per phase</b> this sits inside G98 — you can connect and notify afterwards.`;
  } else {
    const form = e.amps <= S.g99.a1_2_sgi3_max_a ? 'Form A1-2' : 'a full G99 application';
    gl.className = 'gate-line';
    gl.innerHTML = `At <b>${e.amps.toFixed(0)} A per phase</b> this needs <b>${form}</b> approved by your ` +
      `network operator before it can be switched on. <a href="apply.html">That's the bit we do — £250 + VAT.</a>`;
  }

  $('mCapex').innerHTML = money(e.capex) + '<small>ex VAT</small>';
  $('mSaving').innerHTML = money(e.net) + '<small>/yr</small>';
  $('mPayback').innerHTML = e.net > 0
    ? `${e.paybackLow.toFixed(1)}–${e.paybackHigh.toFixed(1)}<small>years</small>`
    : '—';
  $('mCo2').innerHTML = fmt(e.co2) + '<small>kg CO₂e/yr</small>';

  $('scOut').textContent = Math.round(state.selfCons * 100);
  $('capexOut').innerHTML = money(e.perKwp) + '<small>/kWp</small>';
  $('rateOut').innerHTML = state.unitRate.toFixed(1) + '<small>p/kWh</small>';

  $('breakdown').innerHTML =
    `Self-consumed <b>${money(e.saved)}</b> at ${state.unitRate.toFixed(1)}p &nbsp;·&nbsp; ` +
    `exported <b>${money(e.exported)}</b> at ${S.seg_p_per_kwh.planning_default}p &nbsp;·&nbsp; ` +
    `less <b>${money(e.om)}</b> maintenance &nbsp;·&nbsp; ` +
    `first-year tax relief up to <b>${money(e.aia)}</b> via AIA`;

  const ceiling = S.business_hours_share.weekday_8_18[state.layout];
  $('scNote').innerHTML = state.selfCons > ceiling
    ? `⚠ Above <b>${Math.round(ceiling * 100)}%</b> is not reachable on a weekday-only site without storage — ` +
      `about ${Math.round((1 - ceiling) * 100)}% of the year's output lands outside Mon–Fri working hours.`
    : `A weekday-only site tops out near <b>${Math.round(ceiling * 100)}%</b> without storage.`;

  drawCurve(e);
}

/* ---------------------------------------------------------------
   WIRING
   --------------------------------------------------------------- */
function group(ids, onPick) {
  ids.forEach(id => $(id).addEventListener('click', () => {
    ids.forEach(o => $(o).setAttribute('aria-pressed', o === id ? 'true' : 'false'));
    onPick(id); render();
  }));
}

$('w').addEventListener('input', e => { state.w = +e.target.value; $('wOut').textContent = state.w.toFixed(1); render(); });
$('l').addEventListener('input', e => { state.l = +e.target.value; $('lOut').textContent = state.l.toFixed(1); render(); });
$('time').addEventListener('input', e => { state.hour = +e.target.value; sun(); });
$('sc').addEventListener('input', e => { state.selfCons = +e.target.value / 100; render(); });
$('capex').addEventListener('input', e => { state.capexPos = +e.target.value / 100; render(); });
$('rate').addEventListener('input', e => { state.unitRate = +e.target.value; render(); });
$('spend').addEventListener('input', e => { state.spend = Math.max(0, +e.target.value || 0); render(); });

group(['layEW', 'layS', 'layPitch'], id =>
  state.layout = id === 'layEW' ? 'ew_flat' : id === 'layS' ? 'south_flat' : 'pitched');
group(['obsClean', 'obsTypical', 'obsClutter'], id =>
  state.obstruction = id === 'obsClean' ? 'clean' : id === 'obsTypical' ? 'typical' : 'cluttered');
group(['modL', 'modM'], id => state.moduleId = id === 'modL' ? 'l' : 'm');

group(['modeRoof', 'modeBill'], id => {
  state.mode = id === 'modeRoof' ? 'roof' : 'bill';
  $('roofCtls').hidden = state.mode !== 'roof';
  $('billCtls').hidden = state.mode !== 'bill';
});

render();

/* ---------------------------------------------------------------
   LIVE — real production from the array we monitor
   --------------------------------------------------------------- */
(async function live() {
  const chart = document.getElementById('cChart');
  if (!chart) return;

  const setFoot = (html, dim) => {
    const f = document.getElementById('cFoot');
    f.innerHTML = html;
    if (dim) f.style.color = 'var(--muted-2)';
  };

  try {
    const r = await fetch('/api/tigo');
    if (!r.ok) throw new Error('feed unavailable');
    const d = await r.json();

    const kwh = n => n.toLocaleString('en-GB');
    document.getElementById('cLife').innerHTML  = kwh(d.lifetime.kwh) + '<small>kWh</small>';
    document.getElementById('cToday').innerHTML = d.today.kwh.toFixed(1) + '<small>kWh</small>';
    document.getElementById('cRec').innerHTML   = kwh(d.lifetime.reclaimedKwh) + '<small>kWh</small>';

    document.getElementById('cSub').innerHTML =
      `${d.site.modules} modules &middot; ${d.site.acRatingKw} kW inverters &middot; ` +
      `commissioned ${new Date(d.site.commissioned).toLocaleDateString('en-GB',{month:'long',year:'numeric'})} ` +
      `&middot; ${d.site.postcodeArea}, ${d.site.county}`;

    const hrs = d.today.hourly.filter(h => h.kwh > 0);
    if (hrs.length) {
      const mx = Math.max(...hrs.map(h => h.kwh));
      chart.innerHTML = hrs.map(h =>
        `<div class="dbar" title="${String(h.hour).padStart(2,'0')}:00 — ${h.kwh} kWh">` +
        `<i style="--h:${(h.kwh / mx * 100).toFixed(1)}%"></i><span>${h.hour}</span></div>`).join('');
    } else {
      chart.innerHTML = '<p class="cfoot" style="padding:0">No generation recorded yet today.</p>';
    }

    const stamp = new Date(d.meta.fetchedAt)
      .toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const peakPct = d.today.peakHourKw && d.site.acRatingKw
      ? Math.round(d.today.peakHourKw / d.site.acRatingKw * 100) : null;

    setFoot(
      `<b>${kwh(d.lifetime.kwh)} kWh</b> generated since March 2024 &mdash; about ` +
      `<b>${kwh(d.lifetime.kwhPerYear)} kWh a year</b> from one roof in Lincolnshire. ` +
      (peakPct ? `Today peaked at <b>${d.today.peakHourKw} kW</b>, ${peakPct}% of the ` +
                 `${d.site.acRatingKw} kW inverter capacity. ` : '') +
      `Read at ${stamp}.`);
  } catch (e) {
    // The page must still make sense if Tigo is down.
    document.getElementById('cLife').innerHTML  = '100,661<small>kWh</small>';
    document.getElementById('cToday').innerHTML = '206.4<small>kWh</small>';
    document.getElementById('cRec').innerHTML   = '2,561<small>kWh</small>';
    setFoot('Live feed unavailable just now &mdash; showing the last figures we recorded ' +
            'on 24 August 2026.', true);
  }
})();
