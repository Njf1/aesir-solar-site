export type Quality = { tier: 'mobile' | 'desktop'; pixelRatio: number; width: number; height: number; detail: number; segments: number };
export function selectQuality(width: number, height: number, dpr: number, cores = 4): Quality {
  const mobile = width < 760 || cores <= 4;
  const cap = mobile ? 1.25 : 1.5;
  const pixelBudget = mobile ? 850000 : 2000000;
  const pixelRatio = Math.min(dpr || 1, cap, Math.sqrt(pixelBudget / Math.max(1, width * height)));
  return { tier: mobile ? 'mobile' : 'desktop', width, height, pixelRatio, detail: mobile ? 4 : 5, segments: mobile ? 80 : 128 };
}
