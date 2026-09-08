/** One reversible value owns the entire journey; ambient time never enters this function. */
export type Vec3 = [number, number, number];
export type Shot = { camera: Vec3; target: Vec3; pulse: Vec3; departure: number; chapter: 0 | 1 | 2 };
export const clamp = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, Number.isFinite(n) ? n : 0));
export const smooth = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export function sampleJourney(progress: number, mobile: boolean): Shot {
  const p = clamp(progress);
  const approach = smooth((p - .15) / .45);
  const departure = smooth((p - .8) / .2);
  // Logarithmic dolly gives the opening distance real scale, without enormous coordinates.
  const z = Math.exp(mix(Math.log(2100), Math.log(mobile ? 48 : 29), approach));
  const bezier=(a:number,b:number,c:number,d:number)=>{const t=departure,u=1-t;return u*u*u*a+3*u*u*t*b+3*u*t*t*c+t*t*t*d;};
  const pulse: Vec3 = [bezier(9.4,16,26,37),bezier(2.8,3.5,4.6,5.5),bezier(2,9,21,32)];
  return {
    camera: [mix(0, 28, departure), mix(0, 3, departure), mix(z, mobile ? 100 : 83, departure)],
    target: [mix(mobile ? 0 : -z*.25, mobile ? 32 : 24, departure), mix(mobile ? z*.1+3 : 1, 4, departure), mix(0, 13, departure)],
    pulse, departure, chapter: p < .31 ? 0 : p < .8 ? 1 : 2,
  };
}
