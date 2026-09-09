export type Quality = { tier: 'mobile' | 'desktop'; pixelRatio: number; width: number; height: number; detail: number; segments: number };
export function selectQuality(width: number, height: number, dpr: number, cores = 4, touchPoints = 0): Quality {
  // iPad Safari can identify as a desktop browser, and a rotated phone can be
  // wider than the layout breakpoint. Touch hardware keeps the portable GPU/
  // texture budget independent of orientation and browser user-agent strings.
  const mobile = touchPoints > 0 || width < 760 || cores <= 4;
  const cap = mobile ? 1.25 : 1.5;
  const pixelBudget = mobile ? 850000 : 2000000;
  const pixelRatio = Math.min(dpr || 1, cap, Math.sqrt(pixelBudget / Math.max(1, width * height)));
  return { tier: mobile ? 'mobile' : 'desktop', width, height, pixelRatio, detail: mobile ? 4 : 5, segments: mobile ? 80 : 128 };
}
