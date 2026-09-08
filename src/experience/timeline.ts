/** Authoring units retain stage two's 5.6 viewport-heights per unit. Extending the end
 * adds scroll distance; it never rescales the accepted Sun/flight/Earth choreography. */
export const SCROLL_VIEWPORTS_PER_UNIT = 5.6;
export const JOURNEY_END = 2.25;
export const CHAPTERS = [
  {id:'source',label:'Source',start:0,end:.16},
  {id:'sun',label:'Sun',start:.16,end:.39},
  {id:'acquire',label:'Acquire the light',start:.39,end:.51},
  {id:'flight',label:'Flight',start:.51,end:.75},
  {id:'earth',label:'Earth',start:.75,end:1},
  {id:'britain',label:'Great Britain',start:1,end:1.49},
  {id:'atmosphere',label:'Through the atmosphere',start:1.49,end:1.65},
  {id:'building',label:'A working roof',start:1.65,end:1.84},
  {id:'array',label:'Across the array',start:1.84,end:2.06},
  {id:'panel',label:'Light meets silicon',start:2.06,end:JOURNEY_END},
] as const;
export const chapterAt=(p:number)=>CHAPTERS.findIndex(c=>p<c.end)===-1?CHAPTERS.length-1:CHAPTERS.findIndex(c=>p<c.end);
export const STILL_VIEWS={sun:.285,earth:.925,britain:1.40,roof:1.76,panel:2.23} as const;
export const REGION_SWITCH=1.30, SITE_SWITCH=1.55;
