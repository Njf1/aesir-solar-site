/**
 * Sourced constants for the Aesir Solar simulator.
 *
 * Every figure here carries its source and date. If a number is not in this
 * file with a citation, it does not belong on the page. Confidence:
 *   A = primary source verified   B = credible secondary   C = trade rule of thumb
 */
export const SOURCED = {

  /* ---------------- modules ---------------- */
  modules: {
    _note: 'W per m2 of panel = module efficiency % x 10, because STC irradiance is 1000 W/m2.',
    options: [
      { id: 'l', label: '580 W commercial', w: 2.278, h: 1.134, watts: 580, eff: 22.45,
        ref: 'Jinko Tiger Neo 72HL4-BDV datasheet, Nov 2025', conf: 'A' },
      { id: 'm', label: '450 W standard',   w: 1.762, h: 1.134, watts: 450, eff: 22.5,
        ref: 'Generic 54-cell TOPCon, 2026 mainstream', conf: 'A' }
    ],
    default: 'l'
  },

  /* ---------------- roof packing ----------------
     Flat roofs use LANDSCAPE ballasted modules (1134 mm along-slope). */
  packing: {
    setback_m: { value: 1.0, range: [0.5, 1.0], conf: 'B',
      ref: 'Commercial flat-roof practice; MIS 3002 s5.9.7 mandates 400 mm on domestic pitched' },
    obstruction: {
      clean: 0.90, typical: 0.75, cluttered: 0.55, conf: 'C',
      ref: 'Rooflights, plant, walkways. Trade judgement — no published standard.'
    },
    layouts: {
      ew_flat:   { label: 'East–west, ballasted', pitch_m: 2.43, tilt: 10, landscape: true,
                   w_per_m2_footprint: 209, conf: 'A',
                   ref: 'Derived: 1.134 m along-slope x 2 back-to-back + 0.20 m gap at 10 deg' },
      south_flat:{ label: 'South rows, ballasted', pitch_m: 1.66, tilt: 10, landscape: true,
                   w_per_m2_footprint: 153, conf: 'A',
                   ref: 'Derived: row spacing for +/-2 h winter shading, Lincoln lat 53.23N' },
      pitched:   { label: 'Flush on a pitched roof', pitch_m: null, tilt: 35, landscape: false,
                   w_per_m2_footprint: 217, conf: 'A',
                   ref: 'Derived: 224 W/m2 x 0.97 for ~20 mm module gaps' }
    }
  },

  /* ---------------- yield, Lincolnshire ----------------
     PVGIS 5.3 / SARAH3, 2005-2023, 14% system loss, queried 24 Aug 2026.
     https://re.jrc.ec.europa.eu/api/v5_3/PVcalc */
  yield_kwh_per_kwp: {
    pitched:    { value: 1015, range: [973, 1048], conf: 'A', label: 'South, 35 deg pitched' },
    south_flat: { value: 908,  range: [871, 934],  conf: 'A', label: 'South, 10 deg flat' },
    ew_flat:    { value: 824,  range: [793, 846],  conf: 'A', label: 'East–west, 10 deg flat' },
    _basis: 'PVGIS 5.3 SARAH3, Lincoln 53.2307 -0.5406, 14% loss (performance ratio 0.814)',
    _variability: { sd_pct: 3.5, note: 'One standard deviation year to year. Roughly +/-7% at 2 SD.' },
    _mcs_alt: { pitched: 892, ew_flat: 711, south_flat: 811,
      note: 'MCS MIS 3002 v6.0 zone 11 (Sheffield reference). ~12% below PVGIS because the ' +
            'Kk tables use an older dataset and Lincolnshire is sunnier than its zone reference. ' +
            'A formal MCS quote under 50 kWp must use these.' }
  },

  /* how much of the year's generation lands inside working hours.
     Computed from PVGIS hourly series 2020-2023 in Europe/London. */
  business_hours_share: {
    weekday_8_18: { ew_flat: 0.667, south_flat: 0.673, pitched: 0.687 },
    weekday_7_19: { ew_flat: 0.701, south_flat: 0.704, pitched: 0.710 },
    mon_sat_8_18: { ew_flat: 0.797, south_flat: 0.803, pitched: 0.818 },
    all_week_7_19:{ ew_flat: 0.983, south_flat: 0.985, pitched: 0.991 },
    conf: 'A',
    _headline: 'A weekday-only site cannot self-consume much beyond 70% of annual generation ' +
               'without storage, because about 27% of output falls at the weekend.'
  },

  /* ---------------- prices ----------------
     DESNZ Quarterly Energy Prices, June 2026 (Q1 2026 data).
     p/kWh including CCL, EXCLUDING VAT. VAT-registered businesses recover VAT,
     so excluding it is the correct treatment. */
  electricity_p_per_kwh: {
    micro:  { value: 35.02, band: '0–20 MWh/yr',      conf: 'A' },
    small:  { value: 28.76, band: '20–499 MWh/yr',    conf: 'A' },
    medium: { value: 25.00, band: '2–20 GWh/yr',      conf: 'A' },
    default: 29.0,
    _range: [25, 33],
    _ref: 'https://www.gov.uk/government/statistical-data-sets/gas-and-electricity-prices-in-the-non-domestic-sector',
    _warning: 'TNUoS rose ~60% in April 2026, but over 90% of that lands in the fixed standing ' +
              'charge, which solar does not reduce. Do not imply solar cuts standing charges.'
  },

  /* Smart Export Guarantee. Tied tariffs pay ~3.3x untied ones. */
  seg_p_per_kwh: {
    planning_default: 8,
    untied: [1, 13],
    tied: [12, 16],
    realised_blend: 12.86,
    conf: 'B',
    _ref: 'Ofgem SEG Annual Report Year 5, Dec 2025: £56.97m on 443.1 GWh',
    _note: 'Verify any named supplier rate at source. Octopus Outgoing cut 15p to 12p in March 2026.'
  },

  /* ---------------- installed cost, ex-VAT ---------------- */
  cost_per_kwp: {
    bands: [
      { max: 50,    low: 1000, high: 1400, conf: 'B', ref: 'DESNZ Solar PV cost data, May 2026: 10–50 kW non-domestic mean £1,167/kW' },
      { max: 250,   low: 800,  high: 1150, conf: 'B' },
      { max: 1000,  low: 700,  high: 950,  conf: 'C' },
      { max: 1e9,   low: 620,  high: 850,  conf: 'C' }
    ],
    _reality_check: 'Great British Energy published 16 real public-sector rooftop projects in ' +
      'Sept 2025 at a median £1,766/kW — roughly double what installer pages quote. Those ' +
      'figures may include roof works and VAT. Present cost as a range, never a point.',
    o_and_m_per_kwp_yr: { value: 10, range: [8, 15], conf: 'B' },
    inverter_replacement: { year: 13, per_kw_low: 100, per_kw_high: 150, conf: 'C' },
    vat_pct: 20,
    _vat_note: 'Commercial buildings are standard-rated. Recoverable if VAT-registered. ' +
               'HMRC VAT Notice 708/6.'
  },

  /* ---------------- performance over time ---------------- */
  degradation: {
    annual_pct: 0.5, range: [0.4, 0.7], conf: 'A',
    mean_output_factor_25yr: 0.942,
    _ref: 'Jordan et al., Progress in Photovoltaics 2016: x-Si median 0.5–0.6%/yr',
    _honesty: 'Manufacturers warrant 0.4%/yr, but Fraunhofer ISE found 40% of tested TOPCon ' +
              'modules lost over 5% after one year of equivalent UV. 0.4% is a contractual ' +
              'floor, not an expected outcome. The full 0.4–0.7% spread only moves 25-year ' +
              'output by ~2.9% — degradation is second-order, self-consumption is first-order.'
  },

  /* ---------------- tax ---------------- */
  tax: {
    aia_limit: 1000000, aia_rate: 1.0,
    special_rate_fya: 0.5, special_rate_wda: 0.06,
    corp_tax_main: 0.25, corp_tax_small: 0.19,
    conf: 'A',
    _ref: 'HMRC CA22335: all capital expenditure on solar panels is special rate. ' +
          'Full expensing does NOT apply to solar. AIA gives 100% on the first £1m and ' +
          'should be allocated to solar first, because the special rate pool unwinds at only 6%.',
    _stale_claim: 'The 50% FYA was made PERMANENT by Finance Act 2024 s.1. Pages still saying ' +
                  'it expires 31 March 2026 are wrong.'
  },

  /* ---------------- carbon ---------------- */
  carbon: {
    kg_per_kwh: 0.131, conf: 'A',
    with_td_losses: 0.144,
    _ref: 'DESNZ GHG conversion factors 2026, published 11 June 2026. Scope 2 location-based.',
    embodied_kg_per_kwp: 670, embodied_conf: 'B',
    _payback_note: 'Carbon payback is now roughly 5–6 years, not the 1–3 commonly quoted — ' +
                   'because the grid being displaced is far cleaner than it was. Still ' +
                   'excellent against a 25–30 year life.'
  },

  /* ---------------- grid connection ---------------- */
  g99: {
    g98_limit_a: 16,
    a1_2_sgi2_max_a: 32,
    a1_2_sgi3_max_a: 60,
    volts_per_phase: 230,
    _ref: 'ENA EREC G99 Issue 2, 10 March 2025, section 6.2.2.1',
    _headline: 'G98 stops at 16 A per phase. Every commercial system therefore needs a G99.'
  }
};
