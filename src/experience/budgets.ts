/** Incremental owned scene resources. GPU estimates include texture mipmaps and
 * environment/depth storage; framebuffers and driver overhead are reported separately. */
export const REGION_BUDGET={rawBytes:550000,geometryBytes:1200000,triangles:30000};
export const SITE_BUDGET={geometryBytes:1200000,baseDrawCalls:52,triangles:140000,decodedDesktop:6*1024*1024,decodedMobile:1.5*1024*1024,gpuDesktop:52*1024*1024,gpuMobile:16*1024*1024};
export function assertBudget(name:string,measured:number,maximum:number){if(!Number.isFinite(measured)||measured>maximum)throw new Error(`${name} exceeds owned resource budget: ${measured}/${maximum}`);}

export const CELL_BUDGET={geometryBytes:250000,triangles:15000,baseDrawCalls:25,gpuTextureBytes:0};
export const ELECTRICAL_BUDGET={geometryBytes:350000,triangles:20000,baseDrawCalls:25,gpuTextureBytes:0};
